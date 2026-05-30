import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

const cleanEnvVar = (val: string | undefined) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, '');
};

const cloud_name = cleanEnvVar(process.env.CLOUDINARY_CLOUD_NAME);
const api_key = cleanEnvVar(process.env.CLOUDINARY_API_KEY);
const api_secret = cleanEnvVar(process.env.CLOUDINARY_API_SECRET);

console.log("⚙️ CONFIGURING CLOUDINARY IN BACKEND:", {
  cloud_name,
  api_key,
  api_secret: api_secret ? `${api_secret.slice(0, 3)}...${api_secret.slice(-3)}` : 'undefined',
  secret_length: api_secret ? api_secret.length : 0
});

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;
