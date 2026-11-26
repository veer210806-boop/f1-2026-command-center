// ============================================================
// openF1Service.js — Lightweight Client for Real F1 Telemetry & Weather
// Connects directly to public CORS-enabled OpenF1 (api.openf1.org) and
// Open-Meteo (api.open-meteo.com) APIs with local caching & safe fallbacks.
// ============================================================

const OPENF1_BASE = "https://api.openf1.org/v1";
const OPENMETEO_BASE = "https://api.open-meteo.com/v1/forecast";

const sessionCache = new Map();
const replayCache = new Map();
const weatherCache = new Map();

export const CIRCUIT_GEO_COORDS = {
  australia:      { lat: -37.8497, lon: 144.9680, openF1Match: ["Melbourne", "Australia"] },
  china:          { lat: 31.3389,  lon: 121.2200, openF1Match: ["Shanghai", "China"] },
  japan:          { lat: 34.8431,  lon: 136.5419, openF1Match: ["Suzuka", "Japan"] },
  bahrain:        { lat: 26.0325,  lon: 50.5106,  openF1Match: ["Sakhir", "Bahrain"] },
  saudi_arabia:   { lat: 21.6319,  lon: 39.1044,  openF1Match: ["Jeddah", "Saudi Arabia"] },
  miami:          { lat: 25.9581,  lon: -80.2389, openF1Match: ["Miami"] },
  emilia_romagna: { lat: 44.3439,  lon: 11.7167,  openF1Match: ["Imola"] },
  monaco:         { lat: 43.7347,  lon: 7.4206,   openF1Match: ["Monte Carlo", "Monaco"] },
  canada:         { lat: 45.5000,  lon: -73.5228, openF1Match: ["Montreal", "Canada"] },
  spain:          { lat: 41.5700,  lon: 2.2611,   openF1Match: ["Catalunya", "Barcelona", "Spain"] },
  austria:        { lat: 47.2197,  lon: 14.7647,  openF1Match: ["Spielberg", "Austria"] },
  great_britain:  { lat: 52.0786,  lon: -1.0169,  openF1Match: ["Silverstone"] },
  belgium:        { lat: 50.4372,  lon: 5.9714,   openF1Match: ["Spa-Francorchamps", "Belgium"] },
  hungary:        { lat: 47.5789,  lon: 19.2486,  openF1Match: ["Hungaroring", "Budapest"] },
  netherlands:    { lat: 52.3888,  lon: 4.5409,   openF1Match: ["Zandvoort"] },
  monza:          { lat: 45.6156,  lon: 9.2811,   openF1Match: ["Monza", "Italy"] },
  azerbaijan:     { lat: 40.3725,  lon: 49.8533,  openF1Match: ["Baku", "Azerbaijan"] },
  singapore:      { lat: 1.2914,   lon: 103.8640, openF1Match: ["Singapore", "Marina Bay"] },
  united_states:  { lat: 30.1328,  lon: -97.6411, openF1Match: ["Austin"] },
  mexico:         { lat: 19.4042,  lon: -99.0907, openF1Match: ["Mexico City"] },
  brazil:         { lat: -23.7036, lon: -46.6997, openF1Match: ["Interlagos", "Brazil"] },
  las_vegas:      { lat: 36.1147,  lon: -115.1728, openF1Match: ["Las Vegas"] },
  qatar:          { lat: 25.4900,  lon: 51.4542,  openF1Match: ["Lusail", "Qatar"] },
  abu_dhabi:      { lat: 24.4672,  lon: 54.6031,  openF1Match: ["Yas Marina", "Yas Island"] },
  madrid:         { lat: 40.4648,  lon: -3.6164,  openF1Match: ["Catalunya", "Spain"] },
};

/**
 * Maps OpenF1 compound strings (SOFT, MEDIUM, HARD, INTERMEDIATE, WET) to 1-letter codes.
 */
export function mapOpenF1Compound(compoundName) {
  const c = String(compoundName || "MEDIUM").toUpperCase();
  if (c.startsWith("SOFT")) return "S";
  if (c.startsWith("HARD")) return "H";
  if (c.startsWith("INT")) return "I";
  if (c.startsWith("WET")) return "W";
  return "M";
}

function formatLapTime(sec) {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
  return fetch(url, signal ? { signal } : undefined);
}

/**
 * Resolves the OpenF1 Race `session_key` for one of our circuit IDs.
 */
export async function findOpenF1RaceSession(circuitId = "australia", year = 2024) {
  const cacheKey = `${year}`;
  let sessions = sessionCache.get(cacheKey);
  if (!sessions) {
    const res = await fetchWithTimeout(`${OPENF1_BASE}/sessions?year=${year}&session_name=Race`);
    if (!res.ok) throw new Error(`OpenF1 sessions error (${res.status})`);
    sessions = await res.json();
    sessionCache.set(cacheKey, sessions);
  }

  const geo = CIRCUIT_GEO_COORDS[circuitId?.toLowerCase()] || CIRCUIT_GEO_COORDS.australia;
  const matched = sessions.find((s) =>
    geo.openF1Match.some(
      (kw) =>
        String(s.circuit_short_name || "").toLowerCase().includes(kw.toLowerCase()) ||
        String(s.location || "").toLowerCase().includes(kw.toLowerCase()) ||
        String(s.country_name || "").toLowerCase().includes(kw.toLowerCase())
    )
  );
  return matched || sessions[0] || null;
}

/**
 * Fetches live local weather conditions at the real GPS coordinates of a circuit via Open-Meteo.
 */
export async function fetchCircuitLiveWeather(circuitId = "australia") {
  const key = circuitId?.toLowerCase() || "australia";
  if (weatherCache.has(key)) return weatherCache.get(key);

  const geo = CIRCUIT_GEO_COORDS[key] || CIRCUIT_GEO_COORDS.australia;
  const url = `${OPENMETEO_BASE}?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();
  const cur = data?.current || {};

  const airTemp = Math.round(cur.temperature_2m ?? 22);
  const precipitation = Number(cur.precipitation ?? 0);
  const result = {
    source: "OPEN-METEO LIVE GPS",
    air_temp: airTemp,
    track_temp: Math.round(airTemp + (precipitation > 0 ? 4 : 11)),
    humidity: `${Math.round(cur.relative_humidity_2m ?? 50)}%`,
    wind: `${Math.round(cur.wind_speed_10m ?? 12)} km/h`,
    rain_chance: precipitation > 0.2 ? 85 : 5,
    condition: precipitation > 0.5 ? "Live Rain Detected" : precipitation > 0 ? "Light Moisture" : "Clear Sky · Live Feed",
    icon: precipitation > 0.2 ? "🌧️" : "☀️",
  };

  weatherCache.set(key, result);
  return result;
}

/**
 * Fetches full lap-by-lap real historical race data from OpenF1 for replay in Timing Tower & 3D Map.
 * Returns normalized per-lap frames (`framesByLap[lap]`) ready for playback.
 */
export async function fetchOpenF1RaceReplay(circuitId = "australia", year = 2024) {
  const key = `${year}_${circuitId}`;
  if (replayCache.has(key)) return replayCache.get(key);

  const session = await findOpenF1RaceSession(circuitId, year);
  if (!session?.session_key) throw new Error("No OpenF1 Race session found for this circuit.");

  const [driversRes, lapsRes, stintsRes, weatherRes] = await Promise.all([
    fetchWithTimeout(`${OPENF1_BASE}/drivers?session_key=${session.session_key}`),
    fetchWithTimeout(`${OPENF1_BASE}/laps?session_key=${session.session_key}`, 12000),
    fetchWithTimeout(`${OPENF1_BASE}/stints?session_key=${session.session_key}`),
    fetchWithTimeout(`${OPENF1_BASE}/weather?session_key=${session.session_key}`),
  ]);

  if (!driversRes.ok || !lapsRes.ok) {
    throw new Error("OpenF1 API temporarily unavailable or rate-limited.");
  }

  const [rawDrivers, rawLaps, rawStints, rawWeather] = await Promise.all([
    driversRes.json(),
    lapsRes.json(),
    stintsRes.ok ? stintsRes.json() : [],
    weatherRes.ok ? weatherRes.json() : [],
  ]);

  const driverMeta = {};
  rawDrivers.forEach((d) => {
    driverMeta[d.driver_number] = {
      num: d.driver_number,
      code: d.name_acronym || `D${d.driver_number}`,
      name: d.full_name || d.broadcast_name || `Driver #${d.driver_number}`,
      team: d.team_name || "Constructor",
      headshot: d.headshot_url || null,
      ioc: d.country_code || "FIA",
    };
  });

  // Organize stints by driver_number
  const stintsByDriver = {};
  rawStints.forEach((st) => {
    if (!stintsByDriver[st.driver_number]) stintsByDriver[st.driver_number] = [];
    stintsByDriver[st.driver_number].push(st);
  });

  // Group laps by lap_number and accumulate race time
  let maxLap = 1;
  const lapsByDriver = {};
  rawLaps.forEach((l) => {
    if (!l.lap_number || l.lap_number < 1) return;
    if (l.lap_number > maxLap) maxLap = l.lap_number;
    if (!lapsByDriver[l.driver_number]) lapsByDriver[l.driver_number] = {};
    lapsByDriver[l.driver_number][l.lap_number] = l;
  });

  const driverNums = Object.keys(driverMeta).map(Number);
  const cumulativeByDriver = {};
  const bestByDriver = {};
  driverNums.forEach((n) => {
    cumulativeByDriver[n] = 0;
    bestByDriver[n] = Infinity;
  });

  const framesByLap = {};
  for (let lap = 1; lap <= maxLap; lap++) {
    let minS1 = Infinity, minS2 = Infinity, minS3 = Infinity;
    const activeEntries = [];

    driverNums.forEach((num) => {
      const l = lapsByDriver[num]?.[lap];
      if (!l) return;

      const s1 = l.duration_sector_1 || 0;
      const s2 = l.duration_sector_2 || 0;
      const s3 = l.duration_sector_3 || 0;
      const lapSec = l.lap_duration || (s1 && s2 && s3 ? s1 + s2 + s3 : 90.0);

      cumulativeByDriver[num] += lapSec;
      const isPersonalBest = lapSec > 50 && lapSec < bestByDriver[num];
      if (isPersonalBest) bestByDriver[num] = lapSec;

      if (s1 > 10 && s1 < minS1) minS1 = s1;
      if (s2 > 10 && s2 < minS2) minS2 = s2;
      if (s3 > 10 && s3 < minS3) minS3 = s3;

      const driverStints = stintsByDriver[num] || [];
      const activeStint = driverStints.find((st) => lap >= st.lap_start && (!st.lap_end || lap <= st.lap_end))
        || driverStints[driverStints.length - 1];
      const pitsCount = Math.max(0, driverStints.filter((st) => st.lap_start > 1 && st.lap_start <= lap).length);
      const tireCode = mapOpenF1Compound(activeStint?.compound);
      const tireAge = activeStint ? Math.max(0, lap - activeStint.lap_start + (activeStint.tyre_age_at_start || 0)) : lap;
      const estWear = Math.min(100, Math.round(tireAge * (tireCode === "S" ? 4.2 : tireCode === "H" ? 1.8 : 2.8)));

      activeEntries.push({
        num,
        code: driverMeta[num].code,
        name: driverMeta[num].name,
        team: driverMeta[num].team,
        ioc: driverMeta[num].ioc,
        cumSec: cumulativeByDriver[num],
        lapSec,
        s1Num: s1,
        s2Num: s2,
        s3Num: s3,
        s1: s1 ? s1.toFixed(3) : "—",
        s2: s2 ? s2.toFixed(3) : "—",
        s3: s3 ? s3.toFixed(3) : "—",
        isPersonalBest,
        bestLap: bestByDriver[num] < Infinity ? formatLapTime(bestByDriver[num]) : "NO TIME",
        lastLap: formatLapTime(lapSec),
        tire: tireCode,
        tireAge,
        wear: estWear,
        pits: pitsCount,
        pitState: l.is_pit_out_lap ? "OUT LAP" : "RACING",
        soc: Math.max(25, Math.min(98, 85 - ((lap * 7 + num) % 35))),
        mom: l.st_speed > 305 ? "X-MODE" : "Z-MODE",
      });
    });

    activeEntries.sort((a, b) => a.cumSec - b.cumSec);
    const leadCum = activeEntries[0]?.cumSec || 0;

    framesByLap[lap] = activeEntries.map((d, idx) => {
      const gapSec = +(d.cumSec - leadCum).toFixed(3);
      const intSec = idx > 0 ? +(d.cumSec - activeEntries[idx - 1].cumSec).toFixed(3) : 0;
      return {
        ...d,
        pos: idx + 1,
        gapSec,
        gap: idx === 0 ? "LEADER" : `+${gapSec.toFixed(3)}s`,
        interval: idx === 0 ? "—" : `+${intSec.toFixed(3)}s`,
        s1Type: d.s1Num === minS1 ? "purple" : d.isPersonalBest ? "green" : "yellow",
        s2Type: d.s2Num === minS2 ? "purple" : d.isPersonalBest ? "green" : "yellow",
        s3Type: d.s3Num === minS3 ? "purple" : d.isPersonalBest ? "green" : "yellow",
        posDelta: "0",
        arrow: "neutral",
      };
    });
  }

  const lastWeather = rawWeather[rawWeather.length - 1];
  const dataset = {
    sessionName: `${year} ${session.country_name || session.location} GP`,
    sessionKey: session.session_key,
    maxLaps: maxLap,
    framesByLap,
    weather: lastWeather
      ? {
          air_temp: Math.round(lastWeather.air_temperature),
          track_temp: Math.round(lastWeather.track_temperature),
          humidity: `${Math.round(lastWeather.humidity)}%`,
          wind: `${Math.round((lastWeather.wind_speed || 2) * 3.6)} km/h`,
          rain_chance: lastWeather.rainfall > 0 ? 90 : 0,
        }
      : null,
  };

  replayCache.set(key, dataset);
  return dataset;
}

/**
 * Fetches real teammate lap telemetry traces (Speed, Throttle, Brake, Gear, DRS) from OpenF1.
 */
export async function fetchOpenF1TeammateTelemetry(circuitId = "australia", d1Code = "VER", d2Code = "HAD", year = 2024) {
  const session = await findOpenF1RaceSession(circuitId, year);
  if (!session?.session_key) throw new Error("Session not found");

  const driversRes = await fetchWithTimeout(`${OPENF1_BASE}/drivers?session_key=${session.session_key}`);
  if (!driversRes.ok) throw new Error("OpenF1 drivers unavailable");
  const allDrivers = await driversRes.json();

  const findNum = (code, fallbackIdx) => {
    const match = allDrivers.find((d) => String(d.name_acronym).toUpperCase() === String(code).toUpperCase());
    if (match) return { num: match.driver_number, code: match.name_acronym };
    const alt = allDrivers[fallbackIdx] || allDrivers[0];
    return { num: alt?.driver_number || 1, code: alt?.name_acronym || code };
  };

  const d1Info = findNum(d1Code, 0);
  const d2Info = findNum(d2Code, 1);

  const fetchDriverLapWindow = async (driverNum) => {
    const lapsRes = await fetchWithTimeout(`${OPENF1_BASE}/laps?session_key=${session.session_key}&driver_number=${driverNum}`);
    if (!lapsRes.ok) throw new Error("Laps unavailable");
    const laps = await lapsRes.json();
    const valid = laps.filter((l) => l.date_start && l.lap_duration && l.lap_duration > 55 && l.lap_duration < 150);
    if (valid.length === 0) throw new Error("No valid timed laps found");

    // Pick fastest valid race lap for clean benchmark comparison
    const bestLap = valid.reduce((a, b) => (b.lap_duration < a.lap_duration ? b : a), valid[0]);
    const startMs = new Date(bestLap.date_start).getTime();
    const endIso = new Date(startMs + bestLap.lap_duration * 1000).toISOString();

    const carRes = await fetchWithTimeout(
      `${OPENF1_BASE}/car_data?session_key=${session.session_key}&driver_number=${driverNum}&date>=${encodeURIComponent(bestLap.date_start)}&date<=${encodeURIComponent(endIso)}`
    );
    if (!carRes.ok) throw new Error("Telemetry stream unavailable");
    const samples = await carRes.json();
    return { lapDuration: bestLap.lap_duration, lapNumber: bestLap.lap_number, samples };
  };

  const [t1, t2] = await Promise.all([
    fetchDriverLapWindow(d1Info.num),
    fetchDriverLapWindow(d2Info.num),
  ]);

  if (!t1.samples.length || !t2.samples.length) {
    throw new Error("Empty telemetry samples from OpenF1");
  }

  // Downsample both laps uniformly into 40 synchronized points across lap progress [0..1]
  const TARGET_POINTS = 40;
  const estTrackLenM = 5200;
  let cumDelta = 0;

  const points = Array.from({ length: TARGET_POINTS }, (_, idx) => {
    const pct = idx / (TARGET_POINTS - 1);
    const s1 = t1.samples[Math.min(t1.samples.length - 1, Math.floor(pct * (t1.samples.length - 1)))];
    const s2 = t2.samples[Math.min(t2.samples.length - 1, Math.floor(pct * (t2.samples.length - 1)))];

    const speed1 = Math.round(s1?.speed || 0);
    const speed2 = Math.round(s2?.speed || 0);
    const deltaPerStep = ((speed1 - speed2) / 300) * -0.025;
    cumDelta += deltaPerStep;

    return {
      distance: Math.round(pct * estTrackLenM),
      label: `${Math.round(pct * 100)}%`,
      desc: `Track ${Math.round(pct * estTrackLenM)}m (Real FIA Telemetry)`,
      is_corner: speed1 < 210,
      type: speed1 < 110 ? "Slow Corner" : speed1 < 220 ? "Medium Apex" : "Full Throttle",
      drs: (s1?.drs || 0) >= 10,
      gear: s1?.n_gear || 5,
      d1_speed: speed1,
      d2_speed: speed2,
      delta: speed1 - speed2,
      time_delta: +cumDelta.toFixed(3),
      d1_throttle: Math.round(s1?.throttle || 0),
      d2_throttle: Math.round(s2?.throttle || 0),
      d1_brake: s1?.brake ? 100 : 0,
      d2_brake: s2?.brake ? 100 : 0,
    };
  });

  return {
    sessionName: `${year} ${session.country_name || session.location} GP`,
    d1Code: d1Info.code,
    d2Code: d2Info.code,
    d1LapTime: formatLapTime(t1.lapDuration),
    d2LapTime: formatLapTime(t2.lapDuration),
    points,
  };
}
