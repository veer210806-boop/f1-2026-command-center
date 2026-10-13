const fs = require('fs');

const dContent = fs.readFileSync('C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916/.system_generated/steps/644/content.md', 'utf8');
const tContent = fs.readFileSync('C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916/.system_generated/steps/648/content.md', 'utf8');

const driverRegex = /https:\/\/media\.formula1\.com\/image\/upload\/[^\s"']+\/common\/f1\/2026\/[^\/\s"']+\/[^\/\s"']+\/2026[^\/\s"']+right\.webp/g;
const carRegex = /https:\/\/media\.formula1\.com\/image\/upload\/[^\s"']+\/common\/f1\/2026\/[^\/\s"']+\/2026[^\/\s"']+carright\.webp/g;
const logoRegex = /https:\/\/media\.formula1\.com\/image\/upload\/[^\s"']+\/common\/f1\/2026\/[^\/\s"']+\/2026[^\/\s"']+logowhite\.webp/g;

const driverMatches = [...new Set(dContent.match(driverRegex) || [])];
const carMatches = [...new Set(tContent.match(carRegex) || [])];
const logoMatches = [...new Set(tContent.match(logoRegex) || [])];

console.log('--- DRIVER IMAGES (' + driverMatches.length + ') ---');
driverMatches.forEach(u => console.log(u));

console.log('\n--- CAR IMAGES (' + carMatches.length + ') ---');
carMatches.forEach(u => console.log(u));

console.log('\n--- LOGO IMAGES (' + logoMatches.length + ') ---');
logoMatches.forEach(u => console.log(u));

