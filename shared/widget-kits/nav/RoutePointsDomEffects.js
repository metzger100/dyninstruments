/**
 * Module: RoutePointsDomEffects - Committed-DOM side effects owner for route-points renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsDomEffects = factory(); }
}(this, function () {
  "use strict";

  const EFFECT_STATE_KEY = "__dyniRoutePointsDomEffects";

  function toSafeInteger(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.floor(n);
  }

  function isConnectedNode(node) {
    if (!node || typeof node !== "object") {
      return false;
    }
    if (typeof node.isConnected === "boolean") {
      return node.isConnected;
    }
    return true;
  }

  function resolveHostCommitTarget(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const commitState = ctx && ctx.__dyniHostCommitState ? ctx.__dyniHostCommitState : null;
    if (!commitState || typeof commitState !== "object") {
      return null;
    }
    return commitState.shellEl || commitState.rootEl || null;
  }

  function getEffectState(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    if (!ctx) {
      return null;
    }
    if (!ctx[EFFECT_STATE_KEY]) {
      ctx[EFFECT_STATE_KEY] = {
        token: 0,
        timerHandle: null
      };
    }
    return ctx[EFFECT_STATE_KEY];
  }

  function clearPending(state) {
    if (!state || state.timerHandle == null) {
      return;
    }
    clearTimeout(state.timerHandle);
    state.timerHandle = null;
  }

  function toElementHeight(element, fallback) {
    if (!element) {
      return fallback;
    }
    const clientHeight = Number(element.clientHeight);
    if (Number.isFinite(clientHeight) && clientHeight > 0) {
      return clientHeight;
    }
    const offsetHeight = Number(element.offsetHeight);
    if (Number.isFinite(offsetHeight) && offsetHeight > 0) {
      return offsetHeight;
    }
    if (typeof element.getBoundingClientRect === "function") {
      const rect = element.getBoundingClientRect();
      const rectHeight = Number(rect && rect.height);
      if (Number.isFinite(rectHeight) && rectHeight > 0) {
        return rectHeight;
      }
    }
    return fallback;
  }

  function toOffsetTop(element, listEl) {
    const offsetTop = Number(element && element.offsetTop);
    if (Number.isFinite(offsetTop)) {
      return offsetTop;
    }
    if (
      element &&
      listEl &&
      typeof element.getBoundingClientRect === "function" &&
      typeof listEl.getBoundingClientRect === "function"
    ) {
      const rowRect = element.getBoundingClientRect();
      const listRect = listEl.getBoundingClientRect();
      const listScrollTop = Number(listEl.scrollTop) || 0;
      return (Number(rowRect.top) - Number(listRect.top)) + listScrollTop;
    }
    return 0;
  }

  function isVerticalContainer(targetEl) {
    if (!targetEl || typeof targetEl.closest !== "function") {
      return false;
    }
    return !!targetEl.closest(".widgetContainer.vertical");
  }

  function measureListScrollbarGutter(targetEl) {
    if (!targetEl) {
      return 0;
    }
    const listEl = typeof targetEl.querySelector === "function"
      ? targetEl.querySelector(".dyni-route-points-list")
      : null;
    if (!listEl) {
      return 0;
    }

    const offsetWidth = Number(listEl.offsetWidth);
    const clientWidth = Number(listEl.clientWidth);
    if (!(offsetWidth > 0) || !Number.isFinite(clientWidth)) {
      return 0;
    }

    const gutterPx = Math.floor(offsetWidth - clientWidth);
    return gutterPx > 0 ? gutterPx : 0;
  }

  function ensureSelectedRowVisible(listEl, selectedIndex) {
    const index = toSafeInteger(selectedIndex, -1);
    if (!listEl || index < 0 || typeof listEl.querySelector !== "function") {
      return false;
    }

    const selectedRow = listEl.querySelector('[data-rp-row="' + String(index) + '"]');
    if (!selectedRow) {
      return false;
    }

    const viewportHeight = toElementHeight(listEl, 0);
    if (!(viewportHeight > 0)) {
      return false;
    }

    const currentScrollTop = Number(listEl.scrollTop) || 0;
    const rowTop = toOffsetTop(selectedRow, listEl);
    const rowHeight = toElementHeight(selectedRow, 0);
    const rowBottom = rowTop + rowHeight;
    const viewportBottom = currentScrollTop + viewportHeight;

    let nextScrollTop = null;
    if (rowTop < currentScrollTop) {
      nextScrollTop = rowTop;
    }
    else if (rowBottom > viewportBottom) {
      nextScrollTop = rowBottom - viewportHeight;
    }

    if (nextScrollTop == null) {
      return false;
    }

    const normalizedNext = Math.max(0, Math.floor(nextScrollTop));
    if (normalizedNext === Math.floor(currentScrollTop)) {
      return false;
    }

    listEl.scrollTop = normalizedNext;
    return true;
  }

  function scheduleSelectedRowVisibility(args) {
    const cfg = args || {};
    const hostContext = cfg.hostContext;
    const state = getEffectState(hostContext);
    if (!state) {
      return false;
    }

    const selectedIndex = toSafeInteger(cfg.selectedIndex, -1);
    state.token += 1;
    const token = state.token;

    clearPending(state);

    if (selectedIndex < 0) {
      return false;
    }

    const scheduledRoot = cfg.rootEl || resolveHostCommitTarget(hostContext);
    state.timerHandle = setTimeout(function () {
      state.timerHandle = null;

      if (state.token !== token) {
        return;
      }

      const currentRoot = resolveHostCommitTarget(hostContext) || cfg.rootEl || null;
      if (!isConnectedNode(currentRoot)) {
        return;
      }
      if (scheduledRoot && currentRoot && scheduledRoot !== currentRoot) {
        return;
      }
      if (typeof currentRoot.querySelector !== "function") {
        return;
      }

      const listEl = currentRoot.querySelector(".dyni-route-points-list");
      ensureSelectedRowVisible(listEl, selectedIndex);
    }, 0);

    return true;
  }

  function applyCommittedEffects(args) {
    const cfg = args || {};
    const targetEl = cfg.targetEl || resolveHostCommitTarget(cfg.hostContext);
    if (!targetEl || !isConnectedNode(targetEl)) {
      return {
        targetEl: null,
        isVerticalCommitted: false,
        scrollbarGutterPx: 0
      };
    }

    return {
      targetEl: targetEl,
      isVerticalCommitted: isVerticalContainer(targetEl),
      scrollbarGutterPx: measureListScrollbarGutter(targetEl)
    };
  }

  function create() {
    return {
      id: "RoutePointsDomEffects",
      isVerticalContainer: isVerticalContainer,
      measureListScrollbarGutter: measureListScrollbarGutter,
      ensureSelectedRowVisible: ensureSelectedRowVisible,
      scheduleSelectedRowVisibility: scheduleSelectedRowVisibility,
      applyCommittedEffects: applyCommittedEffects
    };
  }

  return { id: "RoutePointsDomEffects", create: create };
}));
