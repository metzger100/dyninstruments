// Rule definition for the unsafe-html-dom-sink rule in rules-unsafe-sink.mjs.

import { runUnsafeHtmlDomSinkRule } from "../rules-unsafe-sink.mjs";

/** @typedef {import("../shared.mjs").RuleDefinition} RuleDefinition */

/** @type {RuleDefinition[]} */
export const UNSAFE_SINK_RULES = [
  {
    name: "unsafe-html-dom-sink",
    severity: "block",
    run: runUnsafeHtmlDomSinkRule,
    /** @param {{file: string, line: number, sinkName: string}} finding */
    message: ({ file, line, sinkName }) =>
      `[unsafe-html-dom-sink] ${file}:${line}\nUnauthorized HTML DOM sink '${sinkName}' detected. Only a narrow reviewed set of parsing/patch sinks may assign innerHTML/outerHTML; render markup through owned boundary helpers elsewhere.`
  }
];
