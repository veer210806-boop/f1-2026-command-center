// ============================================================
// routes/strategyRoutes.js — Pit strategy & undercut advisor
// ============================================================
const express          = require("express");
const router           = express.Router();
const StrategyAdvisor  = require("../oop/StrategyAdvisor");
const TireModel        = require("../oop/TireModel");

// POST: Evaluate undercut/overcut for a driver
// Body: { gapToCarAhead, driverTireAge, rivalTireAge, driverCompound, rivalCompound, pitCondition }
router.post("/undercut", (req, res) => {
  try {
    const {
      gapToCarAhead,
      driverTireAge,
      rivalTireAge,
      driverCompound,
      rivalCompound,
      pitCondition,
      circuitPitLossGreen,
      circuitPitLossSC,
    } = req.body;

    const advisor = new StrategyAdvisor(
      circuitPitLossGreen || 22.0,
      circuitPitLossSC    || 12.0
    );

    const result = advisor.evaluateUndercut({
      gapToCarAhead:   parseFloat(gapToCarAhead),
      driverTireAge:   parseInt(driverTireAge),
      rivalTireAge:    parseInt(rivalTireAge),
      driverCompound:  driverCompound || "MEDIUM",
      rivalCompound:   rivalCompound  || "MEDIUM",
      pitCondition:    pitCondition   || "GREEN",
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST: Compare two race strategies
// Body: { basePace, strategy1: [{compound, laps}], strategy2: [{compound, laps}], totalLaps }
router.post("/compare", (req, res) => {
  try {
    const { basePace, strategy1, strategy2, totalLaps } = req.body;
    const advisor = new StrategyAdvisor();
    const result  = advisor.compareStrategies(
      parseFloat(basePace),
      strategy1,
      strategy2,
      parseInt(totalLaps)
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET: Simulate stint for a compound and base pace
// Query: ?compound=SOFT&basePace=84.5&laps=20
router.get("/stint", (req, res) => {
  try {
    const { compound = "MEDIUM", basePace = 84.5, laps = 30 } = req.query;
    const tire   = new TireModel(compound.toUpperCase());
    const stint  = tire.simulateStint(parseFloat(basePace), parseInt(laps));
    res.json({ success: true, compound: tire.compound, tire_info: tire.getInfo(), data: stint });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET: All tire compound info
router.get("/tires", (req, res) => {
  const compounds = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];
  const tireInfo  = compounds.map((c) => new TireModel(c).getInfo());
  res.json({ success: true, data: tireInfo });
});

module.exports = router;
