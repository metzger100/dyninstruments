const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

/** @param {Record<string, any>} [overrides] @param {Record<string, any>} [bindingOverrides] */
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

/** @param {any} kind @param {any} activeToolkit @param {any} [viewModel] */
function routeContext(kind, activeToolkit, viewModel) {
  return makeRouteContext({
    routeId: "nav:" + kind,
    cluster: "nav",
    kind: kind,
    toolkit: activeToolkit,
    viewModel: viewModel
  });
}

describe("NavMapper", function () {
  it("maps ETA kinds with formatTime", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "wpEta", wpEta: 1700000000 }, routeContext("wpEta", toolkit)).formatter).toBe(
      "formatTime"
    );
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100 }, routeContext("rteEta", toolkit)).formatter).toBe(
      "formatTime"
    );
  });

  it("maps ETA kinds with formatClock when hideSeconds is enabled", function () {
    const mapper = createMapper();
    expect(
      mapper.translate({ kind: "wpEta", wpEta: 1700000000, hideSeconds: true }, routeContext("wpEta", toolkit))
        .formatter
    ).toBe("formatClock");
    expect(
      mapper.translate({ kind: "rteEta", rteEta: 1700000100, hideSeconds: true }, routeContext("rteEta", toolkit))
        .formatter
    ).toBe("formatClock");
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
    const customToolkit = makeToolkit(
      {
        caption_dst: "DST",
        formatUnit_dst: undefined,
        unit_dst_km: "kilometers custom",
        caption_rteDistance: "RTE",
        formatUnit_rteDistance: undefined,
        unit_rteDistance_ft: "feet custom",
        caption_vmg: "VMG",
        formatUnit_vmg: undefined,
        unit_vmg_ms: "m/s custom"
      },
      {
        dst: { defaultToken: "km" },
        rteDistance: { defaultToken: "ft" },
        vmg: { defaultToken: "ms" }
      }
    );

    expect(mapper.translate({ kind: "dst", dst: 3.4 }, routeContext("dst", customToolkit))).toEqual({
      value: 3.4,
      caption: "DST",
      unit: "kilometers custom",
      formatter: "formatDistance",
      formatterParameters: ["km"],
      disconnect: false
    });

    expect(
      mapper.translate({ kind: "rteDistance", rteDistance: 12.3 }, routeContext("rteDistance", customToolkit))
    ).toEqual({
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

  it("owns XTE waypoint and positive-scale normalization at the mapper boundary", function () {
    const mapper = createMapper();
    const customToolkit = makeToolkit({
      xteDisplayScale_nm: "0",
      xteLinearScale_nm: "invalid"
    });

    const highway = mapper.translate(
      { kind: "xteDisplay", wpName: "  Harbor  " },
      routeContext("xteDisplay", customToolkit)
    );
    const linear = mapper.translate(
      { kind: "xteDisplayLinear", wpName: "   " },
      routeContext("xteDisplayLinear", customToolkit)
    );

    expect(highway.display.wpName).toBe("Harbor");
    expect(highway.xteScale).toBe(1);
    expect(linear.display.wpName).toBe("");
    expect(linear.xteScale).toBe(1);
  });
});
