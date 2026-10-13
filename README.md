# 🏎️ GP-Command — Formula 1 Strategy & Mission Control

A full-stack Formula 1 race engineer dashboard and mission control center providing real-time timing, telemetry analysis, 3D satellite race tracking, tire strategy modeling, and paddock operations.

---

## 🌟 Features

* **🏁 Pit Wall Timing Tower**: Live leaderboard tracking delta gaps, intervals, sector status (S1/S2/S3), active aerodynamic modes (Z-Mode downforce vs. X-Mode low-drag), and MOM 350kW override boosts.
* **🗺️ 3D Satellite Radar Tracker**: Isometric broadcast-style satellite tracker featuring accurate circuit contours, Albert Park Lake water reflections, urban skyline, and screen-space driver tracking.
* **🧠 Strategy & Tire Advisor**: Interactive tire degradation curves, multi-stint strategy comparators (1-stop vs. 2-stop), pit window predictions, and undercut/overcut calculators.
* **📈 Telemetry Garage**: Side-by-side teammate speed, throttle, and brake traces with interactive track scrubbing, speed delta bars, and corner apex speeds.
* **📅 2026 Season Calendar**: 24-round interactive race schedule with circuit maps, track characteristics, historical statistics, and weather forecasts.
* **🏎️ Constructors & Paddock HQ**: Overview of all 11 teams and 22 drivers, driver profiles, budget cap monitoring, and technical component upgrades.

---

## 📁 Project Structure

```text
gp-command/
├── client/                # React Vite Frontend
│   └── src/
│       ├── components/    # Timing Tower, Satellite Radar, Strategy, Telemetry, Calendar
│       ├── data/          # 2026 driver profiles, circuits, calendar, and assets
│       └── App.jsx        # Main dashboard view switcher
└── server/                # Node.js + Express API Backend
    ├── src/
    │   ├── models/        # MongoDB schemas
    │   ├── routes/        # REST API endpoints
    │   └── dsa/           # Sorting, search, and optimization algorithms
    └── server.js          # API server entry point
```

---

## ⚡ Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (running locally or via MongoDB Atlas URI)

---

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
```

The API server will run at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The dashboard will open at: `http://localhost:5173`

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/drivers` | Fetch all drivers and team details |
| `GET` | `/api/circuits` | Fetch all 2026 Formula 1 circuits |
| `GET` | `/api/race/timing-tower` | Get race standing and lap intervals |
| `GET` | `/api/race/tire-curve/:compound` | Fetch tire wear & degradation curves |
| `POST` | `/api/strategy/compare` | Evaluate race pit strategies |
| `GET` | `/api/telemetry/compare/:d1/:d2` | Compare teammate telemetry traces |
| `GET` | `/api/budget/optimizer/:team` | Get upgrade recommendations |

---

## 📄 License

This project is for educational and showcase purposes. Formula 1 and related trademarks belong to Formula One Licensing B.V.
