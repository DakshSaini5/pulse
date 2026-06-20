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
    let systemInstructionContext = `You are 'Pulse', an AI triage assistant.\n\n`;
    
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
          const age = (user as any).age;
          const gender = (user as any).gender;
          const weight = (user as any).weight;

          if (age || gender || weight) {
            systemInstructionContext += `Patient Profile:\n`;
            if (age) systemInstructionContext += `- Age: ${age}\n`;
            if (gender) systemInstructionContext += `- Gender: ${gender}\n`;
            if (weight) systemInstructionContext += `- Weight: ${weight}\n`;
            systemInstructionContext += `\n`;
          }

          const reports = user.medicalReports.filter(r => r.summary || r.values.length > 0);
          if (reports.length > 0) {
            systemInstructionContext += `[Uploaded Medical Reports]:\n`;
            reports.forEach(r => {
              systemInstructionContext += `- Report Type: ${r.reportType} (Date: ${r.reportDate.toISOString().split('T')[0]})\n`;
              if (r.summary) systemInstructionContext += `  Summary: ${r.summary.healthSummary}\n`;
              const abnormals = r.values.filter(v => v.isAbnormal);
              if (abnormals.length > 0) {
                systemInstructionContext += `  Abnormalities detected: ${abnormals.map(a => `${a.key} (${a.value} ${a.unit})`).join(', ')}\n`;
              }
            });
          }

          const prescriptions = user.prescriptions.filter(p => p.prescriptionAnalysis.length > 0);
          if (prescriptions.length > 0) {
            systemInstructionContext += `\n[Uploaded Prescriptions/Medications]:\n`;
            prescriptions.forEach(p => {
              systemInstructionContext += `- Medication List (from ${p.createdAt.toISOString().split('T')[0]}):\n`;
              p.prescriptionAnalysis.forEach(med => {
                systemInstructionContext += `  * ${med.medicineName}: ${med.dosage} (${med.simplifiedExplanation})\n`;
              });
            });
          }
        }
      } catch (err) {
        console.error('[Socket.io] Failed to fetch medical history:', err);
      }
    }

    systemInstructionContext += `
YOUR STRICT RULES:

You have NO prior knowledge of this patient unless they explicitly tell you or upload a document. DO NOT invent past medical history (e.g., do not assume they have had sinus infections).

NEVER make a definitive diagnosis.

If a user gives a vague symptom (like 'fever'), you MUST ask clarifying questions (e.g., 'How long have you had it?', 'What is your temperature?', 'Any other symptoms?').

Always remind them gently that you are an AI, not a doctor.
`;

    // History array managed locally to persist across error resets
    let chatHistory: any[] = [];

    const initializeChatSession = async () => {
      if (!genAI) return null;
      try {
        const modelName = await getWorkingModelName(genAI);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstructionContext,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });
        
        return model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });
      } catch (err) {
        console.error('[Socket.io] Failed to initialize model:', err);
        return null;
      }
    };

    if (genAI) {
      console.log(`[Socket.io] Starting chat session for user: ${userId || 'guest'}`);
      initializeChatSession().then(session => {
        chatSession = session;
      });
    }

    socket.on('chat:message', async (message: string) => {
      if (!message || typeof message !== 'string') return;

      // Rate limiting: sliding window of RATE_LIMIT_MAX messages per RATE_LIMIT_WINDOW_MS
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
        if (!chatSession) {
          setTimeout(() => {
            socket.emit('chat:response', {
              text: "Hello! I am currently running in offline demo mode, so I cannot process live AI queries right now. Please configure the GEMINI_API_KEY to enable full chat functionality!",
              isError: false
            });
          }, 1000);
          return;
        }

        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        const result = await chatSession.sendMessageStream(message);
        
        const messageId = Date.now().toString();
        socket.emit('chat:response:start', { id: messageId });

        let fullText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          socket.emit('chat:response:chunk', { text: chunkText });
        }
        
        chatHistory.push({ role: 'model', parts: [{ text: fullText }] });
        socket.emit('chat:response:end', { text: fullText });

      } catch (error: any) {
        console.error('[Socket.io] Chat Error:', error instanceof Error ? error.message : 'Unknown error');
        
        // Re-initialize chat session to clear corrupted session state but keep history
        // Remove the failed user message from history so it doesn't cause errors on next attempt
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
          chatHistory.pop(); 
        }

        initializeChatSession().then(session => {
          chatSession = session;
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
