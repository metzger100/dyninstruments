const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_distance: "ANCHOR",
  unit_distance: "m",
  caption_watch: "AWATCH",
  unit_watch: "m",
  caption_bearing: "ABRG",
  unit_bearing: "°"
});

describe("AnchorMapper", function () {
  it("maps distance/watch to formatDistance with per-kind units", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();

    expect(mapper.translate({ kind: "distance", distance: 10 }, toolkit)).toEqual({
      value: 10,
      caption: "ANCHOR",
      unit: "m",
      formatter: "formatDistance",
      formatterParameters: ["m"]
    });

    expect(mapper.translate({ kind: "watch", watch: 20 }, toolkit).formatterParameters).toEqual(["m"]);
  });

  it("maps bearing to direction formatter", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();
    const out = mapper.translate({ kind: "bearing", bearing: 5, leadingZero: true }, toolkit);

    expect(out).toEqual({
      value: 5,
      caption: "ABRG",
      unit: "°",
      formatter: "formatDirection360",
      formatterParameters: [true]
    });
  });
});
