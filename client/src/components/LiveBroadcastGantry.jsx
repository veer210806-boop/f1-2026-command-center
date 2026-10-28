// ============================================================
// LiveBroadcastGantry.jsx — FIA Formula 1 Live Race Control & Audio Deck
// Interactive Simulation controls, Web Audio Team Radio Comms player,
// AWS Battle Predictor HUD, and Steward Incident Ticker.
// Supports both a sleek 38px Compact Streamline Bar and an
// Expanded Multi-Tier Cockpit Deck for zero visual clutter.
// ============================================================
import React, { useState, useEffect } from "react";
import { f1Audio } from "../utils/f1AudioEngine";

const AUTHENTIC_RADIO_QUOTES = [
  { code: "VER", num: 3,  team: "Red Bull", name: "Max Verstappen",  quote: "Mate, the car feels rapid on the straights, keep me updated on the gap!" },
  { code: "HAM", num: 44, team: "Ferrari",  name: "Lewis Hamilton",   quote: "Hammertime guys. Tyres are in the sweet spot, let's close this down!" },
  { code: "NOR", num: 1,  team: "McLaren",  name: "Lando Norris",     quote: "Box box, box box! Stay calm, we have the delta covered." },
  { code: "LEC", num: 16, team: "Ferrari",  name: "Charles Leclerc",  quote: "Understood, mode push. We can fight for this win!" },
  { code: "ALO", num: 14, team: "Aston",    name: "Fernando Alonso",  quote: "This 2026 active aero is flying! Maximum attack till the end!" },
  { code: "RUS", num: 63, team: "Mercedes", name: "George Russell",   quote: "Tyre temps are critical in sector 2, managing the balance nicely." },
  { code: "BOT", num: 77, team: "Cadillac", name: "Valtteri Bottas",  quote: "Cadillac power unit is strong today, fighting for points!" },
  { code: "PER", num: 11, team: "Cadillac", name: "Sergio Pérez",     quote: "Understood, preserving rear tyres for the final 10 laps." },
];

export default function LiveBroadcastGantry({
  currentLap = 1,
  maxLaps = 58,
  isAutoSimulating = false,
  onToggleSim,
  onRestartRace,
  onOpenResultsModal,
  simSpeed = 1,
  onChangeSimSpeed,
  onTriggerOvertake,
  onFlagChange,
  activeFlag = "GREEN",
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedRadio, setSelectedRadio] = useState(AUTHENTIC_RADIO_QUOTES[0]);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [incidentTicker, setIncidentTicker] = useState("FIA RACE CONTROL: TRACK ALL CLEAR · DRS ZONES ENABLED");

  useEffect(() => {
    f1Audio.setMuted(isAudioMuted);
  }, [isAudioMuted]);

  // Handle playing radio
  const handlePlayRadio = (driverObj) => {
    const target = driverObj || selectedRadio;
    setSelectedRadio(target);
    setIsPlayingRadio(true);
    f1Audio.speakRadioMessage(target.name, `${target.code}: ${target.quote}`);
    setTimeout(() => {
      setIsPlayingRadio(false);
    }, 4500);
  };

  const handleSimSpeedClick = (spd) => {
    if (onChangeSimSpeed) onChangeSimSpeed(spd);
  };

  const handleFlagClick = (flag) => {
    if (flag === "SC" || flag === "VSC") {
      f1Audio.playSafetyCarAlert();
      setIncidentTicker(flag === "SC" ? "SAFETY CAR DEPLOYED · SPEED REDUCTION MANDATORY · PIT LANE OPEN" : "VIRTUAL SAFETY CAR ACTIVE · MAINTAIN POSITIVE DELTA");
    } else if (flag === "RED") {
      f1Audio.playSafetyCarAlert();
      setIncidentTicker("RED FLAG · SESSION SUSPENDED · ALL CARS ENTER PIT LANE IMMEDIATELY");
    } else {
      setIncidentTicker("TRACK CLEAR · GREEN FLAG IN ALL SECTORS · DRS SYSTEM RE-ENABLED");
    }
    if (onFlagChange) onFlagChange(flag);
  };

  const handleTriggerBattleOvertake = () => {
    f1Audio.playOvertakeChime();
    setIncidentTicker(`LEAD OVERTAKE: CAR #3 (VER) PASSED CAR #1 (NOR) INTO TURN 1!`);
    if (onTriggerOvertake) onTriggerOvertake();
  };

  const lapPct = Math.round((currentLap / maxLaps) * 100);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(16, 20, 32, 0.95) 0%, rgba(10, 13, 20, 0.95) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderLeft: "3px solid var(--neon-cyan)",
        borderRadius: "10px",
        padding: isExpanded ? "12px 16px" : "7px 14px",
        margin: "0 24px 12px 24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 240, 255, 0.08)",
        backdropFilter: "blur(14px)",
        transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* ── Compact Streamline Bar (Always Visible) ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        
        {/* Left: Lap Progress + Simulation Quick Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Micro Lap Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "4px 9px",
              borderRadius: "6px",
            }}
          >
            <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", fontWeight: "900", color: "#ffffff" }}>
              LAP {currentLap}/{maxLaps}
            </span>
            <span style={{ fontSize: "0.65rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", fontWeight: "700" }}>
              {lapPct}%
            </span>
          </div>

          {/* Auto-Race Play / Stop Button or Race Completed Results Button */}
          {currentLap >= maxLaps ? (
            <button
              onClick={onOpenResultsModal || onToggleSim}
              style={{
                background: "linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)",
                color: "#07080b",
                border: "none",
                padding: "5px 12px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                fontWeight: "900",
                letterSpacing: "0.06em",
                cursor: "pointer",
                boxShadow: "0 0 14px rgba(255, 215, 0, 0.6)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s ease",
              }}
              title="Race finished! Click to view Official Final Results & Podium"
            >
              <span>🏆 FINAL RESULTS</span>
            </button>
          ) : (
            <button
              onClick={onToggleSim}
              style={{
                background: isAutoSimulating
                  ? "linear-gradient(135deg, #ff1744 0%, #b3001e 100%)"
                  : "linear-gradient(135deg, #00e676 0%, #00a854 100%)",
                color: isAutoSimulating ? "#ffffff" : "#07080b",
                border: "none",
                padding: "5px 12px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.70rem",
                fontWeight: "900",
                letterSpacing: "0.06em",
                cursor: "pointer",
                boxShadow: isAutoSimulating ? "0 0 12px rgba(255, 23, 68, 0.5)" : "0 0 10px rgba(0, 230, 118, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s ease",
              }}
            >
              <span>{isAutoSimulating ? "⏹ STOP SIM" : "▶ LIVE SIM"}</span>
            </button>
          )}

          {/* Instant Overtake Trigger Button */}
          <button
            onClick={handleTriggerBattleOvertake}
            style={{
              background: "rgba(0, 240, 255, 0.12)",
              border: "1px solid var(--neon-cyan)",
              color: "var(--neon-cyan)",
              padding: "4px 10px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.68rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 0 8px rgba(0, 240, 255, 0.2)",
              transition: "all 0.15s ease",
            }}
            title="Trigger dynamic lead overtake and audio telemetry fanfare"
          >
            <span>⚔️ OVERTAKE</span>
          </button>

          {/* Quick Direct Restart Race to Lap 1 Button */}
          {onRestartRace && (
            <button
              onClick={onRestartRace}
              style={{
                background: "rgba(255, 215, 0, 0.12)",
                border: "1px solid #ffd700",
                color: "#ffd700",
                padding: "4px 10px",
                borderRadius: "5px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.68rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 0 8px rgba(255, 215, 0, 0.25)",
                transition: "all 0.15s ease",
              }}
              title="Restart simulation back to Lap 1 with fresh tires, grid and team strategy"
            >
              <span>🔄 RESTART LAP 1</span>
            </button>
          )}

          {/* Current Flag Capsule */}
          <div
            style={{
              background: activeFlag === "CHEQUERED" ? "rgba(255, 215, 0, 0.22)" : activeFlag === "GREEN" ? "rgba(0, 230, 118, 0.14)" : activeFlag === "RED" ? "rgba(255, 23, 68, 0.16)" : "rgba(255, 183, 0, 0.16)",
              border: `1px solid ${activeFlag === "CHEQUERED" ? "#ffd700" : activeFlag === "GREEN" ? "var(--neon-green)" : activeFlag === "RED" ? "var(--neon-red)" : "var(--neon-amber)"}`,
              color: activeFlag === "CHEQUERED" ? "#ffd700" : activeFlag === "GREEN" ? "var(--neon-green)" : activeFlag === "RED" ? "var(--neon-red)" : "var(--neon-amber)",
              borderRadius: "5px",
              padding: "3px 8px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.65rem",
              fontWeight: "900",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>{activeFlag === "CHEQUERED" ? "🏁 CHEQUERED FLAG" : activeFlag === "GREEN" ? "🟢 TRACK CLEAR" : activeFlag === "SC" ? "🟡 SAFETY CAR" : activeFlag === "VSC" ? "🟡 VSC" : "🔴 RED FLAG"}</span>
          </div>
        </div>

        {/* Center: Live Radio Transcript Ticker (Clean) */}
        <div style={{ flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          <button
            onClick={() => handlePlayRadio()}
            style={{
              all: "unset",
              cursor: "pointer",
              background: "rgba(255,255,255,0.06)",
              padding: "3px 8px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              border: "1px solid rgba(255,255,255,0.12)",
              flexShrink: 0,
            }}
            title="Listen to driver radio transmission"
          >
            <span style={{ fontSize: "0.68rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800" }}>
              📻 #{selectedRadio.num} {selectedRadio.code}
            </span>
          </button>
          
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: "0.74rem", fontFamily: "'Exo 2', sans-serif", color: isPlayingRadio ? "var(--neon-green)" : "var(--text-secondary)", fontStyle: "italic" }}>
              "{selectedRadio.quote}"
            </span>
          </div>
        </div>

        {/* Right: Audio FX Toggle + Expand/Collapse Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            style={{
              background: isAudioMuted ? "rgba(255,23,68,0.12)" : "rgba(0, 240, 255, 0.12)",
              border: isAudioMuted ? "1px solid var(--neon-red)" : "1px solid var(--neon-cyan)",
              color: isAudioMuted ? "var(--neon-red)" : "var(--neon-cyan)",
              padding: "4px 8px",
              borderRadius: "4px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.65rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Toggle Web Audio engine sound effects"
          >
            <span>{isAudioMuted ? "🔇 MUTED" : "🔊 AUDIO FX"}</span>
          </button>

          {/* Expand/Collapse Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: isExpanded ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#ffffff",
              padding: "4px 9px",
              borderRadius: "4px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.65rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s ease",
            }}
          >
            <span>{isExpanded ? "▲ LESS" : "▼ CONTROLS"}</span>
          </button>
        </div>
      </div>

      {/* ── Expanded Drawer: Full Simulation, Flag & Radio Station Controls ── */}
      {isExpanded && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px" }}>
          
          {/* Top Row: Speed Selectors + All Race Flags */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            {/* Speed Selectors */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)" }}>
                SPEED:
              </span>
              <div style={{ display: "flex", gap: "3px", background: "rgba(0,0,0,0.3)", padding: "2px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)" }}>
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSimSpeedClick(spd)}
                    style={{
                      background: simSpeed === spd ? "rgba(0, 240, 255, 0.25)" : "transparent",
                      color: simSpeed === spd ? "var(--neon-cyan)" : "var(--text-secondary)",
                      border: simSpeed === spd ? "1px solid var(--neon-cyan)" : "none",
                      borderRadius: "3px",
                      padding: "2px 7px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "0.64rem",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* FIA Flag Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginRight: "2px" }}>
                FLAGS:
              </span>
              {[
                { id: "GREEN", label: "🟢 GREEN", color: "var(--neon-green)", bg: "rgba(0, 230, 118, 0.15)" },
                { id: "VSC", label: "🟡 VSC", color: "var(--neon-amber)", bg: "rgba(255, 183, 0, 0.15)" },
                { id: "SC", label: "🟡 SC", color: "var(--neon-amber)", bg: "rgba(255, 183, 0, 0.15)" },
                { id: "RED", label: "🔴 RED", color: "var(--neon-red)", bg: "rgba(255, 23, 68, 0.15)" },
              ].map((fl) => (
                <button
                  key={fl.id}
                  onClick={() => handleFlagClick(fl.id)}
                  style={{
                    background: activeFlag === fl.id ? fl.bg : "rgba(255,255,255,0.03)",
                    color: activeFlag === fl.id ? fl.color : "var(--text-secondary)",
                    border: activeFlag === fl.id ? `1px solid ${fl.color}` : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    padding: "2px 7px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: activeFlag === fl.id ? `0 0 8px ${fl.color}44` : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Middle Row: Driver Radio Selector Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800", flexShrink: 0 }}>
              SELECT RADIO:
            </span>
            {AUTHENTIC_RADIO_QUOTES.map((d) => {
              const isSel = selectedRadio.code === d.code;
              return (
                <button
                  key={d.code}
                  onClick={() => {
                    setSelectedRadio(d);
                    handlePlayRadio(d);
                  }}
                  style={{
                    background: isSel ? "rgba(0, 240, 255, 0.22)" : "rgba(255,255,255,0.04)",
                    color: isSel ? "#ffffff" : "var(--text-secondary)",
                    border: isSel ? "1px solid var(--neon-cyan)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    padding: "2px 7px",
                    fontFamily: "'Orbitron', monospace",
                    fontSize: "0.64rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{d.num} {d.code}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Official FIA Bulletin Ticker */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              borderRadius: "4px",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderLeft: "3px solid var(--neon-amber)",
              fontSize: "0.68rem",
              fontFamily: "'Orbitron', monospace",
              color: "var(--neon-amber)",
              overflow: "hidden",
            }}
          >
            <span style={{ fontWeight: "900", color: "#ffffff", background: "rgba(255,183,0,0.2)", padding: "1px 5px", borderRadius: "2px" }}>
              FIA BULLETIN
            </span>
            <span style={{ color: "#e2e8f0", letterSpacing: "0.04em" }}>
              {incidentTicker}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
