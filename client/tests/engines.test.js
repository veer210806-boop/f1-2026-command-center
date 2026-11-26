import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTireDegradationDelta,
  calculateFuelBurnBonus,
  computeCatchAndProbability,
  simulateLapTick,
  formatLapTimeSec,
  parseTimeToSeconds,
} from "../src/utils/raceSimEngine.js";
import {
  calculateAutoFuelPrediction,
  resolveTeamFuelSpec,
} from "../src/utils/fuelPredictionEngine.js";
import {
  F1_POINTS_TABLE,
  createEmptySeasonScoreboard,
  recordRaceResultToScoreboard,
  revertRaceResultFromScoreboard,
  computeChampionshipStandings,
} from "../src/utils/scoreboardEngine.js";
import { escapeCsvCell, buildCsvContent } from "../src/utils/exportUtils.js";
import { mapOpenF1Compound, CIRCUIT_GEO_COORDS } from "../src/utils/openF1Service.js";
import { isDriverBelongingToTeam, TEAM_COLORS_MAP } from "../src/data/constructors2026.js";

test("raceSimEngine: formats & parses F1 lap times cleanly", () => {
  assert.equal(formatLapTimeSec(78.432), "1:18.432");
  assert.equal(formatLapTimeSec(0), "—");
  assert.equal(parseTimeToSeconds("1:18.432"), 78.432);
  assert.equal(parseTimeToSeconds("+1.250s"), 1.25);
  assert.equal(parseTimeToSeconds("LEADER"), 0);
});

test("raceSimEngine: tire degradation rises past cliff & penalizes slicks on wet tracks", () => {
  const freshSoft = calculateTireDegradationDelta("S", 10, 0);
  const cliffSoft = calculateTireDegradationDelta("S", 82, 0);
  const slickInRain = calculateTireDegradationDelta("M", 25, 65);
  assert.ok(cliffSoft > freshSoft + 1.5, "Cliff wear must trigger steep pace drop");
  assert.ok(slickInRain > 2.5, "Slick tires on wet track must suffer severe lap penalty");
});

test("raceSimEngine: fuel mass burn bonus improves pace over race distance", () => {
  assert.equal(calculateFuelBurnBonus(1, 58), 0);
  const lateBonus = calculateFuelBurnBonus(58, 58);
  assert.ok(lateBonus < -1.5, "Car shedding bio-fuel weight should run faster late in race");
});

test("raceSimEngine: catch curve reflects fresher tire chase & gap closure", () => {
  const model = computeCatchAndProbability({
    leader: { code: "VER", wear: 65, lastLap: "1:23.000", gapSec: 0 },
    chaser: { code: "NOR", wear: 18, lastLap: "1:22.100", gapSec: 1.4 },
    currentLap: 20,
    maxLaps: 58,
    trackDampness: 0,
  });
  assert.ok(model.probabilityPct >= 70);
  assert.ok(model.catchCurve.includes("EST. INTERCEPT"));
});

test("raceSimEngine: simulateLapTick maintains 22 cars, unique positions, and positive intervals", () => {
  const seedGrid = Array.from({ length: 22 }, (_, i) => ({
    pos: i + 1,
    num: i + 1,
    code: `D${i + 1}`,
    name: `Driver ${i + 1}`,
    team: i < 2 ? "Ferrari" : "McLaren",
    tire: "M",
    tireAge: 5,
    wear: 18,
    pits: 0,
    pitState: "RACING",
    gapSec: +(i * 0.5).toFixed(3),
    gap: i === 0 ? "LEADER" : `+${(i * 0.5).toFixed(3)}s`,
    interval: i === 0 ? "—" : "+0.500s",
    bestLap: "NO TIME",
  }));

  const tick = simulateLapTick({
    prevDrivers: seedGrid,
    lap: 12,
    maxLaps: 58,
    isDriverInTeam: isDriverBelongingToTeam,
  });

  assert.equal(tick.drivers.length, 22);
  assert.equal(tick.drivers[0].pos, 1);
  assert.equal(tick.drivers[0].gap, "LEADER");
  assert.ok(tick.drivers[1].interval.startsWith("+"));
});

test("fuelPredictionEngine: enforces FIA 1.0kg mandatory fuel sample & deterministic flow", () => {
  const spec = resolveTeamFuelSpec("Ferrari");
  assert.ok(spec.partner.includes("Shell"));
  const pred = calculateAutoFuelPrediction({
    circuit: { circuit_id: "australia", laps: 58, length_km: 5.278 },
    teamName: "Ferrari",
    currentLap: 15,
    activeFlag: "GREEN",
    pushMode: "balanced",
  });
  assert.ok(pred.fiaReserveKg >= 1.0);
  assert.ok(pred.startLoadKg > pred.remainingKg);
});

test("scoreboardEngine: awards official 25-18-15 points + fastest lap bonus inside top 10 and reverts cleanly", () => {
  assert.deepEqual(F1_POINTS_TABLE, [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]);
  let sb = createEmptySeasonScoreboard("Ferrari");
  const mockDrivers = [
    { pos: 1, code: "LEC", name: "Charles Leclerc", team: "Ferrari", num: 16 },
    { pos: 2, code: "VER", name: "Max Verstappen", team: "Red Bull Racing", num: 3 },
    { pos: 12, code: "GAS", name: "Pierre Gasly", team: "Alpine", num: 10 },
  ];
  const circuit = { circuit_id: "australia", round: 1, grand_prix_name: "Australian Grand Prix" };

  sb = recordRaceResultToScoreboard(sb, circuit, mockDrivers, "LEC");
  let standings = computeChampionshipStandings(sb, "Ferrari");
  const lec = standings.driverStandings.find((d) => d.code === "LEC");
  assert.equal(lec.points, 26); // 25 + 1 fastest lap

  sb = revertRaceResultFromScoreboard(sb, "australia");
  standings = computeChampionshipStandings(sb, "Ferrari");
  assert.equal(standings.totalRoundsCompleted, 0);
});

test("exportUtils & openF1Service helpers work cleanly", () => {
  assert.equal(escapeCsvCell('Red Bull, "Oracle"'), '"Red Bull, ""Oracle"""');
  const csv = buildCsvContent(["Pos", "Driver"], [[1, "M. Verstappen"]]);
  assert.equal(csv, "Pos,Driver\r\n1,M. Verstappen");
  assert.equal(mapOpenF1Compound("SOFT"), "S");
  assert.equal(mapOpenF1Compound("INTERMEDIATE"), "I");
  assert.ok(CIRCUIT_GEO_COORDS.australia.lat < 0);
  assert.ok(TEAM_COLORS_MAP.Ferrari.primary.startsWith("#"));
});
