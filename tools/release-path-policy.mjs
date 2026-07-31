import { resolveContainedRelativePath } from "./quality-policy/release-path-core.mjs";

export const FIXED_RUNTIME_FILES = [
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

/** @param {string} rawPath @returns {string} */
export function normalizeRelativePath(rawPath) {
  return rawPath.replace(/\\/g, "/").replace(/^\//, "").replace(/^\.\//, "").trim();
}

export { resolveContainedRelativePath };
