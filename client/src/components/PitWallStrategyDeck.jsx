// ============================================================
// PitWallStrategyDeck.jsx — Tactical Pit Wall Command & Re-Entry Radar
// Calculates exact real-time pit exit re-entry position, gap-to-traffic,
// compound selection, and executes live strategy pit calls onto the timing matrix.
// ============================================================
import React, { useState, useMemo } from "react";
import { getDriverFaceUrl, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { f1Audio } from "../utils/f1AudioEngine";

const TIRE_SPECS = {
  S: { letter: "S", name: "Soft", color: "#FF1801", paceDelta: -1.1, cliffLap: 14, desc: "Fastest initial pace (-1.1s/L). Severe cliff after L14." },
  M: { letter: "M", name: "Medium", color: "#FFD700", paceDelta: -0.4, cliffLap: 25, desc: "Prime race compound. Consistent 22-25 lap working window." },
  H: { letter: "H", name: "Hard", color: "#FFFFFF", paceDelta: +0.6, cliffLap: 42, desc: "Cold out-lap (+0.6s), then ultra-durable up to 40+ laps." },
  I: { letter: "I", name: "Inter", color: "#39B54A", paceDelta: 0.0, cliffLap: 22, desc: "Crucial if track dampness > 30%. Slicks lose 15s in wet!" },
  W: { letter: "W", name: "Wet", color: "#00A0DE", paceDelta: +1.5, cliffLap: 28, desc: "Extreme standing water spec. Prevents hydroplaning." },
};

export default function PitWallStrategyDeck({
  currentRole = "team", // "team" | "fia"
  playerTeam = "Ferrari",
  drivers = [],
  currentLap = 34,
  maxLaps = 58,
  activeFlag = "GREEN", // "GREEN" | "SC" | "VSC" | "RED"
  onExecutePitStop,
  onRadioBroadcast,
}) {
  // Pit loss durations based on track and neutralization
  const pitLossDuration = useMemo(() => {
    if (activeFlag === "SC") return 13.5;
    if (activeFlag === "VSC") return 15.2;
    return 22.5;
  }, [activeFlag]);

  // Which driver cards to show:
  // In team mode: show player's 2 drivers.
  // In FIA mode: show selector for any of the 22 drivers.
  const teamDrivers = useMemo(() => {
    if (currentRole === "team") {
      return drivers.filter((d) => d.team && d.team.toLowerCase().includes(playerTeam.toLowerCase()));
    }
    return drivers;
  }, [drivers, playerTeam, currentRole]);

  // State for chosen compound per driver
  const [selectedCompounds, setSelectedCompounds] = useState({
    HAM: "H",
    LEC: "H",
    NOR: "H",
    VER: "H",
    default: "H",
  });

  const [activeFiaDriverIdx, setActiveFiaDriverIdx] = useState(0);

  // Helper to calculate where a driver will re-enter
  const calculateReentry = (driver) => {
    if (!driver || !drivers || drivers.length === 0) return null;

    // Convert gap string to seconds
    const parseGapSec = (gapStr) => {
      if (!gapStr || gapStr === "LEADER") return 0;
      const num = parseFloat(gapStr.replace("+", "").replace("s", ""));
      return isNaN(num) ? 0 : num;
    };

    const currentGap = parseGapSec(driver.gap);
    const projectedGap = currentGap + pitLossDuration;

    // Build virtual grid with the target driver's new gap
    const virtualGrid = drivers.map((d) => {
      if (d.code === driver.code) {
        return { ...d, testGap: projectedGap, isSelf: true };
      }
      return { ...d, testGap: parseGapSec(d.gap), isSelf: false };
    });

    // Sort by projected gap
    virtualGrid.sort((a, b) => a.testGap - b.testGap);

    const reEntryIdx = virtualGrid.findIndex((d) => d.isSelf);
    const reEntryPos = reEntryIdx + 1;
    const carAhead = reEntryIdx > 0 ? virtualGrid[reEntryIdx - 1] : null;
    const carBehind = reEntryIdx < virtualGrid.length - 1 ? virtualGrid[reEntryIdx + 1] : null;

    const gapAhead = carAhead ? +(projectedGap - carAhead.testGap).toFixed(1) : null;
    const gapBehind = carBehind ? +(carBehind.testGap - projectedGap).toFixed(1) : null;

    // Traffic classification
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

  const handleCompoundSelect = (driverCode, comp) => {
    setSelectedCompounds((prev) => ({ ...prev, [driverCode]: comp }));
  };

  const handleConfirmBox = (driver) => {
    const comp = selectedCompounds[driver.code] || "H";
    const reentry = calculateReentry(driver);

    // Audio & Radio chime
    f1Audio.playRadioBeep();
    if (onRadioBroadcast) {
      onRadioBroadcast(driver, `Box this lap, box this lap. Fitting ${TIRE_SPECS[comp].name} tires. Rejoin target: P${reentry ? reentry.reEntryPos : "unknown"}.`);
    }

    if (onExecutePitStop) {
      onExecutePitStop({
        driverCode: driver.code,
        targetCompound: comp,
        reentry,
      });
    }
  };

  // Drivers to display in the tactical deck
  const displayedDrivers = currentRole === "team"
    ? (teamDrivers.length > 0 ? teamDrivers : drivers.slice(0, 2))
    : (teamDrivers.length > 0 ? [teamDrivers[activeFiaDriverIdx] || teamDrivers[0]] : []);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(14, 18, 30, 0.95) 0%, rgba(8, 11, 18, 0.98) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "14px",
        padding: "14px 18px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.55)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* ── TOP HEADER BAR: TACTICAL RE-ENTRY RADAR & CLEARANCE STATUS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(232,0,45,0.2)", border: "1px solid var(--neon-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
            🎯
          </div>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>LIVE PIT RE-ENTRY RADAR & TACTICAL BOX COMMAND</span>
              <span style={{ fontSize: "0.62rem", background: "rgba(0, 210, 190, 0.15)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", padding: "1px 6px", borderRadius: "4px" }}>
                PIT LOSS: {pitLossDuration}s
              </span>
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
              {currentRole === "team" ? (
                <span>COMMANDING: <strong style={{ color: "var(--neon-cyan)" }}>{playerTeam.toUpperCase()}</strong> · YOUR 2 CARS ONLY · OPPONENT STRATEGY AI-CONTROLLED</span>
              ) : (
                <span>COMMANDING: <strong style={{ color: "var(--neon-green)" }}>FIA GLOBAL OVERSEER</strong> · UNRESTRICTED GRID FORCE-PIT CLEARANCE</span>
              )}
            </div>
          </div>
        </div>

        {/* FIA Mode: 22-Driver Dropdown Picker */}
        {currentRole === "fia" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>SELECT TARGET CAR:</span>
            <select
              value={activeFiaDriverIdx}
              onChange={(e) => setActiveFiaDriverIdx(Number(e.target.value))}
              style={{
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "4px 8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {drivers.map((d, idx) => (
                <option key={d.code} value={idx}>
                  P{d.pos} #{d.num} {d.code} ({d.team})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── DRIVER TACTICAL CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: currentRole === "team" ? "repeat(auto-fit, minmax(380px, 1fr))" : "1fr", gap: "14px" }}>
        {displayedDrivers.map((driver) => {
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
                border: `1.5px solid ${isAtCliff ? "var(--neon-red)" : "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: isAtCliff ? "0 0 16px rgba(232,0,45,0.25)" : "none",
                position: "relative",
              }}
            >
              {/* Header: Driver Name, Face, Position & Gap */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
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
                      <span style={{ fontSize: "1rem" }}>🏎️</span>
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
                      GAP TO LEAD: <strong style={{ color: "#ffffff" }}>{driver.gap}</strong> · PITS COMPLETED: <strong style={{ color: "var(--neon-green)" }}>{driver.pits || 1}</strong>
                    </div>
                  </div>
                </div>

                {/* Tire Status Capsule */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.72rem",
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

                  {/* Micro Wear Progress Bar */}
                  <div style={{ width: "120px", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
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

              {/* ── LIVE PIT EXIT RADAR BOX ── */}
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
                    <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                      PREDICTED PIT RE-ENTRY POSITION:
                    </span>
                    <span
                      style={{
                        fontSize: "0.64rem",
                        fontFamily: "'Orbitron', monospace",
                        fontWeight: "900",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: reentry.traffic === "CLEAN" ? "rgba(0,204,68,0.15)" : reentry.traffic === "SC_DISCOUNT" ? "rgba(255,215,0,0.15)" : "rgba(232,0,45,0.18)",
                        color: reentry.traffic === "CLEAN" ? "var(--neon-green)" : reentry.traffic === "SC_DISCOUNT" ? "var(--neon-yellow)" : "var(--neon-red)",
                        border: `1px solid ${reentry.traffic === "CLEAN" ? "var(--neon-green)" : reentry.traffic === "SC_DISCOUNT" ? "var(--neon-yellow)" : "var(--neon-red)"}`,
                      }}
                    >
                      {reentry.traffic === "CLEAN" ? "🟢 CLEAN AIR WINDOW" : reentry.traffic === "SC_DISCOUNT" ? "⚡ SAFETY CAR DISCOUNT" : "🔴 TRAFFIC / DIRTY AIR RISK"}
                    </span>
                  </div>

                  {/* Re-entry Slot Visual: Car Ahead -> [EXIT: DRIVER] -> Car Behind */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "6px 10px", borderRadius: "6px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}>
                    {/* Car Ahead */}
                    <div style={{ color: "var(--text-secondary)" }}>
                      {reentry.carAhead ? (
                        <span>P{reentry.carAhead.pos} {reentry.carAhead.code} <strong style={{ color: "var(--neon-cyan)" }}>(+{reentry.gapAhead}s)</strong></span>
                      ) : (
                        <span style={{ color: "var(--neon-green)" }}>👑 RE-ENTERS IN LEAD</span>
                      )}
                    </div>

                    {/* Exit Badge */}
                    <div
                      style={{
                        background: "linear-gradient(135deg, rgba(0, 210, 190, 0.25) 0%, rgba(0, 150, 136, 0.35) 100%)",
                        border: "1.5px solid var(--neon-cyan)",
                        color: "#ffffff",
                        padding: "3px 12px",
                        borderRadius: "6px",
                        fontWeight: "900",
                        fontSize: "0.82rem",
                        boxShadow: "0 0 12px rgba(0, 210, 190, 0.4)",
                      }}
                    >
                      REJOINS P{reentry.reEntryPos}
                    </div>

                    {/* Car Behind */}
                    <div style={{ color: "var(--text-secondary)" }}>
                      {reentry.carBehind ? (
                        <span>P{reentry.carBehind.pos} {reentry.carBehind.code} <strong style={{ color: "var(--neon-yellow)" }}>(-{reentry.gapBehind}s)</strong></span>
                      ) : (
                        <span style={{ color: "var(--text-dim)" }}>CLEAR TRACK</span>
                      )}
                    </div>
                  </div>

                  {/* Warning assessment description */}
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                    {reentry.traffic === "CLEAN" && "✓ Free track position ahead. Driver will be able to utilize full out-lap tire performance immediately."}
                    {reentry.traffic === "DIRTY_AIR" && `⚠ Traffic Alert: Re-enters within ${reentry.gapAhead}s of ${reentry.carAhead?.code}. Will lose approx. 1.2s/lap in turbulent dirty air!`}
                    {reentry.traffic === "SC_DISCOUNT" && "⚡ Strategic Advantage: Pitting under Safety Car saves 9.0s of lost time compared to green flag stop!"}
                  </div>
                </div>
              )}

              {/* ── COMPOUND SELECTION STRIP & CONFIRM BOX BUTTON ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                {/* Compound Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginRight: "2px" }}>
                    FIT COMPOUND:
                  </span>
                  {["S", "M", "H", "I", "W"].map((compKey) => {
                    const spec = TIRE_SPECS[compKey];
                    const isSelected = chosenComp === compKey;
                    return (
                      <button
                        key={compKey}
                        onClick={() => handleCompoundSelect(driver.code, compKey)}
                        title={spec.desc}
                        style={{
                          background: isSelected ? spec.color : "rgba(255,255,255,0.05)",
                          color: isSelected ? (compKey === "H" ? "#000" : "#fff") : "var(--text-secondary)",
                          border: `1px solid ${isSelected ? spec.color : "rgba(255,255,255,0.12)"}`,
                          borderRadius: "4px",
                          padding: "3px 8px",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.68rem",
                          fontWeight: "900",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                          boxShadow: isSelected ? `0 0 10px ${spec.color}88` : "none",
                        }}
                      >
                        {spec.letter}
                      </button>
                    );
                  })}
                </div>

                {/* Confirm Box Order Button */}
                <button
                  onClick={() => handleConfirmBox(driver)}
                  style={{
                    background: "linear-gradient(135deg, rgba(232,0,45,0.95) 0%, rgba(180,0,30,0.98) 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.72rem",
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 14px rgba(232,0,45,0.6)",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(232,0,45,0.85)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(232,0,45,0.6)"; }}
                >
                  <span>📻</span>
                  <span>BOX THIS LAP ({chosenComp})</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
