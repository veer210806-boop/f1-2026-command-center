// ============================================================
// routes/budgetRoutes.js — $135M cost cap & upgrade manager
// ============================================================
const express     = require("express");
const router      = express.Router();
const TeamBudget  = require("../models/TeamBudget");
const CarUpgrade  = require("../oop/CarUpgrade");
const { budgetKnapsack } = require("../dsa/sorting");
const path = require("path");
const fs   = require("fs");

const SEED_DIR = path.join(__dirname, "../seed");

// GET all team budgets
router.get("/", async (req, res) => {
  try {
    const teams = await TeamBudget.find().sort({ team: 1 });
    const result = teams.map((t) => ({
      ...t.toObject(),
      remaining: t.total_budget - t.spent,
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET a specific team's budget
router.get("/:team", async (req, res) => {
  try {
    const team = await TeamBudget.findOne({
      team: { $regex: req.params.team, $options: "i" },
    });
    if (!team) return res.status(404).json({ success: false, error: "Team not found" });
    res.json({
      success: true,
      data: { ...team.toObject(), remaining: team.total_budget - team.spent },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Purchase an upgrade for a team
// Body: { team, upgradeName }
router.post("/purchase", async (req, res) => {
  try {
    const { team, upgradeName } = req.body;

    const teamDoc = await TeamBudget.findOne({ team: { $regex: team, $options: "i" } });
    if (!teamDoc) return res.status(404).json({ success: false, error: "Team not found" });

    const remaining = teamDoc.total_budget - teamDoc.spent;

    // Get available upgrades from seed file
    const filePath  = path.join(SEED_DIR, "available_upgrades.json");
    const available = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const upgradeData = available.find((u) => u.name === upgradeName);

    if (!upgradeData) {
      return res.status(404).json({ success: false, error: "Upgrade not found in shop" });
    }

    // Use OOP CarUpgrade class to validate purchase
    const upgrade = new CarUpgrade(upgradeData.name, upgradeData.cost, upgradeData.perf_points);
    const result  = upgrade.purchase(remaining);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    // Update team in DB
    teamDoc.spent += upgradeData.cost;
    teamDoc.upgrades.push({ ...upgradeData, purchased: true });
    await teamDoc.save();

    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Optimal upgrade recommendations using Knapsack (Greedy DSA)
// Query: ?team=McLaren
router.get("/optimizer/:team", async (req, res) => {
  try {
    const teamDoc = await TeamBudget.findOne({
      team: { $regex: req.params.team, $options: "i" },
    });
    if (!teamDoc) return res.status(404).json({ success: false, error: "Team not found" });

    const remaining = teamDoc.total_budget - teamDoc.spent;

    // Get available (unpurchased) upgrades
    const filePath  = path.join(SEED_DIR, "available_upgrades.json");
    const available = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Run knapsack optimizer (Selection Sort + Greedy)
    const result = budgetKnapsack(available, remaining);

    res.json({
      success:          true,
      team:             req.params.team,
      budget_remaining: remaining,
      algorithm:        "Greedy Knapsack (Selection Sort by value ratio)",
      recommendation:   result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Available upgrades shop list
router.get("/shop/list", (req, res) => {
  try {
    const filePath = path.join(SEED_DIR, "available_upgrades.json");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Upgrades not found. Run seed script." });
    }
    const upgrades = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const withRatio = upgrades.map((u) => ({
      ...u,
      value_ratio: parseFloat((u.perf_points / (u.cost / 1000000)).toFixed(2)),
    }));
    res.json({ success: true, count: withRatio.length, data: withRatio });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
