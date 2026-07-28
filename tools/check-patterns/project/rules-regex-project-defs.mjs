// Project-set rule definitions that only need a `detect` regex (dispatched via the shared
// runRegexRule fallback). Each of these ties to a Dyninstruments-specific concept: the removed
// theme/surface architecture, the dyni-* CSS theme token prefix, or the avnav host API boundary.

import { runRegexRule } from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const REGEX_PROJECT_RULES = [
  {
    name: "removed-theme-surface-architecture",
    severity: "block",
    scope: {
      include: [
        "plugin.js",
        "runtime/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "widgets/**/*.js",
        "config/**/*.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    detect:
      /\bThemePresets\b|data-dyni-theme|applyThemePreset|ThemeResolver\.create\s*\(|invalidateTheme\s*\(|namedHandlers\s*\(|\bcatchAll\b|triggerResize\s*\(|onclick=\x22/g,
    run: runRegexRule,
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[removed-theme-surface-architecture] ${file}:${line}\nRemoved legacy theme/surface architecture token detected (${match[0]}). Do not reintroduce legacy theme/surface interaction paths.`
  },
  {
    name: "legacy-theme-css-input-consumer",
    severity: "block",
    scope: {
      include: ["plugin.css", "widgets/**/*.css"],
      exclude: ["tests/**", "tools/**"]
    },
    detect: /--dyni-border-day|--dyni-border-night|--dyni-font-weight|--dyni-label-weight/g,
    run: runRegexRule,
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[legacy-theme-css-input-consumer] ${file}:${line}\nLegacy CSS input var '${match[0]}' detected. Migrated surface/typography consumers must use --dyni-theme-* outputs.`
  },
  {
    name: "forbidden-globals",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js", "**/tests/**", "**/tools/**"]
    },
    detect: /(?:window\.avnav|(?<!\w)avnav\.api)/g,
    allowlist: [],
    run: runRegexRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[forbidden-global] ${file}:${line}\nDirect access to 'avnav.api' in widget code. Widgets must use\ncomponentContext.format.applyFormatter() instead. The centralized formatter in\nruntime/format-runtime.js (runtime.format service) already handles availability checks, try/catch,\nand fallback. See ARCHITECTURE.md boundary rule and core-principles.md #9.`
  }
];
