#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { runPerfScenarioSuite } from "./perf/harness.mjs";
import { evaluatePerfGate, PERF_GATE_RULES } from "./perf/thresholds.mjs";

const DEFAULT_BASELINE_PATH = path.join("perf", "baselines", "core-lab-v1.json");

export async function runPerfCheck(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv);
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const outputDir = path.resolve(rootDir, args.outputDir || path.join("artifacts", "perf"));
  const baselinePath = path.resolve(rootDir, args.baselinePath || DEFAULT_BASELINE_PATH);

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const suiteOptions = {
    rootDir,
    outputDir,
    captureCpuProfile: args.captureCpuProfile
  };
  if (Number.isFinite(args.seed)) suiteOptions.seed = args.seed;
  if (Number.isFinite(args.warmupIterations)) suiteOptions.warmupIterations = args.warmupIterations;
  if (Number.isFinite(args.measuredIterations)) suiteOptions.measuredIterations = args.measuredIterations;
  if (Number.isFinite(args.cpuSlowdownFactor)) suiteOptions.cpuSlowdownFactor = args.cpuSlowdownFactor;
  const runResult = await runPerfScenarioSuite(suiteOptions);

  const evaluation = evaluatePerfGate({
    baseline,
    current: runResult.report,
    rules: PERF_GATE_RULES
  });

  const summary = {
    ok: evaluation.ok,
    baselinePath,
    reportPath: runResult.artifacts.jsonPath,
    markdownPath: runResult.artifacts.markdownPath,
    violations: evaluation.violations.length,
    checks: evaluation.checks.length
  };

  const gatePath = path.join(outputDir, "perf-check.md");
  fs.writeFileSync(gatePath, renderGateMarkdown(summary, evaluation), "utf8");

  if (options.print !== false) {
    console.log(`[perf:check] baseline: ${baselinePath}`);
    console.log(`[perf:check] report: ${runResult.artifacts.jsonPath}`);
    console.log(`[perf:check] gate markdown: ${gatePath}`);
    if (evaluation.ok) {
      console.log("[perf:check] Gate passed.");
    } else {
      console.error("[perf:check] Gate failed.");
      evaluation.violations.forEach((violation) => {
        console.error(`- [${violation.scenario}] ${violation.metric}: ${violation.message}`);
      });
    }
    console.log(`SUMMARY_JSON=${JSON.stringify(summary)}`);
  }

  return {
    summary,
    evaluation,
    runResult,
    gatePath
  };
}

function parseArgs(argv) {
  const out = {
    captureCpuProfile: true
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--no-cpu-profile") {
      out.captureCpuProfile = false;
      continue;
    }
    if (arg.startsWith("--baseline=")) {
      out.baselinePath = arg.slice("--baseline=".length);
      continue;
    }
    if (arg === "--baseline") {
      out.baselinePath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      out.outputDir = arg.slice("--output-dir=".length);
      continue;
    }
    if (arg === "--output-dir") {
      out.outputDir = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--seed=")) {
      out.seed = Number(arg.slice("--seed=".length));
      continue;
    }
    if (arg.startsWith("--warmup=")) {
      out.warmupIterations = Number(arg.slice("--warmup=".length));
      continue;
    }
    if (arg.startsWith("--measured=")) {
      out.measuredIterations = Number(arg.slice("--measured=".length));
      continue;
    }
    if (arg.startsWith("--cpu-slowdown=")) {
      out.cpuSlowdownFactor = Number(arg.slice("--cpu-slowdown=".length));
      continue;
    }
  }

  return out;
}

function renderGateMarkdown(summary, evaluation) {
  const lines = [];
  lines.push("# Perf Gate Check");
  lines.push("");
  lines.push(`Status: ${summary.ok ? "PASS" : "FAIL"}`);
  lines.push(`Checks: ${summary.checks}`);
  lines.push(`Violations: ${summary.violations}`);
  lines.push("");

  if (evaluation.violations.length) {
    lines.push("## Violations");
    lines.push("");
    evaluation.violations.forEach((violation) => {
      lines.push(`- [${violation.scenario}] ${violation.metric}: ${violation.message}`);
    });
    lines.push("");
  }

  lines.push("## Rule Snapshot");
  lines.push("");
  lines.push(`- compute_p50 <= baseline * ${PERF_GATE_RULES.perScenario.computeP50Factor}`);
  lines.push(`- compute_p95 <= baseline * ${PERF_GATE_RULES.perScenario.computeP95Factor}`);
  lines.push(`- compute_p99 <= baseline * ${PERF_GATE_RULES.perScenario.computeP99Factor}`);
  lines.push(`- wait_p95 <= baseline * ${PERF_GATE_RULES.perScenario.waitP95Factor}`);
  lines.push(`- aggregate total_p95 <= baseline * ${PERF_GATE_RULES.aggregate.totalP95Factor}`);
  lines.push(`- aggregate long_task_count_50ms <= baseline + ${PERF_GATE_RULES.aggregate.longTaskBudget}`);
  lines.push(`- aggregate max_long_task_ms <= ${PERF_GATE_RULES.aggregate.maxLongTaskMs}`);
  lines.push("- hotspots.source must equal cpu-profile");
  lines.push(`- hottest self_time_share <= ${PERF_GATE_RULES.hotspots.hottestSelfSharePct}% (unless allowlisted)`);
  lines.push(`- top-5 cumulative self_time_share <= ${PERF_GATE_RULES.hotspots.top5SelfSharePct}%`);

  return `${lines.join("\n")}\n`;
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  runPerfCheck(process.argv.slice(2), { print: true })
    .then((result) => {
      process.exit(result.summary.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(`[perf:check] failed: ${error && error.message ? error.message : String(error)}`);
      process.exit(1);
    });
}
