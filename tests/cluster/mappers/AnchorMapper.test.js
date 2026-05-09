const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

function makeToolkit(overrides, bindingOverrides) {
  installUnitFormatFamilies(bindingOverrides);
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit(Object.assign({
    caption_anchorDistance: "ANCHOR",
    caption_anchorWatch: "AWATCH",
    caption_anchorBearing: "ABRG",
    unit_anchorBearing: "°"
  }, overrides || {}));
}

const toolkit = makeToolkit();

function routeContext(kind, activeToolkit) {
  return makeRouteContext({
    routeId: "anchor:" + kind,
    cluster: "anchor",
    kind: kind,
    toolkit: activeToolkit
  });
}

describe("AnchorMapper", function () {
  it("maps distance/watch to formatDistance with per-kind units", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();

    expect(mapper.translate({ kind: "anchorDistance", distance: 10 }, routeContext("anchorDistance", toolkit))).toEqual({
      value: 10,
      caption: "ANCHOR",
      unit: "m",
      formatter: "formatDistance",
      formatterParameters: ["m"]
    });

    expect(mapper.translate({ kind: "anchorWatch", watch: 20 }, routeContext("anchorWatch", toolkit)).formatterParameters).toEqual(["m"]);
  });

  it("uses the shared binding default token when distance selectors are missing", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();
    const customToolkit = makeToolkit({
      unit_anchorDistance_yd: "yd custom",
      unit_anchorWatch_yd: "yd custom"
    }, {
      anchorDistance: { defaultToken: "yd" },
      anchorWatch: { defaultToken: "yd" }
    });

    expect(mapper.translate({ kind: "anchorDistance", distance: 10 }, routeContext("anchorDistance", customToolkit))).toEqual({
      value: 10,
      caption: "ANCHOR",
      unit: "yd custom",
      formatter: "formatDistance",
      formatterParameters: ["yd"]
    });
    expect(mapper.translate({ kind: "anchorWatch", watch: 20 }, routeContext("anchorWatch", customToolkit))).toEqual({
      value: 20,
      caption: "AWATCH",
      unit: "yd custom",
      formatter: "formatDistance",
      formatterParameters: ["yd"]
    });
  });

  it("maps bearing to direction formatter", function () {
    const mapper = loadFresh("cluster/mappers/AnchorMapper.js").create();
    const out = mapper.translate({ kind: "anchorBearing", bearing: 5, leadingZero: true }, routeContext("anchorBearing", toolkit));

    expect(out).toEqual({
      value: 5,
      caption: "ABRG",
      unit: "°",
      formatter: "formatDirection360",
      formatterParameters: [true]
    });
  });
});
