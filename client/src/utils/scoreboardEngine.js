// ============================================================
// scoreboardEngine.js — Authentic FIA Formula 1 World Championship Engine
// Full 2026 Drivers' & Constructors' Championship Points Tracking
//
// Technical Rules:
// 1. Official F1 Points Scoring: 1st=25, 2nd=18, 3rd=15, 4th=12,
//    5th=10, 6th=8, 7th=6, 8th=4, 9th=2, 10th=1.
// 2. Fastest Lap Bonus: +1 point if finisher is inside top 10.
// 3. Constructors score the sum of points of both their drivers.
// 4. If a race is restarted, that race's points are reversed back.
// 5. If the user changes team, all season points reset from 0 for Race 1.
// ============================================================

import { DRIVER_META } from "../data/raceWeekendGrids2026.js";
import { CONSTRUCTORS_2026 } from "../data/constructors2026.js";

export const F1_POINTS_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SCOREBOARD_STORAGE_KEY = "gp_scoreboard_season_v1";

/**
 * Normalizes constructor identifiers for consistent grouping
 */
export function normalizeTeamName(teamName) {
  if (!teamName) return "Ferrari";
  const lower = String(teamName).toLowerCase().trim();
  if (lower.includes("ferrari")) return "Ferrari";
  if (lower.includes("mclaren")) return "McLaren";
  if (lower.includes("red") && lower.includes("bull")) return "Red Bull Racing";
  if (lower.includes("mercedes")) return "Mercedes";
  if (lower.includes("aston")) return "Aston Martin";
  if (lower.includes("williams")) return "Williams";
  if (lower.includes("racing bulls") || lower.includes("rb") || lower.includes("vcarb")) return "Racing Bulls";
  if (lower.includes("alpine")) return "Alpine";
  if (lower.includes("haas")) return "Haas";
  if (lower.includes("audi") || lower.includes("sauber")) return "Audi";
  if (lower.includes("cadillac")) return "Cadillac";
  return teamName;
}

/**
 * Creates a blank season scoreboard structure
 */
export function createEmptySeasonScoreboard(teamId = "Ferrari") {
  return {
    teamCampaign: normalizeTeamName(teamId),
    seasonYear: 2026,
    completedRounds: {}, // { [circuitId]: RoundResult }
    lastUpdated: Date.now(),
  };
}

/**
 * Loads current season scoreboard from localStorage or creates fresh one
 */
export function loadSeasonScoreboard(activeTeamId = "Ferrari") {
  const normTeam = normalizeTeamName(activeTeamId);
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(SCOREBOARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // If user changed team out-of-band, reset to clean 0-point season for that team
        if (parsed && normalizeTeamName(parsed.teamCampaign) === normTeam) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to load scoreboard from localStorage, creating fresh:", err);
  }
  const fresh = createEmptySeasonScoreboard(normTeam);
  saveSeasonScoreboard(fresh);
  return fresh;
}

/**
 * Persists season scoreboard to localStorage
 */
export function saveSeasonScoreboard(scoreboard) {
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined" && scoreboard) {
      localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(scoreboard));
    }
  } catch (err) {
    console.error("Failed to save scoreboard to localStorage:", err);
  }
}

/**
 * Resets season scoreboard completely to 0 starting from Race 1 for a new team
 */
export function resetScoreboardForNewTeam(newTeamId) {
  const normTeam = normalizeTeamName(newTeamId);
  const fresh = createEmptySeasonScoreboard(normTeam);
  saveSeasonScoreboard(fresh);
  return fresh;
}

/**
 * Helper to identify fastest lap driver code from grid
 */
export function findFastestLapDriverCode(drivers = []) {
  let fastestCode = null;
  let bestSec = Infinity;

  drivers.forEach((d) => {
    if (d.bestLap && d.bestLap.includes(":")) {
      const parts = d.bestLap.split(":");
      const sec = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      if (!isNaN(sec) && sec < bestSec) {
        bestSec = sec;
        fastestCode = d.code;
      }
    }
  });

  return fastestCode;
}

/**
 * Records the final classification of a completed race into the scoreboard
 */
export function recordRaceResultToScoreboard(currentScoreboard, circuit, gridDrivers = [], fastestLapCode = null) {
  if (!circuit || !circuit.circuit_id) return currentScoreboard;

  const circuitId = circuit.circuit_id;
  const roundNum = circuit.round || 1;
  const gpName = circuit.grand_prix_name || "Grand Prix";
  const fastCode = fastestLapCode || findFastestLapDriverCode(gridDrivers);

  // Map drivers to official F1 classification & points
  const classifiedDrivers = gridDrivers.map((d, idx) => {
    const pos = idx + 1;
    const basePts = pos <= 10 ? F1_POINTS_TABLE[pos - 1] : 0;
    const isFastestLap = d.code === fastCode && pos <= 10;
    const totalPts = basePts + (isFastestLap ? 1 : 0);

    return {
      code: d.code,
      num: d.num,
      name: d.name,
      team: normalizeTeamName(d.team),
      pos,
      basePts,
      isFastestLap,
      totalPts,
      bestLap: d.bestLap || "1:28.412",
    };
  });

  // Calculate constructor points for this race
  const constructorPoints = {};
  CONSTRUCTORS_2026.forEach((c) => {
    constructorPoints[c.id] = 0;
  });

  classifiedDrivers.forEach((d) => {
    const teamNorm = normalizeTeamName(d.team);
    constructorPoints[teamNorm] = (constructorPoints[teamNorm] || 0) + (d.totalPts || 0);
  });

  const updatedCompletedRounds = {
    ...(currentScoreboard?.completedRounds || {}),
    [circuitId]: {
      circuitId,
      round: roundNum,
      grandPrixName: gpName,
      circuitName: circuit.circuit_name || gpName,
      country: circuit.country || "Global",
      countryCode: circuit.country_code || "FIA",
      laps: circuit.laps || 58,
      completedAt: Date.now(),
      fastestLapCode: fastCode,
      classifiedDrivers,
      constructorPoints,
    },
  };

  const updatedScoreboard = {
    ...currentScoreboard,
    completedRounds: updatedCompletedRounds,
    lastUpdated: Date.now(),
  };

  saveSeasonScoreboard(updatedScoreboard);
  return updatedScoreboard;
}

/**
 * Reverses/removes points of a restarted race so they do not duplicate or linger
 */
export function revertRaceResultFromScoreboard(currentScoreboard, circuitId) {
  if (!currentScoreboard || !circuitId) return currentScoreboard;

  const currentRounds = { ...(currentScoreboard.completedRounds || {}) };
  if (!currentRounds[circuitId]) {
    // If not recorded yet, nothing to revert
    return currentScoreboard;
  }

  delete currentRounds[circuitId];

  const updated = {
    ...currentScoreboard,
    completedRounds: currentRounds,
    lastUpdated: Date.now(),
  };

  saveSeasonScoreboard(updated);
  return updated;
}

/**
 * Computes official Drivers' & Constructors' World Championship Standings
 */
export function computeChampionshipStandings(scoreboard, activePlayerTeam = "Ferrari") {
  const completedRoundsMap = scoreboard?.completedRounds || {};
  const completedRoundsList = Object.values(completedRoundsMap).sort((a, b) => (a.round || 0) - (b.round || 0));
  const normPlayerTeam = normalizeTeamName(activePlayerTeam || scoreboard?.teamCampaign || "Ferrari");

  // 1. Initialize Driver Tally for all 22 Official 2026 Drivers
  const driverTally = {};
  Object.entries(DRIVER_META).forEach(([code, meta]) => {
    driverTally[code] = {
      code,
      num: meta.num,
      name: meta.name,
      team: normalizeTeamName(meta.team),
      flag: meta.flag,
      ioc: meta.ioc,
      tier: meta.tier,
      points: 0,
      wins: 0,
      podiums: 0,
      top10s: 0,
      fastestLaps: 0,
      bestFinish: 99,
      roundResults: {}, // { [roundNum]: { pos, pts, isFastestLap } }
    };
  });

  // 2. Initialize Constructor Tally for all 11 Official 2026 Constructors
  const constructorTally = {};
  CONSTRUCTORS_2026.forEach((c) => {
    constructorTally[c.id] = {
      id: c.id,
      name: c.name,
      short: c.short,
      color: c.color,
      secondaryColor: c.secondaryColor,
      chassis: c.chassis,
      powerUnit: c.powerUnit,
      principal: c.principal,
      drivers: c.drivers,
      points: 0,
      wins: 0,
      podiums: 0,
      roundPoints: {}, // { [roundNum]: pts }
      driverContributions: {}, // { [driverCode]: pts }
    };
    c.drivers.forEach((d) => {
      constructorTally[c.id].driverContributions[d.code] = 0;
    });
  });

  // 3. Aggregate points from each completed round
  completedRoundsList.forEach((roundData) => {
    const roundNum = roundData.round;

    // Process Driver results
    (roundData.classifiedDrivers || []).forEach((res) => {
      const tally = driverTally[res.code];
      if (tally) {
        tally.points += res.totalPts || 0;
        if (res.pos === 1) tally.wins += 1;
        if (res.pos <= 3) tally.podiums += 1;
        if (res.pos <= 10) tally.top10s += 1;
        if (res.isFastestLap) tally.fastestLaps += 1;
        if (res.pos < tally.bestFinish) tally.bestFinish = res.pos;

        tally.roundResults[roundNum] = {
          pos: res.pos,
          pts: res.totalPts,
          isFastestLap: res.isFastestLap,
          gpName: roundData.grandPrixName,
        };
      }
    });

    // Process Constructor points
    Object.entries(roundData.constructorPoints || {}).forEach(([teamId, pts]) => {
      const teamNorm = normalizeTeamName(teamId);
      const cTally = constructorTally[teamNorm];
      if (cTally) {
        cTally.points += pts || 0;
        cTally.roundPoints[roundNum] = pts || 0;
      }
    });

    // Check constructor wins & podiums from round
    const p1Driver = roundData.classifiedDrivers?.[0];
    if (p1Driver) {
      const winningTeam = normalizeTeamName(p1Driver.team);
      if (constructorTally[winningTeam]) {
        constructorTally[winningTeam].wins += 1;
      }
    }
    const podiumDrivers = (roundData.classifiedDrivers || []).slice(0, 3);
    podiumDrivers.forEach((d) => {
      const podTeam = normalizeTeamName(d.team);
      if (constructorTally[podTeam]) {
        constructorTally[podTeam].podiums += 1;
      }
    });
  });

  // Calculate each driver's contribution to constructor total
  Object.values(driverTally).forEach((d) => {
    const c = constructorTally[d.team];
    if (c) {
      c.driverContributions[d.code] = d.points;
    }
  });

  // 4. Sort Drivers' Championship Standings
  // Tie-breaker rules: Points DESC -> Wins DESC -> Podiums DESC -> Best Finish ASC -> Car Tier ASC
  const driverStandings = Object.values(driverTally).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    if (a.bestFinish !== b.bestFinish) return a.bestFinish - b.bestFinish;
    return (a.tier || 3) - (b.tier || 3);
  });

  // Assign ranks & leader gaps
  const driverLeaderPts = driverStandings[0]?.points || 0;
  driverStandings.forEach((d, idx) => {
    d.rank = idx + 1;
    d.gap = idx === 0 ? "LEADER" : `-${driverLeaderPts - d.points} PTS`;
    d.isPlayerTeam = d.team === normPlayerTeam;
  });

  // 5. Sort Constructors' Championship Standings
  const constructorStandings = Object.values(constructorTally).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    return a.name.localeCompare(b.name);
  });

  // Assign ranks & leader gaps
  const constructorLeaderPts = constructorStandings[0]?.points || 0;
  constructorStandings.forEach((c, idx) => {
    c.rank = idx + 1;
    c.gap = idx === 0 ? "LEADER" : `-${constructorLeaderPts - c.points} PTS`;
    c.isPlayerTeam = c.id === normPlayerTeam;
  });

  // 6. Summary Metadata
  const userTeamStanding = constructorStandings.find((c) => c.isPlayerTeam) || constructorStandings[0];
  const userTeamDrivers = driverStandings.filter((d) => d.isPlayerTeam);

  return {
    seasonYear: 2026,
    totalRoundsCompleted: completedRoundsList.length,
    completedRoundsList,
    driverStandings,
    constructorStandings,
    leaderDriver: driverStandings[0],
    leaderConstructor: constructorStandings[0],
    userTeamStanding,
    userTeamDrivers,
    playerTeam: normPlayerTeam,
  };
}
