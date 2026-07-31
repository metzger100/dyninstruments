// Generic rule definitions that only need a `detect` regex.

import { runRegexRule } from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const REGEX_GENERIC_RULES = [
  {
    name: "absolute-home-path",
    severity: "block",
    detect: /(?:\/home\/[A-Za-z0-9_.-]+\/|\/Users\/[A-Za-z0-9_.-]+\/)/g,
    run: runRegexRule,
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[absolute-home-path] ${file}:${line}\nAbsolute user-home path detected (${match[0]}). Use project-relative or redacted placeholders instead (for example '/path/to/...', '/home/<user>/...').`
  },
  {
    name: "exec-plan-reference",
    severity: "block",
    // A bare "PLANn.md" is a legitimate reference to a real historical exec-plan file; anything
    // else naming a plan or phase number goes stale once that plan is archived and must describe
    // the code/config standalone instead.
    detect: /\bPLAN\d+\b(?!\.md)|\bPhase\s?\d+[A-Za-z]?\b/g,
    run: runRegexRule,
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[exec-plan-reference] ${file}:${line}\n'${match[0]}' cites a historical exec-plan/phase outside exec-plans/. Describe the code or config standalone instead.`
  },
  {
    name: "empty-catch",
    detect: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    allowlist: [],
    run: runRegexRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[empty-catch] ${file}:${line}\nEmpty catch block swallows errors silently. Either add a comment explaining\nwhy the swallow is intentional, log the error, or route it to the boundary that owns fallback behavior.`
  },
  {
    name: "console-in-runtime",
    detect: /\bconsole\.(log|warn|error)\b/g,
    allowlist: [],
    run: runRegexRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[console-call-boundary] ${file}:${line}\nconsole.log/warn/error found outside the runtime boundary. Only the runtime entrypoint\nmay log directly. Remove debug logging before committing.`
  },
  {
    name: "no-nul-byte",
    severity: "block",
    detect: /\0/g,
    run: runRegexRule,
    message: ({ file, line }) => `[no-nul-byte] ${file}:${line}\nLiteral NUL byte detected in maintained text.`
  }
];
