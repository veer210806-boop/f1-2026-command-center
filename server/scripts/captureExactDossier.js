const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));
const ARTIFACT_DIR = 'C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916';

(async () => {
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

    // Nav to 11 TEAMS & DRIVERS
    const tabs = await page.$$('.nav-tab');
    await tabs[2].click();
    await new Promise(r => setTimeout(r, 800));

    // Click PIT DOSSIER
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent.includes('PIT DOSSIER'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click RBR button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent.trim() === 'RBR');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_rbr_dossier.png') });
    console.log('Captured verified_rbr_dossier.png');

    // Click AMR button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent.trim() === 'AMR');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_amr_dossier.png') });
    console.log('Captured verified_amr_dossier.png');

    // Click CAD button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent.trim() === 'CAD');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_cad_dossier.png') });
    console.log('Captured verified_cad_dossier.png');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();

