const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_eta: "ETA",
  unit_eta: "",
  caption_rteDistance: "RTE",
  unit_rteDistance: "nm",
  caption_vmg: "VMG",
  unit_vmg: "kn",
  caption_positionBoat: "POS",
  unit_positionBoat: "",
  caption_xteDisplayXte: "XTE CAP",
  unit_xteDisplayXte: "nmX",
  caption_xteDisplayCog: "COG CAP",
  unit_xteDisplayCog: "degT",
  caption_xteDisplayDst: "DST CAP",
  unit_xteDisplayDst: "nmD",
  caption_xteDisplayBrg: "BRG CAP",
  unit_xteDisplayBrg: "degM"
});

describe("NavMapper", function () {
  it("maps ETA kinds with formatTime", function () {
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
    expect(mapper.translate({ kind: "eta", eta: 1700000000 }, toolkit).formatter).toBe("formatTime");
    expect(mapper.translate({ kind: "rteEta", rteEta: 1700000100 }, toolkit).formatter).toBe("formatTime");
  });

  it("maps distance kinds with formatDistance", function () {
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
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
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
    const out = mapper.translate({ kind: "vmg", vmg: 4.2 }, toolkit);

    expect(out).toEqual({
      value: 4.2,
      caption: "VMG",
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
  });

  it("maps positions with lon/lat formatter", function () {
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
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
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
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
      xteRatioThresholdNormal: 0.8,
      xteRatioThresholdFlat: 2.4
    });
  });

  it("defaults xteDisplay waypoint-name toggle to false when setting is absent", function () {
    const mapper = loadFresh("cluster/mappers/NavMapper.js").create();
    const out = mapper.translate({ kind: "xteDisplay", xte: 0.2, cog: 90, dtw: 1.1, btw: 95 }, toolkit);
    expect(out.rendererProps.showWpName).toBe(false);
  });
});
