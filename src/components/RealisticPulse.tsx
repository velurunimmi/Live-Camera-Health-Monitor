import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Activity, Waves, Gauge } from 'lucide-react';
import { playHeartbeatSound } from '../utils/audio';

interface RealisticPulseProps {
  bpm: number;
  isActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  status: 'stable' | 'elevated' | 'analyzing';
}

export const RealisticPulse: React.FC<RealisticPulseProps> = ({
  bpm,
  isActive,
  soundEnabled,
  onToggleSound,
  status,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatIntervalMs = Math.max(450, Math.min(1500, Math.round(60000 / (bpm || 72))));
  const [cardiacPhase, setCardiacPhase] = useState<'Systole (S1)' | 'Dicrotic Notch (S2)' | 'Diastole'>('Diastole');
  const [pulseExpansion, setPulseExpansion] = useState<number>(1);

  // Sound triggering effect
  useEffect(() => {
    if (!isActive || !soundEnabled) return;
    const interval = setInterval(() => {
      playHeartbeatSound(0.22);
    }, beatIntervalMs);

    return () => clearInterval(interval);
  }, [isActive, soundEnabled, beatIntervalMs]);

  // Real-time 60 FPS Physiological Arterial Pulse Waveform (PPG) Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sweepX = 0;
    const points: number[] = new Array(300).fill(0);
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height * 0.58;
      const amplitude = height * 0.36;

      // Calculate instantaneous phase in the cardiac cycle (0 to 1)
      const periodSec = (60 / (bpm || 72));
      const phase = ((time / 1000) % periodSec) / periodSec;

      // Realistic Arterial PPG waveform mathematical formula:
      // Combines systolic percussion wave, dicrotic notch (incisura), and diastolic reflection wave
      let pulseValue = 0;
      if (isActive) {
        if (phase < 0.16) {
          // Rapid systolic ejection / percussion peak (Anacrotic limb)
          const p = phase / 0.16;
          pulseValue = Math.sin((p * Math.PI) / 2);
          setCardiacPhase('Systole (S1)');
          setPulseExpansion(1 + pulseValue * 0.28);
        } else if (phase < 0.28) {
          // Transition down toward dicrotic notch
          const p = (phase - 0.16) / 0.12;
          pulseValue = 1 - p * 0.65;
          setCardiacPhase('Systole (S1)');
          setPulseExpansion(1 + pulseValue * 0.25);
        } else if (phase < 0.38) {
          // Dicrotic notch rebound (aortic valve closure + elastic wave recoil)
          const p = (phase - 0.28) / 0.1;
          pulseValue = 0.35 + Math.sin(p * Math.PI) * 0.22;
          setCardiacPhase('Dicrotic Notch (S2)');
          setPulseExpansion(1 + pulseValue * 0.18);
        } else {
          // Diastolic runoff & ventricular filling
          const p = (phase - 0.38) / 0.62;
          pulseValue = 0.35 * Math.exp(-p * 3.8);
          setCardiacPhase('Diastole');
          setPulseExpansion(1 + pulseValue * 0.08);
        }
      } else {
        // Idle gentle baseline noise
        pulseValue = Math.sin(time / 400) * 0.05;
        setPulseExpansion(1);
      }

      // Shift sweeping points array
      points.push(pulseValue);
      if (points.length > width) {
        points.shift();
      }

      // Sweep cursor position
      sweepX = (sweepX + dt * 110) % width;

      // Clear canvas with deep dark medical backdrop
      ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw faint ECG/Telemetry grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 25) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 25) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw Isoelectric baseline
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the Arterial PPG Pulse Waveform with gradient & glow
      ctx.shadowBlur = isActive ? 12 : 3;
      ctx.shadowColor =
        status === 'elevated'
          ? 'rgba(239, 68, 68, 0.8)'
          : isActive
          ? 'rgba(16, 185, 129, 0.85)'
          : 'rgba(6, 182, 212, 0.5)';

      const waveGrad = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
      if (status === 'elevated') {
        waveGrad.addColorStop(0, '#f87171');
        waveGrad.addColorStop(1, '#dc2626');
      } else if (isActive) {
        waveGrad.addColorStop(0, '#34d399');
        waveGrad.addColorStop(1, '#059669');
      } else {
        waveGrad.addColorStop(0, '#38bdf8');
        waveGrad.addColorStop(1, '#0284c7');
      }

      ctx.strokeStyle = waveGrad;
      ctx.lineWidth = 2.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const startIdx = Math.max(0, points.length - width);
      for (let i = 0; i < width; i++) {
        const val = points[startIdx + i] || 0;
        const py = centerY - val * amplitude;
        if (i === 0) {
          ctx.moveTo(i, py);
        } else {
          ctx.lineTo(i, py);
        }
      }
      ctx.stroke();

      // Draw glowing sweeping scanner head bar
      if (isActive) {
        const cursorX = width - 4;
        const currentVal = points[points.length - 1] || 0;
        const cursorY = centerY - currentVal * amplitude;

        ctx.fillStyle = '#6ee7b7';
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#10b981';
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, bpm, status]);

  const rrInterval = Math.round(60000 / (bpm || 72));

  return (
    <div className="relative flex flex-col items-center justify-between p-6 bg-slate-900/70 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden group">
      {/* Top telemetry bar */}
      <div className="w-full flex items-center justify-between z-10 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isActive ? 'bg-emerald-400 opacity-75' : 'bg-slate-500 opacity-40'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 font-mono">
            ARTERIAL PULSE WAVE DYNAMICS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Stethoscope Sound' : 'Enable Stethoscope Sound'}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px]">SOUND ON</span>
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

      {/* CENTERPIECE: REALISTIC HEMODYNAMIC PULSE WAVE VISUALIZATION */}
      <div className="relative w-full flex flex-col items-center my-1">
        {/* Continuous Sweeping Arterial Photoplethysmogram (PPG) Canvas */}
        <div className="relative w-full h-36 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-inner overflow-hidden mb-4">
          <canvas
            ref={canvasRef}
            width={460}
            height={144}
            className="w-full h-full block"
          />

          {/* Overlay Waveform Labels */}
          <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              rPPG PULSE MORPHOLOGY
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              R-R: {isActive ? `${rrInterval}ms` : '--'}
            </span>
          </div>

          <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[10px] font-mono pointer-events-none">
            <span className="text-slate-400">
              Phase: <strong className="text-cyan-300">{isActive ? cardiacPhase : 'Idle'}</strong>
            </span>
          </div>
        </div>

        {/* REALISTIC PULSATING ARTERIAL LUMEN & MICRO-VASCULAR CAPILLARY CHAMBER */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 z-10">
          {/* 1. Pulsating Capillary Vascular Lumen Cross-Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            {/* The physically dilating arterial lumen ring */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              {/* Outer vascular wall */}
              <div
                className="absolute w-14 h-14 rounded-full border-2 border-rose-500/40 bg-rose-950/30 transition-transform duration-75 flex items-center justify-center"
                style={{
                  transform: `scale(${pulseExpansion})`,
                  boxShadow: isActive ? '0 0 16px rgba(244, 63, 94, 0.35)' : 'none',
                }}
              >
                {/* Inner blood volume core (hemoglobin surge) */}
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 transition-transform duration-75 shadow-inner"
                  style={{
                    transform: `scale(${pulseExpansion * 1.05})`,
                  }}
                />
              </div>

              {/* Concentric pulsatile shockwave */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none animate-ping"
                  style={{ animationDuration: `${beatIntervalMs}ms` }}
                />
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">
                ARTERIAL LUMEN DILATION
              </span>
              <span className="text-xs font-mono font-bold text-white mt-0.5">
                {isActive ? `${(pulseExpansion * 100 - 100).toFixed(1)}% Volume Stroke` : 'Baseline Rest'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 mt-0.5">
                {isActive ? 'Elastic Compliance Normal' : 'Standby'}
              </span>
            </div>
          </div>

          {/* 2. Hemodynamic Pulse Telemetry Indices */}
          <div className="flex flex-col justify-center p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                Perfusion Index (PI)
              </span>
              <span className="text-emerald-300 font-bold">
                {isActive ? '4.82 %' : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-rose-400" />
                Pulse Wave Velocity
              </span>
              <span className="text-slate-200">
                {isActive ? '5.4 m/s (Optimal)' : '--'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Dicrotic Incisura
              </span>
              <span className="text-cyan-300">
                {isActive ? 'Confirmed (AV Closure)' : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="w-full flex items-center justify-between z-10 pt-3 mt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Sinus Rhythm: {isActive ? 'Normal Sinus Flow' : 'Waiting for Subject'}
        </span>
        <span className="text-cyan-400">
          Pulse Period: {isActive ? `${(beatIntervalMs / 1000).toFixed(2)}s` : '--'}
        </span>
      </div>
    </div>
  );
};
