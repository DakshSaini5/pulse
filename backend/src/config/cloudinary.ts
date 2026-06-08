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

console.log(`⚙️ Cloudinary configured for cloud: ${cloud_name}`);

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;
