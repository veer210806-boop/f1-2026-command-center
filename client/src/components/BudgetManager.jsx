// ============================================================
// BudgetManager.jsx — FIA 2026 $135.0M Cost Cap & R&D Mission Control
// Broadcast-Grade Financial Telemetry, ATR Testing Regulations,
// Virtual Showroom Stage & Knapsack Auto-Optimizer
// ============================================================
import { useState, useEffect, useMemo } from "react";
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
    principal: "Adrian Newey",
    engine: "Honda 2026 Works",
    atr_scale: 90,
    wind_tunnel_hours: 360,
    cfd_hours: 1800,
    efficiency_rating: "92.1%",
    projected_finish: 129_800_000,
    breakdown: { rd: 43_100_000, mfg: 32_500_000, ops: 25_200_000, log: 13_800_000 },
    upgrades: [
      { name: "Honda PU Cooling Pack", category: "PU", cost: 5_800_000, perf_points: 9, purchased: true },
    ],
  },
  {
    rank: 6,
    team: "Alpine",
    short: "ALP",
    color: "#0090FF",
    spent: 106_500_000,
    car_model: "A526",
    principal: "Flavio Briatore / Steve Nielsen",
    engine: "Mercedes Customer / Alpine",
    atr_scale: 95,
    wind_tunnel_hours: 380,
    cfd_hours: 1900,
    efficiency_rating: "89.4%",
    projected_finish: 122_400_000,
    breakdown: { rd: 40_200_000, mfg: 30_100_000, ops: 23_200_000, log: 13_000_000 },
    upgrades: [
      { name: "Brake Duct Carbon Upgrade", category: "BRAKES", cost: 4_300_000, perf_points: 7, purchased: true },
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
    engine: "Ferrari 2026 Customer",
    atr_scale: 100,
    wind_tunnel_hours: 400,
    cfd_hours: 2000,
    efficiency_rating: "91.0%",
    projected_finish: 119_500_000,
    breakdown: { rd: 38_500_000, mfg: 29_500_000, ops: 22_500_000, log: 12_700_000 },
    upgrades: [
      { name: "Rear Floor Diffuser", category: "FLOOR", cost: 5_200_000, perf_points: 8, purchased: true },
    ],
  },
  {
    rank: 8,
    team: "Williams",
    short: "WIL",
    color: "#00A0DE",
    spent: 109_800_000,
    car_model: "FW48",
    principal: "James Vowles",
    engine: "Mercedes 2026 Hybrid",
    atr_scale: 105,
    wind_tunnel_hours: 420,
    cfd_hours: 2100,
    efficiency_rating: "90.6%",
    projected_finish: 125_000_000,
    breakdown: { rd: 41_300_000, mfg: 31_200_000, ops: 24_100_000, log: 13_200_000 },
    upgrades: [
      { name: "Lightweight Monocoque Mod", category: "CHASSIS", cost: 7_100_000, perf_points: 11, purchased: true },
    ],
  },
  {
    rank: 9,
    team: "RB",
    short: "RBS",
    color: "#6692FF",
    spent: 105_400_000,
    car_model: "VCARB 03",
    principal: "Alan Permane",
    engine: "Red Bull Ford Powertrains",
    atr_scale: 110,
    wind_tunnel_hours: 440,
    cfd_hours: 2200,
    efficiency_rating: "88.9%",
    projected_finish: 121_800_000,
    breakdown: { rd: 39_800_000, mfg: 29_900_000, ops: 23_000_000, log: 12_700_000 },
    upgrades: [
      { name: "Front Wing Flap Revision", category: "AERO", cost: 4_100_000, perf_points: 6, purchased: true },
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
    engine: "Audi Factory Powertrain 2026",
    atr_scale: 115,
    wind_tunnel_hours: 460,
    cfd_hours: 2300,
    efficiency_rating: "91.8%",
    projected_finish: 128_600_000,
    breakdown: { rd: 42_000_000, mfg: 32_000_000, ops: 24_500_000, log: 13_500_000 },
    upgrades: [
      { name: "Audi Factory Powertrain Mounts", category: "PU", cost: 7_800_000, perf_points: 12, purchased: true },
    ],
  },
  {
    rank: 11,
    team: "Cadillac",
    short: "CAD",
    color: "#FFC72C",
    spent: 108_500_000,
    car_model: "CAD-01",
    principal: "Steve O'Rourke",
    engine: "Ferrari 2026 / Cadillac Turbo",
    atr_scale: 115, // Max allocation for brand new entrant
    wind_tunnel_hours: 460,
    cfd_hours: 2300,
    efficiency_rating: "90.2%",
    projected_finish: 126_000_000,
    breakdown: { rd: 41_000_000, mfg: 30_800_000, ops: 23_700_000, log: 13_000_000 },
    upgrades: [
      { name: "Inaugural Aero Package v1", category: "AERO", cost: 8_100_000, perf_points: 13, purchased: true },
    ],
  },
];

// ── Next-Gen 2026 Available R&D Upgrade Catalog ──────────────────────────────
const CATALOG_UPGRADES = [
  // Active Aero & Wing Systems
  { id: "u1", name: "Active Aero Front Wing v2", category: "AERO", cost: 6_500_000, perf_points: 11, desc: "Dual hydraulic flap actuators for straightline low-drag X-mode reduction", cfd_cost: 85, lead_time: "2 GPs" },
  { id: "u2", name: "Low Drag Dual Beam Wing", category: "AERO", cost: 4_800_000, perf_points: 8, desc: "Ultra-thin carbon wing plane optimizing high-speed diffuser interaction", cfd_cost: 60, lead_time: "1 GP" },
  { id: "u3", name: "Diffuser Expansion Strakes", category: "FLOOR", cost: 5_700_000, perf_points: 9, desc: "Underfloor venturi fence geometry increasing cornering load by +4.2%", cfd_cost: 75, lead_time: "2 GPs" },
  { id: "u4", name: "Floor Venturi Expansion v4", category: "FLOOR", cost: 9_400_000, perf_points: 16, desc: "Maximum legal ground-effect tunnel depth with titanium skid blocks", cfd_cost: 120, lead_time: "3 GPs" },
  
  // 350kW Next-Gen Powertrain
  { id: "u5", name: "350kW MGU-K Inverter Pack", category: "PU", cost: 8_200_000, perf_points: 14, desc: "Silicon-carbide power module optimizing regenerative braking harvesting", cfd_cost: 95, lead_time: "3 GPs" },
  { id: "u6", name: "Bio-E-Fuel Injection Rail", category: "PU", cost: 5_200_000, perf_points: 9, desc: "500-bar direct injection optimizing 100% sustainable advanced bio-fuel burn", cfd_cost: 70, lead_time: "2 GPs" },
  { id: "u7", name: "High-Efficiency Turbo Intake", category: "PU", cost: 2_300_000, perf_points: 3, desc: "Carbon fiber plenum chamber reducing air intake boundary turbulence", cfd_cost: 30, lead_time: "1 GP" },

  // Chassis & Weight Saving
  { id: "u8", name: "Titanium Suspension Arms", category: "CHASSIS", cost: 4_100_000, perf_points: 7, desc: "3D-printed pull-rod linkages saving 3.2kg unsprung mass at front axle", cfd_cost: 50, lead_time: "1 GP" },
  { id: "u9", name: "Ultra-Light Monocoque Bulkhead", category: "CHASSIS", cost: 7_900_000, perf_points: 13, desc: "Honey-comb composite structure lowering center of gravity and yaw inertia", cfd_cost: 105, lead_time: "3 GPs" },

  // Brakes & Thermal Management
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

export default function BudgetManager() {
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
              if (backendMatch) {
                return {
                  ...baseTeam,
                  spent: backendMatch.spent || baseTeam.spent,
                  upgrades: backendMatch.upgrades && backendMatch.upgrades.length > 0 ? backendMatch.upgrades : baseTeam.upgrades,
                };
              }
              return baseTeam;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const currentTeam = teams[selectedTeamIdx] || teams[0];
  const remainingBudget = BUDGET_CAP - currentTeam.spent;
  const spentPercent = (currentTeam.spent / BUDGET_CAP) * 100;
  const totalPerfPoints = (currentTeam.upgrades || []).reduce((sum, u) => sum + (u.perf_points || 0), 0);

  const installedNames = new Set((currentTeam.upgrades || []).map((u) => u.name));
  const availableInShop = CATALOG_UPGRADES.filter((u) => !installedNames.has(u.name));

  const filteredShop = useMemo(() => {
    if (activeCategory === "ALL") return availableInShop;
    return availableInShop.filter((u) => u.category === activeCategory);
  }, [availableInShop, activeCategory]);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Purchase Upgrade
  const handlePurchase = (upgrade) => {
    if (remainingBudget < upgrade.cost) {
      showNotif(`❌ Budget Cap Exceeded! Need ${fmt$(upgrade.cost)}, have ${fmt$(remainingBudget)} headroom.`, "error");
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
    { quarter: "Q1 R1-6", spend: Math.round((currentTeam.spent * 0.28) / 1_000_000), cap: 33.75, label: "Flyaways & Australia" },
    { quarter: "Q2 R7-12", spend: Math.round((currentTeam.spent * 0.26) / 1_000_000), cap: 33.75, label: "European Leg" },
    { quarter: "Q3 R13-18", spend: Math.round((currentTeam.spent * 0.24) / 1_000_000), cap: 33.75, label: "Americas Triple Header" },
    { quarter: "Q4 R19-24", spend: Math.round((currentTeam.spent * 0.22) / 1_000_000), cap: 33.75, label: "Middle East Finale" },
  ], [currentTeam.spent]);

  // Total Grid Spend & Average Headroom
  const totalGridSpend = useMemo(() => teams.reduce((acc, t) => acc + t.spent, 0), [teams]);
  const avgHeadroom = useMemo(() => (teams.reduce((acc, t) => acc + (BUDGET_CAP - t.spent), 0) / teams.length), [teams]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", paddingBottom: "28px" }}>
      {/* ── Notification Toast ── */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "84px",
            right: "28px",
            zIndex: 9999,
            padding: "12px 22px",
            borderRadius: "8px",
            fontWeight: "800",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            background: notification.type === "error" ? "rgba(232,0,45,0.95)" : "rgba(0,204,68,0.95)",
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(0,204,68,0.4)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          {notification.msg}
        </div>
      )}

      {/* ════════ 1. FIA FINANCIAL REGULATIONS COMMAND HEADER ════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(9, 11, 19, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          padding: "14px 22px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient Top Glow Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #ff1801 0%, #00d2be 50%, #ffc72c 100%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(255,24,1,0.2) 0%, rgba(255,255,255,0.03) 100%)",
              border: "1px solid rgba(255,24,1,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              boxShadow: "0 0 16px rgba(255,24,1,0.25)",
            }}
          >
            ⚖️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "1.15rem",
                  fontWeight: "900",
                  letterSpacing: "0.12em",
                  color: "#ffffff",
                }}
              >
                FIA COST CAP MISSION CONTROL
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  color: "var(--neon-cyan)",
                  background: "rgba(0,210,190,0.12)",
                  border: "1px solid rgba(0,210,190,0.35)",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  letterSpacing: "0.06em",
                }}
              >
                2026 FINANCIAL REGS · $135.0M CAP
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.68rem",
                  fontFamily: "'Orbitron', monospace",
                  color: "var(--neon-green)",
                  background: "rgba(0,204,68,0.12)",
                  border: "1px solid rgba(0,204,68,0.3)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 8px var(--neon-green)" }} />
                AUDIT LIVE
              </span>
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "4px", letterSpacing: "0.02em" }}>
              Official Financial Regulations Monitoring · Aerodynamic Testing Restrictions (ATR) · All 11 Constructors
            </div>
          </div>
        </div>

        {/* Global Financial Metrics & View Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(0, 204, 68, 0.08)",
              border: "1px solid rgba(0, 204, 68, 0.25)",
              padding: "6px 14px",
              borderRadius: "8px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
              FIA COMPLIANCE
            </div>
            <div style={{ fontSize: "0.86rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "var(--neon-green)" }}>
              11/11 TEAMS LEGAL
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "6px 14px",
              borderRadius: "8px",
              textAlign: "right",
            }}
          >
            <div style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
              TOTAL GRID SPEND
            </div>
            <div style={{ fontSize: "0.86rem", fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>
              {fmt$(totalGridSpend)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setViewMode("DASHBOARD")}
              style={{
                background: viewMode === "DASHBOARD" ? "linear-gradient(135deg, var(--neon-red) 0%, #b30022 100%)" : "transparent",
                border: "none",
                color: viewMode === "DASHBOARD" ? "#ffffff" : "var(--text-secondary)",
                padding: "8px 14px",
                borderRadius: "6px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "800",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: viewMode === "DASHBOARD" ? "0 2px 10px rgba(232,0,45,0.4)" : "none",
              }}
            >
              🏎️ TEAM WORKBENCH
            </button>
            <button
              onClick={() => setViewMode("STANDINGS")}
              style={{
                background: viewMode === "STANDINGS" ? "linear-gradient(135deg, var(--neon-red) 0%, #b30022 100%)" : "transparent",
                border: "none",
                color: viewMode === "STANDINGS" ? "#ffffff" : "var(--text-secondary)",
                padding: "8px 14px",
                borderRadius: "6px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.72rem",
                fontWeight: "800",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: viewMode === "STANDINGS" ? "0 2px 10px rgba(232,0,45,0.4)" : "none",
              }}
            >
              📊 GRID AUDIT (11)
            </button>
          </div>
        </div>
      </div>

      {/* ════════ 2. OFFICIAL CONSTRUCTORS' CHAMPIONSHIP SELECTOR TABS (#01 to #11) ════════ */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "6px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.2) transparent",
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
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "8px 14px",
                background: isSelected
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(20, 24, 38, 0.95) 100%)"
                  : "rgba(14, 17, 27, 0.85)",
                borderTop: `2px solid ${isSelected ? t.color : "rgba(255,255,255,0.06)"}`,
                borderRight: "1px solid rgba(255, 255, 255, 0.06)",
                borderBottom: isSelected ? `2px solid ${t.color}` : "1px solid rgba(255, 255, 255, 0.06)",
                borderLeft: `4px solid ${t.color}`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isSelected ? `0 4px 20px ${t.color}40, inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
                transform: isSelected ? "translateY(-1px)" : "none",
              }}
            >
              {/* Rank Badge */}
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.70rem",
                  fontWeight: "900",
                  color: isSelected ? t.color : "var(--text-dim)",
                }}
              >
                #{String(t.rank).padStart(2, "0")}
              </span>

              {/* Constructor Logo */}
              {logo && (
                <img
                  src={logo}
                  alt={t.team}
                  style={{ width: "20px", height: "20px", objectFit: "contain", filter: isSelected ? "none" : "grayscale(30%)" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}

              {/* Team Short Name */}
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.80rem",
                  fontWeight: "900",
                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                  letterSpacing: "0.04em",
                }}
              >
                {t.short || t.team.slice(0, 3).toUpperCase()}
              </span>

              {/* Headroom Pill */}
              <span
                style={{
                  fontSize: "0.66rem",
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: "700",
                  color: "var(--neon-green)",
                  background: "rgba(0,204,68,0.12)",
                  border: "1px solid rgba(0,204,68,0.25)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {fmt$(tRemaining)}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === "DASHBOARD" ? (
        <>
          {/* ════════ 3. SELECTED TEAM FINANCIAL HUD & 3D CAR CUTOUT STAGE ════════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1.35fr",
              gap: "14px",
              alignItems: "stretch",
            }}
          >
            {/* Left: 4 Financial Telemetry Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Card 1: Total Cap Allocation */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                      TOTAL CAP ALLOCATION
                    </span>
                    <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: "3px" }}>
                      STATUTORY
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.65rem", fontWeight: "900", color: "#ffffff", marginTop: "6px" }}>
                    $135.0M
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  FIA 2026 Indexed · PU / Driver Exempt
                </div>
              </div>

              {/* Card 2: Budget Spent & Burn Rate */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: `2px solid ${spentPercent > 90 ? "var(--neon-red)" : "var(--neon-yellow)"}`,
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                      BUDGET SPENT (SEASON)
                    </span>
                    <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: spentPercent > 90 ? "var(--neon-red)" : "var(--neon-yellow)", background: spentPercent > 90 ? "rgba(232,0,45,0.15)" : "rgba(255,204,0,0.15)", padding: "1px 6px", borderRadius: "3px" }}>
                      {spentPercent.toFixed(1)}% CAP
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.65rem", fontWeight: "900", color: spentPercent > 90 ? "var(--neon-red)" : "var(--neon-yellow)", marginTop: "6px" }}>
                    {fmt$(currentTeam.spent)}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  Projected: <strong style={{ color: "#ffffff" }}>{fmt$(currentTeam.projected_finish || 132_500_000)}</strong> · $4.9M/GP Burn
                </div>
              </div>

              {/* Card 3: Remaining Headroom */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: "2px solid var(--neon-green)",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                      REMAINING HEADROOM
                    </span>
                    <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", padding: "1px 6px", borderRadius: "3px" }}>
                      R&D SAFE
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.65rem", fontWeight: "900", color: "var(--neon-green)", marginTop: "6px" }}>
                    {fmt$(remainingBudget)}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  {(100 - spentPercent).toFixed(1)}% Available · ~2 Major Aero Packages
                </div>
              </div>

              {/* Card 4: ATR Aero Testing Restriction Scale */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 22, 0.95) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderTop: "2px solid var(--neon-cyan)",
                  borderRadius: "10px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                      ATR TESTING ALLOCATION
                    </span>
                    <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", background: "rgba(0,210,190,0.15)", padding: "1px 6px", borderRadius: "3px" }}>
                      WCC #{String(currentTeam.rank).padStart(2, "0")}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.65rem", fontWeight: "900", color: "var(--neon-cyan)", marginTop: "6px" }}>
                    {currentTeam.atr_scale}% <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-dim)" }}>ATR</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                  {currentTeam.wind_tunnel_hours}h Tunnel · {currentTeam.cfd_hours}h CFD Megaflops
                </div>
              </div>
            </div>

            {/* Right: 3D Car Virtual Showroom Turntable & Category Filter Chips */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.2rem", fontWeight: "900", color: "#ffffff" }}>
                      {currentTeam.team}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.78rem",
                        fontWeight: "800",
                        color: currentTeam.color,
                        background: `${currentTeam.color}22`,
                        border: `1px solid ${currentTeam.color}55`,
                        padding: "2px 8px",
                        borderRadius: "5px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {currentTeam.car_model}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                    👔 {currentTeam.principal} &nbsp;·&nbsp; ⚡ {currentTeam.engine}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                    DEVELOPMENT EFFICIENCY
                  </div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "var(--neon-green)" }}>
                    {currentTeam.efficiency_rating}
                  </div>
                </div>
              </div>

              {/* 2026 Car Turntable Stage with 3D Concentric Ring Underglow */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "170px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "6px 0",
                }}
              >
                {/* Turntable Outer Ring */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    width: "90%",
                    height: "50px",
                    borderRadius: "50%",
                    border: "1px dashed rgba(255, 255, 255, 0.18)",
                    pointerEvents: "none",
                  }}
                />
                {/* Turntable Inner Glow */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    width: "75%",
                    height: "36px",
                    background: `radial-gradient(ellipse at center, ${currentTeam.color}55 0%, ${currentTeam.color}15 50%, transparent 75%)`,
                    borderRadius: "50%",
                    filter: "blur(8px)",
                    pointerEvents: "none",
                  }}
                />

                {TEAM_CARS[currentTeam.team] ? (
                  <img
                    src={TEAM_CARS[currentTeam.team]}
                    alt={`${currentTeam.team} car`}
                    style={{
                      maxHeight: "145px",
                      maxWidth: "94%",
                      objectFit: "contain",
                      filter: `drop-shadow(0 14px 20px ${currentTeam.color}44)`,
                      zIndex: 2,
                    }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <div style={{ color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", fontSize: "0.85rem" }}>
                    🏎️ 2026 Technical Chassis Model
                  </div>
                )}
              </div>

              {/* Interactive Category Filter Chips */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", zIndex: 2, flexWrap: "wrap" }}>
                {[
                  { label: "ALL UPGRADES", cat: "ALL", icon: "🌐" },
                  { label: "AERO", cat: "AERO", icon: "🌀" },
                  { label: "350kW PU", cat: "PU", icon: "⚡" },
                  { label: "FLOOR", cat: "FLOOR", icon: "🏎️" },
                  { label: "CHASSIS", cat: "CHASSIS", icon: "🔩" },
                  { label: "BRAKES", cat: "BRAKES", icon: "🛑" },
                ].map((chip) => {
                  const isCatActive = activeCategory === chip.cat;
                  const catCount = chip.cat === "ALL"
                    ? availableInShop.length
                    : availableInShop.filter((u) => u.category === chip.cat).length;

                  return (
                    <button
                      key={chip.cat}
                      onClick={() => setActiveCategory(chip.cat)}
                      style={{
                        background: isCatActive
                          ? "linear-gradient(135deg, var(--neon-blue) 0%, #0055cc 100%)"
                          : "rgba(255,255,255,0.05)",
                        border: isCatActive ? "1px solid #3399ff" : "1px solid rgba(255,255,255,0.08)",
                        color: isCatActive ? "#ffffff" : "var(--text-secondary)",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.66rem",
                        fontWeight: "800",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: isCatActive ? "0 2px 10px rgba(0,136,255,0.4)" : "none",
                      }}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                      <span
                        style={{
                          fontSize: "0.58rem",
                          background: isCatActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                          padding: "1px 4px",
                          borderRadius: "3px",
                          color: isCatActive ? "#ffffff" : "var(--text-dim)",
                        }}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ════════ 4. COST CAP CONSUMPTION BAR & SAFE ZONE TELEMETRY ════════ */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "14px 18px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "800", color: "#ffffff" }}>
                  {currentTeam.team} Cost Cap Consumption
                </span>
                <span
                  style={{
                    fontSize: "0.70rem",
                    fontFamily: "'Orbitron', monospace",
                    fontWeight: "800",
                    color: "var(--neon-green)",
                    background: "rgba(0,204,68,0.15)",
                    border: "1px solid rgba(0,204,68,0.3)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  🟢 FIA SAFE COMPLIANCE ZONE
                </span>
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", color: spentPercent > 90 ? "var(--neon-red)" : "var(--neon-yellow)", fontWeight: "800" }}>
                {spentPercent.toFixed(1)}% Consumed &nbsp;·&nbsp; {fmt$(remainingBudget)} Headroom Available
              </div>
            </div>

            {/* High-Tech Segmented Progress Bar */}
            <div
              style={{
                height: "18px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "9px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                position: "relative",
              }}
            >
              {/* 95% Minor Breach Line Indicator */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "95%",
                  width: "2px",
                  background: "#ff0055",
                  zIndex: 3,
                  boxShadow: "0 0 8px #ff0055",
                }}
                title="95% Minor Breach Threshold ($128.25M)"
              />

              {/* Progress Fill */}
              <div
                style={{
                  width: `${Math.min(spentPercent, 100)}%`,
                  height: "100%",
                  background: spentPercent > 95
                    ? "linear-gradient(90deg, #ffcc00 0%, #ff0055 100%)"
                    : spentPercent > 85
                    ? "linear-gradient(90deg, #00e676 0%, #ffcc00 100%)"
                    : "linear-gradient(90deg, #00d2be 0%, #00e676 100%)",
                  borderRadius: "9px",
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 14px rgba(0,210,190,0.6)",
                }}
              />
            </div>

            {/* Scale Markers & FIA Regulatory Callouts */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
                fontSize: "0.68rem",
                color: "var(--text-dim)",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
              }}
            >
              <span>$0 (SEASON START)</span>
              <span>$67.5M (MID-SEASON)</span>
              <span style={{ color: "#ffaa00" }}>$128.25M (95% MINOR BREACH)</span>
              <span style={{ color: "var(--neon-red)" }}>$135.0M (FIA CEILING)</span>
            </div>
          </div>

          {/* ════════ 5. R&D UPGRADE SHOP & INSTALLED PACKAGES ════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "14px" }}>
            {/* Upgrade Shop */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.90rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em" }}>
                    🛒 2026 R&D UPGRADE SHOP
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                    ({filteredShop.length} available)
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleRunOptimizer}
                    style={{
                      background: "rgba(0, 136, 255, 0.15)",
                      border: "1px solid var(--neon-blue)",
                      color: "var(--neon-blue)",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.70rem",
                      fontWeight: "800",
                      padding: "5px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 2px 8px rgba(0,136,255,0.25)",
                    }}
                  >
                    ⚡ AUTO-OPTIMIZE
                  </button>
                  <button
                    onClick={handleResetTeam}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "var(--text-secondary)",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.70rem",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    title="Reset to factory baseline spec"
                  >
                    ↺ RESET
                  </button>
                </div>
              </div>

              {/* Knapsack Optimizer Recommendation HUD Banner */}
              {optimizerResult && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 136, 255, 0.15) 0%, rgba(0, 85, 204, 0.08) 100%)",
                    border: "1px solid var(--neon-blue)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    boxShadow: "0 4px 16px rgba(0, 136, 255, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "var(--neon-blue)", letterSpacing: "0.06em" }}>
                      ⚡ KNAPSACK ALGORITHM RECOMMENDATION
                    </span>
                    <button
                      onClick={handleApplyOptimizer}
                      style={{
                        background: "linear-gradient(135deg, var(--neon-green) 0%, #009933 100%)",
                        border: "none",
                        color: "#000000",
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.70rem",
                        fontWeight: "900",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        boxShadow: "0 2px 10px rgba(0,204,68,0.4)",
                      }}
                    >
                      APPLY ALL (+{optimizerResult.totalPerf} PTS)
                    </button>
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                    Maximum performance package density fitting remaining {fmt$(remainingBudget)}:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {optimizerResult.selected.map((u) => (
                      <span
                        key={u.name}
                        style={{
                          fontSize: "0.68rem",
                          fontFamily: "'Orbitron', monospace",
                          background: "rgba(0, 204, 68, 0.15)",
                          border: "1px solid rgba(0, 204, 68, 0.3)",
                          color: "var(--neon-green)",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                        }}
                      >
                        ✓ {u.name} ({fmt$(u.cost)} · +{u.perf_points}pt)
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#ffffff", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
                    <span>Total Investment: {fmt$(optimizerResult.totalCost)}</span>
                    <span style={{ color: "var(--neon-cyan)" }}>Headroom Left: {fmt$(optimizerResult.remaining)}</span>
                  </div>
                </div>
              )}

              {/* Catalog Items List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "380px",
                  overflowY: "auto",
                  paddingRight: "4px",
                  scrollbarWidth: "thin",
                }}
              >
                {filteredShop.length === 0 ? (
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", padding: "20px 0", textAlign: "center" }}>
                    All packages in this category are manufactured and installed on {currentTeam.car_model}!
                  </div>
                ) : (
                  filteredShop.map((u) => {
                    const canAfford = remainingBudget >= u.cost;
                    return (
                      <div
                        key={u.name}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: "8px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxWidth: "75%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "800", color: "#ffffff", fontSize: "0.82rem" }}>
                              {u.name}
                            </span>
                            <span
                              style={{
                                fontSize: "0.62rem",
                                fontFamily: "'Orbitron', monospace",
                                fontWeight: "800",
                                color: "var(--neon-cyan)",
                                background: "rgba(0,210,190,0.12)",
                                border: "1px solid rgba(0,210,190,0.3)",
                                padding: "1px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              {u.category}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>
                            {u.desc}
                          </div>
                          <div style={{ fontSize: "0.70rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", display: "flex", gap: "10px" }}>
                            <span>{fmt$(u.cost)}</span>
                            <span style={{ color: "var(--neon-green)", fontWeight: "800" }}>+{u.perf_points} PTS</span>
                            <span>{u.cfd_cost}h CFD</span>
                            <span>{u.lead_time}</span>
                          </div>
                        </div>

                        <button
                          disabled={!canAfford}
                          onClick={() => handlePurchase(u)}
                          style={{
                            background: canAfford
                              ? "linear-gradient(135deg, var(--neon-blue) 0%, #0055cc 100%)"
                              : "rgba(255,255,255,0.05)",
                            border: canAfford ? "1px solid #3399ff" : "1px solid rgba(255,255,255,0.1)",
                            color: canAfford ? "#ffffff" : "var(--text-dim)",
                            padding: "8px 14px",
                            borderRadius: "6px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.70rem",
                            fontWeight: "800",
                            letterSpacing: "0.04em",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            whiteSpace: "nowrap",
                            boxShadow: canAfford ? "0 2px 10px rgba(0,136,255,0.3)" : "none",
                          }}
                        >
                          {canAfford ? "⚡ MANUFACTURE" : "OVER CAP"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Installed Packages & Telemetry Yield */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.90rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.04em" }}>
                    📦 INSTALLED ON {currentTeam.car_model}
                  </span>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Active Chassis Aerodynamic & Powertrain Specs
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.85rem",
                    fontWeight: "900",
                    color: "var(--neon-green)",
                    background: "rgba(0,204,68,0.15)",
                    border: "1px solid var(--neon-green)",
                    padding: "3px 10px",
                    borderRadius: "5px",
                    boxShadow: "0 0 10px rgba(0,204,68,0.2)",
                  }}
                >
                  +{totalPerfPoints} TOTAL PTS
                </div>
              </div>

              {/* Installed List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "380px",
                  overflowY: "auto",
                  paddingRight: "4px",
                  scrollbarWidth: "thin",
                }}
              >
                {(currentTeam.upgrades || []).length === 0 ? (
                  <div style={{ color: "var(--text-dim)", fontSize: "0.82rem", padding: "20px 0", textAlign: "center" }}>
                    No upgrades installed yet. Browse the R&D shop to equip packages.
                  </div>
                ) : (
                  (currentTeam.upgrades || []).map((u) => (
                    <div
                      key={u.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "rgba(0,204,68,0.05)",
                        borderLeft: "4px solid var(--neon-green)",
                        borderTop: "1px solid rgba(0,204,68,0.2)",
                        borderRight: "1px solid rgba(0,204,68,0.2)",
                        borderBottom: "1px solid rgba(0,204,68,0.2)",
                        borderRadius: "6px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "800", color: "#ffffff", fontSize: "0.82rem" }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: "0.70rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {fmt$(u.cost)} &nbsp;·&nbsp; FIA Homologated & Active
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "900", fontSize: "0.82rem" }}>
                          +{u.perf_points} pts
                        </span>
                        <button
                          onClick={() => handleUninstall(u.name)}
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            color: "var(--text-secondary)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            transition: "all 0.15s ease",
                          }}
                          title="Uninstall package & refund budget"
                        >
                          ↺
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ════════ 6. FINANCIAL AUDIT & EXPENSE BREAKDOWN (RECHARTS) ════════ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            {/* Card 1: Quarterly Spending Trend vs Cap Ceiling */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "var(--text-secondary)", letterSpacing: "0.08em", fontWeight: "800" }}>
                  QUARTERLY R&D RUN-RATE ($M)
                </span>
                <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                  CEILING: $33.75M / QTR
                </span>
              </div>

              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={quarterlySpendData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                  <XAxis dataKey="quarter" stroke="#777" tick={{ fontSize: 10, fontFamily: "'Orbitron', monospace" }} />
                  <YAxis domain={[0, 40]} stroke="#777" tick={{ fontSize: 10, fontFamily: "'Orbitron', monospace" }} />
                  <Tooltip
                    contentStyle={{ background: "#0c0d15", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "0.75rem", fontFamily: "'Orbitron', monospace" }}
                    formatter={(val) => [`$${val}M Spent`, "Expenditure"]}
                  />
                  <ReferenceLine y={33.75} stroke="#ff0055" strokeDasharray="5 3" label={{ value: "$33.75M CEILING", fill: "#ff0055", fontSize: 10, position: "insideTopRight" }} />
                  <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                    {quarterlySpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={currentTeam.color || "#00d2be"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Card 2: Cost Allocation Categories Breakdown */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "var(--text-secondary)", letterSpacing: "0.08em", fontWeight: "800" }}>
                COST ALLOCATION BREAKDOWN ({currentTeam.team})
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { name: "R&D & Wind Tunnel Testing", amt: currentTeam.breakdown?.rd || 45_000_000, pct: 38, color: "var(--neon-blue)" },
                  { name: "Manufacturing & Monocoque Spares", amt: currentTeam.breakdown?.mfg || 33_200_000, pct: 28, color: "var(--neon-green)" },
                  { name: "Trackside Race Operations", amt: currentTeam.breakdown?.ops || 26_000_000, pct: 22, color: "var(--neon-yellow)" },
                  { name: "Freight, Logistics & Hospitality", amt: currentTeam.breakdown?.log || 14_200_000, pct: 12, color: "#bf7fff" },
                ].map((item) => (
                  <div key={item.name} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem" }}>
                      <span style={{ color: "#ffffff", fontWeight: "600" }}>{item.name}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", color: item.color, fontWeight: "800" }}>
                        {fmt$(item.amt)} ({item.pct}%)
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "3px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ════════ 7. ALL 11 CONSTRUCTORS COST CAP STANDINGS MATRIX ════════ */
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 12, 20, 0.98) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em" }}>
                ALL 11 CONSTRUCTORS — COST CAP LEADERBOARD
              </span>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "3px" }}>
                Official 2026 Constructors' Championship Financial Compliance & Aero Testing Restriction (ATR) Matrix
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", minWidth: "900px" }}>
              <thead>
                <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid rgba(255,255,255,0.12)", textAlign: "left", fontFamily: "'Orbitron', monospace", fontSize: "0.70rem" }}>
                  <th style={{ padding: "12px 14px" }}>WCC RANK</th>
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
                      <td style={{ padding: "14px", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: t.color }}>
                        #{String(t.rank).padStart(2, "0")}
                      </td>
                      <td style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 6px", fontWeight: "800" }}>
                        {logo && (
                          <img src={logo} alt={t.team} style={{ width: "22px", height: "22px", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                        <span style={{ color: "#ffffff" }}>{t.team}</span>
                      </td>
                      <td style={{ fontFamily: "'Orbitron', monospace", color: "var(--text-secondary)" }}>{t.car_model}</td>
                      <td style={{ fontSize: "0.76rem", color: "var(--text-dim)" }}>{t.engine}</td>
                      <td style={{ fontFamily: "'Orbitron', monospace", fontWeight: "800", color: "#ffffff" }}>{fmt$(t.spent)}</td>
                      <td style={{ fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "800" }}>{fmt$(rem)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: pct > 90 ? "var(--neon-red)" : "var(--neon-yellow)", fontWeight: "800" }}>
                            {pct.toFixed(1)}%
                          </span>
                          <div style={{ width: "55px", height: "5px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
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
                            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#ffffff",
                            padding: "6px 12px",
                            borderRadius: "5px",
                            fontFamily: "'Orbitron', monospace",
                            fontSize: "0.70rem",
                            fontWeight: "800",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
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
