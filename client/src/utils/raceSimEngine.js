// ============================================================
// raceSimEngine.js — Clear, Deterministic F1 Physics & Race Simulation Engine
// Models compound grip delta, non-linear tire cliff degradation, fuel burn
// mass gain, track dampness mismatch penalties, and real catch-up probability.
// ============================================================
import { CONSTRUCTORS_2026, TEAM_COLORS_MAP, isDriverBelongingToTeam } from "../data/constructors2026.js";

export const DRIVER_IOC_MAP = {
  NOR: "GBR", PIA: "AUS", VER: "NLD", HAD: "FRA", RUS: "GBR", ANT: "ITA",
  LEC: "MCO", HAM: "GBR", SAI: "ESP", ALB: "THA", ALO: "ESP", STR: "CAN",
  GAS: "FRA", COL: "ARG", OCO: "FRA", BEA: "GBR", HUL: "DEU", BOR: "BRA",
  LAW: "NZL", LIN: "GBR", PER: "MEX", BOT: "FIN",
};

export const TIRE_CONFIG = {
  S: { letter: "S", name: "Soft",         fullName: "Soft Compound",         color: "#ff1801", glow: "rgba(255, 24, 1, 0.75)" },
  M: { letter: "M", name: "Medium",       fullName: "Medium Compound",       color: "#ffd700", glow: "rgba(255, 215, 0, 0.75)" },
  H: { letter: "H", name: "Hard",         fullName: "Hard Compound",         color: "#ffffff", glow: "rgba(255, 255, 255, 0.75)" },
  I: { letter: "I", name: "Intermediate", fullName: "Intermediate Compound", color: "#00cc44", glow: "rgba(0, 204, 68, 0.75)" },
  W: { letter: "W", name: "Wet",          fullName: "Wet Compound",          color: "#0088ff", glow: "rgba(0, 136, 255, 0.75)" },
};

export const TEAM_RACE_ENGINEERS = {
  McLaren:           "Will Joseph",
  "Red Bull Racing": "Gianpiero Lambiase",
  Ferrari:           "Bryan Bozzi",
  Mercedes:          "Peter Bonnington",
  "Aston Martin":    "Chris Cronin",
  Williams:          "Gaetan Jego",
  Haas:              "Gary Gannon",
  Alpine:            "Josh Peckett",
  "Racing Bulls":    "Mattia Spini",
  Audi:              "Steven Petrik",
  Cadillac:          "Hugh Bird",
};

export const COMPOUND_PHYSICS = {
  S: { name: "Soft",         paceDelta: -0.35, baseWearPerLap: 4.5, cliffStartWear: 68, cliffPenaltyPerPct: 0.09, optimalStintLaps: 18 },
  M: { name: "Medium",       paceDelta:  0.00, baseWearPerLap: 2.8, cliffStartWear: 72, cliffPenaltyPerPct: 0.08, optimalStintLaps: 30 },
  H: { name: "Hard",         paceDelta:  0.28, baseWearPerLap: 1.8, cliffStartWear: 76, cliffPenaltyPerPct: 0.065, optimalStintLaps: 42 },
  I: { name: "Intermediate", paceDelta:  1.15, baseWearPerLap: 2.9, cliffStartWear: 74, cliffPenaltyPerPct: 0.075, optimalStintLaps: 28 },
  W: { name: "Full Wet",     paceDelta:  2.40, baseWearPerLap: 2.4, cliffStartWear: 78, cliffPenaltyPerPct: 0.06, optimalStintLaps: 24 },
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

/**
 * Resolves the two active drivers belonging to a given constructor on the live grid.
 */
export function getTeamDriversHelper(teamId, gridList = []) {
  if (!teamId || !gridList || gridList.length === 0) return gridList?.slice(0, 2) || [];
  const matched = gridList.filter((d) => isDriverBelongingToTeam(d, teamId));
  if (matched.length >= 2) return matched.slice(0, 2);

  const norm = String(teamId).toLowerCase();
  const constructorObj = CONSTRUCTORS_2026.find((c) => {
    const cid = c.id.toLowerCase();
    const cname = c.name.toLowerCase();
    return cid.includes(norm) || norm.includes(cid) || cname.includes(norm) || norm.includes(cname);
  });

  if (constructorObj?.drivers) {
    const codes = constructorObj.drivers.map((d) => d.code);
    const found = gridList.filter((d) => codes.includes(d.code));
    if (found.length > 0) return found.slice(0, 2);
  }
  return matched.length > 0 ? matched : gridList.slice(0, 2);
}

/**
 * Initializes proportional Lap-scaled pit plans and directives for a constructor's duo.
 */
export function createInitialTeamPlans(teamId, gridList = [], totalLaps = 58) {
  const safeLaps = Math.max(20, Number(totalLaps) || 58);
  const stop1Lead = Math.max(8, Math.round(safeLaps * 0.38));
  const stop1Wing = Math.min(safeLaps - 8, stop1Lead + Math.max(2, Math.round(safeLaps * 0.05)));
  const stop2Lead = Math.min(safeLaps - 6, Math.round(safeLaps * 0.72));
  const stop2Wing = Math.min(safeLaps - 4, stop2Lead + 2);

  const tDrivers = getTeamDriversHelper(teamId, gridList);
  const d1 = tDrivers[0] || { code: "VER", num: 3, name: "Max Verstappen" };
  const d2 = tDrivers[1] || { code: "HAD", num: 6, name: "Isack Hadjar" };

  const plans = {
    [d1.code]: {
      stopsCount: 1,
      stop1Lap: stop1Lead,
      stop1SetId: "H1",
      stop1Completed: false,
      stop2Lap: stop2Lead,
      stop2SetId: "S2",
      stop2Completed: false,
      pushMode: "balanced",
      nextRecommendedWindow: `Laps ${stop1Lead} - ${Math.min(safeLaps - 6, stop1Lead + 5)} (Hard)`,
    },
    [d2.code]: {
      stopsCount: 1,
      stop1Lap: stop1Wing,
      stop1SetId: "H1",
      stop1Completed: false,
      stop2Lap: stop2Wing,
      stop2SetId: "S1",
      stop2Completed: false,
      pushMode: "balanced",
      nextRecommendedWindow: `Laps ${stop1Lead + 3} - ${Math.min(safeLaps - 5, stop1Wing + 3)} (Hard)`,
    },
  };

  const strategies = [
    {
      id: `stop1_${d1.code}`,
      driverCode: d1.code,
      lap: stop1Lead,
      targetCompound: "H",
      setId: "H1",
      stopNum: 1,
      label: `Stop 1 @ Lap ${stop1Lead} (H)`,
      applied: false,
    },
    {
      id: `stop1_${d2.code}`,
      driverCode: d2.code,
      lap: stop1Wing,
      targetCompound: "H",
      setId: "H1",
      stopNum: 1,
      label: `Stop 1 @ Lap ${stop1Wing} (H)`,
      applied: false,
    },
  ];

  return { plans, strategies };
}

/**
 * Normalizes a starting grid array cleanly for Lap 1 race resets.
 */
export function resetGridEntries(rawGrid = [], { includeSectorReset = false } = {}) {
  return rawGrid.map((d, i) => ({
    ...d,
    pos: i + 1,
    tireAge: 0,
    wear: 4,
    pits: 0,
    pitState: "RACING",
    gap: i === 0 ? "LEADER" : "—",
    gapSec: 0,
    interval: "—",
    posDelta: "0",
    arrow: includeSectorReset ? "none" : "neutral",
    ...(includeSectorReset
      ? { s1: "—", s2: "—", s3: "—", s1Type: "empty", s2Type: "empty", s3Type: "empty", bestLap: "NO TIME", lastLap: "—" }
      : {}),
  }));
}

function formatShortDriverName(fullName = "", code = "DRV") {
  const clean = String(fullName || "").trim();
  if (!clean) return code;
  if (clean.includes("Sainz")) return "C. Sainz Jr.";
  const parts = clean.split(/\s+/);
  if (parts.length < 2) return clean;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

const HIGH_SPEED_TRACKS = new Set(["monza", "saudi_arabia", "las_vegas", "azerbaijan", "belgium", "bahrain", "china"]);
const TIGHT_DOWNFORCE_TRACKS = new Set(["monaco", "hungary", "singapore", "netherlands"]);

/**
 * Computes live sector speeds, Top-5 Speed Trap rankings, and Top-4 Pace Deltas from active drivers.
 */
export function computeSectorAndTrapTelemetry({
  drivers = [],
  circuitId = "australia",
  trackDampness = 0,
  aeroMode = "Z-MODE",
  currentLap = 1,
}) {
  const cid = String(circuitId || "australia").toLowerCase();
  const trackSpeedOffset = HIGH_SPEED_TRACKS.has(cid) ? 16 : TIGHT_DOWNFORCE_TRACKS.has(cid) ? -22 : 0;
  const dampPenaltyKmh = Math.round((Number(trackDampness) || 0) * 0.34);
  const aeroBonusKmh = aeroMode === "X-MODE" ? 11 : 0;
  const lapWave = seededUnitNoise((currentLap || 1) * 7) * 2;

  const baseS1 = Math.max(210, Math.round(302 + trackSpeedOffset * 0.65 - dampPenaltyKmh * 0.7 + aeroBonusKmh * 0.5 + lapWave));
  const baseS2 = Math.max(195, Math.round(291 + trackSpeedOffset * 0.8 - dampPenaltyKmh * 0.8 + aeroBonusKmh * 0.4 - lapWave));
  const baseS3 = Math.max(225, Math.round(326 + trackSpeedOffset - dampPenaltyKmh + aeroBonusKmh));

  const safeList = Array.isArray(drivers) && drivers.length > 0 ? drivers : [];

  // Top 5 live speed trap estimates from live drivers' aero, DRS, fresh tire grip & push modes
  const speedEntries = safeList.map((d, idx) => {
    const intSec = parseTimeToSeconds(d.interval);
    const hasDrs = idx > 0 && intSec > 0 && intSec < 1.0 && (currentLap || 1) >= 2 && d.pitState !== "IN PIT";
    const isAttack = d.pushMode === "attack" || d.mom === "MOM ON" || d.mom === "ACTIVE";
    const freshBonus = Math.max(0, 6 - Math.round((d.wear || 15) * 0.12));
    const aeroDelta = d.mom === "X-MODE" ? 7 : 0;
    const microVar = Math.round(seededUnitNoise((d.num || idx + 1) * 19 + (currentLap || 1) * 5) * 3.5);

    const trapKmh = Math.max(
      245,
      Math.round(baseS3 + (hasDrs ? 11 : 0) + (isAttack ? 4 : 0) + freshBonus + aeroDelta + microVar)
    );
    const teamPalette = TEAM_COLORS_MAP[d.team] || { primary: "#00d2be" };
    return {
      code: d.code,
      num: d.num,
      name: formatShortDriverName(d.name, d.code),
      team: d.team,
      color: teamPalette.primary || "#00d2be",
      speed: trapKmh,
      hasDrs,
    };
  });

  speedEntries.sort((a, b) => b.speed - a.speed);
  const topSpeed = speedEntries[0]?.speed || baseS3;
  const minSpeed = Math.max(220, topSpeed - 28);
  const topSpeedTrap = speedEntries.slice(0, 5).map((item, idx) => ({
    pos: idx + 1,
    name: item.name,
    code: item.code,
    team: item.team,
    color: item.color,
    speed: item.speed,
    pct: Math.max(58, Math.min(100, Math.round(70 + ((item.speed - minSpeed) / Math.max(1, topSpeed - minSpeed)) * 30))),
  }));

  // Top 4 live pace deltas from current running order & last lap vs field median
  const leaderLap = parseTimeToSeconds(safeList[0]?.lastLap) || 82.0;
  const topPaceDeltas = safeList.slice(0, 4).map((d, idx) => {
    const teamPalette = TEAM_COLORS_MAP[d.team] || { primary: "#00d2be" };
    const drvLap = parseTimeToSeconds(d.lastLap) || leaderLap + idx * 0.25;
    const pacePct = (currentLap || 1) <= 1
      ? +(1.4 - idx * 0.3).toFixed(1)
      : +(((leaderLap - drvLap) / Math.max(40, leaderLap)) * 100 + (d.pushMode === "attack" ? 0.6 : 0.2) - ((d.wear || 20) * 0.015)).toFixed(1);
    const isUp = pacePct >= 0;
    return {
      pos: d.pos || idx + 1,
      num: `#${d.num}`,
      code: d.code,
      name: formatShortDriverName(d.name, d.code),
      trend: isUp ? "▲" : "▼",
      pct: `${isUp ? "+" : ""}${pacePct.toFixed(1)}%`,
      isUp,
      color: teamPalette.primary || "#00d2be",
    };
  });

  return {
    sectorSpeeds: {
      s1: baseS1,
      s2: baseS2,
      s3: baseS3,
      trap: topSpeedTrap[0]?.speed || topSpeed,
    },
    topPaceDeltas,
    topSpeedTrap,
  };
}

/**
 * Computes proportional 1-stop / 2-stop strategy windows and remaining stint endurance for any circuit lap count.
 */
export function buildStrategyPlanSummary({ maxLaps = 58, currentDriver }) {
  const safeMax = Math.max(20, Number(maxLaps) || 58);
  const planAStopLap = Math.max(10, Math.min(safeMax - 8, Math.round(safeMax * 0.58)));
  const planBStop1 = Math.max(8, Math.round(safeMax * 0.31));
  const planBStop2 = Math.min(safeMax - 6, Math.round(safeMax * 0.67));

  const code = String(currentDriver?.tire || "M").trim().toUpperCase()[0] || "M";
  const spec = COMPOUND_PHYSICS[code] || COMPOUND_PHYSICS.M;
  const age = Number(currentDriver?.tireAge || 0);
  const wear = Number(currentDriver?.wear || 12);
  const estByAge = Math.max(0, spec.optimalStintLaps - age);
  const estByWear = Math.max(0, Math.round((100 - wear) / Math.max(1.2, spec.baseWearPerLap)));

  return {
    planAStopLap,
    planALabel1: `Med (L1–${planAStopLap - 1})`,
    planALabel2: `Hard (L${planAStopLap}–${safeMax})`,
    planBLabel1: `Soft (L1–${planBStop1})`,
    planBLabel2: `Med (L${planBStop1 + 1}–${planBStop2})`,
    planBLabel3: `Soft (L${planBStop2 + 1}–${safeMax})`,
    estRemainingLaps: Math.max(0, Math.min(estByAge, estByWear, safeMax)),
  };
}
