import React from 'react';
import { Globe, RotateCcw } from 'lucide-react';
import { LabModule, Language } from '../types/physics';
import { TranslationDict } from '../data/i18n';

interface TopBarProps {
  activeModule: LabModule;
  onSelectModule: (mod: LabModule) => void;
  language: Language;
  onToggleLanguage: () => void;
  onReset: () => void;
  t: TranslationDict;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeModule,
  onSelectModule,
  language,
  onToggleLanguage,
  onReset,
  t,
}) => {
  const modules: { id: LabModule; label: string }[] = [
    { id: 'pressure', label: t.tabs.pressure },
    { id: 'distribution', label: t.tabs.distribution },
    { id: 'mfp', label: t.tabs.mfp },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-200 px-3 lg:px-5 py-2.5">
      <div className="w-full flex flex-wrap xl:flex-nowrap items-center justify-between gap-3 xl:gap-5">
        {/* Left: Studio Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-xs">
            PV
          </div>
          <h1 className="text-base lg:text-[17px] font-extrabold tracking-tight text-slate-950 truncate">
            {t.studioTitle}
          </h1>
        </div>

        {/* Center: 3 Interactive Lab Mode Tabs */}
        <nav
          aria-label="Simulation Modules"
          className="order-3 xl:order-2 w-full xl:w-auto overflow-x-auto"
        >
          <div className="inline-flex items-center gap-1 p-1 bg-sky-100/80 border border-sky-200 rounded-full min-w-max">
            {modules.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                    isActive
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/70'
                  }`}
                >
                  {mod.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right: Language Switcher, Reset, and Institution Badge */}
        <div className="order-2 xl:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-slate-900 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            title="Switch Language / ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-sky-700" />
            <span>{language === 'bn' ? 'বাংলা / EN' : 'English / বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.reset}</span>
          </button>

          <span className="bg-rose-50 border border-rose-300 text-rose-600 font-extrabold px-3 py-1 rounded-full text-sm whitespace-nowrap shrink-0">
            উদ্ভাস
          </span>
        </div>
      </div>
    </header>
  );
};
