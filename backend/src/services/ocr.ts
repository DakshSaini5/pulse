import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export const performOCR = async (filePath: string): Promise<OCRResult> => {
  try {
    console.log(`Starting Tesseract WASM scan on image file: ${filePath}`);
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: (info) => console.log(`[OCR Progress] ${info.status}: ${Math.round(info.progress * 100)}%`),
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (err) {
    console.error('Tesseract scanning error:', err);
    throw new Error('OCR text parsing engine failed to execute.');
  }
};
