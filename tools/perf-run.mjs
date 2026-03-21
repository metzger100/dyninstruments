#!/usr/bin/env node

import path from "node:path";
import { runPerfScenarioSuite } from "./perf/harness.mjs";

export async function runPerfRun(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv);
  const suiteOptions = {
    rootDir: options.rootDir || process.cwd(),
    outputDir: args.outputDir || path.join("artifacts", "perf"),
    captureCpuProfile: args.captureCpuProfile
  };
  if (Number.isFinite(args.seed)) suiteOptions.seed = args.seed;
  if (Number.isFinite(args.warmupIterations)) suiteOptions.warmupIterations = args.warmupIterations;
  if (Number.isFinite(args.measuredIterations)) suiteOptions.measuredIterations = args.measuredIterations;
  if (Number.isFinite(args.cpuSlowdownFactor)) suiteOptions.cpuSlowdownFactor = args.cpuSlowdownFactor;
  const result = await runPerfScenarioSuite(suiteOptions);

  const summary = {
    ok: true,
    outputDir: result.artifacts.outputDir,
    jsonPath: result.artifacts.jsonPath,
    markdownPath: result.artifacts.markdownPath,
    scenarioCount: Object.keys(result.report.scenarios || {}).length,
    scenarioOrder: result.report.scenario_order
  };

  if (options.print !== false) {
    console.log(`[perf:run] JSON report: ${summary.jsonPath}`);
    console.log(`[perf:run] Markdown report: ${summary.markdownPath}`);
    console.log(`SUMMARY_JSON=${JSON.stringify(summary)}`);
  }

  return {
    summary,
    report: result.report,
    artifacts: result.artifacts
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

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  runPerfRun(process.argv.slice(2), { print: true })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[perf:run] failed: ${error && error.message ? error.message : String(error)}`);
      process.exit(1);
    });
}
