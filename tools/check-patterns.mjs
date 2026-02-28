#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";
import { RULES, runRegexRule } from "./check-patterns/rules.mjs";
import {
  compareFindings,
  filesForScope,
  getWarnMode,
  resetContext
} from "./check-patterns/shared.mjs";

export function runPatternCheck(options = {}) {
  resetContext({
    root: path.resolve(options.root || process.cwd()),
    warnMode: !!options.warnMode
  });

  const findings = [];
  const warnings = [];
  const checkedFiles = new Set();
  const byRule = {};
  const byRuleFailures = {};
  const byRuleWarnings = {};
  for (const rule of RULES) {
    const files = filesForScope(rule.scope);
    for (const file of files) checkedFiles.add(file);
    const run = rule.run || runRegexRule;
    const ruleFindings = run(rule, files)
      .map(function (finding) {
        const severity = finding.severity || rule.severity || "block";
        return {
          ...finding,
          severity
        };
      })
      .sort(compareFindings);
    byRule[rule.name] = ruleFindings.length;
    const ruleFailures = ruleFindings.filter((finding) => finding.severity === "block");
    const ruleWarns = ruleFindings.filter((finding) => finding.severity === "warn");
    byRuleFailures[rule.name] = ruleFailures.length;
    byRuleWarnings[rule.name] = ruleWarns.length;
    findings.push(...ruleFailures);
    warnings.push(...ruleWarns);
  }

  const summary = {
    ok: findings.length === 0,
    warnMode: getWarnMode(),
    checkedFiles: checkedFiles.size,
    failures: findings.length,
    warnings: warnings.length,
    byRule,
    byRuleFailures,
    byRuleWarnings
  };

  if (options.print !== false) {
    if (findings.length || warnings.length) {
      for (const warning of warnings) console.log(warning.message);
      const print = getWarnMode() ? console.log : console.error;
      for (const finding of findings) print(finding.message);
      print("SUMMARY_JSON=" + JSON.stringify(summary));
    }
    else {
      console.log("Pattern check passed.");
      console.log("SUMMARY_JSON=" + JSON.stringify(summary));
    }
  }

  return { summary, findings, warnings };
}

export function runPatternCheckCli(argv = process.argv.slice(2)) {
  const warnMode = argv.includes("--warn");
  const { summary, findings } = runPatternCheck({
    root: process.cwd(),
    warnMode,
    print: true
  });
  if (findings.length && !summary.warnMode) process.exit(1);
  process.exit(0);
}

function isCliEntrypoint() {
  if (!process.argv[1]) return false;
  return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCliEntrypoint()) {
  runPatternCheckCli();
}
