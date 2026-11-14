import React from 'react';

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue?: (val: number) => string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = '',
  formatValue,
  minLabel,
  maxLabel,
  onChange,
  disabled = false,
}) => {
  const clamped = Math.min(max, Math.max(min, value));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const displayValue = formatValue ? formatValue(clamped) : String(clamped);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-slate-900 leading-snug"
        >
          {label}
        </label>
        <div className="font-mono tabular-nums text-sm font-bold text-emerald-700 whitespace-nowrap shrink-0">
          {displayValue}
          {unit && (
            <span className="ml-1 text-xs font-medium text-slate-500">{unit}</span>
          )}
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="emerald-slider disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ '--slider-progress': `${pct}%` } as React.CSSProperties}
      />

      {(minLabel || maxLabel) && (
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
};
