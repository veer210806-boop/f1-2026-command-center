// ============================================================
// StrategyGameGatewayModal.jsx — F1 2026 Mission Control Starting Screen
// Clean single-viewport constructor selector with live car & driver preview.
// ============================================================
import React, { useState } from "react";
import { TEAM_CARS, TEAM_LOGOS_WHITE, TEAM_LOGOS } from "../data/f1MediaAssets2026";
import { CONSTRUCTORS_2026 } from "../data/constructors2026";
import { useModalDialog } from "../utils/useModalDialog";

export default function StrategyGameGatewayModal({
  isOpen = true,
  onLaunchGame,
  onClose,
  initialTeam = "Ferrari",
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeam || "Ferrari");

  const activeTeam = CONSTRUCTORS_2026.find((t) => t.id === selectedTeamId) || CONSTRUCTORS_2026[0];
  const activeLogo = TEAM_LOGOS_WHITE[activeTeam.id] || TEAM_LOGOS[activeTeam.id];

  const handleLaunch = () => {
    if (onLaunchGame) {
      onLaunchGame({
        role: "team",
        teamId: selectedTeamId,
        teamData: activeTeam,
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

          {/* ── TOP HEADER ── */}
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Orbitron', monospace", fontSize: "0.66rem", fontWeight: "800", color: "var(--text-secondary)", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.09)", padding: "7px 12px", borderRadius: "8px" }}>
              <span>SELECT 2026 CONSTRUCTOR</span>
              <span style={{ color: "var(--text-dim)" }}>·</span>
              <span style={{ color: "var(--neon-cyan)" }}>11 TEAMS</span>
            </div>
          </div>

          {/* ── CONSTRUCTOR SELECTOR GRID (BALANCED 4-COL LAYOUT) ── */}
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

          {/* ── BOTTOM LAUNCH BAR ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
              READY · <strong style={{ color: activeTeam.color }}>{activeTeam.name.toUpperCase()}</strong>
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
