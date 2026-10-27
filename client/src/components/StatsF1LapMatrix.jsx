// ============================================================
// StatsF1LapMatrix.jsx — Authentic StatsF1 "Tour par Tour" (Lap-by-Lap) Matrix
// Inspired by official StatsF1 Singapore & Grand Prix Lap Charts
// Features: Dynamic Qualifying Grids, Lap 1 Start Scramble Overtakes,
// Multi-Circuit Support, Interactive Driver Highlighting, and Trajectory Lines.
// ============================================================
import React, { useState, useMemo, useRef, useEffect } from "react";
import { DRIVER_IOC_MAP } from "./TimingTower";
import {
  generateRaceWeekendData,
  DRIVER_META,
  getGrandPrixConfig,
} from "../data/raceWeekendGrids2026";

// Team colors matching authentic 2026 liveries
const TEAM_COLORS = {
  "McLaren":         { primary: "#ff8700", secondary: "#47c7fc", text: "#000000" },
  "Red Bull Racing": { primary: "#3671e8", secondary: "#cc1e4a", text: "#ffffff" },
  "Mercedes":        { primary: "#00d2be", secondary: "#ffffff", text: "#000000" },
  "Ferrari":         { primary: "#e8002d", secondary: "#fff200", text: "#ffffff" },
  "Williams":        { primary: "#00a0de", secondary: "#041e42", text: "#ffffff" },
  "Aston Martin":    { primary: "#229971", secondary: "#cedc00", text: "#ffffff" },
  "Alpine":          { primary: "#0090ff", secondary: "#fd4bc7", text: "#ffffff" },
  "Haas":            { primary: "#b6babd", secondary: "#da291c", text: "#000000" },
  "Racing Bulls":    { primary: "#6692ff", secondary: "#ffffff", text: "#ffffff" },
  "RB":              { primary: "#6692ff", secondary: "#ffffff", text: "#ffffff" },
  "Audi":            { primary: "#e50027", secondary: "#000000", text: "#ffffff" },
  "Cadillac":        { primary: "#ffc72c", secondary: "#000000", text: "#000000" },
};

export default function StatsF1LapMatrix({
  drivers = [],
  currentLap = 1,
  maxLaps = 58,
  circuitName = "Australian Grand Prix",
  circuitId = "australia",
  lapHistory = [],
  onSelectDriver,
  selectedDriverCode,
}) {
  const [highlightedDriver, setHighlightedDriver] = useState(selectedDriverCode || null);
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "chart"
  const [selectedCell, setSelectedCell] = useState(null);
  const tableContainerRef = useRef(null);

  // Auto-scroll to the latest lap when currentLap updates
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
    }
  }, [currentLap]);

  // Sync external selected driver
  useEffect(() => {
    if (selectedDriverCode) {
      setHighlightedDriver(selectedDriverCode);
    }
  }, [selectedDriverCode]);

  // Circuit configuration metadata (pole time, pole driver, laps)
  const circuitConfig = useMemo(() => {
    return getGrandPrixConfig(circuitId || circuitName);
  }, [circuitId, circuitName]);

  // Generate or use complete lap history from Lap 0 (Starting Grid) through race
  const completeLapData = useMemo(() => {
    if (lapHistory && lapHistory.length > 0) return lapHistory;

    // Authentic circuit-specific race weekend progression
    const generated = generateRaceWeekendData(circuitId || circuitName, maxLaps);
    return generated.lapHistory;
  }, [lapHistory, circuitId, circuitName, maxLaps]);

  // Driver details helper (with fallback to 22 DRIVER_META entries)
  const driverMap = useMemo(() => {
    const map = {};
    Object.keys(DRIVER_META).forEach((code) => {
      const meta = DRIVER_META[code];
      map[code] = {
        code,
        name: meta.name,
        num: meta.num,
        team: meta.team,
        flag: meta.flag,
        ioc: meta.ioc,
      };
    });
    if (drivers && drivers.length > 0) {
      drivers.forEach((d) => {
        if (d.code) {
          map[d.code] = { ...map[d.code], ...d };
        }
      });
    }
    return map;
  }, [drivers]);

  // Extract Lap 1 Start Scramble overtakes
  const lap1Entry = completeLapData.find((l) => l.lap === 1);
  const lap1Overtakes = lap1Entry?.overtakes || [];

  // Compute total overtakes, lead changes, and biggest mover
  const raceStats = useMemo(() => {
    let totalOvertakes = 0;
    let leadChanges = 0;
    let lastLeader = null;

    completeLapData.forEach((entry) => {
      totalOvertakes += entry.overtakes?.length || 0;
      if (entry.lap > 0) {
        if (lastLeader && entry.leader !== lastLeader) {
          leadChanges++;
        }
        lastLeader = entry.leader;
      }
    });

    const gridOrder = completeLapData[0]?.order || [];
    const latestOrder = completeLapData[completeLapData.length - 1]?.order || [];

    let biggestGain = -999;
    let topMover = gridOrder[0] || "NOR";

    gridOrder.forEach((code, startIdx) => {
      const endIdx = latestOrder.indexOf(code);
      if (endIdx >= 0) {
        const gain = startIdx - endIdx; // positive means moved up
        if (gain > biggestGain) {
          biggestGain = gain;
          topMover = code;
        }
      }
    });

    return {
      totalOvertakes,
      leadChanges,
      topMover,
      biggestGain: Math.max(0, biggestGain),
      poleDriver: circuitConfig?.poleDriver || gridOrder[0] || "NOR",
      poleTime: circuitConfig?.poleTime || "1:16.732",
    };
  }, [completeLapData, circuitConfig]);

  // Drivers list for SVG trajectory lines
  const allDriversList = useMemo(() => {
    if (drivers && drivers.length >= 20) return drivers;
    return Object.keys(DRIVER_META).map((code) => {
      const meta = DRIVER_META[code];
      return {
        code,
        name: meta.name,
        num: meta.num,
        team: meta.team,
        flag: meta.flag,
      };
    });
  }, [drivers]);

  // Handle cell click
  const handleCellClick = (driverCode, lapNum, pos) => {
    setHighlightedDriver(driverCode);
    if (onSelectDriver) {
      const driverObj = driverMap[driverCode];
      if (driverObj) onSelectDriver(driverObj);
    }
    const prevLapOrder = completeLapData.find((l) => l.lap === lapNum - 1)?.order;
    const prevPos = prevLapOrder ? prevLapOrder.indexOf(driverCode) + 1 : pos;
    const delta = prevPos - pos;

    // Check if an overtake happened on this lap for this driver
    const lapData = completeLapData.find((l) => l.lap === lapNum);
    const ovMove = lapData?.overtakes?.find((o) => o.winner === driverCode);

    setSelectedCell({
      code: driverCode,
      name: driverMap[driverCode]?.name || driverCode,
      team: driverMap[driverCode]?.team || "Formula 1 Team",
      lap: lapNum,
      pos,
      prevPos,
      delta,
      reason: ovMove?.reason || null,
      tire: driverMap[driverCode]?.tire || "M",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        background: "rgba(10, 12, 20, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderTop: "2px solid #00d2be",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 16px rgba(0, 210, 190, 0.15)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .statsf1-cell {
          transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
          cursor: pointer;
          user-select: none;
        }
        .statsf1-cell:hover {
          transform: scale(1.16);
          z-index: 50 !important;
          box-shadow: 0 0 14px rgba(255, 255, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.9);
        }
        .statsf1-cell.active-driver {
          transform: scale(1.12);
          box-shadow: 0 0 12px #00d2be, inset 0 0 8px rgba(255, 255, 255, 0.9);
          border: 1px solid #ffffff !important;
        }
        .statsf1-cell.dimmed {
          opacity: 0.16 !important;
          filter: grayscale(85%);
        }
        .statsf1-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #a0a5b8;
          padding: 4px 10px;
          border-radius: 4px;
          font-family: 'Orbitron', monospace;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .statsf1-btn:hover {
          background: rgba(0, 210, 190, 0.2);
          border-color: #00d2be;
          color: #ffffff;
        }
        .statsf1-btn.active {
          background: linear-gradient(135deg, rgba(0, 210, 190, 0.35) 0%, rgba(54, 113, 232, 0.35) 100%);
          border-color: #00d2be;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(0, 210, 190, 0.4);
        }
        @keyframes pulseOvertakeGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(0, 230, 118, 0.6); }
          50% { box-shadow: 0 0 16px rgba(0, 230, 118, 1); }
        }
        @keyframes pulseGoldGlow {
          0%, 100% { box-shadow: 0 0 4px rgba(255, 215, 0, 0.4); }
          50% { box-shadow: 0 0 12px rgba(255, 215, 0, 0.8); }
        }
      `}</style>

      {/* ── TOP CONTROL & BROADCAST HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #176ac7 0%, #0d427d 100%)",
              color: "#ffffff",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "0.72rem",
              fontWeight: "900",
              padding: "4px 8px",
              borderRadius: "4px",
              letterSpacing: "0.08em",
              boxShadow: "0 0 10px rgba(23, 106, 199, 0.5)",
            }}
          >
            STATS F1
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.95rem",
                fontWeight: "900",
                color: "#ffffff",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>TOUR PAR TOUR (LAP-BY-LAP MATRIX)</span>
              <span
                style={{
                  fontSize: "0.64rem",
                  color: "#ffd700",
                  border: "1px solid rgba(255, 215, 0, 0.4)",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  background: "rgba(255, 215, 0, 0.1)",
                }}
              >
                {circuitConfig?.name || circuitName} · R{String(circuitConfig?.round || 1).padStart(2, "0")}
              </span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "2px" }}>
              Authentic F1 Lap Chart · Pole: {raceStats.poleDriver} ({raceStats.poleTime}) · Lap {currentLap} of {maxLaps}
            </div>
          </div>
        </div>

        {/* View Mode & Reset Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className={`statsf1-btn ${viewMode === "matrix" ? "active" : ""}`}
            onClick={() => setViewMode("matrix")}
          >
            <span>▦</span>
            <span>MATRIX GRID</span>
          </button>
          <button
            className={`statsf1-btn ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
          >
            <span>📈</span>
            <span>TRAJECTORY LINES</span>
          </button>
          {highlightedDriver && (
            <button
              className="statsf1-btn"
              onClick={() => setHighlightedDriver(null)}
              style={{ borderColor: "#ffaa00", color: "#ffaa00" }}
            >
              <span>✕</span>
              <span>RESET FILTER ({highlightedDriver})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── RACE STORY TELEMETRY STATS STRIP ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "8px",
          background: "rgba(0, 0, 0, 0.45)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>⏱️</span>
          <div>
            <div style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              QUALIFYING POLE
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#ffd700", fontFamily: "'Orbitron', monospace" }}>
              #{driverMap[raceStats.poleDriver]?.num || 1} {raceStats.poleDriver} ({raceStats.poleTime})
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>⚔️</span>
          <div>
            <div style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              TOTAL OVERTAKES
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: "900", color: "#00e676", fontFamily: "'Orbitron', monospace" }}>
              {raceStats.totalOvertakes} POSITIONS SWAPPED
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🏁</span>
          <div>
            <div style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              LAP 1 SCRAMBLE
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: "900", color: "#00d2be", fontFamily: "'Orbitron', monospace" }}>
              {lap1Overtakes.length} T1 MOVES
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>👑</span>
          <div>
            <div style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              LEAD CHANGES
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: "900", color: "#ff8700", fontFamily: "'Orbitron', monospace" }}>
              {raceStats.leadChanges} LEAD SWAPS
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>🚀</span>
          <div>
            <div style={{ fontSize: "0.60rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              BIGGEST MOVER
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: "900", color: "#3671e8", fontFamily: "'Orbitron', monospace" }}>
              {raceStats.topMover} (+{raceStats.biggestGain} POS)
            </div>
          </div>
        </div>
      </div>

      {/* ── LAP 1 LIGHTS OUT START SCRAMBLE BREAKDOWN ── */}
      {lap1Overtakes.length > 0 && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(0, 230, 118, 0.12) 0%, rgba(0, 210, 190, 0.05) 100%)",
            border: "1px solid rgba(0, 230, 118, 0.35)",
            borderRadius: "6px",
            padding: "6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem" }}>🚦</span>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.70rem",
                  fontWeight: "900",
                  color: "#00e676",
                  letterSpacing: "0.06em",
                }}
              >
                LIGHTS OUT · LAP 1 START SCRAMBLE ({lap1Overtakes.length} TURN 1/TURN 2 OVERTAKES):
              </span>
            </div>
            <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>
              Click any battle to highlight driver's race trajectory
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {lap1Overtakes.map((ov, i) => (
              <button
                key={i}
                onClick={() => setHighlightedDriver(ov.winner)}
                style={{
                  background: highlightedDriver === ov.winner ? "rgba(0, 230, 118, 0.35)" : "rgba(0, 0, 0, 0.45)",
                  border: `1px solid ${highlightedDriver === ov.winner ? "#00e676" : "rgba(0, 230, 118, 0.25)"}`,
                  color: "#ffffff",
                  borderRadius: "4px",
                  padding: "2px 7px",
                  fontSize: "0.62rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
                title={ov.reason}
              >
                <span style={{ color: "#00e676" }}>▲ P{ov.pos}</span>
                <span>#{ov.winnerNum} {ov.winner}</span>
                <span style={{ color: "#8888aa", fontSize: "0.55rem" }}>passes</span>
                <span style={{ color: "#ff6b6b" }}>{ov.loser}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── DRIVER QUICK-FILTER CHIPS BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", flexShrink: 0 }}>
          HIGHLIGHT:
        </span>
        {allDriversList.slice(0, 16).map((d) => {
          const teamCol = TEAM_COLORS[d.team] || { primary: "#888" };
          const isSelected = highlightedDriver === d.code;
          return (
            <button
              key={d.code}
              onClick={() => setHighlightedDriver(isSelected ? null : d.code)}
              style={{
                background: isSelected ? teamCol.primary : "rgba(255, 255, 255, 0.05)",
                color: isSelected ? (teamCol.text || "#ffffff") : "#d0d5e5",
                border: `1px solid ${isSelected ? "#ffffff" : teamCol.primary + "66"}`,
                borderRadius: "3px",
                padding: "2px 7px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.64rem",
                fontWeight: "800",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease",
                boxShadow: isSelected ? `0 0 8px ${teamCol.primary}` : "none",
              }}
            >
              {d.code} #{d.num}
            </button>
          );
        })}
      </div>

      {/* ── VIEW 1: HORIZONTAL STATSF1 LAP MATRIX ── */}
      {viewMode === "matrix" && (
        <div
          ref={tableContainerRef}
          style={{
            maxHeight: "580px",
            overflowX: "auto",
            overflowY: "auto",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            background: "#080a12",
            position: "relative",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0",
              fontSize: "0.70rem",
            }}
          >
            {/* Table Header: Sticky Left POS + Lap Columns */}
            <thead>
              <tr style={{ background: "#0e111d", position: "sticky", top: 0, zIndex: 30 }}>
                {/* Sticky Left POS Column Header */}
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 40,
                    background: "#0d101c",
                    padding: "6px 8px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.65rem",
                    color: "var(--neon-cyan)",
                    borderRight: "2px solid rgba(255, 255, 255, 0.14)",
                    textAlign: "center",
                    width: "48px",
                  }}
                >
                  POS
                </th>

                {/* Lap Columns */}
                {completeLapData.map((lapEntry) => {
                  const isGrid = lapEntry.lap === 0;
                  const isL1 = lapEntry.lap === 1;
                  const isCurrent = lapEntry.lap === currentLap;

                  return (
                    <th
                      key={lapEntry.lap}
                      style={{
                        padding: "6px 4px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.64rem",
                        fontWeight: "800",
                        color: isGrid
                          ? "#ffd700"
                          : isL1
                          ? "#00e676"
                          : isCurrent
                          ? "var(--neon-green)"
                          : "#8888aa",
                        background: isGrid
                          ? "rgba(255, 215, 0, 0.10)"
                          : isL1
                          ? "rgba(0, 230, 118, 0.12)"
                          : isCurrent
                          ? "rgba(0, 230, 118, 0.08)"
                          : "transparent",
                        textAlign: "center",
                        minWidth: isGrid ? "52px" : "44px",
                        borderBottom: isGrid
                          ? "2px solid #ffd700"
                          : isL1
                          ? "2px solid #00e676"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      title={
                        isGrid
                          ? `Qualifying Starting Grid (${circuitConfig?.name || circuitName})`
                          : isL1
                          ? `Lap 1 Start Scramble (${lap1Overtakes.length} Turn 1/Turn 2 Overtakes)`
                          : `Lap ${lapEntry.lap}`
                      }
                    >
                      <div>{lapEntry.label}</div>
                      {isGrid && <div style={{ fontSize: "0.48rem", color: "#ffd700", fontWeight: "700" }}>QUAL</div>}
                      {isL1 && <div style={{ fontSize: "0.48rem", color: "#00e676", fontWeight: "700" }}>START</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Matrix Body: Rows are P1 to P22 */}
            <tbody>
              {Array.from({ length: 22 }, (_, pIndex) => {
                const pos = pIndex + 1;

                // Metallic Position badge style
                const posPill = pos === 1 ? {
                  background: "#ffd700",
                  color: "#000",
                } : pos === 2 ? {
                  background: "#e2e8f0",
                  color: "#000",
                } : pos === 3 ? {
                  background: "#cd7f32",
                  color: "#fff",
                } : pos <= 10 ? {
                  background: "rgba(0, 210, 190, 0.18)",
                  color: "var(--neon-cyan)",
                  border: "1px solid rgba(0, 210, 190, 0.4)",
                } : {
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#888899",
                };

                return (
                  <tr key={pos}>
                    {/* Sticky Left Position Badge */}
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 20,
                        background: "#0a0c16",
                        padding: "3px 6px",
                        textAlign: "center",
                        borderRight: "2px solid rgba(255, 255, 255, 0.14)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.68rem",
                          fontWeight: "900",
                          padding: "2px 5px",
                          borderRadius: "3px",
                          display: "inline-block",
                          minWidth: "22px",
                          ...posPill,
                        }}
                      >
                        P{pos}
                      </span>
                    </td>

                    {/* Cell for each Lap */}
                    {completeLapData.map((lapEntry) => {
                      const driverCode = lapEntry.order[pIndex];
                      const driverObj = driverMap[driverCode] || { team: "Formula 1" };
                      const teamColor = TEAM_COLORS[driverObj.team] || { primary: "#333", text: "#fff" };

                      // Check if an overtake happened at this position on this lap
                      const overtake = lapEntry.overtakes?.find((o) => o.pos === pos);
                      // Check if this driver pitted on this lap
                      const pit = lapEntry.pits?.find((p) => p.driver === driverCode);

                      // For Lap 1: Calculate delta compared to Starting Grid (Lap 0)
                      let lap1Gain = null;
                      if (lapEntry.lap === 1) {
                        const gridPos = completeLapData[0]?.order?.indexOf(driverCode) + 1;
                        if (gridPos) {
                          const net = gridPos - pos; // positive means gained positions on Lap 1
                          if (net !== 0) {
                            lap1Gain = net;
                          }
                        }
                      }

                      const isHighlighted = highlightedDriver === driverCode;
                      const isDimmed = highlightedDriver && !isHighlighted;

                      return (
                        <td
                          key={lapEntry.lap}
                          style={{
                            padding: "2px 2px",
                            textAlign: "center",
                            background: lapEntry.lap === currentLap ? "rgba(0, 230, 118, 0.04)" : "transparent",
                          }}
                        >
                          <div
                            className={`statsf1-cell ${isHighlighted ? "active-driver" : ""} ${isDimmed ? "dimmed" : ""}`}
                            onClick={() => handleCellClick(driverCode, lapEntry.lap, pos)}
                            title={`Lap ${lapEntry.lap} · P${pos}: ${driverCode} (${driverObj.team})${overtake ? ` · ${overtake.reason || "Overtake"}` : ""}`}
                            style={{
                              background: teamColor.primary,
                              color: teamColor.text || "#ffffff",
                              borderRadius: "3px",
                              padding: "3px 4px",
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "900",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                              position: "relative",
                              minHeight: "22px",
                              border: overtake ? "1px solid #00e676" : "1px solid rgba(0, 0, 0, 0.3)",
                              animation: overtake ? "pulseOvertakeGlow 2s infinite" : "none",
                            }}
                          >
                            <span>{driverCode}</span>

                            {/* Lap 1 Start Gain / Loss Badges */}
                            {lapEntry.lap === 1 && lap1Gain !== null && (
                              <span
                                style={{
                                  fontSize: "0.55rem",
                                  color: lap1Gain > 0 ? "#00e676" : "#ff4444",
                                  fontWeight: "900",
                                  lineHeight: 1,
                                }}
                              >
                                {lap1Gain > 0 ? `▲+${lap1Gain}` : `▼${lap1Gain}`}
                              </span>
                            )}

                            {/* Overtake Indicator Icon on subsequent laps */}
                            {lapEntry.lap > 1 && overtake && (
                              <span
                                style={{
                                  fontSize: "0.55rem",
                                  color: "#00e676",
                                  fontWeight: "900",
                                  lineHeight: 1,
                                }}
                              >
                                ▲
                              </span>
                            )}

                            {/* Pit Stop Badge */}
                            {pit && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "-4px",
                                  right: "-4px",
                                  background: "#ff1801",
                                  color: "#ffffff",
                                  fontSize: "0.50rem",
                                  fontWeight: "900",
                                  padding: "1px 3px",
                                  borderRadius: "2px",
                                  boxShadow: "0 0 6px #ff1801",
                                }}
                              >
                                P
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── VIEW 2: STATSF1 GRAPHICAL TRAJECTORY CHART ── */}
      {viewMode === "chart" && (
        <div
          style={{
            background: "#080a12",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            padding: "12px",
            overflowX: "auto",
          }}
        >
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", marginBottom: "8px" }}>
            POSITIONS TRAJECTORY ACROSS ALL LAPS · HOVER A DRIVER TO HIGHLIGHT RACE PATH
          </div>

          <svg
            width={Math.max(900, completeLapData.length * 28)}
            height="380"
            style={{ display: "block", overflow: "visible" }}
          >
            {/* Background Position Lines P1 to P22 */}
            {Array.from({ length: 22 }, (_, idx) => {
              const y = 20 + idx * 16;
              return (
                <g key={idx}>
                  <line
                    x1="40"
                    y1={y}
                    x2={completeLapData.length * 28}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x="25"
                    y={y + 3}
                    textAnchor="end"
                    fill="#666688"
                    fontSize="9"
                    fontFamily="'Orbitron', monospace"
                    fontWeight="700"
                  >
                    P{idx + 1}
                  </text>
                </g>
              );
            })}

            {/* Connecting Polyline for each Driver */}
            {allDriversList.map((d) => {
              const teamCol = TEAM_COLORS[d.team] || { primary: "#ffffff" };
              const isSelected = highlightedDriver === d.code;
              const isDimmed = highlightedDriver && !isSelected;

              // Compute points (x, y)
              const points = completeLapData.map((lapEntry, lapIdx) => {
                const posIdx = lapEntry.order.indexOf(d.code);
                const x = 50 + lapIdx * 26;
                const y = 20 + (posIdx >= 0 ? posIdx : 21) * 16;
                return `${x},${y}`;
              }).join(" ");

              return (
                <g key={d.code}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={teamCol.primary}
                    strokeWidth={isSelected ? 3.5 : isDimmed ? 0.8 : 1.8}
                    strokeOpacity={isSelected ? 1 : isDimmed ? 0.15 : 0.65}
                    style={{
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      filter: isSelected ? `drop-shadow(0 0 6px ${teamCol.primary})` : "none",
                    }}
                    onClick={() => setHighlightedDriver(d.code)}
                  />

                  {/* End node badge at current lap */}
                  {completeLapData.length > 0 && (
                    (() => {
                      const latestIdx = completeLapData.length - 1;
                      const latestPos = completeLapData[latestIdx].order.indexOf(d.code);
                      const endX = 50 + latestIdx * 26;
                      const endY = 20 + (latestPos >= 0 ? latestPos : 21) * 16;
                      return (
                        <circle
                          cx={endX}
                          cy={endY}
                          r={isSelected ? 5 : 3.5}
                          fill={teamCol.primary}
                          stroke="#ffffff"
                          strokeWidth="1"
                          style={{ cursor: "pointer" }}
                          onClick={() => setHighlightedDriver(d.code)}
                        />
                      );
                    })()
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* ── SELECTED CELL DOSSIER POPUP / FOOTER ── */}
      {selectedCell && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(9, 14, 24, 0.95) 100%)",
            border: "1px solid rgba(0, 210, 190, 0.4)",
            borderRadius: "6px",
            padding: "8px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
            fontSize: "0.72rem",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: "900",
                fontSize: "0.85rem",
                color: "var(--neon-cyan)",
              }}
            >
              LAP {selectedCell.lap === 0 ? "GRID" : selectedCell.lap}
            </span>
            <span>·</span>
            <span style={{ fontWeight: "700" }}>{selectedCell.name} ({selectedCell.code})</span>
            <span>·</span>
            <span style={{ color: "var(--text-dim)" }}>{selectedCell.team}</span>
            <span>·</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
              POSITION: P{selectedCell.pos}
            </span>
            {selectedCell.delta > 0 && (
              <span style={{ color: "#00e676", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                ▲ +{selectedCell.delta} (OVERTAKE)
              </span>
            )}
            {selectedCell.delta < 0 && (
              <span style={{ color: "#ff1801", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                ▼ {selectedCell.delta} (LOST POS)
              </span>
            )}
            {selectedCell.reason && (
              <span style={{ color: "#ffd700", fontWeight: "700", fontFamily: "'Rajdhani', sans-serif" }}>
                · {selectedCell.reason}
              </span>
            )}
          </div>

          <button
            onClick={() => setSelectedCell(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-dim)",
              fontSize: "0.80rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
