const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/TemporaryHostActionBridge.js", function () {
  function makeElement(options) {
    const opts = options || {};
    return Object.assign({
      parentElement: null,
      querySelectorAll() {
        return [];
      }
    }, opts);
  }

  function createBridgeContext(options) {
    const opts = options || {};
    const pageRoots = opts.pageRoots || {};
    const alarmWidgetRoots = opts.alarmWidgetRoots || [];
    const routePointsActivate = opts.routePointsActivate || vi.fn(() => true);
    const includeGlobalApi = opts.includeGlobalApi !== false;
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
        ...(opts.hostApi ? { avnavApi: opts.hostApi } : {})
      },
      avnav: includeGlobalApi ? {
        api: {
          routePoints: {
            activate: routePointsActivate
          }
        }
      } : {},
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
      __reactFiber$nav: { memoizedProps: { onItemClick: vi.fn() }, return: null }
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
    const nav = createBridgeContext({ pageRoots: { navpage: makeElement() } }).bridge.getHostActions().getCapabilities();
    const gps = createBridgeContext({ pageRoots: { gpspage: makeElement() } }).bridge.getHostActions().getCapabilities();
    const editRoute = createBridgeContext({
      pageRoots: {
        editroutepage: makeElement({
          __reactFiber$edit: { memoizedProps: { widgetClick: vi.fn() }, return: null }
        })
      }
    }).bridge.getHostActions().getCapabilities();
    const editRouteNoParity = createBridgeContext({
      pageRoots: { editroutepage: makeElement() }
    }).bridge.getHostActions().getCapabilities();
    const other = createBridgeContext({ pageRoots: {} }).bridge.getHostActions().getCapabilities();

    expect(nav).toEqual({
      pageId: "navpage",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "dispatch" },
      routeEditor: { openActiveRoute: "dispatch", openEditRoute: "unsupported" },
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
      routeEditor: { openActiveRoute: "unsupported", openEditRoute: "dispatch" },
      ais: { showInfo: "unsupported" },
      alarm: { stopAll: "unsupported" }
    });
    expect(editRouteNoParity.routePoints.activate).toBe("unsupported");
    expect(other).toEqual({
      pageId: "other",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "unsupported", openEditRoute: "unsupported" },
      ais: { showInfo: "unsupported" },
      alarm: { stopAll: "unsupported" }
    });
  });

  it("memoizes and freezes capability snapshots until page or relay inputs change", function () {
    const pageRoots = { gpspage: makeElement() };
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

    context.avnav.api.routePoints = {};
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
    const pageRoots = {
      navpage: makeElement({
        __reactFiber$nav: { memoizedProps: { onItemClick: navHandler }, return: null }
      })
    };
    const { bridge } = createBridgeContext({ pageRoots: pageRoots });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().pageId).toBe("navpage");
    expect(hostActions.map.checkAutoZoom()).toBe(true);
    expect(navHandler).toHaveBeenCalledTimes(1);

    delete pageRoots.navpage;
    pageRoots.gpspage = makeElement({
      __reactFiber$gps: { memoizedProps: { onItemClick: gpsHandler }, return: null }
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
      __reactFiber$nav: { memoizedProps: { onItemClick: navHandler }, return: null }
    });
    const { bridge, getElementById } = createBridgeContext({ pageRoots: { navpage: navRoot } });

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

  it("resolves routePoints from the captured DyniPlugin.avnavApi when the wrapper global is absent", function () {
    const routePointsActivate = vi.fn(() => true);
    const { bridge } = createBridgeContext({
      includeGlobalApi: false,
      hostApi: {
        routePoints: {
          activate: routePointsActivate
        }
      },
      pageRoots: { gpspage: makeElement() }
    });

    expect(bridge.getHostActions().routePoints.activate(makeRoutePointPayload(4))).toBe(true);
    expect(routePointsActivate).toHaveBeenCalledWith(4);
  });

  it("throws explicit errors when a dispatch-capable gps routePoints relay path fails", function () {
    const { bridge } = createBridgeContext({
      pageRoots: { gpspage: makeElement() },
      routePointsActivate: vi.fn(() => false)
    });

    expect(function () {
      bridge.getHostActions().routePoints.activate(makeRoutePointPayload(2));
    }).toThrow(/TemporaryHostActionBridge: routePoints\.activate returned false/);
  });

  it("dispatches map, route-editor, and ais actions through page onItemClick handlers", function () {
    const navHandler = vi.fn();
    const gpsHandler = vi.fn();
    const editHandler = vi.fn();
    const navRoot = makeElement({
      __reactFiber$nav: { memoizedProps: { onItemClick: navHandler }, return: null }
    });
    const gpsContainer = makeElement({
      __reactFiber$gps: { memoizedProps: { onItemClick: gpsHandler }, return: null }
    });
    const gpsRoot = makeElement({
      querySelectorAll() {
        return [gpsContainer];
      }
    });
    const editRoot = makeElement({
      __reactFiber$edit: { memoizedProps: { onItemClick: editHandler }, return: null }
    });

    const navBridge = createBridgeContext({ pageRoots: { navpage: navRoot } }).bridge;
    const gpsBridge = createBridgeContext({ pageRoots: { gpspage: gpsRoot } }).bridge;
    const editRelay = vi.fn(() => true);
    const editBridgeContext = createBridgeContext({
      pageRoots: { editroutepage: editRoot },
      routePointsActivate: editRelay
    });
    const editBridge = editBridgeContext.bridge;

    expect(navBridge.getHostActions().map.checkAutoZoom()).toBe(true);
    expect(navBridge.getHostActions().routeEditor.openActiveRoute()).toBe(true);
    expect(gpsBridge.getHostActions().ais.showInfo("123456789")).toBe(true);
    expect(editBridge.getHostActions().routeEditor.openEditRoute()).toBe(true);
    expect(editBridge.getHostActions().routePoints.activate(makeRoutePointPayload(7, { selected: true }))).toBe(true);

    expect(navHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "Zoom" } });
    expect(navHandler.mock.calls[1][0].avnav).toEqual({ item: { name: "ActiveRoute" } });
    expect(gpsHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "AisTarget" }, mmsi: "123456789" });
    expect(editHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "EditRoute" } });
    expect(editHandler.mock.calls[1][0].avnav).toEqual({
      item: { name: "RoutePoints" },
      point: { idx: 7, name: "WP7", lat: 54.07, lon: 10.07, routeName: "Harbor Run", selected: true }
    });
    expect(editRelay).not.toHaveBeenCalled();
  });

  it("discovers alarm dispatch on any visible page with a mounted native alarm widget", function () {
    const alarmClick = vi.fn();
    const alarmWidget = makeElement({
      className: "alarmWidget",
      __reactFiber$alarm: { memoizedProps: { onClick: alarmClick }, return: null }
    });
    const { bridge } = createBridgeContext({
      pageRoots: {},
      alarmWidgetRoots: [alarmWidget]
    });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities()).toEqual({
      pageId: "other",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "unsupported", openEditRoute: "unsupported" },
      ais: { showInfo: "unsupported" },
      alarm: { stopAll: "dispatch" }
    });
    expect(hostActions.alarm.stopAll()).toBe(true);
    expect(alarmClick).toHaveBeenCalledTimes(1);
  });

  it("ignores dyn alarm roots when discovering native alarm dispatch", function () {
    const dynAlarmClick = vi.fn();
    const dynAlarmRoot = makeElement({
      className: "dyni-alarm-root",
      __reactFiber$dynAlarm: { memoizedProps: { onClick: dynAlarmClick }, return: null }
    });
    const { bridge } = createBridgeContext({
      pageRoots: {},
      alarmWidgetRoots: [dynAlarmRoot]
    });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().alarm.stopAll).toBe("unsupported");
    expect(hostActions.alarm.stopAll()).toBe(false);
    expect(dynAlarmClick).toHaveBeenCalledTimes(0);
  });

  it("keeps alarm stop-all unsupported and non-throwing when no native alarm widget is mounted", function () {
    const { bridge } = createBridgeContext({
      pageRoots: {},
      alarmWidgetRoots: []
    });
    const hostActions = bridge.getHostActions();
    let result = null;

    expect(hostActions.getCapabilities().alarm.stopAll).toBe("unsupported");
    expect(function () {
      result = hostActions.alarm.stopAll();
    }).not.toThrow();
    expect(result).toBe(false);
  });

  it("throws when alarm dispatch capability disappears before invocation", function () {
    const alarmClick = vi.fn();
    const alarmWidget = makeElement({
      className: "alarmWidget",
      __reactFiber$alarm: { memoizedProps: { onClick: alarmClick }, return: null }
    });
    const { bridge, context } = createBridgeContext({
      pageRoots: {},
      alarmWidgetRoots: [alarmWidget]
    });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().alarm.stopAll).toBe("dispatch");
    context.document.querySelectorAll.mockReturnValue([]);

    expect(function () {
      hostActions.alarm.stopAll();
    }).toThrow(/TemporaryHostActionBridge: alarm\.stopAll missing native \.alarmWidget click path/);
  });

  it("fails closed on editroutepage when parity dispatch was granted but handler disappears", function () {
    const editRoot = makeElement({
      __reactFiber$edit: { memoizedProps: { widgetClick: vi.fn() }, return: null }
    });
    const { bridge } = createBridgeContext({ pageRoots: { editroutepage: editRoot } });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().routePoints.activate).toBe("dispatch");
    delete editRoot.__reactFiber$edit;

    expect(function () {
      hostActions.routePoints.activate(makeRoutePointPayload(1));
    }).toThrow(/TemporaryHostActionBridge: routePoints\.activate parity dispatch unavailable on editroutepage/);
  });

  it("returns false for passive or unsupported action modes before dispatch", function () {
    const gpsBridge = createBridgeContext({ pageRoots: { gpspage: makeElement() } }).bridge;
    const otherBridge = createBridgeContext({ pageRoots: {} }).bridge;

    expect(gpsBridge.getHostActions().map.checkAutoZoom()).toBe(false);
    expect(gpsBridge.getHostActions().routeEditor.openActiveRoute()).toBe(false);
    expect(otherBridge.getHostActions().ais.showInfo("123")).toBe(false);
  });

  it("throws explicit errors when a dispatch-capable page handler is missing", function () {
    const { bridge } = createBridgeContext({
      pageRoots: { navpage: makeElement() }
    });

    expect(function () {
      bridge.getHostActions().routeEditor.openActiveRoute();
    }).toThrow(/TemporaryHostActionBridge: routeEditor\.openActiveRoute missing host onItemClick handler/);
  });

  it("invalidates the facade after destroy", function () {
    const root = makeElement({
      __reactFiber$nav: { memoizedProps: { onItemClick: vi.fn() }, return: null }
    });
    const { bridge } = createBridgeContext({ pageRoots: { navpage: root } });
    const hostActions = bridge.getHostActions();

    bridge.destroy();

    expect(function () {
      bridge.getHostActions();
    }).toThrow(/TemporaryHostActionBridge: bridge was destroyed/);
    expect(function () {
      hostActions.getCapabilities();
    }).toThrow(/TemporaryHostActionBridge: bridge was destroyed/);
  });
});
