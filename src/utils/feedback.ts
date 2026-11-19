let audioCtx: AudioContext | null = null;

export function playKeyClickSound(enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) {
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.028);
  } catch {
    // Audio playback unavailable; ignore cleanly
  }
}

export function triggerHapticFeedback(enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined') return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(12);
    } catch {
      // Haptics unsupported on desktop browser; ignore
    }
  }
}
