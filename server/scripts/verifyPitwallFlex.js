const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1450,950"],
    defaultViewport: { width: 1450, height: 950 }
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  // Capture upper front view showing the expanded left panel (330px) and shifted timing tower
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_expanded_map.png") });
  console.log("Expanded map screenshot saved!");

  await browser.close();
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
