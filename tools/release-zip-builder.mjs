import fs from "node:fs";
import path from "node:path";

import { collectComponentRegistryResources } from "./component-registry-validation.mjs";
import { loadBootstrapManifest, loadComponentsRegistry } from "./components-registry-loader.mjs";
import { FIXED_RUNTIME_FILES, isRuntimePath, normalizeRelativePath } from "./release-path-policy.mjs";

export { isRuntimePath };

/** @param {string} rootDir @returns {string[]} */
export function buildReleaseManifest(rootDir) {
  /** @type {Set<string>} */
  const files = new Set();
  const bootstrapManifest = loadBootstrapManifest(rootDir) || [];
  const registry = loadComponentsRegistry(rootDir) || {};
  const registryResources = collectComponentRegistryResources(rootDir, registry);

  for (const relPath of bootstrapManifest) {
    addIfPresent(files, relPath);
  }

  for (const relPath of registryResources) {
    files.add(relPath);
  }

  for (const relPath of FIXED_RUNTIME_FILES) {
    files.add(relPath);
  }

  for (const fontPath of collectFontAssetPaths(rootDir)) {
    files.add(fontPath);
  }
  for (const layoutPath of collectLayoutAssetPaths(rootDir)) {
    files.add(layoutPath);
  }

  return Array.from(files).sort((a, b) => a.localeCompare(b));
}

/** @param {string} rootDir @returns {string} */
export function buildBootstrapBundleContent(rootDir) {
  const bootstrapManifest = loadBootstrapManifest(rootDir);

  if (!Array.isArray(bootstrapManifest) || bootstrapManifest.length === 0) {
    throw new Error("bootstrap bundle generation aborted: bootstrap manifest is missing or empty");
  }

  const scripts = bootstrapManifest.map((relPath) => {
    const absPath = path.join(rootDir, relPath);
    try {
      return fs.readFileSync(absPath, "utf8");
    } catch {
      throw new Error(`bootstrap bundle generation aborted: failed to read ${relPath}`);
    }
  });

  return "// bootstrap-bundle.js — generated at release time, do not edit\n" + scripts.join("\n");
}

/**
 * @param {string} rootDir
 * @param {string[]} files
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateManifest(rootDir, files) {
  const missing = [];

  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      missing.push(relPath);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * @param {string} stageRoot
 * @param {string[]} expectedPaths
 */
export function assertStagingTree(stageRoot, expectedPaths) {
  const expected = Array.from(new Set(expectedPaths)).sort((a, b) => a.localeCompare(b));
  const actual = collectAssetPaths(stageRoot, stageRoot).sort((a, b) => a.localeCompare(b));
  const missing = subtractPaths(expected, actual);
  const unexpected = subtractPaths(actual, expected);

  if (missing.length === 0 && unexpected.length === 0) {
    return;
  }

  const details = [];
  if (missing.length > 0) {
    details.push(`missing staged files: ${missing.join(", ")}`);
  }
  if (unexpected.length > 0) {
    details.push(`unexpected staged files: ${unexpected.join(", ")}`);
  }
  throw new Error(`release staging validation failed:\n- ${details.join("\n- ")}`);
}

/** @param {string[]} left @param {string[]} right @returns {string[]} */
function subtractPaths(left, right) {
  const rightSet = new Set(right);
  return left.filter((relPath) => !rightSet.has(relPath));
}

/**
 * @param {Set<string>} files
 * @param {any} rawPath
 */
function addIfPresent(files, rawPath) {
  if (typeof rawPath !== "string") return;
  const normalized = normalizeRelativePath(rawPath);
  if (normalized !== "") {
    files.add(normalized);
  }
}

/** @param {string} rootDir @returns {string[]} */
function collectFontAssetPaths(rootDir) {
  const fontsDir = path.join(rootDir, "assets", "fonts");
  return collectAssetPaths(rootDir, fontsDir);
}

/** @param {string} rootDir @returns {string[]} */
function collectLayoutAssetPaths(rootDir) {
  const layoutsDir = path.join(rootDir, "layouts");
  return collectAssetPaths(rootDir, layoutsDir);
}

/**
 * @param {string} rootDir
 * @param {string} absDirPath
 * @returns {string[]}
 */
function collectAssetPaths(rootDir, absDirPath) {
  if (!fs.existsSync(absDirPath)) {
    return [];
  }

  /** @type {string[]} */
  const out = [];
  walkFiles(absDirPath, (absFile) => {
    const relPath = path.relative(rootDir, absFile).replace(/\\/g, "/");
    out.push(relPath);
  });
  return out;
}

/**
 * @param {string} currentPath
 * @param {(absFile: string) => void} visitor
 */
function walkFiles(currentPath, visitor) {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    visitor(currentPath);
    return;
  }

  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    walkFiles(path.join(currentPath, entry.name), visitor);
  }
}
