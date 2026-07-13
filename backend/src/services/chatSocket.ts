import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getWorkingModelName } from './gemini';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';


// Per-socket rate limiting: max 40 messages per 15 minutes
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const MEDICAL_ANALYSIS_RULES = `
[MEDICAL ANALYSIS MODE — Apply these rules ONLY when the user explicitly asks about their lab reports, CBC, prescriptions, medications, or health data]:
1. Act as an objective data extractor. State the facts, compare the values, and explain what the metrics measure.
2. NEVER provide a medical diagnosis.
3. NEVER use urgent directive language like 'this requires immediate medical attention', 'seek help', or 'severe risk'.
4. Always present comparisons in a neutral, calm, and highly objective tone.
5. Conclude your analysis by neutrally reminding the user to discuss these specific factual findings with their primary physician.
`;

const BASE_PERSONALITY = `You are 'Pulse AI', a friendly and supportive health companion built into the Pulse healthcare app.

CORE BEHAVIOR RULES:
- For casual messages (greetings, small talk, how are you, etc.), respond warmly and conversationally like a friendly assistant. Keep it short and natural. Do NOT mention or analyze any medical data.
- For emotional messages (stress, anxiety, feeling unwell, etc.), respond with empathy and supportive language. You may gently suggest general wellness tips (deep breathing, hydration, rest). Do NOT dump medical report data unless the user specifically asks about it.
- For general health questions (what is diabetes, how does blood pressure work, etc.), answer the question helpfully using general medical knowledge. Do NOT reference the user's personal data unless they ask.
- For personal medical data requests (analyze my report, what's my hemoglobin, compare my CBCs, list my medications, etc.), ONLY THEN use the user's uploaded data from the [REFERENCE DATA] section below, and follow the Medical Analysis Mode rules.

CRITICAL: The [REFERENCE DATA] section contains the user's private medical records. This data exists so you CAN answer when asked. But NEVER proactively analyze, summarize, or mention this data unless the user's message explicitly requests information about their reports, labs, medications, or health records.
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
        context += `\n[REFERENCE DATA — Patient Profile]:\n`;
        if (age) context += `- Age: ${age}\n`;
        if (gender) context += `- Gender: ${gender}\n`;
        if (weight) context += `- Weight: ${weight}\n`;
      }

      const reports = user.medicalReports.filter((r: any) => r.summary || r.values.length > 0);
      if (reports.length > 0) {
        context += `\n[REFERENCE DATA — Uploaded Medical Reports] (Use ONLY when the user asks about their reports):\n`;
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
        context += `\n[REFERENCE DATA — Uploaded Prescriptions/Medications] (Use ONLY when the user asks about their medications):\n`;
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
