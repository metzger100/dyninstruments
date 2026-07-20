/**
 * @file DyniPlugin Environment Cluster - Depth, temperature, and pressure config
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown> & { kind?: unknown, value?: unknown, depthKey?: unknown, tempKey?: unknown, depth?: unknown, temp?: unknown, storeKeys?: Record<string, unknown> }} DyniEnvironmentValues */
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
        const kind = (values && values.kind) || source.kind || "depth";

        if (!out.storeKeys) out.storeKeys = {};

        // pressure dynamic key
        if (kind === "pressure") {
          if (typeof out.value === "string" && out.value.trim()) {
            out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
          } else if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        } else {
          if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        }

        if (kind === "depth" || kind === "depthLinear" || kind === "depthRadial") {
          if (hasOwn.call(out, "depthKey")) {
            out.depth = out.depthKey;
          }

          if (typeof out.depthKey === "string" && out.depthKey.trim()) {
            out.storeKeys = { ...out.storeKeys, depth: out.depthKey.trim() };
          } else {
            out.storeKeys = { ...out.storeKeys, depth: DEFAULT_DEPTH_KEY };
          }
        }

        // temperature dynamic key (for selecting different temperature sources)
        if (kind === "temp" || kind === "tempLinear" || kind === "tempRadial") {
          if (hasOwn.call(out, "tempKey")) {
            out.temp = out.tempKey;
          }

          if (typeof out.tempKey === "string" && out.tempKey.trim()) {
            out.storeKeys = { ...out.storeKeys, temp: out.tempKey.trim() };
          } else {
            out.storeKeys = { ...out.storeKeys, temp: "nav.gps.waterTemp" };
          }
        }

        return out;
      }
    }
  });
})(this);
