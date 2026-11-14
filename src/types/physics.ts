export type LabModule = 'pressure' | 'distribution' | 'mfp';

export type Language = 'bn' | 'en';

export type GasId = 'H2' | 'He' | 'N2' | 'O2' | 'CO2';

export type MfpMode = 'density' | 'thermo';

export interface GasSpecies {
  id: GasId;
  formula: string;
  nameEn: string;
  nameBn: string;
  molarMassG: number; // g/mol
  diameterNm: number; // effective kinetic diameter in nm
  color: string;
  strokeColor: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number; // physical m/s
  vy: number; // physical m/s
  vz: number; // physical m/s (for exact 3D Maxwell-Boltzmann equilibration)
  radiusPx: number;
  massG: number; // g/mol
  gasId: GasId;
  isTracer?: boolean;
}

export interface WallImpulseRipple {
  y: number;
  age: number; // seconds
  maxAge: number;
  dp: number; // relative impulse magnitude
  color: string;
}

export interface CollisionVertex {
  x: number;
  y: number;
  isWall?: boolean;
  age: number;
}

export interface TelemetrySnapshot {
  // Module 1
  theoreticalPressureKpa: number;
  measuredPressureKpa: number;
  densityKgM3: number;
  wallHitsPerSec: number;
  momentumTransferRate: number; // N (kg*m/s^2) on sensor wall
  ekMoleculeJ: number;
  ekMoleKJ: number;
  // Dual gas breakdown
  h2Crms: number;
  o2Crms: number;
  h2EkJ: number;
  o2EkJ: number;
  // Module 2
  cmpTheory: number;
  cavgTheory: number;
  crmsTheory: number;
  cmpSim: number;
  cavgSim: number;
  crmsSim: number;
  // Module 3
  totalDistanceNm: number;
  totalCollisions: number;
  lambdaExpNm: number;
  lambdaTheoryNm: number;
  lambdaClausiusNm: number;
  collisionFreqGHz: number;
  meanFreeTimePs: number;
  numberDensityM3: number;
  effectivePressureAtm: number;
}
