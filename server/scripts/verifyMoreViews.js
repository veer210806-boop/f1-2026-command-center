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
    await new Promise(r => setTimeout(r, 1000));

    // Nav to CALENDAR
    const tabs = await page.$$('.nav-tab');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.toUpperCase().includes('CALENDAR')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1200));

    // 1. Open Round 1 modal and switch to Tab 2: TRACK GUIDE & 2026 SPECS
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.race-card, [style*="cursor: pointer"]');
      for (const card of cards) {
        if (card.textContent.includes('AUSTRALIAN') || card.textContent.includes('Albert Park')) {
          card.click();
          break;
        }
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Click Tab 2
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab2 = btns.find(b => b.textContent.includes('TRACK GUIDE'));
      if (tab2) tab2.click();
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_modal_track_guide_tab.png') });
    console.log('Captured Track Guide Tab screenshot');

    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // 2. Switch to SPLIT DOSSIER view
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dossierBtn = btns.find(b => b.textContent.includes('SPLIT DOSSIER'));
      if (dossierBtn) dossierBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_calendar_split_dossier.png') });
    console.log('Captured Split Dossier screenshot');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}
run();

