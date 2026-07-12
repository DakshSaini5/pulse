import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getWorkingModelName } from './gemini';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

// Per-socket rate limiting: max 40 messages per 15 minutes
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const STRICT_RULES = `
YOUR STRICT RULES:

1. GREETINGS & MILD SYMPTOM RULE: 
For simple greetings (e.g., 'hello', 'hi', 'hey', 'good morning') or standard mild/moderate symptoms (e.g., a standard headache, fever, mild cough, stomach ache, mild rash), respond NORMALLY, warmly, and helpfully. Do NOT display emergency hotlines, suicide prevention lines, or warning disclaimers. Give general educational info and ask clarifying questions instead.

2. PHYSICAL MEDICAL EMERGENCY RULE:
Only if the user describes a life-threatening physical emergency (like severe chest pain, extreme breathing difficulties, sudden paralysis, or heavy bleeding), advise them to seek immediate care and call the national emergency numbers: call 112 for the national emergency helpline, 102 for Ambulance, or 108 for Disaster/Ambulance. Do NOT display mental health hotlines (like Tele-MANAS) for these physical emergencies.

3. MENTAL HEALTH CRISIS / SUICIDE RULE:
Only if the user describes self-harm, suicide thoughts, or severe mental crisis, display BOTH the mental health helplines (Tele-MANAS: 14416 / 1800-891-4416) and general emergency numbers (National emergency: 112, Ambulance: 102/108) immediately for their safety.

4. MEDICAL RECORDS ACCESS RULE:
If the user asks if you have access to their medical records, prescriptions, or reports:
- If there are uploaded reports or prescriptions listed in the system instructions context below, confirm that you DO have access to them (list the specific reports or prescriptions you see in the context) and offer to analyze or answer questions about them.
- If there are NO uploaded reports or prescriptions listed in the system instructions context below, you must NOT say you don't have access as an AI. Instead, explain that you can access them once they are uploaded, and guide the user to the upload pages using this text: "I can access and analyze your records as soon as they are uploaded! Currently, you haven't uploaded any documents to your profile. Please upload clinical scans in the [Report Center](/reports) or prescriptions in the [Prescription Center](/prescriptions), and I will instantly analyze them for you here!"

5. GENERAL Triage Rules:
- You have NO prior knowledge of this patient unless they explicitly tell you or upload a document. DO NOT invent past medical history (e.g., do not assume they have had sinus infections).
- NEVER make a definitive diagnosis.
- If a user gives a vague symptom (like 'fever'), you MUST ask clarifying questions (e.g., 'How long have you had it?', 'What is your temperature?', 'Any other symptoms?').
- Always remind them gently that you are an AI, not a doctor.
`;

async function buildSystemInstructionContext(userId: string | null): Promise<string> {
  let context = `You are 'Pulse', an AI triage assistant.\n\n`;
  if (!userId) return context;
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
        context += `Patient Profile:\n`;
        if (age) context += `- Age: ${age}\n`;
        if (gender) context += `- Gender: ${gender}\n`;
        if (weight) context += `- Weight: ${weight}\n`;
        context += `\n`;
      }

      const reports = user.medicalReports.filter((r: any) => r.summary || r.values.length > 0);
      if (reports.length > 0) {
        context += `[Uploaded Medical Reports]:\n`;
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
        context += `\n[Uploaded Prescriptions/Medications]:\n`;
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
        const modelName = await getWorkingModelName(genAI);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: latestContext + STRICT_RULES,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });

        chatSession = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 1000,
          },
        });

        socket.emit('chat:debug', { step: '9_message_sending_to_gemini' });
        chatHistory.push({ role: 'user', parts: [{ text: message }] });
        
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
          const chunkText = chunk.text();
          fullText += chunkText;
          socket.emit('chat:response:chunk', { text: chunkText });
        }
        
        chatHistory.push({ role: 'model', parts: [{ text: fullText }] });
        
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
        
        // Remove the failed user message from history
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
          chatHistory.pop(); 
        }

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
