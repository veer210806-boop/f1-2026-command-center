// ============================================================
// TelemetryViewer.jsx — Broadcast-Grade Teammate Telemetry Suite
// Multi-Channel Synced Speed & Throttle Traces, Dynamic Track Curves,
// Real-Time Gauges, Apex Vmin Analysis & Formula Dream Team Radio Comms
// ============================================================
import React, { useState, useEffect, useMemo, memo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from "recharts";
import { DRIVER_FACES, TEAM_LOGOS_WHITE, TEAM_LOGOS } from "../data/f1MediaAssets2026";
import { DRIVER_PROFILES_2026 } from "../data/driverProfiles2026";
import { getTeammateRadio } from "../data/teamRadioArchive";
import TeamRadioModal from "./TeamRadioModal";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";

export const ALL_TEAMMATE_PAIRS = [
  { d1: "NOR", d2: "PIA", team: "McLaren",         color: "#FF8000", color2: "#00F0FF", d1Num: 1,  d2Num: 81 },
  { d1: "LEC", d2: "HAM", team: "Ferrari",         color: "#E8002D", color2: "#FFE600", d1Num: 16, d2Num: 44 },
  { d1: "VER", d2: "HAD", team: "Red Bull Racing", color: "#1E41FF", color2: "#FFD700", d1Num: 3,  d2Num: 6 },
  { d1: "RUS", d2: "ANT", team: "Mercedes",        color: "#00D2BE", color2: "#00d2be", d1Num: 63, d2Num: 12 },
  { d1: "ALO", d2: "STR", team: "Aston Martin",    color: "#229971", color2: "#CEDC00", d1Num: 14, d2Num: 18 },
  { d1: "ALB", d2: "SAI", team: "Williams",        color: "#00A0DE", color2: "#FF8700", d1Num: 23, d2Num: 55 },
  { d1: "GAS", d2: "COL", team: "Alpine",          color: "#0090FF", color2: "#FF87BC", d1Num: 10, d2Num: 43 },
  { d1: "OCO", d2: "BEA", team: "Haas",            color: "#B6BABD", color2: "#E8002D", d1Num: 31, d2Num: 87 },
  { d1: "LAW", d2: "LIN", team: "Racing Bulls",    color: "#6692FF", color2: "#00E5FF", d1Num: 30, d2Num: 41 },
  { d1: "HUL", d2: "BOR", team: "Audi",            color: "#E50027", color2: "#C0C0C0", d1Num: 27, d2Num: 5 },
  { d1: "PER", d2: "BOT", team: "Cadillac",        color: "#FFC72C", color2: "#ffc72c", d1Num: 11, d2Num: 77 },
];

// Circuit-Specific Authentic Corner Maps
const CIRCUIT_CORNER_PROFILES = {
  belgium: {
    length_m: 7004,
    name: "Circuit de Spa-Francorchamps",
    corners: [
      { distance_m: 0,    turn: "S/F", description: "Start / Finish Straight", is_corner: false, speed: 305, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 420,  turn: "T1",  description: "La Source Hairpin",        is_corner: true,  speed: 78,  throttle: 15,  brake: 100, gear: 2, type: "Hairpin" },
      { distance_m: 850,  turn: "T1-2",description: "Downhill Run to Eau Rouge",is_corner: false, speed: 285, throttle: 100, brake: 0, gear: 7 },
      { distance_m: 1100, turn: "T2-3",description: "Eau Rouge Compression",   is_corner: true,  speed: 305, throttle: 100, brake: 0, gear: 8, type: "High Speed" },
      { distance_m: 1320, turn: "T4",  description: "Raidillon Crest",          is_corner: true,  speed: 312, throttle: 100, brake: 0, gear: 8, type: "High Speed" },
      { distance_m: 1850, turn: "STR", description: "Kemmel Straight (Speed Trap)", is_corner: false, speed: 342, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 2280, turn: "T5-6",description: "Les Combes Chicane",       is_corner: true,  speed: 135, throttle: 35,  brake: 90, gear: 4, type: "Medium Chicane" },
      { distance_m: 2600, turn: "T7",  description: "Malmedy Sweeper",          is_corner: true,  speed: 178, throttle: 70,  brake: 25, gear: 5, type: "Medium Speed" },
      { distance_m: 3100, turn: "T8",  description: "Bruxelles Downhill Hairpin",is_corner: true, speed: 108, throttle: 40,  brake: 65, gear: 3, type: "Hairpin" },
      { distance_m: 3550, turn: "T9",  description: "Speaker's Corner",         is_corner: true,  speed: 165, throttle: 65,  brake: 30, gear: 4, type: "Medium Speed" },
      { distance_m: 4180, turn: "T10", description: "Double-Apex Pouhon",       is_corner: true,  speed: 288, throttle: 90,  brake: 10, gear: 7, type: "High Speed" },
      { distance_m: 4850, turn: "T12", description: "Campus Right-Hander",      is_corner: true,  speed: 152, throttle: 55,  brake: 50, gear: 4, type: "Medium Speed" },
      { distance_m: 5250, turn: "T13", description: "Stavelot Apex",           is_corner: true,  speed: 185, throttle: 80,  brake: 15, gear: 5, type: "Medium Speed" },
      { distance_m: 5750, turn: "T14", description: "Courbe Paul Frère",        is_corner: false, speed: 295, throttle: 100, brake: 0, gear: 7 },
      { distance_m: 6250, turn: "T15", description: "Blanchimont Flat-Out",     is_corner: true,  speed: 318, throttle: 100, brake: 0, gear: 8, type: "High Speed", drs: true },
      { distance_m: 6720, turn: "T16", description: "Bus Stop Chicane (Heavy Braking)", is_corner: true, speed: 76, throttle: 20, brake: 100, gear: 2, type: "Slow Chicane" },
      { distance_m: 7004, turn: "END", description: "Pit Straight Acceleration",is_corner: false, speed: 298, throttle: 100, brake: 0, gear: 7 },
    ],
  },
  monza: {
    length_m: 5793,
    name: "Autodromo Nazionale Monza",
    corners: [
      { distance_m: 0,    turn: "S/F", description: "Rettifilo Tribune",       is_corner: false, speed: 335, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 680,  turn: "T1-2",description: "Variante del Rettifilo",  is_corner: true,  speed: 74,  throttle: 20,  brake: 100, gear: 2, type: "Slow Chicane" },
      { distance_m: 1450, turn: "T3",  description: "Curva Grande",             is_corner: true,  speed: 305, throttle: 100, brake: 0, gear: 8, type: "High Speed" },
      { distance_m: 2150, turn: "T4-5",description: "Variante della Roggia",   is_corner: true,  speed: 118, throttle: 35,  brake: 90, gear: 3, type: "Medium Chicane" },
      { distance_m: 2750, turn: "T6",  description: "Curva di Lesmo 1",         is_corner: true,  speed: 195, throttle: 70,  brake: 40, gear: 5, type: "Medium Speed" },
      { distance_m: 3180, turn: "T7",  description: "Curva di Lesmo 2",         is_corner: true,  speed: 172, throttle: 65,  brake: 50, gear: 5, type: "Medium Speed" },
      { distance_m: 3950, turn: "STR", description: "Curva del Serraglio",      is_corner: false, speed: 338, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 4620, turn: "T8-10",description: "Variante Ascari Complex", is_corner: true, speed: 170, throttle: 60,  brake: 75, gear: 5, type: "Fast Chicane" },
      { distance_m: 5400, turn: "T11", description: "Curva Parabolica (Alboreto)", is_corner: true, speed: 215, throttle: 85, brake: 35, gear: 6, type: "High Speed" },
      { distance_m: 5793, turn: "END", description: "Main Straight Finish",    is_corner: false, speed: 340, throttle: 100, brake: 0, gear: 8 },
    ],
  },
  monaco: {
    length_m: 3337,
    name: "Circuit de Monaco",
    corners: [
      { distance_m: 0,    turn: "S/F", description: "Boulevard Albert 1er",    is_corner: false, speed: 280, throttle: 100, brake: 0, gear: 7, drs: true },
      { distance_m: 360,  turn: "T1",  description: "Sainte Dévote",            is_corner: true,  speed: 108, throttle: 30,  brake: 90, gear: 3, type: "Medium Speed" },
      { distance_m: 750,  turn: "T2",  description: "Beau Rivage Uphill",       is_corner: false, speed: 275, throttle: 100, brake: 0, gear: 6 },
      { distance_m: 1020, turn: "T3",  description: "Massenet",                 is_corner: true,  speed: 155, throttle: 65,  brake: 35, gear: 4, type: "Medium Speed" },
      { distance_m: 1220, turn: "T4",  description: "Casino Square",            is_corner: true,  speed: 125, throttle: 50,  brake: 60, gear: 3, type: "Medium Speed" },
      { distance_m: 1480, turn: "T5",  description: "Mirabeau Haute",           is_corner: true,  speed: 82,  throttle: 25,  brake: 85, gear: 2, type: "Slow Corner" },
      { distance_m: 1680, turn: "T6",  description: "Grand Hotel Hairpin",      is_corner: true,  speed: 48,  throttle: 15,  brake: 95, gear: 1, type: "Hairpin" },
      { distance_m: 1880, turn: "T7-8",description: "Mirabeau Bas & Portier",   is_corner: true,  speed: 78,  throttle: 35,  brake: 70, gear: 2, type: "Slow Corner" },
      { distance_m: 2380, turn: "TUN", description: "Monaco Tunnel",            is_corner: false, speed: 292, throttle: 100, brake: 0, gear: 7 },
      { distance_m: 2620, turn: "T10-11",description: "Nouvelle Chicane",      is_corner: true,  speed: 68,  throttle: 25,  brake: 100, gear: 2, type: "Slow Chicane" },
      { distance_m: 2820, turn: "T12", description: "Tabac Corner",             is_corner: true,  speed: 172, throttle: 70,  brake: 30, gear: 4, type: "Medium Speed" },
      { distance_m: 2980, turn: "T13-16",description: "Louis Chiron Swimming Pool", is_corner: true, speed: 195, throttle: 80, brake: 25, gear: 5, type: "Fast Chicane" },
      { distance_m: 3180, turn: "T17-18",description: "La Rascasse",           is_corner: true,  speed: 62,  throttle: 20,  brake: 90, gear: 2, type: "Hairpin" },
      { distance_m: 3260, turn: "T19", description: "Anthony Noghès",          is_corner: true,  speed: 85,  throttle: 40,  brake: 60, gear: 2, type: "Slow Corner" },
      { distance_m: 3337, turn: "END", description: "Finish Line",             is_corner: false, speed: 275, throttle: 100, brake: 0, gear: 6 },
    ],
  },
  bahrain: {
    length_m: 5412,
    name: "Bahrain International Circuit",
    corners: [
      { distance_m: 0,    turn: "S/F", description: "Main Straight",           is_corner: false, speed: 322, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 420,  turn: "T1",  description: "Michael Schumacher Turn 1",is_corner: true,  speed: 78,  throttle: 20,  brake: 100, gear: 2, type: "Hairpin" },
      { distance_m: 780,  turn: "T2-3",description: "Acceleration Complex",     is_corner: false, speed: 255, throttle: 95,  brake: 0, gear: 6 },
      { distance_m: 1450, turn: "T4",  description: "Turn 4 Uphill Braking",    is_corner: true,  speed: 125, throttle: 40,  brake: 85, gear: 3, type: "Medium Speed", drs: true },
      { distance_m: 2100, turn: "T5-7",description: "High-Speed Infield Ess",   is_corner: true,  speed: 235, throttle: 85,  brake: 20, gear: 6, type: "High Speed" },
      { distance_m: 2720, turn: "T8",  description: "Hairpin Turn 8",           is_corner: true,  speed: 84,  throttle: 25,  brake: 90, gear: 2, type: "Hairpin" },
      { distance_m: 3250, turn: "T9-10",description: "Downhill Locking Left",   is_corner: true,  speed: 98,  throttle: 35,  brake: 85, gear: 3, type: "Technical" },
      { distance_m: 3950, turn: "STR", description: "Back Straight",           is_corner: false, speed: 318, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 4450, turn: "T11", description: "Turn 11 Fast Left",       is_corner: true,  speed: 195, throttle: 70,  brake: 35, gear: 5, type: "Medium Speed" },
      { distance_m: 4950, turn: "T13", description: "Turn 13 Long Right",       is_corner: true,  speed: 155, throttle: 60,  brake: 40, gear: 4, type: "Medium Speed" },
      { distance_m: 5250, turn: "T14-15",description: "Final Corner Onto Straight", is_corner: true, speed: 122, throttle: 50, brake: 75, gear: 3, type: "Medium Speed" },
      { distance_m: 5412, turn: "END", description: "S/F Timing Line",         is_corner: false, speed: 305, throttle: 100, brake: 0, gear: 7 },
    ],
  },
};

// Procedural generator for any other calendar circuit scaled accurately to length_km
const generateCircuitProfile = (circuit) => {
  const cid = circuit?.circuit_id?.toLowerCase() || "bahrain";
  if (CIRCUIT_CORNER_PROFILES[cid]) return CIRCUIT_CORNER_PROFILES[cid];

  const totalLength = Math.round((circuit?.length_km || 5.2) * 1000);
  const cornerCount = circuit?.corners || 16;
  const step = Math.round(totalLength / (cornerCount + 2));

  const generated = [
    { distance_m: 0, turn: "S/F", description: "Main Straight (Start/Finish)", is_corner: false, speed: 315, throttle: 100, brake: 0, gear: 8, drs: true }
  ];

  for (let i = 1; i <= cornerCount; i++) {
    const dist = Math.min(totalLength - 150, i * step);
    const isHairpin = i % 4 === 1;
    const isHighSpeed = i % 4 === 3;
    const speed = isHairpin ? 82 : (isHighSpeed ? 265 : 145);
    const throttle = isHairpin ? 20 : (isHighSpeed ? 90 : 50);
    const brake = isHairpin ? 95 : (isHighSpeed ? 10 : 65);
    const gear = isHairpin ? 2 : (isHighSpeed ? 7 : 4);
    const type = isHairpin ? "Hairpin" : (isHighSpeed ? "High Speed" : "Medium Apex");

    generated.push({
      distance_m: dist,
      turn: `T${i}`,
      description: `Turn ${i} Apex`,
      is_corner: true,
      speed,
      throttle,
      brake,
      gear,
      type
    });

    if (i === Math.floor(cornerCount / 2)) {
      generated.push({
        distance_m: dist + Math.round(step * 0.5),
        turn: "DRS",
        description: "Intermediate DRS Straight (Speed Trap)",
        is_corner: false,
        speed: 330,
        throttle: 100,
        brake: 0,
        gear: 8,
        drs: true
      });
    }
  }

  generated.push({
    distance_m: totalLength,
    turn: "END",
    description: "Final Straight",
    is_corner: false,
    speed: 310,
    throttle: 100,
    brake: 0,
    gear: 8
  });

  return {
    length_m: totalLength,
    name: circuit?.circuit_name || "Grand Prix Circuit",
    corners: generated.sort((a, b) => a.distance_m - b.distance_m),
  };
};

function TelemetryViewer({ selectedCircuit }) {
  const [selectedPair, setSelectedPair] = useState(ALL_TEAMMATE_PAIRS[0]);
  const [activeChart, setActiveChart] = useState("synced"); // "synced" | "speed" | "throttle" | "delta" | "timedelta"
  const [scrubPos, setScrubPos] = useState(1320);
  const [isPlayingLap, setIsPlayingLap] = useState(false);
  const [activeRadioFilter, setActiveRadioFilter] = useState("ALL");
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);

  // Get active circuit profile & official SVG layout
  const activeProfile = useMemo(() => {
    return generateCircuitProfile(selectedCircuit);
  }, [selectedCircuit]);

  const maxTrackDistance = activeProfile.length_m;

  const activeCircuitId = selectedCircuit?.circuit_id || "belgium";
  const activeTrackSvgPath = OFFICIAL_CIRCUIT_PATHS[activeCircuitId] || OFFICIAL_CIRCUIT_PATHS.belgium || OFFICIAL_CIRCUIT_PATHS.australia;

  // Automated Real-Time Lap Scrubber Player (10Hz playback)
  useEffect(() => {
    if (!isPlayingLap) return;
    const interval = setInterval(() => {
      setScrubPos((prev) => {
        const next = prev + 120;
        return next > maxTrackDistance ? 0 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlayingLap, maxTrackDistance]);

  // Build telemetry data points with teammate variance based on real driver ratings
  const d1Profile = DRIVER_PROFILES_2026[selectedPair.d1] || {};
  const d2Profile = DRIVER_PROFILES_2026[selectedPair.d2] || {};
  const d1Rating = d1Profile.telemetry_ratings?.pace || 94;
  const d2Rating = d2Profile.telemetry_ratings?.pace || 92;
  const ratingDelta = (d1Rating - d2Rating) * 0.5;

  const telemetryData = useMemo(() => {
    let cumulativeDeltaSec = 0;
    let prevDistance = 0;

    return activeProfile.corners.map((pt, idx) => {
      // Driver 1 variance vs Driver 2 variance
      const d1Var = Math.round(ratingDelta + (idx % 3 === 0 ? 3 : (idx % 2 === 0 ? -1 : 2)));
      const d2Var = Math.round(-ratingDelta + (idx % 3 === 0 ? -2 : (idx % 2 === 0 ? 2 : -1)));

      const s1 = Math.max(50, pt.speed + d1Var);
      const s2 = Math.max(50, pt.speed + d2Var);
      const deltaSpeed = s1 - s2;

      // Throttle & Brake dynamics
      const t1 = Math.min(100, Math.max(0, pt.throttle + (d1Var > 0 ? 5 : -3)));
      const t2 = Math.min(100, Math.max(0, pt.throttle + (d2Var > 0 ? 5 : -3)));
      const b1 = pt.brake > 0 ? Math.min(100, pt.brake + (d1Var < 0 ? 10 : 0)) : 0;
      const b2 = pt.brake > 0 ? Math.min(100, pt.brake + (d2Var < 0 ? 10 : 0)) : 0;

      // Cumulative Time Delta (t2 - t1): positive means Driver 1 took less time (is ahead)
      const distStep = Math.max(1, pt.distance_m - prevDistance);
      prevDistance = pt.distance_m;
      const t1_step = distStep / ((s1 / 3.6) || 1);
      const t2_step = distStep / ((s2 / 3.6) || 1);
      const stepDelta = t2_step - t1_step;
      cumulativeDeltaSec += stepDelta;

      return {
        distance: pt.distance_m,
        label: pt.turn,
        desc: pt.description,
        is_corner: pt.is_corner,
        type: pt.type || (pt.is_corner ? "Apex" : "Straight"),
        drs: pt.drs || false,
        gear: pt.gear,
        d1_speed: s1,
        d2_speed: s2,
        delta: deltaSpeed,
        time_delta: +cumulativeDeltaSec.toFixed(3),
        d1_throttle: t1,
        d2_throttle: t2,
        d1_brake: b1,
        d2_brake: b2,
      };
    });
  }, [activeProfile, selectedPair, ratingDelta]);

  // Closest telemetry point to the current scrubber position
  const currentPoint = useMemo(() => {
    return telemetryData.reduce((prev, curr) =>
      Math.abs(curr.distance - scrubPos) < Math.abs(prev.distance - scrubPos) ? curr : prev,
      telemetryData[0]
    );
  }, [telemetryData, scrubPos]);

  // Key metrics calculation
  const topSpeedD1 = Math.max(...telemetryData.map(p => p.d1_speed));
  const topSpeedD2 = Math.max(...telemetryData.map(p => p.d2_speed));
  const apexPoints = telemetryData.filter(p => p.is_corner);
  const minApexD1 = apexPoints.length > 0 ? Math.min(...apexPoints.map(p => p.d1_speed)) : 75;
  const minApexD2 = apexPoints.length > 0 ? Math.min(...apexPoints.map(p => p.d2_speed)) : 74;

  const avgThrottleD1 = Math.round(telemetryData.reduce((acc, p) => acc + p.d1_throttle, 0) / telemetryData.length);
  const avgThrottleD2 = Math.round(telemetryData.reduce((acc, p) => acc + p.d2_throttle, 0) / telemetryData.length);

  // Sector split analysis
  const s1Cut = Math.round(maxTrackDistance * 0.33);
  const s2Cut = Math.round(maxTrackDistance * 0.68);
  const sec1 = telemetryData.filter(p => p.distance <= s1Cut);
  const sec2 = telemetryData.filter(p => p.distance > s1Cut && p.distance <= s2Cut);
  const sec3 = telemetryData.filter(p => p.distance > s2Cut);

  const getSecAvg = (pts, key) => pts.length > 0 ? Math.round(pts.reduce((a, b) => a + b[key], 0) / pts.length) : 0;
  const s1D1 = getSecAvg(sec1, "d1_speed");
  const s1D2 = getSecAvg(sec1, "d2_speed");
  const s2D1 = getSecAvg(sec2, "d1_speed");
  const s2D2 = getSecAvg(sec2, "d2_speed");
  const s3D1 = getSecAvg(sec3, "d1_speed");
  const s3D2 = getSecAvg(sec3, "d2_speed");

  // Simulated lap delta in seconds
  const lapDeltaSec = ((topSpeedD2 - topSpeedD1) * 0.015 + (minApexD2 - minApexD1) * 0.04).toFixed(3);
  const fasterDriver = lapDeltaSec <= 0 ? selectedPair.d1 : selectedPair.d2;

  // Formula Dream Team Radio Comms
  const teamRadioList = useMemo(() => {
    return getTeammateRadio(selectedPair.d1, selectedPair.d2);
  }, [selectedPair]);

  const filteredRadio = useMemo(() => {
    if (activeRadioFilter === "ALL") return teamRadioList;
    return teamRadioList.filter(r => r.category.toUpperCase().includes(activeRadioFilter));
  }, [teamRadioList, activeRadioFilter]);

  // Color mappings
  const d1Color = selectedPair.color;
  const d2Color = selectedPair.color2 || "#00F0FF";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "32px" }}>

      {/* ── 1. Top Header & Constructor Selector Bar ── */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          background: "linear-gradient(135deg, rgba(20, 22, 34, 0.98) 0%, rgba(12, 14, 22, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ width: "8px", height: "24px", background: "var(--neon-red)", borderRadius: "3px", boxShadow: "0 0 10px var(--neon-red)" }} />
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.3rem", fontWeight: "900", letterSpacing: "0.06em", color: "#ffffff" }}>
                TELEMETRY GARAGE & BROADCAST ENGINE
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  background: "rgba(232, 0, 45, 0.15)",
                  color: "var(--neon-red)",
                  padding: "3px 10px",
                  borderRadius: "5px",
                  border: "1px solid rgba(232, 0, 45, 0.35)",
                  fontWeight: "800",
                  fontFamily: "'Orbitron', monospace",
                  boxShadow: "0 0 10px rgba(232,0,45,0.25)",
                }}
              >
                LIVE TELEMETRY
              </span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px", paddingLeft: "18px" }}>
              {selectedCircuit?.grand_prix_name || "Grand Prix"} · {activeProfile.name} · Track Length: {(maxTrackDistance / 1000).toFixed(3)} km
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", gap: "4px" }}>
            {[
              { id: "synced",    label: "⚡ SYNCED BROADCAST" },
              { id: "speed",     label: "🚀 SPEED TRACE" },
              { id: "throttle",  label: "🏎️ PEDAL INPUTS" },
              { id: "delta",     label: "📊 SPEED DELTA" },
              { id: "timedelta", label: "⏱️ TIME DELTA (Δt)" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className="btn btn-sm"
                style={{
                  background: activeChart === tab.id ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "transparent",
                  color: activeChart === tab.id ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  fontWeight: activeChart === tab.id ? "800" : "600",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.74rem",
                  letterSpacing: "0.05em",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  boxShadow: activeChart === tab.id ? "0 0 12px rgba(232,0,45,0.4)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Constructor Selector Carousel / Bar with Sleek Scrollbar */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.18) transparent",
          }}
        >
          {ALL_TEAMMATE_PAIRS.map((pair) => {
            const isSelected = selectedPair.d1 === pair.d1 && selectedPair.d2 === pair.d2;
            const logoUrl = TEAM_LOGOS_WHITE[pair.team] || TEAM_LOGOS[pair.team];
            return (
              <button
                key={pair.team}
                onClick={() => setSelectedPair(pair)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  background: isSelected ? `linear-gradient(135deg, ${pair.color}25 0%, rgba(20,24,36,0.95) 100%)` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? pair.color : "rgba(255,255,255,0.08)"}`,
                  borderLeft: `4px solid ${pair.color}`,
                  boxShadow: isSelected ? `0 4px 18px ${pair.color}44` : "none",
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={pair.team}
                    style={{ height: "20px", width: "auto", objectFit: "contain", opacity: isSelected ? 1 : 0.65 }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "0.72rem", color: isSelected ? "#ffffff" : "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {pair.team}
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: isSelected ? pair.color : "var(--text-dim)" }}>
                    #{pair.d1Num} {pair.d1} <span style={{ color: "rgba(255,255,255,0.3)" }}>vs</span> #{pair.d2Num} {pair.d2}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Head-to-Head Driver Telemetry Banner ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: "16px", alignItems: "stretch" }}>
        {/* Driver 1 Card */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: `1px solid ${d1Color}44`,
            borderLeft: `5px solid ${d1Color}`,
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Car Number Watermark */}
          <div style={{ position: "absolute", right: "8px", top: "-10px", fontFamily: "'Orbitron', sans-serif", fontSize: "6rem", fontWeight: "900", color: `${d1Color}12`, pointerEvents: "none", lineHeight: 0.9 }}>
            {selectedPair.d1Num}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
            <div style={{ position: "relative", width: "74px", height: "74px", flexShrink: 0, borderRadius: "50%", padding: "2px", background: `radial-gradient(circle, ${d1Color}66, transparent)`, boxShadow: `0 0 16px ${d1Color}44` }}>
              <img
                src={DRIVER_FACES[selectedPair.d1] || ""}
                alt={selectedPair.d1}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${d1Color}`, background: "rgba(0,0,0,0.5)" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span style={{ position: "absolute", bottom: -2, right: -2, background: "#111", border: `1.5px solid ${d1Color}`, borderRadius: "4px", padding: "1px 6px", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: d1Color }}>
                #{selectedPair.d1Num}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.72rem", background: "rgba(0, 210, 190, 0.12)", color: "var(--neon-cyan)", padding: "3px 10px", borderRadius: "6px", border: "1px solid rgba(0, 210, 190, 0.35)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{d1Profile.nationality ? d1Profile.nationality.slice(0, 3).toUpperCase() : (d1Profile.country ? d1Profile.country.slice(0, 3).toUpperCase() : "FIA")}</span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>{selectedPair.team}</span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                {d1Profile.name || selectedPair.d1}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "5px", fontSize: "0.76rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pace: <strong style={{ color: d1Color }}>{d1Profile.telemetry_ratings?.pace || 95}</strong></span>
                <span style={{ color: "var(--text-secondary)" }}>Racecraft: <strong style={{ color: "#fff" }}>{d1Profile.telemetry_ratings?.racecraft || 93}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(0,0,0,0.4)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>TOP SPEED</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: d1Color, marginTop: "2px" }}>
                {topSpeedD1} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>MIN APEX (Vmin)</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {minApexD1} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Matchup Delta Hub */}
        <div
          className="card"
          style={{
            padding: "18px 22px",
            background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em", fontWeight: "800" }}>
              TELEMETRY COMPARISON SUMMARY
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                background: "rgba(0, 204, 68, 0.15)",
                color: "var(--neon-green)",
                padding: "3px 10px",
                borderRadius: "5px",
                border: "1px solid rgba(0, 204, 68, 0.35)",
                fontWeight: "900",
                fontFamily: "'Orbitron', monospace",
                boxShadow: "0 0 10px rgba(0,204,68,0.25)",
              }}
            >
              SIMULATED DELTA: {fasterDriver} {Math.abs(lapDeltaSec)}s
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Sector 1 Advantage</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "900", color: s1D1 >= s1D2 ? d1Color : d2Color, marginTop: "4px" }}>
                {s1D1 >= s1D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s1D1 - s1D2)} km/h)
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>{s1D1} vs {s1D2} km/h</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Sector 2 Advantage</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "900", color: s2D1 >= s2D2 ? d1Color : d2Color, marginTop: "4px" }}>
                {s2D1 >= s2D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s2D1 - s2D2)} km/h)
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>{s2D1} vs {s2D2} km/h</div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>Sector 3 Advantage</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "900", color: s3D1 >= s3D2 ? d1Color : d2Color, marginTop: "4px" }}>
                {s3D1 >= s3D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s3D1 - s3D2)} km/h)
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>{s3D1} vs {s3D2} km/h</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.76rem" }}>
            <span style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
              Full Throttle Lap %: <strong style={{ color: d1Color }}>{avgThrottleD1}% ({selectedPair.d1})</strong> vs <strong style={{ color: d2Color }}>{avgThrottleD2}% ({selectedPair.d2})</strong>
            </span>
            <span style={{ color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>DRS Zones: {selectedCircuit?.drs_zones || 2} Activation Zones</span>
          </div>
        </div>

        {/* Driver 2 Card */}
        <div
          className="card"
          style={{
            padding: "18px 20px",
            background: "linear-gradient(180deg, rgba(18, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: `1px solid ${d2Color}44`,
            borderRight: `5px solid ${d2Color}`,
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Car Number Watermark */}
          <div style={{ position: "absolute", left: "8px", top: "-10px", fontFamily: "'Orbitron', sans-serif", fontSize: "6rem", fontWeight: "900", color: `${d2Color}12`, pointerEvents: "none", lineHeight: 0.9 }}>
            {selectedPair.d2Num}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexDirection: "row-reverse", position: "relative", zIndex: 1 }}>
            <div style={{ position: "relative", width: "74px", height: "74px", flexShrink: 0, borderRadius: "50%", padding: "2px", background: `radial-gradient(circle, ${d2Color}66, transparent)`, boxShadow: `0 0 16px ${d2Color}44` }}>
              <img
                src={DRIVER_FACES[selectedPair.d2] || ""}
                alt={selectedPair.d2}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${d2Color}`, background: "rgba(0,0,0,0.5)" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span style={{ position: "absolute", bottom: -2, left: -2, background: "#111", border: `1.5px solid ${d2Color}`, borderRadius: "4px", padding: "1px 6px", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: d2Color }}>
                #{selectedPair.d2Num}
              </span>
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>{selectedPair.team}</span>
                <span style={{ fontSize: "0.72rem", background: "rgba(0, 210, 190, 0.12)", color: "var(--neon-cyan)", padding: "3px 10px", borderRadius: "6px", border: "1px solid rgba(0, 210, 190, 0.35)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{d2Profile.nationality ? d2Profile.nationality.slice(0, 3).toUpperCase() : (d2Profile.country ? d2Profile.country.slice(0, 3).toUpperCase() : "FIA")}</span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                {d2Profile.name || selectedPair.d2}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "5px", fontSize: "0.76rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pace: <strong style={{ color: d2Color }}>{d2Profile.telemetry_ratings?.pace || 93}</strong></span>
                <span style={{ color: "var(--text-secondary)" }}>Racecraft: <strong style={{ color: "#fff" }}>{d2Profile.telemetry_ratings?.racecraft || 91}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(0,0,0,0.4)", padding: "10px 14px", borderRadius: "8px", textAlign: "right", border: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>TOP SPEED</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: d2Color, marginTop: "2px" }}>
                {topSpeedD2} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>MIN APEX (Vmin)</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {minApexD2} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Multi-Channel Telemetry Chart Visualization ── */}
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
        {/* Chart Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "800", color: "#ffffff" }}>
              {activeChart === "synced" && "⚡ Synced Telemetry Stream (Speed km/h & Pedals 0-100%)"}
              {activeChart === "speed" && "🚀 High-Precision Speed Trace (km/h) with Apex Markers"}
              {activeChart === "throttle" && "🏎️ Throttle Pickup & Braking Application (%)"}
              {activeChart === "delta" && "📊 Continuous Teammate Speed Delta (km/h)"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.78rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: d1Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ width: "12px", height: "4px", background: d1Color, display: "inline-block", borderRadius: "2px", boxShadow: `0 0 6px ${d1Color}` }} /> {selectedPair.d1}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: d2Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ width: "12px", height: "4px", background: d2Color, display: "inline-block", borderRadius: "2px", boxShadow: `0 0 6px ${d2Color}` }} /> {selectedPair.d2}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
            <span><strong style={{ color: "var(--neon-green)" }}>🟩 DRS Active</strong></span>
            <span><strong style={{ color: "var(--soft-red)" }}>🟥 Heavy Braking</strong></span>
            <span>Track: <strong style={{ color: "#fff" }}>{maxTrackDistance}m</strong></span>
          </div>
        </div>

        {/* ── MODE: SYNCED DUAL CHART ── */}
        {activeChart === "synced" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Top Speed Trace Chart */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.76rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.06em", fontWeight: "800" }}>
                  CHANNEL 1: SPEED TRACE (km/h)
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  Speed Scale: 50 – 355 km/h
                </span>
              </div>
              <div style={{ padding: "8px 4px 4px 0" }}>
                <ResponsiveContainer width="100%" height={215}>
                  <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
                    <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#444a5a" domain={[50, 355]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                      labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                      formatter={(val, name) => [`${val} km/h`, name === "d1_speed" ? selectedPair.d1 : selectedPair.d2]}
                    />
                    <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="d1_speed" name="d1_speed" stroke={d1Color} dot={false} strokeWidth={2.6} />
                    <Line type="monotone" dataKey="d2_speed" name="d2_speed" stroke={d2Color} dot={false} strokeWidth={2.2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Pedal Inputs Chart */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.76rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.06em", fontWeight: "800" }}>
                  CHANNEL 2: THROTTLE & BRAKE PEDAL INPUTS (%)
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  Solid: Throttle (0–100%) · Dashed: Brake Application
                </span>
              </div>
              <div style={{ padding: "8px 4px 4px 0" }}>
                <ResponsiveContainer width="100%" height={165}>
                  <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
                    <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#444a5a" domain={[0, 105]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                      labelFormatter={(d) => `${d}m`}
                      formatter={(val, name) => [`${val}%`, name]}
                    />
                    <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="d1_throttle" name={`${selectedPair.d1} Throttle`} stroke={d1Color} dot={false} strokeWidth={2.2} />
                    <Line type="monotone" dataKey="d2_throttle" name={`${selectedPair.d2} Throttle`} stroke={d2Color} dot={false} strokeWidth={2} />
                    <Line type="stepAfter" dataKey="d1_brake" name={`${selectedPair.d1} Brake`} stroke="#ff3344" strokeDasharray="3 2" dot={false} strokeWidth={1.6} />
                    <Line type="stepAfter" dataKey="d2_brake" name={`${selectedPair.d2} Brake`} stroke="#ff9900" strokeDasharray="3 2" dot={false} strokeWidth={1.6} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Channel 3: Cumulative Lap Time Delta Chart */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.76rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.06em", fontWeight: "800" }}>
                  CHANNEL 3: TIME DELTA Δt (seconds) · {selectedPair.d1} vs {selectedPair.d2}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  Above 0: {selectedPair.d1} Ahead (Green) · Below 0: {selectedPair.d2} Ahead (Gold)
                </span>
              </div>
              <div style={{ padding: "8px 4px 4px 0" }}>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
                    <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#444a5a" tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}s`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                      labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                      formatter={(val) => [`${val > 0 ? "+" : ""}${val}s`, `Δt Gap (${val >= 0 ? selectedPair.d1 : selectedPair.d2} Ahead)`]}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
                    <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="time_delta" name="Time Delta Δt" stroke="var(--neon-cyan)" dot={false} strokeWidth={2.4} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── MODE: SPEED TRACE FOCUS ── */}
        {activeChart === "speed" && (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" domain={[50, 360]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                formatter={(val, name) => [`${val} km/h`, name === "d1_speed" ? selectedPair.d1 : selectedPair.d2]}
              />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <ReferenceLine y={335} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" label={{ value: "Speed Trap Benchmark (335 km/h)", position: "insideTopRight", fill: "#888", fontSize: 10 }} />
              <Line type="monotone" dataKey="d1_speed" name={selectedPair.d1} stroke={d1Color} dot={false} strokeWidth={2.8} />
              <Line type="monotone" dataKey="d2_speed" name={selectedPair.d2} stroke={d2Color} dot={false} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* ── MODE: THROTTLE & BRAKE DYNAMICS ── */}
        {activeChart === "throttle" && (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" domain={[0, 105]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
              />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="d1_throttle" name={`${selectedPair.d1} Throttle %`} stroke={d1Color} dot={false} strokeWidth={2.4} />
              <Line type="monotone" dataKey="d2_throttle" name={`${selectedPair.d2} Throttle %`} stroke={d2Color} dot={false} strokeWidth={2.2} />
              <Line type="stepAfter" dataKey="d1_brake" name={`${selectedPair.d1} Brake Pressure`} stroke="#ff3344" dot={false} strokeWidth={2} />
              <Line type="stepAfter" dataKey="d2_brake" name={`${selectedPair.d2} Brake Pressure`} stroke="#ffbb00" dot={false} strokeWidth={2} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* ── MODE: SPEED DELTA (+/- km/h) ── */}
        {activeChart === "delta" && (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                formatter={(val) => [`${val > 0 ? "+" : ""}${val} km/h`, `Advantage: ${val >= 0 ? selectedPair.d1 : selectedPair.d2}`]}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
              />
              <ReferenceLine y={0} stroke="#555a6d" strokeWidth={1.5} />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <Bar dataKey="delta">
                {telemetryData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.delta >= 0 ? d1Color : d2Color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* ── MODE: TIME DELTA (Δt in seconds) ── */}
        {activeChart === "timedelta" && (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}s`} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                formatter={(val) => [`${val > 0 ? "+" : ""}${val}s`, `Lap Gap Δt (${val >= 0 ? selectedPair.d1 : selectedPair.d2} Ahead)`]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="time_delta" name="Time Delta Δt" stroke="var(--neon-cyan)" dot={{ r: 2 }} strokeWidth={2.6} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 4. Live Interactive Track Scrubber & Apex Telemetry Inspector ── */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="card-title" style={{ marginBottom: "2px", fontSize: "1.05rem" }}>
              Track Scrubber & Real-Time Apex Inspector
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Drag the telemetry position cursor or click any corner apex below for instant high-speed analysis.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setIsPlayingLap((p) => !p)}
              style={{
                all: "unset",
                cursor: "pointer",
                background: isPlayingLap ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "linear-gradient(135deg, var(--neon-green), #00a83e)",
                color: isPlayingLap ? "#ffffff" : "#000000",
                padding: "4px 12px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "900",
                boxShadow: isPlayingLap ? "0 0 12px rgba(232,0,45,0.5)" : "0 0 12px rgba(0,204,68,0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
              title="Auto-play telemetry sweep across the lap at 10Hz"
            >
              <span>{isPlayingLap ? "⏸ PAUSE LAP" : "▶ PLAY LAP"}</span>
            </button>
            <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
              TRACK PROGRESS:
            </span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "var(--neon-yellow)", textShadow: "0 0 10px rgba(255,221,0,0.4)" }}>
              {Math.round((scrubPos / maxTrackDistance) * 100)}%
            </span>
            <span style={{ fontSize: "0.74rem", background: "rgba(255, 221, 0, 0.15)", color: "var(--neon-yellow)", padding: "3px 10px", borderRadius: "5px", border: "1px solid rgba(255, 221, 0, 0.35)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
              {scrubPos}m / {maxTrackDistance}m
            </span>
          </div>
        </div>

        {/* Scrubber Range Slider */}
        <div style={{ position: "relative", marginBottom: "16px", background: "rgba(0,0,0,0.4)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <input
            type="range"
            min="0"
            max={maxTrackDistance}
            step="50"
            value={scrubPos}
            onChange={(e) => setScrubPos(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--neon-yellow)", cursor: "pointer", height: "8px" }}
          />
        </div>

        {/* Quick-Jump Iconic Corner Chips */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "16px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.18) transparent" }}>
          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", alignSelf: "center", whiteSpace: "nowrap", marginRight: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
            Jump to Apex:
          </span>
          {activeProfile.corners.map((c) => (
            <button
              key={c.distance_m}
              onClick={() => setScrubPos(c.distance_m)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: "5px",
                background: Math.abs(scrubPos - c.distance_m) < 80 ? "var(--neon-yellow)" : "rgba(255,255,255,0.04)",
                color: Math.abs(scrubPos - c.distance_m) < 80 ? "#000000" : (c.is_corner ? "#ffffff" : "var(--text-secondary)"),
                fontWeight: Math.abs(scrubPos - c.distance_m) < 80 ? "900" : (c.is_corner ? "700" : "500"),
                fontSize: "0.75rem",
                border: `1px solid ${Math.abs(scrubPos - c.distance_m) < 80 ? "var(--neon-yellow)" : "rgba(255,255,255,0.1)"}`,
                boxShadow: Math.abs(scrubPos - c.distance_m) < 80 ? "0 0 12px rgba(255,221,0,0.5)" : "none",
                whiteSpace: "nowrap",
                fontFamily: "'Orbitron', monospace",
                transition: "all 0.15s ease",
              }}
            >
              {c.turn} {c.is_corner ? "📍" : ""}
            </button>
          ))}
        </div>

        {/* Holographic Circuit Ribbon with Synchronized Dynamic Cursor */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "185px",
            background: "radial-gradient(circle at center, rgba(0, 210, 190, 0.05) 0%, rgba(8, 10, 18, 0.95) 100%)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "16px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 24px rgba(0,0,0,0.8)",
          }}
        >
          {/* Top Info Overlay */}
          <div style={{ position: "absolute", top: "8px", left: "12px", display: "flex", alignItems: "center", gap: "8px", zIndex: 10 }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "800", color: "#ffffff", letterSpacing: "0.06em" }}>
              SYNCHRONIZED TRACK CURSOR · {activeProfile.name.toUpperCase()}
            </span>
            <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.15)", border: "1px solid rgba(0,210,190,0.3)", padding: "1px 6px", borderRadius: "3px", fontWeight: "700" }}>
              APEX LOCATOR
            </span>
          </div>

          <div style={{ position: "absolute", top: "8px", right: "12px", display: "flex", alignItems: "center", gap: "10px", zIndex: 10 }}>
            <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: d1Color, fontWeight: "800" }}>
              ● #{selectedPair.d1Num} {selectedPair.d1} ({currentPoint.d1_speed} km/h)
            </span>
            <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: d2Color, fontWeight: "800" }}>
              ● #{selectedPair.d2Num} {selectedPair.d2} ({currentPoint.d2_speed} km/h)
            </span>
          </div>

          <svg viewBox="0 0 500 500" style={{ width: "95%", height: "95%", filter: "drop-shadow(0 0 12px rgba(0,0,0,0.9))" }}>
            <defs>
              <linearGradient id="scrubTraceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--neon-green)" />
                <stop offset="50%" stopColor="var(--neon-cyan)" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Background track silhouette */}
            <path d={activeTrackSvgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
            <path d={activeTrackSvgPath} fill="none" stroke="#121622" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
            <path d={activeTrackSvgPath} fill="none" stroke="#2b3248" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Active scrubbed track highlight */}
            <path
              d={activeTrackSvgPath}
              fill="none"
              stroke="url(#scrubTraceGrad)"
              strokeWidth="5"
              strokeDasharray="2200"
              strokeDashoffset={2200 * (1 - (scrubPos / maxTrackDistance))}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px rgba(0, 210, 190, 0.6))" }}
            />

            {/* Driver 1 Cursor Blip */}
            <circle r="12" fill={d1Color} stroke="#ffffff" strokeWidth="2" style={{ filter: `drop-shadow(0 0 10px ${d1Color})` }}>
              <animateMotion
                dur="1000000s"
                keyPoints={`${(scrubPos / maxTrackDistance).toFixed(4)};${(scrubPos / maxTrackDistance).toFixed(4)}`}
                keyTimes="0;1"
                path={activeTrackSvgPath}
                calcMode="linear"
              />
            </circle>

            {/* Driver 2 Cursor Blip */}
            <circle r="9" fill={d2Color} stroke="#000000" strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 8px ${d2Color})` }}>
              <animateMotion
                dur="1000000s"
                keyPoints={`${Math.max(0, (scrubPos / maxTrackDistance) - 0.012).toFixed(4)};${Math.max(0, (scrubPos / maxTrackDistance) - 0.012).toFixed(4)}`}
                keyTimes="0;1"
                path={activeTrackSvgPath}
                calcMode="linear"
              />
            </circle>
          </svg>
        </div>

        {/* Real-Time Digital Gauges at Current Scrub Position */}
        {currentPoint && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.1fr 1fr 1fr 0.8fr", gap: "12px", background: "linear-gradient(135deg, rgba(14, 16, 26, 0.95) 0%, rgba(8, 10, 18, 0.98) 100%)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
            {/* 1. Track Location */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Active Track Apex
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.15rem", color: "#ffffff", marginTop: "3px" }}>
                {currentPoint.label} · {currentPoint.desc}
              </div>
              <div style={{ fontSize: "0.74rem", color: currentPoint.is_corner ? "var(--neon-yellow)" : "var(--neon-green)", marginTop: "4px", fontWeight: "700" }}>
                {currentPoint.is_corner ? `⚠️ ${currentPoint.type}` : (currentPoint.drs ? "🚀 DRS Speed Zone" : "⚡ Full Throttle Zone")}
              </div>
            </div>

            {/* 2. Live Speed Comparison */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Live Speed Comparison
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px", alignItems: "baseline" }}>
                <span style={{ color: d1Color, fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.2rem", textShadow: `0 0 10px ${d1Color}44` }}>
                  {currentPoint.d1_speed} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>vs</span>
                <span style={{ color: d2Color, fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.2rem", textShadow: `0 0 10px ${d2Color}44` }}>
                  {currentPoint.d2_speed} <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>km/h</span>
                </span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                Delta: <strong style={{ color: currentPoint.delta >= 0 ? d1Color : d2Color }}>
                  {Math.abs(currentPoint.delta)} km/h
                </strong> ({currentPoint.delta >= 0 ? selectedPair.d1 : selectedPair.d2} faster)
              </div>
            </div>

            {/* 3. Throttle Input */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Throttle Pedal Input
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "32px", fontSize: "0.7rem", color: d1Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{selectedPair.d1}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "7px", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${currentPoint.d1_throttle}%`, height: "100%", background: d1Color, boxShadow: `0 0 8px ${d1Color}` }} />
                  </div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: "700" }}>{currentPoint.d1_throttle}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "32px", fontSize: "0.7rem", color: d2Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{selectedPair.d2}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "7px", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${currentPoint.d2_throttle}%`, height: "100%", background: d2Color, boxShadow: `0 0 8px ${d2Color}` }} />
                  </div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: "700" }}>{currentPoint.d2_throttle}%</span>
                </div>
              </div>
            </div>

            {/* 4. Brake Application */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Brake Pressure
              </div>
              <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', monospace", color: currentPoint.d1_brake > 0 ? "var(--soft-red)" : "var(--text-dim)", fontWeight: "800" }}>
                  {selectedPair.d1}: {currentPoint.d1_brake > 0 ? `BRAKING (${currentPoint.d1_brake}%)` : "OFF PEDAL"}
                </span>
                <span style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', monospace", color: currentPoint.d2_brake > 0 ? "#ff9900" : "var(--text-dim)", fontWeight: "800" }}>
                  {selectedPair.d2}: {currentPoint.d2_brake > 0 ? `BRAKING (${currentPoint.d2_brake}%)` : "OFF PEDAL"}
                </span>
              </div>
            </div>

            {/* 5. Gear & G-Force Simulation */}
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Gear & G-Force
              </div>
              <div style={{ marginTop: "4px" }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.3rem", fontWeight: "900", color: "var(--neon-green)", textShadow: "0 0 10px rgba(0,204,68,0.4)" }}>
                  GEAR {currentPoint.gear || 7}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  Lat G: {selectedPair.d1} ~{(currentPoint.is_corner ? (currentPoint.d1_speed / 62).toFixed(1) : 0.8)}G | {selectedPair.d2} ~{(currentPoint.is_corner ? (currentPoint.d2_speed / 62).toFixed(1) : 0.8)}G
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Corner-by-Corner Apex Speed Analysis Table ── */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <div className="card-title" style={{ marginBottom: "2px", fontSize: "1.05rem" }}>
              Corner-by-Corner Apex Speed & Minimum Vmin Analysis
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Detailed speed telemetry across all turning apexes and braking thresholds of {activeProfile.name}.
            </div>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
            Total Corners: {apexPoints.length}
          </span>
        </div>

        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "10px 14px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>CORNER</th>
                <th style={{ padding: "10px 14px" }}>LOCATION & TYPE</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'Orbitron', monospace" }}>DISTANCE</th>
                <th style={{ padding: "10px 14px", color: d1Color, fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>{selectedPair.d1} APEX (km/h)</th>
                <th style={{ padding: "10px 14px", color: d2Color, fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>{selectedPair.d2} APEX (km/h)</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'Orbitron', monospace" }}>DELTA</th>
                <th style={{ padding: "10px 14px" }}>ADVANTAGE</th>
              </tr>
            </thead>
            <tbody>
              {apexPoints.map((pt, idx) => {
                const winner = pt.d1_speed >= pt.d2_speed ? selectedPair.d1 : selectedPair.d2;
                const winColor = pt.d1_speed >= pt.d2_speed ? d1Color : d2Color;
                const deltaVal = Math.abs(pt.d1_speed - pt.d2_speed);
                return (
                  <tr
                    key={pt.distance}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "10px 14px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
                      {pt.label}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: "700", color: "#e8e8f0" }}>{pt.desc}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{pt.type}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>
                      {pt.distance}m
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: d1Color }}>
                      {pt.d1_speed} km/h
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: d2Color }}>
                      {pt.d2_speed} km/h
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: winColor }}>
                      +{deltaVal} km/h
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: `${winColor}22`, border: `1px solid ${winColor}55`, color: winColor, padding: "3px 8px", borderRadius: "5px", fontSize: "0.74rem", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                        🏆 {winner} (+{deltaVal} km/h)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Authentic Formula Dream Team Radio & Race Engineer Comms ── */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📻</span>
              <div className="card-title" style={{ marginBottom: 0, fontSize: "1.05rem" }}>
                Authentic Team Radio & Telemetry Debrief ({selectedPair.team})
              </div>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Two-way driver and race engineer transmissions regarding telemetry, power deployment, wing setup, and pace management.
            </div>
          </div>

          {/* Radio Category Filter Chips */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["ALL", "TELEMETRY", "STRATEGY", "TIRE"].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveRadioFilter(cat)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', monospace",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  background: activeRadioFilter === cat ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.03)",
                  color: activeRadioFilter === cat ? "#ffffff" : "var(--text-dim)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontWeight: activeRadioFilter === cat ? "800" : "600",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}

            <button
              onClick={() => setIsRadioModalOpen(true)}
              style={{
                background: "rgba(0, 210, 190, 0.15)",
                border: "1px solid rgba(0, 210, 190, 0.4)",
                color: "var(--neon-cyan)",
                padding: "5px 12px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              📻 BOXBOX ARCHIVE
            </button>
          </div>
        </div>

        {/* Radio Messages Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {filteredRadio.map((rad) => {
            const isD1 = rad.driver_code === selectedPair.d1;
            const cardAccent = isD1 ? d1Color : d2Color;
            return (
              <div
                key={rad.id}
                style={{
                  background: "rgba(10, 10, 16, 0.85)",
                  border: `1px solid ${cardAccent}33`,
                  borderLeft: `4px solid ${cardAccent}`,
                  borderRadius: "8px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", color: cardAccent, fontSize: "0.88rem" }}>
                      {rad.driver_code}
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                      {rad.driver_name} · Lap {rad.lap}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                      {rad.category}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                      {rad.time}
                    </span>
                  </div>
                </div>

                {/* Primary Message */}
                <div style={{ fontSize: "0.84rem", color: "#e8e8f0", lineHeight: "1.4" }}>
                  <span style={{ color: rad.speaker === "PIT" ? "var(--neon-red)" : cardAccent, fontWeight: "800", fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", marginRight: "6px" }}>
                    {rad.speaker === "PIT" ? `PIT (${rad.engineer_name}):` : `${rad.driver_code}:`}
                  </span>
                  "{rad.message}"
                </div>

                {/* Driver or Engineer Reply */}
                {rad.driver_reply && (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: "5px", borderLeft: "2px solid rgba(255,255,255,0.2)", marginTop: "2px" }}>
                    <span style={{ color: rad.speaker === "PIT" ? cardAccent : "var(--neon-red)", fontWeight: "800", fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", marginRight: "6px" }}>
                      {rad.speaker === "PIT" ? `${rad.driver_code}:` : `PIT (${rad.engineer_name}):`}
                    </span>
                    "{rad.driver_reply}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BoxBox Team Radio Modal ── */}
      <TeamRadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        initialDriver={selectedPair.d1}
      />
    </div>
  );
}

export default memo(TelemetryViewer);
