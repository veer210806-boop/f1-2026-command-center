// ============================================================
// CalendarView.jsx — Official F1 2026 Season Calendar & Race Cards
// Modeled directly after formula1.com/en/racing/2026
// Featuring verified official race card background photography
// ============================================================
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { OFFICIAL_CIRCUIT_PATHS } from "../data/officialCircuitSvgs";
import { SEASON_2026_ROUNDS, PERIOD_CONFIG } from "../data/calendar2026";
import { getRaceCardImage, isSprintWeekend, getWeekendSchedule } from "../data/f1CalendarMedia2026";
import { getDriverFaceUrl } from "../data/f1MediaAssets2026";
import TeamRadioModal from "./TeamRadioModal";

export function CalendarPirelliBadge({ label = "HARD", compoundCode = "C2", color = "#ffffff", letter = "H", size = 16 }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${color}66`,
        borderRadius: "5px",
        padding: "3px 8px",
        boxShadow: `0 2px 6px ${color}22`,
      }}
      title={`Pirelli ${label} (${compoundCode})`}
    >
      <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: "block", flexShrink: 0 }}>
        <circle cx="14" cy="14" r="13" fill="#101118" stroke="#252735" strokeWidth="1.2" />
        <circle cx="14" cy="14" r="10.2" fill="#141624" stroke={color} strokeWidth="2.5" />
        <circle cx="14" cy="14" r="7.8" fill="#0c0d14" />
        <text
          x="14"
          y="14"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontFamily="'Orbitron', monospace"
          fontWeight="900"
          fontSize="11.5"
          style={{ textShadow: `0 0 4px ${color}88` }}
        >
          {letter}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
        <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color }}>
          {compoundCode}
        </span>
        <span style={{ fontSize: "0.48rem", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

const HISTORIC_WINNERS_MAP = {
  australia: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
  ],
  china: [
    { year: 2025, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2019, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2018, driver: "Daniel Ricciardo", code: "RIC", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  japan: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  bahrain: [
    { year: 2025, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
  ],
  saudi_arabia: [
    { year: 2025, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Sergio Pérez", code: "PER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  miami: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  imola: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2021, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  monaco: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Sergio Pérez", code: "PER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  barcelona: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  spain: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  canada: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  austria: [
    { year: 2025, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2024, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
  ],
  silverstone: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
  ],
  great_britain: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
  ],
  belgium: [
    { year: 2025, driver: "Lewis Hamilton", code: "HAM", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  spa: [
    { year: 2025, driver: "Lewis Hamilton", code: "HAM", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  hungary: [
    { year: 2025, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  netherlands: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  monza: [
    { year: 2025, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  italy: [
    { year: 2025, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  azerbaijan: [
    { year: 2025, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Sergio Pérez", code: "PER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  baku: [
    { year: 2025, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Oscar Piastri", code: "PIA", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Sergio Pérez", code: "PER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  singapore: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2022, driver: "Sergio Pérez", code: "PER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  united_states: [
    { year: 2025, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  mexico: [
    { year: 2025, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2024, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  brazil: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
  ],
  las_vegas: [
    { year: 2025, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2024, driver: "George Russell", code: "RUS", team: "Mercedes", teamColor: "#00D2BE" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
  qatar: [
    { year: 2025, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2024, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2021, driver: "Lewis Hamilton", code: "HAM", team: "Mercedes", teamColor: "#00D2BE" },
  ],
  abu_dhabi: [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
  ],
};

function getCircuitHistoricWinners(circuitId) {
  const key = String(circuitId || "").toLowerCase().replace(/[-\s]/g, "_");
  if (HISTORIC_WINNERS_MAP[key]) return HISTORIC_WINNERS_MAP[key];
  return [
    { year: 2025, driver: "Lando Norris", code: "NOR", team: "McLaren", teamColor: "#FF8000" },
    { year: 2024, driver: "Carlos Sainz", code: "SAI", team: "Ferrari", teamColor: "#E8002D" },
    { year: 2023, driver: "Max Verstappen", code: "VER", team: "Red Bull", teamColor: "#1E41FF" },
    { year: 2022, driver: "Charles Leclerc", code: "LEC", team: "Ferrari", teamColor: "#E8002D" },
  ];
}

export default function CalendarView({ selectedCircuit, onSelectCircuit, onLaunchPitWall }) {
  const initialRound = selectedCircuit?.round || 1;
  const [inspectedRoundNum, setInspectedRoundNum] = useState(initialRound);
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "dossier" | "matrix"
  const [filterMode, setFilterMode] = useState("all"); // "all" | "sprint" | "night" | "street" | "highspeed" | "first_half" | "second_half"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("round"); // "round" | "length" | "laps"
  const [activeModalRace, setActiveModalRace] = useState(null);
  const [modalTab, setModalTab] = useState("schedule"); // "schedule" | "telemetry" | "winners"
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false);

  const NIGHT_CIRCUITS = ["bahrain", "saudi_arabia", "singapore", "las_vegas", "qatar", "abu_dhabi"];
  const STREET_CIRCUITS = ["australia", "saudi_arabia", "miami", "monaco", "canada", "azerbaijan", "singapore", "las_vegas"];
  const HIGH_SPEED_CIRCUITS = ["italy", "belgium", "great_britain", "japan", "austria"];

  // Currently inspected race in split dossier view
  const inspectedRace = useMemo(() => {
    return SEASON_2026_ROUNDS.find((r) => r.round === inspectedRoundNum) || SEASON_2026_ROUNDS[0];
  }, [inspectedRoundNum]);

  // Filtered & sorted rounds for Cards view
  const filteredRounds = useMemo(() => {
    let list = [...SEASON_2026_ROUNDS];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => 
        r.country.toLowerCase().includes(q) ||
        r.grand_prix_name.toLowerCase().includes(q) ||
        r.circuit_name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        String(r.round).includes(q)
      );
    }
    if (filterMode === "sprint") {
      list = list.filter((r) => isSprintWeekend(r.round));
    } else if (filterMode === "night") {
      list = list.filter((r) => NIGHT_CIRCUITS.includes(r.circuit_id));
    } else if (filterMode === "street") {
      list = list.filter((r) => STREET_CIRCUITS.includes(r.circuit_id));
    } else if (filterMode === "highspeed") {
      list = list.filter((r) => HIGH_SPEED_CIRCUITS.includes(r.circuit_id));
    } else if (filterMode === "first_half") {
      list = list.filter((r) => r.round <= 12);
    } else if (filterMode === "second_half") {
      list = list.filter((r) => r.round >= 13);
    }
    if (sortMode === "round") {
      list.sort((a, b) => a.round - b.round);
    } else if (sortMode === "length") {
      list.sort((a, b) => (b.length_km || 0) - (a.length_km || 0));
    } else if (sortMode === "laps") {
      list.sort((a, b) => (b.laps || 0) - (a.laps || 0));
    }
    return list;
  }, [filterMode, searchQuery, sortMode]);

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeModalRace) return;
      if (e.key === "Escape") {
        setActiveModalRace(null);
      } else if (e.key === "ArrowLeft") {
        navigateModal(-1);
      } else if (e.key === "ArrowRight") {
        navigateModal(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalRace]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModalRace) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeModalRace]);

  const navigateModal = (direction) => {
    if (!activeModalRace) return;
    const currentIdx = SEASON_2026_ROUNDS.findIndex((r) => r.round === activeModalRace.round);
    if (currentIdx === -1) return;
    let nextIdx = (currentIdx + direction) % SEASON_2026_ROUNDS.length;
    if (nextIdx < 0) nextIdx = SEASON_2026_ROUNDS.length - 1;
    setActiveModalRace(SEASON_2026_ROUNDS[nextIdx]);
  };

  const isGloballyActive = (race) => {
    if (!selectedCircuit || !race) return false;
    return selectedCircuit.circuit_id === race.circuit_id || selectedCircuit.round === race.round;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "840px" }}>
      <style>{`
        @keyframes pulseBeacon {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 10px rgba(232, 0, 45, 0.9); }
        }
      `}</style>

      {/* ════════ TIER 1: UNIFIED CALENDAR MISSION GANTRY DECK (44px) ════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(9, 12, 19, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderTop: "2px solid var(--neon-red)",
          borderRadius: "8px",
          padding: "6px 14px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.65)",
          flexWrap: "wrap",
          minHeight: "44px",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Return, Title & Next GP Beacon */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            onClick={() => {
              if (onLaunchPitWall) onLaunchPitWall(inspectedRace);
            }}
            title="Return to Pit Wall"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--neon-red)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            ←
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.86rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.08em" }}>
              <span style={{ color: "var(--neon-red)" }}>F1</span> SCHEDULE 2026
            </span>
            <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "1px 6px", borderRadius: "3px", fontWeight: "700" }}>
              24 FIA ROUNDS
            </span>
          </div>

          {/* Next Grand Prix Live Beacon Capsule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(232, 0, 45, 0.12)",
              border: "1px solid rgba(232, 0, 45, 0.35)",
              padding: "2.5px 8px",
              borderRadius: "4px",
              fontSize: "0.66rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "800",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-red)", animation: "pulseBeacon 1.5s infinite" }} />
            <span style={{ color: "var(--neon-red)" }}>NEXT:</span>
            <span style={{ color: "#ffffff" }}>R01 AUSTRALIA (MAR 06-08)</span>
          </div>
        </div>

        {/* Center: Season Telemetry Micro-Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
          <span>⚡ 6 SPRINTS</span>
          <span>·</span>
          <span>🛣️ 8 STREETS</span>
          <span>·</span>
          <span>📏 7,344 KM</span>
        </div>

        {/* Right: View Switcher & Active Circuit Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              background: "rgba(0, 0, 0, 0.4)",
              padding: "2px",
              borderRadius: "5px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              style={{
                background: viewMode === "cards" ? "linear-gradient(135deg, rgba(232,0,45,0.9) 0%, rgba(180,0,30,0.95) 100%)" : "transparent",
                color: viewMode === "cards" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                padding: "3px 10px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: viewMode === "cards" ? "0 0 10px rgba(232,0,45,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              🏁 RACE CARDS
            </button>
            <button
              onClick={() => setViewMode("dossier")}
              style={{
                background: viewMode === "dossier" ? "linear-gradient(135deg, rgba(232,0,45,0.9) 0%, rgba(180,0,30,0.95) 100%)" : "transparent",
                color: viewMode === "dossier" ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                padding: "3px 10px",
                borderRadius: "3px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: viewMode === "dossier" ? "0 0 10px rgba(232,0,45,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              📊 SPLIT DOSSIER
            </button>
          </div>

          {selectedCircuit && (
            <div
              style={{
                background: "rgba(0,204,68,0.12)",
                border: "1px solid rgba(0,204,68,0.35)",
                padding: "3px 8px",
                borderRadius: "4px",
                color: "var(--neon-green)",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.64rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--neon-green)" }} />
              <span>ACTIVE: R{selectedCircuit.round || 1} {selectedCircuit.city?.toUpperCase() || "MELBOURNE"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════ TIER 2: UNIFIED COMMAND & HIGH-SPEED FILTER STRIP (42px) ════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          padding: "5px 12px",
          background: "rgba(14, 17, 27, 0.95)",
          borderRadius: "7px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          flexWrap: "wrap",
        }}
      >
        {/* Real-time Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "230px", position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search GP, Circuit, City..."
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px",
              padding: "5px 10px",
              color: "#fff",
              fontSize: "0.74rem",
              fontFamily: "'Rajdhani', sans-serif",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--neon-red)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "6px", background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.76rem" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Category Pills */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
            FILTER:
          </span>
          {[
            { id: "all", label: "ALL (24)" },
            { id: "sprint", label: "⚡ SPRINT (6)" },
            { id: "night", label: "🌃 NIGHT (6)" },
            { id: "street", label: "🛣️ STREET (8)" },
            { id: "highspeed", label: "🏎️ FAST (5)" },
            { id: "first_half", label: "R01-12" },
            { id: "second_half", label: "R13-24" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              style={{
                background: filterMode === f.id ? "rgba(232,0,45,0.22)" : "rgba(255,255,255,0.03)",
                color: filterMode === f.id ? "var(--neon-red)" : "var(--text-secondary)",
                border: `1px solid ${filterMode === f.id ? "var(--neon-red)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "3px",
                padding: "3px 8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort Controls & Counter */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
            SORT:
          </span>
          {[
            { id: "round", label: "🗓️ ROUND" },
            { id: "length", label: "📏 LENGTH" },
            { id: "laps", label: "🔄 LAPS" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortMode(s.id)}
              style={{
                background: sortMode === s.id ? "rgba(0,210,190,0.18)" : "rgba(255,255,255,0.03)",
                color: sortMode === s.id ? "var(--neon-cyan)" : "var(--text-secondary)",
                border: `1px solid ${sortMode === s.id ? "var(--neon-cyan)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "3px",
                padding: "3px 7px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {s.label}
            </button>
          ))}

          <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 6px", borderRadius: "3px", marginLeft: "4px", fontWeight: "700" }}>
            {filteredRounds.length} RACES
          </span>
        </div>
      </div>

      {/* ── Race Cards Grid (F1.com Photography + Cyberpunk HUD) ── */}
      {viewMode === "cards" && (
        <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredRounds.map((race) => {
              const bgImage = getRaceCardImage(race.circuit_id);
              const isSprint = isSprintWeekend(race.round);
              const isActive = isGloballyActive(race);
              const isNight = NIGHT_CIRCUITS.includes(race.circuit_id);
              const isStreet = STREET_CIRCUITS.includes(race.circuit_id);

              return (
                <div
                  key={race.round}
                  onClick={() => setActiveModalRace(race)}
                  style={{
                    minHeight: "355px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    cursor: "pointer",
                    borderTop: `3px solid ${isActive ? "var(--neon-green)" : isSprint ? "#ffdd00" : "rgba(255,255,255,0.18)"}`,
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    background: `url('${bgImage}') center center / cover no-repeat`,
                    boxShadow: isActive
                      ? "0 10px 28px rgba(0,204,68,0.3)"
                      : "0 8px 24px rgba(0,0,0,0.65)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 18px 44px rgba(0,0,0,0.9)";
                    e.currentTarget.style.borderTopColor = "var(--neon-red)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isActive
                      ? "0 14px 34px rgba(0,204,68,0.3)"
                      : "0 10px 30px rgba(0,0,0,0.65)";
                    e.currentTarget.style.borderTopColor = isActive
                      ? "var(--neon-green)"
                      : isSprint
                      ? "#ffdd00"
                      : "rgba(255,255,255,0.18)";
                  }}
                >
                  {/* Vibrant Edge-Only Contrast Vignette (Clear, bright photographic display) */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(8,10,18,0.5) 0%, rgba(8,10,18,0.08) 18%, transparent 28%, transparent 64%, rgba(6,7,12,0.8) 88%, rgba(6,7,12,0.96) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Subtle Top-Right Atmospheric Glow */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "radial-gradient(circle at 85% 15%, rgba(232,0,45,0.08) 0%, transparent 40%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* ── CARD TOP BAR: Round, Sprint, Weather & Flag ── */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Left: Round Pill & Category Badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            color: "var(--neon-red)",
                            letterSpacing: "0.08em",
                            background: "rgba(10, 12, 20, 0.85)",
                            border: "1px solid rgba(232,0,45,0.6)",
                            padding: "3px 9px",
                            borderRadius: "4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                          }}
                        >
                          ROUND {String(race.round).padStart(2, "0")}
                        </span>

                        {isSprint && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "800",
                              color: "var(--neon-yellow)",
                              background: "rgba(255,221,0,0.18)",
                              border: "1px solid var(--neon-yellow)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              boxShadow: "0 0 8px rgba(255,221,0,0.3)",
                            }}
                          >
                            ⚡ SPRINT
                          </span>
                        )}

                        {isNight && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "700",
                              color: "#bf7fff",
                              background: "rgba(191,127,255,0.16)",
                              border: "1px solid rgba(191,127,255,0.4)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            🌃 NIGHT
                          </span>
                        )}

                        {isStreet && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "700",
                              color: "var(--neon-cyan)",
                              background: "rgba(0,210,190,0.16)",
                              border: "1px solid rgba(0,210,190,0.4)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            🛣️ STREET
                          </span>
                        )}

                        {isActive && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "800",
                              color: "var(--neon-green)",
                              background: "rgba(0,204,68,0.22)",
                              border: "1px solid var(--neon-green)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              boxShadow: "0 0 8px rgba(0,204,68,0.4)",
                            }}
                          >
                            ● ACTIVE GP
                          </span>
                        )}
                      </div>

                      {/* Date Range & Month Pill */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "baseline",
                          gap: "6px",
                          marginTop: "4px",
                          background: "rgba(8, 10, 18, 0.85)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          width: "fit-content",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.7)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "1.1rem",
                            fontWeight: "900",
                            color: "#ffffff",
                          }}
                        >
                          {race.day_range}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.82rem",
                            fontWeight: "800",
                            color: "var(--neon-red)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {race.month}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            color: "var(--text-dim)",
                          }}
                        >
                          2026
                        </span>
                      </div>
                    </div>

                    {/* Right: Weather & Country Host Flag Badge */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(0,0,0,0.6)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          padding: "4px 10px",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.95rem",
                          fontWeight: "800",
                          color: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        }}
                      >
                        <span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.72rem",
                              fontWeight: "900",
                              color: "var(--neon-cyan)",
                              background: "rgba(0, 210, 190, 0.15)",
                              border: "1px solid rgba(0, 210, 190, 0.35)",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {race.country === "UNITED STATES" ? "USA" : race.country.slice(0, 3).toUpperCase()}
                          </span>
                        </span>
                      </div>

                      {race.weather && (
                        <div
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.68rem",
                            fontWeight: "700",
                            color: "rgba(255,255,255,0.9)",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{race.weather.icon}</span>
                          <span>{race.weather.air_temp}°C</span>
                          <span style={{ color: "var(--text-dim)" }}>· {race.weather.rain_chance}% Rain</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── CARD CENTER: Open Photographic Stage (Clean, unobstructed view) ── */}
                  <div style={{ flex: 1, minHeight: "50px" }} />

                  {/* ── CARD BOTTOM: Title, City & Technical Telemetry Specs ── */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      background: "linear-gradient(180deg, transparent 0%, rgba(6,8,14,0.65) 18%, rgba(6,8,14,0.96) 100%)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "1.32rem",
                          fontWeight: "900",
                          color: "#ffffff",
                          letterSpacing: "0.04em",
                          lineHeight: 1.1,
                          textTransform: "uppercase",
                          textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                        }}
                      >
                        {race.country}
                      </div>
                      <div
                        style={{
                          fontSize: "0.84rem",
                          color: "#ffffff",
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: "600",
                          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                        }}
                      >
                        {race.grand_prix_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "rgba(255,255,255,0.8)",
                          fontFamily: "'Orbitron', monospace",
                          letterSpacing: "0.04em",
                          marginTop: "2px",
                          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                        }}
                      >
                        {race.circuit_name} · {race.city}
                      </div>
                    </div>

                    {/* 4-Column HUD Telemetry Badges */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "6px",
                        padding: "8px 0",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        textAlign: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                          Laps
                        </div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "800", color: "#fff" }}>
                          {race.laps}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                          Length
                        </div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "800", color: "#fff" }}>
                          {race.length_km}k
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                          Corners
                        </div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "800", color: "#fff" }}>
                          {race.corners}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                          DRS
                        </div>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "800", color: "var(--neon-green)" }}>
                          {race.drs_zones}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalRace(race);
                        }}
                        className="btn btn-sm btn-dark"
                        style={{
                          flex: 1,
                          fontSize: "0.72rem",
                          padding: "8px 10px",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "700",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "#fff",
                          borderRadius: "6px",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                          e.currentTarget.style.borderColor = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        }}
                      >
                        DOSSIER →
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onLaunchPitWall) {
                            onLaunchPitWall(race);
                          } else if (onSelectCircuit) {
                            onSelectCircuit(race);
                          }
                        }}
                        className="btn btn-sm btn-red"
                        style={{
                          flex: 1.3,
                          fontSize: "0.72rem",
                          padding: "8px 10px",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "800",
                          background: isActive ? "rgba(0,204,68,0.2)" : "var(--neon-red)",
                          border: `1px solid ${isActive ? "var(--neon-green)" : "var(--neon-red)"}`,
                          color: isActive ? "var(--neon-green)" : "#fff",
                          borderRadius: "6px",
                          boxShadow: isActive ? "0 0 10px rgba(0,204,68,0.4)" : "0 0 10px rgba(232,0,45,0.4)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {isActive ? "ACTIVE ON WALL" : "PIT WALL 🏎️"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* ══════════════════════════════════════════════════════════════
          MODE 2: SPLIT DOSSIER & TRACK WIREFRAME VIEW
          ══════════════════════════════════════════════════════════════ */}
      {viewMode === "dossier" && (
        <div style={{ display: "grid", gridTemplateColumns: "480px 1fr", gap: "24px", alignItems: "start" }}>
          {/* Left: Schedule List */}
          <div
            style={{
              background: "rgba(16, 16, 24, 0.75)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "16px",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.75rem",
                fontFamily: "'Orbitron', monospace",
                color: "var(--text-secondary)",
              }}
            >
              <span>2026 CALENDAR SCHEDULE</span>
              <span style={{ color: "var(--neon-red)" }}>{inspectedRace.dates}</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "680px",
                overflowY: "auto",
                paddingRight: "6px",
              }}
            >
              {SEASON_2026_ROUNDS.map((race) => {
                const isSelected = race.round === inspectedRoundNum;
                const isRaceActive = isGloballyActive(race);
                const isSummerBreak = race.round === 14;

                return (
                  <div key={race.round} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {isSummerBreak && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "6px 0", opacity: 0.85 }}>
                        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #ffaa00, transparent)" }} />
                        <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", color: "#ffaa00" }}>
                          ☀️ F1 SUMMER BREAK (JUL 26 - AUG 21)
                        </span>
                        <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #ffaa00, transparent)" }} />
                      </div>
                    )}

                    <div
                      onClick={() => setInspectedRoundNum(race.round)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: isSelected
                          ? "rgba(232, 0, 45, 0.2)"
                          : "rgba(255, 255, 255, 0.025)",
                        borderTop: isSelected ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.05)",
                        borderRight: isSelected ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.05)",
                        borderBottom: isSelected ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.05)",
                        borderLeft: isSelected ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.05)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          minWidth: "36px",
                          textAlign: "center",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "900",
                          color: isSelected ? "var(--neon-yellow)" : "var(--neon-cyan)",
                          background: isSelected ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 210, 190, 0.12)",
                          border: isSelected ? "1px solid rgba(255, 215, 0, 0.4)" : "1px solid rgba(0, 210, 190, 0.3)",
                          padding: "3px 5px",
                          borderRadius: "4px",
                          letterSpacing: "0.06em",
                          flexShrink: 0,
                        }}
                      >
                        {race.country === "UNITED STATES" ? "USA" : race.country.slice(0, 3).toUpperCase()}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", minWidth: "60px" }}>
                        <span style={{ fontSize: "0.65rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>
                          {race.month}
                        </span>
                        <span style={{ fontSize: "0.95rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ff2a2a" }}>
                          {race.day_range}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                          ROUND {race.round} · {race.city}
                        </div>
                        <div style={{ fontSize: "0.92rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {race.country}
                        </div>
                      </div>
                      {isRaceActive && (
                        <span style={{ fontSize: "0.65rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.2)", padding: "2px 6px", borderRadius: "3px" }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Track Dossier */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(20, 22, 34, 0.9) 0%, rgba(12, 13, 20, 0.95) 100%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
              borderRight: "1px solid rgba(255, 255, 255, 0.12)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              padding: "26px",
              backdropFilter: "blur(16px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Header / Circuit Type */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "#e8e8f0",
                }}
              >
                <span>{inspectedRace.type_icon}</span>
                <span>{inspectedRace.circuit_type}</span>
              </div>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                ROUND {String(inspectedRace.round).padStart(2, "0")} / 24
              </span>
            </div>

            {/* Glowing Track Map Outline SVG with Beacon */}
            <div
              style={{
                height: "210px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
              }}
            >
              <svg
                viewBox="0 0 500 500"
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "210px",
                  filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 20px rgba(0, 136, 255, 0.4))",
                }}
              >
                <path
                  d={OFFICIAL_CIRCUIT_PATHS[inspectedRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={OFFICIAL_CIRCUIT_PATHS[inspectedRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle r="9" fill="var(--neon-red)" style={{ filter: "drop-shadow(0 0 8px #ff1801)" }}>
                  <animateMotion
                    dur="8s"
                    repeatCount="indefinite"
                    path={OFFICIAL_CIRCUIT_PATHS[inspectedRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                  />
                </circle>
              </svg>
            </div>

            {/* Title & Circuit */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    fontFamily: "'Orbitron', monospace",
                    color: "var(--neon-yellow)",
                    background: "rgba(255, 215, 0, 0.15)",
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.08em",
                    boxShadow: "0 0 12px rgba(255, 215, 0, 0.2)",
                  }}
                >
                  {inspectedRace.country === "UNITED STATES" ? "USA" : inspectedRace.country.slice(0, 3).toUpperCase()}
                </span>
                <h1
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "2rem",
                    fontWeight: "900",
                    color: "#ffffff",
                    letterSpacing: "0.05em",
                    margin: 0,
                    textTransform: "uppercase",
                  }}
                >
                  {inspectedRace.grand_prix_name}
                </h1>
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "1.05rem",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                {inspectedRace.circuit_name} · {inspectedRace.city}
              </div>
            </div>

            {/* Metrics Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "14px 0",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>First GP</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                  {inspectedRace.first_gp}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Laps</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                  {inspectedRace.laps}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Length</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                  {inspectedRace.length_km} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>km</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Distance</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginTop: "4px" }}>
                  {(inspectedRace.laps * inspectedRace.length_km).toFixed(1)} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>km</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Lap Record</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "700", color: "var(--neon-yellow)", marginTop: "4px" }}>
                  {inspectedRace.lap_record?.time}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "2px" }}>
                  {inspectedRace.lap_record?.driver}
                </div>
              </div>
            </div>

            {/* 2026 Race Weekend Weather Bar */}
            {inspectedRace.weather && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.7rem" }}>{inspectedRace.weather.icon || "☀️"}</span>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#fff", fontFamily: "'Orbitron', monospace" }}>
                      2026 FORECAST: <span style={{ color: "var(--neon-green)" }}>{inspectedRace.weather.condition}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Track: {inspectedRace.weather.track_temp}°C · Air: {inspectedRace.weather.air_temp}°C · Rain: {inspectedRace.weather.rain_chance}% · Wind: {inspectedRace.weather.wind}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2026 Pirelli Compound Allocation */}
            {inspectedRace.compounds && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#fff", fontFamily: "'Orbitron', monospace" }}>
                    PIRELLI COMPOUND NOMINATIONS
                  </div>
                  <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Dry tire compound allocations for {inspectedRace.city}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <CalendarPirelliBadge label="HARD" compoundCode={inspectedRace.compounds[0] || "C2"} color="#ffffff" letter="H" size={16} />
                  <CalendarPirelliBadge label="MED" compoundCode={inspectedRace.compounds[1] || "C3"} color="#ffd700" letter="M" size={16} />
                  <CalendarPirelliBadge label="SOFT" compoundCode={inspectedRace.compounds[2] || "C4"} color="#ff1801" letter="S" size={16} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  if (onSelectCircuit) onSelectCircuit(inspectedRace);
                }}
                className="btn"
                style={{
                  flex: 1,
                  background: isGloballyActive(inspectedRace) ? "rgba(255,255,255,0.1)" : "var(--neon-red)",
                  borderTop: isGloballyActive(inspectedRace) ? "1px solid var(--neon-red)" : "none",
                  borderRight: isGloballyActive(inspectedRace) ? "1px solid var(--neon-red)" : "none",
                  borderBottom: isGloballyActive(inspectedRace) ? "1px solid var(--neon-red)" : "none",
                  borderLeft: isGloballyActive(inspectedRace) ? "1px solid var(--neon-red)" : "none",
                  color: "#fff",
                  padding: "12px 18px",
                }}
              >
                {isGloballyActive(inspectedRace) ? "⭐ CURRENTLY ACTIVE RACE" : "🏁 SET AS ACTIVE GRAND PRIX"}
              </button>

              <button
                onClick={() => {
                  if (onLaunchPitWall) {
                    onLaunchPitWall(inspectedRace);
                  } else if (onSelectCircuit) {
                    onSelectCircuit(inspectedRace);
                  }
                }}
                className="btn btn-dark"
                style={{
                  background: "rgba(0, 136, 255, 0.2)",
                  borderTop: "1px solid var(--neon-blue)",
                  borderRight: "1px solid var(--neon-blue)",
                  borderBottom: "1px solid var(--neon-blue)",
                  borderLeft: "1px solid var(--neon-blue)",
                  color: "var(--neon-blue)",
                  padding: "12px 18px",
                }}
              >
                🏎️ LAUNCH PIT WALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          INTERACTIVE 2-COLUMN RACE DOSSIER MODAL (Next-Gen F1 Cockpit Guide)
          ══════════════════════════════════════════════════════════════ */}
      {activeModalRace && typeof document !== "undefined" && createPortal((() => {
        const modalSchedule = getWeekendSchedule(activeModalRace);
        const modalWinners = getCircuitHistoricWinners(activeModalRace.circuit_id);
        const isSprint = isSprintWeekend(activeModalRace.round);
        const isActiveCircuit = isGloballyActive(activeModalRace);

        return (
          <div
            onClick={() => setActiveModalRace(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(2, 4, 8, 0.88)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "1220px",
                width: "95vw",
                maxHeight: "min(90vh, 840px)",
                overflowY: "auto",
                background: "linear-gradient(155deg, #111420 0%, #090b12 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderTop: "2px solid var(--neon-red)",
                borderRadius: "14px",
                boxShadow: "0 25px 80px rgba(0,0,0,0.95), 0 0 35px rgba(232,0,45,0.2)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                padding: "18px 22px 16px 22px",
                boxSizing: "border-box",
              }}
            >
              {/* ── FULL-WIDTH MODAL HERO HEADER ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "10px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {/* Left: Nationality Badge & Grand Prix Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      background: "rgba(232,0,45,0.2)",
                      border: "1px solid var(--neon-red)",
                      color: "var(--neon-red)",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.88rem",
                      fontWeight: "900",
                      padding: "4px 9px",
                      borderRadius: "5px",
                      boxShadow: "0 0 10px rgba(232,0,45,0.4)",
                    }}
                  >
                    {activeModalRace.country === "UNITED STATES" ? "USA" : (activeModalRace.country?.slice(0, 3).toUpperCase() || "GP")}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "1.25rem",
                          fontWeight: "900",
                          color: "#ffffff",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {activeModalRace.grand_prix_name}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.64rem",
                          color: "var(--neon-red)",
                          background: "rgba(232,0,45,0.15)",
                          border: "1px solid rgba(232,0,45,0.4)",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          fontWeight: "800",
                        }}
                      >
                        ROUND {String(activeModalRace.round).padStart(2, "0")} / 24
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "1px" }}>
                      {activeModalRace.dates}, 2026 · {activeModalRace.circuit_name}, {activeModalRace.city}
                    </div>
                  </div>
                </div>

                {/* Center: Circuit Key Specs Ribbon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.64rem",
                    fontFamily: "'Orbitron', monospace",
                    color: "var(--text-secondary)",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "4px 10px",
                    borderRadius: "5px",
                  }}
                >
                  <span><strong style={{ color: "#ffffff" }}>{activeModalRace.laps}</strong> LAPS</span>
                  <span>·</span>
                  <span><strong style={{ color: "#ffffff" }}>{activeModalRace.length_km}</strong> KM</span>
                  <span>·</span>
                  <span><strong style={{ color: "#ffffff" }}>{activeModalRace.corners}</strong> TURNS</span>
                  <span>·</span>
                  <span style={{ color: "var(--neon-green)" }}><strong style={{ color: "var(--neon-green)" }}>{activeModalRace.drs_zones}</strong> DRS ZONES</span>
                </div>

                {/* Right: Round Nav & Close Button */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => navigateModal(-1)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      padding: "4px 9px",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    ◀ PREV
                  </button>
                  <button
                    onClick={() => navigateModal(1)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      padding: "4px 9px",
                      borderRadius: "4px",
                      fontSize: "0.68rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    NEXT ▶
                  </button>
                  <button
                    onClick={() => setActiveModalRace(null)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      marginLeft: "4px",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--neon-red)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 2-Column Split Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.22fr 1fr",
                  gap: "16px",
                  alignItems: "stretch",
                }}
              >
                {/* ════════════ LEFT COLUMN: TIMETABLE & TRACK GUIDE ════════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Tab Switcher: Weekend Timetable vs Track Guide */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setModalTab("schedule")}
                      style={{
                        flex: 1,
                        padding: "7px 12px",
                        borderRadius: "5px",
                        fontSize: "0.70rem",
                        fontFamily: "'Orbitron', monospace",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: modalTab === "schedule"
                          ? "linear-gradient(135deg, rgba(232,0,45,0.9), rgba(180,0,30,0.95))"
                          : "rgba(255,255,255,0.04)",
                        border: modalTab === "schedule"
                          ? "1px solid var(--neon-red)"
                          : "1px solid rgba(255,255,255,0.09)",
                        color: modalTab === "schedule" ? "#ffffff" : "var(--text-secondary)",
                        boxShadow: modalTab === "schedule" ? "0 0 12px rgba(232,0,45,0.35)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <span>📅</span>
                      <span>WEEKEND TIMETABLE</span>
                    </button>

                    <button
                      onClick={() => setModalTab("telemetry")}
                      style={{
                        flex: 1,
                        padding: "7px 12px",
                        borderRadius: "5px",
                        fontSize: "0.70rem",
                        fontFamily: "'Orbitron', monospace",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: modalTab === "telemetry"
                          ? "linear-gradient(135deg, rgba(0,210,190,0.85), rgba(0,160,140,0.9))"
                          : "rgba(255,255,255,0.04)",
                        border: modalTab === "telemetry"
                          ? "1px solid var(--neon-cyan)"
                          : "1px solid rgba(255,255,255,0.09)",
                        color: modalTab === "telemetry" ? "#ffffff" : "var(--text-secondary)",
                        boxShadow: modalTab === "telemetry" ? "0 0 12px rgba(0,210,190,0.35)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <span>📁</span>
                      <span>TRACK GUIDE & 2026 SPECS</span>
                    </button>
                  </div>

                  {/* Tab 1: Weekend Schedule 5 Sessions */}
                  {modalTab === "schedule" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {/* Subheader */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1px 0" }}>
                        <span
                          style={{
                            fontSize: "0.66rem",
                            fontFamily: "'Orbitron', monospace",
                            fontWeight: "800",
                            color: "var(--text-secondary)",
                            letterSpacing: "0.06em",
                          }}
                        >
                          OFFICIAL 2026 FIA TIMETABLE
                        </span>
                        <span
                          style={{
                            fontSize: "0.60rem",
                            fontFamily: "'Orbitron', monospace",
                            fontWeight: "700",
                            color: "var(--neon-green)",
                            background: "rgba(0, 204, 68, 0.14)",
                            border: "1px solid rgba(0, 204, 68, 0.35)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                          }}
                        >
                          ● CONFIRMED
                        </span>
                      </div>

                      {/* 5 Sessions List */}
                      {modalSchedule.map((s, idx) => {
                        const sessionName = s.name || s.session || "";
                        const isRace = sessionName.toLowerCase().includes("race") || sessionName.toLowerCase().includes("grand prix");
                        const isQuali = sessionName.toLowerCase().includes("quali");
                        const isSprint = sessionName.toLowerCase().includes("sprint");
                        const isFP1 = sessionName === "Practice 1" || s.id === "fp1";
                        const isFP2 = sessionName === "Practice 2" || s.id === "fp2";
                        const isFP3 = sessionName === "Practice 3" || s.id === "fp3";

                        let badgeColor = "#00f0ff";
                        let badgeBg = "rgba(0, 240, 255, 0.14)";
                        let badgeBorder = "rgba(0, 240, 255, 0.4)";
                        let badgeText = "FP1";

                        if (isRace) {
                          badgeColor = "#ff3d00";
                          badgeBg = "rgba(255, 61, 0, 0.18)";
                          badgeBorder = "rgba(255, 61, 0, 0.6)";
                          badgeText = "🏆 RACE";
                        } else if (isQuali) {
                          badgeColor = "#c084fc";
                          badgeBg = "rgba(192, 132, 252, 0.18)";
                          badgeBorder = "rgba(192, 132, 252, 0.55)";
                          badgeText = "🏁 QUALI";
                        } else if (isFP3 || isSprint) {
                          badgeColor = "#2979ff";
                          badgeBg = "rgba(41, 121, 255, 0.16)";
                          badgeBorder = "rgba(41, 121, 255, 0.5)";
                          badgeText = isSprint ? "⚡ SPRINT" : "FP3";
                        } else if (isFP2) {
                          badgeColor = "#00e676";
                          badgeBg = "rgba(0, 230, 118, 0.16)";
                          badgeBorder = "rgba(0, 230, 118, 0.5)";
                          badgeText = "FP2";
                        }

                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 11px",
                              borderRadius: "6px",
                              background: isRace
                                ? "linear-gradient(90deg, rgba(232,0,45,0.14) 0%, rgba(20,10,14,0.4) 100%)"
                                : "rgba(255,255,255,0.025)",
                              border: `1px solid ${isRace ? "rgba(232,0,45,0.45)" : isQuali ? "rgba(192,132,252,0.3)" : "rgba(255,255,255,0.06)"}`,
                              boxShadow: isRace ? "0 0 12px rgba(232,0,45,0.15)" : "none",
                            }}
                          >
                            {/* Left Badge & Day */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                              <span
                                style={{
                                  fontFamily: "'Orbitron', monospace",
                                  fontSize: "0.66rem",
                                  fontWeight: "900",
                                  color: badgeColor,
                                  background: badgeBg,
                                  border: `1px solid ${badgeBorder}`,
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  minWidth: "46px",
                                  textAlign: "center",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {badgeText}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'Orbitron', monospace",
                                  fontSize: "0.66rem",
                                  color: "var(--text-secondary)",
                                  fontWeight: "700",
                                }}
                              >
                                {s.day.toUpperCase()}
                              </span>
                            </div>

                            {/* Center: Title & Subtitle */}
                            <div style={{ flex: 1, padding: "0 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span
                                  style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: "0.78rem",
                                    fontWeight: "800",
                                    color: isRace ? "#ffffff" : "#f1f3f9",
                                  }}
                                >
                                  {sessionName}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.56rem",
                                    fontFamily: "'Orbitron', monospace",
                                    fontWeight: "800",
                                    color: badgeColor,
                                    background: badgeBg,
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    border: `1px solid ${badgeBorder}`,
                                  }}
                                >
                                  {isRace
                                    ? `${activeModalRace.laps} LAPS · 25 PTS`
                                    : isQuali
                                    ? "KNOCKOUT SHOOTOUT"
                                    : "60 MINS · TIMED"}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.62rem",
                                  color: "var(--text-dim)",
                                  marginTop: "2px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {isRace
                                  ? `Official 2026 World Championship Grand Prix · ${activeModalRace.laps} Laps · 25 Points to Winner`
                                  : isQuali
                                  ? "Q1 / Q2 / Q3 Knockout Shootout · Pole Position Battle & Official Grid Decider"
                                  : isFP1
                                  ? "Aero Baseline & Initial 2026 Hybrid Power Unit Calibration"
                                  : isFP2
                                  ? "Race Simulation Stints & Thermal Tire Degradation Analysis"
                                  : "Final Qualifying Trim Preparation & Low-Fuel Simulation Runs"}
                              </div>
                            </div>

                            {/* Right: Local Track Time */}
                            <div
                              style={{
                                fontFamily: "'Orbitron', monospace",
                                fontSize: "0.74rem",
                                fontWeight: "800",
                                color: isRace ? "#ffffff" : "#d8dce8",
                                background: isRace ? "rgba(232,0,45,0.25)" : "rgba(0,0,0,0.45)",
                                border: `1px solid ${isRace ? "var(--neon-red)" : "rgba(255,255,255,0.1)"}`,
                                padding: "3px 9px",
                                borderRadius: "4px",
                                letterSpacing: "0.04em",
                                minWidth: "98px",
                                textAlign: "center",
                              }}
                            >
                              {s.time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Tab 2: Track Guide & 2026 Specs */
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Split SVG Vector + Matrix */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "8px", alignItems: "stretch" }}>
                        <div
                          style={{
                            height: "160px",
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: "7px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            padding: "6px",
                          }}
                        >
                          <div style={{ position: "absolute", top: "5px", left: "8px", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)" }}>
                            🌀 2026 ACTIVE AERO & DRS ZONES
                          </div>
                          <svg
                            viewBox="0 0 500 500"
                            style={{
                              width: "88%",
                              height: "88%",
                              maxHeight: "140px",
                              filter: "drop-shadow(0 0 8px rgba(0, 210, 190, 0.45))",
                            }}
                          >
                            <defs>
                              <linearGradient id="pitTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00d2be" />
                                <stop offset="50%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#e8002d" />
                              </linearGradient>
                            </defs>
                            <path
                              d={OFFICIAL_CIRCUIT_PATHS[activeModalRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.12)"
                              strokeWidth="24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d={OFFICIAL_CIRCUIT_PATHS[activeModalRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                              fill="none"
                              stroke="url(#pitTrackGrad)"
                              strokeWidth="13"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle r="12" fill="var(--neon-red)" style={{ filter: "drop-shadow(0 0 8px #ff1801)" }}>
                              <animateMotion
                                dur="8s"
                                repeatCount="indefinite"
                                path={OFFICIAL_CIRCUIT_PATHS[activeModalRace.circuit_id] || OFFICIAL_CIRCUIT_PATHS.australia}
                              />
                            </circle>
                          </svg>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
                          {[
                            { label: "Laps & Distance", value: `${activeModalRace.laps} Laps`, sub: `${(activeModalRace.laps * activeModalRace.length_km).toFixed(1)} km` },
                            { label: "Circuit Length", value: `${activeModalRace.length_km} km`, sub: "FIA Grade 1" },
                            { label: "Corners", value: `${activeModalRace.corners}`, sub: "Apex Turns" },
                            { label: "Aero Zones", value: `${activeModalRace.drs_zones} DRS / Aero`, sub: "X/Z Mode" },
                            { label: "First GP", value: `${activeModalRace.first_gp}`, sub: "History" },
                            { label: "Lap Record", value: activeModalRace.lap_record?.time || "1:19.813", sub: activeModalRace.lap_record?.driver || "C. Leclerc" },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                padding: "5px 7px",
                                borderRadius: "5px",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <div style={{ fontSize: "0.56rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                                {item.label}
                              </div>
                              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "800", color: "#fff", marginTop: "1px" }}>
                                {item.value}
                              </div>
                              <div style={{ fontSize: "0.54rem", color: "var(--text-dim)" }}>
                                {item.sub}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2026 Technical Blueprint */}
                      <div
                        style={{
                          background: "rgba(0, 210, 190, 0.05)",
                          borderLeft: "3px solid var(--neon-cyan)",
                          border: "1px solid rgba(0, 210, 190, 0.2)",
                          borderRadius: "5px",
                          padding: "7px 10px",
                        }}
                      >
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.66rem", color: "var(--neon-cyan)", fontWeight: "800" }}>
                          2026 TECHNICAL BLUEPRINT: ACTIVE AERO & 350KW HYBRID
                        </div>
                        <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", marginTop: "2px", lineHeight: "1.3" }}>
                          X-Mode low drag enabled across {activeModalRace.drs_zones} straight sectors. 350kW MGU-K recovery generates ~4.2 MJ per lap for Manual Override Mode (MOM) deployment.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Left Footer Shortcuts */}
                  <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginTop: "auto", paddingTop: "2px" }}>
                    Keyboard shortcuts: ← / → cycle rounds · ESC to close
                  </div>
                </div>

                {/* ════════════ RIGHT COLUMN: VISUALS, CHAMPIONS & STRATEGY ════════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Card 1: Track Action Photography Banner */}
                  <div
                    style={{
                      height: "170px",
                      borderRadius: "7px",
                      background: `url('${getRaceCardImage(activeModalRace.circuit_id)}') center center / cover no-repeat`,
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Circuit Name Badge on Photo */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "10px",
                        background: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        fontSize: "0.64rem",
                        fontFamily: "'Orbitron', monospace",
                        color: "#ffffff",
                        fontWeight: "700",
                      }}
                    >
                      📍 {activeModalRace.circuit_name} · {activeModalRace.city}
                    </div>

                    {/* Weather pill on photo */}
                    {activeModalRace.weather && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "10px",
                          background: "rgba(0,0,0,0.65)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontSize: "0.62rem",
                          fontFamily: "'Orbitron', monospace",
                          color: "#ffffff",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{activeModalRace.weather.icon || "☀️"}</span>
                        <span>{activeModalRace.weather.air_temp}°C AIR</span>
                        <span style={{ color: "var(--neon-green)" }}>· {activeModalRace.weather.rain_chance}% RAIN</span>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Historic Podium Champions (2022-2025) */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "800", color: "var(--neon-yellow)" }}>
                        <span>🏆</span>
                        <span>HISTORIC PODIUM CHAMPIONS (2022-2025)</span>
                      </div>
                      <span style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                        RECENT WINNERS
                      </span>
                    </div>

                    {/* 4 Winners Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                      {modalWinners.map((w, wIdx) => {
                        const faceUrl = getDriverFaceUrl(w.code);
                        const yearColor = w.year === 2025 ? "#ffd700" : w.year === 2024 ? "#e2e8f0" : w.year === 2023 ? "#fbbf24" : "#94a3b8";
                        return (
                          <div
                            key={wIdx}
                            style={{
                              background: "rgba(0,0,0,0.45)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              borderRadius: "5px",
                              padding: "6px 4px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              gap: "3px",
                            }}
                          >
                            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.60rem", color: yearColor, fontWeight: "800" }}>
                              {w.year}
                            </span>

                            {/* Driver Avatar with Team Glow */}
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                border: `1.5px solid ${w.teamColor || "var(--neon-cyan)"}`,
                                boxShadow: `0 0 6px ${w.teamColor || "var(--neon-cyan)"}44`,
                                overflow: "hidden",
                                background: "rgba(255,255,255,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {faceUrl ? (
                                <img
                                  src={faceUrl}
                                  alt={w.driver}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <span style={{ fontSize: "0.64rem", fontWeight: "800", color: "#fff" }}>
                                  {w.code}
                                </span>
                              )}
                            </div>

                            {/* Driver Name */}
                            <div
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                color: "#ffffff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                fontFamily: "'Orbitron', monospace",
                              }}
                            >
                              {w.driver.split(" ").slice(-1)[0]}
                            </div>

                            {/* Team */}
                            <div
                              style={{
                                fontSize: "0.56rem",
                                color: "var(--text-dim)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                              }}
                            >
                              {w.team}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card 3: Forecast & Strategy */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "7px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "800", color: "var(--neon-cyan)", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>☁️</span>
                      <span>WEATHER BAROMETRICS & STRATEGY FORECAST</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: "8px", alignItems: "stretch" }}>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "5px",
                          padding: "6px 8px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ fontSize: "0.56rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                          ATMOSPHERICS
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "1px" }}>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff" }}>
                            {activeModalRace.weather?.air_temp || 23}° / {activeModalRace.weather?.track_temp || 34}°
                          </span>
                          <span style={{ fontSize: "1rem" }}>{activeModalRace.weather?.icon || "☀️"}</span>
                        </div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-secondary)", marginTop: "2px", lineHeight: "1.25" }}>
                          {activeModalRace.weather?.condition || "Optimal track grip conditions."}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "5px",
                          padding: "6px 8px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.56rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                            TIRE STRATEGY PROJECTION
                          </span>
                          <span style={{ fontSize: "0.52rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                            OPTIMAL 1-STOP
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", margin: "3px 0" }}>
                          <CalendarPirelliBadge label="HARD" compoundCode={activeModalRace.compounds?.[0] || "C2"} color="#ffffff" letter="H" size={13} />
                          <CalendarPirelliBadge label="MED" compoundCode={activeModalRace.compounds?.[1] || "C3"} color="#ffd700" letter="M" size={13} />
                          <CalendarPirelliBadge label="SOFT" compoundCode={activeModalRace.compounds?.[2] || "C4"} color="#ff1801" letter="S" size={13} />
                        </div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-secondary)", lineHeight: "1.25" }}>
                          Allocated: {activeModalRace.compounds?.join(" · ") || "C2 · C3 · C4"}. Recommended pit window: {(() => {
                            const w = String(activeModalRace?.tire_wear || activeModalRace?.circuit_metrics?.tire_wear || "MEDIUM").toUpperCase();
                            const m = w === "LOW" ? 0.45 : w === "HIGH" ? 0.30 : 0.38;
                            const x = w === "LOW" ? 0.55 : w === "HIGH" ? 0.42 : 0.48;
                            return `Lap ${Math.round((activeModalRace.laps || 58) * m)}–${Math.round((activeModalRace.laps || 58) * x)}`;
                          })()} under green flag conditions.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "auto", paddingTop: "2px" }}>
                    <button
                      onClick={() => {
                        if (onSelectCircuit) onSelectCircuit(activeModalRace);
                        setActiveModalRace(null);
                      }}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    >
                      SET ACTIVE CIRCUIT
                    </button>

                    <button
                      onClick={() => setIsRadioModalOpen(true)}
                      style={{
                        background: "rgba(0, 210, 190, 0.15)",
                        border: "1px solid rgba(0, 210, 190, 0.45)",
                        color: "var(--neon-cyan)",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.70rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <span>📻 GP RADIO</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onLaunchPitWall) {
                          onLaunchPitWall(activeModalRace);
                        } else if (onSelectCircuit) {
                          onSelectCircuit(activeModalRace);
                        }
                        setActiveModalRace(null);
                      }}
                      style={{
                        background: isActiveCircuit
                          ? "rgba(0, 204, 68, 0.25)"
                          : "linear-gradient(90deg, #e8002d 0%, #ff1801 100%)",
                        border: isActiveCircuit ? "1px solid var(--neon-green)" : "none",
                        color: isActiveCircuit ? "var(--neon-green)" : "#ffffff",
                        padding: "6px 14px",
                        borderRadius: "4px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.70rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: isActiveCircuit ? "0 0 14px rgba(0,204,68,0.4)" : "0 0 14px rgba(232,0,45,0.45)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {isActiveCircuit ? "ACTIVE ON WALL" : "LAUNCH PIT WALL 🏎️"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ── BoxBox Team Radio Modal ── */}
      <TeamRadioModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        initialDriver="ALL"
      />
    </div>
  );
}
