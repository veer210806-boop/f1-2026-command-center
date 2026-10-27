// ============================================================
// App.jsx — GP-Command F1 2026 Season Command Center
// ============================================================
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./index.css";
import { SEASON_2026_ROUNDS } from "./data/calendar2026";

const TimingTower = lazy(() => import("./components/TimingTower"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const TeamsPaddock = lazy(() => import("./components/TeamsPaddock"));
const StrategyAdvisor = lazy(() => import("./components/StrategyAdvisor"));
const TelemetryViewer = lazy(() => import("./components/TelemetryViewer"));
const BudgetManager = lazy(() => import("./components/BudgetManager"));
import LiveBroadcastGantry from "./components/LiveBroadcastGantry";
import StrategyGameGatewayModal, { CONSTRUCTORS_2026 } from "./components/StrategyGameGatewayModal";
import RestartMenuModal from "./components/RestartMenuModal";

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
  { id: "timing",    label: "🏁 Pit Wall",       subtitle: "Live Timing Tower" },
  { id: "telemetry", label: "📈 Telemetry",       subtitle: "Teammate Comparison" },
  { id: "calendar",  label: "📅 Calendar",        subtitle: "24-Round Schedule" },
  { id: "paddock",   label: "🏎️ 11 Teams",       subtitle: "2026 Constructors" },
  { id: "strategy",  label: "🧠 Strategy",        subtitle: "Tire & Undercut" },
  { id: "budget",    label: "💼 Cost Cap",        subtitle: "$135M Cost Cap" },
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
  const [currentLapNum, setCurrentLapNum] = useState(34);
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
  const [restartSignal, setRestartSignal] = useState(0);

  useEffect(() => {
    if (!isAutoSimulating) return;
    const intervalMs = simSpeed === 5 ? 800 : simSpeed === 2 ? 1800 : 3500;
    const timer = setInterval(() => {
      setCurrentLapNum((prev) => {
        const next = prev + 1;
        return next > totalLaps ? 1 : next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isAutoSimulating, simSpeed, totalLaps]);

  const lapProgressPct = Math.round((currentLapNum / totalLaps) * 100);
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const currentTeamObj = CONSTRUCTORS_2026.find((t) => t.id === selectedTeam) || CONSTRUCTORS_2026[0];

  return (
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

      {/* ── Main Content ── */}
      <main id="command-main" className="main-content" tabIndex="-1" style={{ paddingTop: "4px" }}>
        <Suspense fallback={<CommandLoader label={activeTabMeta.subtitle} />}>
          {activeTab === "timing"    && (
            <TimingTower
              selectedCircuit={selectedCircuit}
              onGoToCalendar={handleGoToCalendar}
              controlledLap={currentLapNum}
              controlledFlag={activeFlag}
              triggerOvertakeSignal={overtakeTriggerCount}
              userRole={userRole}
              playerTeam={selectedTeam}
              restartSignal={restartSignal}
            />
          )}
          {activeTab === "calendar"  && (
            <CalendarView
              selectedCircuit={selectedCircuit}
              onSelectCircuit={handleSelectCircuit}
              onLaunchPitWall={handleLaunchPitWall}
            />
          )}
          {activeTab === "paddock"   && <TeamsPaddock />}
          {activeTab === "strategy"  && <StrategyAdvisor selectedCircuit={selectedCircuit} />}
          {activeTab === "telemetry" && <TelemetryViewer selectedCircuit={selectedCircuit} />}
          {activeTab === "budget"    && <BudgetManager />}
        </Suspense>
      </main>

      {/* ── 2026 Strategy Simulation Gateway Landing Modal ── */}
      <StrategyGameGatewayModal
        isOpen={isGatewayOpen}
        initialRole={userRole}
        initialTeam={selectedTeam}
        onLaunchGame={({ role, teamId }) => {
          setUserRole(role);
          if (teamId) setSelectedTeam(teamId);
          setIsGatewayOpen(false);
          localStorage.setItem("gp_strategy_role", role);
          if (teamId) localStorage.setItem("gp_strategy_team", teamId);
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
        onRestartRace={() => {
          setCurrentLapNum(1);
          setRestartSignal((s) => s + 1);
          setIsAutoSimulating(false);
          setActiveFlag("GREEN");
        }}
        onChangeTeam={(teamId) => {
          if (teamId) {
            setSelectedTeam(teamId);
            localStorage.setItem("gp_strategy_team", teamId);
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
    </div>
  );
}
