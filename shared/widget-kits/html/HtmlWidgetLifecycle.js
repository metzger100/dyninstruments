/**
 * Module: HtmlWidgetLifecycle - Shared mount/signature helpers for HTML widget renderers
 * Documentation: documentation/architecture/html-renderer-lifecycle.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniHtmlWidgetLifecycle = factory();
  }
}(this, function () {
  "use strict";

  function mountRootDiv(mountHostEl) {
    const mountEl = mountHostEl;
    const rootEl = mountEl.ownerDocument.createElement("div");
    mountEl.appendChild(rootEl);
    return { mountEl: mountEl, rootEl: rootEl };
  }

  function joinSignatureParts(parts) {
    return parts.join("|");
  }

  function createMountHandler(spec) {
    const cfg = spec && typeof spec === "object" ? spec : {};
    return function mount(mountHostEl, payload) {
      const mounted = mountRootDiv(mountHostEl);
      cfg.applyMounted(mounted);
      cfg.patchDom(payload);
    };
  }

  function createResizeSignatureHandler(buildModel) {
    return function layoutSignature(payload) {
      const model = buildModel(
        payload && payload.props ? payload.props : {},
        payload && payload.shellRect ? payload.shellRect : null
      );
      return joinSignatureParts(model.resizeSignatureParts);
    };
  }

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
}));
