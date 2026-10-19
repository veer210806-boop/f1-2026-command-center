// ============================================================
// TimingTower.jsx — Advanced F1 Pit Wall Command Center
// Next-Gen 2026 Formula 1 Live Mission Control Dashboard
// ============================================================
import { useState, useEffect, useMemo, memo } from "react";
import axios from "axios";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { getTeamLogo } from "../data/f1MediaAssets2026";
import { getCircuitWeather } from "../data/calendar2026";
import { getDriverRadio, getCircuitRadio, TEAM_RADIO_ARCHIVE } from "../data/teamRadioArchive";
import TeamRadioModal from "./TeamRadioModal";
import FiaRaceControlModal from "./FiaRaceControlModal";
import LiveRaceMapTracker from "./LiveRaceMapTracker";
import StatsF1LapMatrix from "./StatsF1LapMatrix";
import { RACE_STATUS_FLAGS, INITIAL_FIA_BULLETINS } from "../data/fiaRaceControl";
import {
  generateRaceWeekendData,
  buildTimingTowerGridForCircuit,
  getGrandPrixConfig,
} from "../data/raceWeekendGrids2026";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Authentic 2026 Team Badges & Colors ─────────────────────────────────────
const TEAM_CONFIG = {
  "Mercedes":        { bg: "#005a54", text: "#00d2be", label: "MERCEDES" },
  "Red Bull Racing": { bg: "#0b1c3d", text: "#3671e8", label: "RED BULL RACING" },
  "Ferrari":         { bg: "#7a0000", text: "#ff3b30", label: "FERRARI" },
  "McLaren":         { bg: "#7a3e00", text: "#ff8700", label: "MCLAREN" },
  "Aston Martin":    { bg: "#003b32", text: "#229971", label: "ASTON MARTIN" },
  "Williams":        { bg: "#002b5c", text: "#00a0de", label: "WILLIAMS" },
  "Alpine":          { bg: "#003d66", text: "#0090ff", label: "ALPINE" },
  "Haas":            { bg: "#3a3a42", text: "#b6babd", label: "HAAS" },
  "RB":              { bg: "#1f2d66", text: "#6692ff", label: "RACING BULLS" },
  "Racing Bulls":    { bg: "#1f2d66", text: "#6692ff", label: "RACING BULLS" },
  "Audi":            { bg: "#4a000c", text: "#e50027", label: "AUDI F1 TEAM" },
  "Cadillac":        { bg: "#4a3c00", text: "#ffc72c", label: "CADILLAC F1" },
};

// ── Default 22 Driver Grid (Official F1 2026 Season Grid with Next-Gen Data) ─
const DEFAULT_22_GRID = [
  { pos: 1,  num: 1,  code: "NOR", name: "L. Norris",      team: "McLaren",         flag: "🇬🇧", tire: "M", tireAge: 20, gap: "LEADER",    interval: "1:28.905", arrow: "down", wear: 44, delta: "+0.076", s1: "28.140", s1Type: "purple", s2: "37.915", s2Type: "green",  s3: "22.850", s3Type: "purple", soc: 92, mom: "Z-MODE",  bestLap: "1:28.412", lastLap: "1:28.905", pits: 1, posDelta: "+1", speedTrap: 335, trackPct: 0.92 },
  { pos: 2,  num: 3,  code: "VER", name: "M. Verstappen",  team: "Red Bull Racing", flag: "🇳🇱", tire: "M", tireAge: 20, gap: "+1.642s",  interval: "1:29.120", arrow: "down", wear: 55, delta: "-0.150", s1: "28.210", s1Type: "green",  s2: "37.890", s2Type: "purple", s3: "23.020", s3Type: "green",  soc: 86, mom: "X-MODE",  bestLap: "1:28.520", lastLap: "1:29.120", pits: 1, posDelta: "-1", speedTrap: 337, trackPct: 0.88 },
  { pos: 3,  num: 63, code: "RUS", name: "G. Russell",     team: "Mercedes",        flag: "🇬🇧", tire: "M", tireAge: 20, gap: "+3.258s",  interval: "1:29.340", arrow: "up",   wear: 48, delta: "+0.012", s1: "28.320", s1Type: "yellow", s2: "38.040", s2Type: "green",  s3: "22.980", s3Type: "green",  soc: 79, mom: "Z-MODE",  bestLap: "1:28.840", lastLap: "1:29.340", pits: 1, posDelta: "+1", speedTrap: 332, trackPct: 0.84 },
  { pos: 4,  num: 16, code: "LEC", name: "C. Leclerc",     team: "Ferrari",         flag: "🇲🇨", tire: "M", tireAge: 20, gap: "+5.118s",  interval: "1:29.540", arrow: "down", wear: 52, delta: "-0.220", s1: "28.280", s1Type: "green",  s2: "38.110", s2Type: "yellow", s3: "23.150", s3Type: "yellow", soc: 84, mom: "MOM ON",  bestLap: "1:28.710", lastLap: "1:29.540", pits: 1, posDelta: "0",  speedTrap: 331, trackPct: 0.80 },
  { pos: 5,  num: 44, code: "HAM", name: "L. Hamilton",    team: "Ferrari",         flag: "🇬🇧", tire: "H", tireAge: 20, gap: "+7.919s",  interval: "1:29.750", arrow: "up",   wear: 42, delta: "-0.040", s1: "28.410", s1Type: "yellow", s2: "38.190", s2Type: "green",  s3: "23.150", s3Type: "yellow", soc: 88, mom: "Z-MODE",  bestLap: "1:28.950", lastLap: "1:29.750", pits: 1, posDelta: "+2", speedTrap: 336, trackPct: 0.76 },
  { pos: 6,  num: 81, code: "PIA", name: "O. Piastri",     team: "McLaren",         flag: "🇦🇺", tire: "S", tireAge: 16, gap: "+9.850s",  interval: "1:29.962", arrow: "up",   wear: 58, delta: "-0.180", s1: "28.290", s1Type: "green",  s2: "38.250", s2Type: "yellow", s3: "23.422", s3Type: "yellow", soc: 71, mom: "X-MODE",  bestLap: "1:28.780", lastLap: "1:29.962", pits: 1, posDelta: "-1", speedTrap: 330, trackPct: 0.72 },
  { pos: 7,  num: 55, code: "SAI", name: "C. Sainz Jr.",   team: "Williams",        flag: "🇪🇸", tire: "H", tireAge: 20, gap: "+13.319s", interval: "1:30.175", arrow: "up",   wear: 44, delta: "-0.350", s1: "28.520", s1Type: "yellow", s2: "38.380", s2Type: "yellow", s3: "23.275", s3Type: "yellow", soc: 75, mom: "Z-MODE",  bestLap: "1:29.210", lastLap: "1:30.175", pits: 1, posDelta: "+3", speedTrap: 328, trackPct: 0.68 },
  { pos: 8,  num: 12, code: "ANT", name: "K. Antonelli",   team: "Mercedes",        flag: "🇮🇹", tire: "H", tireAge: 20, gap: "+16.245s", interval: "1:30.490", arrow: "down", wear: 50, delta: "-0.430", s1: "28.610", s1Type: "yellow", s2: "38.450", s2Type: "yellow", s3: "23.430", s3Type: "yellow", soc: 68, mom: "Z-MODE",  bestLap: "1:29.450", lastLap: "1:30.490", pits: 1, posDelta: "-1", speedTrap: 326, trackPct: 0.64 },
  { pos: 9,  num: 14, code: "ALO", name: "F. Alonso",      team: "Aston Martin",    flag: "🇪🇸", tire: "M", tireAge: 18, gap: "+18.840s", interval: "1:30.250", arrow: "down", wear: 55, delta: "-0.320", s1: "28.490", s1Type: "yellow", s2: "38.420", s2Type: "yellow", s3: "23.340", s3Type: "yellow", soc: 82, mom: "MOM ON",  bestLap: "1:29.180", lastLap: "1:30.250", pits: 1, posDelta: "0",  speedTrap: 327, trackPct: 0.60 },
  { pos: 10, num: 23, code: "ALB", name: "A. Albon",       team: "Williams",        flag: "🇹🇭", tire: "H", tireAge: 20, gap: "+20.974s", interval: "1:30.658", arrow: "down", wear: 44, delta: "-0.286", s1: "28.680", s1Type: "yellow", s2: "38.560", s2Type: "yellow", s3: "23.418", s3Type: "yellow", soc: 77, mom: "Z-MODE",  bestLap: "1:29.620", lastLap: "1:30.658", pits: 1, posDelta: "+1", speedTrap: 325, trackPct: 0.56 },
  { pos: 11, num: 11, code: "PER", name: "S. Pérez",       team: "Cadillac",        flag: "🇲🇽", tire: "H", tireAge: 20, gap: "+22.678s", interval: "1:30.840", arrow: "down", wear: 46, delta: "-0.270", s1: "28.720", s1Type: "yellow", s2: "38.640", s2Type: "yellow", s3: "23.480", s3Type: "yellow", soc: 85, mom: "X-MODE",  bestLap: "1:29.740", lastLap: "1:30.840", pits: 1, posDelta: "+4", speedTrap: 335, trackPct: 0.52 },
  { pos: 12, num: 6,  code: "HAD", name: "I. Hadjar",      team: "Red Bull Racing", flag: "🇫🇷", tire: "H", tireAge: 20, gap: "+24.700s", interval: "1:31.000", arrow: "up",   wear: 46, delta: "-0.590", s1: "28.780", s1Type: "yellow", s2: "38.710", s2Type: "yellow", s3: "23.510", s3Type: "yellow", soc: 65, mom: "Z-MODE",  bestLap: "1:29.890", lastLap: "1:31.000", pits: 1, posDelta: "-2", speedTrap: 329, trackPct: 0.48 },
  { pos: 13, num: 27, code: "HUL", name: "N. Hülkenberg",  team: "Audi",            flag: "🇩🇪", tire: "M", tireAge: 20, gap: "+26.197s", interval: "1:31.221", arrow: "up",   wear: 60, delta: "-0.595", s1: "28.840", s1Type: "yellow", s2: "38.790", s2Type: "yellow", s3: "23.591", s3Type: "yellow", soc: 70, mom: "Z-MODE",  bestLap: "1:29.980", lastLap: "1:31.221", pits: 1, posDelta: "+1", speedTrap: 324, trackPct: 0.44 },
  { pos: 14, num: 18, code: "STR", name: "L. Stroll",      team: "Aston Martin",    flag: "🇨🇦", tire: "H", tireAge: 20, gap: "+27.515s", interval: "1:31.362", arrow: "up",   wear: 44, delta: "-0.579", s1: "28.890", s1Type: "yellow", s2: "38.820", s2Type: "yellow", s3: "23.652", s3Type: "yellow", soc: 73, mom: "Z-MODE",  bestLap: "1:30.120", lastLap: "1:31.362", pits: 1, posDelta: "-1", speedTrap: 322, trackPct: 0.40 },
  { pos: 15, num: 10, code: "GAS", name: "P. Gasly",       team: "Alpine",          flag: "🇫🇷", tire: "M", tireAge: 20, gap: "+28.800s", interval: "1:31.440", arrow: "up",   wear: 55, delta: "-0.610", s1: "28.910", s1Type: "yellow", s2: "38.860", s2Type: "yellow", s3: "23.670", s3Type: "yellow", soc: 62, mom: "MOM ON",  bestLap: "1:30.250", lastLap: "1:31.440", pits: 1, posDelta: "0",  speedTrap: 321, trackPct: 0.36 },
  { pos: 16, num: 31, code: "OCO", name: "E. Ocon",        team: "Haas",            flag: "🇫🇷", tire: "M", tireAge: 20, gap: "+30.200s", interval: "1:31.650", arrow: "down", wear: 59, delta: "-0.680", s1: "28.990", s1Type: "yellow", s2: "38.950", s2Type: "yellow", s3: "23.710", s3Type: "yellow", soc: 58, mom: "Z-MODE",  bestLap: "1:30.410", lastLap: "1:31.650", pits: 1, posDelta: "-2", speedTrap: 320, trackPct: 0.32 },
  { pos: 17, num: 30, code: "LAW", name: "L. Lawson",      team: "Racing Bulls",    flag: "🇳🇿", tire: "M", tireAge: 18, gap: "+31.400s", interval: "1:31.720", arrow: "up",   wear: 58, delta: "-0.710", s1: "29.020", s1Type: "yellow", s2: "38.980", s2Type: "yellow", s3: "23.720", s3Type: "yellow", soc: 69, mom: "Z-MODE",  bestLap: "1:30.520", lastLap: "1:31.720", pits: 1, posDelta: "+1", speedTrap: 323, trackPct: 0.28 },
  { pos: 18, num: 87, code: "BEA", name: "O. Bearman",     team: "Haas",            flag: "🇬🇧", tire: "S", tireAge: 14, gap: "+32.600s", interval: "1:31.820", arrow: "down", wear: 64, delta: "-0.750", s1: "29.080", s1Type: "yellow", s2: "39.020", s2Type: "yellow", s3: "23.720", s3Type: "yellow", soc: 52, mom: "CHARGING",bestLap: "1:30.650", lastLap: "1:31.820", pits: 2, posDelta: "-3", speedTrap: 319, trackPct: 0.24 },
  { pos: 19, num: 77, code: "BOT", name: "V. Bottas",      team: "Cadillac",        flag: "🇫🇮", tire: "H", tireAge: 20, gap: "+33.900s", interval: "1:32.020", arrow: "up",   wear: 45, delta: "-0.820", s1: "29.120", s1Type: "yellow", s2: "39.110", s2Type: "yellow", s3: "23.790", s3Type: "yellow", soc: 78, mom: "X-MODE",  bestLap: "1:30.780", lastLap: "1:32.020", pits: 1, posDelta: "+2", speedTrap: 325, trackPct: 0.20 },
  { pos: 20, num: 5,  code: "BOR", name: "G. Bortoleto",   team: "Audi",            flag: "🇧🇷", tire: "M", tireAge: 20, gap: "+35.100s", interval: "1:32.190", arrow: "up",   wear: 64, delta: "-0.950", s1: "29.180", s1Type: "yellow", s2: "39.180", s2Type: "yellow", s3: "23.830", s3Type: "yellow", soc: 48, mom: "Z-MODE",  bestLap: "1:30.890", lastLap: "1:32.190", pits: 1, posDelta: "-1", speedTrap: 317, trackPct: 0.16 },
  { pos: 21, num: 43, code: "COL", name: "F. Colapinto",   team: "Alpine",          flag: "🇦🇷", tire: "H", tireAge: 20, gap: "+36.500s", interval: "1:32.400", arrow: "down", wear: 48, delta: "-0.990", s1: "29.240", s1Type: "yellow", s2: "39.260", s2Type: "yellow", s3: "23.900", s3Type: "yellow", soc: 60, mom: "Z-MODE",  bestLap: "1:31.020", lastLap: "1:32.400", pits: 1, posDelta: "0",  speedTrap: 318, trackPct: 0.12 },
  { pos: 22, num: 41, code: "LIN", name: "A. Lindblad",    team: "Racing Bulls",    flag: "🇬🇧", tire: "S", tireAge: 12, gap: "+38.200s", interval: "1:32.750", arrow: "up",   wear: 70, delta: "-1.150", s1: "29.350", s1Type: "yellow", s2: "39.380", s2Type: "yellow", s3: "24.020", s3Type: "yellow", soc: 42, mom: "CHARGING",bestLap: "1:31.250", lastLap: "1:32.750", pits: 2, posDelta: "-1", speedTrap: 316, trackPct: 0.08 },
];

export const DRIVER_IOC_MAP = {
  NOR: "GBR", PIA: "AUS", VER: "NLD", HAD: "FRA", RUS: "GBR", ANT: "ITA",
  LEC: "MCO", HAM: "GBR", SAI: "ESP", ALB: "THA", ALO: "ESP", STR: "CAN",
  GAS: "FRA", COL: "ARG", OCO: "FRA", BEA: "GBR", HUL: "DEU", BOR: "BRA",
  LAW: "NZL", LIN: "GBR", PER: "MEX", BOT: "FIN",
};

// ── Pirelli Wheel Compound Definitions & Broadcast Badges ───────────────────
export const TIRE_CONFIG = {
  S: {
    letter: "S",
    name: "Soft",
    fullName: "Soft Compound",
    color: "#ff1801",
    glow: "rgba(255, 24, 1, 0.75)",
  },
  M: {
    letter: "M",
    name: "Medium",
    fullName: "Medium Compound",
    color: "#ffd700",
    glow: "rgba(255, 215, 0, 0.75)",
  },
  H: {
    letter: "H",
    name: "Hard",
    fullName: "Hard Compound",
    color: "#ffffff",
    glow: "rgba(255, 255, 255, 0.75)",
  },
  I: {
    letter: "I",
    name: "Intermediate",
    fullName: "Intermediate Compound",
    color: "#00cc44",
    glow: "rgba(0, 204, 68, 0.75)",
  },
  W: {
    letter: "W",
    name: "Wet",
    fullName: "Wet Compound",
    color: "#0088ff",
    glow: "rgba(0, 136, 255, 0.75)",
  },
};

export function TireWheel({ compound = "M", laps = 20 }) {
  const code = (compound || "M").toString().trim().toUpperCase()[0];
  const conf = TIRE_CONFIG[code] || TIRE_CONFIG.M;

  return (
    <div
      className="tyre-badge-container"
      title={`${conf.name} Compound · ${laps} Laps`}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "6px",
        width: "60px",
        userSelect: "none",
        cursor: "pointer",
        "--tyre-glow": conf.glow,
      }}
    >
      {/* Authentic F1 Wheel Rim with Compound Letter (S, M, H, I, W) */}
      <div
        style={{
          width: "22px",
          height: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          className="tyre-circle-svg"
          width="22"
          height="22"
          viewBox="0 0 28 28"
          style={{
            display: "block",
            overflow: "visible",
            transition: "transform 0.16s ease, filter 0.16s ease",
          }}
        >
          {/* Outer rubber tyre tread */}
          <circle cx="14" cy="14" r="13" fill="#101118" stroke="#252735" strokeWidth="1.2" />
          {/* Pirelli sidewall compound colored ring */}
          <circle cx="14" cy="14" r="10.2" fill="#141624" stroke={conf.color} strokeWidth="2.5" />
          {/* Inner wheel rim hub */}
          <circle cx="14" cy="14" r="7.8" fill="#0c0d14" />
          {/* Compound Letter inside circle */}
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

      {/* Stint Age (Lap count) with tabular figures for exact alignment */}
      <span
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "0.74rem",
          color: "#ffffff",
          fontWeight: "700",
          fontVariantNumeric: "tabular-nums",
          minWidth: "26px",
          textAlign: "left",
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        {laps}L
      </span>

      {/* Interactive Tooltip displaying compound name on hover */}
      <div
        className="tyre-tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%) translateY(4px)",
          background: "linear-gradient(180deg, #121422 0%, #0a0b12 100%)",
          border: `1px solid ${conf.color}`,
          boxShadow: `0 6px 18px rgba(0, 0, 0, 0.95), 0 0 12px ${conf.color}66`,
          padding: "5px 9px",
          borderRadius: "5px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: 0,
          visibility: "hidden",
          transition: "opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease",
          zIndex: 150,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: conf.color,
            fontSize: "0.70rem",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: "900",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textShadow: `0 0 6px ${conf.color}88`,
          }}
        >
          {conf.name}
        </div>
        <div
          style={{
            color: "#a4a8bd",
            fontSize: "0.62rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: "600",
            marginTop: "1px",
            letterSpacing: "0.02em",
          }}
        >
          Stint: <strong style={{ color: "#ffffff", fontFamily: "'Orbitron', monospace" }}>{laps} Laps</strong>
        </div>
      </div>
    </div>
  );
}

// ── Authentic Mini Compound Badge Pill for Strategy Plans ────────────────────
export function TireBadgePill({ compound = "M", label = "" }) {
  const code = (compound || "M").toString().trim().toUpperCase()[0];
  const conf = TIRE_CONFIG[code] || TIRE_CONFIG.M;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${conf.color}55`,
        padding: "2px 7px",
        borderRadius: "14px",
        fontSize: "0.68rem",
        fontFamily: "'Orbitron', monospace",
        color: "#ffffff",
        fontWeight: "700",
        letterSpacing: "0.02em",
        boxShadow: `0 0 6px ${conf.color}22`,
      }}
    >
      <span
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#0e0f17",
          border: `1.8px solid ${conf.color}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.58rem",
          fontWeight: "900",
          color: conf.color,
          boxShadow: `0 0 5px ${conf.color}88`,
          flexShrink: 0,
        }}
      >
        {conf.letter}
      </span>
      <span>{label || conf.name}</span>
    </span>
  );
}

// ── Authentic 2026 F1 Team Race Engineers Mapping ────────────────────────────
export const TEAM_RACE_ENGINEERS = {
  "McLaren": "Will Joseph",
  "Red Bull Racing": "Gianpiero Lambiase",
  "Ferrari": "Bryan Bozzi",
  "Mercedes": "Peter Bonnington",
  "Aston Martin": "Chris Cronin",
  "Williams": "Gaetan Jego",
  "Haas": "Gary Gannon",
  "Alpine": "Josh Peckett",
  "Racing Bulls": "Mattia Spini",
  "Audi": "Steven Petrik",
  "Cadillac": "Hugh Bird",
};
function SectorBadge({ time = "28.140", type = "green" }) {
  const color = type === "purple" ? "#cc44ff" : type === "green" ? "#00e676" : "#ffeb3b";
  const bg = type === "purple" ? "rgba(204,68,255,0.18)" : type === "green" ? "rgba(0,230,118,0.15)" : "rgba(255,235,59,0.12)";
  const border = type === "purple" ? "1px solid rgba(204,68,255,0.45)" : type === "green" ? "1px solid rgba(0,230,118,0.35)" : "1px solid rgba(255,235,59,0.25)";
  return (
    <span
      style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: "0.70rem",
        fontWeight: "700",
        color,
        background: bg,
        border,
        padding: "2px 4px",
        borderRadius: "3px",
        display: "inline-block",
        textAlign: "center",
        minWidth: "46px",
      }}
    >
      {time}
    </span>
  );
}

// ── 2026 350kW MGU-K Hybrid Battery SOC Component ────────────────────────────
function HybridSocBar({ soc = 80 }) {
  const barColor = soc > 70 ? "#00e676" : soc > 45 ? "#ffcc00" : "#ff3b30";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: "68px" }}>
      <div style={{ flex: 1, height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${soc}%`,
            height: "100%",
            background: barColor,
            borderRadius: "3px",
            boxShadow: `0 0 6px ${barColor}`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "700", color: "#e8e8f0", minWidth: "24px", textAlign: "right" }}>
        {soc}%
      </span>
    </div>
  );
}

// ── 2026 Active Aero & MOM Badge Component ──────────────────────────────────
function AeroBadge({ mom = "Z-MODE" }) {
  const isMom = mom === "MOM ON" || mom === "ACTIVE";
  const isX = mom === "X-MODE";
  const isZ = mom === "Z-MODE";
  const color = isMom ? "#ff0055" : isX ? "#00d2be" : isZ ? "#4488ff" : "#ffaa00";
  const bg = isMom ? "rgba(255,0,85,0.18)" : isX ? "rgba(0,210,190,0.15)" : isZ ? "rgba(68,136,255,0.15)" : "rgba(255,170,0,0.15)";
  return (
    <span
      style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: "0.62rem",
        fontWeight: "800",
        color,
        background: bg,
        border: `1px solid ${color}55`,
        padding: "2px 5px",
        borderRadius: "3px",
        whiteSpace: "nowrap",
        letterSpacing: "0.04em",
      }}
    >
      {mom}
    </span>
  );
}

// ── 2026 Active Aero & Wing Actuator Demonstrator ─────────────────────────
function ActiveAeroDemonstrator({
  mode = "Z-MODE",
  onToggleMode,
  momBoostActive,
  onTriggerMom,
  momCooldown,
  selectedDriver
}) {
  const isZ = mode === "Z-MODE";
  // Z-Mode: Corner Downforce (flaps at 32°), X-Mode: Straight Low-Drag (flaps at 6°)
  const flapAngle = isZ ? 32 : 6;
  const downforceKg = isZ ? 1420 : 680;
  const dragCd = isZ ? 0.88 : 0.46;
  const topSpeedEst = isZ ? 322 : 347;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(9, 12, 20, 0.98) 100%)",
        border: isZ ? "1px solid rgba(68, 136, 255, 0.4)" : "1px solid rgba(0, 210, 190, 0.4)",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.9rem" }}>🌀</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.70rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
            2026 ACTIVE AERO ACTUATOR
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => onToggleMode("Z-MODE")}
            style={{
              all: "unset",
              cursor: "pointer",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.62rem",
              fontWeight: "900",
              padding: "2px 8px",
              borderRadius: "4px",
              background: isZ ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
              color: isZ ? "#ffffff" : "var(--text-dim)",
              border: `1px solid ${isZ ? "#60a5fa" : "rgba(255,255,255,0.1)"}`,
              boxShadow: isZ ? "0 0 10px rgba(37, 99, 235, 0.6)" : "none",
            }}
          >
            Z-MODE (DOWNFORCE)
          </button>
          <button
            onClick={() => onToggleMode("X-MODE")}
            style={{
              all: "unset",
              cursor: "pointer",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.62rem",
              fontWeight: "900",
              padding: "2px 8px",
              borderRadius: "4px",
              background: !isZ ? "linear-gradient(135deg, #00d2be, #00998a)" : "rgba(255,255,255,0.05)",
              color: !isZ ? "#000000" : "var(--text-dim)",
              border: `1px solid ${!isZ ? "#00d2be" : "rgba(255,255,255,0.1)"}`,
              boxShadow: !isZ ? "0 0 10px rgba(0, 210, 190, 0.6)" : "none",
            }}
          >
            X-MODE (LOW-DRAG)
          </button>
        </div>
      </div>

      {/* SVG Wing Flap Demonstration Schematic */}
      <div
        style={{
          width: "100%",
          height: "90px",
          background: "radial-gradient(circle at center, rgba(0,210,190,0.06) 0%, rgba(5,7,12,0.9) 100%)",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg viewBox="0 0 280 85" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="aeroWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isZ ? "#3b82f6" : "#00d2be"} />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 210, 190, 0.1)" />
              <stop offset="50%" stopColor={isZ ? "rgba(59, 130, 246, 0.6)" : "rgba(0, 210, 190, 0.7)"} />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.9)" />
            </linearGradient>
          </defs>

          {/* Airflow streamlines */}
          <path d="M 10 25 Q 90 20, 150 24 T 270 28" fill="none" stroke="url(#flowGrad)" strokeWidth="1.5" strokeDasharray="6 4">
            <animate attributeName="stroke-dashoffset" from="30" to="0" dur={isZ ? "1.8s" : "0.9s"} repeatCount="indefinite" />
          </path>
          <path d="M 10 45 Q 90 40, 150 44 T 270 48" fill="none" stroke="url(#flowGrad)" strokeWidth="1.8" strokeDasharray="8 4">
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur={isZ ? "1.6s" : "0.8s"} repeatCount="indefinite" />
          </path>
          <path d="M 10 65 Q 90 60, 150 62 T 270 65" fill="none" stroke="url(#flowGrad)" strokeWidth="1.2" strokeDasharray="5 3">
            <animate attributeName="stroke-dashoffset" from="25" to="0" dur={isZ ? "2.0s" : "1.0s"} repeatCount="indefinite" />
          </path>

          {/* Front Main Plane (fixed) */}
          <path d="M 40 55 C 50 48, 75 48, 85 52 L 80 58 C 70 54, 50 54, 40 55 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
          {/* Active Front Flap (Rotates on angle) */}
          <g transform={`rotate(${isZ ? -22 : -5}, 80, 52)`} style={{ transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <path d="M 80 52 C 90 46, 108 44, 118 48 L 115 54 C 105 50, 90 50, 80 52 Z" fill="url(#aeroWingGrad)" stroke={isZ ? "#60a5fa" : "#00d2be"} strokeWidth="1.2" />
          </g>

          {/* Rear Wing Endplate Profile */}
          <path d="M 175 62 L 180 20 L 235 18 L 240 60 Z" fill="rgba(30, 41, 59, 0.8)" stroke="#475569" strokeWidth="1" />
          {/* Rear Lower Main Plane */}
          <path d="M 180 38 C 195 34, 215 34, 230 38 L 228 42 C 215 39, 195 39, 180 42 Z" fill="#64748b" />
          {/* Rear Active Beam Flap (Tilts between high drag 35° and low drag 6°) */}
          <g transform={`rotate(${isZ ? -32 : -6}, 210, 24)`} style={{ transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <path d="M 190 26 C 205 20, 222 20, 235 24 L 232 29 C 220 25, 205 25, 190 30 Z" fill="url(#aeroWingGrad)" stroke={isZ ? "#60a5fa" : "#00d2be"} strokeWidth="1.5" />
          </g>

          {/* HUD Status label */}
          <text x="140" y="78" textAnchor="middle" fill={isZ ? "#93c5fd" : "#00d2be"} fontSize="9" fontFamily="'Orbitron', monospace" fontWeight="800">
            {isZ ? "Z-MODE: CORNER DOWNFORCE [FLAPS 32°]" : "X-MODE: STRAIGHTLINE LOW-DRAG [FLAPS 6°]"}
          </text>
        </svg>
      </div>

      {/* Aerodynamic Telemetry Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", background: "rgba(0,0,0,0.4)", padding: "5px 6px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>WING ANGLE</div>
          <div style={{ fontSize: "0.72rem", color: isZ ? "#60a5fa" : "#00d2be", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {flapAngle}°
          </div>
        </div>
        <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>DOWNFORCE</div>
          <div style={{ fontSize: "0.72rem", color: "#ffffff", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {downforceKg} <span style={{ fontSize: "0.50rem" }}>KG</span>
          </div>
        </div>
        <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>DRAG COEFF</div>
          <div style={{ fontSize: "0.72rem", color: isZ ? "#ffaa00" : "var(--neon-green)", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {dragCd} Cd
          </div>
        </div>
        <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>EST TOP SPD</div>
          <div style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {topSpeedEst} <span style={{ fontSize: "0.50rem" }}>KM/H</span>
          </div>
        </div>
      </div>

      {/* MOM (Manual Override Mode) 350kW "Push to Pass" Cockpit Boost Trigger */}
      <div
        style={{
          background: momBoostActive
            ? "linear-gradient(135deg, rgba(255, 0, 85, 0.25) 0%, rgba(20, 0, 10, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(10, 12, 18, 0.9) 100%)",
          border: momBoostActive ? "1px solid var(--neon-red)" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px",
          padding: "7px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: momBoostActive ? "0 0 16px rgba(255, 0, 85, 0.5)" : "none",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.85rem" }}>⚡</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: momBoostActive ? "var(--neon-red)" : "#ffffff" }}>
              MOM 350kW MANUAL OVERRIDE
            </span>
          </div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", marginTop: "2px" }}>
            Focus: #{selectedDriver?.num} {selectedDriver?.code} · Consumes 12% SOC for +18 km/h boost
          </div>
        </div>
        <button
          onClick={onTriggerMom}
          disabled={momCooldown > 0 || momBoostActive}
          style={{
            all: "unset",
            cursor: momCooldown > 0 || momBoostActive ? "not-allowed" : "pointer",
            background: momBoostActive
              ? "linear-gradient(135deg, #ff0055, #b3003b)"
              : (momCooldown > 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00d2be, #00998a)"),
            color: momBoostActive ? "#ffffff" : (momCooldown > 0 ? "var(--text-dim)" : "#000000"),
            padding: "5px 12px",
            borderRadius: "4px",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.64rem",
            fontWeight: "900",
            letterSpacing: "0.04em",
            boxShadow: momBoostActive ? "0 0 14px rgba(255,0,85,0.8)" : (momCooldown > 0 ? "none" : "0 0 10px rgba(0,210,190,0.5)"),
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>{momBoostActive ? "🔥 ACTIVE" : (momCooldown > 0 ? `⏳ COOL (${momCooldown}s)` : "🚀 PUSH TO PASS")}</span>
        </button>
      </div>
    </div>
  );
}

// ── Helper to format clean driver surname (e.g. "Norris", "Sainz Jr.") ──────────
function formatDriverSurname(name) {
  if (!name) return "";
  if (name.includes("Sainz")) return "Sainz Jr.";
  const parts = name.split(" ");
  return parts.slice(1).join(" ");
}

// ── Authentic F1 TV Broadcast Overtake Audio Chime ─────────────────────────────
function playF1OvertakeChime(muted = false) {
  if (muted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);

    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.12);
        gain2.gain.setValueAtTime(0.09, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      } catch (_) {}
    }, 90);
  } catch (_) {}
}

function TimingTower({ selectedCircuit, onGoToCalendar }) {
  const gpName = selectedCircuit?.grand_prix_name || "AUSTRALIAN GRAND PRIX";
  const roundNum = selectedCircuit?.round || 1;
  const maxLaps = selectedCircuit?.laps || 58;

  const activeCircuitId = selectedCircuit?.circuit_id || "australia";
  const activeTrackPath = OFFICIAL_CIRCUIT_PATHS[activeCircuitId] || OFFICIAL_CIRCUIT_PATHS.australia;

  // Dynamic 2026 Grand Prix Weather Forecast
  const weather = useMemo(() => {
    if (selectedCircuit?.weather) return selectedCircuit.weather;
    return getCircuitWeather(activeCircuitId);
  }, [selectedCircuit, activeCircuitId]);

  // Grand Prix configuration & Qualifying blueprint
  const gpConfig = useMemo(() => {
    return getGrandPrixConfig(activeCircuitId);
  }, [activeCircuitId]);

  const [currentLap, setCurrentLap] = useState(34);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState(0);
  const [drivers, setDrivers] = useState(() => buildTimingTowerGridForCircuit("australia", 34));
  const [radioMsg, setRadioMsg] = useState("Box this lap for Hard compounds. Push hard on in-lap.");
  const [radioFeedIdx, setRadioFeedIdx] = useState(0);

  // ── 2026 Dynamic Race Sim, Weather & Active Aero State ─────────────────
  const [trackDampness, setTrackDampness] = useState(0); // 0% - 100%
  const [weatherMode, setWeatherMode] = useState("auto"); // "auto" | "dry" | "drizzle" | "wet"
  const [activeAeroMode, setActiveAeroMode] = useState("Z-MODE"); // "Z-MODE" | "X-MODE"
  const [momBoostActive, setMomBoostActive] = useState(false);
  const [momCooldown, setMomCooldown] = useState(0);
  const [overtakeEvent, setOvertakeEvent] = useState(null);
  const [activeOvertake, setActiveOvertake] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [lapHistory, setLapHistory] = useState(() => generateRaceWeekendData("australia", 58).lapHistory);

  // Switch to Grand Prix's unique starting grid and lap matrix progression whenever selected circuit changes
  useEffect(() => {
    const raceWeekend = generateRaceWeekendData(activeCircuitId, maxLaps);
    setLapHistory(raceWeekend.lapHistory);
    const newGrid = buildTimingTowerGridForCircuit(activeCircuitId, currentLap);
    setDrivers(newGrid);
    setSelectedDriverIdx(0);
  }, [activeCircuitId, maxLaps]);

  // Real-time Session Flag Status: "GREEN", "SC", "VSC", "RED"
  const [sessionFlag, setSessionFlag] = useState("GREEN");
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);
  const [isFiaModalOpen, setIsFiaModalOpen] = useState(false);
  // Pit Wall Operational View: "tower" (Matrix Timing Grid) by default, "lapMatrix" (StatsF1 Tour-par-tour), or "map" (3D Satellite Tracker)
  const [activePitWallTab, setActivePitWallTab] = useState("tower");
  // Timing Matrix Density Mode: "broadcast" (roomy, rich) vs "compact" (fits all 22 drivers without scroll)
  const [tableDensity, setTableDensity] = useState("broadcast");
  // Selected driver reference
  const currentDriver = drivers[selectedDriverIdx] || drivers[0];

  // MOM 350kW Boost Trigger
  const handleTriggerMom = () => {
    if (momCooldown > 0 || momBoostActive) return;
    setMomBoostActive(true);
    setMomCooldown(4);
    setRadioMsg(`[MOM 350kW ENGAGED] Max electric deployment active for #${currentDriver.num} ${currentDriver.code}. Push to overtake!`);
    setOvertakeEvent(`⚡ MOM 350kW BOOST: #${currentDriver.num} ${currentDriver.code} deployed full electrical override!`);
  };

  // Realistic Interactive Overtake Duel Simulator
  const handleTriggerDuelOvertake = () => {
    setDrivers((prevDrivers) => {
      if (prevDrivers.length < 2) return prevDrivers;
      let targetIdx = selectedDriverIdx > 0 ? selectedDriverIdx - 1 : 0;
      let attackerIdx = targetIdx + 1;

      const carAhead = prevDrivers[targetIdx];
      const carBehind = prevDrivers[attackerIdx];

      const updated = [...prevDrivers];
      updated[targetIdx] = { ...carBehind, pos: targetIdx + 1, posDelta: "+1", arrow: "up", overtaken: true };
      updated[attackerIdx] = { ...carAhead, pos: attackerIdx + 1, posDelta: "-1", arrow: "down" };

      setSelectedDriverIdx(targetIdx);

      const boostReason = momBoostActive ? "with 350kW MOM Overdrive" : "down the Main Straight DRS";
      setActiveOvertake({
        winnerCode: carBehind.code,
        winnerNum: carBehind.num,
        winnerTeam: carBehind.team,
        loserCode: carAhead.code,
        loserNum: carAhead.num,
        loserTeam: carAhead.team,
        toPos: targetIdx + 1,
        fromPos: attackerIdx + 1,
        lap: currentLap,
        reason: boostReason,
        timestamp: Date.now(),
      });
      playF1OvertakeChime(isSoundMuted);

      setOvertakeEvent(`⚔️ P${targetIdx + 1} OVERTAKE: ${carBehind.code} (#${carBehind.num}) passes ${carAhead.code} ${boostReason}!`);

      setTimeout(() => {
        setActiveOvertake((curr) => (curr && Date.now() - curr.timestamp >= 3800 ? null : curr));
      }, 4000);

      // Synchronize live overtake into lapHistory
      setLapHistory((prev) => {
        if (!prev || prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        const currentEntry = copy[lastIdx];
        const newOrder = updated.map((d) => d.code);
        const newOvertake = {
          winner: carBehind.code,
          loser: carAhead.code,
          winnerNum: carBehind.num,
          loserNum: carAhead.num,
          pos: targetIdx + 1,
          fromPos: attackerIdx + 1,
          reason: boostReason,
        };
        copy[lastIdx] = {
          ...currentEntry,
          order: newOrder,
          overtakes: [...(currentEntry.overtakes || []), newOvertake],
        };
        return copy;
      });

      // Recompute gaps smoothly
      let accumulatedGap = 0;
      return updated.map((d, idx) => {
        if (idx === 0) return { ...d, pos: 1, gap: "LEADER", interval: "1:28.412" };
        const gapStep = +(0.8 + idx * 0.12).toFixed(3);
        accumulatedGap += gapStep;
        return {
          ...d,
          pos: idx + 1,
          gap: `+${accumulatedGap.toFixed(3)}s`,
          interval: `+${gapStep.toFixed(3)}s`,
        };
      });
    });
  };

  // Active Aero toggle
  const handleToggleAero = (mode) => {
    setActiveAeroMode(mode);
    setRadioMsg(`[ACTIVE AERO] Mode switched to ${mode}. Flap actuator angle updated.`);
  };

  // Dynamic Telemetry Chart Data for Selected Driver
  const tireWearData = useMemo(() => [
    { lap: "L20", wear: 55, target: 50 },
    { lap: "L24", wear: 48, target: 44 },
    { lap: "L28", wear: 42, target: 38 },
    { lap: "L31", wear: 34, target: 30 },
    { lap: "L34", wear: 26, target: 24 },
    { lap: "L38", wear: 18, target: 16 },
  ], []);

  // Segmented Sidebar Telemetry Leaderboard Tab: "speed" (default), "pace", "all"
  const [telemetryTab, setTelemetryTab] = useState("speed");
  const [customRadioInput, setCustomRadioInput] = useState("");

  const deltaComparisonData = useMemo(() => {
    const isLeader = currentDriver.code === "NOR";

    if (isLeader) {
      // Norris (Leader) vs Verstappen (P2 Rival)
      return [
        { lap: "L30", Leader: 1.289, Selected: 1.292, leaderTime: "1:28.900", selectedTime: "1:29.210", delta: "-0.310s" },
        { lap: "L31", Leader: 1.287, Selected: 1.289, leaderTime: "1:28.710", selectedTime: "1:28.980", delta: "-0.270s" },
        { lap: "L32", Leader: 1.286, Selected: 1.288, leaderTime: "1:28.620", selectedTime: "1:28.850", delta: "-0.230s" },
        { lap: "L33", Leader: 1.284, Selected: 1.286, leaderTime: "1:28.412", selectedTime: "1:28.640", delta: "-0.228s" },
        { lap: "L34", Leader: 1.285, Selected: 1.287, leaderTime: "1:28.520", selectedTime: "1:28.730", delta: "-0.210s" },
      ];
    }

    // Selected driver vs P1 Leader
    const rawDelta = parseFloat(currentDriver.delta || "0.4");
    const offset = isNaN(rawDelta) ? 0.35 : Math.abs(rawDelta);

    return [
      {
        lap: "L30",
        Leader: 1.289,
        Selected: +(1.289 + offset * 0.01).toFixed(3),
        leaderTime: "1:28.900",
        selectedTime: `1:${(28.90 + offset).toFixed(3)}`,
        delta: `+${offset.toFixed(3)}s`,
      },
      {
        lap: "L31",
        Leader: 1.287,
        Selected: +(1.287 + (offset + 0.04) * 0.01).toFixed(3),
        leaderTime: "1:28.710",
        selectedTime: `1:${(28.71 + offset + 0.04).toFixed(3)}`,
        delta: `+${(offset + 0.04).toFixed(3)}s`,
      },
      {
        lap: "L32",
        Leader: 1.286,
        Selected: +(1.286 + (offset + 0.02) * 0.01).toFixed(3),
        leaderTime: "1:28.620",
        selectedTime: `1:${(28.62 + offset + 0.02).toFixed(3)}`,
        delta: `+${(offset + 0.02).toFixed(3)}s`,
      },
      {
        lap: "L33",
        Leader: 1.284,
        Selected: +(1.284 + (offset - 0.03) * 0.01).toFixed(3),
        leaderTime: "1:28.412",
        selectedTime: `1:${(28.41 + offset - 0.03).toFixed(3)}`,
        delta: `+${(offset - 0.03).toFixed(3)}s`,
      },
      {
        lap: "L34",
        Leader: 1.285,
        Selected: +(1.285 + offset * 0.01).toFixed(3),
        leaderTime: "1:28.520",
        selectedTime: `1:${(28.52 + offset).toFixed(3)}`,
        delta: `+${offset.toFixed(3)}s`,
      },
    ];
  }, [currentDriver.code, currentDriver.delta]);

  // Live simulation tick: Overtaking engine, Weather transitions & Pit Stops
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      // 1. Weather and Dampness Evolution
      setTrackDampness((prevDamp) => {
        if (weatherMode === "wet") return Math.min(95, prevDamp + 10);
        if (weatherMode === "drizzle") return prevDamp < 45 ? Math.min(45, prevDamp + 5) : Math.max(40, prevDamp - 2);
        if (weatherMode === "dry") return Math.max(0, prevDamp - 8);
        return prevDamp;
      });

      // MOM cooldown handler
      setMomCooldown((cd) => (cd > 0 ? cd - 1 : 0));
      if (momBoostActive) {
        setMomBoostActive(false);
      }

      setCurrentLap((prevLap) => {
        const nextLap = prevLap >= maxLaps ? 1 : prevLap + 1;

        // Auto weather evolution
        if (weatherMode === "auto") {
          if (nextLap >= 38 && nextLap <= 44) {
            setTrackDampness((d) => Math.min(85, d + 12));
          } else if (nextLap > 44) {
            setTrackDampness((d) => Math.max(10, d - 6));
          }
        }

        setDrivers((prevDrivers) => {
          let updated = prevDrivers.map((d) => {
            const isSelected = d.code === currentDriver.code;
            const hasMom = isSelected && momBoostActive;
            const isSlick = d.tire === "S" || d.tire === "Medium" || d.tire === "M" || d.tire === "H" || d.tire === "Hard" || d.tire === "Soft";
            const isWetTire = d.tire === "I" || d.tire === "W";

            // Slicks on wet track penalty: high wear + pace drop
            const wetWearPenalty = (trackDampness > 30 && isSlick) ? 3 : (trackDampness < 20 && isWetTire) ? 3 : 1;
            const newWear = Math.min(100, (d.wear || 20) + wetWearPenalty);
            const newTireAge = (d.tireAge || 10) + 1;
            const newSoc = hasMom
              ? Math.max(10, d.soc - 12)
              : Math.max(15, Math.min(100, d.soc + (Math.random() > 0.45 ? -3 : 2)));

            let pState = d.pitState || "RACING";
            let pTimer = d.pitTimer || 0;
            let currentTire = d.tire;
            let pitsCount = d.pits || 1;

            // Pit stop lifecycle
            if (pState === "IN PIT") {
              pTimer = Math.max(0, +(pTimer - 0.8).toFixed(1));
              if (pTimer <= 0) {
                pState = "OUT LAP";
                pitsCount += 1;
                if (trackDampness > 60) currentTire = "W";
                else if (trackDampness > 25) currentTire = "I";
                else currentTire = d.tire === "M" ? "H" : "M";
              }
            } else if (pState === "OUT LAP") {
              pState = "RACING";
            } else if (pState === "RACING") {
              // Trigger pit if wear > 74% or wrong compound in rain
              if (newWear > 74 || (trackDampness > 35 && isSlick && Math.random() > 0.6)) {
                pState = "IN PIT";
                pTimer = 2.4;
              }
            }

            const momDisplay = hasMom ? "MOM 350kW" : isSelected ? activeAeroMode : (d.mom || "Z-MODE");

            return {
              ...d,
              wear: pState === "OUT LAP" ? 8 : newWear,
              tireAge: pState === "OUT LAP" ? 0 : newTireAge,
              tire: currentTire,
              pits: pitsCount,
              pitState: pState,
              pitTimer: pTimer,
              soc: newSoc,
              mom: momDisplay,
              overtaken: false,
              trackPct: (d.trackPct + 0.02) % 1,
            };
          });

          // 2. Dynamic Overtaking Engine
          let overtakeOccurred = false;
          let newAlert = null;

          for (let i = 0; i < updated.length - 1; i++) {
            const carAhead = updated[i];
            const carBehind = updated[i + 1];

            if (carAhead.pitState === "IN PIT" && carBehind.pitState !== "IN PIT") {
              updated[i] = { ...carBehind, pos: i + 1, posDelta: "+1", arrow: "up", overtaken: true };
              updated[i + 1] = { ...carAhead, pos: i + 2, posDelta: "-1", arrow: "down" };
              overtakeOccurred = true;
              newAlert = `⚔️ P${i + 1} ADVANCE: ${carBehind.code} (#${carBehind.num}) passes ${carAhead.code} as they Box!`;
              setActiveOvertake({
                winnerCode: carBehind.code,
                winnerNum: carBehind.num,
                winnerTeam: carBehind.team,
                loserCode: carAhead.code,
                loserNum: carAhead.num,
                loserTeam: carAhead.team,
                toPos: i + 1,
                fromPos: i + 2,
                lap: nextLap,
                reason: "Pit Lane Delta Advantage",
                timestamp: Date.now(),
              });
              playF1OvertakeChime(isSoundMuted);
              break;
            }

            if (carAhead.pitState === "RACING" && carBehind.pitState === "RACING") {
              const aheadSlickPenalty = (trackDampness > 30 && (carAhead.tire === "S" || carAhead.tire === "M" || carAhead.tire === "H")) ? 3.5 : 0;
              const behindSlickPenalty = (trackDampness > 30 && (carBehind.tire === "S" || carBehind.tire === "M" || carBehind.tire === "H")) ? 3.5 : 0;

              const aheadScore = (100 - carAhead.wear) * 0.4 + (carAhead.soc * 0.2) - aheadSlickPenalty;
              const behindMomBonus = (carBehind.code === currentDriver.code && momBoostActive) ? 18 : 0;
              const behindScore = (100 - carBehind.wear) * 0.4 + (carBehind.soc * 0.2) + behindMomBonus - behindSlickPenalty;

              if (behindScore > aheadScore + 10 && Math.random() > 0.45) {
                updated[i] = { ...carBehind, pos: i + 1, posDelta: "+1", arrow: "up", overtaken: true };
                updated[i + 1] = { ...carAhead, pos: i + 2, posDelta: "-1", arrow: "down" };
                overtakeOccurred = true;
                const boostStr = behindMomBonus > 0 ? " with MOM 350kW Boost" : "";
                newAlert = `⚔️ P${i + 1} OVERTAKE: ${carBehind.code} (#${carBehind.num}) passes ${carAhead.code} into Turn 4${boostStr}!`;

                setActiveOvertake({
                  winnerCode: carBehind.code,
                  winnerNum: carBehind.num,
                  winnerTeam: carBehind.team,
                  loserCode: carAhead.code,
                  loserNum: carAhead.num,
                  loserTeam: carAhead.team,
                  toPos: i + 1,
                  fromPos: i + 2,
                  lap: nextLap,
                  reason: `Turn 4 ${boostStr || "DRS Pass"}`,
                  timestamp: Date.now(),
                });
                playF1OvertakeChime(isSoundMuted);
                break;
              }
            }
          }

          if (overtakeOccurred && newAlert) {
            setOvertakeEvent(newAlert);
            setTimeout(() => {
              setActiveOvertake((curr) => (curr && Date.now() - curr.timestamp >= 3800 ? null : curr));
            }, 4000);
          }

          // 3. Dynamic intervals
          let accumulatedGap = 0;
          return updated.map((d, idx) => {
            if (idx === 0) {
              return {
                ...d,
                pos: 1,
                gap: "LEADER",
                interval: "1:28.750",
              };
            }
            const gapStep = +(0.8 + (idx * 0.12) + (d.pitState === "IN PIT" ? 18.0 : 0)).toFixed(3);
            accumulatedGap += gapStep;
            return {
              ...d,
              pos: idx + 1,
              gap: `+${accumulatedGap.toFixed(3)}s`,
              interval: `+${gapStep.toFixed(3)}s`,
            };
          });
        });

        return nextLap;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isPlaying, maxLaps, weatherMode, trackDampness, momBoostActive, activeAeroMode, currentDriver.code]);

  // Quick Tactical Radio Dispatch Helper
  const handleSendRadio = (cmd) => {
    setRadioMsg(cmd);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {/* ── Dynamic Broadcast Tooltip & Logo Hover Styles ── */}
      <style>{`
        .team-logo-hover-box:hover .team-tooltip {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
        }
        .team-logo-hover-box:hover img {
          transform: scale(1.25) !important;
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.7)) !important;
        }
        .tyre-badge-container:hover .tyre-tooltip {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
          visibility: visible !important;
        }
        .tyre-badge-container:hover .tyre-circle-svg {
          transform: scale(1.18) !important;
          filter: drop-shadow(0 0 7px var(--tyre-glow, rgba(255, 255, 255, 0.7))) !important;
        }
        @keyframes pulseFlag {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseOvertake {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); filter: drop-shadow(0 0 8px rgba(0, 210, 190, 0.5)); }
        }
        @keyframes goldShine {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.5)); }
          50% { filter: drop-shadow(0 0 9px rgba(255, 215, 0, 0.9)); }
        }
        @keyframes f1PulseOvertakeGreen {
          0%, 100% {
            background-color: rgba(0, 230, 118, 0.22);
            box-shadow: 0 0 16px rgba(0, 230, 118, 0.55), inset 0 0 8px rgba(0, 230, 118, 0.3);
          }
          50% {
            background-color: rgba(0, 230, 118, 0.38);
            box-shadow: 0 0 28px rgba(0, 230, 118, 0.85), inset 0 0 14px rgba(0, 230, 118, 0.5);
          }
        }
        @keyframes f1PulseOvertakeRed {
          0%, 100% {
            background-color: rgba(255, 24, 1, 0.20);
            box-shadow: 0 0 14px rgba(255, 24, 1, 0.4);
          }
          50% {
            background-color: rgba(255, 24, 1, 0.36);
            box-shadow: 0 0 24px rgba(255, 24, 1, 0.7);
          }
        }
        @keyframes f1PillPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); filter: drop-shadow(0 0 5px currentColor); }
        }
        @keyframes f1BroadcastBannerIn {
          0% { transform: translateY(-16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .f1-timing-row {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.35s ease, border-left 0.3s ease, box-shadow 0.35s ease;
        }
      `}</style>

      {/* ════════ UNIFIED F1 PIT WALL MISSION CONTROL GANTRY DECK ════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(9, 12, 19, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderTop: "2px solid var(--neon-red)",
          borderRadius: "8px",
          padding: "6px 12px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.7), 0 0 16px rgba(232, 0, 45, 0.2)",
          flexWrap: "wrap",
        }}
      >
        {/* ── ZONE 1: ILLUMINATED DUAL-VIEW COCKPIT SWITCHER ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={() => setActivePitWallTab("tower")}
            style={{
              background: activePitWallTab === "tower"
                ? "linear-gradient(135deg, rgba(232, 0, 45, 0.35) 0%, rgba(255, 60, 90, 0.2) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "tower" ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.1)",
              color: activePitWallTab === "tower" ? "#ffffff" : "var(--text-secondary)",
              padding: "4px 12px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.70rem",
              fontWeight: "900",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activePitWallTab === "tower" ? "0 0 14px rgba(232, 0, 45, 0.45)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>📊</span>
            <span>TIMING MATRIX</span>
          </button>

          <button
            onClick={() => setActivePitWallTab("lapMatrix")}
            style={{
              background: activePitWallTab === "lapMatrix"
                ? "linear-gradient(135deg, rgba(23, 106, 199, 0.4) 0%, rgba(0, 210, 190, 0.25) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "lapMatrix" ? "1px solid #176ac7" : "1px solid rgba(255, 255, 255, 0.1)",
              color: activePitWallTab === "lapMatrix" ? "#ffffff" : "var(--text-secondary)",
              padding: "4px 12px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.70rem",
              fontWeight: "900",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activePitWallTab === "lapMatrix" ? "0 0 14px rgba(23, 106, 199, 0.5)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>📈</span>
            <span>STATSF1 LAP CHART</span>
            <span
              style={{
                fontSize: "0.56rem",
                background: "rgba(23, 106, 199, 0.3)",
                border: "1px solid #176ac7",
                color: "#66b3ff",
                padding: "1px 4px",
                borderRadius: "3px",
                fontWeight: "800",
              }}
            >
              TOUR PAR TOUR
            </span>
          </button>

          <button
            onClick={() => setActivePitWallTab("map")}
            style={{
              background: activePitWallTab === "map"
                ? "linear-gradient(135deg, rgba(0, 210, 190, 0.35) 0%, rgba(0, 144, 255, 0.22) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "map" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
              color: activePitWallTab === "map" ? "#ffffff" : "var(--text-secondary)",
              padding: "4px 12px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.70rem",
              fontWeight: "900",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activePitWallTab === "map" ? "0 0 16px rgba(0, 210, 190, 0.45)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>🗺️</span>
            <span>3D SATELLITE RADAR</span>
            <span
              style={{
                fontSize: "0.58rem",
                background: "rgba(0, 210, 190, 0.2)",
                border: "1px solid rgba(0, 210, 190, 0.5)",
                color: "var(--neon-cyan)",
                padding: "1px 5px",
                borderRadius: "3px",
                fontWeight: "800",
              }}
            >
              ● 22 CARS LIVE
            </span>
          </button>
        </div>

        {/* ── ZONE 2: RACE CONTROL STATUS & LAP PROGRESS ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* FIA Flag Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "rgba(0,0,0,0.45)", padding: "2px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setSessionFlag("GREEN")}
              style={{
                background: sessionFlag === "GREEN" ? "rgba(0,204,68,0.28)" : "transparent",
                border: sessionFlag === "GREEN" ? "1px solid var(--neon-green)" : "1px solid transparent",
                color: sessionFlag === "GREEN" ? "#ffffff" : "var(--text-dim)",
                padding: "2.5px 7px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: sessionFlag === "GREEN" ? "0 0 8px rgba(0,204,68,0.4)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sessionFlag === "GREEN" ? "var(--neon-green)" : "#555" }} />
              TRACK GREEN
            </button>

            <button
              onClick={() => setSessionFlag("SC")}
              style={{
                background: sessionFlag === "SC" ? "rgba(255,221,0,0.28)" : "transparent",
                border: sessionFlag === "SC" ? "1px solid #ffdd00" : "1px solid transparent",
                color: sessionFlag === "SC" ? "#ffdd00" : "var(--text-dim)",
                padding: "2.5px 7px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: sessionFlag === "SC" ? "0 0 8px rgba(255,221,0,0.4)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sessionFlag === "SC" ? "#ffdd00" : "#555" }} />
              SC
            </button>

            <button
              onClick={() => setSessionFlag("VSC")}
              style={{
                background: sessionFlag === "VSC" ? "rgba(255,140,0,0.28)" : "transparent",
                border: sessionFlag === "VSC" ? "1px solid #ff8c00" : "1px solid transparent",
                color: sessionFlag === "VSC" ? "#ff8c00" : "var(--text-dim)",
                padding: "2.5px 7px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: sessionFlag === "VSC" ? "0 0 8px rgba(255,140,0,0.4)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sessionFlag === "VSC" ? "#ff8c00" : "#555" }} />
              VSC
            </button>

            <button
              onClick={() => setIsFiaModalOpen(true)}
              style={{
                background: "rgba(0, 210, 190, 0.12)",
                border: "1px solid rgba(0, 210, 190, 0.4)",
                color: "var(--neon-cyan)",
                padding: "2.5px 8px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Open FIA Race Control Bulletin"
            >
              <span>📋 FIA</span>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--neon-cyan)" }} />
            </button>
          </div>

          {/* Lap Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.64rem", color: "var(--text-secondary)" }}>
              LAP {currentLap}/{maxLaps} <span style={{ color: "var(--neon-green)", fontWeight: "700" }}>({Math.round((currentLap / maxLaps) * 100)}%)</span>
            </span>
            <div style={{ width: "70px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${(currentLap / maxLaps) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-green), var(--neon-cyan))", borderRadius: "2px", boxShadow: "0 0 6px var(--neon-green)" }} />
            </div>
          </div>
        </div>

        {/* ── ZONE 3: BROADCAST TELEMETRY STRIP ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Fastest Lap Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(155, 89, 182, 0.16)",
              border: "1px solid #9b59b6",
              padding: "2.5px 8px",
              borderRadius: "5px",
              fontSize: "0.66rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "800",
              color: "#ffffff",
              boxShadow: "0 0 10px rgba(155, 89, 182, 0.3)",
            }}
          >
            <span style={{ color: "#cc44ff" }}>🟣 FASTEST:</span>
            <span style={{ color: "#ff8700" }}>NOR #1</span>
            <span style={{ color: "#ffffff" }}>1:28.412</span>
          </div>

          {/* Dynamic Weather & Dampness Capsule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: trackDampness > 30 ? "rgba(0, 160, 222, 0.12)" : "rgba(255,255,255,0.04)",
              border: trackDampness > 30 ? "1px solid rgba(0, 160, 222, 0.4)" : "1px solid rgba(255,255,255,0.1)",
              padding: "2.5px 8px",
              borderRadius: "5px",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              color: "var(--text-secondary)",
            }}
          >
            <span>{trackDampness > 60 ? "🌧️" : trackDampness > 25 ? "🌦️" : (weather.icon || "☀️")}</span>
            <span>
              DAMP: <strong style={{ color: trackDampness > 60 ? "#00a0de" : trackDampness > 25 ? "#39b54a" : "#ffffff" }}>{trackDampness}%</strong>
            </span>
            {/* Quick Weather Mode Selectors */}
            <div style={{ display: "flex", gap: "2px", marginLeft: "2px" }}>
              {[
                { id: "auto", label: "AUTO" },
                { id: "dry", label: "DRY" },
                { id: "drizzle", label: "DRIZ" },
                { id: "wet", label: "WET" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWeatherMode(m.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontSize: "0.55rem",
                    fontWeight: "800",
                    background: weatherMode === m.id ? (m.id === "wet" ? "#00a0de" : m.id === "drizzle" ? "#39b54a" : "var(--neon-green)") : "rgba(255,255,255,0.06)",
                    color: weatherMode === m.id ? "#000000" : "var(--text-dim)",
                    transition: "all 0.12s ease",
                  }}
                  title={`Set weather simulation to ${m.label}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Aero Status Switcher */}
          <button
            onClick={() => handleToggleAero(activeAeroMode === "Z-MODE" ? "X-MODE" : "Z-MODE")}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: activeAeroMode === "Z-MODE" ? "rgba(37, 99, 235, 0.18)" : "rgba(0,210,190,0.18)",
              border: activeAeroMode === "Z-MODE" ? "1px solid #3b82f6" : "1px solid var(--neon-cyan)",
              padding: "2.5px 7px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.60rem",
              color: activeAeroMode === "Z-MODE" ? "#93c5fd" : "var(--neon-cyan)",
              fontWeight: "700",
              boxShadow: activeAeroMode === "Z-MODE" ? "0 0 8px rgba(59, 130, 246, 0.4)" : "0 0 8px rgba(0,210,190,0.4)",
            }}
            title="Click to toggle Active Aero between Z-Mode (Corner Downforce) and X-Mode (Straight Low-Drag)"
          >
            <span>🌀 2026 AERO:</span>
            <span style={{ color: "#ffffff", fontWeight: "900" }}>{activeAeroMode}</span>
          </button>
        </div>
      </div>

      {/* ── Dynamic Race Control / Weather / Overtake Broadcast Alert Banner ── */}
      {(overtakeEvent || trackDampness > 30) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: trackDampness > 30
              ? "linear-gradient(90deg, rgba(0, 160, 222, 0.22) 0%, rgba(10, 20, 32, 0.96) 100%)"
              : "linear-gradient(90deg, rgba(0, 210, 190, 0.22) 0%, rgba(10, 25, 25, 0.96) 100%)",
            border: trackDampness > 30 ? "1px solid #00a0de" : "1px solid var(--neon-cyan)",
            borderRadius: "6px",
            padding: "5px 12px",
            fontSize: "0.70rem",
            fontFamily: "'Orbitron', monospace",
            color: "#ffffff",
            boxShadow: "0 2px 14px rgba(0,0,0,0.6)",
            animation: "pulseOvertake 2s infinite ease-in-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{trackDampness > 30 ? "🌧️ RADAR TRANSITION:" : "⚔️ LIVE OVERTAKE:"}</span>
            <span style={{ fontWeight: "800", color: trackDampness > 30 ? "#60a5fa" : "var(--neon-cyan)" }}>
              {trackDampness > 30
                ? `Track dampness ${trackDampness}%. Slicks degraded by +3.5s/lap. Intermediate/Wet crossover active!`
                : overtakeEvent}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.2)", padding: "1px 5px", borderRadius: "3px", fontWeight: "700" }}>
              FIA RACE CONTROL
            </span>
            {overtakeEvent && (
              <button
                onClick={() => setOvertakeEvent(null)}
                style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", padding: "0 4px" }}
                title="Dismiss alert"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {activePitWallTab === "map" ? (
        <LiveRaceMapTracker
          selectedCircuit={selectedCircuit}
          drivers={drivers}
          currentLap={currentLap}
          maxLaps={maxLaps}
          sessionFlag={sessionFlag}
          onCloseToTower={() => setActivePitWallTab("tower")}
        />
      ) : activePitWallTab === "lapMatrix" ? (
        <StatsF1LapMatrix
          drivers={drivers}
          currentLap={currentLap}
          maxLaps={maxLaps}
          circuitName={selectedCircuit?.grand_prix_name || gpConfig?.name || "Singapore Grand Prix"}
          circuitId={activeCircuitId}
          lapHistory={lapHistory}
          selectedDriverCode={currentDriver.code}
          onSelectDriver={(d) => {
            const idx = drivers.findIndex((x) => x.code === d.code);
            if (idx >= 0) setSelectedDriverIdx(idx);
          }}
        />
      ) : (
        <>
          {/* ════════ FRONT / UPPER COCKPIT: 2-COLUMN LAYOUT (LEFT MAP + TIMING TOWER) ════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "12px", alignItems: "start", width: "100%" }}>

        {/* ──── COLUMN 1: EXPANDED LEFT PANEL (Circuit Radar, SVG Map, Sectors & Speed Trap) ──── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Circuit Geometry & Sector Radar Telemetry */}
          <div
            style={{
              background: "rgba(16, 18, 28, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header: Track Name & Live Tag */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                CIRCUIT RADAR & SECTOR SPEEDS
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.64rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-green)", animation: "pulseFlag 1.5s infinite" }} />
                GPS LIVE
              </span>
            </div>

            {/* Dedicated Sector Speed Badges Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "5px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                padding: "6px 5px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  SEC 1
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#00d2be" }}>
                  304 <span style={{ fontSize: "0.54rem" }}>KM/H</span>
                </div>
              </div>

              <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  SEC 2
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#00cc44" }}>
                  295 <span style={{ fontSize: "0.54rem" }}>KM/H</span>
                </div>
              </div>

              <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  SEC 3
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ff4444" }}>
                  337 <span style={{ fontSize: "0.54rem" }}>KM/H</span>
                </div>
              </div>

              <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  TRAP
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#bf7fff" }}>
                  337 <span style={{ fontSize: "0.54rem" }}>KM/H</span>
                </div>
              </div>
            </div>

            {/* Aerospace Holographic Circuit Radar with Live Concentric Rings & Rotating Sweep */}
            <div
              style={{
                width: "100%",
                height: "215px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: "radial-gradient(circle at center, rgba(0, 210, 190, 0.05) 0%, rgba(5, 7, 13, 0.85) 100%)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
              }}
            >
              {/* Corner Targeting Bracket Overlays */}
              <div style={{ position: "absolute", top: 4, left: 6, fontSize: "0.55rem", color: "rgba(0, 210, 190, 0.7)", fontFamily: "'Orbitron', monospace" }}>┌ GPS TRACKER</div>
              <div style={{ position: "absolute", top: 4, right: 6, fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.4)", fontFamily: "'Orbitron', monospace" }}>GRID 2026 ┐</div>
              <div style={{ position: "absolute", bottom: 4, left: 6, fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.4)", fontFamily: "'Orbitron', monospace" }}>└ FIA SEC-1/2/3</div>
              <div style={{ position: "absolute", bottom: 4, right: 6, fontSize: "0.55rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>60 FPS ┘</div>

              <svg viewBox="0 0 500 500" style={{ width: "95%", height: "95%" }}>
                <defs>
                  <linearGradient id="pitTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d2be" />
                    <stop offset="35%" stopColor="#00e676" />
                    <stop offset="70%" stopColor="#ff4444" />
                    <stop offset="100%" stopColor="#bf7fff" />
                  </linearGradient>
                  {/* Radar Sweep Cone Gradient */}
                  <linearGradient id="sweepConeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0, 210, 190, 0)" />
                    <stop offset="70%" stopColor="rgba(0, 210, 190, 0.08)" />
                    <stop offset="100%" stopColor="rgba(0, 210, 190, 0.28)" />
                  </linearGradient>
                </defs>

                {/* Tactical Radar Crosshairs */}
                <line x1="40" y1="250" x2="460" y2="250" stroke="rgba(0, 210, 190, 0.12)" strokeDasharray="3 4" strokeWidth="1" />
                <line x1="250" y1="40" x2="250" y2="460" stroke="rgba(0, 210, 190, 0.12)" strokeDasharray="3 4" strokeWidth="1" />

                {/* Concentric Tactical Range Rings */}
                <circle cx="250" cy="250" r="75" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                <circle cx="250" cy="250" r="145" fill="none" stroke="rgba(0, 210, 190, 0.08)" strokeDasharray="4 6" strokeWidth="1" />
                <circle cx="250" cy="250" r="215" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

                {/* Animated Rotating Radar Sweep Cone */}
                <g style={{ transformOrigin: "250px 250px", animation: "radarSweep 5.5s linear infinite" }}>
                  <path d="M 250 250 L 460 200 A 215 215 0 0 1 465 250 Z" fill="url(#sweepConeGrad)" />
                  <line x1="250" y1="250" x2="465" y2="250" stroke="rgba(0, 210, 190, 0.6)" strokeWidth="1.5" />
                </g>

                {/* Glowing Authentic Vector Track Ribbon */}
                <path
                  d={activeTrackPath}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={activeTrackPath}
                  fill="none"
                  stroke="url(#pitTrackGrad)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 12px rgba(0, 210, 190, 0.7))" }}
                />

                {/* Start / Finish Checkered Gate Line */}
                <circle cx="250" cy="250" r="2" fill="transparent" />

                {/* Live Leading Cars traveling along track geometry */}
                {/* P1 Norris (McLaren Papaya) */}
                <circle r="13" fill="#ff8700" style={{ filter: "drop-shadow(0 0 10px #ff8700)" }}>
                  <animateMotion dur="8.8s" repeatCount="indefinite" path={activeTrackPath} />
                </circle>
                {/* P2 Verstappen (Red Bull Navy) */}
                <circle r="12" fill="#3671e8" style={{ filter: "drop-shadow(0 0 10px #3671e8)" }}>
                  <animateMotion dur="9.0s" repeatCount="indefinite" path={activeTrackPath} begin="-0.74s" />
                </circle>
                {/* P3 Russell (Mercedes Teal) */}
                <circle r="11" fill="#00d2be" style={{ filter: "drop-shadow(0 0 10px #00d2be)" }}>
                  <animateMotion dur="9.2s" repeatCount="indefinite" path={activeTrackPath} begin="-1.8s" />
                </circle>
                {/* P4 Leclerc (Ferrari Rosso Corsa) */}
                <circle r="11" fill="#ff3b30" style={{ filter: "drop-shadow(0 0 10px #ff3b30)" }}>
                  <animateMotion dur="9.3s" repeatCount="indefinite" path={activeTrackPath} begin="-2.7s" />
                </circle>
                {/* P5 Hamilton (Ferrari) */}
                <circle r="10" fill="#e8002d" style={{ filter: "drop-shadow(0 0 8px #e8002d)" }}>
                  <animateMotion dur="9.5s" repeatCount="indefinite" path={activeTrackPath} begin="-3.8s" />
                </circle>
                {/* P6 Piastri (McLaren) */}
                <circle r="10" fill="#ffaa00" style={{ filter: "drop-shadow(0 0 8px #ffaa00)" }}>
                  <animateMotion dur="9.6s" repeatCount="indefinite" path={activeTrackPath} begin="-4.6s" />
                </circle>
              </svg>
            </div>

            {/* Tactical Live Lead Battle Head-to-Head HUD Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255, 135, 0, 0.12) 0%, rgba(54, 113, 232, 0.12) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "8px",
                padding: "9px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Battle Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>⚔️</span>
                  <span>LEAD BATTLE: P1 vs P2</span>
                </span>
                <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.2)", border: "1px solid rgba(0,204,68,0.4)", padding: "1px 5px", borderRadius: "3px", fontWeight: "800", animation: "pulseFlag 1.5s infinite" }}>
                  DRS ACTIVE
                </span>
              </div>

              {/* Drivers & Delta Interval */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "3px", height: "14px", background: "#ff8700", borderRadius: "2px" }} />
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>
                    NOR <span style={{ fontSize: "0.62rem", color: "#ff8700" }}>P1</span>
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "var(--neon-cyan)", letterSpacing: "0.04em" }}>
                    +0.742s
                  </span>
                  <span style={{ fontSize: "0.56rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>
                    CLOSING (-0.08s/L)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>
                    <span style={{ fontSize: "0.62rem", color: "#3671e8" }}>P2</span> VER
                  </span>
                  <span style={{ width: "3px", height: "14px", background: "#3671e8", borderRadius: "2px" }} />
                </div>
              </div>

              {/* High-tech Head-to-Head Visual Gap Bar */}
              <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    width: "74%",
                    height: "100%",
                    background: "linear-gradient(90deg, #ff8700 0%, #3671e8 100%)",
                    borderRadius: "3px",
                    boxShadow: "0 0 8px rgba(0, 210, 190, 0.4)",
                  }}
                />
              </div>

              {/* Threat Advisory */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                <span>ZONE: SECTOR 2 DRS</span>
                <span style={{ color: "#ffaa00", fontWeight: "700" }}>OVERTAKE RISK: HIGH</span>
              </div>
            </div>
          </div>

          {/* ──── 2026 ACTIVE AERO & MOM BOOST DEMONSTRATOR MODULE ──── */}
          <ActiveAeroDemonstrator
            mode={activeAeroMode}
            onToggleMode={handleToggleAero}
            momBoostActive={momBoostActive}
            onTriggerMom={handleTriggerMom}
            momCooldown={momCooldown}
            selectedDriver={currentDriver}
          />

          {/* ──── Unified Telemetry Leaderboard: Live Pace & 2026 Speed Trap ──── */}
          <div
            style={{
              background: "rgba(16, 18, 28, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header with Segmented Tabs */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={() => setTelemetryTab("speed")}
                  style={{
                    background: telemetryTab === "speed" ? "rgba(0, 210, 190, 0.2)" : "rgba(255,255,255,0.04)",
                    border: telemetryTab === "speed" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                    color: telemetryTab === "speed" ? "var(--neon-cyan)" : "var(--text-secondary)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "800",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  🚀 SPEED TRAP
                </button>
                <button
                  onClick={() => setTelemetryTab("pace")}
                  style={{
                    background: telemetryTab === "pace" ? "rgba(0, 210, 190, 0.2)" : "rgba(255,255,255,0.04)",
                    border: telemetryTab === "pace" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                    color: telemetryTab === "pace" ? "var(--neon-cyan)" : "var(--text-secondary)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "800",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  ⚡ PACE (TOP 4)
                </button>
                <button
                  onClick={() => setTelemetryTab("all")}
                  style={{
                    background: telemetryTab === "all" ? "rgba(0, 210, 190, 0.2)" : "rgba(255,255,255,0.04)",
                    border: telemetryTab === "all" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                    color: telemetryTab === "all" ? "var(--neon-cyan)" : "var(--text-secondary)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "800",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  ALL
                </button>
              </div>

              <span style={{ fontSize: "0.60rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                ● 2026 ACTIVE
              </span>
            </div>

            {/* Tab 1: Live Pace Tracker */}
            {(telemetryTab === "pace" || telemetryTab === "all") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: telemetryTab === "all" ? "8px" : 0 }}>
                {telemetryTab === "all" && (
                  <div style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", textTransform: "uppercase" }}>
                    Live Pace Deltas
                  </div>
                )}
                {[
                  { pos: 1, num: "#1",  name: "L. Norris",      trend: "▲", pct: "+1.2%", isUp: true, color: "#ff8700" },
                  { pos: 2, num: "#3",  name: "M. Verstappen",  trend: "▲", pct: "+0.8%", isUp: true, color: "#3671e8" },
                  { pos: 3, num: "#63", name: "G. Russell",     trend: "▼", pct: "-0.4%", isUp: false, color: "#00d2be" },
                  { pos: 4, num: "#16", name: "C. Leclerc",     trend: "▲", pct: "+1.6%", isUp: true, color: "#ff3b30" },
                ].map((d) => (
                  <div
                    key={d.pos}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      background: "rgba(255,255,255,0.03)",
                      borderLeft: `2px solid ${d.color}`,
                      borderRadius: "4px",
                      fontSize: "0.70rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", fontSize: "0.64rem" }}>P{d.pos}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", color: "#fff", fontWeight: "700" }}>{d.num}</span>
                      <span style={{ color: "#e8e8f0", fontWeight: "600" }}>{d.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: d.isUp ? "var(--neon-green)" : "var(--neon-red)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                      <span>{d.trend}</span>
                      <span>{d.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Top Speed Trap */}
            {(telemetryTab === "speed" || telemetryTab === "all") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", borderTop: telemetryTab === "all" ? "1px solid rgba(255,255,255,0.06)" : "none", paddingTop: telemetryTab === "all" ? "8px" : 0 }}>
                {telemetryTab === "all" && (
                  <div style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", textTransform: "uppercase" }}>
                    Top Speed Trap (KM/H)
                  </div>
                )}
                {[
                  { pos: 1, name: "S. Pérez",       speed: 337, pct: 100, team: "Cadillac" },
                  { pos: 2, name: "M. Verstappen",  speed: 336, pct: 98,  team: "Red Bull Racing" },
                  { pos: 3, name: "L. Norris",      speed: 335, pct: 97,  team: "McLaren" },
                  { pos: 4, name: "L. Hamilton",    speed: 334, pct: 96,  team: "Ferrari" },
                  { pos: 5, name: "C. Sainz Jr.",   speed: 331, pct: 93,  team: "Williams" },
                ].map((st) => {
                  const teamConf = TEAM_CONFIG[st.team] || { text: "#00d2be" };
                  return (
                    <div key={st.pos} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem" }}>
                      <span style={{ width: "14px", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>{st.pos}</span>
                      <div style={{ width: "3px", height: "11px", borderRadius: "2px", background: teamConf.text || "#fff" }} />
                      <span style={{ width: "88px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e8e8f0", fontWeight: "600" }}>{st.name}</span>
                      <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${st.pct}%`, height: "100%", background: "linear-gradient(90deg, #00d2be, #e8002d)", borderRadius: "3px" }} />
                      </div>
                      <span style={{ fontFamily: "'Orbitron', monospace", color: "#fff", fontWeight: "700", minWidth: "30px", textAlign: "right" }}>
                        {st.speed}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ──── COLUMN 2: 2026 MASTER TIMING TOWER MATRIX (SPACIOUS TABLE) ──── */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 18, 28, 0.98) 0%, rgba(12, 14, 22, 0.98) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Timing Header Status Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.08em" }}>
                2026 LIVE TIMING TOWER
              </span>
              <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 7px", borderRadius: "3px", fontWeight: "800" }}>
                ● 22 CARS LIVE
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontFamily: "'Orbitron', monospace",
                  color: "#ffd700",
                  background: "rgba(255,215,0,0.12)",
                  border: "1px solid rgba(255,215,0,0.35)",
                  padding: "2px 7px",
                  borderRadius: "3px",
                  fontWeight: "800",
                }}
                title={`Qualifying Pole Time for ${gpConfig?.name}: ${gpConfig?.poleTime}`}
              >
                ⏱️ POLE: {gpConfig?.poleDriver} ({gpConfig?.poleTime})
              </span>
            </div>

            {/* Action & Density Mode Switcher Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {/* Interactive Overtake Duel Simulator Button */}
              <button
                onClick={handleTriggerDuelOvertake}
                title="Trigger realistic F1 overtake battle with row swapping animation & TV graphics"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 230, 118, 0.28) 0%, rgba(0, 210, 190, 0.16) 100%)",
                  border: "1px solid #00e676",
                  color: "#00e676",
                  borderRadius: "4px",
                  padding: "3px 9px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 0 12px rgba(0, 230, 118, 0.4)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>⚔️</span>
                <span>TRIGGER OVERTAKE</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                title={isSoundMuted ? "Unmute F1 broadcast chime" : "Mute broadcast sound"}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: isSoundMuted ? "#ff4444" : "#ffffff",
                  borderRadius: "4px",
                  padding: "3px 6px",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                }}
              >
                {isSoundMuted ? "🔇" : "🔊"}
              </button>

              {/* Switch to StatsF1 view */}
              <button
                onClick={() => setActivePitWallTab("lapMatrix")}
                title="Open authentic StatsF1 Tour-par-tour lap chart"
                style={{
                  background: "rgba(23, 106, 199, 0.25)",
                  border: "1px solid #176ac7",
                  color: "#66b3ff",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📈</span>
                <span>STATSF1 CHART</span>
              </button>

              <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", letterSpacing: "0.05em", marginLeft: "4px" }}>
                DENSITY:
              </span>
              <button
                onClick={() => setTableDensity("broadcast")}
                style={{
                  background: tableDensity === "broadcast" ? "linear-gradient(135deg, rgba(0, 210, 190, 0.28) 0%, rgba(54, 113, 232, 0.28) 100%)" : "rgba(255,255,255,0.04)",
                  border: tableDensity === "broadcast" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                  color: tableDensity === "broadcast" ? "#ffffff" : "var(--text-dim)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: tableDensity === "broadcast" ? "0 0 10px rgba(0,210,190,0.3)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>📺</span>
                <span>BROADCAST</span>
              </button>
              <button
                onClick={() => setTableDensity("compact")}
                style={{
                  background: tableDensity === "compact" ? "linear-gradient(135deg, rgba(0, 210, 190, 0.28) 0%, rgba(54, 113, 232, 0.28) 100%)" : "rgba(255,255,255,0.04)",
                  border: tableDensity === "compact" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                  color: tableDensity === "compact" ? "#ffffff" : "var(--text-dim)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: tableDensity === "compact" ? "0 0 10px rgba(0,210,190,0.3)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>⚡</span>
                <span>ALL 22 CARS</span>
              </button>
            </div>
          </div>

          {/* ── AUTHENTIC F1 TV BROADCAST OVERTAKE LOWER-THIRD BANNER ── */}
          {activeOvertake && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, #090e1a 0%, #141c2c 50%, #090e1a 100%)",
                border: "2px solid #00e676",
                borderLeft: "8px solid #00e676",
                borderRadius: "6px",
                padding: "8px 14px",
                boxShadow: "0 0 24px rgba(0, 230, 118, 0.5), 0 8px 32px rgba(0,0,0,0.8)",
                animation: "f1BroadcastBannerIn 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                margin: "4px 0 6px 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "#e10600",
                    color: "#ffffff",
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: "900",
                    fontSize: "0.66rem",
                    padding: "3px 7px",
                    borderRadius: "3px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 0 8px rgba(225, 6, 0, 0.6)",
                  }}
                >
                  F1 TV LIVE
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚔️</span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.82rem",
                      fontWeight: "900",
                      color: "#ffffff",
                      letterSpacing: "0.05em",
                    }}
                  >
                    OVERTAKE · LAP {activeOvertake.lap}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "rgba(0, 230, 118, 0.22)",
                      border: "1px solid #00e676",
                      color: "#00e676",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      fontSize: "0.78rem",
                      boxShadow: "0 0 8px rgba(0, 230, 118, 0.4)",
                    }}
                  >
                    #{activeOvertake.winnerNum} {activeOvertake.winnerCode} ▲ P{activeOvertake.toPos}
                  </span>

                  <span style={{ color: "#d0d5e5", fontSize: "0.75rem", fontWeight: "700" }}>
                    passes
                  </span>

                  <span
                    style={{
                      background: "rgba(255, 24, 1, 0.22)",
                      border: "1px solid #ff1801",
                      color: "#ff6b6b",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      fontSize: "0.78rem",
                    }}
                  >
                    #{activeOvertake.loserNum} {activeOvertake.loserCode} ▼ P{activeOvertake.fromPos}
                  </span>

                  <span style={{ color: "var(--neon-cyan)", fontSize: "0.72rem", fontFamily: "'Rajdhani', sans-serif", fontWeight: "700" }}>
                    · {activeOvertake.reason}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveOvertake(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a0a5b8",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  padding: "2px 6px",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Unified Table with Sticky Header */}
          <div
            style={{
              maxHeight: tableDensity === "compact" ? "680px" : "635px",
              overflowY: "auto",
              overflowX: "auto",
              width: "100%",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(8, 10, 16, 0.6)",
              transition: "max-height 0.2s ease",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "900px",
                borderCollapse: "separate",
                borderSpacing: tableDensity === "compact" ? "0 1px" : "0 2px",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: "#0a0c16",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.7)",
                }}
              >
                <tr
                  style={{
                    fontSize: tableDensity === "compact" ? "0.62rem" : "0.65rem",
                    fontFamily: "'Orbitron', monospace",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "38px", textAlign: "center" }}>POS</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "36px", textAlign: "center" }}>NO</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 6px" : "8px 8px", minWidth: "150px" }}>DRIVER</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "78px", textAlign: "center" }}>TYRE / AGE</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "82px", textAlign: "right" }}>GAP</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "78px", textAlign: "right" }}>INT</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "65px", textAlign: "center", color: "#cc44ff" }}>S1</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "65px", textAlign: "center", color: "#00e676" }}>S2</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "65px", textAlign: "center", color: "#ffeb3b" }}>S3</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "88px", textAlign: "center", color: "var(--neon-cyan)" }}>2026 SOC</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "82px", textAlign: "center" }}>ACTIVE AERO</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "80px", textAlign: "center" }}>BEST LAP</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "8px 6px", width: "42px", textAlign: "center" }}>PITS</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, index) => {
                  const isSelected = index === selectedDriverIdx;
                  const teamConf = TEAM_CONFIG[d.team] || { bg: "#222", text: "#fff", label: d.team };
                  const logoUrl = getTeamLogo(d.team);
                  const isCompact = tableDensity === "compact";

                  // Metallic Position Pill Configuration
                  const posBadgeStyle = d.pos === 1 ? {
                    background: "linear-gradient(135deg, #ffd700 0%, #b8860b 100%)",
                    color: "#0a0a0f",
                    boxShadow: "0 0 8px rgba(255, 215, 0, 0.65)",
                    border: "1px solid #ffe44d",
                  } : d.pos === 2 ? {
                    background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
                    color: "#0a0a0f",
                    boxShadow: "0 0 6px rgba(255, 255, 255, 0.4)",
                    border: "1px solid #ffffff",
                  } : d.pos === 3 ? {
                    background: "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)",
                    color: "#ffffff",
                    boxShadow: "0 0 6px rgba(205, 127, 50, 0.5)",
                    border: "1px solid #fcd34d",
                  } : d.pos <= 10 ? {
                    background: "rgba(0, 210, 190, 0.12)",
                    color: "var(--neon-cyan)",
                    border: "1px solid rgba(0, 210, 190, 0.35)",
                  } : {
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "rgba(255, 255, 255, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  };

                  const isOvertakeWinner = activeOvertake?.winnerCode === d.code;
                  const isOvertakeLoser = activeOvertake?.loserCode === d.code;

                  return (
                    <tr
                      key={d.num}
                      onClick={() => setSelectedDriverIdx(index)}
                      className={`f1-timing-row ${isOvertakeWinner ? "f1-row-overtake-winner" : ""} ${isOvertakeLoser ? "f1-row-overtake-loser" : ""}`}
                      style={{
                        background: isOvertakeWinner
                          ? "linear-gradient(90deg, rgba(0, 230, 118, 0.32) 0%, rgba(0, 230, 118, 0.08) 100%)"
                          : isOvertakeLoser
                          ? "linear-gradient(90deg, rgba(255, 24, 1, 0.28) 0%, rgba(255, 24, 1, 0.06) 100%)"
                          : isSelected
                          ? "rgba(0, 210, 190, 0.16)"
                          : index % 2 === 0
                          ? "rgba(255, 255, 255, 0.02)"
                          : "transparent",
                        borderLeft: isOvertakeWinner
                          ? "5px solid #00e676"
                          : isOvertakeLoser
                          ? "5px solid #ff1801"
                          : isSelected
                          ? "3px solid #00d2be"
                          : "3px solid transparent",
                        boxShadow: isOvertakeWinner
                          ? "0 0 20px rgba(0, 230, 118, 0.6), inset 0 0 10px rgba(0, 230, 118, 0.3)"
                          : isOvertakeLoser
                          ? "0 0 16px rgba(255, 24, 1, 0.45)"
                          : isSelected
                          ? "inset 3px 0 0 #00d2be, 0 0 12px rgba(0,210,190,0.14)"
                          : "none",
                        cursor: "pointer",
                        transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        animation: isOvertakeWinner
                          ? "f1PulseOvertakeGreen 1.5s infinite"
                          : isOvertakeLoser
                          ? "f1PulseOvertakeRed 1.5s infinite"
                          : "none",
                      }}
                    >
                      {/* Position */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: isCompact ? "0.70rem" : "0.76rem",
                              fontWeight: "900",
                              padding: isCompact ? "1px 5px" : "2px 6px",
                              borderRadius: "3px",
                              display: "inline-block",
                              minWidth: "20px",
                              ...posBadgeStyle,
                              boxShadow: isOvertakeWinner
                                ? "0 0 12px #00e676"
                                : isOvertakeLoser
                                ? "0 0 10px #ff1801"
                                : posBadgeStyle.boxShadow,
                            }}
                          >
                            {d.pos}
                          </span>

                          {/* Overtake Gain / Loss Broadcast Pill */}
                          {isOvertakeWinner && (
                            <span
                              style={{
                                fontSize: "0.58rem",
                                color: "#00e676",
                                fontWeight: "900",
                                fontFamily: "'Orbitron', monospace",
                                animation: "f1PillPulse 1s infinite",
                                background: "rgba(0, 230, 118, 0.2)",
                                padding: "1px 3px",
                                borderRadius: "3px",
                                border: "1px solid #00e676",
                                lineHeight: 1,
                              }}
                              title="Gained position (Overtake)"
                            >
                              ▲+1
                            </span>
                          )}
                          {isOvertakeLoser && (
                            <span
                              style={{
                                fontSize: "0.58rem",
                                color: "#ff4444",
                                fontWeight: "900",
                                fontFamily: "'Orbitron', monospace",
                                animation: "f1PillPulse 1s infinite",
                                background: "rgba(255, 24, 1, 0.2)",
                                padding: "1px 3px",
                                borderRadius: "3px",
                                border: "1px solid #ff1801",
                                lineHeight: 1,
                              }}
                              title="Lost position"
                            >
                              ▼-1
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Car Number */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.70rem" : "0.76rem", fontWeight: "700", color: "#8888aa" }}>
                          #{d.num}
                        </span>
                      </td>

                      {/* Driver */}
                      <td style={{ padding: isCompact ? "2.5px 6px" : "5px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isCompact ? "6px" : "8px" }}>
                          <div
                            title={d.team}
                            className="team-logo-hover-box"
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: isCompact ? "18px" : "20px",
                              height: isCompact ? "18px" : "20px",
                              flexShrink: 0,
                            }}
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={d.team}
                                referrerPolicy="no-referrer"
                                style={{
                                  width: isCompact ? "16px" : "18px",
                                  height: isCompact ? "14px" : "16px",
                                  objectFit: "contain",
                                  filter: "drop-shadow(0 0 3px rgba(255,255,255,0.4))",
                                  display: "block",
                                  transition: "all 0.15s ease",
                                }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            ) : null}

                            <div
                              className="team-tooltip"
                              style={{
                                position: "absolute",
                                left: "50%",
                                bottom: "calc(100% + 6px)",
                                transform: "translateX(-50%) translateY(4px)",
                                background: "#0c0d15",
                                color: "#ffffff",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.66rem",
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: "700",
                                letterSpacing: "0.05em",
                                whiteSpace: "nowrap",
                                border: `1px solid ${teamConf.text || "var(--neon-cyan)"}`,
                                boxShadow: `0 4px 14px rgba(0,0,0,0.9), 0 0 10px ${teamConf.text || "var(--neon-cyan)"}66`,
                                pointerEvents: "none",
                                opacity: 0,
                                transition: "opacity 0.15s ease, transform 0.15s ease",
                                zIndex: 100,
                              }}
                            >
                              {d.team}
                            </div>
                          </div>

                          {/* Authentic Team Accent Color Stripe */}
                          <div
                            style={{
                              width: "3px",
                              height: isCompact ? "13px" : "16px",
                              borderRadius: "2px",
                              background: teamConf.text || "#ffffff",
                              boxShadow: `0 0 6px ${teamConf.text || "#ffffff"}88`,
                              flexShrink: 0,
                            }}
                          />

                          <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: isCompact ? "0.78rem" : "0.84rem", color: "#ffffff", letterSpacing: "0.04em" }}>
                            {d.code}
                          </span>
                          <span style={{ fontSize: isCompact ? "0.72rem" : "0.80rem", color: "#d2d5e5", fontWeight: "600" }}>
                            {formatDriverSurname(d.name)}
                          </span>
                          <span
                            style={{
                              fontSize: "0.58rem",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "800",
                              color: "var(--neon-yellow)",
                              background: "rgba(255,215,0,0.12)",
                              border: "1px solid rgba(255,215,0,0.25)",
                              padding: "1px 4px",
                              borderRadius: "3px",
                              letterSpacing: "0.04em",
                              lineHeight: 1,
                              flexShrink: 0,
                            }}
                          >
                            {DRIVER_IOC_MAP[d.code] || "FIA"}
                          </span>
                        </div>
                      </td>

                      {/* Tyre / Age */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
                          <TireWheel compound={d.tire} laps={d.tireAge} />
                        </div>
                      </td>

                      {/* Gap to Leader */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "right" }}>
                        {d.pitState === "IN PIT" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "rgba(255, 170, 0, 0.22)",
                              border: "1px solid #ffaa00",
                              color: "#ffaa00",
                              padding: isCompact ? "1px 5px" : "2px 7px",
                              borderRadius: "4px",
                              fontSize: isCompact ? "0.62rem" : "0.68rem",
                              fontWeight: "900",
                              fontFamily: "'Orbitron', monospace",
                              boxShadow: "0 0 8px rgba(255, 170, 0, 0.4)",
                            }}
                          >
                            <span>⏱ IN PIT</span>
                            <span style={{ color: "#ffffff" }}>{d.pitTimer ? `${d.pitTimer}s` : "2.4s"}</span>
                          </span>
                        ) : d.pitState === "OUT LAP" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              background: "rgba(0, 210, 190, 0.2)",
                              border: "1px solid var(--neon-cyan)",
                              color: "var(--neon-cyan)",
                              padding: isCompact ? "1px 5px" : "2px 7px",
                              borderRadius: "4px",
                              fontSize: isCompact ? "0.62rem" : "0.68rem",
                              fontWeight: "900",
                              fontFamily: "'Orbitron', monospace",
                            }}
                          >
                            OUT LAP
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: isCompact ? "0.72rem" : "0.76rem",
                              fontWeight: "700",
                              color: d.gap === "LEADER" ? "var(--neon-cyan)" : "#ffffff",
                            }}
                          >
                            {d.gap}
                          </span>
                        )}
                      </td>

                      {/* Interval to Ahead with Trend Pill */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "right" }}>
                        {d.pitState === "IN PIT" ? (
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.62rem" : "0.68rem", color: "#ffaa00", fontWeight: "800" }}>
                            BOX BOX
                          </span>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.70rem" : "0.74rem", color: "#e8e8f0" }}>
                            <span>{d.pos === 1 ? "—" : d.interval}</span>
                            {d.pos > 1 && (
                              <span
                                style={{
                                  color: d.arrow === "down" ? "var(--neon-green)" : "var(--neon-red)",
                                  fontSize: "0.64rem",
                                  fontWeight: "800",
                                }}
                              >
                                {d.arrow === "down" ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Sector 1 */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <SectorBadge time={d.s1} type={d.s1Type} />
                      </td>

                      {/* Sector 2 */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <SectorBadge time={d.s2} type={d.s2Type} />
                      </td>

                      {/* Sector 3 */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <SectorBadge time={d.s3} type={d.s3Type} />
                      </td>

                      {/* 2026 MGU-K Hybrid SOC Battery % */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}>
                          <HybridSocBar soc={d.soc} />
                        </div>
                      </td>

                      {/* Active Aero Status */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <AeroBadge mom={d.mom} />
                      </td>

                      {/* Best Lap */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: isCompact ? "0.68rem" : "0.72rem",
                            fontWeight: "700",
                            color: d.bestLap === "1:28.412" ? "#cc44ff" : "rgba(255,255,255,0.85)",
                          }}
                        >
                          {d.bestLap}
                        </span>
                      </td>

                      {/* Pit Stops */}
                      <td style={{ padding: isCompact ? "2.5px 4px" : "5px 6px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.68rem" : "0.72rem", color: "var(--text-secondary)" }}>
                          {d.pits}P
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pinned Scrubber & Focus Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "8px",
              marginTop: "4px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Orbitron', monospace", fontSize: "0.74rem" }}>
              <span style={{ color: "var(--text-secondary)", letterSpacing: "0.08em" }}>FOCUS:</span>
              <span style={{ color: "var(--neon-cyan)", fontWeight: "800", background: "rgba(0,210,190,0.12)", border: "1px solid rgba(0,210,190,0.3)", padding: "2px 8px", borderRadius: "4px" }}>
                #{currentDriver.num} {currentDriver.name.toUpperCase()}
              </span>
              <span style={{ color: "#ffffff", opacity: 0.8 }}>({currentDriver.team})</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: "var(--text-secondary)" }}>LAP</span>
              <input
                type="range"
                min="1"
                max={maxLaps}
                value={currentLap}
                onChange={(e) => setCurrentLap(Number(e.target.value))}
                style={{ width: "130px", cursor: "pointer", accentColor: "var(--neon-red)" }}
              />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "#fff", fontWeight: "800" }}>
                {currentLap}/{maxLaps}
              </span>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                style={{
                  background: isPlaying ? "var(--neon-red)" : "var(--neon-green)",
                  color: isPlaying ? "#fff" : "#000",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 12px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: isPlaying ? "0 0 10px rgba(232,0,45,0.4)" : "0 0 10px rgba(0,204,68,0.4)",
                  transition: "all 0.15s ease",
                }}
              >
                {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ════════ LOWER TACTICAL DECK: TYRE STRATEGY, TELEMETRY & TEAM RADIO ════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr 1.15fr", gap: "12px", alignItems: "stretch", width: "100%", marginTop: "4px" }}>

        {/* ──── CARD 1: TACTICAL TYRE STRATEGY & PIT WINDOW FORECASTER ──── */}
        <div
          style={{
            background: "rgba(16, 18, 28, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "#ffffff", fontWeight: "800", letterSpacing: "0.08em" }}>
                TACTICAL TYRE STRATEGY & PIT WINDOW
              </div>
              <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                FOCUS: #{currentDriver.num} {currentDriver.name} ({currentDriver.team})
              </div>
            </div>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", border: "1px solid rgba(0,204,68,0.35)", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
              WINDOW OPEN: L35
            </span>
          </div>

          {/* Strategy Plans: Plan A & Plan B */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {/* Plan A (Recommended 1-Stop) */}
            <div style={{ background: "rgba(0, 210, 190, 0.08)", border: "1px solid rgba(0, 210, 190, 0.3)", padding: "9px 10px", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  PLAN A (OPTIMAL 1-STOP)
                </span>
                <span style={{ fontSize: "0.60rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.2)", padding: "1px 5px", borderRadius: "2px", fontWeight: "700" }}>
                  RECOMMENDED
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
                <TireBadgePill compound="M" label="Med (L1–34)" />
                <span style={{ color: "var(--neon-cyan)", fontSize: "0.70rem" }}>➔</span>
                <TireBadgePill compound="H" label="Hard (L35–58)" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
                <span>Pit Loss: ~19.8s</span>
                <span style={{ color: "var(--neon-cyan)", fontWeight: "700" }}>Target In-Lap: L35</span>
              </div>
            </div>

            {/* Plan B (Alternate 2-Stop Attack) */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "9px 10px", borderRadius: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#e0e0e0", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  PLAN B (2-STOP ATTACK)
                </span>
                <span style={{ fontSize: "0.60rem", color: "#ffaa00", background: "rgba(255,170,0,0.15)", padding: "1px 5px", borderRadius: "2px", fontWeight: "700" }}>
                  AGGRESSIVE
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                <TireBadgePill compound="S" label="Soft (L1–18)" />
                <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
                <TireBadgePill compound="M" label="Med (L19–38)" />
                <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
                <TireBadgePill compound="S" label="Soft (L39–58)" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
                <span>Pit Loss: ~39.6s</span>
                <span style={{ color: "#ffaa00", fontWeight: "700" }}>Req. +1.4s Delta</span>
              </div>
            </div>
          </div>

          {/* Tyre Degradation Curve Recharts Graph */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>TYRE DEGRADATION PROFILE & WEAR RATE</span>
              <span style={{ color: currentDriver.wear > 60 ? "var(--neon-red)" : "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Current Wear: {currentDriver.wear}% {currentDriver.wear > 60 ? "(CLIFF)" : "(OPTIMAL)"}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={85}>
              <AreaChart data={tireWearData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="wearGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2be" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#00d2be" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="lap" stroke="#666" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 60]} stroke="#666" tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: "#0c0e18", border: "1px solid var(--neon-cyan)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 12px rgba(0,0,0,0.8)" }}>
                          <div style={{ color: "var(--neon-cyan)" }}>{label}</div>
                          <div>Wear: <strong style={{ color: "#ffffff" }}>{payload[0].value}%</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={25} stroke="#ff3b30" strokeDasharray="3 3" label={{ value: "CLIFF (25%)", fill: "#ff3b30", fontSize: 8, position: "insideTopRight" }} />
                <Area type="monotone" dataKey="wear" stroke="#00d2be" strokeWidth={2.2} fillOpacity={1} fill="url(#wearGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stint Telemetry Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>TYRE COMPOUND</div>
              {(() => {
                const cdTireConf = TIRE_CONFIG[(currentDriver.tire || "M").toString().trim().toUpperCase()[0]] || TIRE_CONFIG.M;
                return (
                  <div style={{ fontSize: "0.85rem", color: cdTireConf.color, fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px", textShadow: `0 0 8px ${cdTireConf.glow}` }}>
                    {cdTireConf.name.toUpperCase()} ({cdTireConf.letter})
                  </div>
                );
              })()}
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>STINT AGE</div>
              <div style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
                {currentDriver.tireAge} LAPS
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>EST REMAINING</div>
              <div style={{ fontSize: "0.85rem", color: currentDriver.tireAge > 20 ? "var(--neon-red)" : currentDriver.tireAge > 15 ? "#ffaa00" : "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
                {Math.max(0, 35 - currentDriver.tireAge)} LAPS
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>THERMAL GRIP</div>
              <div style={{ fontSize: "0.85rem", color: currentDriver.wear > 60 ? "var(--neon-red)" : "var(--neon-cyan)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
                {Math.max(68, Math.round(100 - (currentDriver.wear * 0.45)))}% {currentDriver.wear > 55 ? "(WARM)" : "(OPTIMAL)"}
              </div>
            </div>
          </div>
        </div>

        {/* ──── CARD 2: HEAD-TO-HEAD PACE DELTA ──── */}
        <div
          style={{
            background: "rgba(16, 18, 28, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
              {currentDriver.code === "NOR" ? "PACE DELTA: NOR (P1) vs VER (P2)" : `PACE DELTA: ${currentDriver.code} vs P1 (NOR)`}
            </span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: currentDriver.code === "NOR" ? "var(--neon-green)" : currentDriver.delta.startsWith("+") ? "var(--neon-green)" : "var(--neon-red)", fontWeight: "700" }}>
              {currentDriver.code === "NOR" ? "Δ -0.210s (PULLING AWAY)" : `Δ ${currentDriver.delta}s`}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", fontSize: "0.64rem", fontFamily: "'Orbitron', monospace" }}>
            <span style={{ color: "#ff8700" }}>— {currentDriver.code === "NOR" ? "NOR (#1 LEADER)" : "P1 LEADER (NOR)"}</span>
            <span style={{ color: currentDriver.code === "NOR" ? "#3671e8" : "var(--neon-cyan)" }}>
              — {currentDriver.code === "NOR" ? "VER (#3 P2 RIVAL)" : `${currentDriver.code} (#${currentDriver.num})`}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={deltaComparisonData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="lap" stroke="#555" tick={{ fontSize: 9 }} />
              <YAxis domain={['auto', 'auto']} stroke="#555" tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ background: "#0c0d16", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 9px", borderRadius: "5px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 14px rgba(0,0,0,0.85)" }}>
                        <div style={{ color: "var(--neon-cyan)", fontWeight: "800", marginBottom: "3px" }}>{label}</div>
                        <div style={{ color: "#ff8700" }}>P1 Leader: {data.leaderTime}</div>
                        <div style={{ color: currentDriver.code === "NOR" ? "#3671e8" : "var(--neon-green)" }}>
                          {currentDriver.code === "NOR" ? "VER (P2)" : currentDriver.code}: {data.selectedTime}
                        </div>
                        <div style={{ color: "var(--text-dim)", marginTop: "2px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "2px" }}>
                          Delta: <strong style={{ color: "#fff" }}>{data.delta}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="Leader" stroke="#ff8700" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="Selected" stroke={currentDriver.code === "NOR" ? "#3671e8" : "#00d2be"} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Telemetry Pace Summary Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "2px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>GAP DELTA</div>
              <div style={{ fontSize: "0.74rem", color: currentDriver.gap === "LEADER" ? "var(--neon-cyan)" : "#fff", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {currentDriver.gap}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>BEST LAP</div>
              <div style={{ fontSize: "0.74rem", color: "var(--neon-purple, #cc44ff)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {currentDriver.bestLap}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>LAST LAP</div>
              <div style={{ fontSize: "0.74rem", color: "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {currentDriver.lastLap}
              </div>
            </div>
          </div>
        </div>

        {/* ──── CARD 3: AUTHENTIC TEAM RADIO TRANSCEIVER ──── */}
        <div
          style={{
            background: "rgba(16, 18, 28, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                TEAM RADIO · {currentDriver.code} (#{currentDriver.num})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", padding: "1px 4px", borderRadius: "2px", fontWeight: "700" }}>
                CH-1 ENCRYPTED
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "12px", marginLeft: "4px" }}>
                {[6, 12, 8, 14, 10, 4].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: "2px",
                      height: `${h}px`,
                      background: "var(--neon-green)",
                      borderRadius: "1px",
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active Radio Transmission Box */}
          {(() => {
            const focusedCode = currentDriver.code || "NOR";
            const teamEngineer = TEAM_RACE_ENGINEERS[currentDriver.team] || "Race Engineer";
            const currentRadios = getDriverRadio(focusedCode);
            const activeRadio = currentRadios[radioFeedIdx % currentRadios.length] || {
              speaker: "PIT",
              engineer_name: teamEngineer,
              message: radioMsg,
              category: "Tactical Comms",
              lap: currentLap,
              time: "15:40",
            };
            return (
              <div style={{ background: "rgba(0,0,0,0.35)", padding: "9px 10px", borderRadius: "6px", borderLeft: `3px solid ${activeRadio.speaker === 'PIT' ? 'var(--neon-red)' : 'var(--neon-blue)'}`, fontSize: "0.74rem", display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: activeRadio.speaker === "PIT" ? "var(--neon-red)" : "var(--neon-blue)", fontFamily: "'Orbitron', monospace", fontWeight: "700", fontSize: "0.68rem" }}>
                    {activeRadio.speaker === "PIT" ? `PIT (${teamEngineer})` : focusedCode}:
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
                    L{activeRadio.lap || currentLap} · {activeRadio.time || "15:40"}
                  </span>
                </div>
                <div style={{ color: "#e8e8f0", fontSize: "0.75rem", lineHeight: "1.35" }}>
                  "{activeRadio.message}"
                </div>
                {activeRadio.driver_reply && (
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "3px", marginTop: "2px" }}>
                    <strong style={{ color: "var(--neon-blue)" }}>{focusedCode}: </strong>"{activeRadio.driver_reply}"
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quick Tactical Command Macro Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
            <button
              onClick={() => handleSendRadio("Box, box. Hard compound fitted on exit.")}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontSize: "0.62rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                padding: "6px 3px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Box this lap"
            >
              📻 BOX BOX
            </button>
            <button
              onClick={() => handleSendRadio("Deploy Manual Override Mode on the main straight.")}
              style={{
                background: "rgba(0,210,190,0.08)",
                border: "1px solid rgba(0,210,190,0.3)",
                color: "var(--neon-cyan)",
                fontSize: "0.62rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                padding: "6px 3px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Deploy 350kW ERS boost"
            >
              ⚡ MOM BOOST
            </button>
            <button
              onClick={() => handleSendRadio("Engine Mode 1. Defend inside into Turn 1.")}
              style={{
                background: "rgba(255,170,0,0.08)",
                border: "1px solid rgba(255,170,0,0.3)",
                color: "#ffaa00",
                fontSize: "0.62rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                padding: "6px 3px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Defend track position"
            >
              🛡️ DEFEND
            </button>
            <button
              onClick={() => handleSendRadio("Box window opening. Push hard to build in-lap delta.")}
              style={{
                background: "rgba(0,204,68,0.08)",
                border: "1px solid rgba(0,204,68,0.3)",
                color: "var(--neon-green)",
                fontSize: "0.62rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                padding: "6px 3px",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Push for undercut"
            >
              🎯 HAMMER
            </button>
          </div>

          {/* Unified Radio Controls & Custom Dispatch Bar */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button
              onClick={() => setIsRadioModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, rgba(0,210,190,0.2) 0%, rgba(54,113,232,0.2) 100%)",
                border: "1px solid var(--neon-cyan)",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "0.64rem",
                fontFamily: "'Orbitron', monospace",
                color: "var(--neon-cyan)",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title="Open full BoxBox & FormulaDream radio archive"
            >
              <span>📻 ARCHIVE</span>
            </button>

            <button
              onClick={() => setRadioFeedIdx((prev) => prev + 1)}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "4px",
                padding: "5px 7px",
                fontSize: "0.62rem",
                fontFamily: "'Orbitron', monospace",
                color: "#ffffff",
                whiteSpace: "nowrap",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Next authentic radio transmission"
            >
              ⇄ NEXT
            </button>

            {/* Clean Dispatch Bar */}
            <div style={{ display: "flex", flex: 1, minWidth: 0, gap: "4px" }}>
              <input
                type="text"
                value={customRadioInput}
                onChange={(e) => setCustomRadioInput(e.target.value)}
                placeholder="Transmit to driver..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customRadioInput.trim()) {
                    handleSendRadio(customRadioInput.trim());
                    setCustomRadioInput("");
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "5px 7px",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  if (customRadioInput.trim()) {
                    handleSendRadio(customRadioInput.trim());
                    setCustomRadioInput("");
                  }
                }}
                style={{
                  background: "var(--neon-cyan)",
                  color: "#0a0c16",
                  border: "none",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                TX ❯
              </button>
            </div>
          </div>
        </div>

      </div>
        </>
      )}

      {/* ── BoxBox & FormulaDream Team Radio Interceptor Modal ── */}
      <TeamRadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        initialDriver={currentDriver.code}
      />

      {/* ── Official FIA Race Control & Stewards Bulletin Modal ── */}
      <FiaRaceControlModal
        isOpen={isFiaModalOpen}
        onClose={() => setIsFiaModalOpen(false)}
        currentStatus={sessionFlag}
        onStatusChange={(newStatus) => setSessionFlag(newStatus)}
      />
    </div>
  );
}

export default memo(TimingTower);
