// ============================================================
// routes/seedRoutes.js — Load JSON seed data into MongoDB
// ============================================================
const express       = require("express");
const router        = express.Router();
const path          = require("path");
const fs            = require("fs");
const Driver        = require("../models/Driver");
const Circuit       = require("../models/Circuit");
const RaceSession   = require("../models/RaceSession");
const TeamBudget    = require("../models/TeamBudget");

const SEED_DIR = path.join(__dirname, "../seed");

// POST: Seed all data from JSON seed files
router.post("/all", async (req, res) => {
  try {
    const results = {};

    // 1. Seed Drivers
    const driversFile = path.join(SEED_DIR, "drivers.json");
    if (fs.existsSync(driversFile)) {
      await Driver.deleteMany({});
      const drivers = JSON.parse(fs.readFileSync(driversFile, "utf-8"));
      await Driver.insertMany(drivers);
      results.drivers = `${drivers.length} drivers seeded`;
    }

    // 2. Seed Circuits
    const circuitsFile = path.join(SEED_DIR, "circuits.json");
    if (fs.existsSync(circuitsFile)) {
      await Circuit.deleteMany({});
      const circuits = JSON.parse(fs.readFileSync(circuitsFile, "utf-8"));
      await Circuit.insertMany(circuits);
      results.circuits = `${circuits.length} circuits seeded`;
    }

    // 3. Seed Race Sessions
    const raceFile = path.join(SEED_DIR, "race_session.json");
    if (fs.existsSync(raceFile)) {
      await RaceSession.deleteMany({});
      const sessions = JSON.parse(fs.readFileSync(raceFile, "utf-8"));
      const toInsert = sessions.map((s) => ({
        circuit_name: "Bahrain International Circuit",
        session_type: "RACE",
        driver_code:  s.driver_code,
        laps:         s.laps,
      }));
      await RaceSession.insertMany(toInsert);
      results.race_sessions = `${toInsert.length} driver sessions seeded`;
    }

    // 4. Seed Team Budgets
    const budgetFile = path.join(SEED_DIR, "teams_budget.json");
    if (fs.existsSync(budgetFile)) {
      await TeamBudget.deleteMany({});
      const teams = JSON.parse(fs.readFileSync(budgetFile, "utf-8"));
      await TeamBudget.insertMany(teams);
      results.teams = `${teams.length} teams seeded`;
    }

    res.json({ success: true, message: "Database seeded successfully!", results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Check what seed files exist
router.get("/status", (req, res) => {
  const files = ["drivers.json", "circuits.json", "race_session.json", "teams_budget.json", "telemetry_nor_pia.json", "available_upgrades.json"];
  const status = {};
  for (const file of files) {
    status[file] = fs.existsSync(path.join(SEED_DIR, file)) ? "✅ Ready" : "❌ Missing (run seed script)";
  }
  res.json({ success: true, seed_directory: SEED_DIR, files: status });
});

module.exports = router;
