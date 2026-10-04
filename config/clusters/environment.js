/**
 * @file DyniPlugin Environment Cluster - Depth, temperature, and pressure config
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown> & { kind?: unknown, depthKey?: unknown, tempKey?: unknown, depth?: unknown, temp?: unknown }} DyniEnvironmentValues */
  /** @typedef {DyniPluginSharedConfig & { environmentDefaultDepthKey: string, buildEnvironmentEditableParameters: () => DyniEditableParameters }} DyniEnvironmentSharedConfig */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { config: DyniPluginConfig & { clusters: DyniWidgetDefinition[] } } }} DyniEnvironmentRoot */

  const ns = /** @type {DyniEnvironmentRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const config = ns.config;
  const shared = /** @type {DyniEnvironmentSharedConfig} */ (config.shared);
  const DEFAULT_DEPTH_KEY = shared.environmentDefaultDepthKey;
  const hasOwn = Object.prototype.hasOwnProperty;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Environment_Instruments",
      description: "Depth, temperature, or SignalK pressure",
      caption: "",
      unit: "",
      default: "---",
      cluster: "environment",
      storeKeys: {
        depth: DEFAULT_DEPTH_KEY,
        temp: "nav.gps.waterTemp"
      },
      editableParameters: shared.buildEnvironmentEditableParameters(),
      /** @this {DyniEnvironmentValues} @param {DyniEnvironmentValues | null | undefined} values @returns {DyniEnvironmentValues} */
      updateFunction: function (values) {
        const out = /** @type {DyniEnvironmentValues} */ (values ? { ...values } : {});
        const source = /** @type {DyniEnvironmentValues} */ (this && typeof this === "object" ? this : {});
        const kind = source.kind || "depth";

        if (kind === "depth" || kind === "depthLinear" || kind === "depthRadial") {
          if (hasOwn.call(out, "depthKey")) {
            out.depth = out.depthKey;
          }
        }

        if (kind === "temp" || kind === "tempLinear" || kind === "tempRadial") {
          if (hasOwn.call(out, "tempKey")) {
            out.temp = out.tempKey;
          }
        }

        return out;
      }
    }
  });
})(this);
