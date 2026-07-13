import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getWorkingModelName } from './gemini';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';


// Per-socket rate limiting: max 40 messages per 15 minutes
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const MEDICAL_ANALYSIS_RULES = `
[CLINICAL GUIDELINES]:
1. You are a highly personalized AI health companion. Use the patient's data below to tailor your answers, provide context, and offer personalized insights.
2. NEVER provide a definitive medical diagnosis. Always recommend consulting a physician.
3. NEVER use urgent directive language like 'this requires immediate medical attention', 'seek help', or 'severe risk'. Keep your tone supportive, calm, and objective.
4. IMPORTANT: Do NOT proactively dump or summarize the patient's medical records when they just say "hello", "how are you", or make casual conversation. Greet them naturally and wait for them to ask a question or express a concern.
5. If the user asks a health question or mentions a symptom, use their uploaded records to provide personalized context (e.g., "Given your recent CBC report showing low hemoglobin, your fatigue might be related...").
`;

const BASE_PERSONALITY = `You are 'Pulse AI', a friendly, empathetic, and highly personalized health companion built into the Pulse healthcare app.
Your core purpose is to be a supportive conversational partner who deeply understands the user's health context based on their uploaded records.

CORE BEHAVIOR RULES:
- GREETINGS & CASUAL CHAT: Respond warmly, briefly, and naturally. DO NOT list or summarize their medical data unless they specifically ask you to.
- SYMPTOMS & HEALTH QUESTIONS: Actively use the [PATIENT MEDICAL RECORDS] provided below to give highly personalized, context-aware answers. Relate their questions to their specific lab results or medications.
- EMPATHY: Always be supportive and understanding, especially if the user is stressed or anxious.
`;

async function buildSystemInstructionContext(userId: string | null): Promise<string> {
  let context = BASE_PERSONALITY + '\n';
  if (!userId) return context + MEDICAL_ANALYSIS_RULES;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        medicalReports: { include: { summary: true, values: true }, orderBy: { reportDate: 'desc' }, take: 5 },
        prescriptions: { include: { prescriptionAnalysis: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      }
    });

    if (user) {
      const age = (user as any).age;
      const gender = (user as any).gender;
      const weight = (user as any).weight;

      // Add user profile for personalization (greeting by name, etc.)
      const userName = (user as any).name;
      if (userName) {
        context += `\nThe user's name is ${userName}. You may use their first name in greetings.\n`;
      }

      if (age || gender || weight) {
        context += `\n[PATIENT MEDICAL RECORDS — Profile]:\n`;
        if (age) context += `- Age: ${age}\n`;
        if (gender) context += `- Gender: ${gender}\n`;
        if (weight) context += `- Weight: ${weight}\n`;
      }

      const reports = user.medicalReports.filter((r: any) => r.summary || r.values.length > 0);
      if (reports.length > 0) {
        context += `\n[PATIENT MEDICAL RECORDS — Uploaded Medical Reports]:\n`;
        reports.forEach((r: any) => {
          context += `- Report Type: ${r.reportType} (Date: ${r.reportDate.toISOString().split('T')[0]})\n`;
          if (r.summary) context += `  Summary: ${r.summary.healthSummary}\n`;
          const abnormals = r.values.filter((v: any) => v.isAbnormal);
          if (abnormals.length > 0) {
            context += `  Abnormalities detected: ${abnormals.map((a: any) => `${a.key} (${a.value} ${a.unit})`).join(', ')}\n`;
          }
        });
      }

      const prescriptions = user.prescriptions.filter((p: any) => p.prescriptionAnalysis.length > 0);
      if (prescriptions.length > 0) {
        context += `\n[PATIENT MEDICAL RECORDS — Uploaded Prescriptions/Medications]:\n`;
        prescriptions.forEach((p: any) => {
          context += `- Medication List (from ${p.createdAt.toISOString().split('T')[0]}):\n`;
          p.prescriptionAnalysis.forEach((med: any) => {
            context += `  * ${med.medicineName}: ${med.dosage} (${med.simplifiedExplanation})\n`;
          });
        });
      }
    }
  } catch (err) {
    console.error('[Socket.io] Error building system instruction context:', err);
  }
  context += '\n' + MEDICAL_ANALYSIS_RULES;
  return context;
}

export const setupChatSocket = (io: Server) => {
  const apiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    socket.emit('chat:debug', { step: '1_connected' });

    let chatSession: any = null;
    let userId: string | null = null;
    let chatHistory: any[] = [];

    // Per-socket message rate limiting state
    const messageTimestamps: number[] = [];

    // Authenticate user via token
    const token = socket.handshake.auth?.token;
    socket.emit('chat:debug', { step: '2_token_received', hasToken: !!token });
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          console.error('[Socket.io] JWT_SECRET is not set — cannot authenticate socket.');
        } else {
          const decoded = jwt.verify(token, jwtSecret) as { id: string };
          userId = decoded.id;
          socket.emit('chat:debug', { step: '3_token_verified', userId });
        }
      } catch (err: any) {
        console.error('[Socket.io] Invalid token provided:', err);
        socket.emit('chat:debug', { step: '3_token_failed', error: err.message });
      }
    }

    // Load initial chat history from DB
    if (userId) {
      try {
        socket.emit('chat:debug', { step: '4_db_query_start' });
        const pastMessages = await prisma.aIChatMessage.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          take: 40
        });
        if (pastMessages && pastMessages.length > 0) {
          chatHistory = pastMessages.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));
        }
        socket.emit('chat:debug', { step: '5_db_query_success', messagesLoaded: chatHistory.length });
      } catch (err: any) {
        console.error('[Socket.io] Failed to fetch medical history:', err);
        socket.emit('chat:debug', { step: '5_db_query_failed', error: err.message });
      }
    }

    socket.on('chat:message', async (data: any) => {
      let message = '';
      if (typeof data === 'string') {
        message = data;
      } else if (data && typeof data === 'object' && typeof data.text === 'string') {
        message = data.text;
      }
      if (!message) return;
      socket.emit('chat:debug', { step: '8_message_received', message });

      // Rate limiting
      const now = Date.now();
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
        if (!genAI) {
          socket.emit('chat:debug', { step: '9_message_no_genai' });
          return;
        }

        // Dynamically compile the latest context to capture newly uploaded files instantly
        socket.emit('chat:debug', { step: '9_message_dynamic_context_fetching' });
        const latestContext = await buildSystemInstructionContext(userId);

        // Re-initialize chat model session with the latest instructions + existing history
        const modelName = 'gemini-flash-latest';
        const systemInstruction = latestContext;

        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ];

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          safetySettings,
          generationConfig: {
            maxOutputTokens: 2048,
          }
        });

        chatSession = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
          },
          safetySettings
        });

        socket.emit('chat:debug', { step: '9_message_sending_to_gemini' });
        
        if (userId) {
          prisma.aIChatMessage.create({
            data: {
              userId,
              role: 'user',
              content: message
            }
          }).catch(err => console.error('[Socket.io] Failed to save user message:', err));
        }

        const result = await chatSession.sendMessageStream(message);
        
        const messageId = Date.now().toString();
        socket.emit('chat:response:start', { id: messageId });
        socket.emit('chat:debug', { step: '9_message_gemini_stream_started' });

        let fullText = "";
        for await (const chunk of result.stream) {
          const textChunk = chunk.text();
          fullText += textChunk;
          socket.emit('chat:response:chunk', { text: textChunk });
        }
        
        if (userId && fullText) {
          prisma.aIChatMessage.create({
            data: {
              userId,
              role: 'model',
              content: fullText
            }
          }).catch(err => console.error('[Socket.io] Failed to save model response:', err));
        }

        socket.emit('chat:response', { text: fullText, isError: false });
        socket.emit('chat:debug', { step: '9_message_success' });

      } catch (error: any) {
        console.error('[Socket.io] Chat Error:', error instanceof Error ? error.message : 'Unknown error');
        socket.emit('chat:debug', { step: '9_message_failed', error: error.message });
        
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
