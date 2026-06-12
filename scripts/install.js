const { execSync } = require('child_process');

if (process.env.VERCEL === '1') {
  console.log('--- VERCEL ENVIRONMENT DETECTED: INSTALLING FRONTEND ---');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
} else {
  console.log('--- DEFAULT/RAILWAY ENVIRONMENT DETECTED: INSTALLING BACKEND ---');
  execSync('cd backend && npm install', { stdio: 'inherit' });
}
