---
name: uiux-pro-max
description: >-
  Advanced UI/UX Design System & Generative UI intelligence skill for Formula 1 & high-performance dashboards.
  Automates design reasoning, color harmonies, typography scaling (Google Fonts), micro-interactions,
  and multi-surface visual testing.
---

# UIUX Pro Max — High-Performance Design System & Visual Intelligence

The **UIUX Pro Max** skill injects broadcast-grade visual design reasoning into Google Antigravity. It enforces world-class UI/UX standards matching Formula 1 broadcast telemetry, FIA Race Control command centers, and aerospace instrumentation.

---

## 1. Design Reasoning Engine

When evaluating or generating frontend interfaces, the agent applies the following design reasoning pipeline:

```
[Context / Domain Analysis] ──> [Design Token Palette Selection] ──> [Typography Architecture]
                                                                              │
[Zero Layout Shift Grid]    <── [Micro-Interactions & Laser Accents] <────────┘
```

1. **Information Hierarchy First**: Primary telemetry (lap times, sector deltas, position swaps) must have highest visual contrast and optical prominence.
2. **Tabular Data Fidelity**: All racing numbers, lap times, gaps, and tire degradation percentages use monospace tabular numbers (`font-variant-numeric: tabular-nums`) to prevent jitter during real-time updates.
3. **Contrast & Legibility (WCAG AAA)**: Telemetry cyan (`#00f0ff`), DRS green (`#00e676`), and warning amber (`#ffb700`) on dark aerospace carbon surfaces (`#08090e`, `#11141e`).
4. **Zero Cumulative Layout Shift (CLS)**: Cards and image containers declare explicit aspect ratios and contain intrinsic sizes to eliminate jumpiness during asset hydration.

---

## 2. Official F1 2026 Color Palette & Design Tokens

### Surface & Atmosphere
* **Void Carbon (Canvas)**: `#07080b`
* **Deep Monocoque (Panels)**: `#0f121a`
* **Telemetry Slate (Cards/Borders)**: `#181d2a`
* **Laser Border Accent**: `rgba(0, 240, 255, 0.25)`

### FIA Race Telemetry Signals
* **Timing Cyan (Primary Accent)**: `#00f0ff` (Glow: `0 0 12px rgba(0, 240, 255, 0.45)`)
* **DRS Active / Sector 2 Green**: `#00e676` (Glow: `0 0 10px rgba(0, 230, 118, 0.4)`)
* **Fastest Lap / Overall Best (Purple)**: `#b026ff` (Glow: `0 0 12px rgba(176, 38, 255, 0.5)`)
* **Safety Car / Delta Positive (Amber)**: `#ffb700`
* **Red Flag / Sector Yellow / Breach**: `#ff1744`

### 2026 Constructor Livery Accents
* **Ferrari**: `#e8002d`
* **McLaren**: `#ff8000`
* **Mercedes**: `#00d2be`
* **Red Bull Racing**: `#002566`
* **Aston Martin**: `#00594f`
* **Williams**: `#00a0de`
* **Alpine**: `#ff1493`
* **Haas**: `#da291c`
* **RB (Racing Bulls)**: `#6692ff`
* **Audi**: `#ea001e`
* **Cadillac**: `#c9a84a` (Cadillac Racing Metallic Gold)

---

## 3. Typography Architecture

Always embed Google Fonts links in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Exo+2:ital,wght@0,300;0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600;800&display=swap" rel="stylesheet">
```

* **Telemetry & Lap Times**: `'Orbitron', monospace` (Futuristic, high-contrast, angular)
* **Body & Driver Names**: `'Exo 2', sans-serif` (Crisp aerodynamic readability)
* **Code / Hex Gaps / Radio Transcripts**: `'JetBrains Mono', monospace`

---

## 4. Generative UI Visual Standards

When rendering Generative UI mockups or artifacts:
* **Glassmorphism**: Use `backdrop-filter: blur(16px)` with layered translucent linear gradients:
  `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)`.
* **Beveled Neon Borders**: Use `border: 1px solid rgba(0, 240, 255, 0.18)` and top highlight borders `border-top: 1px solid rgba(255, 255, 255, 0.25)`.
* **Subtle Scanline Grid**: Inject subtle SVG dot matrices or scanline gradients for command-center authenticity.
* **Responsive Breakpoints**:
  - Desktop Ultra-wide / 1080p: Full telemetry tower + track tracker + telemetry graph split.
  - Laptop (1366x768): Compact driver cards, collapsible pit wall sidebar.
  - Tablet/Mobile: Floating mini timing bar with swipeable tabs.

---

## 5. Multi-Surface Browser Testing Loop

For every visual update:
1. Launch headless Edge/Chrome using Puppeteer.
2. Verify all tabs mount with 0 console errors.
3. Verify no layout shift occurs during image or font loading.
4. Verify responsiveness at 1920x1080, 1366x768, and 1024x768.
5. Capture and inspect high-resolution screenshots.
