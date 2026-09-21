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

// Mandated English voice alert text
export const MANDATORY_ENGLISH_VOICE = "ALERT! IMMEDIATE EVACUATION HAS BEEN REQUESTED DUE TO LANDSLIDE. PLEASE MOVE TO THE DESIGNATED RELIEF SHELTER IMMEDIATELY.";
export const DEFAULT_HINDI_VOICE = "सावधान! भूस्खलन के कारण तत्काल खाली करने का अनुरोध किया गया है। कृपया निकटतम सुरक्षित राहत केंद्र की ओर प्रस्थान करें।";

/**
 * Initialize and unlock Web Audio Context & SpeechSynthesis across modern browsers
 */
export function unlockAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.getVoices();
    }

    return audioCtx;
  } catch (err) {
    console.warn('AudioContext init notice:', err);
    return null;
  }
}

// Global user interaction listener to ensure AudioContext and Speech are unlocked early
if (typeof window !== 'undefined') {
  const unlockTriggers = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
  const autoUnlock = () => {
    unlockAudio();
  };
  unlockTriggers.forEach(evt => {
    window.addEventListener(evt, autoUnlock, { passive: true });
  });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      try { window.speechSynthesis.getVoices(); } catch (e) {}
    };
  }
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
 * Stop alarm siren and cleanup all active audio nodes safely and immediately
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
        masterGain.gain.setValueAtTime(0, now);
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
 * Text-to-Speech Voice Alert (English or Hindi with guaranteed fallback)
 * Guaranteed to only execute when siren is completely silent
 */
export function speakVoiceAlert(text, lang = 'en', onComplete = null, token = null) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onComplete) onComplete();
    return;
  }

  try {
    // 1. Unconditionally stop siren before initiating any voice
    stopAlarmSiren();

    let finished = false;
    let localSafetyTimer = null;
    let keepAliveInterval = null;

    const finishCallback = () => {
      if (finished) return;
      finished = true;
      if (localSafetyTimer) {
        clearTimeout(localSafetyTimer);
        localSafetyTimer = null;
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      currentSpeechUtterance = null;
      if (token !== null && token !== currentSequenceToken) {
        return; // Stale sequence, discard
      }
      if (onComplete) onComplete();
    };

    // Calculate maximum realistic speech duration safety timeout (min 5.5s)
    const timeoutMs = Math.min(12000, Math.max(5500, (text || '').length * 110));
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

        const voices = window.speechSynthesis.getVoices() || [];
        let speechText = text || (lang === 'hi' ? DEFAULT_HINDI_VOICE : MANDATORY_ENGLISH_VOICE);
        let targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
        let chosenVoice = null;

        if (lang === 'hi') {
          const hiVoice = voices.find(v => v.lang && (v.lang === 'hi-IN' || v.lang.startsWith('hi') || (v.name && v.name.toLowerCase().includes('hindi'))));
          if (hiVoice) {
            chosenVoice = hiVoice;
            targetLang = 'hi-IN';
          } else {
            // Fallback to English voice if Hindi TTS is not installed in OS
            speechText = MANDATORY_ENGLISH_VOICE;
            targetLang = 'en-US';
            chosenVoice = voices.find(v => v.lang && (v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')));
          }
        } else {
          chosenVoice = voices.find(v => v.lang && (v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')));
        }

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        utterance.lang = targetLang;
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        utterance.onstart = () => {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        };

        utterance.onend = () => {
          setTimeout(finishCallback, 150);
        };

        utterance.onerror = (err) => {
          console.warn('Speech synthesis utterance notice:', err);
          finishCallback();
        };

        // Retain global reference to avoid garbage collection cutting off audio early
        window._rgActiveUtterance = utterance;
        currentSpeechUtterance = utterance;

        window.speechSynthesis.speak(utterance);

        // Keep-alive timer to prevent Chrome pausing long utterances
        keepAliveInterval = setInterval(() => {
          if (!finished && window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          } else {
            if (keepAliveInterval) clearInterval(keepAliveInterval);
          }
        }, 800);
        activeIntervals.push(keepAliveInterval);

      } catch (e) {
        console.warn('Speech synthesis inner error:', e);
        finishCallback();
      }
    };

    // Small delay to allow audio subsystem transition
    setTimeout(speakNow, 80);
  } catch (err) {
    console.warn('Speech synthesis outer error:', err);
    if (onComplete) onComplete();
  }
}

/**
 * Play full emergency disaster audio sequence on a STRICT CONTINUOUS NON-OVERLAPPING LOOP:
 * 1. 2.0s Alarm Siren Buzzer
 * 2. 450ms Clean Buffer
 * 3. Authoritative English Voice: "ALERT! IMMEDIATE EVACUATION HAS BEEN REQUESTED DUE TO LANDSLIDE..."
 * 4. 650ms Buffer
 * 5. 2.0s Alarm Siren Buzzer
 * 6. 450ms Buffer
 * 7. Hindi Voice Directive (with automatic English fallback if Hindi speech pack not installed)
 * 8. 1200ms Dead Silence Gap -> Repeat cleanly until dismissed or muted
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
  const englishText = MANDATORY_ENGLISH_VOICE;
  const hindiText = options.hindiText || DEFAULT_HINDI_VOICE;

  const SIREN_DURATION_MS = 2000;  // 2.0s siren burst
  const GAP_AFTER_SIREN_MS = 450;   // 450ms clean buffer between siren & speech
  const GAP_AFTER_VOICE_MS = 650;   // 650ms clean buffer between speech & siren
  const LOOP_RESTART_GAP_MS = 1200; // 1.2s gap before repeating sequence

  function step1_Siren() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;
    
    // Ensure speech synthesis is stopped before siren starts
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    playAlarmSiren(sirenTone, 0.70);

    scheduleTimeout(() => {
      stopAlarmSiren();
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // Clean buffer before English voice starts
      scheduleTimeout(() => {
        step2_EnglishVoice();
      }, GAP_AFTER_SIREN_MS);
    }, SIREN_DURATION_MS);
  }

  function step2_EnglishVoice() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    speakVoiceAlert(englishText, 'en', () => {
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // Clean buffer after speech ends before siren resumes
      scheduleTimeout(() => {
        step3_Siren();
      }, GAP_AFTER_VOICE_MS);
    }, seqId);
  }

  function step3_Siren() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    playAlarmSiren(sirenTone, 0.70);

    scheduleTimeout(() => {
      stopAlarmSiren();
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // Clean buffer before Hindi speech starts
      scheduleTimeout(() => {
        step4_HindiVoice();
      }, GAP_AFTER_SIREN_MS);
    }, SIREN_DURATION_MS);
  }

  function step4_HindiVoice() {
    if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

    speakVoiceAlert(hindiText, 'hi', () => {
      if (!isEmergencyLoopActive || seqId !== currentSequenceToken) return;

      // 1200ms Dead Silence buffer then repeat entire loop cleanly
      scheduleTimeout(() => {
        if (isEmergencyLoopActive && seqId === currentSequenceToken) {
          step1_Siren();
        }
      }, LOOP_RESTART_GAP_MS);
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
  if (typeof window !== 'undefined') {
    window._rgActiveUtterance = null;
  }
}


