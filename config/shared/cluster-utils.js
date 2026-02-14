/**
 * Module: DyniPlugin Cluster Utils - Shared helpers for cluster config authoring
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const config = ns.config || (ns.config = {});
  const shared = config.shared || (config.shared = {});

  function makePerKindTextParams(map) {
    const out = {};
    Object.keys(map).forEach(function (k) {
      const d = map[k] || {};
      out["caption_" + k] = {
        type: "STRING",
        displayName: "Caption",
        default: (typeof d.cap === "string") ? d.cap : "",
        condition: { kind: k }
      };
      out["unit_" + k] = {
        type: "STRING",
        displayName: "Unit",
        default: (typeof d.unit === "string") ? d.unit : "",
        condition: { kind: k }
      };
    });
    return out;
  }

  function opt(name, value) {
    return { name: name, value: value };
  }

  shared.makePerKindTextParams = makePerKindTextParams;
  shared.opt = opt;
}(this));
