// Project-set rule definition registering this repository's namespace token
// (`DyniComponents`/`DyniPlugin`) and CSS custom-property prefix (`--dyni-`) with the shared,
// configurable generic namespace-policy runner.

import { runNamespacePolicyRule } from "../generic/namespace-policy.mjs";

/** @typedef {import("../shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const NAMESPACE_POLICY_RULES = [
  {
    name: "namespace-token-consistency",
    severity: "block",
    scope: {
      include: [
        "widgets/**/*.js",
        "cluster/**/*.js",
        "shared/**/*.js",
        "widgets/**/*.css",
        "shared/**/*.css",
        "plugin.js",
        "plugin.css"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    jsGlobalPrefix: "Dyni",
    cssCustomPropertyPrefix: "--dyni-",
    run: runNamespacePolicyRule,
    /** @param {{file: string, line: number, kind: "js-global" | "css-custom-property", token: string}} finding */
    message: ({ file, line, kind, token }) =>
      kind === "js-global"
        ? `[namespace-token-consistency] ${file}:${line}\nGlobal property '${token}' does not use the registered 'Dyni' namespace prefix. UMD wrappers must expose components as 'Dyni{ComponentName}' on the shared namespace object.`
        : `[namespace-token-consistency] ${file}:${line}\nCSS custom property '${token}' does not use the registered '--dyni-' prefix. Keep all custom properties under the shared theme-token namespace.`
  }
];
