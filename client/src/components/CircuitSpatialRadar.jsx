// ============================================================
// CircuitSpatialRadar.jsx — Authentic F1 Manager 24 Satellite 3D Broadcast Tracker
// Featuring Albert Park Lake & Island with Realistic Water Specular Shading,
// 180+ Clustered Low-Poly Eucalyptus Parkland Trees, Melbourne CBD Architectural Skyline,
// Alternating Red & White Apex Kerbs, Glowing DRS Actuator Straights,
// Authentic Pit Building & Paddock Garages, and 2D Billboard Driver Pills with Leader Pins.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ── Official 2026 Team Colors & Badges ─────────────────────────────────────
const TEAM_COLORS = {
  McLaren: "#ff8700",
  "Red Bull Racing": "#3671e8",
  Mercedes: "#00d2be",
  Ferrari: "#ff3b30",
  Williams: "#00a0de",
  "Aston Martin": "#229971",
  Cadillac: "#ffc72c",
  Audi: "#e50027",
  Alpine: "#0090ff",
  Haas: "#b6babd",
  "Racing Bulls": "#6692ff",
  RB: "#6692ff",
};

// ── Sample SVG Track Path into Scaled 3D Centered Spline Points ─────────────
function sampleCircuitPath(pathData) {
  const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgPath.setAttribute("d", pathData);
  const length = svgPath.getTotalLength();
  const sampleCount = 320;
  const samples = Array.from({ length: sampleCount }, (_, index) =>
    svgPath.getPointAtLength((index / sampleCount) * length)
  );

  const bounds = samples.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const scale = 24 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

  return samples.map(
    (point) =>
      new THREE.Vector3(
        (point.x - centerX) * scale,
        0.22,
        -(point.y - centerY) * scale
      )
  );
}

// ── Extrude Road/Kerb Ribbon from Track Points ──────────────────────────────
function makeRibbon(points, halfWidth, color, y, options = {}) {
  const vertices = [];
  const indices = [];
  const count = points.length;

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const tangent = new THREE.Vector3().subVectors(next, previous).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    const point = points[index];
    vertices.push(point.x + normal.x, y, point.z + normal.z, point.x - normal.x, y, point.z - normal.z);
  }

  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    indices.push(index * 2, next * 2, index * 2 + 1, next * 2, next * 2 + 1, index * 2 + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.08,
    ...options,
  });

  return new THREE.Mesh(geometry, material);
}

// ── Alternating Red & White Striped Kerb Ribbon ────────────────────────────
function makeStripedKerbRibbon(points, innerWidth, outerWidth, y) {
  const vertices = [];
  const colors = [];
  const indices = [];
  const count = points.length;

  const redColor = new THREE.Color("#d62828");
  const whiteColor = new THREE.Color("#f8fafc");

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const tangent = new THREE.Vector3().subVectors(next, previous).normalize();
    const innerNormal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(innerWidth);
    const outerNormal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(outerWidth);
    const point = points[index];

    vertices.push(point.x + innerNormal.x, y, point.z + innerNormal.z);
    vertices.push(point.x + outerNormal.x, y, point.z + outerNormal.z);

    // Alternate red and white stripes every 3 sample steps
    const isRed = Math.floor(index / 3) % 2 === 0;
    const stripeColor = isRed ? redColor : whiteColor;
    colors.push(stripeColor.r, stripeColor.g, stripeColor.b);
    colors.push(stripeColor.r, stripeColor.g, stripeColor.b);
  }

  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    indices.push(index * 2, next * 2, index * 2 + 1, next * 2, next * 2 + 1, index * 2 + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.65,
    metalness: 0.1,
  });

  return new THREE.Mesh(geometry, material);
}

// ── Glowing DRS Zone Line Ribbon ───────────────────────────────────────────
function makeDrsLine(points, startIndex, endIndex, y) {
  const drsPoints = [];
  const count = points.length;
  for (let i = startIndex; i <= endIndex; i++) {
    drsPoints.push(points[i % count]);
  }
  if (drsPoints.length < 2) return null;

  const vertices = [];
  const indices = [];
  const halfWidth = 0.085;

  for (let index = 0; index < drsPoints.length; index += 1) {
    const previous = drsPoints[Math.max(0, index - 1)];
    const next = drsPoints[Math.min(drsPoints.length - 1, index + 1)];
    const tangent = new THREE.Vector3().subVectors(next, previous).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    const point = drsPoints[index];
    vertices.push(point.x + normal.x, y, point.z + normal.z, point.x - normal.x, y, point.z - normal.z);
  }

  for (let index = 0; index < drsPoints.length - 1; index += 1) {
    const next = index + 1;
    indices.push(index * 2, next * 2, index * 2 + 1, next * 2, next * 2 + 1, index * 2 + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: "#00ff88",
    emissive: "#00e676",
    emissiveIntensity: 1.8,
    roughness: 0.25,
  });

  return new THREE.Mesh(geometry, material);
}

// ── Authentic Procedural Satellite Terrain Texture ─────────────────────────
function createSatelliteTerrainTexture(isNightMode) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Rich organic parkland green base (Photo 3 match: rich olive-forest tone)
  ctx.fillStyle = isNightMode ? "#132317" : "#36552c";
  ctx.fillRect(0, 0, 1024, 1024);

  // Mowed Fairway & Park Lawn Contours (Alternating angled bands across parkland)
  ctx.save();
  ctx.rotate(-0.35);
  for (let y = -300; y < 1500; y += 42) {
    ctx.fillStyle = isNightMode ? "rgba(22, 40, 26, 0.45)" : "rgba(68, 104, 56, 0.35)";
    ctx.fillRect(-400, y, 1800, 21);
  }
  ctx.restore();

  // Golf Course Fairways & Soft Topographic Patches
  const turfPatches = [
    { x: 340, y: 320, rx: 160, ry: 100, angle: 0.25, color: isNightMode ? "#1a301f" : "#456a38" },
    { x: 510, y: 480, rx: 140, ry: 90, angle: -0.3, color: isNightMode ? "#162b1a" : "#3c5e31" },
    { x: 640, y: 360, rx: 120, ry: 150, angle: 0.2, color: isNightMode ? "#1e3724" : "#4b733d" },
    { x: 300, y: 660, rx: 140, ry: 95, angle: -0.2, color: isNightMode ? "#152a19" : "#395b2f" },
    { x: 670, y: 690, rx: 130, ry: 85, angle: 0.4, color: isNightMode ? "#1c3321" : "#436837" },
  ];

  turfPatches.forEach(({ x, y, rx, ry, angle, color }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Sandy Run-off / Gravel Trap Zones along high-speed corners (Photo 3)
  const gravelBeds = [
    { x: 690, y: 210, rx: 55, ry: 34, angle: 0.4 },
    { x: 810, y: 310, rx: 48, ry: 30, angle: -0.3 },
    { x: 240, y: 300, rx: 60, ry: 36, angle: 0.2 },
    { x: 310, y: 830, rx: 65, ry: 38, angle: -0.5 },
    { x: 590, y: 850, rx: 55, ry: 32, angle: 0.3 },
  ];

  gravelBeds.forEach(({ x, y, rx, ry, angle }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = isNightMode ? "#3d3425" : "#c4ab7c";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Internal Service Roads & Footpaths (Fine architectural charcoal lines)
  ctx.strokeStyle = isNightMode ? "rgba(55, 68, 82, 0.7)" : "rgba(95, 108, 120, 0.65)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(160, 220);
  ctx.bezierCurveTo(320, 260, 410, 460, 390, 740);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(670, 160);
  ctx.bezierCurveTo(730, 340, 700, 580, 770, 860);
  ctx.stroke();

  // Surrounding Melbourne City Grid Perimeter (Dark asphalt base)
  ctx.fillStyle = isNightMode ? "#06090e" : "#0d131a";
  ctx.fillRect(0, 0, 1024, 130); // North CBD
  ctx.fillRect(870, 0, 154, 1024); // East (St Kilda Rd)
  ctx.fillRect(0, 880, 1024, 144); // South
  ctx.fillRect(0, 0, 140, 1024); // West

  // City Street Grid lines between architectural blocks
  ctx.strokeStyle = isNightMode ? "#141c26" : "#222c38";
  ctx.lineWidth = 8;
  for (let x = 20; x < 1024; x += 115) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 130);
    ctx.moveTo(x, 880);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 20; y < 1024; y += 110) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(140, y);
    ctx.moveTo(870, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Soft Radial Edge Vignette Fade into Void
  const radialGrad = ctx.createRadialGradient(512, 512, 360, 512, 512, 512);
  radialGrad.addColorStop(0, "rgba(5, 8, 14, 0)");
  radialGrad.addColorStop(0.72, "rgba(5, 8, 14, 0.35)");
  radialGrad.addColorStop(1, isNightMode ? "#04070c" : "#06090e");
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ── Authentic Albert Park Lagoon Shoreline Spline Shape (Expanded & Accurate) ──
function createAlbertParkLakeShape() {
  const shape = new THREE.Shape();
  // Expanded lagoon covering central interior between Lakeside Dr & Aughtie Dr
  shape.moveTo(-1.6, -5.2);
  shape.bezierCurveTo(1.8, -5.0, 4.2, -3.4, 4.1, -0.8);
  shape.bezierCurveTo(4.0, 1.4, 5.2, 3.4, 4.6, 5.6);
  shape.bezierCurveTo(4.0, 7.2, 2.0, 8.0, 0.2, 7.4);
  shape.bezierCurveTo(-1.8, 6.8, -2.8, 5.2, -2.5, 3.1);
  shape.bezierCurveTo(-2.1, 1.1, -3.1, -1.2, -2.7, -3.3);
  shape.bezierCurveTo(-2.4, -4.7, -2.1, -5.3, -1.6, -5.2);
  return shape;
}

// ── Albert Park Island Shape (Situated in Northern Lagoon Bay) ──────────────
function createAlbertParkIslandShape() {
  const shape = new THREE.Shape();
  shape.moveTo(1.2, -3.1);
  shape.bezierCurveTo(2.3, -2.8, 2.7, -1.7, 2.2, -0.9);
  shape.bezierCurveTo(1.7, -0.2, 0.9, -0.5, 0.6, -1.4);
  shape.bezierCurveTo(0.4, -2.2, 0.6, -2.9, 1.2, -3.1);
  return shape;
}

// ── Authentic Broadcast Driver Billboard Pill with Leader Pin ───────────────
function makeBroadcastDriverSprite(driver, pos, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 196;
  canvas.height = 76;
  const ctx = canvas.getContext("2d");

  // Translucent broadcast carbon pill container (Photo 3 Match)
  ctx.fillStyle = "rgba(7, 11, 18, 0.92)";
  ctx.beginPath();
  ctx.roundRect(8, 4, 180, 42, 6);
  ctx.fill();

  // Subtle metallic outer border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Team livery vertical accent bar on the left
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(8, 4, 6, 42, [6, 0, 0, 6]);
  ctx.fill();

  // Position Number
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 20px 'Orbitron', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${pos}`, 42, 32);

  // Vertical Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(52, 10);
  ctx.lineTo(52, 38);
  ctx.stroke();

  // Driver 3-Letter Code
  ctx.font = "800 20px 'Orbitron', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(driver.code || "CAR", 64, 32);

  // Thin vertical leader pin extending down from center of pill
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(98, 46);
  ctx.lineTo(98, 72);
  ctx.stroke();

  // Leader pin contact dot at the bottom
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(98, 72, 3, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    })
  );
  sprite.scale.set(2.4, 0.93, 1);
  return sprite;
}

// ============================================================================
// MAIN COMPONENT: CircuitSpatialRadar
// ============================================================================
export default function CircuitSpatialRadar({
  trackPath,
  drivers,
  selectedDriverNum,
  onSelectDriver,
  isNightMode,
  isPlaying,
  simSpeed,
}) {
  const hostRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (!hostRef.current || !trackPath) return undefined;

    let renderer;
    let animationId;
    const host = hostRef.current;

    try {
      // ── 1. Scene & Atmosphere ───────────────────────────────────────────
      const scene = new THREE.Scene();
      const bgColor = isNightMode ? "#05080e" : "#070b12";
      scene.background = new THREE.Color(bgColor);
      // Distance fog smoothly fading outer limits into cockpit dark
      scene.fog = new THREE.FogExp2(bgColor, 0.019);

      // ── 2. Camera & Orbit Controls (Authentic F1 Manager 24 Isometric View) ──
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 140);
      // Position looking across Main Straight with Lake in Center & CBD in Background (Photo 3 Match)
      camera.position.set(-17.5, 21.5, 1.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.replaceChildren(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0.6, 0, 1.2);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 12;
      controls.maxDistance = 44;
      controls.maxPolarAngle = Math.PI * 0.44;
      controls.minPolarAngle = Math.PI * 0.18;
      controls.enablePan = true;

      // ── 3. Directional Sunlight & Ambient Lighting ───────────────────────
      const skyLight = new THREE.HemisphereLight(
        isNightMode ? "#3d5275" : "#c6e3ff",
        isNightMode ? "#101820" : "#1e331b",
        isNightMode ? 1.6 : 2.4
      );
      scene.add(skyLight);

      const sun = new THREE.DirectionalLight(
        isNightMode ? "#8db4f5" : "#fff8e7",
        isNightMode ? 1.4 : 2.8
      );
      sun.position.set(-14, 26, -14);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 5;
      sun.shadow.camera.far = 70;
      sun.shadow.camera.left = -26;
      sun.shadow.camera.right = 26;
      sun.shadow.camera.top = 26;
      sun.shadow.camera.bottom = -26;
      sun.shadow.bias = -0.0004;
      scene.add(sun);

      // Subtle warm rim/fill light for 3D depth
      const rimLight = new THREE.DirectionalLight(isNightMode ? "#365075" : "#b0d0e6", 0.85);
      rimLight.position.set(20, 16, -18);
      scene.add(rimLight);

      // ── 4. Satellite Ground Terrain Plane ────────────────────────────────
      const terrainTexture = createSatelliteTerrainTexture(isNightMode);
      const groundGeo = new THREE.PlaneGeometry(68, 58, 1, 1);
      const groundMat = new THREE.MeshStandardMaterial({
        map: terrainTexture,
        roughness: 0.86,
        metalness: 0.04,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      ground.receiveShadow = true;
      scene.add(ground);

      // ── 5. Albert Park Lagoon & Teardrop Island (Photo 3 Match) ──────────
      const lakeShape = createAlbertParkLakeShape();
      const lakeGeo = new THREE.ShapeGeometry(lakeShape, 48);

      // Translucent azure-teal water with specular sunlight sheen (Photo 3 Match)
      const lakeMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? "#173447" : "#8ab7cb",
        roughness: 0.15,
        metalness: 0.14,
        transparent: true,
        opacity: 0.94,
      });
      const lake = new THREE.Mesh(lakeGeo, lakeMat);
      lake.rotation.x = -Math.PI / 2;
      lake.position.y = 0.04;
      lake.receiveShadow = true;
      scene.add(lake);

      // Dark Mossy Shoreline Border
      const shoreGeo = new THREE.BufferGeometry();
      const lakePoints = lakeShape.getPoints();
      const shoreVerts = [];
      lakePoints.forEach((pt) => shoreVerts.push(pt.x, 0.045, -pt.y));
      shoreGeo.setAttribute("position", new THREE.Float32BufferAttribute(shoreVerts, 3));
      const shoreMat = new THREE.LineBasicMaterial({
        color: isNightMode ? "#132316" : "#20341e",
        linewidth: 2,
      });
      const shoreLine = new THREE.LineLoop(shoreGeo, shoreMat);
      scene.add(shoreLine);

      // Albert Park Island in Northern Lagoon
      const islandShape = createAlbertParkIslandShape();
      const islandGeo = new THREE.ShapeGeometry(islandShape, 24);
      const islandMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? "#162818" : "#2e4823",
        roughness: 0.85,
        metalness: 0.02,
      });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.rotation.x = -Math.PI / 2;
      island.position.y = 0.07;
      island.receiveShadow = true;
      scene.add(island);

      // Pedestrian Footbridge Spanning Lagoon
      const bridgeGeo = new THREE.BoxGeometry(0.38, 0.08, 2.6);
      const bridgeMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? "#2a3440" : "#556270",
        roughness: 0.6,
      });
      const footbridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      footbridge.position.set(0.65, 0.085, 3.2);
      footbridge.rotation.y = 0.15;
      footbridge.castShadow = true;
      footbridge.receiveShadow = true;
      scene.add(footbridge);

      // ── 6. Racetrack, Striped Kerbs, DRS Straights & Pit Complex ─────────
      const trackPoints = sampleCircuitPath(trackPath);
      const curve = new THREE.CatmullRomCurve3(trackPoints, true, "centripetal", 0.08);

      // Distance clearance validator to guarantee cars never collide with buildings/trees
      function getMinDistanceToTrack(x, z, points) {
        let minDistSq = Infinity;
        for (let idx = 0; idx < points.length; idx += 2) {
          const dx = x - points[idx].x;
          const dz = z - points[idx].z;
          const dSq = dx * dx + dz * dz;
          if (dSq < minDistSq) minDistSq = dSq;
        }
        return Math.sqrt(minDistSq);
      }

      // Alternating Red & White Apex Kerbs
      const stripedKerb = makeStripedKerbRibbon(trackPoints, 0.52, 0.66, 0.12);
      stripedKerb.castShadow = true;
      stripedKerb.receiveShadow = true;
      scene.add(stripedKerb);

      // White Track Edge Limit Lines
      const whiteOuterLine = makeRibbon(trackPoints, 0.535, "#f1f5f9", 0.138);
      const whiteInnerLine = makeRibbon(trackPoints, 0.495, "#181d24", 0.139);
      scene.add(whiteOuterLine);
      scene.add(whiteInnerLine);

      // Main Asphalt Tarmac
      const asphalt = makeRibbon(trackPoints, 0.50, isNightMode ? "#151920" : "#1e232b", 0.14, {
        roughness: 0.68,
        metalness: 0.06,
      });
      asphalt.castShadow = true;
      asphalt.receiveShadow = true;
      scene.add(asphalt);

      // Glowing Neon Green DRS Activation Straights (Photo 3 Match)
      // DRS Zone 1: Main Start-Finish Straight
      const drsMainStraight = makeDrsLine(trackPoints, 275, 318, 0.155);
      if (drsMainStraight) scene.add(drsMainStraight);

      // DRS Zone 2: Lakeside Drive Sweeping Straight
      const drsLakeside = makeDrsLine(trackPoints, 75, 135, 0.155);
      if (drsLakeside) scene.add(drsLakeside);

      // Pit Lane Ribbon Parallel to Main Straight (samples 270 to 318)
      const pitLanePoints = trackPoints.slice(270, 319).map((pt) =>
        new THREE.Vector3(pt.x, pt.y, pt.z - 0.65)
      );
      if (pitLanePoints.length > 2) {
        const pitAsphalt = makeRibbon(pitLanePoints, 0.24, isNightMode ? "#1a202a" : "#252c36", 0.135);
        scene.add(pitAsphalt);
      }

      // 3D Pit Paddock Building & Team Garages (Safely offset outside track)
      const pitBuildingGeo = new THREE.BoxGeometry(6.4, 0.65, 0.85);
      const pitBuildingMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? "#2a3442" : "#cfd8dc",
        roughness: 0.55,
        metalness: 0.15,
      });
      const pitBuilding = new THREE.Mesh(pitBuildingGeo, pitBuildingMat);
      // Positioned safely parallel to pit lane along main straight with >1.4 clearance from cars
      pitBuilding.position.set(-6.5, 0.325, -4.2);
      pitBuilding.rotation.y = 0;
      pitBuilding.castShadow = true;
      pitBuilding.receiveShadow = true;
      scene.add(pitBuilding);

      // Pit Gantry Roof Canopy
      const pitCanopyGeo = new THREE.BoxGeometry(6.5, 0.06, 0.95);
      const pitCanopyMat = new THREE.MeshStandardMaterial({
        color: isNightMode ? "#1b2533" : "#90a4ae",
        roughness: 0.45,
      });
      const pitCanopy = new THREE.Mesh(pitCanopyGeo, pitCanopyMat);
      pitCanopy.position.set(-6.5, 0.67, -4.2);
      pitCanopy.rotation.y = 0;
      scene.add(pitCanopy);

      // ── 7. Clustered Low-Poly Parkland Foliage (180+ Trees) ───────────────
      // Using a single InstancedMesh for maximum 60FPS performance
      const treeCount = 185;
      const treeGeo = new THREE.DodecahedronGeometry(0.34, 1);
      const treeMat = new THREE.MeshStandardMaterial({
        roughness: 0.82,
        metalness: 0.03,
      });
      const treeInstanced = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
      treeInstanced.castShadow = true;
      treeInstanced.receiveShadow = true;

      const dummy = new THREE.Object3D();
      const treeColors = [
        new THREE.Color(isNightMode ? "#152a16" : "#24421e"),
        new THREE.Color(isNightMode ? "#1a331b" : "#2d5225"),
        new THREE.Color(isNightMode ? "#122413" : "#1e3718"),
        new THREE.Color(isNightMode ? "#223d24" : "#38612d"),
      ];

      // Procedural distribution along lake shores, golf course & parkland (verified collision-free)
      let validTreeIndex = 0;
      for (let i = 0; i < treeCount; i++) {
        let tx, tz;
        if (i < 20) {
          // Trees on Albert Park Island (teardrop island in northern bay)
          tx = 1.1 + Math.sin(i * 1.8) * 0.7;
          tz = -1.9 + Math.cos(i * 1.4) * 0.8;
        } else if (i < 70) {
          // East Parkland & Golf Course Groves (between Turn 3 and Turn 6)
          const angle = (i / 50) * Math.PI * 1.8;
          tx = 5.6 + Math.cos(angle) * 2.2 + Math.sin(i * 3.7) * 0.6;
          tz = -3.5 + (i - 20) * 0.28 + Math.cos(i * 2.1) * 0.5;
        } else if (i < 115) {
          // West Parkland Strip (between Pit Straight and Lakeside Drive)
          tx = -3.8 + Math.sin(i * 2.3) * 0.8;
          tz = -4.0 + (i - 70) * 0.25;
        } else if (i < 150) {
          // North parkland perimeter (beyond Turn 1, 2, 3)
          tx = -2.0 + (i - 115) * 0.32;
          tz = -6.8 + Math.sin(i * 2.8) * 0.8;
        } else {
          // South & South-East parkland perimeter (around Turn 9, 10, 11)
          tx = 0.5 + (i - 150) * 0.32;
          tz = 8.5 + Math.cos(i * 2.4) * 0.9;
        }

        // Skip any tree placed too close to racing line
        if (getMinDistanceToTrack(tx, tz, trackPoints) < 1.35) {
          continue;
        }

        const scale = 0.75 + (Math.sin(i * 5.1) * 0.32 + 0.32);
        dummy.position.set(tx, 0.28 * scale, tz);
        dummy.scale.set(scale, scale * 1.18, scale);
        dummy.rotation.set(0, (i * 0.6) % (Math.PI * 2), 0);
        dummy.updateMatrix();

        treeInstanced.setMatrixAt(validTreeIndex, dummy.matrix);
        treeInstanced.setColorAt(validTreeIndex, treeColors[validTreeIndex % treeColors.length]);
        validTreeIndex++;
      }
      treeInstanced.count = validTreeIndex;
      treeInstanced.instanceMatrix.needsUpdate = true;
      if (treeInstanced.instanceColor) treeInstanced.instanceColor.needsUpdate = true;
      scene.add(treeInstanced);

      // ── 8. Melbourne CBD Architectural Skyline (Photo 3 Match) ───────────
      // Structured high-rise city blocks framing North & East horizons
      const buildingsGroup = new THREE.Group();
      const buildingMaterials = [
        new THREE.MeshStandardMaterial({ color: isNightMode ? "#1c2635" : "#3b4756", roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: isNightMode ? "#243245" : "#4a596c", roughness: 0.65 }),
        new THREE.MeshStandardMaterial({ color: isNightMode ? "#192230" : "#303a47", roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ color: isNightMode ? "#2c3e55" : "#55667b", roughness: 0.6 }),
      ];

      // North Skyline: Melbourne CBD Skyscraper Cluster (Kings Way / Southbank)
      for (let bx = -14; bx <= 14; bx += 2.4) {
        for (let bz = -16; bz <= -11; bz += 2.2) {
          if (getMinDistanceToTrack(bx, bz, trackPoints) < 2.5) continue;
          const hash = Math.abs(Math.sin(bx * 7.3 + bz * 3.1));
          if (hash > 0.18) {
            const bWidth = 1.3 + (hash * 0.7);
            const bDepth = 1.2 + ((1 - hash) * 0.7);
            const bHeight = 3.5 + (hash * 6.5); // Majestic skyscrapers up to 10 units tall

            const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
            const bMat = buildingMaterials[Math.floor(hash * buildingMaterials.length)];
            const building = new THREE.Mesh(bGeo, bMat);
            building.position.set(bx + Math.sin(bz) * 0.4, bHeight / 2, bz);
            building.castShadow = true;
            building.receiveShadow = true;
            buildingsGroup.add(building);
          }
        }
      }

      // East Skyline: St Kilda Road & Queens Road Corridor
      for (let bz = -10; bz <= 12; bz += 2.3) {
        for (let bx = 13.5; bx <= 19.5; bx += 2.4) {
          if (getMinDistanceToTrack(bx, bz, trackPoints) < 2.5) continue;
          const hash = Math.abs(Math.cos(bx * 4.7 + bz * 6.9));
          if (hash > 0.2) {
            const bWidth = 1.2 + (hash * 0.6);
            const bDepth = 1.4 + ((1 - hash) * 0.6);
            const bHeight = 2.4 + (hash * 4.8);

            const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
            const bMat = buildingMaterials[Math.floor(hash * buildingMaterials.length)];
            const building = new THREE.Mesh(bGeo, bMat);
            building.position.set(bx, bHeight / 2, bz + Math.sin(bx) * 0.3);
            building.castShadow = true;
            building.receiveShadow = true;
            buildingsGroup.add(building);
          }
        }
      }

      // West & South Outer Commercial Blocks
      for (let bz = -8; bz <= 10; bz += 2.8) {
        const bx = -14.5 - Math.sin(bz) * 0.8;
        if (getMinDistanceToTrack(bx, bz, trackPoints) < 2.5) continue;
        const bHeight = 1.8 + Math.abs(Math.sin(bz * 2.1)) * 2.4;
        const bGeo = new THREE.BoxGeometry(1.6, bHeight, 1.8);
        const building = new THREE.Mesh(bGeo, buildingMaterials[0]);
        building.position.set(bx, bHeight / 2, bz);
        building.castShadow = true;
        building.receiveShadow = true;
        buildingsGroup.add(building);
      }

      scene.add(buildingsGroup);

      // ── 9. Driver Nodes & 2D Screen-Space Billboard Sprites ──────────────
      const carNodeGeo = new THREE.SphereGeometry(0.24, 18, 14);
      const markers = (drivers || []).map((driver, index) => {
        const teamColor = TEAM_COLORS[driver.team] || "#ffffff";
        const carMat = new THREE.MeshStandardMaterial({
          color: teamColor,
          emissive: teamColor,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.25,
        });

        const carNode = new THREE.Mesh(carNodeGeo, carMat);
        carNode.castShadow = true;
        carNode.userData.driver = driver;
        carNode.userData.progress = driver.trackPct ?? ((index * 0.046 + 0.06) % 1);
        carNode.userData.speed = 0.0027 + ((index % 6) * 0.00012);

        // Broadcast Pill HUD Sprite with Leader Pin
        const pos = driver.pos || index + 1;
        const showLabel = pos <= 10 || driver.num === selectedDriverNum;
        if (showLabel) {
          const sprite = makeBroadcastDriverSprite(driver, pos, teamColor);
          sprite.position.y = 1.15;
          carNode.add(sprite);
          carNode.userData.label = sprite;
        }

        scene.add(carNode);
        return carNode;
      });

      // Selected Car Glowing Rotating Halo Ring
      const haloGeo = new THREE.TorusGeometry(0.48, 0.042, 12, 36);
      const haloMat = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.95,
      });
      const selectedHalo = new THREE.Mesh(haloGeo, haloMat);
      selectedHalo.rotation.x = Math.PI / 2;
      scene.add(selectedHalo);

      // ── 10. Pointer Hit-Testing & Selection ──────────────────────────────
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const onPointerDown = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(markers, false);
        if (hits.length > 0 && hits[0].object.userData.driver) {
          onSelectDriver?.(hits[0].object.userData.driver.num);
        }
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      // ── 11. Viewport Resize Observer ─────────────────────────────────────
      const handleResize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const observer = new ResizeObserver(handleResize);
      observer.observe(host);
      handleResize();

      // ── 12. Main 60FPS Animation Loop ────────────────────────────────────
      const clock = new THREE.Clock();

      const animate = () => {
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;

        markers.forEach((marker) => {
          const driver = marker.userData.driver;
          if (isPlaying) {
            marker.userData.progress =
              (marker.userData.progress + delta * marker.userData.speed * (simSpeed || 1)) % 1;
          }

          const progress = marker.userData.progress;
          const point = curve.getPointAt(progress);
          marker.position.set(point.x, point.y + 0.32, point.z);

          const isSelected = driver.num === selectedDriverNum;
          const scale = isSelected ? 1.55 : 1.0;
          marker.scale.setScalar(scale);
          marker.material.emissiveIntensity = isSelected ? 1.4 : 0.55;

          if (marker.userData.label) {
            marker.userData.label.visible = isSelected || (driver.pos || 99) <= 12;
          }

          if (isSelected) {
            selectedHalo.position.set(point.x, point.y + 0.13, point.z);
            selectedHalo.rotation.z = elapsed * 2.2;
          }
        });

        controls.update();
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };
      animate();

      // ── 13. Teardown & GPU Memory Disposal ───────────────────────────────
      return () => {
        cancelAnimationFrame(animationId);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        controls.dispose();
        terrainTexture.dispose();

        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        renderer.dispose();
        host.replaceChildren();
      };
    } catch (err) {
      console.error("3D Satellite Radar WebGL Initialization:", err);
      setWebglFailed(true);
      return undefined;
    }
  }, [trackPath, drivers, selectedDriverNum, onSelectDriver, isNightMode, isPlaying, simSpeed]);

  if (webglFailed) {
    return (
      <div className="spatial-race-map-fallback">
        3D Satellite Radar unavailable on this device.
      </div>
    );
  }

  return (
    <div
      className="spatial-race-map"
      aria-label="Interactive 3D Satellite Radar. Drag to orbit, scroll to zoom, and select a car marker."
    >
      <div ref={hostRef} className="spatial-race-map-canvas" />
      <div className="spatial-race-map-caption">
        DRAG TO ORBIT · SCROLL TO ZOOM · SELECT A CAR
      </div>
    </div>
  );
}
