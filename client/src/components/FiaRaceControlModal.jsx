// ============================================================
// FiaRaceControlModal.jsx — Official FIA Race Control & Stewards Board
// Modeled directly after FIA.com sporting regulations and live bulletins
// ============================================================
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RACE_STATUS_FLAGS, INITIAL_FIA_BULLETINS } from "../data/fiaRaceControl";

export default function FiaRaceControlModal({
  isOpen,
  onClose,
  currentStatus = "GREEN",
  onStatusChange,
  bulletins = INITIAL_FIA_BULLETINS,
}) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [bulletinList, setBulletinList] = useState(bulletins);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  if (!isOpen) return null;

  const handleSelectStatus = (code) => {
    setSelectedStatus(code);
    if (onStatusChange) {
      onStatusChange(code);
    }
  };

  const filteredBulletins = bulletinList.filter((b) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "TRACK_LIMITS") return b.type === "TRACK_LIMITS";
    if (activeFilter === "INVESTIGATIONS") return b.type === "INVESTIGATION" || b.type === "DECISION";
    if (activeFilter === "TECHNICAL") return b.type === "TECHNICAL_DIRECTIVE";
    return true;
  });

  const activeFlagConf = RACE_STATUS_FLAGS[selectedStatus] || RACE_STATUS_FLAGS.GREEN;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(5, 7, 14, 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "95%",
          maxWidth: "1100px",
          maxHeight: "90vh",
          background: "linear-gradient(180deg, #101322 0%, #0a0c16 100%)",
          border: `1px solid ${activeFlagConf.border}`,
          borderRadius: "14px",
          boxShadow: `0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${activeFlagConf.color}33`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Laser Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, transparent, ${activeFlagConf.color}, transparent)`,
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: activeFlagConf.bg,
                border: `1px solid ${activeFlagConf.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
              }}
            >
              {activeFlagConf.icon}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "1.25rem",
                    fontWeight: "900",
                    letterSpacing: "0.06em",
                    color: "#ffffff",
                    margin: 0,
                  }}
                >
                  FIA <span style={{ color: activeFlagConf.color }}>RACE CONTROL</span> & STEWARDS
                </h2>
                <span
                  style={{
                    background: activeFlagConf.bg,
                    border: `1px solid ${activeFlagConf.border}`,
                    color: activeFlagConf.color,
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.68rem",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  OFFICIAL FIA.COM DIRECTIVE
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                Track Status Management, Real-Time Stewards Investigations, Track Limits Strikes & Technical Directives.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Interactive Track Flag Status Selector ── */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(14, 16, 26, 0.95)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace", marginBottom: "8px" }}>
            SELECT LIVE TRACK STATUS (SIMULATE RACE INCIDENT):
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {Object.values(RACE_STATUS_FLAGS).map((flag) => {
              const isFlagActive = selectedStatus === flag.code;
              return (
                <button
                  key={flag.code}
                  onClick={() => handleSelectStatus(flag.code)}
                  style={{
                    background: isFlagActive ? flag.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isFlagActive ? flag.color : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "8px",
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: isFlagActive ? `0 0 16px ${flag.color}44` : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{flag.icon}</span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.74rem",
                      fontWeight: "800",
                      color: isFlagActive ? flag.color : "#ffffff",
                      textAlign: "center",
                    }}
                  >
                    {flag.label}
                  </span>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-dim)", textAlign: "center", marginTop: "2px" }}>
                    {flag.code === "GREEN" && "Full Racing"}
                    {flag.code === "YELLOW_S2" && "Local Yellow"}
                    {flag.code === "VSC" && "Delta +0.5s"}
                    {flag.code === "SC" && "Pack Bunched"}
                    {flag.code === "RED" && "Session Halt"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Status Context Banner */}
          <div
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "6px",
              background: activeFlagConf.bg,
              border: `1px solid ${activeFlagConf.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.1rem" }}>{activeFlagConf.icon}</span>
              <span style={{ fontSize: "0.82rem", color: "#ffffff", fontWeight: "600" }}>
                {activeFlagConf.description}
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                color: activeFlagConf.color,
                fontWeight: "700",
              }}
            >
              PIT DELTA: {selectedStatus === "SC" || selectedStatus === "VSC" ? "13.5s (SAVE 9.5s)" : "23.0s (NORMAL)"}
            </span>
          </div>
        </div>

        {/* ── Bulletin Filter Bar ── */}
        <div
          style={{
            padding: "10px 24px",
            background: "rgba(10, 12, 20, 0.8)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            gap: "8px",
          }}
        >
          {[
            { id: "ALL", label: "ALL NOTICES" },
            { id: "TRACK_LIMITS", label: "TRACK LIMITS" },
            { id: "INVESTIGATIONS", label: "STEWARD DECISIONS" },
            { id: "TECHNICAL", label: "TECHNICAL DIRECTIVES" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                background: activeFilter === tab.id ? "rgba(255,255,255,0.12)" : "transparent",
                border: `1px solid ${activeFilter === tab.id ? "rgba(255,255,255,0.3)" : "transparent"}`,
                color: activeFilter === tab.id ? "#ffffff" : "var(--text-secondary)",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                fontFamily: "'Orbitron', monospace",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Bulletins Feed ── */}
        <div
          style={{
            padding: "16px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {filteredBulletins.map((b) => {
            const badgeColor =
              b.severity === "penalty"
                ? "#ff3b30"
                : b.severity === "warning"
                ? "#ff9800"
                : b.severity === "alert"
                ? "#ffc107"
                : "var(--neon-cyan)";

            return (
              <div
                key={b.id}
                style={{
                  background: "rgba(18, 20, 32, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderLeft: `4px solid ${badgeColor}`,
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        color: badgeColor,
                        background: `${badgeColor}18`,
                        padding: "2px 6px",
                        borderRadius: "3px",
                      }}
                    >
                      {b.type.replace("_", " ")}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: "0.82rem",
                        fontWeight: "800",
                        color: "#ffffff",
                      }}
                    >
                      {b.title}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                    LAP {b.lap} · {b.time}
                  </span>
                </div>

                <div style={{ fontSize: "0.80rem", color: "#d0d4e0", lineHeight: 1.4 }}>
                  {b.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

