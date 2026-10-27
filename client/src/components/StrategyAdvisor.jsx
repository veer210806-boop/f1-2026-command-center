// ============================================================
// StrategyAdvisor.jsx — Intuitive F1 2026 Race Strategy Command Room
// Simple, clean, and interactive Strategy Center:
// 1. Live Pit Re-Entry Radar for your team's drivers
// 2. Real-time Box Call execution that updates the Timing Matrix
// 3. Decide & Delete Planned Strategy Directives
// 4. One-Click Strategy Presets (1-Stop, 2-Stop, Undercut Gamble)
// 5. Visual Stint Timeline
// ============================================================
import React, { useState, useMemo } from "react";
import { getDriverFaceUrl, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { f1Audio } from "../utils/f1AudioEngine";

const TIRE_SPECS = {
  S: { letter: "S", name: "Soft", color: "#FF1801", desc: "Fastest initial grip (-1.1s/lap). Sharp degradation cliff after 14 laps." },
  M: { letter: "M", name: "Medium", color: "#FFD700", desc: "Prime compound. Balanced speed & durable for 22-26 laps." },
  H: { letter: "H", name: "Hard", color: "#FFFFFF", desc: "Most durable compound. Stable lap times up to 40+ laps." },
  I: { letter: "I", name: "Intermediate", color: "#39B54A", desc: "Essential when track dampness > 30%. Slicks lose 15s in wet!" },
  W: { letter: "W", name: "Full Wet", color: "#00A0DE", desc: "Heavy standing water spec. Prevents high-speed hydroplaning." },
};

export default function StrategyAdvisor({
  selectedCircuit,
  drivers = [],
  playerTeam = "Ferrari",
  userRole = "team",
  currentLap = 34,
  maxLaps = 58,
  activeFlag = "GREEN",
  onExecutePitStop,
  plannedStrategies = [],
  onAddStrategy,
  onDeleteStrategy,
  onApplyPreset,
  onGoToTiming,
}) {
  const totalLaps = selectedCircuit?.laps || maxLaps || 58;
  const circuitName = selectedCircuit?.grand_prix_name || "Australian Grand Prix";

  // Pit loss durations based on track and flag
  const pitLossDuration = useMemo(() => {
    if (activeFlag === "SC") return 13.5;
    if (activeFlag === "VSC") return 15.2;
    return selectedCircuit?.pit_loss_green || 22.5;
  }, [activeFlag, selectedCircuit]);

  // Team metadata
  const currentTeamObj = useMemo(() => {
    return CONSTRUCTORS_2026.find((t) => t.id === playerTeam) || CONSTRUCTORS_2026[0];
  }, [playerTeam]);

  // Which drivers belong to user's team
  const teamDrivers = useMemo(() => {
    if (userRole === "team") {
      const filtered = drivers.filter(
        (d) => d.team && d.team.toLowerCase().includes(playerTeam.toLowerCase())
      );
      return filtered.length > 0 ? filtered : drivers.slice(0, 2);
    }
    return drivers;
  }, [drivers, playerTeam, userRole]);

  // Selected next compound state per driver
  const [selectedCompounds, setSelectedCompounds] = useState({
    default: "H",
  });

  // Strategy creator form state
  const [formDriver, setFormDriver] = useState(teamDrivers[0]?.code || "LEC");
  const [formLap, setFormLap] = useState(Math.min(totalLaps, currentLap + 6));
  const [formCompound, setFormCompound] = useState("H");
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Helper to calculate where a driver will re-enter if they pit now
  const calculateReentry = (driver) => {
    if (!driver || !drivers || drivers.length === 0) return null;

    const parseGapSec = (gapStr) => {
      if (!gapStr || gapStr === "LEADER") return 0;
      const num = parseFloat(String(gapStr).replace("+", "").replace("s", ""));
      return isNaN(num) ? 0 : num;
    };

    const currentGap = parseGapSec(driver.gap);
    const projectedGap = currentGap + pitLossDuration;

    const virtualGrid = drivers.map((d) => {
      if (d.code === driver.code) {
        return { ...d, testGap: projectedGap, isSelf: true };
      }
      return { ...d, testGap: parseGapSec(d.gap), isSelf: false };
    });

    virtualGrid.sort((a, b) => a.testGap - b.testGap);

    const reEntryIdx = virtualGrid.findIndex((d) => d.isSelf);
    const reEntryPos = reEntryIdx + 1;
    const carAhead = reEntryIdx > 0 ? virtualGrid[reEntryIdx - 1] : null;
    const carBehind = reEntryIdx < virtualGrid.length - 1 ? virtualGrid[reEntryIdx + 1] : null;

    const gapAhead = carAhead ? +(projectedGap - carAhead.testGap).toFixed(1) : null;
    const gapBehind = carBehind ? +(carBehind.testGap - projectedGap).toFixed(1) : null;

    let traffic = "CLEAN";
    if (activeFlag === "SC" || activeFlag === "VSC") {
      traffic = "SC_DISCOUNT";
    } else if (carAhead && gapAhead < 1.3) {
      traffic = "DIRTY_AIR";
    } else if (carAhead && gapAhead < 2.5) {
      traffic = "MARGINAL";
    }

    return {
      reEntryPos,
      carAhead,
      carBehind,
      gapAhead,
      gapBehind,
      traffic,
      projectedGap: projectedGap.toFixed(1),
    };
  };

  const handleBoxConfirm = (driver) => {
    const comp = selectedCompounds[driver.code] || "H";
    const reentry = calculateReentry(driver);

    f1Audio.playRadioBeep();

    if (onExecutePitStop) {
      onExecutePitStop({
        driverCode: driver.code,
        targetCompound: comp,
        reentry,
      });
    }

    setNotificationMsg(`📻 [RADIO TO #${driver.num} ${driver.code}]: Box this lap! Fitting ${TIRE_SPECS[comp].name} tires. Target re-entry: P${reentry ? reentry.reEntryPos : "..."}`);
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  const handleCreateDirective = (e) => {
    e.preventDefault();
    if (onAddStrategy) {
      onAddStrategy({
        driverCode: formDriver,
        lap: parseInt(formLap),
        targetCompound: formCompound,
        label: `Stop at Lap ${formLap} → Fit ${TIRE_SPECS[formCompound].name}`,
      });
      setNotificationMsg(`✅ Strategy Decided: #${formDriver} scheduled to box on Lap ${formLap} for ${TIRE_SPECS[formCompound].name}. Will execute on Timing Matrix!`);
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  };

  const handleDeleteDirective = (id, strat) => {
    if (onDeleteStrategy) {
      onDeleteStrategy(id);
      setNotificationMsg(`🗑️ Strategy Deleted: Planned stop for #${strat.driverCode} canceled. Car will remain out on track!`);
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "30px" }}>
      {/* ── TOP HERO BANNER: TEAM STRATEGY ROOM ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(18, 22, 36, 0.98) 0%, rgba(10, 13, 22, 0.99) 100%)",
          border: `1.5px solid ${currentTeamObj.color}60`,
          borderRadius: "14px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${currentTeamObj.color}15`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🧠</span>
            <div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.15rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{currentTeamObj.name.toUpperCase()} STRATEGY COMMAND ROOM</span>
                <span style={{ fontSize: "0.62rem", background: "rgba(0,210,190,0.15)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", padding: "2px 7px", borderRadius: "4px" }}>
                  2026 LIVE
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
                Active Grand Prix: <strong style={{ color: "#ffffff" }}>{circuitName}</strong> · Lap <strong style={{ color: "var(--neon-green)" }}>{currentLap}</strong> of {totalLaps} · Power Unit: <span style={{ color: "var(--neon-cyan)" }}>{currentTeamObj.powerUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action to View Timing Matrix */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={onGoToTiming}
            style={{
              background: "linear-gradient(135deg, rgba(232,0,45,0.25) 0%, rgba(20,24,38,0.95) 100%)",
              border: "1px solid var(--neon-red)",
              borderRadius: "10px",
              padding: "8px 14px",
              color: "#ffffff",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.74rem",
              fontWeight: "900",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 0 14px rgba(232,0,45,0.35)",
              transition: "all 0.15s ease",
            }}
            title="Switch back to live timing matrix"
          >
            <span>🏁</span>
            <span>VIEW LIVE TIMING MATRIX →</span>
          </button>
        </div>
      </div>

      {/* ── BROADCAST TOAST NOTIFICATION ── */}
      {notificationMsg && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(0, 210, 190, 0.2) 0%, rgba(10, 25, 30, 0.95) 100%)",
            border: "1px solid var(--neon-cyan)",
            borderRadius: "8px",
            padding: "8px 14px",
            color: "#ffffff",
            fontSize: "0.76rem",
            fontFamily: "'Orbitron', monospace",
            fontWeight: "700",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 0 16px rgba(0,210,190,0.3)",
          }}
        >
          <span>{notificationMsg}</span>
          <button
            onClick={() => setNotificationMsg(null)}
            style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 3 QUICK TRACK STATUS PILLS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
        <div style={{ background: "rgba(16, 20, 32, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT LANE TRANSIT LOSS</div>
          <div style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
            {pitLossDuration.toFixed(1)}s <span style={{ fontSize: "0.65rem", color: "var(--neon-green)" }}>{activeFlag === "SC" ? "(SAFETY CAR DISCOUNT)" : "(NORMAL GREEN)"}</span>
          </div>
        </div>

        <div style={{ background: "rgba(16, 20, 32, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT CREW SPEED RATING</div>
          <div style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: currentTeamObj.color, marginTop: "2px" }}>
            {currentTeamObj.pitSpeed} <span style={{ fontSize: "0.65rem", color: "#ffffff" }}>BASE STOP DURATION</span>
          </div>
        </div>

        <div style={{ background: "rgba(16, 20, 32, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>RECOMMENDED PIT WINDOW</div>
          <div style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-yellow)", marginTop: "2px" }}>
            LAPS 22 - 27 <span style={{ fontSize: "0.65rem", color: "#ffffff" }}>(1-STOP OPTIMAL)</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: LIVE PIT CALL & RE-ENTRY RADAR (THE 2 DRIVER CARDS) ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🎯</span>
            <span>LIVE PIT RE-ENTRY RADAR & BOX COMMAND</span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
            Command your 2 drivers. Press "BOX THIS LAP" to instantly apply stop onto Timing Matrix.
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "14px" }}>
          {teamDrivers.map((driver) => {
            const reentry = calculateReentry(driver);
            const currentTire = driver.tire || "M";
            const chosenComp = selectedCompounds[driver.code] || "H";
            const tireAge = driver.tireAge || 18;
            const wearPct = Math.round(driver.wear != null ? driver.wear : Math.min(95, tireAge * 3.5));
            const face = getDriverFaceUrl(driver.code, driver.photo_url || DRIVER_PHOTOS[driver.code]);
            const isAtCliff = wearPct >= 75;

            return (
              <div
                key={driver.code}
                style={{
                  background: "linear-gradient(135deg, rgba(20, 26, 42, 0.95) 0%, rgba(11, 15, 24, 0.98) 100%)",
                  border: `1.5px solid ${isAtCliff ? "var(--neon-red)" : "rgba(255, 255, 255, 0.12)"}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: isAtCliff ? "0 0 18px rgba(232,0,45,0.3)" : "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header: Driver Info & Current Position */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid rgba(255,255,255,0.2)",
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {face ? (
                        <img src={face} alt={driver.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "1.1rem" }}>🏎️</span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                          #{driver.num} {driver.name || driver.code}
                        </span>
                        <span style={{ fontSize: "0.70rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                          CURRENT: P{driver.pos}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                        GAP: <strong style={{ color: "#ffffff" }}>{driver.gap}</strong> · PITS: <strong style={{ color: "var(--neon-green)" }}>{driver.pits || 1}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Tire Status Badge */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.70rem",
                          fontWeight: "900",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: currentTire === "S" ? "#FF1801" : currentTire === "M" ? "#FFD700" : currentTire === "H" ? "#FFFFFF" : "#00A0DE",
                          color: currentTire === "H" ? "#000000" : "#ffffff",
                        }}
                      >
                        {currentTire} · LAP {tireAge}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.72rem",
                          fontWeight: "900",
                          color: isAtCliff ? "var(--neon-red)" : wearPct > 55 ? "#ffaa00" : "var(--neon-green)",
                        }}
                      >
                        {wearPct}% WEAR
                      </span>
                    </div>
                    <div style={{ width: "110px", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${wearPct}%`,
                          height: "100%",
                          background: isAtCliff ? "var(--neon-red)" : wearPct > 55 ? "#ffaa00" : "var(--neon-green)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── LIVE RE-ENTRY RADAR (CLEAR ENGLISH) ── */}
                {reentry && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.45)",
                      border: `1px solid ${reentry.traffic === "CLEAN" ? "rgba(0, 204, 68, 0.4)" : reentry.traffic === "SC_DISCOUNT" ? "rgba(255, 215, 0, 0.5)" : "rgba(232, 0, 45, 0.5)"}`,
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", textTransform: "uppercase" }}>
                        PIT EXIT RE-ENTRY PROJECTION
                      </span>
                      <span
                        style={{
                          fontSize: "0.60rem",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "800",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          background: reentry.traffic === "CLEAN" ? "rgba(0,204,68,0.2)" : reentry.traffic === "SC_DISCOUNT" ? "rgba(255,215,0,0.2)" : "rgba(232,0,45,0.2)",
                          color: reentry.traffic === "CLEAN" ? "var(--neon-green)" : reentry.traffic === "SC_DISCOUNT" ? "#ffd700" : "var(--neon-red)",
                          border: `1px solid ${reentry.traffic === "CLEAN" ? "var(--neon-green)" : reentry.traffic === "SC_DISCOUNT" ? "#ffd700" : "var(--neon-red)"}`,
                        }}
                      >
                        {reentry.traffic === "CLEAN" ? "🟢 CLEAN AIR" : reentry.traffic === "SC_DISCOUNT" ? "⚡ CHEAP SC STOP" : "🔴 DIRTY AIR / TRAFFIC RISK"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                        {reentry.carAhead ? `P${reentry.reEntryPos - 1} ${reentry.carAhead.code} (+${reentry.gapAhead}s)` : "LEAD"}
                      </div>
                      <div
                        style={{
                          background: "linear-gradient(135deg, rgba(0,210,190,0.25) 0%, rgba(20,24,36,0.9) 100%)",
                          border: "1px solid var(--neon-cyan)",
                          borderRadius: "6px",
                          padding: "3px 12px",
                          fontSize: "0.78rem",
                          fontFamily: "'Orbitron', monospace",
                          fontWeight: "900",
                          color: "#ffffff",
                        }}
                      >
                        REJOINS P{reentry.reEntryPos}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                        {reentry.carBehind ? `P${reentry.reEntryPos + 1} ${reentry.carBehind.code} (-${reentry.gapBehind}s)` : "LAST"}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TIRE COMPOUND CHOOSER & BOX NOW BUTTON ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  {/* Compound Selection Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
                      NEXT:
                    </span>
                    {Object.keys(TIRE_SPECS).map((compKey) => {
                      const spec = TIRE_SPECS[compKey];
                      const isSelected = chosenComp === compKey;
                      return (
                        <button
                          key={compKey}
                          onClick={() => setSelectedCompounds((prev) => ({ ...prev, [driver.code]: compKey }))}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            width: "24px",
                            height: "24px",
                            borderRadius: "5px",
                            border: isSelected ? `2px solid ${spec.color}` : "1px solid rgba(255,255,255,0.15)",
                            background: isSelected ? `${spec.color}35` : "rgba(0,0,0,0.3)",
                            color: isSelected ? spec.color : "rgba(255,255,255,0.7)",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.72rem",
                            fontWeight: "900",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isSelected ? `0 0 8px ${spec.color}50` : "none",
                            transition: "all 0.12s ease",
                          }}
                          title={`${spec.name}: ${spec.desc}`}
                        >
                          {compKey}
                        </button>
                      );
                    })}
                  </div>

                  {/* BOX THIS LAP Button */}
                  <button
                    onClick={() => handleBoxConfirm(driver)}
                    style={{
                      background: "linear-gradient(135deg, var(--neon-red) 0%, #a8001d 100%)",
                      border: "1px solid #ff4d6d",
                      borderRadius: "6px",
                      padding: "6px 14px",
                      color: "#ffffff",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.70rem",
                      fontWeight: "900",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 0 12px rgba(232,0,45,0.45)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.03)";
                      e.currentTarget.style.boxShadow = "0 0 18px rgba(232,0,45,0.7)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 0 12px rgba(232,0,45,0.45)";
                    }}
                  >
                    <span>📻</span>
                    <span>BOX THIS LAP ({chosenComp})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: DECIDED STRATEGY DIRECTIVES & DELETION MANAGER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📋</span>
              <span>ACTIVE STRATEGY DIRECTIVES ({plannedStrategies.length} PLANNED)</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "2px" }}>
              When the simulation reaches the scheduled lap, the car will automatically pit and reflect on the Timing Matrix. Click <strong>Delete</strong> anytime to cancel!
            </div>
          </div>
        </div>

        {/* 2-Column Split: Active List vs Quick Creator */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", alignItems: "start" }}>
          {/* Left Column: Active Planned Strategies List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              SCHEDULED PIT WINDOWS:
            </span>

            {plannedStrategies.length === 0 ? (
              <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "'Rajdhani', sans-serif" }}>
                No planned strategies active. Use the form on the right or apply a preset below to decide a strategy!
              </div>
            ) : (
              plannedStrategies.map((strat) => {
                const lapsRemaining = strat.lap - currentLap;
                const isDueNow = lapsRemaining <= 0;
                const spec = TIRE_SPECS[strat.targetCompound] || TIRE_SPECS.H;

                return (
                  <div
                    key={strat.id}
                    style={{
                      background: "rgba(0, 0, 0, 0.4)",
                      border: `1px solid ${isDueNow ? "var(--neon-green)" : "rgba(255, 255, 255, 0.08)"}`,
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#ffffff" }}>
                          #{strat.driverCode} · LAP {strat.lap}
                        </span>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            background: `${spec.color}25`,
                            color: spec.color,
                            border: `1px solid ${spec.color}50`,
                            fontFamily: "'Orbitron', monospace",
                            fontWeight: "800",
                          }}
                        >
                          FIT {spec.name.toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: "0.60rem",
                            fontFamily: "'Orbitron', monospace",
                            padding: "1px 5px",
                            borderRadius: "3px",
                            background: isDueNow ? "rgba(0,204,68,0.2)" : "rgba(255,255,255,0.06)",
                            color: isDueNow ? "var(--neon-green)" : "var(--text-secondary)",
                          }}
                        >
                          {isDueNow ? "🚨 WINDOW OPEN" : `⏳ IN ${lapsRemaining} LAPS`}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "2px" }}>
                        {strat.label}
                      </div>
                    </div>

                    {/* Delete Strategy Button */}
                    <button
                      onClick={() => handleDeleteDirective(strat.id, strat)}
                      style={{
                        background: "rgba(232, 0, 45, 0.15)",
                        border: "1px solid rgba(232, 0, 45, 0.4)",
                        borderRadius: "6px",
                        color: "var(--neon-red)",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.64rem",
                        fontWeight: "800",
                        padding: "5px 10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--neon-red)";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(232, 0, 45, 0.15)";
                        e.currentTarget.style.color = "var(--neon-red)";
                      }}
                      title="Delete this strategy directive. The driver will stay out on track instead of pitting."
                    >
                      <span>🗑️</span>
                      <span>DELETE</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Decide Strategy Form */}
          <form
            onSubmit={handleCreateDirective}
            style={{
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              ➕ DECIDE NEW PIT STOP:
            </span>

            {/* Select Driver */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>Driver:</label>
              <select
                value={formDriver}
                onChange={(e) => setFormDriver(e.target.value)}
                style={{
                  background: "#161b2a",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.70rem",
                }}
              >
                {teamDrivers.map((d) => (
                  <option key={d.code} value={d.code}>
                    #{d.num} {d.name || d.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Target Lap */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>Target Lap:</label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  min={currentLap + 1}
                  max={totalLaps}
                  value={formLap}
                  onChange={(e) => setFormLap(parseInt(e.target.value))}
                  style={{
                    width: "55px",
                    background: "#161b2a",
                    color: "var(--neon-green)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    padding: "3px 6px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.72rem",
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>/ {totalLaps}</span>
              </div>
            </div>

            {/* Select Next Compound */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>Next Compound:</label>
              <select
                value={formCompound}
                onChange={(e) => setFormCompound(e.target.value)}
                style={{
                  background: "#161b2a",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.70rem",
                }}
              >
                {Object.keys(TIRE_SPECS).map((k) => (
                  <option key={k} value={k}>
                    {TIRE_SPECS[k].letter} - {TIRE_SPECS[k].name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              style={{
                marginTop: "4px",
                background: "linear-gradient(135deg, rgba(0,210,190,0.25) 0%, rgba(20,24,36,0.95) 100%)",
                border: "1px solid var(--neon-cyan)",
                borderRadius: "6px",
                padding: "7px 12px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                fontWeight: "900",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              + CONFIRM & DECIDE STRATEGY
            </button>
          </form>
        </div>
      </div>

      {/* ── SECTION 3: 1-CLICK STRATEGY PRESETS (SIMPLE & INTUITIVE) ── */}
      <div>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💡</span>
          <span>1-CLICK STRATEGY PRESETS</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          {/* Preset A: Optimal 1-Stop */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.9)",
              border: "1px solid rgba(0,204,68,0.3)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-green)" }}>
                🟢 1-STOP OPTIMAL
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(0,204,68,0.15)", color: "var(--neon-green)", padding: "1px 5px", borderRadius: "3px" }}>
                RECOMMENDED
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
              Medium (Laps 1-24) $\rightarrow$ Hard (Laps 24-58). Low tire wear risk, optimal clean air delta.
            </div>
            <button
              onClick={() => onApplyPreset && onApplyPreset("oneStop")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(0,204,68,0.2)",
                border: "1px solid var(--neon-green)",
                borderRadius: "5px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              🎯 APPLY 1-STOP STRATEGY
            </button>
          </div>

          {/* Preset B: Aggressive 2-Stop */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.9)",
              border: "1px solid rgba(255,215,0,0.3)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "#ffd700" }}>
                🟡 2-STOP AGGRESSIVE
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(255,215,0,0.15)", color: "#ffd700", padding: "1px 5px", borderRadius: "3px" }}>
                HIGH OVERTAKES
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
              Soft (Laps 1-16) $\rightarrow$ Medium (Laps 16-38) $\rightarrow$ Soft (Laps 38-58). Maximum attack pace.
            </div>
            <button
              onClick={() => onApplyPreset && onApplyPreset("twoStop")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(255,215,0,0.2)",
                border: "1px solid #ffd700",
                borderRadius: "5px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              🎯 APPLY 2-STOP STRATEGY
            </button>
          </div>

          {/* Preset C: Undercut Attack */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.9)",
              border: "1px solid rgba(0,210,190,0.3)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                🔵 UNDERCUT / RAIN GAMBLE
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(0,210,190,0.15)", color: "var(--neon-cyan)", padding: "1px 5px", borderRadius: "3px" }}>
                TACTICAL
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
              Pit in next 2 laps to undercut rivals ahead on cold out-lap delta or fit Inters if drizzle begins.
            </div>
            <button
              onClick={() => onApplyPreset && onApplyPreset("rainGamble")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(0,210,190,0.2)",
                border: "1px solid var(--neon-cyan)",
                borderRadius: "5px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              🎯 APPLY UNDERCUT STRATEGY
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: SIMPLE STINT TIMELINE VISUALIZER ── */}
      <div
        style={{
          background: "rgba(16, 20, 32, 0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📊</span>
          <span>58-LAP RACE STINT TIMELINE</span>
        </div>

        {teamDrivers.map((driver) => {
          return (
            <div key={driver.code} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.70rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "#ffffff", fontWeight: "800" }}>#{driver.num} {driver.name || driver.code}</span>
                <span style={{ color: "var(--text-dim)" }}>Lap {currentLap} / {totalLaps}</span>
              </div>
              <div style={{ display: "flex", height: "18px", borderRadius: "5px", overflow: "hidden", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: "45%", background: "#ffd700", color: "#000", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  MEDIUM (L1 - 24)
                </div>
                <div style={{ width: "2px", background: "var(--neon-red)" }} title="Pit Stop" />
                <div style={{ width: "55%", background: "#ffffff", color: "#000", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  HARD (L25 - {totalLaps})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
