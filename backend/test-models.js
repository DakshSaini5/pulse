const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    for (const modelName of models) {
      try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Say hello in valid JSON: {"hello": "world"}' }] }],
          generationConfig: { responseMimeType: "application/json" }
        });
        console.log(`SUCCESS ${modelName}:`, res.response.text());
      } catch (err) {
        console.error(`FAILED ${modelName}:`, err.message);
      }
    }
  } catch (e) {
    console.error("Global error:", e);
  }
}
test();
