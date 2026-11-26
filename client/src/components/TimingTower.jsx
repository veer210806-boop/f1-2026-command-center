// ============================================================
// TimingTower.jsx — Advanced F1 Pit Wall Command Center
// Next-Gen 2026 Formula 1 Live Mission Control Dashboard
// ============================================================
import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { getTeamLogo } from "../data/f1MediaAssets2026";
import { getCircuitWeather } from "../data/calendar2026";
import { getDriverRadio } from "../data/teamRadioArchive";
import TeamRadioModal from "./TeamRadioModal";
import FiaRaceControlModal from "./FiaRaceControlModal";
import LiveRaceMapTracker from "./LiveRaceMapTracker";
import StatsF1LapMatrix from "./StatsF1LapMatrix";
import TimingSidebarTelemetry from "./TimingSidebarTelemetry";
import ComponentErrorBoundary from "./ComponentErrorBoundary";
import {
  generateRaceWeekendData,
  buildTimingTowerGridForCircuit,
  getGrandPrixConfig,
} from "../data/raceWeekendGrids2026";
import { isDriverBelongingToTeam } from "../data/constructors2026";
import {
  DRIVER_IOC_MAP,
  TIRE_CONFIG,
  TEAM_RACE_ENGINEERS,
  simulateLapTick,
  computeCatchAndProbability,
  computePitCrewExecution,
  buildLiveTireCurve,
  buildPaceComparisonSeries,
  buildStrategyPlanSummary,
  resetGridEntries,
} from "../utils/raceSimEngine";
import { fetchOpenF1RaceReplay } from "../utils/openF1Service";
import { downloadCsvFile } from "../utils/exportUtils";

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

function TireWheel({ compound = "M", laps = 20 }) {
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
function TireBadgePill({ compound = "M", label = "" }) {
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

function SectorBadge({ time = "28.140", type = "green" }) {
  if (time === "—" || time === "-" || !time || type === "empty") {
    return (
      <span
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "0.70rem",
          fontWeight: "600",
          color: "rgba(255, 255, 255, 0.35)",
          display: "inline-block",
          textAlign: "center",
          minWidth: "46px",
        }}
      >
        —
      </span>
    );
  }
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
function AeroBadge({ mom = "Z-MODE", isDrs = false }) {
  const isMom = mom === "MOM ON" || mom === "ACTIVE";
  const isDrsActive = isDrs || (typeof mom === "string" && mom.includes("DRS"));
  const isX = mom === "X-MODE" || isDrsActive;
  const isZ = mom === "Z-MODE" && !isDrsActive;
  const color = isMom ? "#ff0055" : isDrsActive ? "#00e676" : isX ? "#00d2be" : isZ ? "#4488ff" : "#ffaa00";
  const bg = isMom ? "rgba(255,0,85,0.18)" : isDrsActive ? "rgba(0,230,118,0.18)" : isX ? "rgba(0,210,190,0.15)" : isZ ? "rgba(68,136,255,0.15)" : "rgba(255,170,0,0.15)";
  const label = isDrsActive ? "🟢 X-MODE" : mom;
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
        boxShadow: isDrsActive ? "0 0 6px rgba(0,230,118,0.35)" : "none",
      }}
      title={isDrsActive ? "Active Aero: Low-Drag X-MODE Enabled (DRS gap < 1.0s)" : `Active Aero: ${mom}`}
    >
      {label}
    </span>
  );
}

function TimingTower({
  selectedCircuit,
  onGoToStrategy,
  controlledLap,
  controlledFlag,
  isAutoSimulating = false,
  simSpeed = 1,
  onToggleAutoSim,
  onChangeSimSpeed,
  onMapActiveChange,
  onAdvanceLap,
  onSetLap,
  triggerOvertakeSignal,
  userRole = "team",
  playerTeam = "Ferrari",
  restartSignal = 0,
  drivers: externalDrivers,
  onDriversUpdate,
  plannedStrategies = [],
  driverPlans,
  onUpdateDriverPlan,
  onCompletePlanStop,
  activePitEvent: propActivePitEvent,
  onSetPitEvent,
  overtakeEvent: propOvertakeEvent,
  onSetOvertakeEvent,
}) {
  const gpName = selectedCircuit?.grand_prix_name || "AUSTRALIAN GRAND PRIX";
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

  const [currentLap, setCurrentLap] = useState(controlledLap || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState(0);
  const [drivers, setDrivers] = useState(() => (externalDrivers && externalDrivers.length > 0 ? externalDrivers : buildTimingTowerGridForCircuit("australia", 1)));

  const effectiveLap = controlledLap !== undefined ? controlledLap : currentLap;

  // Dynamic Fastest Lap across the entire Grand Prix (tracks live and highlights purple throughout whole race)
  const fastestLapInfo = useMemo(() => {
    if (effectiveLap <= 1) return { driverCode: null, timeSec: Infinity, lapStr: null };
    let minSec = Infinity;
    let fastestCode = null;
    let fastestLapStr = null;

    drivers.forEach((d) => {
      if (d.bestLap && d.bestLap !== "NO TIME" && d.bestLap !== "—" && d.bestLap.includes(":")) {
        const parts = d.bestLap.split(":");
        const sec = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
        if (!isNaN(sec) && sec < minSec) {
          minSec = sec;
          fastestCode = d.code;
          fastestLapStr = d.bestLap;
        }
      }
    });

    return { driverCode: fastestCode, timeSec: minSec, lapStr: fastestLapStr };
  }, [drivers, effectiveLap]);

  // Synchronize internal drivers cleanly with externalDrivers (post-commit avoids render-time setState errors)
  const lastExternalSyncRef = useRef(null);
  useEffect(() => {
    if (externalDrivers && externalDrivers.length > 0 && externalDrivers !== lastExternalSyncRef.current) {
      lastExternalSyncRef.current = externalDrivers;
      setDrivers(externalDrivers);
    }
  }, [externalDrivers]);

  useEffect(() => {
    if (onDriversUpdate && drivers !== lastExternalSyncRef.current) {
      lastExternalSyncRef.current = drivers;
      onDriversUpdate(drivers);
    }
  }, [drivers, onDriversUpdate]);

  const [radioMsg, setRadioMsg] = useState("Box this lap for Hard compounds. Push hard on in-lap.");
  const [radioFeedIdx, setRadioFeedIdx] = useState(0);

  // ── 2026 Dynamic Race Sim, Weather & Active Aero State ─────────────────
  const [trackDampness, setTrackDampness] = useState(0); // 0% - 100%
  const [weatherMode, setWeatherMode] = useState("auto"); // "auto" | "dry" | "drizzle" | "wet"
  const [activeAeroMode, setActiveAeroMode] = useState("Z-MODE"); // "Z-MODE" | "X-MODE"
  const [momBoostActive, setMomBoostActive] = useState(false);
  const [momCooldown, setMomCooldown] = useState(0);

  // Format clean driver surname + audio broadcast chime
  function formatDriverSurname(name) {
    if (!name) return "";
    if (name.includes("Sainz")) return "Sainz Jr.";
    const parts = name.split(" ");
    return parts.slice(1).join(" ");
  }

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
        } catch {
          // ignore WebAudio teardown edge
        }
      }, 90);
    } catch {
      // ignore AudioContext restriction
    }
  }

  // Synchronized broadcast event state (parent callbacks queued post-updater cleanly)
  const [internalOvertakeEvent, setInternalOvertakeEvent] = useState(null);
  const overtakeEvent = propOvertakeEvent !== undefined ? propOvertakeEvent : internalOvertakeEvent;
  const setOvertakeEvent = useCallback((val) => {
    setInternalOvertakeEvent(val);
    if (onSetOvertakeEvent) {
      queueMicrotask(() => onSetOvertakeEvent(val));
    }
  }, [onSetOvertakeEvent]);

  const [activeOvertake, setActiveOvertake] = useState(null);

  const [internalPitEvent, setInternalPitEvent] = useState(null);
  const activePitEvent = propActivePitEvent !== undefined ? propActivePitEvent : internalPitEvent;
  const setActivePitEvent = useCallback((val) => {
    setInternalPitEvent(val);
    if (onSetPitEvent) {
      queueMicrotask(() => onSetPitEvent(val));
    }
  }, [onSetPitEvent]);

  // Wire Weather Mode & Live Forecast rain probability -> actual physics trackDampness (0..100)
  useEffect(() => {
    let nextDamp = 0;
    if (weatherMode === "dry") {
      nextDamp = 0;
    } else if (weatherMode === "drizzle") {
      nextDamp = 38;
    } else if (weatherMode === "wet") {
      nextDamp = 78;
    } else {
      const chance = Number(weather?.rain_chance || 0);
      nextDamp = chance >= 70 ? 64 : chance >= 40 ? 36 : chance >= 20 ? 12 : 0;
    }
    setTrackDampness(nextDamp);
  }, [weatherMode, weather?.rain_chance]);

  // Cooldown timer for MOM 350kW Push-to-Pass Override (prevents permanent lockout)
  useEffect(() => {
    if (!momBoostActive && momCooldown <= 0) return undefined;
    const burstTimer = momBoostActive ? setTimeout(() => setMomBoostActive(false), 1500) : null;
    const coolTimer = momCooldown > 0 ? setTimeout(() => setMomCooldown((c) => Math.max(0, c - 1)), 1000) : null;
    return () => {
      if (burstTimer) clearTimeout(burstTimer);
      if (coolTimer) clearTimeout(coolTimer);
    };
  }, [momBoostActive, momCooldown]);

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [lapHistory, setLapHistory] = useState(() => generateRaceWeekendData("australia", 58).lapHistory);
  const [telemetrySource, setTelemetrySource] = useState("sim"); // "sim" | "openf1"
  const [openF1Dataset, setOpenF1Dataset] = useState(null);
  const [isOpenF1Loading, setIsOpenF1Loading] = useState(false);
  const [dataSourceStatus, setDataSourceStatus] = useState("");

  // Toggle between 2026 Physics Simulation and Real FIA 2024 Historical OpenF1 Replay
  const handleSelectTelemetrySource = async (mode) => {
    if (mode === "sim") {
      setTelemetrySource("sim");
      setDataSourceStatus("2026 Physics Engine active");
      setDrivers(buildTimingTowerGridForCircuit(activeCircuitId, 1));
      return;
    }
    setTelemetrySource("openf1");
    setIsOpenF1Loading(true);
    setDataSourceStatus(`Fetching real 2024 FIA telemetry for ${gpName}...`);
    try {
      const dataset = await fetchOpenF1RaceReplay(activeCircuitId, 2024);
      setOpenF1Dataset(dataset);
      setIsOpenF1Loading(false);
      const frame = dataset.framesByLap[Math.min(effectiveLap, dataset.maxLaps)] || dataset.framesByLap[1];
      if (frame && frame.length > 0) {
        setDrivers(frame);
      }
      setDataSourceStatus(`OpenF1 Real Replay (${dataset.sessionName} · ${dataset.maxLaps} laps loaded)`);
      setOvertakeEvent(`📡 REAL FIA DATA LOADED: Replaying authentic 2024 ${dataset.sessionName} via OpenF1 API!`);
    } catch (err) {
      setIsOpenF1Loading(false);
      setTelemetrySource("sim");
      setOpenF1Dataset(null);
      setDataSourceStatus(`OpenF1 unavailable (${err?.message || "network"}) — reverted to 2026 Physics Engine.`);
    }
  };

  // Auto-dismiss pit stop broadcast popup after 8 seconds
  useEffect(() => {
    if (activePitEvent) {
      const timer = setTimeout(() => {
        setActivePitEvent(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activePitEvent, setActivePitEvent]);

  // Switch to Grand Prix's unique starting grid ONLY on Lap 1 or before start
  useEffect(() => {
    const raceWeekend = generateRaceWeekendData(activeCircuitId, maxLaps);
    setLapHistory(raceWeekend.lapHistory);
    setTelemetrySource("sim");
    setOpenF1Dataset(null);
    setDataSourceStatus("");
    if (effectiveLap <= 1) {
      const newGrid = buildTimingTowerGridForCircuit(activeCircuitId, 1);
      setDrivers(newGrid);
      setSelectedDriverIdx(0);
    }
  }, [activeCircuitId, maxLaps, effectiveLap]);

  // Real-time Session Flag Status: "GREEN", "SC", "VSC", "RED"
  const [sessionFlag, setSessionFlag] = useState(controlledFlag || "GREEN");
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);
  const [isFiaModalOpen, setIsFiaModalOpen] = useState(false);
  const [dismissedScLap, setDismissedScLap] = useState(null);
  const [dismissedCliffDriverCode, setDismissedCliffDriverCode] = useState(null);

  // Player Team Drivers for In-Race Tactical Dilemmas & Directives
  const playerTeamDrivers = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    const safePlayerTeam = playerTeam || localStorage.getItem("gp_strategy_team") || "Ferrari";
    return drivers.filter((d) => isDriverBelongingToTeam(d, safePlayerTeam));
  }, [drivers, playerTeam]);

  // Realistic Interactive Overtake Duel Simulator (declared before external trigger effect)
  const handleTriggerDuelOvertake = useCallback(() => {
    const targetIdx = selectedDriverIdx > 0 ? selectedDriverIdx - 1 : 0;
    const attackerIdx = targetIdx + 1;
    const currentList = drivers || [];
    if (currentList.length < 2) return;

    const carAhead = currentList[targetIdx];
    const carBehind = currentList[attackerIdx];
    if (!carAhead || !carBehind) return;

    setDrivers((prevDrivers) => {
      if (prevDrivers.length < 2) return prevDrivers;
      const updated = [...prevDrivers];
      updated[targetIdx] = { ...prevDrivers[attackerIdx], pos: targetIdx + 1, posDelta: "+1", arrow: "up", overtaken: true };
      updated[attackerIdx] = { ...prevDrivers[targetIdx], pos: attackerIdx + 1, posDelta: "-1", arrow: "down" };

      let accum = 0;
      return updated.map((d, i) => {
        const isLead = i === 0;
        const step = +(0.55 + (i % 3) * 0.22).toFixed(3);
        if (!isLead) accum += step;
        return {
          ...d,
          pos: i + 1,
          gap: isLead ? "LEADER" : (effectiveLap <= 1 ? "—" : `+${accum.toFixed(3)}s`),
          interval: isLead ? "—" : (effectiveLap <= 1 ? "—" : `+${step.toFixed(3)}s`),
        };
      });
    });

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
      lap: effectiveLap,
      reason: boostReason,
      timestamp: Date.now(),
    });
    playF1OvertakeChime(isSoundMuted);
    setOvertakeEvent(`OVERTAKE CONFIRMED: P${targetIdx + 1} #${carBehind.num} ${carBehind.code} passes #${carAhead.num} ${carAhead.code} ${boostReason}!`);

    setTimeout(() => {
      setActiveOvertake((curr) => (curr && Date.now() - curr.timestamp >= 3800 ? null : curr));
    }, 4000);
  }, [selectedDriverIdx, drivers, effectiveLap, momBoostActive, isSoundMuted, setOvertakeEvent]);

  // Listen to external overtake triggers from LiveBroadcastGantry
  useEffect(() => {
    if (triggerOvertakeSignal > 0) {
      handleTriggerDuelOvertake();
    }
  }, [triggerOvertakeSignal, handleTriggerDuelOvertake]);

  // ── Session Restart Handler (triggered by Cockpit Restart/Switch Menu) ──
  useEffect(() => {
    if (restartSignal > 0) {
      setCurrentLap(1);
      setDrivers(resetGridEntries(buildTimingTowerGridForCircuit(activeCircuitId, 1), { includeSectorReset: true }));
      setSelectedDriverIdx(0);
      setSessionFlag("GREEN");
      setOvertakeEvent(`🏁 RACE RESET TO LAP 1: Starting grid reset for ${gpName}. Fresh tires fitted!`);
      setRadioMsg("Green flag, race start! Warmup tires cleanly into Turn 1.");
    }
  }, [restartSignal, activeCircuitId, gpName, setOvertakeEvent]);

  // ── Tactical Pit Stop Execution Triggered from PitWallStrategyDeck ──
  const handleExecutePitStop = ({ driverCode, targetCompound }) => {
    const crew = computePitCrewExecution(drivers.find((d) => d.code === driverCode)?.num || 1, effectiveLap);
    const stationarySec = crew.sec;
    const crewRating = crew.label;
    const trackTransitLoss = sessionFlag === "SC" ? 11.2 : sessionFlag === "VSC" ? 13.0 : (selectedCircuit?.pit_loss_green ? selectedCircuit.pit_loss_green - 2.5 : 19.8);
    const actualPitLoss = +(trackTransitLoss + parseFloat(stationarySec)).toFixed(1);
    const pitStopDurationStr = `${stationarySec}s stationary (${actualPitLoss}s pit loss) · ${crewRating}`;

    const parseGapSec = (gapStr) => {
      if (!gapStr || gapStr === "LEADER") return 0;
      const num = parseFloat(String(gapStr).replace("+", "").replace("s", ""));
      return isNaN(num) ? 0 : num;
    };

    setDrivers((prevDrivers) => {
      const targetDriver = prevDrivers.find((d) => d.code === driverCode);
      if (!targetDriver) return prevDrivers;

      const currentGapSec = targetDriver.gapSec !== undefined ? targetDriver.gapSec : parseGapSec(targetDriver.gap);
      const newGapSec = +(currentGapSec + actualPitLoss).toFixed(3);

      const updated = prevDrivers.map((d) => {
        if (d.code === driverCode) {
          return {
            ...d,
            gapSec: newGapSec,
            pitState: "IN PIT",
            tire: targetCompound,
            tireAge: 0,
            wear: 4,
            pits: (d.pits || 0) + 1,
            lastPitLap: currentLap,
          };
        }
        return {
          ...d,
          gapSec: d.gapSec !== undefined ? d.gapSec : parseGapSec(d.gap),
        };
      });

      // Clear "IN PIT" state after 4 seconds to transition back to RACING without altering positions or gaps
      setTimeout(() => {
        setDrivers((latest) =>
          latest.map((d) => (d.code === driverCode ? { ...d, pitState: "RACING" } : d))
        );
      }, 4000);

      // Sort grid strictly by gapSec so the car drops to the exact re-entry position!
      updated.sort((a, b) => a.gapSec - b.gapSec);

      const leaderGapSec = updated[0].gapSec;

      const finalGrid = updated.map((d, i) => {
        const isLead = i === 0;
        const relativeGap = +(d.gapSec - leaderGapSec).toFixed(3);
        const prevPos = prevDrivers.findIndex((p) => p.code === d.code) + 1;
        const newPos = i + 1;
        const posDiff = prevPos - newPos; // positive = gained, negative = lost

        const prevAhead = i > 0 ? updated[i - 1] : null;
        const intervalVal = isLead
          ? "—"
          : (effectiveLap <= 1 ? "—" : `+${(d.gapSec - (prevAhead?.gapSec || 0)).toFixed(3)}s`);

        return {
          ...d,
          pos: newPos,
          posDelta: posDiff > 0 ? `+${posDiff}` : posDiff < 0 ? `${posDiff}` : "0",
          arrow: posDiff > 0 ? "up" : posDiff < 0 ? "down" : d.arrow || "neutral",
          gap: isLead ? "LEADER" : (effectiveLap <= 1 ? "—" : `+${relativeGap.toFixed(3)}s`),
          gapSec: d.gapSec,
          interval: intervalVal,
          overtaken: posDiff > 0,
        };
      });

      const newTargetIdx = finalGrid.findIndex((d) => d.code === driverCode);
      const newTargetPos = newTargetIdx + 1;
      const carAhead = newTargetIdx > 0 ? finalGrid[newTargetIdx - 1] : null;

      const aheadNotice = carAhead ? ` behind ${carAhead.code} (#${carAhead.num})` : " in clean air";
      const compName = targetCompound === "S" ? "Soft" : targetCompound === "M" ? "Medium" : targetCompound === "I" ? "Intermediate" : targetCompound === "W" ? "Full Wet" : "Hard";
      const eventMsg = `📦 LIVE PIT STOP: LAP ${currentLap}: #${targetDriver.num} ${targetDriver.code} (${targetDriver.team}) BOXES · FITS ${compName} [${pitStopDurationStr}] · REJOINS P${newTargetPos}${aheadNotice}!`;
      setOvertakeEvent(eventMsg);
      setActivePitEvent({
        lap: currentLap,
        num: targetDriver.num,
        code: targetDriver.code,
        name: targetDriver.name,
        team: targetDriver.team,
        tire: targetCompound,
        compoundName: compName,
        stopDuration: pitStopDurationStr,
        reEntryPos: newTargetPos,
        reason: "Tactical Box Command",
      });
      setRadioMsg(`[RADIO #${targetDriver.num}] Box confirm. ${targetCompound} tires fitted. You are P${newTargetPos}${aheadNotice}. Out-lap is cold!`);
      playF1OvertakeChime(isSoundMuted);
      queueMicrotask(() => onCompletePlanStop?.(driverCode, (targetDriver.pits || 0) + 1));

      return finalGrid;
    });
  };

  const pitLossGreen = selectedCircuit?.pit_loss_green || 21.5;
  const driverPlansRef = useRef(driverPlans);
  const plannedStrategiesRef = useRef(plannedStrategies);
  const onCompletePlanStopRef = useRef(onCompletePlanStop);
  const isSoundMutedRef = useRef(isSoundMuted);
  useEffect(() => {
    driverPlansRef.current = driverPlans;
    plannedStrategiesRef.current = plannedStrategies;
    onCompletePlanStopRef.current = onCompletePlanStop;
    isSoundMutedRef.current = isSoundMuted;
  }, [driverPlans, plannedStrategies, onCompletePlanStop, isSoundMuted]);

  // Dynamic Lap Progression: replays real OpenF1 FIA data in Historical mode, or steps clean physics simulation
  useEffect(() => {
    if (controlledLap && controlledLap !== currentLap) {
      setCurrentLap(controlledLap);

      // Historical OpenF1 replay mode
      if (telemetrySource === "openf1" && openF1Dataset?.framesByLap) {
        const clampedLap = Math.min(Math.max(1, controlledLap), openF1Dataset.maxLaps || maxLaps);
        const frame = openF1Dataset.framesByLap[clampedLap] || openF1Dataset.framesByLap[1];
        if (frame && frame.length > 0) {
          setDrivers(frame);
          return;
        }
      }

      setDrivers((prevDrivers) => {
        if (!prevDrivers || prevDrivers.length < 2 || controlledLap <= 1) {
          return buildTimingTowerGridForCircuit(activeCircuitId, 1);
        }

        const circuitCfg = getGrandPrixConfig(activeCircuitId);
        let poleSec = 78.5;
        if (circuitCfg?.poleTime && circuitCfg.poleTime.includes(":")) {
          const [pm, ps] = circuitCfg.poleTime.split(":");
          const parsed = parseFloat(pm) * 60 + parseFloat(ps);
          if (!isNaN(parsed) && parsed > 0) poleSec = parsed;
        }

        const tick = simulateLapTick({
          prevDrivers,
          lap: controlledLap,
          maxLaps,
          poleSec,
          pitLossGreen,
          sessionFlag,
          trackDampness,
          userRole,
          playerTeam,
          driverPlans: driverPlansRef.current,
          plannedStrategies: plannedStrategiesRef.current,
          isDriverInTeam: isDriverBelongingToTeam,
        });

        queueMicrotask(() => {
          tick.completedPlanNotifications?.forEach((n) => {
            onCompletePlanStopRef.current?.(n.code, n.stopNum);
          });

          if (tick.pittedInfo) {
            const p = tick.pittedInfo;
            setActivePitEvent(p);
            setOvertakeEvent(
              `📦 LIVE PIT STOP: LAP ${p.lap}: #${p.num} ${p.code} (${p.team}) BOXES · FITS ${p.compoundName} [${p.stopDuration}] · REJOINS P${p.reEntryPos}${p.aheadNotice}!`
            );
            playF1OvertakeChime(isSoundMutedRef.current);
          } else if (tick.overtakeInfo) {
            const ov = tick.overtakeInfo;
            setActiveOvertake({ ...ov, timestamp: Date.now() });
            playF1OvertakeChime(isSoundMutedRef.current);
            setOvertakeEvent(`LIVE OVERTAKE: LAP ${ov.lap}: ${ov.winnerCode} passes ${ov.loserCode} for P${ov.toPos} (${ov.reason})`);
          }

          setTimeout(() => {
            setActiveOvertake((curr) => (curr && Date.now() - curr.timestamp >= 3500 ? null : curr));
          }, 4000);
        });

        return tick.drivers;
      });
    }
  }, [controlledLap, currentLap, activeCircuitId, pitLossGreen, maxLaps, userRole, playerTeam, sessionFlag, trackDampness, telemetrySource, openF1Dataset, setActivePitEvent, setOvertakeEvent]);

  useEffect(() => {
    if (controlledFlag && controlledFlag !== sessionFlag) {
      setSessionFlag(controlledFlag);
    }
  }, [controlledFlag, sessionFlag]);
  // Pit Wall Operational View: "tower" (Matrix Timing Grid) by default, "lapMatrix" (StatsF1 Tour-par-tour), or "map" (3D Satellite Tracker)
  const [activePitWallTab, setActivePitWallTab] = useState("tower");
  useEffect(() => {
    onMapActiveChange?.(activePitWallTab === "map");
  }, [activePitWallTab, onMapActiveChange]);
  // Timing Matrix Density Mode: "broadcast" (roomy, rich) vs "compact" (fits all 22 drivers without scroll)
  const [tableDensity, setTableDensity] = useState("broadcast");
  // Selected driver reference
  const currentDriver = drivers[selectedDriverIdx] || drivers[0];

  const planSummary = useMemo(() => {
    return buildStrategyPlanSummary({ maxLaps, currentDriver });
  }, [maxLaps, currentDriver]);

  // MOM 350kW Boost Trigger
  const handleTriggerMom = () => {
    if (momCooldown > 0 || momBoostActive) return;
    setMomBoostActive(true);
    setMomCooldown(4);
    setRadioMsg(`[MOM 350kW ENGAGED] Max electric deployment active for #${currentDriver.num} ${currentDriver.code}. Push to overtake!`);
    setOvertakeEvent(`⚡ MOM 350kW BOOST: #${currentDriver.num} ${currentDriver.code} deployed full electrical override!`);
  };

  // Physics-Driven Catch Curve & Overtake Probability Analytics
  const awsOvertakeModel = useMemo(() => {
    return computeCatchAndProbability({
      leader: drivers[0],
      chaser: drivers[1],
      currentLap: effectiveLap,
      maxLaps,
      trackDampness,
    });
  }, [drivers, effectiveLap, maxLaps, trackDampness]);

  // Active Aero toggle
  const handleToggleAero = (mode) => {
    setActiveAeroMode(mode);
    setRadioMsg(`[ACTIVE AERO] Mode switched to ${mode}. Flap actuator angle updated.`);
  };

  // Dynamic Remaining Stint Degradation Projection & Pace Delta Series (computed from live driver state)
  const tireWearData = useMemo(() => {
    return buildLiveTireCurve(currentDriver, effectiveLap, maxLaps);
  }, [currentDriver, effectiveLap, maxLaps]);

  const [telemetryTab, setTelemetryTab] = useState("speed");
  const [customRadioInput, setCustomRadioInput] = useState("");

  const deltaComparisonData = useMemo(() => {
    return buildPaceComparisonSeries(drivers, currentDriver, effectiveLap);
  }, [drivers, currentDriver, effectiveLap]);

  // Quick Tactical Radio Dispatch Helper
  const handleSendRadio = (cmd) => {
    setRadioMsg(cmd);
  };

  return (
    <div className="timing-tower" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", minWidth: 0 }}>
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
        <div role="tablist" aria-label="Pit wall operational views" style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            type="button"
            role="tab"
            aria-selected={activePitWallTab === "tower"}
            onClick={() => setActivePitWallTab("tower")}
            style={{
              background: activePitWallTab === "tower"
                ? "linear-gradient(135deg, rgba(232, 0, 45, 0.35) 0%, rgba(255, 60, 90, 0.2) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "tower" ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderBottom: activePitWallTab === "tower" ? "2px solid #ffffff" : "2px solid transparent",
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
            <span aria-hidden="true">📊</span>
            <span>TIMING MATRIX</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePitWallTab === "lapMatrix"}
            onClick={() => setActivePitWallTab("lapMatrix")}
            style={{
              background: activePitWallTab === "lapMatrix"
                ? "linear-gradient(135deg, rgba(23, 106, 199, 0.4) 0%, rgba(0, 210, 190, 0.25) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "lapMatrix" ? "1px solid #176ac7" : "1px solid rgba(255, 255, 255, 0.1)",
              borderBottom: activePitWallTab === "lapMatrix" ? "2px solid #ffffff" : "2px solid transparent",
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
            <span aria-hidden="true">📈</span>
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
            type="button"
            role="tab"
            aria-selected={activePitWallTab === "map"}
            onClick={() => setActivePitWallTab("map")}
            style={{
              background: activePitWallTab === "map"
                ? "linear-gradient(135deg, rgba(0, 210, 190, 0.35) 0%, rgba(0, 144, 255, 0.22) 100%)"
                : "rgba(255, 255, 255, 0.04)",
              border: activePitWallTab === "map" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderBottom: activePitWallTab === "map" ? "2px solid #ffffff" : "2px solid transparent",
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
            <span aria-hidden="true">🗺️</span>
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
          <div role="group" aria-label="FIA track flag status" style={{ display: "flex", alignItems: "center", gap: "2px", background: "rgba(0,0,0,0.45)", padding: "2px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              aria-pressed={sessionFlag === "GREEN"}
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
              type="button"
              aria-pressed={sessionFlag === "SC"}
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
              type="button"
              aria-pressed={sessionFlag === "VSC"}
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
              type="button"
              onClick={() => setIsFiaModalOpen(true)}
              aria-label="Open FIA Race Control Bulletin modal"
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
              <span aria-hidden="true">📋</span>
              <span>FIA</span>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--neon-cyan)" }} />
            </button>
          </div>

          {/* Lap Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.64rem", color: "var(--text-secondary)" }}>
              LAP {effectiveLap}/{maxLaps} <span style={{ color: "var(--neon-green)", fontWeight: "700" }}>({Math.round((effectiveLap / maxLaps) * 100)}%)</span>
            </span>
            <div style={{ width: "70px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${(effectiveLap / maxLaps) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-green), var(--neon-cyan))", borderRadius: "2px", boxShadow: "0 0 6px var(--neon-green)" }} />
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
            {effectiveLap <= 1 || !fastestLapInfo.driverCode ? (
              <span style={{ color: "var(--text-dim)" }}>NO TIME YET</span>
            ) : (
              <>
                <span style={{ color: "#ffffff", fontWeight: "900" }}>{fastestLapInfo.driverCode}</span>
                <span style={{ color: "#cc44ff" }}>{fastestLapInfo.lapStr}</span>
              </>
            )}
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
            <div role="group" aria-label="Track weather condition simulation" style={{ display: "flex", gap: "2px", marginLeft: "2px" }}>
              {[
                { id: "auto", label: "AUTO" },
                { id: "dry", label: "DRY" },
                { id: "drizzle", label: "DRIZ" },
                { id: "wet", label: "WET" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={weatherMode === m.id}
                  onClick={() => setWeatherMode(m.id)}
                  style={{
                    cursor: "pointer",
                    border: "none",
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
            type="button"
            aria-pressed={activeAeroMode === "X-MODE"}
            onClick={() => handleToggleAero(activeAeroMode === "Z-MODE" ? "X-MODE" : "Z-MODE")}
            style={{
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
            <span aria-hidden="true">🌀</span>
            <span>2026 AERO:</span>
            <span style={{ color: "#ffffff", fontWeight: "900" }}>{activeAeroMode}</span>
          </button>
        </div>
      </div>

      {/* ── Dynamic Race Control / Weather / Overtake & Pit Broadcast Alert Banner ── */}
      {(overtakeEvent || trackDampness > 30) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: trackDampness > 30
              ? "linear-gradient(90deg, rgba(0, 160, 222, 0.22) 0%, rgba(10, 20, 32, 0.96) 100%)"
              : String(overtakeEvent).startsWith("📦")
              ? "linear-gradient(90deg, rgba(255, 215, 0, 0.28) 0%, rgba(24, 20, 10, 0.96) 100%)"
              : "linear-gradient(90deg, rgba(0, 210, 190, 0.22) 0%, rgba(10, 25, 25, 0.96) 100%)",
            border: trackDampness > 30
              ? "1px solid #00a0de"
              : String(overtakeEvent).startsWith("📦")
              ? "1.5px solid #ffd700"
              : "1px solid var(--neon-cyan)",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "0.72rem",
            fontFamily: "'Orbitron', monospace",
            color: "#ffffff",
            boxShadow: String(overtakeEvent).startsWith("📦")
              ? "0 0 18px rgba(255, 215, 0, 0.45)"
              : "0 2px 14px rgba(0,0,0,0.6)",
            animation: "pulseOvertake 2s infinite ease-in-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>
              {trackDampness > 30 ? "🌧️" : String(overtakeEvent).startsWith("📦") ? "📦" : "⚔️"}
            </span>
            <span
              style={{
                fontWeight: "900",
                color: trackDampness > 30
                  ? "#60a5fa"
                  : String(overtakeEvent).startsWith("📦")
                  ? "#ffd700"
                  : "var(--neon-cyan)",
                letterSpacing: "0.03em",
              }}
            >
              {trackDampness > 30
                ? `Track dampness ${trackDampness}%. Slicks degraded by +3.5s/lap. Intermediate/Wet crossover active!`
                : overtakeEvent}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "0.60rem",
                color: String(overtakeEvent).startsWith("📦") ? "#ffd700" : "var(--neon-green)",
                background: String(overtakeEvent).startsWith("📦") ? "rgba(255, 215, 0, 0.2)" : "rgba(0,204,68,0.2)",
                padding: "2px 7px",
                borderRadius: "3px",
                fontWeight: "800",
                border: String(overtakeEvent).startsWith("📦") ? "1px solid rgba(255, 215, 0, 0.45)" : "none",
              }}
            >
              {String(overtakeEvent).startsWith("📦") ? "FIA PIT CONTROL" : "FIA RACE CONTROL"}
            </span>
            {overtakeEvent && (
              <button
                type="button"
                aria-label="Dismiss race control alert"
                onClick={() => setOvertakeEvent(null)}
                style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", padding: "0 4px", fontWeight: "900" }}
                title="Dismiss alert"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {activePitWallTab === "map" ? (
        <ComponentErrorBoundary name="3D Satellite Radar">
          <LiveRaceMapTracker
            selectedCircuit={selectedCircuit}
            drivers={drivers}
            currentLap={effectiveLap}
            maxLaps={maxLaps}
            sessionFlag={sessionFlag}
            isAutoSimulating={isAutoSimulating}
            simSpeed={simSpeed}
            onToggleAutoSim={onToggleAutoSim}
            onChangeSimSpeed={onChangeSimSpeed}
            onAdvanceLap={onAdvanceLap}
            userRole={userRole}
            playerTeam={playerTeam}
          />
        </ComponentErrorBoundary>
      ) : activePitWallTab === "lapMatrix" ? (
        <ComponentErrorBoundary name="StatsF1 Lap Chart">
          <StatsF1LapMatrix
            drivers={drivers}
            currentLap={effectiveLap}
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
        </ComponentErrorBoundary>
      ) : (
        <>
          {/* ════════ FRONT / UPPER COCKPIT: 2-COLUMN LAYOUT (LEFT SIDEBAR + TIMING TOWER) ════════ */}
          <div className="timing-workspace" style={{ display: "grid", gridTemplateColumns: "302px minmax(0, 1fr)", gap: "12px", alignItems: "start", width: "100%" }}>

        <TimingSidebarTelemetry
          activeCircuitId={activeCircuitId}
          activeTrackPath={activeTrackPath}
          drivers={drivers}
          effectiveLap={effectiveLap}
          trackDampness={trackDampness}
          activeAeroMode={activeAeroMode}
          onToggleAero={handleToggleAero}
          momBoostActive={momBoostActive}
          onTriggerMom={handleTriggerMom}
          momCooldown={momCooldown}
          currentDriver={currentDriver}
          awsOvertakeModel={awsOvertakeModel}
          telemetryTab={telemetryTab}
          onChangeTelemetryTab={setTelemetryTab}
        />

        {/* ──── COLUMN 2: 2026 MASTER TIMING TOWER MATRIX (SPACIOUS TABLE) ──── */}
        <div
          className="timing-panel"
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
            <div role="toolbar" aria-label="Timing tower controls and data source" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {/* Data Source Switcher: Physics Model vs Real FIA OpenF1 Replay */}
              <div role="group" aria-label="Telemetry Source Mode" style={{ display: "inline-flex", background: "rgba(0,0,0,0.45)", padding: "2px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", gap: "2px" }}>
                <button
                  type="button"
                  aria-pressed={telemetrySource === "sim"}
                  onClick={() => handleSelectTelemetrySource("sim")}
                  style={{
                    background: telemetrySource === "sim" ? "rgba(0, 210, 190, 0.24)" : "transparent",
                    border: telemetrySource === "sim" ? "1px solid var(--neon-cyan)" : "1px solid transparent",
                    color: telemetrySource === "sim" ? "#ffffff" : "var(--text-dim)",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.58rem",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                  title="Run deterministic 2026 physics race engine"
                >
                  ⚙️ 2026 SIM
                </button>
                <button
                  type="button"
                  aria-pressed={telemetrySource === "openf1"}
                  onClick={() => handleSelectTelemetrySource("openf1")}
                  style={{
                    background: telemetrySource === "openf1" ? "rgba(0, 230, 118, 0.24)" : "transparent",
                    border: telemetrySource === "openf1" ? "1px solid var(--neon-green)" : "1px solid transparent",
                    color: telemetrySource === "openf1" ? "#ffffff" : "var(--text-dim)",
                    borderRadius: "3px",
                    padding: "2px 6px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.58rem",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                  title="Load actual historical FIA lap data from OpenF1 API (2024 season)"
                >
                  {isOpenF1Loading ? "⏳ LOADING..." : "📡 FIA 2024"}
                </button>
              </div>

              {/* CSV Export Action */}
              <button
                type="button"
                onClick={() => {
                  const headers = ["Pos", "No", "Code", "Driver", "Team", "Tire", "StintLaps", "WearPct", "Gap", "Interval", "S1", "S2", "S3", "BestLap", "Pits"];
                  const rows = drivers.map((d) => [d.pos, d.num, d.code, d.name, d.team, d.tire, d.tireAge || 0, d.wear || 0, d.gap, d.interval, d.s1, d.s2, d.s3, d.bestLap, d.pits || 0]);
                  downloadCsvFile(`timing_${activeCircuitId}_lap${effectiveLap}`, headers, rows);
                  setDataSourceStatus(`Exported Lap ${effectiveLap} timing CSV (${rows.length} cars)`);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                  borderRadius: "4px",
                  padding: "3px 7px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.60rem",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
                title="Export live timing matrix to RFC-4180 CSV"
              >
                ⬇ CSV
              </button>

              {/* Shortcut to Strategy Command Room */}
              {onGoToStrategy && (
                <button
                  onClick={onGoToStrategy}
                  title="Open Strategy Room to command pit stops, view re-entry radar, and manage stint plans"
                  style={{
                    background: "linear-gradient(135deg, rgba(232,0,45,0.28) 0%, rgba(20,24,36,0.95) 100%)",
                    border: "1px solid rgba(232,0,45,0.6)",
                    color: "#ffffff",
                    borderRadius: "4px",
                    padding: "3px 9px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.62rem",
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 0 10px rgba(232,0,45,0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>PIT STRATEGY ROOM →</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                type="button"
                aria-label={isSoundMuted ? "Unmute race audio alerts" : "Mute race audio alerts"}
                aria-pressed={isSoundMuted}
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
                <span>ALL 22 CARS</span>
              </button>
            </div>
          </div>

          {/* ── AUTHENTIC AWS-STYLE PREDICTIVE OVERTAKE MODEL RIBBON ── */}
          <div
            className="aws-predictive-model-ribbon"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(90deg, rgba(14, 20, 35, 0.95) 0%, rgba(22, 30, 50, 0.95) 50%, rgba(14, 20, 35, 0.95) 100%)",
              border: "1px solid rgba(255, 153, 0, 0.35)",
              borderLeft: "4px solid #ff9900",
              borderRadius: "5px",
              padding: "6px 14px",
              margin: "6px 0 8px 0",
              gap: "14px",
              flexWrap: "wrap",
              boxShadow: "0 2px 14px rgba(0, 0, 0, 0.55), inset 0 0 16px rgba(255, 153, 0, 0.05)",
            }}
          >
            {/* Left: Real-Time Analytics Engine Indicator & Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: telemetrySource === "openf1" ? "rgba(0, 230, 118, 0.14)" : "rgba(255, 153, 0, 0.15)",
                  border: telemetrySource === "openf1" ? "1px solid var(--neon-green)" : "1px solid #ff9900",
                  padding: "2px 7px",
                  borderRadius: "3px",
                }}
              >
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "0.62rem", fontWeight: "900", color: telemetrySource === "openf1" ? "var(--neon-green)" : "#ff9900", letterSpacing: "0.08em" }}>
                  {telemetrySource === "openf1" ? "OPENF1 LIVE REPLAY" : "RACE PHYSICS"}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: "800", color: "#ffffff" }}>
                  TELEMETRY ANALYTICS
                </span>
              </div>

              {dataSourceStatus && (
                <p role="status" style={{ margin: 0, fontSize: "0.62rem", fontFamily: "'JetBrains Mono', monospace", color: "var(--neon-cyan)" }}>
                  {dataSourceStatus}
                </p>
              )}
            </div>

            {/* Right: Live Predictive Metrics - Next to the buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "0.62rem",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
                flexWrap: "wrap",
              }}
            >
              {/* Catch Curve */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>Catch Curve:</span>
                <strong style={{ color: "#ffffff", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {awsOvertakeModel.catchCurve}
                </strong>
              </div>

              <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>

              {/* Overtake Probability Index */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>Overtake Probability Index:</span>
                <strong
                  style={{
                    color: "#00e676",
                    background: "rgba(0, 230, 118, 0.12)",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: "1px solid rgba(0, 230, 118, 0.35)",
                  }}
                >
                  {awsOvertakeModel.probability}
                </strong>
              </div>

              <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>

              {/* Tire Life Delta */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>Tire Life Delta:</span>
                <strong
                  style={{
                    color: "#ffd700",
                    background: "rgba(255, 215, 0, 0.10)",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: "1px solid rgba(255, 215, 0, 0.3)",
                  }}
                >
                  {awsOvertakeModel.tireDelta}
                </strong>
              </div>
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

          {/* ── AUTHENTIC F1 TV BROADCAST PIT STOP LOWER-THIRD BANNER ── */}
          {activePitEvent && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, #090e1a 0%, #1e1b2e 50%, #090e1a 100%)",
                border: "2px solid #ffd700",
                borderLeft: "8px solid #ffd700",
                borderRadius: "6px",
                padding: "8px 14px",
                boxShadow: "0 0 24px rgba(255, 215, 0, 0.45), 0 8px 32px rgba(0,0,0,0.8)",
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
                  <span style={{ fontSize: "1.1rem" }}>📦</span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.82rem",
                      fontWeight: "900",
                      color: "#ffffff",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PIT STOP · LAP {activePitEvent.lap}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "rgba(255, 215, 0, 0.22)",
                      border: "1px solid #ffd700",
                      color: "#ffd700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      fontSize: "0.78rem",
                      boxShadow: "0 0 8px rgba(255, 215, 0, 0.4)",
                    }}
                  >
                    #{activePitEvent.num} {activePitEvent.code} ({activePitEvent.team})
                  </span>

                  <span style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: "700" }}>
                    BOXES · FITS
                  </span>

                  <span
                    style={{
                      background:
                        activePitEvent.tire === "S"
                          ? "rgba(255, 24, 1, 0.25)"
                          : activePitEvent.tire === "M"
                          ? "rgba(255, 215, 0, 0.25)"
                          : "rgba(255, 255, 255, 0.2)",
                      border: `1px solid ${
                        activePitEvent.tire === "S"
                          ? "#ff1801"
                          : activePitEvent.tire === "M"
                          ? "#ffd700"
                          : "#ffffff"
                      }`,
                      color: "#ffffff",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      fontSize: "0.78rem",
                    }}
                  >
                    {activePitEvent.tire} ({activePitEvent.compoundName}) · {activePitEvent.stopDuration}
                  </span>

                  <span
                    style={{
                      color: "var(--neon-cyan)",
                      fontSize: "0.75rem",
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: "700",
                    }}
                  >
                    · Rejoins P{activePitEvent.reEntryPos} ({activePitEvent.reason})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActivePitEvent(null)}
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

          {/* ── SAFETY CAR TACTICAL FREE PIT WINDOW DILEMMA CARD ── */}
          {(sessionFlag === "SC" || sessionFlag === "VSC" || controlledFlag === "SC" || controlledFlag === "VSC") && dismissedScLap !== currentLap && (
            <div
              style={{
                background: "linear-gradient(90deg, rgba(34, 28, 10, 0.98) 0%, rgba(20, 18, 12, 0.98) 100%)",
                border: "2px solid #ffd700",
                borderLeft: "8px solid #ffd700",
                borderRadius: "6px",
                padding: "10px 14px",
                boxShadow: "0 0 24px rgba(255, 215, 0, 0.4), 0 8px 30px rgba(0,0,0,0.8)",
                margin: "4px 0 8px 0",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                animation: "f1BroadcastBannerIn 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem", animation: "f1PillPulse 1s infinite" }}>🟡</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "#ffd700", letterSpacing: "0.06em" }}>
                      SAFETY CAR TACTICAL WINDOW OPEN · LAP {currentLap}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#d0d5e5", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                      Free pit stop delta! Pitting now costs only ~13.5s (Save 9.0s vs green flag pit stop).
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.64rem", color: "#ffd700", background: "rgba(255,215,0,0.15)", border: "1px solid #ffd700", padding: "2px 8px", borderRadius: "3px", fontWeight: "800" }}>
                    DELTA ADVANTAGE: +9.0s
                  </span>
                  <button
                    onClick={() => setDismissedScLap(currentLap)}
                    style={{ background: "transparent", border: "none", color: "#a0a5b8", cursor: "pointer", fontSize: "0.95rem", fontWeight: "700" }}
                    title="Dismiss SC Window card"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Action Buttons for Player Drivers */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {playerTeamDrivers.map((driver) => {
                  const isPitted = driver.pitState === "IN PIT";
                  const targetComp = driver.tire === "M" ? "H" : "M";
                  return (
                    <div
                      key={driver.code}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,215,0,0.35)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: "#ffffff" }}>
                        #{driver.num} {driver.code} (P{driver.pos} · {driver.tireAge}L {driver.tire}):
                      </span>
                      <button
                        onClick={() => handleExecutePitStop({ driverCode: driver.code, targetCompound: targetComp })}
                        disabled={isPitted}
                        style={{
                          background: "linear-gradient(90deg, #ffd700 0%, #ffaa00 100%)",
                          border: "none",
                          color: "#000000",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.66rem",
                          fontWeight: "900",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          cursor: isPitted ? "not-allowed" : "pointer",
                          boxShadow: "0 0 10px rgba(255,215,0,0.5)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>📦</span>
                        <span>BOX FOR {targetComp === "H" ? "HARD" : targetComp === "M" ? "MEDIUM" : targetComp === "W" ? "FULL WET" : targetComp === "I" ? "INTERMEDIATE" : "SOFT"}</span>
                      </button>
                      <button
                        onClick={() => setDismissedScLap(currentLap)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#d0d5e5",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.62rem",
                          fontWeight: "800",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        🛡️ STAY OUT
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CRITICAL TIRE CLIFF WARNING DILEMMA ── */}
          {(() => {
            const cliffDriver = playerTeamDrivers.find((d) => (d.wear || 20) >= 70 && d.pitState !== "IN PIT" && dismissedCliffDriverCode !== d.code);
            if (!cliffDriver) return null;
            const targetComp = cliffDriver.pits >= 1 ? "H" : "M";
            return (
              <div
                style={{
                  background: "linear-gradient(90deg, rgba(42, 14, 18, 0.98) 0%, rgba(24, 10, 14, 0.98) 100%)",
                  border: "2px solid #ff1801",
                  borderLeft: "8px solid #ff1801",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  boxShadow: "0 0 24px rgba(255, 24, 1, 0.45), 0 8px 30px rgba(0,0,0,0.8)",
                  margin: "4px 0 8px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  animation: "f1BroadcastBannerIn 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.3rem", animation: "f1PillPulse 0.8s infinite" }}>🚨</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "#ff4d4d", letterSpacing: "0.05em" }}>
                      CRITICAL TIRE CLIFF: #{cliffDriver.num} {cliffDriver.code} AT {cliffDriver.wear}% WEAR!
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#d0d5e5", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                      Grip cliff active: losing ~1.2s/lap! Rivals with fresh rubber are closing in rapidly.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => handleExecutePitStop({ driverCode: cliffDriver.code, targetCompound: targetComp })}
                    style={{
                      background: "linear-gradient(90deg, #ff1801 0%, #ff5555 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.68rem",
                      fontWeight: "900",
                      padding: "5px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: "0 0 12px rgba(255, 24, 1, 0.6)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>⚡</span>
                    <span>EMERGENCY BOX THIS LAP ({targetComp === "H" ? "HARD" : "MEDIUM"})</span>
                  </button>
                  <button
                    onClick={() => setDismissedCliffDriverCode(cliffDriver.code)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#d0d5e5",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.62rem",
                      fontWeight: "800",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ⚠️ GAMBLE & EXTEND
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ── PIT WALL PUSH DIRECTIVES & QUICK-COMMAND BAR ── */}
          {playerTeamDrivers.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, rgba(16, 22, 36, 0.95) 0%, rgba(12, 16, 28, 0.95) 100%)",
                border: "1px solid rgba(0, 210, 190, 0.35)",
                borderRadius: "6px",
                padding: "6px 12px",
                margin: "4px 0 8px 0",
                flexWrap: "wrap",
                gap: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--neon-cyan)" }}>⚙</span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "var(--neon-cyan)", letterSpacing: "0.06em" }}>
                  PIT WALL TACTICAL DIRECTIVES:
                </span>
                <span style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Rajdhani', sans-serif" }}>
                  (Command pace & tire degradation live from the pit wall)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                {playerTeamDrivers.map((driver) => {
                  const currentPush = driverPlans?.[driver.code]?.pushMode || "balanced";
                  return (
                    <div key={driver.code} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: "900", color: "#ffffff" }}>
                        #{driver.num} {driver.code}:
                      </span>
                      <div style={{ display: "flex", gap: "3px" }}>
                        <button
                          onClick={() => onUpdateDriverPlan && onUpdateDriverPlan(driver.code, { pushMode: "attack" })}
                          style={{
                            background: currentPush === "attack" ? "linear-gradient(90deg, #ff1801, #ff5555)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${currentPush === "attack" ? "#ff1801" : "rgba(255,255,255,0.12)"}`,
                            color: currentPush === "attack" ? "#ffffff" : "var(--text-secondary)",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.58rem",
                            fontWeight: "900",
                            padding: "2px 7px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            boxShadow: currentPush === "attack" ? "0 0 10px rgba(255,24,1,0.5)" : "none",
                            transition: "all 0.15s ease",
                          }}
                          title="Attack: -0.38s lap pace advantage, 1.55x tire degradation rate"
                        >
                          ATTACK
                        </button>
                        <button
                          onClick={() => onUpdateDriverPlan && onUpdateDriverPlan(driver.code, { pushMode: "balanced" })}
                          style={{
                            background: currentPush === "balanced" ? "linear-gradient(90deg, #00e676, #00b0ff)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${currentPush === "balanced" ? "#00e676" : "rgba(255,255,255,0.12)"}`,
                            color: currentPush === "balanced" ? "#000000" : "var(--text-secondary)",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.58rem",
                            fontWeight: "900",
                            padding: "2px 7px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            boxShadow: currentPush === "balanced" ? "0 0 10px rgba(0,230,118,0.5)" : "none",
                            transition: "all 0.15s ease",
                          }}
                          title="Balanced: Target delta pace, standard 1.0x tire wear"
                        >
                          BALANCED
                        </button>
                        <button
                          onClick={() => onUpdateDriverPlan && onUpdateDriverPlan(driver.code, { pushMode: "conserve" })}
                          style={{
                            background: currentPush === "conserve" ? "linear-gradient(90deg, #00d2be, #0088ff)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${currentPush === "conserve" ? "#00d2be" : "rgba(255,255,255,0.12)"}`,
                            color: currentPush === "conserve" ? "#ffffff" : "var(--text-secondary)",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.58rem",
                            fontWeight: "900",
                            padding: "2px 7px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            boxShadow: currentPush === "conserve" ? "0 0 10px rgba(0,210,190,0.5)" : "none",
                            transition: "all 0.15s ease",
                          }}
                          title="Conserve: +0.32s lap pace delta, saves 35% tire wear"
                        >
                          CONSERVE
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unified Accessible Table with Sticky Header */}
          <div
            className="timing-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="2026 Live Timing Tower"
            style={{
              maxHeight: tableDensity === "compact" ? "680px" : "635px",
              overflowY: "auto",
              overflowX: "auto",
              width: "100%",
              maxInlineSize: "100%",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(8, 10, 16, 0.6)",
              transition: "max-height 0.2s ease",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "740px",
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
                    fontSize: tableDensity === "compact" ? "0.60rem" : "0.62rem",
                    fontFamily: "'Orbitron', monospace",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "30px", textAlign: "center" }}>POS</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "28px", textAlign: "center" }}>NO</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 4px" : "6px 4px", minWidth: "140px", textAlign: "left" }}>DRIVER</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "58px", textAlign: "center" }}>TYRE / AGE</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "58px", textAlign: "right" }}>GAP</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "60px", textAlign: "right" }}>INT</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "48px", textAlign: "center", color: "#cc44ff" }}>S1</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "48px", textAlign: "center", color: "#00e676" }}>S2</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "48px", textAlign: "center", color: "#ffeb3b" }}>S3</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "64px", textAlign: "center", color: "var(--neon-cyan)" }}>2026 SOC</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "66px", textAlign: "center" }}>ACTIVE AERO</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "64px", textAlign: "center" }}>BEST</th>
                  <th style={{ padding: tableDensity === "compact" ? "5px 2px" : "6px 3px", width: "32px", textAlign: "center" }}>PITS</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, index) => {
                  const isSelected = index === selectedDriverIdx;
                  const teamConf = TEAM_CONFIG[d.team] || { bg: "#222", text: "#fff", label: d.team };
                  const logoUrl = getTeamLogo(d.team);
                  const isCompact = tableDensity === "compact";

                  // Driver Team Ownership Flag (Row-level Scope)
                  const safePlayerTeam = playerTeam || localStorage.getItem("gp_strategy_team") || "Ferrari";
                  const isDriverOnPlayerTeam =
                    userRole === "fia" || isDriverBelongingToTeam(d, safePlayerTeam);

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
                      <td style={{ padding: isCompact ? "2.5px 4px" : "4px 6px", minWidth: "152px" }}>
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

                          {/* Unified Strategy Directive & Push Mode Pill (Zero-collision single pill) */}
                          {(() => {
                            if (!isDriverOnPlayerTeam) return null;

                            const plannedStop = plannedStrategies?.find((s) => s.driverCode === d.code && !s.applied);
                            const pushMode = driverPlans?.[d.code]?.pushMode || "balanced";
                            const pushLabel = pushMode === "attack" ? "ATK" : pushMode === "conserve" ? "CNS" : "BAL";
                            const pushIcon = pushMode === "attack" ? "⚡" : pushMode === "conserve" ? "🛡️" : "🎯";
                            const pushColor = pushMode === "attack" ? "#ff5555" : pushMode === "conserve" ? "#00f0ff" : "#00e676";

                            if (!plannedStop) {
                              if ((d.pits || 0) >= 1) {
                                return (
                                  <span
                                    style={{
                                      fontSize: "0.56rem",
                                      fontFamily: "'Orbitron', monospace",
                                      fontWeight: "800",
                                      background: "rgba(0, 230, 118, 0.12)",
                                      border: "1px solid rgba(0, 230, 118, 0.45)",
                                      color: "var(--neon-green)",
                                      padding: "1px 5px",
                                      borderRadius: "3px",
                                      letterSpacing: "0.03em",
                                      lineHeight: 1.2,
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                    }}
                                    title="Mandatory 2-compound rule satisfied. Stint is safe to checkered flag."
                                  >
                                    🏁 NO PIT · <span style={{ color: pushColor, fontWeight: "900" }}>{pushIcon} {pushLabel}</span>
                                  </span>
                                );
                              }
                              return (
                                <span
                                  style={{
                                    fontSize: "0.56rem",
                                    fontFamily: "'Orbitron', monospace",
                                    fontWeight: "800",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: `1px solid ${pushColor}55`,
                                    color: pushColor,
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    letterSpacing: "0.03em",
                                    lineHeight: 1.2,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                  }}
                                  title={`Driver Push Mode: ${pushMode.toUpperCase()}`}
                                >
                                  {pushIcon} {pushLabel}
                                </span>
                              );
                            }

                            const isThisLap = controlledLap === plannedStop.lap;
                            return (
                              <span
                                style={{
                                  fontSize: "0.56rem",
                                  fontFamily: "'Orbitron', monospace",
                                  fontWeight: "800",
                                  background: isThisLap ? "rgba(232, 0, 45, 0.35)" : "rgba(0, 210, 190, 0.12)",
                                  border: `1px solid ${isThisLap ? "var(--neon-red)" : "rgba(0, 210, 190, 0.45)"}`,
                                  color: isThisLap ? "#ffffff" : "var(--neon-cyan)",
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  letterSpacing: "0.03em",
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                  animation: isThisLap ? "f1PulseOvertakeRed 1.2s infinite" : "none",
                                }}
                                title={`Planned pit stop from Strategy Room at Lap ${plannedStop.lap} (${plannedStop.targetCompound})`}
                              >
                                {isThisLap ? `🚨 BOX L${plannedStop.lap}!` : `🎯 L${plannedStop.lap} (${plannedStop.targetCompound})`} · <span style={{ color: pushColor, fontWeight: "900" }}>{pushIcon} {pushLabel}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Tyre / Age & Remaining Life % */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 4px", width: "64px", minWidth: "60px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "2px" }}>
                          <TireWheel compound={d.tire} laps={d.tireAge} />
                          <span
                            style={{
                              fontSize: "0.56rem",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "800",
                              color: (d.wear || 20) > 70 ? "#ff2a2a" : (d.wear || 20) > 45 ? "#ffaa00" : "#00e676",
                              letterSpacing: "0.02em",
                              lineHeight: 1,
                            }}
                            title={`Tire Life Remaining: ${Math.max(0, 100 - (d.wear || 20))}%`}
                          >
                            {Math.max(0, 100 - (d.wear || 20))}%
                          </span>
                        </div>
                      </td>

                      {/* Gap to Leader */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 4px", width: "62px", minWidth: "58px", textAlign: "right" }}>
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
                        ) : effectiveLap <= 1 ? (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: isCompact ? "0.72rem" : "0.76rem",
                              fontWeight: "700",
                              color: d.pos === 1 ? "var(--neon-cyan)" : "rgba(255, 255, 255, 0.35)",
                            }}
                          >
                            {d.pos === 1 ? "LEADER" : "—"}
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
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 4px", width: "62px", minWidth: "58px", textAlign: "right" }}>
                        {d.pitState === "IN PIT" ? (
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.62rem" : "0.68rem", color: "#ffaa00", fontWeight: "800" }}>
                            BOX BOX
                          </span>
                        ) : effectiveLap <= 1 ? (
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.70rem" : "0.74rem", color: "rgba(255, 255, 255, 0.35)", fontWeight: "600" }}>
                            —
                          </span>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontFamily: "'Orbitron', monospace", fontSize: isCompact ? "0.70rem" : "0.74rem", color: "#e8e8f0" }}>
                            <span>{d.pos === 1 ? "—" : d.interval}</span>
                            {d.pos > 1 && d.interval !== "—" && (
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
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", textAlign: "center" }}>
                        <SectorBadge time={effectiveLap <= 1 ? "—" : d.s1} type={effectiveLap <= 1 ? "empty" : d.s1Type} />
                      </td>

                      {/* Sector 2 */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", textAlign: "center" }}>
                        <SectorBadge time={effectiveLap <= 1 ? "—" : d.s2} type={effectiveLap <= 1 ? "empty" : d.s2Type} />
                      </td>

                      {/* Sector 3 */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", textAlign: "center" }}>
                        <SectorBadge time={effectiveLap <= 1 ? "—" : d.s3} type={effectiveLap <= 1 ? "empty" : d.s3Type} />
                      </td>

                      {/* 2026 MGU-K Hybrid SOC Battery % */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}>
                          <HybridSocBar soc={d.soc} />
                        </div>
                      </td>

                      {/* Active Aero Status */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", width: "68px", minWidth: "64px", textAlign: "center" }}>
                        {(() => {
                          const gapNum = parseFloat(String(d.interval).replace("+", "").replace("s", ""));
                          const isDrs = d.pos > 1 && !isNaN(gapNum) && gapNum > 0 && gapNum < 1.000;
                          return <AeroBadge mom={d.mom} isDrs={isDrs} />;
                        })()}
                      </td>

                      {/* Best Lap */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 3px", textAlign: "center" }}>
                        {effectiveLap <= 1 ? (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: isCompact ? "0.68rem" : "0.72rem",
                              fontWeight: "600",
                              color: "rgba(255, 255, 255, 0.35)",
                            }}
                          >
                            NO TIME
                          </span>
                        ) : (
                          (() => {
                            const isOverallFastest = d.code === fastestLapInfo.driverCode && d.bestLap && d.bestLap !== "NO TIME" && d.bestLap !== "—";
                            return (
                              <span
                                style={{
                                  fontFamily: "'Orbitron', monospace",
                                  fontSize: isCompact ? "0.68rem" : "0.72rem",
                                  fontWeight: isOverallFastest ? "900" : "700",
                                  color: isOverallFastest ? "#cc44ff" : "rgba(255,255,255,0.85)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  padding: isOverallFastest ? "1px 6px" : "0",
                                  background: isOverallFastest ? "rgba(204, 68, 255, 0.16)" : "transparent",
                                  border: isOverallFastest ? "1px solid rgba(204, 68, 255, 0.45)" : "none",
                                  borderRadius: "4px",
                                  boxShadow: isOverallFastest ? "0 0 10px rgba(204, 68, 255, 0.3)" : "none",
                                }}
                                title={isOverallFastest ? "Fastest Lap of the Grand Prix (+1 Bonus Point)" : undefined}
                              >
                                {isOverallFastest && <span style={{ fontSize: "0.60rem" }}>🟣</span>}
                                {d.bestLap || "—"}
                              </span>
                            );
                          })()
                        )}
                      </td>

                      {/* Pit Stops */}
                      <td style={{ padding: isCompact ? "2px 3px" : "4px 4px", textAlign: "center" }}>
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
                aria-label="Race lap scrubber"
                min="1"
                max={maxLaps}
                value={effectiveLap}
                onChange={(e) => {
                  const target = Number(e.target.value);
                  if (onSetLap) onSetLap(target);
                  else setCurrentLap(target);
                }}
                style={{ width: "130px", cursor: "pointer", accentColor: "var(--neon-red)" }}
              />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "#fff", fontWeight: "800" }}>
                {effectiveLap}/{maxLaps}
              </span>
              {(() => {
                const running = onToggleAutoSim ? isAutoSimulating : isPlaying;
                return (
                  <button
                    type="button"
                    aria-pressed={running}
                    onClick={() => (onToggleAutoSim ? onToggleAutoSim() : setIsPlaying((p) => !p))}
                    style={{
                      background: running ? "var(--neon-red)" : "var(--neon-green)",
                      color: running ? "#fff" : "#000",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: running ? "0 0 10px rgba(232,0,45,0.4)" : "0 0 10px rgba(0,204,68,0.4)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {running ? "⏸ PAUSE" : "▶ PLAY"}
                  </button>
                );
              })()}
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
              WINDOW OPEN: L{planSummary.planAStopLap}
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
                <TireBadgePill compound="M" label={planSummary.planALabel1} />
                <span style={{ color: "var(--neon-cyan)", fontSize: "0.70rem" }}>➔</span>
                <TireBadgePill compound="H" label={planSummary.planALabel2} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
                <span>Pit Loss: ~{pitLossGreen}s</span>
                <span style={{ color: "var(--neon-cyan)", fontWeight: "700" }}>Target In-Lap: L{planSummary.planAStopLap}</span>
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
                <TireBadgePill compound="S" label={planSummary.planBLabel1} />
                <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
                <TireBadgePill compound="M" label={planSummary.planBLabel2} />
                <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
                <TireBadgePill compound="S" label={planSummary.planBLabel3} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
                <span>Pit Loss: ~{(pitLossGreen * 1.9).toFixed(1)}s</span>
                <span style={{ color: "#ffaa00", fontWeight: "700" }}>Req. +1.4s Delta</span>
              </div>
            </div>
          </div>

          {/* Tyre Degradation Curve Recharts Graph */}
          <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>PROJECTED STINT GRIP CURVE</span>
              <span style={{ color: (currentDriver.wear || 0) > 65 ? "var(--neon-red)" : "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                Grip: {Math.max(0, 100 - (currentDriver.wear || 0))}% {(currentDriver.wear || 0) > 65 ? "(CLIFF)" : "(OPTIMAL)"}
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
                <YAxis domain={[0, 100]} stroke="#666" tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ background: "#0c0e18", border: "1px solid var(--neon-cyan)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 12px rgba(0,0,0,0.8)" }}>
                          <div style={{ color: "var(--neon-cyan)" }}>{label}</div>
                          <div>Est. Grip: <strong style={{ color: "#ffffff" }}>{payload[0].value}%</strong></div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={28} stroke="#ff3b30" strokeDasharray="3 3" label={{ value: "CLIFF", fill: "#ff3b30", fontSize: 8, position: "insideTopRight" }} />
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
              <div style={{ fontSize: "0.85rem", color: planSummary.estRemainingLaps <= 4 ? "var(--neon-red)" : planSummary.estRemainingLaps <= 10 ? "#ffaa00" : "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
                {planSummary.estRemainingLaps} LAPS
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
            {(() => {
              const p1Car = drivers[0] || { code: "VER", num: 3 };
              const p2Car = drivers[1] || { code: "NOR", num: 1 };
              const isSelectedP1 = currentDriver.code === p1Car.code;
              const deltaText = String(currentDriver.gap && currentDriver.gap !== "LEADER" ? currentDriver.gap : (currentDriver.interval || "—"));
              return (
                <>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                    {isSelectedP1 ? `PACE DELTA: ${p1Car.code} (P1) vs ${p2Car.code} (P2)` : `PACE DELTA: ${currentDriver.code} vs P1 (${p1Car.code})`}
                  </span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: isSelectedP1 ? "var(--neon-green)" : deltaText.startsWith("-") ? "var(--neon-green)" : "var(--neon-cyan)", fontWeight: "700" }}>
                    {isSelectedP1 ? `LEAD (${p2Car.interval || "—"} AHEAD)` : `Δ ${deltaText}`}
                  </span>
                </>
              );
            })()}
          </div>

          <div style={{ display: "flex", gap: "10px", fontSize: "0.64rem", fontFamily: "'Orbitron', monospace" }}>
            {(() => {
              const p1Car = drivers[0] || { code: "VER", num: 3 };
              const p2Car = drivers[1] || { code: "NOR", num: 1 };
              const isSelectedP1 = currentDriver.code === p1Car.code;
              return (
                <>
                  <span style={{ color: "#ff8700" }}>— P1 LEADER ({p1Car.code})</span>
                  <span style={{ color: "var(--neon-cyan)" }}>
                    — {isSelectedP1 ? `${p2Car.code} (#${p2Car.num} P2)` : `${currentDriver.code} (#${currentDriver.num})`}
                  </span>
                </>
              );
            })()}
          </div>

          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={deltaComparisonData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="lap" stroke="#555" tick={{ fontSize: 9 }} />
              <YAxis domain={['auto', 'auto']} stroke="#555" tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const p1Car = drivers[0] || { code: "VER" };
                    const p2Car = drivers[1] || { code: "NOR" };
                    const isSelectedP1 = currentDriver.code === p1Car.code;
                    return (
                      <div style={{ background: "#0c0d16", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 9px", borderRadius: "5px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 14px rgba(0,0,0,0.85)" }}>
                        <div style={{ color: "var(--neon-cyan)", fontWeight: "800", marginBottom: "3px" }}>{label}</div>
                        <div style={{ color: "#ff8700" }}>P1 ({p1Car.code}): {data.leaderTime}</div>
                        <div style={{ color: "var(--neon-green)" }}>
                          {isSelectedP1 ? `${p2Car.code} (P2)` : currentDriver.code}: {data.selectedTime}
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
              <Line type="monotone" dataKey="Selected" stroke="#00d2be" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Telemetry Pace Summary Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "2px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>GAP DELTA</div>
              <div style={{ fontSize: "0.74rem", color: currentDriver.gap === "LEADER" ? "var(--neon-cyan)" : "#fff", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {effectiveLap <= 1 ? (currentDriver.pos === 1 ? "LEADER" : "—") : currentDriver.gap}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>BEST LAP</div>
              <div style={{ fontSize: "0.74rem", color: "var(--neon-purple, #cc44ff)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {effectiveLap <= 1 ? "NO TIME" : (currentDriver.bestLap || "—")}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>LAST LAP</div>
              <div style={{ fontSize: "0.74rem", color: "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
                {effectiveLap <= 1 ? "—" : (currentDriver.lastLap || "—")}
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
                aria-label="Custom team radio message"
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
