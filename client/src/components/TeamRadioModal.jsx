// ============================================================
// TeamRadioModal.jsx — BoxBox & FormulaDream Team Radio Interceptor
// Ultra-Modern F1 Cockpit Transcript Console (Audio-Free / High Readability)
// Sourced from boxbox-radio.com & formuladream.app
// ============================================================
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  TEAM_RADIO_ARCHIVE,
  RADIO_CATEGORIES,
  filterRadioArchive
} from "../data/teamRadioArchive";
import { getDriverFaceUrl } from "../data/f1MediaAssets2026";

export default function TeamRadioModal({ isOpen, onClose, initialDriver = "ALL" }) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDriver, setSelectedDriver] = useState(initialDriver);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRadio, setActiveRadio] = useState(null);

  // Sync initialDriver when opened
  useEffect(() => {
    if (initialDriver) {
      setSelectedDriver(initialDriver);
    }
  }, [initialDriver]);

  // Set default active transmission if none selected
  useEffect(() => {
    if (!activeRadio && TEAM_RADIO_ARCHIVE.length > 0) {
      setActiveRadio(TEAM_RADIO_ARCHIVE[0]);
    }
  }, [activeRadio]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredRadios = filterRadioArchive({
    category: selectedCategory,
    driver: selectedDriver,
    query: searchQuery,
  });

  const DRIVER_FILTERS = [
    "ALL",
    ...Array.from(new Set(TEAM_RADIO_ARCHIVE.map(r => r.driver_code))).filter(Boolean)
  ];

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
        background: "rgba(5, 7, 14, 0.90)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
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
          maxWidth: "1280px",
          maxHeight: "92vh",
          background: "linear-gradient(180deg, #111424 0%, #090b14 100%)",
          border: "1px solid rgba(0, 210, 190, 0.35)",
          borderRadius: "14px",
          boxShadow: "0 16px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 210, 190, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Laser Border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-red), var(--neon-cyan), transparent)",
          }}
        />

        {/* ── Modal Header ── */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "rgba(0, 210, 190, 0.15)",
                border: "1px solid rgba(0, 210, 190, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                boxShadow: "0 0 12px rgba(0,210,190,0.25)",
              }}
            >
              📻
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
                  BOX BOX <span style={{ color: "var(--neon-cyan)" }}>TEAM RADIO</span> INTERCEPTOR
                </h2>
                <span
                  style={{
                    background: "rgba(0, 210, 190, 0.15)",
                    border: "1px solid rgba(0, 210, 190, 0.4)",
                    color: "var(--neon-cyan)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.66rem",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  BOXBOX & FORMULA DREAM LIVE ARCHIVE
                </span>
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                Authentic Formula 1 pit-to-car radio transcripts, tactical strategy calls, and race engineering dialogue.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Status Beacon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(0, 210, 190, 0.12)",
                border: "1px solid rgba(0, 210, 190, 0.35)",
                padding: "5px 12px",
                borderRadius: "20px",
                color: "var(--neon-cyan)",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--neon-cyan)",
                  boxShadow: "0 0 8px var(--neon-cyan)",
                }}
              />
              INTERCEPT ACTIVE · 100% SIGNAL
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#ffffff",
                fontSize: "1.1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--neon-red)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Active Broadcast Hero Deck ── */}
        {activeRadio && (
          <div
            style={{
              padding: "16px 24px",
              background: "linear-gradient(90deg, rgba(0, 210, 190, 0.09) 0%, rgba(16, 19, 34, 0.96) 50%, rgba(232, 0, 45, 0.08) 100%)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* Left: Driver Avatar & Speaker Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  position: "relative",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  border: `2px solid ${activeRadio.team_color || "var(--neon-cyan)"}`,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.5)",
                  boxShadow: `0 0 14px ${activeRadio.team_color || "rgba(0,210,190,0.5)"}44`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                <span style={{ position: "absolute" }}>🏎️</span>
                <img
                  src={getDriverFaceUrl(activeRadio.driver_code)}
                  alt={activeRadio.driver_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.75rem",
                      fontWeight: "900",
                      color: activeRadio.speaker === "PIT" ? "var(--neon-red)" : "var(--neon-cyan)",
                      background: activeRadio.speaker === "PIT" ? "rgba(232,0,45,0.15)" : "rgba(0,210,190,0.15)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: `1px solid ${activeRadio.speaker === "PIT" ? "rgba(232,0,45,0.4)" : "rgba(0,210,190,0.4)"}`,
                    }}
                  >
                    {activeRadio.speaker === "PIT" ? `PIT WALL · ${activeRadio.engineer_name || "Engineer"}` : `DRIVER · ${activeRadio.driver_name}`}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.70rem",
                      color: "var(--text-secondary)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {activeRadio.grand_prix} · LAP {activeRadio.lap}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.68rem",
                      color: "var(--neon-yellow)",
                      background: "rgba(255,221,0,0.12)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {activeRadio.category}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.94rem",
                    color: "#ffffff",
                    fontStyle: "italic",
                    marginTop: "5px",
                    maxWidth: "700px",
                    lineHeight: 1.45,
                    fontWeight: "500",
                  }}
                >
                  "{activeRadio.message}"
                </div>
                {activeRadio.driver_reply && (
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--neon-cyan)",
                      marginTop: "4px",
                      background: "rgba(0,0,0,0.3)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      borderLeft: "2px solid var(--neon-cyan)",
                    }}
                  >
                    <strong>REPLY: </strong>"{activeRadio.driver_reply}"
                  </div>
                )}
              </div>
            </div>

            {/* Right: Telemetry Tag Capsule */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "'Orbitron', monospace" }}>
                  CAR #{activeRadio.number || "01"}
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                <span style={{ fontSize: "0.72rem", color: "var(--neon-green)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
                  {activeRadio.team}
                </span>
              </div>
              <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                SESSION TIME: {activeRadio.timestamp || "L34 · 15:47"}
              </span>
            </div>
          </div>
        )}

        {/* ── Filters & Search Bar ── */}
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(10, 12, 20, 0.95)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Row 1: Search & Category Filter */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Search radio transmissions, driver quotes, circuits, engineers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: "1 1 320px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                padding: "8px 14px",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontFamily: "'Rajdhani', sans-serif",
                outline: "none",
                letterSpacing: "0.03em",
              }}
            />

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {RADIO_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: selectedCategory === cat ? "var(--neon-cyan)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedCategory === cat ? "var(--neon-cyan)" : "rgba(255,255,255,0.1)"}`,
                    color: selectedCategory === cat ? "#000000" : "var(--text-secondary)",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.68rem",
                    fontWeight: selectedCategory === cat ? "900" : "600",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Driver Filter Bar */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center", overflowX: "auto", paddingBottom: "2px" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", whiteSpace: "nowrap", marginRight: "4px" }}>
              FILTER DRIVER:
            </span>
            {DRIVER_FILTERS.map((drv) => (
              <button
                key={drv}
                onClick={() => setSelectedDriver(drv)}
                style={{
                  background: selectedDriver === drv ? "var(--neon-red)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedDriver === drv ? "var(--neon-red)" : "rgba(255,255,255,0.08)"}`,
                  color: selectedDriver === drv ? "#ffffff" : "var(--text-secondary)",
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "0.68rem",
                  fontWeight: selectedDriver === drv ? "800" : "500",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.12s ease",
                }}
              >
                {drv}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transmissions List Grid ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "14px",
            background: "rgba(8, 10, 16, 0.6)",
          }}
        >
          {filteredRadios.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-dim)",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.9rem",
              }}
            >
              NO RADIO TRANSMISSIONS MATCHING THE FILTER CRITERIA
            </div>
          ) : (
            filteredRadios.map((r) => {
              const isSelected = activeRadio?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setActiveRadio(r)}
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(0, 210, 190, 0.12) 0%, rgba(18, 22, 38, 0.95) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(14, 16, 26, 0.9) 100%)",
                    border: isSelected
                      ? "1px solid var(--neon-cyan)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderLeft: `4px solid ${r.team_color || "var(--neon-cyan)"}`,
                    borderRadius: "8px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: isSelected
                      ? "0 4px 20px rgba(0, 210, 190, 0.25)"
                      : "0 2px 8px rgba(0,0,0,0.3)",
                    transition: "all 0.18s ease",
                  }}
                >
                  {/* Top Row: Driver Avatar & Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          position: "relative",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          border: `1.5px solid ${r.team_color || "var(--neon-cyan)"}`,
                          overflow: "hidden",
                          background: "rgba(0,0,0,0.4)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                        }}
                      >
                        <span style={{ position: "absolute" }}>🏎️</span>
                        <img
                          src={getDriverFaceUrl(r.driver_code)}
                          alt={r.driver_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: "0.82rem",
                              fontWeight: "800",
                              color: "#ffffff",
                            }}
                          >
                            {r.driver_name} ({r.driver_code})
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: "var(--text-dim)",
                              fontFamily: "'Orbitron', monospace",
                            }}
                          >
                            {r.team}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              color: r.speaker === "PIT" ? "var(--neon-red)" : "var(--neon-cyan)",
                              fontFamily: "'Orbitron', monospace",
                              fontWeight: "700",
                            }}
                          >
                            {r.speaker === "PIT" ? `🎙️ PIT (${r.engineer_name || "Engineer"})` : "🏎️ DRIVER"}
                          </span>
                          <span style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>·</span>
                          <span
                            style={{
                              fontSize: "0.64rem",
                              color: "var(--text-secondary)",
                              fontFamily: "'Orbitron', monospace",
                            }}
                          >
                            {r.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: "0.68rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        LAP {r.lap} · {r.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Radio Transcript Message */}
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#f1f3f9",
                      lineHeight: 1.4,
                      fontStyle: "italic",
                      padding: "4px 0",
                    }}
                  >
                    "{r.message}"
                  </div>

                  {/* Driver Reply (if any) */}
                  {r.driver_reply && (
                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--neon-cyan)",
                        background: "rgba(0,0,0,0.3)",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        borderLeft: "2px solid var(--neon-cyan)",
                        lineHeight: 1.35,
                      }}
                    >
                      <strong>REPLY: </strong>"{r.driver_reply}"
                    </div>
                  )}

                  {/* Bottom Action Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "0.66rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>
                      📍 {r.grand_prix} ({r.season})
                    </span>

                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontFamily: "'Orbitron', monospace",
                        fontWeight: "700",
                        color: isSelected ? "var(--neon-cyan)" : "var(--text-secondary)",
                        background: isSelected ? "rgba(0,210,190,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSelected ? "rgba(0,210,190,0.4)" : "rgba(255,255,255,0.08)"}`,
                        padding: "2px 8px",
                        borderRadius: "3px",
                      }}
                    >
                      {isSelected ? "● SELECTED" : "INSPECT"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
