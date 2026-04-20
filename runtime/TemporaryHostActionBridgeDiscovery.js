/**
 * Module: DyniPlugin TemporaryHostActionBridgeDiscovery - React-fiber lookup helpers for bridge dispatch
 * Documentation: documentation/avnav-api/plugin-lifecycle.md
 * Depends: DOM page roots
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const PAGE_IDS = ["editroutepage", "gpspage", "navpage"];

  function hasOwn(obj, key) {
    return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  }

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

  function findObjectKeyByPrefix(obj, prefix) {
    const keys = getOwnPropertyNamesSafe(obj);
    for (let i = 0; i < keys.length; i += 1) {
      if (keys[i].indexOf(prefix) === 0) {
        return keys[i];
      }
    }
    return null;
  }

  function getReactFiber(element) {
    if (!element) {
      return null;
    }
    const fiberKey = findObjectKeyByPrefix(element, "__reactFiber$");
    if (fiberKey && element[fiberKey]) {
      return element[fiberKey];
    }
    const containerKey = findObjectKeyByPrefix(element, "__reactContainer$");
    return containerKey ? element[containerKey] : null;
  }

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
              return props[propName];
            }
          }
        }
        fiber = fiber.return;
      }
      currentElement = currentElement.parentElement || null;
    }
    return null;
  }

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

  function createSyntheticEvent(avnavData) {
    return {
      type: "click",
      avnav: avnavData || {},
      stopPropagation: function () {},
      preventDefault: function () {}
    };
  }

  function getPageRoot(pageId, doc) {
    if (!doc || typeof doc.getElementById !== "function" || pageId === "other") {
      return null;
    }
    return doc.getElementById(pageId);
  }

  function detectPageId(doc) {
    for (let i = 0; i < PAGE_IDS.length; i += 1) {
      if (getPageRoot(PAGE_IDS[i], doc)) {
        return PAGE_IDS[i];
      }
    }
    return "other";
  }

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
    if (typeof element.offsetWidth === "number" && typeof element.offsetHeight === "number") {
      return element.offsetWidth > 0 || element.offsetHeight > 0;
    }
    return true;
  }

  function collectAlarmCandidates(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return [];
    }
    try {
      const found = doc.querySelectorAll(".alarmWidget");
      return Array.prototype.slice.call(found);
    }
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- DOM query selection can be unavailable on host stubs; the bridge falls back to unsupported.
    catch (err) {
      return [];
    }
  }

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

  function create(rootRef, createBridgeError) {
    const doc = rootRef && rootRef.document ? rootRef.document : rootRef;

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

  runtime.createTemporaryHostActionBridgeDiscovery = function (rootRef, createBridgeError) {
    return create(rootRef, createBridgeError);
  };
}(this));
