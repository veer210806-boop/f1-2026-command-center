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

  // 1. Navigate to BUDGET CAP Tab
  console.log("Navigating to BUDGET CAP Tab...");
  const tabs = await page.$$('.nav-tab');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.toUpperCase().includes("BUDGET")) {
      await tab.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));

  console.log("Capturing 1. Budget Manager Team Dashboard...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_budget_dashboard.png") });

  // 2. Click "ALL 11 STANDINGS" button
  console.log("Clicking ALL 11 STANDINGS button...");
  const standingsBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes("ALL 11 STANDINGS"));
  });
  if (standingsBtn && standingsBtn.click) {
    await standingsBtn.click();
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("Capturing 2. Budget Manager 11 Constructors Standings Matrix...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_budget_standings.png") });

  await browser.close();
  console.log("Budget page verifications captured successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
