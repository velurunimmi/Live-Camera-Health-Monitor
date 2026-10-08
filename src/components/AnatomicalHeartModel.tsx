import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Eye,
  Info,
  Layers,
  CheckCircle2,
  Droplet,
  Heart,
  Activity,
  RotateCcw,
  Compass,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { playHeartbeatSound } from '../utils/audio';

interface AnatomicalHeartModelProps {
  bpm: number;
  isActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export type AnatomyCategory = 'all' | 'chambers' | 'arteries' | 'veins';

interface AnatomicalPart {
  id: string;
  name: string;
  latinName: string;
  category: 'chambers' | 'arteries' | 'veins';
  type: 'Oxygenated (O₂ Rich)' | 'Deoxygenated (O₂ Poor)' | 'Myocardial Muscle';
  description: string;
  pointer: {
    side: 'left' | 'right';
    badgeX: number; // percentage in SVG viewBox or layout
    badgeY: number;
    pinX: number;
    pinY: number;
  };
}

const ANATOMICAL_PARTS: AnatomicalPart[] = [
  // 1. Great Arteries
  {
    id: 'aorta',
    name: 'Aortic Arch',
    latinName: 'Arcus Aortae',
    category: 'arteries',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Main systemic arterial trunk distributing oxygen-rich blood under high pressure to the entire body.',
    pointer: {
      side: 'right',
      badgeX: 74,
      badgeY: 12,
      pinX: 52,
      pinY: 16,
    },
  },
  {
    id: 'arch_branches',
    name: 'Brachiocephalic & Carotid',
    latinName: 'Truncus Brachiocephalicus',
    category: 'arteries',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Three major systemic branches feeding oxygenated blood to the head, neck, brain, and upper limbs.',
    pointer: {
      side: 'left',
      badgeX: 18,
      badgeY: 8,
      pinX: 47,
      pinY: 9,
    },
  },
  {
    id: 'pulmonary_trunk',
    name: 'Pulmonary Trunk & Arteries',
    latinName: 'Truncus Pulmonalis',
    category: 'arteries',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Emerges from right ventricle, bifurcating into left & right pulmonary arteries to carry venous blood to lungs.',
    pointer: {
      side: 'right',
      badgeX: 78,
      badgeY: 26,
      pinX: 56,
      pinY: 29,
    },
  },
  {
    id: 'lad',
    name: 'Left Anterior Descending (LAD)',
    latinName: 'Arteria Coronaria Sinistra (LAD)',
    category: 'arteries',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Crucial anterior coronary artery running in interventricular groove, supplying blood to LV myocardium & septum.',
    pointer: {
      side: 'right',
      badgeX: 76,
      badgeY: 62,
      pinX: 53,
      pinY: 66,
    },
  },

  // 2. Main Veins
  {
    id: 'svc',
    name: 'Superior Vena Cava (SVC)',
    latinName: 'Vena Cava Superior',
    category: 'veins',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Large systemic vein returning deoxygenated blood from head, neck, upper thorax, and arms into right atrium.',
    pointer: {
      side: 'left',
      badgeX: 16,
      badgeY: 20,
      pinX: 35,
      pinY: 22,
    },
  },
  {
    id: 'ivc',
    name: 'Inferior Vena Cava (IVC)',
    latinName: 'Vena Cava Inferior',
    category: 'veins',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Major venous conduit returning blood from lower body and abdominal viscera into right atrium.',
    pointer: {
      side: 'left',
      badgeX: 16,
      badgeY: 72,
      pinX: 34,
      pinY: 68,
    },
  },
  {
    id: 'pulmonary_veins',
    name: 'Pulmonary Veins',
    latinName: 'Venae Pulmonales',
    category: 'veins',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Four pulmonary veins carrying freshly oxygenated blood from the lungs into the left atrium.',
    pointer: {
      side: 'right',
      badgeX: 80,
      badgeY: 38,
      pinX: 68,
      pinY: 37,
    },
  },
  {
    id: 'great_cardiac_vein',
    name: 'Great Cardiac Vein',
    latinName: 'Vena Cordis Magna',
    category: 'veins',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Venous vessel ascending anterior sulcus alongside LAD, draining cardiac venous blood into coronary sinus.',
    pointer: {
      side: 'right',
      badgeX: 76,
      badgeY: 76,
      pinX: 56,
      pinY: 74,
    },
  },

  // 3. Chambers
  {
    id: 'ra',
    name: 'Right Atrium & Auricle',
    latinName: 'Atrium Dextrum',
    category: 'chambers',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Thin-walled receiving chamber collecting deoxygenated systemic venous return from SVC, IVC, and coronary sinus.',
    pointer: {
      side: 'left',
      badgeX: 16,
      badgeY: 36,
      pinX: 33,
      pinY: 42,
    },
  },
  {
    id: 'rv',
    name: 'Right Ventricle',
    latinName: 'Ventriculus Dexter',
    category: 'chambers',
    type: 'Deoxygenated (O₂ Poor)',
    description: 'Muscular anterior chamber pumping venous blood through pulmonary valve into the pulmonary trunk.',
    pointer: {
      side: 'left',
      badgeX: 16,
      badgeY: 54,
      pinX: 41,
      pinY: 58,
    },
  },
  {
    id: 'la',
    name: 'Left Auricle / Atrium',
    latinName: 'Auricula Sinistra',
    category: 'chambers',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Receives oxygenated blood from pulmonary veins, priming the left ventricle through the mitral valve.',
    pointer: {
      side: 'right',
      badgeX: 78,
      badgeY: 48,
      pinX: 64,
      pinY: 47,
    },
  },
  {
    id: 'lv',
    name: 'Left Ventricle',
    latinName: 'Ventriculus Sinister',
    category: 'chambers',
    type: 'Oxygenated (O₂ Rich)',
    description: 'Thickest, high-pressure muscular chamber generating systolic pressure to pump oxygenated blood to the body.',
    pointer: {
      side: 'right',
      badgeX: 76,
      badgeY: 88,
      pinX: 60,
      pinY: 78,
    },
  },
  {
    id: 'apex',
    name: 'Cardiac Apex',
    latinName: 'Apex Cordis',
    category: 'chambers',
    type: 'Myocardial Muscle',
    description: 'Inferolateral conical tip of left ventricle pointing toward fifth intercostal space, generating the apical impulse.',
    pointer: {
      side: 'left',
      badgeX: 20,
      badgeY: 90,
      pinX: 52,
      pinY: 94,
    },
  },
];

export const AnatomicalHeartModel: React.FC<AnatomicalHeartModelProps> = ({
  bpm,
  isActive,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedPart, setSelectedPart] = useState<AnatomicalPart | null>(null);
  const [activeCategory, setActiveCategory] = useState<AnatomyCategory>('all');
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Pulse animation states
  const [rotateInBeat, setRotateInBeat] = useState<boolean>(true);
  const [autoRotate3D, setAutoRotate3D] = useState<boolean>(false);
  const [orbitAngle, setOrbitAngle] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [liveBeat, setLiveBeat] = useState({
    torsionDeg: 0,
    cardiacTilt: 0,
    cardiacYaw: 0,
    ventricleScaleY: 1.0,
    ventricleScaleX: 1.0,
    vesselScale: 1.0,
    apexLift: 0,
    cardiacPhase: 'DIASTOLE' as 'SYSTOLE' | 'DICROTIC' | 'DIASTOLE' | 'ATRIAL KICK',
  });

  const beatIntervalMs = Math.max(450, Math.min(1500, Math.round(60000 / (bpm || 72))));
  const [cardiacPhase, setCardiacPhase] = useState<'systole' | 'dicrotic' | 'diastole'>('diastole');

  // Synchronized stethoscope sound effect
  useEffect(() => {
    if (!isActive || !soundEnabled) return;
    const interval = setInterval(() => {
      playHeartbeatSound(0.24);
    }, beatIntervalMs);

    return () => clearInterval(interval);
  }, [isActive, soundEnabled, beatIntervalMs]);

  // Real-time 60FPS Heartbeat Rotation Cycle (Wiggers physiological mechanics)
  useEffect(() => {
    let animId: number;
    const currentBpm = bpm || 72;
    const beatIntervalSec = 60 / currentBpm;

    const tick = () => {
      const now = performance.now();
      const phase = ((now / 1000) % beatIntervalSec) / beatIntervalSec;

      let torsion = 0;
      let tilt = 0;
      let yaw = 0;
      let scaleY = 1.0;
      let scaleX = 1.0;
      let vScale = 1.0;
      let lift = 0;
      let phaseName: 'SYSTOLE' | 'DICROTIC' | 'DIASTOLE' | 'ATRIAL KICK' = 'DIASTOLE';

      if (isActive) {
        if (phase < 0.18) {
          // 1. Ventricular Systole (Rapid Ejection - Counter-Clockwise Apical Torsion)
          const p = Math.sin((phase / 0.18) * Math.PI);
          torsion = -p * 11.5; // ROTATED IN HEARTBEAT: -11.5° wringing torsion
          tilt = p * 6.5; // Anterior chest wall impulse tilt
          yaw = -p * 3.5; // Lateral rotation swing
          scaleY = 1.0 - p * 0.12;
          scaleX = 1.0 - p * 0.08;
          vScale = 1.0 + p * 0.12;
          lift = -p * 9;
          phaseName = 'SYSTOLE';
        } else if (phase < 0.28) {
          // 2. End Ejection / Deceleration
          const p = 1.0 - (phase - 0.18) / 0.1;
          torsion = -p * 4.5;
          tilt = p * 2.0;
          yaw = -p * 1.2;
          scaleY = 1.0 - p * 0.04;
          scaleX = 1.0 - p * 0.03;
          vScale = 1.0 + p * 0.05;
          lift = -p * 3;
          phaseName = 'SYSTOLE';
        } else if (phase < 0.4) {
          // 3. Dicrotic Notch / Semilunar Snap (Rapid Untwisting Recoil)
          const p = Math.sin(((phase - 0.28) / 0.12) * Math.PI);
          torsion = p * 2.8; // Elastic untwisting rebound rotation
          tilt = -p * 1.5;
          phaseName = 'DICROTIC';
        } else if (phase < 0.85) {
          // 4. Diastolic Ventricular Filling
          torsion = 0;
          tilt = 0;
          yaw = 0;
          phaseName = 'DIASTOLE';
        } else {
          // 5. Atrial Kick (Presystolic Priming Twist)
          const p = Math.sin(((phase - 0.85) / 0.15) * Math.PI);
          torsion = -p * 1.8;
          phaseName = 'ATRIAL KICK';
        }
      }

      setLiveBeat({
        torsionDeg: torsion,
        cardiacTilt: tilt,
        cardiacYaw: yaw,
        ventricleScaleY: scaleY,
        ventricleScaleX: scaleX,
        vesselScale: vScale,
        apexLift: lift,
        cardiacPhase: phaseName,
      });

      // Smooth continuous 3D rotation if autoRotate is enabled
      if (autoRotate3D && !isDraggingRef.current) {
        setOrbitAngle((prev) => ({
          ...prev,
          y: (prev.y + 0.4) % 360,
        }));
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isActive, bpm, autoRotate3D]);

  // Mouse & Touch 3D Orbit Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOrbitAngle((prev) => ({
      ...prev,
      y: prev.y + dx * 0.5,
      x: Math.max(-45, Math.min(45, prev.x - dy * 0.4)),
    }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Live physiological deformations & heartbeat rotation computed continuously at 60fps
  const isSystole = liveBeat.cardiacPhase === 'SYSTOLE';
  const isDicrotic = liveBeat.cardiacPhase === 'DICROTIC';

  const ventricleScaleY = liveBeat.ventricleScaleY;
  const ventricleScaleX = liveBeat.ventricleScaleX;
  const vesselScale = liveBeat.vesselScale;
  const apexLift = liveBeat.apexLift;

  const currentRr = Math.round(60000 / (bpm || 72));

  // Filter visible parts by category
  const filteredParts = ANATOMICAL_PARTS.filter(
    (part) => activeCategory === 'all' || part.category === activeCategory
  );

  return (
    <div className="relative flex flex-col items-center justify-between p-4 sm:p-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl select-none min-h-[500px] overflow-hidden group">
      {/* Background radial surgical glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 opacity-60"
        style={{
          background: isActive
            ? 'radial-gradient(circle at center, rgba(225, 29, 72, 0.25) 0%, rgba(15, 23, 42, 0) 75%)'
            : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0) 75%)',
        }}
      />

      {/* TOP HEADER: TELEMETRY & CONTROLS */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 z-20 mb-2">
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
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 font-mono">
            ANATOMICAL HEART MODEL
          </span>
          <span
            className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors border ${
              liveBeat.cardiacPhase === 'SYSTOLE'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/70 font-bold'
                : liveBeat.cardiacPhase === 'DICROTIC'
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/70'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
            }`}
          >
            {liveBeat.cardiacPhase}
          </span>
          {/* Rotated in Heartbeat Live Torsion Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/60 text-[10px] font-mono text-rose-300">
            <RefreshCw className={`w-3 h-3 ${rotateInBeat && Math.abs(liveBeat.torsionDeg) > 0.5 ? 'animate-spin' : ''}`} />
            <span>ROTATED IN BEAT: <strong className="text-white">{rotateInBeat ? `${liveBeat.torsionDeg.toFixed(1)}°` : 'OFF'}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Toggle Beat Rotation */}
          <button
            onClick={() => setRotateInBeat(!rotateInBeat)}
            title={rotateInBeat ? 'Disable Heartbeat Rotation' : 'Enable Rotation in Heartbeat'}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              rotateInBeat
                ? 'bg-rose-950/80 border-rose-500/70 text-rose-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>BEAT ROTATE</span>
          </button>

          {/* Toggle Continuous 3D Auto-Rotation */}
          <button
            onClick={() => setAutoRotate3D(!autoRotate3D)}
            title={autoRotate3D ? 'Pause 3D Auto-Rotation' : 'Enable Continuous 3D Auto-Rotation'}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              autoRotate3D
                ? 'bg-indigo-950/80 border-indigo-500/70 text-indigo-300 font-bold'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>{autoRotate3D ? 'ROTATING 3D' : '3D ORBIT'}</span>
          </button>

          {/* Reset Orbit Angle */}
          {(orbitAngle.x !== 0 || orbitAngle.y !== 0) && (
            <button
              onClick={() => setOrbitAngle({ x: 0, y: 0, z: 0 })}
              title="Reset 3D Orientation"
              className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          )}

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Hide labels' : 'Show anatomical labels'}
            className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all border ${
              showLabels
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>LABELS</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Heartbeat Sound' : 'Enable Heartbeat Sound'}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-rose-400 text-[10px]">SOUND</span>
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

      {/* CATEGORY FILTER TABS */}
      <div className="w-full flex items-center justify-between z-20 gap-2 mb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setActiveCategory('chambers')}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeCategory === 'chambers'
                ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CHAMBERS
          </button>
          <button
            onClick={() => setActiveCategory('arteries')}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeCategory === 'arteries'
                ? 'bg-red-950/90 text-red-300 border border-red-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ARTERIES
          </button>
          <button
            onClick={() => setActiveCategory('veins')}
            className={`px-2.5 py-0.5 rounded-lg transition-all ${
              activeCategory === 'veins'
                ? 'bg-blue-950/90 text-blue-300 border border-blue-500/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            VEINS
          </button>
        </div>

        {/* Live Cardiac Status Readout */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-cyan-400 text-[11px]">R-R: {isActive ? `${currentRr}ms` : '--'}</span>
          <span className="text-rose-400 font-bold">{isActive ? `${bpm} BPM Live` : 'Standby'}</span>
        </div>
      </div>

      {/* MAIN VIEWPORT: HIGH-RESOLUTION DETAILED MEDICAL ANATOMICAL ILLUSTRATION (ROTATED IN HEARTBEAT & 3D INTERACTIVE) */}
      <div
        className="relative w-full flex-1 flex items-center justify-center my-1 select-none overflow-visible min-h-[360px] sm:min-h-[420px]"
        style={{ perspective: 1000 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            isDraggingRef.current = true;
            dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchMove={(e) => {
          if (!isDraggingRef.current || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - dragStartRef.current.x;
          const dy = e.touches[0].clientY - dragStartRef.current.y;
          setOrbitAngle((prev) => ({
            ...prev,
            y: prev.y + dx * 0.5,
            x: Math.max(-45, Math.min(45, prev.x - dy * 0.4)),
          }));
          dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={() => {
          isDraggingRef.current = false;
        }}
      >
        {/* 3D Rotatable Heart Assembly Stage */}
        <div
          className="relative w-full h-full max-h-[440px] flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{
            transform: `perspective(900px) rotateX(${orbitAngle.x + (rotateInBeat ? liveBeat.cardiacTilt : 0)}deg) rotateY(${orbitAngle.y + (rotateInBeat ? liveBeat.cardiacYaw : 0)}deg) rotateZ(${orbitAngle.z + (rotateInBeat ? liveBeat.torsionDeg * 0.35 : 0)}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDraggingRef.current ? 'none' : 'transform 60ms linear',
          }}
        >
          {/* SVG MEDICAL ANATOMY CANVAS WITH REAL-TIME PULSING & ROTATION MECHANICS */}
          <svg
          viewBox="0 0 1000 960"
          className="w-full h-full max-h-[440px] drop-shadow-2xl overflow-visible"
          style={{
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7))',
          }}
        >
          <defs>
            {/* 1. Deep Myocardial Muscle Gradients */}
            <linearGradient id="lvMuscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="40%" stopColor="#881337" />
              <stop offset="80%" stopColor="#6b0f2b" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            <linearGradient id="rvMuscleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="45%" stopColor="#9f1239" />
              <stop offset="85%" stopColor="#700d2b" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>

            <radialGradient id="atriumGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="60%" stopColor="#881337" />
              <stop offset="100%" stopColor="#50071c" />
            </radialGradient>

            {/* 2. Great Vessels: Oxygenated Aorta (Crimson-Red) */}
            <linearGradient id="aortaGrad" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>

            {/* 3. Pulmonary Trunk & Arteries (Cyan-Cobalt) */}
            <linearGradient id="pulmonaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="30%" stopColor="#0284c7" />
              <stop offset="75%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            {/* 4. Vena Cavae (Deep Venous Blue) */}
            <linearGradient id="venaCavaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="40%" stopColor="#0369a1" />
              <stop offset="85%" stopColor="#075985" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>

            {/* 5. Epicardial Adipose Fat Pad Gradient */}
            <linearGradient id="fatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#fde047" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.75" />
            </linearGradient>

            {/* 6. Coronary Artery Gold/Red Glow */}
            <linearGradient id="coronaryArtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Filter: Subtle 3D biological bevel & soft shadow */}
            <filter id="medGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
            </filter>
            <filter id="vesselGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.4" />
            </filter>
            <filter id="aortaGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#f43f5e" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* LAYER 1: POSTERIOR GREAT VESSELS (SVC, IVC, PULMONARY VEINS) */}
          <g id="posterior_vessels" className="transition-transform duration-300">
            {/* Superior Vena Cava (SVC) - Descending from top into Right Atrium */}
            <path
              d="M 320 80 L 375 80 L 375 290 Q 375 320 360 350 L 315 340 Q 320 280 320 80 Z"
              fill="url(#venaCavaGrad)"
              filter="url(#vesselGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'svc' ? 'stroke-cyan-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'svc') || null)}
            />
            {/* SVC Vessel Volume Highlight */}
            <path
              d="M 335 90 L 345 90 L 345 320 L 335 320 Z"
              fill="#38bdf8"
              opacity="0.35"
            />

            {/* Inferior Vena Cava (IVC) - Emerging inferiorly into Right Atrium */}
            <path
              d="M 320 590 L 370 590 L 370 760 Q 345 765 320 760 L 320 590 Z"
              fill="url(#venaCavaGrad)"
              filter="url(#vesselGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'ivc' ? 'stroke-cyan-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'ivc') || null)}
            />

            {/* Left Pulmonary Veins (Red Oxygenated - entering posterior LA) */}
            <path
              d="M 640 330 C 680 325 710 325 740 335 L 740 365 C 710 355 670 355 640 360 Z"
              fill="url(#aortaGrad)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_veins') || null)}
            />
            <path
              d="M 640 375 C 680 370 710 370 740 380 L 740 405 C 710 395 670 395 640 400 Z"
              fill="url(#aortaGrad)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_veins') || null)}
            />

            {/* Right Pulmonary Veins (Red Oxygenated - emerging behind SVC) */}
            <path
              d="M 270 320 C 290 320 310 320 330 325 L 330 350 C 310 345 290 345 270 345 Z"
              fill="url(#aortaGrad)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_veins') || null)}
            />
            <path
              d="M 270 360 C 290 360 310 360 330 365 L 330 390 C 310 385 290 385 270 385 Z"
              fill="url(#aortaGrad)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_veins') || null)}
            />
          </g>

          {/* LAYER 2: ASCENDING AORTA & AORTIC ARCH (Systemic Oxygenated Arteries) */}
          <g
            id="aorta_system"
            className="transition-transform duration-75 origin-[500px_250px]"
            style={{
              transform: `rotate(${rotateInBeat ? -liveBeat.torsionDeg * 0.18 : 0}deg) scale(${vesselScale})`,
            }}
          >
            {/* The 3 Major Arch Branches */}
            {/* 1. Brachiocephalic Artery (Innominate) */}
            <path
              d="M 435 155 L 420 50 L 452 45 L 465 145 Z"
              fill="url(#aortaGrad)"
              filter="url(#aortaGlow)"
              className={`cursor-pointer ${selectedPart?.id === 'arch_branches' ? 'stroke-rose-300 stroke-2' : ''}`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'arch_branches') || null)}
            />
            {/* 2. Left Common Carotid Artery */}
            <path
              d="M 480 135 L 485 40 L 515 38 L 510 130 Z"
              fill="url(#aortaGrad)"
              filter="url(#aortaGlow)"
              className={`cursor-pointer ${selectedPart?.id === 'arch_branches' ? 'stroke-rose-300 stroke-2' : ''}`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'arch_branches') || null)}
            />
            {/* 3. Left Subclavian Artery */}
            <path
              d="M 530 140 L 550 45 L 578 48 L 560 155 Z"
              fill="url(#aortaGrad)"
              filter="url(#aortaGlow)"
              className={`cursor-pointer ${selectedPart?.id === 'arch_branches' ? 'stroke-rose-300 stroke-2' : ''}`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'arch_branches') || null)}
            />

            {/* Ascending Aorta & Massive Aortic Arch */}
            <path
              d="M 405 340 C 400 240 405 180 430 150 C 465 110 560 115 600 170 C 625 210 635 270 635 340 L 575 340 C 575 280 570 230 550 195 C 530 160 480 160 460 190 C 445 220 445 270 450 340 Z"
              fill="url(#aortaGrad)"
              filter="url(#aortaGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'aorta' ? 'stroke-rose-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'aorta') || null)}
            />

            {/* Wet specular light curvature on Aortic Arch */}
            <path
              d="M 445 160 C 475 130 540 130 575 170"
              stroke="#fecdd3"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>

          {/* LAYER 3: PULMONARY TRUNK & BIFURCATION (Crossing anterior to Aorta) */}
          <g
            id="pulmonary_system"
            className="transition-transform duration-75 origin-[500px_300px]"
            style={{
              transform: `rotate(${rotateInBeat ? -liveBeat.torsionDeg * 0.14 : 0}deg) scale(${vesselScale})`,
            }}
          >
            {/* Left Pulmonary Artery branching out to left lung */}
            <path
              d="M 550 255 C 585 250 635 240 685 245 L 685 285 C 640 280 590 285 550 295 Z"
              fill="url(#pulmonaryGrad)"
              filter="url(#vesselGlow)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_trunk') || null)}
            />
            {/* Right Pulmonary Artery passing under aortic arch to right lung */}
            <path
              d="M 440 255 C 410 250 365 240 315 245 L 315 285 C 360 280 400 285 440 295 Z"
              fill="url(#pulmonaryGrad)"
              filter="url(#vesselGlow)"
              className="cursor-pointer"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_trunk') || null)}
            />

            {/* Main Pulmonary Trunk */}
            <path
              d="M 445 380 C 440 310 460 265 540 250 C 580 255 585 295 565 340 C 545 380 535 410 525 435 L 460 425 C 470 395 475 370 445 380 Z"
              fill="url(#pulmonaryGrad)"
              filter="url(#vesselGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'pulmonary_trunk' ? 'stroke-cyan-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'pulmonary_trunk') || null)}
            />
            {/* Specular highlight on pulmonary trunk */}
            <path
              d="M 480 290 Q 520 280 540 310"
              stroke="#bae6fd"
              strokeWidth="4"
              fill="none"
              opacity="0.5"
            />
          </g>

          {/* LAYER 4: CARDIAC CHAMBERS (ATRIA & VENTRICLES WITH ROTATION IN HEARTBEAT) */}
          <g
            id="heart_chambers"
            className="transition-transform duration-75 origin-[500px_470px]"
            style={{
              transform: `rotate(${rotateInBeat ? liveBeat.torsionDeg : 0}deg) scale(${ventricleScaleX}, ${ventricleScaleY}) translateY(${apexLift}px)`,
            }}
          >
            {/* RIGHT ATRIUM (Venous receiving border) */}
            <path
              d="M 330 340 C 270 360 250 440 260 520 C 270 590 315 620 350 630 C 375 630 385 600 390 550 C 390 480 380 400 360 350 Z"
              fill="url(#atriumGrad)"
              filter="url(#medGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'ra' ? 'stroke-rose-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'ra') || null)}
            />
            {/* Right Auricle Pectinate Edge overlapping aorta */}
            <path
              d="M 350 350 C 370 345 420 350 435 385 C 410 400 385 395 365 375 Z"
              fill="#be123c"
              opacity="0.9"
            />

            {/* LEFT AURICLE / ATRIUM (Dog-ear appendage curving around pulmonary trunk) */}
            <path
              d="M 625 340 C 655 350 680 390 675 440 C 665 470 630 485 615 480 C 600 460 595 420 600 380 Z"
              fill="url(#atriumGrad)"
              filter="url(#medGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'la' ? 'stroke-rose-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'la') || null)}
            />

            {/* RIGHT VENTRICLE (Anterior muscular crescent chamber) */}
            <path
              d="M 365 520 C 360 620 375 700 420 760 C 455 805 485 845 510 870 C 490 800 480 730 475 660 C 470 590 470 510 460 430 C 420 440 380 480 365 520 Z"
              fill="url(#rvMuscleGrad)"
              filter="url(#medGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'rv' ? 'stroke-rose-300 stroke-2 brightness-125' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'rv') || null)}
            />

            {/* LEFT VENTRICLE & APEX (Thick systemic high-pressure pump reaching the Apex) */}
            <path
              d="M 460 430 C 510 440 600 460 645 520 C 685 580 690 660 670 730 C 640 810 590 875 535 930 C 525 938 518 938 510 870 C 485 845 475 750 475 660 C 470 590 470 510 460 430 Z"
              fill="url(#lvMuscleGrad)"
              filter="url(#medGlow)"
              className={`cursor-pointer transition-all duration-200 ${
                selectedPart?.id === 'lv' || selectedPart?.id === 'apex'
                  ? 'stroke-rose-300 stroke-2 brightness-125'
                  : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'lv') || null)}
            />

            {/* Helical Vortex Striation Lines on Myocardium */}
            <g opacity="0.3" stroke="#fecdd3" strokeWidth="1.2" fill="none">
              <path d="M 470 500 Q 520 540 560 600 Q 590 670 610 740" />
              <path d="M 475 550 Q 530 610 565 680 Q 585 740 570 820" />
              <path d="M 480 620 Q 520 680 545 760 Q 555 820 535 890" />
              <path d="M 400 560 Q 420 620 445 700 Q 460 760 490 820" />
              <path d="M 380 600 Q 410 680 430 740" />
            </g>

            {/* LAYER 5: EPICARDIAL ADIPOSE FAT PADS (Sulcus Fat Beds) */}
            {/* Atrioventricular Groove Fat Band */}
            <path
              d="M 355 490 Q 410 470 470 460 Q 540 475 625 500 Q 550 495 460 480 Q 400 485 355 490 Z"
              fill="url(#fatGrad)"
              opacity="0.85"
            />
            {/* Anterior Interventricular Sulcus Fat Pad */}
            <path
              d="M 470 460 Q 480 560 485 670 Q 495 780 520 880 Q 500 830 480 740 Q 470 630 465 520 Z"
              fill="url(#fatGrad)"
              opacity="0.88"
            />

            {/* LAYER 6: CORONARY ARTERY & VEIN VASCULAR NETWORK */}
            {/* Left Anterior Descending Artery (LAD) */}
            <path
              d="M 480 470 Q 490 560 495 660 Q 505 760 528 880"
              stroke="url(#coronaryArtGrad)"
              strokeWidth="5.5"
              fill="none"
              strokeLinecap="round"
              className={`cursor-pointer ${selectedPart?.id === 'lad' ? 'stroke-yellow-300 stroke-[8px]' : ''}`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'lad') || null)}
            />
            {/* LAD Diagonal Branches (D1 & D2) */}
            <path
              d="M 490 560 Q 530 590 575 615"
              stroke="url(#coronaryArtGrad)"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 500 670 Q 540 705 580 735"
              stroke="url(#coronaryArtGrad)"
              strokeWidth="2.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* Great Cardiac Vein (Running parallel with LAD) */}
            <path
              d="M 472 475 Q 482 565 488 665 Q 498 765 520 870"
              stroke="#0284c7"
              strokeWidth="4.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
              className={`cursor-pointer ${
                selectedPart?.id === 'great_cardiac_vein' ? 'stroke-cyan-300 stroke-[7px]' : ''
              }`}
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'great_cardiac_vein') || null)}
            />

            {/* Right Coronary Artery (RCA) winding in right atrioventricular groove */}
            <path
              d="M 430 435 Q 380 460 365 495 Q 355 530 365 590"
              stroke="url(#coronaryArtGrad)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            {/* CARDIAC APEX HIGHLIGHT PIN */}
            <circle
              cx="528"
              cy="930"
              r="7"
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="cursor-pointer animate-pulse"
              onClick={() => setSelectedPart(ANATOMICAL_PARTS.find((p) => p.id === 'apex') || null)}
            />
          </g>
        </svg>
      </div>

        {/* LAYER 7: CLINICAL CALLOUT POINTER LABELS (CLEAR LEADER LINES & BADGES) */}
        {showLabels && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {filteredParts.map((part) => {
              const isSelected = selectedPart?.id === part.id;
              const isLeft = part.pointer.side === 'left';

              // Category-based badge colors
              const badgeTheme =
                part.category === 'arteries'
                  ? 'border-rose-500/80 bg-slate-950/90 text-rose-300 hover:bg-rose-950/60'
                  : part.category === 'veins'
                  ? 'border-cyan-500/80 bg-slate-950/90 text-cyan-300 hover:bg-cyan-950/60'
                  : 'border-emerald-500/80 bg-slate-950/90 text-emerald-300 hover:bg-emerald-950/60';

              return (
                <div key={part.id} className="absolute inset-0 pointer-events-none">
                  {/* Interactive Label Badge */}
                  <div
                    style={{
                      left: `${part.pointer.badgeX}%`,
                      top: `${part.pointer.badgeY}%`,
                      transform: isLeft ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
                    }}
                    className={`absolute pointer-events-auto transition-all duration-200 cursor-pointer ${
                      isSelected ? 'scale-110 z-40' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedPart(isSelected ? null : part)}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] sm:text-[11px] font-mono shadow-xl backdrop-blur-md transition-all ${
                        isSelected
                          ? 'border-white bg-white text-slate-950 font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                          : badgeTheme
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          part.category === 'arteries'
                            ? 'bg-rose-500'
                            : part.category === 'veins'
                            ? 'bg-cyan-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span className="font-semibold whitespace-nowrap">{part.name}</span>
                    </div>
                  </div>

                  {/* SVG Leader Pointer Line from Badge to Anatomical Pin */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {/* Glowing Target Pin on Organ */}
                    <circle
                      cx={`${part.pointer.pinX}%`}
                      cy={`${part.pointer.pinY}%`}
                      r={isSelected ? '5' : '3.5'}
                      fill={
                        part.category === 'arteries'
                          ? '#f43f5e'
                          : part.category === 'veins'
                          ? '#06b6d4'
                          : '#10b981'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '2' : '1.2'}
                      className="transition-all duration-200"
                    />

                    {/* Connecting Leader Line */}
                    <line
                      x1={`${part.pointer.badgeX}%`}
                      y1={`${part.pointer.badgeY}%`}
                      x2={`${part.pointer.pinX}%`}
                      y2={`${part.pointer.pinY}%`}
                      stroke={
                        isSelected
                          ? '#ffffff'
                          : part.category === 'arteries'
                          ? 'rgba(244, 63, 94, 0.45)'
                          : part.category === 'veins'
                          ? 'rgba(6, 182, 212, 0.45)'
                          : 'rgba(16, 185, 129, 0.45)'
                      }
                      strokeWidth={isSelected ? '1.8' : '1'}
                      strokeDasharray={isSelected ? 'none' : '3 3'}
                      className="transition-all duration-200"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM DRAWER / INSPECTION CARD (Appears when a part is clicked or hovered) */}
      <div className="w-full z-20 mt-2">
        {selectedPart ? (
          <div className="w-full p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">{selectedPart.name}</span>
                <span className="text-[11px] text-slate-400 italic font-serif">
                  ({selectedPart.latinName})
                </span>
                <span
                  className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                    selectedPart.type.includes('Oxygenated')
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                      : selectedPart.type.includes('Deoxygenated')
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                  }`}
                >
                  {selectedPart.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {selectedPart.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedPart(null)}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors self-end sm:self-center"
            >
              Clear Selection
            </button>
          </div>
        ) : (
          <div className="w-full py-2 px-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Click any anatomical label to inspect vessel hemodynamics &amp; physiological function.
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Arteries (O₂ Rich)
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Veins (O₂ Poor)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Chambers
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
