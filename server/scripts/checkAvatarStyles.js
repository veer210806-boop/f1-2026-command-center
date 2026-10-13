const fs = require('fs');
const content = fs.readFileSync('C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916/.system_generated/steps/648/content.md', 'utf8');

const matches = content.match(/https:\/\/media\.formula1\.com\/image\/upload\/[^\s"']+\/common\/f1\/2026\/[^\/\s"']+\/[^\/\s"']+\/2026[^\/\s"']+right\.webp/g);
console.log('Matches:', [...new Set(matches || [])]);

// Search for any CSS or classes around driver avatars
const snippet = content.match(/<img[^>]+driverright\.webp[^>]*>/g);
console.log('Img tags:', snippet ? snippet.slice(0, 3) : 'none');

// Also check Cloudinary URL parameters
// Notice in Cloudinary: c_crop,g_face or c_fill,g_face or c_thumb,g_face, or CSS object-position

