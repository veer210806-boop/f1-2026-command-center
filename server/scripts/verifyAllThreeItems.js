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

  // 1. Pit Wall Tab Verification
  console.log("Capturing 1. Pit Wall Mission Control...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("PIT WALL")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_advanced.png") });

  // 2. Calendar Tab Verification (Bright images & No record line)
  console.log("Navigating to 2. Calendar View...");
  const tabs2 = await page.$$('.nav-tab');
  for (const tab of tabs2) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("CALENDAR") || text.toUpperCase().includes("SCHEDULE")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_calendar_bright.png") });

  // 3. Teams Tab Verification (Zero car overlap)
  console.log("Navigating to 3. Teams Paddock...");
  const tabs3 = await page.$$('.nav-tab');
  for (const tab of tabs3) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("TEAMS") || text.toUpperCase().includes("DRIVERS")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // Ensure "ALL 11 TEAMS" is active
  const teamsBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("ALL 11 TEAMS"));
  });
  if (teamsBtn && teamsBtn.click) {
    await teamsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_teams_no_overlap.png") });

  await browser.close();
  console.log("All 3 verifications captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

