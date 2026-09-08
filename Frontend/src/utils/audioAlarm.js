/**
 * ResilientGuard Emergency Audio Alarm & Speech Synthesis System
 * Web Audio API synthesized EAS, Wail, Yelp, and Hi-Lo sirens + bilingual voice synthesis
 */

let audioCtx = null;
let masterGain = null;
let activeNodes = [];
let activeIntervals = [];
let isSirenPlaying = false;
let emergencySequenceTimeout = null;
let isEmergencyLoopActive = false;
let speechSafetyTimeout = null;

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
 * Stop alarm siren and cleanup all active audio nodes safely
 */
export function stopAlarmSiren() {
  try {
    while (activeIntervals.length > 0) {
      const interval = activeIntervals.pop();
      if (interval) clearInterval(interval);
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
 * Check if siren is currently active
 */
export function isAlarmSirenPlaying() {
  return isSirenPlaying;
}

/**
 * Text-to-Speech Voice Alert (Hindi or English)
 */
export function speakVoiceAlert(text, lang = 'en', onComplete = null) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onComplete) onComplete();
    return;
  }

  try {
    if (speechSafetyTimeout) {
      clearTimeout(speechSafetyTimeout);
      speechSafetyTimeout = null;
    }

    let finished = false;
    const finishCallback = () => {
      if (finished) return;
      finished = true;
      if (speechSafetyTimeout) {
        clearTimeout(speechSafetyTimeout);
        speechSafetyTimeout = null;
      }
      if (onComplete) onComplete();
    };

    // Calculate dynamic safety timeout based on text length (max 10s)
    const timeoutMs = Math.min(10000, Math.max(5000, (text || '').length * 100));
    speechSafetyTimeout = setTimeout(finishCallback, timeoutMs);

    const speakNow = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices() || [];
        if (lang === 'hi') {
          const hiVoice = voices.find(v => v.lang && (v.lang === 'hi-IN' || v.lang.startsWith('hi') || v.lang.includes('Hindi'))) ||
                          voices.find(v => v.name && v.name.toLowerCase().includes('hindi'));
          if (hiVoice) {
            utterance.voice = hiVoice;
            utterance.lang = 'hi-IN';
          } else {
            utterance.lang = 'hi-IN';
          }
        } else {
          const enVoice = voices.find(v => v.lang && (v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en-US')));
          if (enVoice) utterance.voice = enVoice;
          utterance.lang = 'en-US';
        }

        utterance.onend = finishCallback;
        utterance.onerror = (e) => {
          console.warn('Speech synthesis notice:', e);
          finishCallback();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis speak error:', e);
        finishCallback();
      }
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakNow();
      };
      setTimeout(speakNow, 100);
    } else {
      setTimeout(speakNow, 50);
    }
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onComplete) onComplete();
  }
}

/**
 * Play full emergency disaster audio sequence on a CONTINUOUS LOOP:
 * 1. 3 seconds Alarm Siren Beep (no overlapping)
 * 2. Hindi Audio Advisory (complete silence from siren)
 * 3. 3 seconds Alarm Siren Beep (no overlapping)
 * 4. English Audio Advisory (complete silence from siren)
 * 5. Loop continuously until manually turned off / dismissed
 */
export function playEmergencySequence(options = {}) {
  stopAllEmergencyAudio();
  unlockAudio();
  isEmergencyLoopActive = true;

  const sirenTone = options.siren || 'eas';
  
  // Hindi Emergency Advisory
  const hindiText = options.hindiText || 'सावधान! आपातकालीन चेतावनी जारी की गई है। कृपया तुरंत सुरक्षित स्थान या आश्रय पर चले जाएं।';
  
  // Standard English Emergency Advisory
  const englishText = 'Attention! Emergency disaster evacuation advisory issued. Please proceed immediately to designated safe shelter.';

  function playBeepBurst(durationMs, onDone) {
    if (!isEmergencyLoopActive) return;
    playAlarmSiren(sirenTone, 0.65);

    emergencySequenceTimeout = setTimeout(() => {
      // Stop alarm siren completely - guaranteeing NO OVERLAPPING with speech
      stopAlarmSiren();
      if (!isEmergencyLoopActive) return;

      // Small 150ms silence buffer before voice starts
      emergencySequenceTimeout = setTimeout(() => {
        if (!isEmergencyLoopActive) return;
        if (onDone) onDone();
      }, 150);
    }, durationMs);
  }

  function runCycle() {
    if (!isEmergencyLoopActive) return;

    // Step 1: 3 seconds Alarm Beep (duration: 3000ms)
    playBeepBurst(3000, () => {
      if (!isEmergencyLoopActive) return;

      // Step 2: Hindi Audio Advisory (no overlapping siren)
      speakVoiceAlert(hindiText, 'hi', () => {
        if (!isEmergencyLoopActive) return;

        // Gap after Hindi audio before next beep
        emergencySequenceTimeout = setTimeout(() => {
          if (!isEmergencyLoopActive) return;

          // Step 3: 3 seconds Alarm Beep (duration: 3000ms)
          playBeepBurst(3000, () => {
            if (!isEmergencyLoopActive) return;

            // Step 4: English Audio Advisory (no overlapping siren)
            speakVoiceAlert(englishText, 'en', () => {
              if (!isEmergencyLoopActive) return;

              // Step 5: Brief 400ms pause then repeat whole sequence in loop
              emergencySequenceTimeout = setTimeout(() => {
                if (isEmergencyLoopActive) {
                  runCycle();
                }
              }, 400);
            });
          });
        }, 200);
      });
    });
  }

  // Start continuous loop cycle
  runCycle();
}

/**
 * Stop all active sirens, voice synthesis, sequence timeouts, and terminate the loop
 */
export function stopAllEmergencyAudio() {
  isEmergencyLoopActive = false;
  if (emergencySequenceTimeout) {
    clearTimeout(emergencySequenceTimeout);
    emergencySequenceTimeout = null;
  }
  if (speechSafetyTimeout) {
    clearTimeout(speechSafetyTimeout);
    speechSafetyTimeout = null;
  }
  stopAlarmSiren();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
