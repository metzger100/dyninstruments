import {
  runDeadCodeRule,
  runDefaultTruthyFallbackRule,
  runFormatterAvailabilityHeuristicRule,
  runRegexRule,
  runRendererNumericCoercionRule,
  runTodoWithoutOwner,
  runUnusedFallbackRule
} from "./rules-core.mjs";
import { runDuplicateBlockClones, runDuplicateFunctions } from "./rules-duplicates.mjs";
import {
  runCatchFallbackWithoutSuppressionRule,
  runCssJsDefaultDuplicationRule,
  runEditableThresholdInternalRule,
  runHardcodedRuntimeDefaultRule,
  runInternalHookFallbackRule,
  runInvalidLintSuppressionRule,
  runPrematureLegacySupportRule,
  runRedundantNullTypeGuardRule
} from "./rules-failfast.mjs";
import {
  runClusterRendererClusterPrefixRule,
  runMapperLogicLeakageRule,
  runMapperOutputComplexityRule
} from "./rules-mapper.mjs";
import { runRedundantInternalFallbackRule } from "./rules-redundant-fallback.mjs";
import {
  runResponsiveLayoutHardFloorRule,
  runResponsiveProfileOwnershipRule
} from "./rules-responsive.mjs";

const ALLOWLISTED_ORCHESTRATION_FUNCTIONS = new Set([
  "create",
  "translateFunction",
  "translate",
  "renderCanvas"
]);

export const RULES = [
  {
    name: "invalid-lint-suppression",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runInvalidLintSuppressionRule,
    message: ({ file, line, detail }) => `[invalid-lint-suppression] ${file}:${line}\n${detail}`
  },
  {
    name: "duplicate-functions",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js"],
      exclude: ["**/tests/**", "**/tools/**"]
    },
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateFunctions,
    message: ({ mode, tokenCount, fileCount, locations }) => {
      const lines = locations.map((loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-fn-body] ${mode} function clone across ${fileCount} files (${tokenCount} tokens):\n${lines}\nExtract shared logic to shared/widget-kits/ to prevent copy-paste drift.`;
    }
  },
  {
    name: "duplicate-block-clones",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js"],
      exclude: ["**/tests/**", "**/tools/**"]
    },
    allowlist: [...ALLOWLISTED_ORCHESTRATION_FUNCTIONS],
    run: runDuplicateBlockClones,
    message: ({ tokenCount, statementCount, locations }) => {
      const lines = locations.map((loc) => `  - ${loc.file}:${loc.line}`).join("\n");
      return `[duplicate-block] Cross-file cloned function block (${tokenCount} tokens, ${statementCount} statements):\n${lines}\nExtract shared logic to shared/widget-kits/ to keep behavior in one place.`;
    }
  },
  {
    name: "forbidden-globals",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js", "**/tests/**", "**/tools/**"]
    },
    detect: /(?:window\.avnav|(?<!\w)avnav\.api)/g,
    allowlist: [],
    message: ({ file, line }) => `[forbidden-global] ${file}:${line}\nDirect access to 'avnav.api' in widget code. Widgets must use\nHelpers.applyFormatter() instead. The centralized formatter in\nruntime/helpers.js already handles availability checks, try/catch,\nand fallback. See ARCHITECTURE.md boundary rule and core-principles.md #9.`
  },
  {
    name: "empty-catch",
    scope: { include: ["**/*.js"], exclude: ["tests/**", "tools/**"] },
    detect: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    allowlist: [],
    message: ({ file, line }) => `[empty-catch] ${file}:${line}\nEmpty catch block swallows errors silently. Either:\n1. Add a comment explaining why: catch(e) { /* intentional: avnav may be absent */ }\n2. Log the error: catch(e) { console.warn('...', e); }\n3. Use Helpers.applyFormatter() which handles this centrally.\nSee core-principles.md #11.`
  },
  {
    name: "catch-fallback-without-suppression",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCatchFallbackWithoutSuppressionRule,
    message: ({ file, line, expression }) => `[catch-fallback-without-suppression] ${file}:${line}\nNon-rethrow catch detected (${expression}). Fail-fast policy requires an inline rule-specific suppression comment for intentional fallback catches.`
  },
  {
    name: "console-in-widgets",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "config/**/*.js"],
      exclude: ["runtime/**", "plugin.js"]
    },
    detect: /\bconsole\.(log|warn|error)\b/g,
    allowlist: [],
    message: ({ file, line }) => `[console-in-widget] ${file}:${line}\nconsole.log/warn/error in non-runtime code. Only runtime/ and plugin.js\nmay log directly. Remove debug logging before committing.`
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
    message: ({ file, line }) => `[todo-missing-owner] ${file}:${line}\nTODO/FIXME without owner and date. Use format: TODO(name, 2025-06-15): description.\nUndated TODOs become permanent. See conventions/coding-standards.md.`
  },
  {
    name: "unused-fallback",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runUnusedFallbackRule,
    message: ({ file, line, name }) => `[unused-fallback] ${file}:${line}\nFallback symbol '${name}' is declared but never used. Remove stale fallback leftovers from refactors or wire the fallback into active code paths.`
  },
  {
    name: "dead-code",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDeadCodeRule,
    functionAllowlist: ["create", "translateFunction", "translate", "renderCanvas"],
    message: ({ file, line, detail }) => `[dead-code] ${file}:${line}\n${detail}\nRemove stale refactor leftovers or make branch/function reachable.`
  },
  {
    name: "default-truthy-fallback",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runDefaultTruthyFallbackRule,
    message: ({ file, line, expression }) => `[default-truthy-fallback] ${file}:${line}\nTruthy fallback on '.default' detected (${expression}). This clobbers explicit falsy defaults (\"\", 0, false).\nUse property-presence/nullish semantics instead of '||'.`
  },
  {
    name: "redundant-internal-fallback",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRedundantInternalFallbackRule,
    message: ({ file, line, expression, propName, rendererId, sourceType }) => {
      if (sourceType === "applyFormatter-default") {
        return `[redundant-internal-fallback] ${file}:${line}\nRedundant fallback (${expression}). Helpers.applyFormatter() already applies the same default; remove the outer fallback wrapper.`;
      }
      return `[redundant-internal-fallback] ${file}:${line}\nRedundant fallback (${expression}) for prop '${propName}'. Renderer '${rendererId}' guarantees this prop via mapper kind-default contracts.`;
    }
  },
  {
    name: "internal-hook-fallback",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runInternalHookFallbackRule,
    message: ({ file, line, expression }) => `[internal-hook-fallback] ${file}:${line}\nInternal hook/spec fallback detected (${expression}). Keep defaults at the boundary and avoid re-sanitizing internal hook results.`
  },
  {
    name: "redundant-null-type-guard",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRedundantNullTypeGuardRule,
    message: ({ file, line, expression }) => `[redundant-null-type-guard] ${file}:${line}\nRedundant internal null/type guard (${expression}). Trust validated internal contracts instead of silently sanitizing again.`
  },
  {
    name: "hardcoded-runtime-default",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runHardcodedRuntimeDefaultRule,
    message: ({ file, line, expression }) => `[hardcoded-runtime-default] ${file}:${line}\nHardcoded runtime fallback/default detected (${expression}). Prefer declarative config or boundary-owned defaults over inline literals.`
  },
  {
    name: "css-js-default-duplication",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runCssJsDefaultDuplicationRule,
    message: ({ file, line, expression }) => `[css-js-default-duplication] ${file}:${line}\nJS duplicates CSS/theme defaults (${expression}). Keep theme/token defaults in the CSS or theme boundary layer only.`
  },
  {
    name: "premature-legacy-support",
    severity: "warn",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "plugin.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runPrematureLegacySupportRule,
    message: ({ file, line, expression }) => `[premature-legacy-support] ${file}:${line}\nPremature legacy/compatibility support detected (${expression}). Remove speculative fallback/compat paths unless an active boundary contract requires them.`
  },
  {
    name: "editable-threshold-missing-internal",
    severity: "warn",
    scope: {
      include: ["config/clusters/*.js", "config/shared/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runEditableThresholdInternalRule,
    message: ({ file, line, keyName }) => `[editable-threshold-missing-internal] ${file}:${line}\nEditable parameter '${keyName}' looks like an internal ratio/threshold layout knob but is missing 'internal: true'. Mark runtime-only threshold specs internal so defaults still apply without exposing them in the host editor.`
  },
  {
    name: "formatter-availability-heuristic",
    scope: {
      include: ["widgets/**/*.js", "cluster/**/*.js", "shared/**/*.js", "runtime/**/*.js", "config/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runFormatterAvailabilityHeuristicRule,
    message: ({ file, line }) => `[formatter-availability-heuristic] ${file}:${line}\nFormatter-availability inferred from output equality to String(raw).\nDo not treat formatted output equal to raw text as formatter failure.`
  },
  {
    name: "renderer-numeric-coercion-without-boundary-contract",
    scope: {
      include: ["widgets/**/*.js"],
      exclude: ["tests/**", "tools/**"]
    },
    run: runRendererNumericCoercionRule,
    message: ({ file, line, propName }) => `[renderer-numeric-coercion-without-boundary-contract] ${file}:${line}\nRenderer coerces mapper-owned prop '${propName}' via Number(props.${propName}).\nNormalize at mapper boundary and pass finite numbers or undefined.`
  },
  {
    name: "responsive-layout-hard-floor",
    severity: "warn",
    scope: {
      include: [
        "shared/widget-kits/text/TextLayoutEngine.js",
        "shared/widget-kits/text/TextLayoutComposite.js",
        "shared/widget-kits/text/TextTileLayout.js",
        "shared/widget-kits/nav/ActiveRouteLayout.js",
        "shared/widget-kits/nav/CenterDisplayLayout.js",
        "shared/widget-kits/xte/XteHighwayLayout.js",
        "shared/widget-kits/linear/LinearGaugeLayout.js",
        "shared/widget-kits/linear/LinearGaugeTextLayout.js",
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
        "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
        "shared/widget-kits/radial/FullCircleRadialLayout.js",
        "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
        "widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js",
        "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
        "widgets/text/XteDisplayWidget/XteDisplayWidget.js",
        "widgets/linear/WindLinearWidget/WindLinearWidget.js",
        "widgets/radial/WindRadialWidget/WindRadialWidget.js",
        "widgets/radial/CompassRadialWidget/CompassRadialWidget.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runResponsiveLayoutHardFloorRule,
    message: ({ file, line, expression }) => `[responsive-layout-hard-floor] ${file}:${line}\nResponsive layout/text floor detected (${expression}). Use ResponsiveScaleProfile-derived sizing or add a rule-specific suppression for a technical safety guard.`
  },
  {
    name: "responsive-profile-ownership",
    severity: "block",
    scope: {
      include: [
        "shared/widget-kits/text/TextLayoutEngine.js",
        "shared/widget-kits/text/TextLayoutComposite.js",
        "shared/widget-kits/text/TextTileLayout.js",
        "shared/widget-kits/nav/ActiveRouteLayout.js",
        "shared/widget-kits/nav/CenterDisplayLayout.js",
        "shared/widget-kits/xte/XteHighwayLayout.js",
        "shared/widget-kits/linear/LinearGaugeLayout.js",
        "shared/widget-kits/linear/LinearGaugeEngine.js",
        "shared/widget-kits/linear/LinearGaugeTextLayout.js",
        "shared/widget-kits/radial/SemicircleRadialLayout.js",
        "shared/widget-kits/radial/SemicircleRadialEngine.js",
        "shared/widget-kits/radial/SemicircleRadialTextLayout.js",
        "shared/widget-kits/radial/FullCircleRadialLayout.js",
        "shared/widget-kits/radial/FullCircleRadialEngine.js",
        "shared/widget-kits/radial/FullCircleRadialTextLayout.js",
        "widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js",
        "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js",
        "widgets/text/ActiveRouteTextWidget/ActiveRouteTextWidget.js",
        "widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js",
        "widgets/text/XteDisplayWidget/XteDisplayWidget.js"
      ],
      exclude: ["tests/**", "tools/**"]
    },
    run: runResponsiveProfileOwnershipRule,
    message: ({ file, line, detail }) => `[responsive-profile-ownership] ${file}:${line}\n${detail}`
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
    message: ({ file, line, detail }) => `[mapper-logic-leakage] ${file}:${line}\n${detail}\nMappers must stay declarative. Move presentation/business logic to renderer modules or ClusterMapperToolkit.`
  },
  {
    name: "cluster-renderer-cluster-prefix",
    scope: {
      include: ["cluster/rendering/*.js"],
      exclude: ["cluster/rendering/ClusterRendererRouter.js", "tests/**", "tools/**"]
    },
    run: runClusterRendererClusterPrefixRule,
    allowlist: [],
    message: ({ file, line, id, prefix }) => `[cluster-renderer-cluster-prefix] ${file}:${line}\nRenderer id '${id}' starts with cluster prefix '${prefix}'.\nUse role-based renderer names in cluster/rendering/ (for example 'RendererPropsWidget' instead of '${prefix}${id.slice(prefix.length)}').`
  },
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
    message: ({ file, line, propCount, kind }) => `[mapper-output-complexity] ${file}:${line} — Mapper returns ${propCount} properties for kind '${kind}'. If >8 props are needed, consider extracting a dedicated renderer wrapper instead of overloading the target renderer. See the renderer decision rule in the add-new-cluster guide.`
  }
];

export { runRegexRule };
