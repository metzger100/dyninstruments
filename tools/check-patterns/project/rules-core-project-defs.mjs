// Project-set rule definitions for the fail-fast/dead-code family: each of these ties to the
// Dyninstruments componentContext/mapper/formatter boundary contract.

import {
  runFormatterAvailabilityHeuristicRule,
  runLegacyComponentLoaderApiRule,
  runRendererNumericCoercionRule,
  runRuntimeReachThroughRule
} from "../rules-core.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const CORE_PROJECT_RULES = [
  {
    name: "legacy-component-loader-api",
    severity: "block",
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
    run: runLegacyComponentLoaderApiRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[legacy-component-loader-api] ${file}:${line}\nRemoved loader API detected (${expression}). Final runtime/component code must use componentContext.components.require(...) and runtime-owned services only.`
  },
  {
    name: "runtime-service-reach-through",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["cluster/ClusterWidget.js", "tests/**", "tools/**"]
    },
    run: runRuntimeReachThroughRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[runtime-service-reach-through] ${file}:${line}\nDirect runtime service reach-through detected (${expression}). Ordinary registered components must use componentContext.* service views instead.`
  },
  {
    name: "formatter-availability-heuristic",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runFormatterAvailabilityHeuristicRule,
    /** @param {{file: string, line: number}} finding */
    message: ({ file, line }) =>
      `[formatter-availability-heuristic] ${file}:${line}\nFormatter-availability inferred from output equality to String(raw).\nDo not treat formatted output equal to raw text as formatter failure.`
  },
  {
    name: "renderer-numeric-coercion-without-boundary-contract",
    scope: {
      include: ["widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRendererNumericCoercionRule,
    /** @param {{file: string, line: number, propName: string}} finding */
    message: ({ file, line, propName }) =>
      `[renderer-numeric-coercion-without-boundary-contract] ${file}:${line}\nRenderer coerces mapper-owned prop '${propName}' via Number(props.${propName}).\nNormalize at mapper boundary and pass finite numbers or undefined.`
  }
];
