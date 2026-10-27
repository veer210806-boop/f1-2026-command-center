// ============================================================
// StrategyAdvisor.jsx — F1 Manager GP Strategy Engineer Station
// Full interactive strategy simulation & pit command workbench:
// 1. Tactical Telemetry & Measures Monitor (Pirelli compound cliffs & wear)
// 2. Interactive Strategy Builder per driver (1-Stop, 2-Stop, 3-Stop)
// 3. Live "What-If" Re-Entry & Traffic Simulator (calculates position on any lap)
// 4. Player Driving / Engine Push Modes (Attack, Balanced, Conserve)
// 5. Instant Tactical Call ("BOX THIS LAP NOW") & Planned Directives
// 6. Direct synchronization with the Live Timing Matrix
// ============================================================
import React, { useState, useMemo, useEffect } from "react";
import { getDriverFaceUrl, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { f1Audio } from "../utils/f1AudioEngine";

// Pirelli 2026 Compound Specifications & Wear Dynamics
const TIRE_SPECS = {
  S: {
    letter: "S",
    name: "Soft (C4)",
    color: "#FF1801",
    paceDelta: "-1.1s",
    optimalLaps: "1 - 15 laps",
    cliffLap: 18,
    wearPerLap: 5.2,
    desc: "Peak qualifying & sprint pace. High degradation cliff after 15 laps.",
  },
  M: {
    letter: "M",
    name: "Medium (C3)",
    color: "#FFD700",
    paceDelta: "0.0s (Baseline)",
    optimalLaps: "16 - 28 laps",
    cliffLap: 32,
    wearPerLap: 3.1,
    desc: "Primary race compound. Balanced speed with durable longevity.",
  },
  H: {
    letter: "H",
    name: "Hard (C2)",
    color: "#FFFFFF",
    paceDelta: "+0.8s",
    optimalLaps: "28 - 46 laps",
    cliffLap: 48,
    wearPerLap: 1.9,
    desc: "Maximum endurance. Stable lap times across long stints up to 45+ laps.",
  },
  I: {
    letter: "I",
    name: "Intermediate",
    color: "#39B54A",
    paceDelta: "+4.2s (Dry) / Fast (Wet)",
    optimalLaps: "Damp conditions (25-60% wet)",
    cliffLap: 25,
    wearPerLap: 3.8,
    desc: "Grooved compound for wet tracks. Prevents 15s aquaplaning time loss.",
  },
  W: {
    letter: "W",
    name: "Full Wet",
    color: "#00A0DE",
    paceDelta: "+8.5s (Dry) / Safe (Wet)",
    optimalLaps: "Heavy standing water",
    cliffLap: 20,
    wearPerLap: 4.5,
    desc: "Deep tread clears 85L/sec at 300km/h for extreme storm safety.",
  },
};

export default function StrategyAdvisor({
  selectedCircuit,
  drivers = [],
  playerTeam = "Ferrari",
  userRole = "team",
  currentLap = 1,
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

  // Pit loss durations based on track and flag status
  const pitLossDuration = useMemo(() => {
    if (activeFlag === "SC") return 13.5;
    if (activeFlag === "VSC") return 15.2;
    return selectedCircuit?.pit_loss_green || 22.5;
  }, [activeFlag, selectedCircuit]);

  // Current constructor team profile
  const currentTeamObj = useMemo(() => {
    return CONSTRUCTORS_2026.find((t) => t.id === playerTeam) || CONSTRUCTORS_2026[0];
  }, [playerTeam]);

  // Player team drivers (e.g. Leclerc & Hamilton for Ferrari)
  const teamDrivers = useMemo(() => {
    if (userRole === "team") {
      const filtered = drivers.filter(
        (d) => d.team && d.team.toLowerCase().includes(playerTeam.toLowerCase())
      );
      return filtered.length > 0 ? filtered : drivers.slice(0, 2);
    }
    return drivers.slice(0, 2);
  }, [drivers, playerTeam, userRole]);

  // Active selected driver tab in Strategy Workbench
  const [activeDriverCode, setActiveDriverCode] = useState(() => teamDrivers[0]?.code || "LEC");

  // Keep active driver valid if drivers list changes
  useEffect(() => {
    if (teamDrivers.length > 0 && !teamDrivers.some((d) => d.code === activeDriverCode)) {
      setActiveDriverCode(teamDrivers[0].code);
    }
  }, [teamDrivers, activeDriverCode]);

  const activeDriver = useMemo(() => {
    return teamDrivers.find((d) => d.code === activeDriverCode) || teamDrivers[0] || drivers[0];
  }, [teamDrivers, activeDriverCode, drivers]);

  // Interactive Strategy Builder State per driver
  const [driverPlans, setDriverPlans] = useState({
    LEC: {
      stopsCount: 1,
      stop1Lap: 22,
      stop1Compound: "H",
      stop2Lap: 40,
      stop2Compound: "S",
      pushMode: "balanced", // "attack" | "balanced" | "conserve"
    },
    HAM: {
      stopsCount: 1,
      stop1Lap: 26,
      stop1Compound: "H",
      stop2Lap: 42,
      stop2Compound: "S",
      pushMode: "balanced",
    },
  });

  // Current driver's active configuration plan
  const currentPlan = driverPlans[activeDriverCode] || {
    stopsCount: 1,
    stop1Lap: Math.min(totalLaps, currentLap + 15),
    stop1Compound: "H",
    stop2Lap: Math.min(totalLaps, currentLap + 32),
    stop2Compound: "S",
    pushMode: "balanced",
  };

  // Immediate "BOX THIS LAP" compound selector state
  const [instantBoxCompound, setInstantBoxCompound] = useState("H");

  // Notification message toast
  const [notificationMsg, setNotificationMsg] = useState(null);

  const updatePlanField = (field, value) => {
    setDriverPlans((prev) => ({
      ...prev,
      [activeDriverCode]: {
        ...(prev[activeDriverCode] || currentPlan),
        [field]: value,
      },
    }));
  };

  // Helper to parse driver gap in seconds
  const parseGapSec = (gapStr) => {
    if (!gapStr || gapStr === "LEADER") return 0;
    const num = parseFloat(String(gapStr).replace("+", "").replace("s", ""));
    return isNaN(num) ? 0 : num;
  };

  // ── DYNAMIC "WHAT-IF" RE-ENTRY SIMULATOR ─────────────────────────────────────
  // Calculates live where the car will exit if pitted at any target lap & compound
  const simulatedReentry = useMemo(() => {
    if (!activeDriver || !drivers || drivers.length === 0) return null;

    const currentGap = parseGapSec(activeDriver.gap);
    const targetPitLap = currentPlan.stop1Lap;
    const targetCompound = currentPlan.stop1Compound;

    // Projected gap after pit stop transit loss
    const projectedGap = currentGap + pitLossDuration;

    // Simulate grid positions if activeDriver takes pit loss
    const virtualGrid = drivers.map((d) => {
      if (d.code === activeDriver.code) {
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

    // Traffic evaluation
    let traffic = "CLEAN";
    let trafficDesc = "Clean air ahead. Driver can push freely on out-lap.";
    if (activeFlag === "SC" || activeFlag === "VSC") {
      traffic = "SC_DISCOUNT";
      trafficDesc = "Cheap pit stop under Safety Car! Saves ~9.0s over green flag!";
    } else if (carAhead && gapAhead < 1.2) {
      traffic = "DIRTY_AIR";
      trafficDesc = `Heavy traffic risk! Re-enters within ${gapAhead}s of #${carAhead.num} ${carAhead.code} in dirty air!`;
    } else if (carAhead && gapAhead < 2.5) {
      traffic = "MARGINAL";
      trafficDesc = `Moderate traffic: #${carAhead.num} ${carAhead.code} is ${gapAhead}s ahead. DRS available.`;
    }

    // Stint longevity assessment
    const remainingLapsToFinish = totalLaps - targetPitLap;
    const spec = TIRE_SPECS[targetCompound] || TIRE_SPECS.H;
    let stintHealth = "OPTIMAL";
    let stintWarning = null;

    if (currentPlan.stopsCount === 1) {
      if (targetCompound === "S" && remainingLapsToFinish > 16) {
        stintHealth = "CRITICAL";
        stintWarning = `Severe Cliff Alert: ${remainingLapsToFinish} laps to finish on Softs! Tires will completely degrade by Lap ${targetPitLap + 16}. Consider a 2-stop or Hard tire!`;
      } else if (targetCompound === "M" && remainingLapsToFinish > 30) {
        stintHealth = "RISKY";
        stintWarning = `High Wear Alert: ${remainingLapsToFinish} laps on Mediums. Medium cliff is ~28 laps. Final laps will lose 2.5s/lap!`;
      } else if (targetCompound === "H" && remainingLapsToFinish > 48) {
        stintHealth = "CRITICAL";
        stintWarning = `Extreme Stint: ${remainingLapsToFinish} laps remaining! Pitting on Lap ${targetPitLap} for Hards means tires will degrade heavily in final laps.`;
      } else {
        stintHealth = "OPTIMAL";
        stintWarning = `Balanced Stint: ${remainingLapsToFinish} laps on ${spec.name} is well within safe tire life limits.`;
      }
    } else {
      stintHealth = "OPTIMAL";
      stintWarning = `2-Stop Strategy: Stop 1 at Lap ${targetPitLap} (${spec.name}), Stop 2 at Lap ${currentPlan.stop2Lap}. Maximum pace attack plan.`;
    }

    return {
      pitLap: targetPitLap,
      compound: targetCompound,
      reEntryPos,
      carAhead,
      carBehind,
      gapAhead,
      gapBehind,
      traffic,
      trafficDesc,
      stintHealth,
      stintWarning,
      remainingLapsToFinish,
    };
  }, [activeDriver, drivers, currentPlan, pitLossDuration, totalLaps, activeFlag]);

  // ── CONFIRM & LOCK STRATEGY DIRECTIVE ───────────────────────────────────────
  const handleLockStrategy = () => {
    f1Audio.playRadioBeep();

    if (onAddStrategy) {
      // Clear existing directives for this driver and set the new ones
      const newDirective1 = {
        driverCode: activeDriver.code,
        lap: currentPlan.stop1Lap,
        targetCompound: currentPlan.stop1Compound,
        label: `Stop 1 @ Lap ${currentPlan.stop1Lap} → Fit ${TIRE_SPECS[currentPlan.stop1Compound].name}`,
      };
      onAddStrategy(newDirective1);

      if (currentPlan.stopsCount === 2) {
        const newDirective2 = {
          driverCode: activeDriver.code,
          lap: currentPlan.stop2Lap,
          targetCompound: currentPlan.stop2Compound,
          label: `Stop 2 @ Lap ${currentPlan.stop2Lap} → Fit ${TIRE_SPECS[currentPlan.stop2Compound].name}`,
        };
        onAddStrategy(newDirective2);
      }
    }

    setNotificationMsg(
      `🔒 STRATEGY LOCKED for #${activeDriver.num} ${activeDriver.code}: Pit Stop 1 confirmed for Lap ${currentPlan.stop1Lap} (${TIRE_SPECS[currentPlan.stop1Compound].name}). Car will automatically box on Timing Matrix!`
    );
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // ── INSTANT TACTICAL "BOX THIS LAP NOW" CALL ─────────────────────────────────
  const handleInstantBoxNow = () => {
    f1Audio.playRadioBeep();

    if (onExecutePitStop) {
      onExecutePitStop({
        driverCode: activeDriver.code,
        targetCompound: instantBoxCompound,
        reentry: simulatedReentry,
      });
    }

    setNotificationMsg(
      `📻 [RADIO TO #${activeDriver.num} ${activeDriver.code}]: "BOX BOX NOW! Fitting ${TIRE_SPECS[instantBoxCompound].name} tires." Stop executed on Timing Matrix!`
    );
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // ── CLEAR / CANCEL STRATEGY ────────────────────────────────────────────────
  const handleClearStrategy = () => {
    if (onDeleteStrategy) {
      plannedStrategies
        .filter((s) => s.driverCode === activeDriver.code)
        .forEach((s) => onDeleteStrategy(s.id));
    }
    setNotificationMsg(
      `🗑️ Strategy Cleared for #${activeDriver.num} ${activeDriver.code}. Planned stops canceled — car will stay out!`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // ── LOAD ENGINEER PRESETS (USER CAN THEN CUSTOMIZE) ─────────────────────────
  const handleLoadPreset = (presetType) => {
    f1Audio.playRadioBeep();
    if (presetType === "oneStop") {
      updatePlanField("stopsCount", 1);
      updatePlanField("stop1Lap", 24);
      updatePlanField("stop1Compound", "H");
      setNotificationMsg(`📋 Loaded 1-Stop Baseline (Medium L1-24 → Hard L24-58). You can adjust lap slider to any lap you choose!`);
    } else if (presetType === "twoStop") {
      updatePlanField("stopsCount", 2);
      updatePlanField("stop1Lap", 16);
      updatePlanField("stop1Compound", "M");
      updatePlanField("stop2Lap", 38);
      updatePlanField("stop2Compound", "S");
      setNotificationMsg(`📋 Loaded Aggressive 2-Stop (Soft L1-16 → Med L16-38 → Soft L38-58). High pace attack plan loaded!`);
    } else if (presetType === "undercut") {
      const target = Math.max(1, currentLap + 1);
      updatePlanField("stopsCount", 1);
      updatePlanField("stop1Lap", target);
      updatePlanField("stop1Compound", "H");
      setNotificationMsg(`📋 Loaded Early Undercut Gamble: Stop set to Lap ${target}. Adjust slider or click 'BOX THIS LAP' to execute!`);
    }
    setTimeout(() => setNotificationMsg(null), 6000);
  };

  // Active driver metrics
  const driverTire = activeDriver?.tire || "M";
  const driverTireAge = activeDriver?.tireAge || 0;
  const driverWearPct = Math.round(
    activeDriver?.wear != null ? activeDriver.wear : Math.min(95, driverTireAge * 3.5)
  );
  const driverFace = getDriverFaceUrl(
    activeDriver?.code,
    activeDriver?.photo_url || DRIVER_PHOTOS[activeDriver?.code]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "36px" }}>
      
      {/* ════════ TOP HERO BANNER: MISSION CONTROL HEADQUARTERS ════════ */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.6rem" }}>🧠</span>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.15rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{currentTeamObj.name.toUpperCase()} STRATEGY ROOM</span>
              <span style={{ fontSize: "0.62rem", background: "rgba(0,210,190,0.15)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", padding: "2px 7px", borderRadius: "4px" }}>
                F1 MANAGER MODE
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
              Active Grand Prix: <strong style={{ color: "#ffffff" }}>{circuitName}</strong> · Race Progress: <strong style={{ color: "var(--neon-green)" }}>Lap {currentLap}</strong> of {totalLaps} · Power Unit: <span style={{ color: "var(--neon-cyan)" }}>{currentTeamObj.powerUnit}</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcut to Live Timing Matrix */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={onGoToTiming}
            style={{
              background: "linear-gradient(135deg, rgba(232,0,45,0.25) 0%, rgba(20,24,38,0.95) 100%)",
              border: "1px solid var(--neon-red)",
              borderRadius: "8px",
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
            title="Switch back to live Timing Matrix to view real-time positions"
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

      {/* ════════ SECTION 1: RACE TELEMETRY & TACTICAL MEASURES ════════ */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.86rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📊</span>
            <span>TACTICAL MEASURES & TELEMETRY MONITOR (INSPECT BEFORE DECIDING)</span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
            Real-time track environment & Pirelli compound degradation models
          </span>
        </div>

        {/* 4 Environmental Measure Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
          {/* Card 1: Track Conditions */}
          <div style={{ background: "rgba(0, 0, 0, 0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>TRACK & AMBIENT TEMP</div>
            <div style={{ fontSize: "1.05rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
              34°C <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>/ 22°C Air</span>
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--neon-green)", fontFamily: "'Rajdhani', sans-serif", marginTop: "3px" }}>
              Track State: DRY · Low Graining Risk
            </div>
          </div>

          {/* Card 2: Weather & Rain Radar */}
          <div style={{ background: "rgba(0, 0, 0, 0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>WEATHER & RAIN RISK</div>
            <div style={{ fontSize: "1.05rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-cyan)", marginTop: "2px" }}>
              0% RAIN <span style={{ fontSize: "0.70rem", color: "#ffffff" }}>(CLEAR SKIES)</span>
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "3px" }}>
              Rain Probability &lt; 5% throughout 58 laps
            </div>
          </div>

          {/* Card 3: Pit Lane Transit Loss */}
          <div style={{ background: "rgba(0, 0, 0, 0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT LANE TRANSIT LOSS</div>
            <div style={{ fontSize: "1.05rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: activeFlag === "SC" ? "#ffd700" : "#ffffff", marginTop: "2px" }}>
              {pitLossDuration.toFixed(1)}s <span style={{ fontSize: "0.68rem", color: activeFlag === "SC" ? "#ffd700" : "var(--neon-green)" }}>
                {activeFlag === "SC" ? "(SC DISCOUNT!)" : "(GREEN FLAG)"}
              </span>
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "3px" }}>
              Base pit stop execution: {currentTeamObj.pitSpeed}
            </div>
          </div>

          {/* Card 4: 2026 MGU-K Power Unit */}
          <div style={{ background: "rgba(0, 0, 0, 0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>2026 MGU-K REGEN WINDOW</div>
            <div style={{ fontSize: "1.05rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-yellow)", marginTop: "2px" }}>
              350 kW <span style={{ fontSize: "0.68rem", color: "#ffffff" }}>(100% HEALTH)</span>
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--neon-green)", fontFamily: "'Rajdhani', sans-serif", marginTop: "3px" }}>
              Active Aero Z-Mode engaged on straights
            </div>
          </div>
        </div>

        {/* Pirelli Compound Telemetry Comparison Table */}
        <div style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 14px" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginBottom: "8px" }}>
            PIRELLI 2026 COMPOUND PERFORMANCE DELTAS & DEGRADATION CLIFFS:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
            {Object.keys(TIRE_SPECS).map((k) => {
              const spec = TIRE_SPECS[k];
              return (
                <div
                  key={k}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${spec.color}40`,
                    borderLeft: `4px solid ${spec.color}`,
                    borderRadius: "6px",
                    padding: "6px 10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "0.74rem", color: spec.color }}>
                      {spec.letter} · {spec.name}
                    </span>
                    <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "#ffffff" }}>
                      {spec.paceDelta}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "3px" }}>
                    Optimal: <strong style={{ color: "#ffffff" }}>{spec.optimalLaps}</strong> · Cliff: <strong style={{ color: "var(--neon-red)" }}>Lap {spec.cliffLap}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════ SECTION 2: INTERACTIVE STRATEGY WORKBENCH (PLAYER DECISION ROOM) ════════ */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)",
          border: `1.5px solid ${currentTeamObj.color}80`,
          borderRadius: "12px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 15px ${currentTeamObj.color}10`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎮</span>
              <span>STRATEGY WORKBENCH: YOUR TEAM, YOUR DECISION</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "2px" }}>
              You are the Lead Race Strategist. Choose exactly which lap to pit, select compounds, and command your drivers!
            </div>
          </div>

          {/* Driver Switcher Tabs (Driver 1 vs Driver 2) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>COMMAND DRIVER:</span>
            {teamDrivers.map((d) => {
              const isSelected = d.code === activeDriverCode;
              return (
                <button
                  key={d.code}
                  onClick={() => setActiveDriverCode(d.code)}
                  style={{
                    background: isSelected ? `linear-gradient(135deg, ${currentTeamObj.color}40 0%, rgba(20,24,36,0.98) 100%)` : "rgba(0,0,0,0.4)",
                    border: isSelected ? `1.5px solid ${currentTeamObj.color}` : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    color: "#ffffff",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.74rem",
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: isSelected ? `0 0 12px ${currentTeamObj.color}50` : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>🏎️</span>
                  <span>#{d.num} {d.code}</span>
                  <span style={{ fontSize: "0.62rem", color: isSelected ? "var(--neon-green)" : "var(--text-dim)" }}>
                    (P{d.pos})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DRIVER STATUS HEADER ── */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.25)",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {driverFace ? (
                <img src={driverFace} alt={activeDriver.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "1.3rem" }}>🏎️</span>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff" }}>
                  #{activeDriver.num} {activeDriver.name || activeDriver.code}
                </span>
                <span style={{ fontSize: "0.74rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                  CURRENT: P{activeDriver.pos}
                </span>
                <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  GAP: <strong style={{ color: "#ffffff" }}>{activeDriver.gap}</strong>
                </span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", marginTop: "3px" }}>
                Pits Completed: <strong style={{ color: "var(--neon-green)" }}>{activeDriver.pits || 0}</strong> · Best Lap: <span style={{ color: "#ffffff" }}>{activeDriver.bestLap || "1:28.412"}</span>
              </div>
            </div>
          </div>

          {/* Current Tire Condition */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "900",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: driverTire === "S" ? "#FF1801" : driverTire === "M" ? "#FFD700" : driverTire === "H" ? "#FFFFFF" : "#00A0DE",
                  color: driverTire === "H" ? "#000000" : "#ffffff",
                }}
              >
                {driverTire} · LAP {driverTireAge}
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.75rem",
                  fontWeight: "900",
                  color: driverWearPct > 75 ? "var(--neon-red)" : driverWearPct > 55 ? "#ffaa00" : "var(--neon-green)",
                }}
              >
                {driverWearPct}% WEAR
              </span>
            </div>
            <div style={{ width: "130px", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${driverWearPct}%`,
                  height: "100%",
                  background: driverWearPct > 75 ? "var(--neon-red)" : driverWearPct > 55 ? "#ffaa00" : "var(--neon-green)",
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── DRIVING / ENGINE PUSH MODE CONTROLS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", background: "rgba(0,0,0,0.25)", padding: "8px 14px", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              DRIVER TACTICAL PUSH MODE:
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                updatePlanField("pushMode", "attack");
                f1Audio.playRadioBeep();
                setNotificationMsg(`📻 [RADIO #${activeDriver.num}]: Mode Attack engaged! Pushing hard, +0.4s pace.`);
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                background: currentPlan.pushMode === "attack" ? "rgba(232,0,45,0.3)" : "rgba(255,255,255,0.04)",
                border: currentPlan.pushMode === "attack" ? "1.5px solid var(--neon-red)" : "1px solid rgba(255,255,255,0.1)",
                color: currentPlan.pushMode === "attack" ? "#ffffff" : "var(--text-dim)",
                padding: "4px 10px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: currentPlan.pushMode === "attack" ? "0 0 10px rgba(232,0,45,0.5)" : "none",
              }}
            >
              <span>🔴</span>
              <span>ATTACK (+0.4s pace / +60% wear)</span>
            </button>

            <button
              onClick={() => {
                updatePlanField("pushMode", "balanced");
                f1Audio.playRadioBeep();
                setNotificationMsg(`📻 [RADIO #${activeDriver.num}]: Mode Balanced engaged. Maintaining target delta.`);
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                background: currentPlan.pushMode === "balanced" ? "rgba(0,204,68,0.25)" : "rgba(255,255,255,0.04)",
                border: currentPlan.pushMode === "balanced" ? "1.5px solid var(--neon-green)" : "1px solid rgba(255,255,255,0.1)",
                color: currentPlan.pushMode === "balanced" ? "#ffffff" : "var(--text-dim)",
                padding: "4px 10px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: currentPlan.pushMode === "balanced" ? "0 0 10px rgba(0,204,68,0.4)" : "none",
              }}
            >
              <span>🟢</span>
              <span>BALANCED (Target Delta)</span>
            </button>

            <button
              onClick={() => {
                updatePlanField("pushMode", "conserve");
                f1Audio.playRadioBeep();
                setNotificationMsg(`📻 [RADIO #${activeDriver.num}]: Mode Conserve engaged. Lift & coast, saving tires.`);
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                background: currentPlan.pushMode === "conserve" ? "rgba(0,210,190,0.25)" : "rgba(255,255,255,0.04)",
                border: currentPlan.pushMode === "conserve" ? "1.5px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.1)",
                color: currentPlan.pushMode === "conserve" ? "#ffffff" : "var(--text-dim)",
                padding: "4px 10px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: currentPlan.pushMode === "conserve" ? "0 0 10px rgba(0,210,190,0.4)" : "none",
              }}
            >
              <span>🔵</span>
              <span>CONSERVE (-40% wear / Save tires)</span>
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE STRATEGY BUILDER: CHOOSE STOPS, LAPS & TIRES ── */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "#ffffff" }}>
                🔧 STRATEGY ARCHITECTURE:
              </span>
              <button
                onClick={() => updatePlanField("stopsCount", 1)}
                style={{
                  background: currentPlan.stopsCount === 1 ? "var(--neon-green)" : "rgba(255,255,255,0.06)",
                  color: currentPlan.stopsCount === 1 ? "#000000" : "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                1-STOP STRATEGY
              </button>
              <button
                onClick={() => updatePlanField("stopsCount", 2)}
                style={{
                  background: currentPlan.stopsCount === 2 ? "#ffd700" : "rgba(255,255,255,0.06)",
                  color: currentPlan.stopsCount === 2 ? "#000000" : "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                2-STOP STRATEGY
              </button>
            </div>

            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
              Drag the lap slider or type any lap (even Lap 2!) to simulate and lock your custom pit stop.
            </div>
          </div>

          {/* STOP 1 CONFIGURATION ROW */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                🛑 PIT STOP 1:
              </span>

              {/* Lap Slider & Direct Number Input */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, maxWidth: "500px", minWidth: "260px" }}>
                <span style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT ON LAP:</span>
                <input
                  type="range"
                  min="1"
                  max={totalLaps}
                  value={currentPlan.stop1Lap}
                  onChange={(e) => updatePlanField("stop1Lap", parseInt(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "var(--neon-cyan)",
                    cursor: "pointer",
                  }}
                />
                <input
                  type="number"
                  min="1"
                  max={totalLaps}
                  value={currentPlan.stop1Lap}
                  onChange={(e) => updatePlanField("stop1Lap", Math.max(1, Math.min(totalLaps, parseInt(e.target.value) || 1)))}
                  style={{
                    width: "55px",
                    background: "#161b2a",
                    border: "1px solid var(--neon-cyan)",
                    color: "#ffffff",
                    borderRadius: "4px",
                    padding: "3px 6px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.80rem",
                    fontWeight: "900",
                    textAlign: "center",
                  }}
                />
                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>/ {totalLaps}</span>
              </div>

              {/* Fit Compound Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>FIT:</span>
                {Object.keys(TIRE_SPECS).map((k) => {
                  const spec = TIRE_SPECS[k];
                  const isSelected = currentPlan.stop1Compound === k;
                  return (
                    <button
                      key={k}
                      onClick={() => updatePlanField("stop1Compound", k)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        width: "28px",
                        height: "28px",
                        borderRadius: "5px",
                        border: isSelected ? `2px solid ${spec.color}` : "1px solid rgba(255,255,255,0.15)",
                        background: isSelected ? `${spec.color}35` : "rgba(0,0,0,0.3)",
                        color: isSelected ? spec.color : "rgba(255,255,255,0.6)",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.75rem",
                        fontWeight: "900",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isSelected ? `0 0 10px ${spec.color}60` : "none",
                        transition: "all 0.12s ease",
                      }}
                      title={`${spec.name}: ${spec.desc}`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STOP 2 (IF 2-STOP SELECTED) */}
            {currentPlan.stopsCount === 2 && (
              <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "#ffd700" }}>
                  🛑 PIT STOP 2:
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, maxWidth: "500px", minWidth: "260px" }}>
                  <span style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT ON LAP:</span>
                  <input
                    type="range"
                    min={currentPlan.stop1Lap + 5}
                    max={totalLaps}
                    value={currentPlan.stop2Lap}
                    onChange={(e) => updatePlanField("stop2Lap", parseInt(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: "#ffd700",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="number"
                    min={currentPlan.stop1Lap + 5}
                    max={totalLaps}
                    value={currentPlan.stop2Lap}
                    onChange={(e) => updatePlanField("stop2Lap", Math.max(currentPlan.stop1Lap + 1, Math.min(totalLaps, parseInt(e.target.value) || 40)))}
                    style={{
                      width: "55px",
                      background: "#161b2a",
                      border: "1px solid #ffd700",
                      color: "#ffffff",
                      borderRadius: "4px",
                      padding: "3px 6px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.80rem",
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>/ {totalLaps}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>FIT:</span>
                  {Object.keys(TIRE_SPECS).map((k) => {
                    const spec = TIRE_SPECS[k];
                    const isSelected = currentPlan.stop2Compound === k;
                    return (
                      <button
                        key={k}
                        onClick={() => updatePlanField("stop2Compound", k)}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          width: "28px",
                          height: "28px",
                          borderRadius: "5px",
                          border: isSelected ? `2px solid ${spec.color}` : "1px solid rgba(255,255,255,0.15)",
                          background: isSelected ? `${spec.color}35` : "rgba(0,0,0,0.3)",
                          color: isSelected ? spec.color : "rgba(255,255,255,0.6)",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.75rem",
                          fontWeight: "900",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isSelected ? `0 0 10px ${spec.color}60` : "none",
                        }}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── ⚡ LIVE "WHAT-IF" RE-ENTRY & TRAFFIC SIMULATION PROJECTION ── */}
          {simulatedReentry && (
            <div
              style={{
                background: "rgba(0, 0, 0, 0.55)",
                border: `1.5px solid ${simulatedReentry.stintHealth === "CRITICAL" ? "var(--neon-red)" : simulatedReentry.traffic === "CLEAN" ? "var(--neon-green)" : "#ffd700"}`,
                borderRadius: "8px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔮</span>
                  <span>LIVE RE-ENTRY & TRAFFIC PROJECTION FOR STOP AT LAP {simulatedReentry.pitLap}:</span>
                </span>

                <span
                  style={{
                    fontSize: "0.64rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: simulatedReentry.traffic === "CLEAN" ? "rgba(0,204,68,0.2)" : simulatedReentry.traffic === "SC_DISCOUNT" ? "rgba(255,215,0,0.2)" : "rgba(232,0,45,0.2)",
                    color: simulatedReentry.traffic === "CLEAN" ? "var(--neon-green)" : simulatedReentry.traffic === "SC_DISCOUNT" ? "#ffd700" : "var(--neon-red)",
                    border: `1px solid ${simulatedReentry.traffic === "CLEAN" ? "var(--neon-green)" : simulatedReentry.traffic === "SC_DISCOUNT" ? "#ffd700" : "var(--neon-red)"}`,
                  }}
                >
                  {simulatedReentry.traffic === "CLEAN" ? "🟢 CLEAN AIR WINDOW" : simulatedReentry.traffic === "SC_DISCOUNT" ? "⚡ SAFETY CAR WINDOW" : "🔴 TRAFFIC DANGER"}
                </span>
              </div>

              {/* 3-Column Re-entry Output */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  {simulatedReentry.carAhead ? (
                    <>
                      Car Ahead: <strong style={{ color: "#ffffff" }}>P{simulatedReentry.reEntryPos - 1} {simulatedReentry.carAhead.code}</strong> (+{simulatedReentry.gapAhead}s)
                    </>
                  ) : (
                    <strong style={{ color: "var(--neon-green)" }}>RE-ENTERS IN THE LEAD!</strong>
                  )}
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0,210,190,0.3) 0%, rgba(20,24,36,0.95) 100%)",
                    border: "1.5px solid var(--neon-cyan)",
                    borderRadius: "6px",
                    padding: "4px 14px",
                    fontSize: "0.86rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "900",
                    color: "#ffffff",
                    boxShadow: "0 0 12px rgba(0,210,190,0.3)",
                  }}
                >
                  PROJECTED REJOINS P{simulatedReentry.reEntryPos}
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  {simulatedReentry.carBehind ? (
                    <>
                      Car Behind: <strong style={{ color: "#ffffff" }}>P{simulatedReentry.reEntryPos + 1} {simulatedReentry.carBehind.code}</strong> (-{simulatedReentry.gapBehind}s)
                    </>
                  ) : (
                    <strong style={{ color: "var(--text-dim)" }}>RE-ENTERS LAST (P22)</strong>
                  )}
                </div>
              </div>

              {/* Stint Health Assessment Line */}
              <div style={{ fontSize: "0.72rem", color: simulatedReentry.stintHealth === "CRITICAL" ? "var(--neon-red)" : simulatedReentry.stintHealth === "RISKY" ? "#ffaa00" : "var(--neon-green)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "700" }}>
                {simulatedReentry.stintWarning}
              </div>
            </div>
          )}

          {/* ── ACTION COMMAND BUTTONS ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* LOCK & SAVE STRATEGY BUTTON */}
              <button
                onClick={handleLockStrategy}
                style={{
                  background: "linear-gradient(135deg, rgba(0,204,68,0.25) 0%, rgba(10,30,20,0.95) 100%)",
                  border: "1.5px solid var(--neon-green)",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#ffffff",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.74rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 0 14px rgba(0,204,68,0.4)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>💾</span>
                <span>CONFIRM & LOCK STRATEGY PLAN</span>
              </button>

              {/* CLEAR STRATEGY BUTTON */}
              <button
                onClick={handleClearStrategy}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "var(--text-secondary)",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.70rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Cancel planned stops for this driver. Car will stay out on track."
              >
                <span>🗑️</span>
                <span>CLEAR PLAN (STAY OUT)</span>
              </button>
            </div>

            {/* INSTANT "BOX THIS LAP NOW" RIGHT-NOW ACTION */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>FIT:</span>
              <select
                value={instantBoxCompound}
                onChange={(e) => setInstantBoxCompound(e.target.value)}
                style={{
                  background: "#161b2a",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                }}
              >
                {Object.keys(TIRE_SPECS).map((k) => (
                  <option key={k} value={k}>
                    {k} - {TIRE_SPECS[k].name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleInstantBoxNow}
                style={{
                  background: "linear-gradient(135deg, var(--neon-red) 0%, #99001a 100%)",
                  border: "1.5px solid #ff4d6d",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#ffffff",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.74rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 0 16px rgba(232,0,45,0.6)",
                  transition: "all 0.15s ease",
                }}
                title="Pit on the very next/current lap right now, regardless of planned lap!"
              >
                <span>📻</span>
                <span>BOX THIS LAP NOW ({instantBoxCompound})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ SECTION 3: RACE ENGINEER ADVICE & 1-CLICK BLUEPRINTS ════════ */}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.84rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📻</span>
              <span>RACE ENGINEER TACTICAL ADVICE (AI RECOMMENDATIONS)</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", marginTop: "2px" }}>
              Our strategy AI suggests these optimal blueprints. Click any preset to load it into the workbench, then adjust the laps as you see fit!
            </div>
          </div>
        </div>

        {/* 3 Interactive Preset Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "10px" }}>
          {/* Preset A */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,204,68,0.3)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-green)" }}>
                🟢 1-STOP OPTIMAL
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(0,204,68,0.15)", color: "var(--neon-green)", padding: "1px 6px", borderRadius: "3px" }}>
                LOWEST RACE TIME
              </span>
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", margin: "6px 0 10px 0" }}>
              Start on Medium (L1-24), switch to Hard (L24-58). Safest tire wear profile with high clean air probability.
            </div>
            <button
              onClick={() => handleLoadPreset("oneStop")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(0,204,68,0.2)",
                border: "1px solid var(--neon-green)",
                borderRadius: "4px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                width: "100%",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              ⚡ LOAD 1-STOP BASELINE
            </button>
          </div>

          {/* Preset B */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "#ffd700" }}>
                🟡 2-STOP ATTACK
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(255,215,0,0.15)", color: "#ffd700", padding: "1px 6px", borderRadius: "3px" }}>
                MAXIMUM SPEED
              </span>
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", margin: "6px 0 10px 0" }}>
              Soft (L1-16) $\rightarrow$ Medium (L16-38) $\rightarrow$ Soft (L38-58). Extreme attack pace with 2 short pit stops.
            </div>
            <button
              onClick={() => handleLoadPreset("twoStop")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(255,215,0,0.2)",
                border: "1px solid #ffd700",
                borderRadius: "4px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                width: "100%",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              ⚡ LOAD 2-STOP ATTACK
            </button>
          </div>

          {/* Preset C */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,210,190,0.3)", borderRadius: "8px", padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                🔵 EARLY UNDERCUT GAMBLE
              </span>
              <span style={{ fontSize: "0.60rem", background: "rgba(0,210,190,0.15)", color: "var(--neon-cyan)", padding: "1px 6px", borderRadius: "3px" }}>
                TRACK POSITION
              </span>
            </div>
            <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", margin: "6px 0 10px 0" }}>
              Pit immediately in the next lap to jump rivals ahead via fresh tire out-lap pace or gamble on safety car.
            </div>
            <button
              onClick={() => handleLoadPreset("undercut")}
              style={{
                all: "unset",
                cursor: "pointer",
                background: "rgba(0,210,190,0.2)",
                border: "1px solid var(--neon-cyan)",
                borderRadius: "4px",
                padding: "5px 10px",
                color: "#ffffff",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.66rem",
                fontWeight: "800",
                width: "100%",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              ⚡ LOAD EARLY UNDERCUT
            </button>
          </div>
        </div>
      </div>

      {/* ════════ SECTION 4: DYNAMIC 58-LAP RACE STINT TIMELINE ════════ */}
      <div
        style={{
          background: "rgba(16, 20, 32, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.80rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📈</span>
            <span>RACE STINT TIMELINE (UPDATES LIVE WITH YOUR SLIDERS)</span>
          </div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
            LAP {currentLap} OF {totalLaps}
          </span>
        </div>

        {teamDrivers.map((driver) => {
          const plan = driverPlans[driver.code] || {
            stopsCount: 1,
            stop1Lap: 24,
            stop1Compound: "H",
          };
          const p1Pct = Math.round((plan.stop1Lap / totalLaps) * 100);
          const p2Pct = 100 - p1Pct;

          return (
            <div key={driver.code} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.70rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "#ffffff", fontWeight: "800" }}>#{driver.num} {driver.name || driver.code}</span>
                <span style={{ color: "var(--neon-green)" }}>Planned Stop: Lap {plan.stop1Lap} ({plan.stop1Compound})</span>
              </div>
              
              <div style={{ display: "flex", height: "20px", borderRadius: "5px", overflow: "hidden", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
                {/* Stint 1 */}
                <div
                  style={{
                    width: `${p1Pct}%`,
                    background: driver.tire === "S" ? "#FF1801" : driver.tire === "H" ? "#FFFFFF" : "#FFD700",
                    color: driver.tire === "H" ? "#000000" : "#ffffff",
                    fontSize: "0.62rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  STINT 1: {driver.tire || "M"} (L1 - {plan.stop1Lap})
                </div>

                {/* Pit Stop Marker */}
                <div style={{ width: "3px", background: "var(--neon-red)" }} title={`Pit Stop at Lap ${plan.stop1Lap}`} />

                {/* Stint 2 */}
                <div
                  style={{
                    width: `${p2Pct}%`,
                    background: plan.stop1Compound === "S" ? "#FF1801" : plan.stop1Compound === "H" ? "#FFFFFF" : "#FFD700",
                    color: plan.stop1Compound === "H" ? "#000000" : "#ffffff",
                    fontSize: "0.62rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  STINT 2: {plan.stop1Compound} (L{plan.stop1Lap + 1} - {totalLaps})
                </div>

                {/* Live Current Lap Position Marker */}
                <div
                  style={{
                    position: "absolute",
                    left: `${(currentLap / totalLaps) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: "2px",
                    background: "var(--neon-cyan)",
                    boxShadow: "0 0 8px var(--neon-cyan)",
                    zIndex: 5,
                  }}
                  title={`Current Race Lap: ${currentLap}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
