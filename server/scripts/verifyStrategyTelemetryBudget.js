const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));
const ARTIFACT_DIR = 'C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050'],
    defaultViewport: { width: 1600, height: 1050 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Helper to click top nav tab
    async function clickNavTab(name) {
      const tabs = await page.$$('.nav-tab');
      for (const tab of tabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text.toUpperCase().includes(name.toUpperCase())) {
          await tab.click();
          await new Promise(r => setTimeout(r, 1000));
          return true;
        }
      }
      return false;
    }

    // ─────────────────────────────────────────────────────────────
    // 1 & 2: STRATEGY VIEW
    // ─────────────────────────────────────────────────────────────
    console.log('Navigating to STRATEGY...');
    await clickNavTab('STRATEGY');
    await new Promise(r => setTimeout(r, 800));

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_strategy_deck.png') });
    console.log('Captured verified_strategy_deck.png');

    // Scroll down to Tactical Radar & Pit Wall Comms
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_strategy_radar.png') });
    console.log('Captured verified_strategy_radar.png');

    // ─────────────────────────────────────────────────────────────
    // 3 & 4: TELEMETRY VIEW
    // ─────────────────────────────────────────────────────────────
    console.log('Navigating to TELEMETRY...');
    await clickNavTab('TELEMETRY');
    await new Promise(r => setTimeout(r, 800));

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_telemetry_deck.png') });
    console.log('Captured verified_telemetry_deck.png');

    // Scroll down to Track Scrubber, Gauges, Apex Table
    await page.evaluate(() => window.scrollTo(0, 620));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_telemetry_gauges.png') });
    console.log('Captured verified_telemetry_gauges.png');

    // ─────────────────────────────────────────────────────────────
    // 5 & 6: BUDGET CAP VIEW
    // ─────────────────────────────────────────────────────────────
    console.log('Navigating to BUDGET...');
    await clickNavTab('BUDGET');
    await new Promise(r => setTimeout(r, 800));

    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_budget_cap.png') });
    console.log('Captured verified_budget_cap.png');

    // Switch to Standings Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const standingsBtn = btns.find(b => b.textContent.includes('GRID AUDIT') || b.textContent.includes('STANDINGS'));
      if (standingsBtn) standingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_budget_standings.png') });
    console.log('Captured verified_budget_standings.png');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();

