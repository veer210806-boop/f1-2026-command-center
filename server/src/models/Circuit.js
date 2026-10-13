// ============================================================
// models/Circuit.js — Mongoose Schema for F1 Circuits & Calendar
// ============================================================
const mongoose = require("mongoose");

const PreviousWinnerSchema = new mongoose.Schema({
  year:   { type: mongoose.Schema.Types.Mixed, required: true },
  driver: { type: String, required: true },
  team:   { type: String, required: true },
  time:   { type: String },
});

const LapRecordSchema = new mongoose.Schema({
  time:   { type: String, required: true },
  driver: { type: String, required: true },
  year:   { type: Number, required: true },
  team:   { type: String },
});

const WeatherSchema = new mongoose.Schema({
  condition:   { type: String },
  air_temp:    { type: Number },
  track_temp:  { type: Number },
  rain_chance: { type: Number },
  icon:        { type: String },
  wind:        { type: String },
  humidity:    { type: String },
});

const CircuitSchema = new mongoose.Schema(
  {
    round:            { type: Number, required: true },
    circuit_id:       { type: String, required: true, unique: true },
    grand_prix_name:  { type: String, required: true },
    circuit_name:     { type: String, required: true },
    city:             { type: String },
    country:          { type: String, required: true },
    flag:             { type: String, default: "🏁" },
    dates:            { type: String },
    month:            { type: String },
    day_range:        { type: String },
    date:             { type: String },
    period:           { type: Number },
    first_gp:         { type: Number },
    circuit_type:     { type: String },
    type_icon:        { type: String },
    laps:             { type: Number, required: true },
    length_km:        { type: Number, required: true },
    corners:          { type: Number, default: 15 },
    drs_zones:        { type: Number, default: 2 },
    compounds:        [String],
    pit_loss_green:   { type: Number, default: 22.0 },
    pit_loss_sc:      { type: Number, default: 12.0 },
    pit_loss_vsc:     { type: Number, default: 14.0 },
    tire_wear:        { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    base_lap_time:    { type: Number, default: 85.0 },
    previous_winners: [PreviousWinnerSchema],
    weather:          WeatherSchema,
    lap_record:       LapRecordSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Circuit", CircuitSchema);
