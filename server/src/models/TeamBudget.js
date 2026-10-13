// ============================================================
// models/TeamBudget.js — Mongoose Schema for 11 F1 Teams & Budget
// ============================================================
const mongoose = require("mongoose");

const UpgradeSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  cost:         { type: Number, required: true },
  perf_points:  { type: Number, required: true },
  purchased:    { type: Boolean, default: false },
});

const TeamBudgetSchema = new mongoose.Schema(
  {
    team:            { type: String, required: true, unique: true },
    full_name:       { type: String, required: true },
    short_code:      { type: String },
    primary_color:   { type: String, default: "#E10600" },
    secondary_color: { type: String, default: "#FFFFFF" },
    team_principal:  { type: String },
    power_unit:      { type: String },
    base_location:   { type: String },
    car_model:       { type: String },
    championships:   { type: Number, default: 0 },
    drivers:         [{ type: String }],
    total_budget:    { type: Number, default: 135000000 }, // $135M cap
    spent:           { type: Number, default: 0 },
    car_image_url:   { type: String, default: "" },
    logo_url:        { type: String, default: "" },
    upgrades:        [UpgradeSchema],
  },
  { timestamps: true }
);

// Virtual: remaining budget
TeamBudgetSchema.virtual("remaining").get(function () {
  return this.total_budget - this.spent;
});

module.exports = mongoose.model("TeamBudget", TeamBudgetSchema);
