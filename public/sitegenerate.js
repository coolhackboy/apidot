const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import supported languages
const { supportedLanguages } = require('../data/languages');

const BASE_URL = 'https://imagegpt.io';
const LOCALE_DIR = path.join(process.cwd(), 'app', '[locale]');

// Function to get last modified time of a file
function getLastModifiedTime(filePath) {
  try {
    const gitCommand = `git log -1 --format="%aI" -- "${filePath}"`;
    const lastMod = execSync(gitCommand).toString().trim();
    return lastMod.split('T')[0]; // Return only the date part
  } catch (error) {
    // Fallback to file system time if git command fails
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  }
}

// Function to check if a directory is a group route
function isGroupRoute(dirName) {
  return dirName.startsWith('(') && dirName.endsWith(')');
}

// Function to get all valid routes
function getValidRoutes(dir, basePath = '') {
  const routes = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  // Routes to exclude from sitemap
  const excludedRoutes = ['about', 'cookie', 'my', 'privacy', 'support', 'terms', 'hub'];

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.join(basePath, item.name);

    if (item.isDirectory()) {
      // Skip excluded routes
      if (excludedRoutes.includes(item.name)) {
        continue;
      }

      if (isGroupRoute(item.name)) {
        // If it's a group route, get routes from its subdirectories
        routes.push(...getValidRoutes(fullPath, basePath));
      } else {
        // Check if it has a page.tsx file
        const pagePath = path.join(fullPath, 'page.tsx');
        if (fs.existsSync(pagePath)) {
          routes.push({
            path: relativePath,
            lastmod: getLastModifiedTime(pagePath)
          });
        }
        // Recursively get routes from subdirectories
        routes.push(...getValidRoutes(fullPath, relativePath));
      }
    }
  }

  return routes;
}

// Function to generate sitemap XML
function generateSitemap(routes) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add homepage
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}</loc>\n`;
  xml += '  </url>\n';

  // Add all routes with language variants
  for (const route of routes) {
    for (const lang of supportedLanguages) {
      // For English (default language), don't include language code in URL
      const url = lang.code === 'en' 
        ? `${BASE_URL}${route.path ? '/' + route.path : ''}`
        : `${BASE_URL}/${lang.code}${route.path ? '/' + route.path : ''}`;
      
      xml += '  <url>\n';
      xml += `    <loc>${url}</loc>\n`;
      if (route.lastmod) {
        xml += `    <lastmod>${route.lastmod}</lastmod>\n`;
      }
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>';
  return xml;
}

// Main function
function generate() {
  console.log('Generating sitemap...');
  
  // Get all valid routes
  const routes = getValidRoutes(LOCALE_DIR);
  
  // Generate sitemap XML
  const sitemap = generateSitemap(routes);
  
  // Write to file
  fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
  
  console.log('Sitemap generated successfully!');
}

// Run the generator
generate();
