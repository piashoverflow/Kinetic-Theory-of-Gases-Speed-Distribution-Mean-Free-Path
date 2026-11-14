import { GasId, GasSpecies, Particle } from '../types/physics';

// Exact CODATA 2018/2022 Fundamental Physical Constants
export const R_GAS = 8.3144626; // J / (mol * K)
export const K_B = 1.380649e-23; // J / K
export const N_A = 6.02214076e23; // mol^-1

export const GAS_SPECIES: Record<GasId, GasSpecies> = {
  H2: {
    id: 'H2',
    formula: 'H₂',
    nameEn: 'Hydrogen',
    nameBn: 'হাইড্রোজেন',
    molarMassG: 2,
    diameterNm: 0.29,
    color: '#0284c7',
    strokeColor: '#0369a1',
  },
  He: {
    id: 'He',
    formula: 'He',
    nameEn: 'Helium',
    nameBn: 'হিলিয়াম',
    molarMassG: 4,
    diameterNm: 0.26,
    color: '#0d9488',
    strokeColor: '#0f766e',
  },
  N2: {
    id: 'N2',
    formula: 'N₂',
    nameEn: 'Nitrogen',
    nameBn: 'নাইট্রোজেন',
    molarMassG: 28,
    diameterNm: 0.37,
    color: '#2563eb',
    strokeColor: '#1d4ed8',
  },
  O2: {
    id: 'O2',
    formula: 'O₂',
    nameEn: 'Oxygen',
    nameBn: 'অক্সিজেন',
    molarMassG: 32,
    diameterNm: 0.36,
    color: '#e11d48',
    strokeColor: '#be123c',
  },
  CO2: {
    id: 'CO2',
    formula: 'CO₂',
    nameEn: 'Carbon Dioxide',
    nameBn: 'কার্বন ডাই-অক্সাইড',
    molarMassG: 44,
    diameterNm: 0.45,
    color: '#d97706',
    strokeColor: '#b45309',
  },
};

export const GAS_LIST: GasSpecies[] = [
  GAS_SPECIES.H2,
  GAS_SPECIES.He,
  GAS_SPECIES.N2,
  GAS_SPECIES.O2,
  GAS_SPECIES.CO2,
];

/**
 * Box-Muller standard normal sample N(0, 1)
 */
export function randNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Characteristic speeds in m/s for 3D Maxwell-Boltzmann gas
 */
export function calcCharacteristicSpeeds(T: number, molarMassG: number) {
  const M = molarMassG / 1000; // kg/mol
  const rtOverM = (R_GAS * T) / M;
  return {
    cmp: Math.sqrt(2 * rtOverM),
    cavg: Math.sqrt((8 / Math.PI) * rtOverM),
    crms: Math.sqrt(3 * rtOverM),
  };
}

/**
 * 3D Maxwell-Boltzmann speed probability density f(v) in (s/m)
 */
export function maxwellBoltzmannPDF(v: number, T: number, molarMassG: number): number {
  const M = molarMassG / 1000; // kg/mol
  const a = M / (2 * R_GAS * T);
  return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v);
}

/**
 * Translational kinetic energy per molecule (J) and per mole (kJ/mol)
 */
export function calcKineticEnergy(T: number) {
  return {
    perMoleculeJ: 1.5 * K_B * T,
    perMoleKJ: (1.5 * R_GAS * T) / 1000,
  };
}

/**
 * Macroscopic pressure and mass density for Module 1 chamber
 * Uses a calibrated 1.0 L (1e-3 m^3) thermal sample where each simulated particle
 * represents a packet of 0.0004 mol so N=250 corresponds to n = 0.10 mol.
 */
export const PACKET_MOLES_PER_PARTICLE = 0.0004;
export const CHAMBER_VOLUME_M3 = 0.001; // 1.0 Liter

export function calcChamberThermodynamics(
  particles: Particle[],
  T: number
): {
  pressureKpa: number;
  densityKgM3: number;
  totalMassKg: number;
  meanCrms: number;
} {
  if (particles.length === 0) {
    return { pressureKpa: 0, densityKgM3: 0, totalMassKg: 0, meanCrms: 0 };
  }
  let totalMassKg = 0;
  let sumMassV2 = 0;
  let sumV2 = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const mPacketKg = (p.massG / 1000) * PACKET_MOLES_PER_PARTICLE;
    const v2 = p.vx * p.vx + p.vy * p.vy + p.vz * p.vz;
    totalMassKg += mPacketKg;
    sumMassV2 += mPacketKg * v2;
    sumV2 += v2;
  }
  const densityKgM3 = totalMassKg / CHAMBER_VOLUME_M3;
  // Theoretical ideal gas pressure P = (N_packets * R * T) / V
  const nMolesTotal = particles.length * PACKET_MOLES_PER_PARTICLE;
  const pressurePa = (nMolesTotal * R_GAS * T) / CHAMBER_VOLUME_M3;
  // Also sumMassV2 / (3 * V) equals P when equilibrated
  void sumMassV2;
  return {
    pressureKpa: pressurePa / 1000,
    densityKgM3,
    totalMassKg,
    meanCrms: Math.sqrt(sumV2 / particles.length),
  };
}

/**
 * Mean Free Path & Collision Frequency calculations for Module 3
 */
export function calcMeanFreePathStats(
  numberDensityM3: number,
  diameterNm: number,
  cavgMs: number
) {
  const dMeters = diameterNm * 1e-9;
  const crossSection = Math.PI * dMeters * dMeters;
  const lambdaMaxwellM = 1 / (Math.SQRT2 * numberDensityM3 * crossSection);
  const lambdaClausiusM = 1 / (numberDensityM3 * crossSection);
  const collisionFreqHz = cavgMs / lambdaMaxwellM;
  const meanFreeTimeS = 1 / collisionFreqHz;

  return {
    lambdaNm: lambdaMaxwellM * 1e9,
    clausiusNm: lambdaClausiusM * 1e9,
    collisionFreqGHz: collisionFreqHz / 1e9,
    meanFreeTimePs: meanFreeTimeS * 1e12,
  };
}

/**
 * Resolve 2D elastic hard-sphere collision between two particles with 3D (t, z)
 * thermal energy mixing so both 3D momentum & 3D kinetic energy are conserved to
 * machine precision and the speed distribution naturally relaxes to exact 3D Maxwell-Boltzmann.
 * Returns true if an elastic impulse actually occurred.
 */
export function resolveElasticCollision(
  a: Particle,
  b: Particle,
  mixZComponent: boolean = true
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDist = a.radiusPx + b.radiusPx;
  const distSq = dx * dx + dy * dy;

  if (distSq >= minDist * minDist || distSq < 1e-9) {
    return false;
  }

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;

  // Positional separation (weighted by inverse mass) to eliminate overlap
  const overlap = minDist - dist;
  const invMassA = 1 / a.massG;
  const invMassB = 1 / b.massG;
  const invMassSum = invMassA + invMassB;

  a.x -= nx * overlap * (invMassA / invMassSum);
  a.y -= ny * overlap * (invMassA / invMassSum);
  b.x += nx * overlap * (invMassB / invMassSum);
  b.y += ny * overlap * (invMassB / invMassSum);

  // Relative velocity v_rel = v_a - v_b
  const rvx = a.vx - b.vx;
  const rvy = a.vy - b.vy;
  const rvz = a.vz - b.vz;

  // Normal projection along center-to-center vector (a -> b)
  const rvn = rvx * nx + rvy * ny;

  // Only apply impulse if particles are approaching (rvn > 0 means a moving toward b)
  if (rvn <= 0) {
    return false;
  }

  // Unit tangent vector in 2D plane
  const tx = -ny;
  const ty = nx;
  const rvt = rvx * tx + rvy * ty;

  // Center-of-mass velocity
  const totalM = a.massG + b.massG;
  const cmx = (a.massG * a.vx + b.massG * b.vx) / totalM;
  const cmy = (a.massG * a.vy + b.massG * b.vy) / totalM;
  const cmz = (a.massG * a.vz + b.massG * b.vz) / totalM;

  // Elastic normal reflection
  const rvnAfter = -rvn;

  // Orthogonal (t, z) plane rotation preserves |v_rel|^2 and total 3D momentum,
  // while coupling z degree of freedom to equilibrate 3D Maxwell-Boltzmann f(v)
  let rvtAfter = rvt;
  let rvzAfter = rvz;
  if (mixZComponent) {
    const angle = (Math.random() - 0.5) * 1.4; // +/- 0.7 rad mixing
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    rvtAfter = rvt * cosA - rvz * sinA;
    rvzAfter = rvt * sinA + rvz * cosA;
  }

  // Reconstruct 2D+z relative velocity
  const rvxAfter = rvnAfter * nx + rvtAfter * tx;
  const rvyAfter = rvnAfter * ny + rvtAfter * ty;

  const weightA = b.massG / totalM;
  const weightB = a.massG / totalM;

  a.vx = cmx + weightA * rvxAfter;
  a.vy = cmy + weightA * rvyAfter;
  a.vz = cmz + weightA * rvzAfter;

  b.vx = cmx - weightB * rvxAfter;
  b.vy = cmy - weightB * rvyAfter;
  b.vz = cmz - weightB * rvzAfter;

  return true;
}

/**
 * Rescale all particle velocities to match target temperature T exactly (thermostat)
 */
export function rescaleTemperatures(particles: Particle[], targetT: number) {
  if (particles.length === 0) return;
  let currentTotalKE = 0;
  let targetTotalKE = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const mKgMol = p.massG / 1000;
    const v2 = p.vx * p.vx + p.vy * p.vy + p.vz * p.vz;
    currentTotalKE += 0.5 * mKgMol * v2;
    targetTotalKE += 1.5 * R_GAS * targetT;
  }
  if (currentTotalKE < 1e-6) return;
  const scale = Math.sqrt(targetTotalKE / currentTotalKE);
  for (let i = 0; i < particles.length; i++) {
    particles[i].vx *= scale;
    particles[i].vy *= scale;
    particles[i].vz *= scale;
  }
}
