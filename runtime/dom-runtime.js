/**
 * @file DyniPlugin DOM Runtime - Root and mode DOM helpers
 * Documentation: documentation/shared/helpers.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);

  /** @param {unknown} target @returns {DyniComposedTreeNode | null} */
  function resolveTargetNode(target) {
    const candidate = target && typeof target === "object"
      ? /** @type {DyniComposedTreeTarget} */ (target)
      : null;
    if (!candidate) {
      return null;
    }
    if (typeof candidate.nodeType === "number") {
      return /** @type {DyniComposedTreeNode} */ (candidate);
    }
    if (typeof candidate.composedPath === "function") {
      const path = candidate.composedPath();
      const firstNode = Array.isArray(path) && path.length ? path[0] : null;
      if (firstNode && typeof firstNode.nodeType === "number") {
        return firstNode;
      }
    }
    if (candidate.target && typeof candidate.target.nodeType === "number") {
      return candidate.target;
    }
    return null;
  }

  /** @param {DyniComposedTreeNode | null | undefined} node @returns {DyniComposedTreeNode | null} */
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

  const pluginRootCache = new WeakMap();

  /** @param {unknown} target @returns {Element} */
  function requirePluginRoot(target) {
    var node = resolveTargetNode(target);
    if (!node) {
      throw new Error("dyninstruments: runtime.dom.requirePluginRoot() requires a committed .widget.dyniplugin root");
    }

    var cached = pluginRootCache.get(node);
    if (cached) {
      return cached;
    }

    /** @type {DyniComposedTreeNode | null} */
    var walker = node;
    while (walker) {
      if (walker.nodeType === 1 && typeof walker.closest === "function") {
        var rootEl = walker.closest(".widget.dyniplugin");
        if (rootEl) {
          pluginRootCache.set(node, rootEl);
          return rootEl;
        }
      }
      walker = resolveParentInComposedTree(walker);
    }
    throw new Error("dyninstruments: runtime.dom.requirePluginRoot() requires a committed .widget.dyniplugin root");
  }

  /** @param {Element | null | undefined} rootEl @returns {boolean} */
  function getNightModeState(rootEl) {
    return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
  }

  runtime.dom = Object.freeze({
    requirePluginRoot: requirePluginRoot,
    getNightModeState: getNightModeState
  });
}(this));
