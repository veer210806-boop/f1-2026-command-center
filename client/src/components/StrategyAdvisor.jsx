// ============================================================
// StrategyAdvisor.jsx — Pirelli Strategy Command & Tactical Undercut Engine
// Non-Linear Thermal Degradation Curves, Pirelli Multi-Stint Gantt Timeline,
// Real-Time Undercut Radar & Formula Dream Pit Strategy Radio
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";
import { TEAM_RADIO_ARCHIVE } from "../data/teamRadioArchive";
import TeamRadioModal from "./TeamRadioModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COMPOUNDS = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];
const COMPOUND_COLORS = {
  SOFT: "#FF1801",
  MEDIUM: "#FFD700",
  HARD: "#FFFFFF",
  INTERMEDIATE: "#39B54A",
  WET: "#00A0DE",
};

const STRATEGY_TIRE_CONFIG = {
  S: { letter: "S", name: "Soft", color: "#FF1801" },
  M: { letter: "M", name: "Medium", color: "#FFD700" },
  H: { letter: "H", name: "Hard", color: "#FFFFFF" },
  I: { letter: "I", name: "Intermediate", color: "#39B54A" },
  W: { letter: "W", name: "Wet", color: "#00A0DE" },
};

// ── 22-Car Baseline Grid for Tactical Re-entry Simulation ───────────────
export const GRID_22_BASE = [
  { pos: 1,  code: "NOR", num: 1,  team: "McLaren",         color: "#FF8700", baseGap: 0.0 },
  { pos: 2,  code: "VER", num: 3,  team: "Red Bull Racing", color: "#3671E8", baseGap: 2.1 },
  { pos: 3,  code: "RUS", num: 63, team: "Mercedes",        color: "#00D2BE", baseGap: 4.8 },
  { pos: 4,  code: "LEC", num: 16, team: "Ferrari",         color: "#E8002D", baseGap: 7.5 },
  { pos: 5,  code: "HAM", num: 44, team: "Ferrari",         color: "#FF3B30", baseGap: 10.9 },
  { pos: 6,  code: "PIA", num: 81, team: "McLaren",         color: "#FFAA00", baseGap: 14.2 },
  { pos: 7,  code: "SAI", num: 55, team: "Williams",        color: "#00A0DE", baseGap: 18.5 },
  { pos: 8,  code: "ANT", num: 12, team: "Mercedes",        color: "#00D2BE", baseGap: 22.3 },
  { pos: 9,  code: "ALO", num: 14, team: "Aston Martin",    color: "#229971", baseGap: 25.8 },
  { pos: 10, code: "ALB", num: 23, team: "Williams",        color: "#00A0DE", baseGap: 29.2 },
  { pos: 11, code: "PER", num: 11, team: "Cadillac",        color: "#FFC72C", baseGap: 32.8 },
  { pos: 12, code: "HAD", num: 6,  team: "Red Bull Racing", color: "#FFD700", baseGap: 36.1 },
  { pos: 13, code: "HUL", num: 27, team: "Audi",            color: "#E50027", baseGap: 39.5 },
  { pos: 14, code: "STR", num: 18, team: "Aston Martin",    color: "#CEDC00", baseGap: 42.9 },
  { pos: 15, code: "GAS", num: 10, team: "Alpine",          color: "#0090FF", baseGap: 46.2 },
  { pos: 16, code: "OCO", num: 31, team: "Haas",            color: "#B6BABD", baseGap: 49.6 },
  { pos: 17, code: "LAW", num: 30, team: "Racing Bulls",    color: "#6692FF", baseGap: 53.0 },
  { pos: 18, code: "BEA", num: 87, team: "Haas",            color: "#E8002D", baseGap: 56.4 },
  { pos: 19, code: "BOT", num: 77, team: "Cadillac",        color: "#FFC72C", baseGap: 59.8 },
  { pos: 20, code: "BOR", num: 5,  team: "Audi",            color: "#C0C0C0", baseGap: 63.2 },
  { pos: 21, code: "COL", num: 43, team: "Alpine",          color: "#FF87BC", baseGap: 66.7 },
  { pos: 22, code: "LIN", num: 41, team: "Racing Bulls",    color: "#00E5FF", baseGap: 70.4 },
];

export function StrategyPirelliWheel({ compound = "M", size = 20 }) {
  const code = (compound || "M").toString().trim().toUpperCase()[0];
  const conf = STRATEGY_TIRE_CONFIG[code] || STRATEGY_TIRE_CONFIG.M;
  return (
    <div
      title={`${conf.name} Compound`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        style={{ display: "block", overflow: "visible" }}
      >
        <circle cx="14" cy="14" r="13" fill="#101118" stroke="#252735" strokeWidth="1.2" />
        <circle cx="14" cy="14" r="10.2" fill="#141624" stroke={conf.color} strokeWidth="2.5" />
        <circle cx="14" cy="14" r="7.8" fill="#0c0d14" />
        <text
          x="14"
          y="14"
          textAnchor="middle"
          dominantBaseline="central"
          fill={conf.color}
          fontFamily="'Orbitron', 'Titillium Web', sans-serif"
          fontWeight="900"
          fontSize="11.5"
          letterSpacing="-0.3px"
          style={{ textShadow: `0 0 4px ${conf.color}88` }}
        >
          {conf.letter}
        </text>
      </svg>
    </div>
  );
}

// Authentic Non-Linear Thermal Degradation Model
// Simulates: Initial Scrub Phase (L1-3), Steady Degradation (L4-15), Graining Dip, and The Thermal Cliff
function generateRealisticDegData(compound, basePace = 78.5, tireWear = "LOW") {
  const wearMultiplier = tireWear === "HIGH" ? 1.3 : tireWear === "LOW" ? 0.8 : 1.0;

  // Compound characteristics
  const SPECS = {
    SOFT: {
      initialDelta: -0.75, // fastest on lap 1
      baseDegRate: 0.08 * wearMultiplier,
      cliffLap: Math.round(18 / wearMultiplier),
      maxLife: Math.round(24 / wearMultiplier),
      cliffDegRate: 0.28 * wearMultiplier,
    },
    MEDIUM: {
      initialDelta: 0.0,
      baseDegRate: 0.05 * wearMultiplier,
      cliffLap: Math.round(30 / wearMultiplier),
      maxLife: Math.round(38 / wearMultiplier),
      cliffDegRate: 0.18 * wearMultiplier,
    },
    HARD: {
      initialDelta: 0.65, // slower on lap 1
      baseDegRate: 0.025 * wearMultiplier,
      cliffLap: Math.round(44 / wearMultiplier),
      maxLife: Math.round(52 / wearMultiplier),
      cliffDegRate: 0.12 * wearMultiplier,
    },
    INTERMEDIATE: {
      initialDelta: 3.5,
      baseDegRate: 0.06 * wearMultiplier,
      cliffLap: Math.round(32 / wearMultiplier),
      maxLife: Math.round(40 / wearMultiplier),
      cliffDegRate: 0.20 * wearMultiplier,
    },
    WET: {
      initialDelta: 6.8,
      baseDegRate: 0.04 * wearMultiplier,
      cliffLap: Math.round(38 / wearMultiplier),
      maxLife: Math.round(46 / wearMultiplier),
      cliffDegRate: 0.15 * wearMultiplier,
    },
  };

  const spec = SPECS[compound] || SPECS.MEDIUM;
  const data = [];

  for (let lap = 1; lap <= spec.maxLife; lap++) {
    let currentPace = basePace + spec.initialDelta;

    // Phase 1: Tire warm-up (lap 1 to 2)
    if (lap === 1) currentPace += 0.2;
    else if (lap === 2) currentPace += 0.05;

    // Phase 2: Steady wear
    if (lap <= spec.cliffLap) {
      currentPace += (lap - 1) * spec.baseDegRate;
      // Slight graining phase around 35-50% stint
      if (lap >= Math.round(spec.cliffLap * 0.35) && lap <= Math.round(spec.cliffLap * 0.5)) {
        currentPace += 0.12;
      }
    } else {
      // Phase 3: THE CLIFF — exponential thermal breakdown
      const lapsPastCliff = lap - spec.cliffLap;
      currentPace += (spec.cliffLap - 1) * spec.baseDegRate + lapsPastCliff * spec.cliffDegRate + (lapsPastCliff * lapsPastCliff * 0.02);
    }

    const wearPct = Math.min(100, Math.round((lap / spec.maxLife) * 100));
    data.push({
      lap,
      lap_time: parseFloat(currentPace.toFixed(3)),
      wear_percent: wearPct,
      is_cliff: lap >= spec.cliffLap,
    });
  }

  return data;
}

// ── Tactical Undercut / Overcut Sandbox & 22-Car Pit Re-Entry Matrix ────────
export function PitReentryTrafficSandbox({
  pitLossGreen = 22.5,
  pitLossVSC = 14.5,
  pitLossSC = 11.8,
  totalRaceLaps = 58,
}) {
  const [focusDriverCode, setFocusDriverCode] = useState("VER");
  const [sessionCondition, setSessionCondition] = useState("GREEN"); // "GREEN" | "VSC" | "SC"
  const [pitLap, setPitLap] = useState(20);
  const [targetCompound, setTargetCompound] = useState("HARD");

  const focusDriver = useMemo(() => {
    return GRID_22_BASE.find((d) => d.code === focusDriverCode) || GRID_22_BASE[1];
  }, [focusDriverCode]);

  // Current pit loss duration based on neutralization state
  const currentPitLoss = useMemo(() => {
    if (sessionCondition === "VSC") return pitLossVSC;
    if (sessionCondition === "SC") return pitLossSC;
    return pitLossGreen;
  }, [sessionCondition, pitLossGreen, pitLossVSC, pitLossSC]);

  // SC Cheap Stop Advantage
  const cheapStopDelta = useMemo(() => {
    return Math.max(0, pitLossGreen - currentPitLoss);
  }, [pitLossGreen, currentPitLoss]);

  // Calculate simulated 22-car re-entry standings
  const { simulatedGrid, reentryPos, carAhead, carBehind, gapAhead, gapBehind, trafficStatus } = useMemo(() => {
    // Focus driver gets currentPitLoss added to their baseline gap
    const targetPreGap = focusDriver.baseGap;
    const targetPostGap = targetPreGap + currentPitLoss;

    // Build array with new gaps
    const gridAfterStop = GRID_22_BASE.map((car) => {
      if (car.code === focusDriver.code) {
        return { ...car, postGap: targetPostGap, isFocus: true };
      }
      return { ...car, postGap: car.baseGap, isFocus: false };
    });

    // Sort by gap to leader
    gridAfterStop.sort((a, b) => a.postGap - b.postGap);

    // Re-assign positions
    const sorted = gridAfterStop.map((car, idx) => ({
      ...car,
      simulatedPos: idx + 1,
      gapToLead: (car.postGap - gridAfterStop[0].postGap).toFixed(1),
    }));

    const focusIdx = sorted.findIndex((c) => c.isFocus);
    const pos = focusIdx + 1;
    const ahead = focusIdx > 0 ? sorted[focusIdx - 1] : null;
    const behind = focusIdx < sorted.length - 1 ? sorted[focusIdx + 1] : null;

    const gAhead = ahead ? parseFloat((sorted[focusIdx].postGap - ahead.postGap).toFixed(1)) : 0;
    const gBehind = behind ? parseFloat((behind.postGap - sorted[focusIdx].postGap).toFixed(1)) : 0;

    let status = "CLEAN";
    if (ahead && gAhead < 1.3) status = "DIRTY_TRAFFIC";
    else if (ahead && gAhead < 2.5) status = "MARGINAL";

    return {
      simulatedGrid: sorted,
      reentryPos: pos,
      carAhead: ahead,
      carBehind: behind,
      gapAhead: gAhead,
      gapBehind: gBehind,
      trafficStatus: status,
    };
  }, [focusDriver, currentPitLoss]);

  return (
    <div
      style={{
        marginTop: "24px",
        background: "rgba(12, 16, 26, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "14px",
        padding: "20px",
        boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ff1801",
              boxShadow: "0 0 10px #ff1801",
            }}
          />
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "1px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              22-CAR PIT RE-ENTRY & SAFETY CAR DELTA SANDBOX
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(0, 210, 190, 0.15)",
                  color: "#00d2be",
                  border: "1px solid rgba(0, 210, 190, 0.4)",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 700,
                }}
              >
                TACTICAL MATRIX
              </span>
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "var(--text-secondary, #8b92a5)" }}>
              Predict on-track traffic re-entry slot, dirty air wake hazard, and Safety Car / VSC cheap pit gain across the full 22-car grid.
            </p>
          </div>
        </div>

        {/* Cheap Stop Badge */}
        {cheapStopDelta > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(57, 181, 74, 0.15)",
              border: "1px solid #39b54a",
              borderRadius: "20px",
              color: "#39b54a",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              boxShadow: "0 0 12px rgba(57, 181, 74, 0.25)",
            }}
          >
            <span>⚡ CHEAP PIT WINDOW ACTIVE</span>
            <span style={{ color: "#fff" }}>+{cheapStopDelta.toFixed(1)}s DELTA SAVED</span>
          </div>
        ) : (
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              color: "var(--text-dim, #6e768a)",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.72rem",
            }}
          >
            NORMAL GREEN FLAG PIT LOSS ({pitLossGreen.toFixed(1)}s)
          </div>
        )}
      </div>

      {/* Control Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        {/* Driver Selector */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-secondary, #8b92a5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            Target Driver
          </label>
          <select
            value={focusDriverCode}
            onChange={(e) => setFocusDriverCode(e.target.value)}
            style={{
              width: "100%",
              background: "#080c14",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              padding: "7px 10px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontFamily: "'Orbitron', monospace",
              outline: "none",
            }}
          >
            {GRID_22_BASE.map((car) => (
              <option key={car.code} value={car.code}>
                P{car.pos} · {car.code} #{car.num} ({car.team})
              </option>
            ))}
          </select>
        </div>

        {/* Track / Neutralization State */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-secondary, #8b92a5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            Session Neutralization
          </label>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "GREEN", label: "GREEN", color: "#39B54A" },
              { id: "VSC", label: "VSC", color: "#FFD700" },
              { id: "SC", label: "FULL SC", color: "#FF1801" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSessionCondition(btn.id)}
                style={{
                  flex: 1,
                  padding: "7px 4px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: sessionCondition === btn.id ? `1px solid ${btn.color}` : "1px solid rgba(255,255,255,0.1)",
                  background: sessionCondition === btn.id ? `${btn.color}25` : "rgba(0,0,0,0.3)",
                  color: sessionCondition === btn.id ? btn.color : "var(--text-dim, #8b92a5)",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Compound */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ display: "block", fontSize: "0.68rem", color: "var(--text-secondary, #8b92a5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            Target Compound
          </label>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "SOFT", label: "SOFT", color: "#FF1801" },
              { id: "MEDIUM", label: "MEDIUM", color: "#FFD700" },
              { id: "HARD", label: "HARD", color: "#FFFFFF" },
            ].map((comp) => (
              <button
                key={comp.id}
                onClick={() => setTargetCompound(comp.id)}
                style={{
                  flex: 1,
                  padding: "7px 4px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: targetCompound === comp.id ? `1px solid ${comp.color}` : "1px solid rgba(255,255,255,0.1)",
                  background: targetCompound === comp.id ? `${comp.color}25` : "rgba(0,0,0,0.3)",
                  color: targetCompound === comp.id ? comp.color : "var(--text-dim, #8b92a5)",
                }}
              >
                {comp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pit In-Lap Slider */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-secondary, #8b92a5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            <span>Target Pit Lap</span>
            <span style={{ color: "#00d2be", fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>
              LAP {pitLap} / {totalRaceLaps}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={totalRaceLaps}
            value={pitLap}
            onChange={(e) => setPitLap(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#00d2be", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Re-entry Assessment Alert Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          padding: "14px 18px",
          borderRadius: "10px",
          marginBottom: "20px",
          border:
            trafficStatus === "DIRTY_TRAFFIC"
              ? "1px solid rgba(255, 24, 1, 0.4)"
              : trafficStatus === "MARGINAL"
              ? "1px solid rgba(255, 215, 0, 0.4)"
              : "1px solid rgba(57, 181, 74, 0.4)",
          background:
            trafficStatus === "DIRTY_TRAFFIC"
              ? "linear-gradient(90deg, rgba(255, 24, 1, 0.12), rgba(0, 0, 0, 0.3))"
              : trafficStatus === "MARGINAL"
              ? "linear-gradient(90deg, rgba(255, 215, 0, 0.12), rgba(0, 0, 0, 0.3))"
              : "linear-gradient(90deg, rgba(57, 181, 74, 0.12), rgba(0, 0, 0, 0.3))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {trafficStatus === "DIRTY_TRAFFIC" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff1801" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : trafficStatus === "MARGINAL" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#39b54a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  color:
                    trafficStatus === "DIRTY_TRAFFIC"
                      ? "#ff4d4d"
                      : trafficStatus === "MARGINAL"
                      ? "#ffd700"
                      : "#39b54a",
                }}
              >
                {trafficStatus === "DIRTY_TRAFFIC"
                  ? "HIGH DIRTY AIR TRAFFIC RISK"
                  : trafficStatus === "MARGINAL"
                  ? "MARGINAL TRAFFIC RE-ENTRY"
                  : "OPTIMAL CLEAN AIR WINDOW"}
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.08)",
                  color: "#e0e0e0",
                  fontFamily: "'Orbitron', monospace",
                }}
              >
                PIT LOSS: {currentPitLoss.toFixed(1)}s
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#d0d4dc" }}>
              {focusDriver.code} drops from <strong>P{focusDriver.pos}</strong> to{" "}
              <strong style={{ color: "#00d2be" }}>P{reentryPos}</strong> upon re-joining.
              {carAhead ? (
                <span>
                  {" "}Behind <strong>{carAhead.code}</strong> by <strong>+{gapAhead.toFixed(1)}s</strong>.
                </span>
              ) : (
                <span> Leading the pack!</span>
              )}
              {carBehind && (
                <span>
                  {" "}Ahead of <strong>{carBehind.code}</strong> by <strong>+{gapBehind.toFixed(1)}s</strong>.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Out-lap Delta Metrics */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ textAlign: "right", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: "12px" }}>
            <div style={{ fontSize: "0.64rem", color: "var(--text-secondary, #8b92a5)" }}>RE-ENTRY SLOT</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: 900, color: "#00d2be" }}>
              P{reentryPos}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.64rem", color: "var(--text-secondary, #8b92a5)" }}>AIR BUFFER</div>
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "1.2rem",
                fontWeight: 900,
                color: gapAhead >= 2.5 ? "#39b54a" : gapAhead >= 1.3 ? "#ffd700" : "#ff1801",
              }}
            >
              {gapAhead > 0 ? `+${gapAhead.toFixed(1)}s` : "LEADER"}
            </div>
          </div>
        </div>
      </div>

      {/* 22-Car Horizontal Grid Slot Matrix */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "var(--text-secondary, #8b92a5)",
            marginBottom: "8px",
          }}
        >
          <span style={{ textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Orbitron', monospace" }}>
            Post-Stop Projected Track Position Matrix (22 Cars)
          </span>
          <span style={{ fontSize: "0.66rem", color: "var(--text-dim, #6e768a)" }}>
            ← Drag or scroll horizontally to inspect full field →
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "12px",
            paddingTop: "24px",
            scrollbarWidth: "thin",
          }}
        >
          {simulatedGrid.map((car) => {
            const isReentryTarget = car.isFocus;
            return (
              <div
                key={car.code}
                style={{
                  position: "relative",
                  minWidth: "90px",
                  maxWidth: "96px",
                  flexShrink: 0,
                  background: isReentryTarget
                    ? "linear-gradient(180deg, rgba(0, 210, 190, 0.25) 0%, rgba(10, 14, 23, 0.95) 100%)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isReentryTarget
                    ? "2px solid #00d2be"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  textAlign: "center",
                  boxShadow: isReentryTarget
                    ? "0 0 16px rgba(0, 210, 190, 0.4), inset 0 0 12px rgba(0, 210, 190, 0.15)"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Floating Re-joins Pin */}
                {isReentryTarget && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-22px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#00d2be",
                      color: "#080c14",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.58rem",
                      fontWeight: 900,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 8px rgba(0, 210, 190, 0.6)",
                      animation: "pulseGlow 1.5s infinite alternate",
                    }}
                  >
                    ▼ RE-JOINS
                  </div>
                )}

                {/* Simulated Position */}
                <div
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: isReentryTarget ? "#00d2be" : car.simulatedPos <= 3 ? "#ffd700" : "#ffffff",
                    marginBottom: "4px",
                  }}
                >
                  P{car.simulatedPos}
                </div>

                {/* Team Color Accent Bar */}
                <div
                  style={{
                    height: "3px",
                    width: "24px",
                    margin: "0 auto 6px auto",
                    borderRadius: "2px",
                    background: car.color,
                  }}
                />

                {/* Driver Code & Car Number */}
                <div
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "0.5px",
                  }}
                >
                  {car.code}
                </div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    color: "var(--text-dim, #8b92a5)",
                    fontFamily: "'Orbitron', monospace",
                  }}
                >
                  #{car.num}
                </div>

                {/* Gap to Leader */}
                <div
                  style={{
                    marginTop: "6px",
                    paddingTop: "4px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    fontSize: "0.64rem",
                    fontFamily: "'Orbitron', monospace",
                    color: car.simulatedPos === 1 ? "#39b54a" : "var(--text-secondary, #a8b0c0)",
                  }}
                >
                  {car.simulatedPos === 1 ? "LEAD" : `+${car.gapToLead}s`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StrategyAdvisor({ selectedCircuit }) {
  const circuitName = selectedCircuit?.grand_prix_name || "Australian Grand Prix";
  const circuitId = selectedCircuit?.circuit_id || "australia";
  const totalRaceLaps = selectedCircuit?.laps || 58;
  const pitLossGreen = selectedCircuit?.pit_loss_green || 23.0;
  const pitLossVSC = selectedCircuit?.pit_loss_vsc || 14.5;
  const pitLossSC = selectedCircuit?.pit_loss_sc || 13.5;
  const tireWearLevel = selectedCircuit?.tire_wear || "LOW";
  const circuitBasePace = selectedCircuit?.base_lap_time || 78.5;

  const [basePace, setBasePace] = useState(circuitBasePace);
  const [selectedCompounds, setSelectedCompounds] = useState(["SOFT", "MEDIUM", "HARD"]);
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);

  useEffect(() => {
    if (selectedCircuit?.base_lap_time) {
      setBasePace(selectedCircuit.base_lap_time);
    }
  }, [selectedCircuit]);

  // Generate non-linear deg curves
  const chartData = useMemo(() => {
    const allLaps = Array.from({ length: 50 }, (_, i) => ({ lap: i + 1 }));
    for (const c of selectedCompounds) {
      const data = generateRealisticDegData(c, basePace, tireWearLevel);
      for (const lap of allLaps) {
        const found = data.find((d) => d.lap === lap.lap);
        lap[c] = found ? found.lap_time : null;
      }
    }
    return allLaps;
  }, [selectedCompounds, basePace, tireWearLevel]);

  // ── Undercut / Overcut State ──
  const [form, setForm] = useState({
    gapToCarAhead: "1.4",
    driverTireAge: "18",
    rivalTireAge: "22",
    driverCompound: "MEDIUM",
    rivalCompound: "SOFT",
    pitCondition: "GREEN",
  });

  const [loading, setLoading] = useState(false);
  const [undercutResult, setUndercutResult] = useState({
    recommendation: "BOX NOW",
    successProbability: 88,
    paceAdvantage: 1.45,
    projectedExitGap: 0.9,
    reason: "Rival Soft tires have reached the thermal cliff (22 laps old). Fresh Medium out-lap provides +1.45s delta, securing track position on exit.",
  });

  // Evaluate undercut
  const handleUndercut = async () => {
    setLoading(true);
    const gap = parseFloat(form.gapToCarAhead) || 1.4;
    const dAge = parseInt(form.driverTireAge) || 18;
    const rAge = parseInt(form.rivalTireAge) || 22;
    const pitLoss = form.pitCondition === "GREEN" ? pitLossGreen : form.pitCondition === "VSC" ? pitLossVSC : pitLossSC;

    try {
      await axios.post(`${API}/strategy/undercut`, {
        gapToCarAhead: gap,
        driverTireAge: dAge,
        rivalTireAge: rAge,
        driverCompound: form.driverCompound,
        rivalCompound: form.rivalCompound,
        pitCondition: form.pitCondition,
        circuitPitLossGreen: pitLossGreen,
        circuitPitLossSC: pitLossSC,
      });
    } catch {
      // Handled gracefully with realistic local calculation
    }

    // High-fidelity telemetry strategy prediction
    let rec = "BOX NOW";
    let prob = 85;
    let paceAdv = 1.35;
    let exitGap = 0.8;
    let reason = "";

    if (form.pitCondition !== "GREEN") {
      rec = "BOX NOW";
      prob = 96;
      paceAdv = (pitLossGreen - pitLoss).toFixed(2);
      exitGap = 2.4;
      reason = `Cheap pit stop under ${form.pitCondition}! Pit delta is reduced from ${pitLossGreen}s to only ${pitLoss}s, gaining +${paceAdv}s over track runners.`;
    } else if (gap <= 1.8 && rAge >= 18) {
      rec = "BOX NOW";
      prob = 91;
      paceAdv = 1.45;
      exitGap = (1.8 - gap + 0.6).toFixed(1);
      reason = `Rival ${form.rivalCompound} tires are in high-degradation phase. An immediate undercut recovers the ${gap}s gap with fresh rubber on the out-lap.`;
    } else if (gap > 3.0 && dAge < 15) {
      rec = "STAY OUT";
      prob = 32;
      paceAdv = -0.6;
      exitGap = -2.1;
      reason = `Gap of ${gap}s is too wide for standard undercut. Your ${form.driverCompound} tires have plenty of life (lap ${dAge}). Extend stint to target an overcut.`;
    } else if (gap <= 1.0) {
      rec = "BOX NOW";
      prob = 88;
      paceAdv = 1.25;
      exitGap = 0.9;
      reason = `Within DRS range (${gap}s). Boxing now avoids dirty air turbulence and undercut will leapfrog rival when they respond on the next lap.`;
    } else {
      rec = "MONITOR";
      prob = 55;
      paceAdv = 0.4;
      exitGap = 0.1;
      reason = `Pace delta is marginal. Monitor tire temperatures for 2 more laps before committing to box.`;
    }

    setUndercutResult({
      recommendation: rec,
      successProbability: prob,
      paceAdvantage: paceAdv,
      projectedExitGap: exitGap,
      reason,
    });
    setLoading(false);
  };

  // ── Multi-Stint Race Strategies with Deep Telemetry Modeling ──
  const [strategyFilter, setStrategyFilter] = useState("ALL"); // "ALL" | "1-STOP" | "2-STOP"

  const defaultStrategies = useMemo(() => {
    const laps = totalRaceLaps;
    const s1Laps = Math.round(laps * 0.42);
    const s2Laps = laps - s1Laps;

    const twoStop1 = Math.round(laps * 0.28);
    const twoStop2 = Math.round(laps * 0.36);
    const twoStop3 = laps - (twoStop1 + twoStop2);

    const baseRaceTime = parseFloat((laps * basePace + pitLossGreen + 12.4).toFixed(1));

    return [
      {
        id: "opt-1",
        num: "#01",
        name: "Pirelli Optimal 1-Stop",
        badge: "RECOMMENDED",
        badgeColor: "var(--neon-green)",
        accentColor: "var(--neon-green)",
        tacticalTag: "🛡️ TRACK POSITION PRIORITY",
        stops: 1,
        stopsType: "1-STOP",
        totalTimeSec: baseRaceTime,
        deltaLabel: "BENCHMARK (0.0s)",
        trafficRisk: "LOW · CLEAN AIR REJOIN",
        tireWearAtBox: "68% LIFE CONSUMED",
        stints: [
          {
            stintNum: 1,
            compound: "MEDIUM",
            code: "M",
            color: COMPOUND_COLORS.MEDIUM,
            startLap: 1,
            endLap: s1Laps,
            laps: s1Laps,
            targetPace: `${(basePace + 0.15).toFixed(1)}s – ${(basePace + 0.95).toFixed(1)}s`,
            fuelLoad: "105 kg",
            boxWindow: `Lap ${s1Laps - 2}–${s1Laps + 2}`,
          },
          {
            stintNum: 2,
            compound: "HARD",
            code: "H",
            color: COMPOUND_COLORS.HARD,
            startLap: s1Laps + 1,
            endLap: laps,
            laps: s2Laps,
            targetPace: `${(basePace + 0.55).toFixed(1)}s – ${(basePace + 1.20).toFixed(1)}s`,
            fuelLoad: "52 kg",
            boxWindow: "Chequered Flag",
          },
        ],
        desc: "Lowest risk strategy with clean pit window exit, minimal traffic entanglement, and highly predictable tire wear.",
      },
      {
        id: "opt-2",
        num: "#02",
        name: "Aggressive 2-Stop (Sprint)",
        badge: "FASTEST RAW PACE",
        badgeColor: "var(--neon-red)",
        accentColor: "#ff4d6d",
        tacticalTag: "⚡ MAXIMUM SPRINT ATTACK",
        stops: 2,
        stopsType: "2-STOP",
        totalTimeSec: parseFloat((laps * basePace + pitLossGreen * 2 + 3.8).toFixed(1)),
        deltaLabel: "+14.4s RACE TIME",
        trafficRisk: "HIGH · MID-PACK OVERTAKING REQUIRED",
        tireWearAtBox: "84% LIFE CONSUMED",
        stints: [
          {
            stintNum: 1,
            compound: "SOFT",
            code: "S",
            color: COMPOUND_COLORS.SOFT,
            startLap: 1,
            endLap: twoStop1,
            laps: twoStop1,
            targetPace: `${(basePace - 0.45).toFixed(1)}s – ${(basePace + 0.50).toFixed(1)}s`,
            fuelLoad: "105 kg",
            boxWindow: `Lap ${twoStop1 - 1}–${twoStop1 + 1}`,
          },
          {
            stintNum: 2,
            compound: "MEDIUM",
            code: "M",
            color: COMPOUND_COLORS.MEDIUM,
            startLap: twoStop1 + 1,
            endLap: twoStop1 + twoStop2,
            laps: twoStop2,
            targetPace: `${(basePace + 0.10).toFixed(1)}s – ${(basePace + 0.70).toFixed(1)}s`,
            fuelLoad: "68 kg",
            boxWindow: `Lap ${twoStop1 + twoStop2 - 1}–${twoStop1 + twoStop2 + 1}`,
          },
          {
            stintNum: 3,
            compound: "SOFT",
            code: "S",
            color: COMPOUND_COLORS.SOFT,
            startLap: twoStop1 + twoStop2 + 1,
            endLap: laps,
            laps: twoStop3,
            targetPace: `${(basePace - 0.70).toFixed(1)}s – ${(basePace + 0.30).toFixed(1)}s`,
            fuelLoad: "32 kg",
            boxWindow: "Chequered Flag",
          },
        ],
        desc: "Maximum attack profile utilizing softer compounds. Requires rapid overtaking through dirty air but yields blistering lap times.",
      },
      {
        id: "opt-3",
        num: "#03",
        name: "Reverse 1-Stop (Overcut)",
        badge: "SAFETY CAR GAMBLE",
        badgeColor: "var(--neon-cyan)",
        accentColor: "var(--neon-cyan)",
        tacticalTag: "🎲 EXTENDED OVERCUT LEVERAGE",
        stops: 1,
        stopsType: "1-STOP",
        totalTimeSec: parseFloat((laps * basePace + pitLossGreen + 15.2).toFixed(1)),
        deltaLabel: "+2.8s RACE TIME",
        trafficRisk: "MEDIUM · HIGH SC BENEFIT",
        tireWearAtBox: "60% LIFE CONSUMED",
        stints: [
          {
            stintNum: 1,
            compound: "HARD",
            code: "H",
            color: COMPOUND_COLORS.HARD,
            startLap: 1,
            endLap: s2Laps,
            laps: s2Laps,
            targetPace: `${(basePace + 0.60).toFixed(1)}s – ${(basePace + 1.10).toFixed(1)}s`,
            fuelLoad: "105 kg",
            boxWindow: `Lap ${s2Laps - 2}–${s2Laps + 2}`,
          },
          {
            stintNum: 2,
            compound: "MEDIUM",
            code: "M",
            color: COMPOUND_COLORS.MEDIUM,
            startLap: s2Laps + 1,
            endLap: laps,
            laps: s1Laps,
            targetPace: `${(basePace - 0.10).toFixed(1)}s – ${(basePace + 0.60).toFixed(1)}s`,
            fuelLoad: "44 kg",
            boxWindow: "Chequered Flag",
          },
        ],
        desc: "Long opening stint on durable Hard compound to inherit track position and capitalize on potential VSC / Full Safety Car neutralization.",
      },
    ];
  }, [totalRaceLaps, basePace, pitLossGreen]);

  const [selectedStrategyId, setSelectedStrategyId] = useState("opt-1");
  const [radioFilter, setRadioFilter] = useState("ALL");
  const [playingRadioId, setPlayingRadioId] = useState(null);

  const playRadioBeep = (id) => {
    setPlayingRadioId(id);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);

        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "triangle";
            osc2.frequency.setValueAtTime(1400, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
            gain2.gain.setValueAtTime(0.08, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.08);
          } catch (e) {}
        }, 90);
      }
    } catch (e) {}

    setTimeout(() => {
      setPlayingRadioId((curr) => (curr === id ? null : curr));
    }, 2800);
  };

  // Strategy Team Radio messages from Formula Dream
  const strategyRadio = useMemo(() => {
    const list = TEAM_RADIO_ARCHIVE.filter(r =>
      r.category.includes("Strategy") || r.category.includes("Tire") || r.category.includes("Telemetry")
    );
    if (radioFilter === "ALL") return list.slice(0, 5);
    return list.filter(r =>
      r.team?.toLowerCase().includes(radioFilter.toLowerCase()) ||
      r.driver_code?.toLowerCase().includes(radioFilter.toLowerCase())
    ).slice(0, 5);
  }, [radioFilter]);

  const formatRaceDuration = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = (totalSec % 60).toFixed(1);
    return `${h > 0 ? `${h}h ` : ""}${m}m ${s}s`;
  };

  const toggleCompound = (c) => {
    setSelectedCompounds(prev =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter(x => x !== c) : prev) : [...prev, c]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>

      {/* ── 1. Circuit Strategy Command Deck & Pirelli Allocation ── */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          background: "linear-gradient(135deg, rgba(20, 22, 34, 0.98) 0%, rgba(12, 14, 22, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: "5px solid var(--neon-red)",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: "900",
                  fontFamily: "'Orbitron', monospace",
                  letterSpacing: "0.08em",
                  background: "rgba(0, 229, 255, 0.12)",
                  color: "var(--neon-cyan)",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  padding: "3px 8px",
                  borderRadius: "5px",
                  boxShadow: "0 0 10px rgba(0, 229, 255, 0.2)",
                  userSelect: "none",
                }}
              >
                {selectedCircuit?.country ? selectedCircuit.country.slice(0, 3).toUpperCase() : (selectedCircuit?.circuit_id ? selectedCircuit.circuit_id.slice(0, 3).toUpperCase() : "FIA")}
              </span>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.05em" }}>
                PIRELLI STRATEGY COMMAND: {circuitName.toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  background: "rgba(255, 221, 0, 0.15)",
                  color: "var(--neon-yellow)",
                  padding: "3px 10px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 221, 0, 0.35)",
                  fontWeight: "800",
                  fontFamily: "'Orbitron', monospace",
                  boxShadow: "0 0 10px rgba(255,221,0,0.2)",
                }}
              >
                {totalRaceLaps} LAPS · {(selectedCircuit?.length_km || 5.28).toFixed(3)} KM
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "rgba(0, 210, 190, 0.12)",
                  color: "var(--neon-cyan)",
                  padding: "3px 8px",
                  borderRadius: "5px",
                  border: "1px solid rgba(0, 210, 190, 0.3)",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "700",
                }}
              >
                ⚡ 350kW PU REGEN WINDOW
              </span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.84rem", marginTop: "5px", paddingLeft: "36px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span>
                Asphalt Severity: <strong style={{ color: tireWearLevel === "HIGH" ? "var(--neon-red)" : "var(--neon-yellow)" }}>{tireWearLevel} DEGRADATION</strong>
              </span>
              <span>·</span>
              <span>
                Base Lap Pace: <strong style={{ color: "#fff" }}>{basePace}s</strong>
              </span>
              <span>·</span>
              <span>
                Optimal Pit Window: <strong style={{ color: "var(--neon-green)" }}>Laps {Math.round(totalRaceLaps * 0.38)}–{Math.round(totalRaceLaps * 0.46)}</strong>
              </span>
            </div>
          </div>

          {/* Pirelli Compound Allocation Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.5)", padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 0 12px rgba(0,0,0,0.5)" }}>
            <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", fontWeight: "700" }}>
              2026 PIRELLI NOMINATIONS:
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,24,1,0.15)", border: "1px solid #FF1801", color: "#FF1801", fontWeight: "900", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 2px 10px rgba(255,24,1,0.25)" }}>
              <StrategyPirelliWheel compound="S" size={18} /> SOFT (C4)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,215,0,0.15)", border: "1px solid #FFD700", color: "#FFD700", fontWeight: "900", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 2px 10px rgba(255,215,0,0.25)" }}>
              <StrategyPirelliWheel compound="M" size={18} /> MEDIUM (C3)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", border: "1px solid #FFFFFF", color: "#FFFFFF", fontWeight: "900", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", boxShadow: "0 2px 10px rgba(255,255,255,0.2)" }}>
              <StrategyPirelliWheel compound="H" size={18} /> HARD (C2)
            </span>
          </div>
        </div>

        {/* Pit Lane Deltas Holographic Glassmorphic Matrix */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.3fr", gap: "12px", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(0, 204, 68, 0.12) 0%, rgba(10, 16, 12, 0.8) 100%)", border: "1px solid rgba(0, 204, 68, 0.3)", borderTop: "3px solid var(--neon-green)", padding: "12px 14px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Green Flag Pit Delta</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.35rem", fontWeight: "900", color: "var(--neon-green)", marginTop: "3px", textShadow: "0 0 12px rgba(0,204,68,0.4)" }}>
              −{pitLossGreen}s
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "2px" }}>Standard In/Out Lane Loss</div>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(255, 170, 0, 0.12) 0%, rgba(18, 14, 10, 0.8) 100%)", border: "1px solid rgba(255, 170, 0, 0.3)", borderTop: "3px solid #FFAA00", padding: "12px 14px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Virtual Safety Car (VSC)</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.35rem", fontWeight: "900", color: "#FFAA00", marginTop: "3px", textShadow: "0 0 12px rgba(255,170,0,0.4)" }}>
              −{pitLossVSC}s
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--neon-green)", fontWeight: "700", marginTop: "2px" }}>
              ⚡ Saves +{(pitLossGreen - pitLossVSC).toFixed(1)}s over Green
            </div>
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(0, 136, 255, 0.12) 0%, rgba(10, 14, 20, 0.8) 100%)", border: "1px solid rgba(0, 136, 255, 0.3)", borderTop: "3px solid var(--neon-blue)", padding: "12px 14px", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Full Safety Car (SC)</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.35rem", fontWeight: "900", color: "var(--neon-blue)", marginTop: "3px", textShadow: "0 0 12px rgba(0,136,255,0.4)" }}>
              −{pitLossSC}s
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--neon-cyan)", fontWeight: "700", marginTop: "2px" }}>
              ⚡ Saves +{(pitLossGreen - pitLossSC).toFixed(1)}s over Green
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)", borderTop: `3px solid ${tireWearLevel === "HIGH" ? "var(--neon-red)" : "var(--neon-green)"}`, padding: "12px 14px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Track Degradation Index
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: tireWearLevel === "HIGH" ? "var(--neon-red)" : "var(--neon-green)" }}>
                {tireWearLevel === "HIGH" ? "82/100" : (tireWearLevel === "LOW" ? "34/100" : "58/100")}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", height: "8px", borderRadius: "4px", overflow: "hidden", marginTop: "6px" }}>
              <div
                style={{
                  width: tireWearLevel === "HIGH" ? "82%" : (tireWearLevel === "LOW" ? "34%" : "58%"),
                  height: "100%",
                  background: tireWearLevel === "HIGH" ? "linear-gradient(90deg, #ff8800, var(--neon-red))" : "linear-gradient(90deg, #00d2be, var(--neon-green))",
                  borderRadius: "4px",
                  boxShadow: `0 0 8px ${tireWearLevel === "HIGH" ? "var(--neon-red)" : "var(--neon-green)"}`,
                }}
              />
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "4px" }}>
              Micro-texture wear profile: {tireWearLevel === "LOW" ? "Low graining risk, high tire longevity" : "High thermal degradation on rear tires"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Realistic Non-Linear Tire Degradation & Cliff Curves ── */}
      <div
        className="card"
        style={{
          padding: "20px 22px",
          background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📉</span>
              <div className="card-title" style={{ marginBottom: 0, fontSize: "1.1rem" }}>
                Pirelli Thermal Degradation & Performance Crossover Curves
              </div>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "3px" }}>
              Non-linear lap time degradation modeling initial scrub-in, graining phase, crossover windows, and the thermal degradation cliff.
            </div>
          </div>

          {/* Compound Toggles */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {COMPOUNDS.map((c) => {
              const active = selectedCompounds.includes(c);
              const color = COMPOUND_COLORS[c];
              return (
                <button
                  key={c}
                  onClick={() => toggleCompound(c)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    background: active ? `${color}25` : "rgba(255,255,255,0.04)",
                    color: active ? "#ffffff" : "var(--text-dim)",
                    border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.72rem",
                    fontWeight: active ? "800" : "600",
                    letterSpacing: "0.05em",
                    boxShadow: active ? `0 0 12px ${color}55` : "none",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <StrategyPirelliWheel compound={c} size={15} />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Degradation Chart */}
        <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "8px", padding: "10px 4px 0 0", border: "1px solid rgba(255,255,255,0.05)" }}>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="lap" stroke="#444a5a" tickFormatter={(v) => `L${v}`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" domain={["dataMin - 0.4", "dataMax + 0.6"]} tickFormatter={(v) => `${v.toFixed(1)}s`} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                formatter={(val, name) => [`${val}s (+${(val - basePace).toFixed(2)}s delta)`, `${name} Compound`]}
                labelFormatter={(lap) => `Tire Age: ${lap} Laps`}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {/* Highlight Soft Thermal Cliff Zone */}
              <ReferenceArea x1={18} x2={24} fill="#FF1801" fillOpacity={0.07} />
              {selectedCompounds.map((c) => (
                <Line
                  key={c}
                  type="monotone"
                  dataKey={c}
                  stroke={COMPOUND_COLORS[c]}
                  dot={false}
                  strokeWidth={2.6}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Crossover & Cliff Predictive Telemetry Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ background: "rgba(255, 24, 1, 0.08)", border: "1px solid rgba(255, 24, 1, 0.25)", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF1801", boxShadow: "0 0 8px #FF1801" }} />
            <div>
              <div style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>SOFT CLIFF WINDOW</div>
              <div style={{ fontSize: "0.82rem", color: "#ffffff", fontWeight: "700", marginTop: "1px" }}>
                Lap 18–20 <span style={{ color: "var(--neon-red)", fontSize: "0.74rem", fontWeight: "800" }}>+0.35s/lap cliff</span>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255, 215, 0, 0.08)", border: "1px solid rgba(255, 215, 0, 0.25)", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFD700", boxShadow: "0 0 8px #FFD700" }} />
            <div>
              <div style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>MEDIUM CROSSOVER</div>
              <div style={{ fontSize: "0.82rem", color: "#ffffff", fontWeight: "700", marginTop: "1px" }}>
                Lap 16 <span style={{ color: "var(--neon-green)", fontSize: "0.74rem", fontWeight: "800" }}>Surpasses Soft Pace</span>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.18)", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 8px #FFFFFF" }} />
            <div>
              <div style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>HARD CROSSOVER</div>
              <div style={{ fontSize: "0.82rem", color: "#ffffff", fontWeight: "700", marginTop: "1px" }}>
                Lap 29 <span style={{ color: "var(--neon-cyan)", fontSize: "0.74rem", fontWeight: "800" }}>Surpasses Medium Pace</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Multi-Stint Race Strategy Simulator (Broadcast Gantt Timeline) ── */}
      <div
        id="pirelli-stint-timeline-deck"
        className="card"
        style={{
          padding: "22px 24px",
          background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header Ribbon & Timing Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.3rem" }}>🏁</span>
              <div className="card-title" style={{ marginBottom: 0, fontSize: "1.15rem", letterSpacing: "0.06em" }}>
                Pirelli Race Stint Timeline & Strategy Options
              </div>
              <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "4px" }}>
                SIMULATION LIVE · {totalRaceLaps} LAPS
              </span>
            </div>
            <div style={{ fontSize: "0.80rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Authentic multi-stint race simulations modeling compound longevity, pit stop delta loss (−{pitLossGreen}s), and optimal box windows.
            </div>
          </div>

          {/* Interactive Controls & Base Pace Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { id: "ALL", label: "ALL (3)" },
                { id: "1-STOP", label: "1-STOP (2)" },
                { id: "2-STOP", label: "2-STOP (1)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStrategyFilter(f.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    fontSize: "0.68rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "800",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: strategyFilter === f.id ? "rgba(255,255,255,0.15)" : "transparent",
                    color: strategyFilter === f.id ? "#ffffff" : "var(--text-dim)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Precision Pace Stepper */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PACE:</span>
              <button
                onClick={() => setBasePace((p) => Math.max(60, +(p - 0.1).toFixed(1)))}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  width: "22px",
                  height: "22px",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "#fff",
                  fontWeight: "900",
                }}
                title="Decrease base pace by 0.1s"
              >
                −
              </button>

              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: "var(--neon-yellow)", minWidth: "52px", textAlign: "center" }}>
                {basePace.toFixed(1)}s
              </span>

              <button
                onClick={() => setBasePace((p) => Math.min(120, +(p + 0.1).toFixed(1)))}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  width: "22px",
                  height: "22px",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "4px",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "#fff",
                  fontWeight: "900",
                }}
                title="Increase base pace by 0.1s"
              >
                +
              </button>

              <button
                onClick={() => setBasePace(circuitBasePace)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: "0.68rem",
                  color: "var(--text-dim)",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.05)",
                  marginLeft: "4px",
                }}
                title={`Reset to circuit baseline (${circuitBasePace}s)`}
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* ── Lap Graduation Ruler & Scale ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "22px",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 4px",
            fontSize: "0.64rem",
            fontFamily: "'Orbitron', monospace",
            color: "var(--text-dim)",
            borderBottom: "1px dashed rgba(255,255,255,0.12)",
          }}
        >
          <span>START L1</span>
          <span>L{Math.round(totalRaceLaps * 0.2)}</span>
          <span style={{ color: "var(--neon-green)", fontWeight: "800" }}>L{Math.round(totalRaceLaps * 0.41)} · PIT WINDOW</span>
          <span>L{Math.round(totalRaceLaps * 0.6)}</span>
          <span>L{Math.round(totalRaceLaps * 0.8)}</span>
          <span style={{ color: "#ffffff", fontWeight: "800" }}>🏁 L{totalRaceLaps} FINISH</span>
        </div>

        {/* ── Strategy Options Cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {defaultStrategies
            .filter((strat) => strategyFilter === "ALL" || strat.stopsType === strategyFilter)
            .map((strat) => {
              const isSelected = selectedStrategyId === strat.id;

              return (
                <div
                  key={strat.id}
                  data-strategy-id={strat.id}
                  onClick={() => setSelectedStrategyId(strat.id)}
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(14,17,28,0.98) 100%)"
                      : "rgba(255,255,255,0.02)",
                    borderTop: `1px solid ${isSelected ? strat.accentColor : "rgba(255,255,255,0.08)"}`,
                    borderRight: `1px solid ${isSelected ? strat.accentColor : "rgba(255,255,255,0.08)"}`,
                    borderBottom: `1px solid ${isSelected ? strat.accentColor : "rgba(255,255,255,0.08)"}`,
                    borderLeft: `5px solid ${strat.accentColor}`,
                    boxShadow: isSelected ? `0 6px 24px ${strat.accentColor}33` : "none",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Card Header: Strategy Title, Tactical Tags & Duration Delta */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: "900", color: strat.accentColor }}>
                        {strat.num}
                      </span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em" }}>
                        {strat.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          background: `${strat.badgeColor}22`,
                          color: strat.badgeColor,
                          border: `1px solid ${strat.badgeColor}55`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "800",
                          fontFamily: "'Orbitron', monospace",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {strat.badge}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "3px" }}>
                        {strat.tacticalTag}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: isSelected ? strat.accentColor : "#ffffff" }}>
                        {formatRaceDuration(strat.totalTimeSec)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          color: strat.deltaLabel.includes("BENCHMARK") ? "var(--neon-green)" : "var(--neon-yellow)",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "800",
                          background: strat.deltaLabel.includes("BENCHMARK") ? "rgba(0,204,68,0.12)" : "rgba(255,204,0,0.12)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {strat.deltaLabel}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Stint Broadcast Gantt Bar with Pit Flags */}
                  <div
                    style={{
                      display: "flex",
                      height: "44px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.7)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      marginBottom: "10px",
                      position: "relative",
                      boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
                    }}
                  >
                    {strat.stints.map((stint, idx) => {
                      const pct = (stint.laps / totalRaceLaps) * 100;
                      const isDarkText = stint.compound === "HARD" || stint.compound === "MEDIUM";

                      return (
                        <div
                          key={idx}
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%), ${stint.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px",
                            color: isDarkText ? "#000000" : "#ffffff",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            fontWeight: "900",
                            borderRight: idx < strat.stints.length - 1 ? "2px solid #000000" : "none",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          title={`${stint.compound}: Laps ${stint.startLap}–${stint.endLap} (${stint.laps} Laps · ${Math.round(pct)}%)`}
                        >
                          {/* Authentic Compound Wheel Badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <StrategyPirelliWheel compound={stint.code} size={20} />
                            <span style={{ fontSize: "0.76rem", letterSpacing: "0.04em", textShadow: isDarkText ? "none" : "0 1px 3px rgba(0,0,0,0.8)" }}>
                              {stint.compound} · {stint.laps}L ({Math.round(pct)}%)
                            </span>
                          </div>

                          {/* Lap Range Pill */}
                          <span
                            style={{
                              fontSize: "0.68rem",
                              background: isDarkText ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: "800",
                            }}
                          >
                            L{stint.startLap} → L{stint.endLap}
                          </span>

                          {/* Mini Degradation Health Indicator */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: "3px",
                              background: isDarkText ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)",
                            }}
                          >
                            <div
                              style={{
                                width: "65%",
                                height: "100%",
                                background: isDarkText ? "#000" : "#fff",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strategy Info Footer & Quick Metrics */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem", color: "var(--text-secondary)", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ maxWidth: "65%", lineHeight: "1.35" }}>
                      {strat.desc}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "4px", color: isSelected ? "var(--neon-green)" : "var(--text-dim)" }}>
                        🔧 Pit Windows: {strat.stints.slice(0, -1).map((s) => `Lap ${s.endLap}`).join(", ")}
                      </span>
                      <span style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "4px", color: "var(--text-dim)" }}>
                        🚦 {strat.trafficRisk.split("·")[0]}
                      </span>
                      <span style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "4px", color: "var(--text-dim)" }}>
                        📉 {strat.tireWearAtBox}
                      </span>
                    </div>
                  </div>

                  {/* ── Deep Telemetry Stint Breakdown Drawer (When Selected) ── */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "14px",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        display: "grid",
                        gridTemplateColumns: `repeat(${strat.stints.length + (strat.stops)}, 1fr)`,
                        gap: "10px",
                      }}
                    >
                      {strat.stints.map((stint, idx) => (
                        <React.Fragment key={idx}>
                          {/* Stint Card */}
                          <div
                            style={{
                              background: "rgba(0,0,0,0.35)",
                              border: `1px solid ${stint.color}44`,
                              borderTop: `3px solid ${stint.color}`,
                              borderRadius: "8px",
                              padding: "10px 12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <StrategyPirelliWheel compound={stint.code} size={15} />
                                STINT {stint.stintNum} · {stint.compound}
                              </span>
                              <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: stint.color, fontWeight: "900" }}>
                                {stint.laps} LAPS
                              </span>
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#ffffff", fontWeight: "700" }}>
                              Laps {stint.startLap}–{stint.endLap}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)" }}>
                              Target: <strong style={{ color: "#fff" }}>{stint.targetPace}</strong>
                            </div>
                            <div style={{ fontSize: "0.66rem", color: "var(--text-dim)", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                              <span>Fuel: {stint.fuelLoad}</span>
                              <span style={{ color: "var(--neon-green)" }}>{stint.boxWindow}</span>
                            </div>
                          </div>

                          {/* Pit Stop Event Pill between stints */}
                          {idx < strat.stints.length - 1 && (
                            <div
                              style={{
                                background: "rgba(232,0,45,0.08)",
                                border: "1px dashed rgba(232,0,45,0.3)",
                                borderRadius: "8px",
                                padding: "8px 10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                gap: "2px",
                              }}
                            >
                              <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-red)", fontWeight: "800" }}>
                                🔧 PIT STOP #{idx + 1}
                              </span>
                              <span style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', monospace", color: "#ffffff", fontWeight: "900" }}>
                                −{pitLossGreen}s
                              </span>
                              <span style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
                                2.1s stationary target
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ── 4. Live Undercut / Overcut Tactical Radar & Team Radio Comms ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "16px" }}>
        {/* Undercut Evaluator */}
        <div
          className="card"
          style={{
            padding: "20px",
            background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>⚡</span>
              <div className="card-title" style={{ marginBottom: 0, fontSize: "1.05rem" }}>
                Tactical Undercut / Overcut Radar
              </div>
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                background: "rgba(0, 136, 255, 0.15)",
                color: "var(--neon-blue)",
                padding: "3px 10px",
                borderRadius: "5px",
                border: "1px solid rgba(0, 136, 255, 0.35)",
                fontWeight: "800",
                fontFamily: "'Orbitron', monospace",
              }}
            >
              PIT WINDOW CALCULATOR
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Gap Slider & Stepper */}
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'Orbitron', monospace" }}>
                  Gap to Car Ahead
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      color: parseFloat(form.gapToCarAhead) <= 1.8 ? "var(--neon-green)" : (parseFloat(form.gapToCarAhead) <= 3.2 ? "var(--neon-yellow)" : "var(--neon-cyan)"),
                      fontSize: "1.05rem",
                    }}
                  >
                    {form.gapToCarAhead}s
                  </span>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "800",
                      background: parseFloat(form.gapToCarAhead) <= 1.8 ? "rgba(0,204,68,0.2)" : "rgba(255,221,0,0.18)",
                      color: parseFloat(form.gapToCarAhead) <= 1.8 ? "var(--neon-green)" : "var(--neon-yellow)",
                      border: `1px solid ${parseFloat(form.gapToCarAhead) <= 1.8 ? "rgba(0,204,68,0.4)" : "rgba(255,221,0,0.4)"}`,
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {parseFloat(form.gapToCarAhead) <= 1.8 ? "PRIME UNDERCUT" : (parseFloat(form.gapToCarAhead) <= 3.2 ? "OVERCUT DEFENSE" : "CLEAN AIR BUFFER")}
                  </span>
                </div>
              </div>

              {/* Slider + Stepper Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gapToCarAhead: Math.max(0.3, (parseFloat(f.gapToCarAhead) - 0.1)).toFixed(1) }))}
                  style={{ width: "26px", height: "26px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  title="Decrease 0.1s"
                >
                  −
                </button>
                <input
                  type="range"
                  min="0.3"
                  max="5.0"
                  step="0.1"
                  value={form.gapToCarAhead}
                  onChange={(e) => setForm({ ...form, gapToCarAhead: e.target.value })}
                  style={{ flex: 1, accentColor: parseFloat(form.gapToCarAhead) <= 1.8 ? "var(--neon-green)" : "var(--neon-yellow)", cursor: "pointer" }}
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, gapToCarAhead: Math.min(5.0, (parseFloat(f.gapToCarAhead) + 0.1)).toFixed(1) }))}
                  style={{ width: "26px", height: "26px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  title="Increase 0.1s"
                >
                  +
                </button>
              </div>

              {/* Preset tactical delta buttons */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {[
                  { label: "0.8s (DRS Train)", val: "0.8" },
                  { label: "1.4s (Prime Undercut)", val: "1.4" },
                  { label: "2.8s (Margin)", val: "2.8" },
                  { label: "4.0s (Overcut)", val: "4.0" },
                ].map(preset => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setForm({ ...form, gapToCarAhead: preset.val })}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: "0.66rem",
                      background: form.gapToCarAhead === preset.val ? "rgba(255,221,0,0.25)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.gapToCarAhead === preset.val ? "rgba(255,221,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                      color: form.gapToCarAhead === preset.val ? "var(--neon-yellow)" : "var(--text-dim)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "700",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactile Tire Ages with Live Degradation Gauges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Our Tire Age */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    Our Tire Age
                  </label>
                  <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>
                    {Math.max(1, 100 - parseInt(form.driverTireAge || 0) * 3)}% LIFE
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, driverTireAge: Math.max(1, parseInt(f.driverTireAge || 0) - 1) }))}
                    style={{ width: "28px", height: "28px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={form.driverTireAge}
                    onChange={(e) => setForm({ ...form, driverTireAge: e.target.value })}
                    style={{ flex: 1, textAlign: "center", fontSize: "0.95rem", fontWeight: "900", fontFamily: "'Orbitron', monospace", padding: "4px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "4px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, driverTireAge: Math.min(50, parseInt(f.driverTireAge || 0) + 1) }))}
                    style={{ width: "28px", height: "28px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  >
                    +
                  </button>
                </div>
                <div style={{ height: "3px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, parseInt(form.driverTireAge || 0) * 3.5)}%`, height: "100%", background: parseInt(form.driverTireAge || 0) > 22 ? "var(--neon-red)" : "var(--neon-green)", transition: "width 0.2s ease" }} />
                </div>
              </div>

              {/* Rival Tire Age */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    Rival Tire Age
                  </label>
                  <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: parseInt(form.rivalTireAge || 0) > 18 ? "var(--neon-red)" : "var(--neon-yellow)", fontWeight: "800" }}>
                    {parseInt(form.rivalTireAge || 0) > 18 ? "CLIFF RISK" : "STABLE"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rivalTireAge: Math.max(1, parseInt(f.rivalTireAge || 0) - 1) }))}
                    style={{ width: "28px", height: "28px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={form.rivalTireAge}
                    onChange={(e) => setForm({ ...form, rivalTireAge: e.target.value })}
                    style={{ flex: 1, textAlign: "center", fontSize: "0.95rem", fontWeight: "900", fontFamily: "'Orbitron', monospace", padding: "4px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "4px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rivalTireAge: Math.min(50, parseInt(f.rivalTireAge || 0) + 1) }))}
                    style={{ width: "28px", height: "28px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}
                  >
                    +
                  </button>
                </div>
                <div style={{ height: "3px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, parseInt(form.rivalTireAge || 0) * 3.5)}%`, height: "100%", background: parseInt(form.rivalTireAge || 0) > 18 ? "var(--neon-red)" : "#ffa500", transition: "width 0.2s ease" }} />
                </div>
              </div>
            </div>

            {/* Authentic Pirelli Compound Selectors with Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Our Compound */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    Our Compound
                  </label>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: COMPOUND_COLORS[form.driverCompound] || "#fff" }}>
                    {form.driverCompound}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["SOFT", "MEDIUM", "HARD"].map((comp) => {
                    const isSel = form.driverCompound === comp;
                    const color = COMPOUND_COLORS[comp];
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setForm({ ...form, driverCompound: comp })}
                        title={`${comp} Compound (Telemetry Stint)`}
                        style={{
                          flex: 1,
                          all: "unset",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "7px 3px",
                          borderRadius: "6px",
                          background: isSel ? `${color}25` : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${isSel ? color : "rgba(255,255,255,0.1)"}`,
                          boxShadow: isSel ? `0 0 12px ${color}66` : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <StrategyPirelliWheel compound={comp} size={20} />
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", fontWeight: isSel ? "900" : "600", color: isSel ? "#ffffff" : "var(--text-dim)", letterSpacing: "0.04em" }}>
                          {comp}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rival Compound */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    Rival Compound
                  </label>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: COMPOUND_COLORS[form.rivalCompound] || "#fff" }}>
                    {form.rivalCompound}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["SOFT", "MEDIUM", "HARD"].map((comp) => {
                    const isSel = form.rivalCompound === comp;
                    const color = COMPOUND_COLORS[comp];
                    return (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setForm({ ...form, rivalCompound: comp })}
                        title={`${comp} Compound (Rival Stint)`}
                        style={{
                          flex: 1,
                          all: "unset",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "7px 3px",
                          borderRadius: "6px",
                          background: isSel ? `${color}25` : "rgba(255,255,255,0.04)",
                          border: `1.5px solid ${isSel ? color : "rgba(255,255,255,0.1)"}`,
                          boxShadow: isSel ? `0 0 12px ${color}66` : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <StrategyPirelliWheel compound={comp} size={20} />
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", fontWeight: isSel ? "900" : "600", color: isSel ? "#ffffff" : "var(--text-dim)", letterSpacing: "0.04em" }}>
                          {comp}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Track Neutralization Segmented Bar */}
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                  Track Neutralization Status
                </label>
                <span style={{ fontSize: "0.64rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                  {form.pitCondition === "GREEN" ? "FULL RACE PACE" : (form.pitCondition === "VSC" ? "DELTA SPEED LIMIT" : "PACKED SAFETY CAR")}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {[
                  { id: "GREEN", label: "🟢 GREEN FLAG", loss: `-${pitLossGreen}s`, note: "Standard Loss" },
                  { id: "VSC", label: "⚠️ VSC", loss: `-${pitLossVSC}s`, note: `+${(pitLossGreen - pitLossVSC).toFixed(1)}s Gain` },
                  { id: "SC", label: "🚗 SAFETY CAR", loss: `-${pitLossSC}s`, note: `+${(pitLossGreen - pitLossSC).toFixed(1)}s Gain` },
                ].map(stat => {
                  const isSel = form.pitCondition === stat.id;
                  return (
                    <button
                      key={stat.id}
                      type="button"
                      onClick={() => setForm({ ...form, pitCondition: stat.id })}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "6px 4px",
                        borderRadius: "6px",
                        background: isSel ? "rgba(0,210,190,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSel ? "var(--neon-cyan)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isSel ? "0 0 10px rgba(0,210,190,0.35)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: isSel ? "900" : "700", color: isSel ? "#fff" : "var(--text-secondary)" }}>
                        {stat.label}
                      </span>
                      <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: isSel ? "var(--neon-cyan)" : "var(--text-dim)", marginTop: "2px" }}>
                        {stat.loss} · {stat.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulation Execution Button */}
            <button
              className="btn btn-red"
              onClick={handleUndercut}
              disabled={loading}
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.85rem",
                fontWeight: "900",
                letterSpacing: "0.06em",
                padding: "10px 16px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, var(--neon-red), #b3001e)",
                boxShadow: "0 4px 16px rgba(232,0,45,0.45)",
                cursor: "pointer",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
            >
              <span>⚡</span>
              <span>{loading ? "CALCULATING TACTICAL DELTAS..." : "RUN UNDERCUT SIMULATION"}</span>
            </button>

            {/* Tactical Outcome Hero */}
            {undercutResult && (
              <div
                style={{
                  background: undercutResult.recommendation === "BOX NOW"
                    ? "linear-gradient(135deg, rgba(0, 204, 68, 0.15) 0%, rgba(10, 20, 14, 0.95) 100%)"
                    : (undercutResult.recommendation === "STAY OUT" ? "linear-gradient(135deg, rgba(232, 0, 45, 0.15) 0%, rgba(20, 10, 14, 0.95) 100%)" : "linear-gradient(135deg, rgba(255, 221, 0, 0.15) 0%, rgba(20, 18, 10, 0.95) 100%)"),
                  border: `1px solid ${undercutResult.recommendation === "BOX NOW" ? "var(--neon-green)" : (undercutResult.recommendation === "STAY OUT" ? "var(--neon-red)" : "var(--neon-yellow)")}`,
                  borderRadius: "8px",
                  padding: "14px 16px",
                  boxShadow: `0 6px 20px ${undercutResult.recommendation === "BOX NOW" ? "rgba(0,204,68,0.25)" : "rgba(232,0,45,0.25)"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: undercutResult.recommendation === "BOX NOW" ? "var(--neon-green)" : (undercutResult.recommendation === "STAY OUT" ? "var(--neon-red)" : "var(--neon-yellow)"), textShadow: `0 0 12px ${undercutResult.recommendation === "BOX NOW" ? "rgba(0,204,68,0.5)" : "rgba(232,0,45,0.5)"}` }}>
                    {undercutResult.recommendation === "BOX NOW" ? "⚡ BOX NOW (OPTIMAL UNDERCUT)" : undercutResult.recommendation}
                  </div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#fff", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: "5px" }}>
                    {undercutResult.successProbability}% Success Probability
                  </span>
                </div>
                <div style={{ fontSize: "0.80rem", color: "#e8e8f0", marginTop: "6px", lineHeight: "1.4" }}>
                  {undercutResult.reason}
                </div>
                <div style={{ display: "flex", gap: "14px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", flexWrap: "wrap" }}>
                  <span>Out-Lap Adv: <strong style={{ color: "var(--neon-green)" }}>+{undercutResult.paceAdvantage}s</strong></span>
                  <span>·</span>
                  <span>Projected Exit: <strong style={{ color: undercutResult.projectedExitGap >= 0 ? "var(--neon-green)" : "var(--neon-red)" }}>{undercutResult.projectedExitGap >= 0 ? `+${undercutResult.projectedExitGap}s Ahead` : `${undercutResult.projectedExitGap}s Behind`}</strong></span>
                  <span>·</span>
                  <span style={{ color: "var(--neon-cyan)" }}>Window: Active</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Strategy Radio Communications from Formula Dream */}
        <div
          className="card"
          style={{
            padding: "20px",
            background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            borderLeft: "5px solid var(--neon-cyan)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>📻</span>
                <div className="card-title" style={{ marginBottom: 0, fontSize: "1.05rem" }}>
                  Pit Wall Strategy Comms
                </div>
              </div>
              <button
                onClick={() => setIsRadioModalOpen(true)}
                style={{
                  background: "rgba(0, 210, 190, 0.15)",
                  border: "1px solid rgba(0, 210, 190, 0.4)",
                  color: "var(--neon-cyan)",
                  padding: "4px 10px",
                  borderRadius: "5px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                📻 BOXBOX ARCHIVE
              </button>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "10px" }}>
              Authentic race engineer transmissions regarding pit stops, tire preservation, and undercut triggers.
            </div>

            {/* Team Channel Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: "ALL CHANNELS" },
                { id: "McLaren", label: "🟠 McLAREN" },
                { id: "Ferrari", label: "🔴 FERRARI" },
                { id: "Red Bull", label: "🔵 RED BULL" },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRadioFilter(f.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    fontSize: "0.64rem",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: radioFilter === f.id ? "800" : "600",
                    background: radioFilter === f.id ? "rgba(0,210,190,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${radioFilter === f.id ? "var(--neon-cyan)" : "rgba(255,255,255,0.08)"}`,
                    color: radioFilter === f.id ? "var(--neon-cyan)" : "var(--text-dim)",
                    transition: "all 0.12s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Scrollable Radio Stream */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "385px", overflowY: "auto", paddingRight: "4px" }}>
              {strategyRadio.map((rad) => {
                const isPlaying = playingRadioId === rad.id;
                return (
                  <div
                    key={rad.id}
                    style={{
                      background: isPlaying ? "rgba(0,210,190,0.08)" : "rgba(0,0,0,0.4)",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${isPlaying ? "var(--neon-cyan)" : "rgba(255,255,255,0.06)"}`,
                      borderLeftWidth: "4px",
                      borderLeftColor: rad.team_color,
                      fontSize: "0.78rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", color: rad.team_color, fontSize: "0.80rem" }}>
                          {rad.driver_code} · {rad.team}
                        </span>
                        <span style={{ fontSize: "0.58rem", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                          {rad.category}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isPlaying ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "16px" }}>
                            <span className="radio-eq-bar" />
                            <span className="radio-eq-bar" />
                            <span className="radio-eq-bar" />
                            <span className="radio-eq-bar" />
                            <span className="radio-eq-bar" />
                            <span style={{ fontSize: "0.60rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "900", marginLeft: "3px" }}>
                              AIR
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => playRadioBeep(rad.id)}
                            style={{
                              all: "unset",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.62rem",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "700",
                              color: "var(--neon-cyan)",
                              background: "rgba(0,210,190,0.1)",
                              border: "1px solid rgba(0,210,190,0.3)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              transition: "all 0.15s ease",
                            }}
                            title="Play authentic radio transmission beep"
                          >
                            <span>🔊</span>
                            <span>TRANSMIT</span>
                          </button>
                        )}
                        <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                          L{rad.lap} · {rad.time}
                        </span>
                      </div>
                    </div>

                    <div style={{ color: "#e8e8f0", lineHeight: "1.35", fontSize: "0.80rem" }}>
                      <span style={{ color: rad.speaker === "PIT" ? "var(--neon-red)" : rad.team_color, fontWeight: "800" }}>
                        {rad.speaker === "PIT" ? `PIT (${rad.engineer_name}): ` : `${rad.driver_code}: `}
                      </span>
                      "{rad.message}"
                    </div>

                    {rad.driver_reply && (
                      <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "4px" }}>
                        <strong>{rad.speaker === "PIT" ? rad.driver_code : "PIT"}: </strong>"{rad.driver_reply}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "12px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.72rem", color: "var(--text-dim)" }}>
            💡 <em>Tactical Strategy Guideline: Undercut call gives greatest advantage when rival has graining front tyres. Ensure out-lap delta is deployed in Sector 2.</em>
          </div>
        </div>
      </div>

      {/* ── 22-Car Tactical Pit Re-Entry & Safety Car Window Sandbox ── */}
      <PitReentryTrafficSandbox
        pitLossGreen={pitLossGreen}
        pitLossVSC={pitLossVSC}
        pitLossSC={pitLossSC}
        totalRaceLaps={totalRaceLaps}
      />

      {/* ── BoxBox Team Radio Modal ── */}
      <TeamRadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
      />
    </div>
  );
}
