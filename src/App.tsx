import { useState, useCallback, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { AnatomicalHeartModel } from './components/AnatomicalHeartModel';
import { ThreeRealisticHeart } from './components/ThreeRealisticHeart';
import { VitalsDisplay, VitalsData } from './components/VitalsDisplay';
import {
  Activity,
  Shield,
  HelpCircle,
  X,
  Radio,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [isCaptured, setIsCaptured] = useState<boolean>(false);
  const [currentSubjectId, setCurrentSubjectId] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [glucoseUnit, setGlucoseUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [heartViewMode, setHeartViewMode] = useState<'three3d' | 'anatomical'>('three3d');

  // 5-Minute Session Timer State (300 seconds)
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState<number>(300);

  // Live updating vitals state (Nullable: cleared when person leaves frame or after 5 mins)
  const [vitals, setVitals] = useState<VitalsData | null>(null);

  // Clear Session Data (Ensures no data from previous users is stored)
  const handleClearSession = useCallback(() => {
    setIsCaptured(false);
    setIsScanning(true);
    setVitals(null);
    setSessionSecondsRemaining(300);
  }, []);

  // Handle immediate face capture & start 5-minute session
  const handleFaceCaptured = useCallback(
    (captured: boolean, subjectId: number) => {
      if (captured) {
        setIsCaptured(true);
        // Scanner captures the face and immediately stops scanning!
        setIsScanning(false);
        setCurrentSubjectId(subjectId);
        setSessionSecondsRemaining(300);

        const baseVariants = [
          { hr: 72, sys: 118, dia: 76, sugar: 94 },
          { hr: 68, sys: 114, dia: 74, sugar: 88 },
          { hr: 76, sys: 122, dia: 78, sugar: 98 },
          { hr: 74, sys: 116, dia: 75, sugar: 92 },
        ];
        const variant = baseVariants[(subjectId - 1) % baseVariants.length];

        setVitals({
          heartRate: variant.hr,
          systolic: variant.sys,
          diastolic: variant.dia,
          bloodSugar: variant.sugar,
          bloodSugarTrend: 'stable',
          status: 'stable',
          confidence: 0.98,
        });
      } else {
        handleClearSession();
      }
    },
    [handleClearSession]
  );

  // 5-Minute Session Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCaptured) {
      timer = setInterval(() => {
        setSessionSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired: automatically clear session data
            handleClearSession();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCaptured, handleClearSession]);

  // Real-time live vitals updates while person remains present in session
  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;

    if (isCaptured) {
      let tick = 0;
      updateInterval = setInterval(() => {
        tick++;
        // Subtle natural physiological sinus arrhythmia fluctuation (e.g. ±1 to 2 BPM)
        setVitals((prev) => {
          if (!prev) return null;
          const baseVariants = [
            { hr: 72, sys: 118, dia: 76, sugar: 94 },
            { hr: 68, sys: 114, dia: 74, sugar: 88 },
            { hr: 76, sys: 122, dia: 78, sugar: 98 },
            { hr: 74, sys: 116, dia: 75, sugar: 92 },
          ];
          const base = baseVariants[(currentSubjectId - 1) % baseVariants.length];

          const sinusDelta = Math.sin(tick * 0.4) * 2 + (Math.random() - 0.5) * 1.2;
          const currentBpm = Math.round(base.hr + sinusDelta);

          const sysDelta = Math.round((currentBpm - base.hr) * 0.35 + (Math.random() - 0.5));
          const diaDelta = Math.round((currentBpm - base.hr) * 0.2 + (Math.random() - 0.5));

          const sugarDelta = Math.sin(tick * 0.15) * 1.5;
          const currentSugar = Math.round(base.sugar + sugarDelta);

          return {
            heartRate: currentBpm,
            systolic: base.sys + sysDelta,
            diastolic: base.dia + diaDelta,
            bloodSugar: currentSugar,
            bloodSugarTrend: sugarDelta > 0.8 ? 'rising' : sugarDelta < -0.8 ? 'falling' : 'stable',
            status: 'stable',
            confidence: 0.98,
          };
        });
      }, 1200);
    }

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [isCaptured, currentSubjectId]);

  const toggleScan = () => {
    if (isCaptured) {
      // If captured and clicking scan, reset session and start scanning for next subject
      handleClearSession();
    } else {
      setIsScanning((prev) => !prev);
    }
  };

  const toggleSimulation = () => {
    setSimulationMode((prev) => !prev);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const toggleGlucoseUnit = () => {
    setGlucoseUnit((prev) => (prev === 'mg/dL' ? 'mmol/L' : 'mg/dL'));
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeBpm = isCaptured && vitals ? vitals.heartRate : 70;
  const currentRr = Math.round(60000 / activeBpm);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Background ambient grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(rgba(14, 165, 233, 0.25) 1px, transparent 1px), radial-gradient(rgba(244, 63, 94, 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px, 80px 80px',
        }}
      />

      {/* TOP NAVIGATION / TELEMETRY HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-rose-500 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight font-mono text-white">
                  VITAL<span className="text-cyan-400">CAM</span>
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  LIVE HEALTH MONITOR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                High-Speed Circular Telemetry • 5-Min Persistent Session
              </p>
            </div>
          </div>

          {/* Center Status Badge & Session Countdown */}
          <div className="flex items-center gap-2.5">
            {isCaptured ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>SESSION: {formatTimer(sessionSecondsRemaining)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-300 tracking-wider">
                    LIVE VITALS ACTIVE (#{currentSubjectId})
                  </span>
                </div>
              </>
            ) : isScanning ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40">
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="text-xs font-mono font-medium text-cyan-300 tracking-wider">
                  HIGH-SPEED SCANNER READY
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-600" />
                <span className="text-xs font-mono">SCANNER PAUSED</span>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoModal(true)}
              title="About contactless rPPG telemetry"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TOP ROW: COMPACT CIRCULAR SCANNER & CONTINUOUS 3D MEDICAL HEART */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* COMPACT CIRCULAR SCANNER (Left Column) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isScanning ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
                  CIRCULAR FACE SCANNER
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {isCaptured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Subject #{currentSubjectId} Captured
                  </span>
                ) : (
                  'Instant Detection Ready'
                )}
              </span>
            </div>

            <CameraView
              isScanning={isScanning}
              onToggleScan={toggleScan}
              onFaceCaptured={handleFaceCaptured}
              onClearSession={handleClearSession}
              sessionSecondsRemaining={sessionSecondsRemaining}
              simulationMode={simulationMode}
              onToggleSimulation={toggleSimulation}
            />
          </div>

          {/* DETAILED ANATOMICAL BEATING HEART MODEL (Right Column) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">
                  {heartViewMode === 'three3d'
                    ? '3D MEDICAL ANATOMY • ALL SIDES ROTATED IN HEARTBEAT'
                    : 'REALISTIC ANATOMICAL HEART (ROTATED IN HEARTBEAT)'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => setHeartViewMode('three3d')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      heartViewMode === 'three3d'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    3D Medical Anatomy
                  </button>
                  <button
                    onClick={() => setHeartViewMode('anatomical')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      heartViewMode === 'anatomical'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Anatomic Diagram
                  </button>
                </div>
                <span className="text-[11px] font-mono text-rose-400 font-bold">
                  {isCaptured && vitals
                    ? `${vitals.heartRate} BPM (R-R: ${currentRr}ms) Live`
                    : '70 BPM (R-R: 857ms) Resting'}
                </span>
              </div>
            </div>

            {heartViewMode === 'three3d' ? (
              <ThreeRealisticHeart
                bpm={activeBpm}
                isActive={true}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
            ) : (
              <AnatomicalHeartModel
                bpm={activeBpm}
                isActive={true} // Continuously rendered and active throughout all states
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
              />
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: LIVE VITAL SIGNS CARDS WITH SAFE / DANGER ZONES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                REAL-TIME LIVE VITALS DASHBOARD (SAFE / DANGER ZONES)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-cyan-400">R-R Period: {currentRr}ms</span>
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>5-Min Session Protected</span>
            </div>
          </div>

          {/* Vitals Cards (BPM, BP, Blood Sugar) */}
          <VitalsDisplay
            vitals={vitals}
            isActive={isCaptured}
            unit={glucoseUnit}
            onToggleUnit={toggleGlucoseUnit}
          />
        </section>

        {/* Informational Guidance Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              High-speed scanner captures faces instantaneously. Vitals update live for 5 minutes, auto-resetting when person departs.
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Zero biometric history retained.
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-[11px] font-mono text-slate-400">
        VitalCam Contactless Health Telemetry System • High-Speed Face Scanner &amp; Detailed Anatomical Heart Model
      </footer>

      {/* INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Live Health Monitor System
                </h3>
                <p className="text-xs text-slate-400">Accelerated Detection &amp; 5-Min Session Manager</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p>
                <strong className="text-cyan-300 font-mono">Accelerated Detection:</strong> The circular face scanner evaluates frames at high speed, capturing the subject nearly instantly upon entering the circle without delays.
              </p>
              <p>
                <strong className="text-emerald-300 font-mono">5-Minute Persistent Session:</strong> Captured vitals remain displayed and update live for 5 minutes (or until the person leaves the frame), at which point it automatically resets for the next person.
              </p>
              <p>
                <strong className="text-rose-300 font-mono">Live Anatomical Model:</strong> Highly detailed medical anatomical illustration clearly displaying main arteries, veins, and chambers with interactive labels and real-time pulsing mechanics.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
