/**
 * Module: DyniPlugin Environment Cluster - Depth, temperature, and pressure config
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js, config/shared/kind-defaults.js, config/shared/environment-editables.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  config.clusters.push({
    widget: "ClusterWidget",
    def: {
      name: "dyni_Environment_Instruments",
      description: "Depth below transducer, temperature, or SignalK pressure",
      caption: "",
      unit: "",
      default: "---",
      cluster: "environment",
      storeKeys: {
        depth: "nav.gps.depthBelowTransducer",
        temp: "nav.gps.waterTemp"
      },
      editableParameters: shared.buildEnvironmentEditableParameters(),
      updateFunction: function (values) {
        const out = values ? { ...values } : {};
        const kind = (values && values.kind) || "depth";

        if (!out.storeKeys) out.storeKeys = {};

        // pressure dynamic key
        if (kind === "pressure") {
          if (typeof out.value === "string" && out.value.trim()) {
            out.storeKeys = { ...out.storeKeys, value: out.value.trim() };
          }
          else if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        }
        else {
          if (Object.prototype.hasOwnProperty.call(out.storeKeys, "value")) {
            const sk = { ...out.storeKeys };
            delete sk.value;
            out.storeKeys = sk;
          }
        }

        // temperature dynamic key (for selecting different temperature sources)
        if (kind === "temp" || kind === "tempLinear" || kind === "tempRadial") {
          if (typeof out.tempKey === "string" && out.tempKey.trim()) {
            out.storeKeys = { ...out.storeKeys, temp: out.tempKey.trim() };
          }
          else {
            out.storeKeys = { ...out.storeKeys, temp: "nav.gps.waterTemp" };
          }
        }

        return out;
      }
    }
  });
}(this));
