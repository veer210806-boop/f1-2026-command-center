// ============================================================
// TimingSidebarTelemetry.jsx — Left Pit-Wall Telemetry Sidebar
// Live Circuit Sector Radar, Lead Battle Delta, Active Aero Actuator,
// Dynamic Speed Trap Leaderboard & Live Pace Deltas.
// ============================================================
import React, { useMemo, useRef } from "react";
import { TEAM_COLORS_MAP } from "../data/constructors2026";
import { computeSectorAndTrapTelemetry } from "../utils/raceSimEngine";

function ActiveAeroDemonstrator({
  mode = "Z-MODE",
  onToggleMode,
  momBoostActive,
  onTriggerMom,
  momCooldown,
  selectedDriver,
}) {
  const isZ = mode === "Z-MODE";
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span aria-hidden="true" style={{ fontSize: "0.9rem" }}>🌀</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.70rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
            2026 ACTIVE AERO
          </span>
        </div>
        <div role="group" aria-label="Active Aero flap configuration" style={{ display: "flex", gap: "4px" }}>
          <button
            type="button"
            aria-pressed={isZ}
            onClick={() => onToggleMode("Z-MODE")}
            style={{
              cursor: "pointer",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.60rem",
              fontWeight: "900",
              padding: "2px 7px",
              borderRadius: "4px",
              background: isZ ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
              color: isZ ? "#ffffff" : "var(--text-dim)",
              border: `1px solid ${isZ ? "#60a5fa" : "rgba(255,255,255,0.1)"}`,
              boxShadow: isZ ? "0 0 10px rgba(37, 99, 235, 0.6)" : "none",
            }}
          >
            Z-MODE
          </button>
          <button
            type="button"
            aria-pressed={!isZ}
            onClick={() => onToggleMode("X-MODE")}
            style={{
              cursor: "pointer",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.60rem",
              fontWeight: "900",
              padding: "2px 7px",
              borderRadius: "4px",
              background: !isZ ? "linear-gradient(135deg, #00d2be, #00998a)" : "rgba(255,255,255,0.05)",
              color: !isZ ? "#000000" : "var(--text-dim)",
              border: `1px solid ${!isZ ? "#00d2be" : "rgba(255,255,255,0.1)"}`,
              boxShadow: !isZ ? "0 0 10px rgba(0, 210, 190, 0.6)" : "none",
            }}
          >
            X-MODE
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
        <svg viewBox="0 0 280 85" role="img" aria-label={`Active Aero schematic in ${mode}`} style={{ width: "100%", height: "100%" }}>
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

          <path d="M 10 25 Q 90 20, 150 24 T 270 28" fill="none" stroke="url(#flowGrad)" strokeWidth="1.5" strokeDasharray="6 4">
            <animate attributeName="stroke-dashoffset" from="30" to="0" dur={isZ ? "1.8s" : "0.9s"} repeatCount="indefinite" />
          </path>
          <path d="M 10 45 Q 90 40, 150 44 T 270 48" fill="none" stroke="url(#flowGrad)" strokeWidth="1.8" strokeDasharray="8 4">
            <animate attributeName="stroke-dashoffset" from="40" to="0" dur={isZ ? "1.6s" : "0.8s"} repeatCount="indefinite" />
          </path>
          <path d="M 10 65 Q 90 60, 150 62 T 270 65" fill="none" stroke="url(#flowGrad)" strokeWidth="1.2" strokeDasharray="5 3">
            <animate attributeName="stroke-dashoffset" from="25" to="0" dur={isZ ? "2.0s" : "1.0s"} repeatCount="indefinite" />
          </path>

          <path d="M 40 55 C 50 48, 75 48, 85 52 L 80 58 C 70 54, 50 54, 40 55 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
          <g transform={`rotate(${isZ ? -22 : -5}, 80, 52)`} style={{ transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <path d="M 80 52 C 90 46, 108 44, 118 48 L 115 54 C 105 50, 90 50, 80 52 Z" fill="url(#aeroWingGrad)" stroke={isZ ? "#60a5fa" : "#00d2be"} strokeWidth="1.2" />
          </g>

          <path d="M 175 62 L 180 20 L 235 18 L 240 60 Z" fill="rgba(30, 41, 59, 0.8)" stroke="#475569" strokeWidth="1" />
          <path d="M 180 38 C 195 34, 215 34, 230 38 L 228 42 C 215 39, 195 39, 180 42 Z" fill="#64748b" />
          <g transform={`rotate(${isZ ? -32 : -6}, 210, 24)`} style={{ transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            <path d="M 190 26 C 205 20, 222 20, 235 24 L 232 29 C 220 25, 205 25, 190 30 Z" fill="url(#aeroWingGrad)" stroke={isZ ? "#60a5fa" : "#00d2be"} strokeWidth="1.5" />
          </g>

          <text x="140" y="78" textAnchor="middle" fill={isZ ? "#93c5fd" : "#00d2be"} fontSize="9" fontFamily="'Orbitron', monospace" fontWeight="800">
            {isZ ? "Z-MODE: CORNER DOWNFORCE [FLAPS 32°]" : "X-MODE: STRAIGHTLINE LOW-DRAG [FLAPS 6°]"}
          </text>
        </svg>
      </div>

      {/* Aerodynamic Telemetry Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", background: "rgba(0,0,0,0.4)", padding: "5px 6px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>ANGLE</div>
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
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>DRAG</div>
          <div style={{ fontSize: "0.72rem", color: isZ ? "#ffaa00" : "var(--neon-green)", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {dragCd}
          </div>
        </div>
        <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>TOP SPD</div>
          <div style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontWeight: "900", fontFamily: "'Orbitron', monospace" }}>
            {topSpeedEst}
          </div>
        </div>
      </div>

      {/* MOM (Manual Override Mode) 350kW Push to Pass Trigger */}
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
            <span aria-hidden="true" style={{ fontSize: "0.85rem" }}>⚡</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: momBoostActive ? "var(--neon-red)" : "#ffffff" }}>
              MOM 350kW OVERRIDE
            </span>
          </div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", marginTop: "2px" }}>
            Focus: #{selectedDriver?.num} {selectedDriver?.code} · +18 km/h burst
          </div>
        </div>
        <button
          type="button"
          onClick={onTriggerMom}
          aria-disabled={momCooldown > 0 || momBoostActive}
          style={{
            cursor: momCooldown > 0 || momBoostActive ? "not-allowed" : "pointer",
            border: "none",
            background: momBoostActive
              ? "linear-gradient(135deg, #ff0055, #b3003b)"
              : (momCooldown > 0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00d2be, #00998a)"),
            color: momBoostActive ? "#ffffff" : (momCooldown > 0 ? "var(--text-dim)" : "#000000"),
            padding: "5px 10px",
            borderRadius: "4px",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.62rem",
            fontWeight: "900",
            letterSpacing: "0.04em",
            boxShadow: momBoostActive ? "0 0 14px rgba(255,0,85,0.8)" : (momCooldown > 0 ? "none" : "0 0 10px rgba(0,210,190,0.5)"),
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{momBoostActive ? "🔥 ACTIVE" : (momCooldown > 0 ? `⏳ COOL (${momCooldown}s)` : "🚀 BOOST")}</span>
        </button>
      </div>
    </div>
  );
}

const TELEMETRY_TABS = [
  { id: "speed", label: "🚀 SPEED TRAP" },
  { id: "pace",  label: "⚡ PACE (TOP 4)" },
  { id: "all",   label: "ALL" },
];

export default function TimingSidebarTelemetry({
  activeCircuitId = "australia",
  activeTrackPath,
  drivers = [],
  effectiveLap = 1,
  trackDampness = 0,
  activeAeroMode = "Z-MODE",
  onToggleAero,
  momBoostActive = false,
  onTriggerMom,
  momCooldown = 0,
  currentDriver,
  awsOvertakeModel,
  telemetryTab = "speed",
  onChangeTelemetryTab,
}) {
  const tabRefs = useRef([]);

  const liveTelemetry = useMemo(() => {
    return computeSectorAndTrapTelemetry({
      drivers,
      circuitId: activeCircuitId,
      trackDampness,
      aeroMode: activeAeroMode,
      currentLap: effectiveLap,
    });
  }, [drivers, activeCircuitId, trackDampness, activeAeroMode, effectiveLap]);

  const p1 = drivers[0] || { code: "NOR", pos: 1, team: "McLaren" };
  const p2 = drivers[1] || { code: "VER", pos: 2, team: "Red Bull Racing" };
  const p1Color = TEAM_COLORS_MAP[p1.team]?.primary || "#ff8700";
  const p2Color = TEAM_COLORS_MAP[p2.team]?.primary || "#3671e8";
  const isPreRace = effectiveLap <= 1;
  const gapText = isPreRace ? "START GRID" : (p2.interval && p2.interval !== "—" ? p2.interval : "+0.850s");
  const isDrsClose = !isPreRace && (awsOvertakeModel?.probabilityPct || 0) >= 60;

  const radarMarkers = useMemo(() => {
    return drivers.slice(0, 6).map((drv, idx) => ({
      code: drv.code,
      color: TEAM_COLORS_MAP[drv.team]?.radar || "#00d2be",
      radius: Math.max(9.5, 13 - idx * 0.6),
      dur: `${(8.8 + idx * 0.16).toFixed(2)}s`,
      begin: `${(-idx * 0.85).toFixed(2)}s`,
    }));
  }, [drivers]);

  const handleTabKeyDown = (e, idx) => {
    let nextIdx = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % TELEMETRY_TABS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + TELEMETRY_TABS.length) % TELEMETRY_TABS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = TELEMETRY_TABS.length - 1;
    if (nextIdx !== null) {
      e.preventDefault();
      onChangeTelemetryTab?.(TELEMETRY_TABS[nextIdx].id);
      tabRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="timing-sidebar" style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
            CIRCUIT RADAR & SECTOR SPEEDS
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.64rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-green)", animation: "pulseFlag 1.5s infinite" }} />
            GPS LIVE
          </span>
        </div>

        {/* Dynamic Circuit Sector Speed Badges Bar */}
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
            <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>SEC 1</div>
            <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#00d2be" }}>
              {liveTelemetry.sectorSpeeds.s1} <span style={{ fontSize: "0.54rem" }}>KM/H</span>
            </div>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>SEC 2</div>
            <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#00cc44" }}>
              {liveTelemetry.sectorSpeeds.s2} <span style={{ fontSize: "0.54rem" }}>KM/H</span>
            </div>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>SEC 3</div>
            <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ff4444" }}>
              {liveTelemetry.sectorSpeeds.s3} <span style={{ fontSize: "0.54rem" }}>KM/H</span>
            </div>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>TRAP</div>
            <div style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#bf7fff" }}>
              {liveTelemetry.sectorSpeeds.trap} <span style={{ fontSize: "0.54rem" }}>KM/H</span>
            </div>
          </div>
        </div>

        {/* Holographic Circuit Radar with Live Top-6 Cars */}
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
          <div style={{ position: "absolute", top: 4, left: 6, fontSize: "0.55rem", color: "rgba(0, 210, 190, 0.7)", fontFamily: "'Orbitron', monospace" }}>┌ GPS TRACKER</div>
          <div style={{ position: "absolute", top: 4, right: 6, fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.4)", fontFamily: "'Orbitron', monospace" }}>GRID 2026 ┐</div>
          <div style={{ position: "absolute", bottom: 4, left: 6, fontSize: "0.55rem", color: "rgba(255, 255, 255, 0.4)", fontFamily: "'Orbitron', monospace" }}>└ FIA SEC-1/2/3</div>
          <div style={{ position: "absolute", bottom: 4, right: 6, fontSize: "0.55rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>60 FPS ┘</div>

          <svg viewBox="0 0 500 500" role="img" aria-label={`Live circuit radar for ${activeCircuitId}`} style={{ width: "95%", height: "95%" }}>
            <defs>
              <linearGradient id="pitTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2be" />
                <stop offset="35%" stopColor="#00e676" />
                <stop offset="70%" stopColor="#ff4444" />
                <stop offset="100%" stopColor="#bf7fff" />
              </linearGradient>
              <linearGradient id="sweepConeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 210, 190, 0)" />
                <stop offset="70%" stopColor="rgba(0, 210, 190, 0.08)" />
                <stop offset="100%" stopColor="rgba(0, 210, 190, 0.28)" />
              </linearGradient>
            </defs>

            <line x1="40" y1="250" x2="460" y2="250" stroke="rgba(0, 210, 190, 0.12)" strokeDasharray="3 4" strokeWidth="1" />
            <line x1="250" y1="40" x2="250" y2="460" stroke="rgba(0, 210, 190, 0.12)" strokeDasharray="3 4" strokeWidth="1" />
            <circle cx="250" cy="250" r="75" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            <circle cx="250" cy="250" r="145" fill="none" stroke="rgba(0, 210, 190, 0.08)" strokeDasharray="4 6" strokeWidth="1" />
            <circle cx="250" cy="250" r="215" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

            <g style={{ transformOrigin: "250px 250px", animation: "radarSweep 5.5s linear infinite" }}>
              <path d="M 250 250 L 460 200 A 215 215 0 0 1 465 250 Z" fill="url(#sweepConeGrad)" />
              <line x1="250" y1="250" x2="465" y2="250" stroke="rgba(0, 210, 190, 0.6)" strokeWidth="1.5" />
            </g>

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

            {radarMarkers.map((car) => (
              <circle key={car.code} r={car.radius} fill={car.color} style={{ filter: `drop-shadow(0 0 9px ${car.color})` }}>
                <title>{car.code}</title>
                <animateMotion dur={car.dur} repeatCount="indefinite" path={activeTrackPath} begin={car.begin} />
              </circle>
            ))}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "5px" }}>
              <span aria-hidden="true">⚔️</span>
              <span>LEAD BATTLE: P1 vs P2</span>
            </span>
            <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: isDrsClose ? "var(--neon-green)" : "#ffaa00", background: isDrsClose ? "rgba(0,204,68,0.2)" : "rgba(255,170,0,0.16)", border: `1px solid ${isDrsClose ? "rgba(0,204,68,0.4)" : "rgba(255,170,0,0.38)"}`, padding: "1px 5px", borderRadius: "3px", fontWeight: "800" }}>
              {isPreRace ? "GRID LOCK" : isDrsClose ? "DRS WINDOW" : "MONITORING"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "3px", height: "14px", background: p1Color, borderRadius: "2px" }} />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>
                {p1.code} <span style={{ fontSize: "0.62rem", color: p1Color }}>P1</span>
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "var(--neon-cyan)", letterSpacing: "0.04em" }}>
                {gapText}
              </span>
              <span style={{ fontSize: "0.56rem", color: isPreRace ? "var(--text-dim)" : "var(--neon-green)", fontFamily: "'Orbitron', monospace" }}>
                {isPreRace ? "AWAITING LIGHTS OUT" : "LIVE TIME DELTA"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>
                <span style={{ fontSize: "0.62rem", color: p2Color }}>P2</span> {p2.code}
              </span>
              <span style={{ width: "3px", height: "14px", background: p2Color, borderRadius: "2px" }} />
            </div>
          </div>

          <div style={{ width: "100%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
            <div
              style={{
                width: `${awsOvertakeModel?.probabilityPct || 50}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${p1Color} 0%, ${p2Color} 100%)`,
                borderRadius: "3px",
                boxShadow: "0 0 8px rgba(0, 210, 190, 0.4)",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
            <span>DRS CATCH PROBABILITY</span>
            <span style={{ color: (awsOvertakeModel?.probabilityPct || 0) >= 70 ? "#00e676" : "#ffaa00", fontWeight: "700" }}>
              {awsOvertakeModel?.probability}
            </span>
          </div>
        </div>
      </div>

      {/* 2026 Active Aero & MOM Override Module */}
      <ActiveAeroDemonstrator
        mode={activeAeroMode}
        onToggleMode={onToggleAero}
        momBoostActive={momBoostActive}
        onTriggerMom={onTriggerMom}
        momCooldown={momCooldown}
        selectedDriver={currentDriver}
      />

      {/* Live Telemetry Leaderboard: Speed Trap & Pace Deltas */}
      <div
        style={{
          background: "rgba(16, 18, 28, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div role="tablist" aria-label="Telemetry leaderboard metrics" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {TELEMETRY_TABS.map((t, idx) => {
              const selected = telemetryTab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onChangeTelemetryTab?.(t.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  style={{
                    background: selected ? "rgba(0, 210, 190, 0.2)" : "rgba(255,255,255,0.04)",
                    border: selected ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                    borderBottom: selected ? "2px solid #ffffff" : "2px solid transparent",
                    color: selected ? "var(--neon-cyan)" : "var(--text-secondary)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.62rem",
                    fontWeight: "800",
                    padding: "3px 7px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: "0.60rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
            ● LIVE
          </span>
        </div>

        {(telemetryTab === "pace" || telemetryTab === "all") && (
          <div role="tabpanel" aria-label="Live pace deltas" style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: telemetryTab === "all" ? "8px" : 0 }}>
            {telemetryTab === "all" && (
              <div style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", textTransform: "uppercase" }}>
                Live Pace Deltas
              </div>
            )}
            {liveTelemetry.topPaceDeltas.map((d) => (
              <div
                key={d.code}
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

        {(telemetryTab === "speed" || telemetryTab === "all") && (
          <div
            role="tabpanel"
            aria-label="Top speed trap leaderboard"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              borderTop: telemetryTab === "all" ? "1px solid rgba(255,255,255,0.06)" : "none",
              paddingTop: telemetryTab === "all" ? "8px" : 0,
            }}
          >
            {telemetryTab === "all" && (
              <div style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", textTransform: "uppercase" }}>
                Top Speed Trap (KM/H)
              </div>
            )}
            {liveTelemetry.topSpeedTrap.map((st) => (
              <div key={st.code} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem" }}>
                <span style={{ width: "14px", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>{st.pos}</span>
                <div style={{ width: "3px", height: "11px", borderRadius: "2px", background: st.color }} />
                <span style={{ width: "88px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#e8e8f0", fontWeight: "600" }}>{st.name}</span>
                <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${st.pct}%`, height: "100%", background: "linear-gradient(90deg, #00d2be, #e8002d)", borderRadius: "3px", transition: "width 0.3s ease" }} />
                </div>
                <span style={{ fontFamily: "'Orbitron', monospace", color: "#fff", fontWeight: "700", minWidth: "30px", textAlign: "right" }}>
                  {st.speed}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
