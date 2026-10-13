const fs = require('fs');
const content = fs.readFileSync('C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916/.system_generated/steps/648/content.md', 'utf8');

// Find css links
const cssLinks = content.match(/href="(\/assets\/[^"]+\.css)"/g);
console.log('CSS links:', cssLinks);

