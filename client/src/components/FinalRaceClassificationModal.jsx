// ============================================================
// FinalRaceClassificationModal.jsx — Official FIA F1 2026 Final Classification
// Broadcast-quality podium ceremony, constructor points debrief,
// full 22-car classification table, and 1-click calendar advancement.
// ============================================================
import React from "react";
import { getDriverFaceUrl, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "./StrategyGameGatewayModal";
import { f1Audio } from "../utils/f1AudioEngine";

const F1_POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export default function FinalRaceClassificationModal({
  isOpen = false,
  onClose,
  drivers = [],
  selectedCircuit,
  playerTeam = "Ferrari",
  onAdvanceToNextRace,
  onRestartRace,
  nextCircuit,
  onGoToScoreboard,
}) {
  if (!isOpen) return null;

  const totalLaps = selectedCircuit?.laps || 58;
  const circuitName = selectedCircuit?.grand_prix_name || "Australian Grand Prix";
  const trackName = selectedCircuit?.circuit_name || "Albert Park Circuit";
  const roundNum = selectedCircuit?.round || 1;

  // Identify Fastest Lap driver across the grid
  let fastestLapDriverCode = null;
  let bestLapSec = 999999;
  drivers.forEach((d) => {
    if (d.bestLap && d.bestLap.includes(":")) {
      const parts = d.bestLap.split(":");
      const sec = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      if (sec < bestLapSec) {
        bestLapSec = sec;
        fastestLapDriverCode = d.code;
      }
    }
  });

  // Calculate points for each driver
  const classifiedDrivers = drivers.map((d, idx) => {
    const pos = idx + 1;
    let basePts = pos <= 10 ? F1_POINTS_TABLE[pos - 1] : 0;
    const hasFastestLap = d.code === fastestLapDriverCode && pos <= 10;
    const totalPts = basePts + (hasFastestLap ? 1 : 0);
    return {
      ...d,
      finishPos: pos,
      basePts,
      hasFastestLap,
      totalPts,
    };
  });

  const p1 = classifiedDrivers[0] || { code: "NOR", num: 1, name: "Lando Norris", team: "McLaren", gap: "WINNER" };
  const p2 = classifiedDrivers[1] || { code: "LEC", num: 16, name: "Charles Leclerc", team: "Ferrari", gap: "+1.842s" };
  const p3 = classifiedDrivers[2] || { code: "RUS", num: 63, name: "George Russell", team: "Mercedes", gap: "+3.910s" };

  // Calculate Player Team Debrief
  const pLower = (typeof playerTeam === "string" ? playerTeam : "Ferrari").toLowerCase();
  const playerTeamDrivers = classifiedDrivers.filter((d) => {
    if (!d.team) return false;
    const teamLower = d.team.toLowerCase();
    return (
      teamLower.includes(pLower) ||
      pLower.includes(teamLower) ||
      (pLower.includes("red") && teamLower.includes("red")) ||
      (pLower.includes("audi") && teamLower.includes("sauber")) ||
      (pLower.includes("sauber") && teamLower.includes("audi"))
    );
  });

  const playerTeamPts = playerTeamDrivers.reduce((acc, d) => acc + (d.totalPts || 0), 0);
  const playerTeamObj = CONSTRUCTORS_2026.find((c) => c.id.toLowerCase() === pLower) || CONSTRUCTORS_2026[0];

  // Identify Official Driver of the Day (Max net position gain or race winner)
  let bestMover = classifiedDrivers[0];
  let maxPosGain = -999;
  classifiedDrivers.forEach((d) => {
    const deltaStr = d.posDelta ? String(d.posDelta).replace("+", "") : "0";
    const deltaNum = parseInt(deltaStr, 10) || 0;
    if (deltaNum > maxPosGain) {
      maxPosGain = deltaNum;
      bestMover = d;
    }
  });
  if (maxPosGain <= 0) {
    bestMover = classifiedDrivers[0];
  }
  const dotdDriver = bestMover || classifiedDrivers[0];
  const dotdGain = maxPosGain > 0 ? maxPosGain : 0;
  const dotdPct = +(36.4 + ((dotdDriver.num * 7) % 18)).toFixed(1);

  // Strategist Performance Index Rating (Score 0-100)
  let strategyScore = 48; // baseline race execution
  if (playerTeamPts >= 35) strategyScore += 36;
  else if (playerTeamPts >= 25) strategyScore += 26;
  else if (playerTeamPts >= 15) strategyScore += 18;
  else if (playerTeamPts > 0) strategyScore += 10;

  const hasPodium = playerTeamDrivers.some((d) => d.finishPos <= 3);
  if (hasPodium) strategyScore += 10;

  const bothInPoints = playerTeamDrivers.length >= 2 && playerTeamDrivers.every((d) => d.finishPos <= 10);
  if (bothInPoints) strategyScore += 6;

  strategyScore = Math.min(100, Math.max(30, strategyScore));

  const strategyGrade =
    strategyScore >= 88
      ? {
          grade: "S+",
          color: "#ffd700",
          title: "MASTERCLASS STRATEGIST",
          desc: "Clinical pit stop timing and decisive undercut execution outsmarted rival pit walls.",
        }
      : strategyScore >= 74
      ? {
          grade: "A",
          color: "#00e676",
          title: "TACTICAL EXCELLENCE",
          desc: "Optimal tire life preservation and strong stint execution maximized championship points.",
        }
      : strategyScore >= 55
      ? {
          grade: "B",
          color: "#00d2be",
          title: "SOLID RACE CRAFT",
          desc: "Consistent pace management, defended track position successfully through pit cycles.",
        }
      : {
          grade: "C",
          color: "#ff9100",
          title: "TELEMETRY LEARNINGS GATHERED",
          desc: "Tire cliff challenges provided key data points for the next Grand Prix upgrade package.",
        };

  const nextRoundTitle = nextCircuit
    ? `ROUND ${String(nextCircuit.round).padStart(2, "0")} · ${nextCircuit.grand_prix_name?.toUpperCase()}`
    : "ROUND 02 · CHINESE GRAND PRIX";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(3, 6, 12, 0.92)",
        backdropFilter: "blur(18px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "linear-gradient(180deg, rgba(16, 22, 36, 0.98) 0%, rgba(9, 12, 20, 0.99) 100%)",
          border: "1.5px solid rgba(255, 215, 0, 0.4)",
          borderRadius: "16px",
          padding: "24px 28px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 215, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
        }}
      >
        {/* Top Gold Racing Border Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, #ffd700, #ff8c00, #ffd700, transparent)",
            boxShadow: "0 0 16px #ffd700",
          }}
        />

        {/* ── HEADER: FIA CHEQUERED FLAG BANNER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.2rem" }}>🏁</span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffd700", letterSpacing: "0.15em" }}>
                FIA FORMULA 1 WORLD CHAMPIONSHIP · OFFICIAL CLASSIFICATION
              </span>
              <span style={{ background: "rgba(255, 215, 0, 0.2)", color: "#ffd700", border: "1px solid #ffd700", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", padding: "2px 6px", borderRadius: "3px" }}>
                CHEQUERED FLAG
              </span>
            </div>

            <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.55rem", fontWeight: "900", color: "#ffffff", margin: 0, letterSpacing: "0.04em" }}>
              {circuitName.toUpperCase()}
            </h1>

            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "3px" }}>
              Round {roundNum} of 24 · {trackName} · {totalLaps}/{totalLaps} Laps Completed · Race Distance: {(totalLaps * (selectedCircuit?.length_km || 5.278)).toFixed(1)} km
            </div>
          </div>

          {/* Close X Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1rem",
                fontFamily: "monospace",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,0,45,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              title="Close modal & review timing matrix"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── SECTION 1: PODIUM SHOWCASE (P2, P1, P3) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "14px", alignItems: "end" }}>
          {/* P2 Silver */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(30, 36, 52, 0.95) 0%, rgba(14, 18, 28, 0.98) 100%)",
              border: "1.5px solid #c0c0c0",
              borderRadius: "12px",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "8px",
              boxShadow: "0 0 16px rgba(192, 192, 192, 0.25)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: "-12px", background: "#c0c0c0", color: "#000", fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: "900", padding: "2px 10px", borderRadius: "10px" }}>
              🥈 2ND PLACE
            </div>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", border: "2px solid #c0c0c0", marginTop: "6px" }}>
              <img
                src={getDriverFaceUrl(p2.code, p2.photo_url || DRIVER_PHOTOS[p2.code])}
                alt={p2.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "900", color: "#ffffff" }}>
              #{p2.num} {p2.code}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
              {p2.team}
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
              GAP: <strong style={{ color: "#ffffff" }}>{p2.gap}</strong> · {p2.pits || 1}P
            </div>
            <div style={{ background: "rgba(192, 192, 192, 0.2)", border: "1px solid #c0c0c0", color: "#ffffff", padding: "4px 12px", borderRadius: "6px", fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900" }}>
              +18 PTS
            </div>
          </div>

          {/* P1 Gold Winner */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(46, 38, 20, 0.98) 0%, rgba(18, 16, 12, 0.99) 100%)",
              border: "2px solid #ffd700",
              borderRadius: "14px",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
              boxShadow: "0 0 28px rgba(255, 215, 0, 0.45)",
              position: "relative",
              transform: "scale(1.04)",
            }}
          >
            <div style={{ position: "absolute", top: "-14px", background: "linear-gradient(90deg, #ffd700, #ffaa00)", color: "#000", fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", padding: "3px 14px", borderRadius: "12px", boxShadow: "0 0 10px #ffd700" }}>
              🏆 RACE WINNER 🥇
            </div>
            <div style={{ width: "76px", height: "76px", borderRadius: "50%", overflow: "hidden", border: "3px solid #ffd700", marginTop: "8px", boxShadow: "0 0 14px rgba(255,215,0,0.5)" }}>
              <img
                src={getDriverFaceUrl(p1.code, p1.photo_url || DRIVER_PHOTOS[p1.code])}
                alt={p1.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffd700" }}>
              #{p1.num} {p1.name || p1.code}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#ffffff", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
              {p1.team}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
              🏁 VICTORY · {p1.pits || 1} STOP STRATEGY
            </div>
            <div style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.3) 0%, rgba(255,170,0,0.4) 100%)", border: "1.5px solid #ffd700", color: "#ffffff", padding: "5px 16px", borderRadius: "8px", fontFamily: "'Orbitron', monospace", fontSize: "0.86rem", fontWeight: "900", boxShadow: "0 0 12px rgba(255,215,0,0.4)" }}>
              +{p1.totalPts || 25} PTS {p1.hasFastestLap ? "(+1 FL)" : ""}
            </div>
          </div>

          {/* P3 Bronze */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(34, 26, 22, 0.95) 0%, rgba(16, 13, 11, 0.98) 100%)",
              border: "1.5px solid #cd7f32",
              borderRadius: "12px",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "8px",
              boxShadow: "0 0 16px rgba(205, 127, 50, 0.25)",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: "-12px", background: "#cd7f32", color: "#ffffff", fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: "900", padding: "2px 10px", borderRadius: "10px" }}>
              🥉 3RD PLACE
            </div>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", border: "2px solid #cd7f32", marginTop: "6px" }}>
              <img
                src={getDriverFaceUrl(p3.code, p3.photo_url || DRIVER_PHOTOS[p3.code])}
                alt={p3.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", fontWeight: "900", color: "#ffffff" }}>
              #{p3.num} {p3.code}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
              {p3.team}
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
              GAP: <strong style={{ color: "#ffffff" }}>{p3.gap}</strong> · {p3.pits || 1}P
            </div>
            <div style={{ background: "rgba(205, 127, 50, 0.2)", border: "1px solid #cd7f32", color: "#ffffff", padding: "4px 12px", borderRadius: "6px", fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900" }}>
              +15 PTS
            </div>
          </div>
        </div>

        {/* ── SECTION 2: YOUR TEAM STRATEGY DEBRIEF ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20, 26, 42, 0.9) 0%, rgba(12, 16, 26, 0.95) 100%)",
            border: `1.5px solid ${playerTeamObj.color || "var(--neon-red)"}`,
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            boxShadow: `0 0 16px ${playerTeamObj.color || "rgba(232,0,45,0.3)"}33`,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: playerTeamObj.color || "var(--neon-red)" }} />
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: "900", color: playerTeamObj.color || "#ffffff", letterSpacing: "0.08em" }}>
                YOUR TEAM RACE DEBRIEF: {playerTeamObj.name.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px" }}>
              {playerTeamDrivers.map((d) => (
                <div key={d.code} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontFamily: "'Orbitron', monospace" }}>
                  <span style={{ color: "#ffffff", fontWeight: "900" }}>#{d.num} {d.code}:</span>
                  <span style={{ color: d.finishPos <= 3 ? "#ffd700" : d.finishPos <= 10 ? "var(--neon-green)" : "var(--text-secondary)", fontWeight: "800" }}>
                    P{d.finishPos} (+{d.totalPts} PTS)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                CONSTRUCTOR POINTS SCORED
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.35rem", fontWeight: "900", color: "var(--neon-green)" }}>
                +{playerTeamPts} PTS
              </div>
            </div>
            <div
              style={{
                background: playerTeamPts >= 25 ? "rgba(255, 215, 0, 0.2)" : "rgba(0, 230, 118, 0.15)",
                border: `1px solid ${playerTeamPts >= 25 ? "#ffd700" : "var(--neon-green)"}`,
                color: playerTeamPts >= 25 ? "#ffd700" : "var(--neon-green)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "900",
              }}
            >
              {playerTeamPts >= 35 ? "🌟 STRATEGY MASTERCLASS" : playerTeamPts >= 15 ? "🏆 PODIUM CONTENDERS" : playerTeamPts > 0 ? "🎯 SOLID POINTS HAUL" : "🏁 STRATEGY RELEARNING"}
            </div>
          </div>
        </div>

        {/* ── SECTION 2.5: GAME RECOGNITION: DRIVER OF THE DAY & STRATEGIST RATING ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {/* Driver of the Day */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(32, 20, 48, 0.95) 0%, rgba(16, 12, 28, 0.98) 100%)",
              border: "1.5px solid #d946ef",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: "0 0 20px rgba(217, 70, 239, 0.25)",
            }}
          >
            <div style={{ position: "relative" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", overflow: "hidden", border: "2px solid #d946ef", boxShadow: "0 0 10px #d946ef" }}>
                <img
                  src={getDriverFaceUrl(dotdDriver.code, dotdDriver.photo_url || DRIVER_PHOTOS[dotdDriver.code])}
                  alt={dotdDriver.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span style={{ position: "absolute", bottom: "-4px", right: "-4px", fontSize: "1rem" }}>🎖️</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.66rem", fontWeight: "900", color: "#d946ef", letterSpacing: "0.08em" }}>
                  OFFICIAL DRIVER OF THE DAY
                </span>
                <span style={{ background: "rgba(217, 70, 239, 0.2)", color: "#f0abfc", border: "1px solid #d946ef", fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", padding: "1px 6px", borderRadius: "3px" }}>
                  {dotdPct}% VOTES
                </span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                #{dotdDriver.num} {dotdDriver.name || dotdDriver.code}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                {dotdGain > 0 ? `▲ GAINED +${dotdGain} POSITIONS` : "HEROIC RACE STINT & PACE"} · {dotdDriver.team}
              </div>
            </div>
          </div>

          {/* Strategist Performance Rating */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(20, 36, 48, 0.95) 0%, rgba(10, 18, 28, 0.98) 100%)",
              border: `1.5px solid ${strategyGrade.color}`,
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: `0 0 20px ${strategyGrade.color}33`,
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "10px",
                background: `linear-gradient(135deg, ${strategyGrade.color}33, ${strategyGrade.color}11)`,
                border: `2px solid ${strategyGrade.color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 12px ${strategyGrade.color}66`,
              }}
            >
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.25rem", fontWeight: "900", color: strategyGrade.color, lineHeight: 1 }}>
                {strategyGrade.grade}
              </span>
              <span style={{ fontSize: "0.52rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                RATING
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.66rem", fontWeight: "900", color: strategyGrade.color, letterSpacing: "0.08em" }}>
                  STRATEGIST PERFORMANCE INDEX
                </span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", fontWeight: "900", color: "#ffffff" }}>
                  SCORE: {strategyScore}/100
                </span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {strategyGrade.title}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                {strategyGrade.desc}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: FULL OFFICIAL 22-CAR CLASSIFICATION TABLE ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
              COMPLETE 22-CAR FINAL CLASSIFICATION
            </span>
            <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              * P1–P10 Awarded Drivers & Constructors Championship Points
            </span>
          </div>

          <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.6)", color: "var(--text-dim)", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                  <th style={{ padding: "6px 10px" }}>POS</th>
                  <th style={{ padding: "6px 10px" }}>NO</th>
                  <th style={{ padding: "6px 10px" }}>DRIVER</th>
                  <th style={{ padding: "6px 10px" }}>TEAM</th>
                  <th style={{ padding: "6px 10px" }}>TYRE</th>
                  <th style={{ padding: "6px 10px" }}>STOPS</th>
                  <th style={{ padding: "6px 10px" }}>GAP / INTERVAL</th>
                  <th style={{ padding: "6px 10px" }}>BEST LAP</th>
                  <th style={{ padding: "6px 10px", textAlign: "right" }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classifiedDrivers.map((d) => {
                  const isPlayerCar = playerTeamDrivers.some((pt) => pt.code === d.code);
                  return (
                    <tr
                      key={d.code}
                      style={{
                        background: isPlayerCar ? "rgba(0, 210, 190, 0.12)" : d.finishPos <= 3 ? "rgba(255, 215, 0, 0.05)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        color: d.finishPos <= 10 ? "#ffffff" : "var(--text-secondary)",
                      }}
                    >
                      <td style={{ padding: "6px 10px", fontWeight: "900", color: d.finishPos === 1 ? "#ffd700" : d.finishPos === 2 ? "#c0c0c0" : d.finishPos === 3 ? "#cd7f32" : d.finishPos <= 10 ? "var(--neon-green)" : "var(--text-dim)" }}>
                        {d.finishPos}
                      </td>
                      <td style={{ padding: "6px 10px", color: "var(--text-dim)" }}>#{d.num}</td>
                      <td style={{ padding: "6px 10px", fontWeight: "800", color: isPlayerCar ? "var(--neon-cyan)" : "#ffffff" }}>
                        {d.name || d.code} {isPlayerCar && "⭐"}
                      </td>
                      <td style={{ padding: "6px 10px", color: "var(--text-secondary)", fontSize: "0.68rem" }}>{d.team}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <span style={{ padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem", fontWeight: "900", background: d.tire === "S" ? "#FF1801" : d.tire === "M" ? "#FFD700" : "#FFFFFF", color: d.tire === "H" ? "#000" : "#fff" }}>
                          {d.tire || "H"}
                        </span>
                      </td>
                      <td style={{ padding: "6px 10px" }}>{d.pits || 1}P</td>
                      <td style={{ padding: "6px 10px", color: d.finishPos === 1 ? "var(--neon-green)" : "var(--text-secondary)" }}>
                        {d.finishPos === 1 ? "WINNER" : d.gap}
                      </td>
                      <td style={{ padding: "6px 10px", color: d.hasFastestLap ? "#b57edc" : "var(--text-secondary)" }}>
                        {d.bestLap || "1:21.450"} {d.hasFastestLap && "🟣"}
                      </td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "900", color: d.totalPts > 0 ? "var(--neon-green)" : "var(--text-dim)" }}>
                        +{d.totalPts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER: ADVANCE TO NEXT RACE & ACTIONS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px" }}>
          {/* Secondary Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onRestartRace && (
              <button
                onClick={() => {
                  f1Audio.playRadioBeep();
                  if (onRestartRace) onRestartRace();
                  if (onClose) onClose();
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  color: "#ffffff",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--neon-red)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)")}
                title="Restart this race back to Lap 1"
              >
                <span>🔄</span>
                <span>REPLAY THIS RACE</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  color: "var(--text-secondary)",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title="Dismiss podium and inspect timing telemetry"
              >
                <span>📊</span>
                <span>INSPECT TIMING MATRIX</span>
              </button>
            )}

            {onGoToScoreboard && (
              <button
                onClick={() => {
                  f1Audio.playRadioBeep();
                  onGoToScoreboard();
                }}
                style={{
                  background: "rgba(255, 215, 0, 0.12)",
                  border: "1px solid rgba(255, 215, 0, 0.35)",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  color: "#ffd700",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
                title="View World Drivers' & Constructors' Championship Standings"
              >
                <span>🏆</span>
                <span>VIEW SCOREBOARD</span>
              </button>
            )}
          </div>

          {/* Primary CTA: Advance to Next Race on Calendar */}
          {onAdvanceToNextRace && (
            <button
              onClick={() => {
                f1Audio.playRadioBeep();
                onAdvanceToNextRace();
              }}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                color: "#0a0c14",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.82rem",
                fontWeight: "900",
                letterSpacing: "0.05em",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 22px rgba(255, 215, 0, 0.6)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 215, 0, 0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 0 22px rgba(255, 215, 0, 0.6)";
              }}
              title="Advance to the next Grand Prix on the 2026 World Championship Calendar"
            >
              <span>🏆</span>
              <span>ADVANCE TO NEXT RACE: {nextRoundTitle}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

