// Deterministic operation-count scaling evaluator.
// Verifies a workload's counted operations grow at most linearly with input
// size by checking the envelope work(2n) <= 2 * work(n) + fixedOverhead for
// every consecutive doubling in a caller-supplied size sequence. fixedOverhead
// must be a measured constant (one-time setup work independent of n), never a
// timing-derived slack value: this evaluator is deterministic and offline.

/**
 * @param {{ sizes: number[], measure: (n: number) => number, fixedOverhead: number }} options
 * @returns {{
 *   ok: boolean,
 *   samples: Array<{ n: number, count: number }>,
 *   violations: Array<{ n: number, doubledN: number, count: number, doubledCount: number, allowed: number }>
 * }}
 */
export function evaluateLinearScaling(options) {
  const opts = options || {};
  const sizes = opts.sizes;
  const measure = opts.measure;
  const fixedOverhead = opts.fixedOverhead;

  if (!Array.isArray(sizes) || sizes.length < 2) {
    throw new Error("evaluateLinearScaling requires at least 2 sizes to compare a doubling step.");
  }
  if (typeof measure !== "function") {
    throw new Error("evaluateLinearScaling requires a measure(n) function.");
  }
  if (typeof fixedOverhead !== "number" || !Number.isFinite(fixedOverhead) || fixedOverhead < 0) {
    throw new Error("evaluateLinearScaling requires a non-negative finite fixedOverhead constant.");
  }

  const samples = sizes.map(function (n) {
    if (typeof n !== "number" || !Number.isInteger(n) || n <= 0) {
      throw new Error("evaluateLinearScaling sizes must be positive integers.");
    }
    return { n: n, count: requireOperationCount(measure(n), "evaluateLinearScaling") };
  });

  const violations = [];
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const curr = samples[i];
    if (curr.n !== prev.n * 2) {
      throw new Error(
        "evaluateLinearScaling requires each size to exactly double the previous size (got " +
          prev.n +
          " -> " +
          curr.n +
          ")."
      );
    }
    const allowed = 2 * prev.count + fixedOverhead;
    if (curr.count > allowed) {
      violations.push({
        n: prev.n,
        doubledN: curr.n,
        count: prev.count,
        doubledCount: curr.count,
        allowed: allowed
      });
    }
  }

  return { ok: violations.length === 0, samples: samples, violations: violations };
}

/**
 * @param {{ steps: number[], measure: (steps: number) => number, tolerancePerStep: number }} options
 * @returns {{
 *   ok: boolean,
 *   samples: Array<{ steps: number, count: number }>,
 *   violations: Array<{ steps: number, count: number, allowed: number }>
 * }}
 */
export function evaluateBoundedByConfiguredSteps(options) {
  const opts = options || {};
  const steps = opts.steps;
  const measure = opts.measure;
  const tolerancePerStep = opts.tolerancePerStep;

  if (!Array.isArray(steps) || steps.length < 1) {
    throw new Error("evaluateBoundedByConfiguredSteps requires at least 1 configured-steps value.");
  }
  if (typeof measure !== "function") {
    throw new Error("evaluateBoundedByConfiguredSteps requires a measure(steps) function.");
  }
  if (typeof tolerancePerStep !== "number" || !Number.isFinite(tolerancePerStep) || tolerancePerStep <= 0) {
    throw new Error("evaluateBoundedByConfiguredSteps requires a positive finite tolerancePerStep constant.");
  }

  const samples = steps.map(function (configuredSteps) {
    if (typeof configuredSteps !== "number" || !Number.isInteger(configuredSteps) || configuredSteps <= 0) {
      throw new Error("evaluateBoundedByConfiguredSteps steps values must be positive integers.");
    }
    return {
      steps: configuredSteps,
      count: requireOperationCount(measure(configuredSteps), "evaluateBoundedByConfiguredSteps")
    };
  });

  const violations = /** @type {Array<{ steps: number, count: number, allowed: number }>} */ ([]);
  samples.forEach(function (sample) {
    const allowed = sample.steps * tolerancePerStep;
    if (sample.count > allowed) {
      violations.push({ steps: sample.steps, count: sample.count, allowed: allowed });
    }
  });

  return { ok: violations.length === 0, samples: samples, violations: violations };
}

/** @param {number} value @param {string} evaluatorName @returns {number} */
function requireOperationCount(value, evaluatorName) {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${evaluatorName} measure() must return a non-negative finite integer operation count.`);
  }
  return value;
}
