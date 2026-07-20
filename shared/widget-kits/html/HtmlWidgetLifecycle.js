/**
 * @file HtmlWidgetLifecycle - Shared mount/signature helpers for HTML widget renderers
 * Documentation: documentation/architecture/html-renderer-lifecycle.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniHtmlWidgetLifecycle = factory();
  }
})(this, function () {
  "use strict";

  /** @param {HTMLElement} mountHostEl @returns {DyniHtmlMount} */
  function mountRootDiv(mountHostEl) {
    const mountEl = mountHostEl;
    const rootEl = mountEl.ownerDocument.createElement("div");
    mountEl.appendChild(rootEl);
    return { mountEl: mountEl, rootEl: rootEl };
  }

  /** @param {unknown[]} parts @returns {string} */
  function joinSignatureParts(parts) {
    return parts.join("|");
  }

  /**
   * @param {DyniHtmlMountSpec} [spec]
   * @returns {(mountHostEl: HTMLElement, payload: unknown) => void}
   */
  function createMountHandler(spec) {
    const cfg = /** @type {DyniHtmlMountSpec} */ (spec && typeof spec === "object" ? spec : {});
    return function mount(mountHostEl, payload) {
      const mounted = mountRootDiv(mountHostEl);
      cfg.applyMounted(mounted);
      cfg.patchDom(payload);
    };
  }

  /**
   * @param {DyniHtmlBuildModel} buildModel
   * @returns {(payload: unknown) => string}
   */
  function createResizeSignatureHandler(buildModel) {
    return function layoutSignature(payload) {
      const source = /** @type {{ props?: unknown, shellRect?: unknown }} */ (payload || {});
      const model = buildModel(source.props ? source.props : {}, source.shellRect ? source.shellRect : null);
      return joinSignatureParts(model.resizeSignatureParts);
    };
  }

  /** @returns {DyniHtmlWidgetLifecycleApi} */
  function create() {
    return {
      id: "HtmlWidgetLifecycle",
      mountRootDiv: mountRootDiv,
      joinSignatureParts: joinSignatureParts,
      createMountHandler: createMountHandler,
      createResizeSignatureHandler: createResizeSignatureHandler
    };
  }

  return { id: "HtmlWidgetLifecycle", create: create };
});
