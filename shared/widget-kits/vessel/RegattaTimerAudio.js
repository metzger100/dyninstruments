/**
 * @file RegattaTimerAudio - Web Audio tone engine for regatta timer signals
 * Documentation: documentation/widgets/regatta-timer.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerAudio = factory();
  }
}(this, function () {
  "use strict";

  const LOW_TONE_HZ = 440;
  const HIGH_TONE_HZ = 880;
  const MINUTE_BEEP_MS = 300;
  const SECOND_BEEP_MS = 150;
  const START_TONE_MS = 800;
  const ATTACK_SECONDS = 0.005;
  const RELEASE_SECONDS = 0.01;

  /** @returns {DyniRegattaTimerAudioGlobal} */
  function resolveGlobalRoot() {
    if (typeof globalThis !== "undefined") {
      return /** @type {DyniRegattaTimerAudioGlobal} */ (globalThis);
    }
    if (typeof window !== "undefined") {
      return /** @type {DyniRegattaTimerAudioGlobal} */ (window);
    }
    return {};
  }

  /** @param {DyniRegattaTimerAudioGlobal} globalRoot @returns {DyniRegattaAudioContextCtor | null} */
  function resolveAudioContextCtor(globalRoot) {
    if (globalRoot && typeof globalRoot.AudioContext === "function") {
      return globalRoot.AudioContext;
    }
    if (globalRoot && typeof globalRoot.webkitAudioContext === "function") {
      return globalRoot.webkitAudioContext;
    }
    return null;
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniRegattaTimerAudioApi} */
  function create(def, componentContext) {
    /** @returns {DyniRegattaTimerAudioEngine} */
    function createAudioEngine() {
      const globalRoot = resolveGlobalRoot();
      /** @type {AudioContext | null} */
      let audioContext = null;
      let audioUnavailable = false;

      /** @returns {boolean} */
      function ensureContext() {
        if (audioContext) {
          return true;
        }
        if (audioUnavailable) {
          return false;
        }
        const AudioContextCtor = resolveAudioContextCtor(globalRoot);
        if (!AudioContextCtor) {
          audioUnavailable = true;
          return false;
        }

        try {
          audioContext = new AudioContextCtor();
          return true;
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Web Audio availability is an external boundary and must fail closed.
        } catch (error) {
          audioContext = null;
          audioUnavailable = true;
          return false;
        }
      }

      /** @param {unknown} frequency @param {unknown} durationMs @returns {void} */
      function playTone(frequency, durationMs) {
        if (!audioContext) {
          return;
        }

        const frequencyHz = Number(frequency);
        const durationSeconds = Number(durationMs) / 1000;
        if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
          return;
        }
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
          return;
        }

        try {
          const now = audioContext.currentTime;
          const toneEnd = now + durationSeconds;
          const sustainEnd = Math.max(now + ATTACK_SECONDS, toneEnd - RELEASE_SECONDS);
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequencyHz, now);
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(1, now + ATTACK_SECONDS);
          gainNode.gain.setValueAtTime(1, sustainEnd);
          gainNode.gain.linearRampToValueAtTime(0, toneEnd);

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.start(now);
          oscillator.stop(toneEnd);
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Tone playback is best-effort and must not break the widget render flow.
        } catch (error) {
          // Silent by contract: audio failures must never throw into renderer flow.
        }
      }

      /** @returns {void} */
      function destroy() {
        if (!audioContext) {
          return;
        }
        try {
          const closeResult = audioContext.close();
          if (closeResult && typeof closeResult.then === "function") {
            closeResult.then(function () {}, function () {
              // Intentional no-op: close failure is non-fatal during widget teardown.
            });
          }
        // dyni-lint-disable-next-line catch-fallback-without-suppression -- Teardown failures are intentionally non-fatal at this boundary.
        } catch (error) {
          // Silent by contract: tear-down failures are ignored.
        }
        audioContext = null;
      }

      return {
        ensureContext: ensureContext,
        playTone: playTone,
        destroy: destroy,
        LOW_TONE_HZ: LOW_TONE_HZ,
        HIGH_TONE_HZ: HIGH_TONE_HZ,
        MINUTE_BEEP_MS: MINUTE_BEEP_MS,
        SECOND_BEEP_MS: SECOND_BEEP_MS,
        START_TONE_MS: START_TONE_MS
      };
    }

    return {
      id: "RegattaTimerAudio",
      createAudioEngine: createAudioEngine
    };
  }

  return { id: "RegattaTimerAudio", create: create };
}));
