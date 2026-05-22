/**
 * Module: RegattaTimerModel - Countdown/elapsed regatta timer state machine
 * Documentation: documentation/widgets/regatta-timer.md
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
  const PHASE_IDLE = "idle";
  const PHASE_COUNTDOWN = "countdown";
  const PHASE_ELAPSED = "elapsed";

  function toDurationMinutes(rawMinutes) {
    const minutes = Number(rawMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return DEFAULT_DURATION_MINUTES;
    }
    return Math.max(1, Math.round(minutes));
  }

  function formatTimeFromSeconds(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const remainder = safe % 3600;
    const hourRemainderMinutes = Math.floor(remainder / 60);
    const seconds = remainder % 60;
    const secondText = seconds < 10 ? "0" + seconds : String(seconds);
    if (hours >= 1) {
      const minuteText = hourRemainderMinutes < 10 ? "0" + hourRemainderMinutes : String(hourRemainderMinutes);
      return String(hours) + ":" + minuteText + ":" + secondText;
    }
    const minutes = Math.floor(safe / 60);
    const minuteText = minutes < 10 ? "0" + minutes : String(minutes);
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

  function normalizePhase(rawPhase) {
    if (rawPhase === PHASE_COUNTDOWN || rawPhase === PHASE_ELAPSED) {
      return rawPhase;
    }
    return PHASE_IDLE;
  }

  function toOptionalTimestamp(rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return Math.floor(value);
  }

  function toOptionalCountdownSecond(rawValue) {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }
    return Math.floor(value);
  }

  function create(def, componentContext) {
    function createTimerModel(options) {
      const opts = options || {};
      const snapshot = opts.snapshot && typeof opts.snapshot === "object" ? opts.snapshot : null;
      const snapshotDuration = snapshot ? toDurationMinutes(snapshot.durationMinutes) : null;
      const durationMinutes = snapshotDuration || toDurationMinutes(opts.durationMinutes);
      const durationMs = durationMinutes * 60 * 1000;
      const syncPoints = toSyncSignalPoints(durationMinutes);
      let onTick = typeof opts.onTick === "function" ? opts.onTick : null;
      let onSignal = typeof opts.onSignal === "function" ? opts.onSignal : null;
      let phase = PHASE_IDLE;
      let endTimeMs = null;
      let elapsedStartMs = null;
      let timerId = null;
      let lastCountdownSecond = null;

      function resolveState(nowMs) {
        const now = Number.isFinite(nowMs) ? nowMs : Date.now();
        let remainingMs = 0;
        let elapsedMs = 0;
        if (phase === PHASE_COUNTDOWN) {
          remainingMs = Math.max(0, endTimeMs - now);
          elapsedMs = Math.max(0, durationMs - remainingMs);
        } else if (phase === PHASE_ELAPSED) {
          elapsedMs = Math.max(0, now - elapsedStartMs);
        } else {
          remainingMs = durationMs;
        }

        let colorPhase = "normal";
        if (phase === PHASE_COUNTDOWN) {
          const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
          if (remainingSeconds <= 10) {
            colorPhase = "critical";
          } else if (remainingSeconds <= 60) {
            colorPhase = "warning";
          }
        }

        const displayTime = phase === PHASE_ELAPSED
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
        phase = PHASE_ELAPSED;
        elapsedStartMs = now;
        endTimeMs = null;
        lastCountdownSecond = null;
        if (emitStartSignal) {
          emitSignal("start", HIGH_TONE_HZ, START_TONE_MS);
        }
      }

      function handleCountdownTick(nowMs) {
        if (phase !== PHASE_COUNTDOWN) {
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
        if (phase !== PHASE_COUNTDOWN) {
          lastCountdownSecond = null;
          return;
        }
        const remainingMs = Math.max(0, endTimeMs - now);
        lastCountdownSecond = Math.max(0, Math.ceil(remainingMs / 1000));
      }

      function applySnapshot(rawSnapshot) {
        const source = rawSnapshot && typeof rawSnapshot === "object" ? rawSnapshot : null;
        if (!source) {
          return;
        }

        const snapshotPhase = normalizePhase(source.phase);
        if (snapshotPhase === PHASE_COUNTDOWN) {
          const restoredEndTimeMs = toOptionalTimestamp(source.endTimeMs);
          if (restoredEndTimeMs !== null) {
            phase = PHASE_COUNTDOWN;
            endTimeMs = restoredEndTimeMs;
            elapsedStartMs = null;
            lastCountdownSecond = toOptionalCountdownSecond(source.lastCountdownSecond);
            return;
          }
        }

        if (snapshotPhase === PHASE_ELAPSED) {
          const restoredElapsedStartMs = toOptionalTimestamp(source.elapsedStartMs);
          if (restoredElapsedStartMs !== null) {
            phase = PHASE_ELAPSED;
            elapsedStartMs = restoredElapsedStartMs;
            endTimeMs = null;
            lastCountdownSecond = null;
            return;
          }
        }
      }

      function start() {
        const now = Date.now();
        phase = PHASE_COUNTDOWN;
        endTimeMs = now + durationMs;
        elapsedStartMs = null;
        resetCountdownCursor(now);
        ensureTimer();
        emitTick(now);
      }

      function sync() {
        if (phase !== PHASE_COUNTDOWN) {
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
        phase = PHASE_IDLE;
        endTimeMs = null;
        elapsedStartMs = null;
        lastCountdownSecond = null;
        emitTick(Date.now());
      }

      function destroy() {
        stopTimer();
        phase = PHASE_IDLE;
        endTimeMs = null;
        elapsedStartMs = null;
        lastCountdownSecond = null;
        onTick = null;
        onSignal = null;
      }

      function getState() {
        return resolveState(Date.now());
      }

      function getSnapshot() {
        return {
          phase: phase,
          durationMinutes: durationMinutes,
          endTimeMs: phase === PHASE_COUNTDOWN ? endTimeMs : null,
          elapsedStartMs: phase === PHASE_ELAPSED ? elapsedStartMs : null,
          lastCountdownSecond: phase === PHASE_COUNTDOWN ? lastCountdownSecond : null
        };
      }

      applySnapshot(snapshot);
      if (phase === PHASE_COUNTDOWN && endTimeMs != null && endTimeMs <= Date.now()) {
        beginElapsed(Date.now(), false);
      }
      if (phase !== PHASE_IDLE) {
        ensureTimer();
      }

      return {
        start: start,
        sync: sync,
        reset: reset,
        destroy: destroy,
        getState: getState,
        getSnapshot: getSnapshot
      };
    }

    return {
      id: "RegattaTimerModel",
      createTimerModel: createTimerModel
    };
  }

  return { id: "RegattaTimerModel", create: create };
}));
