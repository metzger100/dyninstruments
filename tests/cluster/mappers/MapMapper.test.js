const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_zoom: "ZOOM CAP",
  unit_zoom: "",
  caption_centerDisplayPosition: "CENTER CAP",
  unit_centerDisplayPosition: "",
  caption_centerDisplayMarker: "WP CAP",
  unit_centerDisplayMarker: "nmC",
  caption_centerDisplayBoat: "BOAT CAP",
  unit_centerDisplayBoat: "nmB",
  caption_centerDisplayMeasure: "MEAS CAP",
  unit_centerDisplayMeasure: "nmM"
});

describe("MapMapper", function () {
  function createMapper() {
    return loadFresh("cluster/mappers/MapMapper.js").create();
  }

  it("maps centerDisplay to CenterDisplayTextWidget with renderer-owned fields", function () {
    const mapper = createMapper();
    const activeMeasure = { getPointAtIndex: vi.fn(() => ({ lat: 54.1, lon: 10.2 })) };
    const out = mapper.translate({
      kind: "centerDisplay",
      centerPosition: { lat: 54.2, lon: 10.3 },
      centerMarkerCourse: "91",
      centerMarkerDistance: "1852",
      centerCourse: "182",
      centerDistance: "926",
      activeMeasure: activeMeasure,
      measureRhumbLine: true,
      centerDisplayRatioThresholdNormal: "1.1",
      centerDisplayRatioThresholdFlat: "2.4"
    }, toolkit);

    expect(out).toEqual({
      renderer: "CenterDisplayTextWidget",
      display: {
        position: { lat: 54.2, lon: 10.3 },
        marker: { course: 91, distance: 1852 },
        boat: { course: 182, distance: 926 },
        measure: { activeMeasure: activeMeasure, useRhumbLine: true }
      },
      captions: {
        position: "CENTER CAP",
        marker: "WP CAP",
        boat: "BOAT CAP",
        measure: "MEAS CAP"
      },
      units: {
        marker: "nmC",
        boat: "nmB",
        measure: "nmM"
      },
      ratioThresholdNormal: 1.1,
      ratioThresholdFlat: 2.4
    });
  });

  it("maps zoom to MapZoomTextHtmlWidget", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "zoom",
      zoom: "12.3",
      requiredZoom: "11.5"
    }, toolkit);

    expect(out).toEqual({
      renderer: "MapZoomTextHtmlWidget",
      zoom: 12.3,
      requiredZoom: 11.5,
      caption: "ZOOM CAP",
      unit: ""
    });
  });

  it("keeps centerDisplay measure toggle false unless explicitly enabled", function () {
    const mapper = createMapper();
    const out = mapper.translate({ kind: "centerDisplay" }, toolkit);
    expect(out.display.measure.useRhumbLine).toBe(false);
  });

  it("returns empty object for unknown kinds", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "x" }, toolkit)).toEqual({});
  });
});
