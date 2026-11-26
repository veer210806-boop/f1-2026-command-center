// ============================================================
// StrategyGameGatewayModal.jsx — F1 2026 Mission Control Starting Screen
// Clean single-viewport launch gateway: Role Selector, 11 Constructors,
// Selected Car & Driver Lineup, and Race Weekend Launch.
// ============================================================
import React, { useState } from "react";
import { TEAM_CARS, TEAM_LOGOS_WHITE, TEAM_LOGOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { useModalDialog } from "../utils/useModalDialog";

export default function StrategyGameGatewayModal({
  isOpen = true,
  onLaunchGame,
  onClose,
  initialRole = "team",
  initialTeam = "Ferrari",
}) {
  const [selectedRole, setSelectedRole] = useState(initialRole || "team");
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeam || "Ferrari");

  const activeTeam = CONSTRUCTORS_2026.find((t) => t.id === selectedTeamId) || CONSTRUCTORS_2026[0];
  const activeLogo = TEAM_LOGOS_WHITE[activeTeam.id] || TEAM_LOGOS[activeTeam.id];

  const handleLaunch = () => {
    if (onLaunchGame) {
      onLaunchGame({
        role: selectedRole,
        teamId: selectedRole === "team" ? selectedTeamId : null,
        teamData: selectedRole === "team" ? activeTeam : null,
      });
    }
  };

  const dialogRef = useModalDialog(
    isOpen,
    () => (onClose ? onClose() : handleLaunch())
  );

  return (
    <dialog
      ref={dialogRef}
      className="gp-native-dialog"
      closedby="any"
      aria-labelledby="gateway-modal-title"
      style={{
        width: "100%",
        maxWidth: "1060px",
        maxHeight: "94vh",
        background: "linear-gradient(165deg, rgba(16, 20, 32, 0.98) 0%, rgba(9, 11, 18, 0.99) 100%)",
        borderTop: "2px solid rgba(232, 0, 45, 0.7)",
        borderRight: "1px solid rgba(255, 255, 255, 0.12)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "16px",
        padding: 0,
        boxShadow: "0 28px 70px rgba(0, 0, 0, 0.85), 0 0 36px rgba(232, 0, 45, 0.14)",
        overflowY: "auto",
      }}
    >
      {isOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            padding: "20px 24px",
            position: "relative",
          }}
        >
          {/* Ambient Telemetry Glow */}
          <div
            style={{
              position: "absolute",
              top: "-70px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "420px",
              height: "130px",
              background: "radial-gradient(circle, rgba(232,0,45,0.2) 0%, transparent 70%)",
              filter: "blur(36px)",
              pointerEvents: "none",
            }}
          />

          {/* ── TOP HEADER & COMPACT MODE SWITCHER ── */}
          <div className="gateway-header-row">
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.62rem",
                  fontWeight: "800",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.12em",
                  marginBottom: "4px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-red)", boxShadow: "0 0 8px var(--neon-red)" }} />
                <span>2026 FIA FORMULA 1 SEASON</span>
              </div>

              <h1
                id="gateway-modal-title"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "1.45rem",
                  fontWeight: "900",
                  color: "#ffffff",
                  letterSpacing: "0.04em",
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                GP-COMMAND <span style={{ color: "var(--neon-red)" }}>PIT WALL</span>
              </h1>
            </div>

            {/* Clean Segmented Mode Switcher */}
            <div className="gateway-role-grid" role="group" aria-label="Workspace mode">
              <button
                type="button"
                aria-pressed={selectedRole === "team"}
                onClick={() => setSelectedRole("team")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.16s ease",
                  background: selectedRole === "team"
                    ? "linear-gradient(135deg, rgba(232, 0, 45, 0.22) 0%, rgba(22, 26, 40, 0.96) 100%)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: `1.5px solid ${selectedRole === "team" ? "var(--neon-red)" : "rgba(255, 255, 255, 0.1)"}`,
                  boxShadow: selectedRole === "team" ? "0 4px 16px rgba(232, 0, 45, 0.22)" : "none",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🏁</span>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
                    CONSTRUCTOR DESK
                  </div>
                  <div style={{ fontSize: "0.68rem", color: selectedRole === "team" ? "#ff9eab" : "var(--text-dim)", fontWeight: "600" }}>
                    Single-team pit & strategy
                  </div>
                </div>
              </button>

              <button
                type="button"
                aria-pressed={selectedRole === "fia"}
                onClick={() => setSelectedRole("fia")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.16s ease",
                  background: selectedRole === "fia"
                    ? "linear-gradient(135deg, rgba(0, 210, 190, 0.2) 0%, rgba(22, 26, 40, 0.96) 100%)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: `1.5px solid ${selectedRole === "fia" ? "var(--neon-cyan)" : "rgba(255, 255, 255, 0.1)"}`,
                  boxShadow: selectedRole === "fia" ? "0 4px 16px rgba(0, 210, 190, 0.2)" : "none",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🛡️</span>
                <div>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", fontWeight: "900", color: "#ffffff" }}>
                    FIA RACE CONTROL
                  </div>
                  <div style={{ fontSize: "0.68rem", color: selectedRole === "fia" ? "#8ff7ea" : "var(--text-dim)", fontWeight: "600" }}>
                    Full 22-car grid & flags
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ── CONSTRUCTOR SELECTOR GRID (BALANCED 4-COL LAYOUT) ── */}
          {selectedRole === "team" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.70rem", fontWeight: "800", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                  SELECT 2026 CONSTRUCTOR
                </span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", color: "var(--text-dim)" }}>
                  11 TEAMS · 22 DRIVERS
                </span>
              </div>

              <div className="gateway-team-grid">
                {CONSTRUCTORS_2026.map((team) => {
                  const isChosen = team.id === selectedTeamId;
                  const logoUrl = TEAM_LOGOS_WHITE[team.id] || TEAM_LOGOS[team.id];
                  return (
                    <button
                      key={team.id}
                      type="button"
                      aria-pressed={isChosen}
                      onClick={() => setSelectedTeamId(team.id)}
                      style={{
                        background: isChosen
                          ? `linear-gradient(135deg, ${team.color}30 0%, rgba(16, 20, 32, 0.98) 100%)`
                          : "rgba(255, 255, 255, 0.025)",
                        borderTop: `2.5px solid ${team.color}`,
                        borderRight: `1px solid ${isChosen ? team.color : "rgba(255, 255, 255, 0.08)"}`,
                        borderBottom: `1px solid ${isChosen ? team.color : "rgba(255, 255, 255, 0.08)"}`,
                        borderLeft: `1px solid ${isChosen ? team.color : "rgba(255, 255, 255, 0.08)"}`,
                        borderRadius: "9px",
                        padding: "9px 11px",
                        cursor: "pointer",
                        transition: "all 0.14s ease",
                        boxShadow: isChosen ? `0 6px 18px ${team.color}33` : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                          {logoUrl && (
                            <img
                              src={logoUrl}
                              alt=""
                              style={{ height: "14px", width: "18px", objectFit: "contain", flexShrink: 0, opacity: isChosen ? 1 : 0.78 }}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          )}
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", fontWeight: "900", color: isChosen ? "#ffffff" : "var(--text-secondary)" }}>
                            {team.short}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: team.color, fontWeight: "800" }}>
                          #{team.rank}
                        </span>
                      </div>

                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: "700", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                        {team.name}
                      </div>

                      <div style={{ fontSize: "0.64rem", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
                        #{team.drivers[0].num} {team.drivers[0].code} · #{team.drivers[1].num} {team.drivers[1].code}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── COMPACT SELECTED CAR & DRIVER STAGE ── */}
              <div
                className="gateway-hero-pod"
                style={{
                  background: `linear-gradient(125deg, ${activeTeam.color}1E 0%, rgba(10, 13, 21, 0.96) 70%)`,
                  borderTop: `1px solid ${activeTeam.color}44`,
                  borderRight: `1px solid ${activeTeam.color}44`,
                  borderBottom: `1px solid ${activeTeam.color}44`,
                  borderLeft: `4px solid ${activeTeam.color}`,
                  borderRadius: "11px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {activeLogo && (
                      <img
                        src={activeLogo}
                        alt=""
                        style={{ height: "18px", width: "auto", objectFit: "contain" }}
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.98rem", fontWeight: "900", color: "#ffffff" }}>
                      {activeTeam.name}
                    </span>
                    <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", background: `${activeTeam.color}D8`, color: "#fff", padding: "2px 7px", borderRadius: "4px", fontWeight: "800" }}>
                      {activeTeam.chassis}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.66rem", color: "var(--neon-cyan)" }}>
                      {activeTeam.powerUnit}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {activeTeam.drivers.map((dr) => (
                      <div key={dr.code} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 9px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "0.75rem" }}>{dr.flag}</span>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.70rem", fontWeight: "900", color: activeTeam.color }}>#{dr.num}</span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.76rem", fontWeight: "700", color: "#ffffff" }}>{dr.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {TEAM_CARS[activeTeam.id] && (
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <img
                      src={TEAM_CARS[activeTeam.id]}
                      alt={`${activeTeam.name} 2026 Car`}
                      style={{
                        maxHeight: "62px",
                        width: "auto",
                        objectFit: "contain",
                        filter: `drop-shadow(0 6px 14px ${activeTeam.color}55)`,
                      }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0, 210, 190, 0.1) 0%, rgba(12, 16, 26, 0.95) 100%)",
                border: "1px solid rgba(0, 210, 190, 0.35)",
                borderRadius: "12px",
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.92rem", fontWeight: "900", color: "#ffffff" }}>
                  FULL-GRID FIA RACE CONTROL ACTIVE
                </div>
                <div style={{ fontSize: "0.80rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  All 11 constructors &amp; 22 cars unlocked for Safety Car flags, pit overrides, live telemetry &amp; OpenF1 replay.
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontFamily: "'Orbitron', monospace", fontSize: "0.66rem", fontWeight: "800" }}>
                <span style={{ padding: "5px 10px", borderRadius: "6px", background: "rgba(0,210,190,0.14)", color: "var(--neon-cyan)", border: "1px solid rgba(0,210,190,0.3)" }}>22 CARS LIVE</span>
                <span style={{ padding: "5px 10px", borderRadius: "6px", background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}>SC / VSC / RED</span>
              </div>
            </div>
          )}

          {/* ── BOTTOM LAUNCH BAR ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              {selectedRole === "team" ? (
                <span>READY · <strong style={{ color: activeTeam.color }}>{activeTeam.name.toUpperCase()}</strong></span>
              ) : (
                <span>READY · <strong style={{ color: "var(--neon-cyan)" }}>FIA RACE CONTROL</strong></span>
              )}
            </div>

            <button
              type="button"
              onClick={handleLaunch}
              style={{
                background: "linear-gradient(135deg, rgba(232,0,45,0.96) 0%, rgba(185,0,30,1) 100%)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: "9px",
                padding: "10px 24px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.80rem",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(232,0,45,0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                letterSpacing: "0.06em",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 26px rgba(232,0,45,0.75)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(232,0,45,0.5)"; }}
            >
              <span>LAUNCH RACE WEEKEND</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
