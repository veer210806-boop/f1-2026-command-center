// ============================================================
// StrategyAdvisor.jsx — Next-Gen F1 Race Strategy Command Center
// High-tech, uncluttered dual-column cockpit interface:
// LEFT: Stint Architect, Dynamic Lap Sliders & Tactical Pit Orders
// RIGHT: Live Re-Entry Radar, Traffic Projection & Tire Garage
// ============================================================
import React, { useState, useMemo, useEffect } from "react";
import { getDriverFaceUrl, DRIVER_PHOTOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { f1Audio } from "../utils/f1AudioEngine";

// Pirelli 2026 Compound Specifications
const TIRE_SPECS = {
  S: {
    letter: "S",
    name: "Soft (C4)",
    color: "#FF1801",
    paceDelta: "-1.1s",
    optimalLaps: "1 - 15 laps",
    cliffLap: 18,
    wearPerLap: 5.2,
    desc: "Peak qualifying pace. High degradation cliff after 15 laps.",
  },
  M: {
    letter: "M",
    name: "Medium (C3)",
    color: "#FFD700",
    paceDelta: "0.0s (Baseline)",
    optimalLaps: "16 - 28 laps",
    cliffLap: 32,
    wearPerLap: 3.1,
    desc: "Primary race tire. Balanced speed and endurance.",
  },
  H: {
    letter: "H",
    name: "Hard (C2)",
    color: "#FFFFFF",
    paceDelta: "+0.8s",
    optimalLaps: "28 - 46 laps",
    cliffLap: 48,
    wearPerLap: 1.9,
    desc: "Maximum endurance up to 45+ laps.",
  },
  I: {
    letter: "I",
    name: "Intermediate",
    color: "#39B54A",
    paceDelta: "+4.2s (Dry) / Fast (Wet)",
    optimalLaps: "Damp conditions (25-60% wet)",
    cliffLap: 25,
    wearPerLap: 3.8,
    desc: "Grooved compound for wet tracks.",
  },
  W: {
    letter: "W",
    name: "Full Wet",
    color: "#00A0DE",
    paceDelta: "+8.5s (Dry) / Safe (Wet)",
    optimalLaps: "Heavy standing water",
    cliffLap: 20,
    wearPerLap: 4.5,
    desc: "Deep tread clears 85L/sec for extreme storm safety.",
  },
};

// Available Weekend Tire Rack
const DEFAULT_TIRE_SETS = [
  { id: "S1", compound: "S", label: "NEW Soft (C4)", condition: "NEW", wear: 0, age: 0, lifePct: 100, desc: "Brand new sticker set · 100% grip" },
  { id: "S2", compound: "S", label: "USED Q3 Soft", condition: "USED", wear: 16, age: 3, lifePct: 84, desc: "Used 3 laps in Q3 Shootout" },
  { id: "M1", compound: "M", label: "NEW Medium (C3)", condition: "NEW", wear: 0, age: 0, lifePct: 100, desc: "Brand new sticker set · Prime race tire" },
  { id: "M2", compound: "M", label: "SCRUBBED Q2 Medium", condition: "USED", wear: 9, age: 2, lifePct: 91, desc: "Heat-cycled 2 laps in Q2" },
  { id: "H1", compound: "H", label: "NEW Hard (C2)", condition: "NEW", wear: 0, age: 0, lifePct: 100, desc: "Brand new sticker set · 45+ lap longevity" },
  { id: "I1", compound: "I", label: "NEW Intermediate", condition: "NEW", wear: 0, age: 0, lifePct: 100, desc: "Grooved intermediate wet tire" },
];

// Realistic 2026 AI Rival Pit Windows
const RIVAL_PIT_SCHEDULE = {
  NOR: { pitLap: 24, comp: "H" },
  VER: { pitLap: 22, comp: "H" },
  RUS: { pitLap: 16, comp: "M" },
  LEC: { pitLap: 23, comp: "H" },
  HAM: { pitLap: 25, comp: "H" },
  PIA: { pitLap: 18, comp: "H" },
  SAI: { pitLap: 26, comp: "H" },
  ANT: { pitLap: 24, comp: "H" },
  ALO: { pitLap: 15, comp: "H" },
  ALB: { pitLap: 27, comp: "H" },
  PER: { pitLap: 25, comp: "H" },
  HAD: { pitLap: 17, comp: "M" },
  HUL: { pitLap: 38, comp: "S" },
  STR: { pitLap: 26, comp: "H" },
  GAS: { pitLap: 15, comp: "M" },
  OCO: { pitLap: 28, comp: "H" },
  LAW: { pitLap: 27, comp: "H" },
  BEA: { pitLap: 36, comp: "M" },
  BOT: { pitLap: 40, comp: "S" },
  BOR: { pitLap: 28, comp: "H" },
  COL: { pitLap: 16, comp: "M" },
  LIN: { pitLap: 29, comp: "H" },
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
  driverPlans = {},
  onUpdateDriverPlan,
  onCompletePlanStop,
  onAddStrategy,
  onDeleteStrategy,
  onApplyPreset,
  onGoToTiming,
  activePitEvent,
  onSetPitEvent,
  overtakeEvent,
}) {
  const totalLaps = selectedCircuit?.laps || maxLaps || 58;
  const circuitName = selectedCircuit?.grand_prix_name || "Australian Grand Prix";

  // Pit loss durations based on track and flag status
  const pitLossDuration = useMemo(() => {
    if (activeFlag === "SC") return 13.5;
    if (activeFlag === "VSC") return 15.2;
    return selectedCircuit?.pit_loss_green || 22.5;
  }, [activeFlag, selectedCircuit]);

  // Current constructor profile
  const currentTeamObj = useMemo(() => {
    const p = (playerTeam || "").toLowerCase();
    return (
      CONSTRUCTORS_2026.find(
        (t) =>
          t.id.toLowerCase() === p ||
          t.name.toLowerCase().includes(p) ||
          p.includes(t.id.toLowerCase())
      ) || CONSTRUCTORS_2026[0]
    );
  }, [playerTeam]);

  // Team drivers
  const teamDrivers = useMemo(() => {
    const p = (playerTeam || "").toLowerCase();
    const filtered = drivers.filter(
      (d) =>
        d.team &&
        (d.team.toLowerCase().includes(p) ||
          p.includes(d.team.toLowerCase()) ||
          (p.includes("red") && d.team.toLowerCase().includes("red")) ||
          (p.includes("audi") && d.team.toLowerCase().includes("sauber")) ||
          (p.includes("sauber") && d.team.toLowerCase().includes("audi")) ||
          (p.includes("bulls") && d.team.toLowerCase().includes("bulls")))
    );
    if (filtered.length > 0) return filtered.slice(0, 2);
    if (currentTeamObj?.drivers) {
      const codes = currentTeamObj.drivers.map((d) => d.code);
      const found = drivers.filter((d) => codes.includes(d.code));
      if (found.length > 0) return found.slice(0, 2);
    }
    return drivers.slice(0, 2);
  }, [drivers, playerTeam, currentTeamObj]);

  // Active selected driver tab
  const [activeDriverCode, setActiveDriverCode] = useState(() => teamDrivers[0]?.code || "VER");

  useEffect(() => {
    if (teamDrivers.length > 0 && !teamDrivers.some((d) => d.code === activeDriverCode)) {
      setActiveDriverCode(teamDrivers[0].code);
    }
  }, [teamDrivers, activeDriverCode]);

  const activeDriver = useMemo(() => {
    return teamDrivers.find((d) => d.code === activeDriverCode) || teamDrivers[0] || drivers[0];
  }, [teamDrivers, activeDriverCode, drivers]);

  // Current driver's plan from App.jsx props
  const currentPlan = driverPlans[activeDriverCode] || {
    stopsCount: 1,
    stop1Lap: 24,
    stop1SetId: "H1",
    stop1Completed: false,
    stop2Lap: 42,
    stop2SetId: "S1",
    stop2Completed: false,
    pushMode: "balanced",
  };

  const updatePlanField = (field, value) => {
    if (onUpdateDriverPlan) {
      onUpdateDriverPlan(activeDriverCode, { [field]: value });
    }
  };

  // Immediate box selection
  const [instantBoxSetId, setInstantBoxSetId] = useState("H1");
  const [notificationMsg, setNotificationMsg] = useState(null);

  const selectedStop1Set = DEFAULT_TIRE_SETS.find((s) => s.id === currentPlan.stop1SetId) || DEFAULT_TIRE_SETS[4];
  const selectedStop2Set = DEFAULT_TIRE_SETS.find((s) => s.id === currentPlan.stop2SetId) || DEFAULT_TIRE_SETS[0];
  const selectedInstantSet = DEFAULT_TIRE_SETS.find((s) => s.id === instantBoxSetId) || DEFAULT_TIRE_SETS[4];

  const isStop1Done = currentPlan.stop1Completed || (activeDriver?.pits || 0) >= 1;
  const isNoPitRequired = isStop1Done && (activeDriver?.wear || 0) < 75;

  // ═════════════════════════════════════════════════════════════════════════════
  // 🔮 DYNAMIC RE-ENTRY & TRAFFIC SIMULATION ENGINE
  // ═════════════════════════════════════════════════════════════════════════════
  const simulatedReentry = useMemo(() => {
    if (!activeDriver || !drivers || drivers.length === 0) return null;

    const targetPitLap = isStop1Done
      ? Math.max(1, Math.min(totalLaps, currentPlan.stop2Lap || 42))
      : Math.max(1, Math.min(totalLaps, currentPlan.stop1Lap || 24));
    const targetSet = isStop1Done ? selectedStop2Set : selectedStop1Set;
    const targetCompound = targetSet.compound;

    const GRID_PACE_DELTAS = {
      NOR: 0.00, VER: 0.06, LEC: 0.12, HAM: 0.16, RUS: 0.22, PIA: 0.25,
      SAI: 0.45, ANT: 0.55, ALO: 0.65, ALB: 0.75, PER: 0.85, HAD: 0.95,
      STR: 1.10, GAS: 1.20, OCO: 1.30, LAW: 1.40, BEA: 1.55, HUL: 1.70,
      BOT: 1.85, BOR: 2.00, COL: 2.15, LIN: 2.30,
    };

    const ourPace = GRID_PACE_DELTAS[activeDriver.code] ?? 0.14;
    const ourPostPitGap = +(targetPitLap * ourPace + pitLossDuration).toFixed(2);

    const gridAtTargetLap = drivers.map((d, idx) => {
      const isSelf = d.code === activeDriver.code;
      const rivalPace = GRID_PACE_DELTAS[d.code] ?? 0.85;
      const rivalSchedule = RIVAL_PIT_SCHEDULE[d.code] || { pitLap: 25, comp: "H" };

      const rivalHasPitted = !isSelf && rivalSchedule.pitLap <= targetPitLap;
      const pitLossIncurred = rivalHasPitted ? 22.5 : 0;
      const naturalGap = +(targetPitLap * rivalPace).toFixed(2);
      const projectedGap = +(naturalGap + pitLossIncurred).toFixed(2);

      return {
        code: d.code,
        num: d.num,
        name: d.name,
        team: d.team,
        isSelf,
        projectedGap,
        initialPos: idx + 1,
      };
    });

    const rivals = gridAtTargetLap.filter((d) => !d.isSelf);
    const carsAhead = rivals.filter((r) => r.projectedGap < ourPostPitGap);
    const carsBehind = rivals.filter((r) => r.projectedGap >= ourPostPitGap);

    carsAhead.sort((a, b) => b.projectedGap - a.projectedGap);
    carsBehind.sort((a, b) => a.projectedGap - b.projectedGap);

    const reEntryPos = Math.min(22, carsAhead.length + 1);
    const carAhead = carsAhead[0] || null;
    const carBehind = carsBehind[0] || null;

    const gapAhead = carAhead ? +(ourPostPitGap - carAhead.projectedGap).toFixed(1) : null;
    const gapBehind = carBehind ? +(carBehind.projectedGap - ourPostPitGap).toFixed(1) : null;

    let traffic = "CLEAN";
    let trafficDesc = "Clean air ahead. Driver can push freely on fresh rubber.";
    if (activeFlag === "SC" || activeFlag === "VSC") {
      traffic = "SC_DISCOUNT";
      trafficDesc = "Cheap pit stop under Safety Car! Saves ~9.0s over green flag!";
    } else if (carAhead && gapAhead < 1.2) {
      traffic = "DIRTY_AIR";
      trafficDesc = `Heavy traffic: Re-enters within ${gapAhead}s of #${carAhead.num} ${carAhead.code} in dirty air!`;
    } else if (carAhead && gapAhead < 2.5) {
      traffic = "MARGINAL";
      trafficDesc = `Moderate traffic: #${carAhead.num} ${carAhead.code} is ${gapAhead}s ahead. DRS available.`;
    }

    const remainingLapsToFinish = totalLaps - targetPitLap;
    let stintHealth = "OPTIMAL";
    let stintWarning = null;

    if (!isStop1Done && currentPlan.stopsCount === 1) {
      if (targetCompound === "S" && remainingLapsToFinish > 16) {
        stintHealth = "CRITICAL";
        stintWarning = `Severe Cliff Alert: ${remainingLapsToFinish} laps on Softs will hit degradation cliff by Lap ${targetPitLap + 16}. Consider Hard tire.`;
      } else if (targetCompound === "M" && remainingLapsToFinish > 30) {
        stintHealth = "RISKY";
        stintWarning = `High Wear Alert: ${remainingLapsToFinish} laps on Mediums exceeds optimal working window.`;
      } else {
        stintHealth = "OPTIMAL";
        stintWarning = `Balanced Stint: ${remainingLapsToFinish} laps on ${targetSet.label} is well within safe limits.`;
      }
    } else {
      stintHealth = "OPTIMAL";
      stintWarning = isStop1Done
        ? `Stop 2 Sprint: ${remainingLapsToFinish} laps on ${targetSet.label}. Push mode to checkered flag.`
        : `2-Stop Attack Plan: Stop 1 at Lap ${targetPitLap}, Stop 2 at Lap ${currentPlan.stop2Lap}. Maximum pace.`;
    }

    return {
      stopNum: isStop1Done ? 2 : 1,
      pitLap: targetPitLap,
      compound: targetCompound,
      set: targetSet,
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
  }, [activeDriver, drivers, currentPlan, selectedStop1Set, selectedStop2Set, isStop1Done, pitLossDuration, totalLaps, activeFlag]);

  // ── CONFIRM & LOCK STRATEGY DIRECTIVE ───────────────────────────────────────
  const handleLockStrategy = () => {
    f1Audio.playRadioBeep();

    if (onAddStrategy) {
      if (isStop1Done) {
        const stop2Set = selectedStop2Set;
        const newDirective2 = {
          id: `stop2_${activeDriver.code}`,
          driverCode: activeDriver.code,
          lap: currentPlan.stop2Lap,
          targetCompound: stop2Set.compound,
          initialWear: stop2Set.wear,
          initialAge: stop2Set.age,
          stopNum: 2,
          label: `Stop 2 @ Lap ${currentPlan.stop2Lap} → Fit ${stop2Set.label}`,
        };
        onAddStrategy(newDirective2);
        setNotificationMsg(`🔒 STOP 2 LOCKED: #${activeDriver.num} ${activeDriver.code} will box at Lap ${currentPlan.stop2Lap} (${stop2Set.label})!`);
      } else {
        const newDirective1 = {
          id: `stop1_${activeDriver.code}`,
          driverCode: activeDriver.code,
          lap: currentPlan.stop1Lap,
          targetCompound: selectedStop1Set.compound,
          initialWear: selectedStop1Set.wear,
          initialAge: selectedStop1Set.age,
          stopNum: 1,
          label: `Stop 1 @ Lap ${currentPlan.stop1Lap} → Fit ${selectedStop1Set.label}`,
        };
        onAddStrategy(newDirective1);

        if (currentPlan.stopsCount === 2) {
          const stop2Set = selectedStop2Set;
          const newDirective2 = {
            id: `stop2_${activeDriver.code}`,
            driverCode: activeDriver.code,
            lap: currentPlan.stop2Lap,
            targetCompound: stop2Set.compound,
            initialWear: stop2Set.wear,
            initialAge: stop2Set.age,
            stopNum: 2,
            label: `Stop 2 @ Lap ${currentPlan.stop2Lap} → Fit ${stop2Set.label}`,
          };
          onAddStrategy(newDirective2);
        }

        setNotificationMsg(`🔒 STRATEGY LOCKED: #${activeDriver.num} ${activeDriver.code} will box at Lap ${currentPlan.stop1Lap} (${selectedStop1Set.label})!`);
      }
    }
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // ── INSTANT TACTICAL BOX NOW CALL ──────────────────────────────────────────
  const handleInstantBoxNow = () => {
    f1Audio.playRadioBeep();

    if (onExecutePitStop) {
      onExecutePitStop({
        driverCode: activeDriver.code,
        targetCompound: selectedInstantSet.compound,
        initialWear: selectedInstantSet.wear,
        initialAge: selectedInstantSet.age,
        reentry: simulatedReentry,
      });
    }

    setNotificationMsg(`📻 [RADIO TO #${activeDriver.num} ${activeDriver.code}]: "BOX BOX NOW! Fitting ${selectedInstantSet.label}." Execution underway!`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // ── CLEAR STRATEGY ─────────────────────────────────────────────────────────
  const handleClearStrategy = () => {
    if (onDeleteStrategy) {
      plannedStrategies
        .filter((s) => s.driverCode === activeDriver.code)
        .forEach((s) => onDeleteStrategy(s.id));
    }
    setNotificationMsg(`🗑️ Strategy Cleared for #${activeDriver.num} ${activeDriver.code}. Planned stops removed.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // ── 1-CLICK AI PRESETS ─────────────────────────────────────────────────────
  const handleLoadPreset = (presetType) => {
    f1Audio.playRadioBeep();
    if (presetType === "oneStop") {
      updatePlanField("stopsCount", 1);
      updatePlanField("stop1Lap", 24);
      updatePlanField("stop1SetId", "H1");
      setNotificationMsg(`📋 Loaded 1-Stop Baseline (Medium L1-24 → Hard L24-${totalLaps}). Adjust slider as desired!`);
    } else if (presetType === "twoStop") {
      updatePlanField("stopsCount", 2);
      updatePlanField("stop1Lap", 16);
      updatePlanField("stop1SetId", "M1");
      updatePlanField("stop2Lap", 38);
      updatePlanField("stop2SetId", "S1");
      setNotificationMsg(`📋 Loaded 2-Stop Attack (Soft L1-16 → Med L16-38 → Soft L38-${totalLaps})!`);
    } else if (presetType === "undercut") {
      const target = Math.min(totalLaps - 2, currentLap + 1);
      updatePlanField("stop1Lap", target);
      updatePlanField("stop1SetId", "H1");
      setNotificationMsg(`⚡ Loaded Undercut Gamble: Stop set to Lap ${target}. Click 'LOCK' or 'BOX NOW' to execute!`);
    }
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const driverFace = getDriverFaceUrl(activeDriver.code, activeDriver.photo_url || DRIVER_PHOTOS[activeDriver.code]);
  const driverTire = activeDriver.tire || "M";
  const driverTireAge = activeDriver.tireAge || 0;
  const driverWearPct = Math.round(activeDriver.wear != null ? activeDriver.wear : Math.min(95, driverTireAge * 3.5));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px 0 24px 0" }}>
      
      {/* ── TOAST NOTIFICATION BANNER ── */}
      {notificationMsg && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(0, 210, 190, 0.25) 0%, rgba(20, 26, 42, 0.98) 50%, rgba(0, 210, 190, 0.25) 100%)",
            border: "1.5px solid var(--neon-cyan)",
            borderRadius: "8px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 0 16px rgba(0, 210, 190, 0.35)",
            animation: "f1FadeIn 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>
            <span>📢</span>
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            style={{ all: "unset", cursor: "pointer", color: "var(--text-dim)", fontSize: "0.9rem", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── TOP COCKPIT BAR: CONSTRUCTOR, DRIVER TABS & TIMING JUMP ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(18, 24, 38, 0.98) 0%, rgba(10, 14, 22, 0.99) 100%)",
          border: `1.5px solid ${currentTeamObj.color || "var(--neon-cyan)"}66`,
          borderRadius: "12px",
          padding: "10px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 18px ${currentTeamObj.color || "var(--neon-cyan)"}22`,
        }}
      >
        {/* Left: Team Badge & Race Context */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: currentTeamObj.color, boxShadow: `0 0 10px ${currentTeamObj.color}` }} />
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{currentTeamObj.name.toUpperCase()} STRATEGY ROOM</span>
              <span style={{ fontSize: "0.58rem", background: "rgba(0,210,190,0.18)", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", padding: "1px 6px", borderRadius: "3px" }}>
                F1 STRATEGIST
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
              Round {selectedCircuit?.round || 1}: {circuitName} · Lap <strong style={{ color: "var(--neon-green)" }}>{currentLap}</strong> of {totalLaps} · Track: <span style={{ color: "var(--neon-green)" }}>GREEN</span>
            </div>
          </div>
        </div>

        {/* Center: Interactive Driver Switcher Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginRight: "2px" }}>
            SELECT CAR:
          </span>
          {teamDrivers.map((driver) => {
            const isSelected = driver.code === activeDriver.code;
            const dWear = Math.round(driver.wear != null ? driver.wear : 20);
            return (
              <button
                key={driver.code}
                onClick={() => {
                  f1Audio.playRadioBeep();
                  setActiveDriverCode(driver.code);
                }}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${currentTeamObj.color}35 0%, rgba(20,26,42,0.95) 100%)`
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isSelected ? currentTeamObj.color : "rgba(255,255,255,0.12)"}`,
                  borderRadius: "8px",
                  padding: "5px 12px",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: isSelected ? `0 0 14px ${currentTeamObj.color}50` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900" }}>
                  #{driver.num} {driver.code}
                </span>
                <span style={{ fontSize: "0.68rem", color: "var(--neon-cyan)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  P{driver.pos}
                </span>
                <span style={{ fontSize: "0.60rem", background: driver.tire === "S" ? "#FF1801" : driver.tire === "M" ? "#FFD700" : "#FFFFFF", color: driver.tire === "H" ? "#000" : "#fff", padding: "1px 5px", borderRadius: "3px", fontWeight: "900" }}>
                  {driver.tire || "M"}
                </span>
                <span style={{ fontSize: "0.64rem", color: dWear > 70 ? "var(--neon-red)" : "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                  {dWear}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Switch to Timing Matrix */}
        <button
          onClick={onGoToTiming}
          style={{
            background: "linear-gradient(135deg, rgba(232,0,45,0.25) 0%, rgba(20,24,38,0.95) 100%)",
            border: "1px solid var(--neon-red)",
            borderRadius: "6px",
            padding: "6px 12px",
            color: "#ffffff",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.70rem",
            fontWeight: "900",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 0 12px rgba(232,0,45,0.3)",
            transition: "all 0.15s ease",
          }}
          title="Return to Live Timing Tower"
        >
          <span>🏁</span>
          <span>LIVE TIMING MATRIX</span>
        </button>
      </div>

      {/* ── MAIN DUAL-PANEL COMMAND DECK ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px", alignItems: "start" }}>
        
        {/* ════════ LEFT COLUMN: STINT ARCHITECT & TACTICAL PIT ORDERS ════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* 1. Driver Profile & Live Tire Health Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 22, 36, 0.96) 0%, rgba(10, 14, 24, 0.98) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {/* Driver Identity & Face */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${currentTeamObj.color || "var(--neon-cyan)"}`,
                  background: "rgba(0,0,0,0.5)",
                  flexShrink: 0,
                }}
              >
                {driverFace ? (
                  <img src={driverFace} alt={activeDriver.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.2rem" }}>🏎️</span>
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

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>
                  <span>PITS COMPLETED: <strong style={{ color: "var(--neon-green)" }}>{activeDriver.pits || 0}</strong></span>
                  {isNoPitRequired ? (
                    <span style={{ background: "rgba(0, 230, 118, 0.18)", border: "1px solid var(--neon-green)", color: "var(--neon-green)", padding: "1px 6px", borderRadius: "3px", fontSize: "0.62rem", fontWeight: "900" }}>
                      🟢 NO PIT REQUIRED · SAFE TO FLAG
                    </span>
                  ) : isStop1Done ? (
                    <span style={{ background: "rgba(255, 215, 0, 0.15)", border: "1px solid #ffd700", color: "#ffd700", padding: "1px 6px", borderRadius: "3px", fontSize: "0.62rem", fontWeight: "800" }}>
                      🟡 2-COMPOUND RULE SATISFIED
                    </span>
                  ) : (
                    <span style={{ background: "rgba(232, 0, 45, 0.15)", border: "1px solid var(--neon-red)", color: "#ff8c99", padding: "1px 6px", borderRadius: "3px", fontSize: "0.62rem", fontWeight: "800" }}>
                      ⚠️ MANDATORY PIT STOP REQUIRED
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tire Capsule & Push Modes */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.72rem",
                    fontWeight: "900",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    background: driverTire === "S" ? "#FF1801" : driverTire === "M" ? "#FFD700" : driverTire === "H" ? "#FFFFFF" : "#00A0DE",
                    color: driverTire === "H" ? "#000000" : "#ffffff",
                  }}
                >
                  {driverTire} · LAP {driverTireAge}
                </span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: driverWearPct > 70 ? "var(--neon-red)" : driverWearPct > 50 ? "#ffaa00" : "var(--neon-green)" }}>
                  {driverWearPct}% WEAR
                </span>
              </div>

              {/* Push Mode Segmented Pill */}
              <div style={{ display: "flex", gap: "2px", background: "rgba(0,0,0,0.4)", padding: "2px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)" }}>
                {["attack", "balanced", "conserve"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updatePlanField("pushMode", mode)}
                    style={{
                      background: currentPlan.pushMode === mode
                        ? (mode === "attack" ? "var(--neon-red)" : mode === "conserve" ? "var(--neon-cyan)" : "var(--neon-green)")
                        : "transparent",
                      color: currentPlan.pushMode === mode ? "#0a0c14" : "var(--text-secondary)",
                      border: "none",
                      borderRadius: "3px",
                      padding: "2px 7px",
                      fontSize: "0.60rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      cursor: "pointer",
                      transition: "all 0.1s ease",
                    }}
                    title={`Set engine & tire deploy mode to ${mode}`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Visual Stint Timeline & Strategy Architecture */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
                  STRATEGY PLAN:
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => updatePlanField("stopsCount", 1)}
                    style={{
                      background: currentPlan.stopsCount === 1 ? "var(--neon-green)" : "rgba(255,255,255,0.05)",
                      color: currentPlan.stopsCount === 1 ? "#000" : "var(--text-secondary)",
                      border: `1px solid ${currentPlan.stopsCount === 1 ? "var(--neon-green)" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: "4px",
                      padding: "3px 9px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.66rem",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    1-STOP
                  </button>
                  <button
                    onClick={() => updatePlanField("stopsCount", 2)}
                    style={{
                      background: currentPlan.stopsCount === 2 ? "#ffd700" : "rgba(255,255,255,0.05)",
                      color: currentPlan.stopsCount === 2 ? "#000" : "var(--text-secondary)",
                      border: `1px solid ${currentPlan.stopsCount === 2 ? "#ffd700" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: "4px",
                      padding: "3px 9px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.66rem",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    2-STOP ATTACK
                  </button>
                </div>
              </div>
              <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                RACE DISTANCE: 58 LAPS
              </span>
            </div>

            {/* Visual Stint Bar */}
            <div style={{ display: "flex", height: "22px", borderRadius: "5px", overflow: "hidden", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", position: "relative" }}>
              {/* Stint 1 */}
              <div
                style={{
                  width: `${Math.round((currentPlan.stop1Lap / totalLaps) * 100)}%`,
                  background: driverTire === "S" ? "#FF1801" : driverTire === "H" ? "#FFFFFF" : "#FFD700",
                  color: driverTire === "H" ? "#000000" : "#ffffff",
                  fontSize: "0.60rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "900",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                STINT 1: {driverTire} (L1-{currentPlan.stop1Lap})
              </div>
              
              <div style={{ width: "3px", background: "var(--neon-red)" }} title={`Box Stop 1 at Lap ${currentPlan.stop1Lap}`} />

              {/* Stint 2 (or Stint 2 + 3 if 2-stop) */}
              {currentPlan.stopsCount === 1 ? (
                <div
                  style={{
                    width: `${100 - Math.round((currentPlan.stop1Lap / totalLaps) * 100)}%`,
                    background: selectedStop1Set.compound === "S" ? "#FF1801" : selectedStop1Set.compound === "H" ? "#FFFFFF" : "#FFD700",
                    color: selectedStop1Set.compound === "H" ? "#000000" : "#ffffff",
                    fontSize: "0.60rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  STINT 2: {selectedStop1Set.compound} (L{currentPlan.stop1Lap + 1}-{totalLaps})
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: `${Math.round(((currentPlan.stop2Lap - currentPlan.stop1Lap) / totalLaps) * 100)}%`,
                      background: selectedStop1Set.compound === "S" ? "#FF1801" : selectedStop1Set.compound === "H" ? "#FFFFFF" : "#FFD700",
                      color: selectedStop1Set.compound === "H" ? "#000000" : "#ffffff",
                      fontSize: "0.60rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    STINT 2: {selectedStop1Set.compound} (L{currentPlan.stop1Lap + 1}-{currentPlan.stop2Lap})
                  </div>
                  <div style={{ width: "3px", background: "var(--neon-red)" }} title={`Box Stop 2 at Lap ${currentPlan.stop2Lap}`} />
                  <div
                    style={{
                      width: `${100 - Math.round((currentPlan.stop2Lap / totalLaps) * 100)}%`,
                      background: selectedStop2Set.compound === "S" ? "#FF1801" : selectedStop2Set.compound === "H" ? "#FFFFFF" : "#FFD700",
                      color: selectedStop2Set.compound === "H" ? "#000000" : "#ffffff",
                      fontSize: "0.60rem",
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: "900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    STINT 3: {selectedStop2Set.compound} (L{currentPlan.stop2Lap + 1}-{totalLaps})
                  </div>
                </>
              )}

              {/* Current Lap Progress Line */}
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
                title={`Current Lap: ${currentLap}`}
              />
            </div>
          </div>

          {/* 3. Direct Pit Stop Control Rows */}
          {/* STOP 1 ROW */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {isStop1Done ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.1rem" }}>✅</span>
                  <div>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "var(--neon-green)" }}>
                      STOP 1 COMPLETED AT LAP {activeDriver?.lastPitLap || currentPlan.stop1Lap} ({activeDriver?.tire || "H"})
                    </span>
                    <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
                      Mandatory compound rule fulfilled · Stint safe to chequered flag
                    </div>
                  </div>
                </div>

                {currentPlan.stopsCount === 1 && (
                  <button
                    onClick={() => updatePlanField("stopsCount", 2)}
                    style={{
                      background: "rgba(255, 215, 0, 0.18)",
                      border: "1px solid #ffd700",
                      color: "#ffd700",
                      borderRadius: "4px",
                      padding: "4px 10px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.66rem",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    + PLAN STOP 2
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                  🛑 PIT STOP 1:
                </span>

                {/* Slider + Lap Box */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>LAP:</span>
                  <input
                    type="range"
                    min="1"
                    max={totalLaps}
                    value={currentPlan.stop1Lap}
                    onChange={(e) => updatePlanField("stop1Lap", parseInt(e.target.value) || 1)}
                    style={{ width: "130px", cursor: "pointer", accentColor: "var(--neon-cyan)" }}
                  />
                  <input
                    type="number"
                    min="1"
                    max={totalLaps}
                    value={currentPlan.stop1Lap}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) updatePlanField("stop1Lap", Math.max(1, Math.min(totalLaps, val)));
                    }}
                    style={{
                      width: "44px",
                      background: "#101420",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "4px",
                      color: "#ffffff",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.74rem",
                      fontWeight: "900",
                      textAlign: "center",
                      padding: "2px",
                    }}
                  />
                </div>

                {/* Compound Selection Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>FIT:</span>
                  {["S1", "M1", "H1", "I1"].map((setId) => {
                    const s = DEFAULT_TIRE_SETS.find((t) => t.id === setId);
                    const isChosen = currentPlan.stop1SetId === setId;
                    return (
                      <button
                        key={setId}
                        onClick={() => updatePlanField("stop1SetId", setId)}
                        style={{
                          background: isChosen
                            ? (s.compound === "S" ? "#FF1801" : s.compound === "M" ? "#FFD700" : s.compound === "H" ? "#FFFFFF" : "#39B54A")
                            : "rgba(255,255,255,0.05)",
                          color: isChosen ? (s.compound === "H" ? "#000" : "#fff") : "var(--text-secondary)",
                          border: `1px solid ${isChosen ? "#ffffff" : "rgba(255,255,255,0.12)"}`,
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.68rem",
                          fontWeight: "900",
                          cursor: "pointer",
                        }}
                        title={s.label}
                      >
                        {s.compound}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* STOP 2 ROW (if 2-stop) */}
          {currentPlan.stopsCount === 2 && (
            <div
              style={{
                background: "rgba(16, 20, 32, 0.92)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: "#ffd700" }}>
                🛑 PIT STOP 2:
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>LAP:</span>
                <input
                  type="range"
                  min={currentPlan.stop1Lap + 1}
                  max={totalLaps}
                  value={currentPlan.stop2Lap}
                  onChange={(e) => updatePlanField("stop2Lap", parseInt(e.target.value) || currentPlan.stop1Lap + 1)}
                  style={{ width: "130px", cursor: "pointer", accentColor: "#ffd700" }}
                />
                <input
                  type="number"
                  min={currentPlan.stop1Lap + 1}
                  max={totalLaps}
                  value={currentPlan.stop2Lap}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) updatePlanField("stop2Lap", Math.max(currentPlan.stop1Lap + 1, Math.min(totalLaps, val)));
                  }}
                  style={{
                    width: "44px",
                    background: "#101420",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.74rem",
                    fontWeight: "900",
                    textAlign: "center",
                    padding: "2px",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>FIT:</span>
                {["S2", "M1", "H1", "S1"].map((setId) => {
                  const s = DEFAULT_TIRE_SETS.find((t) => t.id === setId);
                  const isChosen = currentPlan.stop2SetId === setId;
                  return (
                    <button
                      key={setId}
                      onClick={() => updatePlanField("stop2SetId", setId)}
                      style={{
                        background: isChosen
                          ? (s.compound === "S" ? "#FF1801" : s.compound === "M" ? "#FFD700" : "#FFFFFF")
                          : "rgba(255,255,255,0.05)",
                        color: isChosen ? (s.compound === "H" ? "#000" : "#fff") : "var(--text-secondary)",
                        border: `1px solid ${isChosen ? "#ffffff" : "rgba(255,255,255,0.12)"}`,
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.68rem",
                        fontWeight: "900",
                        cursor: "pointer",
                      }}
                      title={s.label}
                    >
                      {s.compound}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Action Command Bar: Lock Plan & Instant Tactical Box */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(18, 24, 38, 0.98) 0%, rgba(12, 16, 26, 0.99) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {/* Left: Lock Strategy & Clear */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handleLockStrategy}
                style={{
                  background: "linear-gradient(135deg, rgba(0, 210, 190, 0.95) 0%, rgba(0, 140, 130, 0.98) 100%)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#0a0c14",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.74rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 0 14px rgba(0, 210, 190, 0.4)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title="Lock this strategy into the timing matrix for your driver"
              >
                <span>🔒</span>
                <span>LOCK & APPLY STRATEGY</span>
              </button>

              <button
                onClick={handleClearStrategy}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "var(--text-secondary)",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
                title="Cancel planned stops (Car will stay out)"
              >
                <span>🗑️ STAY OUT</span>
              </button>
            </div>

            {/* Right: Instant Box Button */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={instantBoxSetId}
                onChange={(e) => setInstantBoxSetId(e.target.value)}
                style={{
                  background: "#101420",
                  color: selectedInstantSet.compound === "S" ? "#FF1801" : selectedInstantSet.compound === "H" ? "#FFFFFF" : "#FFD700",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "5px 8px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "900",
                }}
              >
                {DEFAULT_TIRE_SETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleInstantBoxNow}
                style={{
                  background: isNoPitRequired
                    ? "linear-gradient(135deg, rgba(0, 180, 100, 0.9) 0%, rgba(0, 120, 60, 0.95) 100%)"
                    : "linear-gradient(135deg, var(--neon-red) 0%, #99001a 100%)",
                  border: `1.5px solid ${isNoPitRequired ? "var(--neon-green)" : "#ff4d6d"}`,
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#ffffff",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isNoPitRequired ? "0 0 14px rgba(0,230,118,0.4)" : "0 0 16px rgba(232,0,45,0.6)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                title={isNoPitRequired ? "Car does not require another stop, but you can box voluntarily anytime" : "Call car into pits this lap right now"}
              >
                <span>📻</span>
                <span>{isNoPitRequired ? `BOX THIS LAP · OPTIONAL` : `BOX THIS LAP NOW`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: TACTICAL RE-ENTRY RADAR & INTELLIGENCE ════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* 1. Live Re-Entry Radar Board */}
          {simulatedReentry && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(14, 20, 32, 0.98) 0%, rgba(8, 12, 20, 0.99) 100%)",
                border: "1.5px solid rgba(0, 210, 190, 0.4)",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 0 20px rgba(0, 210, 190, 0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: "var(--neon-cyan)" }}>
                  🎯 PIT RE-ENTRY RADAR (LAP {simulatedReentry.pitLap}):
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "'Orbitron', monospace",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    fontWeight: "900",
                    background: simulatedReentry.traffic === "DIRTY_AIR" ? "rgba(232,0,45,0.2)" : "rgba(0,230,118,0.2)",
                    color: simulatedReentry.traffic === "DIRTY_AIR" ? "var(--neon-red)" : "var(--neon-green)",
                    border: `1px solid ${simulatedReentry.traffic === "DIRTY_AIR" ? "var(--neon-red)" : "var(--neon-green)"}`,
                  }}
                >
                  {simulatedReentry.traffic === "DIRTY_AIR" ? "🔴 TRAFFIC DANGER" : "🟢 CLEAN AIR"}
                </span>
              </div>

              {/* Graphic Re-entry Visualizer */}
              <div
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(0,210,190,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Ahead */}
                <div style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace" }}>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>CAR AHEAD:</div>
                  {simulatedReentry.carAhead ? (
                    <span style={{ color: "#ffffff", fontWeight: "800" }}>
                      P{simulatedReentry.carAhead.initialPos} {simulatedReentry.carAhead.code} <strong style={{ color: "var(--neon-cyan)" }}>({simulatedReentry.gapAhead > 0 ? `+${simulatedReentry.gapAhead}s` : "0.0s"})</strong>
                    </span>
                  ) : (
                    <span style={{ color: "var(--neon-green)" }}>LEADER / CLEAR</span>
                  )}
                </div>

                {/* Rejoin Badge */}
                <div
                  style={{
                    background: "rgba(0, 210, 190, 0.2)",
                    border: "1.5px solid var(--neon-cyan)",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    color: "#ffffff",
                    boxShadow: "0 0 14px rgba(0,210,190,0.35)",
                    textAlign: "center",
                  }}
                >
                  REJOINS P{simulatedReentry.reEntryPos}
                </div>

                {/* Behind */}
                <div style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", textAlign: "right" }}>
                  <div style={{ color: "var(--text-dim)", fontSize: "0.58rem" }}>CAR BEHIND:</div>
                  {simulatedReentry.carBehind ? (
                    <span style={{ color: "#ffffff", fontWeight: "800" }}>
                      P{simulatedReentry.carBehind.initialPos} {simulatedReentry.carBehind.code} <strong style={{ color: "#ffd700" }}>(-{simulatedReentry.gapBehind}s)</strong>
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-dim)" }}>CLEAR TRACK</span>
                  )}
                </div>
              </div>

              {/* Assessment Subtitles */}
              <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                {simulatedReentry.trafficDesc}
              </div>
              <div style={{ fontSize: "0.66rem", color: simulatedReentry.stintHealth === "CRITICAL" ? "var(--neon-red)" : "var(--neon-green)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "700" }}>
                {simulatedReentry.stintWarning}
              </div>
            </div>
          )}

          {/* 2. 1-Click AI Strategy Blueprints */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
              🤖 1-CLICK AI BLUEPRINTS (LOAD & EDIT)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button
                onClick={() => handleLoadPreset("oneStop")}
                style={{
                  background: "rgba(0, 204, 68, 0.12)",
                  border: "1px solid var(--neon-green)",
                  borderRadius: "6px",
                  padding: "8px 6px",
                  color: "#ffffff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 204, 68, 0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 204, 68, 0.12)")}
              >
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "var(--neon-green)" }}>⚡ 1-STOP</div>
                <div style={{ fontSize: "0.60rem", color: "var(--text-secondary)", marginTop: "2px" }}>Med ➔ Hard</div>
              </button>

              <button
                onClick={() => handleLoadPreset("twoStop")}
                style={{
                  background: "rgba(255, 215, 0, 0.12)",
                  border: "1px solid #ffd700",
                  borderRadius: "6px",
                  padding: "8px 6px",
                  color: "#ffffff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 215, 0, 0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 215, 0, 0.12)")}
              >
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffd700" }}>🔥 2-STOP</div>
                <div style={{ fontSize: "0.60rem", color: "var(--text-secondary)", marginTop: "2px" }}>Soft ➔ Med ➔ Soft</div>
              </button>

              <button
                onClick={() => handleLoadPreset("undercut")}
                style={{
                  background: "rgba(0, 210, 190, 0.12)",
                  border: "1px solid var(--neon-cyan)",
                  borderRadius: "6px",
                  padding: "8px 6px",
                  color: "#ffffff",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 210, 190, 0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 210, 190, 0.12)")}
              >
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "var(--neon-cyan)" }}>🎲 UNDERCUT</div>
                <div style={{ fontSize: "0.60rem", color: "var(--text-secondary)", marginTop: "2px" }}>Box Next Lap</div>
              </button>
            </div>
          </div>

          {/* 3. Available Pirelli Tire Allocation Rack */}
          <div
            style={{
              background: "rgba(16, 20, 32, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
                🏎️ TIRE ALLOCATION & LIFE
              </span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                PIT TRANSIT: {pitLossDuration.toFixed(1)}s
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {DEFAULT_TIRE_SETS.slice(0, 6).map((tSet) => (
                <div key={tSet.id} style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "5px", padding: "6px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.64rem", fontWeight: "900", color: tSet.compound === "S" ? "#FF1801" : tSet.compound === "M" ? "#FFD700" : tSet.compound === "H" ? "#FFFFFF" : "#39B54A" }}>
                      {tSet.compound} · {tSet.condition}
                    </span>
                    <span style={{ fontSize: "0.62rem", color: tSet.lifePct > 90 ? "var(--neon-green)" : "#ffd700", fontWeight: "900" }}>
                      {tSet.lifePct}%
                    </span>
                  </div>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tSet.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTH DRIVERS SIDE-BY-SIDE TACTICAL SUMMARY FOOTER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(16, 22, 36, 0.95) 0%, rgba(10, 14, 24, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "10px",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1rem" }}>🏁</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
            TEAM TACTICAL STATUS:
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {teamDrivers.map((d) => {
            const p = driverPlans[d.code] || { stopsCount: 1, stop1Lap: 24, stop1SetId: "H1" };
            const set = DEFAULT_TIRE_SETS.find((s) => s.id === p.stop1SetId) || DEFAULT_TIRE_SETS[4];
            return (
              <div key={d.code} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}>
                <span style={{ color: "#ffffff", fontWeight: "900" }}>#{d.num} {d.code} (P{d.pos}):</span>
                <span style={{ color: (d.pits || 0) >= 1 ? "var(--neon-green)" : "var(--neon-cyan)" }}>
                  {(d.pits || 0) >= 1 ? `Pitted (Stop Completed) · Run to Flag 🟢` : `Planned Stop: Lap ${p.stop1Lap} (${set.label})`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
