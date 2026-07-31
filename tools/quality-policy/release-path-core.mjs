import fs from "node:fs";
import path from "node:path";

/**
 * Resolve a repository-relative release path and reject absolute, escaping, or symlinked paths.
 * @param {string} root
 * @param {string} rawPath
 * @returns {string}
 */
export function resolveContainedRelativePath(root, rawPath) {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    throw new Error("release path must be a non-empty relative string");
  }
  const normalized = rawPath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`release path escapes repository root: ${rawPath}`);
  }
  const rootAbs = path.resolve(root);
  const candidate = path.resolve(rootAbs, normalized);
  const relative = path.relative(rootAbs, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`release path escapes repository root: ${rawPath}`);
  }
  const realRoot = fs.realpathSync(rootAbs);
  let probe = candidate;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  const realProbe = fs.realpathSync(probe);
  const realRelative = path.relative(realRoot, realProbe);
  if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
    throw new Error(`release path crosses a symlink boundary: ${rawPath}`);
  }
  return normalized;
}
