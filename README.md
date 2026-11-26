# 🏎️ GP-Command — Formula 1 Telemetry, Strategy & Race Analytics

A Formula 1 engineering analytics and pit-wall platform providing live race timing, historical FIA session replay, 3D satellite circuit tracking, fuel and tire degradation modeling, teammate telemetry traces, and championship standings.

---

## 🌟 Core Capabilities

* **⏱️ Pit Wall Timing Matrix & OpenF1 Historical Replay**: Toggle seamlessly between the deterministic 2026 physics race engine and real FIA 2024 historical Grand Prix telemetry via the public OpenF1 API (`api.openf1.org`). Includes live catch-up intercept calculations, sector comparisons, Active Aero modes (`Z-MODE` / `X-MODE`), and one-click RFC-4180 CSV export.
* **🗺️ 3D Satellite Circuit Radar**: Read-only broadcast isometric circuit viewer featuring elevation terrain, water bodies, circuit-aligned pit lane & garages, FIA gantry start lights, directional open-wheel car silhouettes, and full-lap playback coordination across `1x` to `16x` speeds.
* **🧠 Automated Strategy & Bio-Fuel Predictor**: Pre-calculated stint degradation curves, re-entry traffic radar, and automated ECU bio-fuel compliance modeling (100% sustainable blend burn & mandatory 1.0 kg FIA sample margin).
* **📈 Teammate Telemetry Studio**: Side-by-side speed, throttle, brake, gear, and time-delta comparison across all 11 constructors — supporting both 2026 corner physics models and real OpenF1 fast-lap car data, plus CSV export.
* **🌤️ Live Circuit Meteorology**: Real-time GPS temperature, humidity, wind, and precipitation feeds from Open-Meteo (`api.open-meteo.com`) for every circuit on the 24-round calendar.
* **🏆 Championship Standings & Cost Cap Audit**: Official FIA points ledger with reversible round results, CSV standings export, and 2026 $135M cost-cap & ATR testing comparison.
* **🔗 Direct URL Routing**: Shareable hash routes (`#/timing?circuit=monaco`, `#/telemetry?circuit=belgium`, `#/strategy`, `#/scoreboard`, etc.) with browser Back/Forward navigation.

---

## 📁 Project Structure

```text
gp-command/
├── client/                        # React + Vite Frontend
│   ├── src/
│   │   ├── components/            # UI Views (TimingTower, TelemetryViewer, 3D Radar, Strategy, Scoreboard)
│   │   ├── data/                  # 2026 Circuits, Constructors, Driver Profiles & Calendar Assets
│   │   └── utils/
│   │       ├── raceSimEngine.js       # Deterministic tire deg, fuel mass, and catch-up physics
│   │       ├── openF1Service.js       # Real FIA replay (OpenF1) & GPS weather (Open-Meteo) client
│   │       ├── fuelPredictionEngine.js# Automated 2026 sustainable bio-fuel burn calculator
│   │       ├── scoreboardEngine.js    # FIA Championship points & round reversibility
│   │       └── exportUtils.js         # Zero-dependency RFC-4180 CSV export utility
│   └── tests/
│       └── engines.test.js        # Native Node unit tests for core simulation & data engines
└── server/                        # Node.js + Express Backend (optional API + MongoDB persistence)
    ├── src/
    │   ├── models/                # Mongoose schemas
    │   ├── routes/                # REST API endpoints
    │   ├── oop/                   # TireModel, StrategyAdvisor, RaceSession, CarUpgrade
    │   └── dsa/                   # Binary search & merge sort utilities
    └── server.js                  # Express API entry point
```

---

## ⚡ Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) *(optional — the client works standalone with live OpenF1/Open-Meteo feeds and local physics fallback)*

### 1. Frontend & Unit Tests

```bash
cd client
npm install
npm test        # Run automated engine tests
npm run lint    # Run oxlint checks
npm run build   # Build production bundle
npm run dev     # Start dev server at http://localhost:5173
```

### 2. Optional Express API Server

```bash
cd server
npm install
npm run dev     # Starts API server at http://localhost:5000
```

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/drivers` | Fetch all drivers and team details |
| `GET` | `/api/circuits` | Fetch all 2026 Formula 1 circuits |
| `GET` | `/api/race/timing-tower` | Get race standings and lap intervals |
| `POST` | `/api/strategy/compare` | Evaluate race pit strategies |
| `GET` | `/api/telemetry/compare/:d1/:d2` | Compare teammate telemetry traces |
| `GET` | `/api/budget/optimizer/:team` | Get R&D upgrade recommendations |

---

## 📄 License

This project is built for motorsport data visualization, engineering analytics, and educational purposes.
