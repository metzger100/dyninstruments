// @ts-nocheck
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

describe("runtime/TemporaryHostActionBridge.js", function () {
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

  it("discovers alarm dispatch on any visible page with a mounted native alarm widget", function () {
    const alarmClick = vi.fn();
    const alarmWidget = makeElement({
      className: "alarmWidget",
      __reactFiber$alarm: {
        memoizedProps: { onClick: alarmClick },
        return: null
      }
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
      routeEditor: {
        openActiveRoute: "unsupported",
        openEditRoute: "unsupported"
      },
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
      __reactFiber$dynAlarm: {
        memoizedProps: { onClick: dynAlarmClick },
        return: null
      }
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
      __reactFiber$alarm: {
        memoizedProps: { onClick: alarmClick },
        return: null
      }
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
      __reactFiber$edit: {
        memoizedProps: { widgetClick: vi.fn() },
        return: null
      }
    });
    const { bridge } = createBridgeContext({
      pageRoots: { editroutepage: editRoot }
    });
    const hostActions = bridge.getHostActions();

    expect(hostActions.getCapabilities().routePoints.activate).toBe("dispatch");
    delete editRoot.__reactFiber$edit;

    expect(function () {
      hostActions.routePoints.activate(makeRoutePointPayload(1));
    }).toThrow(/TemporaryHostActionBridge: routePoints\.activate parity dispatch unavailable on editroutepage/);
  });

  it("returns false for passive or unsupported action modes before dispatch", function () {
    const gpsBridge = createBridgeContext({
      pageRoots: { gpspage: makeElement() }
    }).bridge;
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
      __reactFiber$nav: {
        memoizedProps: { onItemClick: vi.fn() },
        return: null
      }
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
