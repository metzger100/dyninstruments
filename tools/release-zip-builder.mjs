import fs from "node:fs";
import path from "node:path";

import {
  SENTINEL_BASE,
  loadBootstrapManifest,
  loadComponentsRegistry
} from "./components-registry-loader.mjs";

const FIXED_RUNTIME_FILES = [
  "plugin.js",
  "plugin.css",
  "config/bootstrap-manifest.js"
];

const RUNTIME_PREFIXES = [
  "runtime/",
  "cluster/",
  "config/",
  "shared/",
  "widgets/",
  "assets/"
];

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

export function buildReleaseManifest(rootDir) {
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

  return Array.from(files).sort((a, b) => a.localeCompare(b));
}

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

function collectRegistryField(files, rawValue) {
  if (typeof rawValue !== "string") return;
  const relPath = stripSentinelBase(rawValue);
  addIfPresent(files, relPath);
}

function stripSentinelBase(rawValue) {
  const value = rawValue.trim();
  if (value === "") return "";
  if (value.startsWith(SENTINEL_BASE)) {
    return value.slice(SENTINEL_BASE.length);
  }
  return value;
}

function addIfPresent(files, rawPath) {
  if (typeof rawPath !== "string") return;
  const normalized = normalizeRelativePath(rawPath);
  if (normalized !== "") {
    files.add(normalized);
  }
}

function normalizeRelativePath(rawPath) {
  return rawPath
    .replace(/\\/g, "/")
    .replace(/^\//, "")
    .replace(/^\.\//, "")
    .trim();
}

function collectFontAssetPaths(rootDir) {
  const fontsDir = path.join(rootDir, "assets", "fonts");
  if (!fs.existsSync(fontsDir)) {
    return [];
  }

  const out = [];
  walkFiles(fontsDir, (absFile) => {
    const relPath = path.relative(rootDir, absFile).replace(/\\/g, "/");
    out.push(relPath);
  });
  return out;
}

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
