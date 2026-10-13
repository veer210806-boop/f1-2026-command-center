// ============================================================
// models/Driver.js — Mongoose Schema for F1 Drivers
// ============================================================
const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true },
    code:              { type: String, required: true, unique: true, maxlength: 3 },
    number:            { type: Number, required: true },
    team:              { type: String, required: true },
    nationality:       { type: String },
    flag:              { type: String, default: "🏁" },
    base_pace:         { type: Number, default: 85.0 },  // seconds per lap at baseline
    tire_mgmt_rating:  { type: Number, min: 0, max: 100, default: 75 },
    points:            { type: Number, default: 0 },
    wins:              { type: Number, default: 0 },
    podiums:           { type: Number, default: 0 },
    championships:     { type: Number, default: 0 },
    photo_url:         { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", DriverSchema);
