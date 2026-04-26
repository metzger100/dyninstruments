#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

let ROOT = process.cwd();

const RULES = [
  { name: "theme-cache-invalidation", run: runThemeCacheInvalidationRule },
  { name: "dynamic-storekey-clears-on-empty", run: runDynamicStorekeyClearsRule },
  { name: "falsy-default-preservation", run: runFalsyDefaultPreservationRule },
  { name: "mapper-output-no-nan", run: runMapperOutputNoNaNRule },
  { name: "text-layout-hotspot-budget", run: runTextLayoutHotspotBudgetRule },
  { name: "coordinate-formatter-no-raw-equality-fallback", run: runCoordinateFormatterRule },
  { name: "placeholder-contract", run: runPlaceholderContractRule },
  { name: "dash-literal-contract", run: runDashLiteralContractRule },
  { name: "state-screen-precedence-contract", run: runStateScreenPrecedenceContractRule }
];

export function runSmellContracts(options = {}) {
  ROOT = path.resolve(options.root || process.cwd());
  const selected = Array.isArray(options.enabledRules) && options.enabledRules.length
    ? new Set(options.enabledRules)
    : null;

  const findings = [];
  const byRule = {};

  for (const rule of RULES) {
    if (selected && !selected.has(rule.name)) continue;
    const ruleFindings = rule.run().sort(compareFindings);
    byRule[rule.name] = ruleFindings.length;
    findings.push(...ruleFindings);
  }

  const summary = {
    ok: findings.length === 0,
    checkedRules: Object.keys(byRule).length,
    failures: findings.length,
    byRule
  };

  if (options.print !== false) {
    if (findings.length) {
      for (const finding of findings) console.error(finding.message);
    } else {
      console.log("Smell contract check passed.");
    }
    console.log("SUMMARY_JSON=" + JSON.stringify(summary));
  }

  return { summary, findings };
}

export function runSmellContractsCli(argv = process.argv.slice(2)) {
  const enabledRules = parseRuleArgs(argv);
  const { findings } = runSmellContracts({
    root: process.cwd(),
    enabledRules,
    print: true
  });
  process.exit(findings.length ? 1 : 0);
}

function runThemeCacheInvalidationRule() {
  const out = [];
  const resolverRel = "shared/theme/ThemeResolver.js";
  const modelRel = "shared/theme/ThemeModel.js";
  if (!exists(resolverRel)) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver module is missing."));
    return out;
  }
  if (!exists(modelRel)) {
    out.push(makeFinding(modelRel, 1, "theme-cache-invalidation", "ThemeModel module is missing."));
    return out;
  }

  let loadedResolver;
  let loadedModel;
  try {
    loadedResolver = loadUmdModule(resolverRel, {});
    loadedModel = loadUmdModule(modelRel, {});
  } catch (e) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "Failed to load theme modules: " + e.message));
    return out;
  }

  const resolverMod = loadedResolver.mod;
  const resolverSandbox = loadedResolver.sandbox;
  const modelMod = loadedModel.mod;

  if (!resolverMod || typeof resolverMod.resolveForRoot !== "function") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must expose resolveForRoot(rootEl)."));
    return out;
  }
  if (typeof resolverMod.configure !== "function") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must expose configure({...})."));
    return out;
  }
  if (typeof resolverMod.create === "function") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must not export create()."));
    return out;
  }
  if (typeof resolverMod.invalidateRoot === "function" || typeof resolverMod.invalidateAll === "function") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must not expose invalidateRoot()/invalidateAll()."));
    return out;
  }
  if (!modelMod || typeof modelMod.normalizePresetName !== "function" || typeof modelMod.getTokenDefinitions !== "function") {
    out.push(makeFinding(modelRel, 1, "theme-cache-invalidation", "ThemeModel direct module API is invalid."));
    return out;
  }

  const inlineValues = Object.create(null);
  const inlineStyleApi = {
    getPropertyValue(name) {
      return Object.prototype.hasOwnProperty.call(inlineValues, name) ? inlineValues[name] : "";
    },
    setProperty(name, value) {
      inlineValues[String(name)] = String(value);
    }
  };
  inlineStyleApi.setProperty("--dyni-pointer", "#111111");

  let computedStyleCalls = 0;
  resolverSandbox.getComputedStyle = function () {
    computedStyleCalls += 1;
    return {
      getPropertyValue(name) {
        return inlineStyleApi.getPropertyValue(name);
      }
    };
  };

  const rootEl = {
    nodeType: 1,
    className: "widget dyniplugin",
    style: inlineStyleApi,
    classList: {
      contains(name) {
        return String(rootEl.className).split(/\s+/).filter(Boolean).includes(name);
      }
    },
    hasAttribute() {
      return false;
    },
    getAttribute() {
      return null;
    },
    closest() {
      return null;
    }
  };

  resolverMod.configure({
    ThemeModel: modelMod,
    getNightModeState() {
      return false;
    }
  });

  const first = resolverMod.resolveForRoot(rootEl);
  const second = resolverMod.resolveForRoot(rootEl);
  if (first !== second) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must return the same snapshot object for identical canonical root state."));
  }
  if (!first || !first.colors || first.colors.pointer !== "#111111") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "resolveForRoot(rootEl) should return initial pointer token value."));
  }
  if (!Object.isFrozen(first) || !Object.isFrozen(first.colors)) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver cached snapshots must be immutable."));
  }
  if (computedStyleCalls !== 1) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "Identical snapshot cache hits must not reread getComputedStyle(rootEl)."));
  }

  const outputFirst = resolverMod.resolveOutputsForRoot(rootEl);
  const outputSecond = resolverMod.resolveOutputsForRoot(rootEl);
  if (outputFirst !== outputSecond) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "resolveOutputsForRoot(rootEl) must reuse cached snapshots for identical canonical root state."));
  }
  if (!Object.isFrozen(outputFirst)) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "Output snapshot cache entries must be immutable."));
  }

  rootEl.style.setProperty("--dyni-pointer", "#222222");
  const changed = resolverMod.resolveForRoot(rootEl);
  if (changed === second) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "Inline ThemeModel input var changes must invalidate ThemeResolver snapshot cache."));
  }
  if (!changed || !changed.colors || changed.colors.pointer !== "#222222") {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "ThemeResolver must resolve updated canonical input values after cache invalidation."));
  }

  rootEl.style.setProperty("--dyni-theme-surface-fg", "#00ff00");
  const outputVarChanged = resolverMod.resolveForRoot(rootEl);
  if (outputVarChanged !== changed) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "Resolver-owned --dyni-theme-* outputs must be excluded from snapshot identity."));
  }

  resolverMod.configure({
    ThemeModel: modelMod,
    getNightModeState() {
      return false;
    }
  });
  const afterConfigure = resolverMod.resolveForRoot(rootEl);
  if (afterConfigure === changed) {
    out.push(makeFinding(resolverRel, 1, "theme-cache-invalidation", "configure(...) must clear ThemeResolver metadata and root snapshot caches."));
  }

  const initRel = "runtime/init.js";
  if (!exists(initRel)) {
    out.push(makeFinding(initRel, 1, "theme-cache-invalidation", "runtime/init.js is missing."));
    return out;
  }
  const initText = readFile(initRel);
  if (/invalidateThemeResolverCache/.test(initText) || /themeResolverModule/.test(initText)) {
    out.push(makeFinding(initRel, 1, "theme-cache-invalidation", "runtime/init.js must not keep ThemeResolver cache invalidation wiring."));
  }

  return out;
}

function runDynamicStorekeyClearsRule() {
  const out = [];
  const ctx = createScriptContext();
  const required = [
    "config/shared/kind-defaults.js",
    "config/shared/editable-param-utils.js",
    "shared/unit-format-families.js",
    "config/shared/unit-editable-utils.js",
    "config/shared/environment-base-editables.js",
    "config/shared/environment-depth-editables.js",
    "config/shared/environment-temperature-editables.js",
    "config/shared/environment-editables.js",
    "config/clusters/environment.js",
    "config/clusters/vessel.js"
  ];

  for (const rel of required) {
    if (!exists(rel)) {
      out.push(makeFinding(rel, 1, "dynamic-storekey-clears-on-empty", "Missing required config file."));
      return out;
    }
  }

  try {
    runIife("config/shared/kind-defaults.js", ctx);
    runIife("config/shared/editable-param-utils.js", ctx);
    runIife("shared/unit-format-families.js", ctx);
    runIife("config/shared/unit-editable-utils.js", ctx);
    runIife("config/shared/environment-base-editables.js", ctx);
    runIife("config/shared/environment-depth-editables.js", ctx);
    runIife("config/shared/environment-temperature-editables.js", ctx);
    runIife("config/shared/environment-editables.js", ctx);
    runIife("config/clusters/environment.js", ctx);
    runIife("config/clusters/vessel.js", ctx);
  } catch (e) {
    out.push(makeFinding("config/clusters", 1, "dynamic-storekey-clears-on-empty", "Failed to execute cluster config scripts: " + e.message));
    return out;
  }

  const clusters = ((ctx.DyniPlugin || {}).config || {}).clusters || [];
  const envDef = clusters.find((entry) => entry && entry.def && entry.def.cluster === "environment");
  const vesselDef = clusters.find((entry) => entry && entry.def && entry.def.cluster === "vessel");

  if (!envDef || !envDef.def || typeof envDef.def.updateFunction !== "function") {
    out.push(makeFinding("config/clusters/environment.js", 1, "dynamic-storekey-clears-on-empty", "Environment cluster updateFunction is missing."));
    return out;
  }
  if (!vesselDef || !vesselDef.def || typeof vesselDef.def.updateFunction !== "function") {
    out.push(makeFinding("config/clusters/vessel.js", 1, "dynamic-storekey-clears-on-empty", "Vessel cluster updateFunction is missing."));
    return out;
  }

  const envOut = envDef.def.updateFunction({ kind: "pressure", value: "", storeKeys: { value: "old.path" } });
  if (envOut && envOut.storeKeys && Object.prototype.hasOwnProperty.call(envOut.storeKeys, "value")) {
    out.push(makeFinding("config/clusters/environment.js", 1, "dynamic-storekey-clears-on-empty", "Environment pressure key clearing must remove stale storeKeys.value when value is empty."));
  }

  const vesselOut = vesselDef.def.updateFunction({ kind: "voltageRadial", value: "  ", storeKeys: { value: "old.path" } });
  if (vesselOut && vesselOut.storeKeys && Object.prototype.hasOwnProperty.call(vesselOut.storeKeys, "value")) {
    out.push(makeFinding("config/clusters/vessel.js", 1, "dynamic-storekey-clears-on-empty", "Vessel voltage key clearing must remove stale storeKeys.value when value is empty."));
  }

  return out;
}

function runFalsyDefaultPreservationRule() {
  const out = [];

  if (!exists("runtime/helpers.js")) {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "Missing runtime/helpers.js"));
    return out;
  }
  if (!exists("runtime/widget-registrar.js")) {
    out.push(makeFinding("runtime/widget-registrar.js", 1, "falsy-default-preservation", "Missing runtime/widget-registrar.js"));
    return out;
  }

  const helpersCtx = createScriptContext({
    avnav: { api: { formatter: {} } }
  });
  try {
    runIife("runtime/helpers.js", helpersCtx);
  } catch (e) {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "Failed to execute runtime/helpers.js: " + e.message));
    return out;
  }

  const applyFormatter = ((helpersCtx.DyniPlugin || {}).runtime || {}).applyFormatter;
  if (typeof applyFormatter !== "function") {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "Helpers.applyFormatter is missing."));
    return out;
  }

  const emptyDefault = applyFormatter(null, { default: "" });
  if (emptyDefault !== "") {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "applyFormatter(null, {default: \"\"}) must return \"\"."));
  }

  const zeroDefault = applyFormatter(null, { default: 0 });
  if (zeroDefault !== 0) {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "applyFormatter(null, {default: 0}) must return 0."));
  }

  const falseDefault = applyFormatter(null, { default: false });
  if (falseDefault !== false) {
    out.push(makeFinding("runtime/helpers.js", 1, "falsy-default-preservation", "applyFormatter(null, {default: false}) must return false."));
  }

  const calls = [];
  const registrarCtx = createScriptContext({
    avnav: {
      api: {
        registerWidget(def) {
          calls.push(def);
        }
      }
    },
    DyniPlugin: {
      runtime: {
        applyThemePresetToContainer() {},
        defaultsFromEditableParams() {
          return {};
        }
      },
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });

  try {
    runIife("runtime/widget-registrar.js", registrarCtx);
  } catch (e) {
    out.push(makeFinding("runtime/widget-registrar.js", 1, "falsy-default-preservation", "Failed to execute runtime/widget-registrar.js: " + e.message));
    return out;
  }

  const register = ((registrarCtx.DyniPlugin || {}).runtime || {}).registerWidget;
  if (typeof register !== "function") {
    out.push(makeFinding("runtime/widget-registrar.js", 1, "falsy-default-preservation", "runtime.registerWidget is missing."));
    return out;
  }

  const component = { create() { return {}; } };
  register(component, { def: { name: "x", default: 0, editableParameters: {} } }, {});
  register(component, { def: { name: "y", default: "", editableParameters: {} } }, {});
  register(component, { def: { name: "z", default: false, editableParameters: {} } }, {});

  if (!calls.length) {
    out.push(makeFinding("runtime/widget-registrar.js", 1, "falsy-default-preservation", "registerWidget did not register any widget."));
    return out;
  }

  if (calls[0].default !== 0 || calls[1].default !== "" || calls[2].default !== false) {
    out.push(makeFinding("runtime/widget-registrar.js", 1, "falsy-default-preservation", "runtime/widget-registrar.js must preserve explicit falsy defaults."));
  }

  return out;
}

function runMapperOutputNoNaNRule() {
  const out = [];
  const modules = [
    { rel: "cluster/mappers/SpeedMapper.js", kind: "sogRadial", props: { kind: "sogRadial", sog: 5 } },
    { rel: "cluster/mappers/EnvironmentMapper.js", kind: "depthRadial", props: { kind: "depthRadial", depth: 12 } },
    { rel: "cluster/mappers/EnvironmentMapper.js", kind: "tempRadial", props: { kind: "tempRadial", temp: 18 } },
    { rel: "cluster/mappers/VesselMapper.js", kind: "voltageRadial", props: { kind: "voltageRadial", value: 12.7 } },
    { rel: "cluster/mappers/WindMapper.js", kind: "angleTrueRadial", props: { kind: "angleTrueRadial", twa: 25, tws: 7 } },
    { rel: "cluster/mappers/CourseHeadingMapper.js", kind: "hdtRadial", props: { kind: "hdtRadial", hdt: 312 } }
  ];

  const toolkit = {
    cap(name) { return "cap:" + name; },
    unit(name) { return "unit:" + name; },
    formatUnit(metricKey, familyId, fallbackToken) {
      return fallbackToken;
    },
    unitText(metricKey, familyId, selectedUnitToken) {
      return "unit:" + metricKey + ":" + String(selectedUnitToken || "");
    },
    unitNumber() {
      return undefined;
    },
    out(v, cap, unit, formatter, formatterParameters) {
      const o = {};
      if (typeof v !== "undefined") o.value = v;
      if (typeof cap !== "undefined") o.caption = cap;
      if (typeof unit !== "undefined") o.unit = unit;
      if (typeof formatter !== "undefined") o.formatter = formatter;
      if (Array.isArray(formatterParameters)) o.formatterParameters = formatterParameters;
      return o;
    },
    num(value) {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    },
    makeAngleFormatter() {
      return function (raw) {
        return String(raw);
      };
    }
  };

  for (const item of modules) {
    if (!exists(item.rel)) {
      out.push(makeFinding(item.rel, 1, "mapper-output-no-nan", "Missing mapper module."));
      continue;
    }

    let mod;
    try {
      mod = loadUmdModule(item.rel, {}).mod;
    } catch (e) {
      out.push(makeFinding(item.rel, 1, "mapper-output-no-nan", "Failed to load mapper module: " + e.message));
      continue;
    }

    if (!mod || typeof mod.create !== "function") {
      out.push(makeFinding(item.rel, 1, "mapper-output-no-nan", "Mapper module must export create()."));
      continue;
    }

    const spec = mod.create();
    if (!spec || typeof spec.translate !== "function") {
      out.push(makeFinding(item.rel, 1, "mapper-output-no-nan", "Mapper create() must return translate(props, toolkit)."));
      continue;
    }

    const translated = spec.translate(item.props, toolkit) || {};
    const invalids = [];
    collectInvalidNumbers(translated, "out", invalids);
    if (invalids.length) {
      out.push(makeFinding(item.rel, 1, "mapper-output-no-nan", `Mapper output for kind '${item.kind}' contains non-finite numbers: ${invalids.join(", ")}`));
    }
  }

  return out;
}

function runTextLayoutHotspotBudgetRule() {
  const out = [];
  const limits = [
    { rel: "shared/widget-kits/radial/RadialTextLayout.js", maxNonEmpty: 290 },
    { rel: "widgets/radial/WindRadialWidget/WindRadialWidget.js", maxNonEmpty: 370 }
  ];

  for (const item of limits) {
    if (!exists(item.rel)) {
      out.push(makeFinding(item.rel, 1, "text-layout-hotspot-budget", "Missing hotspot file."));
      continue;
    }
    const text = readFile(item.rel);
    const count = countNonEmptyLines(text);
    if (count > item.maxNonEmpty) {
      out.push(makeFinding(item.rel, 1, "text-layout-hotspot-budget", `Hotspot file has ${count} non-empty lines (> ${item.maxNonEmpty}). Split before further growth.`));
    }
  }

  return out;
}

function runCoordinateFormatterRule() {
  const out = [];
  const rel = "widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js";
  if (!exists(rel)) {
    out.push(makeFinding(rel, 1, "coordinate-formatter-no-raw-equality-fallback", "PositionCoordinateWidget is missing."));
    return out;
  }
  const text = readFile(rel);
  const re = /\.trim\(\)\s*===\s*String\(\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\)/;
  if (re.test(text)) {
    out.push(makeFinding(rel, 1, "coordinate-formatter-no-raw-equality-fallback", "Do not use output-equality heuristic (out.trim() === String(raw)) to infer formatter availability."));
  }
  return out;
}

function runPlaceholderContractRule() {
  const out = [];
  const files = collectSourceFiles(["cluster", "shared/widget-kits", "widgets"]);

  for (const rel of files) {
    if (rel === "shared/widget-kits/format/PlaceholderNormalize.js") continue;
    if (rel === "shared/widget-kits/nav/RoutePointsRenderModel.js") continue;

    const text = readFile(rel);
    const applyMatches = findLineMatches(text, /Helpers\.applyFormatter\s*\(/g);
    if (!applyMatches.length) continue;

    const normalizeMatches = findLineMatches(text, /(?:PlaceholderNormalize|placeholderNormalize)\.normalize\s*\(/g);
    for (const applyLine of applyMatches) {
      const close = normalizeMatches.some((line) => Math.abs(line - applyLine) <= 12);
      if (!close) {
        out.push(makeFinding(rel, applyLine, "placeholder-contract", "Every Helpers.applyFormatter call site must stay paired with a nearby PlaceholderNormalize.normalize call."));
      }
    }
  }

  return out;
}

function runDashLiteralContractRule() {
  const out = [];
  const files = collectSourceFiles(["cluster", "shared/widget-kits", "widgets"]);
  const bannedExact = new Set(["NO DATA", "--:--", "--:--:--", "-----"]);

  for (const rel of files) {
    if (rel === "shared/widget-kits/format/PlaceholderNormalize.js") continue;
    if (rel === "shared/widget-kits/nav/RoutePointsRenderModel.js") continue;

    const text = readFile(rel);
    const stringLiterals = findStringLiterals(text);
    for (const lit of stringLiterals) {
      const trimmed = lit.value.trim();
      if (bannedExact.has(trimmed)) {
        out.push(makeFinding(rel, lit.line, "dash-literal-contract", `Forbidden placeholder literal "${trimmed}" found in widget source.`));
        continue;
      }
      if (/^-{2,}$/.test(trimmed)) {
        out.push(makeFinding(rel, lit.line, "dash-literal-contract", `Dash-only string literal "${trimmed}" is forbidden outside PlaceholderNormalize and RoutePointsRenderModel.`));
      }
    }
  }

  return out;
}

function runStateScreenPrecedenceContractRule() {
  const out = [];
  const files = collectSourceFiles(["cluster", "shared/widget-kits", "widgets"]);
  const rankMap = {
    disconnected: 0,
    noRoute: 1,
    noTarget: 2,
    noAis: 3,
    hidden: 4,
    data: 5
  };

  for (const rel of files) {
    if (rel === "shared/widget-kits/state/StateScreenPrecedence.js") continue;
    const text = readFile(rel);
    const callSites = findPickFirstCallSites(text);
    for (const callSite of callSites) {
      if (!callSite.inlineArray) {
        out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "pickFirst() calls must pass an inline array literal so precedence can be validated."));
        continue;
      }

      const kinds = callSite.kinds;
      if (!kinds.length) {
        out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "pickFirst([...]) must include at least one kind entry."));
        continue;
      }

      const dataIndex = kinds.indexOf("data");
      if (dataIndex !== -1) {
        if (dataIndex !== kinds.length - 1) {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "data must be the last state-screen candidate."));
        }
        if (!callSite.dataWhenTrue) {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "data must use when: true."));
        }
      } else {
        out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "pickFirst([...]) must include a data catch-all candidate."));
      }

      const hasHiddenFirst = kinds[0] === "hidden";
      if (hasHiddenFirst) {
        if (kinds[1] !== "disconnected") {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "AIS exception requires hidden to be followed immediately by disconnected."));
          continue;
        }
      }
      else if (kinds[0] !== "disconnected") {
        out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "disconnected must be the first state-screen candidate unless the AIS hidden exception is used."));
        continue;
      }

      let previousRank = -1;
      const allowedKinds = hasHiddenFirst
        ? new Set(["disconnected", "noAis", "data"])
        : null;
      const orderKinds = hasHiddenFirst ? kinds.slice(1) : kinds;
      for (let i = 0; i < orderKinds.length; i += 1) {
        const kind = orderKinds[i];
        if (allowedKinds && !allowedKinds.has(kind)) {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "AIS state-screen order must be hidden > disconnected > noAis > data."));
          previousRank = 999;
          break;
        }
        const rank = rankMap[kind];
        if (typeof rank !== "number") {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "Unknown state-screen kind '" + String(kind) + "'."));
          previousRank = 999;
          break;
        }
        if (rank < previousRank) {
          out.push(makeFinding(rel, callSite.line, "state-screen-precedence-contract", "pickFirst([...]) candidates must follow canonical order disconnected > noRoute > noTarget > noAis > hidden > data."));
          previousRank = 999;
          break;
        }
        previousRank = rank;
      }
    }
  }

  return out;
}

function collectInvalidNumbers(value, prefix, out) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    out.push(prefix + "=" + String(value));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      collectInvalidNumbers(value[i], `${prefix}[${i}]`, out);
    }
    return;
  }
  Object.keys(value).forEach((key) => {
    collectInvalidNumbers(value[key], `${prefix}.${key}`, out);
  });
}

function createScriptContext(extra = {}) {
  const base = {
    console,
    setTimeout,
    clearTimeout,
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    },
    avnav: { api: { formatter: {}, registerWidget() {} } }
  };
  const ctx = deepMerge(base, extra);
  ctx.globalThis = ctx;
  return ctx;
}

function runIife(rel, context) {
  const code = readFile(rel);
  vm.runInNewContext(code, context, { filename: rel });
}

function loadUmdModule(rel, extra = {}) {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    module: { exports: {} },
    exports: {},
    define: undefined,
    ...extra
  };
  sandbox.globalThis = sandbox;
  const code = readFile(rel);
  vm.runInNewContext(code, sandbox, { filename: rel });
  return { mod: sandbox.module.exports, sandbox };
}

function parseRuleArgs(argv) {
  const rules = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--rule") {
      if (!argv[i + 1]) throw new Error("Missing value after --rule");
      rules.push(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--rule=")) {
      rules.push(arg.slice("--rule=".length));
      continue;
    }
    throw new Error("Unknown argument: " + arg);
  }
  return rules;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function countNonEmptyLines(text) {
  let count = 0;
  text.split(/\r?\n/).forEach((line) => {
    if (line.trim()) count += 1;
  });
  return count;
}

function makeFinding(file, line, rule, detail) {
  return {
    file,
    line,
    message: `[${rule}] ${file}:${line}\n${detail}`
  };
}

function compareFindings(a, b) {
  return a.file.localeCompare(b.file) || a.line - b.line;
}

function collectSourceFiles(roots) {
  const out = [];
  for (const relRoot of roots) {
    const abs = path.join(ROOT, relRoot);
    if (!fs.existsSync(abs)) continue;
    walkJsFiles(abs, relRoot.replace(/\\/g, "/"), out);
  }
  return out.sort();
}

function walkJsFiles(absDir, relDir, out) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(absDir, entry.name);
    const rel = relDir ? relDir + "/" + entry.name : entry.name;
    if (entry.isDirectory()) {
      walkJsFiles(abs, rel, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      out.push(rel.replace(/\\/g, "/"));
    }
  }
}

function findLineMatches(text, regex) {
  const matches = [];
  let match;
  while ((match = regex.exec(text))) {
    matches.push(lineFromIndex(text, match.index));
  }
  return matches;
}

function findStringLiterals(text) {
  const out = [];
  const re = /(["'])([^"'\\\n]*(?:\\.[^"'\\\n]*)*)\1/g;
  let match;
  while ((match = re.exec(text))) {
    out.push({
      line: lineFromIndex(text, match.index),
      value: unescapeString(match[2])
    });
  }
  return out;
}

function findPickFirstCallSites(text) {
  const out = [];
  let index = 0;
  while ((index = text.indexOf("pickFirst", index)) !== -1) {
    const line = lineFromIndex(text, index);
    let cursor = index + "pickFirst".length;
    cursor = skipWhitespace(text, cursor);
    if (text[cursor] !== "(") {
      index = cursor;
      continue;
    }
    cursor = skipWhitespace(text, cursor + 1);
    if (text[cursor] !== "[") {
      out.push({ line: line, inlineArray: false, kinds: [], dataWhenTrue: false });
      index = cursor;
      continue;
    }

    const arrayStart = cursor;
    const arrayEnd = findMatchingBracket(text, arrayStart, "[", "]");
    if (arrayEnd === -1) {
      out.push({ line: line, inlineArray: true, kinds: [], dataWhenTrue: false });
      index = cursor + 1;
      continue;
    }

    const callTail = skipWhitespace(text, arrayEnd + 1);
    if (text[callTail] !== ")") {
      out.push({ line: line, inlineArray: true, kinds: [], dataWhenTrue: false });
      index = arrayEnd + 1;
      continue;
    }

    const arrayText = text.slice(arrayStart, arrayEnd + 1);
    const kindMatches = Array.from(arrayText.matchAll(/kind:\s*["']([^"']+)["']/g)).map((m) => m[1]);
    const dataWhenTrue = /kind:\s*["']data["'][\s\S]*?when:\s*true/.test(arrayText);
    out.push({ line: line, inlineArray: true, kinds: kindMatches, dataWhenTrue: dataWhenTrue });
    index = arrayEnd + 1;
  }
  return out;
}

function findMatchingBracket(text, startIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function skipWhitespace(text, index) {
  let i = index;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  return i;
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function unescapeString(value) {
  return value.replace(/\\(['"\\nrtbfv])/g, function (_, ch) {
    switch (ch) {
      case "n": return "\n";
      case "r": return "\r";
      case "t": return "\t";
      case "b": return "\b";
      case "f": return "\f";
      case "v": return "\v";
      case "'": return "'";
      case '"': return '"';
      case "\\": return "\\";
      default: return ch;
    }
  });
}

function deepMerge(base, ext) {
  if (!ext || typeof ext !== "object") return base;
  const out = { ...base };
  for (const key of Object.keys(ext)) {
    const value = ext[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    runSmellContractsCli(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
