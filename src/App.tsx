import { useState, useMemo, useCallback } from 'react';
import {
  GasId,
  LabModule,
  Language,
  MfpMode,
  TelemetrySnapshot,
} from './types/physics';
import { TRANSLATIONS } from './data/i18n';
import { K_B, calcCharacteristicSpeeds, calcKineticEnergy, calcMeanFreePathStats } from './utils/physicsMath';
import { TopBar } from './components/TopBar';
import { ControlSidebar } from './components/ControlSidebar';
import { SimulationStage } from './components/SimulationStage';
import { TelemetryPanel } from './components/TelemetryPanel';

const DEFAULT_TELEMETRY: TelemetrySnapshot = {
  theoreticalPressureKpa: 249.4,
  measuredPressureKpa: 0,
  densityKgM3: 2.8,
  wallHitsPerSec: 0,
  momentumTransferRate: 0,
  ekMoleculeJ: 6.21e-21,
  ekMoleKJ: 3.74,
  h2Crms: 1934,
  o2Crms: 483,
  h2EkJ: 6.21e-21,
  o2EkJ: 6.21e-21,
  cmpTheory: 422,
  cavgTheory: 476,
  crmsTheory: 517,
  cmpSim: 422,
  cavgSim: 476,
  crmsSim: 517,
  totalDistanceNm: 0,
  totalCollisions: 0,
  lambdaExpNm: 0,
  lambdaTheoryNm: 68,
  lambdaClausiusNm: 96,
  collisionFreqGHz: 7.0,
  meanFreeTimePs: 142,
  numberDensityM3: 2.5e25,
  effectivePressureAtm: 1.0,
};

export default function App() {
  const [activeModule, setActiveModule] = useState<LabModule>('pressure');
  const [language, setLanguage] = useState<Language>('bn');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);

  // Shared thermal & species parameters
  const [gasId, setGasId] = useState<GasId>('N2');
  const [temperature, setTemperature] = useState<number>(300);
  const [particleCount, setParticleCount] = useState<number>(220);

  // Module 1 controls
  const [mixTwoGases, setMixTwoGases] = useState<boolean>(false);
  const [showVectors, setShowVectors] = useState<boolean>(false);

  // Module 3 controls
  const [mfpMode, setMfpMode] = useState<MfpMode>('density');
  const [numberDensityExp, setNumberDensityExp] = useState<number>(2.5); // × 10^25 m^-3
  const [diameterNm, setDiameterNm] = useState<number>(0.37);
  const [pressureAtm, setPressureAtm] = useState<number>(1.0);
  const [showCylinder, setShowCylinder] = useState<boolean>(false);

  // Signals for imperative canvas actions
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [monoSignal, setMonoSignal] = useState<number>(0);
  const [clearTrailSignal, setClearTrailSignal] = useState<number>(0);
  const [stepSignal, setStepSignal] = useState<number>(0);

  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(DEFAULT_TELEMETRY);

  const t = TRANSLATIONS[language];

  // Derived Module 3 number density (m^-3) and effective pressure (atm)
  const { numberDensityM3, effectivePressureAtm } = useMemo(() => {
    if (mfpMode === 'thermo') {
      const pPa = pressureAtm * 101325;
      const n = pPa / (K_B * temperature);
      return {
        numberDensityM3: n,
        effectivePressureAtm: pressureAtm,
      };
    }
    const n = numberDensityExp * 1e25;
    const pPa = n * K_B * temperature;
    return {
      numberDensityM3: n,
      effectivePressureAtm: pPa / 101325,
    };
  }, [mfpMode, numberDensityExp, pressureAtm, temperature]);

  // Keep instant telemetry synchronized when paused or immediately on slider change
  const displayTelemetry = useMemo(() => {
    const speeds = calcCharacteristicSpeeds(temperature, gasId === 'H2' ? 2 : gasId === 'He' ? 4 : gasId === 'N2' ? 28 : gasId === 'O2' ? 32 : 44);
    const ek = calcKineticEnergy(temperature);
    const mfp = calcMeanFreePathStats(numberDensityM3, diameterNm, speeds.cavg);
    return {
      ...telemetry,
      ekMoleculeJ: ek.perMoleculeJ,
      ekMoleKJ: ek.perMoleKJ,
      cmpTheory: speeds.cmp,
      cavgTheory: speeds.cavg,
      crmsTheory: speeds.crms,
      lambdaTheoryNm: mfp.lambdaNm,
      lambdaClausiusNm: mfp.clausiusNm,
      collisionFreqGHz: mfp.collisionFreqGHz,
      meanFreeTimePs: mfp.meanFreeTimePs,
      numberDensityM3,
      effectivePressureAtm,
    };
  }, [telemetry, temperature, gasId, numberDensityM3, diameterNm, effectivePressureAtm]);

  const handleReset = useCallback(() => {
    setIsPlaying(true);
    setSimSpeed(1.0);
    setGasId('N2');
    setTemperature(300);
    setParticleCount(220);
    setMixTwoGases(false);
    setShowVectors(false);
    setMfpMode('density');
    setNumberDensityExp(2.5);
    setDiameterNm(0.37);
    setPressureAtm(1.0);
    setShowCylinder(false);
    setResetSignal((n) => n + 1);
  }, []);

  const handleSelectGas = useCallback((id: GasId) => {
    setGasId(id);
    // Sync realistic kinetic diameter preset when switching species
    if (id === 'H2') setDiameterNm(0.29);
    else if (id === 'He') setDiameterNm(0.26);
    else if (id === 'N2') setDiameterNm(0.37);
    else if (id === 'O2') setDiameterNm(0.36);
    else if (id === 'CO2') setDiameterNm(0.45);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-950">
      <TopBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'bn' ? 'en' : 'bn'))}
        onReset={handleReset}
        t={t}
      />

      <main className="flex-1 w-full px-3 lg:px-4 py-3 flex flex-col lg:flex-row items-start gap-3.5">
        <ControlSidebar
          activeModule={activeModule}
          language={language}
          t={t}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onStep={() => setStepSignal((s) => s + 1)}
          simSpeed={simSpeed}
          onChangeSimSpeed={setSimSpeed}
          gasId={gasId}
          onChangeGasId={handleSelectGas}
          temperature={temperature}
          onChangeTemperature={setTemperature}
          particleCount={particleCount}
          onChangeParticleCount={setParticleCount}
          mixTwoGases={mixTwoGases}
          onToggleMixTwoGases={() => setMixTwoGases((m) => !m)}
          showVectors={showVectors}
          onToggleShowVectors={() => setShowVectors((v) => !v)}
          onTriggerMonoEnergetic={() => setMonoSignal((m) => m + 1)}
          mfpMode={mfpMode}
          onChangeMfpMode={setMfpMode}
          numberDensityExp={numberDensityExp}
          onChangeNumberDensityExp={setNumberDensityExp}
          diameterNm={diameterNm}
          onChangeDiameterNm={setDiameterNm}
          pressureAtm={pressureAtm}
          onChangePressureAtm={setPressureAtm}
          showCylinder={showCylinder}
          onToggleShowCylinder={() => setShowCylinder((c) => !c)}
          onClearTrail={() => setClearTrailSignal((c) => c + 1)}
        />

        <SimulationStage
          activeModule={activeModule}
          language={language}
          t={t}
          isPlaying={isPlaying}
          simSpeed={simSpeed}
          gasId={gasId}
          temperature={temperature}
          particleCount={particleCount}
          mixTwoGases={mixTwoGases}
          showVectors={showVectors}
          numberDensityM3={numberDensityM3}
          diameterNm={diameterNm}
          effectivePressureAtm={effectivePressureAtm}
          showCylinder={showCylinder}
          resetSignal={resetSignal}
          monoSignal={monoSignal}
          clearTrailSignal={clearTrailSignal}
          stepSignal={stepSignal}
          onTelemetry={setTelemetry}
        />

        <TelemetryPanel
          activeModule={activeModule}
          language={language}
          t={t}
          gasId={gasId}
          temperature={temperature}
          particleCount={particleCount}
          mixTwoGases={mixTwoGases}
          diameterNm={diameterNm}
          telemetry={displayTelemetry}
        />
      </main>
    </div>
  );
}
