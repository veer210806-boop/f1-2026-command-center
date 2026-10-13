const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1550,1100"],
    defaultViewport: { width: 1550, height: 1100 }
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1000));

  // Click row 4 (Leclerc or Hamilton)
  const rows = await page.$$('tbody tr');
  if (rows.length > 3) {
    await rows[3].click();
    console.log("Clicked row 4 (Leclerc #16)");
  }
  await new Promise(r => setTimeout(r, 600));

  // Scroll down to check updated telemetry & radio for Leclerc
  await page.evaluate(() => {
    window.scrollBy(0, 650);
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_leclerc_selected.png") });
  console.log("Leclerc telemetry screenshot saved!");

  await browser.close();
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

