// ============================================================
// CircuitSpatialRadar.jsx — Authentic F1 Manager 24 Satellite 3D Broadcast Tracker
// Contoured Parkland & Corner Gravel Runoff, Dual Edge DRS/Braking Telemetry Ribbons,
// Automated Circuit-Aligned Pit Lane, Pit Wall & 11 Paddock Garages,
// Lap-1 Checkered Starting Line with Staggered 2x11 Grid Boxes & 5-Light Gantry,
// Interior Collision-Free Albert Park Lake & Island, and Persistent WebGL Camera.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TEAM_COLORS_MAP } from "../data/constructors2026";

const TEAM_COLORS = Object.fromEntries(
  Object.entries(TEAM_COLORS_MAP).map(([team, palette]) => [team, palette.radar || palette.primary])
);

const CITY_CIRCUITS = new Set([
  "australia",
  "monaco",
  "singapore",
  "las_vegas",
  "azerbaijan",
  "miami",
  "canada",
  "saudi_arabia",
  "madrid",
]);

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
        0.2,
        -(point.y - centerY) * scale
      )
  );
}

function getMinDistanceToTrack(x, z, points, stride = 2) {
  let minDistSq = Infinity;
  for (let i = 0; i < points.length; i += stride) {
    const dx = x - points[i].x;
    const dz = z - points[i].z;
    const dSq = dx * dx + dz * dz;
    if (dSq < minDistSq) minDistSq = dSq;
  }
  return Math.sqrt(minDistSq);
}

function isPointInsideCircuit(x, z, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const zi = points[i].z;
    const xj = points[j].x;
    const zj = points[j].z;
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function computeTrackFrames(points) {
  const count = points.length;
  return points.map((pt, i) => {
    const prev = points[(i - 2 + count) % count];
    const next = points[(i + 2) % count];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const pPrev = points[(i - 5 + count) % count];
    const pNext = points[(i + 5) % count];
    const v1 = new THREE.Vector3().subVectors(pt, pPrev).normalize();
    const v2 = new THREE.Vector3().subVectors(pNext, pt).normalize();
    const angleDiff = v1.angleTo(v2);

    return { point: pt, tangent, normal, curvature: angleDiff };
  });
}

function findMainPitStraight(points, frames, circuitId) {
  const count = points.length;

  let sStart = 1;
  let sEnd = 42;
  let startLineIdx = 30;

  if (circuitId === "australia") {
    sStart = 1;
    sEnd = 45;
    startLineIdx = 33;
  } else {
    const runs = [];
    let current = null;
    for (let i = 0; i < count; i++) {
      const isStraight = frames[i].curvature < 0.085;
      if (isStraight) {
        if (!current) current = { start: i, end: i };
        else current.end = i;
      } else {
        if (current && current.end - current.start >= 10) runs.push(current);
        current = null;
      }
    }
    if (current && current.end - current.start >= 10) runs.push(current);

    if (runs.length > 0) {
      // Score straights by length + preference for early indices (near Start/Finish origin)
      runs.sort((a, b) => {
        const lenA = a.end - a.start + (a.start < 40 ? 12 : 0);
        const lenB = b.end - b.start + (b.start < 40 ? 12 : 0);
        return lenB - lenA;
      });
      sStart = runs[0].start;
      sEnd = runs[0].end;
      startLineIdx = Math.min(count - 1, sStart + Math.round((sEnd - sStart) * 0.66));
    }
  }

  const midIdx = Math.floor((sStart + sEnd) / 2);
  const pStart = points[sStart % count];
  const pEnd = points[sEnd % count];
  const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
  const tangent = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
  const baseNormal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  // Pick outside direction (clear parkland/paddock, never cutting interior corners)
  const testPlus = new THREE.Vector3().copy(midPoint).addScaledVector(baseNormal, 2.0);
  const testMinus = new THREE.Vector3().copy(midPoint).addScaledVector(baseNormal, -2.0);
  const plusInside = isPointInsideCircuit(testPlus.x, testPlus.z, points);
  const minusInside = isPointInsideCircuit(testMinus.x, testMinus.z, points);
  const plusClear = getMinDistanceToTrack(testPlus.x, testPlus.z, points);
  const minusClear = getMinDistanceToTrack(testMinus.x, testMinus.z, points);

  let outwardSign = 1;
  if (plusInside && !minusInside) outwardSign = -1;
  else if (!plusInside && minusInside) outwardSign = 1;
  else if (minusClear > plusClear) outwardSign = -1;

  const outwardNormal = baseNormal.clone().multiplyScalar(outwardSign);
  const rotationY = Math.atan2(-tangent.z, tangent.x);
  const straightLength = pStart.distanceTo(pEnd);

  return {
    sStart,
    sEnd,
    midIdx,
    startLineIdx,
    startLinePct: startLineIdx / count,
    pStart,
    pEnd,
    midPoint,
    tangent,
    outwardNormal,
    outwardSign,
    rotationY,
    straightLength,
  };
}

function makeRibbon(points, halfWidth, color, y, options = {}) {
  const vertices = [];
  const indices = [];
  const count = points.length;
  const closed = options.closed !== false;

  for (let i = 0; i < count; i += 1) {
    const prev = closed ? points[(i - 1 + count) % count] : points[Math.max(0, i - 1)];
    const next = closed ? points[(i + 1) % count] : points[Math.min(count - 1, i + 1)];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    const point = points[i];
    vertices.push(point.x + normal.x, y, point.z + normal.z, point.x - normal.x, y, point.z - normal.z);
  }

  const segLimit = closed ? count : count - 1;
  for (let i = 0; i < segLimit; i += 1) {
    const next = (i + 1) % count;
    indices.push(i * 2, next * 2, i * 2 + 1, next * 2, next * 2 + 1, i * 2 + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.08,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

// Offset edge ribbon for dual F1 Manager green/red track perimeter lines
function makeOffsetEdgeRibbon(points, offsetDist, ribbonHalfWidth, frames, mode = "curb", isNight = false) {
  const vertices = [];
  const colors = [];
  const indices = [];
  const count = points.length;

  const greenCol = new THREE.Color("#00e676");
  const redCol = new THREE.Color("#e11d48");
  const whiteCol = new THREE.Color("#e2e8f0");
  const darkCol = new THREE.Color(isNight ? "#1a2029" : "#242a34");

  for (let i = 0; i < count; i++) {
    const { point, normal, curvature } = frames[i];
    const cInner = offsetDist - ribbonHalfWidth;
    const cOuter = offsetDist + ribbonHalfWidth;

    vertices.push(
      point.x + normal.x * cInner, 0.149, point.z + normal.z * cInner,
      point.x + normal.x * cOuter, 0.149, point.z + normal.z * cOuter
    );

    let col = darkCol;
    if (mode === "telemetry") {
      // Green DRS/acceleration zones on straightaways, red braking/corner zones in bends
      col = curvature < 0.065 ? greenCol : curvature > 0.13 ? redCol : darkCol;
    } else if (mode === "curb") {
      if (curvature > 0.095) {
        col = Math.floor(i / 2) % 2 === 0 ? redCol : whiteCol;
      } else {
        col = isNight ? new THREE.Color("#293241") : new THREE.Color("#94a3b8");
      }
    }
    colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
  }

  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    indices.push(i * 2, next * 2, i * 2 + 1, next * 2, next * 2 + 1, i * 2 + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: mode === "telemetry" ? 0.35 : 0.65,
      metalness: 0.06,
      side: THREE.DoubleSide,
    })
  );
}

// Corner Gravel & Runoff Traps anchored organically outside apex bends
function buildCornerRunoffGroup(points, frames, isNightMode) {
  const group = new THREE.Group();
  const gravelMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#3b3528" : "#9c8b6e",
    roughness: 0.92,
    metalness: 0.02,
  });
  const tarmacApronMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#161c24" : "#29303a",
    roughness: 0.85,
  });

  const count = points.length;
  for (let i = 0; i < count; i += 7) {
    if (frames[i].curvature < 0.16) continue;
    const prev = points[(i - 4 + count) % count];
    const next = points[(i + 4) % count];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const nCandidate = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const pOutPlus = points[i].clone().addScaledVector(nCandidate, 1.1);
    const outDir = !isPointInsideCircuit(pOutPlus.x, pOutPlus.z, points) ? nCandidate : nCandidate.clone().negate();

    const center = points[i].clone().addScaledVector(outDir, 0.95);
    if (getMinDistanceToTrack(center.x, center.z, points) < 0.72) continue;

    const geo = new THREE.CylinderGeometry(0.95, 1.05, 0.02, 16);
    const patch = new THREE.Mesh(geo, i % 14 === 0 ? gravelMat : tarmacApronMat);
    patch.position.set(center.x, 0.09, center.z);
    patch.scale.set(1.35, 1, 0.82);
    patch.rotation.y = Math.atan2(-tangent.z, tangent.x);
    patch.receiveShadow = true;
    group.add(patch);
  }
  return group;
}

// Textured topographic parkland + subtle precinct roads fading smoothly into dark fog
function createSatelliteTerrainTexture(isNightMode, isCityCircuit) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = isNightMode ? "#0e1a0c" : "#1f3515";
  ctx.fillRect(0, 0, 1024, 1024);

  // Organic rolling parkland elevation patches (F1 Manager contoured aesthetic)
  const contourPatches = [
    { x: 320, y: 310, rx: 220, ry: 130, rot: 0.25, col: isNightMode ? "#132311" : "#29461c" },
    { x: 640, y: 380, rx: 190, ry: 150, rot: -0.4, col: isNightMode ? "#162914" : "#335424" },
    { x: 460, y: 630, rx: 250, ry: 140, rot: 0.15, col: isNightMode ? "#122110" : "#26401a" },
    { x: 700, y: 710, rx: 170, ry: 110, rot: 0.55, col: isNightMode ? "#0c160a" : "#192c11" },
    { x: 250, y: 680, rx: 180, ry: 120, rot: -0.25, col: isNightMode ? "#182c16" : "#385b28" },
    { x: 520, y: 210, rx: 210, ry: 95, rot: -0.15, col: isNightMode ? "#152613" : "#2f4e21" },
  ];

  contourPatches.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.col;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Subtle winding access roads & park paths
  ctx.strokeStyle = isNightMode ? "rgba(42, 54, 70, 0.55)" : "rgba(72, 84, 96, 0.55)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 190);
  ctx.bezierCurveTo(320, 220, 620, 190, 940, 260);
  ctx.moveTo(140, 820);
  ctx.bezierCurveTo(420, 770, 720, 830, 950, 740);
  ctx.stroke();

  if (isCityCircuit) {
    // Subtle dark asphalt city avenue grid around outer edges only
    ctx.fillStyle = isNightMode ? "rgba(8, 12, 18, 0.72)" : "rgba(18, 24, 32, 0.75)";
    ctx.fillRect(0, 0, 1024, 105);
    ctx.fillRect(910, 0, 114, 1024);
    ctx.fillRect(0, 915, 1024, 109);
    ctx.fillRect(0, 0, 105, 1024);

    ctx.strokeStyle = isNightMode ? "#1a2433" : "#283342";
    ctx.lineWidth = 5;
    for (let g = 40; g < 1024; g += 110) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 105);
      ctx.moveTo(g, 915);
      ctx.lineTo(g, 1024);
      ctx.stroke();
    }
  }

  // Deep atmospheric horizon vignette fading into dark void
  const radialGrad = ctx.createRadialGradient(512, 512, 310, 512, 512, 512);
  radialGrad.addColorStop(0, "rgba(6, 9, 14, 0)");
  radialGrad.addColorStop(0.68, "rgba(6, 9, 14, 0.42)");
  radialGrad.addColorStop(1, isNightMode ? "#04070c" : "#070a10");
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Verified Dry Interior Albert Park Lake Shape (strictly inside track polygon, ZERO asphalt overlap)
// Remember: lake.rotation.x = -Math.PI/2 maps Shape (sx, sy) -> World (sx, 0, -sy) => sy = -worldZ
function createAlbertParkLakeShape() {
  const shape = new THREE.Shape();
  // Encompasses worldX in [-5.1, -0.7] and worldZ in [-2.0, +8.1]
  shape.moveTo(-1.2, 1.8);      // world (-1.2, -1.8) South Tip
  shape.bezierCurveTo(-2.8, 1.2, -4.0, -0.5, -4.8, -3.2);  // Left/West shore widening
  shape.bezierCurveTo(-5.3, -5.0, -5.0, -7.2, -3.4, -8.1); // North-West Round Basin
  shape.bezierCurveTo(-2.1, -8.4, -1.0, -7.2, -0.8, -5.2); // North-East Lakeside shore
  shape.bezierCurveTo(-0.7, -3.5, -1.2, -1.8, -0.9, -0.2); // Waist narrows cleanly inside bend
  shape.bezierCurveTo(-0.7, 0.9, -0.8, 1.9, -1.2, 1.8);
  return shape;
}

function createAlbertParkIslandShape() {
  const shape = new THREE.Shape();
  // Centered cleanly inside wide North-West Basin: world (-3.1, +5.6) => sy = -5.6
  shape.moveTo(-3.1, -6.35);
  shape.bezierCurveTo(-2.3, -6.2, -2.2, -5.2, -2.9, -4.9);
  shape.bezierCurveTo(-3.6, -4.8, -4.0, -5.5, -3.7, -6.1);
  shape.bezierCurveTo(-3.5, -6.35, -3.3, -6.4, -3.1, -6.35);
  return shape;
}

// Checkered Finish Line Canvas Texture
function createCheckeredLineTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const size = 16;
  for (let y = 0; y < canvas.height; y += size) {
    for (let x = 0; x < canvas.width; x += size) {
      ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? "#ffffff" : "#0b0e14";
      ctx.fillRect(x, y, size, size);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Build Authentic F1 Pit Complex (Pit Entry/Exit, Parallel Pit Lane, Pit Wall, 11 Garages & Pit Boxes)
function buildPitAreaGroup(points, pitInfo, isNightMode) {
  const group = new THREE.Group();
  const count = points.length;
  const { sStart, sEnd, midPoint, tangent, outwardNormal, rotationY, straightLength } = pitInfo;

  // 1. Curved Pit Entry -> Parallel Pit Lane -> Curved Pit Exit Ribbon
  const entryIdx = (sStart - 4 + count) % count;
  const exitIdx = (sEnd + 4) % count;
  const totalSpan = ((exitIdx - entryIdx + count) % count) + 1;

  const pitCurvePts = [];
  for (let step = 0; step < totalSpan; step++) {
    const idx = (entryIdx + step) % count;
    const t = step / Math.max(1, totalSpan - 1);
    // Smooth cosine blend from 0 on track -> 1.05 units into pit lane -> 0 back onto track
    let factor = 1.0;
    if (t < 0.18) factor = Math.sin((t / 0.18) * (Math.PI / 2));
    else if (t > 0.82) factor = Math.sin(((1 - t) / 0.18) * (Math.PI / 2));
    const offset = 1.05 * factor;
    pitCurvePts.push(points[idx].clone().addScaledVector(outwardNormal, offset));
  }

  if (pitCurvePts.length > 3) {
    const pitLaneMesh = makeRibbon(pitCurvePts, 0.22, isNightMode ? "#1c222d" : "#272d38", 0.142, {
      closed: false,
      roughness: 0.72,
    });
    group.add(pitLaneMesh);

    // White pit-lane boundary line
    const pitLineMesh = makeRibbon(pitCurvePts, 0.24, isNightMode ? "#64748b" : "#cbd5e1", 0.139, {
      closed: false,
      roughness: 0.5,
    });
    group.add(pitLineMesh);
  }

  // Clamp paddock structure width strictly inside the straight length so corners remain 100% clear
  const complexLength = Math.min(straightLength * 0.74, 7.6);
  if (complexLength < 1.6) return group;

  // All local coordinates in pitGroup frame:
  // local X aligns cleanly with track tangent (racing direction)
  // local Z aligns cleanly with outwardNormal (+Z goes away from track into paddock)
  const pitFrame = new THREE.Group();
  pitFrame.position.set(midPoint.x, 0, midPoint.z);
  pitFrame.rotation.y = rotationY;

  // 2. Paved Paddock Concrete Apron Pad
  const apronMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#19202b" : "#2f3744",
    roughness: 0.82,
    metalness: 0.05,
  });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(complexLength + 0.8, 0.04, 1.85), apronMat);
  apron.position.set(0, 0.115, 1.72);
  apron.receiveShadow = true;
  pitFrame.add(apron);

  // 3. Slim Pit Wall Divider Barrier (between main asphalt 0.50 and pit lane 1.05)
  const pitWallMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#94a3b8" : "#e2e8f0",
    roughness: 0.55,
  });
  const pitWall = new THREE.Mesh(new THREE.BoxGeometry(complexLength * 0.88, 0.12, 0.07), pitWallMat);
  pitWall.position.set(0, 0.19, 0.68);
  pitWall.castShadow = true;
  pitFrame.add(pitWall);

  // Red/White top strip on Pit Wall
  const pitWallCap = new THREE.Mesh(
    new THREE.BoxGeometry(complexLength * 0.88, 0.03, 0.08),
    new THREE.MeshStandardMaterial({ color: "#e11d48", roughness: 0.5 })
  );
  pitWallCap.position.set(0, 0.255, 0.68);
  pitFrame.add(pitWallCap);

  // 4. 11 Segmented Pit Garage Bays + White Team Pit Stalls (Screenshot 2 style low-profile garages)
  const bayCount = 11;
  const baySpan = complexLength / bayCount;
  const garageBodyMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#1f2937" : "#475569",
    roughness: 0.65,
  });
  const garageRoofMat = new THREE.MeshStandardMaterial({
    color: isNightMode ? "#334155" : "#cbd5e1",
    roughness: 0.45,
    metalness: 0.15,
  });
  const stallPaintMat = new THREE.MeshBasicMaterial({
    color: isNightMode ? "#38bdf8" : "#f8fafc",
    transparent: true,
    opacity: 0.72,
  });

  for (let b = 0; b < bayCount; b++) {
    const bx = -complexLength / 2 + baySpan * (b + 0.5);
    const garageCenterWorld = midPoint.clone()
      .addScaledVector(tangent, bx)
      .addScaledVector(outwardNormal, 1.82);

    // Guarantee individual bay never collides with an adjacent curved section on tight street circuits
    if (getMinDistanceToTrack(garageCenterWorld.x, garageCenterWorld.z, points) < 1.25) continue;

    // Low-profile Pit Garage Building
    const bayMesh = new THREE.Mesh(new THREE.BoxGeometry(baySpan * 0.86, 0.28, 0.68), garageBodyMat);
    bayMesh.position.set(bx, 0.26, 1.86);
    bayMesh.castShadow = true;
    bayMesh.receiveShadow = true;
    pitFrame.add(bayMesh);

    // Clean Roof Canopy Slab
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(baySpan * 0.92, 0.05, 0.82), garageRoofMat);
    roofMesh.position.set(bx, 0.42, 1.8);
    roofMesh.castShadow = true;
    pitFrame.add(roofMesh);

    // Team Pit Box Apron Marking right in front of each garage bay
    const pitBoxLine = new THREE.Mesh(new THREE.PlaneGeometry(baySpan * 0.56, 0.18), stallPaintMat);
    pitBoxLine.rotation.x = -Math.PI / 2;
    pitBoxLine.position.set(bx, 0.146, 1.28);
    pitFrame.add(pitBoxLine);
  }

  group.add(pitFrame);
  return group;
}

// Build Lap-1 Checkered Starting Line + Staggered 2x11 Grid Boxes + 5-Light Gantry
function buildStartingGridGroup(points, frames, pitInfo, texturesToDispose) {
  const group = new THREE.Group();
  const count = points.length;
  const { startLineIdx } = pitInfo;
  const lineFrame = frames[startLineIdx % count];
  const lineAngle = Math.atan2(-lineFrame.tangent.z, lineFrame.tangent.x);

  // 1. Checkered Start/Finish Line Strip
  const checkerTex = createCheckeredLineTexture();
  texturesToDispose.push(checkerTex);
  const checkerGeo = new THREE.PlaneGeometry(0.26, 0.92);
  const checkerMat = new THREE.MeshStandardMaterial({
    map: checkerTex,
    roughness: 0.5,
    metalness: 0.05,
  });
  const checkerMesh = new THREE.Mesh(checkerGeo, checkerMat);
  checkerMesh.rotation.order = "YXZ";
  checkerMesh.rotation.y = lineAngle;
  checkerMesh.rotation.x = -Math.PI / 2;
  checkerMesh.position.set(lineFrame.point.x, 0.156, lineFrame.point.z);
  group.add(checkerMesh);

  // 2. FIA Starting Lights Overhead Gantry (Straddles track outside curbs)
  const gantry = new THREE.Group();
  gantry.position.set(lineFrame.point.x, 0, lineFrame.point.z);
  gantry.rotation.y = lineAngle;

  const poleMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.5, metalness: 0.4 });
  [-0.64, 0.64].forEach((zOff) => {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), poleMat);
    pole.position.set(0, 0.52, zOff);
    pole.castShadow = true;
    gantry.add(pole);
  });

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 1.4), poleMat);
  crossbar.position.set(0, 0.94, 0);
  crossbar.castShadow = true;
  gantry.add(crossbar);

  // 5 Glowing FIA Red Starting Light Pods facing incoming grid
  const lightPodMat = new THREE.MeshStandardMaterial({
    color: "#ff1801",
    emissive: "#ff1801",
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  for (let pod = 0; pod < 5; pod++) {
    const pz = -0.34 + pod * 0.17;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), lightPodMat);
    bulb.position.set(-0.07, 0.93, pz);
    gantry.add(bulb);
  }
  group.add(gantry);

  // 3. Staggered 2x11 Painted White Starting Grid Slots (walking backward cleanly behind line)
  const slotMat = new THREE.MeshBasicMaterial({
    color: "#f8fafc",
    transparent: true,
    opacity: 0.88,
  });

  for (let gridPos = 0; gridPos < 22; gridPos++) {
    const backSteps = 0.009 + Math.floor(gridPos / 2) * 0.0082 + (gridPos % 2) * 0.0041;
    const sampleIdx = Math.floor(((startLineIdx / count - backSteps + 1) % 1) * count);
    const f = frames[sampleIdx];
    const laneSign = gridPos % 2 === 0 ? -1 : 1;
    const latOffset = laneSign * 0.18;
    const slotCenter = f.point.clone().addScaledVector(f.normal, latOffset);
    const slotAngle = Math.atan2(-f.tangent.z, f.tangent.x);

    const slotGroup = new THREE.Group();
    slotGroup.position.set(slotCenter.x, 0.153, slotCenter.z);
    slotGroup.rotation.y = slotAngle;

    // Front line bar + two side rails forming classic `[` F1 grid box facing track forward
    const frontBar = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.22), slotMat);
    frontBar.rotation.x = -Math.PI / 2;
    frontBar.position.set(0.11, 0, 0);
    slotGroup.add(frontBar);

    [-0.1, 0.1].forEach((sideZ) => {
      const rail = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.025), slotMat);
      rail.rotation.x = -Math.PI / 2;
      rail.position.set(0.03, 0, sideZ);
      slotGroup.add(rail);
    });

    group.add(slotGroup);
  }

  return { group, lightPodMat };
}

// Create a miniature directional open-wheel F1 silhouette oriented forward along +X
function createF1CarMesh(teamColor, sharedGeos) {
  const carGroup = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamColor,
    emissiveIntensity: 0.48,
    roughness: 0.28,
    metalness: 0.3,
  });

  const body = new THREE.Mesh(sharedGeos.chassisGeo, bodyMat);
  body.position.set(-0.02, 0.055, 0);
  body.castShadow = true;
  carGroup.add(body);

  const nose = new THREE.Mesh(sharedGeos.noseGeo, bodyMat);
  nose.position.set(0.11, 0.045, 0);
  carGroup.add(nose);

  const frontWing = new THREE.Mesh(sharedGeos.frontWingGeo, sharedGeos.carbonMat);
  frontWing.position.set(0.17, 0.025, 0);
  carGroup.add(frontWing);

  const rearWing = new THREE.Mesh(sharedGeos.rearWingGeo, sharedGeos.carbonMat);
  rearWing.position.set(-0.15, 0.085, 0);
  carGroup.add(rearWing);

  const halo = new THREE.Mesh(sharedGeos.haloGeo, sharedGeos.haloMat);
  halo.position.set(0.01, 0.095, 0);
  carGroup.add(halo);

  const rainLight = new THREE.Mesh(sharedGeos.rainLightGeo, sharedGeos.rainLightMat);
  rainLight.position.set(-0.18, 0.052, 0);
  carGroup.add(rainLight);

  return { carNode: carGroup, bodyMat };
}

// Compute driver target progress along track & staggered lane when positioned on Lap-1 Grid vs Live Race
function computeDriverTrackSlot(driver, index, startLinePct, isGridFormation) {
  const pos = driver.pos || index + 1;
  const slotIdx = Math.max(0, Math.min(21, pos - 1));
  if (isGridFormation) {
    const backSteps = 0.011 + Math.floor(slotIdx / 2) * 0.0082 + (slotIdx % 2) * 0.0041;
    const totalDistance = -backSteps;
    const progress = ((startLinePct + totalDistance) % 1 + 1) % 1;
    const lateral = (slotIdx % 2 === 0 ? -1 : 1) * 0.18;
    return { progress, totalDistance, lateral, tierY: 1.05 + (slotIdx % 3) * 0.34 };
  }

  // Spread pack cleanly along Sector 3/Pit straight when entering mid-race without sudden snaps
  const totalDistance = -0.012 - slotIdx * 0.014;
  const progress = ((startLinePct + totalDistance) % 1 + 1) % 1;
  return { progress, totalDistance, lateral: 0, tierY: 1.05 + (slotIdx % 2) * 0.22 };
}

function makeBroadcastDriverSprite(driver, pos, color, isSelected = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 76;
  const ctx = canvas.getContext("2d");

  // Highlighted white card for active driver (`6 | SAI` look in Screenshot 2), sleek dark pill otherwise
  ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.97)" : "rgba(11, 15, 23, 0.92)";
  ctx.beginPath();
  ctx.roundRect(8, 4, 184, 42, 6);
  ctx.fill();

  ctx.strokeStyle = isSelected ? color : "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = isSelected ? 2.2 : 1.3;
  ctx.stroke();

  // Left team color stripe
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(8, 4, 7, 42, [6, 0, 0, 6]);
  ctx.fill();

  // Position digit
  ctx.fillStyle = isSelected ? "#0b0e14" : "#ffffff";
  ctx.font = "900 19px 'Orbitron', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${pos}`, 44, 32);

  // Divider bar
  ctx.strokeStyle = isSelected ? "rgba(11, 14, 20, 0.3)" : "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(54, 10);
  ctx.lineTo(54, 38);
  ctx.stroke();

  // Driver 3-letter code
  ctx.font = "900 19px 'Orbitron', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = isSelected ? "#0b0e14" : "#ffffff";
  ctx.fillText(driver.code || "CAR", 64, 32);

  // Hairline 1px vertical stem to car puck
  ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(100, 46);
  ctx.lineTo(100, 72);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(100, 72, 3, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  );
  sprite.center.set(0.5, 0.04);
  sprite.scale.set(2.1, 0.92, 1);
  sprite.renderOrder = isSelected ? 200 : Math.max(10, 50 - pos);
  return { sprite, texture };
}

export default function CircuitSpatialRadar({
  trackPath,
  circuitId = "australia",
  drivers = [],
  selectedDriverNum,
  isNightMode = false,
  isPlaying = false,
  simSpeed = 1,
  currentLap = 1,
  isAutoSimulating = false,
  sessionFlag = "GREEN",
  onLapComplete,
}) {
  const hostRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Live Refs so upstream Lap transitions & highlight sync NEVER rebuild WebGL!
  const driversRef = useRef(drivers);
  const selectedDriverNumRef = useRef(selectedDriverNum);
  const isPlayingRef = useRef(isPlaying);
  const simSpeedRef = useRef(simSpeed);
  const currentLapRef = useRef(currentLap);
  const isAutoSimulatingRef = useRef(isAutoSimulating);
  const sessionFlagRef = useRef(sessionFlag);
  const onLapCompleteRef = useRef(onLapComplete);

  useEffect(() => {
    driversRef.current = drivers;
    selectedDriverNumRef.current = selectedDriverNum;
    isPlayingRef.current = isPlaying;
    simSpeedRef.current = simSpeed;
    currentLapRef.current = currentLap;
    isAutoSimulatingRef.current = isAutoSimulating;
    sessionFlagRef.current = sessionFlag;
    onLapCompleteRef.current = onLapComplete;
  }, [drivers, selectedDriverNum, isPlaying, simSpeed, currentLap, isAutoSimulating, sessionFlag, onLapComplete]);

  const sceneRefs = useRef({
    scene: null,
    curve: null,
    carsGroup: null,
    markers: [],
    lap1StartGroup: null,
    startLightPods: [],
    selectedHalo: null,
    pitInfo: null,
    nextLapThreshold: 1.0,
    texturesToDispose: [],
  });

  // ── Build 3D Circuit Environment ONCE per Circuit / NightMode ──────────────
  useEffect(() => {
    if (!hostRef.current || !trackPath) return undefined;

    let renderer;
    let animationId;
    const host = hostRef.current;
    const localTextures = [];

    try {
      const normalizedCid = String(circuitId || "australia").toLowerCase();
      const isCityCircuit = CITY_CIRCUITS.has(normalizedCid);

      const scene = new THREE.Scene();
      const bgColor = isNightMode ? "#05080e" : "#070b12";
      scene.background = new THREE.Color(bgColor);
      scene.fog = new THREE.FogExp2(bgColor, 0.0135);

      const trackPoints = sampleCircuitPath(trackPath);
      const frames = computeTrackFrames(trackPoints);
      const pitInfo = findMainPitStraight(trackPoints, frames, normalizedCid);
      const curve = new THREE.CatmullRomCurve3(trackPoints, true, "centripetal", 0.08);

      // Camera positioning: Pull back generously so Full Track + Full Pit Complex + Starting Grid fit comfortably!
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 180);
      let camPos;
      let camTarget;
      if (normalizedCid === "australia") {
        camPos = new THREE.Vector3(-15.5, 20.5, -22.5);
        camTarget = new THREE.Vector3(-0.7, 0, -1.6);
      } else {
        camPos = pitInfo.midPoint
          .clone()
          .addScaledVector(pitInfo.outwardNormal, 25.5)
          .add(new THREE.Vector3(0, 21.5, 0));
        camTarget = pitInfo.midPoint.clone().multiplyScalar(0.24);
      }
      camera.position.copy(camPos);
      camera.lookAt(camTarget);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.replaceChildren(renderer.domElement);

      // Sunlight + Parkland Hemisphere Ambient
      const skyLight = new THREE.HemisphereLight(
        isNightMode ? "#3d5275" : "#cfe6ff",
        isNightMode ? "#0e151d" : "#182b15",
        isNightMode ? 1.65 : 2.35
      );
      scene.add(skyLight);

      const sun = new THREE.DirectionalLight(isNightMode ? "#8db4f5" : "#fff7e5", isNightMode ? 1.35 : 2.65);
      sun.position.set(-16, 28, -14);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 4;
      sun.shadow.camera.far = 75;
      sun.shadow.camera.left = -28;
      sun.shadow.camera.right = 28;
      sun.shadow.camera.top = 28;
      sun.shadow.camera.bottom = -28;
      sun.shadow.bias = -0.0004;
      scene.add(sun);

      const rimLight = new THREE.DirectionalLight(isNightMode ? "#355078" : "#a8cde6", 0.8);
      rimLight.position.set(22, 16, 18);
      scene.add(rimLight);

      // Terrain Ground Plane
      const terrainTexture = createSatelliteTerrainTexture(isNightMode, isCityCircuit);
      localTextures.push(terrainTexture);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(92, 82, 1, 1),
        new THREE.MeshStandardMaterial({ map: terrainTexture, roughness: 0.88, metalness: 0.03 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      ground.receiveShadow = true;
      scene.add(ground);

      // Circuit-Specific Lake (Melbourne Albert Park Lake kept strictly inside clear interior polygon!)
      if (normalizedCid === "australia") {
        const lakeShape = createAlbertParkLakeShape();
        const lakeMesh = new THREE.Mesh(
          new THREE.ShapeGeometry(lakeShape, 48),
          new THREE.MeshStandardMaterial({
            color: isNightMode ? "#163244" : "#80adc2",
            roughness: 0.16,
            metalness: 0.15,
            transparent: true,
            opacity: 0.94,
          })
        );
        lakeMesh.rotation.x = -Math.PI / 2;
        lakeMesh.position.y = 0.04;
        lakeMesh.receiveShadow = true;
        scene.add(lakeMesh);

        // Dark mossy shoreline ring
        const shoreVerts = [];
        lakeShape.getPoints().forEach((pt) => shoreVerts.push(pt.x, 0.046, -pt.y));
        const shoreGeo = new THREE.BufferGeometry();
        shoreGeo.setAttribute("position", new THREE.Float32BufferAttribute(shoreVerts, 3));
        scene.add(new THREE.LineLoop(shoreGeo, new THREE.LineBasicMaterial({ color: isNightMode ? "#102014" : "#1d301b" })));

        // Central Wooded Lake Island (strictly inside North-West Lagoon Bay)
        const islandMesh = new THREE.Mesh(
          new THREE.ShapeGeometry(createAlbertParkIslandShape(), 24),
          new THREE.MeshStandardMaterial({ color: isNightMode ? "#152616" : "#2c4720", roughness: 0.86 })
        );
        islandMesh.rotation.x = -Math.PI / 2;
        islandMesh.position.y = 0.075;
        islandMesh.receiveShadow = true;
        scene.add(islandMesh);

        // Pedestrian Footbridge spanning shore-to-shore across lake waist cleanly
        const footbridge = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.07, 3.6),
          new THREE.MeshStandardMaterial({ color: isNightMode ? "#334155" : "#64748b", roughness: 0.6 })
        );
        footbridge.position.set(-2.35, 0.095, 2.05);
        footbridge.rotation.y = 1.18;
        footbridge.castShadow = true;
        scene.add(footbridge);
      }

      // Corner Gravel & Asphalt Runoffs
      scene.add(buildCornerRunoffGroup(trackPoints, frames, isNightMode));

      // Track Perimeter Runoff Ribbon
      scene.add(makeRibbon(trackPoints, 0.66, isNightMode ? "#181d25" : "#2b323d", 0.125, { roughness: 0.85 }));

      // Outer Red & White Corner Curbs
      scene.add(makeOffsetEdgeRibbon(trackPoints, 0.54, 0.065, frames, "curb", isNightMode));
      scene.add(makeOffsetEdgeRibbon(trackPoints, -0.54, 0.065, frames, "curb", isNightMode));

      // Main Dark Asphalt Racing Surface
      const asphalt = makeRibbon(trackPoints, 0.49, isNightMode ? "#151920" : "#1e232b", 0.14, {
        roughness: 0.66,
        metalness: 0.06,
      });
      asphalt.castShadow = true;
      asphalt.receiveShadow = true;
      scene.add(asphalt);

      // Dual F1 Manager Signature Thin Edge Telemetry Ribbons (Green DRS / Red Braking Edges)
      scene.add(makeOffsetEdgeRibbon(trackPoints, 0.455, 0.028, frames, "telemetry", isNightMode));
      scene.add(makeOffsetEdgeRibbon(trackPoints, -0.455, 0.028, frames, "telemetry", isNightMode));

      // Pit Area & Paddock Garage Complex (Aligned Strictly Parallel to Main Pit Straight!)
      scene.add(buildPitAreaGroup(trackPoints, pitInfo, isNightMode));

      // Lap-1 Checkered Starting Line + Staggered Grid Boxes + 5-Light Gantry
      const { group: lap1StartGroup, lightPodMat } = buildStartingGridGroup(trackPoints, frames, pitInfo, localTextures);
      lap1StartGroup.visible = currentLapRef.current <= 1;
      scene.add(lap1StartGroup);

      // Parkland Low-Poly Trees (Guaranteed collision-free with minDistToTrack >= 1.35)
      const treeCount = 170;
      const treeGeo = new THREE.DodecahedronGeometry(0.3, 1);
      const treeMat = new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0.02 });
      const treeInstanced = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
      treeInstanced.castShadow = true;
      treeInstanced.receiveShadow = true;

      const dummy = new THREE.Object3D();
      const treeColors = [
        new THREE.Color(isNightMode ? "#132614" : "#223f1c"),
        new THREE.Color(isNightMode ? "#18301a" : "#2b4f23"),
        new THREE.Color(isNightMode ? "#102111" : "#1c3416"),
        new THREE.Color(isNightMode ? "#1e3820" : "#345d2a"),
      ];

      let validTrees = 0;
      for (let i = 0; i < treeCount; i++) {
        let tx;
        let tz;
        if (normalizedCid === "australia" && i < 14) {
          tx = -3.1 + Math.sin(i * 1.9) * 0.55;
          tz = 5.6 + Math.cos(i * 1.5) * 0.55;
        } else {
          const ringAngle = i * 2.39996; // golden angle spiral around parkland
          const radius = 5.5 + ((i * 17) % 13) * 1.15;
          tx = Math.cos(ringAngle) * radius;
          tz = Math.sin(ringAngle) * radius;
        }

        if (getMinDistanceToTrack(tx, tz, trackPoints) < 1.55) continue;
        // Keep clear of Pit Complex corridor
        const toMid = new THREE.Vector3(tx - pitInfo.midPoint.x, 0, tz - pitInfo.midPoint.z);
        const alongPit = toMid.dot(pitInfo.tangent);
        const outPit = toMid.dot(pitInfo.outwardNormal);
        if (Math.abs(alongPit) < pitInfo.straightLength * 0.45 && outPit > 0.2 && outPit < 3.4) continue;

        const scale = 0.72 + (Math.sin(i * 4.7) * 0.28 + 0.28);
        dummy.position.set(tx, 0.26 * scale, tz);
        dummy.scale.set(scale, scale * 1.15, scale);
        dummy.rotation.set(0, (i * 0.7) % (Math.PI * 2), 0);
        dummy.updateMatrix();
        treeInstanced.setMatrixAt(validTrees, dummy.matrix);
        treeInstanced.setColorAt(validTrees, treeColors[validTrees % treeColors.length]);
        validTrees++;
      }
      treeInstanced.count = validTrees;
      treeInstanced.instanceMatrix.needsUpdate = true;
      if (treeInstanced.instanceColor) treeInstanced.instanceColor.needsUpdate = true;
      scene.add(treeInstanced);

      // Far Horizon Architectural Massing (Zero track/pit interference!)
      if (isCityCircuit) {
        const buildingsGroup = new THREE.Group();
        const bMats = [
          new THREE.MeshStandardMaterial({ color: isNightMode ? "#1a2332" : "#3a4654", roughness: 0.7 }),
          new THREE.MeshStandardMaterial({ color: isNightMode ? "#223044" : "#49586a", roughness: 0.65 }),
          new THREE.MeshStandardMaterial({ color: isNightMode ? "#161e2b" : "#2f3946", roughness: 0.75 }),
        ];

        for (let bx = -19; bx <= 21; bx += 2.3) {
          for (let bz = -18; bz <= 20; bz += 2.3) {
            const radial = Math.hypot(bx, bz);
            if (radial < 13.8 || radial > 24.5) continue;
            if (getMinDistanceToTrack(bx, bz, trackPoints) < 2.9) continue;

            // Keep camera foreground clear behind Pit Straight so skyline frames the far horizon!
            const camVec = new THREE.Vector2(bx - pitInfo.midPoint.x, bz - pitInfo.midPoint.z);
            if (camVec.dot(new THREE.Vector2(pitInfo.outwardNormal.x, pitInfo.outwardNormal.z)) > 4.5) continue;

            const hash = Math.abs(Math.sin(bx * 6.7 + bz * 4.3));
            if (hash > 0.32) {
              const bw = 1.15 + hash * 0.65;
              const bd = 1.15 + (1 - hash) * 0.65;
              const bh = 2.2 + hash * 5.8;
              const building = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bMats[Math.floor(hash * bMats.length)]);
              building.position.set(bx, bh / 2, bz);
              building.castShadow = true;
              building.receiveShadow = true;
              buildingsGroup.add(building);
            }
          }
        }
        scene.add(buildingsGroup);
      }

      // Build Persistent Car Layer & Selected Halo (populated dynamically so cars NEVER vanish!)
      const carsGroup = new THREE.Group();
      scene.add(carsGroup);

      const selectedHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.04, 12, 36),
        new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.95 })
      );
      selectedHalo.rotation.x = Math.PI / 2;
      selectedHalo.visible = false;
      scene.add(selectedHalo);

      sceneRefs.current = {
        scene,
        curve,
        carsGroup,
        markers: [],
        lap1StartGroup,
        selectedHalo,
        pitInfo,
        nextLapThreshold: 1.0,
        texturesToDispose: localTextures,
      };

      const sharedCarGeos = {
        chassisGeo: new THREE.BoxGeometry(0.24, 0.08, 0.13),
        noseGeo: new THREE.BoxGeometry(0.14, 0.055, 0.075),
        frontWingGeo: new THREE.BoxGeometry(0.05, 0.025, 0.25),
        rearWingGeo: new THREE.BoxGeometry(0.05, 0.065, 0.22),
        haloGeo: new THREE.BoxGeometry(0.1, 0.04, 0.06),
        rainLightGeo: new THREE.BoxGeometry(0.025, 0.03, 0.03),
        carbonMat: new THREE.MeshStandardMaterial({ color: "#141821", roughness: 0.55, metalness: 0.35 }),
        haloMat: new THREE.MeshStandardMaterial({ color: "#0b0e14", roughness: 0.4 }),
        rainLightMat: new THREE.MeshStandardMaterial({ color: "#ff1801", emissive: "#ff1801", emissiveIntensity: 1.8 }),
      };

      const populateDriversIfReady = (driverList) => {
        if (!driverList || driverList.length === 0 || sceneRefs.current.markers.length > 0) return;
        const isGrid = currentLapRef.current <= 1 && !isAutoSimulatingRef.current && !isPlayingRef.current;
        sceneRefs.current.nextLapThreshold = 1.0;

        const builtMarkers = driverList.map((driver, index) => {
          const teamColor = TEAM_COLORS[driver.team] || "#ffffff";
          const { carNode, bodyMat } = createF1CarMesh(teamColor, sharedCarGeos);
          const slot = computeDriverTrackSlot(driver, index, pitInfo.startLinePct, isGrid);

          carNode.userData.driver = driver;
          carNode.userData.index = index;
          carNode.userData.bodyMat = bodyMat;
          carNode.userData.totalDistance = slot.totalDistance;
          carNode.userData.progress = slot.progress;
          carNode.userData.lateral = slot.lateral;
          carNode.userData.pitBlend = 0;
          carNode.userData.lastSelState = driver.num === selectedDriverNumRef.current;
          carNode.userData.lastPos = driver.pos || index + 1;

          const { sprite, texture } = makeBroadcastDriverSprite(
            driver,
            carNode.userData.lastPos,
            teamColor,
            carNode.userData.lastSelState
          );
          localTextures.push(texture);
          sprite.position.y = 0.2;
          carNode.add(sprite);
          carNode.userData.label = sprite;
          carNode.userData.labelTexture = texture;
          carsGroup.add(carNode);
          return carNode;
        });
        sceneRefs.current.markers = builtMarkers;
      };
      sceneRefs.current.populateDrivers = populateDriversIfReady;
      populateDriversIfReady(driversRef.current);

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

      // Main 60FPS Animation Loop
      const clock = new THREE.Clock();
      const animate = () => {
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;
        const activeSel = selectedDriverNumRef.current;
        const lapNum = currentLapRef.current;
        const running = isPlayingRef.current || isAutoSimulatingRef.current;
        const mult = simSpeedRef.current || 1;
        const flag = sessionFlagRef.current;
        const flagFactor = flag === "SC" ? 0.55 : flag === "VSC" ? 0.72 : flag === "RED" ? 0.05 : 1.0;
        const baseLapRate = 0.042 * flagFactor; // ~23.8s full lap at 1x, ~11.9s at 2x, ~6.0s at 4x, ~3.0s at 8x, ~1.5s at 16x
        const isStaticGrid = lapNum <= 1 && !running;
        const activeMarkers = sceneRefs.current.markers;

        lap1StartGroup.visible = lapNum <= 1;
        let hasSelectedMarker = false;
        const leaderMarker = activeMarkers.find((m) => (m.userData.driver?.pos || 99) === 1) || activeMarkers[0];
        const leaderTotal = leaderMarker ? (leaderMarker.userData.totalDistance || 0) : 0;

        // Animate 5-Light FIA Gantry Pods: Red while paused on grid -> Green lights-out burst -> Off away from grid
        if (lightPodMat && lapNum <= 1) {
          if (running && leaderTotal < 0.16) {
            lightPodMat.color.set("#00ff66");
            lightPodMat.emissive.set("#00ff66");
            lightPodMat.emissiveIntensity = 2.4;
          } else if (running) {
            lightPodMat.color.set("#1e293b");
            lightPodMat.emissive.set("#000000");
            lightPodMat.emissiveIntensity = 0;
          } else {
            lightPodMat.color.set("#ff1801");
            lightPodMat.emissive.set("#ff1801");
            lightPodMat.emissiveIntensity = 2.2;
          }
        }

        let minCarDist = Infinity;

        activeMarkers.forEach((marker, idx) => {
          const driver = marker.userData.driver;
          const curPos = driver.pos || idx + 1;
          if (running) {
            let paceMul = 1.0;
            if (marker !== leaderMarker) {
              // Keep coherent pack spread (~0.26 lap P1->P22) so every car crosses S/F 1-by-1 cleanly
              const desiredTotal = leaderTotal - Math.min(0.28, (curPos - 1) * 0.012);
              const gapError = desiredTotal - (marker.userData.totalDistance || 0);
              paceMul = 1.0 + Math.max(-0.14, Math.min(0.18, gapError * 1.15));
            }
            const distStep = Math.max(0.0001, delta * baseLapRate * paceMul * mult);
            marker.userData.totalDistance = (marker.userData.totalDistance || 0) + distStep;
            marker.userData.progress = ((pitInfo.startLinePct + marker.userData.totalDistance) % 1 + 1) % 1;
            marker.userData.lateral *= 0.95; // Smoothly merge off starting staggered lane after lights out
          } else if (isStaticGrid) {
            const slot = computeDriverTrackSlot(driver, idx, pitInfo.startLinePct, true);
            marker.userData.totalDistance = slot.totalDistance;
            marker.userData.progress = slot.progress;
            marker.userData.lateral = slot.lateral;
            marker.userData.pitBlend = 0;
          }

          const td = marker.userData.totalDistance || 0;
          if (td < minCarDist) minCarDist = td;

          const p = marker.userData.progress;
          const pt = curve.getPointAt(p);
          const tan = curve.getTangentAt(p).normalize();
          const norm = new THREE.Vector3(-tan.z, 0, tan.x);

          // Shift into pit lane ONLY while physically traversing the Pit Straight corridor
          const sampleIdx = p * 320;
          const inPitStraight = sampleIdx >= pitInfo.sStart && sampleIdx <= pitInfo.sEnd;
          const wantsPitLane = driver.pitState === "IN PIT" && inPitStraight;
          marker.userData.pitBlend = (marker.userData.pitBlend || 0) + ((wantsPitLane ? 1 : 0) - (marker.userData.pitBlend || 0)) * Math.min(1, delta * 6.0);
          const raceOffset = norm.clone().multiplyScalar(marker.userData.lateral);
          const pitOffset = pitInfo.outwardNormal.clone().multiplyScalar(0.96);
          const pitShift = raceOffset.lerp(pitOffset, marker.userData.pitBlend);

          // Ground miniature F1 chassis squarely on asphalt surface (y = 0.14 surface + 0.015 floor clearance)
          marker.position.set(pt.x + pitShift.x, 0.155, pt.z + pitShift.z);
          marker.rotation.y = Math.atan2(-tan.z, tan.x);

          const isSelected = driver.num === activeSel;
          marker.scale.setScalar(isSelected ? 1.24 : 1.0);
          if (marker.userData.bodyMat) {
            marker.userData.bodyMat.emissiveIntensity = isSelected ? 1.05 : 0.48;
          }

          if (marker.userData.label) {
            // 4-tier anchored pin stagger directly above F1 car chassis
            const showOnGrid = isSelected || curPos === 1 || curPos === 3 || curPos === 6 || curPos === 10 || curPos === 15;
            marker.userData.label.visible = isStaticGrid ? showOnGrid : (isSelected || curPos <= 14);
            marker.userData.label.renderOrder = isSelected ? 200 : Math.max(10, 50 - curPos);
            marker.userData.label.position.y = isStaticGrid
              ? (isSelected ? 0.52 : 0.24 + ((curPos % 3) * 0.15))
              : isSelected
                ? 0.56
                : 0.2 + ((curPos - 1) % 4) * 0.13;
          }

          if (isSelected) {
            hasSelectedMarker = true;
            selectedHalo.position.set(marker.position.x, 0.15, marker.position.z);
            selectedHalo.rotation.z = elapsed * 2.4;
          }
        });

        // Wait until EVERY car (P1 through P22) has physically completed the full lap before advancing the Lap Counter
        if (running && activeMarkers.length > 0 && minCarDist >= sceneRefs.current.nextLapThreshold) {
          sceneRefs.current.nextLapThreshold = Math.floor(minCarDist) + 1.0;
          onLapCompleteRef.current?.();
        }

        selectedHalo.visible = hasSelectedMarker;

        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        cancelAnimationFrame(animationId);
        observer.disconnect();
        localTextures.forEach((tex) => tex.dispose());
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
      console.error("3D Spatial Radar WebGL Initialization:", err);
      queueMicrotask(() => setWebglFailed(true));
      return undefined;
    }
  }, [trackPath, circuitId, isNightMode]);

  // ── Lightweight Sync for Live Drivers, Selection Pill Highlight & Lap-1 Grid Reset ──
  useEffect(() => {
    const { populateDrivers, lap1StartGroup, pitInfo, texturesToDispose } = sceneRefs.current;
    if (drivers && drivers.length > 0 && sceneRefs.current.markers.length === 0 && populateDrivers) {
      populateDrivers(drivers);
    }
    const markers = sceneRefs.current.markers;
    if (!markers || markers.length === 0) return;

    if (lap1StartGroup) {
      lap1StartGroup.visible = currentLap <= 1;
    }

    markers.forEach((marker, idx) => {
      const updatedDriver = drivers.find((d) => d.num === marker.userData.driver.num) || drivers[idx] || marker.userData.driver;
      marker.userData.driver = updatedDriver;
      const newPos = updatedDriver.pos || idx + 1;
      const isSelected = updatedDriver.num === selectedDriverNum;

      if (currentLap <= 1 && !isAutoSimulating && !isPlaying && pitInfo) {
        const slot = computeDriverTrackSlot(updatedDriver, idx, pitInfo.startLinePct, true);
        marker.userData.totalDistance = slot.totalDistance;
        marker.userData.progress = slot.progress;
        marker.userData.lateral = slot.lateral;
        marker.userData.pitBlend = 0;
        sceneRefs.current.nextLapThreshold = 1.0;
      }

      if (marker.userData.lastSelState !== isSelected || marker.userData.lastPos !== newPos) {
        marker.userData.lastSelState = isSelected;
        marker.userData.lastPos = newPos;
        const teamColor = TEAM_COLORS[updatedDriver.team] || "#ffffff";
        const oldSprite = marker.userData.label;
        if (oldSprite) {
          marker.remove(oldSprite);
          oldSprite.material.dispose();
        }
        if (marker.userData.labelTexture) {
          marker.userData.labelTexture.dispose();
        }
        const { sprite, texture } = makeBroadcastDriverSprite(updatedDriver, newPos, teamColor, isSelected);
        texturesToDispose.push(texture);
        marker.userData.label = sprite;
        marker.userData.labelTexture = texture;
        marker.add(sprite);
      }
    });
  }, [drivers, selectedDriverNum, currentLap, isAutoSimulating, isPlaying]);

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
      aria-label="Read-only 3D live race view showing track layout, pit complex, and live car positions."
    >
      <div ref={hostRef} className="spatial-race-map-canvas" />
    </div>
  );
}
