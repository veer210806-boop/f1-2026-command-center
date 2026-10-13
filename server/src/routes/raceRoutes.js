// ============================================================
// routes/raceRoutes.js — Race session & live timing tower
// ============================================================
const express      = require("express");
const router       = express.Router();
const RaceSession  = require("../models/RaceSession");
const Driver       = require("../models/Driver");
const Circuit      = require("../models/Circuit");
const TireModel    = require("../oop/TireModel");
const { mergeSortByLapTime, getTopFastestLaps } = require("../dsa/sorting");

// GET all race sessions from DB
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await RaceSession.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a specific driver's full lap data for a race
router.get("/session/:driverCode", async (req, res) => {
  try {
    const session = await RaceSession.findOne({
      driver_code: req.params.driverCode.toUpperCase(),
      session_type: "RACE",
    });
    if (!session) return res.status(404).json({ success: false, error: "Race session not found" });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET live timing tower: all 22 drivers calibrated to the selected Grand Prix
router.get("/timing-tower", async (req, res) => {
  try {
    const { lap = 20, circuit = "bahrain" } = req.query;
    const targetLap = parseInt(lap);

    // Fetch circuit details
    let circuitDoc = await Circuit.findOne({ circuit_id: circuit.toLowerCase() });
    if (!circuitDoc) {
      circuitDoc = await Circuit.findOne({ grand_prix_name: new RegExp(circuit, "i") });
    }
    if (!circuitDoc) {
      circuitDoc = await Circuit.findOne().sort({ round: 1 });
    }

    const baseLapRef = circuitDoc ? circuitDoc.base_lap_time : 85.0;
    const timeScaleFactor = baseLapRef / 85.0;
    const maxLaps = circuitDoc ? circuitDoc.laps : 57;

    // Fetch drivers map
    const driversList = await Driver.find();
    const driverMap = {};
    for (const d of driversList) {
      driverMap[d.code] = d;
    }

    const sessions = await RaceSession.find({ session_type: "RACE" });

    const timingData = sessions.map((session) => {
      const driverInfo = driverMap[session.driver_code] || {
        name: session.driver_code,
        team: "Independent",
        number: 0,
        flag: "🏁"
      };

      let totalTime = 0;
      let lastLap   = null;
      let pitStops  = 0;

      for (const lapEntry of session.laps) {
        if (lapEntry.lap_number <= targetLap) {
          const scaledLap = lapEntry.lap_time * timeScaleFactor;
          totalTime += scaledLap;
          lastLap    = { ...lapEntry.toObject(), lap_time: parseFloat(scaledLap.toFixed(3)) };
          if (lapEntry.pit_stop) pitStops++;
        }
      }

      const tire = lastLap ? new TireModel(lastLap.compound) : new TireModel("MEDIUM");

      return {
        driver_code:    session.driver_code,
        driver_name:    driverInfo.name,
        team:           driverInfo.team,
        number:         driverInfo.number,
        flag:           driverInfo.flag,
        total_time:     parseFloat(totalTime.toFixed(3)),
        current_lap:    targetLap,
        max_laps:       maxLaps,
        last_lap_time:  lastLap ? lastLap.lap_time : null,
        compound:       lastLap ? lastLap.compound : "MEDIUM",
        tire_age:       lastLap ? lastLap.tire_age : 0,
        tire_color:     tire.color,
        tire_code:      tire.code,
        wear_percent:   lastLap ? lastLap.wear_percent : 0,
        is_cliff:       lastLap ? lastLap.is_cliff : false,
        pit_stops:      pitStops,
      };
    });

    // Sort by total time using Merge Sort
    const sorted = mergeSortByLapTime(timingData.map(d => ({ ...d, lap_time: d.total_time })));

    // Add positions and gap to leader
    const leader = sorted[0] || { total_time: 0 };
    const withPositions = sorted.map((driver, index) => ({
      position:       index + 1,
      gap_to_leader:  parseFloat((driver.total_time - leader.total_time).toFixed(3)),
      gap_to_ahead:   index === 0 ? 0 : parseFloat((driver.total_time - sorted[index - 1].total_time).toFixed(3)),
      ...driver,
    }));

    res.json({
      success: true,
      lap: targetLap,
      max_laps: maxLaps,
      circuit: circuitDoc ? {
        circuit_id: circuitDoc.circuit_id,
        grand_prix_name: circuitDoc.grand_prix_name,
        circuit_name: circuitDoc.circuit_name,
        country: circuitDoc.country,
        flag: circuitDoc.flag,
        length_km: circuitDoc.length_km,
        corners: circuitDoc.corners,
        drs_zones: circuitDoc.drs_zones,
        pit_loss_green: circuitDoc.pit_loss_green,
        pit_loss_sc: circuitDoc.pit_loss_sc,
        tire_wear: circuitDoc.tire_wear,
      } : null,
      data: withPositions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET top 3 fastest laps of the race
router.get("/fastest-laps", async (req, res) => {
  try {
    const sessions  = await RaceSession.find({ session_type: "RACE" });
    const allLaps   = [];

    for (const session of sessions) {
      for (const lap of session.laps) {
        allLaps.push({
          driver_code: session.driver_code,
          lap_number:  lap.lap_number,
          lap_time:    lap.lap_time,
          compound:    lap.compound,
        });
      }
    }

    const fastest = getTopFastestLaps(allLaps, 3);
    res.json({ success: true, data: fastest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET tire degradation curve for a compound
router.get("/tire-curve/:compound", (req, res) => {
  try {
    const tire  = new TireModel(req.params.compound.toUpperCase());
    const curve = tire.simulateStint(84.5, tire.baseLife);
    res.json({ success: true, compound: tire.compound, data: curve });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
