#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const COMPONENTS_CONFIG_REL = "config/components.js";
const ARCHITECTURE_PATH = "ARCHITECTURE.md";
const SENTINEL_BASE = "__CHECK_BASE__/";

const violations = [];
const byType = Object.create(null);
let checkedDependencies = 0;

const registry = loadComponentsRegistry();
validateDependencyDirections(registry);

const summary = {
  ok: violations.length === 0,
  checkedComponents: registry.items.length,
  checkedDependencies,
  violations: violations.length,
  byType
};

if (violations.length > 0) {
  for (const line of violations) {
    console.error(line);
  }
  console.error("SUMMARY_JSON=" + JSON.stringify(summary));
  process.exit(1);
}

console.log("SUMMARY_JSON=" + JSON.stringify(summary));

function loadComponentsRegistry() {
  const componentsPath = path.join(ROOT, COMPONENTS_CONFIG_REL);
  const source = fs.readFileSync(componentsPath, "utf8");
  const sandbox = { DyniPlugin: { baseUrl: SENTINEL_BASE, config: {} } };

  try {
    vm.runInNewContext(source, sandbox, { filename: COMPONENTS_CONFIG_REL });
  } catch (error) {
    addViolation(
      "components-config-parse",
      `[dependency] ${COMPONENTS_CONFIG_REL}: failed to evaluate config. ${String(error && error.message ? error.message : error)}`
    );
    return { items: [], byId: new Map() };
  }

  const components = sandbox.DyniPlugin && sandbox.DyniPlugin.config
    ? sandbox.DyniPlugin.config.components
    : null;

  if (!components || typeof components !== "object") {
    addViolation(
      "components-config-missing",
      `[dependency] ${COMPONENTS_CONFIG_REL}: could not read config.components. See ${ARCHITECTURE_PATH} for layer rules.`
    );
    return { items: [], byId: new Map() };
  }

  const items = [];
  const byId = new Map();

  for (const [componentId, entry] of Object.entries(components)) {
    const safeEntry = entry && typeof entry === "object" ? entry : {};
    const js = typeof safeEntry.js === "string" ? safeEntry.js : "";
    const jsPath = stripSentinelBase(normalizeSlashes(js));
    const layer = classifyLayer(jsPath);
    const deps = parseDeps(componentId, safeEntry.deps);

    const item = { componentId, jsPath, layer, deps };
    items.push(item);
    byId.set(componentId, item);
  }

  return { items, byId };
}

function parseDeps(componentId, rawDeps) {
  if (typeof rawDeps === "undefined") return [];

  if (!Array.isArray(rawDeps)) {
    addViolation(
      "malformed-deps",
      `[dependency] ${COMPONENTS_CONFIG_REL}: component '${componentId}' has malformed deps. Expected an array of component ID strings.`
    );
    return [];
  }

  const deps = [];
  for (const dep of rawDeps) {
    if (typeof dep !== "string" || dep.trim().length === 0) {
      addViolation(
        "malformed-deps-item",
        `[dependency] ${COMPONENTS_CONFIG_REL}: component '${componentId}' has invalid dep '${String(dep)}'. Expected component ID string.`
      );
      continue;
    }
    deps.push(dep.trim());
  }

  return deps;
}

function validateDependencyDirections(registryData) {
  for (const source of registryData.items) {
    if (source.layer === "unknown") {
      addViolation(
        "unknown-source-layer",
        `[dependency] ${source.componentId} (unknown) has unsupported js path '${source.jsPath || "<missing>"}'. Components must live under widgets/, cluster/, shared/, config/, or runtime/. See ${ARCHITECTURE_PATH} for layer rules.`
      );
    }

    for (const depId of source.deps) {
      checkedDependencies += 1;

      const target = registryData.byId.get(depId);
      if (!target) {
        addViolation(
          "missing-dependency",
          `[dependency] ${source.componentId} (${formatLayer(source.layer)}) depends on missing component '${depId}' declared in ${COMPONENTS_CONFIG_REL}. See ${ARCHITECTURE_PATH} for layer rules.`
        );
        continue;
      }

      if (target.layer === "unknown") {
        addViolation(
          "unknown-target-layer",
          `[dependency] ${source.componentId} (${formatLayer(source.layer)}) depends on ${target.componentId} (unknown). Unknown dependency layer is not allowed. See ${ARCHITECTURE_PATH} for layer rules.`
        );
        continue;
      }

      if (!isAllowedDependency(source.layer, target.layer)) {
        addViolation("dependency-direction", buildDirectionViolation(source, target));
      }
    }
  }
}

function buildDirectionViolation(source, target) {
  return `[dependency] ${source.componentId} (${formatLayer(source.layer)}) depends on ${target.componentId} (${formatLayer(target.layer)}). ${ruleMessage(source.layer)} See ${ARCHITECTURE_PATH} for layer rules.`;
}

function ruleMessage(sourceLayer) {
  switch (sourceLayer) {
    case "widgets":
      return "Widgets may only depend on shared/ components.";
    case "cluster":
      return "Cluster components may only depend on shared/, widgets/, or cluster/ components.";
    case "shared":
      return "Shared components may only depend on shared/ components.";
    case "config":
      return "Config files must have zero deps (pure data).";
    case "runtime":
      return "Runtime files must have zero deps on widgets/cluster/shared.";
    default:
      return "Unknown source layer is not allowed.";
  }
}

function isAllowedDependency(sourceLayer, targetLayer) {
  switch (sourceLayer) {
    case "widgets":
      return targetLayer === "shared";
    case "cluster":
      return targetLayer === "shared" || targetLayer === "widgets" || targetLayer === "cluster";
    case "shared":
      return targetLayer === "shared";
    case "config":
      return false;
    case "runtime":
      return targetLayer !== "widgets" && targetLayer !== "cluster" && targetLayer !== "shared";
    default:
      return false;
  }
}

function classifyLayer(jsPath) {
  if (jsPath.startsWith("widgets/")) return "widgets";
  if (jsPath.startsWith("cluster/")) return "cluster";
  if (jsPath.startsWith("shared/")) return "shared";
  if (jsPath.startsWith("config/")) return "config";
  if (jsPath.startsWith("runtime/")) return "runtime";
  return "unknown";
}

function formatLayer(layer) {
  switch (layer) {
    case "widgets":
      return "widgets/";
    case "cluster":
      return "cluster/";
    case "shared":
      return "shared/";
    case "config":
      return "config/";
    case "runtime":
      return "runtime/";
    default:
      return "unknown";
  }
}

function normalizeSlashes(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function stripSentinelBase(value) {
  if (value.startsWith(SENTINEL_BASE)) {
    return value.slice(SENTINEL_BASE.length);
  }
  return value;
}

function addViolation(type, line) {
  violations.push(line);
  byType[type] = (byType[type] || 0) + 1;
}
