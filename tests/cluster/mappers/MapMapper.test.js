const { loadFresh } = require("../../helpers/load-umd");

const toolkit = loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
  caption_zoom: "ZOOM CAP",
  unit_zoom: "",
  caption_aisTargetDst: "DST CAP",
  unit_aisTargetDst: "nmD",
  caption_aisTargetCpa: "DCPA CAP",
  unit_aisTargetCpa: "nmC",
  caption_aisTargetTcpa: "TCPA CAP",
  unit_aisTargetTcpa: "minT",
  caption_aisTargetBrg: "BRG CAP",
  unit_aisTargetBrg: "degB",
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
    const Helpers = {
      getModule(id) {
        if (id === "AisTargetViewModel") {
          return loadFresh("cluster/viewmodels/AisTargetViewModel.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return loadFresh("cluster/mappers/MapMapper.js").create({}, Helpers);
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

  it("maps aisTarget to grouped renderer payload with viewmodel domain output", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "aisTarget",
      target: {
        mmsi: 123456789,
        distance: "2.3",
        cpa: "0.8",
        tcpa: "90",
        headingTo: "271",
        type: 21,
        name: "  Harbor Mark  ",
        passFront: 1,
        warning: true,
        nextWarning: false,
        nearest: false
      },
      trackedMmsi: "123456789",
      aisMarkAllWarning: true,
      aisTargetRatioThresholdNormal: "1.2",
      aisTargetRatioThresholdFlat: "3.8",
      default: "---"
    }, toolkit);

    expect(out).toEqual({
      renderer: "AisTargetTextHtmlWidget",
      domain: {
        mmsiRaw: 123456789,
        mmsiNormalized: "123456789",
        trackedMmsiRaw: "123456789",
        hasTargetIdentity: true,
        hasDispatchMmsi: true,
        hasColorMmsi: true,
        distance: 2.3,
        cpa: 0.8,
        tcpa: 90,
        headingTo: 271,
        nameOrMmsi: "Harbor Mark",
        frontText: "Front",
        frontInitial: "F",
        showTcpaBranch: true,
        warning: true,
        nextWarning: false,
        nearest: false,
        trackedMatch: false,
        colorRole: "warning",
        hasColorRole: true
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        dst: "DST CAP",
        cpa: "DCPA CAP",
        tcpa: "TCPA CAP",
        brg: "BRG CAP"
      },
      units: {
        dst: "nmD",
        cpa: "nmC",
        tcpa: "minT",
        brg: "degB"
      },
      default: "---"
    });
  });

  it("propagates aisTarget thresholds and caption/unit overrides fail-closed", function () {
    const mapper = createMapper();
    const out = mapper.translate({
      kind: "aisTarget",
      target: {},
      aisTargetRatioThresholdNormal: "bad"
    }, toolkit);

    expect(out.layout).toEqual({
      ratioThresholdNormal: undefined,
      ratioThresholdFlat: undefined
    });
    expect(out.captions).toEqual({
      dst: "DST CAP",
      cpa: "DCPA CAP",
      tcpa: "TCPA CAP",
      brg: "BRG CAP"
    });
    expect(out.units).toEqual({
      dst: "nmD",
      cpa: "nmC",
      tcpa: "minT",
      brg: "degB"
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
