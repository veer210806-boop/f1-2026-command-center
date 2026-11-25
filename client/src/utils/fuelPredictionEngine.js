// ============================================================
// fuelPredictionEngine.js — FIA 2026 Automated Bio-Fuel Strategy Engine
// Pre-calculated, ECU-regulated 100% Sustainable Bio-Fuel prediction engine.
// Fully automated (zero manual fuel mixing or in-race refuelling under FIA Art. 29).
// ============================================================

const FIA_MANDATORY_SAMPLE_KG = 1.0;
const MASS_LAP_PENALTY_SEC_PER_KG = 0.034;

export const TEAM_FUEL_SPECS = {
  mclaren: {
    partner: "bp / Castrol 100% Sustainable Blend",
    pu: "Mercedes-AMG M17 Works Spec",
    flowEfficiency: 0.986,
    color: "#FF8700",
  },
  ferrari: {
    partner: "Shell 100% Sustainable Bio-E-Fuel",
    pu: "Scuderia Ferrari 067/1 E-Turbo",
    flowEfficiency: 0.992,
    color: "#E8002D",
  },
  "red bull racing": {
    partner: "ExxonMobil Synergy Bio-Race Fuel",
    pu: "Red Bull Ford Powertrains DM01",
    flowEfficiency: 0.988,
    color: "#3671E8",
  },
  mercedes: {
    partner: "PETRONAS Syntium Sustainable Fuel",
    pu: "Mercedes-AMG HPP Works 2026",
    flowEfficiency: 0.990,
    color: "#00D2BE",
  },
  "aston martin": {
    partner: "Aramco 100% Synthetic E-Fuel",
    pu: "Honda RA626H Works Hybrid",
    flowEfficiency: 0.983,
    color: "#229971",
  },
  williams: {
    partner: "Gulf Oil Sustainable Bio-Blend",
    pu: "Mercedes-AMG Customer Spec",
    flowEfficiency: 0.978,
    color: "#00A0DE",
  },
  alpine: {
    partner: "bp 100% Sustainable Racing Fuel",
    pu: "Mercedes-AMG Customer Spec",
    flowEfficiency: 0.976,
    color: "#0090FF",
  },
  haas: {
    partner: "Shell 100% Sustainable Bio-E-Fuel",
    pu: "Ferrari 067/1 Customer Spec",
    flowEfficiency: 0.977,
    color: "#B6BABD",
  },
  "racing bulls": {
    partner: "ExxonMobil Sustainable Racing Blend",
    pu: "Red Bull Ford Customer PU",
    flowEfficiency: 0.975,
    color: "#6692FF",
  },
  audi: {
    partner: "bp 100% Sustainable E-Fuel",
    pu: "Audi Works Powertrain Neuburg",
    flowEfficiency: 0.980,
    color: "#E50027",
  },
  cadillac: {
    partner: "Sunoco / Shell Sustainable Blend",
    pu: "Ferrari 067/1 Cadillac Spec",
    flowEfficiency: 0.973,
    color: "#FFC72C",
  },
};

const CIRCUIT_FUEL_INTENSITY_KG_PER_KM = {
  monza: 0.276,
  saudi_arabia: 0.272,
  belgium: 0.268,
  las_vegas: 0.269,
  azerbaijan: 0.264,
  bahrain: 0.262,
  canada: 0.258,
  china: 0.256,
  austria: 0.259,
  great_britain: 0.255,
  japan: 0.252,
  australia: 0.248,
  miami: 0.249,
  emilia_romagna: 0.247,
  spain: 0.246,
  qatar: 0.254,
  abu_dhabi: 0.245,
  brazil: 0.244,
  united_states: 0.246,
  mexico: 0.244,
  netherlands: 0.246,
  hungary: 0.252,
  singapore: 0.254,
  monaco: 0.262,
  madrid: 0.248,
};

export function resolveTeamFuelSpec(teamName = "Ferrari") {
  const norm = String(teamName || "Ferrari").trim().toLowerCase();
  if (norm.includes("racing bulls") || norm === "rb") return TEAM_FUEL_SPECS["racing bulls"];
  if (norm.includes("red bull")) return TEAM_FUEL_SPECS["red bull racing"];
  if (norm.includes("sauber") || norm.includes("audi")) return TEAM_FUEL_SPECS.audi;
  if (norm.includes("aston")) return TEAM_FUEL_SPECS["aston martin"];
  for (const [key, spec] of Object.entries(TEAM_FUEL_SPECS)) {
    if (norm.includes(key) || key.includes(norm)) return spec;
  }
  return TEAM_FUEL_SPECS.ferrari;
}

/**
 * Deterministic ECU fuel burn and finish-line surplus prediction for a car/circuit.
 * Read-only engineering telemetry: FIA rules prohibit mid-race refuelling and manual mixture dials.
 */
export function calculateAutoFuelPrediction({
  circuit,
  driver,
  teamName,
  currentLap = 1,
  maxLaps,
  activeFlag = "GREEN",
  pushMode = "balanced",
}) {
  const totalLaps = Math.max(10, Number(circuit?.laps || maxLaps || 58));
  const clampedLap = Math.max(1, Math.min(totalLaps, Number(currentLap || 1)));
  const completedLaps = Math.max(0, clampedLap - 1);
  const lapsRemaining = Math.max(0, totalLaps - completedLaps);

  const spec = resolveTeamFuelSpec(driver?.team || teamName);
  const circuitId = String(circuit?.circuit_id || "australia").toLowerCase();
  const lengthKm = Number(circuit?.length_km || 5.278);

  const intensityKgPerKm = CIRCUIT_FUEL_INTENSITY_KG_PER_KM[circuitId] || 0.248;
  // Slight deterministic variance per car number (telemetry sensor calibration offset <= 1.2%)
  const carNum = Number(driver?.num || 16);
  const driverThrottleHabit = 0.992 + ((carNum % 7) * 0.0028);

  // Base target burn per lap under nominal green race conditions (kg/lap)
  const targetBurnPerLapKg = +((lengthKm * intensityKgPerKm * driverThrottleHabit) / spec.flowEfficiency).toFixed(3);

  // FIA 2026 pre-calibrated starting load: nominal race need + 1.0 kg sample + ECU strategic reserve
  const nominalRaceNeedKg = targetBurnPerLapKg * totalLaps;
  const strategicBufferKg = +(0.65 + ((carNum % 5) * 0.14)).toFixed(2);
  const startLoadKg = +(Math.min(89.5, nominalRaceNeedKg + FIA_MANDATORY_SAMPLE_KG + strategicBufferKg)).toFixed(1);

  // Determine live ECU automatic fuel regulation state based on track status & driver pace state
  const normalizedFlag = String(activeFlag || "GREEN").toUpperCase();
  let flagBurnMult = 1.0;
  let ecuModeLabel = "AUTO · TARGET FLOW";
  let ecuModeColor = "#00d2be";
  let ecuModeDetail = "AI Race ECU balancing ICE burn & 350kW MGU-K harvest";

  if (normalizedFlag === "SC") {
    flagBurnMult = 0.58;
    ecuModeLabel = "AUTO · SC HARVEST SAVE";
    ecuModeColor = "#00e676";
    ecuModeDetail = "Safety Car active — ECU automatically cutting ICE fuel injection by 42%";
  } else if (normalizedFlag === "VSC") {
    flagBurnMult = 0.72;
    ecuModeLabel = "AUTO · VSC DELTA SAVE";
    ecuModeColor = "#00e676";
    ecuModeDetail = "Virtual Safety Car — ECU locked to positive delta fuel-save map";
  } else if (normalizedFlag === "RED") {
    flagBurnMult = 0.08;
    ecuModeLabel = "AUTO · RED FLAG IDLE";
    ecuModeColor = "#ff3b30";
    ecuModeDetail = "Session suspended — zero propulsion fuel flow";
  } else if (pushMode === "conserve") {
    flagBurnMult = 0.94;
    ecuModeLabel = "AUTO · LIFT & COAST";
    ecuModeColor = "#00d2be";
    ecuModeDetail = "Extended coasting phase triggers automatic fuel regeneration";
  } else if (pushMode === "attack" && strategicBufferKg > 0.8) {
    flagBurnMult = 1.025;
    ecuModeLabel = "AUTO · SURPLUS TRIM";
    ecuModeColor = "#ffd700";
    ecuModeDetail = "ECU utilizing healthy surplus margin without manual intervention";
  }

  // Historical cumulative fuel consumed is monotonic across completed laps (tank cannot un-burn)
  const completedBurnFactor =
    pushMode === "conserve" ? 0.978 : pushMode === "attack" ? 1.008 : 0.994;

  const burnedKg = +(Math.min(startLoadKg - FIA_MANDATORY_SAMPLE_KG, completedLaps * targetBurnPerLapKg * completedBurnFactor)).toFixed(1);
  const liveBurnPerLapKg = +(targetBurnPerLapKg * flagBurnMult).toFixed(2);
  const remainingKg = +(Math.max(FIA_MANDATORY_SAMPLE_KG, startLoadKg - burnedKg)).toFixed(1);
  const usableRemainingKg = +(Math.max(0, remainingKg - FIA_MANDATORY_SAMPLE_KG)).toFixed(1);
  const remainingPct = Math.max(0, Math.min(100, Math.round((remainingKg / startLoadKg) * 100)));

  // Projected need for remaining laps (SC/VSC window yields realistic 2-3 laps of ECU fuel harvest)
  const expectedNeutralizedLaps =
    normalizedFlag === "SC"
      ? Math.min(lapsRemaining, 3)
      : normalizedFlag === "VSC"
        ? Math.min(lapsRemaining, 2)
        : normalizedFlag === "RED"
          ? Math.min(lapsRemaining, 1)
          : 0;
  const greenLapsRemaining = Math.max(0, lapsRemaining - expectedNeutralizedLaps);
  const effectiveRemainingNeedKg =
    lapsRemaining > 0
      ? targetBurnPerLapKg * (greenLapsRemaining * (pushMode === "conserve" ? 0.975 : 1.0) + expectedNeutralizedLaps * flagBurnMult)
      : 0;

  const predictedMarginKg = +(usableRemainingKg - effectiveRemainingNeedKg).toFixed(2);
  const predictedDeltaLaps = +(predictedMarginKg / Math.max(0.5, targetBurnPerLapKg)).toFixed(2);

  // Fuel weight effect on lap time (~0.034s/lap per 1.0 kg carried)
  const startMassPenaltySec = +(startLoadKg * MASS_LAP_PENALTY_SEC_PER_KG).toFixed(2);
  const currentMassPenaltySec = +(remainingKg * MASS_LAP_PENALTY_SEC_PER_KG).toFixed(2);
  const weightGainSoFarSec = +(burnedKg * MASS_LAP_PENALTY_SEC_PER_KG).toFixed(2); // positive magnitude gained (displayed as -X.XXs)
  const remainingMassGainToFlagSec = +((usableRemainingKg) * MASS_LAP_PENALTY_SEC_PER_KG).toFixed(2);

  let statusLevel = "OPTIMAL";
  let statusColor = "#00d2be";
  let statusBadge = "TARGET OPTIMAL";
  if (predictedDeltaLaps >= 0.45) {
    statusLevel = "SURPLUS";
    statusColor = "#00e676";
    statusBadge = `+${predictedDeltaLaps.toFixed(2)} LAPS SURPLUS`;
  } else if (predictedDeltaLaps >= 0.05) {
    statusLevel = "OPTIMAL";
    statusColor = "#00d2be";
    statusBadge = `+${predictedDeltaLaps.toFixed(2)} LAPS ON TARGET`;
  } else {
    statusLevel = "CRITICAL";
    statusColor = "#ffaa00";
    statusBadge = `${predictedDeltaLaps.toFixed(2)}L · ECU AUTO-SAVING`;
  }

  // Generate 15 smooth checkpoints across [Lap 1 .. totalLaps] for the SVG Fuel Prediction Curve
  const checkpointSet = new Set([1, clampedLap, totalLaps]);
  const step = Math.max(1, Math.floor((totalLaps - 1) / 11));
  for (let l = 1; l <= totalLaps; l += step) checkpointSet.add(l);
  const sortedLaps = Array.from(checkpointSet).sort((a, b) => a - b);

  const endPredictedTotalKg = +(Math.max(FIA_MANDATORY_SAMPLE_KG + 0.15, FIA_MANDATORY_SAMPLE_KG + predictedMarginKg)).toFixed(2);
  const trajectory = sortedLaps.map((lap) => {
    const progress = (lap - 1) / Math.max(1, totalLaps - 1);
    const optimalLinearKg = +(startLoadKg - (startLoadKg - FIA_MANDATORY_SAMPLE_KG) * progress).toFixed(2);

    let predictedKg;
    if (lap <= clampedLap) {
      const elapsedRatio = completedLaps > 0 ? (lap - 1) / completedLaps : 0;
      predictedKg = +(startLoadKg - (startLoadKg - remainingKg) * elapsedRatio).toFixed(2);
    } else {
      const remSpan = Math.max(1, totalLaps - clampedLap);
      const remRatio = (lap - clampedLap) / remSpan;
      predictedKg = +(remainingKg - (remainingKg - endPredictedTotalKg) * remRatio).toFixed(2);
    }

    return {
      lap,
      predictedKg: Math.max(FIA_MANDATORY_SAMPLE_KG, predictedKg),
      optimalLinearKg: Math.max(FIA_MANDATORY_SAMPLE_KG, optimalLinearKg),
      fiaFloorKg: FIA_MANDATORY_SAMPLE_KG,
      isCurrent: lap === clampedLap,
    };
  });

  return {
    fuelPartner: spec.partner,
    powerUnit: spec.pu,
    teamColor: spec.color,
    startLoadKg,
    fiaReserveKg: FIA_MANDATORY_SAMPLE_KG,
    burnedKg,
    remainingKg,
    usableRemainingKg,
    remainingPct,
    targetBurnPerLapKg: +targetBurnPerLapKg.toFixed(2),
    liveBurnPerLapKg,
    predictedMarginKg,
    predictedDeltaLaps,
    ecuModeLabel,
    ecuModeColor,
    ecuModeDetail,
    startMassPenaltySec,
    currentMassPenaltySec,
    weightGainSoFarSec,
    remainingMassGainToFlagSec,
    statusLevel,
    statusColor,
    statusBadge,
    trajectory,
    totalLaps,
    currentLap: clampedLap,
    lapsRemaining,
  };
}
