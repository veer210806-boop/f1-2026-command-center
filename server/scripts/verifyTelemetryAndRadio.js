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

  // Listen to console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log("Navigating to http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Check Pit Wall Team Radio
  console.log("Capturing Pit Wall Team Radio Comms...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_radio.png") });

  // 2. Click NEXT on radio
  const nextBtn = await page.$('button[title="Next authentic radio transmission"]');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_radio_next.png") });
  }

  // 3. Select Belgian GP in header dropdown
  console.log("Selecting Belgian GP in dropdown...");
  await page.select('header select', 'belgium');
  await new Promise(r => setTimeout(r, 600));

  // 4. Navigate to TELEMETRY Tab
  console.log("Navigating to TELEMETRY tab...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("TELEMETRY")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Telemetry Suite Overview (McLaren at Spa-Francorchamps)
  console.log("Capturing Telemetry Suite overview...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_telemetry_mclaren.png") });

  // 5. Click Ferrari in Constructor Selector
  console.log("Selecting Ferrari...");
  const teamBtns = await page.$$('button');
  for (const btn of teamBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.toUpperCase().includes("FERRARI") && text.toUpperCase().includes("LEC")) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_telemetry_ferrari.png") });

  // 5. Test Quick-Jump corner in track scrubber
  console.log("Testing quick-jump corner in scrubber...");
  const cornerBtns = await page.$$('button');
  for (const btn of cornerBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes("T1") || text.includes("T10") || text.includes("T8")) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));

  // 6. Scroll down to capture Scrubber Gauges, Apex Table, and Radio Debrief
  console.log("Scrolling to lower telemetry section...");
  await page.evaluate(() => window.scrollBy(0, 700));
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_telemetry_gauges_table_radio.png") });

  // 7. Full Page Screenshot
  console.log("Capturing full page telemetry screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_telemetry_fullpage.png"), fullPage: true });

  await browser.close();
  console.log("Verification complete!");
}

run().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
