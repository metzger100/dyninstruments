/**
 * Module: DyniPlugin Editable Defaults - Builds defaults from editable parameters
 * Documentation: documentation/avnav-api/editable-parameters.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const core = ns.core;

  function defaultsFromEditableParams(editableParams) {
    const out = {};
    if (!editableParams) return out;

    Object.keys(editableParams).forEach(function (k) {
      const spec = editableParams[k];
      if (
        spec &&
        typeof spec === "object" &&
        Object.prototype.hasOwnProperty.call(spec, "default")
      ) {
        out[k] = spec.default;
      }
    });

    return out;
  }

  core.defaultsFromEditableParams = defaultsFromEditableParams;
}(this));
