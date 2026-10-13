const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1650,1150"],
    defaultViewport: { width: 1650, height: 1150 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Full Page & specifically the Header/Nav section
  console.log("Capturing 1. Upgraded Top Header, Navigation Deck & Pit Wall Ribbon...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_header_and_nav_full.png") });

  // 2. Capture a cropped region of just the top 200px (header + nav tabs + ribbon)
  console.log("Capturing 2. Cropped Top Bar & Ribbon (matching user screenshot)...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "verified_header_and_nav_cropped.png"),
    clip: { x: 0, y: 0, width: 1650, height: 210 }
  });

  await browser.close();
  console.log("Header and Navigation verification screenshots captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

