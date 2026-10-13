// ============================================================
// routes/driverRoutes.js — CRUD for F1 Drivers
// ============================================================
const express = require("express");
const router  = express.Router();
const Driver  = require("../models/Driver");

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ number: 1 });
    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single driver by code (e.g. VER, NOR)
router.get("/:code", async (req, res) => {
  try {
    const driver = await Driver.findOne({ code: req.params.code.toUpperCase() });
    if (!driver) return res.status(404).json({ success: false, error: "Driver not found" });
    res.json({ success: true, data: driver });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new driver
router.post("/", async (req, res) => {
  try {
    const driver = new Driver(req.body);
    const saved  = await driver.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT update a driver by code
router.put("/:code", async (req, res) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!driver) return res.status(404).json({ success: false, error: "Driver not found" });
    res.json({ success: true, data: driver });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE a driver by code
router.delete("/:code", async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({ code: req.params.code.toUpperCase() });
    if (!driver) return res.status(404).json({ success: false, error: "Driver not found" });
    res.json({ success: true, message: `Driver ${req.params.code} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
