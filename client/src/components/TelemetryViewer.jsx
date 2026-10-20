// ============================================================
// TelemetryViewer.jsx — Modern, Intuitive & Broadcast-Grade Teammate Telemetry Suite
// High-Impact Head-to-Head Visual Duel, Interactive Track Corner Ribbon,
// Focused Telemetry Chart Studio, Corner Apex Performance Cards & Radio Comms
// ============================================================
import React, { useState, useEffect, useMemo, memo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from "recharts";
import { DRIVER_FACES, TEAM_LOGOS_WHITE, TEAM_LOGOS } from "../data/f1MediaAssets2026";
import { DRIVER_PROFILES_2026 } from "../data/driverProfiles2026";
import { getTeammateRadio } from "../data/teamRadioArchive";
import TeamRadioModal from "./TeamRadioModal";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { f1Audio } from "../utils/f1AudioEngine";

export const ALL_TEAMMATE_PAIRS = [
  { d1: "VER", d2: "HAD", team: "Red Bull Racing", color: "#1E41FF", color2: "#FFD700", d1Num: 3,  d2Num: 6 },
  { d1: "NOR", d2: "PIA", team: "McLaren",         color: "#FF8000", color2: "#00F0FF", d1Num: 1,  d2Num: 81 },
  { d1: "LEC", d2: "HAM", team: "Ferrari",         color: "#E8002D", color2: "#FFE600", d1Num: 16, d2Num: 44 },
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
      { distance_m: 1850, turn: "STR", description: "Kemmel Straight",          is_corner: false, speed: 342, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 2280, turn: "T5-6",description: "Les Combes Chicane",       is_corner: true,  speed: 135, throttle: 35,  brake: 90, gear: 4, type: "Medium Chicane" },
      { distance_m: 2600, turn: "T7",  description: "Malmedy Sweeper",          is_corner: true,  speed: 178, throttle: 70,  brake: 25, gear: 5, type: "Medium Speed" },
      { distance_m: 3100, turn: "T8",  description: "Bruxelles Downhill",       is_corner: true,  speed: 108, throttle: 40,  brake: 65, gear: 3, type: "Hairpin" },
      { distance_m: 3550, turn: "T9",  description: "Speaker's Corner",         is_corner: true,  speed: 165, throttle: 65,  brake: 30, gear: 4, type: "Medium Speed" },
      { distance_m: 4180, turn: "T10", description: "Pouhon Double-Apex",       is_corner: true,  speed: 288, throttle: 90,  brake: 10, gear: 7, type: "High Speed" },
      { distance_m: 4850, turn: "T12", description: "Campus Right-Hander",      is_corner: true,  speed: 152, throttle: 55,  brake: 50, gear: 4, type: "Medium Speed" },
      { distance_m: 5250, turn: "T13", description: "Stavelot Apex",           is_corner: true,  speed: 185, throttle: 80,  brake: 15, gear: 5, type: "Medium Speed" },
      { distance_m: 5750, turn: "T14", description: "Courbe Paul Frère",        is_corner: false, speed: 295, throttle: 100, brake: 0, gear: 7 },
      { distance_m: 6250, turn: "T15", description: "Blanchimont Flat-Out",     is_corner: true,  speed: 318, throttle: 100, brake: 0, gear: 8, type: "High Speed", drs: true },
      { distance_m: 6720, turn: "T16", description: "Bus Stop Chicane",         is_corner: true,  speed: 76,  throttle: 20,  brake: 100, gear: 2, type: "Slow Chicane" },
      { distance_m: 7004, turn: "END", description: "Pit Straight Acceleration",is_corner: false, speed: 298, throttle: 100, brake: 0, gear: 7 },
    ],
  },
  australia: {
    length_m: 5278,
    name: "Albert Park Circuit",
    corners: [
      { distance_m: 0,    turn: "S/F", description: "Main Straight",           is_corner: false, speed: 318, throttle: 100, brake: 0, gear: 8, drs: true },
      { distance_m: 380,  turn: "T1",  description: "Jones Chicane Entry",      is_corner: true,  speed: 142, throttle: 40,  brake: 85, gear: 4, type: "Medium Speed" },
      { distance_m: 510,  turn: "T2",  description: "Brabham Exit",             is_corner: true,  speed: 165, throttle: 75,  brake: 15, gear: 5, type: "Medium Speed" },
      { distance_m: 950,  turn: "T3",  description: "Sports Center Hairpin",    is_corner: true,  speed: 88,  throttle: 25,  brake: 95, gear: 2, type: "Hairpin" },
      { distance_m: 1150, turn: "T4",  description: "Turn 4 Sweep",             is_corner: true,  speed: 170, throttle: 65,  brake: 30, gear: 4, type: "Medium Speed" },
      { distance_m: 1550, turn: "T6",  description: "Marina Curve",             is_corner: true,  speed: 152, throttle: 55,  brake: 50, gear: 4, type: "Medium Speed" },
      { distance_m: 2350, turn: "T9-10",description: "Lakeside High-Speed Chicanes", is_corner: true, speed: 258, throttle: 88, brake: 20, gear: 6, type: "High Speed", drs: true },
      { distance_m: 3100, turn: "T11", description: "Ascari Sweeper",          is_corner: true,  speed: 215, throttle: 80,  brake: 25, gear: 6, type: "High Speed" },
      { distance_m: 3850, turn: "T12", description: "Waite Curve",             is_corner: true,  speed: 228, throttle: 85,  brake: 20, gear: 6, type: "High Speed" },
      { distance_m: 4400, turn: "T13", description: "Clark Chicane Entry",      is_corner: true,  speed: 112, throttle: 35,  brake: 80, gear: 3, type: "Medium Speed" },
      { distance_m: 4950, turn: "T14", description: "Prost Final Apex",        is_corner: true,  speed: 125, throttle: 45,  brake: 70, gear: 3, type: "Medium Speed" },
      { distance_m: 5278, turn: "END", description: "Pit Straight",             is_corner: false, speed: 312, throttle: 100, brake: 0, gear: 8 },
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
      { distance_m: 5400, turn: "T11", description: "Curva Parabolica",        is_corner: true,  speed: 215, throttle: 85,  brake: 35, gear: 6, type: "High Speed" },
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
      { distance_m: 2980, turn: "T13-16",description: "Swimming Pool",          is_corner: true,  speed: 195, throttle: 80,  brake: 25, gear: 5, type: "Fast Chicane" },
      { distance_m: 3180, turn: "T17-18",description: "La Rascasse",           is_corner: true,  speed: 62,  throttle: 20,  brake: 90, gear: 2, type: "Hairpin" },
      { distance_m: 3260, turn: "T19", description: "Anthony Noghès",          is_corner: true,  speed: 85,  throttle: 40,  brake: 60, gear: 2, type: "Slow Corner" },
      { distance_m: 3337, turn: "END", description: "Finish Line",             is_corner: false, speed: 275, throttle: 100, brake: 0, gear: 6 },
    ],
  },
};

// Procedural generator for any other calendar circuit
const generateCircuitProfile = (circuit) => {
  const cid = circuit?.circuit_id?.toLowerCase() || "australia";
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
        description: "Intermediate DRS Straight",
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
  const [activeChart, setActiveChart] = useState("speed"); // "speed" | "pedals" | "delta" | "synced"
  const [scrubPos, setScrubPos] = useState(380);
  const [isPlayingLap, setIsPlayingLap] = useState(false);
  const [tableViewMode, setTableViewMode] = useState("cards"); // "cards" | "table"
  const [activeRadioFilter, setActiveRadioFilter] = useState("ALL");
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);
  const [playingRadioId, setPlayingRadioId] = useState(null);

  // Get active circuit profile & official SVG layout
  const activeProfile = useMemo(() => {
    return generateCircuitProfile(selectedCircuit);
  }, [selectedCircuit]);

  const maxTrackDistance = activeProfile.length_m;
  const activeCircuitId = selectedCircuit?.circuit_id || "australia";
  const activeTrackSvgPath = OFFICIAL_CIRCUIT_PATHS[activeCircuitId] || OFFICIAL_CIRCUIT_PATHS.australia || OFFICIAL_CIRCUIT_PATHS.belgium;

  // Automated Real-Time Lap Scrubber Player (10Hz playback)
  useEffect(() => {
    if (!isPlayingLap) return;
    const interval = setInterval(() => {
      setScrubPos((prev) => {
        const next = prev + 140;
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
      const d1Var = Math.round(ratingDelta + (idx % 3 === 0 ? 3 : (idx % 2 === 0 ? -1 : 2)));
      const d2Var = Math.round(-ratingDelta + (idx % 3 === 0 ? -2 : (idx % 2 === 0 ? 2 : -1)));

      const s1 = Math.max(50, pt.speed + d1Var);
      const s2 = Math.max(50, pt.speed + d2Var);
      const deltaSpeed = s1 - s2;

      const t1 = Math.min(100, Math.max(0, pt.throttle + (d1Var > 0 ? 5 : -3)));
      const t2 = Math.min(100, Math.max(0, pt.throttle + (d2Var > 0 ? 5 : -3)));
      const b1 = pt.brake > 0 ? Math.min(100, pt.brake + (d1Var < 0 ? 10 : 0)) : 0;
      const b2 = pt.brake > 0 ? Math.min(100, pt.brake + (d2Var < 0 ? 10 : 0)) : 0;

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

  // Closest telemetry point to current scrubber
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
  const fasterProfile = fasterDriver === selectedPair.d1 ? d1Profile : d2Profile;

  // Formula Dream Team Radio Comms
  const teamRadioList = useMemo(() => {
    return getTeammateRadio(selectedPair.d1, selectedPair.d2);
  }, [selectedPair]);

  const filteredRadio = useMemo(() => {
    if (activeRadioFilter === "ALL") return teamRadioList;
    return teamRadioList.filter(r => r.category.toUpperCase().includes(activeRadioFilter));
  }, [teamRadioList, activeRadioFilter]);

  const d1Color = selectedPair.color;
  const d2Color = selectedPair.color2 || "#00F0FF";

  const handlePlayVoiceRadio = (rad) => {
    setPlayingRadioId(rad.id);
    f1Audio.speakRadioMessage(rad.driver_name, `${rad.driver_code}: ${rad.message}`);
    setTimeout(() => {
      setPlayingRadioId(null);
    }, 4500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "36px" }}>

      {/* ── 1. Clean Constructor Livery Selector ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 12, 20, 0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "12px 18px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🏎️</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
              SELECT 2026 CONSTRUCTOR DUEL
            </span>
            <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", padding: "2px 8px", borderRadius: "10px", fontFamily: "'Orbitron', monospace" }}>
              11 Teams
            </span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
            📍 {selectedCircuit?.grand_prix_name || "Australian GP"} · {(maxTrackDistance / 1000).toFixed(3)} km
          </div>
        </div>

        {/* Clean, Modern Horizontal Scrollable Team Pills */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.15) transparent",
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
                  gap: "8px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: isSelected
                    ? `linear-gradient(135deg, ${pair.color}28 0%, rgba(20,24,36,0.95) 100%)`
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isSelected ? pair.color : "rgba(255,255,255,0.08)"}`,
                  borderLeft: `4px solid ${pair.color}`,
                  boxShadow: isSelected ? `0 4px 16px ${pair.color}35` : "none",
                  transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={pair.team}
                    style={{ height: "16px", width: "auto", objectFit: "contain", opacity: isSelected ? 1 : 0.6 }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "0.68rem", color: isSelected ? "#ffffff" : "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {pair.team}
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: isSelected ? pair.color : "var(--text-dim)" }}>
                    #{pair.d1Num} {pair.d1} <span style={{ color: "rgba(255,255,255,0.25)" }}>vs</span> #{pair.d2Num} {pair.d2}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Hero Head-to-Head Battle Showcase (Crystal Clear at a Glance) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.6fr 1.1fr",
          gap: "14px",
          alignItems: "stretch",
        }}
      >
        {/* Driver 1 Card */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: `1px solid ${d1Color}44`,
            borderLeft: `5px solid ${d1Color}`,
            borderRadius: "12px",
            padding: "16px",
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 0 20px ${d1Color}12`,
          }}
        >
          {/* Subtle Car Number Background Watermark */}
          <div
            style={{
              position: "absolute",
              right: "6px",
              top: "-12px",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "6.5rem",
              fontWeight: "900",
              color: `${d1Color}10`,
              pointerEvents: "none",
              lineHeight: 0.9,
            }}
          >
            {selectedPair.d1Num}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
            <div
              style={{
                position: "relative",
                width: "68px",
                height: "68px",
                flexShrink: 0,
                borderRadius: "50%",
                padding: "2px",
                background: `radial-gradient(circle, ${d1Color}66, transparent)`,
                boxShadow: `0 0 14px ${d1Color}44`,
              }}
            >
              <img
                src={DRIVER_FACES[selectedPair.d1] || ""}
                alt={selectedPair.d1}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${d1Color}`, background: "#111" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: "#0b0c10",
                  border: `1.5px solid ${d1Color}`,
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "0.65rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  color: d1Color,
                }}
              >
                #{selectedPair.d1Num}
              </span>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "0.64rem", background: "rgba(255,255,255,0.06)", color: "var(--neon-cyan)", padding: "2px 7px", borderRadius: "4px", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  {d1Profile.nationality ? d1Profile.nationality.slice(0, 3).toUpperCase() : "FIA"}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  {selectedPair.team}
                </span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d1Profile.name || selectedPair.d1}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pace: <strong style={{ color: d1Color }}>{d1Profile.telemetry_ratings?.pace || 95}</strong></span>
                <span style={{ color: "var(--text-secondary)" }}>Racecraft: <strong style={{ color: "#fff" }}>{d1Profile.telemetry_ratings?.racecraft || 93}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Key Performance Indicators */}
          <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.35)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>TOP SPEED</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: d1Color, marginTop: "2px" }}>
                {topSpeedD1} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>APEX SPEED (Vmin)</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {minApexD1} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Head-to-Head Battle Verdict & Visual Comparative Meters */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Verdict Headline */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.1em", fontWeight: "800" }}>
                HEAD-TO-HEAD BATTLE VERDICT
              </span>
              <span
                style={{
                  fontSize: "0.74rem",
                  background: "rgba(0, 230, 118, 0.16)",
                  color: "var(--neon-green)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  border: "1px solid rgba(0, 230, 118, 0.4)",
                  fontWeight: "900",
                  fontFamily: "'Orbitron', monospace",
                  boxShadow: "0 0 10px rgba(0,230,118,0.25)",
                }}
              >
                🏆 {fasterDriver} LEADING BY {Math.abs(lapDeltaSec)}s
              </span>
            </div>

            {/* Direct Comparative Visual Meters */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              
              {/* Metric 1: Top Speed Duel */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", marginBottom: "3px" }}>
                  <span style={{ color: d1Color, fontWeight: "800" }}>{selectedPair.d1}: {topSpeedD1} km/h</span>
                  <span style={{ color: "var(--text-secondary)" }}>Straight-Line Speed</span>
                  <span style={{ color: d2Color, fontWeight: "800" }}>{selectedPair.d2}: {topSpeedD2} km/h</span>
                </div>
                <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${(topSpeedD1 / (topSpeedD1 + topSpeedD2)) * 100}%`, background: d1Color, boxShadow: `0 0 6px ${d1Color}` }} />
                  <div style={{ width: `${(topSpeedD2 / (topSpeedD1 + topSpeedD2)) * 100}%`, background: d2Color, boxShadow: `0 0 6px ${d2Color}` }} />
                </div>
              </div>

              {/* Metric 2: Min Apex Cornering Grip */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", marginBottom: "3px" }}>
                  <span style={{ color: d1Color, fontWeight: "800" }}>{selectedPair.d1}: {minApexD1} km/h</span>
                  <span style={{ color: "var(--text-secondary)" }}>Min Apex Grip (Vmin)</span>
                  <span style={{ color: d2Color, fontWeight: "800" }}>{selectedPair.d2}: {minApexD2} km/h</span>
                </div>
                <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${(minApexD1 / (minApexD1 + minApexD2)) * 100}%`, background: d1Color }} />
                  <div style={{ width: `${(minApexD2 / (minApexD1 + minApexD2)) * 100}%`, background: d2Color }} />
                </div>
              </div>

              {/* Metric 3: Full Throttle Lap Commitment */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", marginBottom: "3px" }}>
                  <span style={{ color: d1Color, fontWeight: "800" }}>{selectedPair.d1}: {avgThrottleD1}%</span>
                  <span style={{ color: "var(--text-secondary)" }}>Full Throttle % of Lap</span>
                  <span style={{ color: d2Color, fontWeight: "800" }}>{selectedPair.d2}: {avgThrottleD2}%</span>
                </div>
                <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${avgThrottleD1}%`, background: d1Color }} />
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ width: `${avgThrottleD2}%`, background: d2Color }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sector Split Summary & Radio Link */}
          <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace" }}>
              <span style={{ color: s1D1 >= s1D2 ? d1Color : d2Color }}>S1: {s1D1 >= s1D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s1D1 - s1D2)} km/h)</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ color: s2D1 >= s2D2 ? d1Color : d2Color }}>S2: {s2D1 >= s2D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s2D1 - s2D2)} km/h)</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ color: s3D1 >= s3D2 ? d1Color : d2Color }}>S3: {s3D1 >= s3D2 ? selectedPair.d1 : selectedPair.d2} (+{Math.abs(s3D1 - s3D2)} km/h)</span>
            </div>

            <button
              onClick={() => setIsRadioModalOpen(true)}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(0, 210, 190, 0.12)",
                border: "1px solid rgba(0, 210, 190, 0.4)",
                color: "var(--neon-cyan)",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.66rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>📻 RADIO DEBRIEF</span>
            </button>
          </div>
        </div>

        {/* Driver 2 Card */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: `1px solid ${d2Color}44`,
            borderRight: `5px solid ${d2Color}`,
            borderRadius: "12px",
            padding: "16px",
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), inset 0 0 20px ${d2Color}12`,
          }}
        >
          {/* Subtle Car Number Background Watermark */}
          <div
            style={{
              position: "absolute",
              left: "6px",
              top: "-12px",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "6.5rem",
              fontWeight: "900",
              color: `${d2Color}10`,
              pointerEvents: "none",
              lineHeight: 0.9,
            }}
          >
            {selectedPair.d2Num}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexDirection: "row-reverse", position: "relative", zIndex: 1 }}>
            <div
              style={{
                position: "relative",
                width: "68px",
                height: "68px",
                flexShrink: 0,
                borderRadius: "50%",
                padding: "2px",
                background: `radial-gradient(circle, ${d2Color}66, transparent)`,
                boxShadow: `0 0 14px ${d2Color}44`,
              }}
            >
              <img
                src={DRIVER_FACES[selectedPair.d2] || ""}
                alt={selectedPair.d2}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${d2Color}`, background: "#111" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  left: -2,
                  background: "#0b0c10",
                  border: `1.5px solid ${d2Color}`,
                  borderRadius: "4px",
                  padding: "1px 5px",
                  fontSize: "0.65rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  color: d2Color,
                }}
              >
                #{selectedPair.d2Num}
              </span>
            </div>

            <div style={{ minWidth: 0, flex: 1, textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  {selectedPair.team}
                </span>
                <span style={{ fontSize: "0.64rem", background: "rgba(255,255,255,0.06)", color: "var(--neon-cyan)", padding: "2px 7px", borderRadius: "4px", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  {d2Profile.nationality ? d2Profile.nationality.slice(0, 3).toUpperCase() : "FIA"}
                </span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d2Profile.name || selectedPair.d2}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-secondary)" }}>Pace: <strong style={{ color: d2Color }}>{d2Profile.telemetry_ratings?.pace || 93}</strong></span>
                <span style={{ color: "var(--text-secondary)" }}>Racecraft: <strong style={{ color: "#fff" }}>{d2Profile.telemetry_ratings?.racecraft || 91}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Key Performance Indicators */}
          <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(0,0,0,0.35)", padding: "10px 12px", borderRadius: "8px", textAlign: "right", border: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>TOP SPEED</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: d2Color, marginTop: "2px" }}>
                {topSpeedD2} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>APEX SPEED (Vmin)</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {minApexD2} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Interactive Corner Strip & Real-Time Cockpit HUD ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "18px 20px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎯 INTERACTIVE CORNER EXPLORER & REAL-TIME HUD</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Click any corner pill or scrub the track slider to inspect live apex velocities and pedal inputs.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                fontSize: "0.70rem",
                fontWeight: "900",
                boxShadow: isPlayingLap ? "0 0 10px rgba(232,0,45,0.4)" : "0 0 10px rgba(0,204,68,0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>{isPlayingLap ? "⏸ PAUSE LAP" : "▶ AUTO-SWEEP"}</span>
            </button>

            <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.05)", color: "var(--neon-yellow)", padding: "3px 9px", borderRadius: "5px", border: "1px solid rgba(255,221,0,0.3)", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
              {scrubPos}m ({Math.round((scrubPos / maxTrackDistance) * 100)}%)
            </span>
          </div>
        </div>

        {/* Clean Interactive Corner Strip */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "10px",
            marginBottom: "14px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.18) transparent",
          }}
        >
          {activeProfile.corners.map((c) => {
            const isTarget = Math.abs(scrubPos - c.distance_m) < 80;
            const ptData = telemetryData.find(p => p.distance === c.distance_m);
            const winner = ptData && ptData.d1_speed >= ptData.d2_speed ? selectedPair.d1 : selectedPair.d2;
            const winColor = ptData && ptData.d1_speed >= ptData.d2_speed ? d1Color : d2Color;
            const delta = ptData ? Math.abs(ptData.delta) : 0;

            return (
              <button
                key={c.distance_m}
                onClick={() => setScrubPos(c.distance_m)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  flex: "0 0 auto",
                  padding: "7px 11px",
                  borderRadius: "8px",
                  background: isTarget
                    ? "linear-gradient(135deg, rgba(255,221,0,0.25) 0%, rgba(20,24,36,0.95) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isTarget ? "var(--neon-yellow)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isTarget ? "0 0 12px rgba(255,221,0,0.3)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: "900", color: isTarget ? "var(--neon-yellow)" : "#ffffff" }}>
                    {c.turn}
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                    {c.distance_m}m
                  </span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {c.description}
                </div>
                {ptData && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: winColor, fontWeight: "800" }}>
                      {winner} +{delta}km/h
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Track Slider Bar */}
        <div style={{ marginBottom: "14px" }}>
          <input
            type="range"
            min="0"
            max={maxTrackDistance}
            step="40"
            value={scrubPos}
            onChange={(e) => setScrubPos(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--neon-yellow)", cursor: "pointer", height: "6px" }}
          />
        </div>

        {/* Real-Time Cockpit Instruments HUD (4 Clean Pods) */}
        {currentPoint && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.3fr 1.2fr 0.9fr",
              gap: "12px",
              background: "rgba(0,0,0,0.4)",
              padding: "14px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Pod 1: Track Location & Profile */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Active Apex Profile
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.1rem", color: "#ffffff", marginTop: "3px" }}>
                {currentPoint.label} · {currentPoint.desc}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
                <span style={{ fontSize: "0.65rem", background: currentPoint.is_corner ? "rgba(255,221,0,0.15)" : "rgba(0,230,118,0.15)", color: currentPoint.is_corner ? "var(--neon-yellow)" : "var(--neon-green)", padding: "2px 6px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                  {currentPoint.type}
                </span>
                {currentPoint.drs && (
                  <span style={{ fontSize: "0.65rem", background: "rgba(0,210,190,0.15)", color: "var(--neon-cyan)", padding: "2px 6px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                    🚀 DRS ACTIVE
                  </span>
                )}
              </div>
            </div>

            {/* Pod 2: Live Speed Duel */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Live Speed Comparison
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "4px" }}>
                <span style={{ color: d1Color, fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.25rem", textShadow: `0 0 8px ${d1Color}44` }}>
                  {currentPoint.d1_speed} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>vs</span>
                <span style={{ color: d2Color, fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "1.25rem", textShadow: `0 0 8px ${d2Color}44` }}>
                  {currentPoint.d2_speed} <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>km/h</span>
                </span>
              </div>
              <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", marginTop: "4px", fontFamily: "'Orbitron', monospace" }}>
                Delta: <strong style={{ color: currentPoint.delta >= 0 ? d1Color : d2Color }}>
                  {Math.abs(currentPoint.delta)} km/h
                </strong> ({currentPoint.delta >= 0 ? selectedPair.d1 : selectedPair.d2} Advantage)
              </div>
            </div>

            {/* Pod 3: Throttle & Brake Pedals */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", paddingRight: "12px" }}>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Throttle & Brake Inputs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "28px", fontSize: "0.68rem", color: d1Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{selectedPair.d1}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${currentPoint.d1_throttle}%`, height: "100%", background: d1Color }} />
                  </div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem" }}>{currentPoint.d1_throttle}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "28px", fontSize: "0.68rem", color: d2Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>{selectedPair.d2}</span>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${currentPoint.d2_throttle}%`, height: "100%", background: d2Color }} />
                  </div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem" }}>{currentPoint.d2_throttle}%</span>
                </div>
              </div>
            </div>

            {/* Pod 4: Active Gear & G-Force */}
            <div>
              <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", textTransform: "uppercase", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Gear & Lateral G
              </div>
              <div style={{ marginTop: "4px" }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: "var(--neon-green)" }}>
                  GEAR {currentPoint.gear || 7}
                </div>
                <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
                  Lat G: ~{(currentPoint.is_corner ? (currentPoint.d1_speed / 62).toFixed(1) : 0.8)}G
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Focused Telemetry Chart Studio (No Stacking Overload) ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "18px 20px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Chart View Mode Pills */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "900", color: "#ffffff" }}>
              TELEMETRY TRACE STUDIO
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.74rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: d1Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ width: "10px", height: "4px", background: d1Color, borderRadius: "2px" }} /> #{selectedPair.d1Num} {selectedPair.d1}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: d2Color, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ width: "10px", height: "4px", background: d2Color, borderRadius: "2px" }} /> #{selectedPair.d2Num} {selectedPair.d2}
              </span>
            </div>
          </div>

          {/* Clean Segmented Chart Switcher */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)", gap: "4px" }}>
            {[
              { id: "speed",   label: "⚡ Speed Trace" },
              { id: "pedals",  label: "🏎️ Throttle & Brake" },
              { id: "delta",   label: "⏱️ Time Delta Δt" },
              { id: "synced",  label: "📊 Dual Channel" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  background: activeChart === tab.id ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "transparent",
                  color: activeChart === tab.id ? "#ffffff" : "var(--text-secondary)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: activeChart === tab.id ? "800" : "600",
                  transition: "all 0.15s ease",
                  boxShadow: activeChart === tab.id ? "0 0 10px rgba(232,0,45,0.35)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CHANNEL: SPEED TRACE ── */}
        {activeChart === "speed" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" domain={[50, 360]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                formatter={(val, name) => [`${val} km/h`, name === "d1_speed" ? selectedPair.d1 : selectedPair.d2]}
              />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="d1_speed" name="d1_speed" stroke={d1Color} dot={false} strokeWidth={2.8} />
              <Line type="monotone" dataKey="d2_speed" name="d2_speed" stroke={d2Color} dot={false} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* ── CHANNEL: THROTTLE & BRAKE ── */}
        {activeChart === "pedals" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
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

        {/* ── CHANNEL: LAP TIME DELTA Δt ── */}
        {activeChart === "delta" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
              <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
              <YAxis stroke="#444a5a" tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}s`} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#11141d", border: "1px solid #2a3142", borderRadius: "8px", color: "#e8e8f0" }}
                labelFormatter={(d) => `${d}m · ${telemetryData.find(p => p.distance === d)?.desc || "Track Point"}`}
                formatter={(val) => [`${val > 0 ? "+" : ""}${val}s`, `Δt Gap (${val >= 0 ? selectedPair.d1 : selectedPair.d2} Ahead)`]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
              <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="time_delta" name="Time Delta Δt" stroke="var(--neon-cyan)" dot={{ r: 2 }} strokeWidth={2.6} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* ── CHANNEL: DUAL CHANNEL SYNCED ── */}
        {activeChart === "synced" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
                  <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#444a5a" domain={[50, 355]} tick={{ fontSize: 10 }} />
                  <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="d1_speed" stroke={d1Color} dot={false} strokeWidth={2.4} />
                  <Line type="monotone" dataKey="d2_speed" stroke={d2Color} dot={false} strokeWidth={2.0} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: "140px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#222530" />
                  <XAxis dataKey="distance" stroke="#444a5a" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#444a5a" domain={[0, 105]} tick={{ fontSize: 10 }} />
                  <ReferenceLine x={scrubPos} stroke="var(--neon-yellow)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="d1_throttle" stroke={d1Color} dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="d2_throttle" stroke={d2Color} dot={false} strokeWidth={1.8} />
                  <Line type="stepAfter" dataKey="d1_brake" stroke="#ff3344" strokeDasharray="3 2" dot={false} strokeWidth={1.6} />
                  <Line type="stepAfter" dataKey="d2_brake" stroke="#ff9900" strokeDasharray="3 2" dot={false} strokeWidth={1.6} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Corner-by-Corner Apex Battle: Visual Cards & Grid ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "18px 20px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
              CORNER-BY-CORNER APEX VELOCITY BREAKDOWN
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Detailed speed and delta comparison across all turning thresholds of {activeProfile.name}.
            </div>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: "2px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setTableViewMode("cards")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.68rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: tableViewMode === "cards" ? "800" : "600",
                background: tableViewMode === "cards" ? "rgba(255,255,255,0.15)" : "transparent",
                color: tableViewMode === "cards" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              🃏 VISUAL CARDS
            </button>
            <button
              onClick={() => setTableViewMode("table")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.68rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: tableViewMode === "table" ? "800" : "600",
                background: tableViewMode === "table" ? "rgba(255,255,255,0.15)" : "transparent",
                color: tableViewMode === "table" ? "#ffffff" : "var(--text-secondary)",
              }}
            >
              📋 COMPACT TABLE
            </button>
          </div>
        </div>

        {/* Visual Cards View (Default: Simple, Modern, Intuitive) */}
        {tableViewMode === "cards" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {apexPoints.map((pt) => {
              const winner = pt.d1_speed >= pt.d2_speed ? selectedPair.d1 : selectedPair.d2;
              const winColor = pt.d1_speed >= pt.d2_speed ? d1Color : d2Color;
              const deltaVal = Math.abs(pt.d1_speed - pt.d2_speed);
              const isSelected = Math.abs(scrubPos - pt.distance) < 80;

              return (
                <div
                  key={pt.distance}
                  onClick={() => setScrubPos(pt.distance)}
                  style={{
                    background: isSelected ? "rgba(255,221,0,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? "var(--neon-yellow)" : "rgba(255,255,255,0.06)"}`,
                    borderLeft: `4px solid ${winColor}`,
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 0 12px rgba(255,221,0,0.2)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff", fontSize: "0.85rem" }}>
                      {pt.label}
                    </span>
                    <span style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", padding: "2px 6px", borderRadius: "3px", fontFamily: "'Orbitron', monospace" }}>
                      {pt.type} · G{pt.gear || 3}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    {pt.desc}
                  </div>

                  {/* Speed Values Comparison */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: "6px" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.62rem", color: d1Color, fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>{selectedPair.d1}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#fff" }}>{pt.d1_speed} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>km/h</span></span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: "0.65rem", background: `${winColor}22`, color: winColor, border: `1px solid ${winColor}44`, padding: "2px 6px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                        +{deltaVal} km/h
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "0.62rem", color: d2Color, fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>{selectedPair.d2}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#fff" }}>{pt.d2_speed} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>km/h</span></span>
                    </div>
                  </div>

                  {/* Winner Tag */}
                  <div style={{ marginTop: "6px", display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.64rem", color: winColor, fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                      🏆 {winner} Faster Apex
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact Table View */
          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "8px 12px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>CORNER</th>
                  <th style={{ padding: "8px 12px" }}>DESCRIPTION</th>
                  <th style={{ padding: "8px 12px", color: d1Color, fontFamily: "'Orbitron', monospace" }}>{selectedPair.d1} APEX</th>
                  <th style={{ padding: "8px 12px", color: d2Color, fontFamily: "'Orbitron', monospace" }}>{selectedPair.d2} APEX</th>
                  <th style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'Orbitron', monospace" }}>DELTA</th>
                  <th style={{ padding: "8px 12px" }}>ADVANTAGE</th>
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
                      onClick={() => setScrubPos(pt.distance)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: idx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "8px 12px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
                        {pt.label}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ color: "#e8e8f0" }}>{pt.desc}</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginLeft: "6px" }}>({pt.type})</span>
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: d1Color }}>
                        {pt.d1_speed} km/h
                      </td>
                      <td style={{ padding: "8px 12px", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: d2Color }}>
                        {pt.d2_speed} km/h
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'Orbitron', monospace", color: winColor, fontWeight: "800" }}>
                        +{deltaVal} km/h
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: "0.70rem", color: winColor, fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                          🏆 {winner}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 6. Authentic Team Radio & Telemetry Debrief ── */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "18px 20px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>📻</span>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                AUTHENTIC TEAM RADIO DEBRIEF ({selectedPair.team.toUpperCase()})
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Two-way cockpit transmissions between drivers and race engineers regarding car balance, delta, and energy deploy.
              </div>
            </div>
          </div>

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
            }}
          >
            <span>📻 FULL ARCHIVE</span>
          </button>
        </div>

        {/* Radio Messages Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filteredRadio.slice(0, 4).map((rad) => {
            const isD1 = rad.driver_code === selectedPair.d1;
            const cardAccent = isD1 ? d1Color : d2Color;
            const isPlayingThis = playingRadioId === rad.id;

            return (
              <div
                key={rad.id}
                style={{
                  background: "rgba(10, 12, 18, 0.85)",
                  border: `1px solid ${cardAccent}33`,
                  borderLeft: `4px solid ${cardAccent}`,
                  borderRadius: "8px",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", color: cardAccent, fontSize: "0.82rem" }}>
                      {rad.driver_code}
                    </span>
                    <span style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                      {rad.driver_name} · Lap {rad.lap}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlayVoiceRadio(rad)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: "0.64rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "800",
                      color: isPlayingThis ? "var(--neon-green)" : "var(--neon-cyan)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{isPlayingThis ? "🔊 PLAYING" : "🎙️ LISTEN"}</span>
                  </button>
                </div>

                <div style={{ fontSize: "0.80rem", color: "#e8e8f0", lineHeight: "1.35" }}>
                  <span style={{ color: rad.speaker === "PIT" ? "var(--neon-red)" : cardAccent, fontWeight: "800", fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", marginRight: "6px" }}>
                    {rad.speaker === "PIT" ? `PIT (${rad.engineer_name}):` : `${rad.driver_code}:`}
                  </span>
                  "{rad.message}"
                </div>

                {rad.driver_reply && (
                  <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.03)", padding: "5px 8px", borderRadius: "4px", borderLeft: "2px solid rgba(255,255,255,0.15)" }}>
                    <span style={{ color: rad.speaker === "PIT" ? cardAccent : "var(--neon-red)", fontWeight: "800", fontFamily: "'Orbitron', monospace", fontSize: "0.70rem", marginRight: "6px" }}>
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
