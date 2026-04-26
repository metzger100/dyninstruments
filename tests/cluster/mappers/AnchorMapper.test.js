const { loadFresh } = require("../../helpers/load-umd");

loadFresh("shared/unit-format-families.js");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_anchorDistance: "ANCHOR",
  caption_anchorWatch: "AWATCH",
  caption_anchorBearing: "ABRG",
  unit_anchorBearing: "°"
});

describe("AnchorMapper", function () {
  it("maps distance/watch to formatDistance with per-kind units", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();

    expect(mapper.translate({ kind: "anchorDistance", distance: 10 }, toolkit)).toEqual({
      value: 10,
      caption: "ANCHOR",
      unit: "m",
      formatter: "formatDistance",
      formatterParameters: ["m"]
    });

    expect(mapper.translate({ kind: "anchorWatch", watch: 20 }, toolkit).formatterParameters).toEqual(["m"]);
  });

  it("maps bearing to direction formatter", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();
    const out = mapper.translate({ kind: "anchorBearing", bearing: 5, leadingZero: true }, toolkit);

    expect(out).toEqual({
      value: 5,
      caption: "ABRG",
      unit: "°",
      formatter: "formatDirection360",
      formatterParameters: [true]
    });
  });
});
