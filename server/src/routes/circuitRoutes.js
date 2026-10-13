// ============================================================
// routes/circuitRoutes.js — CRUD for F1 Circuits & 2026 Calendar
// ============================================================
const express = require("express");
const router  = express.Router();
const Circuit = require("../models/Circuit");

// GET all circuits (sorted by season round)
router.get("/", async (req, res) => {
  try {
    const circuits = await Circuit.find().sort({ round: 1 });
    res.json({ success: true, count: circuits.length, data: circuits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single circuit by circuit_id or mongo id
router.get("/:idOrCircuitId", async (req, res) => {
  try {
    const param = req.params.idOrCircuitId;
    let circuit = await Circuit.findOne({ circuit_id: param.toLowerCase() });
    if (!circuit && param.match(/^[0-9a-fA-F]{24}$/)) {
      circuit = await Circuit.findById(param);
    }
    if (!circuit) return res.status(404).json({ success: false, error: "Circuit not found" });
    res.json({ success: true, data: circuit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new circuit
router.post("/", async (req, res) => {
  try {
    const circuit = new Circuit(req.body);
    const saved   = await circuit.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT update a circuit
router.put("/:id", async (req, res) => {
  try {
    const circuit = await Circuit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!circuit) return res.status(404).json({ success: false, error: "Circuit not found" });
    res.json({ success: true, data: circuit });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE a circuit
router.delete("/:id", async (req, res) => {
  try {
    const circuit = await Circuit.findByIdAndDelete(req.params.id);
    if (!circuit) return res.status(404).json({ success: false, error: "Circuit not found" });
    res.json({ success: true, message: "Circuit deleted." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
