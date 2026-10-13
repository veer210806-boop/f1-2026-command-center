const path = require('path');
const puppeteer = require(path.join(__dirname, '../../client/node_modules/puppeteer-core'));

const ARTIFACT_DIR = "C:/Users/VEER/.gemini/antigravity/brain/eababfb8-5bf0-4af0-923f-ee9d977ff916";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1550,1100"],
    defaultViewport: { width: 1550, height: 1100 }
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));

  // Scroll down inside the table wrapper (maxHeight: 520px)
  await page.evaluate(() => {
    const tableWrap = document.querySelector('table').parentElement;
    if (tableWrap) {
      tableWrap.scrollTop = 350;
    }
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "verified_pitwall_scrolled_rows.png") });

  await browser.close();
  console.log("Scrolled rows verification screenshot saved successfully!");
}

run().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});

