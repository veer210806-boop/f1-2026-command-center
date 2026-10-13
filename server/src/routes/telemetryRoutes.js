// ============================================================
// routes/telemetryRoutes.js — Telemetry comparison for teammate pairs
// ============================================================
const express = require("express");
const router  = express.Router();
const path    = require("path");
const fs      = require("fs");
const { binarySearchTelemetry } = require("../dsa/binarySearch");

const SEED_DIR = path.join(__dirname, "../seed");

function getTelemetryData(d1, d2) {
  const filePath = path.join(SEED_DIR, "telemetry_nor_pia.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (Array.isArray(raw)) return raw;

  const key1 = `${d1.toUpperCase()}_${d2.toUpperCase()}`;
  const key2 = `${d2.toUpperCase()}_${d1.toUpperCase()}`;
  return raw[key1] || raw[key2] || raw["NOR_PIA"] || Object.values(raw)[0];
}

// GET: Full telemetry comparison
router.get("/compare/:driver1/:driver2", (req, res) => {
  try {
    const data = getTelemetryData(req.params.driver1, req.params.driver2);
    if (!data) {
      return res.status(404).json({ success: false, error: "Telemetry data not found." });
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Speed at a specific distance using Binary Search
router.get("/speed-at-distance", (req, res) => {
  try {
    const { distance, driver1 = "NOR", driver2 = "PIA" } = req.query;
    if (!distance) return res.status(400).json({ success: false, error: "distance query param required" });

    const data = getTelemetryData(driver1, driver2);
    if (!data) return res.status(404).json({ success: false, error: "Telemetry data not found." });

    const result = binarySearchTelemetry(data, parseInt(distance));

    res.json({
      success:           true,
      searched_distance: parseInt(distance),
      closest_point:     result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Sector summary (S1, S2, S3 deltas)
router.get("/sectors/:driver1/:driver2", (req, res) => {
  try {
    const data = getTelemetryData(req.params.driver1, req.params.driver2);
    if (!data) return res.status(404).json({ success: false, error: "Telemetry data not found." });

    const s1 = data.filter((p) => p.distance_m <= 1200);
    const s2 = data.filter((p) => p.distance_m > 1200 && p.distance_m <= 3500);
    const s3 = data.filter((p) => p.distance_m > 3500);

    const avgSpeed = (arr, driverKey) =>
      arr.length === 0
        ? 0
        : Math.round(arr.reduce((sum, p) => sum + p[driverKey].speed, 0) / arr.length);

    res.json({
      success: true,
      sectors: {
        S1: {
          range: "0-1200m",
          driver1_avg: avgSpeed(s1, "driver1"),
          driver2_avg: avgSpeed(s1, "driver2"),
        },
        S2: {
          range: "1200-3500m",
          driver1_avg: avgSpeed(s2, "driver1"),
          driver2_avg: avgSpeed(s2, "driver2"),
        },
        S3: {
          range: "3500-5412m",
          driver1_avg: avgSpeed(s3, "driver1"),
          driver2_avg: avgSpeed(s3, "driver2"),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
