import { Server, Socket } from 'socket.io';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const setupChatSocket = (io: Server) => {
  // Read key after dotenv has initialized in index.ts
  const apiKey = process.env.GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Create a new chat session for this socket connection
    let chatSession: any = null;

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
Always consult a qualified healthcare professional.*` }],
          },
          {
            role: 'model',
            parts: [{ text: "Understood. I will always respond using the exact requested markdown structure, including the overview, key points, recommendations, when to see a doctor, and the medical disclaimer." }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
    }

    socket.on('chat:message', async (message: string) => {
      if (!message || typeof message !== 'string') return;
      
      try {
        if (!chatSession) {
          // Fallback if no API key
          setTimeout(() => {
            socket.emit('chat:response', {
              text: "Hello! I am currently running in offline demo mode, so I cannot process live AI queries right now. Please configure the GEMINI_API_KEY to enable full chat functionality!",
              isError: false
            });
          }, 1000);
          return;
        }

        // Send message to Gemini
        const result = await chatSession.sendMessage(message);
        const responseText = result.response.text();
        
        // Emit back to the specific client
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
