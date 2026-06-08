import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWorkingModelName } from './gemini';
import jwt from 'jsonwebtoken';
import { prisma } from '../db'; // FIX: Use shared singleton instead of new PrismaClient()

// Per-socket rate limiting: max 10 messages per 60 seconds
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string };
        userId = decoded.id;
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
            medicalReports: { include: { summary: true, values: true } },
            prescriptions: { include: { prescriptionAnalysis: true } },
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
        const model = genAI!.getGenerativeModel({ model: modelName });
        
        chatSession = model.startChat({
          history: [
            {
              role: 'user',
              parts: [{ text: `You are PulseAI, a professional and empathetic healthcare assistant.
  
ALWAYS structure your responses using this format:

## [Topic/Question Summary]

**Overview**: A brief 1-2 sentence summary.

### Key Points
- Point 1 with clear explanation
- Point 2 with clear explanation

### Recommendations
1. First actionable recommendation
2. Second actionable recommendation

### When to See a Doctor
- List specific warning signs if applicable

---
⚕️ *Disclaimer: This is educational information only. 
Always consult a qualified healthcare professional.*
${medicalHistoryContext}` }],
            },
            {
              role: 'model',
              parts: [{ text: "Understood. I will always respond using the exact requested markdown structure, and I will keep the patient's medical history deeply in mind to provide highly personalized and context-aware insights while maintaining a professional and empathetic tone." }],
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
          text: '⚠️ You are sending messages too quickly. Please wait a moment before sending another message (limit: 10 messages per minute).',
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

        const result = await chatSession.sendMessage(message);
        const responseText = result.response.text();
        
        socket.emit('chat:response', {
          text: responseText,
          isError: false
        });

      } catch (error) {
        console.error('[Socket.io] Chat Error:', error);
        socket.emit('chat:response', {
          text: "I'm sorry, I encountered an error processing your request. Please try again later.",
          isError: true
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};
