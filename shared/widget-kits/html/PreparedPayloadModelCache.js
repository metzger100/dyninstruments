/**
 * @file PreparedPayloadModelCache - Shared renderer-local cache for reusing prepared payload models across lifecycle stages
 * Documentation: documentation/architecture/html-renderer-lifecycle.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniPreparedPayloadModelCache = factory();
  }
}(this, function () {
  "use strict";

  /** @param {unknown} payload @returns {DyniPreparedPayloadInput} */
  function resolvePayload(payload) {
    return /** @type {DyniPreparedPayloadInput} */ (
      payload && typeof payload === "object" ? payload : {}
    );
  }

  /** @param {DyniPreparedPayloadInput} payload @returns {unknown} */
  function resolveProps(payload) {
    return payload.props && typeof payload.props === "object" ? payload.props : {};
  }

  /** @param {DyniPreparedPayloadInput} payload @returns {unknown} */
  function extractPayloadShellRect(payload) {
    return payload.shellRect || null;
  }

  /** @param {unknown} shellRect @param {string} key @returns {number | null} */
  function resolveShellDimension(shellRect, key) {
    if (!shellRect || typeof shellRect !== "object") {
      return null;
    }
    const value = /** @type {Record<string, unknown>} */ (shellRect)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  /** @param {DyniPreparedPayloadInput} payload @returns {number | null} */
  function resolveRevision(payload) {
    return typeof payload.revision === "number" && Number.isFinite(payload.revision)
      ? payload.revision
      : null;
  }

  /**
   * @param {DyniPreparedModelCacheOptions} [options]
   * @returns {DyniPreparedModelCache}
   */
  function createPreparedModelCache(options) {
    const opts = /** @type {DyniPreparedModelCacheOptions} */ (
      options && typeof options === "object" ? options : {}
    );
    if (typeof opts.buildModel !== "function") {
      throw new Error("PreparedPayloadModelCache: buildModel option is required");
    }
    const buildModel = opts.buildModel;

    /** @type {DyniPreparedPayloadEntry | null} */
    let preparedPayload = null;

    function clear() {
      preparedPayload = null;
    }

    /** @param {unknown} payload @returns {DyniPreparedPayloadEntry} */
    function getPreparedPayload(payload) {
      const normalizedPayload = resolvePayload(payload);
      const props = resolveProps(normalizedPayload);
      const shellRect = extractPayloadShellRect(normalizedPayload);
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

  /** @param {unknown} buildModel @returns {DyniPreparedModelCache} */
  function createPreparedPayloadCache(buildModel) {
    return createPreparedModelCache({ buildModel: buildModel });
  }

  /** @returns {DyniPreparedPayloadModelCacheApi} */
  function create() {
    return {
      createPreparedModelCache: createPreparedModelCache,
      createPreparedPayloadCache: createPreparedPayloadCache
    };
  }

  return { id: "PreparedPayloadModelCache", create: create };
}));
