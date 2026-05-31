import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testKeys() {
  console.log('Testing APIs...');
  let results = {
    database: false,
    gemini: false,
    cloudinary: false,
  };

  // 1. Test Database (Supabase PostgreSQL)
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    console.log(`✅ Supabase DB: Connected successfully (Found ${count} users)`);
    results.database = true;
  } catch (err: any) {
    console.error(`❌ Supabase DB Error:`, err.message);
  } finally {
    await prisma.$disconnect();
  }

  // 2. Test Gemini API
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say exactly: Hello World');
    const response = await result.response;
    if (response.text().includes('Hello')) {
      console.log(`✅ Gemini API: Connected successfully and returned response.`);
      results.gemini = true;
    } else {
      console.log(`❌ Gemini API Error: Unexpected response.`);
    }
  } catch (err: any) {
    console.error(`❌ Gemini API Error:`, err.message);
  }

  // 3. Test Cloudinary API
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // We just test if config is present, pinging cloudinary API directly
    const res = await cloudinary.api.ping();
    if (res.status === 'ok') {
       console.log(`✅ Cloudinary API: Connected successfully (Ping OK)`);
       results.cloudinary = true;
    }
  } catch (err: any) {
    console.error(`❌ Cloudinary API Error:`, err.message);
  }
  
  console.log('============================');
  console.log('SUMMARY:', results);
  console.log('============================');
  process.exit(0);
}

testKeys();
