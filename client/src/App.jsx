// ============================================================
// App.jsx — GP-Command F1 2026 Season Command Center
// ============================================================
import { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import "./index.css";

const TimingTower = lazy(() => import("./components/TimingTower"));
const CalendarView = lazy(() => import("./components/CalendarView"));
const TeamsPaddock = lazy(() => import("./components/TeamsPaddock"));
const StrategyAdvisor = lazy(() => import("./components/StrategyAdvisor"));
const TelemetryViewer = lazy(() => import("./components/TelemetryViewer"));
const BudgetManager = lazy(() => import("./components/BudgetManager"));

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
  { id: "calendar",  label: "📅 2026 Calendar",   subtitle: "24-Round Schedule" },
  { id: "paddock",   label: "🏎️ 11 Teams & Drivers", subtitle: "2026 Constructors" },
  { id: "strategy",  label: "🧠 Strategy",        subtitle: "Tire & Undercut" },
  { id: "telemetry", label: "📈 Telemetry",       subtitle: "Teammate Comparison" },
  { id: "budget",    label: "💼 Budget Cap",      subtitle: "$135M Cost Cap" },
];

function CommandLoader({ label }) {
  return (
    <div className="command-loader" role="status" aria-live="polite">
      <span />
      Loading {label}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("timing");
  const [circuits, setCircuits] = useState([]);
  const [selectedCircuit, setSelectedCircuit] = useState(DEFAULT_CIRCUIT);
  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleCircuitChange = (circuitId) => {
    const found = circuits.find((c) => c.circuit_id === circuitId);
    if (found) {
      setSelectedCircuit(found);
    }
  };

  const totalLaps = selectedCircuit?.laps || 58;
  const currentLapNum = 34;
  const lapProgressPct = Math.round((currentLapNum / totalLaps) * 100);
  const activeTabMeta = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <div className="app-wrapper">
      <a className="skip-link" href="#command-main">Skip to command center</a>
      {/* ── Top Bar (Futuristic F1 Mission Control Header) ── */}
      <header
        className="topbar"
        style={{
          height: "72px",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(232,0,45,0.35)",
          background: "linear-gradient(180deg, rgba(16,18,28,0.98) 0%, rgba(10,12,18,0.95) 100%)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
          position: "relative",
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

        {/* Left: Brand Identity & Live Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "1.4rem",
                  fontWeight: "900",
                  color: "var(--neon-red)",
                  letterSpacing: "0.08em",
                  textShadow: "0 0 14px rgba(232,0,45,0.6)",
                }}
              >
                GP-
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "1.4rem",
                  fontWeight: "900",
                  color: "#ffffff",
                  letterSpacing: "0.08em",
                }}
              >
                COMMAND
              </span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "-3px" }}>
              FIA FORMULA 1 · MISSION CONTROL
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(232,0,45,0.16)",
              border: "1px solid rgba(232,0,45,0.5)",
              padding: "4px 10px",
              borderRadius: "20px",
              color: "var(--neon-red)",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.68rem",
              fontWeight: "900",
              letterSpacing: "0.08em",
              boxShadow: "0 0 12px rgba(232,0,45,0.3)",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--neon-red)",
                boxShadow: "0 0 8px var(--neon-red)",
                animation: "pulseGlow 1.5s infinite",
              }}
            />
            LIVE TELEMETRY
          </div>
        </div>

        {/* Center: Grand Prix Showcase & Live Lap Telemetry HUD */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "6px 18px",
            minWidth: "480px",
          }}
        >
          {/* Top Row: Nation Badge, Round Pill, GP Title & Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                fontWeight: "900",
                color: "var(--neon-yellow)",
                background: "rgba(255,215,0,0.12)",
                border: "1px solid rgba(255,215,0,0.35)",
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
              title={selectedCircuit?.country}
            >
              {CIRCUIT_IOC_MAP[selectedCircuit?.circuit_id] || (selectedCircuit?.country || "AUS").substring(0, 3).toUpperCase()}
            </span>

            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "900",
                color: "var(--neon-red)",
                background: "rgba(232,0,45,0.15)",
                border: "1px solid rgba(232,0,45,0.4)",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              R{String(selectedCircuit?.round || 1).padStart(2, "0")} · 2026
            </span>

            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.92rem",
                fontWeight: "900",
                color: "#ffffff",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {selectedCircuit?.grand_prix_name || "AUSTRALIAN GRAND PRIX"}
            </span>

            {/* Styled GP Dropdown Selector */}
            <select
              value={selectedCircuit?.circuit_id || "australia"}
              onChange={(e) => handleCircuitChange(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "var(--neon-cyan)",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "0.70rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "800",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s ease",
                maxWidth: "155px",
                flexShrink: 0,
              }}
            >
              {(circuits.length > 0 ? circuits : [DEFAULT_CIRCUIT]).map((c) => (
                <option key={c.circuit_id} value={c.circuit_id} style={{ background: "#121420", color: "#fff" }}>
                  R{String(c.round).padStart(2, "0")} · {c.city || c.country}
                </option>
              ))}
            </select>
          </div>

          {/* Bottom Row: Circuit Name + Live Lap Progress Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
              📍 {selectedCircuit?.circuit_name || "Albert Park Circuit"}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "#ffffff" }}>
              🏁 LAP {currentLapNum} / {totalLaps} <span style={{ color: "var(--neon-green)" }}>({lapProgressPct}%)</span>
            </span>

            {/* Micro Laser Progress Bar */}
            <div style={{ width: "90px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${lapProgressPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--neon-green), var(--neon-cyan))",
                  borderRadius: "2px",
                  boxShadow: "0 0 6px var(--neon-green)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: FIA Race Control Digital Clock Capsule */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(18,20,32,0.95) 0%, rgba(10,12,18,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            padding: "6px 16px",
            textAlign: "right",
            minWidth: "150px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
              GPS SYNC
            </span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Orbitron', monospace" }}>
              FIA TIMING
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "1.25rem",
              fontWeight: "900",
              color: "#ffffff",
              marginTop: "2px",
              letterSpacing: "0.06em",
              textShadow: "0 0 10px rgba(255,255,255,0.3)",
            }}
          >
            {timeStr}
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs (Two-Tier Cockpit Deck) ── */}
      <nav className="nav-tabs" aria-label="Primary command center navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            title={`${tab.subtitle} (Alt+${TABS.indexOf(tab) + 1})`}
          >
            <span>{tab.label}</span>
            <span className="nav-tab-subtitle">{tab.subtitle}</span>
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main id="command-main" className="main-content" tabIndex="-1">
        <div className="context-bar" aria-live="polite">
          <span>Command center</span>
          <strong>{activeTabMeta.subtitle}</strong>
          <kbd>Alt + {TABS.indexOf(activeTabMeta) + 1}</kbd>
        </div>
        <Suspense fallback={<CommandLoader label={activeTabMeta.subtitle} />}>
          {activeTab === "timing"    && <TimingTower selectedCircuit={selectedCircuit} onGoToCalendar={() => setActiveTab("calendar")} />}
          {activeTab === "calendar"  && (
            <CalendarView
              selectedCircuit={selectedCircuit}
              onSelectCircuit={(c) => setSelectedCircuit(c)}
              onLaunchPitWall={(c) => {
                setSelectedCircuit(c);
                setActiveTab("timing");
              }}
            />
          )}
          {activeTab === "paddock"   && <TeamsPaddock />}
          {activeTab === "strategy"  && <StrategyAdvisor selectedCircuit={selectedCircuit} />}
          {activeTab === "telemetry" && <TelemetryViewer selectedCircuit={selectedCircuit} />}
          {activeTab === "budget"    && <BudgetManager />}
        </Suspense>
      </main>
    </div>
  );
}
