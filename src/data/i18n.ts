import { Language } from '../types/physics';

export interface TranslationDict {
  studioTitle: string;
  studioSubtitle: string;
  tabs: {
    pressure: string;
    distribution: string;
    mfp: string;
  };
  langLabel: string;
  reset: string;
  controlsHeader: string;
  telemetryHeader: string;
  playback: {
    play: string;
    pause: string;
    speed: string;
    step: string;
  };
  species: {
    label: string;
    molarMass: string;
    mixTwoGases: string;
    mixDesc: string;
    showVectors: string;
  };
  sliders: {
    temperature: string;
    particleCount: string;
    numberDensity: string;
    diameter: string;
    pressureAtm: string;
  };
  module1: {
    stageTitle: string;
    sensorWallLabel: string;
    impulseLegend: string;
    pressureTheory: string;
    pressureMeasured: string;
    wallFlux: string;
    density: string;
    kineticEnergyTitle: string;
    ekMolecule: string;
    ekMole: string;
    formulaTitle: string;
    grahamTitle: string;
    grahamRatio: string;
    sameTempProof: string;
    hitsPerSec: string;
  };
  module2: {
    chamberTitle: string;
    plotTitle: string;
    slowLabel: string;
    avgLabel: string;
    fastLabel: string;
    monoStart: string;
    monoHint: string;
    cmpName: string;
    cavgName: string;
    crmsName: string;
    theoryVsSim: string;
    ratioTitle: string;
    ratioTheory: string;
    ratioSim: string;
    yAxisLabel: string;
    xAxisLabel: string;
    histLegend: string;
    curveLegend: string;
  };
  module3: {
    stageTitle: string;
    tracerLegend: string;
    bgLegend: string;
    collisionDot: string;
    cylinderToggle: string;
    clearTrail: string;
    modeLabel: string;
    modeDensity: string;
    modeThermo: string;
    modeThermoHint: string;
    totalDistance: string;
    totalCollisions: string;
    lambdaExp: string;
    lambdaTheory: string;
    lambdaClausius: string;
    collisionFreq: string;
    meanFreeTime: string;
    formulaTitle: string;
    waitingCollisions: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  bn: {
    studioTitle: 'গ্যাসের গতিতত্ত্ব, বেগ বণ্টন ও গড় মুক্ত পথ ল্যাব',
    studioSubtitle: 'আণবিক গতিবিদ্যা ও পরিসংখ্যানিক বলবিজ্ঞান সিমুলেশন',
    tabs: {
      pressure: 'মডিউল ১: গ্যাসের চাপের গতিতাত্ত্বিক উৎপত্তি',
      distribution: 'মডিউল ২: ম্যাক্সওয়েল বেগ বণ্টন ও তিন প্রকার বেগ',
      mfp: 'মডিউল ৩: গড় মুক্ত পথ ও সংঘর্ষ ট্র্যাকার',
    },
    langLabel: 'বাংলা',
    reset: 'রিসেট',
    controlsHeader: 'প্যারামিটার নিয়ন্ত্রণ ডক',
    telemetryHeader: 'লাইভ টেলিমেট্রি ও সূত্র বিশ্লেষণ',
    playback: {
      play: 'চালু করুন',
      pause: 'বিরতি',
      speed: 'সিমুলেশন গতি',
      step: 'এক ধাপ',
    },
    species: {
      label: 'গ্যাসের ধরন নির্বাচন',
      molarMass: 'মোলার ভর (M)',
      mixTwoGases: 'দুটি গ্যাসের মিশ্রণ (গ্রাহামের ব্যাপন)',
      mixDesc: 'একই তাপমাত্রায় হালকা H₂ ও ভারী O₂ অণুর গতি তুলনা করুন',
      showVectors: 'বেগের দিক তীর দেখান',
    },
    sliders: {
      temperature: 'পরম তাপমাত্রা (T)',
      particleCount: 'অণুর সংখ্যা (N)',
      numberDensity: 'একক আয়তনে অণু (n)',
      diameter: 'কার্যকর আণবিক ব্যাস (d)',
      pressureAtm: 'গ্যাসের চাপ (P)',
    },
    module1: {
      stageTitle: 'তাপীয় আবদ্ধ চেম্বার ও দেয়াল ভরবেগ সেন্সর',
      sensorWallLabel: 'চাপ সেন্সর দেয়াল',
      impulseLegend: 'প্রতিটি ধাক্কায় ভরবেগের পরিবর্তন Δp = 2mvₓ',
      pressureTheory: 'তাত্ত্বিক গতিতাত্ত্বিক চাপ (P)',
      pressureMeasured: 'দেয়ালের ঘাত-প্রসূত চাপ (পরিমাপকৃত)',
      wallFlux: 'দেয়ালে আঘাতের হার',
      density: 'গ্যাসের ঘনত্ব (ρ)',
      kineticEnergyTitle: 'গড় রৈখিক গতিশক্তি (তাপমাত্রার সমানুপাতিক)',
      ekMolecule: 'প্রতি অণুর গড় গতিশক্তি (3/2 k_B T)',
      ekMole: 'প্রতি মোলের গতিশক্তি (3/2 RT)',
      formulaTitle: 'চাপের গতিতাত্ত্বিক সমীকরণ প্রতিস্থাপন',
      grahamTitle: 'দ্বি-গ্যাস মিশ্রণ বিশ্লেষণ (গ্রাহামের সূত্র)',
      grahamRatio: 'বেগের অনুপাত c_rms(H₂) / c_rms(O₂)',
      sameTempProof: 'উভয় গ্যাসের গড় গতিশক্তি সমান, কিন্তু হালকা H₂ চারগুণ দ্রুত চলে!',
      hitsPerSec: 'আঘাত/সে.',
    },
    module2: {
      chamberTitle: 'তাৎক্ষণিক বেগ-ভিত্তিক রঙিন অণু চেম্বার',
      plotTitle: 'ম্যাক্সওয়েল-বোল্টজম্যান বেগ বণ্টন গ্রাফ f(v) বনাম v',
      slowLabel: 'ধীর (v < 0.7c̄)',
      avgLabel: 'গড়ের কাছাকাছি',
      fastLabel: 'উচ্চ বেগ (v > 1.3c̄)',
      monoStart: 'একক বেগে শুরু (সাম্যাবস্থা দেখুন)',
      monoHint: 'সব অণু সমান বেগে শুরু হয়ে স্থিতিস্থাপক সংঘর্ষে কীভাবে বক্ররেখা তৈরি করে দেখুন',
      cmpName: 'সম্ভাব্যতম বেগ (c_mp)',
      cavgName: 'গড় বেগ (c̄)',
      crmsName: 'মূল গড় বর্গবেগ (c_rms)',
      theoryVsSim: 'তাত্ত্বিক বনাম সিমুলেটেড বেগ',
      ratioTitle: 'তিন প্রকার বেগের ধ্রুব অনুপাত যাচাই',
      ratioTheory: 'তাত্ত্বিক অনুপাত',
      ratioSim: 'সিমুলেটেড অনুপাত',
      yAxisLabel: 'সম্ভাব্যতা ঘনত্ব f(v)',
      xAxisLabel: 'আণবিক দ্রুতি v (m/s)',
      histLegend: 'লাইভ হিস্টোগ্রাম',
      curveLegend: 'তাত্ত্বিক বক্ররেখা',
    },
    module3: {
      stageTitle: 'লক্ষ্য অণুর আঁকাবাঁকা মুক্ত পথ ও সংঘর্ষ চেম্বার',
      tracerLegend: 'লক্ষ্য অণু (Tracer)',
      bgLegend: 'অন্যান্য গ্যাস অণু',
      collisionDot: 'সংঘর্ষ বিন্দু',
      cylinderToggle: 'সংঘর্ষ সিলিন্ডার (πd²) দেখান',
      clearTrail: 'পথ মুছুন ও গণনা রিসেট',
      modeLabel: 'নিয়ন্ত্রণ মোড',
      modeDensity: 'ঘনত্ব (n) ও ব্যাস (d) মোড',
      modeThermo: 'চাপ (P) ও তাপমাত্রা (T) লিংকড মোড',
      modeThermoHint: 'স্থির T-তে চাপ দ্বিগুণ হলে λ অর্ধেক হয়; স্থির P-তে T দ্বিগুণ হলে λ দ্বিগুণ হয়',
      totalDistance: 'অতিক্রান্ত মোট দূরত্ব (S)',
      totalCollisions: 'মোট আন্তঃআণবিক সংঘর্ষ (N)',
      lambdaExp: 'পরীক্ষামূলক গড় মুক্ত পথ (λ_exp)',
      lambdaTheory: 'ম্যাক্সওয়েল তাত্ত্বিক মান (λ_theory)',
      lambdaClausius: 'ক্লসিয়াস তাত্ত্বিক মান (1 / πnd²)',
      collisionFreq: 'সংঘর্ষ কম্পাঙ্ক (z = c̄ / λ)',
      meanFreeTime: 'গড় মুক্ত সময় (τ = 1 / z)',
      formulaTitle: 'গড় মুক্ত পথ সূত্র প্রতিস্থাপন',
      waitingCollisions: 'অন্তত ১টি সংঘর্ষের জন্য অপেক্ষা করা হচ্ছে...',
    },
  },
  en: {
    studioTitle: 'Kinetic Theory, Speed Distribution & Mean Free Path Studio',
    studioSubtitle: 'Computational Statistical Mechanics & Molecular Dynamics Lab',
    tabs: {
      pressure: 'Module 1: Kinetic Origin of Gas Pressure',
      distribution: 'Module 2: Maxwell Speed Distribution',
      mfp: 'Module 3: Mean Free Path & Collision Tracker',
    },
    langLabel: 'English',
    reset: 'Reset',
    controlsHeader: 'Parameter Control Dock',
    telemetryHeader: 'Live Telemetry & Formula Substitution',
    playback: {
      play: 'Play',
      pause: 'Pause',
      speed: 'Time Scale',
      step: 'Step',
    },
    species: {
      label: 'Gas Species Preset',
      molarMass: 'Molar Mass (M)',
      mixTwoGases: "Mix Two Gases (Graham's Diffusion)",
      mixDesc: 'Inject light H₂ & heavy O₂ at identical temperature T',
      showVectors: 'Show Velocity Vectors',
    },
    sliders: {
      temperature: 'Absolute Temperature (T)',
      particleCount: 'Number of Molecules (N)',
      numberDensity: 'Number Density (n)',
      diameter: 'Molecular Diameter (d)',
      pressureAtm: 'Gas Pressure (P)',
    },
    module1: {
      stageTitle: 'Sealed Thermal Chamber & Wall Momentum Impulse Sensor',
      sensorWallLabel: 'PRESSURE SENSOR WALL',
      impulseLegend: 'Each elastic wall impact transfers Δp = 2mvₓ',
      pressureTheory: 'Theoretical Kinetic Pressure (P)',
      pressureMeasured: 'Measured Wall Impulse Pressure',
      wallFlux: 'Wall Bombardment Rate',
      density: 'Gas Mass Density (ρ)',
      kineticEnergyTitle: 'Average Translational Kinetic Energy',
      ekMolecule: 'Per Molecule (3/2 k_B T)',
      ekMole: 'Per Mole (3/2 RT)',
      formulaTitle: 'Kinetic Pressure Equation Substitution',
      grahamTitle: "Dual-Gas Mixture (Graham's Law Proof)",
      grahamRatio: 'Speed Ratio c_rms(H₂) / c_rms(O₂)',
      sameTempProof: 'Equal average KE at same T, while lighter H₂ moves 4× faster!',
      hitsPerSec: 'hits/s',
    },
    module2: {
      chamberTitle: 'Instantaneous Speed-Coded Molecular Chamber',
      plotTitle: 'Maxwell-Boltzmann Speed Distribution f(v) vs Speed v',
      slowLabel: 'Slow (v < 0.7c̄)',
      avgLabel: 'Near Mean',
      fastLabel: 'High-Speed Tail (v > 1.3c̄)',
      monoStart: 'Mono-Energetic Start (Watch Equilibration)',
      monoHint: 'Start all molecules at identical speed and watch collisions build the curve',
      cmpName: 'Most Probable Speed (c_mp)',
      cavgName: 'Average / Mean Speed (c̄)',
      crmsName: 'Root-Mean-Square Speed (c_rms)',
      theoryVsSim: 'Theoretical vs Simulated Speeds',
      ratioTitle: 'Universal Constant Ratio Verifier',
      ratioTheory: 'Theoretical Ratio',
      ratioSim: 'Simulated Ratio',
      yAxisLabel: 'Probability Density f(v)',
      xAxisLabel: 'Molecular Speed v (m/s)',
      histLegend: 'Live Chamber Histogram',
      curveLegend: 'Theoretical Maxwell Curve',
    },
    module3: {
      stageTitle: 'Target Tracer Zig-Zag Free Path & Collision Chamber',
      tracerLegend: 'Tracer Molecule',
      bgLegend: 'Background Molecules',
      collisionDot: 'Impact Vertex',
      cylinderToggle: 'Show Collision Cylinder (πd²)',
      clearTrail: 'Clear Trail & Reset Counter',
      modeLabel: 'Parameter Mode',
      modeDensity: 'Direct Density (n) & Diameter (d)',
      modeThermo: 'Linked Pressure (P) & Temperature (T)',
      modeThermoHint: 'At const T, 2×P halves λ; at const P, 2×T doubles λ',
      totalDistance: 'Total Distance Traveled (S)',
      totalCollisions: 'Total Intermolecular Collisions (N)',
      lambdaExp: 'Measured Mean Free Path (λ_exp)',
      lambdaTheory: 'Theoretical Maxwell MFP (λ_theory)',
      lambdaClausius: 'Clausius Estimate (1 / πnd²)',
      collisionFreq: 'Collision Frequency (z = c̄ / λ)',
      meanFreeTime: 'Mean Free Time (τ = 1 / z)',
      formulaTitle: 'Mean Free Path Formula Substitution',
      waitingCollisions: 'Awaiting first intermolecular collision...',
    },
  },
};
