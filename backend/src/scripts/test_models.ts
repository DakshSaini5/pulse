// @ts-nocheck
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not configured in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-flash-latest'
];

async function main() {
  console.log('Using API Key:', apiKey.substring(0, 10) + '...');
  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`\nProbing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      console.log(`Success! Response: "${response.response.text().trim()}"`);
    } catch (err: any) {
      console.error(`Failed with error:`, err.message || err);
    }
  }
}

main().catch(console.error);
