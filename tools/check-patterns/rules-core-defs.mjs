// Rule definitions for the general-purpose fail-fast/dead-code family in rules-core.mjs.

import {
  runDeadCodeRule,
  runDefaultTruthyFallbackRule,
  runFormatterAvailabilityHeuristicRule,
  runLegacyComponentLoaderApiRule,
  runRendererNumericCoercionRule,
  runRuntimeReachThroughRule,
  runTodoWithoutOwner,
  runUnusedFallbackRule
} from "./rules-core.mjs";

export const CORE_RULES = [
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
    message: ({ file, line, expression }) =>
      `[runtime-service-reach-through] ${file}:${line}\nDirect runtime service reach-through detected (${expression}). Ordinary registered components must use componentContext.* service views instead.`
  },
  {
    name: "todo-without-owner",
    scope: {
      include: ["**/*.js", "**/*.md"],
      exclude: ["node_modules/**", "README.md", "CONTRIBUTING.md", "ROADMAP.md"]
    },
    detect: /\b(?:TODO|FIXME|HACK|XXX)\b/,
    allowlist: [],
    run: runTodoWithoutOwner,
    message: ({ file, line }) =>
      `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  },
  {
    name: "unused-fallback",
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
    run: runUnusedFallbackRule,
    message: ({ file, line, name }) =>
      `[unused-fallback] ${file}:${line}\nFallback symbol '${name}' is declared but never used. Remove stale fallback leftovers from refactors or wire the fallback into active code paths.`
  },
  {
    name: "dead-code",
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
    run: runDeadCodeRule,
    functionAllowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    message: ({ file, line, detail }) =>
      `[dead-code] ${file}:${line}\n${detail}\nRemove stale refactor leftovers or make branch/function reachable.`
  },
  {
    name: "default-truthy-fallback",
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
    run: runDefaultTruthyFallbackRule,
    message: ({ file, line, expression }) =>
      `[default-truthy-fallback] ${file}:${line}\nTruthy fallback on '.default' detected (${expression}). This clobbers explicit falsy defaults ("", 0, false).\nUse property-presence/nullish semantics instead of '||'.`
  },
  {
    name: "formatter-availability-heuristic",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runFormatterAvailabilityHeuristicRule,
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
    message: ({ file, line, propName }) =>
      `[renderer-numeric-coercion-without-boundary-contract] ${file}:${line}\nRenderer coerces mapper-owned prop '${propName}' via Number(props.${propName}).\nNormalize at mapper boundary and pass finite numbers or undefined.`
  }
];
