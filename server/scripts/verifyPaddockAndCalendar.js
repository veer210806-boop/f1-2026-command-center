const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1600,1100"],
    defaultViewport: { width: 1600, height: 1100 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Navigate to CALENDAR Tab
  console.log("Navigating to CALENDAR Tab...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("CALENDAR") || text.toUpperCase().includes("SCHEDULE")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  console.log("Capturing Calendar View screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_calendar_view.png") });

  // 2. Navigate to TEAMS Tab
  console.log("Navigating to TEAMS Tab...");
  const tabs2 = await page.$$('.nav-tab');
  for (const tab of tabs2) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("TEAMS") || text.toUpperCase().includes("DRIVERS")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // Ensure "ALL 11 TEAMS & CARS" is active
  const teamsBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("ALL 11 TEAMS"));
  });
  if (teamsBtn && teamsBtn.click) {
    await teamsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Capturing All 11 Teams Showroom screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_teams_showroom.png") });

  // 3. Switch to "ALL 22 DRIVERS"
  console.log("Switching to ALL 22 DRIVERS sub-tab...");
  const driversBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("ALL 22 DRIVERS"));
  });
  if (driversBtn && driversBtn.click) {
    await driversBtn.click();
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log("Capturing All 22 Drivers Trading Cards screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_drivers_trading_cards.png") });

  await browser.close();
  console.log("All verifications captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

