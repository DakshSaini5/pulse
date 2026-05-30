import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(path.join(process.cwd(), 'frontend', 'src'));

let replacementsCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Backgrounds
  content = content.replace(/bg-\[#0B0F19\]/g, 'bg-slate-50');
  content = content.replace(/bg-white\/5/g, 'bg-slate-50');
  content = content.replace(/bg-white\/10/g, 'bg-slate-100');
  content = content.replace(/bg-white\/20/g, 'bg-slate-200');
  
  // Text colors
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-100/g, 'text-slate-800');
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');

  // Borders
  content = content.replace(/border-white\/5/g, 'border-slate-200');
  content = content.replace(/border-white\/10/g, 'border-slate-200');
  content = content.replace(/border-white\/20/g, 'border-slate-300');
  
  // Gradients
  content = content.replace(/from-white\/\[0\.01\]/g, 'from-slate-50');
  content = content.replace(/from-white\/\[0\.02\]/g, 'from-slate-50');
  content = content.replace(/to-transparent/g, 'to-slate-100/50');
  
  // Misc
  content = content.replace(/bg-gray-900/g, 'bg-white');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacementsCount++;
  }
});

console.log(`Updated ${replacementsCount} files for the light theme.`);
