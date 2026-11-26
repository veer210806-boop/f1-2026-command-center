// ============================================================
// TimingLowerTacticalDeck.jsx — Lower 3-Card Tactical Pit-Wall Deck
// Renders Stint Strategy Windows + Grip Curve, Pace Delta Comparison,
// and Team Radio Transceiver independently from the timing table.
// ============================================================
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getDriverRadio } from "../data/teamRadioArchive";
import {
  TIRE_CONFIG,
  TEAM_RACE_ENGINEERS,
  buildLiveTireCurve,
  buildPaceComparisonSeries,
  buildStrategyPlanSummary,
} from "../utils/raceSimEngine";

function TireBadgePill({ compound = "M", label = "" }) {
  const code = (compound || "M").toString().trim().toUpperCase()[0];
  const conf = TIRE_CONFIG[code] || TIRE_CONFIG.M;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${conf.color}55`,
        padding: "2px 7px",
        borderRadius: "14px",
        fontSize: "0.68rem",
        fontFamily: "'Orbitron', monospace",
        color: "#ffffff",
        fontWeight: "700",
        letterSpacing: "0.02em",
        boxShadow: `0 0 6px ${conf.color}22`,
      }}
    >
      <span
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#0e0f17",
          border: `1.8px solid ${conf.color}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.58rem",
          fontWeight: "900",
          color: conf.color,
          boxShadow: `0 0 5px ${conf.color}88`,
          flexShrink: 0,
        }}
      >
        {conf.letter}
      </span>
      <span>{label || conf.name}</span>
    </span>
  );
}

export default function TimingLowerTacticalDeck({
  drivers = [],
  currentDriver,
  currentLap = 1,
  effectiveLap = 1,
  maxLaps = 58,
  pitLossGreen = 23.0,
  radioMsg = "",
  onSendRadio,
  onOpenRadioModal,
}) {
  const [radioFeedIdx, setRadioFeedIdx] = useState(0);
  const [customRadioInput, setCustomRadioInput] = useState("");

  const planSummary = useMemo(() => {
    return buildStrategyPlanSummary({ maxLaps, currentDriver });
  }, [maxLaps, currentDriver]);

  const tireWearData = useMemo(() => {
    return buildLiveTireCurve(currentDriver, effectiveLap, maxLaps);
  }, [currentDriver, effectiveLap, maxLaps]);

  const deltaComparisonData = useMemo(() => {
    return buildPaceComparisonSeries(drivers, currentDriver, effectiveLap);
  }, [drivers, currentDriver, effectiveLap]);

  if (!currentDriver) return null;

  const p1Car = drivers[0] || { code: "VER", num: 3 };
  const p2Car = drivers[1] || { code: "NOR", num: 1 };
  const isSelectedP1 = currentDriver.code === p1Car.code;
  const deltaText = String(currentDriver.gap && currentDriver.gap !== "LEADER" ? currentDriver.gap : (currentDriver.interval || "—"));
  const cdTireConf = TIRE_CONFIG[(currentDriver.tire || "M").toString().trim().toUpperCase()[0]] || TIRE_CONFIG.M;

  const focusedCode = currentDriver.code || "NOR";
  const teamEngineer = TEAM_RACE_ENGINEERS[currentDriver.team] || "Race Engineer";
  const currentRadios = getDriverRadio(focusedCode);
  const activeRadio = currentRadios[radioFeedIdx % currentRadios.length] || {
    speaker: "PIT",
    engineer_name: teamEngineer,
    message: radioMsg,
    category: "Tactical Comms",
    lap: currentLap,
    time: "15:40",
  };

  return (
    <div className="timing-lower-deck">
      {/* ──── CARD 1: TACTICAL TYRE STRATEGY & PIT WINDOW FORECASTER ──── */}
      <div
        style={{
          background: "rgba(16, 18, 28, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.78rem", color: "#ffffff", fontWeight: "800", letterSpacing: "0.08em" }}>
              TACTICAL TYRE STRATEGY & PIT WINDOW
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              FOCUS: #{currentDriver.num} {currentDriver.name} ({currentDriver.team})
            </div>
          </div>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.68rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", border: "1px solid rgba(0,204,68,0.35)", padding: "3px 8px", borderRadius: "4px", fontWeight: "700" }}>
            WINDOW OPEN: L{planSummary.planAStopLap}
          </span>
        </div>

        {/* Strategy Plans: Plan A & Plan B */}
        <div className="timing-plan-grid">
          <div style={{ background: "rgba(0, 210, 190, 0.08)", border: "1px solid rgba(0, 210, 190, 0.3)", padding: "9px 10px", borderRadius: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--neon-cyan)", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                PLAN A (OPTIMAL 1-STOP)
              </span>
              <span style={{ fontSize: "0.60rem", color: "var(--neon-green)", background: "rgba(0,204,68,0.2)", padding: "1px 5px", borderRadius: "2px", fontWeight: "700" }}>
                RECOMMENDED
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", flexWrap: "wrap" }}>
              <TireBadgePill compound="M" label={planSummary.planALabel1} />
              <span style={{ color: "var(--neon-cyan)", fontSize: "0.70rem" }}>➔</span>
              <TireBadgePill compound="H" label={planSummary.planALabel2} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
              <span>Pit Loss: ~{pitLossGreen}s</span>
              <span style={{ color: "var(--neon-cyan)", fontWeight: "700" }}>Target In-Lap: L{planSummary.planAStopLap}</span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "9px 10px", borderRadius: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: "#e0e0e0", fontWeight: "800", fontFamily: "'Orbitron', monospace" }}>
                PLAN B (2-STOP ATTACK)
              </span>
              <span style={{ fontSize: "0.60rem", color: "#ffaa00", background: "rgba(255,170,0,0.15)", padding: "1px 5px", borderRadius: "2px", fontWeight: "700" }}>
                AGGRESSIVE
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
              <TireBadgePill compound="S" label={planSummary.planBLabel1} />
              <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
              <TireBadgePill compound="M" label={planSummary.planBLabel2} />
              <span style={{ color: "#ffaa00", fontSize: "0.66rem" }}>➔</span>
              <TireBadgePill compound="S" label={planSummary.planBLabel3} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "5px" }}>
              <span>Pit Loss: ~{(pitLossGreen * 1.9).toFixed(1)}s</span>
              <span style={{ color: "#ffaa00", fontWeight: "700" }}>Req. +1.4s Delta</span>
            </div>
          </div>
        </div>

        {/* Tyre Degradation Curve Recharts Graph */}
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>PROJECTED STINT GRIP CURVE</span>
            <span style={{ color: (currentDriver.wear || 0) > 65 ? "var(--neon-red)" : "var(--neon-cyan)", fontFamily: "'Orbitron', monospace", fontWeight: "700" }}>
              Grip: {Math.max(0, 100 - (currentDriver.wear || 0))}% {(currentDriver.wear || 0) > 65 ? "(CLIFF)" : "(OPTIMAL)"}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={85}>
            <AreaChart data={tireWearData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="wearGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d2be" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00d2be" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="lap" stroke="#666" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 100]} stroke="#666" tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ background: "#0c0e18", border: "1px solid var(--neon-cyan)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 12px rgba(0,0,0,0.8)" }}>
                        <div style={{ color: "var(--neon-cyan)" }}>{label}</div>
                        <div>Est. Grip: <strong style={{ color: "#ffffff" }}>{payload[0].value}%</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={28} stroke="#ff3b30" strokeDasharray="3 3" label={{ value: "CLIFF", fill: "#ff3b30", fontSize: 8, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="wear" stroke="#00d2be" strokeWidth={2.2} fillOpacity={1} fill="url(#wearGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stint Telemetry Metrics Grid */}
        <div className="timing-stint-metrics-grid">
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>TYRE COMPOUND</div>
            <div style={{ fontSize: "0.85rem", color: cdTireConf.color, fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px", textShadow: `0 0 8px ${cdTireConf.glow}` }}>
              {cdTireConf.name.toUpperCase()} ({cdTireConf.letter})
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>STINT AGE</div>
            <div style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
              {currentDriver.tireAge} LAPS
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>EST REMAINING</div>
            <div style={{ fontSize: "0.85rem", color: planSummary.estRemainingLaps <= 4 ? "var(--neon-red)" : planSummary.estRemainingLaps <= 10 ? "#ffaa00" : "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
              {planSummary.estRemainingLaps} LAPS
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", padding: "6px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>THERMAL GRIP</div>
            <div style={{ fontSize: "0.85rem", color: currentDriver.wear > 60 ? "var(--neon-red)" : "var(--neon-cyan)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "2px" }}>
              {Math.max(68, Math.round(100 - (currentDriver.wear * 0.45)))}% {currentDriver.wear > 55 ? "(WARM)" : "(OPTIMAL)"}
            </div>
          </div>
        </div>
      </div>

      {/* ──── CARD 2: HEAD-TO-HEAD PACE DELTA ──── */}
      <div
        style={{
          background: "rgba(16, 18, 28, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
            {isSelectedP1 ? `PACE DELTA: ${p1Car.code} (P1) vs ${p2Car.code} (P2)` : `PACE DELTA: ${currentDriver.code} vs P1 (${p1Car.code})`}
          </span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", color: isSelectedP1 ? "var(--neon-green)" : deltaText.startsWith("-") ? "var(--neon-green)" : "var(--neon-cyan)", fontWeight: "700" }}>
            {isSelectedP1 ? `LEAD (${p2Car.interval || "—"} AHEAD)` : `Δ ${deltaText}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", fontSize: "0.64rem", fontFamily: "'Orbitron', monospace", flexWrap: "wrap" }}>
          <span style={{ color: "#ff8700" }}>— P1 LEADER ({p1Car.code})</span>
          <span style={{ color: "var(--neon-cyan)" }}>
            — {isSelectedP1 ? `${p2Car.code} (#${p2Car.num} P2)` : `${currentDriver.code} (#${currentDriver.num})`}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={deltaComparisonData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="lap" stroke="#555" tick={{ fontSize: 9 }} />
            <YAxis domain={["auto", "auto"]} stroke="#555" tick={{ fontSize: 9 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ background: "#0c0d16", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 9px", borderRadius: "5px", fontSize: "0.66rem", fontFamily: "'Orbitron', monospace", boxShadow: "0 4px 14px rgba(0,0,0,0.85)" }}>
                      <div style={{ color: "var(--neon-cyan)", fontWeight: "800", marginBottom: "3px" }}>{label}</div>
                      <div style={{ color: "#ff8700" }}>P1 ({p1Car.code}): {data.leaderTime}</div>
                      <div style={{ color: "var(--neon-green)" }}>
                        {isSelectedP1 ? `${p2Car.code} (P2)` : currentDriver.code}: {data.selectedTime}
                      </div>
                      <div style={{ color: "var(--text-dim)", marginTop: "2px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "2px" }}>
                        Delta: <strong style={{ color: "#fff" }}>{data.delta}</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="Leader" stroke="#ff8700" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="Selected" stroke="#00d2be" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>

        {/* Telemetry Pace Summary Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "2px" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>GAP DELTA</div>
            <div style={{ fontSize: "0.74rem", color: currentDriver.gap === "LEADER" ? "var(--neon-cyan)" : "#fff", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
              {effectiveLap <= 1 ? (currentDriver.pos === 1 ? "LEADER" : "—") : currentDriver.gap}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>BEST LAP</div>
            <div style={{ fontSize: "0.74rem", color: "var(--neon-purple, #cc44ff)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
              {effectiveLap <= 1 ? "NO TIME" : (currentDriver.bestLap || "—")}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "5px", borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "0.56rem", color: "var(--text-dim)", fontFamily: "'Orbitron', monospace" }}>LAST LAP</div>
            <div style={{ fontSize: "0.74rem", color: "var(--neon-green)", fontWeight: "800", fontFamily: "'Orbitron', monospace", marginTop: "1px" }}>
              {effectiveLap <= 1 ? "—" : (currentDriver.lastLap || "—")}
            </div>
          </div>
        </div>
      </div>

      {/* ──── CARD 3: AUTHENTIC TEAM RADIO TRANSCEIVER ──── */}
      <div
        style={{
          background: "rgba(16, 18, 28, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 6px var(--neon-green)" }} />
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.74rem", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
              TEAM RADIO · {currentDriver.code} (#{currentDriver.num})
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={{ fontSize: "0.58rem", fontFamily: "'Orbitron', monospace", color: "var(--neon-green)", background: "rgba(0,204,68,0.15)", padding: "1px 4px", borderRadius: "2px", fontWeight: "700" }}>
              CH-1 ENCRYPTED
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "12px", marginLeft: "4px" }}>
              {[6, 12, 8, 14, 10, 4].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: "2px",
                    height: `${h}px`,
                    background: "var(--neon-green)",
                    borderRadius: "1px",
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Radio Transmission Box */}
        <div style={{ background: "rgba(0,0,0,0.35)", padding: "9px 10px", borderRadius: "6px", borderLeft: `3px solid ${activeRadio.speaker === "PIT" ? "var(--neon-red)" : "var(--neon-blue)"}`, fontSize: "0.74rem", display: "flex", flexDirection: "column", gap: "3px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: activeRadio.speaker === "PIT" ? "var(--neon-red)" : "var(--neon-blue)", fontFamily: "'Orbitron', monospace", fontWeight: "700", fontSize: "0.68rem" }}>
              {activeRadio.speaker === "PIT" ? `PIT (${teamEngineer})` : focusedCode}:
            </span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
              L{activeRadio.lap || currentLap} · {activeRadio.time || "15:40"}
            </span>
          </div>
          <div style={{ color: "#e8e8f0", fontSize: "0.75rem", lineHeight: "1.35" }}>
            "{activeRadio.message}"
          </div>
          {activeRadio.driver_reply && (
            <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "3px", marginTop: "2px" }}>
              <strong style={{ color: "var(--neon-blue)" }}>{focusedCode}: </strong>"{activeRadio.driver_reply}"
            </div>
          )}
        </div>

        {/* Quick Tactical Command Macro Buttons */}
        <div className="timing-radio-macro-grid">
          <button
            type="button"
            onClick={() => onSendRadio("Box, box. Hard compound fitted on exit.")}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "700",
              padding: "6px 3px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Box this lap"
          >
            📻 BOX BOX
          </button>
          <button
            type="button"
            onClick={() => onSendRadio("Deploy Manual Override Mode on the main straight.")}
            style={{
              background: "rgba(0,210,190,0.08)",
              border: "1px solid rgba(0,210,190,0.3)",
              color: "var(--neon-cyan)",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "700",
              padding: "6px 3px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Deploy 350kW ERS boost"
          >
            ⚡ MOM BOOST
          </button>
          <button
            type="button"
            onClick={() => onSendRadio("Engine Mode 1. Defend inside into Turn 1.")}
            style={{
              background: "rgba(255,170,0,0.08)",
              border: "1px solid rgba(255,170,0,0.3)",
              color: "#ffaa00",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "700",
              padding: "6px 3px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Defend track position"
          >
            🛡️ DEFEND
          </button>
          <button
            type="button"
            onClick={() => onSendRadio("Box window opening. Push hard to build in-lap delta.")}
            style={{
              background: "rgba(0,204,68,0.08)",
              border: "1px solid rgba(0,204,68,0.3)",
              color: "var(--neon-green)",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              fontWeight: "700",
              padding: "6px 3px",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Push for undercut"
          >
            🎯 HAMMER
          </button>
        </div>

        {/* Unified Radio Controls & Custom Dispatch Bar */}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <button
            type="button"
            onClick={onOpenRadioModal}
            style={{
              background: "linear-gradient(135deg, rgba(0,210,190,0.2) 0%, rgba(54,113,232,0.2) 100%)",
              border: "1px solid var(--neon-cyan)",
              borderRadius: "4px",
              padding: "5px 8px",
              fontSize: "0.64rem",
              fontFamily: "'Orbitron', monospace",
              color: "var(--neon-cyan)",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title="Open full BoxBox & FormulaDream radio archive"
          >
            <span>📻 ARCHIVE</span>
          </button>

          <button
            type="button"
            onClick={() => setRadioFeedIdx((prev) => prev + 1)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "4px",
              padding: "5px 7px",
              fontSize: "0.62rem",
              fontFamily: "'Orbitron', monospace",
              color: "#ffffff",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Next authentic radio transmission"
          >
            ⇄ NEXT
          </button>

          <div style={{ display: "flex", flex: 1, minWidth: 0, gap: "4px" }}>
            <input
              type="text"
              aria-label="Custom team radio message"
              value={customRadioInput}
              onChange={(e) => setCustomRadioInput(e.target.value)}
              placeholder="Transmit to driver..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && customRadioInput.trim()) {
                  onSendRadio(customRadioInput.trim());
                  setCustomRadioInput("");
                }
              }}
              style={{
                flex: 1,
                minWidth: 0,
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "4px",
                padding: "5px 7px",
                color: "#fff",
                fontSize: "0.68rem",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (customRadioInput.trim()) {
                  onSendRadio(customRadioInput.trim());
                  setCustomRadioInput("");
                }
              }}
              style={{
                background: "var(--neon-cyan)",
                color: "#0a0c16",
                border: "none",
                borderRadius: "4px",
                padding: "5px 8px",
                fontFamily: "'Orbitron', monospace",
                fontSize: "0.62rem",
                fontWeight: "900",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              TX ❯
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
