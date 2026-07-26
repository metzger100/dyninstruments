// Lint-directive / suppression-comment parsing (dyni-lint-disable-*, dyni-boundary-*).

import { getFileData, lineAt } from "./shared.mjs";

let lintDirectiveCache = new Map();
let knownRuleNames = [];

export const BOUNDARY_MARKER_RULE_NAME = "catch-fallback-without-suppression";

export function resetSuppressionState() {
  lintDirectiveCache = new Map();
  knownRuleNames = [];
}

export function setKnownRuleNames(names) {
  knownRuleNames = Array.isArray(names) ? names.slice() : [];
  lintDirectiveCache = new Map();
}

export function isLintSuppressed(file, line, ruleName) {
  const info = getLintDirectiveInfo(file);
  const suppressedRules = info.suppressionsByLine.get(line);
  return !!(suppressedRules && suppressedRules.has(ruleName));
}

export function getInvalidLintSuppressions(file) {
  return getLintDirectiveInfo(file).invalids.slice();
}

function getLintDirectiveInfo(file) {
  if (lintDirectiveCache.has(file)) {
    return lintDirectiveCache.get(file);
  }

  const data = getFileData(file);
  const info = parseLintDirectives(data.text, data.lineStarts);
  lintDirectiveCache.set(file, info);
  return info;
}

function parseLintDirectives(text, lineStarts) {
  const suppressionsByLine = new Map();
  const invalids = [];
  const knownRules = new Set(knownRuleNames);
  const commentRe = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  let match;

  while ((match = commentRe.exec(text))) {
    const raw = match[0];
    if (!raw.includes("dyni-lint-disable-") && !raw.includes("dyni-boundary-")) {
      continue;
    }

    const line = lineAt(match.index, lineStarts);
    const body = raw.startsWith("//") ? raw.slice(2).trim() : raw.slice(2, -2).trim();

    if (body.includes("dyni-boundary-")) {
      parseBoundaryMarker(body, line, suppressionsByLine, invalids);
      continue;
    }

    parseLintDisableDirective(body, line, knownRules, suppressionsByLine, invalids);
  }

  return {
    suppressionsByLine,
    invalids
  };
}

function parseLintDisableDirective(body, line, knownRules, suppressionsByLine, invalids) {
  const parsed = /^dyni-lint-disable-(next-line|line)\s+([a-z0-9-]+)\s+--\s+(.+)$/s.exec(body);
  if (!parsed) {
    invalids.push({
      line,
      detail: `Malformed suppression directive '${body}'. Expected 'dyni-lint-disable-next-line <rule-name> -- <reason>' or 'dyni-lint-disable-line <rule-name> -- <reason>'.`
    });
    return;
  }

  const mode = parsed[1];
  const ruleName = parsed[2];
  const reason = parsed[3].trim();
  if (!reason) {
    invalids.push({ line, detail: `Suppression for rule '${ruleName}' is missing a reason.` });
    return;
  }
  if (!knownRules.has(ruleName)) {
    invalids.push({ line, detail: `Suppression references unknown rule '${ruleName}'.` });
    return;
  }
  invalids.push({
    line,
    detail: `Generic production suppression '${mode} ${ruleName}' is forbidden. Use a checker-owned canonical exception, or a validated dyni-boundary marker for an external catch fallback.`
  });
}

function parseBoundaryMarker(body, line, suppressionsByLine, invalids) {
  const parsed = /^dyni-boundary-(next-line|line)\(([^)]*)\)\s+--\s+(.+)$/s.exec(body);
  if (!parsed) {
    invalids.push({
      line,
      detail: `Malformed boundary marker '${body}'. Expected 'dyni-boundary-next-line(category: <slug>, owner: <handle>, date: <YYYY-MM-DD>[, expires: <YYYY-MM-DD>]) -- <reason>' or the '-line' variant.`
    });
    return;
  }

  const mode = parsed[1];
  const reason = parsed[3].trim();
  const fields = parseBoundaryMarkerFields(parsed[2]);
  const error = validateBoundaryMarkerFields(fields, reason);
  if (error) {
    invalids.push({ line, detail: `Invalid boundary marker: ${error}` });
    return;
  }

  addSuppression(suppressionsByLine, mode === "next-line" ? line + 1 : line, BOUNDARY_MARKER_RULE_NAME);
}

function parseBoundaryMarkerFields(rawFields) {
  const fields = {};
  for (const entry of rawFields.split(",")) {
    const separatorIndex = entry.indexOf(":");
    if (separatorIndex < 0) continue;
    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    if (key) fields[key] = value;
  }
  return fields;
}

function validateBoundaryMarkerFields(fields, reason) {
  if (!fields.category || !/^[a-z][a-z0-9-]*$/.test(fields.category)) {
    return "'category' is required and must be a lowercase kebab-case slug.";
  }
  if (!fields.owner || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(fields.owner)) {
    return "'owner' is required and must be a handle-like identifier.";
  }
  if (!fields.date || !isValidIsoDate(fields.date)) {
    return "'date' is required and must be a valid 'YYYY-MM-DD' calendar date.";
  }
  if (fields.expires !== undefined) {
    if (!isValidIsoDate(fields.expires)) {
      return "'expires' must be a valid 'YYYY-MM-DD' calendar date.";
    }
    if (fields.expires < isoToday()) {
      return `temporary marker expired on ${fields.expires}.`;
    }
  }
  if (!reason) {
    return "a reason after '--' is required.";
  }
  return null;
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addSuppression(suppressionsByLine, targetLine, ruleName) {
  if (!suppressionsByLine.has(targetLine)) {
    suppressionsByLine.set(targetLine, new Set());
  }
  suppressionsByLine.get(targetLine).add(ruleName);
}
