import fs from "node:fs";
import path from "node:path";

import { SENTINEL_BASE } from "./components-registry-loader.mjs";
import { isRuntimePath, normalizeRelativePath } from "./release-path-policy.mjs";

/**
 * @param {string} rootDir
 * @param {Record<string, any>} registry
 * @returns {string[]}
 */
export function collectComponentRegistryResources(rootDir, registry) {
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    throw new Error("component registry validation failed: assembled registry is missing or invalid");
  }

  const resources = new Set();
  const errors = [];

  for (const componentId of Object.keys(registry)) {
    const component = registry[componentId];
    if (!component || typeof component !== "object" || Array.isArray(component)) {
      errors.push(`${componentId}: definition must be an object`);
      continue;
    }
    collectRequiredResource(rootDir, resources, errors, componentId, "js", component.js);
    collectOptionalResource(rootDir, resources, errors, componentId, "css", component.css);
    collectResourceArray(rootDir, resources, errors, componentId, "shadowCss", component.shadowCss);
    collectAssetResources(rootDir, resources, errors, componentId, component.assets);
    validateDependencyList(registry, errors, componentId, component.deps);
  }

  if (errors.length === 0) {
    const cycle = findDependencyCycle(registry);
    if (cycle.length > 0) {
      errors.push(`dependency cycle: ${cycle.join(" -> ")}`);
    }
  }
  if (errors.length > 0) {
    throw new Error(`component registry validation failed:\n- ${errors.join("\n- ")}`);
  }

  return Array.from(resources).sort((a, b) => a.localeCompare(b));
}

/**
 * @param {string} rootDir
 * @param {Set<string>} resources
 * @param {string[]} errors
 * @param {string} componentId
 * @param {string} field
 * @param {unknown} rawValue
 */
function collectRequiredResource(rootDir, resources, errors, componentId, field, rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    errors.push(`${componentId}.${field}: non-empty path is required`);
    return;
  }
  collectResource(rootDir, resources, errors, componentId, field, rawValue);
}

/**
 * @param {string} rootDir
 * @param {Set<string>} resources
 * @param {string[]} errors
 * @param {string} componentId
 * @param {string} field
 * @param {unknown} rawValue
 */
function collectOptionalResource(rootDir, resources, errors, componentId, field, rawValue) {
  if (typeof rawValue === "undefined") {
    return;
  }
  collectRequiredResource(rootDir, resources, errors, componentId, field, rawValue);
}

/**
 * @param {string} rootDir
 * @param {Set<string>} resources
 * @param {string[]} errors
 * @param {string} componentId
 * @param {string} field
 * @param {unknown} rawValue
 */
function collectResourceArray(rootDir, resources, errors, componentId, field, rawValue) {
  if (typeof rawValue === "undefined") {
    return;
  }
  if (!Array.isArray(rawValue)) {
    errors.push(`${componentId}.${field}: expected an array`);
    return;
  }
  rawValue.forEach((value, index) => {
    collectRequiredResource(rootDir, resources, errors, componentId, `${field}[${index}]`, value);
  });
}

/**
 * @param {string} rootDir
 * @param {Set<string>} resources
 * @param {string[]} errors
 * @param {string} componentId
 * @param {unknown} rawAssets
 */
function collectAssetResources(rootDir, resources, errors, componentId, rawAssets) {
  if (typeof rawAssets === "undefined") {
    return;
  }
  if (!Array.isArray(rawAssets)) {
    errors.push(`${componentId}.assets: expected an array`);
    return;
  }
  rawAssets.forEach((asset, index) => {
    const rawPath = asset && typeof asset === "object" ? asset.path : undefined;
    collectRequiredResource(rootDir, resources, errors, componentId, `assets[${index}].path`, rawPath);
  });
}

/**
 * @param {string} rootDir
 * @param {Set<string>} resources
 * @param {string[]} errors
 * @param {string} componentId
 * @param {string} field
 * @param {string} rawValue
 */
function collectResource(rootDir, resources, errors, componentId, field, rawValue) {
  const relPath = normalizeRegistryResourcePath(rawValue);
  if (!relPath || !isRuntimePath(relPath)) {
    errors.push(`${componentId}.${field}: invalid runtime path '${rawValue}'`);
    return;
  }
  const absPath = path.join(rootDir, relPath);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    errors.push(`${componentId}.${field}: resource is missing: ${relPath}`);
    return;
  }
  resources.add(relPath);
}

/** @param {string} rawValue @returns {string} */
function normalizeRegistryResourcePath(rawValue) {
  const stripped = stripSentinelBase(rawValue.trim()).replace(/\\/g, "/");
  if (
    stripped === "" ||
    stripped.startsWith("/") ||
    stripped.startsWith("../") ||
    stripped.includes("/../") ||
    /^[a-z][a-z0-9+.-]*:/i.test(stripped)
  ) {
    return "";
  }
  return normalizeRelativePath(stripped);
}

/** @param {string} rawValue @returns {string} */
function stripSentinelBase(rawValue) {
  if (rawValue.startsWith(SENTINEL_BASE)) {
    return rawValue.slice(SENTINEL_BASE.length);
  }
  return rawValue;
}

/**
 * @param {Record<string, any>} registry
 * @param {string[]} errors
 * @param {string} componentId
 * @param {unknown} rawDeps
 */
function validateDependencyList(registry, errors, componentId, rawDeps) {
  if (typeof rawDeps === "undefined") {
    return;
  }
  if (!Array.isArray(rawDeps)) {
    errors.push(`${componentId}.deps: expected an array`);
    return;
  }
  rawDeps.forEach((depId, index) => {
    if (typeof depId !== "string" || depId.trim() === "") {
      errors.push(`${componentId}.deps[${index}]: expected a non-empty component id`);
    } else if (!Object.prototype.hasOwnProperty.call(registry, depId)) {
      errors.push(`${componentId}.deps[${index}]: unknown component '${depId}'`);
    }
  });
}

/** @param {Record<string, any>} registry @returns {string[]} */
function findDependencyCycle(registry) {
  const visiting = new Set();
  const visited = new Set();

  /** @param {string} componentId @param {string[]} stack @returns {string[]} */
  function visit(componentId, stack) {
    if (visiting.has(componentId)) {
      const cycleStart = stack.indexOf(componentId);
      return stack.slice(cycleStart).concat(componentId);
    }
    if (visited.has(componentId)) {
      return [];
    }

    visiting.add(componentId);
    const deps = registry[componentId].deps || [];
    for (const depId of deps) {
      const cycle = visit(depId, stack.concat(componentId));
      if (cycle.length > 0) {
        return cycle;
      }
    }
    visiting.delete(componentId);
    visited.add(componentId);
    return [];
  }

  for (const componentId of Object.keys(registry)) {
    const cycle = visit(componentId, []);
    if (cycle.length > 0) {
      return cycle;
    }
  }
  return [];
}
