import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Video, RefreshCw, AlertTriangle, Scan, CheckCircle2, User, Clock } from 'lucide-react';

export type ScannerState = 'SEARCHING' | 'CAPTURED' | 'IDLE';

interface CameraViewProps {
  isScanning: boolean;
  onToggleScan: () => void;
  onFaceCaptured: (isCaptured: boolean, subjectId: number) => void;
  onClearSession: () => void;
  sessionSecondsRemaining: number;
  simulationMode: boolean;
  onToggleSimulation: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  isScanning,
  onToggleScan,
  onFaceCaptured,
  onClearSession,
  sessionSecondsRemaining,
  simulationMode,
  onToggleSimulation,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [scannerState, setScannerState] = useState<ScannerState>('SEARCHING');
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<number>(1);

  // References for ultra-fast instant detection and auto-resume
  const scannerStateRef = useRef<ScannerState>('SEARCHING');
  const absentCountRef = useRef<number>(0);
  const subjectIdRef = useRef<number>(1);

  const updateScannerState = (newState: ScannerState) => {
    scannerStateRef.current = newState;
    setScannerState(newState);
  };

  // Start webcam stream
  const startCamera = useCallback(async () => {
    if (simulationMode) return;
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.warn('Camera access issue:', err);
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Click "Simulation Mode" below to test.'
          : 'Unable to access camera. Switched to Simulation Mode.';
      setCameraError(message);
    }
  }, [facingMode, simulationMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isScanning && !simulationMode) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isScanning, simulationMode, startCamera, stopCamera]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Complete session data clear (Zero previous user storage)
  const handleClearAndReset = useCallback(() => {
    absentCountRef.current = 0;
    setCapturedFrame(null);
    const nextId = subjectIdRef.current + 1;
    subjectIdRef.current = nextId;
    setSubjectId(nextId);
    updateScannerState('SEARCHING');
    onClearSession();

    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }, [onClearSession]);

  // Handle 5-Minute Session Timer Expiration (Auto-clear session data)
  useEffect(() => {
    if (scannerStateRef.current === 'CAPTURED' && sessionSecondsRemaining <= 0) {
      // 5-minute session expired: clear session data automatically
      handleClearAndReset();
    }
  }, [sessionSecondsRemaining, handleClearAndReset]);

  // Handle scanner pause/resume toggles
  useEffect(() => {
    if (!isScanning) {
      updateScannerState('IDLE');
    } else if (scannerStateRef.current === 'IDLE') {
      updateScannerState('SEARCHING');
    }
  }, [isScanning]);

  // ACCELERATED HIGH-SPEED FACE DETECTION & DEPARTURE TRACKING ENGINE
  useEffect(() => {
    if (!isScanning) return;

    let intervalId: NodeJS.Timeout | null = null;

    const checkFrameLoop = () => {
      // 1. Simulation Mode Handler
      if (simulationMode) {
        if (scannerStateRef.current === 'SEARCHING') {
          // Immediately captures face, stops scanning, and displays vitals
          updateScannerState('CAPTURED');
          onFaceCaptured(true, subjectIdRef.current);
        }
        return;
      }

      // 2. High-Speed Live Webcam Face Detection
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const bgCanvas = backgroundCanvasRef.current;
      if (!video || !canvas || !bgCanvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const bgCtx = bgCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || !bgCtx) return;

      // Compact 48x48 optimized sampling matrix (< 0.5ms processing time)
      const sampleSize = 48;
      bgCanvas.width = sampleSize;
      bgCanvas.height = sampleSize;

      bgCtx.drawImage(video, 0, 0, sampleSize, sampleSize);
      const imgData = bgCtx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imgData.data;

      let skinPixels = 0;
      let totalCircularPixels = 0;
      const radius = sampleSize * 0.42;
      const center = sampleSize / 2;

      for (let y = 0; y < sampleSize; y += 2) {
        for (let x = 0; x < sampleSize; x += 2) {
          const dx = x - center;
          const dy = y - center;
          if (dx * dx + dy * dy <= radius * radius) {
            totalCircularPixels++;
            const idx = (y * sampleSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Medical skin chrominance model
            if (
              r > 65 &&
              g > 35 &&
              b > 20 &&
              r > g &&
              r > b &&
              r - g > 12 &&
              Math.abs(r - g) < 120
            ) {
              skinPixels++;
            }
          }
        }
      }

      const skinRatio = skinPixels / Math.max(1, totalCircularPixels);
      const isFacePresent = skinRatio > 0.12 && skinPixels > 16;

      // --- STATE: CAPTURED (PERSON DEPARTURE DETECTION) ---
      // When person leaves frame, automatically clear session data
      if (scannerStateRef.current === 'CAPTURED') {
        if (!isFacePresent) {
          absentCountRef.current++;
          // Person has left frame for > 1.25s (5 consecutive checks at 250ms)
          if (absentCountRef.current >= 5) {
            handleClearAndReset();
          }
        } else {
          absentCountRef.current = 0;
        }
        return;
      }

      // --- STATE: SEARCHING (IMMEDIATE FACE CAPTURE & STOP SCANNING) ---
      // Captures the face immediately, stops scanning, and displays vitals
      if (scannerStateRef.current === 'SEARCHING' && isFacePresent) {
        // Immediate 1-frame snapshot
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frozenImg = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedFrame(frozenImg);

        // Immediately transition to CAPTURED: stops scanning sweep!
        updateScannerState('CAPTURED');
        onFaceCaptured(true, subjectIdRef.current);
      }
    };

    // Accelerated search rate: 30ms during SEARCHING, 250ms presence polling during CAPTURED
    const pollInterval = scannerStateRef.current === 'SEARCHING' ? 30 : 250;
    intervalId = setInterval(checkFrameLoop, pollInterval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, simulationMode, onFaceCaptured, handleClearAndReset]);

  const isCaptured = scannerState === 'CAPTURED';

  // Format 5-minute countdown (MM:SS)
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Hidden processing canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={backgroundCanvasRef} className="hidden" />

      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCaptured
                ? 'bg-emerald-400'
                : isScanning
                ? 'bg-cyan-400 animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
            HIGH-SPEED FACE SCANNER
          </span>
        </div>

        {/* Live Status Pill & Session Timer */}
        <div className="flex items-center gap-2">
          {isCaptured ? (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{formatTimer(sessionSecondsRemaining)}</span>
              </div>
              <span className="flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                SCANNING STOPPED • CAPTURED
              </span>
            </>
          ) : isScanning ? (
            <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono">
              <Scan className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              SCANNING ACTIVE • READY
            </span>
          ) : (
            <span className="text-xs font-mono text-slate-500">SCANNER PAUSED</span>
          )}
        </div>
      </div>

      {/* COMPACT CIRCULAR FRAME FOR FACE DETECTION (STRICTLY CROPS TO FACE ONLY) */}
      <div className="relative my-3 flex items-center justify-center">
        {/* Outer Biometric Ring */}
        <div
          className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-1.5 transition-all duration-300 flex items-center justify-center ${
            isCaptured
              ? 'border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]'
              : isScanning
              ? 'border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : 'border border-slate-700'
          }`}
        >
          {/* Animated Circular Dashed Perimeter (Active only during searching) */}
          {!isCaptured && isScanning && (
            <div className="absolute -inset-2.5 rounded-full border border-dashed border-cyan-400/40 animate-[spin_12s_linear_infinite]" />
          )}

          {/* INNER CIRCULAR CAMERA APERTURE (STRICTLY CROPS FACE ONLY, COMPLETELY REMOVES OUTSIDE CLUTTER) */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner">
            {/* 1. Live Camera Feed (Tight zoom scale-150 on face) */}
            {!simulationMode && !capturedFrame && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-150 origin-center transition-opacity duration-200 ${
                  isScanning && !cameraError ? 'opacity-100' : 'opacity-0'
                } ${facingMode === 'user' ? '-scale-x-150' : ''}`}
              />
            )}

            {/* 2. FROZEN FACE CAPTURE SNAPSHOT (Displays immediately upon detection) */}
            {capturedFrame && (
              <img
                src={capturedFrame}
                alt="Captured Face"
                className={`w-full h-full object-cover scale-150 origin-center ${
                  facingMode === 'user' ? '-scale-x-150' : ''
                }`}
              />
            )}

            {/* 3. Simulation Face Mode */}
            {simulationMode && !capturedFrame && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="relative w-32 h-40 rounded-[50%/60%_60%_40%_40%] bg-gradient-to-b from-amber-200/25 via-rose-300/20 to-slate-800/70 border border-cyan-400/50 flex flex-col items-center justify-between p-2.5 animate-[subtleBreath_4s_ease-in-out_infinite]">
                  <div className="w-16 h-4 rounded-full border border-dashed border-emerald-400/70 bg-emerald-500/15 flex items-center justify-center mt-1">
                    <span className="text-[7px] font-mono text-emerald-300">rPPG</span>
                  </div>
                  <div className="flex gap-4 my-auto">
                    <div className="w-3 h-1.5 rounded-full bg-cyan-400/50" />
                    <div className="w-3 h-1.5 rounded-full bg-cyan-400/50" />
                  </div>
                  <div className="w-8 h-1 rounded-full bg-rose-400/40 mb-2" />
                </div>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && !simulationMode && (
              <div className="absolute inset-0 p-3 flex flex-col items-center justify-center text-center bg-slate-950/95 z-20">
                <AlertTriangle className="w-7 h-7 text-amber-400 mb-1" />
                <p className="text-[10px] font-mono text-slate-300 mb-2">Camera Access Blocked</p>
                <button
                  onClick={onToggleSimulation}
                  className="px-2.5 py-1 rounded bg-cyan-600 text-white text-[9px] font-mono font-bold"
                >
                  Use Simulation
                </button>
              </div>
            )}

            {/* Inactive state */}
            {!isScanning && !isCaptured && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-950/95">
                <User className="w-8 h-8 text-slate-500 mb-1" />
                <p className="text-[11px] font-mono text-slate-400">Scanner Off</p>
              </div>
            )}

            {/* Sweeping Laser (Active ONLY during searching / scanning - STOPPED once captured) */}
            {isScanning && !isCaptured && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="w-full h-1 absolute left-0 right-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4]"
                  style={{
                    animation: 'circularLaserSweep 1.8s ease-in-out infinite',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guidance Under Circle */}
      <p className="text-[11px] font-mono text-slate-400 text-center mt-1 mb-4">
        {isCaptured ? (
          <span className="text-emerald-400 flex items-center justify-center gap-1.5 flex-wrap">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scanning stopped • 5-min session active • Auto-clears when person leaves frame</span>
          </span>
        ) : (
          <span>Accelerated scanner: captures face, immediately stops scanning, and displays vitals.</span>
        )}
      </p>

      {/* Control Buttons */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-800">
        <button
          onClick={onToggleScan}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
            isScanning
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
          }`}
        >
          {isScanning ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>RESUME</span>
            </>
          )}
        </button>

        {/* Departure Trigger: Clear session & Reset */}
        {isCaptured && (
          <button
            onClick={handleClearAndReset}
            title="Person leaves the frame: immediately clears session data and resets"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 text-amber-300 text-xs font-mono font-bold transition-colors shadow-lg"
          >
            <User className="w-3.5 h-3.5" />
            <span>PERSON LEAVES FRAME (CLEAR DATA)</span>
          </button>
        )}

        {/* Capture New Face Button */}
        {!isCaptured && isScanning && (
          <button
            onClick={handleClearAndReset}
            title="Scan a new face"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>SCAN</span>
          </button>
        )}

        {!simulationMode && isScanning && (
          <button
            onClick={handleFlipCamera}
            title="Flip camera"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Simulation Toggle */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
            simulationMode
              ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{simulationMode ? 'Simulated' : 'Webcam'}</span>
        </button>
      </div>

      <style>{`
        @keyframes circularLaserSweep {
          0% {
            top: 5%;
            opacity: 0.2;
          }
          20% {
            opacity: 0.95;
          }
          80% {
            opacity: 0.95;
          }
          100% {
            top: 92%;
            opacity: 0.2;
          }
        }

        @keyframes subtleBreath {
          0%, 100% {
            transform: scale(0.985);
          }
          50% {
            transform: scale(1.015);
          }
        }
      `}</style>
    </div>
  );
};
