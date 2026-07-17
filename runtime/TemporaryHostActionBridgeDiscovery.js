/**
 * @file DyniPlugin TemporaryHostActionBridgeDiscovery - React-fiber lookup helpers for bridge dispatch
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 */
(function (root) {
  "use strict";

  /** @typedef {(event: unknown) => unknown} DyniHostDispatchHandler */
  /** @typedef {{ memoizedProps?: Record<string, unknown>, pendingProps?: Record<string, unknown>, return?: DyniHostReactFiber | null }} DyniHostReactFiber */
  /** @typedef {{ type: "click", avnav: Record<string, unknown>, stopPropagation: () => void, preventDefault: () => void }} DyniHostSyntheticEvent */
  /** @typedef {{ detectPageId: () => string, findPageDispatchHandler: (pageId: string, propNames?: string[]) => DyniHostDispatchHandler | null, dispatchPageAction: (actionName: string, pageId: string, avnavData: Record<string, unknown>, propNames: string[], missingLabel: string) => boolean, hasAlarmDispatch: () => boolean, dispatchAlarmStopAll: () => boolean }} DyniHostActionDiscoveryApi */

  const ns = /** @type {DyniPluginNamespace} */ (root.DyniPlugin);
  const runtime = /** @type {DyniRuntimeNamespace} */ (ns.runtime);
  const PAGE_IDS = ["editroutepage", "gpspage", "navpage"];

  /** @param {unknown} obj @param {string} key @returns {boolean} */
  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  }

  /** @param {unknown} obj @returns {string[]} */
  function getOwnPropertyNamesSafe(obj) {
    if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
      return [];
    }
    try {
      return Object.getOwnPropertyNames(obj);
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- DOM host objects can reject property enumeration; the bridge treats that as a non-match and keeps scanning.
    catch (err) {
      return [];
    }
  }

  /** @param {unknown} obj @param {string} prefix @returns {string | null} */
  function findObjectKeyByPrefix(obj, prefix) {
    const keys = getOwnPropertyNamesSafe(obj);
    for (let i = 0; i < keys.length; i += 1) {
      if (keys[i].indexOf(prefix) === 0) {
        return keys[i];
      }
    }
    return null;
  }

  /** @param {Element|null|undefined} element @returns {DyniHostReactFiber | null} */
  function getReactFiber(element) {
    if (!element) {
      return null;
    }
    const fiberKey = findObjectKeyByPrefix(element, "__reactFiber$");
    const dynamicElement = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (element));
    if (fiberKey && dynamicElement[fiberKey]) {
      return /** @type {DyniHostReactFiber} */ (dynamicElement[fiberKey]);
    }
    const containerKey = findObjectKeyByPrefix(element, "__reactContainer$");
    return containerKey ? /** @type {DyniHostReactFiber} */ (dynamicElement[containerKey]) : null;
  }

  /** @param {Element|null|undefined} element @param {string[]|undefined} propNameList @returns {DyniHostDispatchHandler | null} */
  function findFiberProp(element, propNameList) {
    let currentElement = element;
    const propNames = Array.isArray(propNameList) && propNameList.length > 0 ? propNameList : ["onItemClick"];

    while (currentElement) {
      let fiber = getReactFiber(currentElement);
      while (fiber) {
        const props = fiber.memoizedProps || fiber.pendingProps;
        if (props) {
          for (let i = 0; i < propNames.length; i += 1) {
            const propName = propNames[i];
            if (hasOwn(props, propName) && typeof props[propName] === "function") {
              return /** @type {DyniHostDispatchHandler} */ (props[propName]);
            }
          }
        }
        fiber = fiber.return || null;
      }
      currentElement = currentElement.parentElement || null;
    }
    return null;
  }

  /** @param {Element|null|undefined} pageRoot @returns {Element[]} */
  function collectDispatchTargets(pageRoot) {
    const targets = [];
    if (pageRoot) {
      targets.push(pageRoot);
      if (typeof pageRoot.querySelectorAll === "function") {
        const descendants = pageRoot.querySelectorAll(".widgetContainer, .listContainer");
        for (let i = 0; i < descendants.length; i += 1) {
          targets.push(descendants[i]);
        }
      }
    }
    return targets;
  }

  /** @param {Record<string, unknown>|undefined} avnavData @returns {DyniHostSyntheticEvent} */
  function createSyntheticEvent(avnavData) {
    return {
      type: "click",
      avnav: avnavData || {},
      stopPropagation: function () {},
      preventDefault: function () {}
    };
  }

  /** @param {string} pageId @param {Document|null|undefined} doc @returns {HTMLElement | null} */
  function getPageRoot(pageId, doc) {
    if (!doc || typeof doc.getElementById !== "function" || pageId === "other") {
      return null;
    }
    return doc.getElementById(pageId);
  }

  /** @param {Document|null|undefined} doc @returns {string} */
  function detectPageId(doc) {
    for (let i = 0; i < PAGE_IDS.length; i += 1) {
      if (getPageRoot(PAGE_IDS[i], doc)) {
        return PAGE_IDS[i];
      }
    }
    return "other";
  }

  /** @param {string} pageId @param {Document|null|undefined} doc @param {string[]|undefined} propNames @returns {DyniHostDispatchHandler | null} */
  function findPageDispatchHandler(pageId, doc, propNames) {
    const pageRoot = getPageRoot(pageId, doc);
    const targets = collectDispatchTargets(pageRoot);
    for (let i = 0; i < targets.length; i += 1) {
      const handler = findFiberProp(targets[i], propNames);
      if (typeof handler === "function") {
        return handler;
      }
    }
    return null;
  }

  /** @param {Element|null|undefined} element @returns {boolean} */
  function isVisibleElement(element) {
    if (!element) {
      return false;
    }
    if (typeof element.getClientRects === "function") {
      const rects = element.getClientRects();
      if (rects && typeof rects.length === "number") {
        return rects.length > 0;
      }
    }
    const htmlElement = /** @type {HTMLElement} */ (element);
    if (typeof htmlElement.offsetWidth === "number" && typeof htmlElement.offsetHeight === "number") {
      return htmlElement.offsetWidth > 0 || htmlElement.offsetHeight > 0;
    }
    return true;
  }

  /** @param {Document|null|undefined} doc @returns {Element[]} */
  function collectAlarmCandidates(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return [];
    }
    try {
      const found = doc.querySelectorAll(".alarmWidget");
      return /** @type {Element[]} */ (Array.prototype.slice.call(found));
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- DOM query selection can be unavailable on host stubs; the bridge falls back to unsupported.
    catch (err) {
      return [];
    }
  }

  /** @param {Document|null|undefined} doc @returns {DyniHostDispatchHandler | null} */
  function findAlarmClickHandler(doc) {
    const candidates = collectAlarmCandidates(doc);
    for (let i = 0; i < candidates.length; i += 1) {
      if (!isVisibleElement(candidates[i])) {
        continue;
      }
      const handler = findFiberProp(candidates[i], ["onClick", "widgetClick"]);
      if (typeof handler === "function") {
        return handler;
      }
    }
    for (let i = 0; i < candidates.length; i += 1) {
      const handler = findFiberProp(candidates[i], ["onClick", "widgetClick"]);
      if (typeof handler === "function") {
        return handler;
      }
    }
    return null;
  }

  /** @param {unknown} rootRef @param {(message: string) => Error} createBridgeError @returns {DyniHostActionDiscoveryApi} */
  function create(rootRef, createBridgeError) {
    const rootWithDocument = /** @type {{ document?: Document } | null | undefined} */ (rootRef);
    const doc = rootWithDocument && rootWithDocument.document ? rootWithDocument.document : /** @type {Document | null} */ (rootRef);

    /** @param {string} actionName @param {string} pageId @param {Record<string, unknown>} avnavData @param {string[]} propNames @param {string} missingLabel @returns {true} */
    function dispatchPageAction(actionName, pageId, avnavData, propNames, missingLabel) {
      const handler = findPageDispatchHandler(pageId, doc, propNames);
      if (typeof handler !== "function") {
        throw createBridgeError(actionName + " missing host " + missingLabel + " handler on " + pageId);
      }
      handler(createSyntheticEvent(avnavData));
      return true;
    }

    function dispatchAlarmStopAll() {
      const handler = findAlarmClickHandler(doc);
      if (typeof handler !== "function") {
        throw createBridgeError("alarm.stopAll missing native .alarmWidget click path");
      }
      handler(createSyntheticEvent({}));
      return true;
    }

    return {
      detectPageId: function () {
        return detectPageId(doc);
      },
      findPageDispatchHandler: function (pageId, propNames) {
        return findPageDispatchHandler(pageId, doc, propNames);
      },
      dispatchPageAction: dispatchPageAction,
      hasAlarmDispatch: function () {
        return typeof findAlarmClickHandler(doc) === "function";
      },
      dispatchAlarmStopAll: dispatchAlarmStopAll
    };
  }

  /** @type {DyniRuntimeNamespace & Record<string, unknown>} */ (runtime).createTemporaryHostActionBridgeDiscovery = /** @type {(rootRef: unknown, createBridgeError: (message: string) => Error) => DyniHostActionDiscoveryApi} */ (function (rootRef, createBridgeError) {
    return create(rootRef, createBridgeError);
  });
}(this));
