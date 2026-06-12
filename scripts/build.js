const { execSync } = require('child_process');

if (process.env.VERCEL === '1') {
  console.log('--- VERCEL ENVIRONMENT DETECTED: BUILDING FRONTEND ---');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
} else {
  console.log('--- DEFAULT/RAILWAY ENVIRONMENT DETECTED: BUILDING BACKEND ---');
  execSync('cd backend && npm run build', { stdio: 'inherit' });
}
