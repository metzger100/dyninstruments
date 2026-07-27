import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const SENTINEL_BASE = "__CHECK_BASE__/";

const NAMESPACE_SCRIPT = "runtime/namespace.js";
const REGISTRY_ASSEMBLER_SCRIPT = "config/components.js";
const REGISTRY_FRAGMENT_PREFIX = "config/components/registry-";
const BOOTSTRAP_MANIFEST_SCRIPT_CHAIN = ["runtime/namespace.js", "config/bootstrap-manifest.js"];

/**
 * @param {string} rootDir
 * @param {string[]} scriptPaths
 * @param {any} sandbox
 */
function runScriptChain(rootDir, scriptPaths, sandbox) {
  for (const relPath of scriptPaths) {
    const absPath = path.join(rootDir, relPath);
    const source = fs.readFileSync(absPath, "utf8");
    vm.runInNewContext(source, sandbox, { filename: relPath });
  }
}

/**
 * @param {string} rootDir
 * @returns {any}
 */
export function loadBootstrapManifest(rootDir) {
  /** @type {{ DyniPlugin: { baseUrl: string, config: any } }} */
  const sandbox = {
    DyniPlugin: {
      baseUrl: SENTINEL_BASE,
      config: {}
    }
  };

  runScriptChain(rootDir, BOOTSTRAP_MANIFEST_SCRIPT_CHAIN, sandbox);

  return sandbox.DyniPlugin && sandbox.DyniPlugin.config ? sandbox.DyniPlugin.config.bootstrapManifest : null;
}

/** @param {string} relPath @returns {boolean} */
function isRegistryFragmentPath(relPath) {
  return relPath.startsWith(REGISTRY_FRAGMENT_PREFIX) && relPath.endsWith(".js");
}

/** @param {string} rootDir @returns {string[]} */
function collectRegistryFragmentsOnDisk(rootDir) {
  const componentsDir = path.join(rootDir, "config", "components");
  if (!fs.existsSync(componentsDir)) {
    return [];
  }
  return fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith("registry-") && entry.name.endsWith(".js"))
    .map((entry) => `config/components/${entry.name}`)
    .sort((a, b) => a.localeCompare(b));
}

/** @param {string[]} left @param {string[]} right @returns {string[]} */
function subtractPaths(left, right) {
  const rightSet = new Set(right);
  return left.filter((relPath) => !rightSet.has(relPath));
}

/**
 * @param {string} rootDir
 * @param {unknown} rawManifest
 * @returns {string[]}
 */
export function resolveRegistryScriptChain(rootDir, rawManifest) {
  if (!Array.isArray(rawManifest) || rawManifest.length === 0) {
    throw new Error("component registry discovery failed: bootstrap manifest is missing or empty");
  }

  const manifest = rawManifest.map((value) => String(value));
  const fragments = manifest.filter(isRegistryFragmentPath);
  const uniqueFragments = Array.from(new Set(fragments));
  const duplicateFragments = fragments.filter((relPath, index) => fragments.indexOf(relPath) !== index);
  /** @type {number[]} */
  const assemblerIndexes = [];
  manifest.forEach((relPath, index) => {
    if (relPath === REGISTRY_ASSEMBLER_SCRIPT) {
      assemblerIndexes.push(index);
    }
  });
  const diskFragments = collectRegistryFragmentsOnDisk(rootDir);
  const absentFromBootstrap = subtractPaths(diskFragments, uniqueFragments);
  const absentFromDisk = subtractPaths(uniqueFragments, diskFragments);
  const errors = [];

  if (duplicateFragments.length > 0) {
    errors.push(`duplicate registry fragments: ${Array.from(new Set(duplicateFragments)).join(", ")}`);
  }
  if (assemblerIndexes.length !== 1) {
    errors.push(`expected exactly one ${REGISTRY_ASSEMBLER_SCRIPT} entry`);
  }
  if (absentFromBootstrap.length > 0) {
    errors.push(`registry fragments absent from bootstrap manifest: ${absentFromBootstrap.join(", ")}`);
  }
  if (absentFromDisk.length > 0) {
    errors.push(`bootstrap registry fragments absent from disk: ${absentFromDisk.join(", ")}`);
  }
  if (assemblerIndexes.length === 1 && fragments.some((relPath) => manifest.indexOf(relPath) > assemblerIndexes[0])) {
    errors.push(`${REGISTRY_ASSEMBLER_SCRIPT} must load after every registry fragment`);
  }
  if (errors.length > 0) {
    throw new Error(`component registry discovery failed:\n- ${errors.join("\n- ")}`);
  }

  return [NAMESPACE_SCRIPT].concat(fragments, REGISTRY_ASSEMBLER_SCRIPT);
}

/**
 * @param {string} rootDir
 * @returns {any}
 */
export function loadComponentsRegistry(rootDir) {
  /** @type {{ DyniPlugin: { baseUrl: string, config: any } }} */
  const sandbox = {
    DyniPlugin: {
      baseUrl: SENTINEL_BASE,
      config: {}
    }
  };

  const registryScriptChain = resolveRegistryScriptChain(rootDir, loadBootstrapManifest(rootDir));
  runScriptChain(rootDir, registryScriptChain, sandbox);

  const components = sandbox.DyniPlugin && sandbox.DyniPlugin.config ? sandbox.DyniPlugin.config.components : null;

  return components;
}
