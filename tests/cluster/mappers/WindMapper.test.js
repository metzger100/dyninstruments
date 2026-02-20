const { loadFresh } = require("../../helpers/load-umd");

function makeToolkit() {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
    caption_angleTrue: "TWA",
    unit_angleTrue: "°",
    caption_speedTrue: "TWS",
    unit_speedTrue: "kn",
    caption_angleApparent: "AWA",
    unit_angleApparent: "°"
  });
}

describe("WindMapper", function () {
  it("maps graphic true wind to WindDialWidget props", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleTrueGraphic",
      twa: -32,
      tws: 6.1,
      angleCaption_TWA: "TWA",
      speedCaption_TWS: "TWS",
      angleUnitGraphic: "°",
      speedUnitGraphic: "kn",
      windLayEnabled: true,
      layMin: "20",
      layMax: "42",
      dialRatioThresholdNormal: "0.7",
      dialRatioThresholdFlat: "2.1",
      captionUnitScale: "0.8",
      leadingZero: true
    }, makeToolkit());

    expect(out.renderer).toBe("WindDialWidget");
    expect(out.angle).toBe(-32);
    expect(out.speed).toBe(6.1);
    expect(out.formatter).toBe("formatSpeed");
    expect(out.formatterParameters).toEqual(["kn"]);
    expect(out.layEnabled).toBe(true);
    expect(out.layMin).toBe(20);
    expect(out.layMax).toBe(42);
    expect(out.leadingZero).toBe(true);
  });

  it("maps numeric true angle via angle formatter function", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleTrue",
      twa: -181,
      leadingZero: true,
      default: "---"
    }, makeToolkit());

    expect(typeof out.formatter).toBe("function");
    expect(out.caption).toBe("TWA");
    expect(out.unit).toBe("°");
    expect(out.formatter(-181)).toBe("179");
  });

  it("maps numeric speed to formatSpeed with unit parameter", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({ kind: "speedTrue", tws: 7.2 }, makeToolkit());

    expect(out).toEqual({
      value: 7.2,
      caption: "TWS",
      unit: "kn",
      formatter: "formatSpeed",
      formatterParameters: ["kn"]
    });
  });

  it("returns empty object for unknown kind", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    expect(mapper.translate({ kind: "x" }, makeToolkit())).toEqual({});
  });
});
