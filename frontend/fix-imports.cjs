const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getAllFiles(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Replace relative paths pointing to core folders with @core/ alias
  const replacements = [
    { regex: /from\s+['"]\.\.\/\.\.\/services([^'"]*)['"]/g, to: "from '@core/services$1'" },
    { regex: /from\s+['"]\.\.\/services([^'"]*)['"]/g, to: "from '@core/services$1'" },
    { regex: /from\s+['"]\.\.\/\.\.\/context([^'"]*)['"]/g, to: "from '@core/context$1'" },
    { regex: /from\s+['"]\.\.\/context([^'"]*)['"]/g, to: "from '@core/context$1'" },
    { regex: /from\s+['"]\.\.\/\.\.\/utils([^'"]*)['"]/g, to: "from '@core/utils$1'" },
    { regex: /from\s+['"]\.\.\/utils([^'"]*)['"]/g, to: "from '@core/utils$1'" },
  ];

  replacements.forEach(({ regex, to }) => {
    if (regex.test(content)) {
      content = content.replace(regex, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
  }
});

console.log("Imports fixed.");
