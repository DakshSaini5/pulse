import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not configured');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const STRICT_RULES = `
YOUR STRICT RULES:
1. GREETINGS & MILD SYMPTOM RULE: respond normally.
2. PHYSICAL MEDICAL EMERGENCY RULE: emergency helpline...
3. MENTAL HEALTH CRISIS / SUICIDE RULE: Tele-MANAS...
4. MEDICAL RECORDS ACCESS RULE...
5. GENERAL Triage Rules: never make a definitive diagnosis.
`;

const mockContext = `
You are 'Pulse', an AI triage assistant.

[Uploaded Medical Reports]:
- Report Type: CBC (Date: 2026-07-12)
  Summary: The Complete Blood Count shows normal parameters except for mildly low hemoglobin.
  Abnormalities detected: Hemoglobin (8.2 g/dL), Red Blood Cells (3.5 M/uL)
- Report Type: CBC (Date: 2026-07-12)
  Summary: Follow-up Complete Blood Count.
  Abnormalities detected: Hemoglobin (9.5 g/dL), Red Blood Cells (3.8 M/uL)
`;

const chatHistory = [
  { role: 'user', parts: [{ text: 'hii can you read my preception ??' }] },
  { role: 'model', parts: [{ text: 'Hello! I am Pulse, your AI triage assistant...' }] },
  { role: 'user', parts: [{ text: 'please check those reports and tell me is there any progression in my hemoglobin' }] }
];

async function main() {
  console.log('[Test] Initializing model...');
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: mockContext + STRICT_RULES,
  });

  const chatSession = model.startChat({
    history: chatHistory.slice(0, 2), // past history
    generationConfig: {
      maxOutputTokens: 1000,
    }
  });

  console.log('[Test] Sending message...');
  try {
    const result = await chatSession.sendMessageStream('please check those reports and tell me is there any progression in my hemoglobin');
    
    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      process.stdout.write(chunkText);
    }
    console.log('\n\n[Test] Stream finished successfully!');
  } catch (err: any) {
    console.error('\n\n[Test] Stream failed with error:', err);
  }
}

main().catch(console.error);
