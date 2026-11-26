import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTireDegradationDelta,
  calculateFuelBurnBonus,
  computeCatchAndProbability,
  simulateLapTick,
  formatLapTimeSec,
  parseTimeToSeconds,
  computeSectorAndTrapTelemetry,
  buildStrategyPlanSummary,
  createInitialTeamPlans,
  resetGridEntries,
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
import {
  mapOpenF1Compound,
  CIRCUIT_GEO_COORDS,
  fetchCircuitLiveWeather,
  fetchOpenF1RaceReplay,
  fetchOpenF1TeammateTelemetry,
} from "../src/utils/openF1Service.js";
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

test("raceSimEngine: computeSectorAndTrapTelemetry & buildStrategyPlanSummary respond dynamically", () => {
  const sampleGrid = [
    { pos: 1, num: 3, code: "VER", name: "Max Verstappen", team: "Red Bull Racing", tire: "M", tireAge: 8, wear: 24, interval: "—", lastLap: "1:18.900", pushMode: "attack", mom: "MOM ON", pitState: "RACING" },
    { pos: 2, num: 16, code: "LEC", name: "Charles Leclerc", team: "Ferrari", tire: "M", tireAge: 9, wear: 27, interval: "+0.650s", lastLap: "1:19.120", pushMode: "balanced", mom: "Z-MODE", pitState: "RACING" },
    { pos: 3, num: 4, code: "NOR", name: "Lando Norris", team: "McLaren", tire: "H", tireAge: 5, wear: 14, interval: "+1.450s", lastLap: "1:19.450", pushMode: "balanced", mom: "X-MODE", pitState: "RACING" },
  ];

  const dryMonza = computeSectorAndTrapTelemetry({
    drivers: sampleGrid,
    circuitId: "monza",
    trackDampness: 0,
    aeroMode: "X-MODE",
    currentLap: 10,
  });
  const wetMonaco = computeSectorAndTrapTelemetry({
    drivers: sampleGrid,
    circuitId: "monaco",
    trackDampness: 80,
    aeroMode: "Z-MODE",
    currentLap: 10,
  });

  assert.ok(dryMonza.sectorSpeeds.trap > wetMonaco.sectorSpeeds.trap);
  assert.equal(dryMonza.topSpeedTrap.length, 3);
  assert.equal(dryMonza.topPaceDeltas.length, 3);
  assert.equal(dryMonza.topPaceDeltas[0].code, "VER");

  const monzaPlan = buildStrategyPlanSummary({ maxLaps: 53, currentDriver: sampleGrid[0] });
  const spaPlan = buildStrategyPlanSummary({ maxLaps: 44, currentDriver: sampleGrid[0] });
  assert.ok(monzaPlan.planAStopLap > spaPlan.planAStopLap);
  assert.ok(monzaPlan.planALabel2.endsWith("–53)"));
  assert.ok(spaPlan.planBLabel3.endsWith("–44)"));
  assert.ok(monzaPlan.estRemainingLaps > 0);
});

test("raceSimEngine: createInitialTeamPlans & resetGridEntries scale by circuit", () => {
  const miniGrid = [
    { pos: 4, num: 3, code: "VER", name: "Max Verstappen", team: "Red Bull Racing", tireAge: 15, wear: 60, pits: 2 },
    { pos: 8, num: 6, code: "HAD", name: "Isack Hadjar", team: "Red Bull Racing", tireAge: 12, wear: 48, pits: 1 },
  ];
  const { plans, strategies } = createInitialTeamPlans("red_bull", miniGrid, 44);
  assert.equal(plans.VER.stop1Lap, Math.round(44 * 0.38));
  assert.equal(strategies.length, 2);
  assert.ok(strategies[0].label.includes(`Lap ${plans.VER.stop1Lap}`));

  const reset = resetGridEntries(miniGrid, { includeSectorReset: true });
  assert.equal(reset[0].pos, 1);
  assert.equal(reset[0].gap, "LEADER");
  assert.equal(reset[0].pits, 0);
  assert.equal(reset[0].s1, "—");
  assert.equal(reset[1].pos, 2);
  assert.equal(reset[1].arrow, "none");
});

test("openF1Service: fetchCircuitLiveWeather maps live GPS weather & rejects cleanly on HTTP error", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.ok(url.includes("open-meteo.com"));
      return {
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 19.4,
            relative_humidity_2m: 82,
            precipitation: 0.8,
            wind_speed_10m: 24.3,
          },
        }),
      };
    };

    const spaWeather = await fetchCircuitLiveWeather("belgium");
    assert.equal(spaWeather.air_temp, 19);
    assert.equal(spaWeather.track_temp, 23);
    assert.equal(spaWeather.humidity, "82%");
    assert.equal(spaWeather.wind, "24 km/h");
    assert.equal(spaWeather.rain_chance, 85);
    assert.equal(spaWeather.icon, "🌧️");

    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(() => fetchCircuitLiveWeather("monza"), /Open-Meteo HTTP 503/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("openF1Service: fetchOpenF1RaceReplay & fetchOpenF1TeammateTelemetry parse mocked FIA feeds", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (url.includes("/sessions?")) {
        return {
          ok: true,
          json: async () => [
            { session_key: 9472, circuit_short_name: "Melbourne", location: "Melbourne", country_name: "Australia" },
          ],
        };
      }
      if (url.includes("/drivers?")) {
        return {
          ok: true,
          json: async () => [
            { driver_number: 1, name_acronym: "VER", full_name: "Max Verstappen", team_name: "Red Bull Racing", country_code: "NED" },
            { driver_number: 16, name_acronym: "LEC", full_name: "Charles Leclerc", team_name: "Ferrari", country_code: "MON" },
          ],
        };
      }
      if (url.includes("/laps?") && !url.includes("driver_number=")) {
        return {
          ok: true,
          json: async () => [
            { driver_number: 1, lap_number: 1, lap_duration: 84.5, duration_sector_1: 27.5, duration_sector_2: 33.0, duration_sector_3: 24.0 },
            { driver_number: 16, lap_number: 1, lap_duration: 84.0, duration_sector_1: 27.2, duration_sector_2: 32.8, duration_sector_3: 24.0 },
          ],
        };
      }
      if (url.includes("/stints?")) {
        return {
          ok: true,
          json: async () => [
            { driver_number: 1, lap_start: 1, compound: "MEDIUM", tyre_age_at_start: 0 },
            { driver_number: 16, lap_start: 1, compound: "SOFT", tyre_age_at_start: 0 },
          ],
        };
      }
      if (url.includes("/weather?")) {
        return {
          ok: true,
          json: async () => [{ air_temperature: 22.4, track_temperature: 34.2, humidity: 48, wind_speed: 3.0, rainfall: 0 }],
        };
      }
      if (url.includes("/laps?") && url.includes("driver_number=")) {
        return {
          ok: true,
          json: async () => [{ lap_number: 5, lap_duration: 81.2, date_start: "2024-03-24T04:10:00.000Z" }],
        };
      }
      if (url.includes("/car_data?")) {
        const isD1 = url.includes("driver_number=1&");
        return {
          ok: true,
          json: async () => [
            { speed: isD1 ? 312 : 304, throttle: 100, brake: 0, n_gear: 8, drs: 12 },
            { speed: isD1 ? 145 : 140, throttle: 40, brake: 1, n_gear: 3, drs: 0 },
          ],
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    };

    const replay = await fetchOpenF1RaceReplay("australia", 2024);
    assert.equal(replay.maxLaps, 1);
    assert.equal(replay.framesByLap[1][0].code, "LEC");
    assert.equal(replay.framesByLap[1][0].gap, "LEADER");
    assert.equal(replay.framesByLap[1][0].tire, "S");
    assert.equal(replay.framesByLap[1][1].code, "VER");
    assert.equal(replay.framesByLap[1][1].interval, "+0.500s");

    const tel = await fetchOpenF1TeammateTelemetry("australia", "VER", "LEC", 2024);
    assert.equal(tel.d1Code, "VER");
    assert.equal(tel.d2Code, "LEC");
    assert.equal(tel.points.length, 40);
    assert.ok(tel.points[0].d1_speed > tel.points[0].d2_speed);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
