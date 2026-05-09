/**
 * Module: DyniPlugin DOM Runtime - Root and mode DOM helpers
 * Documentation: documentation/shared/helpers.md
 * Depends: browser DOM
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

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
    if (node.nodeType === 11 && node.host) {
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
    throw new Error("dyninstruments: runtime.dom.requirePluginRoot() requires a committed .widget.dyniplugin root");
  }

  function getNightModeState(rootEl) {
    return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
  }

  runtime.dom = Object.freeze({
    requirePluginRoot: requirePluginRoot,
    getNightModeState: getNightModeState
  });
}(this));
