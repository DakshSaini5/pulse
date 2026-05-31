const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'D:/Desktop/PULSE/frontend/src/pages/ReportCenter.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/HealthTrends.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/SavedHospitals.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/PrescriptionCenter.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/Comparison.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/Profile.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/Settings.tsx',
  'D:/Desktop/PULSE/frontend/src/pages/AdminDashboard.tsx',
];

const replacements = [
  { pattern: /\btext-slate-900(?!\s+dark:)/g, replacement: 'text-slate-900 dark:text-white' },
  { pattern: /\btext-slate-800(?!\s+dark:)/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { pattern: /\btext-slate-600(?!\s+dark:)/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { pattern: /\btext-slate-500(?!\s+dark:)/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { pattern: /\btext-slate-400(?!\s+dark:)/g, replacement: 'text-slate-400 dark:text-slate-500' },
  { pattern: /\bbg-slate-50(?!\s+dark:)/g, replacement: 'bg-slate-50 dark:bg-slate-800' },
  { pattern: /\bbg-slate-100(?!\s+dark:)/g, replacement: 'bg-slate-100 dark:bg-slate-700' },
  { pattern: /\bborder-slate-200(?!\s+dark:)/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { pattern: /\bbg-white(?!\s+dark:)/g, replacement: 'bg-white dark:bg-slate-900' },
  { pattern: /\bfrom-slate-50 to-slate-100\/50(?!\s+dark:)/g, replacement: 'from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50' },
];

for (const file of filesToUpdate) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const { pattern, replacement } of replacements) {
      content = content.replace(pattern, replacement);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
