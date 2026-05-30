import { GoogleGenerativeAI } from '@google/generative-ai';

export const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

let cachedActiveModel: string | null = null;

export async function getWorkingModelName(genAI: GoogleGenerativeAI): Promise<string> {
  if (cachedActiveModel) return cachedActiveModel;
  
  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini Selector] Probing model availability for: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      // Simple lightweight probe request
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      cachedActiveModel = modelName;
      console.log(`[Gemini Selector] Successfully detected and cached active model: ${modelName}`);
      return modelName;
    } catch (err: any) {
      console.warn(`[Gemini Selector] Model ${modelName} probe failed:`, err.message || err);
    }
  }
  
  // Fallback to the first candidate if all fail
  return CANDIDATE_MODELS[0];
}

export async function generateContentWithFallback(
  genAI: GoogleGenerativeAI,
  promptOrParts: any,
  generationConfig: any = {}
) {
  let lastError: any = null;
  
  // Try the cached model first if available
  const preferredModels = cachedActiveModel 
    ? [cachedActiveModel, ...CANDIDATE_MODELS.filter(m => m !== cachedActiveModel)]
    : CANDIDATE_MODELS;

  for (const modelName of preferredModels) {
    try {
      console.log(`[Gemini Fallback] Attempting generateContent with ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig
      });
      const result = await model.generateContent(promptOrParts);
      // Ensure it returned a valid response text
      result.response.text();
      
      if (!cachedActiveModel) {
        cachedActiveModel = modelName;
        console.log(`[Gemini Fallback] Cached ${modelName} as preferred active model.`);
      }
      return { result, modelName };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All candidate Gemini models failed.");
}
