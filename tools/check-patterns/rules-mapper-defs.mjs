// Rule definitions for the mapper-shape family in rules-mapper.mjs.

import {
  runAbsentNumericSentinelRule,
  runClusterRendererClusterPrefixRule,
  runMapperLogicLeakageRule,
  runMapperPropRenormalizationRule
} from "./rules-mapper.mjs";

/** @typedef {import("./shared.mjs").Rule} Rule */

/** @type {Rule[]} */
export const MAPPER_RULES = [
  {
    name: "absent-numeric-sentinel",
    severity: "block",
    scope: {
      include: ["cluster/mappers/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runAbsentNumericSentinelRule,
    message: ({ file, line, sentinel }) =>
      `[absent-numeric-sentinel] ${file}:${line}\nMapper output uses '${sentinel}' as an absent-value sentinel. Optional numeric mapper output must use 'undefined' for the absent case.`
  },
  {
    name: "mapper-prop-renormalization",
    severity: "block",
    scope: {
      include: ["widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runMapperPropRenormalizationRule,
    message: ({ file, line, propName, helperName }) =>
      `[mapper-prop-renormalization] ${file}:${line}\nRenderer re-normalizes boundary-owned prop '${propName}' via ${helperName}.\nCluster mappers and editable defaults own rendererProps normalization. Trust that boundary instead of re-normalizing numeric or string props downstream.`
  },
  {
    name: "mapper-logic-leakage",
    scope: {
      include: ["cluster/mappers/*Mapper.js"],
      exclude: [
        "cluster/mappers/ClusterMapperRegistry.js",
        "cluster/mappers/ClusterMapperToolkit.js",
        "tests/**",
        "tools/**"
      ]
    },
    run: runMapperLogicLeakageRule,
    functionAllowlist: ["create", "translate"],
    message: ({ file, line, detail }) =>
      `[mapper-logic-leakage] ${file}:${line}\n${detail}\nMappers must stay declarative. Move presentation/business logic to renderer modules or ClusterMapperToolkit.`
  },
  {
    name: "cluster-renderer-cluster-prefix",
    scope: {
      include: ["cluster/rendering/*.js"],
      exclude: ["cluster/rendering/ClusterRendererRouter.js", "tests/**", "tools/**"]
    },
    run: runClusterRendererClusterPrefixRule,
    allowlist: [],
    message: ({ file, line, id, prefix }) =>
      `[cluster-renderer-cluster-prefix] ${file}:${line}\nRenderer id '${id}' starts with cluster prefix '${prefix}'.\nUse role-based renderer names in cluster/rendering/ (for example 'RendererPropsWidget' instead of '${prefix}${id.slice(prefix.length)}').`
  }
];
