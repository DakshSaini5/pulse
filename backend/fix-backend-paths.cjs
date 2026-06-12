const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'routes', 'mobile');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative imports:
    // '../db' -> '../../db'
    content = content.replace(/from\s+['"]\.\.\/db['"]/g, "from '../../db'");
    // '../middleware/...' -> '../../middleware/...'
    content = content.replace(/from\s+['"]\.\.\/middleware/g, "from '../../middleware");
    // '../services/...' -> '../../services/...'
    content = content.replace(/from\s+['"]\.\.\/services/g, "from '../../services");
    // '../utils/...' -> '../../utils/...'
    content = content.replace(/from\s+['"]\.\.\/utils/g, "from '../../utils");
    // '../config/...' -> '../../config/...'
    content = content.replace(/from\s+['"]\.\.\/config/g, "from '../../config");

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
});
