import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Activity } from 'lucide-react';
import { playHeartbeatSound } from '../utils/audio';

interface RealisticHeartProps {
  bpm: number;
  isActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  status: 'stable' | 'elevated' | 'analyzing';
}

export const RealisticHeart: React.FC<RealisticHeartProps> = ({
  bpm,
  isActive,
  soundEnabled,
  onToggleSound,
  status,
}) => {
  const heartRef = useRef<HTMLDivElement>(null);
  const beatIntervalMs = Math.max(450, Math.min(1500, Math.round(60000 / (bpm || 72))));

  // Sound triggering effect
  useEffect(() => {
    if (!isActive || !soundEnabled) return;
    const interval = setInterval(() => {
      playHeartbeatSound(0.22);
    }, beatIntervalMs);

    return () => clearInterval(interval);
  }, [isActive, soundEnabled, beatIntervalMs]);

  const rrInterval = Math.round(60000 / (bpm || 72));

  // Determine glow accent based on status
  const glowColor =
    status === 'elevated'
      ? 'rgba(239, 68, 68, 0.45)'
      : status === 'analyzing'
      ? 'rgba(6, 182, 212, 0.35)'
      : 'rgba(244, 63, 94, 0.4)';

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden group">
      {/* Background ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-60"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, rgba(15, 23, 42, 0) 70%)`,
        }}
      />

      {/* Top telemetry bar for the heart */}
      <div className="w-full flex items-center justify-between z-10 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isActive ? 'bg-rose-400 opacity-75' : 'bg-slate-500 opacity-40'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive ? 'bg-rose-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono">
            CARDIAC CYCLE DYNAMICS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
            R-R: {isActive ? `${rrInterval}ms` : '--'}
          </div>
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Heartbeat Sound' : 'Enable Heartbeat Sound'}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-rose-400 text-[10px]">SOUND ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 text-[10px]">MUTED</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Animated Beating Heart Container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-2 select-none">
        {/* Concentric Pulse Rings */}
        {isActive && (
          <>
            <div
              className="absolute rounded-full border border-rose-500/30 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                animation: `cardiacRipple ${beatIntervalMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) infinite`,
              }}
            />
            <div
              className="absolute rounded-full border border-cyan-500/20 pointer-events-none"
              style={{
                width: '85%',
                height: '85%',
                animation: `cardiacRipple ${beatIntervalMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) infinite 120ms`,
              }}
            />
          </>
        )}

        {/* Anatomical Heart SVG with realistic muscular gradient and coronary vessels */}
        <div
          ref={heartRef}
          className="relative w-full h-full flex items-center justify-center transition-transform"
          style={{
            animation: isActive
              ? `realisticBeat ${beatIntervalMs}ms ease-in-out infinite`
              : 'none',
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 500 500"
            className="w-full h-full drop-shadow-[0_10px_25px_rgba(225,29,72,0.35)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Radial muscular gradients */}
              <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#be123c" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>

              <linearGradient id="pulmonaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              <linearGradient id="venaCavaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              <radialGradient id="leftVentricleGrad" cx="60%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="40%" stopColor="#e11d48" />
                <stop offset="80%" stopColor="#9f1239" />
                <stop offset="100%" stopColor="#4c0519" />
              </radialGradient>

              <radialGradient id="rightVentricleGrad" cx="35%" cy="45%" r="65%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="45%" stopColor="#be123c" />
                <stop offset="85%" stopColor="#881337" />
                <stop offset="100%" stopColor="#370715" />
              </radialGradient>

              <linearGradient id="atriumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="70%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>

              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* SUPERIOR VENA CAVA (Right side - Blue deoxygenated inflow) */}
            <path
              d="M 160 80 C 160 110, 168 150, 175 190 C 190 185, 205 185, 215 190 C 205 145, 195 105, 195 80 Z"
              fill="url(#venaCavaGrad)"
              stroke="#0284c7"
              strokeWidth="2"
            />

            {/* AORTA & AORTIC ARCH (Center/Upper - Red oxygenated outflow) */}
            <path
              d="M 230 170 C 220 110, 240 70, 290 65 C 340 60, 360 100, 350 160 C 335 155, 310 155, 300 170 C 310 120, 305 100, 280 105 C 255 110, 250 135, 255 170 Z"
              fill="url(#aortaGrad)"
              stroke="#e11d48"
              strokeWidth="2"
            />
            {/* Brachiocephalic artery */}
            <path
              d="M 268 78 L 260 40 L 274 38 L 282 72 Z"
              fill="url(#aortaGrad)"
              stroke="#fb7185"
              strokeWidth="1.5"
            />
            {/* Left Common Carotid artery */}
            <path
              d="M 292 68 L 292 34 L 306 34 L 305 68 Z"
              fill="url(#aortaGrad)"
              stroke="#fb7185"
              strokeWidth="1.5"
            />
            {/* Left Subclavian artery */}
            <path
              d="M 318 72 L 328 38 L 342 42 L 331 78 Z"
              fill="url(#aortaGrad)"
              stroke="#fb7185"
              strokeWidth="1.5"
            />

            {/* PULMONARY ARTERY TRUNK (Cyan/Blue) */}
            <path
              d="M 215 175 C 225 150, 250 145, 280 150 C 300 145, 320 135, 345 130 C 340 145, 325 155, 305 162 C 300 175, 295 190, 290 205 C 265 195, 235 190, 215 175 Z"
              fill="url(#pulmonaryGrad)"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* RIGHT ATRIUM (Upper left side of diagram) */}
            <path
              d="M 140 190 C 130 220, 135 260, 165 285 C 180 270, 195 240, 195 200 C 175 190, 155 185, 140 190 Z"
              fill="url(#atriumGrad)"
              opacity="0.95"
            />

            {/* LEFT ATRIUM (Upper right side of diagram) */}
            <path
              d="M 330 175 C 360 190, 375 225, 365 260 C 350 255, 335 245, 325 220 C 322 195, 325 180, 330 175 Z"
              fill="url(#atriumGrad)"
              opacity="0.95"
            />

            {/* MAIN VENTRICLES (Cardiac Muscle - Myocardium) */}
            {/* Right Ventricle */}
            <path
              d="M 165 285 C 155 330, 185 390, 240 430 C 255 410, 265 370, 270 320 C 272 270, 260 215, 220 205 C 180 225, 170 255, 165 285 Z"
              fill="url(#rightVentricleGrad)"
            />

            {/* Left Ventricle (Thicker, extending into Apex at bottom 270,450) */}
            <path
              d="M 270 320 C 265 375, 255 415, 265 445 C 275 450, 285 440, 305 415 C 355 365, 385 295, 360 255 C 335 240, 305 250, 270 320 Z"
              fill="url(#leftVentricleGrad)"
            />

            {/* Apex of the Heart */}
            <path
              d="M 255 435 C 262 452, 274 452, 282 438 C 275 425, 263 425, 255 435 Z"
              fill="#881337"
            />

            {/* Muscular Striations & Shading overlays for depth */}
            <path
              d="M 180 290 Q 220 330 250 405"
              stroke="#4c0519"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 285 300 Q 320 335 345 375"
              stroke="#fda4af"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 210 240 Q 235 280 255 350"
              stroke="#fb7185"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />

            {/* ANTERIOR INTERVENTRICULAR SULCUS & CORONARY ARTERIES (LAD - Left Anterior Descending) */}
            <g filter="url(#glowFilter)">
              {/* Main coronary artery line (LAD) */}
              <path
                d="M 245 205 Q 260 270 255 340 T 268 440"
                stroke="#fef08a"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Branch 1 */}
              <path
                d="M 252 245 Q 280 270 310 280"
                stroke="#fef08a"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              {/* Branch 2 */}
              <path
                d="M 256 295 Q 295 320 330 335"
                stroke="#fef08a"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              {/* Diagonal branch right */}
              <path
                d="M 250 260 Q 215 285 190 310"
                stroke="#fde047"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              {/* Branch 3 left */}
              <path
                d="M 257 350 Q 290 375 315 390"
                stroke="#fef08a"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* GREAT CARDIAC VEINS (Cyan/Deep Blue branching alongside arteries) */}
            <path
              d="M 240 210 Q 252 265 248 335 T 260 430"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 245 255 Q 220 275 198 295"
              stroke="#38bdf8"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 250 310 Q 285 330 315 350"
              stroke="#38bdf8"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
            />

            {/* SINOATRIAL (SA) NODE ELECTRICAL CONDUCTION GLOW */}
            {isActive && (
              <circle
                cx="155"
                cy="195"
                r="6"
                fill="#38bdf8"
                filter="url(#glowFilter)"
                className="animate-ping"
                style={{ animationDuration: `${beatIntervalMs}ms` }}
              />
            )}
          </svg>
        </div>

        {/* Center overlay badge with live pulse rate */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Activity className="w-4 h-4 animate-bounce" />
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                {isActive ? 'SYNCHRONIZED' : 'IDLE'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono tracking-tight text-white drop-shadow">
                {isActive ? bpm : '--'}
              </span>
              <span className="text-xs font-semibold text-rose-400/80">BPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heart dynamic readout footer */}
      <div className="w-full flex items-center justify-between z-10 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Sinus Rhythm: {isActive ? 'Normal (NSR)' : 'Waiting'}
        </span>
        <span className="text-slate-400">
          Pulse Period: {isActive ? `${(beatIntervalMs / 1000).toFixed(2)}s` : '--'}
        </span>
      </div>

      {/* Inline styles for the dual-pulse "lub-dub" cardiac animation */}
      <style>{`
        @keyframes realisticBeat {
          0% {
            transform: scale(1);
          }
          14% {
            transform: scale(1.085);
          }
          28% {
            transform: scale(0.985);
          }
          42% {
            transform: scale(1.045);
          }
          65% {
            transform: scale(1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes cardiacRipple {
          0% {
            transform: scale(0.7);
            opacity: 0.8;
          }
          60% {
            transform: scale(1.25);
            opacity: 0.15;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
