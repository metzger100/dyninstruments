import fs from "node:fs";
import path from "node:path";

import { SENTINEL_BASE, loadBootstrapManifest, loadComponentsRegistry } from "./components-registry-loader.mjs";

const FIXED_RUNTIME_FILES = [
  "plugin.js",
  "plugin.mjs",
  "plugin.css",
  "plugin.json",
  "config/bootstrap-manifest.js",
  "runtime/plugin-bootstrap-core.js"
];

const RUNTIME_PREFIXES = ["runtime/", "cluster/", "config/", "shared/", "widgets/", "assets/", "layouts/"];

/** @param {string} filePath @returns {boolean} */
export function isRuntimePath(filePath) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    return false;
  }
  const normalized = normalizeRelativePath(filePath);
  if (FIXED_RUNTIME_FILES.includes(normalized)) {
    return true;
  }
  return RUNTIME_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** @param {string} rootDir @returns {string[]} */
export function buildReleaseManifest(rootDir) {
  /** @type {Set<string>} */
  const files = new Set();
  const bootstrapManifest = loadBootstrapManifest(rootDir) || [];
  const registry = loadComponentsRegistry(rootDir) || {};

  for (const relPath of bootstrapManifest) {
    addIfPresent(files, relPath);
  }

  for (const component of Object.values(registry)) {
    collectRegistryField(files, component && component.js);
    collectRegistryField(files, component && component.css);

    const shadowCss = component && component.shadowCss;
    if (Array.isArray(shadowCss)) {
      for (const cssPath of shadowCss) {
        collectRegistryField(files, cssPath);
      }
    }

    const assets = component && component.assets;
    if (Array.isArray(assets)) {
      for (const asset of assets) {
        if (!asset || typeof asset.path !== "string") continue;
        addIfPresent(files, asset.path);
      }
    }
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
 * @param {Set<string>} files
 * @param {any} rawValue
 */
function collectRegistryField(files, rawValue) {
  if (typeof rawValue !== "string") return;
  const relPath = stripSentinelBase(rawValue);
  addIfPresent(files, relPath);
}

/** @param {string} rawValue @returns {string} */
function stripSentinelBase(rawValue) {
  const value = rawValue.trim();
  if (value === "") return "";
  if (value.startsWith(SENTINEL_BASE)) {
    return value.slice(SENTINEL_BASE.length);
  }
  return value;
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

/** @param {string} rawPath @returns {string} */
function normalizeRelativePath(rawPath) {
  return rawPath.replace(/\\/g, "/").replace(/^\//, "").replace(/^\.\//, "").trim();
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
