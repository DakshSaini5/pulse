const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: "You are PulseAI, a professional and empathetic healthcare assistant." }]
        },
        {
          role: 'model',
          parts: [{ text: "Understood." }]
        }
      ]
    });
    console.log("Starting stream...");
    const result = await chat.sendMessageStream("Hello");
    for await (const chunk of result.stream) {
      console.log(chunk.text());
    }
    console.log("Stream ended.");
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
