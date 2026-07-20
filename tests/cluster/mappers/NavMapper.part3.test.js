// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

function makeToolkit(overrides, bindingOverrides) {
  installUnitFormatFamilies(bindingOverrides);
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js")
    .create()
    .createToolkit(
      Object.assign(
        {
          caption_wpEta: "WP ETA",
          unit_wpEta: "",
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
          caption_xteDisplayLinearXte: "XTE LIN CAP",
          formatUnit_xteDisplayLinearXte: "nm",
          unit_xteDisplayLinearXte_nm: "nmXL",
          caption_xteDisplayLinearCog: "COG LIN CAP",
          unit_xteDisplayLinearCog: "degLT",
          caption_xteDisplayLinearDst: "DST LIN CAP",
          formatUnit_xteDisplayLinearDst: "nm",
          unit_xteDisplayLinearDst_nm: "nmDL",
          caption_xteDisplayLinearBrg: "BRG LIN CAP",
          unit_xteDisplayLinearBrg: "degLM",
          xteLinearScale_nm: "0.9",
          caption_editRoutePts: "PTS CAP",
          caption_editRouteDst: "DST CAP",
          formatUnit_editRouteDst: "nm",
          unit_editRouteDst_nm: "nmE",
          caption_editRouteRte: "RTE CAP",
          formatUnit_editRouteRte: "km",
          unit_editRouteRte_km: "kmR",
          caption_editRouteEta: "ETA CAP"
        },
        overrides || {}
      )
    );
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
  if (typeof value === "undefined" || value === null) {
    return undefined;
  }
  if (typeof value === "string" && value.trim() === "") {
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
          rteEta: props.activeRouteEta,
          nextCourse: toMaybeNumber(props.activeRouteNextCourse),
          isApproaching: props.activeRouteApproaching === true
        },
        routeName: trimText(props.activeRouteName),
        captions: {
          remain: "RTE CAP",
          rteEta: "ETA CAP",
          nextCourse: "NEXT CAP"
        },
        units: {
          remain: "nmA",
          rteEta: "",
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
      const points =
        editingRoute && Array.isArray(editingRoute.points)
          ? editingRoute.points.map(function (point, index) {
              return {
                name: trimText(point.name) || String(index),
                lat: toMaybeNumber(point.lat),
                lon: toMaybeNumber(point.lon)
              };
            })
          : [];

      return {
        route: editingRoute
          ? {
              name: routeName,
              points: points,
              sourceRoute: editingRoute
            }
          : null,
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
        route: editingRoute
          ? {
              displayName: routeName,
              pointCount: pointCount,
              totalDistance:
                editingRoute && typeof editingRoute.computeLength === "function"
                  ? editingRoute.computeLength()
                  : undefined,
              isLocalRoute: isLocalRoute,
              isServerRoute: isServerRoute
            }
          : null,
        remainingDistance: toMaybeNumber(props.rteDistance),
        rteEta: props.rteEta,
        hideSeconds: props.hideSeconds === true,
        isActiveRoute: !!editingRoute && trimText(props.activeName) === trimText(editingRoute.name),
        isLocalRoute: isLocalRoute,
        isServerRoute: isServerRoute
      };
    }
  };
}

describe("NavMapper", function () {
  it("maps activeRoute disconnect from raw connectionLost signal only", function () {
    const mapper = createMapper();
    const activeRouteViewModel = makeActiveRouteViewModel();

    const wpServerDown = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        wpServer: false
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
    expect(wpServerDown.wpServer).toBe(false);
    expect(wpServerDown.display.disconnect).toBe(false);

    const emptyName = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "   ",
        wpServer: true
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
    expect(emptyName.display.disconnect).toBe(false);

    const disconnected = mapper.translate(
      {
        kind: "activeRoute",
        activeRouteName: "Harbor Run",
        wpServer: true,
        disconnect: true
      },
      routeContext("activeRoute", toolkit, activeRouteViewModel)
    );
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

    const wp = mapper.translate(
      { kind: "positionWp", positionWp: { lon: 3, lat: 4 } },
      routeContext("positionWp", toolkit)
    );
    expect(wp.formatter).toBe("formatLonLats");
    expect(wp).not.toHaveProperty("renderer");
    expect(wp.coordinateFormatter).toBe("formatLonLatsDecimal");
    expect(wp.coordinateFormatterParameters).toEqual([]);
    expect(wp.disconnect).toBe(false);
  });

  it("maps disconnect for dst and positionWp so memo signatures can change on WP link loss", function () {
    const mapper = createMapper();

    const dstConnected = mapper.translate({ kind: "dst", dst: 1.2, disconnect: false }, routeContext("dst", toolkit));
    const dstDisconnected = mapper.translate({ kind: "dst", dst: 1.2, disconnect: true }, routeContext("dst", toolkit));
    expect(dstConnected.disconnect).toBe(false);
    expect(dstDisconnected.disconnect).toBe(true);
    expect(JSON.stringify(dstConnected)).not.toBe(JSON.stringify(dstDisconnected));

    const positionConnected = mapper.translate(
      {
        kind: "positionWp",
        positionWp: { lon: 3, lat: 4 },
        disconnect: false
      },
      routeContext("positionWp", toolkit)
    );
    const positionDisconnected = mapper.translate(
      {
        kind: "positionWp",
        positionWp: { lon: 3, lat: 4 },
        disconnect: true
      },
      routeContext("positionWp", toolkit)
    );
    expect(positionConnected.disconnect).toBe(false);
    expect(positionDisconnected.disconnect).toBe(true);
    expect(JSON.stringify(positionConnected)).not.toBe(JSON.stringify(positionDisconnected));
  });
});
