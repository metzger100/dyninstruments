// Generic-set rule definitions for the fail-fast/dead-code family: no Dyninstruments-specific
// concept appears in these rules' detection or message text, so they are liftable verbatim.

import {
  runDeadCodeRule,
  runDefaultTruthyFallbackRule,
  runTodoWithoutOwner,
  runUnusedFallbackRule
} from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const CORE_GENERIC_RULES = [
  {
    name: "todo-without-owner",
    scope: {
      include: ["**/*.js", "**/*.md"],
      exclude: ["node_modules/**", "README.md", "CONTRIBUTING.md", "ROADMAP.md"]
    },
    detect: /\b(?:TODO|FIXME|HACK|XXX)\b/,
    allowlist: [],
    run: runTodoWithoutOwner,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  },
  {
    name: "unused-fallback",
    scope: {
      include: [
        "widgets/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "runtime/**/*.js",
        "config/**/*.js",
        "plugin.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runUnusedFallbackRule,
    /** @param {{file: string, line: number, name: string}} finding */
    message: ({ file, line, name }) =>
      `[unused-fallback] ${file}:${line}\nFallback symbol '${name}' is declared but never used. Remove stale fallback leftovers from refactors or wire the fallback into active code paths.`
  },
  {
    name: "dead-code",
    scope: {
      include: [
        "widgets/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "runtime/**/*.js",
        "config/**/*.js",
        "plugin.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDeadCodeRule,
    functionAllowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    /** @param {{file: string, line: number, detail: string}} finding */
    message: ({ file, line, detail }) =>
      `[dead-code] ${file}:${line}\n${detail}\nRemove stale refactor leftovers or make branch/function reachable.`
  },
  {
    name: "default-truthy-fallback",
    scope: {
      include: [
        "widgets/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "runtime/**/*.js",
        "config/**/*.js",
        "plugin.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDefaultTruthyFallbackRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[default-truthy-fallback] ${file}:${line}\nTruthy fallback on '.default' detected (${expression}). This clobbers explicit falsy defaults ("", 0, false).\nUse property-presence/nullish semantics instead of '||'.`
  }
];
