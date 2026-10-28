// ============================================================
// LiveRaceMapTracker.jsx — Authentic F1 Manager 24 Satellite 3D Broadcast Tracker
// 60FPS Hardware Acceleration, Realistic Melbourne Urban Grid & Albert Park Terrain,
// Azure Teal Lake with Island & Footbridge, 28+ 3D Extruded CBD Skyline Skyscrapers,
// Screen-Space 2D Billboard Driver Pills (100% Horizontal, Zero Skew, 1px Leader Pins),
// Left Timing Tower with Solid White Selected Row, Top-Right RACE VIEW HUD, 4x Hero Capsule.
// Max Verstappen is strictly car #3.
// ============================================================
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { getCircuitWeather } from "../data/calendar2026";

// ── Official 2026 Team Colors & Badges ─────────────────────────────────────
const TEAM_COLORS = {
  "McLaren":         { primary: "#ff8700", secondary: "#47c7fc", text: "#000000", glow: "rgba(255, 135, 0, 0.65)" },
  "Red Bull Racing": { primary: "#3671e8", secondary: "#cc1e4a", text: "#ffffff", glow: "rgba(54, 113, 232, 0.65)" },
  "Mercedes":        { primary: "#00d2be", secondary: "#c8ccce", text: "#000000", glow: "rgba(0, 210, 190, 0.65)" },
  "Ferrari":         { primary: "#ff3b30", secondary: "#ffeb3b", text: "#ffffff", glow: "rgba(255, 59, 48, 0.65)" },
  "Williams":        { primary: "#00a0de", secondary: "#ffffff", text: "#ffffff", glow: "rgba(0, 160, 222, 0.65)" },
  "Aston Martin":    { primary: "#229971", secondary: "#cedc00", text: "#ffffff", glow: "rgba(34, 153, 113, 0.65)" },
  "Cadillac":        { primary: "#ffc72c", secondary: "#ffffff", text: "#000000", glow: "rgba(255, 199, 44, 0.65)" },
  "Audi":            { primary: "#e50027", secondary: "#ffffff", text: "#ffffff", glow: "rgba(229, 0, 39, 0.65)" },
  "Alpine":          { primary: "#0090ff", secondary: "#ff87b4", text: "#ffffff", glow: "rgba(0, 144, 255, 0.65)" },
  "Haas":            { primary: "#b6babd", secondary: "#e10600", text: "#000000", glow: "rgba(182, 186, 189, 0.65)" },
  "Racing Bulls":    { primary: "#6692ff", secondary: "#ffffff", text: "#ffffff", glow: "rgba(102, 146, 255, 0.65)" },
  "RB":              { primary: "#6692ff", secondary: "#ffffff", text: "#ffffff", glow: "rgba(102, 146, 255, 0.65)" },
};

// ── Night Race Circuits ────────────────────────────────────────────────────
const NIGHT_CIRCUITS = ["las_vegas", "singapore", "bahrain", "qatar", "abu_dhabi", "saudi_arabia"];

// ── Tactical Pace Commands ─────────────────────────────────────────────────
const PACE_COMMANDS = [
  { id: "attack",     name: "Attack",     dots: 5, color: "#ff3b30", paceIcon: "▼▼", wearIcon: "▲▲", speedMult: 1.09, ersBurn: 4 },
  { id: "aggressive", name: "Aggressive", dots: 4, color: "#ff8700", paceIcon: "▼",  wearIcon: "▲",  speedMult: 1.04, ersBurn: 2 },
  { id: "standard",   name: "Standard",   dots: 3, color: "#ffeb3b", paceIcon: "-",  wearIcon: "-",  speedMult: 1.00, ersBurn: 0 },
  { id: "light",      name: "Light",      dots: 2, color: "#00d2be", paceIcon: "▲",  wearIcon: "▼",  speedMult: 0.96, ersBurn: -1 },
  { id: "conserve",   name: "Conserve",   dots: 1, color: "#bf7fff", paceIcon: "▲▲", wearIcon: "▼▼", speedMult: 0.91, ersBurn: -3 },
];

const LUT_SIZE = 1400; // Dense 1400-waypoint lookup table for 60FPS fluid physics

// ── 3D Extruded Low-Poly Melbourne CBD Skyline (F1 Manager 24 Cityscape) ───
const MELBOURNE_SKYLINE_BUILDINGS = [
  // North-West Urban Cluster (South Melbourne / Albert Road behind Turns 11-14)
  { x: -95, y: 45,  w: 24, d: 16, h: 55 },
  { x: -65, y: 20,  w: 28, d: 18, h: 75 },
  { x: -28, y: 0,   w: 32, d: 20, h: 95 },
  { x: 12,  y: 12,  w: 26, d: 17, h: 70 },
  { x: 48,  y: -10, w: 34, d: 22, h: 110 },
  { x: 88,  y: 5,   w: 28, d: 18, h: 80 },
  { x: -80, y: 85,  w: 26, d: 17, h: 45 },
  { x: -45, y: 65,  w: 28, d: 18, h: 50 },
  { x: -10, y: 50,  w: 30, d: 20, h: 60 },
  { x: 30,  y: 60,  w: 26, d: 17, h: 52 },

  // Far Horizon Distant Spires (Distant CBD silhouettes)
  { x: 140, y: -45, w: 32, d: 20, h: 105 },
  { x: 185, y: -55, w: 36, d: 22, h: 120 },
  { x: 235, y: -50, w: 30, d: 20, h: 100 },
  { x: 280, y: -60, w: 34, d: 22, h: 115 },
  { x: 330, y: -45, w: 30, d: 20, h: 95 },

  // North-East Urban Cluster (St Kilda Road & Queens Road behind Turns 3-6)
  { x: 380, y: -5,  w: 30, d: 20, h: 85 },
  { x: 420, y: -20, w: 36, d: 24, h: 120 },
  { x: 465, y: -10, w: 34, d: 22, h: 105 },
  { x: 510, y: 5,   w: 32, d: 20, h: 90 },
  { x: 550, y: 30,  w: 28, d: 18, h: 70 },
  { x: 395, y: 45,  w: 28, d: 18, h: 65 },
  { x: 435, y: 35,  w: 32, d: 21, h: 78 },
  { x: 480, y: 50,  w: 30, d: 20, h: 72 },
  { x: 525, y: 65,  w: 26, d: 17, h: 58 },
  { x: 565, y: 85,  w: 24, d: 16, h: 48 },
];

function LowPoly3DBuilding({ x, y, w, d, h, isNight = false }) {
  const frontFill = isNight ? "#121824" : "#475464";
  const frontStroke = isNight ? "rgba(0, 210, 255, 0.3)" : "#546375";
  const sideFill = isNight ? "#090d15" : "#333d49";
  const sideStroke = isNight ? "rgba(0, 210, 255, 0.2)" : "#414d5c";
  const roofFill = isNight ? "#1c2538" : "#6b7a8c";
  const roofStroke = isNight ? "rgba(0, 210, 255, 0.55)" : "#7e8f9f";

  return (
    <g className="building-3d" opacity="0.96">
      {/* Ground Footprint Ambient Occlusion Shadow */}
      <polygon
        points={`${x},${y} ${x + w},${y} ${x + w + d * 0.5},${y + d * 0.4} ${x + d * 0.5},${y + d * 0.4}`}
        fill={isNight ? "rgba(0,0,0,0.85)" : "rgba(0, 0, 0, 0.58)"}
      />
      {/* Front Face */}
      <polygon
        points={`${x},${y} ${x},${y - h} ${x + w},${y - h} ${x + w},${y}`}
        fill={frontFill}
        stroke={frontStroke}
        strokeWidth="0.5"
      />
      {/* Side Face (Isometric Depth) */}
      <polygon
        points={`${x + w},${y} ${x + w},${y - h} ${x + w + d * 0.6},${y - h + d * 0.45} ${x + w + d * 0.6},${y + d * 0.45}`}
        fill={sideFill}
        stroke={sideStroke}
        strokeWidth="0.5"
      />
      {/* Top Roof Face (Sky Illuminated) */}
      <polygon
        points={`${x},${y - h} ${x + w},${y - h} ${x + w + d * 0.6},${y - h + d * 0.45} ${x + d * 0.6},${y - h + d * 0.45}`}
        fill={roofFill}
        stroke={roofStroke}
        strokeWidth="0.6"
      />
      {/* Lit Window Horizontal Bands */}
      <line x1={x + 2} y1={y - h + 7} x2={x + w - 2} y2={y - h + 7} stroke={isNight ? "#00e5ff" : "rgba(255, 224, 130, 0.65)"} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.8" />
      <line x1={x + 2} y1={y - h + 15} x2={x + w - 2} y2={y - h + 15} stroke={isNight ? "#ffd700" : "rgba(255, 255, 255, 0.45)"} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.75" />
      {h > 45 && (
        <line x1={x + 2} y1={y - h + 24} x2={x + w - 2} y2={y - h + 24} stroke={isNight ? "#00e5ff" : "rgba(255, 224, 130, 0.6)"} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.75" />
      )}
      {h > 65 && (
        <line x1={x + 2} y1={y - h + 34} x2={x + w - 2} y2={y - h + 34} stroke={isNight ? "#ffd700" : "rgba(255, 255, 255, 0.4)"} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.7" />
      )}
      {h > 85 && (
        <line x1={x + 2} y1={y - h + 46} x2={x + w - 2} y2={y - h + 46} stroke={isNight ? "#ffffff" : "rgba(255, 224, 130, 0.55)"} strokeWidth="0.8" strokeDasharray="2.5 3" opacity="0.65" />
      )}
      {/* Red Rooftop Aircraft Warning Beacon */}
      {h > 75 && (
        <circle cx={x + w * 0.5} cy={y - h} r="1.3" fill="#ff1801" />
      )}
    </g>
  );
}

export default function LiveRaceMapTracker({
  selectedCircuit,
  drivers = [],
  currentLap = 1,
  maxLaps = 58,
  sessionFlag = "GREEN",
  onCloseToTower,
}) {
  const activeCircuitId = selectedCircuit?.circuit_id || "australia";
  const activeTrackPath = OFFICIAL_CIRCUIT_PATHS[activeCircuitId] || OFFICIAL_CIRCUIT_PATHS.australia;
  const isNightRace = NIGHT_CIRCUITS.includes(activeCircuitId);

  // Australia uses authentic horizontal orientation (298 deg) like F1 Manager 24
  const defaultCircuitRotation = activeCircuitId === "australia" ? 298 : 0;

  const weather = useMemo(() => {
    if (selectedCircuit?.weather) return selectedCircuit.weather;
    return getCircuitWeather(activeCircuitId);
  }, [selectedCircuit, activeCircuitId]);

  // View & Interactive Controls
  const [is3DMode, setIs3DMode] = useState(true);
  const [isNightMode, setIsNightMode] = useState(isNightRace);
  const [sectorViewMode, setSectorViewMode] = useState("SECTORS"); // "SECTORS" | "GAP"
  const [sessionClock, setSessionClock] = useState(() => new Date().toLocaleTimeString("en-GB"));
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(4); // F1 Manager 24 default 4x speed multiplier
  // Max Verstappen is strictly #3! Default selection is #3.
  const [selectedDriverNum, setSelectedDriverNum] = useState(3);
  const [activePaceCommand, setActivePaceCommand] = useState("aggressive");
  const [activeSubTab, setActiveSubTab] = useState("PACE");
  const [showPaceCommands, setShowPaceCommands] = useState(false);
  const [trackRotation, setTrackRotation] = useState(defaultCircuitRotation);

  // Sync isNightMode when active circuit changes
  useEffect(() => {
    setIsNightMode(isNightRace);
    setTrackRotation(activeCircuitId === "australia" ? 298 : 0);
  }, [isNightRace, activeCircuitId]);

  // Real-time ticking session clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionClock(new Date().toLocaleTimeString("en-GB"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pan & Zoom (Optimized for widescreen track display)
  const [zoom, setZoom] = useState(1.18);
  const [pan, setPan] = useState({ x: 18, y: -24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);

  // Direct DOM Node References (Zero React RAF re-renders!)
  const carNodeRefs = useRef({});
  const carPillHtmlRefs = useRef({});
  const carPinHtmlRefs = useRef({});
  const speedDisplayRef = useRef(null);
  const gearDisplayRef = useRef(null);
  const throttleBarRef = useRef(null);
  const brakeBarRef = useRef(null);
  const drsBadgeRef = useRef(null);
  const ersBarRef = useRef(null);
  const ersTextRef = useRef(null);
  const tireWearTextRef = useRef(null);
  const tireTempTextRef = useRef(null);
  const shiftLedRefs = useRef([]);
  const rpmDisplayRef = useRef(null);

  // Dynamic Refs to keep RAF loop synchronous without re-subscribing
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const simSpeedRef = useRef(simSpeed);
  simSpeedRef.current = simSpeed;
  const selectedDriverNumRef = useRef(selectedDriverNum);
  selectedDriverNumRef.current = selectedDriverNum;
  const activePaceCommandRef = useRef(activePaceCommand);
  activePaceCommandRef.current = activePaceCommand;

  // Track Measurement & LUT
  const hiddenPathRef = useRef(null);
  const trackLutRef = useRef([]);

  // In-memory simulation state for all 22 cars
  const carSimStateRef = useRef([]);
  const [leaderboardCars, setLeaderboardCars] = useState([]);

  // Initialize car simulation state with realistic race packs
  useEffect(() => {
    let baseList = drivers.length > 0 ? drivers.map(d => ({ ...d })) : [
      { pos: 1,  code: "VER", num: 3,  team: "Red Bull Racing", name: "Max Verstappen" },
      { pos: 2,  code: "LEC", num: 16, team: "Ferrari",         name: "Charles Leclerc" },
      { pos: 3,  code: "NOR", num: 4,  team: "McLaren",         name: "Lando Norris" },
      { pos: 4,  code: "RUS", num: 63, team: "Mercedes",        name: "George Russell" },
      { pos: 5,  code: "HAM", num: 44, team: "Ferrari",         name: "Lewis Hamilton" },
      { pos: 6,  code: "SAI", num: 55, team: "Williams",        name: "Carlos Sainz" },
      { pos: 7,  code: "PIA", num: 81, team: "McLaren",         name: "Oscar Piastri" },
      { pos: 8,  code: "ANT", num: 12, team: "Mercedes",        name: "Kimi Antonelli" },
      { pos: 9,  code: "ALO", num: 14, team: "Aston Martin",    name: "Fernando Alonso" },
      { pos: 10, code: "ALB", num: 23, team: "Williams",        name: "Alexander Albon" },
      { pos: 11, code: "GAS", num: 10, team: "Alpine",          name: "Pierre Gasly" },
      { pos: 12, code: "TSU", num: 22, team: "Racing Bulls",    name: "Yuki Tsunoda" },
      { pos: 13, code: "HUL", num: 27, team: "Haas",            name: "Nico Hülkenberg" },
      { pos: 14, code: "STR", num: 18, team: "Aston Martin",    name: "Lance Stroll" },
      { pos: 15, code: "OCO", num: 31, team: "Haas",            name: "Esteban Ocon" },
      { pos: 16, code: "HAD", num: 6,  team: "Racing Bulls",    name: "Isack Hadjar" },
      { pos: 17, code: "BEA", num: 87, team: "Haas",            name: "Oliver Bearman" },
      { pos: 18, code: "BOT", num: 77, team: "Cadillac",        name: "Valtteri Bottas" },
      { pos: 19, code: "PER", num: 11, team: "Cadillac",        name: "Sergio Perez" },
      { pos: 20, code: "BOR", num: 5,  team: "Audi",            name: "Gabriel Bortoleto" },
      { pos: 21, code: "COL", num: 43, team: "Alpine",          name: "Franco Colapinto" },
      { pos: 22, code: "LIN", num: 40, team: "Audi",            name: "Arvid Lindblad" },
    ];

    // Ensure Max Verstappen is strictly car #3 and leads in P1
    baseList.forEach(d => {
      if (d.code === "VER") d.num = 3;
    });
    const verIdx = baseList.findIndex(d => d.code === "VER");
    if (verIdx > 0) {
      const ver = baseList.splice(verIdx, 1)[0];
      baseList.unshift(ver);
      baseList.forEach((d, i) => { d.pos = i + 1; });
    }

    const initial = baseList.map((d, idx) => {
      const num = d.code === "VER" ? 3 : (d.num || idx + 1);
      let offset = 0.98 - (idx * 0.043);
      if (offset < 0) offset += 1;

      return {
        num,
        code: d.code,
        name: d.name,
        team: d.team,
        pos: d.pos || idx + 1,
        gap: idx === 0 ? "LEADER" : `+${(idx * 1.35).toFixed(3)}s`,
        tire: d.tire || (idx % 3 === 0 ? "S" : "M"),
        tireAge: d.tireAge || 18,
        wear: d.wear || (38 + (idx * 2) % 25),
        soc: d.soc || (85 - (idx * 3) % 20),
        temp: 82 + (idx % 8),
        trackPct: (offset + 1) % 1,
        currentSpeedFactor: 1.0,
        targetSpeedFactor: 1.0,
        speedKmh: 312,
        lateralOffset: 0,
        targetLateral: 0,
        gear: 7,
        throttle: 95,
        brake: 0,
        isDrsActive: false,
        screenX: 0,
        screenY: 0,
        stackTier: 0,
      };
    });

    carSimStateRef.current = initial;
    setLeaderboardCars(initial);
  }, [drivers]);

  // Precompute 1400-Node Track Lookup Table (LUT) with Circuit Rotation baked in
  useEffect(() => {
    if (!hiddenPathRef.current) return;
    try {
      const pathEl = hiddenPathRef.current;
      const len = pathEl.getTotalLength();
      if (len <= 0) return;

      const angleRad = (trackRotation * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);

      const lut = new Array(LUT_SIZE);
      const ds = len / LUT_SIZE;

      for (let i = 0; i < LUT_SIZE; i++) {
        const d = i * ds;
        const pt = pathEl.getPointAtLength(d);
        const nextDist = (d + 2.5) % len;
        const ptNext = pathEl.getPointAtLength(nextDist);

        // Rotate waypoints around center (250, 250)
        const dx0 = pt.x - 250;
        const dy0 = pt.y - 250;
        let rx = dx0 * cosA - dy0 * sinA + 250;
        let ry = dx0 * sinA + dy0 * cosA + 250;

        const dxNext0 = ptNext.x - 250;
        const dyNext0 = ptNext.y - 250;
        let rxNext = dxNext0 * cosA - dyNext0 * sinA + 250;
        let ryNext = dxNext0 * sinA + dyNext0 * cosA + 250;

        // Australia uses horizontal flipped orientation for authentic F1 Manager 24 widescreen broadcast view
        if (activeCircuitId === "australia") {
          rx = 500 - rx;
          rxNext = 500 - rxNext;
        }

        const dx = rxNext - rx;
        const dy = ryNext - ry;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const normalAngleRad = ((angle + 90) * Math.PI) / 180;

        lut[i] = {
          x: rx,
          y: ry,
          angle,
          normalX: Math.cos(normalAngleRad),
          normalY: Math.sin(normalAngleRad),
          speedFactor: 1.0,
          isStraight: false,
          isDrsZone: false,
        };
      }

      // Compute Curvature & DRS zones
      for (let i = 0; i < LUT_SIZE; i++) {
        const prev = lut[(i - 12 + LUT_SIZE) % LUT_SIZE];
        const next = lut[(i + 12) % LUT_SIZE];
        let dAngle = Math.abs(next.angle - prev.angle);
        if (dAngle > 180) dAngle = 360 - dAngle;

        const isStraight = dAngle < 6;
        const isDrsZone = isStraight && ((i > LUT_SIZE * 0.05 && i < LUT_SIZE * 0.32) || (i > LUT_SIZE * 0.55 && i < LUT_SIZE * 0.82));
        const raw = Math.max(0.42, 1.42 - (dAngle * 0.046));

        lut[i].speedFactor = raw;
        lut[i].isStraight = isStraight;
        lut[i].isDrsZone = isDrsZone;
      }

      // Smooth Curvature Profile with 18-point moving window
      const smoothed = new Array(LUT_SIZE);
      for (let i = 0; i < LUT_SIZE; i++) {
        let sum = 0;
        const win = 18;
        for (let w = -win; w <= win; w++) {
          sum += lut[(i + w + LUT_SIZE) % LUT_SIZE].speedFactor;
        }
        smoothed[i] = {
          ...lut[i],
          speedFactor: sum / (win * 2 + 1),
        };
      }

      trackLutRef.current = smoothed;
    } catch (err) {
      console.warn("Track LUT precomputation error:", err);
    }
  }, [activeTrackPath, trackRotation]);

  // 60FPS Direct Hardware Animation Engine
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let lastTelemetryUpdate = 0;

    const tick = (now) => {
      const deltaMs = Math.min(32, now - lastTime);
      lastTime = now;

      const lut = trackLutRef.current;
      const cars = carSimStateRef.current;
      const isRunning = isPlayingRef.current;
      const speedMult = simSpeedRef.current;
      const selDriverNum = selectedDriverNumRef.current;
      const paceCmdId = activePaceCommandRef.current;

      if (isRunning && lut.length === LUT_SIZE && cars.length > 0) {
        const paceObj = PACE_COMMANDS.find(p => p.id === paceCmdId) || PACE_COMMANDS[1];
        const flagFactor = sessionFlag === "SC" ? 0.52 : (sessionFlag === "VSC" ? 0.65 : (sessionFlag === "RED" ? 0.05 : 1.0));
        const baseSpeed = 0.000045 * speedMult * flagFactor;

        // 1. Advance Physics & Positions for All 22 Cars
        for (let i = 0; i < cars.length; i++) {
          const car = cars[i];
          const isSelected = car.num === selDriverNum;

          const lutIdx = Math.floor((car.trackPct % 1) * LUT_SIZE);
          const wp = lut[lutIdx] || lut[0];

          let targetFactor = wp.speedFactor;
          if (isSelected) {
            targetFactor *= paceObj.speedMult;
          } else {
            targetFactor *= (1.0 + (22 - car.pos) * 0.0018);
          }

          const carAhead = cars[(i - 1 + cars.length) % cars.length];
          let gapToAhead = (carAhead.trackPct - car.trackPct + 1) % 1;
          const isInSlipstream = wp.isStraight && gapToAhead > 0 && gapToAhead < 0.024;

          if (isInSlipstream) {
            targetFactor *= 1.08;
            car.targetLateral = i % 2 === 0 ? 4 : -4;
          } else {
            car.targetLateral = 0;
          }

          const inertiaRate = targetFactor < car.currentSpeedFactor ? 0.12 : 0.07;
          car.currentSpeedFactor += (targetFactor - car.currentSpeedFactor) * inertiaRate;
          car.lateralOffset += (car.targetLateral - car.lateralOffset) * 0.08;

          const deltaPct = deltaMs * baseSpeed * car.currentSpeedFactor;
          car.trackPct = (car.trackPct + deltaPct) % 1;

          car.speedKmh = Math.round(92 + (car.currentSpeedFactor * 182));
          car.isDrsActive = wp.isDrsZone && (isInSlipstream || isSelected);
          if (car.isDrsActive) car.speedKmh = Math.min(348, car.speedKmh + 14);

          if (car.speedKmh < 120) car.gear = 2;
          else if (car.speedKmh < 165) car.gear = 3;
          else if (car.speedKmh < 210) car.gear = 4;
          else if (car.speedKmh < 255) car.gear = 5;
          else if (car.speedKmh < 290) car.gear = 6;
          else if (car.speedKmh < 325) car.gear = 7;
          else car.gear = 8;

          if (targetFactor < car.currentSpeedFactor - 0.08) {
            car.brake = Math.min(100, Math.round((car.currentSpeedFactor - targetFactor) * 220));
            car.throttle = 0;
          } else {
            car.brake = 0;
            car.throttle = Math.min(100, Math.round(car.currentSpeedFactor * 78));
          }

          const carX = wp.x + wp.normalX * car.lateralOffset;
          const carY = wp.y + wp.normalY * car.lateralOffset;

          // Direct DOM Hardware Transform for On-Track SVG Puck
          const node = carNodeRefs.current[car.num];
          if (node) {
            node.setAttribute("transform", `translate(${carX}, ${carY})`);
            
            // Query on-screen projected pixel position
            if (mapContainerRef.current) {
              const rect = node.getBoundingClientRect();
              const cRect = mapContainerRef.current.getBoundingClientRect();
              car.screenX = rect.left + rect.width / 2 - cRect.left;
              car.screenY = rect.top + rect.height / 2 - cRect.top;
            }
          }
        }

        // 2. Intelligent Screen-Space Multi-Tier Anti-Collision Solver
        // Guaranteed 100% Zero Overlap, 100% Horizontal Billboard Pills!
        for (let i = 0; i < cars.length; i++) {
          const car = cars[i];
          let stackTier = 0;
          for (let j = 0; j < cars.length; j++) {
            if (i === j) continue;
            const other = cars[j];
            const dx = Math.abs((car.screenX || 0) - (other.screenX || 0));
            const dy = Math.abs((car.screenY || 0) - (other.screenY || 0));
            if (dx < 54 && dy < 28 && car.pos > other.pos) {
              stackTier++;
            }
          }
          car.stackTier = stackTier;

          const pinHeight = 18 + (stackTier * 24);
          const pillHtml = carPillHtmlRefs.current[car.num];
          if (pillHtml && car.screenX) {
            pillHtml.style.transform = `translate3d(${car.screenX}px, ${car.screenY - pinHeight}px, 0) translate(-50%, -100%)`;
          }
          const pinHtml = carPinHtmlRefs.current[car.num];
          if (pinHtml) {
            pinHtml.style.height = `${pinHeight}px`;
          }
        }

        // 3. Update Cockpit Digital Telemetry at smooth 10Hz
        if (now - lastTelemetryUpdate >= 100) {
          lastTelemetryUpdate = now;
          const selCar = cars.find(c => c.num === selDriverNum) || cars[0];
          if (selCar) {
            if (speedDisplayRef.current) speedDisplayRef.current.textContent = `${selCar.speedKmh} KM/H`;
            if (gearDisplayRef.current) gearDisplayRef.current.textContent = `G ${selCar.gear}`;
            if (throttleBarRef.current) throttleBarRef.current.style.width = `${selCar.throttle}%`;
            if (brakeBarRef.current) brakeBarRef.current.style.width = `${selCar.brake}%`;
            if (drsBadgeRef.current) {
              drsBadgeRef.current.style.background = selCar.isDrsActive ? "rgba(0, 230, 118, 0.25)" : "rgba(255, 255, 255, 0.05)";
              drsBadgeRef.current.style.borderColor = selCar.isDrsActive ? "var(--neon-green)" : "rgba(255, 255, 255, 0.15)";
              drsBadgeRef.current.style.color = selCar.isDrsActive ? "var(--neon-green)" : "#666";
            }
            if (ersBarRef.current) ersBarRef.current.style.width = `${selCar.soc}%`;
            if (ersTextRef.current) ersTextRef.current.textContent = `${selCar.soc}%`;
            if (tireWearTextRef.current) tireWearTextRef.current.textContent = `${100 - selCar.wear}%`;
            if (tireTempTextRef.current) tireTempTextRef.current.textContent = `${selCar.temp}°C`;

            const baseRpm = 10200 + Math.round((selCar.throttle / 100) * 2900 + ((selCar.speedKmh % 40) / 40) * 400);
            const rpm = Math.min(13500, Math.max(8800, baseRpm));
            if (rpmDisplayRef.current) rpmDisplayRef.current.textContent = `${rpm.toLocaleString()} RPM`;

            const isOptimalShift = rpm >= 13350 && selCar.throttle > 85;
            for (let k = 0; k < 15; k++) {
              const led = shiftLedRefs.current[k];
              if (!led) continue;
              let threshold = 0;
              if (k < 5) threshold = 10400 + k * 260;
              else if (k < 10) threshold = 11700 + (k - 5) * 260;
              else threshold = 13000 + (k - 10) * 70;

              const isOn = rpm >= threshold;
              if (isOptimalShift) {
                led.style.background = "#bf7fff";
                led.style.boxShadow = "0 0 8px #bf7fff";
                led.style.borderColor = "#ffffff";
              } else if (isOn) {
                if (k < 5) {
                  led.style.background = "var(--neon-green)";
                  led.style.boxShadow = "0 0 6px var(--neon-green)";
                  led.style.borderColor = "#00e676";
                } else if (k < 10) {
                  led.style.background = "var(--neon-red)";
                  led.style.boxShadow = "0 0 6px var(--neon-red)";
                  led.style.borderColor = "#ff3b30";
                } else {
                  led.style.background = "#bf7fff";
                  led.style.boxShadow = "0 0 6px var(--neon-red)";
                  led.style.borderColor = "#d980fa";
                }
              } else {
                led.style.background = k < 5 ? "rgba(0, 230, 118, 0.12)" : k < 10 ? "rgba(255, 59, 48, 0.12)" : "rgba(191, 127, 255, 0.12)";
                led.style.boxShadow = "none";
                led.style.borderColor = k < 5 ? "rgba(0, 230, 118, 0.25)" : k < 10 ? "rgba(255, 59, 48, 0.25)" : "rgba(191, 127, 255, 0.25)";
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const activeCar = leaderboardCars.find((c) => c.num === selectedDriverNum) || leaderboardCars[0] || {};
  const teammateCar = leaderboardCars.find(
    (c) => c.team === activeCar.team && c.num !== activeCar.num
  ) || leaderboardCars[activeCar.pos === 1 ? 1 : 0] || {};

  const handleNextDriver = useCallback(() => {
    const curIdx = leaderboardCars.findIndex((c) => c.num === selectedDriverNum);
    const nextIdx = (curIdx + 1) % (leaderboardCars.length || 1);
    setSelectedDriverNum(leaderboardCars[nextIdx]?.num || 3);
  }, [leaderboardCars, selectedDriverNum]);

  const handlePrevDriver = useCallback(() => {
    const curIdx = leaderboardCars.findIndex((c) => c.num === selectedDriverNum);
    const prevIdx = (curIdx - 1 + (leaderboardCars.length || 1)) % (leaderboardCars.length || 1);
    setSelectedDriverNum(leaderboardCars[prevIdx]?.num || 3);
  }, [leaderboardCars, selectedDriverNum]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0016;
    setZoom((prev) => Math.max(0.75, Math.min(3.2, prev + zoomDelta)));
  };

  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest(".hud-interactive")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoom(1.22);
    setPan({ x: 30, y: -15 });
    setIs3DMode(true);
  };

  return (
    <div
      ref={mapContainerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 230px)",
        minHeight: "720px",
        maxHeight: "920px",
        background: isNightMode
          ? "radial-gradient(ellipse at 50% 40%, #0d1526 0%, #080c16 50%, #04060b 100%)"
          : "radial-gradient(ellipse at 50% 40%, #0d1422 0%, #080c14 60%, #05070c 100%)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 14px 45px rgba(0, 0, 0, 0.9)",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Dynamic FIA Track Condition & Safety Car HUD Banner ── */}
      {sessionFlag && sessionFlag !== "GREEN" && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: sessionFlag === "RED" ? "rgba(232,0,45,0.92)" : "rgba(255,170,0,0.92)",
            border: `2px solid ${sessionFlag === "RED" ? "#ffffff" : "#ffea00"}`,
            boxShadow: `0 0 26px ${sessionFlag === "RED" ? "rgba(232,0,45,0.85)" : "rgba(255,170,0,0.85)"}`,
            borderRadius: "8px",
            padding: "6px 22px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "'Orbitron', monospace",
            fontWeight: "900",
            fontSize: "0.85rem",
            color: "#0b0c14",
            letterSpacing: "0.08em",
            animation: "pulseGlow 1.2s infinite",
            pointerEvents: "none",
          }}
        >
          <span>{sessionFlag === "SC" ? "🚗 SAFETY CAR" : (sessionFlag === "VSC" ? "⚠️ VIRTUAL SAFETY CAR" : (sessionFlag === "RED" ? "🔴 RED FLAG" : "🟡 CAUTION"))}</span>
          <span>·</span>
          <span style={{ fontSize: "0.72rem", fontWeight: "800" }}>{sessionFlag === "RED" ? "SESSION SUSPENDED" : "DELTA TIME ENFORCED"}</span>
        </div>
      )}

      {/* Coordinate Telemetry Grid Lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          CENTRAL SATELLITE 3D CANVAS (AUTHENTIC F1 MANAGER WIDESCREEN CAMERA)
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: "1800px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: is3DMode
              ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(51deg) rotateZ(-10deg)`
              : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
          }}
        >
          <svg
            viewBox="-120 -80 740 680"
            style={{
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
          >
            <defs>
              <linearGradient id="selectedGlowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#ffcc00" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#ffcc00" stopOpacity="0" />
              </linearGradient>

              {/* Realistic Multi-Tone Asphalt */}
              <linearGradient id="realAsphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#343b4a" />
                <stop offset="50%" stopColor="#242934" />
                <stop offset="100%" stopColor="#191c24" />
              </linearGradient>

              {/* Albert Park Lake Azure Teal Water Gradient */}
              <linearGradient id="albertLakeWaterGrad" x1="0%" y1="0%" x2="100%" y2="85%">
                <stop offset="0%" stopColor="#4d7c92" />
                <stop offset="35%" stopColor="#7baac0" />
                <stop offset="68%" stopColor="#6292a8" />
                <stop offset="100%" stopColor="#3d677d" />
              </linearGradient>

              {/* Water Specular Sun Sheen */}
              <linearGradient id="lakeSunSheenGrad" x1="0%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
                <stop offset="42%" stopColor="#bde4f4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* DRS Glow Filter */}
              <filter id="drsGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 0. Ground Base Plane: Dark Melbourne Urban Grid (Eliminating pea-soup green box!) */}
            <rect x="-800" y="-800" width="2400" height="2400" fill={isNightMode ? "#06090f" : "#0c1017"} />

            {/* Urban Road Network (Melbourne CBD, St Kilda Rd, Queens Rd, South Melbourne) */}
            <g opacity={isNightMode ? "0.45" : "0.35"} stroke={isNightMode ? "#1a2a44" : "#1f2838"} strokeWidth="1.8">
              <line x1="-500" y1="20" x2="1100" y2="20" strokeWidth="3" stroke={isNightMode ? "#203658" : "#283549"} />
              <line x1="-500" y1="90" x2="1100" y2="90" strokeWidth="2" />
              <line x1="-500" y1="460" x2="1100" y2="460" strokeWidth="3.5" stroke={isNightMode ? "#203658" : "#283549"} />
              <line x1="-500" y1="540" x2="1100" y2="540" strokeWidth="2" />

              <line x1="-60" y1="-400" x2="-60" y2="900" strokeWidth="3" stroke={isNightMode ? "#203658" : "#283549"} />
              <line x1="60" y1="-400" x2="60" y2="900" strokeWidth="2" />
              <line x1="460" y1="-400" x2="460" y2="900" strokeWidth="3.5" stroke={isNightMode ? "#203658" : "#283549"} />
              <line x1="560" y1="-400" x2="560" y2="900" strokeWidth="2" />

              {/* Angled St Kilda Rd Boulevard */}
              <line x1="400" y1="-400" x2="620" y2="900" strokeWidth="4.5" stroke={isNightMode ? "#2a4570" : "#313f57"} />

              {/* City Blocks */}
              <rect x="480" y="40" width="75" height="40" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="480" y="110" width="75" height="55" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="480" y="190" width="75" height="65" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="480" y="280" width="75" height="55" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="-180" y="110" width="105" height="65" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="-180" y="200" width="105" height="75" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
              <rect x="-180" y="300" width="105" height="65" fill={isNightMode ? "#0d131f" : "#131923"} stroke="none" />
            </g>

            {/* 1. Albert Park Parkland Boundary & Golf Course Fairways */}
            <g className="albert-park-lawns">
              {/* Main Outer Park Perimeter */}
              <path
                d="M 10 120 C 70 70, 450 50, 520 100 C 560 170, 550 400, 490 470 C 410 510, 40 500, -10 420 C -40 340, -40 180, 10 120 Z"
                fill={isNightMode ? "#101e14" : "#233821"}
                opacity="0.96"
              />

              {/* Inner Lake Meadow Backing */}
              <path
                d="M 60 150 C 120 120, 390 110, 460 150 C 490 220, 480 380, 430 420 C 350 450, 100 440, 50 380 C 20 310, 20 200, 60 150 Z"
                fill={isNightMode ? "#162b1b" : "#2c4828"}
                opacity="0.92"
              />

              {/* Fairway Greens */}
              <path
                d="M 100 140 C 180 125, 340 130, 420 160 C 390 200, 280 205, 180 195 C 120 190, 90 165, 100 140 Z"
                fill={isNightMode ? "#1a3220" : "#345730"}
                opacity="0.85"
              />
              <path
                d="M 110 375 C 190 365, 330 380, 410 395 C 370 435, 270 445, 170 435 C 110 425, 90 400, 110 375 Z"
                fill={isNightMode ? "#1d3823" : "#395f35"}
                opacity="0.82"
              />

              {/* Sand Bunkers */}
              <path d="M 160 160 C 175 155, 185 162, 178 172 C 168 179, 155 174, 160 160 Z" fill={isNightMode ? "#2a241b" : "#5c533c"} opacity="0.85" />
              <path d="M 330 175 C 345 170, 355 178, 348 188 C 338 195, 325 190, 330 175 Z" fill={isNightMode ? "#2a241b" : "#5c533c"} opacity="0.85" />
              <path d="M 280 395 C 295 390, 305 398, 298 408 C 288 415, 275 410, 280 395 Z" fill={isNightMode ? "#2a241b" : "#5c533c"} opacity="0.85" />

              {/* Tree Groves */}
              <g opacity="0.94">
                <circle cx="80" cy="180" r="7.5" fill={isNightMode ? "#0a170b" : "#112213"} />
                <circle cx="87" cy="177" r="6" fill={isNightMode ? "#0f2311" : "#1b361e"} />
                <circle cx="210" cy="155" r="8" fill={isNightMode ? "#0a170b" : "#112213"} />
                <circle cx="218" cy="151" r="6.5" fill={isNightMode ? "#0f2311" : "#1b361e"} />
                <circle cx="360" cy="180" r="8.5" fill={isNightMode ? "#0a170b" : "#112213"} />
                <circle cx="368" cy="176" r="7" fill={isNightMode ? "#0f2311" : "#1b361e"} />
                <circle cx="160" cy="385" r="8" fill={isNightMode ? "#0a170b" : "#112213"} />
                <circle cx="168" cy="381" r="6.5" fill={isNightMode ? "#0f2311" : "#1b361e"} />
                <circle cx="310" cy="405" r="8.5" fill={isNightMode ? "#0a170b" : "#112213"} />
                <circle cx="318" cy="401" r="7" fill={isNightMode ? "#0f2311" : "#1b361e"} />
              </g>
            </g>

            {/* 2. Albert Park Lake (Authentic F1 Manager 24 Large Elongated Geometry) */}
            <g className="albert-park-lake">
              {/* Lake Outer Shore Baseline */}
              <path
                d="M 90 220 C 80 180, 130 170, 180 185 C 240 200, 320 220, 410 250 C 450 265, 460 290, 440 315 C 390 350, 320 375, 240 370 C 170 365, 120 340, 95 310 C 75 285, 80 250, 90 220 Z"
                fill={isNightMode ? "#0d1822" : "url(#albertLakeWaterGrad)"}
                stroke={isNightMode ? "#1a2c3d" : "#324d5e"}
                strokeWidth="1.8"
              />

              {/* Water Specular Sheen Highlight */}
              <path
                d="M 105 215 C 100 185, 140 178, 185 192 C 242 205, 318 225, 400 255 C 430 268, 440 288, 420 308 C 375 338, 310 360, 235 355 C 175 350, 130 330, 108 305 C 92 282, 98 250, 105 215 Z"
                fill="url(#lakeSunSheenGrad)"
                opacity={isNightMode ? "0.2" : "0.75"}
              />

              {/* Center Green Island in West Basin */}
              {/* Authentic F1 Manager 24 Albert Park Cross-Lake Bridge & Lakeside Path */}
              <line x1="235" y1="195" x2="228" y2="368" stroke={isNightMode ? "#2a3648" : "#8798a5"} strokeWidth="2.5" />
              <line x1="235" y1="195" x2="228" y2="368" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="2.5 2.5" opacity="0.6" />
              <path d="M 120 180 C 190 190, 310 215, 430 248" fill="none" stroke={isNightMode ? "#1a2838" : "#4a5a6a"} strokeWidth="1.6" opacity="0.75" />
              <ellipse cx="138" cy="250" rx="16" ry="9" fill={isNightMode ? "#122514" : "#203d21"} stroke={isNightMode ? "#0a170c" : "#142815"} strokeWidth="1" />
              <circle cx="134" cy="248" r="4" fill={isNightMode ? "#0a170b" : "#112213"} />
              <circle cx="142" cy="251" r="3.5" fill={isNightMode ? "#0f2311" : "#1b361e"} />

              {/* Wooden Footbridge to South Shore */}
              <line x1="138" y1="259" x2="148" y2="350" stroke="#5a4e3c" strokeWidth="2.2" />
              <line x1="138" y1="259" x2="148" y2="350" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
            </g>

            {/* 3. Melbourne CBD Skyline */}
            <g className="cityscape-3d-group">
              {MELBOURNE_SKYLINE_BUILDINGS.map((b, i) => (
                <LowPoly3DBuilding key={i} x={b.x} y={b.y} w={b.w} d={b.d} h={b.h} isNight={isNightMode} />
              ))}
            </g>

            {/* 4. Paddock Complex & Pit Garages along Bottom Main Straight */}
            <g transform="translate(190, 442) rotate(1)">
              <rect x="0" y="0" width="180" height="14" rx="2" fill={isNightMode ? "#151b26" : "#1c2432"} stroke={isNightMode ? "#253044" : "#37455c"} strokeWidth="0.8" />
              <rect x="0" y="-3" width="180" height="2.5" fill="#e10600" opacity="0.95" />
              <polygon points="-8,18 190,18 184,26 -2,26" fill={isNightMode ? "#1a222f" : "#222c3c"} stroke="#e10600" strokeWidth="0.8" />
              <rect x="15" y="20" width="26" height="7" fill="#121822" stroke="#2c3748" strokeWidth="0.6" />
              <rect x="52" y="20" width="26" height="7" fill="#121822" stroke="#2c3748" strokeWidth="0.6" />
              <rect x="89" y="20" width="26" height="7" fill="#121822" stroke="#2c3748" strokeWidth="0.6" />
              <rect x="126" y="20" width="26" height="7" fill="#121822" stroke="#2c3748" strokeWidth="0.6" />
            </g>

            {/* Hidden measurement path */}
            <path
              ref={hiddenPathRef}
              d={activeTrackPath}
              fill="none"
              stroke="transparent"
              strokeWidth="1"
            />

            {/* 5. Main Race Track (Using Authentic F1 Manager 24 Horizontal Parity) */}
            <g transform={activeCircuitId === "australia" ? `translate(500, 0) scale(-1, 1) rotate(${trackRotation}, 250, 250)` : `rotate(${trackRotation}, 250, 250)`}>
              {/* Outer Gravel Runoff Bed */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke={isNightRace ? "#1f2633" : "#3d3324"}
                strokeWidth="38"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />

              {/* Asphalt Runoff Apron */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#141820"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />

              {/* High-Contrast Red & White FIA Rumble Curbs */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#d92027"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="9 7"
                opacity="0.95"
              />
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="7 9"
                strokeDashoffset="9"
                opacity="0.92"
              />

              {/* Main Asphalt Race Track Surface */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="url(#realAsphaltGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dark Rubbered Racing Line Groove */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#090b10"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* ── F1 MANAGER 24 SIGNATURE TELEMETRY RIBBONS ── */}
              {/* Neon Green Acceleration / DRS Full-Throttle Zones */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#00ff66"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="55 25 70 30 45 20"
                filter="url(#drsGlow)"
                opacity="0.98"
              />

              {/* Neon Red Braking / Deceleration Zones */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="#ff2a4d"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="22 68 28 85 24 60"
                strokeDashoffset="26"
                filter="url(#drsGlow)"
                opacity="0.96"
              />

              {/* Subtle White Track Limit Border Lines */}
              <path
                d={activeTrackPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.15"
              />

              {/* Start / Finish Line Checkered Grid */}
              <line
                x1="290"
                y1="440"
                x2="300"
                y2="458"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeDasharray="2 2"
              />
              <line
                x1="290"
                y1="440"
                x2="300"
                y2="458"
                stroke="#111111"
                strokeWidth="3.2"
                strokeDasharray="2 2"
                strokeDashoffset="2"
              />
            </g>

            {/* 6. On-Track Driver Circular Puck Markers (Hardware Managed in RAF) */}
            <g id="onTrackPucks">
              {leaderboardCars.map((car) => {
                const teamConf = TEAM_COLORS[car.team] || { primary: "#ffffff" };
                const isSelected = car.num === selectedDriverNum;

                return (
                  <g
                    key={car.num}
                    ref={(el) => (carNodeRefs.current[car.num] = el)}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDriverNum(car.num);
                    }}
                  >
                    {/* Glowing halo aura */}
                    <circle
                      r={isSelected ? "11" : "7.5"}
                      fill={teamConf.primary}
                      opacity={isSelected ? "0.75" : "0.4"}
                    />
                    {/* Core puck */}
                    <circle
                      r="5.2"
                      fill={teamConf.primary}
                      stroke={isSelected ? "#ffffff" : "#0c1017"}
                      strokeWidth={isSelected ? "1.6" : "1"}
                    />
                    {/* Selected driver beacon ring */}
                    {isSelected && (
                      <circle
                        r="8.5"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          2D SCREEN-SPACE BILLBOARD DRIVER PILLS OVERLAY
          (100% Horizontal, Sharp Typography, Zero 3D Skewing, 1px Leader Pins)
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        id="pillsOverlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {leaderboardCars.map((car) => {
          const teamConf = TEAM_COLORS[car.team] || { primary: "#ffffff" };
          const isSelected = car.num === selectedDriverNum;

          return (
            <div
              key={car.num}
              ref={(el) => (carPillHtmlRefs.current[car.num] = el)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: "translate3d(-9999px, -9999px, 0)", // initially offscreen until RAF positions it
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDriverNum(car.num);
              }}
            >
              {/* Exact F1 Manager 24 Driver Pill */}
              <div
                style={{
                  background: isSelected ? "rgba(10, 14, 22, 0.98)" : "rgba(14, 18, 28, 0.92)",
                  border: isSelected ? "1.5px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.28)",
                  boxShadow: isSelected ? "0 0 16px rgba(255,255,255,0.7), 0 4px 12px rgba(0,0,0,0.8)" : "0 3px 10px rgba(0,0,0,0.75)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "900",
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  transition: "all 0.12s ease",
                }}
              >
                <span style={{ color: isSelected ? "#ffffff" : "#cbd5e1", fontWeight: "900" }}>
                  {car.pos}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: "400" }}>|</span>
                <span style={{ color: "#ffffff", letterSpacing: "0.04em" }}>{car.code}</span>
              </div>

              {/* Connecting 1px Vertical Leader Pin Line */}
              <div
                ref={(el) => (carPinHtmlRefs.current[car.num] = el)}
                style={{
                  width: "1px",
                  height: "18px",
                  background: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                  boxShadow: isSelected ? "0 0 5px #ffffff" : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TOP-LEFT HUD: BROADCAST LEADERBOARD TIMING TOWER
          (Selected row is pure solid white background with black text)
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        className="hud-interactive"
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          width: "180px",
          background: "rgba(10, 14, 22, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderTop: "3px solid #e10600",
          borderRadius: "7px",
          padding: "7px 9px",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(14px)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          maxHeight: "calc(100% - 32px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ background: "#e10600", color: "#ffffff", padding: "2px 7px", borderRadius: "3px", fontWeight: "900", fontSize: "0.72rem", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.5px" }}>
              Q2
            </span>
            <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
              L{currentLap}/{maxLaps}
            </span>
          </div>
          <button
            onClick={() => setSectorViewMode(m => m === "SECTORS" ? "GAP" : "SECTORS")}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--neon-cyan)",
              padding: "1px 6px",
              borderRadius: "3px",
              fontSize: "0.58rem",
              fontFamily: "'Orbitron', monospace",
              cursor: "pointer",
            }}
            title="Toggle between Sectors and Gap view"
          >
            {sectorViewMode === "SECTORS" ? "SECTORS ▾" : "GAP ▾"}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.58rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em" }}>
          <span>‹ DRIVER ›</span>
          <span>{sectorViewMode === "SECTORS" ? "S1 · S2 · S3" : "GAP TO LEAD"}</span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "2.5px",
            paddingRight: "2px",
          }}
        >
          {leaderboardCars.map((d) => {
            const isSelected = d.num === selectedDriverNum;
            const teamConf = TEAM_COLORS[d.team] || { primary: "#888" };
            const isOutLap = d.pos >= 18;

            return (
              <div
                key={d.num}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDriverNum(d.num);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "18px 3px 38px 1fr",
                  alignItems: "center",
                  gap: "5px",
                  padding: "2.5px 5px",
                  borderRadius: "3px",
                  background: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.03)",
                  border: isSelected ? "1px solid #ffffff" : "1px solid transparent",
                  boxShadow: isSelected ? "0 2px 10px rgba(255,255,255,0.45)" : "none",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: isSelected ? "#0a0e16" : "var(--text-dim)", fontWeight: "800" }}>
                  {d.pos}
                </span>

                <div style={{ width: "3px", height: "13px", borderRadius: "1px", background: teamConf.primary }} />

                <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: isSelected ? "#0a0e16" : "#ffffff" }}>
                  {d.code}
                </span>

                {sectorViewMode === "SECTORS" ? (
                  isOutLap ? (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.56rem", fontFamily: "'Orbitron', monospace", padding: "1px 5px", borderRadius: "3px", background: isSelected ? "#0a0e16" : "rgba(255,255,255,0.12)", color: isSelected ? "#ffffff" : "#ffffff", fontWeight: "800" }}>
                        Out Lap
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "2.5px", justifyContent: "flex-end", alignItems: "center" }}>
                      <div style={{ width: "13px", height: "5.5px", borderRadius: "1px", background: d.pos === 1 ? "#cc44ff" : (d.pos <= 4 ? "#00e84d" : "#ffcc00") }} />
                      <div style={{ width: "13px", height: "5.5px", borderRadius: "1px", background: d.pos <= 2 ? "#cc44ff" : (d.pos <= 9 ? "#00e84d" : "#ffcc00") }} />
                      <div style={{ width: "13px", height: "5.5px", borderRadius: "1px", background: d.pos <= 3 ? "#00e84d" : "#ffcc00" }} />
                    </div>
                  )
                ) : (
                  <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: isSelected ? "#0a0e16" : "rgba(255,255,255,0.75)", fontWeight: isSelected ? "900" : "500", textAlign: "right" }}>
                    {d.pos === 1 ? "LEADER" : d.gap}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TOP-RIGHT HUD: F1 MANAGER AUTHENTIC "RACE VIEW" WIDGET
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        className="hud-interactive"
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-end",
          zIndex: 35,
          minWidth: "210px",
        }}
      >
        {/* Top 4 Navigation Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(10, 14, 22, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "6px",
            padding: "3px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={onCloseToTower}
            title="Switch to Timing Tower Matrix"
            style={{
              flex: 1,
              padding: "5px 0",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            📊
          </button>
          <button
            title="3D Satellite Race View (Active)"
            style={{
              flex: 1,
              padding: "5px 0",
              borderRadius: "4px",
              background: "#ffffff",
              border: "none",
              color: "#0a0e16",
              cursor: "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(255,255,255,0.4)",
            }}
          >
            🏁
          </button>
          <button
            onClick={() => setShowPaceCommands(!showPaceCommands)}
            title="Toggle Cockpit Telemetry & Tactical Commands"
            style={{
              flex: 1,
              padding: "5px 0",
              borderRadius: "4px",
              background: showPaceCommands ? "rgba(0, 210, 190, 0.22)" : "transparent",
              border: "none",
              color: showPaceCommands ? "#00d2be" : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🔧
          </button>
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            title={`Toggle Theme (Currently ${isNightMode ? "Night City" : "Daylight Park"})`}
            style={{
              flex: 1,
              padding: "5px 0",
              borderRadius: "4px",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⚙️
          </button>
        </div>

        {/* RACE VIEW Conditions Card */}
        <div
          style={{
            background: "rgba(10, 14, 22, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "7px",
            padding: "9px 13px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(14px)",
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: "0.80rem",
              fontWeight: "900",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "1.2px",
              color: "#ffffff",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "4px",
            }}
          >
            RACE VIEW
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.70rem", fontFamily: "'Orbitron'" }}>
            <span style={{ color: "#cbd5e1" }}>{sessionClock}</span>
            <span style={{ color: "#ffffff", fontWeight: "700" }}>🌤️ 17.7°C</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.65rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>4 minutes</span>
            <span style={{ color: "#38bdf8", fontWeight: "700" }}>💧 55% ☁️</span>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "1px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", fontFamily: "'Orbitron'" }}>
            <span style={{ color: "#64748b", fontWeight: "800" }}>TRACK</span>
            <span style={{ color: "#ffffff", fontWeight: "800" }}>26.1°C</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>🛣️ Dry</span>
            <span style={{ color: "#ffffff", fontWeight: "600" }}>0.00 mm</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>🏁 Rubber</span>
            <span style={{ color: "#f43f5e", fontWeight: "800" }}>◆ Very Low</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>⚡ Grip</span>
            <span style={{ color: "#38bdf8", fontWeight: "800" }}>Normal</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          BOTTOM-RIGHT HUD: TACTICAL PACE COMMANDS & ACTIVE TELEMETRY
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        className="hud-interactive"
        style={{
          position: "absolute",
          bottom: "12px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-end",
          zIndex: 25,
        }}
      >
        {/* PACE COMMANDS PANEL */}
        {showPaceCommands && (
          <div
            style={{
              background: "rgba(10, 14, 22, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "8px 11px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(14px)",
              width: "275px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "4px" }}>
              <span style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff", letterSpacing: "0.06em" }}>
                PACE COMMANDS
              </span>
              <span
                style={{ fontSize: "0.66rem", color: "var(--text-dim)", cursor: "pointer" }}
                onClick={() => setShowPaceCommands(false)}
                title="Minimize"
              >
                ✕
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 42px 48px", fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              <span>COMMANDS</span>
              <span style={{ textAlign: "center" }}>⏱️ PACE</span>
              <span style={{ textAlign: "right" }}>♨/LAP</span>
            </div>

            {PACE_COMMANDS.map((cmd) => {
              const isSelected = activePaceCommand === cmd.id;
              return (
                <div
                  key={cmd.id}
                  onClick={() => setActivePaceCommand(cmd.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "15px 1fr 42px 48px",
                    alignItems: "center",
                    gap: "6px",
                    padding: "3px 6px",
                    borderRadius: "3px",
                    background: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    border: isSelected ? `1px solid ${cmd.color}` : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <div
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      border: `1.5px solid ${isSelected ? cmd.color : "#666"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: cmd.color }} />
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ color: cmd.color, fontSize: "0.60rem" }}>
                      {"●".repeat(cmd.dots)}
                    </span>
                    <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", fontWeight: isSelected ? "800" : "600", color: isSelected ? "#ffffff" : "var(--text-secondary)" }}>
                      {cmd.name}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: cmd.paceIcon.includes("▼") ? "var(--neon-green)" : cmd.paceIcon === "-" ? "#aaa" : "var(--neon-red)", textAlign: "center", fontWeight: "800" }}>
                    {cmd.paceIcon}
                  </span>

                  <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: cmd.wearIcon.includes("▲") ? "var(--neon-red)" : cmd.wearIcon === "-" ? "#aaa" : "var(--neon-green)", textAlign: "right", fontWeight: "800" }}>
                    {cmd.wearIcon}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ACTIVE DRIVER TELEMETRY CARD */}
        <div
          style={{
            background: "rgba(10, 14, 22, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(14px)",
            width: "275px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "0.82rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff" }}>
                #{activeCar.num} | {activeCar.name?.split(" ").slice(-1)[0].toUpperCase()}
              </span>
              <span style={{ fontSize: "0.70rem" }}>🎥</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                ref={speedDisplayRef}
                style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800" }}
              >
                {activeCar.speedKmh || 312} KM/H
              </span>
              <span
                ref={drsBadgeRef}
                style={{
                  fontSize: "0.58rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "800",
                  color: "var(--neon-green)",
                  background: "rgba(0, 204, 68, 0.15)",
                  border: "1px solid rgba(0, 204, 68, 0.4)",
                  padding: "1px 5px",
                  borderRadius: "3px",
                }}
              >
                DRS
              </span>
            </div>
          </div>

          {/* F1 Steering Wheel Shift Lights Cluster */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              background: "rgba(0, 0, 0, 0.45)",
              padding: "4px 7px",
              borderRadius: "5px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                ref={gearDisplayRef}
                style={{
                  fontSize: "0.64rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "1px 5px",
                  borderRadius: "3px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                G {activeCar.gear || 7}
              </span>

              <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                {Array.from({ length: 15 }).map((_, idx) => (
                  <div
                    key={idx}
                    ref={(el) => (shiftLedRefs.current[idx] = el)}
                    style={{
                      width: "6px",
                      height: "8px",
                      borderRadius: "1.5px",
                      background: idx < 5 ? "rgba(0, 230, 118, 0.15)" : idx < 10 ? "rgba(255, 59, 48, 0.15)" : "rgba(191, 127, 255, 0.15)",
                      border: `1px solid ${idx < 5 ? "rgba(0, 230, 118, 0.3)" : idx < 10 ? "rgba(255, 59, 48, 0.3)" : "rgba(191, 127, 255, 0.3)"}`,
                      transition: "background 0.05s ease, box-shadow 0.05s ease",
                    }}
                  />
                ))}
              </div>

              <span
                ref={rpmDisplayRef}
                style={{
                  fontSize: "0.62rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "800",
                  color: "var(--neon-cyan)",
                }}
              >
                12,450 RPM
              </span>
            </div>
          </div>

          {/* Throttle & Brake Pedals HUD */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>THR</span>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div ref={throttleBarRef} style={{ width: "95%", height: "100%", background: "var(--neon-green)", borderRadius: "2px" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-red)", fontWeight: "800" }}>BRK</span>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div ref={brakeBarRef} style={{ width: "0%", height: "100%", background: "var(--neon-red)", borderRadius: "2px" }} />
              </div>
            </div>
          </div>

          {/* Quick Telemetry Grid: Tires & ERS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: "4px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: `2px solid ${activeCar.tire === "S" ? "#ff3b30" : activeCar.tire === "M" ? "#ffcc00" : "#ffffff"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.66rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  color: "#ffffff",
                }}
              >
                {activeCar.tire || "M"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span ref={tireWearTextRef} style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
                  {100 - (activeCar.wear || 42)}%
                </span>
                <span ref={tireTempTextRef} style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  {activeCar.temp || 82}°C
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-dim)" }}>ERS 350kW</span>
                <span ref={ersTextRef} style={{ color: "var(--neon-green)", fontWeight: "800" }}>{activeCar.soc || 85}%</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  ref={ersBarRef}
                  style={{
                    width: `${activeCar.soc || 85}%`,
                    height: "100%",
                    background: "var(--neon-green)",
                    boxShadow: "0 0 6px var(--neon-green)",
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
            {["PACE", "FUEL", "ERS"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveSubTab(tab);
                  if (tab === "PACE") setShowPaceCommands(true);
                }}
                style={{
                  background: activeSubTab === tab ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  border: activeSubTab === tab ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color: activeSubTab === tab ? "#ffffff" : "var(--text-dim)",
                  padding: "3px",
                  borderRadius: "3px",
                  fontSize: "0.62rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          BOTTOM CENTER HUD: F1 MANAGER AUTHENTIC BROADCAST CONTROLLER
          (4x Hero Speed Capsule & Driver Camera Focus)
          ════════════════════════════════════════════════════════════════════════ */}
      <div
        className="hud-interactive"
        style={{
          position: "absolute",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          background: "rgba(10, 14, 22, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          borderRadius: "26px",
          padding: "5px 18px",
          display: "flex",
          alignItems: "center",
          gap: "13px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(14px)",
        }}
      >
        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? "rgba(0, 210, 190, 0.15)" : "rgba(255, 204, 0, 0.2)",
            border: isPlaying ? "1px solid rgba(0, 210, 190, 0.4)" : "1px solid rgba(255, 204, 0, 0.5)",
            color: isPlaying ? "#00d2be" : "#ffcc00",
            cursor: "pointer",
            borderRadius: "50%",
            width: "26px",
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.82rem",
            transition: "all 0.15s ease",
          }}
          title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.18)" }} />

        {/* Hero Speed Multiplier Pill (4x Default F1 Manager) */}
        <button
          onClick={() => {
            const speeds = [1, 2, 4, 8, 16];
            const nextIdx = (speeds.indexOf(simSpeed) + 1) % speeds.length;
            setSimSpeed(speeds[nextIdx]);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: "900",
            fontSize: "0.96rem",
            cursor: "pointer",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            padding: "2px 6px",
            borderRadius: "6px",
            transition: "background 0.12s ease",
          }}
          title="Click to Cycle Simulation Speed Multiplier"
        >
          <span style={{ color: "#00d2be" }}>{simSpeed}</span>
          <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.75)" }}>x</span>
        </button>

        <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.18)" }} />

        {/* Driver Camera Focus Stepper (Max Verstappen is #3) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={handlePrevDriver}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              padding: "2px 7px",
              borderRadius: "4px",
              fontSize: "0.68rem",
              cursor: "pointer",
            }}
            title="Previous Driver"
          >
            ‹
          </button>
          <span
            style={{
              fontSize: "0.72rem",
              fontFamily: "'Orbitron', monospace",
              color: "#ffffff",
              fontWeight: "800",
              minWidth: "72px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <span style={{ color: "var(--neon-cyan)" }}>#{activeCar.num || 3}</span>
            <span>{activeCar.code || "VER"}</span>
          </span>
          <button
            onClick={handleNextDriver}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              padding: "2px 7px",
              borderRadius: "4px",
              fontSize: "0.68rem",
              cursor: "pointer",
            }}
            title="Next Driver"
          >
            ›
          </button>
        </div>

        <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.18)" }} />

        {/* Zoom & Arena Fit Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <button
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "0.66rem",
              cursor: "pointer",
            }}
            title="Zoom Out"
          >
            －
          </button>
          <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "rgba(255,255,255,0.8)", minWidth: "32px", textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3.2, z + 0.15))}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "0.66rem",
              cursor: "pointer",
            }}
            title="Zoom In"
          >
            ＋
          </button>
          <button
            onClick={handleResetView}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--neon-cyan)",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "0.60rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "800",
              cursor: "pointer",
            }}
            title="Reset Camera View to Default"
          >
            FIT
          </button>
        </div>
      </div>
    </div>
  );
}
