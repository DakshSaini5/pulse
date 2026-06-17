import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getWorkingModelName } from './gemini';
import jwt from 'jsonwebtoken';
import { prisma } from '../db'; // FIX: Use shared singleton instead of new PrismaClient()

// Per-socket rate limiting: max 40 messages per 15 minutes
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const setupChatSocket = (io: Server) => {
  const apiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    let chatSession: any = null;
    let userId: string | null = null;

    // Per-socket message rate limiting state
    const messageTimestamps: number[] = [];

    // Authenticate user via token
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('[Socket.io] JWT_SECRET is not set — cannot authenticate socket.');
        } else {
          const decoded = jwt.verify(token, jwtSecret) as { id: string };
          userId = decoded.id;
        }
      } catch (err) {
        console.error('[Socket.io] Invalid token provided:', err);
      }
    }

    // Build context-aware medical history string
    let medicalHistoryContext = "";
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            medicalReports: { include: { summary: true, values: true }, orderBy: { reportDate: 'desc' }, take: 5 },
            prescriptions: { include: { prescriptionAnalysis: true }, orderBy: { createdAt: 'desc' }, take: 5 },
          }
        });

        if (user) {
          medicalHistoryContext += `\n\n--- PATIENT MEDICAL HISTORY (FOR YOUR INTERNAL CONTEXT) ---\n`;
          medicalHistoryContext += `Patient Name: ${user.name}\n\n`;

          const reports = user.medicalReports.filter(r => r.summary || r.values.length > 0);
          if (reports.length > 0) {
            medicalHistoryContext += `[Uploaded Medical Reports]:\n`;
            reports.forEach(r => {
              medicalHistoryContext += `- Report Type: ${r.reportType} (Date: ${r.reportDate.toISOString().split('T')[0]})\n`;
              if (r.summary) medicalHistoryContext += `  Summary: ${r.summary.healthSummary}\n`;
              const abnormals = r.values.filter(v => v.isAbnormal);
              if (abnormals.length > 0) {
                medicalHistoryContext += `  Abnormalities detected: ${abnormals.map(a => `${a.key} (${a.value} ${a.unit})`).join(', ')}\n`;
              }
            });
          }

          const prescriptions = user.prescriptions.filter(p => p.prescriptionAnalysis.length > 0);
          if (prescriptions.length > 0) {
            medicalHistoryContext += `\n[Uploaded Prescriptions/Medications]:\n`;
            prescriptions.forEach(p => {
              medicalHistoryContext += `- Medication List (from ${p.createdAt.toISOString().split('T')[0]}):\n`;
              p.prescriptionAnalysis.forEach(med => {
                medicalHistoryContext += `  * ${med.medicineName}: ${med.dosage} (${med.simplifiedExplanation})\n`;
              });
            });
          }
          
          medicalHistoryContext += `\nINSTRUCTIONS TO AI: Use the above patient history to provide highly contextualized answers. If they mention symptoms that correlate with their past history (e.g., headache correlating with sinus issues in a report), mention the connection. Treat them personally.\n`;
        }
      } catch (err) {
        console.error('[Socket.io] Failed to fetch medical history:', err);
      }
    }

    if (genAI) {
      getWorkingModelName(genAI).then((modelName) => {
        console.log(`[Socket.io] Starting chat session with model: ${modelName} for user: ${userId || 'guest'}`);
        const model = genAI!.getGenerativeModel({ 
          model: modelName,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });
        
        chatSession = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: `You are PulseAI, a friendly, concise, and empathetic healthcare assistant.
  
CRITICAL RULES FOR YOUR RESPONSES:
1. BE CONCISE AND CONVERSATIONAL: Do NOT write huge walls of text or long essays. Keep your answers short, friendly, and directly to the point.
2. NO RIGID FORMATS: Do not use rigid templates like "Overview", "Key Points", unless the user explicitly asks for a detailed breakdown.
3. USE FORMATTING SPARINGLY: Use bold text or short bullet points only when it genuinely helps readability.
4. MEDICAL CONTEXT: You have access to the patient's medical history below. Use it to provide highly personalized answers, but do not sound like a robot reading a chart. Be human.
5. NO DIAGNOSIS OR PRESCRIBING: You MUST NOT diagnose medical conditions or prescribe treatments. If a user asks for a diagnosis, gently remind them to consult a qualified doctor and only summarize the data present in their uploaded files.

---
⚕️ *Always remember to add a tiny disclaimer at the end if you give medical advice, stating it is for educational purposes only.*

${medicalHistoryContext}` }],
            },
            {
              role: 'model',
              parts: [{ text: "Understood! I will keep my answers short, friendly, and highly conversational. I will avoid dumping long paragraphs and will adapt my tone to be a helpful, personal medical assistant." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });
      }).catch(err => {
        console.error('[Socket.io] Failed to load working model name:', err);
      });
    }

    socket.on('chat:message', async (message: string) => {
      if (!message || typeof message !== 'string') return;

      // Rate limiting: sliding window of RATE_LIMIT_MAX messages per RATE_LIMIT_WINDOW_MS
      const now = Date.now();
      // Remove timestamps outside the current window
      while (messageTimestamps.length > 0 && messageTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
        messageTimestamps.shift();
      }

      if (messageTimestamps.length >= RATE_LIMIT_MAX) {
        socket.emit('chat:response', {
          text: 'You have 0 chat attempts left for this window. Please wait 15 minutes before sending more messages.',
          isError: true
        });
        return;
      }

      messageTimestamps.push(now);
      
      try {
        if (!chatSession) {
          setTimeout(() => {
            socket.emit('chat:response', {
              text: "Hello! I am currently running in offline demo mode, so I cannot process live AI queries right now. Please configure the GEMINI_API_KEY to enable full chat functionality!",
              isError: false
            });
          }, 1000);
          return;
        }

        const result = await chatSession.sendMessageStream(message);
        
        const messageId = Date.now().toString();
        socket.emit('chat:response:start', { id: messageId });

        let fullText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          socket.emit('chat:response:chunk', { text: chunkText });
        }
        
        socket.emit('chat:response:end', { text: fullText });

      } catch (error: any) {
        console.error('[Socket.io] Chat Error:', error);
        
        // Re-initialize chat session to clear corrupted history (e.g. alternating roles rule)
        getWorkingModelName(genAI!).then((modelName) => {
          const model = genAI!.getGenerativeModel({ 
            model: modelName,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
          });
          chatSession = model.startChat({
            history: [
              { role: 'user', parts: [{ text: `You are PulseAI, a friendly, concise, and empathetic healthcare assistant.
CRITICAL RULES FOR YOUR RESPONSES:
1. BE CONCISE AND CONVERSATIONAL: Do NOT write huge walls of text or long essays. Keep your answers short, friendly, and directly to the point.
2. NO RIGID FORMATS: Do not use rigid templates like "Overview", "Key Points", unless the user explicitly asks for a detailed breakdown.
3. USE FORMATTING SPARINGLY: Use bold text or short bullet points only when it genuinely helps readability.
4. MEDICAL CONTEXT: You have access to the patient's medical history below. Use it to provide highly personalized answers, but do not sound like a robot reading a chart. Be human.
5. NO DIAGNOSIS OR PRESCRIBING: You MUST NOT diagnose medical conditions or prescribe treatments. If a user asks for a diagnosis, gently remind them to consult a qualified doctor and only summarize the data present in their uploaded files.
---
⚕️ *Always remember to add a tiny disclaimer at the end if you give medical advice, stating it is for educational purposes only.*
${medicalHistoryContext}` }] },
              { role: 'model', parts: [{ text: "Understood! I will keep my answers short, friendly, and highly conversational." }] }
            ],
            generationConfig: { maxOutputTokens: 1000 },
          });
        });

        socket.emit('chat:response', {
          text: `I'm sorry, an error occurred: ${error.message || error}. Please try again.`,
          isError: true
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};
