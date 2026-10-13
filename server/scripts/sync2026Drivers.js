const fs = require("fs");
const path = require("path");

const DRIVERS_2026 = [
  {
    name: "Lando Norris",
    code: "NOR",
    number: 1,
    team: "McLaren",
    nationality: "British",
    flag: "🇬🇧",
    base_pace: 83.6,
    tire_mgmt_rating: 91,
    wins: 8,
    podiums: 37,
    points: 1280,
    championships: 1
  },
  {
    name: "Oscar Piastri",
    code: "PIA",
    number: 81,
    team: "McLaren",
    nationality: "Australian",
    flag: "🇦🇺",
    base_pace: 83.9,
    tire_mgmt_rating: 87,
    wins: 4,
    podiums: 19,
    points: 640,
    championships: 0
  },
  {
    name: "George Russell",
    code: "RUS",
    number: 63,
    team: "Mercedes",
    nationality: "British",
    flag: "🇬🇧",
    base_pace: 83.8,
    tire_mgmt_rating: 89,
    wins: 4,
    podiums: 22,
    points: 890,
    championships: 0
  },
  {
    name: "Andrea Kimi Antonelli",
    code: "ANT",
    number: 12,
    team: "Mercedes",
    nationality: "Italian",
    flag: "🇮🇹",
    base_pace: 84.4,
    tire_mgmt_rating: 78,
    wins: 0,
    podiums: 1,
    points: 45,
    championships: 0
  },
  {
    name: "Max Verstappen",
    code: "VER",
    number: 3,
    team: "Red Bull Racing",
    nationality: "Dutch",
    flag: "🇳🇱",
    base_pace: 83.5,
    tire_mgmt_rating: 95,
    wins: 71,
    podiums: 125,
    points: 3390,
    championships: 4
  },
  {
    name: "Isack Hadjar",
    code: "HAD",
    number: 6,
    team: "Red Bull Racing",
    nationality: "French",
    flag: "🇫🇷",
    base_pace: 84.3,
    tire_mgmt_rating: 79,
    wins: 0,
    podiums: 0,
    points: 24,
    championships: 0
  },
  {
    name: "Charles Leclerc",
    code: "LEC",
    number: 16,
    team: "Ferrari",
    nationality: "Monegasque",
    flag: "🇲🇨",
    base_pace: 83.7,
    tire_mgmt_rating: 88,
    wins: 9,
    podiums: 48,
    points: 1540,
    championships: 0
  },
  {
    name: "Lewis Hamilton",
    code: "HAM",
    number: 44,
    team: "Ferrari",
    nationality: "British",
    flag: "🇬🇧",
    base_pace: 83.9,
    tire_mgmt_rating: 93,
    wins: 105,
    podiums: 202,
    points: 4890,
    championships: 7
  },
  {
    name: "Alexander Albon",
    code: "ALB",
    number: 23,
    team: "Williams",
    nationality: "Thai",
    flag: "🇹🇭",
    base_pace: 84.4,
    tire_mgmt_rating: 82,
    wins: 0,
    podiums: 2,
    points: 260,
    championships: 0
  },
  {
    name: "Carlos Sainz Jr.",
    code: "SAI",
    number: 55,
    team: "Williams",
    nationality: "Spanish",
    flag: "🇪🇸",
    base_pace: 84.1,
    tire_mgmt_rating: 89,
    wins: 4,
    podiums: 27,
    points: 1290,
    championships: 0
  },
  {
    name: "Liam Lawson",
    code: "LAW",
    number: 30,
    team: "RB",
    nationality: "New Zealander",
    flag: "🇳🇿",
    base_pace: 84.5,
    tire_mgmt_rating: 80,
    wins: 0,
    podiums: 1,
    points: 58,
    championships: 0,
  },
  {
    name: "Arvid Lindblad",
    code: "LIN",
    number: 41,
    team: "RB",
    nationality: "British",
    flag: "🇬🇧",
    base_pace: 84.8,
    tire_mgmt_rating: 75,
    wins: 0,
    podiums: 0,
    points: 10,
    championships: 0,
  },
  {
    name: "Fernando Alonso",
    code: "ALO",
    number: 14,
    team: "Aston Martin",
    nationality: "Spanish",
    flag: "🇪🇸",
    base_pace: 84.2,
    tire_mgmt_rating: 95,
    wins: 32,
    podiums: 106,
    points: 2340,
    championships: 2
  },
  {
    name: "Lance Stroll",
    code: "STR",
    number: 18,
    team: "Aston Martin",
    nationality: "Canadian",
    flag: "🇨🇦",
    base_pace: 85.0,
    tire_mgmt_rating: 76,
    wins: 0,
    podiums: 3,
    points: 310,
    championships: 0
  },
  {
    name: "Esteban Ocon",
    code: "OCO",
    number: 31,
    team: "Haas",
    nationality: "French",
    flag: "🇫🇷",
    base_pace: 84.6,
    tire_mgmt_rating: 81,
    wins: 1,
    podiums: 4,
    points: 460,
    championships: 0
  },
  {
    name: "Oliver Bearman",
    code: "BEA",
    number: 87,
    team: "Haas",
    nationality: "British",
    flag: "🇬🇧",
    base_pace: 84.7,
    tire_mgmt_rating: 78,
    wins: 0,
    podiums: 0,
    points: 34,
    championships: 0
  },
  {
    name: "Nico Hülkenberg",
    code: "HUL",
    number: 27,
    team: "Audi",
    nationality: "German",
    flag: "🇩🇪",
    base_pace: 84.6,
    tire_mgmt_rating: 84,
    wins: 0,
    podiums: 0,
    points: 590,
    championships: 0
  },
  {
    name: "Gabriel Bortoleto",
    code: "BOR",
    number: 5,
    team: "Audi",
    nationality: "Brazilian",
    flag: "🇧🇷",
    base_pace: 84.9,
    tire_mgmt_rating: 76,
    wins: 0,
    podiums: 0,
    points: 16,
    championships: 0
  },
  {
    name: "Pierre Gasly",
    code: "GAS",
    number: 10,
    team: "Alpine",
    nationality: "French",
    flag: "🇫🇷",
    base_pace: 84.5,
    tire_mgmt_rating: 83,
    wins: 1,
    podiums: 5,
    points: 450,
    championships: 0
  },
  {
    name: "Franco Colapinto",
    code: "COL",
    number: 43,
    team: "Alpine",
    nationality: "Argentine",
    flag: "🇦🇷",
    base_pace: 84.7,
    tire_mgmt_rating: 77,
    wins: 0,
    podiums: 0,
    points: 28,
    championships: 0
  },
  {
    name: "Sergio Pérez",
    code: "PER",
    number: 11,
    team: "Cadillac",
    nationality: "Mexican",
    flag: "🇲🇽",
    base_pace: 84.4,
    tire_mgmt_rating: 90,
    wins: 6,
    podiums: 39,
    points: 1640,
    championships: 0
  },
  {
    name: "Valtteri Bottas",
    code: "BOT",
    number: 77,
    team: "Cadillac",
    nationality: "Finnish",
    flag: "🇫🇮",
    base_pace: 84.3,
    tire_mgmt_rating: 88,
    wins: 10,
    podiums: 67,
    points: 1797,
    championships: 0
  }
];

const driversPath = path.join(__dirname, "..", "src", "seed", "drivers.json");
fs.writeFileSync(driversPath, JSON.stringify(DRIVERS_2026, null, 2), "utf8");
console.log("Successfully wrote " + DRIVERS_2026.length + " drivers to " + driversPath);

// Also update teams_budget.json drivers array
const budgetPath = path.join(__dirname, "..", "src", "seed", "teams_budget.json");
if (fs.existsSync(budgetPath)) {
  const teams = JSON.parse(fs.readFileSync(budgetPath, "utf8"));
  const teamDriverMap = {
    "McLaren": ["NOR", "PIA"],
    "Ferrari": ["LEC", "HAM"],
    "Red Bull Racing": ["VER", "HAD"],
    "Mercedes": ["RUS", "ANT"],
    "Aston Martin": ["ALO", "STR"],
    "Williams": ["ALB", "SAI"],
    "Alpine": ["GAS", "COL"],
    "Haas": ["OCO", "BEA"],
    "RB": ["LAW", "LIN"],
    "Audi": ["HUL", "BOR"],
    "Cadillac": ["PER", "BOT"]
  };
  teams.forEach(t => {
    if (teamDriverMap[t.team]) {
      t.drivers = teamDriverMap[t.team];
    }
  });
  fs.writeFileSync(budgetPath, JSON.stringify(teams, null, 2), "utf8");
  console.log("Successfully updated teams_budget.json driver mappings!");
}

