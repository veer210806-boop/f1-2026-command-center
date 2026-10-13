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

  // 1. Navigate to PADDOCK Tab
  console.log("Navigating to PADDOCK Tab...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("PADDOCK") || text.toUpperCase().includes("TEAMS")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  console.log("Capturing 1. Teams Paddock - Mode 1 (11 Teams Showroom)...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_paddock_teams_showroom.png") });

  // 2. Click "PIT DOSSIER" mode button
  console.log("Switching to PIT DOSSIER mode...");
  const dossierModeBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("PIT DOSSIER"));
  });
  if (dossierModeBtn && dossierModeBtn.click) {
    await dossierModeBtn.click();
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("Capturing 2. Overhauled Pit Dossier Page (Teams & Engineering Cockpit)...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_paddock_pit_dossier.png") });

  // 3. Open Driver Dossier Modal by clicking on a driver card
  console.log("Opening Driver Dossier modal for driver...");
  try {
    await page.waitForSelector('#driver-card-NOR', { timeout: 4000 });
    await page.click('#driver-card-NOR');
    console.log("Clicked #driver-card-NOR successfully");
  } catch (err) {
    console.log("Could not find #driver-card-NOR, trying fallback click...", err.message);
    await page.evaluate(() => {
      const card = document.querySelector('.driver-cockpit-card') || document.querySelector('[data-testid*="driver-card"]');
      if (card) card.click();
    });
  }
  await new Promise(r => setTimeout(r, 2000));

  console.log("Capturing 3. Driver Dossier Modal (Stats & Overview)...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_modal_stats.png") });

  // 4. Click "Telemetry & Skills" tab in modal
  console.log("Clicking Telemetry & Skills tab...");
  const telemetryTab = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("Telemetry & Skills") || b.textContent.includes("Ratings"));
  });
  if (telemetryTab && telemetryTab.click) {
    await telemetryTab.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Capturing 4. Driver Dossier Modal (Telemetry & Skills with OVR badge)...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_modal_telemetry.png") });

  // 5. Click "Key Milestones" tab in modal
  console.log("Clicking Key Milestones tab...");
  const milestonesTab = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("Milestones"));
  });
  if (milestonesTab && milestonesTab.click) {
    await milestonesTab.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Capturing 5. Driver Dossier Modal (Milestones Timeline)...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_modal_milestones.png") });

  await browser.close();
  console.log("All paddock and dossier screenshots captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

