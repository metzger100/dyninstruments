// Generic-set rule definitions that only need a `detect` regex (dispatched via the shared
// runRegexRule fallback) with no Dyninstruments-specific concept in their detection or message.

import { runRegexRule } from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const REGEX_GENERIC_RULES = [
  {
    name: "absolute-home-path",
    severity: "block",
    scope: {
      include: [
        "**/*.md",
        "**/*.js",
        "**/*.mjs",
        "**/*.cjs",
        "**/*.json",
        "**/*.yml",
        "**/*.yaml",
        "**/*.txt",
        "**/*.sh"
      ],
      exclude: ["tests/**", "tools/**", ".vscode/**", ".idea/**"]
    },
    detect: /(?:\/home\/[A-Za-z0-9_.-]+\/|\/Users\/[A-Za-z0-9_.-]+\/)/g,
    run: runRegexRule,
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[absolute-home-path] ${file}:${line}\nAbsolute user-home path detected (${match[0]}). Use project-relative or redacted placeholders instead (for example '/path/to/...', '/home/<user>/...').`
  },
  {
    name: "exec-plan-reference",
    severity: "block",
    scope: {
      include: [
        "**/*.md",
        "**/*.js",
        "**/*.mjs",
        "**/*.cjs",
        "**/*.json",
        "**/*.jsonc",
        "**/*.yml",
        "**/*.yaml",
        "**/*.txt",
        "**/*.sh",
        "**/*.css",
        "**/*.html"
      ],
      exclude: [
        "exec-plans/**",
        "releases/**",
        "artifacts/**",
        ".codex/**",
        ".kilo/**",
        ".vscode/**",
        ".idea/**",
        "package-lock.json"
      ]
    },
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
    scope: { include: ["**/*.js"], exclude: ["tests/**", "tools/**"] },
    detect: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    allowlist: [],
    run: runRegexRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[empty-catch] ${file}:${line}\nEmpty catch block swallows errors silently. Either add a comment explaining\nwhy the swallow is intentional, log the error, or route it to the boundary that owns fallback behavior.`
  },
  {
    name: "console-in-widgets",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js"]
    },
    detect: /\bconsole\.(log|warn|error)\b/g,
    allowlist: [],
    run: runRegexRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[console-in-widget] ${file}:${line}\nconsole.log/warn/error in non-runtime code. Only runtime/ and plugin.js\nmay log directly. Remove debug logging before committing.`
  }
];
