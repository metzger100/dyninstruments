// Generic rule definitions for the fail-fast/dead-code family.

import {
  runDeadCodeRule,
  runDefaultTruthyFallbackRule,
  runTodoWithoutOwner,
  runUnusedFallbackRule
} from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const CORE_GENERIC_RULES = [
  {
    name: "todo-without-owner",
    detect: /\b(?:TODO|FIXME|HACK|XXX)\b/,
    allowlist: [],
    run: runTodoWithoutOwner,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  },
  {
    name: "unused-fallback",
    run: runUnusedFallbackRule,
    /** @param {{file: string, line: number, name: string}} finding */
    message: ({ file, line, name }) =>
      `[unused-fallback] ${file}:${line}\nFallback symbol '${name}' is declared but never used. Remove stale fallback leftovers from refactors or wire the fallback into active code paths.`
  },
  {
    name: "dead-code",
    run: runDeadCodeRule,
    functionAllowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    /** @param {{file: string, line: number, detail: string}} finding */
    message: ({ file, line, detail }) =>
      `[dead-code] ${file}:${line}\n${detail}\nRemove stale refactor leftovers or make branch/function reachable.`
  },
  {
    name: "default-truthy-fallback",
    run: runDefaultTruthyFallbackRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[default-truthy-fallback] ${file}:${line}\nTruthy fallback on '.default' detected (${expression}). This clobbers explicit falsy defaults ("", 0, false).\nUse property-presence/nullish semantics instead of '||'.`
  }
];
