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
  { name: "coordinate-formatter-no-raw-equality-fallback", run: runCoordinateFormatterRule }
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
  const rel = "shared/theme/ThemeResolver.js";
  if (!exists(rel)) {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "ThemeResolver module is missing."));
    return out;
  }

  let loaded;
  try {
    loaded = loadUmdModule(rel, {});
  } catch (e) {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "Failed to load ThemeResolver: " + e.message));
    return out;
  }

  const mod = loaded.mod;
  const sandbox = loaded.sandbox;
  if (!mod || typeof mod.create !== "function") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "ThemeResolver must export create()."));
    return out;
  }

  let pointer = "#111111";
  sandbox.getComputedStyle = function () {
    return {
      getPropertyValue(name) {
        if (name === "--dyni-pointer") return pointer;
        return "";
      }
    };
  };

  const canvas = {
    ownerDocument: {
      documentElement: { classList: { contains() { return false; } } },
      body: { classList: { contains() { return false; } } }
    }
  };

  const resolver = mod.create({}, {});
  if (!resolver || typeof resolver.resolve !== "function") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "ThemeResolver.create() must return resolve(canvas)."));
    return out;
  }
  if (typeof resolver.invalidateCanvas !== "function" || typeof resolver.invalidateAll !== "function") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "ThemeResolver.create() must return invalidateCanvas() and invalidateAll()."));
    return out;
  }
  if (typeof mod.invalidateCanvas !== "function" || typeof mod.invalidateAll !== "function") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "ThemeResolver module must expose invalidateCanvas() and invalidateAll()."));
    return out;
  }

  const first = resolver.resolve(canvas);
  pointer = "#222222";
  resolver.invalidateCanvas(canvas);
  const second = resolver.resolve(canvas);
  if (!second || !second.colors || second.colors.pointer !== "#222222") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "invalidateCanvas(canvas) must refresh cached tokens for that canvas."));
  }

  pointer = "#333333";
  resolver.invalidateAll();
  const third = resolver.resolve(canvas);
  if (!third || !third.colors || third.colors.pointer !== "#333333") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "invalidateAll() must refresh cached tokens."));
  }

  if (!first || !first.colors || first.colors.pointer !== "#111111") {
    out.push(makeFinding(rel, 1, "theme-cache-invalidation", "resolve(canvas) should return initial pointer token value."));
  }

  const initRel = "runtime/init.js";
  if (!exists(initRel)) {
    out.push(makeFinding(initRel, 1, "theme-cache-invalidation", "runtime/init.js is missing."));
    return out;
  }
  const initText = readFile(initRel);
  if (!/state\.themePresetApi\.apply\([^)]*\);\s*invalidateThemeResolverCache\s*\(/s.test(initText)) {
    out.push(makeFinding(initRel, 1, "theme-cache-invalidation", "runtime/init.js must invoke ThemeResolver cache invalidation after preset application."));
  }

  return out;
}

function runDynamicStorekeyClearsRule() {
  const out = [];
  const ctx = createScriptContext();
  const required = [
    "config/shared/kind-defaults.js",
    "config/shared/editable-param-utils.js",
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
    { rel: "shared/widget-kits/gauge/GaugeTextLayout.js", maxNonEmpty: 290 },
    { rel: "widgets/gauges/WindDialWidget/WindDialWidget.js", maxNonEmpty: 370 }
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
