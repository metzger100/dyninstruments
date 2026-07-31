// Generic rule definitions for the atomicity-contract family.

import {
  runCanvasApiTypeofGuardRule,
  runFrameworkMethodTypeofGuardRule,
  runTryFinallyCanvasDrawingRule
} from "../rules-atomicity.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const ATOMICITY_GENERIC_RULES = [
  {
    name: "canvas-api-typeof-guard",
    severity: "block",
    run: runCanvasApiTypeofGuardRule,
    /** @param {{file: string, line: number, methodName: string}} finding */
    message: ({ file, line, methodName }) =>
      `[canvas-api-typeof-guard] ${file}:${line}\nRedundant typeof guard for Canvas 2D method ctx.${methodName}. The rendering context is already a trusted CanvasRenderingContext2D at the setup boundary.`
  },
  {
    name: "try-finally-canvas-drawing",
    severity: "block",
    run: runTryFinallyCanvasDrawingRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[try-finally-canvas-drawing] ${file}:${line}\nCanvas save/restore wrapped in ${expression}. Keep the direct save/restore pair and reserve try/finally for real throwing boundaries.`
  },
  {
    name: "framework-method-typeof-guard",
    severity: "block",
    run: runFrameworkMethodTypeofGuardRule,
    /** @param {{file: string, line: number, target: string}} finding */
    message: ({ file, line, target }) =>
      `[framework-method-typeof-guard] ${file}:${line}\nRedundant typeof guard on trusted framework method ${target}. Internal module-loader contracts should be used directly once resolved.`
  }
];
