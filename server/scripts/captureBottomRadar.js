const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050'],
    defaultViewport: { width: 1600, height: 1050 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const tabs = await page.$$('.nav-tab');
  for (const t of tabs) {
    const txt = await page.evaluate(el => el.textContent, t);
    if (txt.toUpperCase().includes('STRATEGY')) { await t.click(); break; }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => window.scrollTo(0, 950));
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916/verified_strategy_bottom_radar.png' });
  await browser.close();
  console.log('Captured verified_strategy_bottom_radar.png');
})();

