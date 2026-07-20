/**
 * @file DyniPlugin Editable Defaults - Builds defaults from editable parameters
 * Documentation: documentation/avnav-api/editable-parameters.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);

  /**
   * @param {DyniEditableParameters|null|undefined} editableParams
   * @returns {Record<string, unknown>}
   */
  function defaultsFromEditableParams(editableParams) {
    const out = /** @type {Record<string, unknown>} */ ({});
    if (!editableParams) {
      return out;
    }

    Object.keys(editableParams).forEach(function (k) {
      const spec = editableParams[k];
      if (spec && typeof spec === "object" && Object.prototype.hasOwnProperty.call(spec, "default")) {
        const parameterSpec = /** @type {DyniEditableParameterSpec} */ (spec);
        out[k] = parameterSpec.default;
      }
    });

    return out;
  }

  /**
   * @param {DyniEditableParameters|null|undefined} editableParams
   * @returns {Record<string, unknown>}
   */
  function editableParamsForRegistration(editableParams) {
    const out = /** @type {Record<string, unknown>} */ ({});
    if (!editableParams) {
      return out;
    }

    Object.keys(editableParams).forEach(function (k) {
      const spec = editableParams[k];
      if (spec && typeof spec === "object" && /** @type {DyniEditableParameterSpec} */ (spec).internal === true) {
        return;
      }
      out[k] = spec;
    });

    return out;
  }

  runtime.defaultsFromEditableParams = defaultsFromEditableParams;
  runtime.editableParamsForRegistration = editableParamsForRegistration;
})(this);
