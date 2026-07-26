// @ts-check
const { createBridgeContext, makeElement, makeRoutePointPayload } = require("./TemporaryHostActionBridge-setup");

describe("runtime/TemporaryHostActionBridge.js", function () {
  it("rejects missing or blank route-point indexes instead of coercing to zero", function () {
    const routePointsActivate = vi.fn(() => true);
    const { bridge } = createBridgeContext({
      pageRoots: { gpspage: makeElement() },
      routePointsActivate
    });
    const hostActions = bridge.getHostActions();

    [null, undefined, "", "   "].forEach(function (value) {
      expect(function () {
        hostActions.routePoints.activate({
          index: value,
          pointSnapshot: {
            idx: 1,
            lat: 54.1,
            lon: 10.1,
            routeName: "Harbor Run"
          }
        });
      }).toThrow(/TemporaryHostActionBridge: routePoints\.activate requires a non-negative integer index/);
    });
    expect(routePointsActivate).not.toHaveBeenCalled();
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

  it("rejects null/blank route-point coordinates on editroutepage", function () {
    const editHandler = vi.fn();
    const editRoot = makeElement({
      __reactFiber$edit: {
        memoizedProps: { onItemClick: editHandler },
        return: null
      }
    });
    const { bridge } = createBridgeContext({
      pageRoots: { editroutepage: editRoot }
    });
    const hostActions = bridge.getHostActions();

    expect(function () {
      hostActions.routePoints.activate(makeRoutePointPayload(3, { lat: null }));
    }).toThrow(
      /TemporaryHostActionBridge: routePoints\.activate requires finite pointSnapshot\.lat\/lon on editroutepage/
    );
    expect(function () {
      hostActions.routePoints.activate(makeRoutePointPayload(3, { lon: "   " }));
    }).toThrow(
      /TemporaryHostActionBridge: routePoints\.activate requires finite pointSnapshot\.lat\/lon on editroutepage/
    );
    expect(editHandler).not.toHaveBeenCalled();
  });

  it("does not coerce blank optional course/distance fields in editroute payloads", function () {
    const editHandler = vi.fn();
    const editRoot = makeElement({
      __reactFiber$edit: {
        memoizedProps: { onItemClick: editHandler },
        return: null
      }
    });
    const { bridge } = createBridgeContext({
      pageRoots: { editroutepage: editRoot }
    });
    const hostActions = bridge.getHostActions();

    expect(
      hostActions.routePoints.activate(
        makeRoutePointPayload(5, {
          course: "",
          distance: "   "
        })
      )
    ).toBe(true);

    expect(editHandler).toHaveBeenCalledTimes(1);
    expect(editHandler.mock.calls[0][0].avnav.point).toEqual({
      idx: 5,
      name: "WP5",
      lat: 54.05,
      lon: 10.05,
      routeName: "Harbor Run",
      selected: false
    });
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
      __reactFiber$nav: {
        memoizedProps: { onItemClick: navHandler },
        return: null
      }
    });
    const gpsContainer = makeElement({
      __reactFiber$gps: {
        memoizedProps: { onItemClick: gpsHandler },
        return: null
      }
    });
    const gpsRoot = makeElement({
      querySelectorAll() {
        return [gpsContainer];
      }
    });
    const editRoot = makeElement({
      __reactFiber$edit: {
        memoizedProps: { onItemClick: editHandler },
        return: null
      }
    });

    const navBridge = createBridgeContext({
      pageRoots: { navpage: navRoot }
    }).bridge;
    const gpsBridge = createBridgeContext({
      pageRoots: { gpspage: gpsRoot }
    }).bridge;
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

    expect(navHandler.mock.calls[0][0].avnav).toEqual({
      item: { name: "Zoom" }
    });
    expect(navHandler.mock.calls[1][0].avnav).toEqual({
      item: { name: "ActiveRoute" }
    });
    expect(gpsHandler.mock.calls[0][0].avnav).toEqual({
      item: { name: "AisTarget" },
      mmsi: "123456789"
    });
    expect(editHandler.mock.calls[0][0].avnav).toEqual({
      item: { name: "EditRoute" }
    });
    expect(editHandler.mock.calls[1][0].avnav).toEqual({
      item: { name: "RoutePoints" },
      point: {
        idx: 7,
        name: "WP7",
        lat: 54.07,
        lon: 10.07,
        routeName: "Harbor Run",
        selected: true
      }
    });
    expect(editRelay).not.toHaveBeenCalled();
  });
});
