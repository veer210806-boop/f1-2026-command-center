// ============================================================
// RestartMenuModal.jsx — Dynamic Race Reset & Constructor Switcher
// Allows restarting the current race from Lap 1, changing team,
// toggling between Player and FIA Admin, or returning to the Gateway.
// ============================================================
import React, { useState } from "react";
import { CONSTRUCTORS_2026 } from "./StrategyGameGatewayModal";

export default function RestartMenuModal({
  isOpen = false,
  onClose,
  currentCircuitName = "Australian Grand Prix",
  currentRole = "team", // "team" | "fia"
  currentTeamId = "Ferrari",
  onRestartRace,
  onChangeTeam,
  onToggleRole,
  onOpenGateway,
}) {
  const [isSelectingTeam, setIsSelectingTeam] = useState(false);

  if (!isOpen) return null;

  const currentTeamObj = CONSTRUCTORS_2026.find((t) => t.id === currentTeamId) || CONSTRUCTORS_2026[0];

  const handleClose = () => {
    setIsSelectingTeam(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "rgba(4, 7, 14, 0.85)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isSelectingTeam ? "720px" : "580px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(180deg, rgba(18, 24, 38, 0.98) 0%, rgba(10, 13, 22, 0.99) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "22px 24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75), 0 0 25px rgba(232, 0, 45, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.05rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔄</span>
              <span>{isSelectingTeam ? "SELECT YOUR 2026 CONSTRUCTOR" : "SESSION RESTART & STRATEGY CONTROL"}</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
              Current Grand Prix: <strong style={{ color: "var(--neon-cyan)" }}>{currentCircuitName}</strong>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-dim)",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Current State Summary Pill */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "8px",
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.74rem",
            fontFamily: "'Orbitron', monospace",
          }}
        >
          <div>
            <span style={{ color: "var(--text-dim)" }}>OPERATIONAL MODE: </span>
            <span style={{ color: currentRole === "team" ? "var(--neon-cyan)" : "var(--neon-green)", fontWeight: "800" }}>
              {currentRole === "team" ? "TEAM STRATEGIST" : "FIA ADMINISTRATOR"}
            </span>
          </div>
          {currentRole === "team" && (
            <div>
              <span style={{ color: "var(--text-dim)" }}>TEAM: </span>
              <span style={{ color: currentTeamObj.color, fontWeight: "900" }}>
                {currentTeamObj.name.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Action Body: Either Options or Inline 11-Team Switcher */}
        {isSelectingTeam ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "700" }}>
                Select a team to take command of their pit wall & drivers:
              </span>
              <button
                onClick={() => setIsSelectingTeam(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "0.70rem",
                  fontFamily: "'Orbitron', monospace",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", maxHeight: "55vh", overflowY: "auto", paddingRight: "4px" }}>
              {CONSTRUCTORS_2026.map((team) => {
                const isCurrent = team.id === currentTeamId;
                return (
                  <button
                    key={team.id}
                    onClick={() => {
                      if (onChangeTeam) onChangeTeam(team.id);
                      handleClose();
                    }}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      background: isCurrent
                        ? `linear-gradient(135deg, ${team.color}25 0%, rgba(20,24,36,0.95) 100%)`
                        : "rgba(0, 0, 0, 0.4)",
                      border: isCurrent ? `1.5px solid ${team.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = team.color;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isCurrent ? team.color : "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.76rem", fontWeight: "900", color: "#ffffff" }}>
                        {team.name}
                      </span>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: team.color, boxShadow: `0 0 6px ${team.color}` }} />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600" }}>
                      {team.drivers.map((d) => `#${d.num} ${d.code}`).join(" · ")}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.62rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                      <span>PIT: {team.pitSpeed}</span>
                      <span style={{ color: team.color, fontWeight: "800" }}>{isCurrent ? "ACTIVE" : "SELECT →"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Option 1: Restart Current Race */}
            <button
              onClick={() => {
                if (onRestartRace) onRestartRace();
                handleClose();
              }}
              style={{
                background: "linear-gradient(135deg, rgba(232,0,45,0.18) 0%, rgba(20,24,36,0.9) 100%)",
                border: "1px solid rgba(232,0,45,0.4)",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--neon-red)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,0,45,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(232,0,45,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏁</span>
                  <span>RESTART CURRENT RACE (LAP 1)</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
                  Reset to Lap 1 with fresh tires, brand new pit count, and original qualifying grid order.
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--neon-red)", fontWeight: "900" }}>→</span>
            </button>

            {/* Option 2: Change Team */}
            <button
              onClick={() => setIsSelectingTeam(true)}
              style={{
                background: "linear-gradient(135deg, rgba(54,113,232,0.18) 0%, rgba(20,24,36,0.9) 100%)",
                border: "1px solid rgba(54,113,232,0.4)",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--neon-cyan)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(54,113,232,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(54,113,232,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🏎️</span>
                  <span>SWITCH TO DIFFERENT CONSTRUCTOR</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
                  Keep this race track, but switch your strategy seat to another 2026 constructor.
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--neon-cyan)", fontWeight: "900" }}>→</span>
            </button>

            {/* Option 3: Switch Role (FIA Admin vs Team Principal) */}
            <button
              onClick={() => {
                if (onToggleRole) onToggleRole();
                handleClose();
              }}
              style={{
                background: "linear-gradient(135deg, rgba(0,204,68,0.18) 0%, rgba(20,24,36,0.9) 100%)",
                border: "1px solid rgba(0,204,68,0.4)",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--neon-green)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,204,68,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,204,68,0.4)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🛡️</span>
                  <span>
                    {currentRole === "team" ? "SWITCH TO FIA ADMINISTRATOR (GOD-MODE)" : "SWITCH TO TEAM STRATEGY PRINCIPAL"}
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
                  {currentRole === "team"
                    ? "Gain unrestricted god-mode clearance to force-pit any car and trigger flags."
                    : "Switch to single-team tactical strategy mode where you command your 2 drivers."}
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--neon-green)", fontWeight: "900" }}>→</span>
            </button>

            {/* Option 4: Full Reset to Gateway */}
            <button
              onClick={() => {
                if (onOpenGateway) onOpenGateway();
                handleClose();
              }}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ffffff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
            >
              <div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.85rem", fontWeight: "900", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🔁</span>
                  <span>RETURN TO MAIN GATEWAY</span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-dim)", fontFamily: "'Rajdhani', sans-serif", fontWeight: "600", marginTop: "2px" }}>
                  Re-open the full starting screen to reconfigure clearances and full roster showroom.
                </div>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: "900" }}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
