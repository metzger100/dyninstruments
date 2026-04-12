/**
 * Module: PreparedPayloadModelCache - Shared renderer-local cache for reusing prepared payload models across lifecycle stages
 * Documentation: documentation/architecture/html-renderer-lifecycle.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniPreparedPayloadModelCache = factory(); }
}(this, function () {
  "use strict";

  function resolvePayload(payload) {
    return payload && typeof payload === "object" ? payload : {};
  }

  function resolveProps(payload) {
    return payload.props && typeof payload.props === "object" ? payload.props : {};
  }

  function resolveShellRect(payload) {
    return payload.shellRect || null;
  }

  function resolveShellDimension(shellRect, key) {
    if (!shellRect || typeof shellRect !== "object") {
      return null;
    }
    const value = shellRect[key];
    return Number.isFinite(value) ? value : null;
  }

  function resolveRevision(payload) {
    return Number.isFinite(payload.revision) ? payload.revision : null;
  }

  function createPreparedModelCache(options) {
    const opts = options && typeof options === "object" ? options : {};
    const buildModel = typeof opts.buildModel === "function" ? opts.buildModel : null;
    if (!buildModel) {
      throw new Error("PreparedPayloadModelCache: buildModel option is required");
    }

    let preparedPayload = null;

    function clear() {
      preparedPayload = null;
    }

    function getPreparedPayload(payload) {
      const normalizedPayload = resolvePayload(payload);
      const props = resolveProps(normalizedPayload);
      const shellRect = resolveShellRect(normalizedPayload);
      const revision = resolveRevision(normalizedPayload);
      const shellWidth = resolveShellDimension(shellRect, "width");
      const shellHeight = resolveShellDimension(shellRect, "height");

      if (
        preparedPayload
        && preparedPayload.revision === revision
        && preparedPayload.props === props
        && preparedPayload.shellWidth === shellWidth
        && preparedPayload.shellHeight === shellHeight
      ) {
        return preparedPayload;
      }

      preparedPayload = {
        revision: revision,
        props: props,
        shellWidth: shellWidth,
        shellHeight: shellHeight,
        model: buildModel(props, shellRect, normalizedPayload)
      };
      return preparedPayload;
    }

    return {
      getPreparedPayload: getPreparedPayload,
      clear: clear
    };
  }

  function create() {
    return {
      createPreparedModelCache: createPreparedModelCache
    };
  }

  return { id: "PreparedPayloadModelCache", create: create };
}));
