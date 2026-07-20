const fs = require("node:fs");
const path = require("node:path");

const { createScriptContext, runIifeScript } = require("./eval-iife");

const BASE_URL = "http://host/plugins/dyninstruments/";
const COMPONENT_SCAN_ROOTS = ["cluster", "shared", "widgets"];
const CLUSTER_CONFIG_ROOT = "config/clusters";
const REGISTRY_SCRIPTS = [
  "runtime/namespace.js",
  "config/components/registry-shared-foundation-format.js",
  "config/components/registry-shared-foundation-geometry.js",
  "config/components/registry-shared-foundation-layout.js",
  "config/components/registry-shared-foundation-state.js",
  "config/components/registry-shared-foundation-xte.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets-nav.js",
  "config/components/registry-widgets-vessel.js",
  "config/components/registry-widgets-gauge.js",
  "config/components/registry-cluster.js",
  "config/components.js"
];
const BOOTSTRAP_ONLY_COMPONENT_SCAN_FILES = new Set(["shared/unit-format-families.js"]);

const UMD_WRAPPER_RE = /^\(function\s*\(\s*root\s*,\s*factory\s*\)\s*\{/;
const DYNI_COMPONENTS_RE = /root\.DyniComponents\s*=\s*root\.DyniComponents\s*\|\|\s*{}/;
const UMD_GLOBAL_RE =
  /\(root\.DyniComponents\s*=\s*root\.DyniComponents\s*\|\|\s*{}\)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*factory\(\)/;
const CREATE_EXPORT_RE = new RegExp(
  ["return\\s*\\{\\s*id\\s*:\\s*[\"'][^\"']+[\"']\\s*,\\s*", "create(?:\\s*:\\s*create)?\\s*,?\\s*\\};?"].join(""),
  "m"
);

/** @returns {Record<string, any>} */
function loadComponents() {
  const context = createScriptContext({
    DyniPlugin: {
      baseUrl: BASE_URL,
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });
  REGISTRY_SCRIPTS.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
  return context.DyniPlugin.config.components;
}

/** @param {string} jsPath @returns {string} */
function readSource(jsPath) {
  return fs.readFileSync(path.join(process.cwd(), jsPath), "utf8");
}

/** @param {string[]} roots @returns {string[]} */
function collectJsFiles(roots) {
  const out = /** @type {string[]} */ ([]);
  roots.forEach(function (root) {
    const abs = path.join(process.cwd(), root);
    if (fs.existsSync(abs)) {
      walkJs(abs, out);
    }
  });
  return out.sort(function (a, b) {
    return a.localeCompare(b);
  });
}

/** @param {string} currentPath @param {string[]} out */
function walkJs(currentPath, out) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    if (currentPath.endsWith(".js")) {
      out.push(toRelPath(currentPath));
    }
    return;
  }

  fs.readdirSync(currentPath, { withFileTypes: true }).forEach(function (entry) {
    walkJs(path.join(currentPath, entry.name), out);
  });
}

/** @param {string} absolutePath @returns {string} */
function toRelPath(absolutePath) {
  return path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");
}

/** @param {any} entry @returns {string} */
function relJsPath(entry) {
  if (!entry || typeof entry.js !== "string") return "";
  if (!entry.js.startsWith(BASE_URL)) return entry.js;
  return entry.js.slice(BASE_URL.length);
}

/** @param {Record<string, any>} components @returns {Set<string>} */
function registeredJsPathSet(components) {
  const registered = new Set();
  Object.keys(components).forEach(function (componentId) {
    registered.add(relJsPath(components[componentId]));
  });
  return registered;
}

/** @param {string} relPath @returns {string} */
function layerOf(relPath) {
  if (relPath.startsWith("widgets/")) return "widgets";
  if (relPath.startsWith("cluster/")) return "cluster";
  if (relPath.startsWith("shared/")) return "shared";
  if (relPath.startsWith("config/")) return "config";
  if (relPath.startsWith("runtime/")) return "runtime";
  return "unknown";
}

/** @param {string} sourceLayer @param {string} targetLayer @returns {boolean} */
function canDependOn(sourceLayer, targetLayer) {
  if (sourceLayer === "widgets") return targetLayer === "shared";
  if (sourceLayer === "cluster") {
    return ["shared", "widgets", "cluster"].indexOf(targetLayer) >= 0;
  }
  if (sourceLayer === "shared") return targetLayer === "shared";
  if (sourceLayer === "config") return false;
  if (sourceLayer === "runtime") {
    return ["widgets", "cluster", "shared"].indexOf(targetLayer) < 0;
  }
  return false;
}

/** @param {any} source @returns {any[]} */
function getDependencies(source) {
  return typeof source.deps === "undefined" ? [] : source.deps;
}

/** @param {Record<string, any>} components @param {string[]} [forbiddenIds] @returns {any[]} */
function dependencyViolations(components, forbiddenIds) {
  const violations = /** @type {any[]} */ ([]);
  let canCheckCycles = true;
  Object.keys(components).forEach(function (componentId) {
    const source = components[componentId];
    const sourceLayer = layerOf(relJsPath(source));
    const deps = getDependencies(source);

    if (sourceLayer === "unknown") {
      violations.push({ type: "unknown-source-layer", componentId });
    }
    if (forbiddenIds && forbiddenIds.indexOf(componentId) >= 0) {
      violations.push({ type: "forbidden-component-id", componentId });
    }
    if (!Array.isArray(deps)) {
      violations.push({ type: "malformed-deps", componentId });
      canCheckCycles = false;
      return;
    }

    deps.forEach(function (depId) {
      if (typeof depId !== "string" || depId.trim().length === 0) {
        violations.push({ type: "malformed-deps-item", componentId });
        canCheckCycles = false;
        return;
      }

      const target = components[depId];
      if (forbiddenIds && forbiddenIds.indexOf(depId) >= 0) {
        violations.push({ type: "forbidden-component-dep", componentId, depId });
      }
      if (!target) {
        violations.push({ type: "missing-dependency", componentId, depId });
        canCheckCycles = false;
        return;
      }

      const targetLayer = layerOf(relJsPath(target));
      if (targetLayer === "unknown") {
        violations.push({ type: "unknown-target-layer", componentId, depId });
        return;
      }
      if (!canDependOn(sourceLayer, targetLayer)) {
        violations.push({ type: "dependency-direction", componentId, depId });
      }
    });
  });

  if (!canCheckCycles) return violations;
  Object.keys(components).forEach(function (componentId) {
    try {
      visitDependency(componentId, components, {}, {});
    } catch (error) {
      violations.push({ type: "dependency-cycle", componentId });
    }
  });
  return violations;
}

/** @param {string} text @param {number} start @returns {number} */
function skipWhitespace(text, start) {
  let index = start;
  while (index < text.length) {
    const c = text.charCodeAt(index);
    const isWhitespace = c === 9 || c === 10 || c === 13 || c === 32;
    if (!isWhitespace) break;
    index += 1;
  }
  return index;
}

/** @param {string} content @returns {number} */
function findUmdWrapperStart(content) {
  let index = content.charCodeAt(0) === 0xfeff ? 1 : 0;
  index = skipWhitespace(content, index);

  if (content.startsWith("/**", index)) {
    const headerEnd = content.indexOf("*/", index + 3);
    if (headerEnd === -1) return -1;
    index = skipWhitespace(content, headerEnd + 2);
  }

  return index;
}

/** @param {string} content @returns {boolean} */
function hasStandardUmdWrapper(content) {
  const wrapperIndex = findUmdWrapperStart(content);
  return wrapperIndex >= 0 && UMD_WRAPPER_RE.test(content.slice(wrapperIndex));
}

/** @param {string} content @returns {boolean} */
function hasDyniComponentsRegistration(content) {
  return DYNI_COMPONENTS_RE.test(content);
}

/** @param {string} content @returns {boolean} */
function hasCreateExport(content) {
  return CREATE_EXPORT_RE.test(content);
}

/** @param {string} content @returns {string} */
function extractUmdGlobalKey(content) {
  const match = content.match(UMD_GLOBAL_RE);
  return match ? match[1] : "";
}

/** @param {string} content @returns {string} */
function extractLastReturnedId(content) {
  const re = /return\s*{\s*id\s*:\s*(['"])([^"'\\]*(?:\\.[^"'\\]*)*)\1/g;
  let match;
  let lastId = "";
  while ((match = re.exec(content))) {
    lastId = match[2];
  }
  return lastId;
}

/** @param {string} clusterFile @returns {string} */
function buildExpectedClusterName(clusterFile) {
  const name = path.basename(clusterFile, ".js");
  const words = name.split(/[-_]+/).filter(Boolean);
  const pascal = words.map(capitalize).join("");
  return "dyni_" + (pascal || "Cluster") + "_Instruments";
}

/** @param {string} text @returns {string} */
function capitalize(text) {
  if (!text) return "";
  return text[0].toUpperCase() + text.slice(1);
}

/** @param {string} content @returns {string} */
function extractClusterWidgetName(content) {
  const match = content.match(/def\s*:\s*{[\s\S]*?\bname\s*:\s*(['"])([^"'\\]*(?:\\.[^"'\\]*)*)\1/);
  return match ? match[2] : "";
}

/** @param {string} jsPath @returns {boolean} */
function isBootstrapOnlyComponentFile(jsPath) {
  return BOOTSTRAP_ONLY_COMPONENT_SCAN_FILES.has(jsPath);
}

/** @param {string} componentId @param {Record<string, any>} components @param {Record<string, boolean>} visiting @param {Record<string, boolean>} visited */
function visitDependency(componentId, components, visiting, visited) {
  if (visited[componentId]) return;
  if (visiting[componentId]) {
    throw new Error("dependency cycle at " + componentId);
  }
  visiting[componentId] = true;
  const deps = getDependencies(components[componentId]);
  deps.forEach(function (depId) {
    visitDependency(depId, components, visiting, visited);
  });
  visiting[componentId] = false;
  visited[componentId] = true;
}

module.exports = {
  CLUSTER_CONFIG_ROOT,
  COMPONENT_SCAN_ROOTS,
  buildExpectedClusterName,
  canDependOn,
  collectJsFiles,
  dependencyViolations,
  extractClusterWidgetName,
  extractLastReturnedId,
  extractUmdGlobalKey,
  getDependencies,
  hasCreateExport,
  hasDyniComponentsRegistration,
  hasStandardUmdWrapper,
  isBootstrapOnlyComponentFile,
  layerOf,
  loadComponents,
  readSource,
  registeredJsPathSet,
  relJsPath,
  visitDependency
};
