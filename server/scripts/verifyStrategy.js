const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1600,1050"],
    defaultViewport: { width: 1600, height: 1050 }
  });

  const page = await browser.newPage();
  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to STRATEGY Tab
  console.log("Navigating to STRATEGY tab...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("STRATEGY")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 1: Strategy Overview (Pirelli Briefing, Thermal Curves, Gantt Timeline)
  console.log("Capturing Strategy Suite overview...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_strategy_overview.png") });

  // Full Page Screenshot
  console.log("Capturing full page strategy screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_strategy_fullpage.png"), fullPage: true });

  await browser.close();
  console.log("Strategy verification complete!");
}

run().catch(err => {
  console.error("Strategy verification failed:", err);
  process.exit(1);
});

