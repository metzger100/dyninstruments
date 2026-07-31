const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

/**
 * @typedef {Record<string, unknown> & { className?: string, parentElement?: TestElement | null, querySelectorAll?: () => TestElement[] }} TestElement
 * @typedef {{ alarmWidgetRoots?: TestElement[], hostApi?: object, includeGlobalApi?: boolean, pageRoots?: Record<string, TestElement>, routePointsActivate?: (index: number) => boolean }} BridgeOptions
 */

/** @param {TestElement} [options] */
function makeElement(options) {
  const opts = options || {};
  return Object.assign(
    {
      parentElement: null,
      querySelectorAll() {
        return [];
      }
    },
    opts
  );
}

/** @param {BridgeOptions} [options] */
function createBridgeContext(options) {
  const opts = options || {};
  const pageRoots = opts.pageRoots || {};
  const alarmWidgetRoots = opts.alarmWidgetRoots || [];
  const routePointsActivate = opts.routePointsActivate || vi.fn(() => true);
  const includeGlobalApi = opts.includeGlobalApi !== false;
  const capturedApi =
    opts.hostApi ||
    (includeGlobalApi
      ? {
          routePoints: {
            activate: routePointsActivate
          }
        }
      : null);
  /** @param {TestElement | undefined} root @param {string} className */
  function hasClassName(root, className) {
    const value = root && root.className;
    if (typeof value !== "string") {
      return true;
    }
    return value.split(/\s+/).indexOf(className) >= 0;
  }
  const getElementById = vi.fn(function (id) {
    return Object.prototype.hasOwnProperty.call(pageRoots, id) ? pageRoots[id] : null;
  });
  const querySelectorAll = vi.fn(function (selector) {
    if (selector === ".alarmWidget") {
      return alarmWidgetRoots.filter(function (root) {
        return hasClassName(root, "alarmWidget");
      });
    }
    return [];
  });
  const context = createScriptContext({
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] },
      ...(capturedApi ? { avnavApi: capturedApi } : {})
    },
    avnav: includeGlobalApi
      ? {
          api: {
            routePoints: {
              activate: routePointsActivate
            }
          }
        }
      : {},
    document: {
      getElementById: getElementById,
      querySelectorAll: querySelectorAll
    }
  });

  runIifeScript("runtime/namespace.js", context);
  runIifeScript("runtime/TemporaryHostActionBridgeDiscovery.js", context);
  runIifeScript("runtime/TemporaryHostActionBridge.js", context);
  return {
    context,
    bridge: context.DyniPlugin.runtime.createTemporaryHostActionBridge(),
    routePointsActivate,
    getElementById
  };
}

/** @param {number} index @param {Record<string, unknown>} [overrides] */
function makeRoutePointPayload(index, overrides) {
  const basePoint = {
    idx: index,
    name: "WP" + String(index),
    lat: 54 + index * 0.01,
    lon: 10 + index * 0.01,
    routeName: "Harbor Run",
    selected: false
  };
  return {
    index: index,
    pointSnapshot: Object.assign(basePoint, overrides || {})
  };
}

module.exports = {
  createBridgeContext,
  createScriptContext,
  makeElement,
  makeRoutePointPayload,
  runIifeScript
};
