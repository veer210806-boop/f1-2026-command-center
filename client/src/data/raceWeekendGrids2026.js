// ============================================================
// raceWeekendGrids2026.js — Authentic 2026 Grand Prix Grids & Lap Matrix Engine
// Generates realistic Qualifying Grids, Lap 1 Start Scrambles, and
// Lap-by-Lap "Tour par Tour" Matrix Data for all 24 Championship Rounds.
//
// Technical Rules:
// 1. Top Tier (McLaren, Ferrari, Red Bull, Mercedes) fight for Pole & Podiums.
// 2. Upper Midfield (Aston Martin, Williams, Audi, Alpine) can achieve
//    exceptional qualifying or shock podiums on specific tracks (Monaco, Monza, Baku, Brazil).
// 3. Lower Tier (Haas, Racing Bulls, Cadillac) never lead or take pole; fight P10-P22.
// 4. Max Verstappen is driver #3.
// 5. Lap 1 features authentic F1 race start chaos with 6-12 position changes.
// ============================================================

export const DRIVER_META = {
  NOR: { num: 1,  name: "L. Norris",      team: "McLaren",         flag: "🇬🇧", ioc: "GBR", tier: 1 },
  VER: { num: 3,  name: "M. Verstappen",  team: "Red Bull Racing", flag: "🇳🇱", ioc: "NLD", tier: 1 },
  RUS: { num: 63, name: "G. Russell",     team: "Mercedes",        flag: "🇬🇧", ioc: "GBR", tier: 1 },
  LEC: { num: 16, name: "C. Leclerc",     team: "Ferrari",         flag: "🇲🇨", ioc: "MCO", tier: 1 },
  HAM: { num: 44, name: "L. Hamilton",    team: "Ferrari",         flag: "🇬🇧", ioc: "GBR", tier: 1 },
  PIA: { num: 81, name: "O. Piastri",     team: "McLaren",         flag: "🇦🇺", ioc: "AUS", tier: 1 },
  ANT: { num: 12, name: "K. Antonelli",   team: "Mercedes",        flag: "🇮🇹", ioc: "ITA", tier: 1 },
  HAD: { num: 6,  name: "I. Hadjar",      team: "Red Bull Racing", flag: "🇫🇷", ioc: "FRA", tier: 1 },

  ALO: { num: 14, name: "F. Alonso",      team: "Aston Martin",    flag: "🇪🇸", ioc: "ESP", tier: 2 },
  SAI: { num: 55, name: "C. Sainz Jr.",   team: "Williams",        flag: "🇪🇸", ioc: "ESP", tier: 2 },
  ALB: { num: 23, name: "A. Albon",       team: "Williams",        flag: "🇹🇭", ioc: "THA", tier: 2 },
  STR: { num: 18, name: "L. Stroll",      team: "Aston Martin",    flag: "🇨🇦", ioc: "CAN", tier: 2 },
  GAS: { num: 10, name: "P. Gasly",       team: "Alpine",          flag: "🇫🇷", ioc: "FRA", tier: 2 },
  COL: { num: 43, name: "F. Colapinto",   team: "Alpine",          flag: "🇦🇷", ioc: "ARG", tier: 2 },
  HUL: { num: 27, name: "N. Hülkenberg",  team: "Audi",            flag: "🇩🇪", ioc: "DEU", tier: 2 },
  BOR: { num: 5,  name: "G. Bortoleto",   team: "Audi",            flag: "🇧🇷", ioc: "BRA", tier: 2 },

  OCO: { num: 31, name: "E. Ocon",        team: "Haas",            flag: "🇫🇷", ioc: "FRA", tier: 3 },
  BEA: { num: 87, name: "O. Bearman",     team: "Haas",            flag: "🇬🇧", ioc: "GBR", tier: 3 },
  LAW: { num: 30, name: "L. Lawson",      team: "Racing Bulls",    flag: "🇳🇿", ioc: "NZL", tier: 3 },
  LIN: { num: 41, name: "A. Lindblad",    team: "Racing Bulls",    flag: "🇬🇧", ioc: "GBR", tier: 3 },
  PER: { num: 11, name: "S. Pérez",       team: "Cadillac",        flag: "🇲🇽", ioc: "MEX", tier: 3 },
  BOT: { num: 77, name: "V. Bottas",      team: "Cadillac",        flag: "🇫🇮", ioc: "FIN", tier: 3 },
};

// ── 24 GRAND PRIX AUTHENTIC QUALIFYING & RACE BLUEPRINTS ─────────────
export const GRAND_PRIX_CONFIGS = {
  // Round 01: AUSTRALIAN GP (Albert Park)
  australia: {
    round: 1,
    name: "Australian Grand Prix",
    laps: 58,
    poleTime: "1:16.732",
    poleDriver: "NOR",
    grid: [
      "NOR", "VER", "RUS", "LEC", "HAM", "PIA", "SAI", "ANT", "ALO", "ALB",
      "HAD", "HUL", "STR", "GAS", "PER", "OCO", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "NOR", pos: 1, reason: "Turn 1 Inside Line Lunge" },
      { winner: "LEC", loser: "RUS", pos: 3, reason: "Turn 1 Out-braking Move" },
      { winner: "PIA", loser: "HAM", pos: 5, reason: "Turn 3 Switchback" },
      { winner: "ALO", loser: "ANT", pos: 8, reason: "Turn 4 Around Outside" },
      { winner: "HUL", loser: "HAD", pos: 11, reason: "Turn 1 Slipstream" },
      { winner: "GAS", loser: "STR", pos: 13, reason: "Turn 6 Inside Dive" },
      { winner: "BEA", loser: "LAW", pos: 17, reason: "Turn 3 Divebomb" },
      { winner: "BOR", loser: "BOT", pos: 19, reason: "Turn 9 Sweeper" },
    ],
    raceMoments: [
      { lap: 3, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "DRS Main Straight Strike" }] },
      { lap: 12, overtakes: [{ winner: "HAM", loser: "PIA", pos: 5, reason: "Turn 9 DRS Pass" }] },
      { lap: 18, pits: [{ driver: "PIA", compound: "H" }, { driver: "BEA", compound: "H" }] },
      { lap: 21, pits: [{ driver: "VER", compound: "H" }, { driver: "RUS", compound: "H" }], overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Pit Stop Rejoin" }] },
      { lap: 24, pits: [{ driver: "NOR", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 34, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "MOM 350kW Electric Overdrive" }] },
      { lap: 42, overtakes: [{ winner: "SAI", loser: "ANT", pos: 7, reason: "Turn 11 Late Braking" }] },
      { lap: 50, overtakes: [{ winner: "HAM", loser: "LEC", pos: 3, reason: "DRS Main Straight" }] },
    ]
  },

  // Round 02: CHINESE GP (Shanghai)
  china: {
    round: 2,
    name: "Chinese Grand Prix",
    laps: 56,
    poleTime: "1:33.660",
    poleDriver: "VER",
    grid: [
      "VER", "HAM", "NOR", "LEC", "PIA", "RUS", "ALO", "ANT", "SAI", "HAD",
      "ALB", "STR", "HUL", "GAS", "OCO", "PER", "LAW", "BOT", "BOR", "BEA",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "NOR", loser: "HAM", pos: 2, reason: "Turn 1 Snail Corner Cutback" },
      { winner: "RUS", loser: "PIA", pos: 5, reason: "Turn 6 Hairpin Inside" },
      { winner: "SAI", loser: "ANT", pos: 8, reason: "Turn 1 Sweep" },
      { winner: "ALB", loser: "HAD", pos: 10, reason: "Turn 14 Heavy Braking" },
      { winner: "GAS", loser: "HUL", pos: 13, reason: "Turn 1 Cutback" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Turn 14 Slipstream" },
      { winner: "BEA", loser: "BOR", pos: 19, reason: "Turn 6 Braking" },
    ],
    raceMoments: [
      { lap: 6, overtakes: [{ winner: "LEC", loser: "HAM", pos: 3, reason: "Back Straight 1.2km DRS" }] },
      { lap: 15, pits: [{ driver: "HAM", compound: "H" }, { driver: "SAI", compound: "H" }] },
      { lap: 19, pits: [{ driver: "VER", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 28, overtakes: [{ winner: "PIA", loser: "RUS", pos: 5, reason: "Turn 14 Hairpin Lunge" }] },
      { lap: 39, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 14 Outbraking" }] },
      { lap: 44, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Back Straight DRS Flyby" }] },
    ]
  },

  // Round 03: JAPANESE GP (Suzuka)
  japan: {
    round: 3,
    name: "Japanese Grand Prix",
    laps: 53,
    poleTime: "1:28.197",
    poleDriver: "VER",
    grid: [
      "VER", "NOR", "PIA", "RUS", "LEC", "HAM", "HAD", "ANT", "SAI", "ALO",
      "ALB", "HUL", "STR", "GAS", "LAW", "OCO", "BOR", "BEA", "PER", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "PIA", loser: "NOR", pos: 2, reason: "Turn 1 Outside Line Hook" },
      { winner: "HAM", loser: "LEC", pos: 5, reason: "Turn 2 Traction Drive" },
      { winner: "SAI", loser: "ANT", pos: 8, reason: "Dunlop Curve Sweep" },
      { winner: "ALO", loser: "HAD", pos: 7, reason: "Degner 1 Entry" },
      { winner: "ALB", loser: "HAD", pos: 9, reason: "Hairpin Dive" },
      { winner: "OCO", loser: "LAW", pos: 15, reason: "Chicane Outbraking" },
      { winner: "PER", loser: "BEA", pos: 18, reason: "130R Slipstream" },
    ],
    raceMoments: [
      { lap: 9, overtakes: [{ winner: "NOR", loser: "PIA", pos: 2, reason: "Turn 1 DRS Pass" }] },
      { lap: 17, pits: [{ driver: "NOR", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 20, pits: [{ driver: "VER", compound: "H" }, { driver: "PIA", compound: "H" }] },
      { lap: 31, overtakes: [{ winner: "LEC", loser: "HAM", pos: 4, reason: "Casio Triangle Braking" }] },
      { lap: 45, overtakes: [{ winner: "RUS", loser: "PIA", pos: 3, reason: "130R Gutsy Outside Pass" }] },
    ]
  },

  // Round 04: BAHRAIN GP (Sakhir)
  bahrain: {
    round: 4,
    name: "Bahrain Grand Prix",
    laps: 57,
    poleTime: "1:29.179",
    poleDriver: "LEC",
    grid: [
      "LEC", "VER", "NOR", "RUS", "HAM", "PIA", "ANT", "ALO", "SAI", "HAD",
      "ALB", "STR", "HUL", "GAS", "PER", "OCO", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "LEC", pos: 1, reason: "Turn 1 Down the Inside" },
      { winner: "HAM", loser: "RUS", pos: 4, reason: "Turn 4 Outside Hold" },
      { winner: "ALO", loser: "ANT", pos: 7, reason: "Turn 8 Hairpin Dive" },
      { winner: "SAI", loser: "ANT", pos: 8, reason: "Turn 10 Cutback" },
      { winner: "HAD", loser: "ALB", pos: 10, reason: "Turn 1 DRS zone entry" },
      { winner: "GAS", loser: "HUL", pos: 13, reason: "Turn 4 Sweeper" },
      { winner: "BEA", loser: "LAW", pos: 17, reason: "Turn 1 Lockup evasion" },
    ],
    raceMoments: [
      { lap: 4, overtakes: [{ winner: "LEC", loser: "VER", pos: 1, reason: "Turn 1 DRS Reclaim" }] },
      { lap: 5, overtakes: [{ winner: "VER", loser: "LEC", pos: 1, reason: "Turn 4 Counter-strike" }] },
      { lap: 14, pits: [{ driver: "LEC", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 15, pits: [{ driver: "VER", compound: "H" }, { driver: "HAM", compound: "H" }] },
      { lap: 28, overtakes: [{ winner: "NOR", loser: "LEC", pos: 2, reason: "Turn 1 Inside Line" }] },
      { lap: 46, overtakes: [{ winner: "RUS", loser: "HAM", pos: 4, reason: "Turn 1 DRS Pass" }] },
    ]
  },

  // Round 05: SAUDI ARABIA GP (Jeddah)
  saudi_arabia: {
    round: 5,
    name: "Saudi Arabian Grand Prix",
    laps: 50,
    poleTime: "1:27.472",
    poleDriver: "VER",
    grid: [
      "VER", "RUS", "LEC", "NOR", "PIA", "HAM", "ANT", "ALB", "SAI", "ALO",
      "HAD", "STR", "HUL", "PER", "GAS", "OCO", "LAW", "BOT", "BEA", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "LEC", loser: "RUS", pos: 2, reason: "Turn 1-2 Tight Chicane" },
      { winner: "PIA", loser: "NOR", pos: 4, reason: "Turn 4 Banking Launch" },
      { winner: "ALB", loser: "ANT", pos: 7, reason: "Turn 13 Banking Outside" },
      { winner: "ALO", loser: "SAI", pos: 9, reason: "Turn 22 High Speed Lunge" },
      { winner: "PER", loser: "HUL", pos: 13, reason: "Turn 27 Final Hairpin" },
      { winner: "OCO", loser: "GAS", pos: 15, reason: "Main Straight Slipstream" },
    ],
    raceMoments: [
      { lap: 7, overtakes: [{ winner: "NOR", loser: "PIA", pos: 4, reason: "Turn 27 DRS Pass" }] },
      { lap: 16, pits: [{ driver: "LEC", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 18, pits: [{ driver: "VER", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 32, overtakes: [{ winner: "HAM", loser: "PIA", pos: 5, reason: "Turn 1 DRS Pass" }] },
      { lap: 41, overtakes: [{ winner: "NOR", loser: "RUS", pos: 3, reason: "Turn 27 Cutback Move" }] },
    ]
  },

  // Round 06: MIAMI GP (Miami)
  miami: {
    round: 6,
    name: "Miami Grand Prix",
    laps: 57,
    poleTime: "1:27.241",
    poleDriver: "NOR",
    grid: [
      "NOR", "LEC", "VER", "HAM", "RUS", "PIA", "SAI", "ANT", "ALO", "HAD",
      "ALB", "HUL", "STR", "GAS", "OCO", "PER", "LAW", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "LEC", pos: 2, reason: "Turn 1 Late Apex Strike" },
      { winner: "PIA", loser: "RUS", pos: 5, reason: "Turn 7 Complex" },
      { winner: "ANT", loser: "SAI", pos: 7, reason: "Turn 11 Hard Braking" },
      { winner: "HAD", loser: "ALO", pos: 9, reason: "Turn 17 Hairpin Dive" },
      { winner: "HUL", loser: "ALB", pos: 11, reason: "Long Straight DRS" },
      { winner: "BEA", loser: "LAW", pos: 17, reason: "Turn 1 Swerve" },
    ],
    raceMoments: [
      { lap: 8, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 17 Long Straight DRS" }] },
      { lap: 22, pits: [{ driver: "VER", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 28, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 1 Outbraking after Safety Car" }] },
      { lap: 44, overtakes: [{ winner: "PIA", loser: "HAM", pos: 4, reason: "Turn 17 Inside Pass" }] },
    ]
  },

  // Round 07: EMILIA ROMAGNA GP (Imola)
  emilia_romagna: {
    round: 7,
    name: "Emilia Romagna Grand Prix",
    laps: 63,
    poleTime: "1:14.746",
    poleDriver: "LEC",
    grid: [
      "LEC", "VER", "NOR", "HAM", "RUS", "PIA", "SAI", "ALO", "ANT", "HAD",
      "ALB", "HUL", "STR", "GAS", "OCO", "PER", "LAW", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "NOR", loser: "VER", pos: 2, reason: "Tamburello Chicane Sweep" },
      { winner: "RUS", loser: "HAM", pos: 4, reason: "Villeneuve Chicane" },
      { winner: "SAI", loser: "PIA", pos: 6, reason: "Tosa Hairpin Dive" },
      { winner: "ANT", loser: "ALO", pos: 8, reason: "Piratella Entry" },
      { winner: "STR", loser: "HUL", pos: 12, reason: "Acque Minerali Outbraking" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Variante Alta Curb Ride" },
    ],
    raceMoments: [
      { lap: 11, overtakes: [{ winner: "VER", loser: "NOR", pos: 2, reason: "Tamburello DRS Strike" }] },
      { lap: 22, pits: [{ driver: "LEC", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 35, overtakes: [{ winner: "VER", loser: "LEC", pos: 1, reason: "Rivazza Exit Drag" }] },
      { lap: 51, overtakes: [{ winner: "HAM", loser: "RUS", pos: 4, reason: "Tamburello Inside Lunge" }] },
    ]
  },

  // Round 08: MONACO GP (Monte Carlo) — EXCEPTION RACE!
  // Fernando Alonso on Row 2 with masterclass qualifying!
  // Minimal overtaking, qualifying & pit strategy is king.
  monaco: {
    round: 8,
    name: "Monaco Grand Prix",
    laps: 78,
    poleTime: "1:10.270",
    poleDriver: "LEC",
    grid: [
      "LEC", "NOR", "ALO", "VER", "HAM", "RUS", "PIA", "SAI", "ANT", "HAD",
      "ALB", "GAS", "HUL", "OCO", "STR", "LAW", "BEA", "PER", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      // Realistic Monaco start: only Sainte Dévote and Mirabeau moves
      { winner: "VER", loser: "ALO", pos: 3, reason: "Sainte Dévote Turn 1 Inside Squeeze" },
      { winner: "SAI", loser: "PIA", pos: 7, reason: "Sainte Dévote Outside Hold" },
      { winner: "ANT", loser: "HAD", pos: 9, reason: "Beau Rivage Hill Pull" },
      { winner: "GAS", loser: "ALB", pos: 11, reason: "Mirabeau Haute Dive" },
      { winner: "BEA", loser: "PER", pos: 17, reason: "Grand Hotel Hairpin Tap" },
    ],
    raceMoments: [
      { lap: 29, pits: [{ driver: "ALO", compound: "H" }], overtakes: [{ winner: "ALO", loser: "VER", pos: 3, reason: "Undercut Pit Delta Advantage" }] },
      { lap: 32, pits: [{ driver: "LEC", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 54, overtakes: [{ winner: "HAM", loser: "VER", pos: 4, reason: "Nouvelle Chicane Lockup Capitalization" }] },
    ]
  },

  // Round 09: SPANISH GP (Barcelona)
  spain: {
    round: 9,
    name: "Spanish Grand Prix",
    laps: 66,
    poleTime: "1:11.383",
    poleDriver: "NOR",
    grid: [
      "NOR", "RUS", "VER", "LEC", "PIA", "HAM", "ANT", "SAI", "ALO", "HAD",
      "ALB", "HUL", "STR", "GAS", "OCO", "PER", "LAW", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "RUS", pos: 2, reason: "Turn 1 Long Run Slipstream" },
      { winner: "PIA", loser: "LEC", pos: 4, reason: "Turn 3 Renault Sweeper" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Turn 4 Repsol Braking" },
      { winner: "ALO", loser: "ANT", pos: 8, reason: "Turn 5 Seat Hairpin" },
      { winner: "HAD", loser: "ALB", pos: 10, reason: "Turn 10 Caixa" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Turn 1 Late Lunge" },
    ],
    raceMoments: [
      { lap: 5, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 1 DRS Flyby" }] },
      { lap: 19, pits: [{ driver: "RUS", compound: "M" }, { driver: "LEC", compound: "M" }] },
      { lap: 22, pits: [{ driver: "VER", compound: "H" }, { driver: "NOR", compound: "M" }] },
      { lap: 38, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 1 Fresh Mediums Charge" }] },
      { lap: 48, overtakes: [{ winner: "HAM", loser: "PIA", pos: 4, reason: "Turn 1 DRS Pass" }] },
    ]
  },

  // Round 10: CANADIAN GP (Montreal) — Variable Weather / Hamilton Street Magic
  canada: {
    round: 10,
    name: "Canadian Grand Prix",
    laps: 70,
    poleTime: "1:11.960",
    poleDriver: "HAM",
    grid: [
      "HAM", "VER", "RUS", "NOR", "LEC", "PIA", "ALO", "ALB", "SAI", "ANT",
      "HAD", "STR", "HUL", "GAS", "OCO", "PER", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "RUS", loser: "VER", pos: 2, reason: "Senna 'S' Turn 1-2 Flip" },
      { winner: "LEC", loser: "NOR", pos: 4, reason: "Turn 3 Outside Grip" },
      { winner: "ALB", loser: "ALO", pos: 7, reason: "Turn 8-9 Chicane Dive" },
      { winner: "SAI", loser: "ALO", pos: 8, reason: "Hairpin Traction Drive" },
      { winner: "STR", loser: "HAD", pos: 11, reason: "Casino Straight Slipstream" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Turn 10 Hairpin" },
      { winner: "BOT", loser: "BEA", pos: 18, reason: "Wall of Champions Entry" },
    ],
    raceMoments: [
      { lap: 8, overtakes: [{ winner: "VER", loser: "RUS", pos: 2, reason: "Casino Straight 340km/h DRS" }] },
      { lap: 15, overtakes: [{ winner: "NOR", loser: "LEC", pos: 4, reason: "Turn 13 Wall of Champions Entry" }] },
      { lap: 24, pits: [{ driver: "HAM", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 42, overtakes: [{ winner: "VER", loser: "HAM", pos: 1, reason: "Hairpin Exit Acceleration" }] },
      { lap: 56, overtakes: [{ winner: "NOR", loser: "RUS", pos: 3, reason: "Casino Straight DRS Sweep" }] },
    ]
  },

  // Round 11: AUSTRIAN GP (Red Bull Ring)
  austria: {
    round: 11,
    name: "Austrian Grand Prix",
    laps: 71,
    poleTime: "1:04.314",
    poleDriver: "VER",
    grid: [
      "VER", "NOR", "RUS", "PIA", "LEC", "HAM", "HAD", "SAI", "ANT", "ALO",
      "ALB", "HUL", "STR", "GAS", "OCO", "LAW", "PER", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "RUS", loser: "NOR", pos: 2, reason: "Turn 1 Castrol Edge Launch" },
      { winner: "LEC", loser: "PIA", pos: 4, reason: "Turn 3 Remus Uphill Brake" },
      { winner: "HAM", loser: "PIA", pos: 5, reason: "Turn 4 Rauch Descend" },
      { winner: "SAI", loser: "HAD", pos: 7, reason: "Turn 3 Inside Lunge" },
      { winner: "ALO", loser: "ANT", pos: 9, reason: "Turn 6 Wurth Sweeper" },
      { winner: "HUL", loser: "ALB", pos: 11, reason: "Turn 3 Outbraking" },
      { winner: "LAW", loser: "OCO", pos: 15, reason: "Turn 4 Slipstream" },
    ],
    raceMoments: [
      { lap: 4, overtakes: [{ winner: "NOR", loser: "RUS", pos: 2, reason: "Turn 3 DRS Dive" }] },
      { lap: 14, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 4 Outside Hold" }] },
      { lap: 21, pits: [{ driver: "NOR", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 48, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 3 Switchback Collision Avoidance" }] },
      { lap: 60, overtakes: [{ winner: "RUS", loser: "PIA", pos: 3, reason: "Turn 4 DRS Lunge" }] },
    ]
  },

  // Round 12: BRITISH GP (Silverstone) — Epic British Duel (NOR vs HAM vs RUS)
  great_britain: {
    round: 12,
    name: "British Grand Prix",
    laps: 52,
    poleTime: "1:25.819",
    poleDriver: "NOR",
    grid: [
      "NOR", "HAM", "RUS", "VER", "PIA", "LEC", "ANT", "SAI", "ALO", "HAD",
      "ALB", "HUL", "STR", "GAS", "BEA", "OCO", "PER", "LAW", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "HAM", loser: "NOR", pos: 1, reason: "Abbey Turn 1 Roar of the Crowd" },
      { winner: "VER", loser: "RUS", pos: 3, reason: "Loop Turn 3 Inside Lunge" },
      { winner: "LEC", loser: "PIA", pos: 5, reason: "Wellington Straight Slipstream" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Brooklands Braking" },
      { winner: "HAD", loser: "ALO", pos: 9, reason: "Copse 290km/h Commitment" },
      { winner: "BEA", loser: "GAS", pos: 14, reason: "Stowe Braking Zone" },
      { winner: "PER", loser: "OCO", pos: 16, reason: "Club Corner Drag" },
    ],
    raceMoments: [
      { lap: 6, overtakes: [{ winner: "NOR", loser: "HAM", pos: 1, reason: "Stowe Turn 15 DRS Dive" }] },
      { lap: 18, pits: [{ driver: "HAM", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 20, pits: [{ driver: "NOR", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 34, overtakes: [{ winner: "VER", loser: "HAM", pos: 2, reason: "Hangar Straight DRS" }] },
      { lap: 44, overtakes: [{ winner: "PIA", loser: "LEC", pos: 5, reason: "Maggotts-Becketts Complex" }] },
    ]
  },

  // Round 13: BELGIAN GP (Spa-Francorchamps)
  belgium: {
    round: 13,
    name: "Belgian Grand Prix",
    laps: 44,
    poleTime: "1:43.665",
    poleDriver: "VER",
    grid: [
      "VER", "PIA", "NOR", "HAM", "LEC", "RUS", "SAI", "ANT", "HAD", "ALO",
      "ALB", "HUL", "STR", "GAS", "OCO", "PER", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "PIA", loser: "VER", pos: 1, reason: "Kemmel Straight 345km/h Blast" },
      { winner: "HAM", loser: "NOR", pos: 3, reason: "La Source Turn 1 Hairpin" },
      { winner: "RUS", loser: "LEC", pos: 5, reason: "Les Combes Chicane" },
      { winner: "ANT", loser: "SAI", pos: 7, reason: "Bruxelles Hairpin" },
      { winner: "ALB", loser: "ALO", pos: 10, reason: "Kemmel Straight Low Drag" },
      { winner: "GAS", loser: "STR", pos: 13, reason: "Blanchimont Outbraking" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Bus Stop Chicane" },
    ],
    raceMoments: [
      { lap: 5, overtakes: [{ winner: "VER", loser: "PIA", pos: 1, reason: "Kemmel Straight DRS Strike" }] },
      { lap: 14, pits: [{ driver: "NOR", compound: "H" }, { driver: "HAM", compound: "H" }] },
      { lap: 16, pits: [{ driver: "VER", compound: "H" }, { driver: "PIA", compound: "H" }] },
      { lap: 28, overtakes: [{ winner: "NOR", loser: "HAM", pos: 3, reason: "Bus Stop Chicane Dive" }] },
      { lap: 37, overtakes: [{ winner: "PIA", loser: "NOR", pos: 2, reason: "Kemmel Straight Slipstream" }] },
    ]
  },

  // Round 14: HUNGARIAN GP (Hungaroring)
  hungary: {
    round: 14,
    name: "Hungarian Grand Prix",
    laps: 70,
    poleTime: "1:15.227",
    poleDriver: "PIA",
    grid: [
      "PIA", "NOR", "LEC", "VER", "HAM", "RUS", "ALO", "ANT", "SAI", "HAD",
      "ALB", "STR", "HUL", "GAS", "OCO", "LAW", "BEA", "PER", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "NOR", loser: "PIA", pos: 1, reason: "Turn 1 Down the Inside" },
      { winner: "VER", loser: "LEC", pos: 3, reason: "Turn 2 Sweeping Hold" },
      { winner: "RUS", loser: "HAM", pos: 5, reason: "Turn 4 Blind Crest Cut" },
      { winner: "ANT", loser: "ALO", pos: 7, reason: "Chicane Turn 6-7 Flick" },
      { winner: "HAD", loser: "SAI", pos: 9, reason: "Turn 12 Braking" },
      { winner: "OCO", loser: "GAS", pos: 14, reason: "Turn 1 Squeeze" },
    ],
    raceMoments: [
      { lap: 12, overtakes: [{ winner: "PIA", loser: "NOR", pos: 1, reason: "Turn 1 Outside Switchback" }] },
      { lap: 23, pits: [{ driver: "NOR", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 25, pits: [{ driver: "PIA", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 45, overtakes: [{ winner: "HAM", loser: "RUS", pos: 5, reason: "Turn 1 DRS Pass" }] },
      { lap: 62, overtakes: [{ winner: "VER", loser: "LEC", pos: 3, reason: "Turn 2 Traction Drive" }] },
    ]
  },

  // Round 15: DUTCH GP (Zandvoort)
  netherlands: {
    round: 15,
    name: "Dutch Grand Prix",
    laps: 72,
    poleTime: "1:09.673",
    poleDriver: "VER",
    grid: [
      "VER", "NOR", "PIA", "RUS", "LEC", "HAM", "ANT", "SAI", "HAD", "ALO",
      "ALB", "HUL", "STR", "GAS", "OCO", "LAW", "BEA", "PER", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "NOR", loser: "VER", pos: 1, reason: "Tarzan Turn 1 Outside Roar" },
      { winner: "LEC", loser: "RUS", pos: 4, reason: "Hugenholtz Turn 3 High Banking" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Scheivlak High-Speed Sweep" },
      { winner: "ALO", loser: "HAD", pos: 9, reason: "Hans Ernst Chicane" },
      { winner: "STR", loser: "HUL", pos: 12, reason: "Arie Luyendyk Banking Drag" },
      { winner: "PER", loser: "BEA", pos: 17, reason: "Tarzan Corner Dive" },
    ],
    raceMoments: [
      { lap: 7, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Arie Luyendyk Banking DRS Launch" }] },
      { lap: 25, pits: [{ driver: "NOR", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 28, pits: [{ driver: "VER", compound: "H" }, { driver: "PIA", compound: "H" }] },
      { lap: 49, overtakes: [{ winner: "HAM", loser: "RUS", pos: 5, reason: "Tarzan Corner Dive" }] },
      { lap: 65, overtakes: [{ winner: "PIA", loser: "LEC", pos: 3, reason: "Turn 3 Banking Pass" }] },
    ]
  },

  // Round 16: ITALIAN GP (Monza) — Straight-line Rocket Exception (Williams in Q3 Row 2!)
  monza: {
    round: 16,
    name: "Italian Grand Prix",
    laps: 53,
    poleTime: "1:19.301",
    poleDriver: "LEC",
    grid: [
      "LEC", "RUS", "VER", "SAI", "NOR", "HAM", "ALB", "PIA", "ANT", "HAD",
      "ALO", "HUL", "STR", "PER", "GAS", "OCO", "BOT", "LAW", "BEA", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "RUS", pos: 2, reason: "Variante del Rettifilo Turn 1-2 Dive" },
      { winner: "SAI", loser: "RUS", pos: 3, reason: "Curva Grande Slipstream" },
      { winner: "NOR", loser: "RUS", pos: 4, reason: "Variante della Roggia Chicane" },
      { winner: "ALB", loser: "HAM", pos: 6, reason: "Lesmo 1 Traction Drive" },
      { winner: "PIA", loser: "HAM", pos: 7, reason: "Variante Ascari Chicane" },
      { winner: "PER", loser: "STR", pos: 13, reason: "Prima Variante Heavy Braking" },
      { winner: "BOT", loser: "OCO", pos: 16, reason: "Parabolica High Speed" },
    ],
    raceMoments: [
      { lap: 4, overtakes: [{ winner: "VER", loser: "LEC", pos: 1, reason: "Main Straight 352km/h DRS Strike" }] },
      { lap: 12, overtakes: [{ winner: "NOR", loser: "SAI", pos: 3, reason: "Variante Ascari Slipstream" }] },
      { lap: 19, pits: [{ driver: "LEC", compound: "H" }, { driver: "SAI", compound: "H" }] },
      { lap: 21, pits: [{ driver: "VER", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 38, overtakes: [{ winner: "LEC", loser: "VER", pos: 1, reason: "Curva Grande Tifosi Roar" }] },
      { lap: 47, overtakes: [{ winner: "HAM", loser: "ALB", pos: 6, reason: "Variante del Rettifilo" }] },
    ]
  },

  // Round 17: AZERBAIJAN GP (Baku) — Street Fighter & High Speed Slipstream
  azerbaijan: {
    round: 17,
    name: "Azerbaijan Grand Prix",
    laps: 51,
    poleTime: "1:40.203",
    poleDriver: "LEC",
    grid: [
      "LEC", "PIA", "VER", "NOR", "SAI", "RUS", "HAM", "PER", "ALB", "ANT",
      "ALO", "HAD", "HUL", "STR", "GAS", "OCO", "LAW", "BOT", "BEA", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "PIA", loser: "LEC", pos: 1, reason: "Turn 1 Down the Inside 90-degree" },
      { winner: "NOR", loser: "VER", pos: 3, reason: "Turn 2 Cutback" },
      { winner: "SAI", loser: "VER", pos: 4, reason: "Turn 3 Straight line tow" },
      { winner: "PER", loser: "HAM", pos: 7, reason: "Turn 4 Braking Zone" },
      { winner: "ALB", loser: "ANT", pos: 9, reason: "Castle Section Turn 8-11" },
      { winner: "ALO", loser: "ANT", pos: 10, reason: "Turn 15 Downhill Brake" },
      { winner: "BOT", loser: "LAW", pos: 17, reason: "2.2km Main Straight Tow" },
    ],
    raceMoments: [
      { lap: 6, overtakes: [{ winner: "LEC", loser: "PIA", pos: 1, reason: "2.2km Straight 350km/h DRS Blowby" }] },
      { lap: 16, pits: [{ driver: "PIA", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 18, pits: [{ driver: "LEC", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 31, overtakes: [{ winner: "PIA", loser: "LEC", pos: 1, reason: "Turn 1 Bravery Brake Test" }] },
      { lap: 43, overtakes: [{ winner: "VER", loser: "SAI", pos: 3, reason: "Main Straight DRS" }] },
    ]
  },

  // Round 18: SINGAPORE GP (Marina Bay) — Authentic StatsF1 Base!
  singapore: {
    round: 18,
    name: "Singapore Grand Prix",
    laps: 62,
    poleTime: "1:29.525",
    poleDriver: "NOR",
    grid: [
      "NOR", "VER", "RUS", "LEC", "HAM", "PIA", "SAI", "ANT", "ALO", "ALB",
      "PER", "HAD", "HUL", "STR", "GAS", "OCO", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "NOR", pos: 1, reason: "Turn 1-2-3 Chicane Squeeze" },
      { winner: "LEC", loser: "RUS", pos: 3, reason: "Turn 5 Exit Traction" },
      { winner: "PIA", loser: "HAM", pos: 5, reason: "Turn 7 Outbraking" },
      { winner: "SAI", loser: "HAM", pos: 6, reason: "Turn 8 Switchback" },
      { winner: "ALO", loser: "ANT", pos: 8, reason: "Turn 14 Under the Grandstand" },
      { winner: "HAD", loser: "PER", pos: 11, reason: "Turn 16 Hairpin Dive" },
      { winner: "BEA", loser: "LAW", pos: 17, reason: "Bayfront Avenue Sweep" },
    ],
    raceMoments: [
      { lap: 3, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 7 DRS Strike" }] },
      { lap: 8, overtakes: [{ winner: "HAM", loser: "LEC", pos: 4, reason: "Turn 14 Divebomb" }] },
      { lap: 14, overtakes: [{ winner: "PIA", loser: "HAM", pos: 4, reason: "Turn 7 Inside Move" }] },
      { lap: 18, pits: [{ driver: "PIA", compound: "M" }, { driver: "BEA", compound: "H" }] },
      { lap: 21, pits: [{ driver: "VER", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 24, pits: [{ driver: "NOR", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 34, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "MOM 350kW Boost" }] },
    ]
  },

  // Round 19: UNITED STATES GP (COTA Austin)
  united_states: {
    round: 19,
    name: "United States Grand Prix",
    laps: 56,
    poleTime: "1:32.820",
    poleDriver: "VER",
    grid: [
      "VER", "NOR", "LEC", "HAM", "RUS", "PIA", "ANT", "SAI", "ALO", "HAD",
      "ALB", "HUL", "STR", "GAS", "OCO", "PER", "LAW", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "NOR", loser: "VER", pos: 1, reason: "Turn 1 Uphill Blind Crest Dive" },
      { winner: "HAM", loser: "LEC", pos: 3, reason: "Turn 1 Inside Line" },
      { winner: "PIA", loser: "RUS", pos: 5, reason: "Esses Turn 3-6 Flow" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Turn 11 Hairpin" },
      { winner: "HAD", loser: "ALO", pos: 9, reason: "Back Straight 335km/h DRS" },
      { winner: "PER", loser: "OCO", pos: 15, reason: "Turn 12 Heavy Braking" },
    ],
    raceMoments: [
      { lap: 5, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 12 DRS Flyby" }] },
      { lap: 18, pits: [{ driver: "NOR", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 20, pits: [{ driver: "VER", compound: "H" }, { driver: "HAM", compound: "H" }] },
      { lap: 39, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 1 Braking Attack" }] },
      { lap: 51, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 12 Counter-attack" }] },
    ]
  },

  // Round 20: MEXICO GP (Autódromo Hermanos Rodríguez)
  mexico: {
    round: 20,
    name: "Mexico City Grand Prix",
    laps: 71,
    poleTime: "1:15.946",
    poleDriver: "VER",
    grid: [
      "VER", "LEC", "NOR", "HAM", "RUS", "PIA", "SAI", "ANT", "PER", "ALO",
      "HAD", "ALB", "HUL", "STR", "GAS", "OCO", "LAW", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      // 800m slipstream into Turn 1!
      { winner: "LEC", loser: "VER", pos: 1, reason: "Turn 1 Mega Slipstream 800m Run" },
      { winner: "HAM", loser: "NOR", pos: 3, reason: "Turn 1 Late Brake Inside" },
      { winner: "PER", loser: "SAI", pos: 7, reason: "Foro Sol Stadium Roar Launch" },
      { winner: "ANT", loser: "SAI", pos: 8, reason: "Turn 4 Esses Hook" },
      { winner: "HAD", loser: "ALO", pos: 10, reason: "Turn 1 Inside Avoidance" },
      { winner: "ALB", loser: "ALO", pos: 11, reason: "Turn 4 Chicane" },
    ],
    raceMoments: [
      { lap: 7, overtakes: [{ winner: "VER", loser: "LEC", pos: 1, reason: "Main Straight DRS Flyby" }] },
      { lap: 26, pits: [{ driver: "LEC", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 28, pits: [{ driver: "VER", compound: "H" }, { driver: "HAM", compound: "H" }] },
      { lap: 44, overtakes: [{ winner: "NOR", loser: "HAM", pos: 3, reason: "Stadium Section Cutback" }] },
      { lap: 61, overtakes: [{ winner: "NOR", loser: "LEC", pos: 2, reason: "Turn 1 DRS Pass" }] },
    ]
  },

  // Round 21: BRAZILIAN GP (Interlagos) — Rain Master & Alonso Podium Exception!
  brazil: {
    round: 21,
    name: "São Paulo Grand Prix",
    laps: 71,
    poleTime: "1:09.920",
    poleDriver: "HAM",
    grid: [
      "HAM", "VER", "NOR", "ALO", "RUS", "LEC", "SAI", "PIA", "ANT", "HAD",
      "ALB", "STR", "HUL", "GAS", "OCO", "LAW", "PER", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "HAM", pos: 1, reason: "Senna 'S' Turn 1 Downhill Dive" },
      { winner: "ALO", loser: "NOR", pos: 3, reason: "Curva do Sol Grip Discovery" },
      { winner: "LEC", loser: "RUS", pos: 5, reason: "Descida do Lago Outbraking" },
      { winner: "SAI", loser: "RUS", pos: 6, reason: "Ferradura Corner Sweep" },
      { winner: "ANT", loser: "PIA", pos: 8, reason: "Bico de Pato Hairpin" },
      { winner: "OCO", loser: "GAS", pos: 14, reason: "Junção Uphill Drag" },
      { winner: "PER", loser: "LAW", pos: 16, reason: "Senna 'S' Inside Lunge" },
    ],
    raceMoments: [
      { lap: 4, overtakes: [{ winner: "NOR", loser: "ALO", pos: 3, reason: "Reta Oposta DRS" }] },
      { lap: 18, overtakes: [{ winner: "ALO", loser: "NOR", pos: 3, reason: "Senna 'S' Wet Track Brilliance" }] },
      { lap: 24, pits: [{ driver: "HAM", compound: "I" }, { driver: "VER", compound: "I" }] },
      { lap: 43, overtakes: [{ winner: "VER", loser: "HAM", pos: 1, reason: "Senna 'S' Masterclass" }] },
      { lap: 58, overtakes: [{ winner: "NOR", loser: "HAM", pos: 2, reason: "Subida dos Boxes DRS" }] },
    ]
  },

  // Round 22: LAS VEGAS GP (Las Vegas Strip)
  las_vegas: {
    round: 22,
    name: "Las Vegas Grand Prix",
    laps: 50,
    poleTime: "1:32.412",
    poleDriver: "RUS",
    grid: [
      "RUS", "LEC", "VER", "NOR", "HAM", "SAI", "PIA", "ALB", "ANT", "ALO",
      "HAD", "HUL", "STR", "PER", "GAS", "OCO", "LAW", "BOT", "BEA", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "LEC", loser: "RUS", pos: 1, reason: "Turn 1 Cold Tyre Lockup Exploitation" },
      { winner: "NOR", loser: "VER", pos: 3, reason: "Koval Lane Switch" },
      { winner: "SAI", loser: "HAM", pos: 5, reason: "Sphere Chicane Turn 7-9" },
      { winner: "ALB", loser: "PIA", pos: 7, reason: "1.9km Strip Straight Slipstream 350km/h" },
      { winner: "PER", loser: "STR", pos: 13, reason: "Turn 14 Hairpin Outbraking" },
      { winner: "BOT", loser: "LAW", pos: 17, reason: "Harmon Avenue Sprint" },
    ],
    raceMoments: [
      { lap: 5, overtakes: [{ winner: "VER", loser: "NOR", pos: 3, reason: "Strip Straight DRS Flyby" }] },
      { lap: 15, overtakes: [{ winner: "RUS", loser: "LEC", pos: 1, reason: "Turn 14 Strip Braking" }] },
      { lap: 22, pits: [{ driver: "RUS", compound: "H" }, { driver: "LEC", compound: "H" }] },
      { lap: 25, pits: [{ driver: "VER", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 38, overtakes: [{ winner: "VER", loser: "RUS", pos: 1, reason: "Strip Straight DRS Blast" }] },
    ]
  },

  // Round 23: QATAR GP (Lusail)
  qatar: {
    round: 23,
    name: "Qatar Grand Prix",
    laps: 57,
    poleTime: "1:20.598",
    poleDriver: "PIA",
    grid: [
      "PIA", "VER", "NOR", "RUS", "LEC", "HAM", "ANT", "SAI", "HAD", "ALO",
      "ALB", "STR", "HUL", "GAS", "OCO", "LAW", "PER", "BEA", "BOR", "BOT",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "PIA", pos: 1, reason: "Turn 1 Outside Grip Hold" },
      { winner: "RUS", loser: "NOR", pos: 3, reason: "Turn 2 Sweeper" },
      { winner: "HAM", loser: "LEC", pos: 5, reason: "Triple Apex Turn 12-14" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Turn 6 Hairpin" },
      { winner: "HAD", loser: "ALO", pos: 9, reason: "Turn 10 Left Hander" },
      { winner: "LAW", loser: "OCO", pos: 15, reason: "Main Straight Drag" },
    ],
    raceMoments: [
      { lap: 8, overtakes: [{ winner: "PIA", loser: "VER", pos: 1, reason: "Turn 1 1km Main Straight DRS" }] },
      { lap: 20, pits: [{ driver: "PIA", compound: "H" }, { driver: "NOR", compound: "H" }] },
      { lap: 22, pits: [{ driver: "VER", compound: "H" }, { driver: "RUS", compound: "H" }] },
      { lap: 39, overtakes: [{ winner: "NOR", loser: "RUS", pos: 3, reason: "Turn 1 DRS Outbraking" }] },
      { lap: 48, overtakes: [{ winner: "VER", loser: "PIA", pos: 1, reason: "Turn 1 Late Apex Strike" }] },
    ]
  },

  // Round 24: ABU DHABI GP (Yas Marina — World Championship Finale)
  abu_dhabi: {
    round: 24,
    name: "Abu Dhabi Grand Prix",
    laps: 58,
    poleTime: "1:22.109",
    poleDriver: "NOR",
    grid: [
      "NOR", "VER", "LEC", "HAM", "RUS", "PIA", "ANT", "SAI", "ALO", "HAD",
      "ALB", "HUL", "STR", "GAS", "PER", "OCO", "LAW", "BEA", "BOT", "BOR",
      "COL", "LIN"
    ],
    lap1Scramble: [
      { winner: "VER", loser: "NOR", pos: 1, reason: "Turn 1 Downhill Launch" },
      { winner: "HAM", loser: "LEC", pos: 3, reason: "Turn 5 Hairpin Braking" },
      { winner: "PIA", loser: "RUS", pos: 5, reason: "1.2km Back Straight Tow" },
      { winner: "SAI", loser: "ANT", pos: 7, reason: "Turn 9 Banking Outside" },
      { winner: "HAD", loser: "ALO", pos: 9, reason: "Hotel Section Turn 12-14" },
      { winner: "PER", loser: "GAS", pos: 14, reason: "Turn 6 Chicane" },
      { winner: "BOT", loser: "BEA", pos: 18, reason: "Marina Section Cutback" },
    ],
    raceMoments: [
      { lap: 6, overtakes: [{ winner: "NOR", loser: "VER", pos: 1, reason: "Turn 6 Hairpin DRS Dive" }] },
      { lap: 17, pits: [{ driver: "HAM", compound: "H" }, { driver: "PIA", compound: "H" }] },
      { lap: 21, pits: [{ driver: "NOR", compound: "H" }, { driver: "VER", compound: "H" }] },
      { lap: 36, overtakes: [{ winner: "LEC", loser: "HAM", pos: 3, reason: "Turn 9 Long Banked Turn" }] },
      { lap: 52, overtakes: [{ winner: "VER", loser: "NOR", pos: 1, reason: "Turn 6 Dramatic Last Stint Lunge" }] },
    ]
  },
};

// ── GET OR FALLBACK CONFIG BY CIRCUIT ID OR ROUND NUMBER ──────────────
export function getGrandPrixConfig(circuitIdOrRound) {
  if (!circuitIdOrRound) return GRAND_PRIX_CONFIGS.australia;

  if (typeof circuitIdOrRound === "number") {
    const found = Object.values(GRAND_PRIX_CONFIGS).find((cfg) => cfg.round === circuitIdOrRound);
    if (found) return found;
  }

  const key = String(circuitIdOrRound).toLowerCase().trim().replace(/-/g, "_");
  if (GRAND_PRIX_CONFIGS[key]) return GRAND_PRIX_CONFIGS[key];

  // Try matching substring in keys
  const partial = Object.keys(GRAND_PRIX_CONFIGS).find((k) => key.includes(k) || k.includes(key));
  if (partial) return GRAND_PRIX_CONFIGS[partial];

  return GRAND_PRIX_CONFIGS.australia;
}

// ── GENERATE COMPLETE RACE PROGRESSION & TOUR-PAR-TOUR MATRIX ─────────
export function generateRaceWeekendData(circuitIdOrRound, customMaxLaps) {
  const cfg = getGrandPrixConfig(circuitIdOrRound);
  const maxLaps = customMaxLaps || cfg.laps || 58;

  const startingGrid = [...cfg.grid];
  const lapHistory = [];

  // Lap 0: The Starting Grid (Qualifying Result)
  lapHistory.push({
    lap: 0,
    label: "GRID",
    order: [...startingGrid],
    overtakes: [],
    pits: [],
    leader: startingGrid[0],
    isLap1Start: false,
    note: `Pole: ${startingGrid[0]} (${DRIVER_META[startingGrid[0]]?.name}) · ${cfg.poleTime}`,
  });

  // Lap 1: AUTHENTIC F1 FIRST LAP SCRAMBLE!
  // In real F1, lights out brings massive position shifts, late braking, and 6-10 overtakes!
  let currentOrder = [...startingGrid];
  const lap1Overtakes = [];

  cfg.lap1Scramble.forEach((move) => {
    const winnerIdx = currentOrder.indexOf(move.winner);
    const loserIdx = currentOrder.indexOf(move.loser);

    if (winnerIdx !== -1 && loserIdx !== -1 && winnerIdx > loserIdx) {
      // Perform the swap
      const temp = currentOrder[loserIdx];
      currentOrder[loserIdx] = currentOrder[winnerIdx];
      currentOrder[winnerIdx] = temp;

      lap1Overtakes.push({
        winner: move.winner,
        loser: move.loser,
        winnerNum: DRIVER_META[move.winner]?.num,
        loserNum: DRIVER_META[move.loser]?.num,
        pos: loserIdx + 1,
        fromPos: winnerIdx + 1,
        reason: move.reason,
      });
    }
  });

  lapHistory.push({
    lap: 1,
    label: "L1",
    order: [...currentOrder],
    overtakes: lap1Overtakes,
    pits: [],
    leader: currentOrder[0],
    isLap1Start: true,
    note: `Lap 1 Start Scramble: ${lap1Overtakes.length} position overtakes into Turns 1-4`,
  });

  // Laps 2 through maxLaps: Circuit Race Moments, Natural Pit Stops & Strategic Battling
  let totalRaceOvertakes = lap1Overtakes.length;
  let leadChanges = startingGrid[0] !== currentOrder[0] ? 1 : 0;
  let previousLeader = currentOrder[0];

  for (let lap = 2; lap <= maxLaps; lap++) {
    const overtakesThisLap = [];
    const pitsThisLap = [];

    // Check pre-configured moments for this round
    const moment = cfg.raceMoments.find((m) => m.lap === lap);

    if (moment) {
      // 1. Process pit stops first
      if (moment.pits) {
        moment.pits.forEach((p) => {
          pitsThisLap.push({
            driver: p.driver,
            compound: p.compound,
            driverNum: DRIVER_META[p.driver]?.num,
          });
        });
      }

      // 2. Process scripted overtakes
      if (moment.overtakes) {
        moment.overtakes.forEach((ov) => {
          const wIdx = currentOrder.indexOf(ov.winner);
          const lIdx = currentOrder.indexOf(ov.loser);

          if (wIdx !== -1 && lIdx !== -1 && wIdx > lIdx) {
            const temp = currentOrder[lIdx];
            currentOrder[lIdx] = currentOrder[wIdx];
            currentOrder[wIdx] = temp;

            overtakesThisLap.push({
              winner: ov.winner,
              loser: ov.loser,
              winnerNum: DRIVER_META[ov.winner]?.num,
              loserNum: DRIVER_META[ov.loser]?.num,
              pos: lIdx + 1,
              fromPos: wIdx + 1,
              reason: ov.reason,
            });
            totalRaceOvertakes++;
          }
        });
      }
    } else {
      // Natural mid-race DRS & tire wear overtakes
      // Higher chance on high-overtake tracks (Monza, Spa, Baku), lower on street tracks (Monaco)
      const isMonaco = cfg.round === 8;
      const overtakeChance = isMonaco ? 0.04 : 0.22;

      if (Math.random() < overtakeChance && lap > 6 && lap < maxLaps - 3) {
        // Pick midfield duel (P6 - P16)
        const duelIdx = Math.floor(Math.random() * 11) + 5;
        if (duelIdx < currentOrder.length - 1) {
          const carAhead = currentOrder[duelIdx];
          const carBehind = currentOrder[duelIdx + 1];

          // Technical tier constraint: Lower tier cannot overtake Big 4 unless on fresh tires
          const aheadMeta = DRIVER_META[carAhead];
          const behindMeta = DRIVER_META[carBehind];

          const canOvertake = !(behindMeta?.tier === 3 && aheadMeta?.tier === 1);

          if (canOvertake) {
            currentOrder[duelIdx] = carBehind;
            currentOrder[duelIdx + 1] = carAhead;

            overtakesThisLap.push({
              winner: carBehind,
              loser: carAhead,
              winnerNum: behindMeta?.num,
              loserNum: aheadMeta?.num,
              pos: duelIdx + 1,
              fromPos: duelIdx + 2,
              reason: "DRS Zone Slipstream Pass",
            });
            totalRaceOvertakes++;
          }
        }
      }
    }

    if (currentOrder[0] !== previousLeader) {
      leadChanges++;
      previousLeader = currentOrder[0];
    }

    lapHistory.push({
      lap,
      label: `L${lap}`,
      order: [...currentOrder],
      overtakes: overtakesThisLap,
      pits: pitsThisLap,
      leader: currentOrder[0],
      isLap1Start: false,
    });
  }

  // Calculate biggest mover across race
  let biggestMover = { code: startingGrid[0], net: 0, fromPos: 1, toPos: 1 };
  currentOrder.forEach((code, finalPosIdx) => {
    const gridPos = startingGrid.indexOf(code) + 1;
    const currentPos = finalPosIdx + 1;
    const gained = gridPos - currentPos;
    if (gained > biggestMover.net) {
      biggestMover = { code, net: gained, fromPos: gridPos, toPos: currentPos };
    }
  });

  return {
    circuitId: cfg.name,
    round: cfg.round,
    grandPrixName: cfg.name,
    maxLaps,
    poleDriver: cfg.poleDriver,
    poleTime: cfg.poleTime,
    startingGridCodes: startingGrid,
    lapHistory,
    currentLeader: currentOrder[0],
    raceStats: {
      totalOvertakes: totalRaceOvertakes,
      leadChanges,
      biggestMover,
      winner: currentOrder[0],
    },
  };
}

// ── BUILD 22 DETAILED DRIVER ROWS FOR TIMING TOWER AT SPECIFIC LAP ────
export function buildTimingTowerGridForCircuit(circuitIdOrRound, atLap = 1) {
  const raceData = generateRaceWeekendData(circuitIdOrRound);
  const targetLapData = raceData.lapHistory[Math.min(atLap, raceData.lapHistory.length - 1)] || raceData.lapHistory[0];
  const orderAtLap = targetLapData.order;

  const isPreRace = atLap <= 1;

  let accumulatedGap = 0;
  return orderAtLap.map((code, idx) => {
    const meta = DRIVER_META[code] || {
      num: 99,
      name: code,
      team: "FIA",
      flag: "🏁",
      ioc: "FIA",
    };

    const isLeader = idx === 0;
    const gapStep = +(0.75 + idx * 0.12).toFixed(3);
    if (!isLeader) accumulatedGap += gapStep;

    const s1Sec = +(28.1 + idx * 0.05).toFixed(3);
    const s2Sec = +(37.8 + idx * 0.08).toFixed(3);
    const s3Sec = +(22.8 + idx * 0.04).toFixed(3);
    const baseLap = +(s1Sec + s2Sec + s3Sec).toFixed(3);
    const mins = Math.floor(baseLap / 60);
    const secs = (baseLap % 60).toFixed(3);
    const formattedLap = `${mins}:${secs.padStart(6, "0")}`;

    const originalGridPos = raceData.startingGridCodes.indexOf(code) + 1;
    const posGain = originalGridPos - (idx + 1);
    const posDeltaStr = posGain > 0 ? `+${posGain}` : posGain < 0 ? `${posGain}` : "0";

    // Realistic tire compound based on stint
    const tire = (meta.tier === 1 && idx < 4) ? "M" : idx % 2 === 0 ? "H" : "M";

    return {
      pos: idx + 1,
      num: meta.num,
      code,
      name: meta.name,
      team: meta.team,
      flag: meta.flag,
      tire,
      tireAge: isPreRace ? 0 : Math.min(22, atLap > 24 ? atLap - 22 : atLap),
      gap: isPreRace ? (isLeader ? "LEADER" : "—") : (isLeader ? "LEADER" : `+${accumulatedGap.toFixed(3)}s`),
      gapSec: isPreRace ? 0 : accumulatedGap,
      interval: isPreRace ? "—" : (isLeader ? "—" : `+${gapStep.toFixed(3)}s`),
      arrow: isPreRace ? "none" : (posGain > 0 ? "up" : posGain < 0 ? "down" : "none"),
      wear: isPreRace ? 4 : Math.min(85, 20 + atLap * 1.1),
      delta: isPreRace ? "0.000" : (posGain > 0 ? `+0.0${posGain * 2}` : `-0.1${Math.abs(posGain)}`),
      s1: isPreRace ? "—" : (28.1 + idx * 0.05).toFixed(3),
      s1Type: isPreRace ? "empty" : (idx === 0 ? "purple" : idx < 4 ? "green" : "yellow"),
      s2: isPreRace ? "—" : (37.8 + idx * 0.08).toFixed(3),
      s2Type: isPreRace ? "empty" : (idx === 1 ? "purple" : idx < 5 ? "green" : "yellow"),
      s3: isPreRace ? "—" : (22.8 + idx * 0.04).toFixed(3),
      s3Type: isPreRace ? "empty" : (idx === 2 ? "purple" : idx < 6 ? "green" : "yellow"),
      soc: Math.max(30, 95 - idx * 2),
      mom: idx < 3 ? "Z-MODE" : idx === 4 ? "MOM ON" : "Z-MODE",
      bestLap: isPreRace ? "NO TIME" : formattedLap,
      lastLap: isPreRace ? "—" : formattedLap,
      pits: isPreRace ? 0 : atLap >= 20 ? 1 : 0,
      posDelta: isPreRace ? "0" : posDeltaStr,
      speedTrap: isPreRace ? 0 : (338 - idx * 1.2),
      trackPct: Math.max(0.05, 0.95 - idx * 0.04),
    };
  });
}

