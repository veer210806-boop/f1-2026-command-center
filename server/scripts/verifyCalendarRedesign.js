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

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    console.log("Navigating to http://localhost:5173...");
    await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Navigate to CALENDAR Tab
    console.log("Navigating to CALENDAR Tab...");
    const tabs = await page.$$('.nav-tab');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.toUpperCase().includes("CALENDAR") || text.toUpperCase().includes("SCHEDULE")) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    console.log("Capturing Calendar View screenshot...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_calendar_cards_redesign.png") });

    // 2. Click the first race card to open Race Dossier Modal
    console.log("Clicking Round 01 Australia race card...");
    const clicked = await page.evaluate(() => {
      // Find race cards
      const cards = document.querySelectorAll('.race-card, [style*="cursor: pointer"]');
      for (const card of cards) {
        if (card.textContent.includes("AUSTRALIAN") || card.textContent.includes("Albert Park") || card.textContent.includes("ROUND 01")) {
          card.click();
          return true;
        }
      }
      // If not found, try any card with "ROUND"
      for (const card of cards) {
        if (card.textContent.includes("ROUND")) {
          card.click();
          return true;
        }
      }
      return false;
    });

    console.log("Card clicked:", clicked);
    await new Promise(r => setTimeout(r, 1200));

    console.log("Capturing Race Dossier Modal screenshot...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_calendar_modal_redesign.png") });

    console.log("Screenshots captured successfully!");
  } catch (err) {
    console.error("Error during verification:", err);
  } finally {
    await browser.close();
  }
}

run();

