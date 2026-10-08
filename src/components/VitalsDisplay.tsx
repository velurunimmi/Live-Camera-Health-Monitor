import React from 'react';
import { Heart, Activity, Droplets, Gauge, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface VitalsData {
  heartRate: number;
  systolic: number;
  diastolic: number;
  bloodSugar: number; // in mg/dL
  bloodSugarTrend: 'rising' | 'stable' | 'falling';
  status: 'stable' | 'elevated' | 'analyzing';
  confidence: number;
}

interface VitalsDisplayProps {
  vitals: VitalsData | null;
  isActive: boolean;
  unit: 'mg/dL' | 'mmol/L';
  onToggleUnit: () => void;
}

export const VitalsDisplay: React.FC<VitalsDisplayProps> = ({
  vitals,
  isActive,
  unit,
  onToggleUnit,
}) => {
  // Glucose unit conversion
  const displayGlucose =
    !vitals || !isActive
      ? '--'
      : unit === 'mmol/L'
      ? (vitals.bloodSugar / 18.018).toFixed(1)
      : Math.round(vitals.bloodSugar).toString();

  // 1. Heart Rate Safe/Danger Zone Assessment (Clinical: 60-100 normal)
  const getHrSafety = (bpm: number) => {
    if (!isActive || !vitals)
      return {
        level: 'IDLE',
        label: 'STANDBY',
        sub: 'No active session (Zero biometrics stored)',
        color: 'text-slate-400 bg-slate-800/80 border-slate-700',
        isSafe: true,
      };
    if (bpm >= 60 && bpm <= 100) {
      return {
        level: 'SAFE',
        label: 'SAFE / NORMAL',
        sub: 'Resting Sinus Rhythm (60-100)',
        color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        isSafe: true,
      };
    } else if (bpm > 100) {
      return {
        level: 'DANGER',
        label: 'DANGER / WARNING',
        sub: 'Tachycardia Risk (>100 BPM)',
        color: 'text-rose-400 bg-rose-950/70 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        isSafe: false,
      };
    } else {
      return {
        level: 'DANGER',
        label: 'DANGER / WARNING',
        sub: 'Bradycardia Risk (<60 BPM)',
        color: 'text-amber-400 bg-amber-950/70 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        isSafe: false,
      };
    }
  };

  // 2. Blood Pressure Safe/Danger Assessment (Clinical: <120/80 normal, >=130 or >=80 elevated/stage 1)
  const getBpSafety = (sys: number, dia: number) => {
    if (!isActive || !vitals)
      return {
        level: 'IDLE',
        label: 'STANDBY',
        sub: 'No active session (Zero biometrics stored)',
        color: 'text-slate-400 bg-slate-800/80 border-slate-700',
        isSafe: true,
      };
    if (sys < 120 && dia < 80) {
      return {
        level: 'SAFE',
        label: 'SAFE / NORMAL',
        sub: 'Optimal Hemodynamics (<120/80)',
        color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        isSafe: true,
      };
    } else if (sys <= 129 && dia < 80) {
      return {
        level: 'CAUTION',
        label: 'ELEVATED / CAUTION',
        sub: 'Pre-Hypertension Drift (120-129)',
        color: 'text-amber-400 bg-amber-950/70 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        isSafe: false,
      };
    } else {
      return {
        level: 'DANGER',
        label: 'DANGER / WARNING',
        sub: 'Hypertension Stage 1+ (≥130/80)',
        color: 'text-rose-400 bg-rose-950/70 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        isSafe: false,
      };
    }
  };

  // 3. Blood Sugar Safe/Danger Assessment (Clinical fasting: 70-110 safe, 110-139 elevated, >=140 high)
  const getSugarSafety = (mgdl: number) => {
    if (!isActive || !vitals)
      return {
        level: 'IDLE',
        label: 'STANDBY',
        sub: 'No active session (Zero biometrics stored)',
        color: 'text-slate-400 bg-slate-800/80 border-slate-700',
        isSafe: true,
      };
    if (mgdl >= 70 && mgdl <= 115) {
      return {
        level: 'SAFE',
        label: 'SAFE / NORMAL',
        sub: 'Target Fasting (70-115 mg/dL)',
        color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        isSafe: true,
      };
    } else if (mgdl <= 139) {
      return {
        level: 'CAUTION',
        label: 'ACCEPTABLE / REST',
        sub: 'Postprandial Range (115-139)',
        color: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
        isSafe: true,
      };
    } else {
      return {
        level: 'DANGER',
        label: 'DANGER / WARNING',
        sub: 'Hyperglycemic Risk (≥140 mg/dL)',
        color: 'text-rose-400 bg-rose-950/70 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        isSafe: false,
      };
    }
  };

  const hrSafety = vitals ? getHrSafety(vitals.heartRate) : getHrSafety(0);
  const bpSafety = vitals ? getBpSafety(vitals.systolic, vitals.diastolic) : getBpSafety(0, 0);
  const sugarSafety = vitals ? getSugarSafety(vitals.bloodSugar) : getSugarSafety(0);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. HEART RATE CARD WITH SAFE/DANGER STATUS */}
      <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-xl backdrop-blur-md flex flex-col justify-between overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600" />

        {/* Card Header & Safety Badge */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Heart
                  className={`w-5 h-5 ${
                    isActive ? 'fill-rose-500 animate-pulse text-rose-500' : 'text-slate-500'
                  }`}
                />
              </div>
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 block">
                  HEART RATE
                </span>
                <span className="text-[10px] text-slate-500">Live Pulse Rate</span>
              </div>
            </div>

            {/* SAFE / DANGER BADGE */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${hrSafety.color}`}>
              {hrSafety.isSafe ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />
              )}
              <span>{hrSafety.label}</span>
            </div>
          </div>

          {/* Metric Value */}
          <div className="flex items-baseline justify-between my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-rose-100 transition-colors">
                {isActive && vitals ? vitals.heartRate : '--'}
              </span>
              <span className="text-sm font-bold text-rose-400 font-mono">BPM</span>
            </div>
            {isActive && vitals && (
              <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-[11px] font-mono text-rose-300 shadow-sm">
                R-R: {Math.round(60000 / (vitals.heartRate || 72))}ms
              </span>
            )}
          </div>

          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {isActive && vitals ? hrSafety.sub : 'No active session (Zero biometrics stored)'}
          </p>
        </div>

        {/* Threshold Safety Range Bar */}
        <div className="space-y-1.5 mt-5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-rose-400/80">&lt;60 Low</span>
            <span className="text-emerald-400 font-bold">60 - 100 SAFE ZONE</span>
            <span className="text-rose-400/80">&gt;100 High</span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            {/* Safe zone green marker in the center (from 35% to 75%) */}
            <div className="absolute top-0 bottom-0 left-[25%] right-[25%] bg-emerald-500/30 rounded-full" />
            {/* Dynamic pointer */}
            {isActive && vitals && (
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-700 shadow-md ${
                  hrSafety.isSafe ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, ((vitals.heartRate - 40) / 80) * 100))}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. BLOOD PRESSURE CARD WITH SAFE/DANGER STATUS */}
      <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-xl backdrop-blur-md flex flex-col justify-between overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />

        {/* Card Header & Safety Badge */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 block">
                  BLOOD PRESSURE
                </span>
                <span className="text-[10px] text-slate-500">Systolic / Diastolic</span>
              </div>
            </div>

            {/* SAFE / DANGER BADGE */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${bpSafety.color}`}>
              {bpSafety.isSafe ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-rose-400 animate-bounce" />
              )}
              <span>{bpSafety.label}</span>
            </div>
          </div>

          {/* Metric Value */}
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-cyan-100 transition-colors">
              {isActive && vitals ? `${vitals.systolic}/${vitals.diastolic}` : '--/--'}
            </span>
            <span className="text-sm font-bold text-cyan-400 font-mono">mmHg</span>
          </div>

          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {isActive && vitals ? bpSafety.sub : 'No active session (Zero biometrics stored)'}
          </p>
        </div>

        {/* Threshold Safety Range Bar */}
        <div className="space-y-1.5 mt-5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">&lt;120/80 SAFE</span>
            <span className="text-amber-400 font-semibold">120-129 ELEVATED</span>
            <span className="text-rose-400 font-bold">&gt;130/85 DANGER</span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            {/* Safe zone green background on left */}
            <div className="absolute top-0 bottom-0 left-0 w-[45%] bg-emerald-500/30 rounded-l-full" />
            <div className="absolute top-0 bottom-0 left-[45%] w-[25%] bg-amber-500/30" />
            <div className="absolute top-0 bottom-0 left-[70%] right-0 bg-rose-500/30 rounded-r-full" />
            {/* Dynamic pointer */}
            {isActive && vitals && (
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-700 shadow-md ${
                  bpSafety.isSafe ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, ((vitals.systolic - 100) / 45) * 100))}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 3. BLOOD SUGAR CARD WITH SAFE/DANGER STATUS */}
      <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-xl backdrop-blur-md flex flex-col justify-between overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />

        {/* Card Header & Safety Badge */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 block">
                  BLOOD GLUCOSE
                </span>
                <span className="text-[10px] text-slate-500">Optical Capillary Level</span>
              </div>
            </div>

            {/* SAFE / DANGER BADGE */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wider ${sugarSafety.color}`}>
              {sugarSafety.isSafe ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />
              )}
              <span>{sugarSafety.label}</span>
            </div>
          </div>

          {/* Metric Value */}
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white group-hover:text-emerald-100 transition-colors">
              {isActive && vitals ? displayGlucose : '--'}
            </span>
            <button
              onClick={onToggleUnit}
              title="Click to toggle mg/dL and mmol/L"
              className="text-xs font-bold text-emerald-400 font-mono hover:underline cursor-pointer"
            >
              {unit} ⇋
            </button>
          </div>

          <p className="text-[11px] font-mono text-slate-400 mt-1">
            {isActive && vitals ? sugarSafety.sub : 'No active session (Zero biometrics stored)'}
          </p>
        </div>

        {/* Threshold Safety Range Bar */}
        <div className="space-y-1.5 mt-5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="text-rose-400 font-semibold">&lt;70 Low</span>
            <span className="text-emerald-400 font-bold">70 - 115 SAFE TARGET</span>
            <span className="text-rose-400 font-semibold">&gt;140 High</span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            {/* Safe zone green background in the middle */}
            <div className="absolute top-0 bottom-0 left-[20%] right-[30%] bg-emerald-500/30 rounded-full" />
            {/* Dynamic pointer */}
            {isActive && vitals && (
              <div
                className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-700 shadow-md ${
                  sugarSafety.isSafe ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-rose-500 shadow-rose-500/50'
                }`}
                style={{
                  left: `${Math.max(5, Math.min(95, ((vitals.bloodSugar - 50) / 100) * 100))}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
