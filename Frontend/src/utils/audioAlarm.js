/**
 * ResilientGuard Emergency Audio Alarm & Speech Synthesis System
 * Web Audio API synthesized EAS, Wail, Yelp, and Hi-Lo sirens + bilingual voice synthesis
 * Strictly mutually exclusive sequential scheduler with absolute zero overlap guarantee
 */

let audioCtx = null;
let masterGain = null;
let activeNodes = [];
let activeIntervals = [];
let activeTimeouts = [];
let isSirenPlaying = false;
let isEmergencyLoopActive = false;
let currentSequenceToken = 0;
let currentSpeechUtterance = null;

/**
 * Initialize and unlock Web Audio Context across modern browsers
 */
export function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext init notice:', err);
    return null;
  }
}

// Global user interaction listener to ensure AudioContext is unlocked early
if (typeof window !== 'undefined') {
  const unlockTriggers = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
  const autoUnlock = () => {
    unlockAudio();
  };
  unlockTriggers.forEach(evt => {
    window.addEventListener(evt, autoUnlock, { passive: true });
  });
}

function clearAllScheduledTimers() {
  while (activeTimeouts.length > 0) {
    const t = activeTimeouts.pop();
    if (t) clearTimeout(t);
  }
  while (activeIntervals.length > 0) {
    const i = activeIntervals.pop();
    if (i) clearInterval(i);
  }
}

function scheduleTimeout(fn, delayMs) {
  const id = setTimeout(() => {
    const idx = activeTimeouts.indexOf(id);
    if (idx !== -1) activeTimeouts.splice(idx, 1);
    fn();
  }, delayMs);
  activeTimeouts.push(id);
  return id;
}

/**
 * Stop alarm siren and cleanup all active audio nodes safely
 */
export function stopAlarmSiren() {
  try {
    while (activeIntervals.length > 0) {
      const interval = activeIntervals.pop();
      if (interval) clearInterval(interval);
    }

    if (masterGain && audioCtx) {
      try {
        const now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(0.0001, now);
      } catch (e) {}
    }

    while (activeNodes.length > 0) {
      const node = activeNodes.pop();
      if (node) {
        try {
          if (typeof node.stop === 'function') node.stop();
        } catch (e) {}
        try {
          if (typeof node.disconnect === 'function') node.disconnect();
        } catch (e) {}
      }
    }

    if (masterGain) {
      try { masterGain.disconnect(); } catch (e) {}
      masterGain = null;
    }

    isSirenPlaying = false;
  } catch (err) {
    console.warn('Stop siren notice:', err);
    isSirenPlaying = false;
  }
}

/**
 * Play synthesized emergency siren
 * @param {'eas'|'wail'|'yelp'|'hi-lo'|'silent'} sirenType
 * @param {number} volume (0.0 to 1.0)
 */
export function playAlarmSiren(sirenType = 'eas', volume = 0.65) {
  if (sirenType === 'silent') {
    stopAlarmSiren();
    return;
  }

  try {
    // Stop any existing tone first
    stopAlarmSiren();

    const ctx = unlockAudio();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Master Gain for smooth volume and attack envelope
    masterGain = ctx.createGain();
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(Math.max(0.1, Math.min(1.0, volume)), now + 0.04);
    masterGain.connect(ctx.destination);

    if (sirenType === 'wail') {
      // Sweeping Evacuation Wail (500Hz <-> 1100Hz smooth rise and fall)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(750, now);
      osc2.frequency.setValueAtTime(755, now);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.45, now);
      lfoGain.gain.setValueAtTime(320, now);

      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      osc1.connect(masterGain);
      osc2.connect(masterGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      activeNodes.push(osc1, osc2, lfo, lfoGain, masterGain);
    } else if (sirenType === 'yelp') {
      // Rapid High-Low Yelp Siren (600Hz -> 1300Hz fast sweep 3.8 Hz)
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);

      lfo.type = 'sawtooth';
      lfo.frequency.setValueAtTime(3.8, now);
      lfoGain.gain.setValueAtTime(400, now);

      lfo.connect(osc.frequency);
      osc.connect(masterGain);

      lfo.start(now);
      osc.start(now);

      activeNodes.push(osc, lfo, lfoGain, masterGain);
    } else if (sirenType === 'hi-lo') {
      // European Hi-Lo Alternating Siren (960Hz & 770Hz)
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(960, now);

      let isHigh = false;
      const interval = setInterval(() => {
        if (!audioCtx || !isSirenPlaying) return;
        const t = audioCtx.currentTime;
        osc.frequency.setValueAtTime(isHigh ? 960 : 770, t);
        isHigh = !isHigh;
      }, 420);

      osc.connect(masterGain);
      osc.start(now);

      activeIntervals.push(interval);
      activeNodes.push(osc, masterGain);
    } else {
      // EAS Dual-Tone Attention Signal (Standard 853 Hz + 960 Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const subOsc = ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'sine';
      subOsc.type = 'sawtooth';

      osc1.frequency.setValueAtTime(853, now);
      osc2.frequency.setValueAtTime(960, now);
      subOsc.frequency.setValueAtTime(426.5, now);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.18, now);
      subOsc.connect(subGain);
      subGain.connect(masterGain);

      osc1.connect(masterGain);
      osc2.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      activeNodes.push(osc1, osc2, subOsc, subGain, masterGain);
    }

    isSirenPlaying = true;
  } catch (err) {
    console.warn('Alarm playback notice:', err);
  }
}

/**
 * Check if siren is currently active
 */
export function isAlarmSirenPlaying() {
  return isSirenPlaying;
}

/**
 * Text-to-Speech Voice Alert (Hindi or English)
 * Guaranteed to only execute when siren is completely silent
 */
export function speakVoiceAlert(text, lang = 'en', onComplete = null, token = null) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onComplete) onComplete();
    return;
  }

  try {
    // Cancel any old queued speech immediately
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    let finished = false;
    let localSafetyTimer = null;

    const finishCallback = () => {
      if (finished) return;
      finished = true;
      if (localSafetyTimer) {
        clearTimeout(localSafetyTimer);
        localSafetyTimer = null;
      }
      currentSpeechUtterance = null;
      if (token !== null && token !== currentSequenceToken) {
        return; // Stale sequence, discard
      }
      if (onComplete) onComplete();
    };

    // Calculate maximum realistic speech duration (approx 6-8 seconds)
    const timeoutMs = Math.min(9000, Math.max(4500, (text || '').length * 80));
    localSafetyTimer = setTimeout(finishCallback, timeoutMs);
    activeTimeouts.push(localSafetyTimer);

    const speakNow = () => {
      if (token !== null && token !== currentSequenceToken) {
        finishCallback();
        return;
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices() || [];
        if (lang === 'hi') {
          const hiVoice = voices.find(v => v.lang && (v.lang === 'hi-IN' || v.lang.startsWith('hi') || v.lang.includes('Hindi'))) ||
                          voices.find(v => v.name && v.name.toLowerCase().includes('hindi'));
          if (hiVoice) {
            utterance.voice = hiVoice;
          }
          utterance.lang = 'hi-IN';
        } else {
          const enVoice = voices.find(v => v.lang && (v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')));
          if (enVoice) {
            utterance.voice = enVoice;
          }
          utterance.lang = 'en-US';
        }

        utterance.onend = finishCallback;
        utterance.onerror = () => {
          finishCallback();
        };

        // Retain global reference to avoid garbage collection cutting off audio early
        currentSpeechUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
        finishCallback();
      }
    };

    // Wait 60ms after cancel before dispatching speak
    setTimeout(speakNow, 60);
  } catch (err) {
    console.warn('Speech synthesis outer error:', err);
    if (onComplete) onComplete();
  }
}

/**
 * Play full emergency disaster audio sequence on a STRICT CONTINUOUS NON-OVERLAPPING LOOP:
 * 1. 2.5s Alarm Siren Beep
 * 2. 400ms Dead Silence Gap
 * 3. Hindi Voice Advisory (Siren is 100% OFF)
 * 4. 400ms Dead Silence Gap
 * 5. 2.5s Alarm Siren Beep
 * 6. 400ms Dead Silence Gap
 * 7. English Voice Advisory (Siren is 100% OFF)
 * 8. 500ms Dead Silence Gap
 * 9. Repeat until dismissed/muted
 */
export function playEmergencySequence(options = {}) {
  // Stop all active audio, timers, and utterances and advance sequence token
  stopAllEmergencyAudio();
  unlockAudio();

  // Prime voices on load
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }

  const seqId = ++currentSequenceToken;
  isEmergencyLoopActive = true;

  const sirenTone = options.siren || 'eas';
  const hindiText = options.hindiText || 'सावधान! आपातकालीन आपदा चेतावनी। कृपया तुरंत सुरक्षित आश्रय पर जाएं।';
  const englishText = options.desc || options.description || 'Attention! Emergency disaster advisory. Please proceed immediately to designated safe shelter.';

  function step1_Siren() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;
    
    // Ensure speech synthesis is stopped before siren starts
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    playAlarmSiren(sirenTone, 0.65);

    scheduleTimeout(() => {
      stopAlarmSiren();
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // 400ms Dead Silence buffer before Hindi speech starts
      scheduleTimeout(() => {
        step2_HindiVoice();
      }, 400);
    }, 2600); // 2.6s siren burst
  }

  function step2_HindiVoice() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    speakVoiceAlert(hindiText, 'hi', () => {
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // 400ms Dead Silence buffer after speech ends
      scheduleTimeout(() => {
        step3_Siren();
      }, 400);
    }, seqId);
  }

  function step3_Siren() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    playAlarmSiren(sirenTone, 0.65);

    scheduleTimeout(() => {
      stopAlarmSiren();
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // 400ms Dead Silence buffer before English speech starts
      scheduleTimeout(() => {
        step4_EnglishVoice();
      }, 400);
    }, 2600); // 2.6s siren burst
  }

  function step4_EnglishVoice() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    speakVoiceAlert(englishText, 'en', () => {
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // 500ms Dead Silence buffer then repeat entire loop cleanly
      scheduleTimeout(() => {
        if (isEmergencyLoopActive && seqId === currentSequenceToken) {
          step1_Siren();
        }
      }, 500);
    }, seqId);
  }

  // Start with step 1
  step1_Siren();
}

/**
 * Stop all active sirens, voice synthesis, sequence timeouts, and terminate the loop immediately
 */
export function stopAllEmergencyAudio() {
  isEmergencyLoopActive = false;
  currentSequenceToken++; // Invalidate any in-flight steps immediately
  clearAllScheduledTimers();
  stopAlarmSiren();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  currentSpeechUtterance = null;
}
