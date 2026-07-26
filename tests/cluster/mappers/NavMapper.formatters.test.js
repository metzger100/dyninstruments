// @ts-check
const { makeToolkit, toolkit, createMapper, routeContext } = require("../../helpers/nav-mapper");

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
