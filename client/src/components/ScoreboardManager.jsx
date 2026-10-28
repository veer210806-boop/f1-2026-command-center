// ============================================================
// ScoreboardManager.jsx — Official FIA Formula 1 World Championship Standings
// Broadcast-Grade Drivers' & Constructors' Championship Scoreboard,
// Live Points Tracking, Race-by-Race Result Matrix & Campaign Reversibility
// ============================================================

import React, { useState, useMemo } from "react";
import { computeChampionshipStandings } from "../utils/scoreboardEngine";
import { getDriverFaceUrl, getTeamLogo, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { f1Audio } from "../utils/f1AudioEngine";

export default function ScoreboardManager({
  seasonData,
  playerTeam = "Ferrari",
  selectedCircuit,
  onGoToPitWall,
  onRevertRoundPoints,
  onResetSeasonCampaign,
}) {
  const [activeView, setActiveView] = useState("drivers"); // "drivers" | "constructors" | "matrix"
  const [matrixFilter, setMatrixFilter] = useState("drivers"); // "drivers" | "constructors"

  // Compute standings live from seasonData
  const standings = useMemo(() => {
    return computeChampionshipStandings(seasonData, playerTeam);
  }, [seasonData, playerTeam]);

  const {
    totalRoundsCompleted,
    completedRoundsList,
    driverStandings,
    constructorStandings,
    leaderDriver,
    leaderConstructor,
    userTeamStanding,
    userTeamDrivers,
  } = standings;

  const currentGpName = selectedCircuit?.grand_prix_name || "Australian Grand Prix";
  const currentRoundNum = selectedCircuit?.round || 1;
  const isCurrentRoundRecorded = Boolean(seasonData?.completedRounds?.[selectedCircuit?.circuit_id]);

  const playerTeamObj = CONSTRUCTORS_2026.find((c) => c.id === playerTeam) || CONSTRUCTORS_2026[0];
  const playerTeamLogo = getTeamLogo(playerTeam);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "16px 20px 40px",
        minHeight: "calc(100vh - 120px)",
        color: "#ffffff",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      {/* ── Top Header & Campaign Banner ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 22, 34, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "14px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Trophy Icon & Title */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              boxShadow: "0 0 20px rgba(255, 215, 0, 0.45)",
              flexShrink: 0,
            }}
          >
            🏆
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "1.3rem",
                  fontWeight: "900",
                  letterSpacing: "0.05em",
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                2026 FIA FORMULA 1 WORLD CHAMPIONSHIP
              </h1>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "800",
                  color: "var(--neon-cyan)",
                  background: "rgba(0, 210, 190, 0.12)",
                  border: "1px solid rgba(0, 210, 190, 0.35)",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}
              >
                OFFICIAL SCOREBOARD
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                Official 25-18-15-12-10-8-6-4-2-1 Points System · 24 Grand Prix Season
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Managing:</span>
                {playerTeamLogo && (
                  <img
                    src={playerTeamLogo}
                    alt={playerTeam}
                    style={{ width: "18px", height: "18px", objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.80rem",
                    fontWeight: "800",
                    color: playerTeamObj.color || "var(--neon-red)",
                  }}
                >
                  {playerTeamObj.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {isCurrentRoundRecorded && onRevertRoundPoints && (
            <button
              onClick={() => {
                f1Audio.playRadioBeep();
                onRevertRoundPoints(selectedCircuit?.circuit_id);
              }}
              style={{
                background: "rgba(255, 77, 77, 0.12)",
                border: "1px solid rgba(255, 77, 77, 0.4)",
                color: "#ff5555",
                padding: "8px 14px",
                borderRadius: "8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              title={`Revert & roll back points recorded for Round ${currentRoundNum} (${currentGpName})`}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--neon-red)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 77, 77, 0.4)")}
            >
              <span>🔄</span>
              <span>REVERT ROUND {currentRoundNum} POINTS</span>
            </button>
          )}

          {onResetSeasonCampaign && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all season points and scoreboard back to 0 for Race 1?")) {
                  f1Audio.playRadioBeep();
                  onResetSeasonCampaign();
                }
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "var(--text-secondary)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              title="Reset full season standings back to 0 points"
            >
              <span>🔁</span>
              <span>RESET SEASON</span>
            </button>
          )}

          {onGoToPitWall && (
            <button
              onClick={() => {
                f1Audio.playRadioBeep();
                onGoToPitWall();
              }}
              style={{
                background: "linear-gradient(135deg, var(--neon-red) 0%, #b3001e 100%)",
                border: "none",
                color: "#ffffff",
                padding: "9px 18px",
                borderRadius: "8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.76rem",
                fontWeight: "900",
                letterSpacing: "0.04em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 16px rgba(232, 0, 45, 0.4)",
                transition: "all 0.15s ease",
              }}
            >
              <span>🏁</span>
              <span>RACE ON PIT WALL</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Championship Hero Metric Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Card 1: WDC Leader */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 40, 0.85) 0%, rgba(12, 16, 26, 0.95) 100%)",
            border: "1px solid rgba(255, 215, 0, 0.35)",
            borderTop: "3px solid #ffd700",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          {leaderDriver && (
            <img
              src={getDriverFaceUrl(leaderDriver.code, DRIVER_PHOTOS[leaderDriver.num])}
              alt={leaderDriver.name}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #ffd700",
                boxShadow: "0 0 14px rgba(255, 215, 0, 0.4)",
                background: "#12141c",
              }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffd700", letterSpacing: "0.08em" }}>
              👑 WORLD DRIVERS' CHAMPIONSHIP LEADER
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {leaderDriver ? `#${leaderDriver.num} ${leaderDriver.name}` : "—"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                {leaderDriver?.team}
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffd700" }}>
                {leaderDriver?.points || 0} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: WCC Leader */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 40, 0.85) 0%, rgba(12, 16, 26, 0.95) 100%)",
            border: `1px solid ${leaderConstructor?.color || "var(--neon-cyan)"}55`,
            borderTop: `3px solid ${leaderConstructor?.color || "var(--neon-cyan)"}`,
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          {leaderConstructor && (
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "10px",
                background: "rgba(0, 0, 0, 0.5)",
                border: `1px solid ${leaderConstructor.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={getTeamLogo(leaderConstructor.id)}
                alt={leaderConstructor.name}
                style={{ width: "36px", height: "36px", objectFit: "contain" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: leaderConstructor?.color || "var(--neon-cyan)", letterSpacing: "0.08em" }}>
              🏎️ CONSTRUCTORS' CHAMPIONSHIP LEADER
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {leaderConstructor?.name || "—"}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                {leaderConstructor?.wins || 0} Wins · {leaderConstructor?.podiums || 0} Podiums
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: leaderConstructor?.color || "var(--neon-cyan)" }}>
                {leaderConstructor?.points || 0} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Your Team Campaign Standing */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 40, 0.85) 0%, rgba(12, 16, 26, 0.95) 100%)",
            border: `1px solid ${playerTeamObj.color || "var(--neon-red)"}55`,
            borderTop: `3px solid ${playerTeamObj.color || "var(--neon-red)"}`,
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "10px",
              background: `rgba(${playerTeamObj.color === "#E8002D" ? "232,0,45" : "54,113,232"}, 0.15)`,
              border: `1px solid ${playerTeamObj.color}44`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.60rem", color: "var(--text-dim)", fontWeight: "800" }}>RANK</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.3rem", fontWeight: "900", color: "#ffffff" }}>
              P{userTeamStanding?.rank || "—"}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: playerTeamObj.color || "var(--neon-red)", letterSpacing: "0.08em" }}>
              🎯 YOUR TEAM: {playerTeamObj.short}
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {playerTeamObj.name}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                Gap: {userTeamStanding?.gap || "LEADER"}
              </span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff" }}>
                {userTeamStanding?.points || 0} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>PTS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Season Progress */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 40, 0.85) 0%, rgba(12, 16, 26, 0.95) 100%)",
            border: "1px solid rgba(0, 230, 118, 0.35)",
            borderTop: "3px solid var(--neon-green)",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "10px",
              background: "rgba(0, 230, 118, 0.12)",
              border: "1px solid rgba(0, 230, 118, 0.35)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.60rem", color: "var(--neon-green)", fontWeight: "800" }}>ROUNDS</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: "#ffffff" }}>
              {totalRoundsCompleted}/24
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "var(--neon-green)", letterSpacing: "0.08em" }}>
              🏁 2026 CAMPAIGN CALENDAR
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {totalRoundsCompleted > 0 ? `Completed: R01 to R${String(totalRoundsCompleted).padStart(2, '0')}` : "Season Round 1 Ready"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Active Track: <strong style={{ color: "var(--neon-cyan)" }}>{currentGpName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "rgba(10, 14, 22, 0.6)",
          padding: "6px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              f1Audio.playRadioBeep();
              setActiveView("drivers");
            }}
            style={{
              background: activeView === "drivers" ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "rgba(255, 255, 255, 0.05)",
              border: activeView === "drivers" ? "1px solid var(--neon-red)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "7px 16px",
              color: "#ffffff",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.76rem",
              fontWeight: activeView === "drivers" ? "900" : "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activeView === "drivers" ? "0 0 12px rgba(232, 0, 45, 0.4)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>🏆</span>
            <span>DRIVERS' CHAMPIONSHIP (WDC)</span>
          </button>

          <button
            onClick={() => {
              f1Audio.playRadioBeep();
              setActiveView("constructors");
            }}
            style={{
              background: activeView === "constructors" ? "linear-gradient(135deg, var(--neon-cyan), #0099cc)" : "rgba(255, 255, 255, 0.05)",
              border: activeView === "constructors" ? "1px solid var(--neon-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "7px 16px",
              color: activeView === "constructors" ? "#060810" : "#ffffff",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.76rem",
              fontWeight: activeView === "constructors" ? "900" : "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activeView === "constructors" ? "0 0 12px rgba(0, 210, 190, 0.4)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>🏎️</span>
            <span>CONSTRUCTORS' CHAMPIONSHIP (WCC)</span>
          </button>

          <button
            onClick={() => {
              f1Audio.playRadioBeep();
              setActiveView("matrix");
            }}
            style={{
              background: activeView === "matrix" ? "linear-gradient(135deg, #ffd700, #ff8c00)" : "rgba(255, 255, 255, 0.05)",
              border: activeView === "matrix" ? "1px solid #ffd700" : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "7px 16px",
              color: activeView === "matrix" ? "#060810" : "#ffffff",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.76rem",
              fontWeight: activeView === "matrix" ? "900" : "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: activeView === "matrix" ? "0 0 12px rgba(255, 215, 0, 0.4)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>📊</span>
            <span>RACE-BY-RACE POINTS MATRIX</span>
          </button>
        </div>

        {activeView === "matrix" && (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setMatrixFilter("drivers")}
              style={{
                background: matrixFilter === "drivers" ? "rgba(255,255,255,0.18)" : "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.68rem",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              22 DRIVERS
            </button>
            <button
              onClick={() => setMatrixFilter("constructors")}
              style={{
                background: matrixFilter === "constructors" ? "rgba(255,255,255,0.18)" : "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.68rem",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              11 CONSTRUCTORS
            </button>
          </div>
        )}
      </div>

      {/* ── Empty Season Banner (When 0 races have finished yet) ── */}
      {totalRoundsCompleted === 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(232, 0, 45, 0.08) 0%, rgba(54, 113, 232, 0.08) 100%)",
            border: "1px dashed rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>ℹ️</span>
              <span>2026 WORLD CHAMPIONSHIP READY TO BEGIN</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px", maxWidth: "780px" }}>
              All 22 drivers and 11 constructors are currently level on <strong>0 points</strong>. Complete the race to the chequered flag on the Pit Wall to record your first official championship points! (1st: 25, 2nd: 18, 3rd: 15, 4th: 12, 5th: 10, 6th: 8, 7th: 6, 8th: 4, 9th: 2, 10th: 1 + 1 pt for Fastest Lap).
            </div>
          </div>

          {onGoToPitWall && (
            <button
              onClick={onGoToPitWall}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#0a0c14",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.74rem",
                fontWeight: "900",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 0 14px rgba(255, 215, 0, 0.4)",
              }}
            >
              🏁 RACE ROUND 1 NOW
            </button>
          )}
        </div>
      )}

      {/* ── VIEW 1: DRIVERS' CHAMPIONSHIP STANDINGS ── */}
      {activeView === "drivers" && (
        <div
          style={{
            background: "rgba(12, 16, 26, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    color: "var(--text-dim)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "12px 14px", width: "54px", textAlign: "center" }}>POS</th>
                  <th style={{ padding: "12px 14px", minWidth: "220px" }}>DRIVER</th>
                  <th style={{ padding: "12px 14px", minWidth: "180px" }}>CONSTRUCTOR</th>
                  <th style={{ padding: "12px 14px", width: "90px", textAlign: "right" }}>PTS</th>
                  <th style={{ padding: "12px 14px", width: "100px", textAlign: "right" }}>GAP</th>
                  <th style={{ padding: "12px 14px", width: "70px", textAlign: "center" }}>WINS</th>
                  <th style={{ padding: "12px 14px", width: "80px", textAlign: "center" }}>PODIUMS</th>
                  <th style={{ padding: "12px 14px", width: "80px", textAlign: "center" }}>TOP 10S</th>
                  <th style={{ padding: "12px 14px", width: "80px", textAlign: "center" }}>BEST</th>
                  <th style={{ padding: "12px 14px", minWidth: "160px" }}>RECENT ROUNDS</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.map((d, index) => {
                  const isUserDriver = d.isPlayerTeam;
                  const medalColor = d.rank === 1 ? "#ffd700" : d.rank === 2 ? "#c0c0c0" : d.rank === 3 ? "#cd7f32" : null;
                  const faceUrl = getDriverFaceUrl(d.code, DRIVER_PHOTOS[d.num]);
                  const teamLogo = getTeamLogo(d.team);

                  return (
                    <tr
                      key={d.code}
                      style={{
                        background: isUserDriver
                          ? "linear-gradient(90deg, rgba(232, 0, 45, 0.14) 0%, rgba(20, 26, 40, 0.85) 100%)"
                          : index % 2 === 0
                          ? "rgba(255, 255, 255, 0.02)"
                          : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isUserDriver ? "rgba(232, 0, 45, 0.22)" : "rgba(255, 255, 255, 0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isUserDriver ? "linear-gradient(90deg, rgba(232, 0, 45, 0.14) 0%, rgba(20, 26, 40, 0.85) 100%)" : index % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "transparent")}
                    >
                      {/* POS */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: medalColor ? `${medalColor}22` : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${medalColor || "rgba(255, 255, 255, 0.15)"}`,
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.80rem",
                            fontWeight: "900",
                            color: medalColor || "#ffffff",
                          }}
                        >
                          {d.rank}
                        </div>
                      </td>

                      {/* DRIVER */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {faceUrl && (
                            <img
                              src={faceUrl}
                              alt={d.name}
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: `1.5px solid ${medalColor || "rgba(255, 255, 255, 0.2)"}`,
                                background: "#0a0c14",
                                flexShrink: 0,
                              }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.84rem", fontWeight: "900", color: "#ffffff" }}>
                                {d.name}
                              </span>
                              <span style={{ fontSize: "0.78rem" }}>{d.flag}</span>
                              <span
                                style={{
                                  fontFamily: "'Orbitron', monospace",
                                  fontSize: "0.62rem",
                                  fontWeight: "800",
                                  color: "var(--neon-yellow)",
                                  background: "rgba(255, 215, 0, 0.12)",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                }}
                              >
                                #{d.num}
                              </span>
                              {isUserDriver && (
                                <span
                                  style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: "0.58rem",
                                    fontWeight: "900",
                                    background: "rgba(232, 0, 45, 0.35)",
                                    border: "1px solid var(--neon-red)",
                                    color: "#ffffff",
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  YOUR DRIVER
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                              {d.code} · {d.ioc}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CONSTRUCTOR */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {teamLogo && (
                            <img
                              src={teamLogo}
                              alt={d.team}
                              style={{ width: "20px", height: "20px", objectFit: "contain", flexShrink: 0 }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                          <span style={{ fontSize: "0.80rem", fontWeight: "700", color: "#e8e8f0" }}>
                            {d.team}
                          </span>
                        </div>
                      </td>

                      {/* POINTS */}
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "1.05rem",
                            fontWeight: "900",
                            color: d.points > 0 ? (medalColor || "var(--neon-cyan)") : "var(--text-dim)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {d.points}
                        </span>
                      </td>

                      {/* GAP */}
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.74rem",
                            fontWeight: "700",
                            color: d.gap === "LEADER" ? "#ffd700" : "var(--text-secondary)",
                          }}
                        >
                          {d.gap}
                        </span>
                      </td>

                      {/* WINS */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: d.wins > 0 ? "#ffd700" : "var(--text-dim)" }}>
                          {d.wins > 0 ? `🏆 ${d.wins}` : "—"}
                        </span>
                      </td>

                      {/* PODIUMS */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: d.podiums > 0 ? "#00e676" : "var(--text-dim)" }}>
                          {d.podiums > 0 ? d.podiums : "—"}
                        </span>
                      </td>

                      {/* TOP 10s */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: d.top10s > 0 ? "#e8e8f0" : "var(--text-dim)" }}>
                          {d.top10s > 0 ? d.top10s : "—"}
                        </span>
                      </td>

                      {/* BEST FINISH */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            fontWeight: "800",
                            color: d.bestFinish <= 3 ? "#ffd700" : d.bestFinish <= 10 ? "var(--neon-green)" : "var(--text-dim)",
                          }}
                        >
                          {d.bestFinish <= 22 ? `P${d.bestFinish}` : "—"}
                        </span>
                      </td>

                      {/* RECENT ROUNDS CHIPS */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          {completedRoundsList.length === 0 ? (
                            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>Season not started</span>
                          ) : (
                            completedRoundsList.slice(-3).map((r) => {
                              const res = d.roundResults[r.round];
                              if (!res) return null;
                              const isPodium = res.pos <= 3;
                              const isPts = res.pos <= 10;
                              return (
                                <span
                                  key={r.round}
                                  style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: "0.62rem",
                                    fontWeight: "800",
                                    background: isPodium
                                      ? "rgba(255, 215, 0, 0.18)"
                                      : isPts
                                      ? "rgba(0, 230, 118, 0.14)"
                                      : "rgba(255, 255, 255, 0.05)",
                                    border: `1px solid ${isPodium ? "#ffd700" : isPts ? "#00e676" : "rgba(255,255,255,0.12)"}`,
                                    color: isPodium ? "#ffd700" : isPts ? "#00e676" : "var(--text-dim)",
                                    padding: "2px 5px",
                                    borderRadius: "3px",
                                  }}
                                  title={`Round ${r.round} (${r.grandPrixName}): Finished P${res.pos} (${res.pts} pts)${res.isFastestLap ? " + Fastest Lap" : ""}`}
                                >
                                  R{r.round}: P{res.pos} ({res.pts})
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 2: CONSTRUCTORS' CHAMPIONSHIP STANDINGS ── */}
      {activeView === "constructors" && (
        <div
          style={{
            background: "rgba(12, 16, 26, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    color: "var(--text-dim)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "12px 14px", width: "54px", textAlign: "center" }}>POS</th>
                  <th style={{ padding: "12px 14px", minWidth: "240px" }}>CONSTRUCTOR</th>
                  <th style={{ padding: "12px 14px", minWidth: "180px" }}>POWER UNIT & CHASSIS</th>
                  <th style={{ padding: "12px 14px", width: "100px", textAlign: "right" }}>PTS</th>
                  <th style={{ padding: "12px 14px", width: "110px", textAlign: "right" }}>GAP</th>
                  <th style={{ padding: "12px 14px", minWidth: "220px" }}>DRIVER PAIR CONTRIBUTION</th>
                  <th style={{ padding: "12px 14px", width: "80px", textAlign: "center" }}>WINS</th>
                  <th style={{ padding: "12px 14px", width: "90px", textAlign: "center" }}>PODIUMS</th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((c, index) => {
                  const isUserTeam = c.isPlayerTeam;
                  const medalColor = c.rank === 1 ? "#ffd700" : c.rank === 2 ? "#c0c0c0" : c.rank === 3 ? "#cd7f32" : null;
                  const logoUrl = getTeamLogo(c.id);

                  // Extract driver contribution
                  const drivers = c.drivers || [];
                  const d1 = drivers[0];
                  const d2 = drivers[1];
                  const d1Pts = c.driverContributions?.[d1?.code] || 0;
                  const d2Pts = c.driverContributions?.[d2?.code] || 0;
                  const totalPts = c.points || 0;
                  const d1Pct = totalPts > 0 ? Math.round((d1Pts / totalPts) * 100) : 50;
                  const d2Pct = totalPts > 0 ? 100 - d1Pct : 50;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: isUserTeam
                          ? "linear-gradient(90deg, rgba(232, 0, 45, 0.16) 0%, rgba(20, 26, 40, 0.85) 100%)"
                          : index % 2 === 0
                          ? "rgba(255, 255, 255, 0.02)"
                          : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isUserTeam ? "rgba(232, 0, 45, 0.22)" : "rgba(255, 255, 255, 0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isUserTeam ? "linear-gradient(90deg, rgba(232, 0, 45, 0.16) 0%, rgba(20, 26, 40, 0.85) 100%)" : index % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "transparent")}
                    >
                      {/* POS */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: medalColor ? `${medalColor}22` : "rgba(255, 255, 255, 0.05)",
                            border: `1.5px solid ${medalColor || "rgba(255, 255, 255, 0.15)"}`,
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.84rem",
                            fontWeight: "900",
                            color: medalColor || "#ffffff",
                          }}
                        >
                          {c.rank}
                        </div>
                      </td>

                      {/* CONSTRUCTOR */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "8px",
                              background: "rgba(0, 0, 0, 0.4)",
                              border: `1px solid ${c.color}44`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {logoUrl && (
                              <img
                                src={logoUrl}
                                alt={c.name}
                                style={{ width: "24px", height: "24px", objectFit: "contain" }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: "#ffffff" }}>
                                {c.name}
                              </span>
                              {isUserTeam && (
                                <span
                                  style={{
                                    fontFamily: "'Orbitron', monospace",
                                    fontSize: "0.58rem",
                                    fontWeight: "900",
                                    background: "rgba(232, 0, 45, 0.35)",
                                    border: "1px solid var(--neon-red)",
                                    color: "#ffffff",
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  YOUR TEAM
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.72rem", color: c.color, fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                              Team Principal: {c.principal}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* POWER UNIT & CHASSIS */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#d2d5e5" }}>
                            {c.powerUnit}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                            Chassis: {c.chassis}
                          </span>
                        </div>
                      </td>

                      {/* PTS */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "1.15rem",
                            fontWeight: "900",
                            color: c.points > 0 ? (medalColor || "var(--neon-cyan)") : "var(--text-dim)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {c.points}
                        </span>
                      </td>

                      {/* GAP */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.76rem",
                            fontWeight: "700",
                            color: c.gap === "LEADER" ? "#ffd700" : "var(--text-secondary)",
                          }}
                        >
                          {c.gap}
                        </span>
                      </td>

                      {/* DRIVER PAIR CONTRIBUTION */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem", fontFamily: "'Orbitron', monospace" }}>
                            <span>
                              {d1?.code}: <strong style={{ color: "#ffffff" }}>{d1Pts}</strong> ({d1Pct}%)
                            </span>
                            <span>
                              {d2?.code}: <strong style={{ color: "#ffffff" }}>{d2Pts}</strong> ({d2Pct}%)
                            </span>
                          </div>
                          {/* Contribution bar */}
                          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                            <div style={{ width: `${d1Pct}%`, height: "100%", background: c.color, transition: "width 0.4s ease" }} />
                            <div style={{ width: `${d2Pct}%`, height: "100%", background: c.secondaryColor || "#555", transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      </td>

                      {/* WINS */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "800", color: c.wins > 0 ? "#ffd700" : "var(--text-dim)" }}>
                          {c.wins > 0 ? `🏆 ${c.wins}` : "—"}
                        </span>
                      </td>

                      {/* PODIUMS */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "800", color: c.podiums > 0 ? "#00e676" : "var(--text-dim)" }}>
                          {c.podiums > 0 ? c.podiums : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 3: RACE-BY-RACE POINTS MATRIX ── */}
      {activeView === "matrix" && (
        <div
          style={{
            background: "rgba(12, 16, 26, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: "#ffd700", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📊</span>
              <span>2026 SEASON RACE-BY-RACE FINISH & POINTS RESULTS</span>
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
              {completedRoundsList.length} of 24 Grand Prix Completed
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            {matrixFilter === "drivers" ? (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(0, 0, 0, 0.6)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.66rem",
                      fontWeight: "800",
                      color: "var(--text-dim)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <th style={{ padding: "10px 12px", width: "45px", textAlign: "center" }}>POS</th>
                    <th style={{ padding: "10px 12px", minWidth: "160px" }}>DRIVER</th>
                    <th style={{ padding: "10px 12px", width: "65px", textAlign: "right", color: "var(--neon-cyan)" }}>TOTAL</th>
                    {completedRoundsList.map((r) => (
                      <th key={r.round} style={{ padding: "10px 10px", width: "80px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.68rem", color: "#ffffff" }}>R{String(r.round).padStart(2, '0')}</div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontWeight: "600" }}>{r.countryCode || "GP"}</div>
                      </th>
                    ))}
                    {completedRoundsList.length === 0 && (
                      <th style={{ padding: "10px 12px", color: "var(--text-dim)" }}>No completed rounds yet</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {driverStandings.map((d, index) => (
                    <tr
                      key={d.code}
                      style={{
                        background: d.isPlayerTeam
                          ? "rgba(232, 0, 45, 0.12)"
                          : index % 2 === 0
                          ? "rgba(255, 255, 255, 0.02)"
                          : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: d.rank <= 3 ? "#ffd700" : "var(--text-dim)" }}>
                        {d.rank}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "#ffffff" }}>
                            {d.code}
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                            {d.name.split(" ").slice(-1)[0]}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                        {d.points}
                      </td>
                      {completedRoundsList.map((r) => {
                        const res = d.roundResults[r.round];
                        if (!res) {
                          return (
                            <td key={r.round} style={{ padding: "8px 10px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}>
                              —
                            </td>
                          );
                        }
                        const isP1 = res.pos === 1;
                        const isPodium = res.pos <= 3;
                        const isPts = res.pos <= 10;
                        const bg = isP1
                          ? "rgba(255, 215, 0, 0.25)"
                          : isPodium
                          ? "rgba(0, 230, 118, 0.2)"
                          : isPts
                          ? "rgba(0, 210, 190, 0.12)"
                          : "rgba(255, 255, 255, 0.04)";
                        const color = isP1
                          ? "#ffd700"
                          : isPodium
                          ? "#00e676"
                          : isPts
                          ? "var(--neon-cyan)"
                          : "var(--text-dim)";

                        return (
                          <td
                            key={r.round}
                            style={{
                              padding: "6px 8px",
                              textAlign: "center",
                              borderLeft: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                background: bg,
                                color,
                                fontFamily: "'Orbitron', monospace",
                                fontSize: "0.68rem",
                                fontWeight: "800",
                                padding: "3px 6px",
                                borderRadius: "4px",
                                minWidth: "48px",
                              }}
                              title={`P${res.pos} (${res.pts} pts)${res.isFastestLap ? " + FL" : ""}`}
                            >
                              P{res.pos} ({res.pts})
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(0, 0, 0, 0.6)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.66rem",
                      fontWeight: "800",
                      color: "var(--text-dim)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <th style={{ padding: "10px 12px", width: "45px", textAlign: "center" }}>POS</th>
                    <th style={{ padding: "10px 12px", minWidth: "180px" }}>CONSTRUCTOR</th>
                    <th style={{ padding: "10px 12px", width: "65px", textAlign: "right", color: "var(--neon-cyan)" }}>TOTAL</th>
                    {completedRoundsList.map((r) => (
                      <th key={r.round} style={{ padding: "10px 10px", width: "80px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.68rem", color: "#ffffff" }}>R{String(r.round).padStart(2, '0')}</div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontWeight: "600" }}>{r.countryCode || "GP"}</div>
                      </th>
                    ))}
                    {completedRoundsList.length === 0 && (
                      <th style={{ padding: "10px 12px", color: "var(--text-dim)" }}>No completed rounds yet</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {constructorStandings.map((c, index) => (
                    <tr
                      key={c.id}
                      style={{
                        background: c.isPlayerTeam
                          ? "rgba(232, 0, 45, 0.12)"
                          : index % 2 === 0
                          ? "rgba(255, 255, 255, 0.02)"
                          : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: c.rank <= 3 ? "#ffd700" : "var(--text-dim)" }}>
                        {c.rank}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color }} />
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#ffffff" }}>
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                        {c.points}
                      </td>
                      {completedRoundsList.map((r) => {
                        const pts = c.roundPoints[r.round] || 0;
                        return (
                          <td
                            key={r.round}
                            style={{
                              padding: "6px 8px",
                              textAlign: "center",
                              borderLeft: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                background: pts > 0 ? "rgba(0, 210, 190, 0.14)" : "rgba(255, 255, 255, 0.03)",
                                color: pts > 0 ? "var(--neon-cyan)" : "var(--text-dim)",
                                fontFamily: "'Orbitron', monospace",
                                fontSize: "0.70rem",
                                fontWeight: "800",
                                padding: "3px 6px",
                                borderRadius: "4px",
                                minWidth: "40px",
                              }}
                            >
                              {pts > 0 ? `${pts} pts` : "0"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

