const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_eta: "ETA",
  unit_eta: "",
  caption_rteDistance: "RTE",
  unit_rteDistance: "nm",
  caption_vmg: "VMG",
  unit_vmg: "kn",
  caption_activeRouteRemain: "RTE CAP",
  unit_activeRouteRemain: "nmA",
  caption_activeRouteEta: "ETA CAP",
  unit_activeRouteEta: "",
  caption_activeRouteNextCourse: "NEXT CAP",
  unit_activeRouteNextCourse: "degN",
  caption_positionBoat: "POS",
  unit_positionBoat: "",
  caption_xteDisplayXte: "XTE CAP",
  unit_xteDisplayXte: "nmX",
  caption_xteDisplayCog: "COG CAP",
  unit_xteDisplayCog: "degT",
  caption_xteDisplayDst: "DST CAP",
  unit_xteDisplayDst: "nmD",
  caption_xteDisplayBrg: "BRG CAP",
  unit_xteDisplayBrg: "degM",
  caption_editRoutePts: "PTS CAP",
  caption_editRouteDst: "DST CAP",
  unit_editRouteDst: "nmE",
  caption_editRouteRte: "RTE CAP",
  unit_editRouteRte: "kmR",
  caption_editRouteEta: "ETA CAP"
});

function createMapper() {
  const Helpers = {
    getModule(id) {
      if (id === "ActiveRouteViewModel") {
        return loadFresh("cluster/viewmodels/ActiveRouteViewModel.js");
      }
      if (id === "EditRouteViewModel") {
        return loadFresh("cluster/viewmodels/EditRouteViewModel.js");
      }
      if (id === "RoutePointsViewModel") {
        return loadFresh("cluster/viewmodels/RoutePointsViewModel.js");
      }
      if (id === "CenterDisplayMath") {
        return loadFresh("shared/widget-kits/nav/CenterDisplayMath.js");
      }
      throw new Error("unexpected module: " + id);
    }
  };
  return loadFresh("cluster/mappers/NavMapper.js").create({}, Helpers);
}

describe("NavMapper", function () {
  it("maps ETA kinds with formatTime", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "eta", eta: 1700000000 }, toolkit).formatter).toBe("formatTime");
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100 }, toolkit).formatter).toBe("formatTime");
  });

  it("maps ETA kinds with formatClock when hideSeconds is enabled", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "eta", eta: 1700000000, hideSeconds: true }, toolkit).formatter).toBe("formatClock");
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100, hideSeconds: true }, toolkit).formatter).toBe("formatClock");
  });

  it("maps distance kinds with formatDistance", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "rteDistance", rteDistance: 12.3 }, toolkit);

    expect(out).toEqual({
      value: 12.3,
      caption: "RTE",
      unit: "nm",
      formatter: "formatDistance",
      formatterParameters: []
    });
  });

  it("maps VMG using speed formatter and unit parameter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "vmg", vmg: 4.2 }, toolkit);

    expect(out).toEqual({
      value: 4.2,
      caption: "VMG",
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
  });

  it("maps activeRoute to ActiveRouteTextHtmlWidget with renderer-owned field props", function () {
    const mapper = createMapper();
    const rawEta = new Date("2026-03-06T11:45:00Z");
    const out = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "  Harbor Run  ",
      activeRouteRemain: "18.2",
      activeRouteEta: rawEta,
      activeRouteNextCourse: "93",
      activeRouteApproaching: true,
      activeRouteRatioThresholdNormal: "1.25",
      activeRouteRatioThresholdFlat: "4.4",
      wpServer: true,
      disconnect: true,
      hideSeconds: true
    }, toolkit);

    expect(out).toEqual({
      renderer: "ActiveRouteTextHtmlWidget",
      routeName: "Harbor Run",
      disconnect: true,
      display: {
        remain: 18.2,
        eta: rawEta,
        nextCourse: 93,
        isApproaching: true
      },
      captions: {
        remain: "RTE CAP",
        eta: "ETA CAP",
        nextCourse: "NEXT CAP"
      },
      units: {
        remain: "nmA",
        eta: "",
        nextCourse: "degN"
      },
      hideSeconds: true,
      ratioThresholdNormal: 1.25,
      ratioThresholdFlat: 4.4
    });
  });

  it("keeps next-course props available even when approach state is false", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      activeRouteRemain: 12,
      activeRouteEta: new Date("2026-03-06T11:45:00Z"),
      activeRouteNextCourse: 91,
      activeRouteApproaching: false
    }, toolkit);

    expect(out.renderer).toBe("ActiveRouteTextHtmlWidget");
    expect(out.display.isApproaching).toBe(false);
    expect(out.display.nextCourse).toBe(91);
    expect(out.captions.nextCourse).toBe("NEXT CAP");
    expect(out.units.nextCourse).toBe("degN");
  });

  it("maps activeRoute disconnect from raw connectionLost signal only", function () {
    const mapper = createMapper();

    const wpServerDown = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      wpServer: false
    }, toolkit);
    expect(wpServerDown.disconnect).toBe(false);

    const emptyName = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "   ",
      wpServer: true
    }, toolkit);
    expect(emptyName.disconnect).toBe(false);

    const disconnected = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      wpServer: true,
      disconnect: true
    }, toolkit);
    expect(disconnected.disconnect).toBe(true);
  });

  it("maps positions with lon/lat formatter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "positionBoat", positionBoat: [1, 2] }, toolkit);

    expect(out.formatter).toBe("formatLonLats");
    expect(out.value).toEqual([1, 2]);
    expect(out.renderer).toBe("PositionCoordinateWidget");
    expect(out.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(out.coordinateFormatterParameters).toEqual([]);

    const wp = mapper.translate({ kind: "positionWp", positionWp: { lon: 3, lat: 4 } }, toolkit);
    expect(wp.formatter).toBe("formatLonLats");
    expect(wp.renderer).toBe("PositionCoordinateWidget");
    expect(wp.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(wp.coordinateFormatterParameters).toEqual([]);
  });

  it("maps xteDisplay to XteDisplayWidget with normalized renderer props", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "xteDisplay",
      xte: "0.25",
      cog: "93",
      dtw: "1.2",
      btw: "91",
      wpName: "Fairway Buoy",
      disconnect: true,
      leadingZero: false,
      showWpNameXteDisplay: false,
      xteHideTextualMetrics: true,
      xteRatioThresholdNormal: "0.8",
      xteRatioThresholdFlat: "2.4"
    }, toolkit);

    expect(out.renderer).toBe("XteDisplayWidget");
    expect(out.xte).toBe(0.25);
    expect(out.cog).toBe(93);
    expect(out.dtw).toBe(1.2);
    expect(out.btw).toBe(91);
    expect(out.wpName).toBe("Fairway Buoy");
    expect(out.disconnect).toBe(true);
    expect(out.rendererProps).toEqual({
      xteCaption: "XTE CAP",
      trackCaption: "COG CAP",
      dtwCaption: "DST CAP",
      btwCaption: "BRG CAP",
      xteUnit: "nmX",
      trackUnit: "degT",
      dtwUnit: "nmD",
      btwUnit: "degM",
      headingUnit: "degT",
      leadingZero: false,
      showWpName: false,
      hideTextualMetrics: true,
      xteRatioThresholdNormal: 0.8,
      xteRatioThresholdFlat: 2.4
    });
  });

  it("defaults xteDisplay waypoint-name toggle to false when setting is absent", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "xteDisplay", xte: 0.2, cog: 90, dtw: 1.1, btw: 95 }, toolkit);
    expect(out.rendererProps.showWpName).toBe(false);
    expect(out.rendererProps.hideTextualMetrics).toBe(false);
  });

  it("maps routePoints to grouped renderer payload", function () {
    const mapper = createMapper();
    const editingRoute = {
      name: "  Harbor Run  ",
      points: [
        { name: "  Start  ", lat: "54.1", lon: "10.4" },
        { name: "  ", lat: "bad", lon: "bad" }
      ]
    };
    const out = mapper.translate({
      kind: "routePoints",
      editingRoute: editingRoute,
      editingIndex: "1",
      activeName: "  Harbor Run  ",
      routeShowLL: true,
      useRhumbLine: false,
      routePointsRatioThresholdNormal: "1.1",
      routePointsRatioThresholdFlat: "3.7",
      showHeader: true,
      distanceUnit: "nm",
      courseUnit: "°",
      waypointsText: "wps"
    }, toolkit);

    expect(out).toEqual({
      renderer: "RoutePointsTextHtmlWidget",
      domain: {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "1", lat: undefined, lon: undefined }
          ],
          sourceRoute: editingRoute
        },
        routeName: "Harbor Run",
        pointCount: 2,
        selectedIndex: 1,
        isActiveRoute: true,
        showLatLon: true,
        useRhumbLine: false
      },
      layout: {
        ratioThresholdNormal: 1.1,
        ratioThresholdFlat: 3.7,
        showHeader: true
      },
      formatting: {
        distanceUnit: "nm",
        courseUnit: "°",
        waypointsText: "wps"
      }
    });
  });

  it("maps routePoints with null route when editingRoute is missing", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "routePoints",
      editingRoute: null,
      showHeader: false,
      distanceUnit: "km",
      courseUnit: "deg",
      waypointsText: "points"
    }, toolkit);

    expect(out.domain.route).toBeNull();
    expect(out.domain.routeName).toBe("");
    expect(out.domain.pointCount).toBe(0);
    expect(out.layout.showHeader).toBe(false);
    expect(out.formatting).toEqual({
      distanceUnit: "km",
      courseUnit: "deg",
      waypointsText: "points"
    });
  });

  it("maps routePoints with empty points as a valid empty route payload", function () {
    const mapper = createMapper();
    const editingRoute = { name: "Empty", points: [] };
    const out = mapper.translate({
      kind: "routePoints",
      editingRoute: editingRoute,
      showHeader: true,
      distanceUnit: "nm",
      courseUnit: "°",
      waypointsText: "waypoints"
    }, toolkit);

    expect(out.domain.route).toEqual({
      name: "Empty",
      points: [],
      sourceRoute: editingRoute
    });
    expect(out.domain.pointCount).toBe(0);
  });

  it("maps editRoute to grouped renderer payload", function () {
    const mapper = createMapper();
    const eta = new Date("2026-03-06T11:45:00Z");
    const editingRoute = {
      name: "local@Harbor Run",
      points: [
        { lat: 54.1, lon: 10.4 },
        { lat: 54.2, lon: 10.5 }
      ],
      computeLength() {
        return 1512.2;
      }
    };
    const out = mapper.translate({
      kind: "editRoute",
      editingRoute: editingRoute,
      activeName: "local@Harbor Run",
      rteDistance: "4.8",
      rteEta: eta,
      hideSeconds: true,
      editRouteRatioThresholdNormal: "1.23",
      editRouteRatioThresholdFlat: "3.95"
    }, toolkit);

    expect(out).toEqual({
      renderer: "EditRouteTextHtmlWidget",
      domain: {
        hasRoute: true,
        routeName: "Harbor Run",
        pointCount: 2,
        totalDistance: 1512.2,
        remainingDistance: 4.8,
        eta: eta,
        hideSeconds: true,
        isActiveRoute: true,
        isLocalRoute: true,
        isServerRoute: false
      },
      layout: {
        ratioThresholdNormal: 1.23,
        ratioThresholdFlat: 3.95
      },
      captions: {
        pts: "PTS CAP",
        dst: "DST CAP",
        rte: "RTE CAP",
        eta: "ETA CAP"
      },
      units: {
        dst: "nmE",
        rte: "kmR"
      }
    });
  });

  it("maps editRoute with default RTE caption (not RTG) when configured defaults are used", function () {
    const mapper = createMapper();
    const defaultToolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
      caption_editRoutePts: "PTS",
      caption_editRouteDst: "DST",
      unit_editRouteDst: "nm",
      caption_editRouteRte: "RTE",
      unit_editRouteRte: "nm",
      caption_editRouteEta: "ETA"
    });
    const out = mapper.translate({
      kind: "editRoute",
      editingRoute: { name: "Harbor Run", points: [] }
    }, defaultToolkit);

    expect(out.captions.rte).toBe("RTE");
    expect(out.captions.rte).not.toBe("RTG");
  });

  it("maps editRoute safely when editingRoute is missing", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "editRoute",
      editingRoute: null,
      editRouteRatioThresholdNormal: "1.2",
      editRouteRatioThresholdFlat: "3.8"
    }, toolkit);

    expect(out).toEqual({
      renderer: "EditRouteTextHtmlWidget",
      domain: {
        hasRoute: false,
        routeName: "",
        pointCount: 0,
        totalDistance: undefined,
        remainingDistance: undefined,
        eta: undefined,
        hideSeconds: false,
        isActiveRoute: false,
        isLocalRoute: false,
        isServerRoute: false
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        pts: "PTS CAP",
        dst: "DST CAP",
        rte: "RTE CAP",
        eta: "ETA CAP"
      },
      units: {
        dst: "nmE",
        rte: "kmR"
      }
    });
  });

});
