// ============================================================
// raceSimEngine.js — Clear, Deterministic F1 Physics & Race Simulation Engine
// Models compound grip delta, non-linear tire cliff degradation, fuel burn
// mass gain, track dampness mismatch penalties, and real catch-up probability.
// ============================================================

export const COMPOUND_PHYSICS = {
  S: { name: "Soft",         paceDelta: -0.35, baseWearPerLap: 4.5, cliffStartWear: 68, cliffPenaltyPerPct: 0.09 },
  M: { name: "Medium",       paceDelta:  0.00, baseWearPerLap: 2.8, cliffStartWear: 72, cliffPenaltyPerPct: 0.08 },
  H: { name: "Hard",         paceDelta:  0.28, baseWearPerLap: 1.8, cliffStartWear: 76, cliffPenaltyPerPct: 0.065 },
  I: { name: "Intermediate", paceDelta:  1.15, baseWearPerLap: 2.9, cliffStartWear: 74, cliffPenaltyPerPct: 0.075 },
  W: { name: "Full Wet",     paceDelta:  2.40, baseWearPerLap: 2.4, cliffStartWear: 78, cliffPenaltyPerPct: 0.06 },
};

const TIER1_DRIVERS = new Set(["NOR", "VER", "RUS", "LEC", "HAM", "PIA"]);
const TIER2_DRIVERS = new Set(["ALO", "SAI", "ALB", "ANT", "HAD", "PER"]);

/**
 * Deterministic pseudo-random noise in [-1, 1] so results vary smoothly across laps/cars
 * without uncontrollable flicker.
 */
export function seededUnitNoise(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Formats seconds (e.g., 78.432) into F1 timing format "1:18.432".
 */
export function formatLapTimeSec(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "—";
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

/**
 * Parses "+4.210s" or "1:18.432" cleanly into numeric seconds.
 */
export function parseTimeToSeconds(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (!val || val === "LEADER" || val === "—" || val === "NO TIME") return 0;
  const clean = String(val).replace("+", "").replace("s", "").trim();
  if (clean.includes(":")) {
    const [m, s] = clean.split(":");
    const parsed = parseFloat(m) * 60 + parseFloat(s);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = parseFloat(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Computes tire degradation + track wetness mismatch penalty for a lap (seconds).
 */
export function calculateTireDegradationDelta(tireCode = "M", wearPct = 20, trackDampness = 0) {
  const code = String(tireCode).trim().toUpperCase()[0] || "M";
  const spec = COMPOUND_PHYSICS[code] || COMPOUND_PHYSICS.M;
  const isSlick = code === "S" || code === "M" || code === "H";
  const isWet = code === "I" || code === "W";

  const linearLoss = Math.max(0, (wearPct - 20) * 0.009);
  const cliffExcess = Math.max(0, wearPct - spec.cliffStartWear);
  const cliffPenalty = cliffExcess * spec.cliffPenaltyPerPct;

  let weatherPenalty = 0;
  if (isSlick && trackDampness > 30) {
    weatherPenalty = (trackDampness - 30) * 0.095; // losing massive grip on slicks in rain
  } else if (isWet && trackDampness < 20) {
    weatherPenalty = 1.6; // overheating wet tread on dry track
  } else if (code === "S" && trackDampness >= 15 && trackDampness <= 30) {
    weatherPenalty = 0.25;
  }

  // Compound speed offset adjusts on wet track (inters/wets excel when dampness rises)
  let effectiveCompoundDelta = spec.paceDelta;
  if (trackDampness > 35 && isWet) {
    effectiveCompoundDelta = trackDampness > 65 && code === "W" ? -0.4 : -0.25;
  }

  return +(effectiveCompoundDelta + linearLoss + cliffPenalty + weatherPenalty).toFixed(3);
}

/**
 * Progressive pace gain as bio-fuel load burns down across race distance.
 */
export function calculateFuelBurnBonus(currentLap = 1, totalLaps = 58) {
  const safeTotal = Math.max(10, totalLaps);
  const progress = Math.min(1, Math.max(0, (currentLap - 1) / safeTotal));
  return +(-progress * 1.75).toFixed(3);
}

/**
 * Computes real physics-based Catch Curve & Overtake Probability between P1 & P2 (or ahead/chaser).
 */
export function computeCatchAndProbability({ leader, chaser, currentLap = 1, maxLaps = 58, trackDampness = 0 }) {
  const safeLeader = leader || { code: "VER", wear: 4, tire: "M", lastLap: "1:20.000", gapSec: 0 };
  const safeChaser = chaser || { code: "NOR", wear: 8, tire: "M", lastLap: "1:20.200", gapSec: 0.85 };

  const leaderWear = Number(safeLeader.wear ?? 10);
  const chaserWear = Number(safeChaser.wear ?? 10);
  const wearAdvantage = Math.round(leaderWear - chaserWear); // +ve means chaser has fresher tires

  const gapSec = Math.max(0.05, Number(safeChaser.gapSec || 0) - Number(safeLeader.gapSec || 0));
  const leaderLapSec = parseTimeToSeconds(safeLeader.lastLap);
  const chaserLapSec = parseTimeToSeconds(safeChaser.lastLap);

  // Instantaneous pace delta (negative = chaser faster per lap)
  const measuredPaceAdvantage = leaderLapSec > 0 && chaserLapSec > 0
    ? leaderLapSec - chaserLapSec
    : (wearAdvantage * 0.025);

  const closurePerLap = measuredPaceAdvantage > 0.03 ? measuredPaceAdvantage : Math.max(0.05, wearAdvantage * 0.02);
  const remainingLaps = Math.max(1, (maxLaps || 58) - (currentLap || 1));

  let estLapsToCatch = Math.ceil(gapSec / closurePerLap);
  let catchCurve;
  if (currentLap <= 1) {
    catchCurve = `GRID LAUNCH · GAP ${gapSec.toFixed(2)}s`;
  } else if (gapSec < 0.9) {
    catchCurve = `IN DRS WINDOW (+${gapSec.toFixed(3)}s)`;
  } else if (measuredPaceAdvantage <= 0.01 && wearAdvantage <= 0) {
    catchCurve = `HOLDING GAP (+${gapSec.toFixed(2)}s)`;
  } else if (estLapsToCatch > remainingLaps) {
    catchCurve = `OUT OF LAPS (NEED ${estLapsToCatch}L)`;
  } else {
    estLapsToCatch = Math.max(1, estLapsToCatch);
    catchCurve = `EST. INTERCEPT: LAP ${currentLap + estLapsToCatch} (${estLapsToCatch}L)`;
  }

  // Overtake probability model (5% to 96%) driven by gap, wear delta, dampness & MOM boost
  let rawProb = 35;
  if (gapSec < 1.0) rawProb += 32;
  else if (gapSec < 2.2) rawProb += 16;
  else if (gapSec > 5.0) rawProb -= 22;

  rawProb += Math.max(-25, Math.min(28, wearAdvantage * 1.1));
  if (trackDampness > 30) rawProb += 8; // mixed grip creates passing chances
  const pct = Math.max(5, Math.min(96, Math.round(rawProb)));

  const tier = pct >= 70 ? "HIGH PROBABILITY" : pct >= 45 ? "MODERATE CHANCE" : "DEFENSIVE LOCK";
  const signDelta = wearAdvantage > 0 ? `+${wearAdvantage}%` : `${wearAdvantage}%`;

  return {
    leader: safeLeader,
    chaser: safeChaser,
    catchCurve,
    probabilityPct: pct,
    probability: `${pct}% [${tier}]`,
    tireDelta: `${safeChaser.code} (${signDelta} WEAR DELTA)`,
  };
}

/**
 * Generates dynamic remaining-stint tire degradation projection points for Recharts.
 */
export function buildLiveTireCurve(driver, currentLap = 1, maxLaps = 58) {
  const comp = String(driver?.tire || "M").trim().toUpperCase()[0] || "M";
  const spec = COMPOUND_PHYSICS[comp] || COMPOUND_PHYSICS.M;
  const startWear = Math.min(100, Math.max(2, Number(driver?.wear ?? 12)));
  const safeLap = Math.max(1, Number(currentLap || 1));

  const points = [];
  for (let step = 0; step <= 5; step++) {
    const projLap = Math.min(maxLaps, safeLap + step * 4);
    const lapDiff = projLap - safeLap;
    const projectedWear = Math.min(100, Math.round(startWear + lapDiff * spec.baseWearPerLap));
    const remainingGrip = Math.max(0, 100 - projectedWear);
    const targetGrip = Math.max(0, Math.round(100 - (startWear + lapDiff * spec.baseWearPerLap * 0.85)));
    points.push({
      lap: `L${projLap}`,
      wear: remainingGrip,
      target: targetGrip,
      cliffThreshold: Math.max(0, 100 - spec.cliffStartWear),
    });
  }
  return points;
}

/**
 * Builds head-to-head lap time comparison trace over recent laps using live driver deltas.
 */
export function buildPaceComparisonSeries(drivers = [], currentDriver, currentLap = 1) {
  const leader = drivers[0] || { code: "VER", lastLap: "1:20.100", gapSec: 0 };
  const target = currentDriver || leader;
  const isLeader = target.code === leader.code;
  const rival = isLeader ? (drivers[1] || target) : leader;

  const leaderBase = parseTimeToSeconds(leader.lastLap) || 82.4;
  const rivalBase = parseTimeToSeconds(rival.lastLap) || leaderBase + 0.35;
  const targetBase = parseTimeToSeconds(target.lastLap) || leaderBase + (parseTimeToSeconds(target.gapSec) * 0.08);

  const startLap = Math.max(1, currentLap - 4);
  const series = [];

  for (let lap = startLap; lap <= currentLap; lap++) {
    const wave = seededUnitNoise(lap * 17) * 0.14;
    const rivalWave = seededUnitNoise(lap * 29 + 5) * 0.16;
    const leaderSec = +(leaderBase + wave).toFixed(3);
    const compareSec = isLeader
      ? +(rivalBase + rivalWave).toFixed(3)
      : +(targetBase + rivalWave).toFixed(3);
    const diff = +(compareSec - leaderSec).toFixed(3);

    series.push({
      lap: `L${lap}`,
      Leader: +(leaderSec / 60).toFixed(3),
      Selected: +(compareSec / 60).toFixed(3),
      leaderTime: formatLapTimeSec(leaderSec),
      selectedTime: formatLapTimeSec(compareSec),
      delta: `${diff >= 0 ? "+" : ""}${diff.toFixed(3)}s`,
    });
  }
  return series;
}

/**
 * Deterministic stationary pit crew execution time seeded by driver number and lap.
 */
export function computePitCrewExecution(driverNum = 1, lap = 1, avgTeamPitSec = 2.35) {
  const noise = (seededUnitNoise(driverNum * 13 + lap * 31) + 1) / 2; // [0..1]
  if (noise < 0.15) {
    const sec = +(avgTeamPitSec - 0.25 + noise * 0.5).toFixed(1);
    return { sec, label: `⚡ ${sec}s FAST CREW STOP` };
  }
  if (noise < 0.86) {
    const sec = +(avgTeamPitSec + noise * 0.3).toFixed(1);
    return { sec, label: `🟢 ${sec}s CLEAN STOP` };
  }
  if (noise < 0.96) {
    const sec = +(avgTeamPitSec + 0.9 + noise * 0.35).toFixed(1);
    return { sec, label: `⚠️ ${sec}s GUN DELAY` };
  }
  const sec = +(avgTeamPitSec + 2.3 + noise * 0.6).toFixed(1);
  return { sec, label: `🔴 ${sec}s WHEEL NUT ISSUE` };
}

/**
 * Simulates one physics-driven Grand Prix lap across all 22 drivers cleanly without React coupling.
 */
export function simulateLapTick({
  prevDrivers,
  lap,
  maxLaps = 58,
  poleSec = 78.5,
  pitLossGreen = 21.5,
  sessionFlag = "GREEN",
  trackDampness = 0,
  userRole = "team",
  playerTeam = "Ferrari",
  driverPlans = {},
  plannedStrategies = [],
  isDriverInTeam,
}) {
  if (!prevDrivers || prevDrivers.length < 2 || lap <= 1) {
    return { drivers: prevDrivers, pittedInfo: null, overtakeInfo: null };
  }

  const raceBaseSec = poleSec + 7.2;
  const s1Base = raceBaseSec * 0.318;
  const s2Base = raceBaseSec * 0.428;
  const s3Base = raceBaseSec * 0.254;
  const needsGridGapInit = prevDrivers.every((pd) => !pd.gapSec || pd.gapSec === 0);

  let pittedDriverMeta = null;
  const completedPlanNotifications = [];

  let updated = prevDrivers.map((d, dIdx) => {
    const isPlayerDriver = userRole === "team" && isDriverInTeam?.(d, playerTeam);
    const initialGap = +(dIdx * 0.48).toFixed(3);
    let currentGapSec = needsGridGapInit
      ? initialGap
      : (d.gapSec !== undefined ? d.gapSec : parseTimeToSeconds(d.gap));

    const prevAheadGap = dIdx > 0
      ? (needsGridGapInit ? +((dIdx - 1) * 0.48).toFixed(3) : (prevDrivers[dIdx - 1]?.gapSec || 0))
      : 0;
    const gapToAhead = dIdx > 0 ? Math.max(0, currentGapSec - prevAheadGap) : 999;

    const plan = driverPlans?.[d.code];
    let pushMode = plan?.pushMode || "balanced";
    if (!isPlayerDriver) {
      if (gapToAhead > 0.15 && gapToAhead < 0.88 && (d.wear || 20) < 60 && lap >= 3) {
        pushMode = "attack";
      } else if ((d.wear || 20) > 68) {
        pushMode = "conserve";
      } else {
        pushMode = "balanced";
      }
    }

    const pushWearMult = pushMode === "attack" ? 1.4 : pushMode === "conserve" ? 0.72 : 1.0;
    const pushPaceDelta = pushMode === "attack" ? -0.18 : pushMode === "conserve" ? +0.16 : 0.0;

    const tireCode = String(d.tire || "M").trim().toUpperCase()[0] || "M";
    const compSpec = COMPOUND_PHYSICS[tireCode] || COMPOUND_PHYSICS.M;
    const isSlick = tireCode === "S" || tireCode === "M" || tireCode === "H";
    const wetWearAdd = trackDampness > 30 && isSlick ? 5.8 : 0;
    const newWear = Math.min(100, Math.round((d.wear || 12) + compSpec.baseWearPerLap * pushWearMult + wetWearAdd));
    const newTireAge = (d.tireAge || 0) + 1;

    let aiPitted = false;
    let nextTire = tireCode;
    let nextPitState = d.pitState === "IN PIT" ? "RACING" : (d.pitState || "RACING");
    let nextPits = d.pits || 0;

    const plannedStop = plannedStrategies?.find((s) => s.driverCode === d.code && s.lap === lap && !s.applied);
    const shouldAiWeatherPit = !isPlayerDriver && trackDampness > 36 && isSlick && newTireAge > 4;
    const shouldAiWearPit = !isPlayerDriver && newWear > 74 && lap < maxLaps - 4;
    const scNoise = (seededUnitNoise(lap * 11 + (d.num || 1)) + 1) / 2;
    const shouldAiScPit = !isPlayerDriver && sessionFlag === "SC" && newTireAge > 14 && scNoise > 0.45 && lap < maxLaps - 5;

    if (plannedStop) {
      aiPitted = true;
      nextPits += 1;
      nextPitState = "IN PIT";
      nextTire = plannedStop.targetCompound;
      const crew = computePitCrewExecution(d.num, lap);
      const transitLoss = sessionFlag === "SC" ? 11.2 : Math.max(14, pitLossGreen - 2.2);
      const totalLoss = +(transitLoss + crew.sec).toFixed(1);
      currentGapSec += totalLoss;
      completedPlanNotifications.push({ code: d.code, stopNum: plannedStop.stopNum || 1 });
      pittedDriverMeta = {
        code: d.code,
        reason: "Planned Strategy Call",
        durationStr: `${crew.label} (${totalLoss}s pit loss)`,
      };
    } else if (shouldAiWeatherPit || shouldAiWearPit || shouldAiScPit) {
      aiPitted = true;
      nextPits += 1;
      nextPitState = "IN PIT";
      nextTire = trackDampness > 60 ? "W" : trackDampness > 28 ? "I" : tireCode === "M" ? "H" : "M";
      const crew = computePitCrewExecution(d.num, lap);
      const transitLoss = sessionFlag === "SC" ? 11.2 : Math.max(14, pitLossGreen - 2.2);
      const totalLoss = +(transitLoss + crew.sec).toFixed(1);
      currentGapSec += totalLoss;
      pittedDriverMeta = {
        code: d.code,
        reason: shouldAiWeatherPit ? "Wet Track Switch" : shouldAiScPit ? "Safety Car Stop" : "Degradation Threshold",
        durationStr: `${crew.label} (${totalLoss}s pit loss)`,
      };
    } else {
      // Deterministic physics pace delta
      const degLoss = calculateTireDegradationDelta(tireCode, newWear, trackDampness);
      const freshBoost = nextPits > 0 && newTireAge <= 2 ? -0.35 : 0;
      const drsBoost = lap >= 3 && gapToAhead > 0 && gapToAhead < 0.95 ? -0.16 : 0;
      const scCompression = sessionFlag === "SC" && gapToAhead > 1.2 ? -(gapToAhead * 0.35) : 0;
      const driverNoise = seededUnitNoise(lap * 23 + (d.num || dIdx)) * 0.09;

      const totalDelta = pushPaceDelta + degLoss * 0.55 + freshBoost + drsBoost + scCompression + driverNoise;
      currentGapSec = +(Math.max(0, currentGapSec + totalDelta)).toFixed(3);
    }

    const tierPace = TIER1_DRIVERS.has(d.code) ? -0.26 : TIER2_DRIVERS.has(d.code) ? -0.04 : 0.24;
    const fuelGain = calculateFuelBurnBonus(lap, maxLaps);
    const degFull = calculateTireDegradationDelta(tireCode, newWear, trackDampness);
    const drvPaceDelta = tierPace + pushPaceDelta + degFull + fuelGain;

    const v1 = seededUnitNoise((d.num || 1) * 7 + lap * 13) * 0.08;
    const v2 = seededUnitNoise((d.num || 1) * 11 + lap * 19) * 0.10;
    const v3 = seededUnitNoise((d.num || 1) * 17 + lap * 29) * 0.07;

    const s1Num = +(s1Base + drvPaceDelta * 0.32 + v1).toFixed(3);
    const s2Num = +(s2Base + drvPaceDelta * 0.43 + v2).toFixed(3);
    const s3Num = +(s3Base + drvPaceDelta * 0.25 + v3 + (aiPitted ? 18.4 : 0)).toFixed(3);
    const lapSec = +(s1Num + s2Num + s3Num).toFixed(3);
    const lapStr = formatLapTimeSec(lapSec);

    const prevBestSec = parseTimeToSeconds(d.bestLap) || Infinity;
    let bestLap = d.bestLap || "NO TIME";
    let isPersonalBest = false;
    if (!aiPitted && lapSec < prevBestSec) {
      bestLap = lapStr;
      isPersonalBest = true;
    } else if (!d.bestLap || d.bestLap === "NO TIME" || d.bestLap === "—") {
      bestLap = lapStr;
      isPersonalBest = true;
    }

    return {
      ...d,
      wear: aiPitted ? 4 : newWear,
      tireAge: aiPitted ? 0 : newTireAge,
      tire: nextTire,
      pits: nextPits,
      pitState: nextPitState,
      gapSec: currentGapSec,
      pushMode,
      s1: s1Num.toFixed(3),
      s2: s2Num.toFixed(3),
      s3: s3Num.toFixed(3),
      s1Num,
      s2Num,
      s3Num,
      lastLap: lapStr,
      bestLap,
      isPersonalBest,
      aiPitted,
    };
  });

  // Fastest sector benchmarks
  let minS1 = Infinity, minS2 = Infinity, minS3 = Infinity;
  updated.forEach((d) => {
    if (!d.aiPitted) {
      if (d.s1Num < minS1) minS1 = d.s1Num;
      if (d.s2Num < minS2) minS2 = d.s2Num;
      if (d.s3Num < minS3) minS3 = d.s3Num;
    }
  });

  updated = updated.map((d) => ({
    ...d,
    s1Type: d.s1Num === minS1 ? "purple" : d.isPersonalBest ? "green" : "yellow",
    s2Type: d.s2Num === minS2 ? "purple" : d.isPersonalBest ? "green" : "yellow",
    s3Type: d.s3Num === minS3 ? "purple" : d.isPersonalBest ? "green" : "yellow",
  }));

  updated.sort((a, b) => a.gapSec - b.gapSec);

  // Track position swap detection driven by real physics gap ordering
  let overtakeInfo = null;
  for (let i = 0; i < updated.length; i++) {
    const newCar = updated[i];
    const oldPos = prevDrivers.findIndex((p) => p.code === newCar.code) + 1;
    const newPos = i + 1;
    if (oldPos > 0 && newPos < oldPos && !pittedDriverMeta) {
      const displaced = prevDrivers[newPos - 1];
      if (displaced && displaced.code !== newCar.code) {
        const reason =
          newCar.tireAge <= 3 && (displaced.wear || 20) > 52
            ? "Undercut & Fresh Compound Grip Delta"
            : newCar.pushMode === "attack"
              ? "350kW MGU-K Override + DRS Slipstream"
              : "Superior Stint Pace & Corner Exit Delta";
        overtakeInfo = {
          winnerCode: newCar.code,
          winnerNum: newCar.num,
          winnerTeam: newCar.team,
          loserCode: displaced.code,
          loserNum: displaced.num,
          loserTeam: displaced.team,
          toPos: newPos,
          fromPos: oldPos,
          lap,
          reason,
        };
        break;
      }
    }
  }

  let pittedInfo = null;
  if (pittedDriverMeta) {
    const pittedDriver = updated.find((d) => d.code === pittedDriverMeta.code);
    const reEntryPos = updated.findIndex((d) => d.code === pittedDriverMeta.code) + 1;
    if (pittedDriver) {
      const ahead = reEntryPos > 1 ? updated[reEntryPos - 2] : null;
      const compName = COMPOUND_PHYSICS[pittedDriver.tire]?.name || "Hard";
      pittedInfo = {
        lap,
        num: pittedDriver.num,
        code: pittedDriver.code,
        name: pittedDriver.name,
        team: pittedDriver.team,
        tire: pittedDriver.tire,
        compoundName: compName,
        stopDuration: pittedDriverMeta.durationStr,
        reEntryPos,
        reason: pittedDriverMeta.reason,
        aheadNotice: ahead ? ` behind ${ahead.code} (#${ahead.num})` : " in clean air",
      };
    }
  }

  const leaderGapSec = updated[0].gapSec;
  const finalDrivers = updated.map((d, i) => {
    const isLead = i === 0;
    const oldIdx = prevDrivers.findIndex((p) => p.code === d.code);
    const posDiff = oldIdx >= 0 ? oldIdx - i : 0;
    const prevAhead = i > 0 ? updated[i - 1] : null;
    const relGap = +(d.gapSec - leaderGapSec).toFixed(3);
    const intervalVal = isLead ? "—" : `+${Math.max(0, d.gapSec - (prevAhead?.gapSec || 0)).toFixed(3)}s`;

    return {
      ...d,
      pos: i + 1,
      posDelta: posDiff > 0 ? `+${posDiff}` : posDiff < 0 ? `${posDiff}` : "0",
      arrow: posDiff > 0 ? "up" : posDiff < 0 ? "down" : "neutral",
      overtaken: posDiff > 0,
      gap: isLead ? "LEADER" : `+${relGap.toFixed(3)}s`,
      interval: intervalVal,
    };
  });

  return {
    drivers: finalDrivers,
    pittedInfo,
    overtakeInfo,
    completedPlanNotifications,
  };
}
