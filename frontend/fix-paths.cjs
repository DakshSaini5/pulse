const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix utils
    content = content.replace(/@\/utils\/utils/g, '@core/utils/utils');
    
    // Fix components/ui
    content = content.replace(/@\/components\/ui\//g, '@web/components/ui/');

    // Fix PulseLogo in mobile screens
    content = content.replace(/\.\.\/PulseLogo/g, '@web/components/PulseLogo');
    content = content.replace(/\.\.\/components\/PulseLogo/g, '@web/components/PulseLogo');

    // Fix HealthTrends dynamic import
    content = content.replace(/import\('\.\.\/services\/api'\)/g, "import('@core/services/api')");

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed:', filePath);
    }
  }
});
