const { loadFresh } = require("../../helpers/load-umd");
const { installUnitFormatFamilies } = require("../../helpers/unit-format-families");
const { makeRouteContext } = require("../../helpers/mapper-route-context");

/** @param {Record<string, any>} [overrides] @param {Record<string, any>} [bindingOverrides] */
function makeToolkit(overrides, bindingOverrides) {
  installUnitFormatFamilies(bindingOverrides);
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js")
    .create()
    .createToolkit(
      Object.assign(
        {
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
        },
        overrides || {}
      )
    );
}

const toolkit = makeToolkit();

/** @param {any} kind @param {any} activeToolkit @param {any} [viewModel] */
function routeContext(kind, activeToolkit, viewModel) {
  return makeRouteContext({
    routeId: "map:" + kind,
    cluster: "map",
    kind: kind,
    toolkit: activeToolkit,
    viewModel: viewModel
  });
}

function createMapper() {
  return loadFresh("cluster/mappers/MapMapper.js").create();
}

/** @param {any} value */
function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** @param {any} value */
function toMaybeNumber(value) {
  if (typeof value === "undefined" || value === null) {
    return undefined;
  }
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function makeAisTargetViewModel() {
  return {
    /** @param {any} props */
    build(props) {
      const target = props.target || {};
      const mmsiRaw = target.mmsi;
      const mmsiNormalized = typeof mmsiRaw === "undefined" || mmsiRaw === null ? "" : String(mmsiRaw);
      const trackedMmsiRaw = props.trackedMmsi;
      const hasTargetIdentity = mmsiNormalized !== "";
      const warning = target.warning === true;

      return {
        mmsiRaw: mmsiRaw,
        mmsiNormalized: mmsiNormalized,
        trackedMmsiRaw: trackedMmsiRaw,
        hasTargetIdentity: hasTargetIdentity,
        hasDispatchMmsi: hasTargetIdentity,
        hasColorMmsi: hasTargetIdentity,
        distance: toMaybeNumber(target.distance),
        cpa: toMaybeNumber(target.cpa),
        tcpa: toMaybeNumber(target.tcpa),
        headingTo: toMaybeNumber(target.headingTo),
        nameOrMmsi: trimText(target.name) || mmsiNormalized,
        frontText: "Front",
        frontInitial: "F",
        showTcpaBranch: typeof target.tcpa !== "undefined",
        warning: warning,
        nextWarning: target.nextWarning === true,
        nearest: target.nearest === true,
        trackedMatch: false,
        colorRole: warning ? "warning" : undefined,
        hasColorRole: warning
      };
    }
  };
}

describe("MapMapper", function () {
  it("maps centerDisplay to CenterDisplayTextWidget with renderer-owned fields", function () {
    const mapper = createMapper();
    const activeMeasure = { getPointAtIndex: vi.fn(() => ({ lat: 54.1, lon: 10.2 })) };
    const out = mapper.translate(
      {
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
      },
      routeContext("centerDisplay", toolkit)
    );

    expect(out).toEqual({
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
    const customToolkit = makeToolkit(
      {
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
      },
      {
        centerDisplayMarker: { defaultToken: "m" },
        centerDisplayBoat: { defaultToken: "m" },
        centerDisplayMeasure: { defaultToken: "m" },
        aisTargetDst: { defaultToken: "m" },
        aisTargetCpa: { defaultToken: "m" }
      }
    );

    expect(
      mapper.translate(
        {
          kind: "centerDisplay",
          centerPosition: { lat: 54.2, lon: 10.3 }
        },
        routeContext("centerDisplay", customToolkit)
      )
    ).toEqual({
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

    const aisTarget = mapper.translate(
      {
        kind: "aisTarget",
        target: {},
        default: "---"
      },
      routeContext("aisTarget", customToolkit, makeAisTargetViewModel())
    );
    expect(aisTarget.units.dst).toBe("meter dst");
    expect(aisTarget.units.cpa).toBe("meter cpa");
    expect(aisTarget.formatUnits).toEqual({
      dst: "m",
      cpa: "m"
    });
  });

  it("maps zoom to MapZoomTextHtmlWidget", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      {
        kind: "zoom",
        zoom: "12.3",
        requiredZoom: "11.5"
      },
      routeContext("zoom", toolkit)
    );

    expect(out).toEqual({
      zoom: 12.3,
      requiredZoom: 11.5,
      caption: "ZOOM CAP",
      unit: ""
    });
  });

  it("keeps zoom mapper values missing when live zoom inputs are null/blank", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      {
        kind: "zoom",
        zoom: null,
        requiredZoom: "   "
      },
      routeContext("zoom", toolkit)
    );

    expect(out.zoom).toBeUndefined();
    expect(out.requiredZoom).toBeUndefined();
  });

  it("maps aisTarget to grouped renderer payload with viewmodel domain output", function () {
    const mapper = createMapper();
    const out = mapper.translate(
      {
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
      },
      routeContext("aisTarget", toolkit, makeAisTargetViewModel())
    );

    expect(out).toEqual({
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
    const out = mapper.translate(
      {
        kind: "aisTarget",
        target: {},
        aisTargetRatioThresholdNormal: "bad"
      },
      routeContext("aisTarget", toolkit, makeAisTargetViewModel())
    );

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
    const out = mapper.translate({ kind: "centerDisplay" }, routeContext("centerDisplay", toolkit));
    expect(out.display.measure.useRhumbLine).toBe(false);
  });

  it("returns empty object for unknown kinds", function () {
    const mapper = createMapper();
    expect(mapper.translate({ kind: "x" }, routeContext("x", toolkit))).toEqual({});
  });
});
