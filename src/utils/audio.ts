// Web Audio API synthesizer for realistic cardiac stethoscope heartbeat sounds
let audioCtx: AudioContext | null = null;

export function playHeartbeatSound(volume: number = 0.25) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // First sound: "Lub" (S1 - AV valves closure) - low frequency punch around 55Hz
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain1.gain.setValueAtTime(volume * 0.9, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.13);

    // Second sound: "Dub" (S2 - Semilunar valves closure) - slightly higher pitch around 80Hz, 140ms later
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    const s2Time = now + 0.15;

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82, s2Time);
    osc2.frequency.exponentialRampToValueAtTime(45, s2Time + 0.1);

    gain2.gain.setValueAtTime(volume * 0.7, s2Time);
    gain2.gain.exponentialRampToValueAtTime(0.001, s2Time + 0.1);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc2.start(s2Time);
    osc2.stop(s2Time + 0.11);
  } catch {
    // Audio context may be restricted before user gesture
  }
}
