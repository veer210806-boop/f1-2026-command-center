import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const TEAM_COLORS = {
  McLaren: "#ff8700", "Red Bull Racing": "#3671e8", Mercedes: "#00d2be",
  Ferrari: "#ff3b30", Williams: "#00a0de", "Aston Martin": "#229971",
  Cadillac: "#ffc72c", Audi: "#e50027", Alpine: "#0090ff", Haas: "#b6babd",
  "Racing Bulls": "#6692ff", RB: "#6692ff",
};

function sampleCircuitPath(pathData) {
  const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgPath.setAttribute("d", pathData);
  const length = svgPath.getTotalLength();
  const samples = Array.from({ length: 280 }, (_, index) => svgPath.getPointAtLength((index / 280) * length));
  const bounds = samples.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x), maxX: Math.max(acc.maxX, point.x),
    minY: Math.min(acc.minY, point.y), maxY: Math.max(acc.maxY, point.y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const scale = 24 / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

  return samples.map((point) => new THREE.Vector3(
    (point.x - centerX) * scale,
    0.24,
    -(point.y - centerY) * scale,
  ));
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.08, ...options });
}

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
  return new THREE.Mesh(geometry, makeMaterial(color, options));
}

function makeLabelSprite(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 176;
  canvas.height = 42;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(8, 12, 19, 0.92)";
  context.fillRect(1, 1, 174, 40);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(1, 1, 174, 40);
  context.fillStyle = "#ffffff";
  context.font = "700 21px monospace";
  context.fillText(text, 10, 27);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(2.05, 0.49, 1);
  return sprite;
}

export default function CircuitSpatialRadar({ trackPath, drivers, selectedDriverNum, onSelectDriver, isNightMode, isPlaying, simSpeed }) {
  const hostRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (!hostRef.current || !trackPath) return undefined;

    let renderer;
    let animationId;
    const host = hostRef.current;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(isNightMode ? "#05080d" : "#0a1018");
      scene.fog = new THREE.Fog(isNightMode ? "#05080d" : "#0a1018", 22, 62);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
      camera.position.set(1.5, 25, 26);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.replaceChildren(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, -0.5);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 16;
      controls.maxDistance = 38;
      controls.maxPolarAngle = Math.PI * 0.44;
      controls.minPolarAngle = Math.PI * 0.28;
      controls.enablePan = true;

      scene.add(new THREE.HemisphereLight(isNightMode ? "#5270a0" : "#b9dcff", "#152113", isNightMode ? 1.4 : 2.15));
      const sun = new THREE.DirectionalLight(isNightMode ? "#91baff" : "#fff2d2", isNightMode ? 1.2 : 2.4);
      sun.position.set(-16, 24, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);

      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(36, 28),
        makeMaterial(isNightMode ? "#132216" : "#4d6e3e"),
      );
      board.rotation.x = -Math.PI / 2;
      board.position.y = -0.05;
      board.receiveShadow = true;
      board.castShadow = true;
      scene.add(board);

      const lakeMaterial = new THREE.MeshStandardMaterial({ color: isNightMode ? "#17374b" : "#8ec9df", transparent: true, opacity: 0.92, roughness: 0.32, metalness: 0.12 });
      [[-1.4, -0.2, 1.55, 0.68], [6.1, 2.8, 0.58, 0.33]].forEach(([x, z, width, depth]) => {
        const lake = new THREE.Mesh(new THREE.CircleGeometry(5.1, 64), lakeMaterial);
        lake.rotation.x = -Math.PI / 2;
        lake.scale.set(width, depth, 1);
        lake.position.set(x, 0.012, z);
        scene.add(lake);
      });

      const trackPoints = sampleCircuitPath(trackPath);
      const curve = new THREE.CatmullRomCurve3(trackPoints, true, "centripetal", 0.08);
      const curbOuter = makeRibbon(trackPoints, 0.73, "#d6344a", 0.08);
      const curbInner = makeRibbon(trackPoints, 0.63, "#f1f3f5", 0.10);
      const asphalt = makeRibbon(trackPoints, 0.52, "#272d35", 0.12, { roughness: 0.62 });
      const racingLine = makeRibbon(trackPoints, 0.07, "#00e676", 0.145, { emissive: "#006c36", emissiveIntensity: isNightMode ? 1.25 : 0.45, roughness: 0.38 });
      [curbOuter, curbInner, asphalt, racingLine].forEach((road) => { road.castShadow = true; road.receiveShadow = true; scene.add(road); });

      const buildings = new THREE.Group();
      const buildingMaterial = makeMaterial(isNightMode ? "#293545" : "#687078", { roughness: 0.9 });
      for (let index = 0; index < 34; index += 1) {
        const angle = Math.PI * 0.12 + (index / 33) * Math.PI * 0.82;
        const radius = 15 + ((index * 7) % 6);
        const width = 0.7 + ((index * 13) % 11) * 0.09;
        const depth = 0.7 + ((index * 5) % 9) * 0.11;
        const height = 1.1 + ((index * 17) % 13) * 0.23;
        const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), buildingMaterial);
        building.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius - 2);
        building.castShadow = true;
        building.receiveShadow = true;
        buildings.add(building);
      }
      scene.add(buildings);

      const markerGeometry = new THREE.SphereGeometry(0.22, 16, 12);
      const markers = (drivers || []).map((driver, index) => {
        const color = TEAM_COLORS[driver.team] || "#ffffff";
        const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.38, roughness: 0.38 });
        const marker = new THREE.Mesh(markerGeometry, material);
        marker.castShadow = true;
        marker.userData.driver = driver;
        marker.userData.progress = driver.trackPct ?? ((index * 0.047 + 0.09) % 1);
        marker.userData.speed = 0.0028 + ((index % 5) * 0.00014);
        const showLabel = index < 11 || driver.num === selectedDriverNum;
        if (showLabel) {
          const label = makeLabelSprite(`${driver.pos || index + 1} | ${driver.code || "CAR"}`, color);
          label.position.y = 0.78;
          marker.add(label);
          marker.userData.label = label;
        }
        scene.add(marker);
        return marker;
      });

      const selectedRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.045, 8, 28),
        new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.92 }),
      );
      selectedRing.rotation.x = Math.PI / 2;
      scene.add(selectedRing);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const onPointerDown = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(markers, false)[0];
        if (hit?.object?.userData?.driver) onSelectDriver?.(hit.object.userData.driver.num);
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      const clock = new THREE.Clock();
      const render = () => {
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;
        markers.forEach((marker) => {
          const driver = marker.userData.driver;
          if (isPlaying) {
            marker.userData.progress = (marker.userData.progress + delta * marker.userData.speed * simSpeed) % 1;
          }
          const progress = marker.userData.progress;
          const point = curve.getPointAt(progress);
          marker.position.set(point.x, point.y + 0.34, point.z);
          const isSelected = driver.num === selectedDriverNum;
          const scale = isSelected ? 1.45 : 1;
          marker.scale.setScalar(scale);
          marker.material.emissiveIntensity = isSelected ? 1.15 : 0.38;
          if (marker.userData.label) marker.userData.label.visible = isSelected || driver.pos <= 11;
          if (isSelected) {
            selectedRing.position.set(point.x, point.y + 0.13, point.z);
            selectedRing.rotation.z = elapsed * 1.8;
          }
        });
        controls.update();
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(render);
      };
      render();

      return () => {
        cancelAnimationFrame(animationId);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        controls.dispose();
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
        renderer.dispose();
        host.replaceChildren();
      };
    } catch {
      setWebglFailed(true);
      return undefined;
    }
  }, [trackPath, drivers, selectedDriverNum, onSelectDriver, isNightMode, isPlaying, simSpeed]);

  if (webglFailed) return <div className="spatial-race-map-fallback">3D Satellite map unavailable on this device.</div>;

  return (
    <div className="spatial-race-map" aria-label="Interactive 3D race map. Drag to orbit, scroll to zoom, and select a car marker.">
      <div ref={hostRef} className="spatial-race-map-canvas" />
      <div className="spatial-race-map-caption">DRAG TO ORBIT · SCROLL TO ZOOM · SELECT A CAR</div>
    </div>
  );
}
