const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_eta: "ETA",
  unit_eta: "",
  caption_rteDistance: "RTE",
  unit_rteDistance: "nm",
  caption_vmg: "VMG",
  unit_vmg: "kn",
  caption_positionBoat: "POS",
  unit_positionBoat: ""
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

    const wp = mapper.translate({ kind: "positionWp", positionWp: { lon: 3, lat: 4 } }, toolkit);
    expect(wp.formatter).toBe("formatLonLats");
    expect(wp.renderer).toBe("PositionCoordinateWidget");
  });
});
