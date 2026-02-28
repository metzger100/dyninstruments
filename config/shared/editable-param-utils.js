/**
 * Module: DyniPlugin Cluster Utils - Shared helpers for cluster config authoring
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  function makeKindCondition(kind, fallbackKind) {
    if (Array.isArray(kind)) {
      return kind.map(function (k) {
        return { kind: k };
      });
    }
    if (typeof kind === "string" && kind.length) {
      return { kind: kind };
    }
    return { kind: fallbackKind };
  }

  function makePerKindTextParams(map) {
    const out = {};
    Object.keys(map).forEach(function (k) {
      const d = map[k] || {};
      const condition = makeKindCondition(d.kind, k);
      out["caption_" + k] = {
        type: "STRING",
        displayName: (typeof d.captionName === "string" && d.captionName.length) ? d.captionName : "Caption",
        default: (typeof d.cap === "string") ? d.cap : "",
        condition: condition
      };
      out["unit_" + k] = {
        type: "STRING",
        displayName: (typeof d.unitName === "string" && d.unitName.length) ? d.unitName : "Unit",
        default: (typeof d.unit === "string") ? d.unit : "",
        condition: condition
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
