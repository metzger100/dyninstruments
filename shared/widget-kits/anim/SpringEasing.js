/**
 * @file SpringEasing - Critically damped per-instance spring smoother
 * Documentation: documentation/shared/spring-easing.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniSpringEasing = factory();
  }
})(this, function () {
  "use strict";

  const DEFAULT_STIFFNESS = 40;
  const DEFAULT_MAX_DT_MS = 50;
  const DEFAULT_EPSILON = 1e-4;
  const DEFAULT_EPSILON_VELOCITY = 1e-4;

  /**
   * @param {number} delta
   * @param {number} wrap
   * @returns {number}
   */
  function shortestDelta(delta, wrap) {
    const span = Math.abs(wrap);
    if (!Number.isFinite(span) || span <= 0) {
      return delta;
    }
    let out = delta % span;
    if (out > span / 2) {
      out -= span;
    }
    if (out < -span / 2) {
      out += span;
    }
    return out;
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniSpringEasingApi}
   */
  function create(def, componentContext) {
    const resolveFiniteNumber = componentContext.components.require("ValueMath").resolveFiniteNumber;

    /**
     * @param {DyniSpringSpec} [spec]
     * @returns {DyniSpring}
     */
    function createSpring(spec) {
      const cfg = /** @type {DyniSpringSpec} */ (spec && typeof spec === "object" ? spec : {});
      const stiffness = Math.max(1e-6, resolveFiniteNumber(cfg.stiffness, DEFAULT_STIFFNESS));
      const damping = 2 * Math.sqrt(stiffness);
      const maxDtMs = Math.max(1, Math.floor(resolveFiniteNumber(cfg.maxDtMs, DEFAULT_MAX_DT_MS)));
      const epsilon = Math.max(1e-9, resolveFiniteNumber(cfg.epsilon, DEFAULT_EPSILON));
      const epsilonVelocity = Math.max(1e-9, resolveFiniteNumber(cfg.epsilonVelocity, DEFAULT_EPSILON_VELOCITY));
      const wrap = Math.max(0, resolveFiniteNumber(cfg.wrap, 0));

      let current = 0;
      let target = 0;
      let velocity = 0;
      /** @type {number | null} */
      let lastAdvanceMs = null;
      let initialized = false;

      /** @param {number} value @returns {number} */
      function snap(value) {
        current = value;
        target = value;
        velocity = 0;
        initialized = true;
        lastAdvanceMs = null;
        return current;
      }

      /** @param {unknown} value @returns {number} */
      function setTarget(value) {
        const next = Number(value);
        if (!Number.isFinite(next)) {
          return current;
        }
        if (!initialized) {
          return snap(next);
        }
        target = wrap > 0 ? current + shortestDelta(next - current, wrap) : next;
        return target;
      }

      /** @param {unknown} nowMs @returns {number} */
      function advance(nowMs) {
        const now = Number(nowMs);
        if (!Number.isFinite(now)) {
          return current;
        }
        if (lastAdvanceMs == null) {
          lastAdvanceMs = now;
          return current;
        }

        const dtMs = Math.max(0, Math.min(maxDtMs, now - lastAdvanceMs));
        lastAdvanceMs = now;
        if (!dtMs) {
          return current;
        }

        const dt = dtMs / 1000;
        const acceleration = -stiffness * (current - target) - damping * velocity;
        velocity += acceleration * dt;
        current += velocity * dt;
        if (Math.abs(target - current) < epsilon && Math.abs(velocity) < epsilonVelocity) {
          current = target;
          velocity = 0;
        }
        return current;
      }

      /** @returns {boolean} */
      function isSettled() {
        return Math.abs(target - current) < epsilon && Math.abs(velocity) < epsilonVelocity;
      }

      /** @param {unknown} value @returns {number} */
      function reset(value) {
        const next = Number(value);
        if (!Number.isFinite(next)) {
          return current;
        }
        return snap(next);
      }

      return {
        setTarget: setTarget,
        advance: advance,
        isSettled: isSettled,
        reset: reset
      };
    }

    /**
     * @param {DyniSpringMotionSpec} [spec]
     * @returns {DyniSpringMotion}
     */
    function createMotion(spec) {
      const cfg = /** @type {DyniSpringMotionSpec} */ (spec && typeof spec === "object" ? spec : {});
      const springSpec = /** @type {DyniSpringSpec} */ (cfg.spring && typeof cfg.spring === "object" ? cfg.spring : {});
      const motionSpringSpec = Object.assign({}, springSpec);
      if (Number.isFinite(Number(cfg.wrap)) && Number(cfg.wrap) > 0) {
        motionSpringSpec.wrap = cfg.wrap;
      }
      /** @type {WeakMap<object, DyniSpringMotionState>} */
      const motionByCanvas = new WeakMap();

      /** @param {object} canvas @returns {DyniSpringMotionState} */
      function getMotion(canvas) {
        let state = motionByCanvas.get(canvas);
        if (!state) {
          state = {
            spring: createSpring(motionSpringSpec),
            ready: false
          };
          motionByCanvas.set(canvas, state);
        }
        return state;
      }

      /**
       * @param {object} canvas
       * @param {unknown} target
       * @param {unknown} easingEnabled
       * @param {unknown} nowMs
       * @returns {number}
       */
      function resolve(canvas, target, easingEnabled, nowMs) {
        const motion = getMotion(canvas);
        const finiteTarget = Number.isFinite(Number(target));
        if (!finiteTarget && !motion.ready) {
          return NaN;
        }
        if (finiteTarget) {
          motion.ready = true;
          motion.spring.setTarget(target);
          if (!easingEnabled) {
            motion.spring.reset(target);
          }
        }
        return motion.spring.advance(nowMs);
      }

      /** @param {object} canvas @returns {boolean} */
      function isActive(canvas) {
        const motion = motionByCanvas.get(canvas);
        return !!(motion && motion.ready && !motion.spring.isSettled());
      }

      return {
        resolve: resolve,
        isActive: isActive
      };
    }

    return {
      id: "SpringEasing",
      create: createSpring,
      createMotion: createMotion
    };
  }

  return { id: "SpringEasing", create: create };
});
