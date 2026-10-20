// ============================================================
// LiveBroadcastGantry.jsx — FIA Formula 1 Live Race Control & Audio Deck
// Interactive Simulation controls, Web Audio Team Radio Comms player,
// AWS Battle Predictor HUD, and Steward Incident Ticker.
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
  currentLap = 34,
  maxLaps = 58,
  isAutoSimulating = false,
  onToggleSim,
  simSpeed = 1,
  onChangeSimSpeed,
  onTriggerOvertake,
  onFlagChange,
  activeFlag = "GREEN",
}) {
  const [selectedRadio, setSelectedRadio] = useState(AUTHENTIC_RADIO_QUOTES[0]);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeBattleProb, setActiveBattleProb] = useState(84);
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

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(16, 20, 32, 0.98) 0%, rgba(10, 13, 20, 0.98) 100%)",
        border: "1px solid rgba(0, 240, 255, 0.28)",
        borderRadius: "10px",
        padding: "10px 16px",
        margin: "0 24px 14px 24px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.12)",
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* ── Top Row: Simulation Engine Bar, Flag Switcher & Sound Toggle ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        
        {/* Left: Simulation Engine Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={onToggleSim}
            style={{
              background: isAutoSimulating
                ? "linear-gradient(135deg, #ff1744 0%, #b3001e 100%)"
                : "linear-gradient(135deg, #00e676 0%, #00a854 100%)",
              color: isAutoSimulating ? "#ffffff" : "#07080b",
              border: "none",
              padding: "6px 14px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.74rem",
              fontWeight: "900",
              letterSpacing: "0.06em",
              cursor: "pointer",
              boxShadow: isAutoSimulating ? "0 0 14px rgba(255, 23, 68, 0.6)" : "0 0 14px rgba(0, 230, 118, 0.5)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <span>{isAutoSimulating ? "⏹ STOP RACE SIM" : "▶ START AUTO-RACE"}</span>
            <span style={{ fontSize: "0.64rem", opacity: 0.85 }}>({currentLap}/{maxLaps})</span>
          </button>

          {/* Speed Selectors */}
          <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "5px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSimSpeedClick(spd)}
                style={{
                  background: simSpeed === spd ? "rgba(0, 240, 255, 0.25)" : "transparent",
                  color: simSpeed === spd ? "var(--neon-cyan)" : "var(--text-secondary)",
                  border: simSpeed === spd ? "1px solid var(--neon-cyan)" : "none",
                  borderRadius: "3px",
                  padding: "3px 8px",
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

          {/* Instant Overtake Trigger Button */}
          <button
            onClick={handleTriggerBattleOvertake}
            style={{
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.05) 100%)",
              border: "1px solid var(--neon-cyan)",
              color: "var(--neon-cyan)",
              padding: "5px 12px",
              borderRadius: "5px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.70rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 0 10px rgba(0, 240, 255, 0.2)",
            }}
          >
            <span>⚔️ TRIGGER OVERTAKE</span>
          </button>
        </div>

        {/* Center: FIA Race Flag Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--text-dim)", marginRight: "2px" }}>
            FLAG:
          </span>
          {[
            { id: "GREEN", label: "🟢 CLEAR", color: "var(--neon-green)", bg: "rgba(0, 230, 118, 0.15)" },
            { id: "VSC", label: "🟡 VSC", color: "var(--neon-amber)", bg: "rgba(255, 183, 0, 0.15)" },
            { id: "SC", label: "🟡 SAFETY CAR", color: "var(--neon-amber)", bg: "rgba(255, 183, 0, 0.15)" },
            { id: "RED", label: "🔴 RED FLAG", color: "var(--neon-red)", bg: "rgba(255, 23, 68, 0.15)" },
          ].map((fl) => (
            <button
              key={fl.id}
              onClick={() => handleFlagClick(fl.id)}
              style={{
                background: activeFlag === fl.id ? fl.bg : "rgba(255,255,255,0.03)",
                color: activeFlag === fl.id ? fl.color : "var(--text-secondary)",
                border: activeFlag === fl.id ? `1px solid ${fl.color}` : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                padding: "3px 8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.64rem",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: activeFlag === fl.id ? `0 0 10px ${fl.color}55` : "none",
                transition: "all 0.15s ease",
              }}
            >
              {fl.label}
            </button>
          ))}
        </div>

        {/* Right: Audio Synthesizer Mute Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            style={{
              background: isAudioMuted ? "rgba(255,23,68,0.12)" : "rgba(0, 240, 255, 0.12)",
              border: isAudioMuted ? "1px solid var(--neon-red)" : "1px solid var(--neon-cyan)",
              color: isAudioMuted ? "var(--neon-red)" : "var(--neon-cyan)",
              padding: "4px 10px",
              borderRadius: "4px",
              fontFamily: "'Orbitron', monospace",
              fontSize: "0.68rem",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>{isAudioMuted ? "🔇 SOUND MUTED" : "🔊 F1 AUDIO FX ON"}</span>
          </button>
        </div>
      </div>

      {/* ── Middle Row: Live Team Radio Comms Deck ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0, 0, 0, 0.4)",
          borderRadius: "8px",
          padding: "6px 12px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Driver Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto" }}>
          <span style={{ fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-cyan)", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            📻 TEAM RADIO:
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
                  borderRadius: "3px",
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

        {/* Center: Radio Transcript & Waveform Animation */}
        <div style={{ flex: 1, minWidth: "240px", display: "flex", alignItems: "center", gap: "10px" }}>
          {isPlayingRadio && (
            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
              <span style={{ width: "3px", height: "14px", background: "var(--neon-green)", animation: "pulseBeacon 0.4s infinite alternate" }} />
              <span style={{ width: "3px", height: "8px", background: "var(--neon-green)", animation: "pulseBeacon 0.6s infinite alternate" }} />
              <span style={{ width: "3px", height: "16px", background: "var(--neon-green)", animation: "pulseBeacon 0.3s infinite alternate" }} />
              <span style={{ width: "3px", height: "10px", background: "var(--neon-green)", animation: "pulseBeacon 0.5s infinite alternate" }} />
            </div>
          )}
          <span style={{ fontSize: "0.75rem", fontFamily: "'Exo 2', sans-serif", color: isPlayingRadio ? "var(--neon-green)" : "#e2e8f0", fontStyle: "italic" }}>
            "{selectedRadio.quote}"
          </span>
        </div>

        {/* Right: Broadcast Radio Action Button */}
        <button
          onClick={() => handlePlayRadio()}
          style={{
            background: "linear-gradient(135deg, rgba(232, 0, 45, 0.2) 0%, rgba(232, 0, 45, 0.05) 100%)",
            border: "1px solid var(--neon-red)",
            color: "#ffffff",
            padding: "4px 12px",
            borderRadius: "4px",
            fontFamily: "'Orbitron', monospace",
            fontSize: "0.66rem",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(232,0,45,0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>🎙️ LISTEN RADIO</span>
        </button>
      </div>

      {/* ── Bottom Row: Scrolling FIA Steward Ticker Bar ── */}
      <div
        style={{
          marginTop: "8px",
          background: "rgba(0,0,0,0.6)",
          borderRadius: "4px",
          padding: "3px 10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderLeft: "3px solid var(--neon-amber)",
          fontSize: "0.70rem",
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
  );
}
