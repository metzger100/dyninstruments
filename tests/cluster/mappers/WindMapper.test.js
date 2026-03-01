const { loadFresh } = require("../../helpers/load-umd");

function makeToolkit() {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
    caption_angleTrue: "TWA",
    unit_angleTrue: "°",
    caption_speedTrue: "TWS",
    unit_speedTrue: "kn",
    caption_angleApparent: "AWA",
    unit_angleApparent: "°",
    caption_angleTrueRadialAngle: "TWA G",
    unit_angleTrueRadialAngle: "°T",
    caption_angleTrueRadialSpeed: "TWS G",
    unit_angleTrueRadialSpeed: "knT",
    caption_angleApparentRadialAngle: "AWA G",
    unit_angleApparentRadialAngle: "°A",
    caption_angleApparentRadialSpeed: "AWS G",
    unit_angleApparentRadialSpeed: "knA"
  });
}

describe("WindMapper", function () {
  it("maps radial true wind to WindRadialWidget props", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleTrueRadial",
      twa: -32,
      tws: 6.1,
      windRadialLayEnabled: true,
      windRadialLayMin: "20",
      windRadialLayMax: "42",
      windRadialRatioThresholdNormal: "0.7",
      windRadialRatioThresholdFlat: "2.1",
      captionUnitScale: "0.8",
      leadingZero: true
    }, makeToolkit());

    expect(out.renderer).toBe("WindRadialWidget");
    expect(out.angle).toBe(-32);
    expect(out.speed).toBe(6.1);
    expect(out.rendererProps.angleCaption).toBe("TWA G");
    expect(out.rendererProps.speedCaption).toBe("TWS G");
    expect(out.rendererProps.angleUnit).toBe("°T");
    expect(out.rendererProps.speedUnit).toBe("knT");
    expect(out.rendererProps.formatter).toBe("formatSpeed");
    expect(out.rendererProps.formatterParameters).toEqual(["knT"]);
    expect(out.rendererProps.layEnabled).toBe(true);
    expect(out.rendererProps.windRadialLayMin).toBe(20);
    expect(out.rendererProps.windRadialLayMax).toBe(42);
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

  it("maps radial apparent wind to apparent composite caption/unit keys", function () {
    const mapper = loadFresh("cluster/mappers/WindMapper.js").create();
    const out = mapper.translate({
      kind: "angleApparentRadial",
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
