// ============================================================
// StrategyGameGatewayModal.jsx — F1 2026 Strategy Simulation Gateway
// Select Operational Clearance: FIA Race Administrator vs. Team Strategy Principal
// Interactive 11-Constructor Showroom Selection with full 2026 liveries and driver duos.
// ============================================================
import React, { useState } from "react";
import { TEAM_CARS, TEAM_LOGOS, DRIVER_PHOTOS, getDriverFaceUrl } from "../data/f1MediaAssets2026";
import { TEAM_PERFORMANCE_2026 } from "../data/teamPerformance2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
export { CONSTRUCTORS_2026 };

export default function StrategyGameGatewayModal({
  isOpen = true,
  onLaunchGame,
  initialRole = "team",
  initialTeam = "Ferrari",
}) {
  const [selectedRole, setSelectedRole] = useState(initialRole || "team");
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeam || "Ferrari");

  if (!isOpen) return null;

  const activeTeam = CONSTRUCTORS_2026.find((t) => t.id === selectedTeamId) || CONSTRUCTORS_2026[0];

  const handleLaunch = () => {
    if (onLaunchGame) {
      onLaunchGame({
        role: selectedRole,
        teamId: selectedRole === "team" ? selectedTeamId : null,
        teamData: selectedRole === "team" ? activeTeam : null,
      });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "radial-gradient(ellipse at 50% 20%, rgba(18, 24, 38, 0.98) 0%, rgba(6, 8, 14, 0.99) 100%)",
        backdropFilter: "blur(18px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          background: "linear-gradient(180deg, rgba(16, 21, 33, 0.96) 0%, rgba(9, 12, 19, 0.99) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          padding: "24px 28px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(232, 0, 45, 0.15)",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Subtle Ambient Red Glow */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "360px",
            height: "160px",
            background: "radial-gradient(circle, rgba(232,0,45,0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        {/* ── HEADER TITLE ── */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(232,0,45,0.15)", border: "1px solid rgba(232,0,45,0.35)", padding: "4px 14px", borderRadius: "20px", marginBottom: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--neon-red)", boxShadow: "0 0 8px var(--neon-red)" }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.1em" }}>
              FIA FORMULA 1 WORLD CHAMPIONSHIP · 2026 SEASON
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "2.1rem",
              fontWeight: "900",
              color: "#ffffff",
              letterSpacing: "0.04em",
              margin: 0,
              textTransform: "uppercase",
              lineHeight: 1.15,
            }}
          >
            MISSION CONTROL & <span style={{ color: "var(--neon-red)", textShadow: "0 0 16px rgba(232,0,45,0.6)" }}>STRATEGY SIMULATOR</span>
          </h1>

          <p
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              maxWidth: "680px",
              margin: "6px auto 0",
              fontWeight: "600",
            }}
          >
            Select your operational clearance. Command your chosen constructor to victory through tactical pit windows, or oversee race control as the governing FIA Administrator.
          </p>
        </div>

        {/* ── STEP 1: OPERATIONAL CLEARANCE SELECTOR (2 BIG CARDS) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Card 1: Team Strategy Principal (Player Game Mode) */}
          <div
            onClick={() => setSelectedRole("team")}
            style={{
              background: selectedRole === "team"
                ? "linear-gradient(135deg, rgba(232, 0, 45, 0.18) 0%, rgba(20, 26, 42, 0.95) 100%)"
                : "rgba(12, 16, 26, 0.75)",
              border: `2px solid ${selectedRole === "team" ? "var(--neon-red)" : "rgba(255, 255, 255, 0.08)"}`,
              borderRadius: "14px",
              padding: "16px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: selectedRole === "team" ? "0 8px 24px rgba(232,0,45,0.3)" : "none",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(232,0,45,0.2)", border: "1px solid var(--neon-red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                  🏁
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                    TEAM STRATEGY PRINCIPAL
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    SINGLE-TEAM COMMAND (GAME MODE)
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `2px solid ${selectedRole === "team" ? "var(--neon-red)" : "rgba(255,255,255,0.3)"}`,
                  background: selectedRole === "team" ? "var(--neon-red)" : "transparent",
                  boxShadow: selectedRole === "team" ? "0 0 8px var(--neon-red)" : "none",
                }}
              />
            </div>

            <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", fontSize: "0.80rem", color: "#cbd5e1", lineHeight: 1.5, fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
              <li>Lock in as <strong>1 of 11 official constructors</strong> (Ferrari, Red Bull, McLaren, etc.).</li>
              <li>Execute pit calls & tire choices for <strong>your 2 drivers only</strong>.</li>
              <li>Out-maneuver the <strong>10 AI rival teams</strong> as they run independent pit strategies.</li>
              <li><strong>Win or lose</strong> based on your tactical timing, tire management, and undercut calls.</li>
            </ul>
          </div>

          {/* Card 2: FIA Race Administrator (God Mode) */}
          <div
            onClick={() => setSelectedRole("fia")}
            style={{
              background: selectedRole === "fia"
                ? "linear-gradient(135deg, rgba(0, 210, 190, 0.18) 0%, rgba(20, 26, 42, 0.95) 100%)"
                : "rgba(12, 16, 26, 0.75)",
              border: `2px solid ${selectedRole === "fia" ? "var(--neon-cyan)" : "rgba(255, 255, 255, 0.08)"}`,
              borderRadius: "14px",
              padding: "16px 20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: selectedRole === "fia" ? "0 8px 24px rgba(0,210,190,0.3)" : "none",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(0,210,190,0.2)", border: "1px solid var(--neon-cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.95rem", fontWeight: "900", color: "#ffffff" }}>
                    FIA RACE ADMINISTRATOR
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                    GLOBAL GOD-MODE CLEARANCE
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `2px solid ${selectedRole === "fia" ? "var(--neon-cyan)" : "rgba(255,255,255,0.3)"}`,
                  background: selectedRole === "fia" ? "var(--neon-cyan)" : "transparent",
                  boxShadow: selectedRole === "fia" ? "0 0 8px var(--neon-cyan)" : "none",
                }}
              />
            </div>

            <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", fontSize: "0.80rem", color: "#cbd5e1", lineHeight: 1.5, fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
              <li><strong>Full overseer clearance</strong>: command, audit, and force-pit all 22 cars.</li>
              <li>Manually trigger <strong>Safety Car, VSC, or Red Flags</strong> on demand.</li>
              <li>Universal telemetry inspection across all 11 teams simultaneously.</li>
              <li>Direct simulated overtakes, race incidents, and dynamic weather overrides.</li>
            </ul>
          </div>
        </div>

        {/* ── STEP 2: CONSTRUCTOR SELECTION (ONLY IF TEAM PRINCIPAL) ── */}
        {selectedRole === "team" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", fontWeight: "900", color: "#ffffff", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🏎️</span>
                <span>CHOOSE YOUR 2026 CONSTRUCTOR (11 TEAMS):</span>
              </span>
              <span style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                SELECTED: <strong style={{ color: activeTeam.color }}>{activeTeam.name.toUpperCase()}</strong>
              </span>
            </div>

            {/* 11 Constructors Grid Pills / Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {CONSTRUCTORS_2026.map((team) => {
                const isChosen = team.id === selectedTeamId;
                const logo = TEAM_LOGOS[team.id];
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    style={{
                      background: isChosen
                        ? `linear-gradient(135deg, ${team.color}35 0%, rgba(18,22,34,0.95) 100%)`
                        : "rgba(10, 14, 22, 0.75)",
                      border: `1.5px solid ${isChosen ? team.color : "rgba(255, 255, 255, 0.08)"}`,
                      borderTop: `3px solid ${team.color}`,
                      borderRadius: "10px",
                      padding: "8px 10px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isChosen ? `0 6px 18px ${team.color}44` : "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: isChosen ? "#ffffff" : "#cbd5e1" }}>
                        {team.short}
                      </span>
                      <span style={{ fontSize: "0.60rem", fontFamily: "'Orbitron', monospace", color: team.color, fontWeight: "800", background: `${team.color}20`, padding: "1px 5px", borderRadius: "3px" }}>
                        #{team.rank}
                      </span>
                    </div>

                    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.82rem", fontWeight: "900", color: "#ffffff", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {team.name}
                    </div>

                    {/* Driver Duos Tag */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace", marginTop: "4px" }}>
                      <span>#{team.drivers[0].num} {team.drivers[0].code}</span>
                      <span>·</span>
                      <span>#{team.drivers[1].num} {team.drivers[1].code}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── SELECTED TEAM HERO PREVIEW POD ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${activeTeam.color}22 0%, rgba(10, 14, 22, 0.95) 100%)`,
                border: `1.5px solid ${activeTeam.color}55`,
                borderLeft: `5px solid ${activeTeam.color}`,
                borderRadius: "12px",
                padding: "12px 18px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "18px",
                marginTop: "4px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: "900", color: "#ffffff" }}>
                    {activeTeam.name}
                  </span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", background: activeTeam.color, color: "#fff", padding: "2px 8px", borderRadius: "4px", fontWeight: "800" }}>
                    CHASSIS: {activeTeam.chassis}
                  </span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", border: "1px solid rgba(0,204,68,0.3)", padding: "2px 8px", borderRadius: "4px", fontWeight: "800" }}>
                    ⚡ {activeTeam.powerUnit}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
                  {activeTeam.drivers.map((dr) => (
                    <div key={dr.code} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.75rem" }}>{dr.flag}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: activeTeam.color }}>#{dr.num}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "800", color: "#ffffff" }}>{dr.name}</span>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>({dr.role})</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "6px" }}>
                  💡 <em>Tactical Strength: {activeTeam.strengths}</em>
                </div>
              </div>

              {/* 2026 Car Cutout preview */}
              {TEAM_CARS[activeTeam.id] && (
                <div style={{ maxWidth: "260px", display: "flex", justifyContent: "flex-end" }}>
                  <img
                    src={TEAM_CARS[activeTeam.id]}
                    alt={`${activeTeam.name} 2026 Car`}
                    style={{
                      maxHeight: "75px",
                      objectFit: "contain",
                      filter: `drop-shadow(0 6px 14px ${activeTeam.color}66)`,
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: ACTION LAUNCH BUTTON ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px", marginTop: "6px" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
            {selectedRole === "team" ? (
              <span>MODE: <strong style={{ color: "var(--neon-cyan)" }}>TEAM STRATEGIST</strong> · COMMANDING <strong style={{ color: activeTeam.color }}>{activeTeam.name}</strong></span>
            ) : (
              <span>MODE: <strong style={{ color: "var(--neon-green)" }}>FIA ADMIN</strong> · FULL GLOBAL OVERRIDE</span>
            )}
          </div>

          <button
            onClick={handleLaunch}
            style={{
              background: "linear-gradient(135deg, rgba(232,0,45,0.95) 0%, rgba(180,0,30,0.98) 100%)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "10px",
              padding: "10px 28px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.85rem",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(232,0,45,0.6)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "0.06em",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 0 28px rgba(232,0,45,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(232,0,45,0.6)"; }}
          >
            <span>🚀</span>
            <span>LAUNCH RACE WEEKEND</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
