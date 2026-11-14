import React, { useEffect, useRef } from 'react';
import {
  CollisionVertex,
  GasId,
  LabModule,
  Language,
  Particle,
  TelemetrySnapshot,
  WallImpulseRipple,
} from '../types/physics';
import {
  CHAMBER_VOLUME_M3,
  GAS_SPECIES,
  PACKET_MOLES_PER_PARTICLE,
  calcChamberThermodynamics,
  calcCharacteristicSpeeds,
  calcKineticEnergy,
  calcMeanFreePathStats,
  maxwellBoltzmannPDF,
  randNormal,
  rescaleTemperatures,
  resolveElasticCollision,
} from '../utils/physicsMath';
import { TranslationDict } from '../data/i18n';

interface SimulationStageProps {
  activeModule: LabModule;
  language: Language;
  t: TranslationDict;
  isPlaying: boolean;
  simSpeed: number;
  gasId: GasId;
  temperature: number;
  particleCount: number;
  mixTwoGases: boolean;
  showVectors: boolean;
  numberDensityM3: number;
  diameterNm: number;
  effectivePressureAtm: number;
  showCylinder: boolean;
  resetSignal: number;
  monoSignal: number;
  clearTrailSignal: number;
  stepSignal: number;
  onTelemetry: (snap: TelemetrySnapshot) => void;
}

// Physical speed (m/s) -> visual canvas speed (px/s)
const PX_PER_MS = 0.21;

interface WallHitRecord {
  time: number;
  dpPacket: number; // kg * m/s
}

export const SimulationStage: React.FC<SimulationStageProps> = ({
  activeModule,
  language,
  t,
  isPlaying,
  simSpeed,
  gasId,
  temperature,
  particleCount,
  mixTwoGases,
  showVectors,
  numberDensityM3,
  diameterNm,
  effectivePressureAtm,
  showCylinder,
  resetSignal,
  monoSignal,
  clearTrailSignal,
  stepSignal,
  onTelemetry,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable simulation state inside refs for 60fps loop without React re-renders
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<WallImpulseRipple[]>([]);
  const wallHitsRef = useRef<WallHitRecord[]>([]);
  const trailRef = useRef<CollisionVertex[]>([]);
  const totalDistancePxRef = useRef<number>(0);
  const totalCollisionsRef = useRef<number>(0);
  const smoothHistRef = useRef<number[]>(new Array(34).fill(0));
  const simTimeRef = useRef<number>(0);
  const canvasSizeRef = useRef<{ width: number; height: number }>({
    width: 720,
    height: 540,
  });

  // Latest props ref so the RAF loop reads fresh parameters without restarting
  const paramsRef = useRef({
    activeModule,
    language,
    t,
    isPlaying,
    simSpeed,
    gasId,
    temperature,
    particleCount,
    mixTwoGases,
    showVectors,
    numberDensityM3,
    diameterNm,
    effectivePressureAtm,
    showCylinder,
  });

  paramsRef.current = {
    activeModule,
    language,
    t,
    isPlaying,
    simSpeed,
    gasId,
    temperature,
    particleCount,
    mixTwoGases,
    showVectors,
    numberDensityM3,
    diameterNm,
    effectivePressureAtm,
    showCylinder,
  };

  const getChamberBounds = (w: number, h: number, mod: LabModule) => {
    const pad = 16;
    if (mod === 'distribution') {
      const chamberH = Math.max(175, Math.floor(h * 0.36));
      return {
        left: pad,
        top: pad + 26,
        right: w - pad,
        bottom: chamberH,
      };
    }
    return {
      left: pad,
      top: pad + 28,
      right: mod === 'pressure' ? w - pad - 14 : w - pad,
      bottom: h - pad,
    };
  };

  const getMfpTargetCount = (nM3: number) => {
    return Math.max(24, Math.min(250, Math.round(28 + (nM3 / 5e25) * 195)));
  };

  const getMfpRadiusPx = (dNm: number) => {
    return 3.4 + (dNm - 0.2) * 12.5; // 3.4px at 0.20nm -> 8.4px at 0.60nm
  };

  const spawnParticles = (monoEnergetic = false) => {
    const { width, height } = canvasSizeRef.current;
    const p = paramsRef.current;
    const bounds = getChamberBounds(width, height, p.activeModule);
    const usableW = Math.max(120, bounds.right - bounds.left);
    const usableH = Math.max(100, bounds.bottom - bounds.top);

    const targetN =
      p.activeModule === 'mfp' ? getMfpTargetCount(p.numberDensityM3) : p.particleCount;

    const list: Particle[] = [];
    const species = GAS_SPECIES[p.gasId];

    for (let i = 0; i < targetN; i++) {
      let sp = species;
      if (p.activeModule === 'pressure' && p.mixTwoGases) {
        sp = i % 2 === 0 ? GAS_SPECIES.H2 : GAS_SPECIES.O2;
      }

      const radiusPx =
        p.activeModule === 'mfp'
          ? getMfpRadiusPx(p.diameterNm)
          : p.activeModule === 'pressure' && p.mixTwoGases
          ? sp.id === 'H2'
            ? 4.4
            : 7.4
          : 5.5;

      const x = bounds.left + radiusPx + Math.random() * Math.max(10, usableW - 2 * radiusPx);
      const y = bounds.top + radiusPx + Math.random() * Math.max(10, usableH - 2 * radiusPx);

      const M = sp.molarMassG / 1000;
      const sigma = Math.sqrt((8.3144626 * p.temperature) / M);

      let vx: number;
      let vy: number;
      let vz: number;

      if (monoEnergetic) {
        const crms = Math.sqrt((3 * 8.3144626 * p.temperature) / M);
        const theta = Math.random() * Math.PI * 2;
        const cosPhi = 2 * Math.random() - 1;
        const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
        vx = crms * sinPhi * Math.cos(theta);
        vy = crms * sinPhi * Math.sin(theta);
        vz = crms * cosPhi;
      } else {
        vx = randNormal() * sigma;
        vy = randNormal() * sigma;
        vz = randNormal() * sigma;
      }

      list.push({
        x,
        y,
        vx,
        vy,
        vz,
        radiusPx,
        massG: sp.molarMassG,
        gasId: sp.id,
        isTracer: p.activeModule === 'mfp' && i === 0,
      });
    }

    particlesRef.current = list;
    ripplesRef.current = [];
    wallHitsRef.current = [];
    totalDistancePxRef.current = 0;
    totalCollisionsRef.current = 0;
    smoothHistRef.current.fill(0);

    if (p.activeModule === 'mfp' && list.length > 0) {
      // Place tracer near center
      list[0].x = (bounds.left + bounds.right) / 2;
      list[0].y = (bounds.top + bounds.bottom) / 2;
      trailRef.current = [{ x: list[0].x, y: list[0].y, age: 0 }];
    } else {
      trailRef.current = [];
    }
  };

  // Re-initialize on module switch, mix toggle, or explicit reset
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(420, container.clientHeight);
      canvasSizeRef.current = { width: w, height: h };
    }
    spawnParticles(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, mixTwoGases, resetSignal]);

  // Mono-energetic start trigger for Module 2
  useEffect(() => {
    if (monoSignal > 0 && activeModule === 'distribution') {
      spawnParticles(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monoSignal]);

  // Clear trail trigger for Module 3
  useEffect(() => {
    if (clearTrailSignal > 0 && activeModule === 'mfp') {
      const tracer = particlesRef.current[0];
      totalDistancePxRef.current = 0;
      totalCollisionsRef.current = 0;
      trailRef.current = tracer ? [{ x: tracer.x, y: tracer.y, age: 0 }] : [];
    }
  }, [clearTrailSignal, activeModule]);

  // Update particle species when gasId changes without losing positions
  useEffect(() => {
    if (activeModule === 'pressure' && mixTwoGases) return;
    const sp = GAS_SPECIES[gasId];
    const parts = particlesRef.current;
    for (let i = 0; i < parts.length; i++) {
      parts[i].gasId = sp.id;
      parts[i].massG = sp.molarMassG;
    }
    rescaleTemperatures(parts, temperature);
    smoothHistRef.current.fill(0);
  }, [gasId, activeModule, mixTwoGases, temperature]);

  // Update temperature smoothly via velocity rescaling
  useEffect(() => {
    rescaleTemperatures(particlesRef.current, temperature);
    smoothHistRef.current.fill(0);
  }, [temperature]);

  // Update particle diameter in Module 3
  useEffect(() => {
    if (activeModule !== 'mfp') return;
    const r = getMfpRadiusPx(diameterNm);
    for (let i = 0; i < particlesRef.current.length; i++) {
      particlesRef.current[i].radiusPx = r;
    }
  }, [diameterNm, activeModule]);

  // Adjust particle count dynamically (for Modules 1 & 2, or Module 3 density)
  useEffect(() => {
    const targetN =
      activeModule === 'mfp' ? getMfpTargetCount(numberDensityM3) : particleCount;
    const parts = particlesRef.current;
    if (parts.length === 0) return;

    if (parts.length > targetN) {
      parts.length = targetN;
    } else if (parts.length < targetN) {
      const { width, height } = canvasSizeRef.current;
      const bounds = getChamberBounds(width, height, activeModule);
      const usableW = Math.max(80, bounds.right - bounds.left);
      const usableH = Math.max(80, bounds.bottom - bounds.top);
      while (parts.length < targetN) {
        const idx = parts.length;
        const sp =
          activeModule === 'pressure' && mixTwoGases
            ? idx % 2 === 0
              ? GAS_SPECIES.H2
              : GAS_SPECIES.O2
            : GAS_SPECIES[gasId];
        const radiusPx =
          activeModule === 'mfp'
            ? getMfpRadiusPx(diameterNm)
            : activeModule === 'pressure' && mixTwoGases
            ? sp.id === 'H2'
              ? 4.4
              : 7.4
            : 5.5;
        const M = sp.molarMassG / 1000;
        const sigma = Math.sqrt((8.3144626 * temperature) / M);
        parts.push({
          x: bounds.left + radiusPx + Math.random() * Math.max(10, usableW - 2 * radiusPx),
          y: bounds.top + radiusPx + Math.random() * Math.max(10, usableH - 2 * radiusPx),
          vx: randNormal() * sigma,
          vy: randNormal() * sigma,
          vz: randNormal() * sigma,
          radiusPx,
          massG: sp.molarMassG,
          gasId: sp.id,
          isTracer: false,
        });
      }
    }
  }, [particleCount, numberDensityM3, activeModule, gasId, mixTwoGases, temperature, diameterNm]);

  // Physics Step Function (used both by RAF loop and manual Step button)
  const stepPhysics = (dtSec: number) => {
    const p = paramsRef.current;
    const { width, height } = canvasSizeRef.current;
    const bounds = getChamberBounds(width, height, p.activeModule);
    const parts = particlesRef.current;
    if (parts.length === 0) return;

    const substeps = 4;
    const subDt = dtSec / substeps;
    const tracer = parts[0];

    // Grid cell size >= max diameter
    let maxR = 8;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].radiusPx > maxR) maxR = parts[i].radiusPx;
    }
    const cellSize = Math.max(18, maxR * 2.4);
    const gridCols = Math.max(1, Math.ceil((bounds.right - bounds.left) / cellSize));
    const gridRows = Math.max(1, Math.ceil((bounds.bottom - bounds.top) / cellSize));
    const grid: number[][] = Array.from({ length: gridCols * gridRows }, () => []);

    for (let s = 0; s < substeps; s++) {
      simTimeRef.current += subDt;

      // 1. Advance positions & check elastic walls
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        const prevX = pt.x;
        const prevY = pt.y;

        pt.x += pt.vx * PX_PER_MS * subDt;
        pt.y += pt.vy * PX_PER_MS * subDt;

        if (pt.isTracer && p.activeModule === 'mfp') {
          const stepDist = Math.hypot(pt.x - prevX, pt.y - prevY);
          totalDistancePxRef.current += stepDist;
        }

        // Wall reflections
        let bouncedWall = false;
        if (pt.x - pt.radiusPx < bounds.left) {
          pt.x = bounds.left + pt.radiusPx;
          pt.vx = Math.abs(pt.vx);
          bouncedWall = true;
        } else if (pt.x + pt.radiusPx > bounds.right) {
          pt.x = bounds.right - pt.radiusPx;
          const impactVx = Math.abs(pt.vx);
          pt.vx = -impactVx;
          bouncedWall = true;

          // Record right sensor wall impulse in Module 1
          if (p.activeModule === 'pressure') {
            const mPacketKg = (pt.massG / 1000) * PACKET_MOLES_PER_PARTICLE;
            const dpPacket = 2 * mPacketKg * impactVx;
            wallHitsRef.current.push({
              time: simTimeRef.current,
              dpPacket,
            });
            ripplesRef.current.push({
              y: pt.y,
              age: 0,
              maxAge: 0.35,
              dp: impactVx,
              color:
                p.mixTwoGases && pt.gasId === 'O2'
                  ? '#e11d48'
                  : p.mixTwoGases && pt.gasId === 'H2'
                  ? '#0284c7'
                  : '#059669',
            });
          }
        }

        if (pt.y - pt.radiusPx < bounds.top) {
          pt.y = bounds.top + pt.radiusPx;
          pt.vy = Math.abs(pt.vy);
          bouncedWall = true;
        } else if (pt.y + pt.radiusPx > bounds.bottom) {
          pt.y = bounds.bottom - pt.radiusPx;
          pt.vy = -Math.abs(pt.vy);
          bouncedWall = true;
        }

        if (bouncedWall && pt.isTracer && p.activeModule === 'mfp') {
          trailRef.current.push({ x: pt.x, y: pt.y, isWall: true, age: 0 });
          if (trailRef.current.length > 220) trailRef.current.shift();
        }
      }

      // 2. Spatial grid collision detection
      for (let c = 0; c < grid.length; c++) grid[c].length = 0;

      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        const cx = Math.max(
          0,
          Math.min(gridCols - 1, Math.floor((pt.x - bounds.left) / cellSize))
        );
        const cy = Math.max(
          0,
          Math.min(gridRows - 1, Math.floor((pt.y - bounds.top) / cellSize))
        );
        grid[cy * gridCols + cx].push(i);
      }

      for (let cy = 0; cy < gridRows; cy++) {
        for (let cx = 0; cx < gridCols; cx++) {
          const cellIndices = grid[cy * gridCols + cx];
          for (let aIdx = 0; aIdx < cellIndices.length; aIdx++) {
            const i = cellIndices[aIdx];
            const pa = parts[i];

            // Neighbor cells (right, bottom-left, bottom, bottom-right, and current)
            for (let dy = 0; dy <= 1; dy++) {
              const ny = cy + dy;
              if (ny >= gridRows) continue;
              const startDx = dy === 0 ? 0 : -1;
              for (let dx = startDx; dx <= 1; dx++) {
                const nx = cx + dx;
                if (nx < 0 || nx >= gridCols) continue;
                const neighborIndices = grid[ny * gridCols + nx];
                const sameCell = dx === 0 && dy === 0;

                for (let bIdx = sameCell ? aIdx + 1 : 0; bIdx < neighborIndices.length; bIdx++) {
                  const j = neighborIndices[bIdx];
                  const pb = parts[j];
                  const collided = resolveElasticCollision(pa, pb, true);
                  if (
                    collided &&
                    p.activeModule === 'mfp' &&
                    (pa.isTracer || pb.isTracer)
                  ) {
                    totalCollisionsRef.current += 1;
                    trailRef.current.push({
                      x: tracer.x,
                      y: tracer.y,
                      isWall: false,
                      age: 0,
                    });
                    if (trailRef.current.length > 220) {
                      trailRef.current.shift();
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Age ripples & prune old wall hit records (> 2.5s rolling window)
    const ripples = ripplesRef.current;
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].age += dtSec;
      if (ripples[i].age >= ripples[i].maxAge) {
        ripples.splice(i, 1);
      }
    }

    const cutoff = simTimeRef.current - 3.5;
    while (wallHitsRef.current.length > 0 && wallHitsRef.current[0].time < cutoff) {
      wallHitsRef.current.shift();
    }
  };

  // Manual step handler
  useEffect(() => {
    if (stepSignal > 0 && !isPlaying) {
      stepPhysics(0.016 * simSpeed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepSignal]);

  // High-DPI ResizeObserver + main 60 FPS requestAnimationFrame loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(container.clientWidth));
      const h = Math.max(420, Math.floor(container.clientHeight));
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      canvasSizeRef.current = { width: w, height: h };

      // Keep particles inside updated chamber bounds
      const b = getChamberBounds(w, h, paramsRef.current.activeModule);
      const parts = particlesRef.current;
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        pt.x = Math.min(b.right - pt.radiusPx, Math.max(b.left + pt.radiusPx, pt.x));
        pt.y = Math.min(b.bottom - pt.radiusPx, Math.max(b.top + pt.radiusPx, pt.y));
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let lastTelemetryTime = 0;

    const drawArrow = (
      ctx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 3) return;
      const angle = Math.atan2(dy, dx);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const headLen = 5;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - 0.5), y2 - headLen * Math.sin(angle - 0.5));
      ctx.lineTo(x2 - headLen * Math.cos(angle + 0.5), y2 - headLen * Math.sin(angle + 0.5));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const renderFrame = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const p = paramsRef.current;
      if (p.isPlaying) {
        stepPhysics(rawDt * p.simSpeed);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width: w, height: h } = canvasSizeRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const bounds = getChamberBounds(w, h, p.activeModule);
      const chamberW = bounds.right - bounds.left;
      const chamberH = bounds.bottom - bounds.top;

      // Top Stage Header inside Canvas
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 13px "Plus Jakarta Sans", "Noto Sans Bengali", sans-serif';
      const stageHeader =
        p.activeModule === 'pressure'
          ? p.t.module1.stageTitle
          : p.activeModule === 'distribution'
          ? p.t.module2.chamberTitle
          : p.t.module3.stageTitle;
      ctx.fillText(stageHeader, bounds.left, 28);

      // Chamber Background & Grid
      ctx.fillStyle = '#f8fcff';
      ctx.fillRect(bounds.left, bounds.top, chamberW, chamberH);

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      const gridStep = 40;
      ctx.beginPath();
      for (let gx = bounds.left + gridStep; gx < bounds.right; gx += gridStep) {
        ctx.moveTo(gx, bounds.top);
        ctx.lineTo(gx, bounds.bottom);
      }
      for (let gy = bounds.top + gridStep; gy < bounds.bottom; gy += gridStep) {
        ctx.moveTo(bounds.left, gy);
        ctx.lineTo(bounds.right, gy);
      }
      ctx.stroke();

      const parts = particlesRef.current;
      const species = GAS_SPECIES[p.gasId];
      const { cmp, cavg, crms } = calcCharacteristicSpeeds(p.temperature, species.molarMassG);

      // MODULE 3: Collision Cylinder & Zig-Zag Trail behind particles
      if (p.activeModule === 'mfp' && parts.length > 0) {
        const tracer = parts[0];
        const trail = trailRef.current;
        const collDiameterPx = tracer.radiusPx * 2;

        // Optional Collision Cylinder (pi * d^2 swept cross-section)
        if (p.showCylinder && trail.length > 0) {
          ctx.save();
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.14)';
          ctx.lineWidth = collDiameterPx * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
          }
          ctx.lineTo(tracer.x, tracer.y);
          ctx.stroke();

          // Effective exclusion circle around tracer
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.45)';
          ctx.lineWidth = 1.25;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(tracer.x, tracer.y, collDiameterPx, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Zig-Zag Free Path Lines
        if (trail.length > 0) {
          ctx.save();
          for (let i = 0; i < trail.length; i++) {
            const p1 = trail[i];
            const p2 = i + 1 < trail.length ? trail[i + 1] : tracer;
            const alpha = Math.max(0.2, (i + 1) / (trail.length + 1));
            ctx.strokeStyle = `rgba(225, 29, 72, ${0.25 + alpha * 0.65})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }

          // Impact vertices
          for (let i = 1; i < trail.length; i++) {
            const pt = trail[i];
            if (pt.isWall) continue;
            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Draw Particles
      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        let fill = species.color;
        let stroke = species.strokeColor;

        if (p.activeModule === 'pressure' && p.mixTwoGases) {
          const sp = GAS_SPECIES[pt.gasId];
          fill = sp.color;
          stroke = sp.strokeColor;
        } else if (p.activeModule === 'distribution') {
          const speed = Math.hypot(pt.vx, pt.vy, pt.vz);
          if (speed < 0.7 * cavg) {
            fill = '#0ea5e9'; // Cool Cyan (slow)
            stroke = '#0284c7';
          } else if (speed <= 1.3 * cavg) {
            fill = '#059669'; // Emerald (near average)
            stroke = '#047857';
          } else {
            fill = '#e11d48'; // Crimson (high speed tail)
            stroke = '#be123c';
          }
        } else if (p.activeModule === 'mfp') {
          if (pt.isTracer) {
            fill = '#e11d48';
            stroke = '#9f1239';
          } else {
            fill = 'rgba(2, 132, 199, 0.38)';
            stroke = '#0369a1';
          }
        }

        // Tracer outer halo in Module 3
        if (pt.isTracer && p.activeModule === 'mfp') {
          ctx.save();
          ctx.strokeStyle = 'rgba(225, 29, 72, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radiusPx + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Subtle specular highlight
        if (!pt.isTracer && p.activeModule !== 'mfp') {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.arc(
            pt.x - pt.radiusPx * 0.3,
            pt.y - pt.radiusPx * 0.3,
            pt.radiusPx * 0.28,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Optional velocity vectors in Module 1
        if (p.activeModule === 'pressure' && p.showVectors && i < 120) {
          const vecScale = 0.028;
          drawArrow(
            ctx,
            pt.x,
            pt.y,
            pt.x + pt.vx * vecScale,
            pt.y + pt.vy * vecScale,
            'rgba(15, 23, 42, 0.45)'
          );
        }
      }

      // Chamber Borders
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(bounds.left, bounds.top, chamberW, chamberH);

      // MODULE 1: Right Wall Pressure Impulse Sensor Strip & Ripples
      if (p.activeModule === 'pressure') {
        const sensorX = bounds.right;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sensorX, bounds.top, 12, chamberH);

        // Sensor ticks
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        for (let ty = bounds.top + 12; ty < bounds.bottom - 8; ty += 16) {
          ctx.beginPath();
          ctx.moveTo(sensorX + 2, ty);
          ctx.lineTo(sensorX + 10, ty);
          ctx.stroke();
        }

        // Impulse ripples & flash arrows
        for (let i = 0; i < ripplesRef.current.length; i++) {
          const rp = ripplesRef.current[i];
          const progress = rp.age / rp.maxAge;
          const alpha = 1 - progress;
          const span = 6 + progress * 22;

          ctx.save();
          ctx.strokeStyle = rp.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sensorX + 1, Math.max(bounds.top, rp.y - span));
          ctx.lineTo(sensorX + 1, Math.min(bounds.bottom, rp.y + span));
          ctx.stroke();

          // Flash glow disc
          ctx.fillStyle = rp.color;
          ctx.globalAlpha = alpha * 0.45;
          ctx.beginPath();
          ctx.arc(sensorX, rp.y, 4 + progress * 10, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
          ctx.restore();
        }

        // Sensor label rotated or at top-right
        ctx.fillStyle = '#0369a1';
        ctx.font = '700 11px "IBM Plex Mono", "Noto Sans Bengali", monospace';
        const sensorText = p.t.module1.sensorWallLabel;
        const textW = ctx.measureText(sensorText).width;
        ctx.fillText(sensorText, bounds.right - textW + 10, 28);

        // Dual-gas inline legend at bottom-left of chamber
        if (p.mixTwoGases) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(bounds.left + 8, bounds.top + 8, 226, 26);
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1;
          ctx.strokeRect(bounds.left + 8, bounds.top + 8, 226, 26);

          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(bounds.left + 22, bounds.top + 21, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = '600 11px "Plus Jakarta Sans", monospace';
          ctx.fillText('H₂ (2 g/mol)', bounds.left + 32, bounds.top + 25);

          ctx.fillStyle = '#e11d48';
          ctx.beginPath();
          ctx.arc(bounds.left + 122, bounds.top + 21, 6.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillText('O₂ (32 g/mol)', bounds.left + 134, bounds.top + 25);
        }
      }

      // MODULE 2: Chamber Legend & Maxwell-Boltzmann Live Histogram + Curve
      if (p.activeModule === 'distribution') {
        // Compact inline color legend inside top-right of chamber
        ctx.save();
        ctx.font = '600 10.5px "Plus Jakarta Sans", "Noto Sans Bengali", sans-serif';
        const items = [
          { color: '#0ea5e9', label: p.t.module2.slowLabel },
          { color: '#059669', label: p.t.module2.avgLabel },
          { color: '#e11d48', label: p.t.module2.fastLabel },
        ];
        const itemWidths = items.map((it) => ctx.measureText(it.label).width + 20);
        const totalLegendW = itemWidths.reduce((a, b) => a + b, 0) + 12;
        const boxX = Math.max(bounds.left + 6, bounds.right - totalLegendW - 6);
        const boxY = bounds.top + 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(boxX, boxY, totalLegendW, 22);
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, totalLegendW, 22);

        let lx = boxX + 10;
        for (let i = 0; i < items.length; i++) {
          ctx.fillStyle = items[i].color;
          ctx.beginPath();
          ctx.arc(lx + 3, boxY + 11, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillText(items[i].label, lx + 11, boxY + 15);
          lx += itemWidths[i];
        }
        ctx.restore();

        // Bottom Plot Area
        const plotTop = bounds.bottom + 34;
        const plotLeft = 64;
        const plotRight = w - 26;
        const plotBottom = h - 42;
        const plotW = Math.max(160, plotRight - plotLeft);
        const plotH = Math.max(120, plotBottom - plotTop);

        // Plot Title
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px "Plus Jakarta Sans", "Noto Sans Bengali", sans-serif';
        ctx.fillText(p.t.module2.plotTitle, bounds.left, bounds.bottom + 20);

        // Fixed vMax and yMax per gas species so changing T clearly shifts & flattens curve!
        const crmsAt1000 = calcCharacteristicSpeeds(1000, species.molarMassG).crms;
        const vMax = Math.ceil((crmsAt1000 * 1.75) / 400) * 400;
        const cmpAt150 = calcCharacteristicSpeeds(150, species.molarMassG).cmp;
        const yMax = maxwellBoltzmannPDF(cmpAt150, 150, species.molarMassG) * 1.08;

        // Plot Background & Grid
        ctx.fillStyle = '#f8fcff';
        ctx.fillRect(plotLeft, plotTop, plotW, plotH);
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1;
        for (let gy = 0; gy <= 4; gy++) {
          const py = plotTop + (gy / 4) * plotH;
          ctx.beginPath();
          ctx.moveTo(plotLeft, py);
          ctx.lineTo(plotRight, py);
          ctx.stroke();
        }

        // Compute live histogram bins from simulated particles
        const numBins = 34;
        const binWidth = vMax / numBins;
        const rawBins = new Array(numBins).fill(0);
        for (let i = 0; i < parts.length; i++) {
          const spd = Math.hypot(parts[i].vx, parts[i].vy, parts[i].vz);
          const b = Math.min(numBins - 1, Math.floor(spd / binWidth));
          if (b >= 0) rawBins[b] += 1;
        }

        // Convert counts to PDF f(v) = count / (N * dv) & apply gentle temporal smoothing
        const smoothBins = smoothHistRef.current;
        for (let b = 0; b < numBins; b++) {
          const pdfVal = parts.length > 0 ? rawBins[b] / (parts.length * binWidth) : 0;
          smoothBins[b] = smoothBins[b] === 0 ? pdfVal : smoothBins[b] * 0.72 + pdfVal * 0.28;
        }

        // Draw Histogram Bars
        const barPxW = plotW / numBins;
        for (let b = 0; b < numBins; b++) {
          const vCenter = (b + 0.5) * binWidth;
          const barH = Math.min(plotH, (smoothBins[b] / yMax) * plotH);
          const bx = plotLeft + b * barPxW;
          const by = plotBottom - barH;

          if (vCenter < 0.7 * cavg) {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
            ctx.strokeStyle = 'rgba(2, 132, 199, 0.6)';
          } else if (vCenter <= 1.3 * cavg) {
            ctx.fillStyle = 'rgba(5, 150, 105, 0.35)';
            ctx.strokeStyle = 'rgba(4, 120, 87, 0.6)';
          } else {
            ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
            ctx.strokeStyle = 'rgba(190, 18, 60, 0.6)';
          }

          if (barH > 0.5) {
            ctx.fillRect(bx + 1, by, Math.max(1, barPxW - 2), barH);
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 1, by, Math.max(1, barPxW - 2), barH);
          }
        }

        // Draw Smooth Theoretical Maxwell-Boltzmann Curve
        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const steps = 160;
        for (let i = 0; i <= steps; i++) {
          const v = (i / steps) * vMax;
          const fv = maxwellBoltzmannPDF(v, p.temperature, species.molarMassG);
          const px = plotLeft + (v / vMax) * plotW;
          const py = plotBottom - Math.min(plotH, (fv / yMax) * plotH);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        // Draw Three Characteristic Speed Vertical Marker Lines
        const markers = [
          {
            v: cmp,
            label: `c_mp = ${Math.round(cmp)}`,
            color: '#d97706',
            dashed: true,
            yOffset: 16,
          },
          {
            v: cavg,
            label: `c̄ = ${Math.round(cavg)}`,
            color: '#059669',
            dashed: true,
            yOffset: 34,
          },
          {
            v: crms,
            label: `c_rms = ${Math.round(crms)}`,
            color: '#dc2626',
            dashed: false,
            yOffset: 52,
          },
        ];

        markers.forEach((m) => {
          if (m.v > vMax) return;
          const mx = plotLeft + (m.v / vMax) * plotW;
          const fvAtM = maxwellBoltzmannPDF(m.v, p.temperature, species.molarMassG);
          const topY = plotBottom - Math.min(plotH, (fvAtM / yMax) * plotH);

          ctx.save();
          ctx.strokeStyle = m.color;
          ctx.lineWidth = m.dashed ? 2 : 2.25;
          if (m.dashed) ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(mx, plotBottom);
          ctx.lineTo(mx, Math.min(topY, plotTop + m.yOffset + 4));
          ctx.stroke();

          // Dot on curve
          ctx.setLineDash([]);
          ctx.fillStyle = m.color;
          ctx.beginPath();
          ctx.arc(mx, topY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Label tag
          ctx.font = '700 11px "IBM Plex Mono", monospace';
          const lblW = ctx.measureText(m.label).width + 10;
          const lblX = Math.min(plotRight - lblW - 2, mx + 4);
          const lblY = plotTop + m.yOffset - 12;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.fillRect(lblX, lblY, lblW, 17);
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(lblX, lblY, lblW, 17);
          ctx.fillStyle = m.color;
          ctx.fillText(m.label, lblX + 5, lblY + 12);
          ctx.restore();
        });

        // Axes Border & Tick Labels
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plotLeft, plotTop);
        ctx.lineTo(plotLeft, plotBottom);
        ctx.lineTo(plotRight, plotBottom);
        ctx.stroke();

        // X-axis Ticks
        ctx.fillStyle = '#334155';
        ctx.font = '500 11px "IBM Plex Mono", monospace';
        const xTicks = 5;
        for (let i = 0; i <= xTicks; i++) {
          const val = Math.round((i / xTicks) * vMax);
          const tx = plotLeft + (i / xTicks) * plotW;
          ctx.beginPath();
          ctx.moveTo(tx, plotBottom);
          ctx.lineTo(tx, plotBottom + 5);
          ctx.stroke();
          const txt = `${val}`;
          const tw = ctx.measureText(txt).width;
          ctx.fillText(txt, tx - tw / 2, plotBottom + 18);
        }

        // Axis Titles
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 11px "Plus Jakarta Sans", "Noto Sans Bengali", sans-serif';
        const xTitle = p.t.module2.xAxisLabel;
        ctx.fillText(xTitle, plotLeft + plotW / 2 - ctx.measureText(xTitle).width / 2, h - 6);

        ctx.save();
        ctx.translate(16, plotTop + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        const yTitle = p.t.module2.yAxisLabel;
        ctx.fillText(yTitle, -ctx.measureText(yTitle).width / 2, 0);
        ctx.restore();
      }

      // MODULE 3: Top-right inline legend inside chamber
      if (p.activeModule === 'mfp') {
        ctx.save();
        ctx.font = '600 10.5px "Plus Jakarta Sans", "Noto Sans Bengali", sans-serif';
        const items = [
          { color: '#e11d48', label: p.t.module3.tracerLegend },
          { color: '#0284c7', label: p.t.module3.bgLegend },
          { color: '#f59e0b', label: p.t.module3.collisionDot },
        ];
        const itemWidths = items.map((it) => ctx.measureText(it.label).width + 20);
        const totalLegendW = itemWidths.reduce((a, b) => a + b, 0) + 12;
        const boxX = Math.max(bounds.left + 6, bounds.right - totalLegendW - 6);
        const boxY = bounds.top + 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(boxX, boxY, totalLegendW, 22);
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, totalLegendW, 22);

        let lx = boxX + 10;
        for (let i = 0; i < items.length; i++) {
          ctx.fillStyle = items[i].color;
          ctx.beginPath();
          ctx.arc(lx + 3, boxY + 11, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillText(items[i].label, lx + 11, boxY + 15);
          lx += itemWidths[i];
        }
        ctx.restore();
      }

      ctx.restore();

      // Throttled Telemetry Snapshot (~15 Hz)
      if (now - lastTelemetryTime > 66) {
        lastTelemetryTime = now;
        const thermo = calcChamberThermodynamics(parts, p.temperature);
        const ek = calcKineticEnergy(p.temperature);

        // Measured wall pressure from rolling 3.5s impulse buffer
        const windowSec = Math.min(3.5, Math.max(0.4, simTimeRef.current));
        let sumDp = 0;
        for (let i = 0; i < wallHitsRef.current.length; i++) {
          sumDp += wallHitsRef.current[i].dpPacket;
        }
        // Physical chamber side length L_x = V^(1/3) = 0.1 m; A_wall = V^(2/3) = 0.01 m^2
        const chamberLengthM = Math.cbrt(CHAMBER_VOLUME_M3);
        const wallAreaM2 = Math.pow(CHAMBER_VOLUME_M3, 2 / 3);
        // Convert canvas hit rate (px/s) to physical wall collision rate (m/s)
        const rateScale = chamberW / (chamberLengthM * PX_PER_MS);
        const avgForceN = (sumDp / windowSec) * rateScale;
        const measuredPressurePa = avgForceN / wallAreaM2;
        const wallHitsPerSec = wallHitsRef.current.length / windowSec;

        // Dual gas speeds
        let h2SumV2 = 0;
        let h2Count = 0;
        let o2SumV2 = 0;
        let o2Count = 0;
        let sumV = 0;
        let sumV2 = 0;
        const speedsList: number[] = [];

        for (let i = 0; i < parts.length; i++) {
          const pt = parts[i];
          const v2 = pt.vx * pt.vx + pt.vy * pt.vy + pt.vz * pt.vz;
          const v = Math.sqrt(v2);
          sumV += v;
          sumV2 += v2;
          speedsList.push(v);
          if (pt.gasId === 'H2') {
            h2SumV2 += v2;
            h2Count++;
          } else if (pt.gasId === 'O2') {
            o2SumV2 += v2;
            o2Count++;
          }
        }

        const cavgSim = parts.length > 0 ? sumV / parts.length : 0;
        const crmsSim = parts.length > 0 ? Math.sqrt(sumV2 / parts.length) : 0;

        // Estimate simulated c_mp from peak bin
        let cmpSim = cmp;
        if (parts.length > 0) {
          const crms1000 = calcCharacteristicSpeeds(1000, species.molarMassG).crms;
          const vMax = Math.ceil((crms1000 * 1.75) / 400) * 400;
          const bCount = 24;
          const bSize = vMax / bCount;
          const counts = new Array(bCount).fill(0);
          for (let i = 0; i < speedsList.length; i++) {
            const idx = Math.min(bCount - 1, Math.floor(speedsList[i] / bSize));
            if (idx >= 0) counts[idx]++;
          }
          let maxBin = 0;
          for (let b = 1; b < bCount; b++) {
            if (counts[b] > counts[maxBin]) maxBin = b;
          }
          cmpSim = (maxBin + 0.5) * bSize;
        }

        // Module 3: 2D-to-3D calibrated physical scale with Enskog excluded-area factor
        const mfpTheory = calcMeanFreePathStats(p.numberDensityM3, p.diameterNm, cavg);
        const tracerRadiusPx = getMfpRadiusPx(p.diameterNm);
        const dPx = tracerRadiusPx * 2;
        const areaPx = Math.max(1000, chamberW * chamberH);
        const eta = (parts.length * Math.PI * tracerRadiusPx * tracerRadiusPx) / areaPx;
        const enskog2D = (1 - (7 * eta) / 16) / Math.pow(Math.max(0.25, 1 - eta), 2);
        const lambda2DPx = areaPx / (2 * Math.SQRT2 * Math.max(1, parts.length) * dPx * enskog2D);
        const nmPerPx = mfpTheory.lambdaNm / lambda2DPx;

        const totalDistanceNm = totalDistancePxRef.current * nmPerPx;
        const totalCollisions = totalCollisionsRef.current;
        const lambdaExpNm = totalCollisions > 0 ? totalDistanceNm / totalCollisions : 0;

        onTelemetry({
          theoreticalPressureKpa: thermo.pressureKpa,
          measuredPressureKpa: measuredPressurePa / 1000,
          densityKgM3: thermo.densityKgM3,
          wallHitsPerSec,
          momentumTransferRate: avgForceN,
          ekMoleculeJ: ek.perMoleculeJ,
          ekMoleKJ: ek.perMoleKJ,
          h2Crms: h2Count > 0 ? Math.sqrt(h2SumV2 / h2Count) : calcCharacteristicSpeeds(p.temperature, 2).crms,
          o2Crms: o2Count > 0 ? Math.sqrt(o2SumV2 / o2Count) : calcCharacteristicSpeeds(p.temperature, 32).crms,
          h2EkJ: ek.perMoleculeJ,
          o2EkJ: ek.perMoleculeJ,
          cmpTheory: cmp,
          cavgTheory: cavg,
          crmsTheory: crms,
          cmpSim,
          cavgSim,
          crmsSim,
          totalDistanceNm,
          totalCollisions,
          lambdaExpNm,
          lambdaTheoryNm: mfpTheory.lambdaNm,
          lambdaClausiusNm: mfpTheory.clausiusNm,
          collisionFreqGHz: mfpTheory.collisionFreqGHz,
          meanFreeTimePs: mfpTheory.meanFreeTimePs,
          numberDensityM3: p.numberDensityM3,
          effectivePressureAtm: p.effectivePressureAtm,
        });
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={containerRef}
      className={`w-full lg:flex-1 min-w-0 ${
        activeModule === 'distribution'
          ? 'h-[540px] lg:h-[620px]'
          : 'h-[450px] lg:h-[530px]'
      } bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl overflow-hidden relative`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </section>
  );
};
