import { toFixedNumber } from "./metrics.mjs";

const EPSILON = 1e-9;

export const PERF_GATE_RULES = Object.freeze({
  perScenario: Object.freeze({
    computeP50Factor: 2.0,
    computeP95Factor: 2.4,
    computeP99Factor: 2.8,
    waitP95Factor: 1.8
  }),
  aggregate: Object.freeze({
    scenarioId: "gpspage_all_widgets",
    totalP95Factor: 2.2,
    longTaskBudget: 2,
    maxLongTaskMs: 120
  }),
  hotspots: Object.freeze({
    hottestSelfSharePct: 45,
    top5SelfSharePct: 80
  })
});

export function ensureExactScenarioMatch(baseline, current) {
  const baselineKeys = Object.keys((baseline && baseline.scenarios) || {}).sort();
  const currentKeys = Object.keys((current && current.scenarios) || {}).sort();
  if (baselineKeys.length !== currentKeys.length) {
    return {
      ok: false,
      baselineKeys,
      currentKeys,
      reason: "scenario-count-mismatch"
    };
  }

  for (let i = 0; i < baselineKeys.length; i += 1) {
    if (baselineKeys[i] !== currentKeys[i]) {
      return {
        ok: false,
        baselineKeys,
        currentKeys,
        reason: "scenario-key-mismatch"
      };
    }
  }

  return { ok: true, baselineKeys, currentKeys };
}

export function evaluatePerfGate(input) {
  const options = input || {};
  const baseline = options.baseline || {};
  const current = options.current || {};
  const rules = options.rules || PERF_GATE_RULES;

  const violations = [];
  const checks = [];

  const match = ensureExactScenarioMatch(baseline, current);
  if (!match.ok) {
    violations.push({
      scenario: "*",
      metric: "scenario_keys",
      message: "Scenario set mismatch between baseline and current report",
      detail: match
    });
    return {
      ok: false,
      violations,
      checks,
      scenarioKeys: match
    };
  }

  const allowlist = baseline.hotspot_allowlist && typeof baseline.hotspot_allowlist === "object"
    ? baseline.hotspot_allowlist
    : {};

  for (const scenarioId of match.currentKeys) {
    const baseScenario = baseline.scenarios[scenarioId] || {};
    const currentScenario = current.scenarios[scenarioId] || {};

    compareRatio(checks, violations, {
      scenario: scenarioId,
      metric: "compute_p50",
      currentValue: readMetric(currentScenario, ["compute_ms", "p50"]),
      baselineValue: readMetric(baseScenario, ["compute_ms", "p50"]),
      factor: rules.perScenario.computeP50Factor
    });

    compareRatio(checks, violations, {
      scenario: scenarioId,
      metric: "compute_p95",
      currentValue: readMetric(currentScenario, ["compute_ms", "p95"]),
      baselineValue: readMetric(baseScenario, ["compute_ms", "p95"]),
      factor: rules.perScenario.computeP95Factor
    });

    compareRatio(checks, violations, {
      scenario: scenarioId,
      metric: "compute_p99",
      currentValue: readMetric(currentScenario, ["compute_ms", "p99"]),
      baselineValue: readMetric(baseScenario, ["compute_ms", "p99"]),
      factor: rules.perScenario.computeP99Factor
    });

    compareRatio(checks, violations, {
      scenario: scenarioId,
      metric: "wait_p95",
      currentValue: readMetric(currentScenario, ["wait_ms", "p95"]),
      baselineValue: readMetric(baseScenario, ["wait_ms", "p95"]),
      factor: rules.perScenario.waitP95Factor
    });

    if (scenarioId === rules.aggregate.scenarioId) {
      compareRatio(checks, violations, {
        scenario: scenarioId,
        metric: "total_p95",
        currentValue: readMetric(currentScenario, ["total_ms", "p95"]),
        baselineValue: readMetric(baseScenario, ["total_ms", "p95"]),
        factor: rules.aggregate.totalP95Factor
      });

      compareAbsolute(checks, violations, {
        scenario: scenarioId,
        metric: "long_task_count_50ms",
        currentValue: readMetric(currentScenario, ["long_tasks", "count_50ms"]),
        baselineValue: readMetric(baseScenario, ["long_tasks", "count_50ms"]),
        extraBudget: rules.aggregate.longTaskBudget
      });

      compareMax(checks, violations, {
        scenario: scenarioId,
        metric: "max_long_task_ms",
        currentValue: readMetric(currentScenario, ["long_tasks", "max_ms"]),
        maxAllowed: rules.aggregate.maxLongTaskMs
      });
    }

    const hottest = readMetric(currentScenario, ["hotspots", "top_by_self", 0]);
    const hotspotCount = (readMetric(currentScenario, ["hotspots", "top_by_self"]) || []).length;
    const top5Share = readMetric(currentScenario, ["hotspots", "top5_self_share_pct"]);
    const hotspotSource = readMetric(currentScenario, ["hotspots", "source"]);
    const allow = Array.isArray(allowlist[scenarioId]) ? allowlist[scenarioId] : [];

    if (hotspotSource !== "cpu-profile") {
      checks.push({
        scenario: scenarioId,
        metric: "hotspot_source",
        passed: false,
        expected: "cpu-profile",
        currentValue: hotspotSource || "<missing>"
      });
      violations.push({
        scenario: scenarioId,
        metric: "hotspot_source",
        message: `hotspots.source=${hotspotSource || "<missing>"}; expected cpu-profile`
      });

      checks.push({
        scenario: scenarioId,
        metric: "hotspot_hottest_self_share",
        passed: false,
        skipped: true,
        reason: "hotspot-source-mismatch",
        source: hotspotSource
      });
      checks.push({
        scenario: scenarioId,
        metric: "hotspot_top5_self_share",
        passed: false,
        skipped: true,
        reason: "hotspot-source-mismatch",
        source: hotspotSource
      });
      continue;
    }

    if (hottest && Number.isFinite(hottest.self_share_pct)) {
      const hotspotKey = buildHotspotKey(hottest);
      const allowed = allow.includes(hotspotKey);
      const passed = hottest.self_share_pct <= rules.hotspots.hottestSelfSharePct || allowed;
      checks.push({
        scenario: scenarioId,
        metric: "hotspot_hottest_self_share",
        passed,
        currentValue: toFixedNumber(hottest.self_share_pct),
        threshold: rules.hotspots.hottestSelfSharePct,
        allowlisted: allowed,
        hotspotKey
      });
      if (!passed) {
        violations.push({
          scenario: scenarioId,
          metric: "hotspot_hottest_self_share",
          message: `Hottest function self share ${toFixedNumber(hottest.self_share_pct)}% exceeds ${rules.hotspots.hottestSelfSharePct}%`,
          detail: { hotspot: hottest, hotspotKey }
        });
      }
    }

    if (Number.isFinite(top5Share) && hotspotCount >= 5) {
      const passed = top5Share <= rules.hotspots.top5SelfSharePct;
      checks.push({
        scenario: scenarioId,
        metric: "hotspot_top5_self_share",
        passed,
        currentValue: toFixedNumber(top5Share),
        threshold: rules.hotspots.top5SelfSharePct
      });
      if (!passed) {
        violations.push({
          scenario: scenarioId,
          metric: "hotspot_top5_self_share",
          message: `Top-5 cumulative self share ${toFixedNumber(top5Share)}% exceeds ${rules.hotspots.top5SelfSharePct}%`
        });
      }
    }
    else if (Number.isFinite(top5Share)) {
      checks.push({
        scenario: scenarioId,
        metric: "hotspot_top5_self_share",
        passed: true,
        skipped: true,
        reason: "insufficient-hotspot-functions",
        hotspotCount
      });
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    checks,
    scenarioKeys: match
  };
}

function compareRatio(checks, violations, config) {
  const currentValue = toMetricNumber(config.currentValue);
  const baselineValue = toMetricNumber(config.baselineValue);
  const threshold = baselineValue * config.factor;
  const passed = currentValue <= (threshold + EPSILON);

  checks.push({
    scenario: config.scenario,
    metric: config.metric,
    passed,
    baselineValue,
    currentValue,
    threshold: toFixedNumber(threshold)
  });

  if (!passed) {
    violations.push({
      scenario: config.scenario,
      metric: config.metric,
      message: `${config.metric}=${toFixedNumber(currentValue)} exceeds threshold ${toFixedNumber(threshold)} (baseline=${toFixedNumber(baselineValue)}, factor=${config.factor})`
    });
  }
}

function compareAbsolute(checks, violations, config) {
  const currentValue = toMetricNumber(config.currentValue);
  const baselineValue = toMetricNumber(config.baselineValue);
  const threshold = baselineValue + config.extraBudget;
  const passed = currentValue <= threshold;

  checks.push({
    scenario: config.scenario,
    metric: config.metric,
    passed,
    baselineValue,
    currentValue,
    threshold
  });

  if (!passed) {
    violations.push({
      scenario: config.scenario,
      metric: config.metric,
      message: `${config.metric}=${currentValue} exceeds threshold ${threshold} (baseline=${baselineValue}, budget=+${config.extraBudget})`
    });
  }
}

function compareMax(checks, violations, config) {
  const currentValue = toMetricNumber(config.currentValue);
  const passed = currentValue <= config.maxAllowed;

  checks.push({
    scenario: config.scenario,
    metric: config.metric,
    passed,
    currentValue,
    threshold: config.maxAllowed
  });

  if (!passed) {
    violations.push({
      scenario: config.scenario,
      metric: config.metric,
      message: `${config.metric}=${toFixedNumber(currentValue)} exceeds hard limit ${config.maxAllowed}`
    });
  }
}

function toMetricNumber(value) {
  if (!Number.isFinite(Number(value))) {
    return 0;
  }
  return Number(value);
}

function readMetric(root, pathParts) {
  let cursor = root;
  for (const part of pathParts) {
    if (cursor == null) {
      return undefined;
    }
    cursor = cursor[part];
  }
  return cursor;
}

function buildHotspotKey(entry) {
  const functionName = entry && entry.function_name ? entry.function_name : "(anonymous)";
  const file = entry && entry.file ? entry.file : "unknown";
  return `${functionName}@${file}`;
}
