// ============================================================
// BudgetManager.jsx — Modern & Intuitive FIA $135.0M Cost Cap & R&D Studio
// Broadcast-Grade Financial Cockpit, R&D Upgrade Cards Studio,
// ATR Testing Regulations, Virtual Showroom Stage & AI Knapsack Optimizer
// ============================================================
import { useState, useEffect, useMemo, memo } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { getTeamLogo, TEAM_CARS } from "../data/f1MediaAssets2026";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BUDGET_CAP = 135_000_000;
const MINOR_BREACH_THRESHOLD = 128_250_000; // 95% of Cap

// ── Official 2026 Constructors' Championship Grid Financial Profiles ─────────
const OFFICIAL_11_TEAMS = [
  {
    rank: 1,
    team: "McLaren",
    short: "MCL",
    color: "#FF8000",
    spent: 118_400_000,
    car_model: "MCL39",
    principal: "Andrea Stella",
    engine: "Mercedes 2026 Spec",
    atr_scale: 70, // 70% ATR allowance for Reigning Champions
    wind_tunnel_hours: 280,
    cfd_hours: 1400,
    efficiency_rating: "96.4%",
    projected_finish: 132_800_000,
    breakdown: { rd: 45_000_000, mfg: 33_200_000, ops: 26_000_000, log: 14_200_000 },
    upgrades: [
      { name: "Sidepod Undercut v4", category: "AERO", cost: 8_400_000, perf_points: 14, purchased: true },
      { name: "Floor Edge Vortices", category: "FLOOR", cost: 6_200_000, perf_points: 11, purchased: true },
    ],
  },
  {
    rank: 2,
    team: "Ferrari",
    short: "FER",
    color: "#E8002D",
    spent: 121_500_000,
    car_model: "SF-26",
    principal: "Fred Vasseur",
    engine: "Ferrari 2026 E-Turbo",
    atr_scale: 75,
    wind_tunnel_hours: 300,
    cfd_hours: 1500,
    efficiency_rating: "94.8%",
    projected_finish: 133_900_000,
    breakdown: { rd: 46_200_000, mfg: 34_000_000, ops: 26_800_000, log: 14_500_000 },
    upgrades: [
      { name: "Active Front Wing Aero v5", category: "AERO", cost: 7_500_000, perf_points: 12, purchased: true },
      { name: "Rear Beam Wing Set", category: "AERO", cost: 5_300_000, perf_points: 9,  purchased: true },
    ],
  },
  {
    rank: 3,
    team: "Red Bull Racing",
    short: "RBR",
    color: "#1E41FF",
    spent: 123_800_000,
    car_model: "RB22",
    principal: "Laurent Mekies",
    engine: "Red Bull Ford Powertrains",
    atr_scale: 80,
    wind_tunnel_hours: 320,
    cfd_hours: 1600,
    efficiency_rating: "95.2%",
    projected_finish: 134_200_000,
    breakdown: { rd: 47_500_000, mfg: 34_600_000, ops: 27_100_000, log: 14_600_000 },
    upgrades: [
      { name: "Floor Venturi Tunnels", category: "FLOOR", cost: 8_900_000, perf_points: 15, purchased: true },
      { name: "Engine Cover Shark Fin", category: "AERO", cost: 4_200_000, perf_points: 7,  purchased: true },
    ],
  },
  {
    rank: 4,
    team: "Mercedes",
    short: "MER",
    color: "#00D2BE",
    spent: 117_200_000,
    car_model: "W17",
    principal: "Toto Wolff",
    engine: "Mercedes 2026 Hybrid",
    atr_scale: 85,
    wind_tunnel_hours: 340,
    cfd_hours: 1700,
    efficiency_rating: "93.5%",
    projected_finish: 131_500_000,
    breakdown: { rd: 44_200_000, mfg: 33_000_000, ops: 25_800_000, log: 14_200_000 },
    upgrades: [
      { name: "Front Suspension Geometry", category: "CHASSIS", cost: 6_700_000, perf_points: 10, purchased: true },
      { name: "Low Drag Rear Wing", category: "AERO", cost: 4_900_000, perf_points: 8, purchased: true },
    ],
  },
  {
    rank: 5,
    team: "Aston Martin",
    short: "AST",
    color: "#229971",
    spent: 114_600_000,
    car_model: "AMR26",
    principal: "Mike Krack",
    engine: "Honda Works 2026 Spec",
    atr_scale: 90,
    wind_tunnel_hours: 360,
    cfd_hours: 1800,
    efficiency_rating: "91.8%",
    projected_finish: 130_200_000,
    breakdown: { rd: 43_000_000, mfg: 32_400_000, ops: 25_200_000, log: 14_000_000 },
    upgrades: [
      { name: "Honda Power Unit Intercooler", category: "PU", cost: 5_800_000, perf_points: 10, purchased: true },
      { name: "Carbon Fiber Diffuser Strakes", category: "FLOOR", cost: 4_500_000, perf_points: 8, purchased: true },
    ],
  },
  {
    rank: 6,
    team: "Alpine",
    short: "ALP",
    color: "#0090FF",
    spent: 106_500_000,
    car_model: "A526",
    principal: "Oliver Oakes",
    engine: "Mercedes Customer PU",
    atr_scale: 95,
    wind_tunnel_hours: 380,
    cfd_hours: 1900,
    efficiency_rating: "89.4%",
    projected_finish: 125_800_000,
    breakdown: { rd: 39_500_000, mfg: 30_200_000, ops: 23_800_000, log: 13_000_000 },
    upgrades: [
      { name: "Active Wing Endplates", category: "AERO", cost: 4_200_000, perf_points: 7, purchased: true },
    ],
  },
  {
    rank: 7,
    team: "Haas",
    short: "HAS",
    color: "#B6BABD",
    spent: 103_200_000,
    car_model: "VF-26",
    principal: "Ayao Komatsu",
    engine: "Ferrari Customer PU",
    atr_scale: 100,
    wind_tunnel_hours: 400,
    cfd_hours: 2000,
    efficiency_rating: "88.2%",
    projected_finish: 122_400_000,
    breakdown: { rd: 38_000_000, mfg: 29_500_000, ops: 23_200_000, log: 12_500_000 },
    upgrades: [
      { name: "Rear Brake Duct Vortex Scoops", category: "BRAKES", cost: 3_100_000, perf_points: 5, purchased: true },
    ],
  },
  {
    rank: 8,
    team: "Racing Bulls",
    short: "RBF",
    color: "#6692FF",
    spent: 105_800_000,
    car_model: "VCARB 03",
    principal: "Peter Bayer",
    engine: "Red Bull Ford Powertrains",
    atr_scale: 105,
    wind_tunnel_hours: 420,
    cfd_hours: 2100,
    efficiency_rating: "89.6%",
    projected_finish: 124_600_000,
    breakdown: { rd: 39_200_000, mfg: 30_100_000, ops: 23_700_000, log: 12_800_000 },
    upgrades: [
      { name: "Front Wing Flap Slats", category: "AERO", cost: 3_900_000, perf_points: 6, purchased: true },
    ],
  },
  {
    rank: 9,
    team: "Williams",
    short: "WIL",
    color: "#00A0DE",
    spent: 108_200_000,
    car_model: "FW48",
    principal: "James Vowles",
    engine: "Mercedes 2026 Spec",
    atr_scale: 110,
    wind_tunnel_hours: 440,
    cfd_hours: 2200,
    efficiency_rating: "90.1%",
    projected_finish: 126_500_000,
    breakdown: { rd: 40_200_000, mfg: 30_800_000, ops: 24_200_000, log: 13_000_000 },
    upgrades: [
      { name: "Titanium Gearbox Casing", category: "CHASSIS", cost: 5_100_000, perf_points: 8, purchased: true },
    ],
  },
  {
    rank: 10,
    team: "Audi",
    short: "AUD",
    color: "#E50027",
    spent: 112_000_000,
    car_model: "R26",
    principal: "Mattia Binotto",
    engine: "Audi Works PU",
    atr_scale: 115,
    wind_tunnel_hours: 460,
    cfd_hours: 2300,
    efficiency_rating: "91.2%",
    projected_finish: 129_000_000,
    breakdown: { rd: 42_000_000, mfg: 31_500_000, ops: 25_000_000, log: 13_500_000 },
    upgrades: [
      { name: "Audi High-Voltage Inverter Pack", category: "PU", cost: 7_200_000, perf_points: 12, purchased: true },
    ],
  },
  {
    rank: 11,
    team: "Cadillac",
    short: "CAD",
    color: "#FFC72C",
    spent: 102_400_000,
    car_model: "CAD-26",
    principal: "Mario Andretti",
    engine: "Ferrari Customer PU",
    atr_scale: 120, // New Entrant maximum ATR testing allowance
    wind_tunnel_hours: 480,
    cfd_hours: 2400,
    efficiency_rating: "87.5%",
    projected_finish: 121_000_000,
    breakdown: { rd: 37_500_000, mfg: 29_200_000, ops: 23_000_000, log: 12_700_000 },
    upgrades: [
      { name: "Cadillac Chassis Monocoque v1", category: "CHASSIS", cost: 6_400_000, perf_points: 10, purchased: true },
    ],
  },
];

// ── Next-Gen 2026 Available R&D Upgrade Catalog ──────────────────────────────
const CATALOG_UPGRADES = [
  { id: "u1", name: "Active Aero Front Wing v2", category: "AERO", cost: 6_500_000, perf_points: 11, desc: "Dual hydraulic flap actuators for straightline low-drag X-mode reduction", cfd_cost: 85, lead_time: "2 GPs" },
  { id: "u2", name: "Low Drag Dual Beam Wing", category: "AERO", cost: 4_800_000, perf_points: 8, desc: "Ultra-thin carbon wing plane optimizing high-speed diffuser interaction", cfd_cost: 60, lead_time: "1 GP" },
  { id: "u3", name: "Diffuser Expansion Strakes", category: "FLOOR", cost: 5_700_000, perf_points: 9, desc: "Underfloor venturi fence geometry increasing cornering load by +4.2%", cfd_cost: 75, lead_time: "2 GPs" },
  { id: "u4", name: "Floor Venturi Expansion v4", category: "FLOOR", cost: 9_400_000, perf_points: 16, desc: "Maximum legal ground-effect tunnel depth with titanium skid blocks", cfd_cost: 120, lead_time: "3 GPs" },
  { id: "u5", name: "350kW MGU-K Inverter Pack", category: "PU", cost: 8_200_000, perf_points: 14, desc: "Silicon-carbide power module optimizing regenerative braking harvesting", cfd_cost: 95, lead_time: "3 GPs" },
  { id: "u6", name: "Bio-E-Fuel Injection Rail", category: "PU", cost: 5_200_000, perf_points: 9, desc: "500-bar direct injection optimizing 100% sustainable advanced bio-fuel burn", cfd_cost: 70, lead_time: "2 GPs" },
  { id: "u7", name: "High-Efficiency Turbo Intake", category: "PU", cost: 2_300_000, perf_points: 3, desc: "Carbon fiber plenum chamber reducing air intake boundary turbulence", cfd_cost: 30, lead_time: "1 GP" },
  { id: "u8", name: "Titanium Suspension Arms", category: "CHASSIS", cost: 4_100_000, perf_points: 7, desc: "3D-printed pull-rod linkages saving 3.2kg unsprung mass at front axle", cfd_cost: 50, lead_time: "1 GP" },
  { id: "u9", name: "Ultra-Light Monocoque Bulkhead", category: "CHASSIS", cost: 7_900_000, perf_points: 13, desc: "Honey-comb composite structure lowering center of gravity and yaw inertia", cfd_cost: 105, lead_time: "3 GPs" },
  { id: "u10", name: "3D Carbon Brake Duct Cooling", category: "BRAKES", cost: 2_700_000, perf_points: 4, desc: "Internal aerodynamic vortex scoops regulating carbon caliper temps", cfd_cost: 35, lead_time: "1 GP" },
  { id: "u11", name: "Undercut Sidepod Intake Mod", category: "AERO", cost: 7_900_000, perf_points: 13, desc: "Aggressive lower radiused pod channel routing clean laminar air to floor", cfd_cost: 100, lead_time: "2 GPs" },
  { id: "u12", name: "Titanium Brake Caliper Shields", category: "BRAKES", cost: 1_900_000, perf_points: 3, desc: "Heat-reflective thermal barriers eliminating brake fade in heavy zones", cfd_cost: 25, lead_time: "1 GP" },
];

// ── Greedy Knapsack Algorithm (Performance / Cost Density) ───────────────────
function optimizeBudget(availableUpgrades, budgetRemaining) {
  const sorted = [...availableUpgrades].sort((a, b) => (b.perf_points / b.cost) - (a.perf_points / a.cost));
  let remaining = budgetRemaining;
  const selected = [];
  let totalCost = 0;
  let totalPerf = 0;

  for (const u of sorted) {
    if (u.cost <= remaining) {
      selected.push(u);
      totalCost += u.cost;
      totalPerf += u.perf_points;
      remaining -= u.cost;
    }
  }
  return { selected, totalCost, totalPerf, remaining: budgetRemaining - totalCost };
}

// Format Currency
const fmt$ = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

function BudgetManager() {
  const [teams, setTeams] = useState(OFFICIAL_11_TEAMS);
  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0);
  const [notification, setNotification] = useState(null);
  const [optimizerResult, setOptimizerResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("DASHBOARD"); // "DASHBOARD" | "STANDINGS"

  // Sync with Backend if available
  useEffect(() => {
    axios.get(`${API}/budget`)
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setTeams((prevTeams) =>
            prevTeams.map((baseTeam) => {
              const backendMatch = res.data.data.find(
                (bt) => bt.team.toLowerCase().trim() === baseTeam.team.toLowerCase().trim()
              );
              return backendMatch ? { ...baseTeam, ...backendMatch } : baseTeam;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const currentTeam = teams[selectedTeamIdx] || teams[0];
  const remainingBudget = BUDGET_CAP - currentTeam.spent;
  const spentPercent = (currentTeam.spent / BUDGET_CAP) * 100;
  const totalPerfPoints = (currentTeam.upgrades || []).reduce((acc, u) => acc + (u.perf_points || 0), 0);

  // Available upgrades not yet equipped on the selected car
  const availableInShop = useMemo(() => {
    const installedNames = new Set((currentTeam.upgrades || []).map((u) => u.name));
    return CATALOG_UPGRADES.filter((u) => !installedNames.has(u.name));
  }, [currentTeam.upgrades]);

  // Filtered by selected category
  const filteredShop = useMemo(() => {
    if (activeCategory === "ALL") return availableInShop;
    return availableInShop.filter((u) => u.category === activeCategory);
  }, [availableInShop, activeCategory]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Purchase & Install Upgrade
  const handlePurchase = (upgrade) => {
    if (remainingBudget < upgrade.cost) {
      showNotif(`❌ Budget Cap Exceeded: Cannot afford ${upgrade.name} (${fmt$(upgrade.cost)}).`, "error");
      return;
    }

    setTeams((prev) =>
      prev.map((t, i) =>
        i !== selectedTeamIdx ? t : {
          ...t,
          spent: t.spent + upgrade.cost,
          upgrades: [...(t.upgrades || []), { ...upgrade, purchased: true }],
        }
      )
    );
    showNotif(`✅ ${upgrade.name} manufactured & installed on ${currentTeam.car_model}! +${upgrade.perf_points} pts.`, "success");
    setOptimizerResult(null);
  };

  // Uninstall / Refund Upgrade
  const handleUninstall = (upgradeName) => {
    const targetUpgrade = (currentTeam.upgrades || []).find((u) => u.name === upgradeName);
    if (!targetUpgrade) return;

    setTeams((prev) =>
      prev.map((t, i) =>
        i !== selectedTeamIdx ? t : {
          ...t,
          spent: Math.max(0, t.spent - targetUpgrade.cost),
          upgrades: (t.upgrades || []).filter((u) => u.name !== upgradeName),
        }
      )
    );
    showNotif(`↺ ${upgradeName} uninstalled. ${fmt$(targetUpgrade.cost)} credited back to ${currentTeam.team}.`, "success");
    setOptimizerResult(null);
  };

  // Run Knapsack Auto-Optimizer
  const handleRunOptimizer = () => {
    const result = optimizeBudget(availableInShop, remainingBudget);
    setOptimizerResult(result);
  };

  // Apply Optimizer Recommendation
  const handleApplyOptimizer = () => {
    if (!optimizerResult || optimizerResult.selected.length === 0) return;
    setTeams((prev) =>
      prev.map((t, i) =>
        i !== selectedTeamIdx ? t : {
          ...t,
          spent: t.spent + optimizerResult.totalCost,
          upgrades: [...(t.upgrades || []), ...optimizerResult.selected.map((u) => ({ ...u, purchased: true }))],
        }
      )
    );
    showNotif(`⚡ Applied ${optimizerResult.selected.length} optimized packages to ${currentTeam.team}! +${optimizerResult.totalPerf} pts.`, "success");
    setOptimizerResult(null);
  };

  // Reset to Factory Default Upgrades
  const handleResetTeam = () => {
    const defaultTeam = OFFICIAL_11_TEAMS[selectedTeamIdx];
    setTeams((prev) =>
      prev.map((t, i) => (i === selectedTeamIdx ? structuredClone(defaultTeam) : t))
    );
    showNotif(`🔄 ${currentTeam.team} development spec restored to season baseline.`, "success");
    setOptimizerResult(null);
  };

  // Quarterly Financial Chart Data
  const quarterlySpendData = useMemo(() => [
    { quarter: "Q1 R1-6", spend: Math.round((currentTeam.spent * 0.28) / 1_000_000), cap: 33.75, label: "Flyaways" },
    { quarter: "Q2 R7-12", spend: Math.round((currentTeam.spent * 0.26) / 1_000_000), cap: 33.75, label: "Europe" },
    { quarter: "Q3 R13-18", spend: Math.round((currentTeam.spent * 0.24) / 1_000_000), cap: 33.75, label: "Americas" },
    { quarter: "Q4 R19-24", spend: Math.round((currentTeam.spent * 0.22) / 1_000_000), cap: 33.75, label: "Finale" },
  ], [currentTeam.spent]);

  const totalGridSpend = useMemo(() => teams.reduce((acc, t) => acc + t.spent, 0), [teams]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", paddingBottom: "32px" }}>
      {/* ── Notification Toast ── */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "24px",
            zIndex: 9999,
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "800",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.80rem",
            background: notification.type === "error" ? "rgba(232,0,45,0.95)" : "rgba(0,204,68,0.95)",
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* ════════ 1. CLEAN CONSTRUCTOR LIVERY SELECTOR ════════ */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 12, 20, 0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          padding: "12px 18px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>💼</span>
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
              FIA $135.0M COST CAP & R&D LAB
            </span>
            <span style={{ fontSize: "0.65rem", background: "rgba(0,204,68,0.14)", color: "var(--neon-green)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "10px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
              🟢 ALL 11 TEAMS LEGAL
            </span>
          </div>

          {/* View Mode Toggle: Workbench vs Grid Audit */}
          <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", padding: "2px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", gap: "4px" }}>
            <button
              onClick={() => setViewMode("DASHBOARD")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "5px 12px",
                borderRadius: "5px",
                fontSize: "0.70rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: viewMode === "DASHBOARD" ? "900" : "600",
                background: viewMode === "DASHBOARD" ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "transparent",
                color: viewMode === "DASHBOARD" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: viewMode === "DASHBOARD" ? "0 0 10px rgba(232,0,45,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              🏎️ TEAM WORKBENCH
            </button>
            <button
              onClick={() => setViewMode("STANDINGS")}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "5px 12px",
                borderRadius: "5px",
                fontSize: "0.70rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: viewMode === "STANDINGS" ? "900" : "600",
                background: viewMode === "STANDINGS" ? "linear-gradient(135deg, var(--neon-red), #b3001e)" : "transparent",
                color: viewMode === "STANDINGS" ? "#ffffff" : "var(--text-secondary)",
                boxShadow: viewMode === "STANDINGS" ? "0 0 10px rgba(232,0,45,0.35)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              📊 GRID AUDIT (11)
            </button>
          </div>
        </div>

        {/* Horizontal Constructors Carousel */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "4px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.15) transparent",
          }}
        >
          {teams.map((t, idx) => {
            const isSelected = selectedTeamIdx === idx;
            const logo = getTeamLogo(t.team);
            const tRemaining = BUDGET_CAP - t.spent;

            return (
              <button
                key={t.team}
                onClick={() => {
                  setSelectedTeamIdx(idx);
                  setOptimizerResult(null);
                }}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  flex: "0 0 auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  background: isSelected
                    ? `linear-gradient(135deg, ${t.color}25 0%, rgba(20,24,36,0.95) 100%)`
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isSelected ? t.color : "rgba(255,255,255,0.08)"}`,
                  borderLeft: `4px solid ${t.color}`,
                  boxShadow: isSelected ? `0 4px 16px ${t.color}35` : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: isSelected ? t.color : "var(--text-dim)" }}>
                  #{String(t.rank).padStart(2, "0")}
                </span>

                {logo && (
                  <img
                    src={logo}
                    alt={t.team}
                    style={{ width: "18px", height: "18px", objectFit: "contain", opacity: isSelected ? 1 : 0.6 }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", fontWeight: "900", color: isSelected ? "#ffffff" : "var(--text-secondary)" }}>
                    {t.short || t.team.slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    {fmt$(tRemaining)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "DASHBOARD" ? (
        <>
          {/* ════════ 2. HERO TEAM FINANCIAL COCKPIT (CLEAN, 3-COLUMN) ════════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.5fr 1fr",
              gap: "14px",
              alignItems: "stretch",
            }}
          >
            {/* Col 1: Team Car & Technical Identity */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: `1px solid ${currentTeam.color}44`,
                borderLeft: `5px solid ${currentTeam.color}`,
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffffff" }}>
                        {currentTeam.team}
                      </span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: currentTeam.color, background: `${currentTeam.color}22`, border: `1px solid ${currentTeam.color}55`, padding: "2px 7px", borderRadius: "4px", fontWeight: "800" }}>
                        {currentTeam.car_model}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                      👔 {currentTeam.principal} &nbsp;·&nbsp; ⚡ {currentTeam.engine}
                    </div>
                  </div>

                  <span style={{ fontSize: "0.70rem", background: "rgba(0,204,68,0.15)", border: "1px solid rgba(0,204,68,0.35)", color: "var(--neon-green)", padding: "3px 8px", borderRadius: "5px", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                    +{totalPerfPoints} PTS
                  </span>
                </div>

                {/* Car Silhouette / Render Stage */}
                <div style={{ position: "relative", width: "100%", height: "130px", display: "flex", alignItems: "center", justifyContent: "center", margin: "6px 0" }}>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      width: "80%",
                      height: "30px",
                      background: `radial-gradient(ellipse at center, ${currentTeam.color}55 0%, transparent 75%)`,
                      filter: "blur(8px)",
                    }}
                  />
                  {TEAM_CARS[currentTeam.team] ? (
                    <img
                      src={TEAM_CARS[currentTeam.team]}
                      alt={currentTeam.team}
                      style={{ maxHeight: "115px", maxWidth: "95%", objectFit: "contain", filter: `drop-shadow(0 10px 16px ${currentTeam.color}44)`, zIndex: 1 }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}>
                      🏎️ {currentTeam.car_model}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Efficiency: <strong style={{ color: "var(--neon-green)" }}>{currentTeam.efficiency_rating}</strong></span>
                <span style={{ color: "var(--text-secondary)" }}>Projected: <strong style={{ color: "#fff" }}>{fmt$(currentTeam.projected_finish)}</strong></span>
              </div>
            </div>

            {/* Col 2: Interactive Cap Gauge & Safe Zone Meter */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em", fontWeight: "800" }}>
                    COST CAP CONSUMPTION METER
                  </span>
                  <span style={{ fontSize: "0.68rem", background: "rgba(0,204,68,0.15)", color: "var(--neon-green)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                    🟢 FIA COMPLIANT
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0 10px 0" }}>
                  <div>
                    <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>BUDGET EXPENDITURE</div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.7rem", fontWeight: "900", color: spentPercent > 90 ? "var(--neon-red)" : "#ffffff" }}>
                      {fmt$(currentTeam.spent)} <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", fontWeight: "600" }}>/ $135.0M</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>REMAINING HEADROOM</div>
                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.4rem", fontWeight: "900", color: "var(--neon-green)" }}>
                      {fmt$(remainingBudget)}
                    </div>
                  </div>
                </div>

                {/* High-Tech Progress Meter */}
                <div style={{ position: "relative", height: "14px", background: "rgba(255,255,255,0.06)", borderRadius: "7px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "95%",
                      top: 0,
                      bottom: 0,
                      width: "2px",
                      background: "#ff0055",
                      zIndex: 3,
                    }}
                    title="95% Minor Breach Threshold ($128.25M)"
                  />
                  <div
                    style={{
                      width: `${Math.min(spentPercent, 100)}%`,
                      height: "100%",
                      background: spentPercent > 95
                        ? "linear-gradient(90deg, #ffcc00, #ff0055)"
                        : "linear-gradient(90deg, var(--neon-cyan), var(--neon-green))",
                      borderRadius: "7px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                  <span>$0 (START)</span>
                  <span>$67.5M (50%)</span>
                  <span style={{ color: "#ffaa00" }}>$128.25M (95% LIMIT)</span>
                  <span style={{ color: "var(--neon-red)" }}>$135.0M (CEILING)</span>
                </div>
              </div>

              <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Burn Rate: <strong style={{ color: "#fff" }}>$4.9M / GP</strong></span>
                <span>Headroom: <strong style={{ color: "var(--neon-green)" }}>{(100 - spentPercent).toFixed(1)}% Available</strong></span>
              </div>
            </div>

            {/* Col 3: ATR Regulations & Action Tools */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em", fontWeight: "800" }}>
                    ATR AERO TESTING SCALE
                  </span>
                  <span style={{ fontSize: "0.62rem", background: "rgba(0,210,190,0.15)", color: "var(--neon-cyan)", padding: "1px 6px", borderRadius: "3px", fontFamily: "'Orbitron', monospace", fontWeight: "800" }}>
                    WCC #{String(currentTeam.rank).padStart(2, "0")}
                  </span>
                </div>

                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: "900", color: "var(--neon-cyan)", marginTop: "6px" }}>
                  {currentTeam.atr_scale}% <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>ATR</span>
                </div>

                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                  🌪️ {currentTeam.wind_tunnel_hours}h Tunnel · 💻 {currentTeam.cfd_hours}h CFD
                </div>
              </div>

              {/* Action Buttons: Auto-Optimize & Reset */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                <button
                  onClick={handleRunOptimizer}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    background: "rgba(0, 136, 255, 0.15)",
                    border: "1px solid var(--neon-blue)",
                    color: "var(--neon-blue)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.70rem",
                    fontWeight: "800",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    textAlign: "center",
                    boxShadow: "0 0 10px rgba(0,136,255,0.25)",
                    transition: "all 0.15s ease",
                  }}
                >
                  ⚡ AUTO-OPTIMIZE (AI)
                </button>

                <button
                  onClick={handleResetTeam}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--text-dim)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.66rem",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    textAlign: "center",
                  }}
                  title="Restore factory season baseline upgrades"
                >
                  ↺ RESET TO FACTORY SPEC
                </button>
              </div>
            </div>
          </div>

          {/* ════════ 3. R&D UPGRADE CARDS STUDIO ════════ */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "18px 20px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header & Category Filters */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                  🛠️ 2026 R&D UPGRADE STUDIO
                </span>
                <span style={{ fontSize: "0.70rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  ({filteredShop.length} Packages Available)
                </span>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {[
                  { label: "ALL", cat: "ALL" },
                  { label: "AERO", cat: "AERO" },
                  { label: "350kW PU", cat: "PU" },
                  { label: "FLOOR", cat: "FLOOR" },
                  { label: "CHASSIS", cat: "CHASSIS" },
                  { label: "BRAKES", cat: "BRAKES" },
                ].map((chip) => {
                  const isCatActive = activeCategory === chip.cat;
                  return (
                    <button
                      key={chip.cat}
                      onClick={() => setActiveCategory(chip.cat)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        background: isCatActive ? "linear-gradient(135deg, var(--neon-blue), #0055cc)" : "rgba(255,255,255,0.04)",
                        border: isCatActive ? "1px solid #3399ff" : "1px solid rgba(255,255,255,0.08)",
                        color: isCatActive ? "#ffffff" : "var(--text-secondary)",
                        padding: "4px 10px",
                        borderRadius: "5px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.68rem",
                        fontWeight: isCatActive ? "800" : "600",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Knapsack Optimizer Recommendation Banner */}
            {optimizerResult && (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(0, 136, 255, 0.15) 0%, rgba(0, 85, 204, 0.08) 100%)",
                  border: "1px solid var(--neon-blue)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  boxShadow: "0 0 14px rgba(0, 136, 255, 0.2)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-blue)" }}>
                    ⚡ AI KNAPSACK ALGORITHM RECOMMENDATION
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Best combination for remaining {fmt$(remainingBudget)}: {optimizerResult.selected.map(u => `${u.name} (+${u.perf_points}pt)`).join(", ")}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>
                    Total: {fmt$(optimizerResult.totalCost)} · +{optimizerResult.totalPerf} PTS
                  </span>
                  <button
                    onClick={handleApplyOptimizer}
                    style={{
                      background: "linear-gradient(135deg, var(--neon-green), #009933)",
                      border: "none",
                      color: "#000",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.70rem",
                      fontWeight: "900",
                      padding: "5px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      boxShadow: "0 0 10px rgba(0,204,68,0.35)",
                    }}
                  >
                    EQUIP ALL
                  </button>
                </div>
              </div>
            )}

            {/* Upgrade Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredShop.length === 0 ? (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", padding: "20px 0", textAlign: "center", gridColumn: "1 / -1" }}>
                  All packages in this category are manufactured and installed on {currentTeam.car_model}!
                </div>
              ) : (
                filteredShop.map((u) => {
                  const canAfford = remainingBudget >= u.cost;
                  return (
                    <div
                      key={u.name}
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.12)", border: "1px solid rgba(0,210,190,0.3)", padding: "1px 6px", borderRadius: "3px" }}>
                            {u.category}
                          </span>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: canAfford ? "#ffffff" : "var(--text-dim)" }}>
                            {fmt$(u.cost)}
                          </span>
                        </div>

                        <div style={{ fontWeight: "800", color: "#ffffff", fontSize: "0.84rem", marginTop: "2px" }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: "1.3", marginTop: "3px" }}>
                          {u.desc}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.68rem", fontFamily: "'Orbitron', monospace" }}>
                          <span style={{ color: "var(--neon-green)", fontWeight: "900", background: "rgba(0,204,68,0.12)", padding: "1px 6px", borderRadius: "3px" }}>
                            +{u.perf_points} PTS
                          </span>
                          <span style={{ color: "var(--text-dim)" }}>{u.lead_time}</span>
                        </div>

                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchase(u)}
                          style={{
                            background: canAfford ? "linear-gradient(135deg, var(--neon-blue), #0055cc)" : "rgba(255,255,255,0.05)",
                            border: canAfford ? "1px solid #3399ff" : "1px solid rgba(255,255,255,0.1)",
                            color: canAfford ? "#ffffff" : "var(--text-dim)",
                            padding: "5px 12px",
                            borderRadius: "5px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.68rem",
                            fontWeight: "800",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            boxShadow: canAfford ? "0 0 10px rgba(0,136,255,0.3)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {canAfford ? "⚡ EQUIP" : "OVER CAP"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ════════ 4. INSTALLED PACKAGES & EXPENSE ANALYTICS ════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "14px" }}>
            
            {/* Installed Packages List */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px 18px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.88rem", fontWeight: "900", color: "#ffffff" }}>
                  📦 INSTALLED ON {currentTeam.car_model} ({(currentTeam.upgrades || []).length})
                </span>
                <span style={{ fontSize: "0.72rem", background: "rgba(0,204,68,0.15)", color: "var(--neon-green)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "4px", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>
                  +{totalPerfPoints} TOTAL PTS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(currentTeam.upgrades || []).length === 0 ? (
                  <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", padding: "16px 0", textAlign: "center" }}>
                    No upgrades installed yet. Browse the R&D shop above to equip packages.
                  </div>
                ) : (
                  (currentTeam.upgrades || []).map((u) => (
                    <div
                      key={u.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "rgba(0,204,68,0.04)",
                        borderLeft: "3px solid var(--neon-green)",
                        border: "1px solid rgba(0,204,68,0.2)",
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "800", color: "#ffffff", fontSize: "0.80rem" }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "1px" }}>
                          {fmt$(u.cost)} · FIA Homologated
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "900", fontSize: "0.78rem" }}>
                          +{u.perf_points} pts
                        </span>
                        <button
                          onClick={() => handleUninstall(u.name)}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            fontSize: "0.66rem",
                            color: "var(--text-dim)",
                            background: "rgba(255,255,255,0.06)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          title="Uninstall package & refund budget"
                        >
                          ↺ Refund
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quarterly Run-Rate & Cost Allocation */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "16px 18px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "800" }}>
                  QUARTERLY R&D RUN-RATE ($M)
                </span>
                <span style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  CEILING: $33.75M / QTR
                </span>
              </div>

              <div style={{ height: "110px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterlySpendData} margin={{ top: 5, right: 6, left: -22, bottom: 0 }}>
                    <XAxis dataKey="quarter" stroke="#555" tick={{ fontSize: 9, fontFamily: "'Orbitron', monospace" }} />
                    <YAxis domain={[0, 40]} stroke="#555" tick={{ fontSize: 9, fontFamily: "'Orbitron', monospace" }} />
                    <Tooltip
                      contentStyle={{ background: "#0c0d15", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "0.72rem", fontFamily: "'Orbitron', monospace" }}
                      formatter={(val) => [`$${val}M Spent`, "Expenditure"]}
                    />
                    <ReferenceLine y={33.75} stroke="#ff0055" strokeDasharray="4 2" />
                    <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                      {quarterlySpendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={currentTeam.color || "#00d2be"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Allocation Mini Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                {[
                  { name: "R&D & Wind Tunnel", amt: currentTeam.breakdown?.rd || 45_000_000, pct: 38, color: "var(--neon-blue)" },
                  { name: "Manufacturing & Spares", amt: currentTeam.breakdown?.mfg || 33_200_000, pct: 28, color: "var(--neon-green)" },
                  { name: "Trackside Operations", amt: currentTeam.breakdown?.ops || 26_000_000, pct: 22, color: "var(--neon-yellow)" },
                  { name: "Logistics & Hospitality", amt: currentTeam.breakdown?.log || 14_200_000, pct: 12, color: "#bf7fff" },
                ].map((item) => (
                  <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", color: item.color, fontWeight: "800" }}>
                        {fmt$(item.amt)} ({item.pct}%)
                      </span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ════════ 5. ALL 11 CONSTRUCTORS COST CAP STANDINGS MATRIX ════════ */
        <div
          style={{
            background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                ALL 11 CONSTRUCTORS — COST CAP LEADERBOARD
              </span>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Official 2026 Constructors' Championship Financial Compliance & Aero Testing Restriction (ATR) Matrix
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.80rem", minWidth: "900px" }}>
              <thead>
                <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", fontFamily: "'Orbitron', monospace", fontSize: "0.68rem" }}>
                  <th style={{ padding: "10px 12px" }}>WCC RANK</th>
                  <th>CONSTRUCTOR</th>
                  <th>CHASSIS</th>
                  <th>ENGINE SUPPLIER</th>
                  <th>BUDGET SPENT</th>
                  <th>HEADROOM</th>
                  <th>CAP %</th>
                  <th>ATR ALLOWANCE</th>
                  <th>PACKAGES</th>
                  <th>PERF PTS</th>
                  <th style={{ textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, idx) => {
                  const rem = BUDGET_CAP - t.spent;
                  const pct = (t.spent / BUDGET_CAP) * 100;
                  const pts = (t.upgrades || []).reduce((s, u) => s + (u.perf_points || 0), 0);
                  const logo = getTeamLogo(t.team);

                  return (
                    <tr
                      key={t.team}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: idx === selectedTeamIdx ? "rgba(0, 210, 190, 0.08)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "12px", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: t.color }}>
                        #{String(t.rank).padStart(2, "0")}
                      </td>
                      <td style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 6px", fontWeight: "800" }}>
                        {logo && (
                          <img src={logo} alt={t.team} style={{ width: "20px", height: "20px", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                        <span style={{ color: "#ffffff" }}>{t.team}</span>
                      </td>
                      <td style={{ fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>{t.car_model}</td>
                      <td style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>{t.engine}</td>
                      <td style={{ fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>{fmt$(t.spent)}</td>
                      <td style={{ fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>{fmt$(rem)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: pct > 90 ? "var(--neon-red)" : "var(--neon-yellow)", fontWeight: "800" }}>
                            {pct.toFixed(1)}%
                          </span>
                          <div style={{ width: "50px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? "var(--neon-red)" : "var(--neon-green)" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800" }}>{t.atr_scale}% ATR</td>
                      <td style={{ fontFamily: "'Orbitron', monospace" }}>{(t.upgrades || []).length} pkgs</td>
                      <td style={{ color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "900" }}>+{pts} pts</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => {
                            setSelectedTeamIdx(idx);
                            setViewMode("DASHBOARD");
                          }}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#ffffff",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.68rem",
                            fontWeight: "800",
                          }}
                        >
                          MANAGE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(BudgetManager);
