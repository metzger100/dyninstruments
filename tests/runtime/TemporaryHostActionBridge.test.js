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
    const routePointsActivate = opts.routePointsActivate || vi.fn(() => true);
    const getElementById = vi.fn(function (id) {
      return Object.prototype.hasOwnProperty.call(pageRoots, id) ? pageRoots[id] : null;
    });
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      },
      avnav: {
        api: {
          routePoints: {
            activate: routePointsActivate
          }
        }
      },
      document: {
        getElementById: getElementById
      }
    });

    runIifeScript("runtime/TemporaryHostActionBridge.js", context);
    return {
      context,
      bridge: context.DyniPlugin.runtime.createTemporaryHostActionBridge(),
      routePointsActivate,
      getElementById
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
  });

  it("reports page-aware capabilities for nav, gps, edit-route, and other pages", function () {
    const nav = createBridgeContext({ pageRoots: { navpage: makeElement() } }).bridge.getHostActions().getCapabilities();
    const gps = createBridgeContext({ pageRoots: { gpspage: makeElement() } }).bridge.getHostActions().getCapabilities();
    const editRoute = createBridgeContext({ pageRoots: { editroutepage: makeElement() } }).bridge.getHostActions().getCapabilities();
    const other = createBridgeContext({ pageRoots: {} }).bridge.getHostActions().getCapabilities();

    expect(nav).toEqual({
      pageId: "navpage",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "dispatch" },
      routeEditor: { openActiveRoute: "dispatch", openEditRoute: "unsupported" },
      ais: { showInfo: "dispatch" }
    });
    expect(gps).toEqual({
      pageId: "gpspage",
      routePoints: { activate: "dispatch" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "passive", openEditRoute: "unsupported" },
      ais: { showInfo: "dispatch" }
    });
    expect(editRoute).toEqual({
      pageId: "editroutepage",
      routePoints: { activate: "dispatch" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "unsupported", openEditRoute: "dispatch" },
      ais: { showInfo: "unsupported" }
    });
    expect(other).toEqual({
      pageId: "other",
      routePoints: { activate: "unsupported" },
      map: { checkAutoZoom: "unsupported" },
      routeEditor: { openActiveRoute: "unsupported", openEditRoute: "unsupported" },
      ais: { showInfo: "unsupported" }
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

  it("delegates routePoints.activate through avnav.api and returns false only for unsupported pages", function () {
    const routePointsActivate = vi.fn(() => true);
    const { bridge } = createBridgeContext({
      pageRoots: { gpspage: makeElement() },
      routePointsActivate
    });

    expect(bridge.getHostActions().routePoints.activate(3)).toBe(true);
    expect(routePointsActivate).toHaveBeenCalledWith(3);

    const unsupported = createBridgeContext({
      pageRoots: { navpage: makeElement() }
    }).bridge;
    expect(unsupported.getHostActions().routePoints.activate(1)).toBe(false);
  });

  it("throws explicit errors when a dispatch-capable routePoints path fails", function () {
    const { bridge } = createBridgeContext({
      pageRoots: { editroutepage: makeElement() },
      routePointsActivate: vi.fn(() => false)
    });

    expect(function () {
      bridge.getHostActions().routePoints.activate(2);
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
    const editBridge = createBridgeContext({ pageRoots: { editroutepage: editRoot } }).bridge;

    expect(navBridge.getHostActions().map.checkAutoZoom()).toBe(true);
    expect(navBridge.getHostActions().routeEditor.openActiveRoute()).toBe(true);
    expect(gpsBridge.getHostActions().ais.showInfo("123456789")).toBe(true);
    expect(editBridge.getHostActions().routeEditor.openEditRoute()).toBe(true);

    expect(navHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "Zoom" } });
    expect(navHandler.mock.calls[1][0].avnav).toEqual({ item: { name: "ActiveRoute" } });
    expect(gpsHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "AisTarget" }, mmsi: "123456789" });
    expect(editHandler.mock.calls[0][0].avnav).toEqual({ item: { name: "EditRoute" } });
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
