// Project-set rule definitions for the legacy-support family: canonical-helper-redefinition
// reads a hardcoded Dyninstruments module-ownership registry, and
// editable-threshold-missing-internal targets the AvNav editable-parameter contract.

import { runCanonicalHelperRedefinitionRule, runEditableThresholdInternalRule } from "../rules-legacy-support.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const LEGACY_SUPPORT_PROJECT_RULES = [
  {
    name: "canonical-helper-redefinition",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCanonicalHelperRedefinitionRule,
    message: ({ file, line, helperName, ownerModule, ownerPath }) =>
      `[canonical-helper-redefinition] ${file}:${line}\nCanonical helper '${helperName}' is redefined outside its owner '${ownerModule}' (${ownerPath}). Use the shared module export instead of a private helper copy.`
  },
  {
    name: "editable-threshold-missing-internal",
    scope: {
      include: ["config/clusters/*.js", "config/shared/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runEditableThresholdInternalRule,
    message: ({ file, line, keyName }) =>
      `[editable-threshold-missing-internal] ${file}:${line}\nEditable parameter '${keyName}' looks like an internal ratio/threshold layout knob but is missing 'internal: true'. Mark runtime-only threshold specs internal so defaults still apply without exposing them in the host editor.`
  }
];
