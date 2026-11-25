import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const CANDIDATE_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-flash-latest'
];

export let cachedActiveModel: string | null = null;

export async function getWorkingModelName(genAI: GoogleGenerativeAI): Promise<string> {
  if (cachedActiveModel) return cachedActiveModel;
  
  for (const modelName of CANDIDATE_MODELS) {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const controller = new AbortController();
    try {
      console.log(`[Gemini Selector] Probing model availability for: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          controller.abort();
          reject(new Error('Probe timed out'));
        }, 2000);
      });

      // 2-second timeout for the probe request to prevent hangs
      const probePromise = model.generateContent(
        {
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 5 }
        },
        { signal: controller.signal, timeout: 2000 }
      );

      await Promise.race([probePromise, timeoutPromise]);
      cachedActiveModel = modelName;
      console.log(`[Gemini Selector] Successfully detected and cached active model: ${modelName}`);
      return modelName;
    } catch (err: any) {
      console.warn(`[Gemini Selector] Model ${modelName} probe failed:`, err.message || err);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
  
  // Fallback to the first candidate if all fail
  return CANDIDATE_MODELS[0];
}

export async function generateContentWithFallback(
  genAI: GoogleGenerativeAI,
  promptOrParts: any,
  generationConfig: any = {},
  systemInstruction?: any,
  timeoutMs: number = 30000
) {
  let lastError: any = null;
  
  // Try the cached model first if available
  const preferredModels = cachedActiveModel 
    ? [cachedActiveModel, ...CANDIDATE_MODELS.filter(m => m !== cachedActiveModel)]
    : CANDIDATE_MODELS;

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
  ];

  for (const modelName of preferredModels) {
    const controller = new AbortController();
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      console.log(`[Gemini Fallback] Attempting generateContent with ${modelName}...`);
      const modelOptions: any = {
        model: modelName,
        generationConfig,
        safetySettings
      };
      if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
      }
      const model = genAI.getGenerativeModel(modelOptions);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          controller.abort();
          reject(new Error(`Gemini request to ${modelName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Pass AbortSignal and timeout into SDK SingleRequestOptions
      const generatePromise = model.generateContent(promptOrParts, {
        signal: controller.signal,
        timeout: timeoutMs
      });

      const result = await Promise.race([generatePromise, timeoutPromise]);

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
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
  throw lastError || new Error("All candidate Gemini models failed.");
}
