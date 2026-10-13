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
  await new Promise(r => setTimeout(r, 1000));

  // 1. Click on Calendar tab (.nav-tab:nth-child(2))
  const navTabs = await page.$$('.nav-tab');
  if (navTabs.length > 1) {
    await navTabs[1].click();
    console.log("Clicked 2026 Calendar nav tab!");
  }
  await new Promise(r => setTimeout(r, 1200));

  // Scroll down to view Round 08 (Monaco) and Round 09 (Barcelona)
  await page.evaluate(() => {
    window.scrollBy(0, 560);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_calendar_monaco_barcelona_photos.png") });
  console.log("Monaco and Barcelona photos screenshot saved!");

  // 2. Open Dossier modal on Round 8 (Monaco) or Round 9 (Barcelona) or Round 1
  // Find all DOSSIER buttons
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes("DOSSIER")) {
      await b.click();
      console.log("Clicked DOSSIER button to open modal!");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot of upgraded Dossier Modal (Schedule Tab)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_dossier_modal_upgraded.png") });
  console.log("Upgraded Dossier Modal screenshot saved!");

  // 3. Click "TRACK GUIDE & 2026 SPECS" tab in modal
  const modalTabButtons = await page.$$('div button');
  for (const t of modalTabButtons) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text && text.includes("TRACK GUIDE")) {
      await t.click();
      console.log("Clicked TRACK GUIDE tab");
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_dossier_modal_track_guide.png") });
  console.log("Dossier Modal Track Guide screenshot saved!");

  await browser.close();
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

