/**
 * Module: DyniPlugin Helpers - Shared helper functions for modules
 * Documentation: documentation/shared/helpers.md
 * Depends: avnav.api.formatter, window.DyniComponents
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;
  const layoutByCanvas = new WeakMap();

  function applyFormatter(raw, props) {
    const p = props || {};
    if (raw == null || Number.isNaN(raw)) {
      if (hasOwn.call(p, "default")) {
        return p.default;
      }
      // dyni-lint-disable-next-line hardcoded-runtime-default -- Helpers.applyFormatter is the documented runtime owner of the generic missing-value placeholder.
      return "---";
    }

    const fpRaw = p.formatterParameters;
    const fp = Array.isArray(fpRaw) ? fpRaw
      : (typeof fpRaw === "string" ? fpRaw.split(",") : []);
    try {
      if (typeof p.formatter === "function") {
        return p.formatter.apply(null, [raw].concat(fp));
      }
      if (
        typeof p.formatter === "string" &&
        root.avnav &&
        root.avnav.api &&
        root.avnav.api.formatter &&
        typeof root.avnav.api.formatter[p.formatter] === "function"
      ) {
        return root.avnav.api.formatter[p.formatter].apply(root.avnav.api.formatter, [raw].concat(fp));
      }
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Formatter dispatch is an external AvNav/custom boundary; documented fallback behavior must remain centralized here.
    catch (e) { /* intentional: formatter failures fall back to default/raw formatting */ }

    return String(raw);
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = root.devicePixelRatio || 1;

    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const cachedLayout = layoutByCanvas.get(canvas);
    const layout = cachedLayout &&
      cachedLayout.clientWidth === clientWidth &&
      cachedLayout.clientHeight === clientHeight
      ? cachedLayout
      : (function () {
        const rect = canvas.getBoundingClientRect();
        const nextLayout = {
          clientWidth: clientWidth,
          clientHeight: clientHeight,
          cssWidth: rect.width,
          cssHeight: rect.height
        };
        layoutByCanvas.set(canvas, nextLayout);
        return nextLayout;
      }());

    const w = Math.max(1, Math.round(layout.cssWidth * dpr));
    const h = Math.max(1, Math.round(layout.cssHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx: ctx,
      W: Math.max(1, Math.round(layout.cssWidth)),
      H: Math.max(1, Math.round(layout.cssHeight))
    };
  }

  function resolveTargetNode(target) {
    if (!target) {
      return null;
    }
    if (typeof target.nodeType === "number") {
      return target;
    }
    if (typeof target.composedPath === "function") {
      const path = target.composedPath();
      if (Array.isArray(path) && path.length && typeof path[0].nodeType === "number") {
        return path[0];
      }
    }
    if (target.target && typeof target.target.nodeType === "number") {
      return target.target;
    }
    return null;
  }

  function resolveParentInComposedTree(node) {
    if (!node) {
      return null;
    }
    if (node.nodeType === 11 && node.host) { // ShadowRoot
      return node.host;
    }
    if (node.parentNode) {
      return node.parentNode;
    }
    if (node.host) {
      return node.host;
    }
    return null;
  }

  function requirePluginRoot(target) {
    let node = resolveTargetNode(target);
    while (node) {
      if (node.nodeType === 1 && typeof node.closest === "function") {
        const rootEl = node.closest(".widget.dyniplugin");
        if (rootEl) {
          return rootEl;
        }
      }
      node = resolveParentInComposedTree(node);
    }
    throw new Error("dyninstruments: Helpers.requirePluginRoot() requires a committed .widget.dyniplugin root");
  }

  function getNightModeState(rootEl) {
    return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
  }

  function getHostActions() {
    return ns.state.hostActionBridge.getHostActions();
  }

  function createHelpers(getModule) {
    return {
      applyFormatter: applyFormatter,
      setupCanvas: setupCanvas,
      requirePluginRoot: requirePluginRoot,
      getNightModeState: getNightModeState,
      getHostActions: getHostActions,
      getModule: getModule
    };
  }

  runtime.applyFormatter = applyFormatter;
  runtime.setupCanvas = setupCanvas;
  runtime.requirePluginRoot = requirePluginRoot;
  runtime.getNightModeState = getNightModeState;
  runtime.getHostActions = getHostActions;
  runtime.createHelpers = createHelpers;
}(this));
