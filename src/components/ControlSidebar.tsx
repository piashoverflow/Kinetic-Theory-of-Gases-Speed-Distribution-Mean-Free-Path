import React from 'react';
import { Pause, Play, SkipForward, Sparkles, Eraser } from 'lucide-react';
import { GasId, LabModule, Language, MfpMode } from '../types/physics';
import { GAS_LIST, GAS_SPECIES } from '../utils/physicsMath';
import { TranslationDict } from '../data/i18n';
import { RangeSlider } from './RangeSlider';

interface ControlSidebarProps {
  activeModule: LabModule;
  language: Language;
  t: TranslationDict;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  simSpeed: number;
  onChangeSimSpeed: (val: number) => void;
  gasId: GasId;
  onChangeGasId: (id: GasId) => void;
  temperature: number;
  onChangeTemperature: (val: number) => void;
  particleCount: number;
  onChangeParticleCount: (val: number) => void;
  // Module 1
  mixTwoGases: boolean;
  onToggleMixTwoGases: () => void;
  showVectors: boolean;
  onToggleShowVectors: () => void;
  // Module 2
  onTriggerMonoEnergetic: () => void;
  // Module 3
  mfpMode: MfpMode;
  onChangeMfpMode: (mode: MfpMode) => void;
  numberDensityExp: number; // in units of 10^25 m^-3
  onChangeNumberDensityExp: (val: number) => void;
  diameterNm: number;
  onChangeDiameterNm: (val: number) => void;
  pressureAtm: number;
  onChangePressureAtm: (val: number) => void;
  showCylinder: boolean;
  onToggleShowCylinder: () => void;
  onClearTrail: () => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  activeModule,
  language,
  t,
  isPlaying,
  onTogglePlay,
  onStep,
  simSpeed,
  onChangeSimSpeed,
  gasId,
  onChangeGasId,
  temperature,
  onChangeTemperature,
  particleCount,
  onChangeParticleCount,
  mixTwoGases,
  onToggleMixTwoGases,
  showVectors,
  onToggleShowVectors,
  onTriggerMonoEnergetic,
  mfpMode,
  onChangeMfpMode,
  numberDensityExp,
  onChangeNumberDensityExp,
  diameterNm,
  onChangeDiameterNm,
  pressureAtm,
  onChangePressureAtm,
  showCylinder,
  onToggleShowCylinder,
  onClearTrail,
}) => {
  const selectedGas = GAS_SPECIES[gasId];

  return (
    <aside className="w-full lg:w-[300px] xl:w-[330px] shrink-0 flex flex-col gap-3.5">
      {/* Main Control Card */}
      <div className="bg-white/95 backdrop-blur-sm border border-sky-200 shadow-sm rounded-2xl p-4 space-y-5">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <h2 className="text-sm font-bold text-slate-950">{t.controlsHeader}</h2>
          <span className="font-mono text-xs font-semibold text-sky-700">
            {activeModule === 'pressure'
              ? 'M1 · P = ⅓ρc²'
              : activeModule === 'distribution'
              ? 'M2 · f(v)'
              : 'M3 · λ'}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isPlaying
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? t.playback.pause : t.playback.play}</span>
            </button>

            <button
              type="button"
              onClick={onStep}
              disabled={isPlaying}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-sky-200 bg-sky-50 text-slate-900 hover:bg-sky-100 disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              <SkipForward className="w-4 h-4 text-sky-700" />
              <span>{t.playback.step}</span>
            </button>
          </div>

          <RangeSlider
            id="sim-speed"
            label={t.playback.speed}
            value={simSpeed}
            min={0.25}
            max={2.0}
            step={0.25}
            unit="×"
            formatValue={(v) => v.toFixed(2)}
            onChange={onChangeSimSpeed}
          />
        </div>

        {/* Gas Species Selector (Hidden if Module 1 Dual-Gas mode is active, or shown disabled with clear note) */}
        <div className="space-y-2 pt-2 border-t border-sky-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">{t.species.label}</span>
            <span className="font-mono tabular-nums text-slate-600">
              {activeModule === 'pressure' && mixTwoGases
                ? 'H₂ (2) + O₂ (32)'
                : `M = ${selectedGas.molarMassG} g/mol`}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {GAS_LIST.map((gas) => {
              const active = gas.id === gasId && !(activeModule === 'pressure' && mixTwoGases);
              return (
                <button
                  key={gas.id}
                  type="button"
                  disabled={activeModule === 'pressure' && mixTwoGases}
                  onClick={() => onChangeGasId(gas.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-sky-700 text-white border-sky-800 shadow-xs'
                      : 'bg-sky-50/70 text-slate-900 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  <div className="text-xs font-extrabold leading-tight">{gas.formula}</div>
                  <div
                    className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                      active ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {gas.molarMassG}g
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-600 font-medium">
            {activeModule === 'pressure' && mixTwoGases
              ? language === 'bn'
                ? 'হাইড্রোজেন (H₂) + অক্সিজেন (O₂) মিশ্রণ সক্রিয়'
                : 'Hydrogen (H₂) + Oxygen (O₂) binary mixture active'
              : language === 'bn'
              ? `${selectedGas.nameBn} (${selectedGas.formula}) · মোলার ভর ${selectedGas.molarMassG} g/mol`
              : `${selectedGas.nameEn} (${selectedGas.formula}) · Molar mass ${selectedGas.molarMassG} g/mol`}
          </div>
        </div>

        {/* Module 1 Controls */}
        {activeModule === 'pressure' && (
          <div className="space-y-4 pt-2 border-t border-sky-100">
            <RangeSlider
              id="m1-temp"
              label={t.sliders.temperature}
              value={temperature}
              min={100}
              max={1000}
              step={10}
              unit="K"
              minLabel="100 K"
              maxLabel="1000 K"
              onChange={onChangeTemperature}
            />

            <RangeSlider
              id="m1-count"
              label={t.sliders.particleCount}
              value={particleCount}
              min={50}
              max={500}
              step={10}
              minLabel="50"
              maxLabel="500"
              onChange={onChangeParticleCount}
            />

            <div className="space-y-2.5 pt-2 border-t border-sky-100">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={mixTwoGases}
                  onChange={onToggleMixTwoGases}
                  className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-950">
                    {t.species.mixTwoGases}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    {t.species.mixDesc}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-sky-200 bg-white hover:bg-sky-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={onToggleShowVectors}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer shrink-0"
                />
                <span className="text-xs font-semibold text-slate-900">
                  {t.species.showVectors}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Module 2 Controls */}
        {activeModule === 'distribution' && (
          <div className="space-y-4 pt-2 border-t border-sky-100">
            <RangeSlider
              id="m2-temp"
              label={t.sliders.temperature}
              value={temperature}
              min={100}
              max={1000}
              step={10}
              unit="K"
              minLabel="100 K"
              maxLabel="1000 K"
              onChange={onChangeTemperature}
            />

            <RangeSlider
              id="m2-count"
              label={t.sliders.particleCount}
              value={particleCount}
              min={100}
              max={500}
              step={20}
              minLabel="100"
              maxLabel="500"
              onChange={onChangeParticleCount}
            />

            <div className="pt-2 border-t border-sky-100 space-y-2">
              <button
                type="button"
                onClick={onTriggerMonoEnergetic}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-700 shrink-0" />
                <span>{t.module2.monoStart}</span>
              </button>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t.module2.monoHint}
              </p>
            </div>
          </div>
        )}

        {/* Module 3 Controls */}
        {activeModule === 'mfp' && (
          <div className="space-y-4 pt-2 border-t border-sky-100">
            {/* Parameter Mode Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-900">
                {t.module3.modeLabel}
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeMfpMode('density')}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-colors cursor-pointer ${
                    mfpMode === 'density'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-sky-50/70 text-slate-800 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  {t.module3.modeDensity}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMfpMode('thermo')}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-colors cursor-pointer ${
                    mfpMode === 'thermo'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-sky-50/70 text-slate-800 border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  {t.module3.modeThermo}
                </button>
              </div>
            </div>

            {mfpMode === 'density' ? (
              <RangeSlider
                id="m3-density"
                label={t.sliders.numberDensity}
                value={numberDensityExp}
                min={0.5}
                max={5.0}
                step={0.1}
                unit="×10²⁵ m⁻³"
                formatValue={(v) => v.toFixed(1)}
                minLabel="0.5×10²⁵"
                maxLabel="5.0×10²⁵"
                onChange={onChangeNumberDensityExp}
              />
            ) : (
              <>
                <RangeSlider
                  id="m3-pressure"
                  label={t.sliders.pressureAtm}
                  value={pressureAtm}
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  unit="atm"
                  formatValue={(v) => v.toFixed(1)}
                  minLabel="0.2 atm"
                  maxLabel="3.0 atm"
                  onChange={onChangePressureAtm}
                />
                <RangeSlider
                  id="m3-temp"
                  label={t.sliders.temperature}
                  value={temperature}
                  min={150}
                  max={900}
                  step={10}
                  unit="K"
                  minLabel="150 K"
                  maxLabel="900 K"
                  onChange={onChangeTemperature}
                />
                <p className="text-[11px] text-slate-600 leading-snug bg-sky-50 p-2 rounded-lg border border-sky-100">
                  {t.module3.modeThermoHint}
                </p>
              </>
            )}

            <RangeSlider
              id="m3-diameter"
              label={t.sliders.diameter}
              value={diameterNm}
              min={0.2}
              max={0.6}
              step={0.01}
              unit="nm"
              formatValue={(v) => v.toFixed(2)}
              minLabel="0.20 nm"
              maxLabel="0.60 nm"
              onChange={onChangeDiameterNm}
            />

            <div className="space-y-2 pt-2 border-t border-sky-100">
              <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={showCylinder}
                  onChange={onToggleShowCylinder}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer shrink-0"
                />
                <span className="text-xs font-semibold text-slate-900">
                  {t.module3.cylinderToggle}
                </span>
              </label>

              <button
                type="button"
                onClick={onClearTrail}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Eraser className="w-4 h-4 shrink-0" />
                <span>{t.module3.clearTrail}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
