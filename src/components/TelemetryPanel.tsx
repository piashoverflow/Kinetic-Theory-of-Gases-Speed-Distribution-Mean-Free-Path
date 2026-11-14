import React from 'react';
import { LabModule, Language, GasId, TelemetrySnapshot } from '../types/physics';
import { GAS_SPECIES } from '../utils/physicsMath';
import { TranslationDict } from '../data/i18n';

interface TelemetryPanelProps {
  activeModule: LabModule;
  language: Language;
  t: TranslationDict;
  gasId: GasId;
  temperature: number;
  particleCount: number;
  mixTwoGases: boolean;
  diameterNm: number;
  telemetry: TelemetrySnapshot;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  activeModule,
  language,
  t,
  gasId,
  temperature,
  particleCount,
  mixTwoGases,
  diameterNm,
  telemetry,
}) => {
  const species = GAS_SPECIES[gasId];

  const pressureAtm = telemetry.theoreticalPressureKpa / 101.325;
  const maxSpeedRef = Math.max(telemetry.crmsTheory, 1);

  return (
    <aside className="w-full lg:w-[300px] xl:w-[325px] shrink-0 flex flex-col gap-3.5">
      <div className="bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <h2 className="text-sm font-bold text-slate-950">{t.telemetryHeader}</h2>
          <span className="font-mono tabular-nums text-xs font-semibold text-emerald-700">
            T = {temperature} K
          </span>
        </div>

        {/* MODULE 1 TELEMETRY */}
        {activeModule === 'pressure' && (
          <div className="space-y-4">
            {/* Primary Pressure KPIs */}
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200">
                <div className="text-[11px] font-semibold text-slate-600">
                  {t.module1.pressureTheory}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold tabular-nums text-slate-950">
                    {telemetry.theoreticalPressureKpa.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    kPa
                  </span>
                  <span className="ml-auto text-xs font-mono tabular-nums text-sky-800 font-semibold">
                    ({pressureAtm.toFixed(2)} atm)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] font-semibold text-emerald-900">
                  {t.module1.pressureMeasured}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold tabular-nums text-emerald-800">
                    {telemetry.measuredPressureKpa.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700">
                    kPa
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-700">
                  <span>{t.module1.wallFlux}:</span>
                  <span className="font-bold">
                    {telemetry.wallHitsPerSec.toFixed(0)} {t.module1.hitsPerSec}
                  </span>
                </div>
              </div>
            </div>

            {/* Density & RMS Speed */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-sky-100">
                <div className="text-[11px] font-semibold text-slate-600">
                  {t.module1.density}
                </div>
                <div className="mt-0.5 font-mono tabular-nums text-sm font-bold text-slate-950">
                  {telemetry.densityKgM3.toFixed(3)}{' '}
                  <span className="text-[11px] font-normal text-slate-500">kg/m³</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-sky-100">
                <div className="text-[11px] font-semibold text-slate-600">
                  c_rms
                </div>
                <div className="mt-0.5 font-mono tabular-nums text-sm font-bold text-slate-950">
                  {telemetry.crmsTheory.toFixed(1)}{' '}
                  <span className="text-[11px] font-normal text-slate-500">m/s</span>
                </div>
              </div>
            </div>

            {/* Live Formula Substitution */}
            <div className="p-3 rounded-xl bg-slate-950 text-sky-50 space-y-1.5">
              <div className="text-[11px] font-semibold text-sky-300">
                {t.module1.formulaTitle}
              </div>
              <div className="font-mono text-xs leading-relaxed">
                P = ⅓ ρ c²_rms = ⅓ (mN / V) c²_rms
              </div>
              <div className="font-mono tabular-nums text-[11px] text-emerald-300 leading-relaxed">
                P = ⅓ × {telemetry.densityKgM3.toFixed(3)} × (
                {Math.round(telemetry.crmsTheory)})² ={' '}
                <span className="font-bold text-white">
                  {telemetry.theoreticalPressureKpa.toFixed(1)} kPa
                </span>
              </div>
            </div>

            {/* Kinetic Energy Meters */}
            <div className="space-y-2 pt-2 border-t border-sky-100">
              <div className="text-xs font-bold text-slate-900">
                {t.module1.kineticEnergyTitle}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">{t.module1.ekMolecule}</span>
                  <span className="font-mono tabular-nums font-bold text-slate-950">
                    {(telemetry.ekMoleculeJ * 1e21).toFixed(2)} ×10⁻²¹ J
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-sky-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                    style={{ width: `${Math.min(100, (temperature / 1000) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-slate-600">{t.module1.ekMole}</span>
                  <span className="font-mono tabular-nums font-bold text-slate-950">
                    {telemetry.ekMoleKJ.toFixed(2)} kJ/mol
                  </span>
                </div>
              </div>
            </div>

            {/* Dual-Gas Graham's Law Comparison */}
            {mixTwoGases && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="text-xs font-bold text-slate-950">
                  {t.module1.grahamTitle}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                  <div className="p-2 rounded-lg bg-white border border-sky-200">
                    <div className="text-[11px] font-sans font-bold text-sky-700">
                      H₂ (2 g/mol)
                    </div>
                    <div className="font-bold text-slate-950 mt-0.5">
                      {telemetry.h2Crms.toFixed(0)} m/s
                    </div>
                    <div className="text-[10px] text-slate-500">
                      KE: {(telemetry.h2EkJ * 1e21).toFixed(2)}×10⁻²¹ J
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-rose-200">
                    <div className="text-[11px] font-sans font-bold text-rose-700">
                      O₂ (32 g/mol)
                    </div>
                    <div className="font-bold text-slate-950 mt-0.5">
                      {telemetry.o2Crms.toFixed(0)} m/s
                    </div>
                    <div className="text-[10px] text-slate-500">
                      KE: {(telemetry.o2EkJ * 1e21).toFixed(2)}×10⁻²¹ J
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1">
                  <span className="font-sans font-semibold text-slate-700">
                    {t.module1.grahamRatio}:
                  </span>
                  <span className="font-bold text-amber-900">
                    {telemetry.o2Crms > 0
                      ? (telemetry.h2Crms / telemetry.o2Crms).toFixed(2)
                      : '4.00'}
                    ×
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">
                  {t.module1.sameTempProof}
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODULE 2 TELEMETRY */}
        {activeModule === 'distribution' && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-900">
              {t.module2.theoryVsSim}
            </div>

            {/* Three Speed Hierarchy Cards */}
            <div className="space-y-2.5">
              {/* c_mp */}
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">
                    {t.module2.cmpName}
                  </span>
                  <span className="font-mono tabular-nums text-sm font-extrabold text-amber-950">
                    {telemetry.cmpTheory.toFixed(1)}{' '}
                    <span className="text-[11px] font-normal">m/s</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-150"
                    style={{ width: `${(telemetry.cmpTheory / maxSpeedRef) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                  <span>√(2RT/M) = 1.414√(RT/M)</span>
                  <span>
                    Sim: <strong className="text-slate-900">{telemetry.cmpSim.toFixed(0)}</strong>
                  </span>
                </div>
              </div>

              {/* c_avg */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    {t.module2.cavgName}
                  </span>
                  <span className="font-mono tabular-nums text-sm font-extrabold text-emerald-950">
                    {telemetry.cavgTheory.toFixed(1)}{' '}
                    <span className="text-[11px] font-normal">m/s</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                    style={{ width: `${(telemetry.cavgTheory / maxSpeedRef) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                  <span>√(8RT/πM) = 1.596√(RT/M)</span>
                  <span>
                    Sim: <strong className="text-slate-900">{telemetry.cavgSim.toFixed(0)}</strong>
                  </span>
                </div>
              </div>

              {/* c_rms */}
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">
                    {t.module2.crmsName}
                  </span>
                  <span className="font-mono tabular-nums text-sm font-extrabold text-rose-950">
                    {telemetry.crmsTheory.toFixed(1)}{' '}
                    <span className="text-[11px] font-normal">m/s</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-rose-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-150"
                    style={{ width: `${(telemetry.crmsTheory / maxSpeedRef) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                  <span>√(3RT/M) = 1.732√(RT/M)</span>
                  <span>
                    Sim: <strong className="text-slate-900">{telemetry.crmsSim.toFixed(0)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Universal Constant Ratio Verifier */}
            <div className="p-3 rounded-xl bg-slate-950 text-sky-50 space-y-2">
              <div className="text-[11px] font-semibold text-sky-300">
                {t.module2.ratioTitle}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                c_rms : c̄ : c_mp = √3 : √(8/π) : √2
              </div>
              <div className="space-y-1 pt-1 border-t border-slate-800 text-xs font-mono tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.module2.ratioTheory}:</span>
                  <span className="text-emerald-300 font-bold">1.000 : 0.921 : 0.816</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.module2.ratioSim}:</span>
                  <span className="text-white font-bold">
                    {telemetry.crmsSim > 0
                      ? `1.000 : ${(telemetry.cavgSim / telemetry.crmsSim).toFixed(3)} : ${(
                          telemetry.cmpSim / telemetry.crmsSim
                        ).toFixed(3)}`
                      : '1.000 : — : —'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-sky-300/90 pt-1">
                {language === 'bn'
                  ? `গ্যাস: ${species.nameBn} (${species.formula}) · N = ${particleCount}`
                  : `Gas: ${species.nameEn} (${species.formula}) · N = ${particleCount}`}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3 TELEMETRY */}
        {activeModule === 'mfp' && (
          <div className="space-y-4">
            {/* Experimental vs Theoretical MFP */}
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <div className="text-[11px] font-semibold text-emerald-900">
                  {t.module3.lambdaTheory}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-mono font-bold tabular-nums text-emerald-900">
                    {telemetry.lambdaTheoryNm.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700">nm</span>
                </div>
                <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-600">
                  {t.module3.lambdaClausius}: {telemetry.lambdaClausiusNm.toFixed(1)} nm
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/75 border border-rose-200">
                <div className="text-[11px] font-semibold text-rose-900">
                  {t.module3.lambdaExp}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  {telemetry.totalCollisions > 0 ? (
                    <>
                      <span className="text-2xl font-mono font-bold tabular-nums text-rose-800">
                        {telemetry.lambdaExpNm.toFixed(1)}
                      </span>
                      <span className="text-xs font-mono font-semibold text-rose-700">nm</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-rose-700">
                      {t.module3.waitingCollisions}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Distance & Collision Counters */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200">
                <div className="text-[11px] font-semibold text-slate-600">
                  {t.module3.totalDistance}
                </div>
                <div className="mt-0.5 font-mono tabular-nums text-sm font-bold text-slate-950">
                  {telemetry.totalDistanceNm.toFixed(0)}{' '}
                  <span className="text-[11px] font-normal text-slate-500">nm</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200">
                <div className="text-[11px] font-semibold text-slate-600">
                  {t.module3.totalCollisions}
                </div>
                <div className="mt-0.5 font-mono tabular-nums text-sm font-bold text-slate-950">
                  {telemetry.totalCollisions}
                </div>
              </div>
            </div>

            {/* Collision Frequency & Mean Free Time */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-sky-200 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">{t.module3.collisionFreq}</span>
                <span className="font-mono tabular-nums font-bold text-slate-950">
                  {telemetry.collisionFreqGHz.toFixed(2)} ×10⁹ s⁻¹
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">{t.module3.meanFreeTime}</span>
                <span className="font-mono tabular-nums font-bold text-slate-950">
                  {telemetry.meanFreeTimePs.toFixed(1)} ps
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-100">
                <span className="text-slate-600 font-medium">P / n</span>
                <span className="font-mono tabular-nums font-semibold text-sky-800">
                  {telemetry.effectivePressureAtm.toFixed(2)} atm ·{' '}
                  {(telemetry.numberDensityM3 / 1e25).toFixed(2)}×10²⁵ m⁻³
                </span>
              </div>
            </div>

            {/* Formula Substitution Card */}
            <div className="p-3 rounded-xl bg-slate-950 text-sky-50 space-y-1.5">
              <div className="text-[11px] font-semibold text-sky-300">
                {t.module3.formulaTitle}
              </div>
              <div className="font-mono text-xs leading-relaxed">
                λ = 1 / (√2 π n d²) = k_B T / (√2 π d² P)
              </div>
              <div className="font-mono tabular-nums text-[11px] text-emerald-300 leading-relaxed">
                n = {(telemetry.numberDensityM3 / 1e25).toFixed(2)}×10²⁵, d ={' '}
                {diameterNm.toFixed(2)} nm →{' '}
                <span className="font-bold text-white">
                  λ = {telemetry.lambdaTheoryNm.toFixed(1)} nm
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
