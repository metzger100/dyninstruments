/**
 * Module: RegattaTimerModel - Countdown/elapsed regatta timer state machine
 * Documentation: exec-plans/active/PLAN28.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRegattaTimerModel = factory(); }
}(this, function () {
  "use strict";

  const DEFAULT_DURATION_MINUTES = 5;
  const TICK_INTERVAL_MS = 100;
  const SYNC_GRACE_SECONDS = 1;
  const LOW_TONE_HZ = 440;
  const HIGH_TONE_HZ = 880;
  const MINUTE_BEEP_MS = 300;
  const SECOND_BEEP_MS = 150;
  const START_TONE_MS = 800;

  function toDurationMinutes(rawMinutes) {
    const minutes = Number(rawMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return DEFAULT_DURATION_MINUTES;
    }
    return Math.max(1, Math.round(minutes));
  }

  function formatTimeFromSeconds(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    const minuteText = minutes < 10 ? "0" + minutes : String(minutes);
    const secondText = seconds < 10 ? "0" + seconds : String(seconds);
    return minuteText + ":" + secondText;
  }

  function toSyncSignalPoints(durationMinutes) {
    const durationSeconds = durationMinutes * 60;
    const points = [durationSeconds, (durationMinutes - 1) * 60, 4 * 60, 60, 0];
    const bySecond = Object.create(null);
    const result = [];
    let i;
    for (i = 0; i < points.length; i += 1) {
      const value = points[i];
      if (!Number.isFinite(value) || value < 0 || value > durationSeconds) {
        continue;
      }
      if (bySecond[value] === true) {
        continue;
      }
      bySecond[value] = true;
      result.push(value);
    }
    result.sort(function (a, b) {
      return b - a;
    });
    return result;
  }

  function create(def, componentContext) {
    function createTimerModel(options) {
      const opts = options || {};
      const durationMinutes = toDurationMinutes(opts.durationMinutes);
      const durationMs = durationMinutes * 60 * 1000;
      const syncPoints = toSyncSignalPoints(durationMinutes);
      let onTick = typeof opts.onTick === "function" ? opts.onTick : null;
      let onSignal = typeof opts.onSignal === "function" ? opts.onSignal : null;
      let phase = "idle";
      let endTimeMs = null;
      let elapsedStartMs = null;
      let timerId = null;
      let lastCountdownSecond = null;

      function resolveState(nowMs) {
        const now = Number.isFinite(nowMs) ? nowMs : Date.now();
        let remainingMs = 0;
        let elapsedMs = 0;
        if (phase === "countdown") {
          remainingMs = Math.max(0, endTimeMs - now);
          elapsedMs = Math.max(0, durationMs - remainingMs);
        } else if (phase === "elapsed") {
          elapsedMs = Math.max(0, now - elapsedStartMs);
        } else {
          remainingMs = durationMs;
        }

        let colorPhase = "normal";
        if (phase === "countdown") {
          const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
          if (remainingSeconds <= 10) {
            colorPhase = "critical";
          } else if (remainingSeconds <= 60) {
            colorPhase = "warning";
          }
        }

        const displayTime = phase === "elapsed"
          ? formatTimeFromSeconds(Math.floor(elapsedMs / 1000))
          : formatTimeFromSeconds(Math.ceil(remainingMs / 1000));

        return {
          phase: phase,
          remainingMs: remainingMs,
          elapsedMs: elapsedMs,
          displayTime: displayTime,
          colorPhase: colorPhase
        };
      }

      function emitTick(nowMs) {
        if (!onTick) {
          return;
        }
        onTick(resolveState(nowMs));
      }

      function emitSignal(type, frequency, durationMsValue) {
        if (!onSignal) {
          return;
        }
        onSignal(type, frequency, durationMsValue);
      }

      function stopTimer() {
        if (timerId !== null) {
          clearInterval(timerId);
          timerId = null;
        }
      }

      function beginElapsed(nowMs, emitStartSignal) {
        const now = Number.isFinite(nowMs) ? nowMs : Date.now();
        phase = "elapsed";
        elapsedStartMs = now;
        endTimeMs = null;
        lastCountdownSecond = null;
        if (emitStartSignal) {
          emitSignal("start", HIGH_TONE_HZ, START_TONE_MS);
        }
      }

      function handleCountdownTick(nowMs) {
        if (phase !== "countdown") {
          return;
        }
        const remainingMs = Math.max(0, endTimeMs - nowMs);
        const currentSecond = Math.max(0, Math.ceil(remainingMs / 1000));

        if (lastCountdownSecond !== null && currentSecond < lastCountdownSecond) {
          let second;
          for (second = lastCountdownSecond - 1; second >= currentSecond; second -= 1) {
            if (second > 0 && second % 60 === 0) {
              emitSignal("low", LOW_TONE_HZ, MINUTE_BEEP_MS);
            }
            if (second >= 1 && second <= 10) {
              emitSignal("high", HIGH_TONE_HZ, SECOND_BEEP_MS);
            }
          }
        }
        lastCountdownSecond = currentSecond;

        if (currentSecond <= 0) {
          beginElapsed(nowMs, true);
        }
      }

      function handleTick() {
        const now = Date.now();
        handleCountdownTick(now);
        emitTick(now);
      }

      function ensureTimer() {
        if (timerId !== null) {
          return;
        }
        timerId = setInterval(handleTick, TICK_INTERVAL_MS);
      }

      function resetCountdownCursor(nowMs) {
        const now = Number.isFinite(nowMs) ? nowMs : Date.now();
        if (phase !== "countdown") {
          lastCountdownSecond = null;
          return;
        }
        const remainingMs = Math.max(0, endTimeMs - now);
        lastCountdownSecond = Math.max(0, Math.ceil(remainingMs / 1000));
      }

      function start() {
        const now = Date.now();
        phase = "countdown";
        endTimeMs = now + durationMs;
        elapsedStartMs = null;
        resetCountdownCursor(now);
        ensureTimer();
        emitTick(now);
      }

      function sync() {
        if (phase !== "countdown") {
          return;
        }
        const now = Date.now();
        const remainingSeconds = Math.max(0, (endTimeMs - now) / 1000);
        let targetSeconds = 0;
        let i;

        for (i = 0; i < syncPoints.length; i += 1) {
          const point = syncPoints[i];
          if ((remainingSeconds - point) > SYNC_GRACE_SECONDS) {
            targetSeconds = point;
            break;
          }
        }

        if (targetSeconds <= 0) {
          beginElapsed(now, false);
          emitTick(now);
          return;
        }

        endTimeMs = now + targetSeconds * 1000;
        resetCountdownCursor(now);
        emitTick(now);
      }

      function reset() {
        stopTimer();
        phase = "idle";
        endTimeMs = null;
        elapsedStartMs = null;
        lastCountdownSecond = null;
        emitTick(Date.now());
      }

      function destroy() {
        stopTimer();
        phase = "idle";
        endTimeMs = null;
        elapsedStartMs = null;
        lastCountdownSecond = null;
        onTick = null;
        onSignal = null;
      }

      function getState() {
        return resolveState(Date.now());
      }

      return {
        start: start,
        sync: sync,
        reset: reset,
        destroy: destroy,
        getState: getState
      };
    }

    return {
      id: "RegattaTimerModel",
      createTimerModel: createTimerModel
    };
  }

  return { id: "RegattaTimerModel", create: create };
}));
