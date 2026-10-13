// ============================================================
// models/RaceSession.js — Mongoose Schema for Race Lap Data
// ============================================================
const mongoose = require("mongoose");

const LapSchema = new mongoose.Schema({
  lap_number:   { type: Number, required: true },
  driver_code:  { type: String, required: true },
  compound:     { type: String, enum: ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"] },
  tire_age:     { type: Number, default: 0 },
  lap_time:     { type: Number, required: true }, // seconds
  wear_percent: { type: Number, default: 0 },
  is_cliff:     { type: Boolean, default: false },
  pit_stop:     { type: Boolean, default: false },
});

const RaceSessionSchema = new mongoose.Schema(
  {
    circuit_name: { type: String, required: true },
    session_type: { type: String, enum: ["FP1", "FP2", "FP3", "Q1", "Q2", "Q3", "RACE"], default: "RACE" },
    driver_code:  { type: String, required: true },
    laps:         [LapSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RaceSession", RaceSessionSchema);
