import dotenv from 'dotenv';
dotenv.config();

import { performOCR } from './src/services/ocr';
import path from 'path';

async function test() {
  try {
    const text = await performOCR(path.join(__dirname, 'uploads', 'pres-1780089803996.jpg'));
    console.log("OCR Result:", text);
  } catch (e) {
    console.error("OCR Failed:", e);
  }
}
test();
