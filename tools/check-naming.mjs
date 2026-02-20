#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const CONVENTIONS_PATH = "documentation/conventions/coding-standards.md";
const COMPONENTS_CONFIG_REL = "config/components.js";
const CLUSTERS_DIR_REL = "config/clusters";
const COMPONENT_SCAN_DIRS = ["cluster", "shared", "widgets"];
const SENTINEL_BASE = "__CHECK_BASE__/";

const violations = [];
const byType = Object.create(null);

const registry = loadComponentsRegistry();
validateComponentRegistryNaming(registry);

const clusterConfigFiles = collectJsFiles([CLUSTERS_DIR_REL]);
validateClusterWidgetNames(clusterConfigFiles);

const componentFiles = collectJsFiles(COMPONENT_SCAN_DIRS);
validateComponentFiles(componentFiles, registry);

const summary = {
  ok: violations.length === 0,
  checkedComponents: registry.items.length,
  checkedClusterConfigFiles: clusterConfigFiles.length,
  checkedComponentFiles: componentFiles.length,
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

  vm.runInNewContext(source, sandbox, { filename: COMPONENTS_CONFIG_REL });

  const components = sandbox.DyniPlugin && sandbox.DyniPlugin.config
    ? sandbox.DyniPlugin.config.components
    : null;

  if (!components || typeof components !== "object") {
    addViolation(
      "components-config-missing",
      `[naming] ${COMPONENTS_CONFIG_REL}: could not read config.components. Expected: define config.components object. See ${CONVENTIONS_PATH}`
    );
    return { items: [], byJsPath: new Map() };
  }

  const items = [];
  const byJsPath = new Map();

  for (const [componentId, entry] of Object.entries(components)) {
    const globalKey = entry && typeof entry.globalKey === "string" ? entry.globalKey : "";
    const js = entry && typeof entry.js === "string" ? entry.js : "";
    const jsPath = stripSentinelBase(normalizeSlashes(js));
    const item = { componentId, globalKey, jsPath };

    items.push(item);

    if (jsPath) {
      if (!byJsPath.has(jsPath)) {
        byJsPath.set(jsPath, []);
      }
      byJsPath.get(jsPath).push(item);
    }
  }

  return { items, byJsPath };
}

function validateComponentRegistryNaming(registryData) {
  for (const item of registryData.items) {
    const expectedGlobalKey = `Dyni${item.componentId}`;

    if (!item.globalKey.startsWith("Dyni")) {
      addViolation(
        "components-globalkey-prefix",
        `[naming] ${COMPONENTS_CONFIG_REL}: globalKey '${item.globalKey}' does not start with 'Dyni'. Expected: '${expectedGlobalKey}'. See ${CONVENTIONS_PATH}`
      );
    }

    if (item.globalKey !== expectedGlobalKey) {
      addViolation(
        "components-id-globalkey-mismatch",
        `[naming] ${COMPONENTS_CONFIG_REL}: component ID '${item.componentId}' does not match globalKey '${item.globalKey}'. Expected globalKey: '${expectedGlobalKey}'. See ${CONVENTIONS_PATH}`
      );
    }
  }

  for (const [jsPath, items] of registryData.byJsPath.entries()) {
    if (items.length < 2) continue;
    const ids = items.map((item) => `'${item.componentId}'`).join(", ");
    addViolation(
      "components-jspath-duplicate",
      `[naming] ${COMPONENTS_CONFIG_REL}: component IDs ${ids} share the same js path '${jsPath}'. Expected: one component registration per file. See ${CONVENTIONS_PATH}`
    );
  }
}

function validateClusterWidgetNames(clusterFiles) {
  for (const file of clusterFiles) {
    const content = fs.readFileSync(path.join(ROOT, file), "utf8");
    const expectedName = buildExpectedClusterName(file);
    const widgetNameMatch = content.match(
      /def\s*:\s*{[\s\S]*?\bname\s*:\s*(['"])([^"'\\]*(?:\\.[^"'\\]*)*)\1/
    );

    if (!widgetNameMatch) {
      addViolation(
        "cluster-widget-name-missing",
        `[naming] ${file}: widget name is missing. Expected: '${expectedName}'. See ${CONVENTIONS_PATH}`
      );
      continue;
    }

    const widgetName = widgetNameMatch[2];
    if (!/^dyninstruments_.+/.test(widgetName)) {
      addViolation(
        "cluster-widget-name-pattern",
        `[naming] ${file}: widget name '${widgetName}' does not match 'dyninstruments_*'. Expected: '${expectedName}'. See ${CONVENTIONS_PATH}`
      );
    }
  }
}

function validateComponentFiles(componentFiles, registryData) {
  const componentFileSet = new Set(componentFiles);

  for (const file of componentFiles) {
    const registeredItems = registryData.byJsPath.get(file);
    const inferredId = path.basename(file, ".js");
    const inferredGlobalKey = `Dyni${inferredId}`;

    if (!registeredItems || registeredItems.length === 0) {
      addViolation(
        "component-file-unregistered",
        `[naming] ${file}: file is not registered in ${COMPONENTS_CONFIG_REL}. Expected: add component ID '${inferredId}' with globalKey '${inferredGlobalKey}'. See ${CONVENTIONS_PATH}`
      );
      continue;
    }

    if (registeredItems.length > 1) {
      continue;
    }

    const registration = registeredItems[0];
    const content = fs.readFileSync(path.join(ROOT, file), "utf8");

    const umdGlobalKey = extractUmdGlobalKey(content);
    if (!umdGlobalKey) {
      addViolation(
        "component-umd-missing",
        `[naming] ${file}: could not find UMD globalKey assignment target. Expected: '${registration.globalKey}'. See ${CONVENTIONS_PATH}`
      );
    } else if (umdGlobalKey !== registration.globalKey) {
      addViolation(
        "component-umd-globalkey-mismatch",
        `[naming] ${file}: UMD globalKey '${umdGlobalKey}' does not match ${COMPONENTS_CONFIG_REL} globalKey '${registration.globalKey}'. Expected: '${registration.globalKey}'. See ${CONVENTIONS_PATH}`
      );
    }

    const returnedId = extractLastReturnedId(content);
    if (!returnedId) {
      addViolation(
        "component-return-id-missing",
        `[naming] ${file}: could not find returned component id literal. Expected: '${registration.componentId}'. See ${CONVENTIONS_PATH}`
      );
    } else if (returnedId !== registration.componentId) {
      addViolation(
        "component-return-id-mismatch",
        `[naming] ${file}: returned id '${returnedId}' does not match registered component ID '${registration.componentId}'. Expected: '${registration.componentId}'. See ${CONVENTIONS_PATH}`
      );
    }
  }

  for (const item of registryData.items) {
    if (!item.jsPath) {
      addViolation(
        "components-jspath-missing",
        `[naming] ${COMPONENTS_CONFIG_REL}: component ID '${item.componentId}' has no js path. Expected: set js to the component file path. See ${CONVENTIONS_PATH}`
      );
      continue;
    }

    if (!isComponentScanPath(item.jsPath)) {
      continue;
    }

    if (!componentFileSet.has(item.jsPath)) {
      addViolation(
        "component-registered-file-missing",
        `[naming] ${COMPONENTS_CONFIG_REL}: component ID '${item.componentId}' points to missing file '${item.jsPath}'. Expected: existing file at '${item.jsPath}'. See ${CONVENTIONS_PATH}`
      );
    }
  }
}

function extractUmdGlobalKey(content) {
  const match = content.match(
    /\(root\.DyniComponents\s*=\s*root\.DyniComponents\s*\|\|\s*{}\)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*factory\(\)/
  );
  return match ? match[1] : "";
}

function extractLastReturnedId(content) {
  const re = /return\s*{\s*id\s*:\s*(['"])([^"'\\]*(?:\\.[^"'\\]*)*)\1/g;
  let match = null;
  let lastId = "";
  while ((match = re.exec(content))) {
    lastId = match[2];
  }
  return lastId;
}

function buildExpectedClusterName(clusterFile) {
  const name = path.basename(clusterFile, ".js");
  const words = name.split(/[-_]+/).filter(Boolean);
  const pascal = words.map(capitalize).join("");
  return `dyninstruments_${pascal || "Cluster"}`;
}

function capitalize(text) {
  if (!text) return "";
  return text[0].toUpperCase() + text.slice(1);
}

function collectJsFiles(roots) {
  const out = [];
  for (const root of roots) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    walkJs(abs, out);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function walkJs(currentPath, out) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    if (currentPath.endsWith(".js")) {
      out.push(toRelPath(currentPath));
    }
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    walkJs(path.join(currentPath, entry.name), out);
  }
}

function addViolation(type, line) {
  violations.push(line);
  byType[type] = (byType[type] || 0) + 1;
}

function stripSentinelBase(value) {
  if (value.startsWith(SENTINEL_BASE)) {
    return value.slice(SENTINEL_BASE.length);
  }
  return value;
}

function normalizeSlashes(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function isComponentScanPath(relPath) {
  return COMPONENT_SCAN_DIRS.some((prefix) => relPath.startsWith(`${prefix}/`));
}

function toRelPath(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, "/");
}
