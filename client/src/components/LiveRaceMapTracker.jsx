// ============================================================
// LiveRaceMapTracker.jsx — Read-Only Broadcast 3D Live Race View
// Pure informational race director overlay: live classification tower,
// circuit conditions ("RACE VIEW"), hardware-accelerated 3D track view,
// and live car/ERS/bio-fuel telemetry readout. Zero user actions inside view.
// ============================================================
import React, { useState, useEffect, useRef, useMemo } from "react";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { getCircuitWeather } from "../data/calendar2026";
import { isDriverBelongingToTeam } from "../data/constructors2026";
import { calculateAutoFuelPrediction } from "../utils/fuelPredictionEngine";
import CircuitSpatialRadar from "./CircuitSpatialRadar";

const TEAM_COLORS = {
  "McLaren":         { primary: "#ff8700" },
  "Red Bull Racing": { primary: "#3671e8" },
  "Mercedes":        { primary: "#00d2be" },
  "Ferrari":         { primary: "#ff3b30" },
  "Williams":        { primary: "#00a0de" },
  "Aston Martin":    { primary: "#229971" },
  "Cadillac":        { primary: "#ffc72c" },
  "Audi":            { primary: "#e50027" },
  "Alpine":          { primary: "#0090ff" },
  "Haas":            { primary: "#b6babd" },
  "Racing Bulls":    { primary: "#6692ff" },
  "RB":              { primary: "#6692ff" },
};

const NIGHT_CIRCUITS = ["las_vegas", "singapore", "bahrain", "qatar", "abu_dhabi", "saudi_arabia"];
const LUT_SIZE = 1400;
const SIM_SPEED = 4;

const FALLBACK_GRID = [
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

function buildInitialLeaderboard(inputDrivers) {
  const baseList = inputDrivers && inputDrivers.length > 0
    ? inputDrivers.map((d) => ({ ...d }))
    : FALLBACK_GRID.map((d) => ({ ...d }));

  baseList.forEach((d) => {
    if (d.code === "VER") d.num = 3;
  });

  const verIdx = baseList.findIndex((d) => d.code === "VER");
  if (verIdx > 0 && (!inputDrivers || inputDrivers.length === 0)) {
    const ver = baseList.splice(verIdx, 1)[0];
    baseList.unshift(ver);
    baseList.forEach((d, i) => {
      d.pos = i + 1;
    });
  }

  return baseList.map((d, idx) => {
    const num = d.code === "VER" ? 3 : (d.num || idx + 1);
    const rawOffset = 0.98 - idx * 0.043;
    const offset = rawOffset < 0 ? rawOffset + 1 : rawOffset;

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
      pitState: d.pitState || "RACING",
      trackPct: (offset + 1) % 1,
      currentSpeedFactor: 1.0,
      speedKmh: 312,
      gear: 7,
      throttle: 95,
      brake: 0,
      isDrsActive: false,
    };
  });
}

export default function LiveRaceMapTracker({
  selectedCircuit,
  drivers = [],
  currentLap = 1,
  maxLaps = 58,
  sessionFlag = "GREEN",
  isAutoSimulating = false,
  userRole = "team",
  playerTeam = "Ferrari",
}) {
  const effectiveTeam = playerTeam || localStorage.getItem("gp_strategy_team") || "Ferrari";
  const effectiveRole = userRole || localStorage.getItem("gp_strategy_role") || "team";

  const activeCircuitId = selectedCircuit?.circuit_id || "australia";
  const activeTrackPath = OFFICIAL_CIRCUIT_PATHS[activeCircuitId] || OFFICIAL_CIRCUIT_PATHS.australia;
  const isNightMode = NIGHT_CIRCUITS.includes(activeCircuitId);
  const trackRotation = activeCircuitId === "australia" ? 298 : 0;
  const isRunning = isAutoSimulating || currentLap > 1;

  const weather = useMemo(() => {
    if (selectedCircuit?.weather) return selectedCircuit.weather;
    return getCircuitWeather(activeCircuitId);
  }, [selectedCircuit, activeCircuitId]);

  const [sessionClock, setSessionClock] = useState(() => new Date().toLocaleTimeString("en-GB"));
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionClock(new Date().toLocaleTimeString("en-GB"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const carSimStateRef = useRef([]);
  const [leaderboardCars, setLeaderboardCars] = useState(() => buildInitialLeaderboard(drivers));

  useEffect(() => {
    const updated = buildInitialLeaderboard(drivers);
    carSimStateRef.current = updated;
    setLeaderboardCars(updated);
  }, [drivers]);

  // Automatically focus broadcast telemetry on player's lead car (or race leader when in Admin mode)
  const highlightedCar = useMemo(() => {
    if (effectiveRole !== "admin") {
      const teamCar = leaderboardCars.find((d) => isDriverBelongingToTeam(d, effectiveTeam));
      if (teamCar) return teamCar;
    }
    return leaderboardCars[0] || {};
  }, [leaderboardCars, effectiveRole, effectiveTeam]);

  const highlightedDriverNum = highlightedCar.num || 3;

  // Refs for zero-rerender 10Hz telemetry readout
  const hiddenPathRef = useRef(null);
  const trackLutRef = useRef([]);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const highlightedNumRef = useRef(highlightedDriverNum);
  highlightedNumRef.current = highlightedDriverNum;
  const sessionFlagRef = useRef(sessionFlag);
  sessionFlagRef.current = sessionFlag;

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

  // Precompute 1400-node track curvature LUT for realistic speed/gear/RPM readout
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
        const ptNext = pathEl.getPointAtLength((d + 2.5) % len);

        const dx0 = pt.x - 250;
        const dy0 = pt.y - 250;
        let rx = dx0 * cosA - dy0 * sinA + 250;
        const ry = dx0 * sinA + dy0 * cosA + 250;

        const dxNext0 = ptNext.x - 250;
        const dyNext0 = ptNext.y - 250;
        let rxNext = dxNext0 * cosA - dyNext0 * sinA + 250;
        const ryNext = dxNext0 * sinA + dyNext0 * cosA + 250;

        if (activeCircuitId === "australia") {
          rx = 500 - rx;
          rxNext = 500 - rxNext;
        }

        const angle = (Math.atan2(ryNext - ry, rxNext - rx) * 180) / Math.PI;
        lut[i] = { angle, speedFactor: 1.0, isDrsZone: false };
      }

      for (let i = 0; i < LUT_SIZE; i++) {
        const prev = lut[(i - 12 + LUT_SIZE) % LUT_SIZE];
        const next = lut[(i + 12) % LUT_SIZE];
        let dAngle = Math.abs(next.angle - prev.angle);
        if (dAngle > 180) dAngle = 360 - dAngle;

        const isStraight = dAngle < 6;
        lut[i].speedFactor = Math.max(0.42, 1.42 - dAngle * 0.046);
        lut[i].isDrsZone =
          isStraight &&
          ((i > LUT_SIZE * 0.05 && i < LUT_SIZE * 0.32) || (i > LUT_SIZE * 0.55 && i < LUT_SIZE * 0.82));
      }

      const smoothed = new Array(LUT_SIZE);
      for (let i = 0; i < LUT_SIZE; i++) {
        let sum = 0;
        const win = 18;
        for (let w = -win; w <= win; w++) {
          sum += lut[(i + w + LUT_SIZE) % LUT_SIZE].speedFactor;
        }
        smoothed[i] = { ...lut[i], speedFactor: sum / (win * 2 + 1) };
      }
      trackLutRef.current = smoothed;
    } catch (err) {
      console.warn("Track LUT precomputation error:", err);
    }
  }, [activeTrackPath, trackRotation, activeCircuitId]);

  // Passive read-only 10Hz broadcast telemetry ticker synced to simulation state
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    let lastTelemetryUpdate = 0;

    const tick = (now) => {
      const deltaMs = Math.min(32, now - lastTime);
      lastTime = now;

      const lut = trackLutRef.current;
      const cars = carSimStateRef.current;
      const running = isRunningRef.current;
      const flag = sessionFlagRef.current;

      if (running && lut.length === LUT_SIZE && cars.length > 0) {
        const flagFactor = flag === "SC" ? 0.52 : flag === "VSC" ? 0.65 : flag === "RED" ? 0.05 : 1.0;
        const baseSpeed = 0.000045 * SIM_SPEED * flagFactor;

        for (let i = 0; i < cars.length; i++) {
          const car = cars[i];
          const wp = lut[Math.floor((car.trackPct % 1) * LUT_SIZE)] || lut[0];
          const targetFactor = wp.speedFactor * (1.0 + (22 - car.pos) * 0.0018);
          const inertiaRate = targetFactor < car.currentSpeedFactor ? 0.12 : 0.07;

          car.currentSpeedFactor += (targetFactor - car.currentSpeedFactor) * inertiaRate;
          car.trackPct = (car.trackPct + deltaMs * baseSpeed * car.currentSpeedFactor) % 1;
          car.speedKmh = Math.round(92 + car.currentSpeedFactor * 182);
          car.isDrsActive = wp.isDrsZone;
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
        }

        if (now - lastTelemetryUpdate >= 100) {
          lastTelemetryUpdate = now;
          const focusCar = cars.find((c) => c.num === highlightedNumRef.current) || cars[0];
          if (focusCar) {
            if (speedDisplayRef.current) speedDisplayRef.current.textContent = `${focusCar.speedKmh} KM/H`;
            if (gearDisplayRef.current) gearDisplayRef.current.textContent = `G ${focusCar.gear}`;
            if (throttleBarRef.current) throttleBarRef.current.style.width = `${focusCar.throttle}%`;
            if (brakeBarRef.current) brakeBarRef.current.style.width = `${focusCar.brake}%`;
            if (drsBadgeRef.current) {
              drsBadgeRef.current.style.background = focusCar.isDrsActive ? "rgba(0, 230, 118, 0.25)" : "rgba(255, 255, 255, 0.05)";
              drsBadgeRef.current.style.borderColor = focusCar.isDrsActive ? "var(--neon-green)" : "rgba(255, 255, 255, 0.15)";
              drsBadgeRef.current.style.color = focusCar.isDrsActive ? "var(--neon-green)" : "#666";
            }
            if (ersBarRef.current) ersBarRef.current.style.width = `${focusCar.soc}%`;
            if (ersTextRef.current) ersTextRef.current.textContent = `${focusCar.soc}%`;
            if (tireWearTextRef.current) tireWearTextRef.current.textContent = `${100 - focusCar.wear}%`;
            if (tireTempTextRef.current) tireTempTextRef.current.textContent = `${focusCar.temp}°C`;

            const rpm = Math.min(
              13500,
              Math.max(8800, 10200 + Math.round((focusCar.throttle / 100) * 2900 + ((focusCar.speedKmh % 40) / 40) * 400))
            );
            if (rpmDisplayRef.current) rpmDisplayRef.current.textContent = `${rpm.toLocaleString()} RPM`;

            const isOptimalShift = rpm >= 13350 && focusCar.throttle > 85;
            for (let k = 0; k < 15; k++) {
              const led = shiftLedRefs.current[k];
              if (!led) continue;
              const threshold = k < 5 ? 10400 + k * 260 : k < 10 ? 11700 + (k - 5) * 260 : 13000 + (k - 10) * 70;
              const isOn = rpm >= threshold;
              if (isOptimalShift) {
                led.style.background = "#bf7fff";
                led.style.boxShadow = "0 0 8px #bf7fff";
                led.style.borderColor = "#ffffff";
              } else if (isOn) {
                const col = k < 5 ? "var(--neon-green)" : k < 10 ? "var(--neon-red)" : "#bf7fff";
                led.style.background = col;
                led.style.boxShadow = `0 0 6px ${col}`;
                led.style.borderColor = col;
              } else {
                const dimCol = k < 5 ? "rgba(0, 230, 118, 0.12)" : k < 10 ? "rgba(255, 59, 48, 0.12)" : "rgba(191, 127, 255, 0.12)";
                const borderCol = k < 5 ? "rgba(0, 230, 118, 0.25)" : k < 10 ? "rgba(255, 59, 48, 0.25)" : "rgba(191, 127, 255, 0.25)";
                led.style.background = dimCol;
                led.style.boxShadow = "none";
                led.style.borderColor = borderCol;
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

  const activeCarFuelPred = useMemo(
    () =>
      calculateAutoFuelPrediction({
        circuit: selectedCircuit,
        driver: highlightedCar,
        teamName: highlightedCar?.team || effectiveTeam,
        currentLap,
        maxLaps,
        activeFlag: sessionFlag,
        pushMode: "aggressive",
      }),
    [selectedCircuit, highlightedCar, effectiveTeam, currentLap, maxLaps, sessionFlag]
  );

  // Derived read-only circuit conditions
  const rainPct = Number(weather?.rain_chance ?? 0);
  const airTempC = weather?.air_temp ?? 21;
  const trackTempC = weather?.track_temp ?? 29;
  const surfaceText = rainPct >= 55 ? "Wet" : rainPct >= 25 ? "Damp" : "Dry";
  const precipitationMm = rainPct >= 55 ? `${((rainPct / 100) * 1.8).toFixed(2)} mm` : "0.00 mm";
  const rubberText = currentLap < 10 ? "Very Low" : currentLap < 25 ? "Medium" : "High";
  const rubberColor = currentLap < 10 ? "#f43f5e" : currentLap < 25 ? "#f59e0b" : "#00e676";
  const gripText = rainPct >= 55 ? "Slippery" : currentLap >= 18 ? "High" : "Normal";
  const gripColor = rainPct >= 55 ? "#f59e0b" : currentLap >= 18 ? "#00e676" : "#38bdf8";

  return (
    <div
      className="race-director-map race-director-map--readonly"
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(465px, calc(100vh - 360px), 780px)",
        minHeight: "465px",
        maxHeight: "820px",
        background: isNightMode
          ? "radial-gradient(ellipse at 50% 40%, #0d1526 0%, #080c16 50%, #04060b 100%)"
          : "radial-gradient(ellipse at 50% 40%, #0d1422 0%, #080c14 60%, #05070c 100%)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "10px",
        overflow: "clip",
        boxShadow: "0 14px 45px rgba(0, 0, 0, 0.9)",
        userSelect: "none",
        cursor: "default",
      }}
    >
      {/* Hidden SVG element used solely to sample LUT speed/gear telemetry */}
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none", opacity: 0 }}>
        <path ref={hiddenPathRef} d={activeTrackPath} fill="none" />
      </svg>

      {/* Dynamic FIA Track Condition & Safety Car Status Pill */}
      {sessionFlag && sessionFlag !== "GREEN" && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            background: sessionFlag === "RED" ? "rgba(232,0,45,0.92)" : "rgba(255,170,0,0.92)",
            border: `2px solid ${sessionFlag === "RED" ? "#ffffff" : "#ffea00"}`,
            boxShadow: `0 0 26px ${sessionFlag === "RED" ? "rgba(232,0,45,0.85)" : "rgba(255,170,0,0.85)"}`,
            borderRadius: "8px",
            padding: "5px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "'Orbitron', monospace",
            fontWeight: "900",
            fontSize: "0.80rem",
            color: "#0b0c14",
            letterSpacing: "0.08em",
            pointerEvents: "none",
          }}
        >
          <span>{sessionFlag === "SC" ? "🚗 SAFETY CAR" : sessionFlag === "VSC" ? "⚠️ VIRTUAL SAFETY CAR" : sessionFlag === "RED" ? "🔴 RED FLAG" : "🟡 CAUTION"}</span>
          <span>·</span>
          <span style={{ fontSize: "0.68rem", fontWeight: "800" }}>{sessionFlag === "RED" ? "SESSION SUSPENDED" : "DELTA TIME ENFORCED"}</span>
        </div>
      )}

      {/* Subtle Telemetry Grid Backdrop */}
      <div
        className="race-map-stage"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Read-Only 3D Broadcast Circuit Stage */}
      <div className="spatial-race-map-layer" style={{ pointerEvents: "none" }}>
        <CircuitSpatialRadar
          trackPath={activeTrackPath}
          circuitId={activeCircuitId}
          drivers={leaderboardCars}
          selectedDriverNum={highlightedDriverNum}
          isNightMode={isNightMode}
          isPlaying={isRunning}
          simSpeed={SIM_SPEED}
          currentLap={currentLap}
          isAutoSimulating={isAutoSimulating}
        />
      </div>

      {/* LEFT READ-ONLY CLASSIFICATION TOWER (All 22 cars compact, non-interactive) */}
      <div
        className="race-map-hud race-map-leaderboard"
        style={{
          position: "absolute",
          insetBlockStart: "12px",
          insetInlineStart: "14px",
          width: "178px",
          background: "rgba(10, 14, 22, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderTop: "3px solid #e10600",
          borderRadius: "7px",
          padding: "6px 8px",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.82)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          maxHeight: "calc(100% - 24px)",
          pointerEvents: "none",
          cursor: "default",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ background: "#e10600", color: "#ffffff", padding: "1px 6px", borderRadius: "3px", fontWeight: "900", fontSize: "0.66rem", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.5px" }}>
              LIVE
            </span>
            <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
              L{currentLap}/{maxLaps}
            </span>
          </div>
          <span
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--neon-cyan)",
              padding: "1px 5px",
              borderRadius: "3px",
              fontSize: "0.52rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "700",
            }}
          >
            SECTORS
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.52rem", color: "rgba(255,255,255,0.45)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em" }}>
          <span>POS · DRIVER</span>
          <span>S1 · S2 · S3</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5px", overflow: "clip" }}>
          {leaderboardCars.map((d) => {
            const isHighlighted = d.num === highlightedDriverNum;
            const teamConf = TEAM_COLORS[d.team] || { primary: "#888" };
            const isOutLap = currentLap <= 1 ? false : d.pos >= 18;

            return (
              <div
                key={d.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "16px 3px 34px 1fr",
                  alignItems: "center",
                  gap: "4px",
                  padding: "1.5px 5px",
                  borderRadius: "3px",
                  background: isHighlighted ? "#ffffff" : "rgba(255, 255, 255, 0.03)",
                  border: isHighlighted ? "1px solid #ffffff" : "1px solid transparent",
                  boxShadow: isHighlighted ? "0 2px 8px rgba(255,255,255,0.35)" : "none",
                }}
              >
                <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: isHighlighted ? "#0a0e16" : "var(--text-dim)", fontWeight: "800" }}>
                  {d.pos}
                </span>

                <div style={{ width: "3px", height: "11px", borderRadius: "1px", background: teamConf.primary }} />

                <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: isHighlighted ? "#0a0e16" : "#ffffff" }}>
                  {d.code}
                </span>

                {isOutLap ? (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.50rem", fontFamily: "'Orbitron', monospace", padding: "1px 4px", borderRadius: "2px", background: isHighlighted ? "#0a0e16" : "rgba(255,255,255,0.12)", color: "#ffffff", fontWeight: "800" }}>
                      PIT / OUT
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "2px", justifyContent: "flex-end", alignItems: "center" }}>
                    <div style={{ width: "12px", height: "4.5px", borderRadius: "1px", background: d.pos === 1 ? "#cc44ff" : d.pos <= 4 ? "#00e84d" : "#ffcc00" }} />
                    <div style={{ width: "12px", height: "4.5px", borderRadius: "1px", background: d.pos <= 2 ? "#cc44ff" : d.pos <= 9 ? "#00e84d" : "#ffcc00" }} />
                    <div style={{ width: "12px", height: "4.5px", borderRadius: "1px", background: d.pos <= 3 ? "#00e84d" : "#ffcc00" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT READ-ONLY HUD COLUMN (Single flex dock guarantees RACE VIEW & TELEMETRY never collide) */}
      <div
        className="race-map-right-dock"
        style={{
          position: "absolute",
          insetBlock: "12px",
          insetInlineEnd: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "8px",
          zIndex: 30,
          pointerEvents: "none",
          cursor: "default",
        }}
      >
        {/* TOP CARD: PURE READ-ONLY RACE VIEW */}
        <div
          className="race-map-hud race-map-conditions"
          style={{
            background: "rgba(10, 14, 22, 0.94)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "7px",
            padding: "8px 12px",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.82)",
            width: "228px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "0.76rem",
                fontWeight: "900",
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "1px",
                color: "#ffffff",
              }}
            >
              RACE VIEW
            </span>
            <span
              style={{
                fontSize: "0.52rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                color: isRunning ? "#00e676" : "#fbbf24",
                background: isRunning ? "rgba(0, 230, 118, 0.14)" : "rgba(251, 191, 36, 0.14)",
                border: `1px solid ${isRunning ? "rgba(0, 230, 118, 0.35)" : "rgba(251, 191, 36, 0.35)"}`,
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              {isRunning ? `LIVE ${SIM_SPEED}X` : "GRID VIEW"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", fontFamily: "'Orbitron'" }}>
            <span style={{ color: "#cbd5e1" }}>{sessionClock}</span>
            <span style={{ color: "#ffffff", fontWeight: "700" }}>{weather?.icon || "🌤️"} {airTempC}°C</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.60rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "125px" }}>{weather?.condition || "Clear & Dry"}</span>
            <span style={{ color: "#38bdf8", fontWeight: "700" }}>💧 {rainPct}%</span>
          </div>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "1px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", fontFamily: "'Orbitron'" }}>
            <span style={{ color: "#64748b", fontWeight: "800" }}>TRACK</span>
            <span style={{ color: "#ffffff", fontWeight: "800" }}>{trackTempC}°C</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>🛣️ {surfaceText}</span>
            <span style={{ color: "#ffffff", fontWeight: "600" }}>{precipitationMm}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>🏁 Rubber</span>
            <span style={{ color: rubberColor, fontWeight: "800" }}>◆ {rubberText}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", fontFamily: "'Orbitron'", color: "#94a3b8" }}>
            <span>⚡ Grip</span>
            <span style={{ color: gripColor, fontWeight: "800" }}>{gripText}</span>
          </div>
        </div>

        {/* BOTTOM CARD: READ-ONLY DRIVER + AUTO BIO-FUEL + ERS TELEMETRY */}
        <div
          className="race-map-hud race-map-telemetry"
          style={{
            marginBlockStart: "auto",
            background: "rgba(10, 14, 22, 0.94)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "8px",
            padding: "8px 11px",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.85)",
            width: "262px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff" }}>
              #{highlightedCar.num || 3} | {(highlightedCar.name || "VERSTAPPEN").split(" ").slice(-1)[0].toUpperCase()}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                ref={speedDisplayRef}
                style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800" }}
              >
                {highlightedCar.speedKmh || 312} KM/H
              </span>
              <span
                ref={drsBadgeRef}
                style={{
                  fontSize: "0.54rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "800",
                  color: "var(--neon-green)",
                  background: "rgba(0, 204, 68, 0.15)",
                  border: "1px solid rgba(0, 204, 68, 0.4)",
                  padding: "1px 4px",
                  borderRadius: "3px",
                }}
              >
                DRS
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.45)",
              padding: "4px 6px",
              borderRadius: "5px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span
              ref={gearDisplayRef}
              style={{
                fontSize: "0.60rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "900",
                color: "#ffffff",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "1px 5px",
                borderRadius: "3px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              G {highlightedCar.gear || 7}
            </span>

            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              {Array.from({ length: 15 }).map((_, idx) => (
                <div
                  key={idx}
                  ref={(el) => (shiftLedRefs.current[idx] = el)}
                  style={{
                    width: "5px",
                    height: "7px",
                    borderRadius: "1.5px",
                    background: idx < 5 ? "rgba(0, 230, 118, 0.15)" : idx < 10 ? "rgba(255, 59, 48, 0.15)" : "rgba(191, 127, 255, 0.15)",
                    border: `1px solid ${idx < 5 ? "rgba(0, 230, 118, 0.3)" : idx < 10 ? "rgba(255, 59, 48, 0.3)" : "rgba(191, 127, 255, 0.3)"}`,
                  }}
                />
              ))}
            </div>

            <span
              ref={rpmDisplayRef}
              style={{
                fontSize: "0.58rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                color: "var(--neon-cyan)",
              }}
            >
              12,450 RPM
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "0.54rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>THR</span>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div ref={throttleBarRef} style={{ width: "95%", height: "100%", background: "var(--neon-green)", borderRadius: "2px" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "0.54rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-red)", fontWeight: "800" }}>BRK</span>
              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div ref={brakeBarRef} style={{ width: "0%", height: "100%", background: "var(--neon-red)", borderRadius: "2px" }} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: "4px" }}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `2px solid ${highlightedCar.tire === "S" ? "#ff3b30" : highlightedCar.tire === "M" ? "#ffcc00" : "#ffffff"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.60rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  color: "#ffffff",
                }}
              >
                {highlightedCar.tire || "M"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span ref={tireWearTextRef} style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
                  {100 - (highlightedCar.wear || 42)}%
                </span>
                <span ref={tireTempTextRef} style={{ fontSize: "0.54rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  {highlightedCar.temp || 82}°C
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "rgba(255,255,255,0.03)", padding: "3px 6px", borderRadius: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.54rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "var(--text-dim)" }}>ERS 350kW</span>
                <span ref={ersTextRef} style={{ color: "var(--neon-green)", fontWeight: "800" }}>{highlightedCar.soc || 85}%</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  ref={ersBarRef}
                  style={{
                    width: `${highlightedCar.soc || 85}%`,
                    height: "100%",
                    background: "var(--neon-green)",
                    boxShadow: "0 0 6px var(--neon-green)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Inline Read-Only Auto Bio-Fuel Strip */}
          <div
            style={{
              background: "rgba(0, 210, 190, 0.06)",
              border: "1px solid rgba(0, 210, 190, 0.22)",
              borderRadius: "4px",
              padding: "4px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.54rem", fontFamily: "'Orbitron', monospace" }}>
              <span style={{ color: "#cbd5e1", fontWeight: "800" }}>⛽ AUTO BIO-FUEL</span>
              <span style={{ color: activeCarFuelPred.statusColor, fontWeight: "900" }}>
                {activeCarFuelPred.remainingKg} kg · {activeCarFuelPred.predictedDeltaLaps >= 0 ? "+" : ""}{activeCarFuelPred.predictedDeltaLaps} L
              </span>
            </div>
            <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${activeCarFuelPred.remainingPct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${activeCarFuelPred.statusColor}, #00d2be)`,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.50rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
              <span>{activeCarFuelPred.liveBurnPerLapKg} kg/L · MASS -{activeCarFuelPred.weightGainSoFarSec}s/L</span>
              <span style={{ color: activeCarFuelPred.ecuModeColor, fontWeight: "800" }}>{activeCarFuelPred.ecuModeLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
