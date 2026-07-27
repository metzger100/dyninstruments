// Rule definitions that only need a `detect` regex (dispatched via the generic
// runRegexRule fallback in check-patterns.mjs) with no dedicated runner module.

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const REGEX_RULES = [
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
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[legacy-theme-css-input-consumer] ${file}:${line}\nLegacy CSS input var '${match[0]}' detected. Migrated surface/typography consumers must use --dyni-theme-* outputs.`
  },
  {
    name: "absolute-user-home-path",
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
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[absolute-user-home-path] ${file}:${line}\nAbsolute user-home path detected (${match[0]}). Use project-relative or redacted placeholders instead (for example '/path/to/...', '/home/<user>/...').`
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
    /** @param {{file: string, line: number, match: RegExpMatchArray}} finding */
    message: ({ file, line, match }) =>
      `[exec-plan-reference] ${file}:${line}\n'${match[0]}' cites a historical exec-plan/phase outside exec-plans/. Describe the code or config standalone instead.`
  },
  {
    name: "forbidden-globals",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js", "**/tests/**", "**/tools/**"]
    },
    detect: /(?:window\.avnav|(?<!\w)avnav\.api)/g,
    allowlist: [],
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[forbidden-global] ${file}:${line}\nDirect access to 'avnav.api' in widget code. Widgets must use\ncomponentContext.format.applyFormatter() instead. The centralized formatter in\nruntime/format-runtime.js (runtime.format service) already handles availability checks, try/catch,\nand fallback. See ARCHITECTURE.md boundary rule and core-principles.md #9.`
  },
  {
    name: "empty-catch",
    scope: { include: ["**/*.js"], exclude: ["tests/**", "tools/**"] },
    detect: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    allowlist: [],
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[empty-catch] ${file}:${line}\nEmpty catch block swallows errors silently. Either:\n1. Add a comment explaining why: catch(e) { /* intentional: avnav may be absent */ }\n2. Log the error: catch(e) { console.warn('...', e); }\n3. Use componentContext.format.applyFormatter() which handles this centrally via runtime.format.\nSee core-principles.md #11.`
  },
  {
    name: "console-in-widgets",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js"]
    },
    detect: /\bconsole\.(log|warn|error)\b/g,
    allowlist: [],
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[console-in-widget] ${file}:${line}\nconsole.log/warn/error in non-runtime code. Only runtime/ and plugin.js\nmay log directly. Remove debug logging before committing.`
  }
];
