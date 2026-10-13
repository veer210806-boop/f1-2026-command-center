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
    await new Promise(r => setTimeout(r, 1200));

    // Click 3rd nav tab directly: 11 TEAMS & DRIVERS (index 2)
    const tabs = await page.$$('.nav-tab');
    if (tabs.length > 2) {
      await tabs[2].click();
      await new Promise(r => setTimeout(r, 1000));
    }

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_principals_teams_grid.png') });
    console.log('Captured verified_principals_teams_grid.png');

    // Click PIT DOSSIER tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dossierBtn = btns.find(b => b.textContent.includes('PIT DOSSIER'));
      if (dossierBtn) dossierBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // Select Red Bull Racing to see Laurent Mekies
    await page.evaluate(() => {
      const teamBtns = Array.from(document.querySelectorAll('button'));
      const rbr = teamBtns.find(b => b.textContent.includes('Red Bull'));
      if (rbr) rbr.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_principals_rbr_dossier.png') });
    console.log('Captured verified_principals_rbr_dossier.png');

    // Select Aston Martin to see Adrian Newey
    await page.evaluate(() => {
      const teamBtns = Array.from(document.querySelectorAll('button'));
      const amr = teamBtns.find(b => b.textContent.includes('Aston Martin'));
      if (amr) amr.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_principals_aston_dossier.png') });
    console.log('Captured verified_principals_aston_dossier.png');

    // Select Alpine to see Flavio Briatore / Steve Nielsen
    await page.evaluate(() => {
      const teamBtns = Array.from(document.querySelectorAll('button'));
      const alp = teamBtns.find(b => b.textContent.includes('Alpine'));
      if (alp) alp.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_principals_alpine_dossier.png') });
    console.log('Captured verified_principals_alpine_dossier.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();

