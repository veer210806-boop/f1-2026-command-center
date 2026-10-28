// ============================================================
// App.jsx — GP-Command F1 2026 Season Command Center
// ============================================================
import React, { Component, lazy, Suspense, useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./index.css";
import { SEASON_2026_ROUNDS } from "./data/calendar2026";

const TimingTower = lazy(() => import("./components/TimingTower"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const TeamsPaddock = lazy(() => import("./components/TeamsPaddock"));
const StrategyAdvisor = lazy(() => import("./components/StrategyAdvisor"));
const TelemetryViewer = lazy(() => import("./components/TelemetryViewer"));
const BudgetManager = lazy(() => import("./components/BudgetManager"));
const ScoreboardManager = lazy(() => import("./components/ScoreboardManager"));
import {
  loadSeasonScoreboard,
  recordRaceResultToScoreboard,
  revertRaceResultFromScoreboard,
  resetScoreboardForNewTeam,
  findFastestLapDriverCode,
} from "./utils/scoreboardEngine";
import LiveBroadcastGantry from "./components/LiveBroadcastGantry";
import StrategyGameGatewayModal, { CONSTRUCTORS_2026 } from "./components/StrategyGameGatewayModal";
import RestartMenuModal from "./components/RestartMenuModal";
import FinalRaceClassificationModal from "./components/FinalRaceClassificationModal";
import { buildTimingTowerGridForCircuit } from "./data/raceWeekendGrids2026";
import { f1Audio } from "./utils/f1AudioEngine";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("F1 Command Center ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#080a10",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "'Orbitron', sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
          <h2 style={{ color: "#ff1801", margin: "0 0 8px 0", letterSpacing: "0.06em" }}>
            FIA RACE CONTROL RECOVERY
          </h2>
          <p
            style={{
              color: "#a4a8bd",
              maxWidth: "520px",
              fontSize: "0.85rem",
              margin: "0 0 20px 0",
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: "600",
            }}
          >
            A telemetry conflict was safely intercepted. Click below to reset mission control cache and resume live command.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              background: "linear-gradient(90deg, #e10600 0%, #ff3b30 100%)",
              border: "none",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: "6px",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "900",
              fontSize: "0.78rem",
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(225, 6, 0, 0.5)",
            }}
          >
            🔄 RESUME LIVE COMMAND
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Helpers for Dynamic Team Drivers & Strategy Directives ──
export function getTeamDriversHelper(teamId, gridList = []) {
  if (!teamId || !gridList || gridList.length === 0) return gridList?.slice(0, 2) || [];
  const t = teamId.toLowerCase();

  let matched = gridList.filter((d) => {
    if (!d.team) return false;
    const dt = d.team.toLowerCase();
    if (dt.includes(t) || t.includes(dt)) return true;
    if (t.includes("red") && dt.includes("red")) return true;
    if ((t.includes("audi") || t.includes("sauber")) && (dt.includes("audi") || dt.includes("sauber"))) return true;
    if ((t.includes("bulls") || t.includes("rb") || t.includes("racing bulls")) && (dt.includes("bulls") || dt.includes("rb") || dt.includes("racing bulls"))) return true;
    if (t.includes("aston") && dt.includes("aston")) return true;
    if (t.includes("cadillac") && dt.includes("cadillac")) return true;
    if (t.includes("haas") && dt.includes("haas")) return true;
    if (t.includes("alpine") && dt.includes("alpine")) return true;
    if (t.includes("williams") && dt.includes("williams")) return true;
    if (t.includes("mercedes") && dt.includes("mercedes")) return true;
    if (t.includes("mclaren") && dt.includes("mclaren")) return true;
    if (t.includes("ferrari") && dt.includes("ferrari")) return true;
    return false;
  });

  if (matched.length >= 2) return matched.slice(0, 2);

  const constructorObj = CONSTRUCTORS_2026.find((c) => {
    const cid = c.id.toLowerCase();
    const cname = c.name.toLowerCase();
    return cid.includes(t) || t.includes(cid) || cname.includes(t) || t.includes(cname);
  });

  if (constructorObj?.drivers) {
    const codes = constructorObj.drivers.map((d) => d.code);
    const found = gridList.filter((d) => codes.includes(d.code));
    if (found.length > 0) return found.slice(0, 2);
  }

  return gridList.slice(0, 2);
}

export function createInitialTeamPlans(teamId, gridList = [], totalLaps = 58) {
  const tDrivers = getTeamDriversHelper(teamId, gridList);
  const d1 = tDrivers[0] || { code: "VER", num: 3, name: "Max Verstappen" };
  const d2 = tDrivers[1] || { code: "HAD", num: 6, name: "Isack Hadjar" };

  const plans = {
    [d1.code]: {
      stopsCount: 1,
      stop1Lap: 22,
      stop1SetId: "H1",
      stop1Completed: false,
      stop2Lap: 42,
      stop2SetId: "S2",
      stop2Completed: false,
      pushMode: "balanced",
      nextRecommendedWindow: "Laps 22 - 27 (Hard C2)",
    },
    [d2.code]: {
      stopsCount: 1,
      stop1Lap: 26,
      stop1SetId: "H1",
      stop1Completed: false,
      stop2Lap: 44,
      stop2SetId: "S1",
      stop2Completed: false,
      pushMode: "balanced",
      nextRecommendedWindow: "Laps 25 - 28 (Hard C2)",
    },
  };

  const strategies = [
    {
      id: `stop1_${d1.code}`,
      driverCode: d1.code,
      lap: 22,
      targetCompound: "H",
      setId: "H1",
      stopNum: 1,
      label: `Stop 1 @ Lap 22 (H)`,
      applied: false,
    },
    {
      id: `stop1_${d2.code}`,
      driverCode: d2.code,
      lap: 26,
      targetCompound: "H",
      setId: "H1",
      stopNum: 1,
      label: `Stop 1 @ Lap 26 (H)`,
      applied: false,
    },
  ];

  return { plans, strategies };
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_CIRCUIT = {
  round: 1,
  circuit_id: "australia",
  grand_prix_name: "Australian Grand Prix",
  circuit_name: "Albert Park Circuit",
  city: "MELBOURNE",
  country: "Australia",
  flag: "🇦🇺",
  date: "06 - 08 Mar 2026",
  laps: 58,
  length_km: 5.278,
  corners: 14,
  drs_zones: 4,
  pit_loss_green: 23.0,
  pit_loss_sc: 13.5,
  tire_wear: "LOW",
  base_lap_time: 78.5,
  weather: {
    condition: "Sunny, mild sea breeze",
    air_temp: 23,
    track_temp: 34,
    rain_chance: 10,
    icon: "☀️",
    wind: "14 km/h SW",
    humidity: "54%",
  },
};

const CIRCUIT_IOC_MAP = {
  australia: "AUS", china: "CHN", japan: "JPN", bahrain: "BHR", saudi_arabia: "KSA",
  miami: "USA", emilia_romagna: "ITA", monaco: "MCO", spain: "ESP", canada: "CAN",
  austria: "AUT", great_britain: "GBR", belgium: "BEL", hungary: "HUN", netherlands: "NLD",
  monza: "ITA", azerbaijan: "AZE", singapore: "SGP", united_states: "USA", mexico: "MEX",
  brazil: "BRA", las_vegas: "USA", qatar: "QAT", abu_dhabi: "UAE", madrid: "ESP",
};

const TABS = [
  { id: "timing",    label: "🏁 Pit Wall",       subtitle: "Live Timing Matrix" },
  { id: "strategy",  label: "🧠 Strategy",        subtitle: "Race Tactics & Pit Wall" },
  { id: "telemetry", label: "📈 Telemetry",       subtitle: "Teammate Comparison" },
  { id: "paddock",   label: "🏎️ 11 Teams",       subtitle: "2026 Constructors" },
  { id: "calendar",  label: "📅 Calendar",        subtitle: "24-Round Schedule" },
  { id: "budget",    label: "💼 Cost Cap",        subtitle: "$135M Cost Cap" },
  { id: "scoreboard", label: "🏆 Scoreboard",     subtitle: "2026 World Championship Standings" },
];

function CommandLoader({ label }) {
  return (
    <div className="command-loader" role="status" aria-live="polite">
      <span />
      Loading {label}
    </div>
  );
}

function FiaClock() {
  const [timeStr, setTimeStr] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        padding: "4px 10px",
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "0.55rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 4px var(--neon-green)" }} />
          GPS
        </span>
        <span style={{ fontSize: "0.55rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Orbitron', monospace" }}>
          FIA
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: "0.95rem",
          fontWeight: "900",
          color: "#ffffff",
          letterSpacing: "0.05em",
          lineHeight: "1.1",
          marginTop: "1px",
        }}
      >
        {timeStr}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("timing");
  const [circuits, setCircuits] = useState(SEASON_2026_ROUNDS);
  const [selectedCircuit, setSelectedCircuit] = useState(SEASON_2026_ROUNDS[0] || DEFAULT_CIRCUIT);

  useEffect(() => {
    axios.get(`${API}/circuits`)
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setCircuits(res.data.data);
          setSelectedCircuit((prev) => prev || res.data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < TABS.length) {
        event.preventDefault();
        setActiveTab(TABS[index].id);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleCircuitChange = useCallback((circuitId) => {
    const found = circuits.find((c) => c.circuit_id === circuitId);
    if (found) {
      setSelectedCircuit(found);
    }
  }, [circuits]);

  const handleGoToCalendar = useCallback(() => {
    setActiveTab("calendar");
  }, []);

  const handleSelectCircuit = useCallback((c) => {
    setSelectedCircuit(c);
  }, []);

  const handleLaunchPitWall = useCallback((c) => {
    setSelectedCircuit(c);
    setActiveTab("timing");
  }, []);

  const totalLaps = selectedCircuit?.laps || 58;
  const [currentLapNum, setCurrentLapNum] = useState(1);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [activeFlag, setActiveFlag] = useState("GREEN");
  const [overtakeTriggerCount, setOvertakeTriggerCount] = useState(0);

  // ── Strategy Game Mode: Role Clearance & Team Principal Selection ──
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("gp_strategy_role") || "team";
  });
  const [selectedTeam, setSelectedTeam] = useState(() => {
    return localStorage.getItem("gp_strategy_team") || "Ferrari";
  });
  const [isGatewayOpen, setIsGatewayOpen] = useState(() => {
    return !localStorage.getItem("gp_strategy_role");
  });
  const [isRestartMenuOpen, setIsRestartMenuOpen] = useState(false);
  const [isRaceFinishedModalOpen, setIsRaceFinishedModalOpen] = useState(false);
  const [restartSignal, setRestartSignal] = useState(0);

  // ── Shared Drivers & Strategy Directives State ──
  const [drivers, setDrivers] = useState(() => buildTimingTowerGridForCircuit(selectedCircuit?.circuit_id || "australia", 1));
  const [activePitEvent, setActivePitEvent] = useState(null);
  const [overtakeEvent, setOvertakeEvent] = useState(null);

  // Auto-dismiss pit stop broadcast popup after 8 seconds
  useEffect(() => {
    if (activePitEvent) {
      const timer = setTimeout(() => {
        setActivePitEvent(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activePitEvent]);

  // ── Dynamic Initial Strategy Directives for the active team ──
  const [plannedStrategies, setPlannedStrategies] = useState(() => {
    const initTeam = localStorage.getItem("gp_strategy_team") || "Ferrari";
    const initGrid = buildTimingTowerGridForCircuit("australia", 1);
    const { strategies } = createInitialTeamPlans(initTeam, initGrid, 58);
    return strategies;
  });

  // ── 2026 World Championship Scoreboard & Season Points State ──
  const [seasonScoreboard, setSeasonScoreboard] = useState(() => {
    const initTeam = localStorage.getItem("gp_strategy_team") || "Ferrari";
    return loadSeasonScoreboard(initTeam);
  });

  const handleRecordRaceResult = useCallback((circuitToRecord, gridDrivers) => {
    const c = circuitToRecord || selectedCircuit;
    const d = gridDrivers || drivers;
    if (!c || !d || d.length === 0) return;
    setSeasonScoreboard((prev) => {
      const fastCode = findFastestLapDriverCode(d);
      return recordRaceResultToScoreboard(prev, c, d, fastCode);
    });
  }, [selectedCircuit, drivers]);

  const handleRevertRoundPoints = useCallback((circuitId) => {
    const targetId = circuitId || selectedCircuit?.circuit_id;
    if (targetId) {
      setSeasonScoreboard((prev) => revertRaceResultFromScoreboard(prev, targetId));
    }
  }, [selectedCircuit]);

  const handleResetSeasonCampaign = useCallback(() => {
    const fresh = resetScoreboardForNewTeam(selectedTeam);
    setSeasonScoreboard(fresh);
    const round1 = circuits[0] || DEFAULT_CIRCUIT;
    setSelectedCircuit(round1);
    setCurrentLapNum(1);
    setIsAutoSimulating(false);
    setActiveFlag("GREEN");
    setRestartSignal((s) => s + 1);
  }, [selectedTeam, circuits]);

  // ── Global Driver Plans State (Dynamic for the active team) ──
  const [driverPlans, setDriverPlans] = useState(() => {
    const initTeam = localStorage.getItem("gp_strategy_team") || "Ferrari";
    const initGrid = buildTimingTowerGridForCircuit("australia", 1);
    const { plans } = createInitialTeamPlans(initTeam, initGrid, 58);
    return plans;
  });

  // Dedicated handler to switch team and instantly update plans for that team
  const handleSelectTeam = useCallback((newTeamId) => {
    if (!newTeamId) return;
    setSelectedTeam(newTeamId);
    localStorage.setItem("gp_strategy_team", newTeamId);

    // Requirement: "if change the team only then whole new points will be srt from 0 1st race"
    const freshScoreboard = resetScoreboardForNewTeam(newTeamId);
    setSeasonScoreboard(freshScoreboard);

    // Reset circuit back to Race 1 (Melbourne)
    const round1 = circuits[0] || DEFAULT_CIRCUIT;
    setSelectedCircuit(round1);
    setCurrentLapNum(1);
    setIsAutoSimulating(false);
    setActiveFlag("GREEN");
    setRestartSignal((s) => s + 1);

    const r1Laps = round1.laps || 58;
    const freshGrid = buildTimingTowerGridForCircuit(round1.circuit_id || "australia", 1).map((d, i) => ({
      ...d,
      pos: i + 1,
      tireAge: 0,
      wear: 4,
      pits: 0,
      pitState: "RACING",
      gap: i === 0 ? "LEADER" : `+${(0.65 * i).toFixed(3)}s`,
      interval: i === 0 ? "1:28.412" : "+0.650s",
      posDelta: "0",
      arrow: "neutral",
    }));
    setDrivers(freshGrid);

    const { plans, strategies } = createInitialTeamPlans(newTeamId, freshGrid, r1Laps);
    setDriverPlans(plans);
    setPlannedStrategies(strategies);
    setOvertakeEvent(`🏎️ NEW CAMPAIGN BEGUN WITH ${newTeamId.toUpperCase()}! Season standings reset to 0 pts for Round 1: Australian GP.`);
  }, [circuits]);

  // Synchronize plans whenever selectedTeam or drivers change
  useEffect(() => {
    const activeTeamDrivers = getTeamDriversHelper(selectedTeam, drivers);
    const activeDriverCodes = activeTeamDrivers.map((d) => d.code);
    const currentPlannedCodes = Object.keys(driverPlans);

    const isMatching = activeDriverCodes.every((code) => currentPlannedCodes.includes(code));
    if (!isMatching && activeTeamDrivers.length > 0) {
      const { plans, strategies } = createInitialTeamPlans(selectedTeam, drivers, totalLaps);
      setDriverPlans(plans);
      setPlannedStrategies(strategies);
    }
  }, [selectedTeam, drivers, totalLaps]);

  // Direct Restart Race Simulation Handler
  const handleDirectRestart = useCallback(() => {
    f1Audio.playRadioBeep();
    setCurrentLapNum(1);
    setIsAutoSimulating(false);
    setActiveFlag("GREEN");
    setRestartSignal((s) => s + 1);

    // Requirement: "if restarted the race points should be reverse back"
    if (selectedCircuit?.circuit_id) {
      setSeasonScoreboard((prev) => revertRaceResultFromScoreboard(prev, selectedCircuit.circuit_id));
    }

    const freshGrid = buildTimingTowerGridForCircuit(selectedCircuit?.circuit_id || "australia", 1).map((d, i) => ({
      ...d,
      pos: i + 1,
      tireAge: 0,
      wear: 4,
      pits: 0,
      pitState: "RACING",
      gap: i === 0 ? "LEADER" : `+${(0.65 * i).toFixed(3)}s`,
      interval: i === 0 ? "1:28.412" : `+0.650s`,
      posDelta: "0",
      arrow: "neutral",
    }));
    setDrivers(freshGrid);

    const { plans, strategies } = createInitialTeamPlans(selectedTeam, freshGrid, totalLaps);
    setDriverPlans(plans);
    setPlannedStrategies(strategies);
  }, [selectedCircuit, selectedTeam, totalLaps]);

  const currentCircuitIdx = circuits.findIndex((c) => c.circuit_id === selectedCircuit?.circuit_id);
  const nextCircuit = currentCircuitIdx >= 0 ? circuits[(currentCircuitIdx + 1) % circuits.length] : circuits[0];

  // Advance to Next Grand Prix on the 2026 World Championship Calendar
  const handleAdvanceToNextRace = useCallback(() => {
    f1Audio.playRadioBeep();

    // Ensure the current race result is locked in before advancing
    handleRecordRaceResult(selectedCircuit, drivers);

    const currentIdx = circuits.findIndex((c) => c.circuit_id === selectedCircuit?.circuit_id);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % circuits.length : 0;
    const nextC = circuits[nextIdx];

    setSelectedCircuit(nextC);
    setCurrentLapNum(1);
    setIsAutoSimulating(false);
    setActiveFlag("GREEN");
    setIsRaceFinishedModalOpen(false);
    setRestartSignal((s) => s + 1);

    const nextLaps = nextC.laps || 58;
    const freshGrid = buildTimingTowerGridForCircuit(nextC.circuit_id, 1).map((d, i) => ({
      ...d,
      pos: i + 1,
      tireAge: 0,
      wear: 4,
      pits: 0,
      pitState: "RACING",
      gap: i === 0 ? "LEADER" : `+${(0.65 * i).toFixed(3)}s`,
      interval: i === 0 ? "1:28.412" : `+0.650s`,
      posDelta: "0",
      arrow: "neutral",
    }));
    setDrivers(freshGrid);

    const { plans, strategies } = createInitialTeamPlans(selectedTeam, freshGrid, nextLaps);
    setDriverPlans(plans);
    setPlannedStrategies(strategies);

    setActiveTab("timing");
    setActivePitEvent(null);
    setOvertakeEvent(`🏁 WELCOME TO ROUND ${nextC.round}: ${nextC.grand_prix_name.toUpperCase()}! Grid, tire allocations & initial team strategies loaded.`);
  }, [circuits, selectedCircuit, selectedTeam]);

  const handleCompletePlanStop = useCallback((driverCode, stopNum) => {
    setDriverPlans((prev) => {
      const current = prev[driverCode] || {
        stopsCount: 1,
        stop1Lap: 24,
        stop1SetId: "H1",
        stop1Completed: false,
        stop2Lap: 42,
        stop2SetId: "S1",
        stop2Completed: false,
        pushMode: "balanced",
      };

      const completedLap = stopNum === 1 ? current.stop1Lap : current.stop2Lap;
      const nextOptimal = Math.min(totalLaps - 5, completedLap + 24);

      return {
        ...prev,
        [driverCode]: {
          ...current,
          ...(stopNum === 1 ? { stop1Completed: true } : { stop2Completed: true }),
          stop2Lap: nextOptimal,
          nextRecommendedWindow: `Laps ${Math.max(1, nextOptimal - 2)} - ${nextOptimal + 2} (Softs / Sprint)`,
        },
      };
    });
  }, [totalLaps]);

  const handleUpdateDriverPlan = useCallback((driverCode, updatedFields) => {
    setDriverPlans((prev) => {
      const current = prev[driverCode] || {
        stopsCount: 1,
        stop1Lap: 24,
        stop1SetId: "H1",
        stop1Completed: false,
        stop2Lap: 42,
        stop2SetId: "S1",
        stop2Completed: false,
        pushMode: "balanced",
        nextRecommendedWindow: "Laps 22 - 27 (Hard C2)",
      };
      const merged = { ...current, ...updatedFields };

      // Synchronize with plannedStrategies so Timing Matrix displays badges & auto-executes
      setPlannedStrategies((prevStrategies) => {
        const otherDrivers = prevStrategies.filter((s) => s.driverCode !== driverCode);
        const newPlanned = [];

        if (!merged.stop1Completed && merged.stop1Lap) {
          const comp = merged.stop1SetId?.startsWith("S") ? "S" : merged.stop1SetId?.startsWith("M") ? "M" : "H";
          newPlanned.push({
            id: `stop1_${driverCode}`,
            driverCode,
            lap: merged.stop1Lap,
            targetCompound: comp,
            setId: merged.stop1SetId,
            stopNum: 1,
            label: `Stop 1 @ Lap ${merged.stop1Lap} (${comp})`,
            applied: false,
          });
        }
        if (merged.stopsCount === 2 && !merged.stop2Completed && merged.stop2Lap) {
          const comp = merged.stop2SetId?.startsWith("S") ? "S" : merged.stop2SetId?.startsWith("M") ? "M" : "H";
          newPlanned.push({
            id: `stop2_${driverCode}`,
            driverCode,
            lap: merged.stop2Lap,
            targetCompound: comp,
            setId: merged.stop2SetId,
            stopNum: 2,
            label: `Stop 2 @ Lap ${merged.stop2Lap} (${comp})`,
            applied: false,
          });
        }

        return [...otherDrivers, ...newPlanned];
      });

      return {
        ...prev,
        [driverCode]: merged,
      };
    });
  }, []);

  // Synchronize starting grid when circuit changes (ONLY on Lap 1 before race start)
  useEffect(() => {
    if (currentLapNum <= 1) {
      setDrivers(buildTimingTowerGridForCircuit(selectedCircuit?.circuit_id || "australia", 1));
    }
  }, [selectedCircuit?.circuit_id]);

  // Execute Pit Stop shared handler (updates drivers & timing matrix immediately)
  const handleExecutePitStop = useCallback(({ driverCode, targetCompound, initialWear = 4, initialAge = 0, reentry }) => {
    const baseLoss = activeFlag === "SC" ? 13.5 : activeFlag === "VSC" ? 15.2 : (selectedCircuit?.pit_loss_green || 22.5);
    const pitCrewVariance = +((Math.random() * 0.4) - 0.2).toFixed(2);
    const actualPitLoss = +(baseLoss + pitCrewVariance).toFixed(2);

    const parseGapSec = (gapStr) => {
      if (!gapStr || gapStr === "LEADER") return 0;
      const num = parseFloat(String(gapStr).replace("+", "").replace("s", ""));
      return isNaN(num) ? 0 : num;
    };

    // Mark stop completed & setup next optimal window in driverPlans!
    const currentTarget = drivers.find((d) => d.code === driverCode);
    const completedStopNum = (currentTarget?.pits || 0) + 1;
    handleCompletePlanStop(driverCode, completedStopNum);

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
            tireAge: initialAge,
            wear: initialWear,
            pits: (d.pits || 0) + 1,
            lastPitLap: currentLapNum,
          };
        }
        return {
          ...d,
          gapSec: d.gapSec !== undefined ? d.gapSec : parseGapSec(d.gap),
        };
      });

      // Clear "IN PIT" state after 4 seconds to transition back to RACING without shifting order
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
        const posDiff = prevPos - newPos;

        const prevAhead = i > 0 ? updated[i - 1] : null;
        const intervalVal = isLead
          ? d.bestLap || "1:28.412"
          : `+${(d.gapSec - (prevAhead?.gapSec || 0)).toFixed(3)}s`;

        return {
          ...d,
          pos: newPos,
          posDelta: posDiff > 0 ? `+${posDiff}` : posDiff < 0 ? `${posDiff}` : "0",
          arrow: posDiff > 0 ? "up" : posDiff < 0 ? "down" : d.arrow || "neutral",
          gap: isLead ? "LEADER" : `+${relativeGap.toFixed(3)}s`,
          gapSec: d.gapSec,
          interval: intervalVal,
          overtaken: posDiff > 0,
        };
      });

      const newTargetPos = finalGrid.findIndex((d) => d.code === driverCode) + 1;
      const carAhead = newTargetPos > 1 ? finalGrid[newTargetPos - 2] : null;
      const aheadNotice = carAhead ? ` behind ${carAhead.code} (#${carAhead.num})` : " in clean air";
      const compoundName = targetCompound === "S" ? "Soft" : targetCompound === "M" ? "Medium" : targetCompound === "H" ? "Hard" : targetCompound === "I" ? "Intermediate" : "Wet";

      const pitData = {
        lap: currentLapNum,
        num: targetDriver.num,
        code: targetDriver.code,
        name: targetDriver.name,
        team: targetDriver.team,
        tire: targetCompound,
        compoundName,
        stopDuration: `${actualPitLoss}s stop`,
        reEntryPos: newTargetPos,
        reason: "Tactical Box Command",
      };
      setActivePitEvent(pitData);
      setOvertakeEvent(`📦 LIVE PIT STOP: LAP ${currentLapNum}: #${targetDriver.num} ${targetDriver.code} (${targetDriver.team}) BOXES · FITS ${compoundName} (${actualPitLoss}s stop) · REJOINS P${newTargetPos}${aheadNotice}!`);
      f1Audio.playRadioBeep();

      return finalGrid;
    });
  }, [activeFlag, selectedCircuit, currentLapNum, drivers, handleCompletePlanStop]);

  // Strategy Decided & Deleted Handlers
  const handleAddStrategy = useCallback((newStrat) => {
    setPlannedStrategies((prev) => [
      ...prev.filter((s) => s.driverCode !== newStrat.driverCode || s.lap !== newStrat.lap),
      {
        id: Date.now(),
        driverCode: newStrat.driverCode,
        lap: newStrat.lap,
        targetCompound: newStrat.targetCompound,
        initialWear: newStrat.initialWear || 4,
        initialAge: newStrat.initialAge || 0,
        label: newStrat.label || `Planned Stop at Lap ${newStrat.lap} → ${newStrat.targetCompound}`,
        applied: false,
      },
    ]);
  }, []);

  const handleDeleteStrategy = useCallback((stratId) => {
    setPlannedStrategies((prev) => prev.filter((s) => s.id !== stratId));
  }, []);

  const handleApplyPreset = useCallback((presetType) => {
    const teamDrivers = drivers.filter((d) => d.team && d.team.toLowerCase().includes(selectedTeam.toLowerCase()));
    const d1 = teamDrivers[0]?.code || "LEC";
    const d2 = teamDrivers[1]?.code || "HAM";

    if (presetType === "oneStop") {
      setPlannedStrategies([
        { id: Date.now(), driverCode: d1, lap: 24, targetCompound: "H", label: "Optimal 1-Stop: Fit Hard", applied: false },
        { id: Date.now() + 1, driverCode: d2, lap: 26, targetCompound: "H", label: "Optimal 1-Stop: Fit Hard (Staggered)", applied: false },
      ]);
    } else if (presetType === "twoStop") {
      setPlannedStrategies([
        { id: Date.now(), driverCode: d1, lap: 16, targetCompound: "M", label: "Aggressive 2-Stop: Stop 1 -> Med", applied: false },
        { id: Date.now() + 1, driverCode: d1, lap: 38, targetCompound: "S", label: "Aggressive 2-Stop: Stop 2 -> Soft", applied: false },
        { id: Date.now() + 2, driverCode: d2, lap: 18, targetCompound: "M", label: "Aggressive 2-Stop: Stop 1 -> Med", applied: false },
        { id: Date.now() + 3, driverCode: d2, lap: 40, targetCompound: "S", label: "Aggressive 2-Stop: Stop 2 -> Soft", applied: false },
      ]);
    } else if (presetType === "rainGamble") {
      setPlannedStrategies([
        { id: Date.now(), driverCode: d1, lap: currentLapNum + 2, targetCompound: "I", label: "Weather Gamble: Immediate Intermediate Call", applied: false },
        { id: Date.now() + 1, driverCode: d2, lap: currentLapNum + 3, targetCompound: "I", label: "Weather Gamble: Immediate Intermediate Call", applied: false },
      ]);
    }
  }, [drivers, selectedTeam, currentLapNum]);

  // Master race simulation clock: cleanly increments currentLapNum
  useEffect(() => {
    if (!isAutoSimulating) return;
    const intervalMs = simSpeed === 5 ? 800 : simSpeed === 2 ? 1800 : 3500;
    const timer = setInterval(() => {
      setCurrentLapNum((prev) => {
        const next = prev + 1;
        if (next >= totalLaps) {
          setIsAutoSimulating(false);
          setIsRaceFinishedModalOpen(true);
          setActiveFlag("CHEQUERED");
          f1Audio.playRadioBeep();
          handleRecordRaceResult(selectedCircuit, drivers);
          return totalLaps;
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isAutoSimulating, simSpeed, totalLaps]);

  const lapProgressPct = Math.round((currentLapNum / totalLaps) * 100);
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const currentTeamObj = CONSTRUCTORS_2026.find((t) => t.id === selectedTeam) || CONSTRUCTORS_2026[0];

  return (
    <ErrorBoundary>
      <div className="app-wrapper">
      <a className="skip-link" href="#command-main">Skip to command center</a>

      {/* ── Unified Futuristic F1 Cockpit Command Bar ── */}
      <header
        style={{
          height: "64px",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(232,0,45,0.3)",
          background: "linear-gradient(180deg, rgba(14,17,28,0.98) 0%, rgba(9,11,18,0.96) 100%)",
          backdropFilter: "blur(18px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Animated Top Red Laser Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, var(--neon-red) 30%, #ff4d6d 50%, var(--neon-red) 70%, transparent 100%)",
            boxShadow: "0 0 10px var(--neon-red)",
          }}
        />

        {/* Left: Brand Identity & Active Grand Prix Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "1.3rem",
                fontWeight: "900",
                color: "var(--neon-red)",
                letterSpacing: "0.06em",
                textShadow: "0 0 12px rgba(232,0,45,0.6)",
              }}
            >
              GP-
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "1.3rem",
                fontWeight: "900",
                color: "#ffffff",
                letterSpacing: "0.06em",
              }}
            >
              COMMAND
            </span>
          </div>

          {/* Active Grand Prix Pill & Dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              padding: "3px 10px",
            }}
          >
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.64rem",
                fontWeight: "900",
                color: "var(--neon-yellow)",
              }}
            >
              {CIRCUIT_IOC_MAP[selectedCircuit?.circuit_id] || "AUS"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <select
              value={selectedCircuit?.circuit_id || "australia"}
              onChange={(e) => handleCircuitChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "0.72rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                cursor: "pointer",
                outline: "none",
                maxWidth: "140px",
              }}
            >
              {(circuits.length > 0 ? circuits : [DEFAULT_CIRCUIT]).map((c) => (
                <option key={c.circuit_id} value={c.circuit_id} style={{ background: "#121420", color: "#fff" }}>
                  R{String(c.round).padStart(2, "0")} · {c.city || c.country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Sleek Cockpit Navigation Pills */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(0,0,0,0.35)",
            padding: "4px 8px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          aria-label="Primary command center navigation"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  padding: "6px 14px",
                  borderRadius: "18px",
                  fontSize: "0.74rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: isActive ? "900" : "600",
                  letterSpacing: "0.04em",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  background: isActive ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "transparent",
                  boxShadow: isActive ? "0 0 12px rgba(232,0,45,0.4)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title={`${tab.subtitle} (Alt+${TABS.indexOf(tab) + 1})`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Strategy Role Pill + Restart/Switch Button + Race Lap Capsule + GPS Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Strategy Role & Team Clearance Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: userRole === "team" ? "rgba(255,255,255,0.05)" : "rgba(234, 179, 8, 0.12)",
              border: userRole === "team" ? `1px solid ${currentTeamObj.color}70` : "1px solid rgba(234, 179, 8, 0.4)",
              borderRadius: "20px",
              padding: "4px 10px",
              boxShadow: userRole === "team" ? `0 0 10px ${currentTeamObj.color}25` : "0 0 10px rgba(234, 179, 8, 0.2)",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: userRole === "team" ? currentTeamObj.color : "#ffd700", boxShadow: `0 0 6px ${userRole === "team" ? currentTeamObj.color : "#ffd700"}` }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.03em" }}>
              {userRole === "team" ? currentTeamObj.name.toUpperCase() : "FIA RACE CONTROL"}
            </span>
            <span
              style={{
                fontSize: "0.58rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                color: userRole === "team" ? "var(--neon-cyan)" : "#ffd700",
                background: userRole === "team" ? "rgba(0,210,190,0.18)" : "rgba(255,215,0,0.2)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              {userRole === "team" ? "STRATEGIST" : "GOD MODE"}
            </span>
          </div>

          {/* 🔄 RESTART / SWITCH Menu Button */}
          <button
            onClick={() => setIsRestartMenuOpen(true)}
            style={{
              background: "linear-gradient(135deg, rgba(232, 0, 45, 0.25) 0%, rgba(20, 24, 38, 0.95) 100%)",
              border: "1px solid rgba(232, 0, 45, 0.55)",
              borderRadius: "18px",
              padding: "4px 11px",
              color: "#ffffff",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.66rem",
              fontWeight: "900",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 0 12px rgba(232, 0, 45, 0.3)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--neon-red)";
              e.currentTarget.style.boxShadow = "0 0 18px rgba(232, 0, 45, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(232, 0, 45, 0.55)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(232, 0, 45, 0.3)";
            }}
            title="Reset Race, Switch Constructor, or Toggle FIA Clearance"
          >
            <span>🔄</span>
            <span>RESTART / SWITCH</span>
          </button>

          {/* Micro Lap Progress Capsule */}
          <div
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "4px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontSize: "0.64rem", fontFamily: "'Orbitron', monospace" }}>
              <span style={{ color: "#ffffff", fontWeight: "800" }}>LAP {currentLapNum}/{totalLaps}</span>
              <span style={{ color: "var(--neon-green)", fontWeight: "700" }}>{lapProgressPct}%</span>
            </div>
            <div style={{ width: "80px", height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${lapProgressPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--neon-green), var(--neon-cyan))",
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>

          {/* FIA Digital Clock */}
          <FiaClock />
        </div>
      </header>

      {/* ── Official 2026 Live Race Control & Simulation Gantry (Compact/Expanded) ── */}
      <div style={{ marginTop: "10px" }}>
        <LiveBroadcastGantry
          currentLap={currentLapNum}
          maxLaps={totalLaps}
          isAutoSimulating={isAutoSimulating}
          onToggleSim={() => setIsAutoSimulating((s) => !s)}
          onRestartRace={handleDirectRestart}
          onOpenResultsModal={() => setIsRaceFinishedModalOpen(true)}
          simSpeed={simSpeed}
          onChangeSimSpeed={(spd) => setSimSpeed(spd)}
          onTriggerOvertake={() => {
            setOvertakeTriggerCount((c) => c + 1);
          }}
          onFlagChange={(flag) => setActiveFlag(flag)}
          activeFlag={activeFlag}
          defaultExpanded={activeTab === "timing"}
        />
      </div>

      {/* ── Chequered Flag Race Completed Notification Banner ── */}
      {currentLapNum >= totalLaps && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(255, 215, 0, 0.22) 0%, rgba(20, 24, 38, 0.98) 50%, rgba(255, 215, 0, 0.22) 100%)",
            border: "1.5px solid #ffd700",
            borderRadius: "10px",
            padding: "12px 22px",
            margin: "0 24px 12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 0 24px rgba(255, 215, 0, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>🏁</span>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.90rem", fontWeight: "900", color: "#ffd700", letterSpacing: "0.06em" }}>
                CHEQUERED FLAG · 2026 {selectedCircuit?.grand_prix_name?.toUpperCase()} COMPLETED!
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                Race simulation concluded at Lap {totalLaps}/{totalLaps}. Official classification and championship points are finalized.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setIsRaceFinishedModalOpen(true)}
              style={{
                background: "rgba(255, 215, 0, 0.2)",
                border: "1px solid #ffd700",
                color: "#ffd700",
                borderRadius: "6px",
                padding: "7px 14px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "900",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🏆</span>
              <span>VIEW FINAL RESULTS & PODIUM</span>
            </button>

            <button
              onClick={handleAdvanceToNextRace}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                border: "none",
                color: "#0a0c14",
                borderRadius: "6px",
                padding: "7px 18px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.74rem",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(255, 215, 0, 0.6)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>ADVANCE TO ROUND {nextCircuit?.round} ({nextCircuit?.city})</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main id="command-main" className="main-content" tabIndex="-1" style={{ paddingTop: "4px" }}>
        <Suspense fallback={<CommandLoader label={activeTabMeta.subtitle} />}>
          {/* Keep TimingTower and StrategyAdvisor mounted persistently to prevent simulation reset or unmounting */}
          <div style={{ display: activeTab === "timing" ? "block" : "none" }}>
            <TimingTower
              selectedCircuit={selectedCircuit}
              onGoToCalendar={handleGoToCalendar}
              onGoToStrategy={() => setActiveTab("strategy")}
              controlledLap={currentLapNum}
              controlledFlag={activeFlag}
              triggerOvertakeSignal={overtakeTriggerCount}
              userRole={userRole}
              playerTeam={selectedTeam}
              restartSignal={restartSignal}
              drivers={drivers}
              onExecutePitStop={handleExecutePitStop}
              onDriversUpdate={setDrivers}
              plannedStrategies={plannedStrategies}
              driverPlans={driverPlans}
              onUpdateDriverPlan={handleUpdateDriverPlan}
              onCompletePlanStop={handleCompletePlanStop}
              activePitEvent={activePitEvent}
              onSetPitEvent={setActivePitEvent}
              overtakeEvent={overtakeEvent}
              onSetOvertakeEvent={setOvertakeEvent}
            />
          </div>
          <div style={{ display: activeTab === "strategy" ? "block" : "none" }}>
            <StrategyAdvisor
              selectedCircuit={selectedCircuit}
              drivers={drivers}
              playerTeam={selectedTeam}
              userRole={userRole}
              currentLap={currentLapNum}
              maxLaps={totalLaps}
              activeFlag={activeFlag}
              onExecutePitStop={handleExecutePitStop}
              plannedStrategies={plannedStrategies}
              driverPlans={driverPlans}
              onUpdateDriverPlan={handleUpdateDriverPlan}
              onCompletePlanStop={handleCompletePlanStop}
              onAddStrategy={handleAddStrategy}
              onDeleteStrategy={handleDeleteStrategy}
              onApplyPreset={handleApplyPreset}
              onGoToTiming={() => setActiveTab("timing")}
              activePitEvent={activePitEvent}
              onSetPitEvent={setActivePitEvent}
              overtakeEvent={overtakeEvent}
              onSetOvertakeEvent={setOvertakeEvent}
            />
          </div>
          {activeTab === "telemetry" && <TelemetryViewer selectedCircuit={selectedCircuit} />}
          {activeTab === "paddock"   && <TeamsPaddock />}
          {activeTab === "calendar"  && (
            <CalendarView
              selectedCircuit={selectedCircuit}
              onSelectCircuit={handleSelectCircuit}
              onLaunchPitWall={handleLaunchPitWall}
            />
          )}
          {activeTab === "budget"    && <BudgetManager />}
          {activeTab === "scoreboard" && (
            <ScoreboardManager
              seasonData={seasonScoreboard}
              playerTeam={selectedTeam}
              selectedCircuit={selectedCircuit}
              onGoToPitWall={() => setActiveTab("timing")}
              onRevertRoundPoints={handleRevertRoundPoints}
              onResetSeasonCampaign={handleResetSeasonCampaign}
            />
          )}
        </Suspense>
      </main>

      {/* ── 2026 Strategy Simulation Gateway Landing Modal ── */}
      <StrategyGameGatewayModal
        isOpen={isGatewayOpen}
        initialRole={userRole}
        initialTeam={selectedTeam}
        onLaunchGame={({ role, teamId }) => {
          setUserRole(role);
          if (teamId) handleSelectTeam(teamId);
          setIsGatewayOpen(false);
          localStorage.setItem("gp_strategy_role", role);
          setActiveTab("timing");
        }}
      />

      {/* ── Dynamic Restart / Switch Modal ── */}
      <RestartMenuModal
        isOpen={isRestartMenuOpen}
        onClose={() => setIsRestartMenuOpen(false)}
        currentCircuitName={selectedCircuit?.grand_prix_name || "Australian Grand Prix"}
        currentRole={userRole}
        currentTeamId={selectedTeam}
        onRestartRace={handleDirectRestart}
        onChangeTeam={(teamId) => {
          if (teamId) {
            handleSelectTeam(teamId);
          } else {
            setIsGatewayOpen(true);
          }
        }}
        onToggleRole={() => {
          const nextRole = userRole === "team" ? "fia" : "team";
          setUserRole(nextRole);
          localStorage.setItem("gp_strategy_role", nextRole);
        }}
        onOpenGateway={() => {
          setIsGatewayOpen(true);
        }}
      />

      {/* ── 2026 Final Race Classification & Podium Modal ── */}
      <FinalRaceClassificationModal
        isOpen={isRaceFinishedModalOpen}
        onClose={() => setIsRaceFinishedModalOpen(false)}
        drivers={drivers}
        selectedCircuit={selectedCircuit}
        playerTeam={selectedTeam}
        onAdvanceToNextRace={handleAdvanceToNextRace}
        onRestartRace={handleDirectRestart}
        nextCircuit={nextCircuit}
        onGoToScoreboard={() => {
          setIsRaceFinishedModalOpen(false);
          setActiveTab("scoreboard");
        }}
      />
    </div>
    </ErrorBoundary>
  );
}
