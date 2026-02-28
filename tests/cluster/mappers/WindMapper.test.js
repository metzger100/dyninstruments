const { loadFresh } = require("../../helpers/load-umd");

function makeToolkit() {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
    caption_angleTrue: "TWA",
    unit_angleTrue: "°",
    caption_speedTrue: "TWS",
    unit_speedTrue: "kn",
    caption_angleApparent: "AWA",
    unit_angleApparent: "°",
    caption_angleTrueGraphicAngle: "TWA G",
    unit_angleTrueGraphicAngle: "°T",
    caption_angleTrueGraphicSpeed: "TWS G",
    unit_angleTrueGraphicSpeed: "knT",
    caption_angleApparentGraphicAngle: "AWA G",
    unit_angleApparentGraphicAngle: "°A",
    caption_angleApparentGraphicSpeed: "AWS G",
    unit_angleApparentGraphicSpeed: "knA"
  });
}

describe("WindMapper", function () {
  it("maps graphic true wind to WindDialWidget props", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleTrueGraphic",
      twa: -32,
      tws: 6.1,
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
    expect(out.rendererProps.angleCaption).toBe("TWA G");
    expect(out.rendererProps.speedCaption).toBe("TWS G");
    expect(out.rendererProps.angleUnit).toBe("°T");
    expect(out.rendererProps.speedUnit).toBe("knT");
    expect(out.rendererProps.formatter).toBe("formatSpeed");
    expect(out.rendererProps.formatterParameters).toEqual(["knT"]);
    expect(out.rendererProps.layEnabled).toBe(true);
    expect(out.rendererProps.layMin).toBe(20);
    expect(out.rendererProps.layMax).toBe(42);
    expect(out.rendererProps.leadingZero).toBe(true);
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

  it("maps graphic apparent wind to apparent composite caption/unit keys", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleApparentGraphic",
      awa: 18,
      aws: 8.5
    }, makeToolkit());

    expect(out.angle).toBe(18);
    expect(out.speed).toBe(8.5);
    expect(out.rendererProps.angleCaption).toBe("AWA G");
    expect(out.rendererProps.speedCaption).toBe("AWS G");
    expect(out.rendererProps.angleUnit).toBe("°A");
    expect(out.rendererProps.speedUnit).toBe("knA");
    expect(out.rendererProps.formatterParameters).toEqual(["knA"]);
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
