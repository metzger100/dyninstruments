#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SUMMARY_PATH = path.join(ROOT, "coverage", "coverage-summary.json");

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`Coverage summary not found: ${SUMMARY_PATH}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
const fileEntries = Object.entries(summary)
  .filter(([k]) => k !== "total")
  .map(([file, metrics]) => ({
    file,
    rel: path.relative(ROOT, file).replace(/\\/g, "/"),
    metrics
  }));

const rules = [
  {
    name: "Cluster mappers",
    matchPrefix: ["cluster/mappers/"],
    lines: 92,
    branches: 55
  },
  {
    name: "Runtime core",
    matchPrefix: ["runtime/"],
    lines: 88,
    branches: 75
  },
  {
    name: "Gauge math core",
    matchExact: [
      "shared/widget-kits/radial/RadialAngleMath.js",
      "shared/widget-kits/radial/RadialTickMath.js",
      "shared/widget-kits/radial/RadialValueMath.js"
    ],
    lines: 90,
    branches: 50
  },
  {
    name: "Dynamic cluster update functions",
    matchExact: [
      "config/clusters/nav.js",
      "config/clusters/environment.js",
      "config/clusters/vessel.js"
    ],
    lines: 95,
    branches: 70
  }
];

const failures = [];

for (const rule of rules) {
  const matched = fileEntries.filter((entry) => matchesRule(entry.rel, rule));

  if (!matched.length) {
    failures.push(`${rule.name}: no files matched rule`);
    continue;
  }

  const totals = matched.reduce(
    (acc, entry) => {
      acc.lines.total += Number(entry.metrics.lines?.total ?? 0);
      acc.lines.covered += Number(entry.metrics.lines?.covered ?? 0);
      acc.branches.total += Number(entry.metrics.branches?.total ?? 0);
      acc.branches.covered += Number(entry.metrics.branches?.covered ?? 0);
      return acc;
    },
    {
      lines: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 }
    }
  );

  const linesPct = totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0;
  const branchesPct = totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0;

  if (linesPct < rule.lines) {
    failures.push(
      `${rule.name}: lines ${linesPct.toFixed(2)}% < ${rule.lines}%`
    );
  }

  if (branchesPct < rule.branches) {
    failures.push(
      `${rule.name}: branches ${branchesPct.toFixed(2)}% < ${rule.branches}%`
    );
  }
}

if (failures.length) {
  console.error("Coverage rule check failed:\n");
  for (const line of failures) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

console.log("Coverage rule check passed.");

function matchesRule(relPath, rule) {
  const byExact = Array.isArray(rule.matchExact) && rule.matchExact.includes(relPath);
  const byPrefix = Array.isArray(rule.matchPrefix) && rule.matchPrefix.some((p) => relPath.startsWith(p));
  return byExact || byPrefix;
}
