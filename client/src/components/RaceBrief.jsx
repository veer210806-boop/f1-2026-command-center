import { useState } from "react";

const RESEARCH_SOURCES = [
  { name: "Formula 1", detail: "Official schedule, standings and live timing", href: "https://www.formula1.com/", tone: "official" },
  { name: "FIA", detail: "Sporting and technical regulation reference", href: "https://www.fia.com/", tone: "official" },
  { name: "Motorsport.com", detail: "Season and team-form analysis", href: "https://www.motorsport.com/f1/news/how-every-f1-2026-teams-performed-so-far-team-by-team/10812450/", tone: "analysis" },
  { name: "Podium Prophets", detail: "Team-profile and performance reference", href: "https://podiumprophets.com/f1-teams", tone: "analysis" },
  { name: "StatsF1", detail: "Historic driver-statistics reference", href: "https://www.statsf1.com/en/statistiques/pilote.aspx", tone: "archive" },
  { name: "Circuit archive", detail: "Circuit history and track profiles", href: "https://www.formulaonehistory.com/circuits/", tone: "archive" },
  { name: "Sportmonks", detail: "Track-data API reference", href: "https://www.sportmonks.com/formula-one-api/f1-tracks/", tone: "archive" },
  { name: "Formula Dream", detail: "Interactive radio research reference", href: "https://www.formuladream.app/f1-interactive/tools/team-radio", tone: "archive" },
  { name: "Box Box Radio", detail: "Historic radio archive reference", href: "https://www.boxbox-radio.com/history/select-gp", tone: "archive" },
  { name: "Kaggle dataset", detail: "Historical F1 data discovery (2020–2025)", href: "https://www.kaggle.com/datasets/vshreekamalesh/comprehensive-formula-1-dataset-2020-2025", tone: "archive" },
];

function Metric({ label, value, detail }) {
  return <div className="brief-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function RaceBrief({ circuit, isOpen, onToggle, onNavigate }) {
  const [showSources, setShowSources] = useState(false);
  const weather = circuit?.weather || {};
  const name = circuit?.grand_prix_name || "Australian Grand Prix";

  return (
    <section className={`race-brief ${isOpen ? "is-open" : ""}`} aria-label="Race intelligence brief">
      <div className="brief-topline">
        <div className="brief-heading">
          <span className="brief-eyebrow"><i /> Race intelligence</span>
          <div>
            <h1>{name}</h1>
            <p>{circuit?.circuit_name || "Albert Park Circuit"} <span>·</span> Round {String(circuit?.round || 1).padStart(2, "0")}</p>
          </div>
        </div>
        <div className="brief-actions">
          <button type="button" onClick={() => onNavigate("strategy")}>Open strategy</button>
          <button type="button" className="brief-toggle" onClick={onToggle} aria-expanded={isOpen}>{isOpen ? "Minimise brief" : "Expand brief"}</button>
        </div>
      </div>

      {isOpen && <div className="brief-body">
        <div className="brief-metrics" aria-label="Circuit overview">
          <Metric label="Circuit length" value={`${circuit?.length_km || 5.278} km`} detail={`${circuit?.corners || 14} corners`} />
          <Metric label="Race distance" value={`${circuit?.laps || 58} laps`} detail={`${circuit?.drs_zones || 3} DRS zones`} />
          <Metric label="Track state" value={(circuit?.tire_wear || "medium").toUpperCase()} detail={`Green pit delta +${circuit?.pit_loss_green || 23}s`} />
          <Metric label="Conditions" value={`${weather.air_temp || 23}°C`} detail={`${weather.rain_chance || 10}% rain risk`} />
        </div>
        <div className="brief-insight">
          <div><span>Engineer’s note</span><p>{weather.condition || "Dry running expected"}. Watch the pit delta and tyre window before committing to an undercut.</p></div>
          <button type="button" onClick={() => onNavigate("telemetry")}>Compare telemetry <b>→</b></button>
        </div>
        <div className="brief-provenance">
          <div><span>Data provenance</span><p>GP Command combines local simulation with research references. It is not an official live timing or radio service.</p></div>
          <button type="button" onClick={() => setShowSources((current) => !current)} aria-expanded={showSources}>{showSources ? "Hide sources" : "View sources"}</button>
        </div>
        {showSources && <div className="source-grid" aria-label="Formula 1 research sources">
          {RESEARCH_SOURCES.map((source) => <a key={source.name} className={`source-card ${source.tone}`} href={source.href} target="_blank" rel="noreferrer"><strong>{source.name}</strong><span>{source.detail}</span><b>Open reference ↗</b></a>)}
        </div>}
      </div>}
    </section>
  );
}
