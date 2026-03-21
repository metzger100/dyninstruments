import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export const SENTINEL_BASE = "__CHECK_BASE__/";

const REGISTRY_SCRIPT_CHAIN = [
  "runtime/namespace.js",
  "config/components/registry-shared-foundation.js",
  "config/components/registry-shared-engines.js",
  "config/components/registry-widgets.js",
  "config/components/registry-cluster.js",
  "config/components.js"
];

export function loadComponentsRegistry(rootDir) {
  const sandbox = {
    DyniPlugin: {
      baseUrl: SENTINEL_BASE,
      config: {}
    }
  };

  for (const relPath of REGISTRY_SCRIPT_CHAIN) {
    const absPath = path.join(rootDir, relPath);
    const source = fs.readFileSync(absPath, "utf8");
    vm.runInNewContext(source, sandbox, { filename: relPath });
  }

  const components = sandbox.DyniPlugin && sandbox.DyniPlugin.config
    ? sandbox.DyniPlugin.config.components
    : null;

  return components;
}
