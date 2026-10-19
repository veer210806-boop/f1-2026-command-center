// ============================================================
// TeamsPaddock.jsx — Official F1 2026 Teams & Drivers Showcase
// Pixel-accurate recreation matching formula1.com/en/teams & formula1.com/en/drivers
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { DRIVER_PHOTOS, TEAM_CARS, TEAM_LOGOS, getDriverFaceUrl, getTeamLogo } from "../data/f1MediaAssets2026";
import { DRIVER_PROFILES_2026, getDriverProfile, GRID_DRIVER_CODES } from "../data/driverProfiles2026";
import { TEAM_PERFORMANCE_2026 } from "../data/teamPerformance2026";
import TeamRadioModal from "./TeamRadioModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATIC_TEAMS = [
  {
    team: "McLaren",
    full_name: "McLaren Formula 1 Team",
    short_code: "MCL",
    primary_color: "#FF8000",
    secondary_color: "#111116",
    team_principal: "Andrea Stella",
    power_unit: "Mercedes 2026 Spec",
    base_location: "Woking, United Kingdom",
    car_model: "MCL39",
    championships: 9,
    drivers: ["NOR", "PIA"],
    total_budget: 135000000,
    spent: 118400000,
    car_image_url: TEAM_CARS["McLaren"],
    logo_url: TEAM_LOGOS["McLaren"],
  },
  {
    team: "Ferrari",
    full_name: "Scuderia Ferrari HP",
    short_code: "FER",
    primary_color: "#E8002D",
    secondary_color: "#FFF200",
    team_principal: "Fred Vasseur",
    power_unit: "Ferrari 2026 E-Turbo",
    base_location: "Maranello, Italy",
    car_model: "SF-26",
    championships: 16,
    drivers: ["LEC", "HAM"],
    total_budget: 135000000,
    spent: 121500000,
    car_image_url: TEAM_CARS["Ferrari"],
    logo_url: TEAM_LOGOS["Ferrari"],
  },
  {
    team: "Red Bull Racing",
    full_name: "Oracle Red Bull Racing",
    short_code: "RBR",
    primary_color: "#1E41FF",
    secondary_color: "#FF1801",
    team_principal: "Laurent Mekies",
    power_unit: "Red Bull Ford Powertrains",
    base_location: "Milton Keynes, United Kingdom",
    car_model: "RB22",
    championships: 6,
    drivers: ["VER", "HAD"],
    total_budget: 135000000,
    spent: 123800000,
    car_image_url: TEAM_CARS["Red Bull Racing"],
    logo_url: TEAM_LOGOS["Red Bull Racing"],
  },
  {
    team: "Mercedes",
    full_name: "Mercedes-AMG PETRONAS F1 Team",
    short_code: "MER",
    primary_color: "#00D2BE",
    secondary_color: "#C0C0C0",
    team_principal: "Toto Wolff",
    power_unit: "Mercedes 2026 Hybrid",
    base_location: "Brackley, United Kingdom",
    car_model: "W17",
    championships: 8,
    drivers: ["RUS", "ANT"],
    total_budget: 135000000,
    spent: 117200000,
    car_image_url: TEAM_CARS["Mercedes"],
    logo_url: TEAM_LOGOS["Mercedes"],
  },
  {
    team: "Aston Martin",
    full_name: "Aston Martin Aramco F1 Team",
    short_code: "AMR",
    primary_color: "#229971",
    secondary_color: "#CEDC00",
    team_principal: "Adrian Newey",
    power_unit: "Honda 2026 Works Hybrid",
    base_location: "Silverstone, United Kingdom",
    car_model: "AMR26",
    championships: 0,
    drivers: ["ALO", "STR"],
    total_budget: 135000000,
    spent: 114600000,
    car_image_url: TEAM_CARS["Aston Martin"],
    logo_url: TEAM_LOGOS["Aston Martin"],
  },
  {
    team: "Williams",
    full_name: "Williams Racing",
    short_code: "WIL",
    primary_color: "#00A0DE",
    secondary_color: "#041E42",
    team_principal: "James Vowles",
    power_unit: "Mercedes 2026 Customer",
    base_location: "Grove, United Kingdom",
    car_model: "FW48",
    championships: 9,
    drivers: ["ALB", "SAI"],
    total_budget: 135000000,
    spent: 109800000,
    car_image_url: TEAM_CARS["Williams"],
    logo_url: TEAM_LOGOS["Williams"],
  },
  {
    team: "Alpine",
    full_name: "BWT Alpine Formula One Team",
    short_code: "ALP",
    primary_color: "#0090FF",
    secondary_color: "#FF87BC",
    team_principal: "Flavio Briatore / Steve Nielsen",
    power_unit: "Mercedes Customer Spec",
    base_location: "Enstone, United Kingdom",
    car_model: "A526",
    championships: 2,
    drivers: ["GAS", "COL"],
    total_budget: 135000000,
    spent: 106500000,
    car_image_url: TEAM_CARS["Alpine"],
    logo_url: TEAM_LOGOS["Alpine"],
  },
  {
    team: "Haas",
    full_name: "MoneyGram Haas F1 Team",
    short_code: "HAA",
    primary_color: "#B6BABD",
    secondary_color: "#E10600",
    team_principal: "Ayao Komatsu",
    power_unit: "Ferrari 2026 Customer",
    base_location: "Kannapolis, United States",
    car_model: "VF-26",
    championships: 0,
    drivers: ["OCO", "BEA"],
    total_budget: 135000000,
    spent: 103200000,
    car_image_url: TEAM_CARS["Haas"],
    logo_url: TEAM_LOGOS["Haas"],
  },
  {
    team: "RB",
    full_name: "Visa Cash App RB F1 Team",
    short_code: "RBF",
    primary_color: "#6692FF",
    secondary_color: "#FFFFFF",
    team_principal: "Alan Permane",
    power_unit: "Red Bull Ford Powertrains",
    base_location: "Faenza, Italy",
    car_model: "VCARB 03",
    championships: 0,
    drivers: ["LAW", "LIN"],
    total_budget: 135000000,
    spent: 105400000,
    car_image_url: TEAM_CARS["RB"],
    logo_url: TEAM_LOGOS["RB"],
  },
  {
    team: "Audi",
    full_name: "Audi Revolut Formula 1 Team",
    short_code: "AUD",
    primary_color: "#E50027",
    secondary_color: "#1F1F1F",
    team_principal: "Mattia Binotto",
    power_unit: "Audi Works Powertrain 2026",
    base_location: "Hinwil, Switzerland",
    car_model: "R26",
    championships: 0,
    drivers: ["HUL", "BOR"],
    total_budget: 135000000,
    spent: 112000000,
    car_image_url: TEAM_CARS["Audi"],
    logo_url: TEAM_LOGOS["Audi"],
  },
  {
    team: "Cadillac",
    full_name: "Cadillac Formula 1 Team",
    short_code: "CAD",
    primary_color: "#FFC72C",
    secondary_color: "#1C1C1C",
    team_principal: "Steve O'Rourke",
    power_unit: "Ferrari 2026 / Cadillac Turbo",
    base_location: "Fishers, Indiana, USA",
    car_model: "CAD-01",
    championships: 0,
    drivers: ["PER", "BOT"],
    total_budget: 135000000,
    spent: 108500000,
    car_image_url: TEAM_CARS["Cadillac"],
    logo_url: TEAM_LOGOS["Cadillac"],
  },
];

const STATIC_DRIVERS = [
  { name: "Lando Norris",      code: "NOR", number: 1,  team: "McLaren",         nationality: "British",      flag: "🇬🇧", base_pace: 83.6, tire_mgmt_rating: 91, wins: 8,   podiums: 37, points: 1280, championships: 1, photo_url: DRIVER_PHOTOS["NOR"] },
  { name: "Oscar Piastri",     code: "PIA", number: 81, team: "McLaren",         nationality: "Australian",   flag: "🇦🇺", base_pace: 83.9, tire_mgmt_rating: 87, wins: 4,   podiums: 19, points: 640,  championships: 0, photo_url: DRIVER_PHOTOS["PIA"] },
  { name: "Charles Leclerc",   code: "LEC", number: 16, team: "Ferrari",         nationality: "Monegasque",   flag: "🇲🇨", base_pace: 83.7, tire_mgmt_rating: 88, wins: 9,   podiums: 48, points: 1540, championships: 0, photo_url: DRIVER_PHOTOS["LEC"] },
  { name: "Lewis Hamilton",    code: "HAM", number: 44, team: "Ferrari",         nationality: "British",      flag: "🇬🇧", base_pace: 83.9, tire_mgmt_rating: 93, wins: 105, podiums: 202,points: 4890, championships: 7, photo_url: DRIVER_PHOTOS["HAM"] },
  { name: "Max Verstappen",    code: "VER", number: 3,  team: "Red Bull Racing", nationality: "Dutch",        flag: "🇳🇱", base_pace: 83.5, tire_mgmt_rating: 95, wins: 71,  podiums: 125,points: 3390, championships: 4, photo_url: DRIVER_PHOTOS["VER"] },
  { name: "Isack Hadjar",      code: "HAD", number: 6,  team: "Red Bull Racing", nationality: "French",       flag: "🇫🇷", base_pace: 84.3, tire_mgmt_rating: 79, wins: 0,   podiums: 0,  points: 24,   championships: 0, photo_url: DRIVER_PHOTOS["HAD"] },
  { name: "George Russell",    code: "RUS", number: 63, team: "Mercedes",        nationality: "British",      flag: "🇬🇧", base_pace: 83.8, tire_mgmt_rating: 89, wins: 4,   podiums: 22, points: 890,  championships: 0, photo_url: DRIVER_PHOTOS["RUS"] },
  { name: "Andrea Kimi Antonelli", code: "ANT", number: 12, team: "Mercedes",   nationality: "Italian",      flag: "🇮🇹", base_pace: 84.4, tire_mgmt_rating: 78, wins: 0,   podiums: 1,  points: 45,   championships: 0, photo_url: DRIVER_PHOTOS["ANT"] },
  { name: "Fernando Alonso",   code: "ALO", number: 14, team: "Aston Martin",    nationality: "Spanish",      flag: "🇪🇸", base_pace: 84.2, tire_mgmt_rating: 95, wins: 32,  podiums: 106,points: 2340, championships: 2, photo_url: DRIVER_PHOTOS["ALO"] },
  { name: "Lance Stroll",      code: "STR", number: 18, team: "Aston Martin",    nationality: "Canadian",     flag: "🇨🇦", base_pace: 85.0, tire_mgmt_rating: 76, wins: 0,   podiums: 3,  points: 310,  championships: 0, photo_url: DRIVER_PHOTOS["STR"] },
  { name: "Alexander Albon",   code: "ALB", number: 23, team: "Williams",        nationality: "Thai",         flag: "🇹🇭", base_pace: 84.4, tire_mgmt_rating: 82, wins: 0,   podiums: 2,  points: 260,  championships: 0, photo_url: DRIVER_PHOTOS["ALB"] },
  { name: "Carlos Sainz Jr.",  code: "SAI", number: 55, team: "Williams",        nationality: "Spanish",      flag: "🇪🇸", base_pace: 84.1, tire_mgmt_rating: 89, wins: 4,   podiums: 27, points: 1290, championships: 0, photo_url: DRIVER_PHOTOS["SAI"] },
  { name: "Liam Lawson",       code: "LAW", number: 30, team: "RB",              nationality: "New Zealander",flag: "🇳🇿", base_pace: 84.5, tire_mgmt_rating: 80, wins: 0,   podiums: 1,  points: 58,   championships: 0, photo_url: DRIVER_PHOTOS["LAW"] },
  { name: "Arvid Lindblad",    code: "LIN", number: 41, team: "RB",              nationality: "British",      flag: "🇬🇧", base_pace: 84.8, tire_mgmt_rating: 75, wins: 0,   podiums: 0,  points: 10,   championships: 0, photo_url: DRIVER_PHOTOS["LIN"] },
  { name: "Pierre Gasly",      code: "GAS", number: 10, team: "Alpine",          nationality: "French",       flag: "🇫🇷", base_pace: 84.5, tire_mgmt_rating: 83, wins: 1,   podiums: 5,  points: 450,  championships: 0, photo_url: DRIVER_PHOTOS["GAS"] },
  { name: "Franco Colapinto",  code: "COL", number: 43, team: "Alpine",          nationality: "Argentine",    flag: "🇦🇷", base_pace: 84.7, tire_mgmt_rating: 77, wins: 0,   podiums: 0,  points: 28,   championships: 0, photo_url: DRIVER_PHOTOS["COL"] },
  { name: "Esteban Ocon",      code: "OCO", number: 31, team: "Haas",            nationality: "French",       flag: "🇫🇷", base_pace: 84.6, tire_mgmt_rating: 81, wins: 1,   podiums: 4,  points: 460,  championships: 0, photo_url: DRIVER_PHOTOS["OCO"] },
  { name: "Oliver Bearman",    code: "BEA", number: 87, team: "Haas",            nationality: "British",      flag: "🇬🇧", base_pace: 84.7, tire_mgmt_rating: 78, wins: 0,   podiums: 0,  points: 34,   championships: 0, photo_url: DRIVER_PHOTOS["BEA"] },
  { name: "Nico Hülkenberg",   code: "HUL", number: 27, team: "Audi",            nationality: "German",       flag: "🇩🇪", base_pace: 84.6, tire_mgmt_rating: 84, wins: 0,   podiums: 0,  points: 590,  championships: 0, photo_url: DRIVER_PHOTOS["HUL"] },
  { name: "Gabriel Bortoleto", code: "BOR", number: 5,  team: "Audi",            nationality: "Brazilian",    flag: "🇧🇷", base_pace: 84.9, tire_mgmt_rating: 76, wins: 0,   podiums: 0,  points: 16,   championships: 0, photo_url: DRIVER_PHOTOS["BOR"] },
  { name: "Sergio Pérez",      code: "PER", number: 11, team: "Cadillac",        nationality: "Mexican",      flag: "🇲🇽", base_pace: 84.4, tire_mgmt_rating: 90, wins: 6,   podiums: 39, points: 1640, championships: 0, photo_url: DRIVER_PHOTOS["PER"] },
  { name: "Valtteri Bottas",   code: "BOT", number: 77, team: "Cadillac",        nationality: "Finnish",      flag: "🇫🇮", base_pace: 84.3, tire_mgmt_rating: 88, wins: 10,  podiums: 67, points: 1797, championships: 0, photo_url: DRIVER_PHOTOS["BOT"] },
];

const NATIONALITY_TO_FIA = {
  "British": "GBR",
  "Australian": "AUS",
  "Monegasque": "MON",
  "Dutch": "NLD",
  "French": "FRA",
  "Italian": "ITA",
  "Spanish": "ESP",
  "Canadian": "CAN",
  "Thai": "THA",
  "New Zealander": "NZL",
  "German": "GER",
  "Brazilian": "BRA",
  "Mexican": "MEX",
  "Finnish": "FIN",
  "Argentine": "ARG",
};

const CONSTRUCTOR_RANK_ORDER = {
  "McLaren": 1,
  "Ferrari": 2,
  "Red Bull Racing": 3,
  "Mercedes": 4,
  "Aston Martin": 5,
  "Alpine": 6,
  "Haas": 7,
  "Williams": 8,
  "RB": 9,
  "Racing Bulls": 9,
  "Audi": 10,
  "Cadillac": 11,
};

const TEAM_TECH_DATA = {
  McLaren: {
    rank: 1,
    reigningChampion: true,
    chassis: "MCL39",
    powerOutput: "1,040+ HP Hybrid",
    techDirector: "Rob Marshall & Peter Prodromou",
    engineSpec: "Mercedes-AMG 2026 Works MGU-K (350kW)",
    aeroFeature: "Active Rear Wing + Dynamic Front Flaps (X/Z Mode)",
    fuelPartner: "bp / Castrol 100% Sustainable Blend",
    headquarters: "Woking, Surrey, UK",
    flag: "🇬🇧",
  },
  Ferrari: {
    rank: 2,
    chassis: "SF-26",
    powerOutput: "1,050+ HP Hybrid",
    techDirector: "Loïc Serra",
    engineSpec: "Scuderia Ferrari 067/1 Turbo-Hybrid",
    aeroFeature: "Scuderia Adaptive Vortex Tunnel Floor",
    fuelPartner: "Shell 100% Sustainable Bio-E-Fuel",
    headquarters: "Maranello, Emilia-Romagna, Italy",
    flag: "🇮🇹",
  },
  "Red Bull Racing": {
    rank: 3,
    chassis: "RB22",
    powerOutput: "1,045+ HP Hybrid",
    techDirector: "Pierre Waché",
    engineSpec: "Red Bull Ford Powertrains 2026 Gen-1",
    aeroFeature: "Oracle Active Venturi Strakes (X/Z Mode)",
    fuelPartner: "ExxonMobil Synergy Race Fuel",
    headquarters: "Milton Keynes, UK",
    flag: "🇬🇧",
  },
  Mercedes: {
    rank: 4,
    chassis: "W17",
    powerOutput: "1,040+ HP Hybrid",
    techDirector: "James Allison",
    engineSpec: "Mercedes-AMG F1 M17 E Performance",
    aeroFeature: "PETRONAS Low-Drag Active Wing System",
    fuelPartner: "PETRONAS Syntium Sustainable Fuel",
    headquarters: "Brackley, Northamptonshire, UK",
    flag: "🇬🇧",
  },
  "Aston Martin": {
    rank: 5,
    chassis: "AMR26",
    powerOutput: "1,035+ HP Hybrid",
    techDirector: "Enrico Cardile / Dan Fallows",
    engineSpec: "Honda Works RA626H Turbo-Hybrid",
    aeroFeature: "Aramco High-Efficiency Active Beam Wing",
    fuelPartner: "Aramco 100% Synthetic Fuel",
    headquarters: "Silverstone, UK",
    flag: "🇬🇧",
  },
  Alpine: {
    rank: 6,
    chassis: "A526",
    powerOutput: "1,030+ HP Hybrid",
    techDirector: "David Sanchez",
    engineSpec: "Mercedes Customer High-Efficiency PU",
    aeroFeature: "BWT Streamlined Active Aero Package",
    fuelPartner: "bp Sustainable Racing Fuel",
    headquarters: "Enstone, Oxfordshire, UK",
    flag: "🇬🇧",
  },
  Haas: {
    rank: 7,
    chassis: "VF-26",
    powerOutput: "1,030+ HP Hybrid",
    techDirector: "Andrea De Zordo",
    engineSpec: "Ferrari 067/1 Customer Turbo-Hybrid",
    aeroFeature: "MoneyGram High-Downforce Active Flaps",
    fuelPartner: "Shell 100% Sustainable Fuel",
    headquarters: "Kannapolis, North Carolina, USA",
    flag: "🇺🇸",
  },
  Williams: {
    rank: 8,
    chassis: "FW48",
    powerOutput: "1,035+ HP Hybrid",
    techDirector: "Pat Fry",
    engineSpec: "Mercedes-AMG F1 Customer Hybrid",
    aeroFeature: "Grove Active Drag Reduction Trim",
    fuelPartner: "Gulf Oil / Sustainable Blend",
    headquarters: "Grove, Oxfordshire, UK",
    flag: "🇬🇧",
  },
  RB: {
    rank: 9,
    chassis: "VCARB 03",
    powerOutput: "1,030+ HP Hybrid",
    techDirector: "Jody Egginton",
    engineSpec: "Red Bull Ford Powertrains Customer",
    aeroFeature: "Faenza High-Agility Active Wing Endplates",
    fuelPartner: "ExxonMobil Sustainable Racing Blend",
    headquarters: "Faenza, Emilia-Romagna, Italy",
    flag: "🇮🇹",
  },
  Audi: {
    rank: 10,
    chassis: "R26",
    powerOutput: "1,025+ HP Hybrid",
    techDirector: "Mattia Binotto & Stefan Strähnz",
    engineSpec: "Audi Works Formula Powertrain Neuburg",
    aeroFeature: "Ingolstadt Ultra-Low Drag Active Profiling",
    fuelPartner: "bp 100% Sustainable Fuel",
    headquarters: "Hinwil, Switzerland / Neuburg, Germany",
    flag: "🇨🇭",
  },
  Cadillac: {
    rank: 11,
    isNewEntry: true,
    chassis: "CAD-01",
    powerOutput: "1,025+ HP Hybrid",
    techDirector: "Nick Chester",
    engineSpec: "Ferrari / Cadillac Customer Turbo-Hybrid",
    aeroFeature: "Andretti All-American Dynamic Flow Control",
    fuelPartner: "Sunoco / Shell Sustainable Blend",
    headquarters: "Fishers, Indiana & Silverstone, UK",
    flag: "🇺🇸",
  },
};

function formatLapTime(seconds) {
  if (!seconds || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export default function TeamsPaddock() {
  const [viewMode, setViewMode] = useState("teams"); // 'teams' | 'drivers' | 'dossier'
  const [teams, setTeams] = useState(STATIC_TEAMS);
  const [drivers, setDrivers] = useState(STATIC_DRIVERS);
  const [selectedTeamCode, setSelectedTeamCode] = useState("McLaren");
  const [activeDriverModal, setActiveDriverModal] = useState(null); // driver object or code
  const [modalTab, setModalTab] = useState("stats"); // 'stats' | 'bio' | 'ratings' | 'milestones'
  const [radioModalDriver, setRadioModalDriver] = useState(null); // driver code or 'ALL'

  // Filter & Sorting state for Teams
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSortMode, setTeamSortMode] = useState("rank"); // 'rank' | 'budget' | 'alpha'
  const [teamFilterPU, setTeamFilterPU] = useState("all"); // 'all' | 'mercedes' | 'ferrari' | 'redbull' | 'honda' | 'audi'

  // Filter & Sorting state for Drivers
  const [driverSearch, setDriverSearch] = useState("");
  const [driverSortMode, setDriverSortMode] = useState("points"); // 'points' | 'wins' | 'number' | 'rating' | 'name'
  const [driverFilterCategory, setDriverFilterCategory] = useState("all"); // 'all' | 'champions' | 'rookies' | 'winners'
  const [driverFilterTeam, setDriverFilterTeam] = useState("all");

  // Navigate between drivers in modal
  const navigateDriver = (delta) => {
    if (!activeDriverModal) return;
    const currentCode = typeof activeDriverModal === "string" ? activeDriverModal : activeDriverModal.code;
    const currentIndex = GRID_DRIVER_CODES.indexOf(currentCode);
    if (currentIndex === -1) return;
    const nextIdx = (currentIndex + delta + GRID_DRIVER_CODES.length) % GRID_DRIVER_CODES.length;
    const nextCode = GRID_DRIVER_CODES[nextIdx];
    const nextDriver = drivers.find((d) => d.code === nextCode) || getDriverProfile(nextCode);
    setActiveDriverModal(nextDriver);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeDriverModal) return;
      if (e.key === "Escape") {
        setActiveDriverModal(null);
      } else if (e.key === "ArrowLeft") {
        navigateDriver(-1);
      } else if (e.key === "ArrowRight") {
        navigateDriver(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDriverModal, drivers]);

  useEffect(() => {
    // Fetch live teams and drivers from backend
    axios.get(`${API}/budget`)
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          // Sort teams by official championship rank order by default
          const sorted = [...res.data.data].sort(
            (a, b) => (CONSTRUCTOR_RANK_ORDER[a.team] || 99) - (CONSTRUCTOR_RANK_ORDER[b.team] || 99)
          );
          setTeams(sorted);
        }
      })
      .catch(() => {});

    axios.get(`${API}/drivers`)
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          const sorted = [...res.data.data].sort((a, b) => (b.points || 0) - (a.points || 0));
          setDrivers(sorted);
        }
      })
      .catch(() => {});
  }, []);

  const currentTeam = teams.find(
    (t) => t.team.toLowerCase() === selectedTeamCode.toLowerCase()
  ) || teams[0];

  // Helper to get driver image
  const getDriverPhoto = (code) => {
    return DRIVER_PHOTOS[code] || "";
  };

  // Helper to get car image
  const getTeamCar = (teamName) => {
    return TEAM_CARS[teamName] || "";
  };

  // Robust matching: match by driver codes in currentTeam.drivers, or team name / aliases
  const teamDrivers = drivers.filter((d) => {
    if (currentTeam?.drivers && Array.isArray(currentTeam.drivers) && currentTeam.drivers.includes(d.code)) {
      return true;
    }
    const tName = (currentTeam?.team || "").toLowerCase();
    const dTeam = (d.team || "").toLowerCase();
    if (dTeam === tName) return true;
    if ((tName === "rb" || tName.includes("bulls")) && (dTeam === "rb" || dTeam.includes("bulls")) && !tName.includes("racing") && !dTeam.includes("racing")) return true;
    if ((tName === "rb" || tName.includes("racing bulls")) && (dTeam === "rb" || dTeam.includes("racing bulls"))) return true;
    if ((tName === "red bull" || tName === "red bull racing") && (dTeam === "red bull" || dTeam === "red bull racing")) return true;
    return false;
  });

  // Filtered & Sorted Teams
  const processedTeams = useMemo(() => {
    let list = [...teams];
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase().trim();
      list = list.filter((t) => {
        const tech = TEAM_TECH_DATA[t.team] || {};
        return (
          t.team.toLowerCase().includes(q) ||
          (t.full_name && t.full_name.toLowerCase().includes(q)) ||
          (t.power_unit && t.power_unit.toLowerCase().includes(q)) ||
          (t.base_location && t.base_location.toLowerCase().includes(q)) ||
          (tech.techDirector && tech.techDirector.toLowerCase().includes(q)) ||
          (t.car_model && t.car_model.toLowerCase().includes(q))
        );
      });
    }
    if (teamFilterPU !== "all") {
      list = list.filter((t) => {
        const pu = (t.power_unit || "").toLowerCase();
        const tName = t.team.toLowerCase();
        if (teamFilterPU === "mercedes") return pu.includes("mercedes") || tName === "mercedes" || tName === "mclaren" || tName === "williams" || tName === "alpine";
        if (teamFilterPU === "ferrari") return pu.includes("ferrari") || tName === "ferrari" || tName === "haas" || tName === "cadillac";
        if (teamFilterPU === "redbull") return pu.includes("red bull") || pu.includes("ford") || tName.includes("red bull") || tName === "rb";
        if (teamFilterPU === "honda") return pu.includes("honda") || tName.includes("aston");
        if (teamFilterPU === "audi") return pu.includes("audi") || tName === "audi";
        return true;
      });
    }
    if (teamSortMode === "rank") {
      list.sort((a, b) => (CONSTRUCTOR_RANK_ORDER[a.team] || 99) - (CONSTRUCTOR_RANK_ORDER[b.team] || 99));
    } else if (teamSortMode === "budget") {
      list.sort((a, b) => (b.spent || 0) - (a.spent || 0));
    } else if (teamSortMode === "alpha") {
      list.sort((a, b) => a.team.localeCompare(b.team));
    }
    return list;
  }, [teams, teamSearch, teamFilterPU, teamSortMode]);

  // Filtered & Sorted Drivers
  const processedDrivers = useMemo(() => {
    let list = [...drivers];
    if (driverSearch.trim()) {
      const q = driverSearch.toLowerCase().trim();
      list = list.filter((d) => 
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.team.toLowerCase().includes(q) ||
        String(d.number).includes(q) ||
        (d.nationality && d.nationality.toLowerCase().includes(q))
      );
    }
    if (driverFilterCategory === "champions") {
      list = list.filter((d) => (d.championships || 0) > 0 || (DRIVER_PROFILES_2026[d.code]?.championships || 0) > 0);
    } else if (driverFilterCategory === "rookies") {
      list = list.filter((d) => ["ANT", "HAD", "LIN", "BOR", "COL", "BEA"].includes(d.code));
    } else if (driverFilterCategory === "winners") {
      list = list.filter((d) => (d.wins || DRIVER_PROFILES_2026[d.code]?.wins || 0) > 0);
    }
    if (driverFilterTeam !== "all") {
      list = list.filter((d) => d.team.toLowerCase() === driverFilterTeam.toLowerCase());
    }
    if (driverSortMode === "points") {
      list.sort((a, b) => (b.points || DRIVER_PROFILES_2026[b.code]?.career_points || 0) - (a.points || DRIVER_PROFILES_2026[a.code]?.career_points || 0));
    } else if (driverSortMode === "wins") {
      list.sort((a, b) => (b.wins || DRIVER_PROFILES_2026[b.code]?.wins || 0) - (a.wins || DRIVER_PROFILES_2026[a.code]?.wins || 0));
    } else if (driverSortMode === "number") {
      list.sort((a, b) => (a.number || 0) - (b.number || 0));
    } else if (driverSortMode === "rating") {
      list.sort((a, b) => {
        const profA = DRIVER_PROFILES_2026[a.code]?.telemetry_ratings || { pace: 85, qualifying: 85, racecraft: 85, tire_mgmt: 85 };
        const profB = DRIVER_PROFILES_2026[b.code]?.telemetry_ratings || { pace: 85, qualifying: 85, racecraft: 85, tire_mgmt: 85 };
        const ovrA = (profA.pace + profA.qualifying + profA.racecraft + profA.tire_mgmt) / 4;
        const ovrB = (profB.pace + profB.qualifying + profB.racecraft + profB.tire_mgmt) / 4;
        return ovrB - ovrA;
      });
    } else if (driverSortMode === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [drivers, driverSearch, driverSortMode, driverFilterCategory, driverFilterTeam]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes pulseBeacon {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {/* ════════ TIER 1: UNIFIED PADDOCK MISSION GANTRY DECK ════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          background: "linear-gradient(180deg, rgba(20, 24, 38, 0.98) 0%, rgba(10, 13, 22, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderTop: "3px solid var(--neon-red)",
          borderRadius: "10px",
          padding: "8px 16px",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(232, 0, 45, 0.15)",
          flexWrap: "wrap",
          minHeight: "50px",
          boxSizing: "border-box",
        }}
      >
        {/* Left: Brand Badge, Title & FIA Spec Micro-Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "linear-gradient(135deg, var(--neon-red), #b3001e)",
              color: "#ffffff",
              padding: "4px 10px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.70rem",
              fontWeight: "900",
              letterSpacing: "0.08em",
              boxShadow: "0 0 12px rgba(232, 0, 45, 0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", animation: "pulseBeacon 2s infinite" }} />
            FIA F1 2026
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "1.02rem",
                fontWeight: "900",
                color: "#ffffff",
                letterSpacing: "0.05em",
                textShadow: "0 0 12px rgba(255, 255, 255, 0.2)",
              }}
            >
              PADDOCK & CONSTRUCTORS
            </span>
            <span
              style={{
                fontSize: "0.64rem",
                fontFamily: "'Orbitron', monospace",
                color: "var(--neon-cyan)",
                background: "rgba(0, 210, 190, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(0, 210, 190, 0.3)",
                fontWeight: "800",
              }}
            >
              11 TEAMS · 22 DRIVERS
            </span>
          </div>

          {/* Technical formula beacon */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              color: "#d0d6e6",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              padding: "3px 10px",
              borderRadius: "5px",
            }}
          >
            <span style={{ color: "var(--neon-cyan)" }}>⚡ 350kW MGU-K</span>
            <span>·</span>
            <span style={{ color: "#38bdf8" }}>🌀 ACTIVE AERO</span>
            <span>·</span>
            <span style={{ color: "var(--neon-green)", fontWeight: "800" }}>💰 $135.0M COST CAP</span>
          </div>
        </div>

        {/* Right: 4-Tab View Switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.5)",
            padding: "3px",
            borderRadius: "7px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            gap: "3px",
          }}
        >
          {[
            { id: "teams", icon: "🏎️", label: "3D SHOWROOM" },
            { id: "drivers", icon: "👤", label: "22 DRIVERS" },
            { id: "ratings", icon: "📊", label: "TECH RATINGS" },
            { id: "dossier", icon: "🛠️", label: "PIT DOSSIER" },
          ].map((tab) => {
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                aria-pressed={isActive}
                aria-label={`Open ${tab.label} view`}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(232,0,45,0.95) 0%, rgba(180,0,30,0.98) 100%)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "5px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 0 14px rgba(232,0,45,0.5)" : "none",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════ TIER 2: CONTEXTUAL CONTROL & FILTER DECK (40px) ════════ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          background: "rgba(12, 15, 24, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "6px",
          padding: "5px 12px",
          flexWrap: "wrap",
          minHeight: "40px",
          boxSizing: "border-box",
        }}
      >
        {/* VIEW 1: TEAMS CONTROLS */}
        {viewMode === "teams" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px" }}>
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                aria-label="Search Formula 1 constructors"
                placeholder="🔍 Search 11 Constructors by name, engine, base, principal..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontFamily: "'Rajdhani', sans-serif",
                  outline: "none",
                }}
              />
              {teamSearch && (
                <button
                  onClick={() => setTeamSearch("")}
                  aria-label="Clear constructor search"
                  style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
                PU:
              </span>
              {[
                { id: "all", label: "ALL (11)" },
                { id: "mercedes", label: "MERCEDES (4)" },
                { id: "ferrari", label: "FERRARI (3)" },
                { id: "redbull", label: "RB-FORD (2)" },
                { id: "honda", label: "HONDA (1)" },
                { id: "audi", label: "AUDI (1)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTeamFilterPU(f.id)}
                  aria-pressed={teamFilterPU === f.id}
                  style={{
                    background: teamFilterPU === f.id ? "rgba(232,0,45,0.25)" : "rgba(255,255,255,0.04)",
                    color: teamFilterPU === f.id ? "var(--neon-red)" : "var(--text-secondary)",
                    border: `1px solid ${teamFilterPU === f.id ? "var(--neon-red)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "3px",
                    padding: "3px 8px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
                SORT:
              </span>
              {[
                { id: "rank", label: "🏆 RANK" },
                { id: "budget", label: "💰 BUDGET" },
                { id: "alpha", label: "🔤 A-Z" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTeamSortMode(s.id)}
                  aria-pressed={teamSortMode === s.id}
                  style={{
                    background: teamSortMode === s.id ? "rgba(0,210,190,0.18)" : "rgba(255,255,255,0.04)",
                    color: teamSortMode === s.id ? "var(--neon-cyan)" : "var(--text-secondary)",
                    border: `1px solid ${teamSortMode === s.id ? "var(--neon-cyan)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "3px",
                    padding: "3px 8px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {s.label}
                </button>
              ))}
              <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 6px", borderRadius: "3px", marginLeft: "4px", fontWeight: "700" }}>
                {processedTeams.length} TEAMS
              </span>
            </div>
          </>
        )}

        {/* VIEW 2: DRIVERS CONTROLS */}
        {viewMode === "drivers" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px" }}>
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                aria-label="Search Formula 1 drivers"
                placeholder="🔍 Search 22 Drivers by name, team, code, #number..."
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontFamily: "'Rajdhani', sans-serif",
                  outline: "none",
                }}
              />
              {driverSearch && (
                <button
                  onClick={() => setDriverSearch("")}
                  aria-label="Clear driver search"
                  style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
                FILTER:
              </span>
              {[
                { id: "all", label: "ALL (22)" },
                { id: "champions", label: "👑 CHAMPIONS (4)" },
                { id: "winners", label: "⚡ GP WINNERS (11)" },
                { id: "rookies", label: "⭐ ROOKIES (6)" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDriverFilterCategory(f.id)}
                  aria-pressed={driverFilterCategory === f.id}
                  style={{
                    background: driverFilterCategory === f.id ? "rgba(232,0,45,0.25)" : "rgba(255,255,255,0.04)",
                    color: driverFilterCategory === f.id ? "var(--neon-red)" : "var(--text-secondary)",
                    border: `1px solid ${driverFilterCategory === f.id ? "var(--neon-red)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "3px",
                    padding: "3px 8px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="driver-team-filter" style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                TEAM:
              </label>
              <select
                id="driver-team-filter"
                value={driverFilterTeam}
                onChange={(e) => setDriverFilterTeam(e.target.value)}
                style={{ background: "rgba(0,0,0,0.45)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "3px", padding: "3px 6px", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", cursor: "pointer" }}
              >
                <option value="all">All teams</option>
                {teams.map((team) => <option key={team.team} value={team.team}>{team.team}</option>)}
              </select>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginRight: "2px" }}>
                SORT:
              </span>
              {[
                { id: "points", label: "📊 STANDINGS" },
                { id: "wins", label: "🏆 WINS" },
                { id: "number", label: "🔢 CAR #" },
                { id: "rating", label: "🛡️ RATING" },
                { id: "name", label: "🔤 NAME" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDriverSortMode(s.id)}
                  aria-pressed={driverSortMode === s.id}
                  style={{
                    background: driverSortMode === s.id ? "rgba(0,210,190,0.18)" : "rgba(255,255,255,0.04)",
                    color: driverSortMode === s.id ? "var(--neon-cyan)" : "var(--text-secondary)",
                    border: `1px solid ${driverSortMode === s.id ? "var(--neon-cyan)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "3px",
                    padding: "3px 8px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {s.label}
                </button>
              ))}
              <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.12)", border: "1px solid rgba(0,210,190,0.3)", padding: "2px 6px", borderRadius: "3px", marginLeft: "4px", fontWeight: "700" }}>
                {processedDrivers.length} PILOTS
              </span>
            </div>
          </>
        )}

        {/* VIEW 3: RATINGS CONTROLS */}
        {viewMode === "ratings" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-red)", fontWeight: "800" }}>
                ⚡ 2026 TECHNICAL RATINGS
              </span>
              <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif" }}>
                Team-by-team Aero Efficiency, 350kW MGU-K PU, Pit Stop & V-Max Metrics
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.1)", border: "1px solid rgba(0,210,190,0.25)", padding: "2px 8px", borderRadius: "3px" }}>
                #1 MCLAREN · AERO BENCHMARK (97/100)
              </span>
              <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-yellow)", background: "rgba(255,221,0,0.1)", border: "1px solid rgba(255,221,0,0.25)", padding: "2px 8px", borderRadius: "3px" }}>
                1.96s · FASTEST PIT STOP (RBR)
              </span>
              <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 6px", borderRadius: "3px", fontWeight: "700" }}>
                11 CONSTRUCTORS
              </span>
            </div>
          </>
        )}

        {/* VIEW 4: PIT DOSSIER CONTROLS */}
        {viewMode === "dossier" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", whiteSpace: "nowrap" }}>
                SELECT TEAM:
              </span>
              {teams.map((t) => {
                const isSel = t.team.toLowerCase() === selectedTeamCode.toLowerCase();
                const col = t.primary_color || "var(--neon-red)";
                return (
                  <button
                    key={t.team}
                    onClick={() => setSelectedTeamCode(t.team)}
                    style={{
                      background: isSel ? col : "rgba(255,255,255,0.05)",
                      color: isSel ? "#ffffff" : "var(--text-secondary)",
                      border: `1px solid ${isSel ? col : "rgba(255,255,255,0.1)"}`,
                      borderRadius: "3px",
                      padding: "2px 7px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.62rem",
                      fontWeight: "800",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {t.short_code || t.team.slice(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.12)", border: "1px solid rgba(0,210,190,0.3)", padding: "2px 8px", borderRadius: "3px", whiteSpace: "nowrap", fontWeight: "800" }}>
              ACTIVE: {selectedTeamCode.toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODE 1: ALL 11 TEAMS & OFFICIAL CARS (2026 Paddock Showroom)
          ══════════════════════════════════════════════════════════════ */}
      {viewMode === "teams" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* 11 Constructors Showroom Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "22px" }}>
            {processedTeams.map((t) => {
              const color = t.primary_color || "var(--neon-red)";
              const carImg = t.car_image_url || getTeamCar(t.team);
              const logoImg = getTeamLogo(t.team) || t.logo_url;
              const tech = TEAM_TECH_DATA[t.team] || {};
              const perf = TEAM_PERFORMANCE_2026[t.team] || {};
              const officialRank = tech.rank || CONSTRUCTOR_RANK_ORDER[t.team] || 99;
              // Ensure we always have the 2 official drivers for this team
              const rawDriverList = drivers.filter(
                (d) => (t.drivers && t.drivers.includes(d.code)) || d.team.toLowerCase() === t.team.toLowerCase()
              );
              const teamDriverList = rawDriverList.length >= 2 ? rawDriverList : (
                (t.drivers || []).map(code => {
                  const found = STATIC_DRIVERS.find(sd => sd.code === code);
                  if (found) return found;
                  const prof = DRIVER_PROFILES_2026[code];
                  return {
                    code,
                    name: prof?.full_name || code,
                    number: prof?.number || 0,
                    points: prof?.career_points || 0,
                    nationality: prof?.nationality || "FIA",
                    flag: prof?.country_code || "🏁",
                    photo_url: DRIVER_PHOTOS[code] || "",
                  };
                })
              );

              const totalBudget = t.total_budget || 135000000;
              const spentBudget = t.spent || 110000000;
              const spentPct = Math.min(100, Math.round((spentBudget / totalBudget) * 100));
              const remainingBudget = ((totalBudget - spentBudget) / 1000000).toFixed(1);

              const isChampion = officialRank === 1;
              const isPodiumTeam = officialRank <= 3;

              return (
                <div
                  key={t.team}
                  onClick={() => {
                    setSelectedTeamCode(t.team);
                    setViewMode("dossier");
                  }}
                  style={{
                    background: "linear-gradient(180deg, rgba(18, 22, 36, 0.96) 0%, rgba(9, 12, 19, 0.98) 100%)",
                    borderTop: `3px solid ${color}`,
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "14px 16px 12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.55)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 14px 36px ${color}33, 0 0 20px ${color}1a`;
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderTopColor = color;
                    e.currentTarget.style.borderRightColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.55)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Subtle Team Color Radial Underglow */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle at 85% 15%, ${color}14 0%, transparent 65%)`,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Giant Angled Constructor Rank Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "-8px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "5.5rem",
                      fontWeight: "900",
                      opacity: "0.035",
                      color: "#fff",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    #{String(officialRank).padStart(2, "0")}
                  </div>

                  {/* ── CARD HEADER: Rank, Title, Chassis, Engine & Crest ── */}
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Rank & Chassis Badges */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.68rem",
                              fontWeight: "800",
                              color: isChampion ? "var(--neon-yellow)" : isPodiumTeam ? "#ffffff" : color,
                              background: isChampion ? "rgba(255,221,0,0.18)" : `${color}20`,
                              border: `1px solid ${isChampion ? "rgba(255,221,0,0.5)" : color + "55"}`,
                              padding: "2px 7px",
                              borderRadius: "4px",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {isChampion ? "👑 #01 CHAMPION" : `#${String(officialRank).padStart(2, "0")} CONSTRUCTOR`}
                          </span>

                          <span
                            style={{
                              fontSize: "0.66rem",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "700",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "#e2e8f0",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {tech.chassis || t.car_model || "2026 SPEC"}
                          </span>

                          {tech.isNewEntry && (
                            <span
                              style={{
                                fontSize: "0.64rem",
                                fontFamily: "'Orbitron', monospace",
                                fontWeight: "800",
                                background: "rgba(255,199,44,0.18)",
                                border: "1px solid #FFC72C",
                                color: "#FFC72C",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              ★ NEW 11TH TEAM
                            </span>
                          )}
                        </div>

                        {/* Full Constructor Title */}
                        <h3
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "1.15rem",
                            fontWeight: "900",
                            color: "#ffffff",
                            letterSpacing: "0.02em",
                            margin: 0,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.full_name || t.team}
                        </h3>

                        {/* Location & Power Unit Architecture */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.70rem", marginTop: "4px", flexWrap: "wrap" }}>
                          <span style={{ color: "var(--text-dim)" }}>📍 {t.base_location || tech.headquarters || "Europe"}</span>
                          <span>·</span>
                          <span style={{ color: "#ffffff", fontWeight: "600" }}>⚡ {t.power_unit || "Works Turbo Hybrid"}</span>
                        </div>
                      </div>

                      {/* Official Constructor Crest + Rating Pill */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                        {logoImg ? (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              padding: "5px",
                              background: "rgba(0,0,0,0.45)",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                            }}
                          >
                            <img
                              src={logoImg}
                              alt={`${t.team} logo`}
                              referrerPolicy="no-referrer"
                              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ) : (
                          <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "0.9rem", color: "#fff" }}>
                            {t.short_code || t.team.slice(0, 3)}
                          </div>
                        )}

                        {perf && perf.overallScore && (
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.62rem",
                              fontWeight: "800",
                              color: isChampion ? "var(--neon-yellow)" : "var(--neon-cyan)",
                              background: "rgba(0,0,0,0.4)",
                              border: `1px solid ${color}44`,
                              padding: "1px 5px",
                              borderRadius: "3px",
                            }}
                          >
                            INDEX {perf.overallScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── 2026 CAR HYPER-SHOWROOM STAGE (Pedestal & Underglow) ── */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "115px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "radial-gradient(ellipse at 50% 65%, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.3) 70%)",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Micro Tech HUD corner tags */}
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        left: "8px",
                        fontSize: "0.56rem",
                        fontFamily: "'Orbitron', monospace",
                        color: "var(--neon-cyan)",
                        fontWeight: "700",
                        letterSpacing: "0.06em",
                        opacity: 0.85,
                        zIndex: 3,
                      }}
                    >
                      🌀 ACTIVE AERO [X/Z-MODE]
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "8px",
                        fontSize: "0.56rem",
                        fontFamily: "'Orbitron', monospace",
                        color: "var(--neon-green)",
                        fontWeight: "700",
                        letterSpacing: "0.06em",
                        opacity: 0.85,
                        zIndex: 3,
                      }}
                    >
                      ⚡ 350kW MGU-K · 100% BIO-FUEL
                    </div>

                    {/* Perspective 3D Elliptical Glow Turntable Floor */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "8%",
                        right: "8%",
                        height: "46px",
                        background: `radial-gradient(ellipse at center, ${color}55 0%, ${color}15 50%, transparent 75%)`,
                        borderRadius: "50%",
                        filter: "blur(4px)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Laser Horizon Floor Line */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "16px",
                        width: "82%",
                        height: "1px",
                        background: `linear-gradient(90deg, transparent, ${color}aa, transparent)`,
                        boxShadow: `0 0 8px ${color}`,
                        pointerEvents: "none",
                      }}
                    />

                    {/* 2026 Car Cutout Image */}
                    {carImg ? (
                      <img
                        src={carImg}
                        alt={`${t.team} 2026 Car`}
                        style={{
                          maxWidth: "96%",
                          maxHeight: "105px",
                          objectFit: "contain",
                          filter: `drop-shadow(0 10px 16px ${color}55)`,
                          transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                          position: "relative",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.06) translateY(-3px)";
                          e.currentTarget.style.filter = `drop-shadow(0 14px 22px ${color}88)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1) translateY(0)";
                          e.currentTarget.style.filter = `drop-shadow(0 10px 16px ${color}55)`;
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontSize: "0.75rem" }}>
                        🏎️ 2026 Regulation Specification Model
                      </div>
                    )}
                  </div>

                  {/* ── HERO PILOTS COCKPIT BAR (Driver Duo On Card Face) ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {teamDriverList.map((dr) => {
                      const faceUrl = getDriverFaceUrl(dr.code, dr.photo_url);
                      const drProfile = DRIVER_PROFILES_2026[dr.code] || {};
                      const drCountry = NATIONALITY_TO_FIA[dr.nationality] || drProfile.country_code || (dr.nationality ? dr.nationality.slice(0, 3).toUpperCase() : "FIA");
                      const surname = (dr.name || drProfile.full_name || dr.code).split(" ").slice(-1)[0].toUpperCase();

                      return (
                        <div
                          key={dr.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDriverModal(dr);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "6px",
                            padding: "5px 8px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = color;
                            e.currentTarget.style.background = `${color}22`;
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {/* Circular Driver Avatar */}
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              background: `${color}33`,
                              border: `1.5px solid ${color}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: `0 0 6px ${color}44`,
                            }}
                          >
                            {faceUrl ? (
                              <img
                                src={faceUrl}
                                alt={dr.name}
                                referrerPolicy="no-referrer"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  const fb = dr.photo_url || getDriverPhoto(dr.code);
                                  if (e.target.src !== fb) e.target.src = fb;
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: "0.8rem" }}>🏎️</span>
                            )}
                          </div>

                          {/* Driver Number & Surname */}
                          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: color, fontWeight: "900" }}>
                                #{dr.number}
                              </span>
                              <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {surname}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", display: "flex", gap: "4px", alignItems: "center" }}>
                              <span style={{ color: "var(--neon-yellow)", fontWeight: "800" }}>{drCountry}</span>
                              <span>·</span>
                              <span>{dr.points || drProfile.career_points || 0} PTS</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── INTEGRATED TELEMETRY HUD & COST CAP CAPSULE ── */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {/* 4 Telemetry Metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px", textAlign: "center", fontSize: "0.60rem", fontFamily: "'Orbitron', monospace" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "3px 2px", borderRadius: "3px" }}>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.52rem" }}>AERO</div>
                        <div style={{ color: "var(--neon-cyan)", fontWeight: "800", marginTop: "1px" }}>{perf.aeroEfficiency || 90}%</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "3px 2px", borderRadius: "3px" }}>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.52rem" }}>350kW PU</div>
                        <div style={{ color: "var(--neon-green)", fontWeight: "800", marginTop: "1px" }}>{perf.powerUnitDeployment || 90}%</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "3px 2px", borderRadius: "3px" }}>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.52rem" }}>PIT STOP</div>
                        <div style={{ color: "#ffaa00", fontWeight: "800", marginTop: "1px" }}>#{perf.pitRank || 5} ({perf.avgPitTime || "2.3s"})</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "3px 2px", borderRadius: "3px" }}>
                        <div style={{ color: "var(--text-dim)", fontSize: "0.52rem" }}>V-MAX</div>
                        <div style={{ color: "#ffffff", fontWeight: "800", marginTop: "1px" }}>{perf.topSpeedKmh || 340}k</div>
                      </div>
                    </div>

                    {/* Cost Cap Financial Telemetry Bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.62rem", marginBottom: "3px", fontFamily: "'Orbitron', monospace" }}>
                        <span style={{ color: "var(--text-dim)" }}>
                          COST CAP: ${(spentBudget / 1000000).toFixed(1)}M / $135M
                        </span>
                        <span style={{ color: "var(--neon-green)", fontWeight: "700" }}>
                          +${remainingBudget}M HEADROOM
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${spentPct}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${color}, var(--neon-cyan))`,
                            borderRadius: "2px",
                            boxShadow: `0 0 6px ${color}88`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── CARD ACTION FOOTER ── */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: "6px",
                    }}
                  >
                    <span style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                      🏆 {t.championships || 0} WCC TITLES · {tech.powerOutput || "1,040+ HP"}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        color: color,
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      OPEN DOSSIER →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODE 2: ALL 22 DRIVERS (F1 Holographic Trading Cards Grid)
          ══════════════════════════════════════════════════════════════ */}
      {viewMode === "drivers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* 22 Drivers Holographic Trading Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "22px" }}>
            {processedDrivers.map((d, index) => {
              const teamObj = teams.find((t) => t.team.toLowerCase() === d.team.toLowerCase() || (t.drivers && t.drivers.includes(d.code)));
              const color = teamObj?.primary_color || "var(--neon-red)";
              const photoImg = d.photo_url || getDriverPhoto(d.code);
              const logoImg = getTeamLogo(d.team) || teamObj?.logo_url;
              const nameParts = d.name.split(" ");
              let firstName = nameParts.slice(0, -1).join(" ") || d.name;
              let lastName = nameParts.slice(-1)[0] || "";
              if (d.code === "SAI" || d.name.toLowerCase().includes("sainz")) {
                firstName = "CARLOS";
                lastName = "SAINZ JR.";
              }

              const profile = DRIVER_PROFILES_2026[d.code] || {};
              const ratings = profile.telemetry_ratings || { pace: 88, qualifying: 89, racecraft: 87, tire_mgmt: 86 };
              const ovr = Math.round((ratings.pace * 0.35 + ratings.qualifying * 0.3 + ratings.racecraft * 0.25 + (ratings.tire_mgmt || 85) * 0.1));
              const wdcCount = d.championships || profile.championships || 0;
              const wins = d.wins || profile.wins || 0;
              const podiums = d.podiums || profile.podiums || 0;
              const poles = profile.pole_positions || 0;
              const careerPoints = d.points || profile.career_points || 0;

              return (
                <div
                  key={d.code}
                  onClick={() => {
                    setActiveDriverModal(d);
                  }}
                  style={{
                    background: "var(--bg-card)",
                    borderTop: `4px solid ${color}`,
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    padding: "18px 20px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "450px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 16px 36px ${color}33`;
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderTopColor = color;
                    e.currentTarget.style.borderRightColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Holographic Radial Ambient Glow behind Driver */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(circle at 65% 40%, ${color}28 0%, transparent 65%)`,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Giant Angled Driver Number Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "-15px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "8.5rem",
                      fontWeight: "900",
                      opacity: "0.06",
                      color: "#fff",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    {d.number}
                  </div>

                  {/* Subtle Team Logo Watermark Badge */}
                  {logoImg && (
                    <img
                      src={logoImg}
                      alt=""
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "52px",
                        width: "68px",
                        height: "68px",
                        objectFit: "contain",
                        opacity: 0.08,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* ── CARD TOP RIBBON: Rank, Driver Code, Flag & OVR Shield ── */}
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {/* Driver Code & Car Number */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            background: color,
                            color: "#ffffff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontWeight: "900",
                            letterSpacing: "0.06em",
                            boxShadow: `0 2px 8px ${color}66`,
                          }}
                        >
                          {d.code} #{d.number}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,210,190,0.12)", padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(0,210,190,0.35)" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "900", letterSpacing: "0.06em" }}>
                            {NATIONALITY_TO_FIA[d.nationality] || (d.nationality ? d.nationality.slice(0, 3).toUpperCase() : (d.country ? d.country.slice(0, 3).toUpperCase() : "FIA"))}
                          </span>
                        </div>
                      </div>

                      {/* Right: Overall Rating & WDC Crown */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {wdcCount > 0 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "900",
                              color: "var(--neon-yellow)",
                              background: "rgba(255,221,0,0.15)",
                              border: "1px solid rgba(255,221,0,0.4)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              boxShadow: "0 0 8px rgba(255,221,0,0.3)",
                            }}
                          >
                            👑 {wdcCount}x WDC
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRadioModalDriver(d.code);
                          }}
                          style={{
                            background: "rgba(0, 210, 190, 0.15)",
                            border: "1px solid rgba(0, 210, 190, 0.4)",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.62rem",
                            fontWeight: "800",
                            color: "var(--neon-cyan)",
                            cursor: "pointer",
                          }}
                          title={`Listen to ${d.name} authentic team radio`}
                        >
                          📻 RADIO
                        </button>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            background: "rgba(0,0,0,0.7)",
                            border: `1.5px solid ${ovr >= 94 ? "var(--neon-yellow)" : ovr >= 90 ? "var(--neon-cyan)" : color}`,
                            borderRadius: "6px",
                            padding: "2px 8px",
                            boxShadow: `0 0 10px ${ovr >= 94 ? "rgba(255,221,0,0.4)" : color + "55"}`,
                          }}
                        >
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "900", color: "#ffffff" }}>
                            {ovr}
                          </span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                            OVR
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Driver Nameplate */}
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "600" }}>
                        {firstName}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "1.55rem",
                          fontWeight: "900",
                          color: "#ffffff",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          lineHeight: 1.1,
                          marginTop: "1px",
                        }}
                      >
                        {lastName}
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: color, fontWeight: "700", fontFamily: "'Orbitron', monospace", marginTop: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
                        {d.team} {teamObj?.car_model ? `· ${teamObj.car_model}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* ── HERO DRIVER BUST PORTRAIT STAGE ── */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "235px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: `radial-gradient(circle at 50% 28%, ${color}35 0%, rgba(10,12,18,0.92) 75%)`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      marginTop: "6px",
                      border: `1px solid ${color}28`,
                      boxShadow: `inset 0 0 25px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {/* Watermark Car Number in Stage Background */}
                    <div
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "4px",
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: "5.8rem",
                        fontWeight: "900",
                        color: `${color}18`,
                        lineHeight: 0.85,
                        userSelect: "none",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    >
                      {d.number}
                    </div>

                    {/* Team Color Halo Flare */}
                    <div
                      style={{
                        position: "absolute",
                        top: "15%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "140px",
                        height: "140px",
                        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                        borderRadius: "50%",
                        filter: "blur(18px)",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />

                    {/* Driver Hero Portrait - Focused Bust/Torso Crop */}
                    {photoImg ? (
                      <img
                        src={photoImg}
                        alt={d.name}
                        style={{
                          width: "100%",
                          height: "235px",
                          objectFit: "cover",
                          objectPosition: "top center",
                          filter: `drop-shadow(0 10px 20px rgba(0,0,0,0.95)) contrast(1.05)`,
                          transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                          position: "relative",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(2px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: color }}>
                        🏎️
                      </div>
                    )}

                    {/* Smooth Bottom Vignette Fade into Card Dark Carbon */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "45px",
                        background: "linear-gradient(to top, rgba(12,14,22,0.98), transparent)",
                        zIndex: 3,
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  {/* ── HUD 4-TIER TELEMETRY RATINGS BARS ── */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginTop: "8px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 12px",
                    }}
                  >
                    {[
                      { label: "PACE", val: ratings.pace },
                      { label: "QUALIFYING", val: ratings.qualifying },
                      { label: "RACECRAFT", val: ratings.racecraft },
                      { label: "TIRE MGMT", val: ratings.tire_mgmt || 85 },
                    ].map((m) => (
                      <div key={m.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginBottom: "2px" }}>
                          <span>{m.label}</span>
                          <span style={{ color: "#ffffff", fontWeight: "700" }}>{m.val}</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${m.val}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${color}, var(--neon-cyan))`,
                              borderRadius: "2px",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── CAREER STATS STRIP & DOSSIER BUTTON ── */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      paddingTop: "10px",
                      marginTop: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                      <span><strong>{careerPoints}</strong> PTS</span>
                      <span>·</span>
                      <span>🏆 <strong>{wins}</strong> WINS</span>
                      <span>·</span>
                      <span>🍾 <strong>{podiums}</strong> PODS</span>
                    </div>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontFamily: "'Orbitron', monospace",
                        fontWeight: "800",
                        color: color,
                        background: `${color}18`,
                        border: `1px solid ${color}55`,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      DOSSIER →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODE 3: PIT DOSSIER & BUDGET (Interactive Cockpit View)
          ══════════════════════════════════════════════════════════════ */}
      {viewMode === "dossier" && (() => {
        const currentTech = TEAM_TECH_DATA[currentTeam.team] || TEAM_TECH_DATA[currentTeam.short_code] || {};
        const currentRank = CONSTRUCTOR_RANK_ORDER[currentTeam.team] || 99;
        const currentCar = currentTeam.car_image_url || getTeamCar(currentTeam.team);
        const currentColor = currentTeam.primary_color || "var(--neon-red)";
        const currentLogo = getTeamLogo(currentTeam.team) || currentTeam.logo_url;
        const spent = currentTeam.spent || 110000000;
        const headroom = Math.max(0, 135000000 - spent);
        const spentPct = Math.min(100, (spent / 135000000) * 100);

        return (
          <div style={{ display: "grid", gridTemplateColumns: "390px 1fr", gap: "24px", alignItems: "start" }}>
            {/* ── 11 Teams Column (High-Tech Constructor Selector) ── */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "calc(100vh - 170px)",
              overflowY: "auto",
              paddingRight: "8px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.18) transparent",
            }}>
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  background: "rgba(11, 11, 15, 0.95)",
                  backdropFilter: "blur(12px)",
                  zIndex: 3,
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "800", color: "#ffffff", letterSpacing: "0.12em" }}>
                    CONSTRUCTORS GRID
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Official 11 Technical Dossiers · 2026
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.7rem",
                    fontWeight: "800",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    color: "var(--neon-cyan)",
                  }}
                >
                  11 TEAMS
                </span>
              </div>

              {teams.map((t) => {
                const isSelected = t.team.toLowerCase() === currentTeam.team.toLowerCase();
                const color = t.primary_color || "var(--neon-red)";
                const logoImg = getTeamLogo(t.team) || t.logo_url;
                const rank = CONSTRUCTOR_RANK_ORDER[t.team] || 99;
                const tech = TEAM_TECH_DATA[t.team] || {};
                const isChampion = rank === 1;

                return (
                  <div
                    key={t.team}
                    onClick={() => setSelectedTeamCode(t.team)}
                    style={{
                      flex: "0 0 auto",
                      flexShrink: 0,
                      minHeight: "78px",
                      background: isSelected
                        ? `linear-gradient(135deg, ${color}28 0%, rgba(18,20,32,0.98) 100%)`
                        : "rgba(18, 20, 30, 0.8)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: isSelected ? color : "rgba(255,255,255,0.08)",
                      borderLeft: `4px solid ${color}`,
                      borderRadius: "10px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "6px",
                      transition: "all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                      boxShadow: isSelected ? `0 6px 20px ${color}33, inset 0 1px 0 rgba(255,255,255,0.1)` : "none",
                      position: "relative",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.transform = "translateX(4px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }
                    }}
                  >
                    {/* Top Row: Rank badge, Crest, Team Name & Chassis */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {/* Rank Badge */}
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.68rem",
                            fontWeight: "900",
                            color: isChampion ? "var(--neon-yellow)" : isSelected ? "#fff" : color,
                            background: isChampion ? "rgba(255,221,0,0.18)" : `${color}20`,
                            border: `1px solid ${isChampion ? "rgba(255,221,0,0.4)" : color + "44"}`,
                            borderRadius: "4px",
                            padding: "2px 6px",
                            flexShrink: 0,
                          }}
                        >
                          #{String(rank).padStart(2, "0")}
                        </span>

                        {/* Team Crest */}
                        {logoImg ? (
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              padding: "3px",
                              background: "rgba(0,0,0,0.4)",
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={logoImg}
                              alt={t.team}
                              referrerPolicy="no-referrer"
                              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        ) : null}

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: "900", fontSize: "0.95rem", color: isSelected ? "#ffffff" : "var(--text-primary)", letterSpacing: "0.02em" }}>
                            {t.team}
                          </span>
                          {(tech.chassis || t.car_model) && (
                            <span style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", padding: "1px 5px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "3px", color: "var(--text-secondary)", flexShrink: 0 }}>
                              {tech.chassis || t.car_model}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Indicator Arrow */}
                      {isSelected && (
                        <span style={{ color: color, fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", flexShrink: 0 }}>
                          ▶
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Base Location/PU & Driver Pills */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "5px", marginTop: "1px" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "210px" }}>
                        {tech.flag || "📍"} {t.base_location || tech.headquarters || "Europe"} · <span style={{ color: "var(--text-dim)" }}>{t.power_unit ? t.power_unit.split(" ")[0] : "Hybrid"}</span>
                      </span>

                      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                        {t.drivers && t.drivers.map((code) => {
                          const drv = drivers.find((d) => d.code === code);
                          return (
                            <span
                              key={code}
                              style={{
                                fontFamily: "'Orbitron', monospace",
                                fontSize: "0.65rem",
                                fontWeight: "700",
                                padding: "2px 6px",
                                background: isSelected ? `${color}33` : "rgba(0,0,0,0.5)",
                                borderRadius: "4px",
                                border: `1px solid ${isSelected ? color + "66" : "rgba(255,255,255,0.08)"}`,
                                color: "#fff",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              {drv ? `#${drv.number} ` : ""}{code}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Right Panel: Selected Team Engineering Cockpit & Dossier ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Team Header Banner with Big Car Image & Ground Glow */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${currentColor}28 0%, rgba(18,20,32,0.92) 50%, var(--bg-card) 100%)`,
                  border: `1px solid ${currentColor}66`,
                  borderTop: `4px solid ${currentColor}`,
                  borderRadius: "16px",
                  padding: "24px 28px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 30px ${currentColor}15`,
                }}
              >
                {/* Giant Angled Constructor Rank Watermark */}
                <div
                  style={{
                    position: "absolute",
                    right: "-10px",
                    top: "-25px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "8.5rem",
                    fontWeight: "900",
                    opacity: "0.04",
                    color: "#fff",
                    pointerEvents: "none",
                    lineHeight: 1,
                  }}
                >
                  #{String(currentRank).padStart(2, "0")}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "center", position: "relative", zIndex: 1 }}>
                  <div>
                    {/* Top Ribbons & Badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                      {currentLogo && (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            padding: "6px",
                            background: "rgba(0,0,0,0.5)",
                            borderRadius: "10px",
                            border: `1.5px solid ${currentColor}66`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: `0 4px 14px ${currentColor}33`,
                          }}
                        >
                          <img
                            src={currentLogo}
                            alt={currentTeam.team}
                            referrerPolicy="no-referrer"
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background: currentColor,
                          color: "#fff",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.78rem",
                          fontWeight: "900",
                          borderRadius: "4px",
                          letterSpacing: "0.06em",
                          boxShadow: `0 2px 10px ${currentColor}66`,
                        }}
                      >
                        {currentTeam.short_code || currentTeam.team.slice(0, 3).toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.76rem",
                          color: currentRank === 1 ? "var(--neon-yellow)" : "#ffffff",
                          fontWeight: "800",
                          background: currentRank === 1 ? "rgba(255,221,0,0.18)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${currentRank === 1 ? "rgba(255,221,0,0.5)" : "rgba(255,255,255,0.12)"}`,
                          padding: "4px 10px",
                          borderRadius: "4px",
                        }}
                      >
                        {currentRank === 1 ? "👑 #01 REIGNING CHAMPION" : `#${String(currentRank).padStart(2, "0")} WCC CONSTRUCTOR`}
                      </span>

                      {currentTeam.championships > 0 && (
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", color: "var(--neon-yellow)", fontWeight: "700" }}>
                          🏆 {currentTeam.championships} World Titles
                        </span>
                      )}
                    </div>

                    {/* Team Title */}
                    <h1
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "2.1rem",
                        color: "#ffffff",
                        fontWeight: "900",
                        letterSpacing: "0.03em",
                        margin: 0,
                        lineHeight: 1.15,
                      }}
                    >
                      {currentTeam.full_name || currentTeam.team}
                    </h1>

                    {/* Location & Key Personnel */}
                    <div style={{ display: "flex", gap: "12px", color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <span>{currentTech.flag || "📍"} {currentTeam.base_location || currentTech.headquarters || "Europe HQ"}</span>
                      <span>·</span>
                      <span>👔 Principal: <strong style={{ color: "#fff" }}>{currentTeam.team_principal || "Team Principal"}</strong></span>
                      <span>·</span>
                      <span>⚙️ Tech Dir: <strong style={{ color: currentColor }}>{currentTech.techDirector ? currentTech.techDirector.split("&")[0] : "Technical Team"}</strong></span>
                    </div>
                  </div>

                  {/* 2026 Car Cutout with 3D Reflection Floor */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "160px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Perspective floor underglow */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        width: "80%",
                        height: "40px",
                        background: `radial-gradient(ellipse at center, ${currentColor}44 0%, transparent 75%)`,
                        borderRadius: "50%",
                        filter: "blur(6px)",
                        pointerEvents: "none",
                      }}
                    />

                    {currentCar ? (
                      <img
                        src={currentCar}
                        alt={`${currentTeam.team} 2026 Car`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          objectFit: "contain",
                          filter: `drop-shadow(0 12px 24px ${currentColor}44)`,
                          transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                          position: "relative",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.08) translateY(-4px)";
                          e.currentTarget.style.filter = `drop-shadow(0 16px 32px ${currentColor}66)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1) translateY(0)";
                          e.currentTarget.style.filter = `drop-shadow(0 12px 24px ${currentColor}44)`;
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}>
                        🏎️ 2026 Chassis Specification
                      </div>
                    )}
                  </div>
                </div>

                {/* 2026 Technical Regulations Spec Bar (Zero Car Overlap) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginTop: "16px",
                    padding: "8px 14px",
                    background: "rgba(0, 0, 0, 0.55)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    ⚡ 350kW MGU-K HYBRID (470+ HP EV)
                  </span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "var(--neon-cyan)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    🌀 ACTIVE AERO (X/Z DUAL MODES)
                  </span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "var(--neon-green)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    🌱 100% ADVANCED BIO-E-FUEL
                  </span>
                  <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "var(--neon-yellow)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    ⚖️ 768KG MIN WEIGHT SPEC
                  </span>
                </div>
              </div>

              {/* ── 6-Matrix Technical Telemetry Grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                {[
                  {
                    title: "POWER UNIT & ARCHITECTURE",
                    value: currentTech.engineSpec || currentTeam.power_unit || "Works Turbo-Hybrid",
                    subtitle: "1.6L V6 Turbo + 350kW MGU-K",
                    icon: "🔧",
                    color: currentColor,
                  },
                  {
                    title: "COMBINED OUTPUT & TITLES",
                    value: `${currentTech.powerOutput || "1,040+ HP"}`,
                    subtitle: `🏆 ${currentTeam.championships || 0} World Constructors' Titles`,
                    icon: "⚡",
                    color: "var(--neon-cyan)",
                  },
                  {
                    title: "2026 CHASSIS & ACTIVE AERO",
                    value: currentTech.chassis || currentTeam.car_model || "2026 Spec",
                    subtitle: currentTech.aeroFeature ? currentTech.aeroFeature.slice(0, 38) + "..." : "Adaptive Wing Concept",
                    icon: "🌀",
                    color: "#ffffff",
                  },
                  {
                    title: "TECHNICAL LEADERSHIP",
                    value: currentTech.techDirector || "Engineering Division",
                    subtitle: `👔 Principal: ${currentTeam.team_principal || "Team Principal"}`,
                    icon: "📐",
                    color: currentColor,
                  },
                  {
                    title: "SUSTAINABLE BIO-FUEL PARTNER",
                    value: currentTech.fuelPartner || "FIA Approved Bio-Fuel",
                    subtitle: "Zero Net Carbon Emission Standard",
                    icon: "🌱",
                    color: "var(--neon-green)",
                  },
                  {
                    title: "GLOBAL HEADQUARTERS & BASE",
                    value: currentTeam.base_location || currentTech.headquarters || "Europe Campus",
                    subtitle: `${currentTech.flag || "📍"} Official FIA Registered Factory`,
                    icon: "📍",
                    color: "var(--neon-yellow)",
                  },
                ].map((spec) => (
                  <div
                    key={spec.title}
                    style={{
                      background: "rgba(18, 20, 32, 0.75)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderLeft: `3px solid ${spec.color}`,
                      borderRadius: "10px",
                      padding: "14px 16px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${spec.color}66`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderLeft = `3px solid ${spec.color}`;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em" }}>
                      <span>{spec.icon}</span>
                      <span>{spec.title}</span>
                    </div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {spec.value}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {spec.subtitle}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Cost Cap Financial Telemetry Bar ── */}
              <div
                style={{
                  background: "rgba(18, 20, 32, 0.75)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1rem" }}>💰</span>
                    <div>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", letterSpacing: "0.06em" }}>
                        FIA COST CAP FINANCIAL TELEMETRY
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                        Official 2026 Budget Ceiling: $135.0M
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "800", color: "#ffffff" }}>
                      ${(spent / 1000000).toFixed(1)}M SPENT
                    </span>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: "700", color: "var(--neon-green)", background: "rgba(0,204,68,0.12)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "4px" }}>
                      +${(headroom / 1000000).toFixed(1)}M HEADROOM
                    </span>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.12)", border: "1px solid rgba(0,210,190,0.3)", padding: "2px 8px", borderRadius: "4px" }}>
                      ✅ FIA COMPLIANT
                    </span>
                  </div>
                </div>

                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${spentPct}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${currentColor}, var(--neon-cyan))`,
                      borderRadius: "4px",
                      boxShadow: `0 0 12px ${currentColor}88`,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              {/* ── 2026 Official Driver Lineup: Cockpit Duo Cards ── */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", color: "#ffffff", letterSpacing: "0.1em", fontWeight: "800", textTransform: "uppercase" }}>
                      2026 Official Driver Cockpit & Dossiers
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Select pilot to launch interactive Formula1.com engineering dossier
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", color: currentColor, fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    CLICK PILOT TO INSPECT →
                  </span>
                </div>

                {teamDrivers.length === 0 ? (
                  <div style={{ padding: "36px", textAlign: "center", background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--text-secondary)" }}>
                    <span style={{ fontSize: "1.5rem" }}>🏎️</span>
                    <div style={{ fontFamily: "'Orbitron', monospace", marginTop: "8px", fontSize: "0.85rem" }}>
                      Loading 2026 driver dossier for {currentTeam.team}...
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {teamDrivers.map((driver, idx) => {
                      const driverPhoto = driver.photo_url || getDriverPhoto(driver.code);
                      const profile = DRIVER_PROFILES_2026[driver.code] || {};
                      const ratings = profile.telemetry_ratings || {
                        pace: Math.round(100 - (driver.base_pace - 83) * 10),
                        qualifying: 90,
                        racecraft: 88,
                        tire_mgmt: driver.tire_mgmt_rating || 85,
                      };
                      const ovr = Math.round(ratings.pace * 0.35 + ratings.qualifying * 0.3 + ratings.racecraft * 0.25 + (ratings.tire_mgmt || 85) * 0.1);
                      const nameParts = driver.name.split(" ");
                      const firstName = nameParts.slice(0, -1).join(" ") || driver.name;
                      const lastName = nameParts.slice(-1)[0] || "";

                      return (
                        <div
                          key={driver.code}
                          id={`driver-card-${driver.code}`}
                          className="driver-cockpit-card"
                          onClick={() => setActiveDriverModal(driver)}
                          style={{
                            background: "linear-gradient(180deg, rgba(24,24,32,0.85) 0%, rgba(14,16,24,0.95) 100%)",
                            borderTop: `4px solid ${currentColor}`,
                            borderRight: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            borderLeft: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            position: "relative",
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = currentColor;
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = `0 16px 36px ${currentColor}33`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderTopColor = currentColor;
                            e.currentTarget.style.borderRightColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
                          }}
                        >
                          {/* Giant Car Number Watermark */}
                          <div
                            style={{
                              position: "absolute",
                              right: "6px",
                              top: "-15px",
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "7.5rem",
                              fontWeight: "900",
                              opacity: "0.05",
                              color: "#fff",
                              pointerEvents: "none",
                              lineHeight: 1,
                            }}
                          >
                            {driver.number}
                          </div>

                          {/* Top: Badges, Name, OVR & Cutout */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 125px", gap: "14px", alignItems: "center", position: "relative", zIndex: 1 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    background: currentColor,
                                    fontFamily: "'Orbitron', monospace",
                                    fontWeight: "900",
                                    fontSize: "0.85rem",
                                    color: "#fff",
                                    boxShadow: `0 2px 8px ${currentColor}66`,
                                  }}
                                >
                                  #{driver.number}
                                </span>

                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <span>{driver.flag}</span> {driver.nationality}
                                </span>

                                {driver.championships > 0 && (
                                  <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-yellow)", background: "rgba(255,221,0,0.15)", border: "1px solid rgba(255,221,0,0.4)", padding: "1px 5px", borderRadius: "3px" }}>
                                    👑 {driver.championships}x WDC
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                {firstName}
                              </div>
                              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.45rem", fontWeight: "900", color: "#ffffff", lineHeight: 1.15, marginTop: "1px" }}>
                                {lastName}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: currentColor, fontWeight: "800" }}>
                                  {driver.code}
                                </span>
                                <span style={{ color: "var(--text-dim)" }}>·</span>
                                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "var(--neon-cyan)", fontWeight: "700" }}>
                                  {driver.points || 0} PTS
                                </span>
                                <span style={{ color: "var(--text-dim)" }}>·</span>
                                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "#fff", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                                  {ovr} OVR
                                </span>
                              </div>
                            </div>

                            {/* Driver Hero Bust Portrait with Halo Glow */}
                            <div
                              style={{
                                width: "115px",
                                height: "125px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                position: "relative",
                                background: `radial-gradient(circle at 50% 25%, ${currentColor}40 0%, rgba(10,12,20,0.9) 75%)`,
                                border: `1px solid ${currentColor}33`,
                                boxShadow: `inset 0 0 15px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)`,
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "center",
                              }}
                            >
                              {driverPhoto ? (
                                <img
                                  src={driverPhoto}
                                  alt={driver.name}
                                  style={{
                                    width: "100%",
                                    height: "125px",
                                    objectFit: "cover",
                                    objectPosition: "top center",
                                    filter: `drop-shadow(0 6px 12px rgba(0,0,0,0.9)) contrast(1.05)`,
                                    transition: "transform 0.25s ease",
                                  }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: currentColor }}>
                                  🏎️
                                </div>
                              )}
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: "25px",
                                  background: "linear-gradient(to top, rgba(14,16,24,0.95), transparent)",
                                  pointerEvents: "none",
                                }}
                              />
                            </div>
                          </div>

                          {/* 4-Tier Telemetry Ratings Mini Gauges */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "8px 12px",
                              background: "rgba(0,0,0,0.35)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              padding: "10px 12px",
                              borderRadius: "8px",
                            }}
                          >
                            {[
                              { label: "PACE", val: ratings.pace, color: "var(--neon-blue)" },
                              { label: "QUALIFYING", val: ratings.qualifying, color: currentColor },
                              { label: "RACECRAFT", val: ratings.racecraft, color: "var(--neon-yellow)" },
                              { label: "TIRE MGMT", val: ratings.tire_mgmt || 85, color: "var(--neon-green)" },
                            ].map((m) => (
                              <div key={m.label}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginBottom: "3px" }}>
                                  <span>{m.label}</span>
                                  <span style={{ color: "#fff", fontWeight: "800" }}>{m.val}</span>
                                </div>
                                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${m.val}%`,
                                      height: "100%",
                                      background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                                      borderRadius: "2px",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Career Stats Grid & Action Trigger */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                            <div style={{ display: "flex", gap: "10px", fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                              <span>🏆 <strong style={{ color: "#fff" }}>{driver.wins || 0}</strong> WINS</span>
                              <span>·</span>
                              <span>🍾 <strong style={{ color: "#fff" }}>{driver.podiums || 0}</strong> PODS</span>
                              <span>·</span>
                              <span>📊 <strong style={{ color: "var(--neon-cyan)" }}>{driver.points || 0}</strong> PTS</span>
                            </div>

                            <span
                              style={{
                                fontFamily: "'Orbitron', monospace",
                                fontSize: "0.7rem",
                                fontWeight: "800",
                                color: currentColor,
                                background: `${currentColor}18`,
                                border: `1px solid ${currentColor}55`,
                                padding: "4px 10px",
                                borderRadius: "4px",
                                letterSpacing: "0.04em",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              OPEN DOSSIER →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          MODE 4: 2026 CONSTRUCTOR RATINGS & TECHNICAL MATRIX
          ══════════════════════════════════════════════════════════════ */}
      {viewMode === "ratings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Header Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(232,0,45,0.15) 0%, rgba(0,210,190,0.12) 50%, rgba(255,170,0,0.12) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ background: "var(--neon-red)", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                  2026 RATINGS
                </span>
                <span style={{ color: "var(--neon-cyan)", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                  TECHNICAL PERFORMANCE EVALUATION
                </span>
              </div>
              <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.4rem", color: "#ffffff", margin: "6px 0 2px 0", letterSpacing: "0.05em" }}>
                HOW EVERY F1 2026 CONSTRUCTOR PERFORMS ON TRACK
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "800px" }}>
                Official team-by-team aerodynamic efficiency index, 350kW MGU-K power unit deployment, pit stop speed rankings, and engineering assessments for all 11 Constructors.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,210,190,0.3)", borderRadius: "8px", padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-cyan)" }}>
                  #1 MCLAREN
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  AERO BENCHMARK
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(232,0,45,0.3)", borderRadius: "8px", padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "var(--neon-red)" }}>
                  1.96s
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  FASTEST PIT STOP (RBR)
                </div>
              </div>
            </div>
          </div>

          {/* 11 Constructors Performance Table & Deep Dives */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Object.values(TEAM_PERFORMANCE_2026)
              .sort((a, b) => a.motorsportRank - b.motorsportRank)
              .map((perf) => {
                const teamObj = teams.find((t) => t.team.toLowerCase() === perf.team.toLowerCase()) || {};
                const color = teamObj.primary_color || "var(--neon-cyan)";
                const logoImg = getTeamLogo(perf.team) || teamObj.logo_url;
                const carImg = getTeamCar(perf.team) || teamObj.car_image_url;

                return (
                  <div
                    key={perf.team}
                    style={{
                      background: "linear-gradient(135deg, rgba(16,19,32,0.96) 0%, rgba(10,12,20,0.98) 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderLeft: `5px solid ${color}`,
                      borderRadius: "12px",
                      padding: "20px 24px",
                      display: "grid",
                      gridTemplateColumns: "280px 1fr 240px",
                      gap: "24px",
                      alignItems: "center",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Column 1: Rank, Logo, Name & Car */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "1rem",
                            fontWeight: "900",
                            color: perf.motorsportRank === 1 ? "var(--neon-yellow)" : color,
                            background: `${color}18`,
                            border: `1px solid ${color}44`,
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          RANK #{perf.motorsportRank}
                        </span>
                        {logoImg && (
                          <img
                            src={logoImg}
                            alt=""
                            style={{ width: "32px", height: "32px", objectFit: "contain" }}
                          />
                        )}
                      </div>

                      <div>
                        <h4 style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffffff", margin: 0 }}>
                          {perf.team}
                        </h4>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {teamObj.full_name || `${perf.team} Formula 1 Team`}
                        </div>
                      </div>

                      {carImg && (
                        <div style={{ height: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img
                            src={carImg}
                            alt=""
                            style={{ maxHeight: "65px", maxWidth: "100%", objectFit: "contain", filter: `drop-shadow(0 6px 12px ${color}44)` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Column 2: Verdict & Technical Strengths / Challenges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontSize: "0.86rem", color: "#e4e8f5", lineHeight: 1.45, fontStyle: "italic" }}>
                        "{perf.verdict}"
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(0,0,0,0.3)", padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800", marginBottom: "4px" }}>
                            ✓ KEY TECHNICAL STRENGTHS
                          </div>
                          {perf.technicalStrengths.map((str, idx) => (
                            <div key={idx} style={{ fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.35, marginBottom: "3px" }}>
                              • {str}
                            </div>
                          ))}
                        </div>

                        <div>
                          <div style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "#ff8700", fontWeight: "800", marginBottom: "4px" }}>
                            ⚠ CURRENT CHALLENGES
                          </div>
                          {perf.technicalChallenges.map((ch, idx) => (
                            <div key={idx} style={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.35, marginBottom: "3px" }}>
                              • {ch}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Column 3: 4 Dimension Metric Gauges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "12px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>OVERALL RATING</span>
                        <span style={{ fontSize: "1rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: color }}>
                          {perf.overallScore} <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>/ 100</span>
                        </span>
                      </div>

                      {/* Aero Efficiency Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", marginBottom: "2px" }}>
                          <span style={{ color: "var(--neon-cyan)" }}>AERO EFFICIENCY</span>
                          <span style={{ color: "#fff" }}>{perf.aeroEfficiency}%</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
                          <div style={{ width: `${perf.aeroEfficiency}%`, height: "100%", background: "var(--neon-cyan)", borderRadius: "2px" }} />
                        </div>
                      </div>

                      {/* 350kW PU Deployment Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", marginBottom: "2px" }}>
                          <span style={{ color: "var(--neon-green)" }}>350kW MGU-K PU</span>
                          <span style={{ color: "#fff" }}>{perf.powerUnitDeployment}%</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
                          <div style={{ width: `${perf.powerUnitDeployment}%`, height: "100%", background: "var(--neon-green)", borderRadius: "2px" }} />
                        </div>
                      </div>

                      {/* Pit Crew & Top Speed */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div>
                          <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>PIT STOP RANK</div>
                          <div style={{ fontSize: "0.78rem", color: "#ffaa00", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                            #{perf.pitRank} ({perf.avgPitTime})
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>SPEED TRAP</div>
                          <div style={{ fontSize: "0.78rem", color: "#ffffff", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                            {perf.topSpeedKmh} KM/H
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          OFFICIAL 2026 DRIVER DOSSIER MODAL (formula1.com/en/drivers)
          ══════════════════════════════════════════════════════════════ */}
      {activeDriverModal && (() => {
        const code = typeof activeDriverModal === "string" ? activeDriverModal : activeDriverModal.code;
        const profile = getDriverProfile(code) || {};
        const driverObj = drivers.find((d) => d.code === code) || profile;
        const teamObj = teams.find((t) => t.team.toLowerCase() === (driverObj.team || profile.team || "").toLowerCase() || (t.drivers && t.drivers.includes(driverObj.code)));
        const color = teamObj?.primary_color || "var(--neon-red)";
        const teamLogo = getTeamLogo(driverObj.team || profile.team);
        const photo = driverObj.photo_url || getDriverPhoto(code) || profile.photo_url;
        
        // Navigation indices
        const currentIndex = GRID_DRIVER_CODES.indexOf(code);
        const prevCode = GRID_DRIVER_CODES[(currentIndex - 1 + GRID_DRIVER_CODES.length) % GRID_DRIVER_CODES.length];
        const nextCode = GRID_DRIVER_CODES[(currentIndex + 1) % GRID_DRIVER_CODES.length];
        const prevDriver = drivers.find((d) => d.code === prevCode) || getDriverProfile(prevCode) || {};
        const nextDriver = drivers.find((d) => d.code === nextCode) || getDriverProfile(nextCode) || {};

        const nameParts = (driverObj.name || profile.name || code).split(" ");
        const firstName = profile.firstName || nameParts.slice(0, -1).join(" ") || driverObj.name;
        const lastName = profile.lastName || nameParts.slice(-1)[0] || "";

        const championships = profile.championships !== undefined ? profile.championships : (driverObj.championships || 0);
        const wins = profile.wins !== undefined ? profile.wins : (driverObj.wins || 0);
        const podiums = profile.podiums !== undefined ? profile.podiums : (driverObj.podiums || 0);
        const careerPoints = profile.career_points || driverObj.points || 0;
        const gpsEntered = profile.grands_prix_entered || 50;
        const highestFinish = profile.highest_race_finish || (wins > 0 ? `1 (x${wins})` : "Podium");
        const highestGrid = profile.highest_grid_position || (profile.pole_positions > 0 ? `1 (x${profile.pole_positions})` : "Top 5");

        const paceRating = profile.telemetry_ratings?.pace || Math.round(100 - (driverObj.base_pace - 83) * 10);
        const racecraftRating = profile.telemetry_ratings?.racecraft || 90;
        const tireRating = profile.telemetry_ratings?.tire_mgmt || driverObj.tire_mgmt_rating || 85;
        const qualiRating = profile.telemetry_ratings?.qualifying || 91;

        return createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveDriverModal(null);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 100000,
              background: `radial-gradient(ellipse at 30% 40%, ${color}12 0%, transparent 50%), radial-gradient(ellipse at center, rgba(4,7,14,0.82) 0%, rgba(2,3,8,0.96) 100%)`,
              backdropFilter: "blur(18px) saturate(1.2)",
              WebkitBackdropFilter: "blur(18px) saturate(1.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
              overflow: "hidden",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            {/* Ambient team-colored bokeh orbs */}
            <div style={{ position: "fixed", top: "10%", left: "5%", width: "300px", height: "300px", background: `radial-gradient(circle, ${color}15, transparent 70%)`, borderRadius: "50%", pointerEvents: "none", filter: "blur(60px)", animation: "pulseGlow 4s ease infinite" }} />
            <div style={{ position: "fixed", bottom: "10%", right: "8%", width: "200px", height: "200px", background: `radial-gradient(circle, ${color}10, transparent 70%)`, borderRadius: "50%", pointerEvents: "none", filter: "blur(40px)", animation: "pulseGlow 5s ease infinite 1s" }} />

            <div
              style={{
                maxWidth: "1120px",
                width: "100%",
                maxHeight: "92vh",
                background: "linear-gradient(180deg, rgba(14,16,26,0.98) 0%, rgba(8,10,18,0.99) 100%)",
                border: `1px solid ${color}44`,
                borderTop: "none",
                borderRadius: "20px",
                boxShadow: `0 30px 80px rgba(0,0,0,0.9), 0 0 60px ${color}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                animation: "modalSlideIn 0.35s ease-out",
              }}
            >
              {/* Animated gradient top border */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 3s linear infinite",
              }} />
              {/* Modal Top Header Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderBottom: `1px solid ${color}22`,
                  background: `linear-gradient(135deg, rgba(10,12,20,0.97) 0%, ${color}08 100%)`,
                  backdropFilter: "blur(10px)",
                  position: "relative",
                }}
              >
                {/* Left: Constructor Emblem & Team */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {teamLogo && (
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        background: `radial-gradient(circle, ${color}18, rgba(255,255,255,0.04))`,
                        border: `2px solid ${color}55`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "5px",
                        boxShadow: `0 0 16px ${color}25`,
                      }}
                    >
                      <img
                        src={teamLogo}
                        alt={driverObj.team}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: color, letterSpacing: "0.06em" }}>
                      {teamObj?.full_name || driverObj.team}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      FORMULA 1® 2026 OFFICIAL DRIVER DOSSIER
                    </div>
                  </div>
                </div>

                {/* Center: Grid Carousel Navigation */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => navigateDriver(-1)}
                    title={`Previous Driver (${prevDriver.name || prevCode})`}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    <span>←</span>
                    <span style={{ color: "var(--text-secondary)" }}>{prevCode}</span>
                  </button>

                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", color: "var(--text-secondary)", padding: "0 6px" }}>
                    #{currentIndex + 1} / 22
                  </div>

                  <button
                    onClick={() => navigateDriver(1)}
                    title={`Next Driver (${nextDriver.name || nextCode})`}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{nextCode}</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Right: Close (✕) Button */}
                <button
                  onClick={() => setActiveDriverModal(null)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(232,0,45,0.3)";
                    e.currentTarget.style.borderColor = "var(--neon-red)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body: Two-Column Responsive Layout */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "350px 1fr",
                  gap: "28px",
                  padding: "28px",
                  overflowY: "auto",
                  maxHeight: "calc(92vh - 120px)",
                }}
              >
                {/* ── Left Column: Driver Portrait & Identity ── */}
                <div
                  style={{
                    background: `linear-gradient(180deg, ${color}0A 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.15) 100%)`,
                    border: `1px solid ${color}22`,
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Giant Watermark Car Number */}
                  <div
                    style={{
                      position: "absolute",
                      right: "-10px",
                      top: "-25px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "8.5rem",
                      fontWeight: "900",
                      opacity: "0.05",
                      color: "#fff",
                      pointerEvents: "none",
                    }}
                  >
                    {driverObj.number}
                  </div>

                  {/* ── HERO DRIVER BUST PORTRAIT STAGE ── */}
                  <div
                    style={{
                      width: "100%",
                      height: "285px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      background: `radial-gradient(circle at 50% 28%, ${color}35 0%, rgba(8,10,18,0.95) 75%)`,
                      border: `1px solid ${color}35`,
                      boxShadow: `inset 0 0 30px rgba(0,0,0,0.9), 0 8px 24px rgba(0,0,0,0.6)`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    {/* Watermark Car Number in Stage Background */}
                    <div
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "4px",
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: "7rem",
                        fontWeight: "900",
                        color: `${color}18`,
                        lineHeight: 0.85,
                        userSelect: "none",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    >
                      {driverObj.number}
                    </div>

                    {/* Ambient Glow Halo */}
                    <div
                      style={{
                        position: "absolute",
                        top: "15%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "180px",
                        height: "180px",
                        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
                        borderRadius: "50%",
                        filter: "blur(22px)",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />

                    {/* Driver Hero Portrait - Focused Bust/Torso Crop */}
                    {photo ? (
                      <img
                        src={photo}
                        alt={driverObj.name}
                        style={{
                          width: "100%",
                          height: "285px",
                          objectFit: "cover",
                          objectPosition: "top center",
                          filter: `drop-shadow(0 14px 25px rgba(0,0,0,0.95)) contrast(1.05)`,
                          transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
                          position: "relative",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(2px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", color: color }}>
                        🏎️
                      </div>
                    )}

                    {/* Bottom Vignette Fade into Card Dark Carbon */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "55px",
                        background: "linear-gradient(to top, rgba(14,16,26,0.98), transparent)",
                        zIndex: 3,
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  {/* Driver Name & Badges */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {firstName}
                    </div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.7rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: "2px" }}>
                      {lastName}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", background: color, color: "#fff", padding: "3px 10px", borderRadius: "4px" }}>
                        CAR #{driverObj.number}
                      </span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.8rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {driverObj.code}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#fff", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: "4px" }}>
                        <span style={{ color: "var(--neon-yellow)", fontWeight: "900", fontFamily: "'Orbitron', monospace", background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.3)", padding: "1px 5px", borderRadius: "3px" }}>
                          {NATIONALITY_TO_FIA[profile.country || profile.nationality || driverObj.nationality] || (profile.country || profile.nationality || driverObj.nationality || "FIA").slice(0, 3).toUpperCase()}
                        </span>
                        <span>{profile.country || profile.nationality || driverObj.nationality}</span>
                      </span>
                    </div>
                  </div>

                  {/* Personal Quote */}
                  {profile.quote && (
                    <div
                      style={{
                        background: `${color}12`,
                        borderLeft: `3px solid ${color}`,
                        padding: "10px 14px",
                        borderRadius: "0 8px 8px 0",
                        fontSize: "0.82rem",
                        fontStyle: "italic",
                        color: "rgba(255,255,255,0.9)",
                        lineHeight: "1.4",
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      “{profile.quote}”
                    </div>
                  )}

                  {/* Vitals Panel */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "0.78rem",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>🎂 Date of Birth:</span>
                      <strong style={{ color: "#fff", fontFamily: "'Orbitron', monospace" }}>{profile.dob || "N/A"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>📍 Place of Birth:</span>
                      <strong style={{ color: "#fff" }}>{profile.birthplace || "Europe"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>🏎️ Team Engine:</span>
                      <strong style={{ color: color }}>{teamObj?.power_unit || "2026 Spec"}</strong>
                    </div>
                    {championships > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", marginTop: "2px" }}>
                        <span style={{ color: "var(--neon-yellow)" }}>🏆 World Titles:</span>
                        <strong style={{ color: "var(--neon-yellow)", fontFamily: "'Orbitron', monospace" }}>{championships}x World Champion</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right Column: Interactive Dossier Tabs ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Tab Selector Bar */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { id: "stats", label: "📊 Career Statistics" },
                      { id: "bio", label: "📖 Biography" },
                      { id: "ratings", label: "⚡ Telemetry & Skills" },
                      { id: "milestones", label: "🏁 Key Milestones" },
                    ].map((tab) => {
                      const isActive = modalTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setModalTab(tab.id)}
                          style={{
                            background: isActive ? `${color}25` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`,
                            color: isActive ? "#ffffff" : "var(--text-secondary)",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.78rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: CAREER STATS */}
                  {modalTab === "stats" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {/* Metric Boxes Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
                        {[
                          { label: "World Titles", value: championships, valueColor: championships > 0 ? "var(--neon-yellow)" : "#fff", icon: "🏆", glow: championships > 0 ? "rgba(255,221,0,0.2)" : "transparent" },
                          { label: "Grand Prix Wins", value: wins, valueColor: wins > 0 ? color : "#fff", icon: "🥇", glow: wins > 0 ? `${color}25` : "transparent" },
                          { label: "Podiums", value: podiums, valueColor: "#ffffff", icon: "🍾", glow: "transparent" },
                          { label: "Career Points", value: careerPoints.toLocaleString(), valueColor: "var(--neon-blue)", icon: "📊", glow: "rgba(0,136,255,0.15)" },
                          { label: "GPs Entered", value: gpsEntered, valueColor: "#ffffff", icon: "🏁", glow: "transparent" },
                          { label: "Highest Finish", value: highestFinish, valueColor: color, icon: "🎯", glow: "transparent", smaller: true },
                          { label: "Highest Grid Pos", value: highestGrid, valueColor: "var(--neon-yellow)", icon: "⚡", glow: "transparent", smaller: true },
                          { label: "Fastest Laps", value: profile.fastest_laps || 0, valueColor: "var(--neon-purple)", icon: "💜", glow: "rgba(155,89,182,0.15)" },
                        ].map((stat, i) => (
                          <div key={stat.label} style={{
                            background: "linear-gradient(135deg, rgba(26,30,48,0.7) 0%, rgba(12,15,24,0.92) 100%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderTop: `3px solid ${stat.glow !== "transparent" ? stat.valueColor : "rgba(255,255,255,0.2)"}`,
                            borderRadius: "12px",
                            padding: "16px 14px",
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.25s ease",
                            cursor: "default",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
                            animation: `numberCountUp 0.4s ease-out ${i * 0.06}s both`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = `${color}88`;
                            e.currentTarget.style.borderTopColor = color;
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = `0 10px 25px ${color}30`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.borderTopColor = stat.glow !== "transparent" ? stat.valueColor : "rgba(255,255,255,0.2)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.45)";
                          }}
                          >
                            {/* Ambient stat glow */}
                            {stat.glow !== "transparent" && (
                              <div style={{
                                position: "absolute",
                                bottom: "-10px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "90%",
                                height: "70%",
                                background: `radial-gradient(ellipse, ${stat.glow}, transparent)`,
                                pointerEvents: "none",
                                filter: "blur(14px)",
                              }} />
                            )}
                            <div style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{stat.icon}</div>
                            <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                              {stat.label}
                            </div>
                            <div style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: stat.smaller ? "1.25rem" : "1.75rem",
                              fontWeight: "900",
                              color: stat.valueColor,
                              marginTop: "6px",
                              position: "relative",
                              zIndex: 1,
                              textShadow: `0 0 16px ${stat.glow !== "transparent" ? stat.glow : "rgba(255,255,255,0.1)"}`,
                            }}>
                              {stat.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 2026 Championship Status Banner */}
                      <div
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          border: `1px solid ${color}33`,
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                            2026 Season Championship Standing
                          </div>
                          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "800", color: "#fff", marginTop: "2px" }}>
                            P#{[...drivers].sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex(d => d.code === driverObj.code) + 1} &nbsp;·&nbsp; {driverObj.points || 0} World Championship Points
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", fontFamily: "'Orbitron', monospace", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "6px", color: "#fff" }}>
                            Car: {teamObj?.car_model || "2026 Spec"}
                          </span>
                          <span style={{ fontSize: "0.75rem", fontFamily: "'Orbitron', monospace", background: `${color}22`, border: `1px solid ${color}55`, padding: "6px 12px", borderRadius: "6px", color: color }}>
                            Team: {driverObj.team}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BIOGRAPHY */}
                  {modalTab === "bio" && (
                    <div
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.15) 100%)",
                        border: `1px solid ${color}22`,
                        borderRadius: "14px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                        <div>
                          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "800", color: color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Official Formula 1® Career Retrospective
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            Documented biography & racing heritage
                          </div>
                        </div>

                        <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.1)", border: "1px solid rgba(0,210,190,0.3)", padding: "3px 10px", borderRadius: "4px" }}>
                          FIA ARCHIVE CERTIFIED
                        </span>
                      </div>

                      {/* Editorial Paragraphs */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "420px", overflowY: "auto", paddingRight: "6px" }}>
                        {profile.biography && profile.biography.length > 0 ? (
                          profile.biography.map((p, i) => (
                            <div
                              key={i}
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderLeft: `3px solid ${i === 0 ? color : "rgba(255,255,255,0.15)"}`,
                                borderRadius: "8px",
                                padding: "14px 18px",
                                lineHeight: "1.7",
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "0.9rem",
                                letterSpacing: "0.02em",
                              }}
                            >
                              <p style={{ margin: 0 }}>{p}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Official FIA biographical records for {driverObj.name} are being synchronized with formula1.com archives.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TELEMETRY & SKILLS */}
                  {modalTab === "ratings" && (() => {
                    const overallRating = Math.round((paceRating * 0.35 + qualiRating * 0.3 + racecraftRating * 0.25 + tireRating * 0.1));
                    const ratingTier = overallRating >= 95 ? "LEGENDARY" : overallRating >= 92 ? "ELITE" : overallRating >= 88 ? "WORLD CLASS" : overallRating >= 84 ? "ESTABLISHED" : "DEVELOPING";
                    const tierColor = overallRating >= 95 ? "var(--neon-yellow)" : overallRating >= 92 ? "var(--neon-cyan)" : overallRating >= 88 ? color : overallRating >= 84 ? "var(--neon-green)" : "var(--text-secondary)";
                    
                    const gauges = [
                      { label: "Race Pace", icon: "🏎️", value: paceRating, barColor: "var(--neon-blue)", detail: `${formatLapTime(driverObj.base_pace)} / lap` },
                      { label: "Qualifying Speed", icon: "⏱️", value: qualiRating, barColor: color, detail: "Single-Lap Flying Pace" },
                      { label: "Racecraft & Overtaking", icon: "⚔️", value: racecraftRating, barColor: "var(--neon-yellow)", detail: "Wheel-to-Wheel Combat" },
                      { label: "Tire Management", icon: "🛞", value: tireRating, barColor: "var(--neon-green)", detail: "Degradation Control" },
                    ];
                    
                    return (
                      <div
                        style={{
                          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.15) 100%)",
                          border: `1px solid ${color}22`,
                          borderRadius: "14px",
                          padding: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "22px",
                        }}
                      >
                        {/* Header with OVR Rating Badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "800", color: color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              Performance Telemetry
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                              2026 Season Driver Rating Assessment
                            </div>
                          </div>
                          
                          {/* OVR Rating Hero Badge */}
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: `radial-gradient(circle, ${tierColor}18, rgba(0,0,0,0.5))`,
                            border: `2px solid ${tierColor}55`,
                            borderRadius: "14px",
                            padding: "10px 20px",
                            boxShadow: `0 0 24px ${tierColor}20`,
                            minWidth: "100px",
                          }}>
                            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "2rem", fontWeight: "900", color: tierColor, lineHeight: 1 }}>
                              {overallRating}
                            </div>
                            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", fontWeight: "700", color: tierColor, letterSpacing: "0.1em", marginTop: "2px" }}>
                              {ratingTier}
                            </div>
                          </div>
                        </div>

                        {/* Gauge Bars */}
                        {gauges.map((g, idx) => (
                          <div key={g.label} style={{ animation: `numberCountUp 0.5s ease-out ${idx * 0.1}s both` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.82rem", marginBottom: "8px" }}>
                              <span style={{ color: "#fff", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{g.icon}</span> {g.label}
                                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: "500" }}>({g.detail})</span>
                              </span>
                              <span style={{ fontFamily: "'Orbitron', monospace", color: g.barColor, fontWeight: "900", fontSize: "1rem" }}>
                                {g.value}
                              </span>
                            </div>
                            <div style={{ height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "5px", overflow: "hidden", position: "relative" }}>
                              <div style={{
                                width: `${g.value}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${g.barColor}88, ${g.barColor})`,
                                borderRadius: "5px",
                                boxShadow: `0 0 12px ${g.barColor}55`,
                                animation: "revealBar 0.8s ease-out both",
                                animationDelay: `${idx * 0.15}s`,
                                position: "relative",
                              }}>
                                {/* Shimmer on bar */}
                                <div style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: "50%",
                                  background: "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
                                  borderRadius: "5px 5px 0 0",
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* TAB 4: MILESTONES */}
                  {modalTab === "milestones" && (
                    <div
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.15) 100%)",
                        border: `1px solid ${color}22`,
                        borderRadius: "14px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                        <div>
                          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "800", color: color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Career Defining Milestones
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            Key career victories, poles, and championship defining events
                          </div>
                        </div>

                        <span style={{ fontSize: "0.72rem", fontFamily: "'Orbitron', monospace", fontWeight: "700", color: "var(--neon-yellow)", background: "rgba(255,221,0,0.1)", border: "1px solid rgba(255,221,0,0.3)", padding: "3px 10px", borderRadius: "4px" }}>
                          🏆 FIA ARCHIVES
                        </span>
                      </div>

                      {/* Illuminated Timeline Track */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "420px", overflowY: "auto", paddingRight: "6px", position: "relative" }}>
                        {profile.milestones && profile.milestones.length > 0 ? (
                          profile.milestones.map((m, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                gap: "16px",
                                alignItems: "flex-start",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderLeft: `3px solid ${color}`,
                                borderRadius: "10px",
                                padding: "14px 16px",
                                position: "relative",
                                transition: "all 0.2s ease",
                                animation: `numberCountUp 0.4s ease-out ${idx * 0.08}s both`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = `${color}66`;
                                e.currentTarget.style.transform = "translateX(4px)";
                                e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.borderLeft = `3px solid ${color}`;
                                e.currentTarget.style.transform = "translateX(0)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Orbitron', monospace",
                                  fontSize: "0.82rem",
                                  fontWeight: "900",
                                  background: `linear-gradient(135deg, ${color}33, ${color}15)`,
                                  border: `1.5px solid ${color}88`,
                                  color: "#ffffff",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  flexShrink: 0,
                                  boxShadow: `0 0 10px ${color}44`,
                                }}
                              >
                                {m.year}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "800", color: "#ffffff", letterSpacing: "0.03em" }}>
                                  {m.title}
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.5" }}>
                                  {m.desc}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Milestone records synchronized with official FIA Formula 1 archives.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(8, 10, 16, 0.95)",
                }}
              >
                <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>Press <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: "3px", color: "#fff" }}>ESC</kbd> to close</span>
                  <span>Use <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: "3px", color: "#fff" }}>←</kbd> <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: "3px", color: "#fff" }}>→</kbd> to navigate drivers</span>
                </div>

                <a
                  href="https://www.formula1.com/en/drivers"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.72rem",
                    color: color,
                    textDecoration: "none",
                    fontWeight: "700",
                  }}
                >
                  <span>FORMULA1.COM OFFICIAL RECORD</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── BoxBox & FormulaDream Team Radio Interceptor Modal ── */}
      <TeamRadioModal
        isOpen={Boolean(radioModalDriver)}
        onClose={() => setRadioModalDriver(null)}
        initialDriver={radioModalDriver || "ALL"}
      />
    </div>
  );
}
