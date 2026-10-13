const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACTS_DIR = 'C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1600,1050"],
    defaultViewport: { width: 1600, height: 1050 }
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Switch to PADDOCK / TEAMS Tab in top navigation
    console.log('Switching to TEAMS & DRIVERS Tab in top navigation...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.nav-tab, button'));
      const paddockTab = tabs.find(t => t.innerText && t.innerText.includes('TEAMS & DRIVERS'));
      if (paddockTab) paddockTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Mode 1: Teams Cards
    console.log('Capturing Mode 1: Teams Cards...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_teams_cards.png') });

    // Mode 2: Drivers Grid
    console.log('Switching to 22 DRIVERS sub-tab...');
    const clickedDrivers = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const driverBtn = btns.find(b => b.textContent && b.textContent.includes('22 DRIVERS'));
      if (driverBtn) {
        driverBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked drivers sub-tab:', clickedDrivers);
    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing Mode 2: Drivers Grid with Hero Bust Portraits...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_drivers_grid.png') });

    // Driver Modal
    console.log('Opening Driver Modal for first driver (e.g. Verstappen or Norris)...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div[style*="cursor: pointer"]'));
      // Find a driver card or dossier button
      const dossierBtn = Array.from(document.querySelectorAll('span')).find(s => s.textContent && s.textContent.includes('DOSSIER →'));
      if (dossierBtn) {
        dossierBtn.click();
      } else if (cards.length > 0) {
        cards[0].click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing Driver Dossier Modal...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_driver_modal.png') });

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    // Mode 3: Ratings
    console.log('Switching to 2026 RATINGS sub-tab...');
    const clickedRatings = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ratingsBtn = btns.find(b => b.textContent && b.textContent.includes('2026 RATINGS'));
      if (ratingsBtn) {
        ratingsBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked ratings sub-tab:', clickedRatings);
    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing Mode 3: 2026 Ratings Page...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_ratings_page.png') });

    // Mode 4: Pit Dossier
    console.log('Switching to PIT DOSSIER sub-tab...');
    const clickedDossier = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dossierBtn = btns.find(b => b.textContent && b.textContent.includes('PIT DOSSIER'));
      if (dossierBtn) {
        dossierBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked pit dossier sub-tab:', clickedDossier);
    await new Promise(r => setTimeout(r, 1500));
    console.log('Capturing Mode 4: Pit Dossier...');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verified_pit_dossier.png') });

    console.log('SUCCESS: All 5 views captured!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();

