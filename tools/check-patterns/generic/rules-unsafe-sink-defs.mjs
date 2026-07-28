// Rule definition for the unsafe-html-dom-sink rule in rules-unsafe-sink.mjs.

import { runUnsafeHtmlDomSinkRule } from "../rules-unsafe-sink.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const UNSAFE_SINK_RULES = [
  {
    name: "unsafe-html-dom-sink",
    severity: "block",
    scope: {
      include: [
        "widgets/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "runtime/**/*.js",
        "config/**/*.js",
        "plugin.js",
        "plugin.mjs"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runUnsafeHtmlDomSinkRule,
    /** @param {{file: string, line: number, sinkName: string}} finding */
    message: ({ file, line, sinkName }) =>
      `[unsafe-html-dom-sink] ${file}:${line}\nUnauthorized HTML DOM sink '${sinkName}' detected. Only a narrow reviewed set of parsing/patch sinks may assign innerHTML/outerHTML; render markup through owned boundary helpers elsewhere.`
  }
];
