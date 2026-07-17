/**
 * @file RoutePointsDomEffects - Committed-DOM side effects owner for route-points renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsDomEffects = factory();
  }
}(this, function () {
  "use strict";

  const EFFECT_STATE_KEY = "__dyniRoutePointsDomEffects";
  /** @type {Record<string, boolean>} */
  const ALLOWED_REVEAL_REASONS = {
    mount: true,
    "active-change": true
  };
  /** @type {DyniHtmlWidgetUtilsApi} */
  let htmlUtils;
  /** @type {DyniValueMathApi["toSafeInteger"]} */
  let toSafeInteger;

  /** @param {unknown} node @returns {boolean} */
  function isConnectedNode(node) {
    if (!node || typeof node !== "object") {
      return false;
    }
    const element = /** @type {{ isConnected?: unknown }} */ (node);
    if (typeof element.isConnected === "boolean") {
      return element.isConnected;
    }
    return true;
  }

  /** @param {unknown} hostContext @returns {DyniRoutePointsDomEffectState | null} */
  function getEffectState(hostContext) {
    const ctx = hostContext && typeof hostContext === "object"
      ? /** @type {Record<string, DyniRoutePointsDomEffectState>} */ (hostContext)
      : null;
    if (!ctx) {
      return null;
    }
    if (!ctx[EFFECT_STATE_KEY]) {
      ctx[EFFECT_STATE_KEY] = {
        token: 0,
        timerHandle: null,
        hasInitialActiveReveal: false,
        lastAutoScrolledActiveKey: null,
        lastSeenActiveKey: null
      };
    }
    return ctx[EFFECT_STATE_KEY];
  }

  /** @param {DyniRoutePointsDomEffectState | null | undefined} state */
  function clearPending(state) {
    if (!state || state.timerHandle == null) {
      return;
    }
    clearTimeout(state.timerHandle);
    state.timerHandle = null;
  }

  /** @param {DyniRoutePointsDomElement | null | undefined} element @param {number} defaultValue @returns {number} */
  function toElementHeight(element, defaultValue) {
    if (!element) {
      return defaultValue;
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
    return defaultValue;
  }

  /** @param {DyniRoutePointsDomElement | null | undefined} element @param {DyniRoutePointsDomElement | null | undefined} listEl @returns {number} */
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

  /** @param {unknown} targetEl @returns {boolean} */
  function isVerticalContainer(targetEl) {
    const element = /** @type {DyniRoutePointsDomElement | null} */ (targetEl);
    if (!element || typeof element.closest !== "function") {
      return false;
    }
    return !!element.closest(".widgetContainer.vertical");
  }

  /** @param {unknown} targetEl @returns {number} */
  function measureListScrollbarGutter(targetEl) {
    const element = /** @type {DyniRoutePointsDomElement | null} */ (targetEl);
    if (!element) {
      return 0;
    }
    const listEl = typeof element.querySelector === "function"
      ? element.querySelector(".dyni-route-points-list")
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

  /** @param {DyniRoutePointsDomElement | null | undefined} listEl @param {unknown} selectedIndex @returns {boolean} */
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

  /** @param {unknown} reason @returns {DyniRoutePointsRevealReason | ""} */
  function normalizeRevealReason(reason) {
    const text = typeof reason === "string" ? reason.trim() : "";
    if (
      text === "mount" ||
      text === "active-change" ||
      text === "resize" ||
      text === "refit" ||
      text === "layout" ||
      text === "data-refresh"
    ) {
      return text;
    }
    return "";
  }

  /** @param {unknown} activeKey @param {number} selectedIndex @returns {string} */
  function normalizeActiveKey(activeKey, selectedIndex) {
    const text = activeKey == null ? "" : String(activeKey).trim();
    if (text) {
      return text;
    }
    return "idx:" + String(selectedIndex);
  }

  /** @param {DyniRoutePointsDomEffectState} state @param {DyniRoutePointsRevealReason | ""} explicitReason @param {string} activeKey @returns {DyniRoutePointsRevealReason} */
  function resolveRevealReason(state, explicitReason, activeKey) {
    if (explicitReason) {
      return explicitReason;
    }
    if (state.hasInitialActiveReveal !== true) {
      return "mount";
    }
    if (state.lastSeenActiveKey !== activeKey) {
      return "active-change";
    }
    return "data-refresh";
  }

  /** @param {DyniRoutePointsRevealReason} reason @param {DyniRoutePointsDomEffectState} state @param {string} activeKey @returns {boolean} */
  function shouldAutoReveal(reason, state, activeKey) {
    if (!ALLOWED_REVEAL_REASONS[reason]) {
      return false;
    }
    if (reason === "mount") {
      return state.hasInitialActiveReveal !== true;
    }
    return state.lastAutoScrolledActiveKey !== activeKey;
  }

  /** @param {DyniRoutePointsRevealArgs | undefined} args @returns {boolean} */
  function maybeRevealActiveRow(args) {
    const cfg = /** @type {DyniRoutePointsRevealArgs} */ (args || {});
    const hostContext = cfg.hostContext;
    const state = getEffectState(hostContext);
    if (!state) {
      return false;
    }

    const selectedIndex = toSafeInteger(cfg.selectedIndex, -1);
    if (selectedIndex < 0) {
      clearPending(state);
      state.lastSeenActiveKey = null;
      return false;
    }

    const activeKey = normalizeActiveKey(cfg.activeKey, selectedIndex);
    const explicitReason = normalizeRevealReason(cfg.reason);
    const reason = resolveRevealReason(state, explicitReason, activeKey);
    state.lastSeenActiveKey = activeKey;

    if (!shouldAutoReveal(reason, state, activeKey)) {
      return false;
    }

    state.token += 1;
    const token = state.token;
    clearPending(state);

    const scheduledRoot = cfg.rootEl || htmlUtils.resolveHostCommitTarget(hostContext);
    state.timerHandle = setTimeout(function () {
      state.timerHandle = null;

      if (state.token !== token) {
        return;
      }

      const currentRoot = cfg.rootEl || htmlUtils.resolveHostCommitTarget(hostContext) || null;
      if (!isConnectedNode(currentRoot)) {
        return;
      }
      if (scheduledRoot && currentRoot && scheduledRoot !== currentRoot) {
        return;
      }
      const rootEl = /** @type {DyniRoutePointsDomElement} */ (currentRoot);
      if (typeof rootEl.querySelector !== "function") {
        return;
      }

      const listEl = rootEl.querySelector(".dyni-route-points-list");
      ensureSelectedRowVisible(listEl, selectedIndex);
      state.hasInitialActiveReveal = true;
      state.lastAutoScrolledActiveKey = activeKey;
      state.lastSeenActiveKey = activeKey;
    }, 0);

    return true;
  }

  /** @param {DyniRoutePointsRevealArgs | undefined} args @returns {boolean} */
  function scheduleSelectedRowVisibility(args) {
    return maybeRevealActiveRow(args);
  }

  /** @param {DyniRoutePointsCommittedEffectsArgs | undefined} args @returns {DyniRoutePointsCommittedEffects} */
  function applyCommittedEffects(args) {
    const cfg = /** @type {DyniRoutePointsCommittedEffectsArgs} */ (args || {});
    const targetEl = cfg.targetEl || htmlUtils.resolveHostCommitTarget(cfg.hostContext);
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

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniRoutePointsDomEffectsApi} */
  function create(def, componentContext) {
    htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    toSafeInteger = componentContext.components.require("ValueMath").toSafeInteger;

    return {
      id: "RoutePointsDomEffects",
      isVerticalContainer: isVerticalContainer,
      measureListScrollbarGutter: measureListScrollbarGutter,
      ensureSelectedRowVisible: ensureSelectedRowVisible,
      maybeRevealActiveRow: maybeRevealActiveRow,
      scheduleSelectedRowVisibility: scheduleSelectedRowVisibility,
      applyCommittedEffects: applyCommittedEffects
    };
  }

  /** @type {DyniRoutePointsDomEffectsModule} */
  return { id: "RoutePointsDomEffects", create: create };
}));
