const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/TemporaryHostActionBridge.js", function () {
  /** @param {Record<string, any>} [options] */
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

  /** @param {Record<string, any>} [options] */
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
    /** @param {any} root @param {any} className */
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
        return alarmWidgetRoots.filter(function (/** @type {any} */ root) {
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

  /** @param {any} index @param {Record<string, any>} [overrides] */
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

  it("returns a singleton hostActions facade with the documented shape", function () {
    const navRoot = makeElement({
      __reactFiber$nav: {
        memoizedProps: { onItemClick: vi.fn() },
        return: null
      }
    });
    const { bridge } = createBridgeContext({ pageRoots: { navpage: navRoot } });

    const first = bridge.getHostActions();
    const second = bridge.getHostActions();

    expect(second).toBe(first);
    expect(typeof first.getCapabilities).toBe("function");
    expect(typeof first.routePoints.activate).toBe("function");
    expect(typeof first.map.checkAutoZoom).toBe("function");
    expect(typeof first.routeEditor.openActiveRoute).toBe("function");
    expect(typeof first.routeEditor.openEditRoute).toBe("function");
    expect(typeof first.ais.showInfo).toBe("function");
    expect(typeof first.alarm.stopAll).toBe("function");
  });

  it("reports page-aware capabilities for nav, gps, edit-route, and other pages", function () {
    const nav = createBridgeContext({ pageRoots: { navpage: makeElement() } })
      .bridge.getHostActions()
      .getCapabilities();
    const gps = createBridgeContext({ pageRoots: { gpspage: makeElement() } })
      .bridge.getHostActions()
      .getCapabilities();
    const editRoute = createBridgeContext({
      pageRoots: {
        editroutepage: makeElement({
          __reactFiber$edit: {
            memoizedProps: { widgetClick: vi.fn() },
            return: null
          }
        })
      }
    })
      .bridge.getHostActions()
      .getCapabilities();
    const editRouteNoParity = createBridgeContext({
      pageRoots: { editroutepage: makeElement() }
    })
      .bridge.getHostActions()
      .getCapabilities();
    const other = createBridgeContext({ pageRoots: {} }).bridge.getHostActions().getCapabilities();

    expect(nav).toEqual({
      pageId: "navpage",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "dispatch" },
      routeEditor: {
        openActiveRoute: "dispatch",
        openEditRoute: "unsupported"
      },
      ais: { showInfo: "dispatch" },
      alarm: { stopAll: "unsupported" }
    });
    expect(gps).toEqual({
      pageId: "gpspage",
      routePoints: { activate: "dispatch" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "passive", openEditRoute: "unsupported" },
      ais: { showInfo: "dispatch" },
      alarm: { stopAll: "unsupported" }
    });
    expect(editRoute).toEqual({
      pageId: "editroutepage",
      routePoints: { activate: "dispatch" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: {
        openActiveRoute: "unsupported",
        openEditRoute: "dispatch"
      },
      ais: { showInfo: "unsupported" },
      alarm: { stopAll: "unsupported" }
    });
    expect(editRouteNoParity.routePoints.activate).toBe("unsupported");
    expect(other).toEqual({
      pageId: "other",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: {
        openActiveRoute: "unsupported",
        openEditRoute: "unsupported"
      },
      ais: { showInfo: "unsupported" },
      alarm: { stopAll: "unsupported" }
    });
  });

  it("memoizes and freezes capability snapshots until page or relay inputs change", function () {
    const pageRoots = /** @type {Record<string, any>} */ ({ gpspage: makeElement() });
    const { bridge, context } = createBridgeContext({ pageRoots: pageRoots });
    const hostActions = bridge.getHostActions();
    const first = hostActions.getCapabilities();
    const second = hostActions.getCapabilities();

    expect(first).toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.routePoints)).toBe(true);
    expect(Object.isFrozen(first.routeEditor)).toBe(true);
    expect(first.pageId).toBe("gpspage");
    expect(first.routePoints.activate).toBe("dispatch");

    context.DyniPlugin.avnavApi.routePoints = {};
    const relayChanged = hostActions.getCapabilities();
    expect(relayChanged).not.toBe(first);
    expect(relayChanged.routePoints.activate).toBe("unsupported");

    delete pageRoots.gpspage;
    pageRoots.navpage = makeElement();
    const pageChanged = hostActions.getCapabilities();
    expect(pageChanged).not.toBe(relayChanged);
    expect(pageChanged.pageId).toBe("navpage");
  });

  it("updates capabilities and dispatch behavior when the same bridge sees a page change", function () {
    const navHandler = vi.fn();
    const gpsHandler = vi.fn();
    const pageRoots = /** @type {Record<string, any>} */ ({
      navpage: makeElement({
        __reactFiber$nav: {
          memoizedProps: { onItemClick: navHandler },
          return: null
        }
      })
    });
    const { bridge } = createBridgeContext({ pageRoots: pageRoots });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().pageId).toBe("navpage");
    expect(hostActions.map.checkAutoZoom()).toBe(true);
    expect(navHandler).toHaveBeenCalledTimes(1);

    delete pageRoots.navpage;
    pageRoots.gpspage = makeElement({
      __reactFiber$gps: {
        memoizedProps: { onItemClick: gpsHandler },
        return: null
      }
    });

    const gpsCapabilities = hostActions.getCapabilities();
    expect(gpsCapabilities.pageId).toBe("gpspage");
    expect(gpsCapabilities.map.checkAutoZoom).toBe("unsupported");
    expect(gpsCapabilities.ais.showInfo).toBe("dispatch");
    expect(gpsCapabilities.alarm.stopAll).toBe("unsupported");
    expect(hostActions.map.checkAutoZoom()).toBe(false);
    expect(hostActions.ais.showInfo("123")).toBe(true);
    expect(gpsHandler).toHaveBeenCalledTimes(1);
  });

  it("resolves capabilities once per dispatch path instead of recomputing twice", function () {
    const navHandler = vi.fn();
    const navRoot = makeElement({
      __reactFiber$nav: {
        memoizedProps: { onItemClick: navHandler },
        return: null
      }
    });
    const { bridge, getElementById } = createBridgeContext({
      pageRoots: { navpage: navRoot }
    });

    getElementById.mockClear();
    expect(bridge.getHostActions().map.checkAutoZoom()).toBe(true);
    expect(navHandler).toHaveBeenCalledTimes(1);
    expect(getElementById.mock.calls.map((call) => call[0])).toEqual([
      "editroutepage",
      "gpspage",
      "navpage",
      "navpage"
    ]);
  });

  it("delegates routePoints.activate through avnav.api on gpspage and returns false for unsupported pages", function () {
    const routePointsActivate = vi.fn(() => true);
    const { bridge } = createBridgeContext({
      pageRoots: { gpspage: makeElement() },
      routePointsActivate
    });

    expect(bridge.getHostActions().routePoints.activate(makeRoutePointPayload(3))).toBe(true);
    expect(routePointsActivate).toHaveBeenCalledWith(3);

    const unsupported = createBridgeContext({
      pageRoots: { navpage: makeElement() }
    }).bridge;
    expect(unsupported.getHostActions().routePoints.activate(makeRoutePointPayload(1))).toBe(false);
  });
});
