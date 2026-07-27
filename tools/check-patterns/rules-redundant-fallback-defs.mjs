// Rule definition for the redundant-internal-fallback rule in rules-redundant-fallback.mjs.

import { runRedundantInternalFallbackRule } from "./rules-redundant-fallback.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const REDUNDANT_FALLBACK_RULES = [
  {
    name: "redundant-internal-fallback",
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
    run: runRedundantInternalFallbackRule,
    /** @param {{file: string, line: number, expression: string, propName?: string, rendererId?: string, sourceType?: string}} finding */
    message: ({ file, line, expression, propName, rendererId, sourceType }) => {
      if (sourceType === "applyFormatter-default") {
        return `[redundant-internal-fallback] ${file}:${line}\nRedundant fallback (${expression}). componentContext.format.applyFormatter() already applies the same default; remove the outer fallback wrapper.`;
      }
      return `[redundant-internal-fallback] ${file}:${line}\nRedundant fallback (${expression}) for prop '${propName}'. Renderer '${rendererId}' guarantees this prop via mapper kind-default contracts.`;
    }
  }
];
