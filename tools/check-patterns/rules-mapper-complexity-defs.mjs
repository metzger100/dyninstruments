// Rule definition for the mapper-output-complexity rule in rules-mapper-complexity.mjs.

import { runMapperOutputComplexityRule } from "./rules-mapper-complexity.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const MAPPER_COMPLEXITY_RULES = [
  {
    name: "mapper-output-complexity",
    scope: {
      include: ["cluster/mappers/*Mapper.js"],
      exclude: [
        "cluster/mappers/ClusterMapperRegistry.js",
        "cluster/mappers/ClusterMapperToolkit.js",
        "tests/**",
        "tools/**"
      ]
    },
    run: runMapperOutputComplexityRule,
    message: ({ file, line, propCount, kind }) =>
      `[mapper-output-complexity] ${file}:${line} — Mapper returns ${propCount} properties for kind '${kind}'. If >8 props are needed, consider extracting a dedicated renderer wrapper instead of overloading the target renderer. See the renderer decision rule in the add-new-cluster guide.`
  }
];
