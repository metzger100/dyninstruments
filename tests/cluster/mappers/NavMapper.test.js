const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

function makeToolkit(overrides, bindingOverrides) {
  installUnitFormatFamilies(bindingOverrides);
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit(Object.assign({
    caption_eta: "ETA",
    unit_eta: "",
    caption_rteDistance: "RTE",
    formatUnit_rteDistance: "nm",
    unit_rteDistance_nm: "nm",
    caption_vmg: "VMG",
    formatUnit_vmg: "kn",
    unit_vmg_kn: "kn",
    caption_activeRouteRemain: "RTE CAP",
    formatUnit_activeRouteRemain: "nm",
    unit_activeRouteRemain_nm: "nmA",
    caption_activeRouteEta: "ETA CAP",
    unit_activeRouteEta: "",
    caption_activeRouteNextCourse: "NEXT CAP",
    unit_activeRouteNextCourse: "degN",
    caption_positionBoat: "POS",
    unit_positionBoat: "",
    caption_xteDisplayXte: "XTE CAP",
    formatUnit_xteDisplayXte: "nm",
    unit_xteDisplayXte_nm: "nmX",
    caption_xteDisplayCog: "COG CAP",
    unit_xteDisplayCog: "degT",
    caption_xteDisplayDst: "DST CAP",
    formatUnit_xteDisplayDst: "nm",
    unit_xteDisplayDst_nm: "nmD",
    caption_xteDisplayBrg: "BRG CAP",
    unit_xteDisplayBrg: "degM",
    xteDisplayScale_nm: "0.8",
    caption_editRoutePts: "PTS CAP",
    caption_editRouteDst: "DST CAP",
    formatUnit_editRouteDst: "nm",
    unit_editRouteDst_nm: "nmE",
    caption_editRouteRte: "RTE CAP",
    formatUnit_editRouteRte: "km",
    unit_editRouteRte_km: "kmR",
    caption_editRouteEta: "ETA CAP"
  }, overrides || {}));
}

const toolkit = makeToolkit();

function createMapper() {
  return loadFresh("cluster/mappers/NavMapper.js").create();
}

function routeContext(kind, activeToolkit, viewModel) {
  return makeRouteContext({
    routeId: "nav:" + kind,
    cluster: "nav",
    kind: kind,
    toolkit: activeToolkit,
    viewModel: viewModel
  });
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toMaybeNumber(value) {
  if (typeof value === "undefined" || value === null || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function makeActiveRouteViewModel() {
  return {
    build(props) {
      return {
        display: {
          remain: toMaybeNumber(props.activeRouteRemain),
          eta: props.activeRouteEta,
          nextCourse: toMaybeNumber(props.activeRouteNextCourse),
          isApproaching: props.activeRouteApproaching === true
        },
        routeName: trimText(props.activeRouteName),
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
        formatUnits: {
          remain: "nm"
        },
        hideSeconds: props.hideSeconds === true
      };
    }
  };
}

function makeRoutePointsViewModel() {
  return {
    build(props) {
      const editingRoute = props.editingRoute;
      const routeName = editingRoute ? trimText(editingRoute.name) : "";
      const points = editingRoute && Array.isArray(editingRoute.points)
        ? editingRoute.points.map(function (point, index) {
          return {
            name: trimText(point.name) || String(index),
            lat: toMaybeNumber(point.lat),
            lon: toMaybeNumber(point.lon)
          };
        })
        : [];

      return {
        route: editingRoute ? {
          name: routeName,
          points: points,
          sourceRoute: editingRoute
        } : null,
        selectedIndex: typeof props.editingIndex === "undefined" ? undefined : Number(props.editingIndex),
        isActiveRoute: trimText(props.activeName) === routeName,
        showLatLon: props.routeShowLL === true,
        useRhumbLine: props.useRhumbLine === true
      };
    }
  };
}

function makeEditRouteViewModel() {
  return {
    build(props) {
      const editingRoute = props.editingRoute;
      const routeName = editingRoute ? trimText(editingRoute.name).replace(/^local@/, "") : "";
      const pointCount = editingRoute && Array.isArray(editingRoute.points) ? editingRoute.points.length : 0;
      const isLocalRoute = !!(editingRoute && /^local@/.test(editingRoute.name));
      const isServerRoute = !!(editingRoute && /^server@/.test(editingRoute.name));

      return {
        hasRoute: !!editingRoute,
        route: editingRoute ? {
          displayName: routeName,
          pointCount: pointCount,
          totalDistance: editingRoute && typeof editingRoute.computeLength === "function" ? editingRoute.computeLength() : undefined,
          isLocalRoute: isLocalRoute,
          isServerRoute: isServerRoute
        } : null,
        remainingDistance: toMaybeNumber(props.rteDistance),
        eta: props.rteEta,
        hideSeconds: props.hideSeconds === true,
        isActiveRoute: !!editingRoute && trimText(props.activeName) === trimText(editingRoute.name),
        isLocalRoute: isLocalRoute,
        isServerRoute: isServerRoute
      };
    }
  };
}

describe("NavMapper", function () {
  it("maps ETA kinds with formatTime", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "eta", eta: 1700000000 }, routeContext("eta", toolkit)).formatter).toBe("formatTime");
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100 }, routeContext("rteEta", toolkit)).formatter).toBe("formatTime");
  });

  it("maps ETA kinds with formatClock when hideSeconds is enabled", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "eta", eta: 1700000000, hideSeconds: true }, routeContext("eta", toolkit)).formatter).toBe("formatClock");
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100, hideSeconds: true }, routeContext("rteEta", toolkit)).formatter).toBe("formatClock");
  });

  it("maps distance kinds with formatDistance", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "rteDistance", rteDistance: 12.3 }, routeContext("rteDistance", toolkit));

    expect(out).toEqual({
      value: 12.3,
      caption: "RTE",
      unit: "nm",
      formatter: "formatDistance",
      formatterParameters: ["nm"]
    });
  });

  it("keeps plain nav distance and speed formatter tokens separate from display labels", function () {
    const mapper = createMapper();
    const customToolkit = makeToolkit({
      caption_dst: "DST",
      formatUnit_dst: undefined,
      unit_dst_km: "kilometers custom",
      caption_rteDistance: "RTE",
      formatUnit_rteDistance: undefined,
      unit_rteDistance_ft: "feet custom",
      caption_vmg: "VMG",
      formatUnit_vmg: undefined,
      unit_vmg_ms: "m/s custom"
    }, {
      dst: { defaultToken: "km" },
      rteDistance: { defaultToken: "ft" },
      vmg: { defaultToken: "ms" }
    });

    expect(mapper.translate({ kind: "dst", dst: 3.4 }, routeContext("dst", customToolkit))).toEqual({
      value: 3.4,
      caption: "DST",
      unit: "kilometers custom",
      formatter: "formatDistance",
      formatterParameters: ["km"]
    });

    expect(mapper.translate({ kind: "rteDistance", rteDistance: 12.3 }, routeContext("rteDistance", customToolkit))).toEqual({
      value: 12.3,
      caption: "RTE",
      unit: "feet custom",
      formatter: "formatDistance",
      formatterParameters: ["ft"]
    });

    expect(mapper.translate({ kind: "vmg", vmg: 4.2 }, routeContext("vmg", customToolkit))).toEqual({
      value: 4.2,
      caption: "VMG",
      unit: "m/s custom",
      formatter: "formatSpeed",
      formatterParameters: ["ms"]
    });
  });

  it("maps VMG using speed formatter and unit parameter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "vmg", vmg: 4.2 }, routeContext("vmg", toolkit));

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
    const activeRouteViewModel = makeActiveRouteViewModel();
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
    }, routeContext("activeRoute", toolkit, activeRouteViewModel));

    expect(out).toEqual({
      wpServer: true,
      display: {
        remain: 18.2,
        eta: rawEta,
        nextCourse: 93,
        isApproaching: true,
        routeName: "Harbor Run",
        disconnect: true,
        hideSeconds: true
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
      formatUnits: {
        remain: "nm"
      },
      ratioThresholdNormal: 1.25,
      ratioThresholdFlat: 4.4
    });
  });

  it("keeps next-course props available even when approach state is false", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();
    const out = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      activeRouteRemain: 12,
      activeRouteEta: new Date("2026-03-06T11:45:00Z"),
      activeRouteNextCourse: 91,
      activeRouteApproaching: false
    }, routeContext("activeRoute", toolkit, activeRouteViewModel));

    expect(out).not.toHaveProperty("renderer");
    expect(out.display.isApproaching).toBe(false);
    expect(out.display.nextCourse).toBe(91);
    expect(out.captions.nextCourse).toBe("NEXT CAP");
    expect(out.units.nextCourse).toBe("degN");
  });

  it("maps activeRoute disconnect from raw connectionLost signal only", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();

    const wpServerDown = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      wpServer: false
    }, routeContext("activeRoute", toolkit, activeRouteViewModel));
    expect(wpServerDown.wpServer).toBe(false);
    expect(wpServerDown.display.disconnect).toBe(false);

    const emptyName = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "   ",
      wpServer: true
    }, routeContext("activeRoute", toolkit, activeRouteViewModel));
    expect(emptyName.display.disconnect).toBe(false);

    const disconnected = mapper.translate({
      kind: "activeRoute",
      activeRouteName: "Harbor Run",
      wpServer: true,
      disconnect: true
    }, routeContext("activeRoute", toolkit, activeRouteViewModel));
    expect(disconnected.display.disconnect).toBe(true);
  });

  it("maps positions with lon/lat formatter", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "positionBoat", positionBoat: [1, 2] }, routeContext("positionBoat", toolkit));

    expect(out.formatter).toBe("formatLonLats");
    expect(out.value).toEqual([1, 2]);
    expect(out).not.toHaveProperty("renderer");
    expect(out.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(out.coordinateFormatterParameters).toEqual([]);

    const wp = mapper.translate({ kind: "positionWp", positionWp: { lon: 3, lat: 4 } }, routeContext("positionWp", toolkit));
    expect(wp.formatter).toBe("formatLonLats");
    expect(wp).not.toHaveProperty("renderer");
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
    }, routeContext("xteDisplay", toolkit));

    expect(out).not.toHaveProperty("renderer");
    expect(out.display).toEqual({
      xte: 0.25,
      cog: 93,
      dtw: 1.2,
      btw: 91,
      wpName: "Fairway Buoy",
      disconnect: true
    });
    expect(out.captions).toEqual({
      xte: "XTE CAP",
      track: "COG CAP",
      dtw: "DST CAP",
      brg: "BRG CAP"
    });
    expect(out.units).toEqual({
      xte: "nmX",
      track: "degT",
      dtw: "nmD",
      brg: "degM"
    });
    expect(out.formatUnits).toEqual({
      xte: "nm",
      dtw: "nm"
    });
    expect(out.xteScale).toBe(0.8);
    expect(out.layout).toEqual({
      leadingZero: false,
      showWpName: false,
      hideTextualMetrics: true,
      xteRatioThresholdNormal: 0.8,
      xteRatioThresholdFlat: 2.4,
      easing: true
    });
    expect(out.stableDigits).toBe(false);
  });

  it("defaults xteDisplay waypoint-name toggle to false when setting is absent", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "xteDisplay", xte: 0.2, cog: 90, dtw: 1.1, btw: 95 }, routeContext("xteDisplay", toolkit));
    expect(out.layout.showWpName).toBe(false);
    expect(out.layout.hideTextualMetrics).toBe(false);
  });

  it("maps routePoints to grouped renderer payload", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
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
      courseUnit: "°",
      waypointsText: "wps"
    }, routeContext("routePoints", toolkit, routePointsViewModel));

    expect(out).toEqual({
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
        courseUnit: "°",
        waypointsText: "wps"
      },
      units: {
        distance: "nm"
      },
      formatUnits: {
        distance: "nm"
      }
    });
  });

  it("maps routePoints with null route when editingRoute is missing", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
    const out = mapper.translate({
      kind: "routePoints",
      editingRoute: null,
      showHeader: false,
      courseUnit: "deg",
      waypointsText: "points"
    }, routeContext("routePoints", toolkit, routePointsViewModel));

    expect(out.domain.route).toBeNull();
    expect(out.domain.routeName).toBe("");
    expect(out.domain.pointCount).toBe(0);
    expect(out.layout.showHeader).toBe(false);
    expect(out.formatting).toEqual({
      courseUnit: "deg",
      waypointsText: "points"
    });
    expect(out.units).toEqual({
      distance: "nm"
    });
    expect(out.formatUnits).toEqual({
      distance: "nm"
    });
  });

  it("maps routePoints with empty points as a valid empty route payload", function () {
    const mapper = createMapper();
    const routePointsViewModel = makeRoutePointsViewModel();
    const editingRoute = { name: "Empty", points: [] };
    const out = mapper.translate({
      kind: "routePoints",
      editingRoute: editingRoute,
      showHeader: true,
      courseUnit: "°",
      waypointsText: "waypoints"
    }, routeContext("routePoints", toolkit, routePointsViewModel));

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
    const editRouteViewModel = makeEditRouteViewModel();
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
    }, routeContext("editRoute", toolkit, editRouteViewModel));

    expect(out).toEqual({
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
      },
      formatUnits: {
        dst: "nm",
        rte: "km"
      }
    });
  });

  it("maps editRoute with default RTE caption (not RTG) when configured defaults are used", function () {
    const mapper = createMapper();
    const defaultToolkit = makeToolkit({
      caption_editRoutePts: "PTS",
      caption_editRouteDst: "DST",
      formatUnit_editRouteDst: undefined,
      unit_editRouteDst_nm: "nm",
      caption_editRouteRte: "RTE",
      formatUnit_editRouteRte: undefined,
      unit_editRouteRte_nm: "nm",
      caption_editRouteEta: "ETA"
    }, {
      editRouteDst: { defaultToken: "nm" },
      editRouteRte: { defaultToken: "nm" },
      activeRouteRemain: { defaultToken: "nm" },
      xteDisplayXte: { defaultToken: "nm" },
      xteDisplayDst: { defaultToken: "nm" },
      routePointsDistance: { defaultToken: "nm" }
    });
    const editRouteViewModel = makeEditRouteViewModel();
    const out = mapper.translate({
      kind: "editRoute",
      editingRoute: { name: "Harbor Run", points: [] }
    }, routeContext("editRoute", defaultToolkit, editRouteViewModel));

    expect(out.captions.rte).toBe("RTE");
    expect(out.captions.rte).not.toBe("RTG");
  });

  it("maps editRoute safely when editingRoute is missing", function () {
    const mapper = createMapper();
    const editRouteViewModel = makeEditRouteViewModel();
    const out = mapper.translate({
      kind: "editRoute",
      editingRoute: null,
      editRouteRatioThresholdNormal: "1.2",
      editRouteRatioThresholdFlat: "3.8"
    }, routeContext("editRoute", toolkit, editRouteViewModel));

    expect(out).toEqual({
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
      },
      formatUnits: {
        dst: "nm",
        rte: "km"
      }
    });
  });

});
