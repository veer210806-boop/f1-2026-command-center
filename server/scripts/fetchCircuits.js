const https = require("https");
const fs = require("fs");
const path = require("path");

const layouts = {
  australia: "melbourne-2",
  singapore: "marina-bay-4",
  japan: "suzuka-2",
  china: "shanghai-1",
  azerbaijan: "baku-1",
  bahrain: "bahrain-3",
  qatar: "lusail-1",
  abu_dhabi: "yas-marina-2",
  saudi_arabia: "jeddah-1",
  hungary: "hungaroring-3",
  austria: "spielberg-3",
  imola: "imola-3",
  monza: "monza-7",
  monaco: "monaco-6",
  spain: "catalunya-6",
  belgium: "spa-francorchamps-4",
  netherlands: "zandvoort-5",
  silverstone: "silverstone-8",
  canada: "montreal-6",
  miami: "miami-1",
  austin: "austin-1",
  las_vegas: "las-vegas-1",
  mexico: "mexico-city-3",
  brazil: "interlagos-2"
};

const baseUrl = "https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits/minimal/white/";
const results = {};

let pending = Object.keys(layouts).length;

for (const [key, layoutId] of Object.entries(layouts)) {
  const url = baseUrl + layoutId + ".svg";
  https.get(url, (res) => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => {
      const match = body.match(/d="([^"]+)"/);
      if (match) {
        results[key] = match[1];
      } else {
        console.error("Failed to match path for", key);
      }
      pending--;
      if (pending === 0) {
        const outDir = path.join(__dirname, "..", "..", "client", "src", "data");
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        const outPath = path.join(outDir, "officialCircuitSvgs.js");
        const content = "// Official F1 Circuit SVG Track Outlines (500x500 viewBox)\n// Source: official Formula 1 vector track layouts\nexport const OFFICIAL_CIRCUIT_PATHS = " + JSON.stringify(results, null, 2) + ";\n";
        fs.writeFileSync(outPath, content, "utf-8");
        console.log("Successfully saved " + Object.keys(results).length + " circuit SVGs to " + outPath);
      }
    });
  }).on("error", err => {
    console.error("Error fetching", key, err);
  });
}

