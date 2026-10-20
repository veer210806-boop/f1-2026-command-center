# F1 2026 Mission Control — Design System & Engineering Rules
> Managed by **UIUX Pro Max** for Google Antigravity

## 1. Aesthetic Identity & Visual Polish
- **Atmosphere**: Professional FIA Formula 1 Race Control & Pit Wall Command Center.
- **Color Discipline**:
  - Dark carbon background (`#08090e`, `#0d1017`).
  - High-visibility FIA telemetry accents:
    - Cyan `#00f0ff` (Timing & Primary Accents)
    - Emerald Green `#00e676` (DRS Active, Personal Best)
    - Neon Purple `#b026ff` (Overall Best / Sector Purple)
    - Warning Amber `#ffb700` (Safety Car / Yellow Flag)
    - Race Red `#ff1744` (Red Flag / Penalty)
  - Team liveries must strictly reflect 2026 specs (Ferrari red `#e8002d`, McLaren papaya `#ff8000`, Mercedes teal `#00d2be`, Cadillac metallic gold `#c9a84a`, etc.).
- **Typography**:
  - All telemetry numbers, lap times, gaps, delta times, and speed traps must use `'Orbitron', monospace` with tabular numerals (`font-variant-numeric: tabular-nums`).
  - Labels and UI copy must use `'Exo 2', sans-serif`.
  - Max Verstappen remains driver **#3**.

## 2. Component Performance & Zero Layout Shift
- Heavy card grids (Calendar 24 races, 22 Driver cards) must use GPU virtualization (`content-visibility: auto`, `contain-intrinsic-size`).
- Images must feature `loading="lazy"`, `decoding="async"`, and robust SVG cybernetic fallbacks so no black boxes appear.
- All chart and graph animations must be smooth and avoid main-thread blocking.

## 3. Generative UI & Artifacts
- Prototyped layouts should be delivered as interactive live artifacts in `<appDataDir>/brain/<conversation-id>` so they can be inspected in real-time.
- Visual updates must pass the multi-surface headless browser test suite across 1920x1080 and 1366x768 viewports.
