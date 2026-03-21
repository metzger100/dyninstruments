const path = require("node:path");
const { pathToFileURL } = require("node:url");

describe("tools/perf gate helpers", function () {
  const metricsPath = path.resolve(__dirname, "../../tools/perf/metrics.mjs");
  const thresholdsPath = path.resolve(__dirname, "../../tools/perf/thresholds.mjs");

  let summarizeSamples;
  let evaluatePerfGate;

  beforeAll(async function () {
    const metricsMod = await import(pathToFileURL(metricsPath).href);
    summarizeSamples = metricsMod.summarizeSamples;

    const thresholdsMod = await import(pathToFileURL(thresholdsPath).href);
    evaluatePerfGate = thresholdsMod.evaluatePerfGate;
  });

  function makeBaseline() {
    return {
      scenarios: {
        speed_radial: {
          compute_ms: { p50: 10, p95: 20, p99: 25 },
          wait_ms: { p95: 6 },
          total_ms: { p95: 24 },
          long_tasks: { count_50ms: 0, max_ms: 0 },
          hotspots: {
            source: "cpu-profile",
            top_by_self: [
              { function_name: "fn1", file: "a.js", self_share_pct: 20 },
              { function_name: "fn2", file: "b.js", self_share_pct: 18 },
              { function_name: "fn3", file: "c.js", self_share_pct: 16 },
              { function_name: "fn4", file: "d.js", self_share_pct: 12 },
              { function_name: "fn5", file: "e.js", self_share_pct: 10 }
            ],
            top5_self_share_pct: 76
          }
        },
        gpspage_all_widgets: {
          compute_ms: { p50: 12, p95: 24, p99: 30 },
          wait_ms: { p95: 8 },
          total_ms: { p95: 40 },
          long_tasks: { count_50ms: 1, max_ms: 60 },
          hotspots: {
            source: "cpu-profile",
            top_by_self: [
              { function_name: "fn1", file: "a.js", self_share_pct: 22 },
              { function_name: "fn2", file: "b.js", self_share_pct: 18 },
              { function_name: "fn3", file: "c.js", self_share_pct: 12 },
              { function_name: "fn4", file: "d.js", self_share_pct: 10 },
              { function_name: "fn5", file: "e.js", self_share_pct: 8 }
            ],
            top5_self_share_pct: 70
          }
        }
      },
      hotspot_allowlist: {
        speed_radial: [],
        gpspage_all_widgets: []
      }
    };
  }

  function makeCurrent() {
    return {
      scenarios: {
        speed_radial: {
          compute_ms: { p50: 20, p95: 48, p99: 70 },
          wait_ms: { p95: 10.8 },
          total_ms: { p95: 30 },
          long_tasks: { count_50ms: 0, max_ms: 0 },
          hotspots: {
            source: "cpu-profile",
            top_by_self: [
              { function_name: "fn1", file: "a.js", self_share_pct: 20 },
              { function_name: "fn2", file: "b.js", self_share_pct: 18 },
              { function_name: "fn3", file: "c.js", self_share_pct: 16 },
              { function_name: "fn4", file: "d.js", self_share_pct: 12 },
              { function_name: "fn5", file: "e.js", self_share_pct: 10 }
            ],
            top5_self_share_pct: 76
          }
        },
        gpspage_all_widgets: {
          compute_ms: { p50: 24, p95: 57.6, p99: 84 },
          wait_ms: { p95: 14.4 },
          total_ms: { p95: 88 },
          long_tasks: { count_50ms: 3, max_ms: 120 },
          hotspots: {
            source: "cpu-profile",
            top_by_self: [
              { function_name: "fn1", file: "a.js", self_share_pct: 22 },
              { function_name: "fn2", file: "b.js", self_share_pct: 18 },
              { function_name: "fn3", file: "c.js", self_share_pct: 12 },
              { function_name: "fn4", file: "d.js", self_share_pct: 10 },
              { function_name: "fn5", file: "e.js", self_share_pct: 8 }
            ],
            top5_self_share_pct: 70
          }
        }
      }
    };
  }

  it("summarizes samples with percentiles", function () {
    const summary = summarizeSamples([1, 2, 3, 4, 5]);
    expect(summary.count).toBe(5);
    expect(summary.min).toBe(1);
    expect(summary.max).toBe(5);
    expect(summary.p50).toBe(3);
    expect(summary.p95).toBeGreaterThan(4);
  });

  it("passes at threshold boundaries", function () {
    const result = evaluatePerfGate({
      baseline: makeBaseline(),
      current: makeCurrent()
    });

    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("fails when a threshold is exceeded", function () {
    const baseline = makeBaseline();
    const current = makeCurrent();
    current.scenarios.speed_radial.compute_ms.p95 = 48.001;

    const result = evaluatePerfGate({
      baseline,
      current
    });

    expect(result.ok).toBe(false);
    expect(result.violations.some((entry) => entry.metric === "compute_p95")).toBe(true);
  });

  it("fails closed when hotspot source is not cpu-profile", function () {
    const baseline = makeBaseline();
    const current = makeCurrent();
    current.scenarios.speed_radial.hotspots.source = "span-fallback";
    current.scenarios.speed_radial.hotspots.top5_self_share_pct = 99;

    const result = evaluatePerfGate({ baseline, current });
    expect(result.ok).toBe(false);
    expect(result.violations.some((entry) => entry.metric === "hotspot_source")).toBe(true);
    const skipped = result.checks.filter((entry) => entry.skipped && entry.scenario === "speed_radial");
    expect(skipped.length).toBeGreaterThanOrEqual(2);
  });
});
