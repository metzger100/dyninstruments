/**
 * @file DyniPlugin Cluster Utils - Shared helpers for cluster config authoring
 * Documentation: documentation/guides/add-new-cluster.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = /** @type {DyniPluginConfig} */ (ns.config);
  const shared = /** @type {DyniPluginSharedConfig} */ (config.shared);

  /** @param {unknown} kind @param {string} fallbackKind @returns {DyniEditableCondition} */
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

  /** @param {DyniPerKindTextParameterMap} map @returns {DyniEditableParameters} */
  function makePerKindTextParams(map) {
    const out = /** @type {DyniEditableParameters} */ ({});
    Object.keys(map).forEach(function (k) {
      const d = map[k];
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

  /** @param {unknown} name @param {unknown} value @returns {DyniEditableOption} */
  function opt(name, value) {
    return { name: name, value: value };
  }

  shared.makePerKindTextParams = makePerKindTextParams;
  shared.makeKindCondition = makeKindCondition;
  shared.opt = opt;
}(this));
