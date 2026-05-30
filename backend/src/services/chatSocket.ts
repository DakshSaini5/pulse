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
            parts: [{ text: "You are PulseAI, a helpful and empathetic healthcare assistant. Your goal is to help users understand their medical reports, prescriptions, and answer general health queries. Always add a disclaimer that you are not a doctor and they should consult a real physician for medical advice." }],
          },
          {
            role: 'model',
            parts: [{ text: "Understood. I am PulseAI, a helpful healthcare assistant. I will provide educational information and always remind users to consult a doctor." }],
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
