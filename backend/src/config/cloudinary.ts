import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

const cleanEnvVar = (val: string | undefined) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, '');
};

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: cleanEnvVar(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: cleanEnvVar(process.env.CLOUDINARY_API_KEY),
  api_secret: cleanEnvVar(process.env.CLOUDINARY_API_SECRET),
});

export default cloudinary;
