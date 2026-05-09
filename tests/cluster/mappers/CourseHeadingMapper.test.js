const { loadFresh } = require("../../helpers/load-umd");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_hdtRadial: "HDT",
  unit_hdtRadial: "°",
  caption_hdtLinear: "HDT L",
  unit_hdtLinear: "°L",
  caption_brg: "BRG",
  unit_brg: "°"
});

function routeContext(kind, activeToolkit) {
  return makeRouteContext({
    routeId: "courseHeading:" + kind,
    cluster: "courseHeading",
    kind: kind,
    toolkit: activeToolkit
  });
}

describe("CourseHeadingMapper", function () {
  it("maps radial heading kinds to CompassRadialWidget", function () {
    const mapper = loadFresh("cluster/mappers/CourseHeadingMapper.js").create();
    const out = mapper.translate({
      kind: "hdtRadial",
      hdt: 123,
      brg: 230,
      leadingZero: true,
      captionUnitScale: "0.8",
      compassRadialRatioThresholdNormal: "0.8",
      compassRadialRatioThresholdFlat: "2.2",
      compassRadialHideTextualMetrics: "yes"
    }, routeContext("hdtRadial", toolkit));

    expect(out).not.toHaveProperty("renderer");
    expect(out.heading).toBe(123);
    expect(out.markerCourse).toBe(230);
    expect(out.rendererProps.leadingZero).toBe(true);
    expect(out.rendererProps.compassRadialHideTextualMetrics).toBe(true);
  });

  it("maps numeric kinds to formatDirection360", function () {
    const mapper = loadFresh("cluster/mappers/CourseHeadingMapper.js").create();
    const out = mapper.translate({ kind: "brg", brg: 12, leadingZero: true }, routeContext("brg", toolkit));

    expect(out).toEqual({
      value: 12,
      caption: "BRG",
      unit: "°",
      formatter: "formatDirection360",
      formatterParameters: [true]
    });
  });

  it("maps linear heading kinds to CompassLinearWidget", function () {
    const mapper = loadFresh("cluster/mappers/CourseHeadingMapper.js").create();
    const out = mapper.translate({
      kind: "hdtLinear",
      hdt: 311,
      brg: 12,
      leadingZero: true,
      captionUnitScale: "0.75",
      compassLinearRatioThresholdNormal: "1.1",
      compassLinearRatioThresholdFlat: "3.5",
      compassLinearTickMajor: "30",
      compassLinearTickMinor: "10",
      compassLinearShowEndLabels: false,
      compassLinearRange: "180",
      compassLinearHideTextualMetrics: 0
    }, routeContext("hdtLinear", toolkit));

    expect(out).not.toHaveProperty("renderer");
    expect(out.heading).toBe(311);
    expect(out.markerCourse).toBe(12);
    expect(out.caption).toBe("HDT L");
    expect(out.unit).toBe("°L");
    expect(out.rendererProps).toEqual({
      leadingZero: true,
      captionUnitScale: 0.75,
      compassLinearRatioThresholdNormal: 1.1,
      compassLinearRatioThresholdFlat: 3.5,
      compassLinearTickMajor: 30,
      compassLinearTickMinor: 10,
      compassLinearShowEndLabels: false,
      compassLinearRange: 180,
      compassLinearHideTextualMetrics: false
    });
  });

  it("rejects legacy graphic kind names", function () {
    const mapper = loadFresh("cluster/mappers/CourseHeadingMapper.js").create();
    expect(mapper.translate({ kind: "hdtGraphic", hdt: 123 }, routeContext("hdtGraphic", toolkit))).toEqual({});
    expect(mapper.translate({ kind: "hdmGraphic", hdm: 123 }, routeContext("hdmGraphic", toolkit))).toEqual({});
  });
});
