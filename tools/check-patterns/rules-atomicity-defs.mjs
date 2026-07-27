// Rule definitions for the atomicity-contract family in rules-atomicity.mjs.

import {
  runCanvasApiTypeofGuardRule,
  runEngineLayoutDefaultDriftRule,
  runFrameworkMethodTypeofGuardRule,
  runInlineConfigDefaultDuplicationRule,
  runTryFinallyCanvasDrawingRule,
  runWidgetRendererDefaultDuplicationRule
} from "./rules-atomicity.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const ATOMICITY_RULES = [
  {
    name: "widget-renderer-default-duplication",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runWidgetRendererDefaultDuplicationRule,
    /** @param {{file: string, line: number, groupName: string, expression: string, configFile: string, propNames: string}} finding */
    message: ({ file, line, groupName, expression, configFile, propNames }) =>
      `[widget-renderer-default-duplication] ${file}:${line}\nWidget hardcodes ${groupName} (${expression}) which duplicates config-owned defaults in ${configFile} via ${propNames}. Remove the widget-level defaults and keep the engine fallback as the unreachable last resort.`
  },
  {
    name: "engine-layout-default-drift",
    severity: "block",
    scope: {
      include: ["shared/widget-kits/linear/*.js", "shared/widget-kits/radial/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runEngineLayoutDefaultDriftRule,
    /** @param {{file: string, line: number, constantName: string, expression: string, otherFile: string}} finding */
    message: ({ file, line, constantName, expression, otherFile }) =>
      `[engine-layout-default-drift] ${file}:${line}\nLayout constant ${constantName} = ${expression} duplicates the engine-owned ratio default in ${otherFile}. Keep semantic ratio defaults in one owner only.`
  },
  {
    name: "canvas-api-typeof-guard",
    severity: "block",
    scope: {
      include: ["shared/**/*.js", "widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCanvasApiTypeofGuardRule,
    /** @param {{file: string, line: number, methodName: string}} finding */
    message: ({ file, line, methodName }) =>
      `[canvas-api-typeof-guard] ${file}:${line}\nRedundant typeof guard for Canvas 2D method ctx.${methodName}. The rendering context is already a trusted CanvasRenderingContext2D at the setup boundary.`
  },
  {
    name: "try-finally-canvas-drawing",
    severity: "block",
    scope: {
      include: ["shared/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runTryFinallyCanvasDrawingRule,
    /** @param {{file: string, line: number, expression: string}} finding */
    message: ({ file, line, expression }) =>
      `[try-finally-canvas-drawing] ${file}:${line}\nCanvas save/restore wrapped in ${expression}. Keep the direct save/restore pair and reserve try/finally for real throwing boundaries.`
  },
  {
    name: "framework-method-typeof-guard",
    severity: "block",
    scope: {
      include: ["shared/**/*.js", "widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runFrameworkMethodTypeofGuardRule,
    /** @param {{file: string, line: number, target: string}} finding */
    message: ({ file, line, target }) =>
      `[framework-method-typeof-guard] ${file}:${line}\nRedundant typeof guard on trusted framework method ${target}. Internal module-loader contracts should be used directly once resolved.`
  },
  {
    name: "inline-config-default-duplication",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "shared/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runInlineConfigDefaultDuplicationRule,
    /** @param {{file: string, line: number, propName: string, literal: string, configFile: string}} finding */
    message: ({ file, line, propName, literal, configFile }) =>
      `[inline-config-default-duplication] ${file}:${line}\nInline fallback ${literal} for prop '${propName}' duplicates the config-owned editable default in ${configFile}. Trust the editable-default contract instead of re-declaring it locally.`
  }
];
