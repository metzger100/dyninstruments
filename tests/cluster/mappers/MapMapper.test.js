const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");

function makeToolkit(overrides, bindingOverrides) {
  installUnitFormatFamilies(bindingOverrides);
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit(Object.assign({
    caption_zoom: "ZOOM CAP",
    unit_zoom: "",
    caption_aisTargetDst: "DST CAP",
    formatUnit_aisTargetDst: "nm",
    unit_aisTargetDst_nm: "nmD",
    caption_aisTargetCpa: "DCPA CAP",
    formatUnit_aisTargetCpa: "nm",
    unit_aisTargetCpa_nm: "nmC",
    caption_aisTargetTcpa: "TCPA CAP",
    unit_aisTargetTcpa: "minT",
    caption_aisTargetBrg: "BRG CAP",
    unit_aisTargetBrg: "degB",
    caption_centerDisplayPosition: "CENTER CAP",
    unit_centerDisplayPosition: "",
    caption_centerDisplayMarker: "WP CAP",
    formatUnit_centerDisplayMarker: "nm",
    unit_centerDisplayMarker_nm: "nmC",
    caption_centerDisplayBoat: "BOAT CAP",
    formatUnit_centerDisplayBoat: "nm",
    unit_centerDisplayBoat_nm: "nmB",
    caption_centerDisplayMeasure: "MEAS CAP",
    formatUnit_centerDisplayMeasure: "nm",
    unit_centerDisplayMeasure_nm: "nmM"
  }, overrides || {}));
}

const toolkit = makeToolkit();

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
      formatUnits: {
        marker: "nm",
        boat: "nm",
        measure: "nm"
      },
      ratioThresholdNormal: 1.1,
      ratioThresholdFlat: 2.4
    });
  });

  it("uses shared binding defaults when formatter selectors are missing", function () {
    const mapper = createMapper();
    const customToolkit = makeToolkit({
      formatUnit_centerDisplayMarker: undefined,
      unit_centerDisplayMarker_m: "meter marker",
      formatUnit_centerDisplayBoat: undefined,
      unit_centerDisplayBoat_m: "meter boat",
      formatUnit_centerDisplayMeasure: undefined,
      unit_centerDisplayMeasure_m: "meter measure",
      formatUnit_aisTargetDst: undefined,
      unit_aisTargetDst_m: "meter dst",
      formatUnit_aisTargetCpa: undefined,
      unit_aisTargetCpa_m: "meter cpa"
    }, {
      centerDisplayMarker: { defaultToken: "m" },
      centerDisplayBoat: { defaultToken: "m" },
      centerDisplayMeasure: { defaultToken: "m" },
      aisTargetDst: { defaultToken: "m" },
      aisTargetCpa: { defaultToken: "m" }
    });

    expect(mapper.translate({
      kind: "centerDisplay",
      centerPosition: { lat: 54.2, lon: 10.3 }
    }, customToolkit)).toEqual({
      renderer: "CenterDisplayTextWidget",
      display: {
        position: { lat: 54.2, lon: 10.3 },
        marker: { course: undefined, distance: undefined },
        boat: { course: undefined, distance: undefined },
        measure: { activeMeasure: undefined, useRhumbLine: false }
      },
      captions: {
        position: "CENTER CAP",
        marker: "WP CAP",
        boat: "BOAT CAP",
        measure: "MEAS CAP"
      },
      units: {
        marker: "meter marker",
        boat: "meter boat",
        measure: "meter measure"
      },
      formatUnits: {
        marker: "m",
        boat: "m",
        measure: "m"
      },
      ratioThresholdNormal: undefined,
      ratioThresholdFlat: undefined
    });

    const aisTarget = mapper.translate({
      kind: "aisTarget",
      target: {},
      default: "---"
    }, customToolkit);
    expect(aisTarget.units.dst).toBe("meter dst");
    expect(aisTarget.units.cpa).toBe("meter cpa");
    expect(aisTarget.formatUnits).toEqual({
      dst: "m",
      cpa: "m"
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
      formatUnits: {
        dst: "nm",
        cpa: "nm"
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
    expect(out.formatUnits).toEqual({
      dst: "nm",
      cpa: "nm"
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
