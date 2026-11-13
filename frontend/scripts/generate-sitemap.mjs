import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://pulsehealthcare.in';
const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/search', priority: '0.9', changefreq: 'daily' },
  { path: '/compare', priority: '0.8', changefreq: 'weekly' },
  { path: '/reports', priority: '0.8', changefreq: 'weekly' },
  { path: '/medical-terms', priority: '0.7', changefreq: 'monthly' },
  { path: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
  { path: '/pulse-plus', priority: '0.6', changefreq: 'monthly' },
  { path: '/faq', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.4', changefreq: 'monthly' },
  { path: '/terms', priority: '0.4', changefreq: 'monthly' },
  { path: '/disclaimer', priority: '0.4', changefreq: 'monthly' },
  { path: '/sitemap', priority: '0.4', changefreq: 'monthly' },
];

// Read seed file to extract hospital names and generate hospital entries
let hospitalEntries = [];
try {
  const seedPath = path.resolve(__dirname, '../../backend/prisma/seed.ts');
  if (fs.existsSync(seedPath)) {
    const seedContent = fs.readFileSync(seedPath, 'utf8');
    const hospitalRegex = /name:\s*['"]([^'"]+)['"],\s*address:\s*['"]([^'"]+)['"]/g;
    let match;
    const hospitals = [];
    while ((match = hospitalRegex.exec(seedContent)) !== null) {
      hospitals.push({ name: match[1], address: match[2] });
    }
    // Convert to URL slug paths for hospital SEO
    hospitalEntries = hospitals.map(h => ({
      path: `/search?q=${encodeURIComponent(h.name)}`,
      priority: '0.7',
      changefreq: 'weekly'
    }));
  }
} catch (e) {
  console.warn('Could not parse seed file:', e.message);
}

const allUrls = [
  ...staticRoutes,
  ...hospitalEntries
];

const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${DOMAIN}${u.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, xmlContent, 'utf8');
console.log(`✅ Generated sitemap.xml with ${allUrls.length} URLs and lastmod=${today}`);
