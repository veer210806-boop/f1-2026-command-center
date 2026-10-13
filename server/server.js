// ============================================================
// server.js — GP-Command Express Server
// ============================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
const driverRoutes     = require("./src/routes/driverRoutes");
const circuitRoutes    = require("./src/routes/circuitRoutes");
const raceRoutes       = require("./src/routes/raceRoutes");
const strategyRoutes   = require("./src/routes/strategyRoutes");
const telemetryRoutes  = require("./src/routes/telemetryRoutes");
const budgetRoutes     = require("./src/routes/budgetRoutes");
const seedRoutes       = require("./src/routes/seedRoutes");

app.use("/api/drivers",   driverRoutes);
app.use("/api/circuits",  circuitRoutes);
app.use("/api/race",      raceRoutes);
app.use("/api/strategy",  strategyRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/budget",    budgetRoutes);
app.use("/api/seed",      seedRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "🏎️ GP-Command API is running!", status: "OK" });
});

// ── Serve Frontend Production Build ───────────────────────────────────────
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ── MongoDB Connection ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/gpcommand";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected to:", MONGO_URI);
  })
  .catch((err) => {
    console.warn("⚠️ MongoDB connection warning:", err.message);
    console.warn("Server will continue running to serve static assets, but API calls may fail.");
  });

app.listen(PORT, () => {
  console.log(`🏎️  GP-Command server running on http://localhost:${PORT}`);
});
