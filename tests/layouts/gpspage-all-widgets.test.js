const fs = require("node:fs");
const path = require("node:path");

describe("tests/layouts/gpspage-all-widgets.json", function () {
  const fixturePath = path.join(__dirname, "gpspage-all-widgets.json");

  function loadLayout() {
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  }

  function slotKinds(page, slotName) {
    return (page[slotName] || []).map(function (entry) {
      return entry.kind;
    });
  }

  function slotNames(page, slotName) {
    return (page[slotName] || []).map(function (entry) {
      return entry.name;
    });
  }

  function findWidget(page, kindOrName) {
    const pageSlotNames = Object.keys(page);
    for (let i = 0; i < pageSlotNames.length; i += 1) {
      const slot = page[pageSlotNames[i]];
      if (!Array.isArray(slot)) continue;
      const widget = slot.find(function (entry) {
        return entry && (entry.kind === kindOrName || entry.name === kindOrName);
      });
      if (widget) return widget;
    }
    throw new Error("Missing widget " + kindOrName);
  }

  it("provides four gps showcase/comparison pages plus nav/edit pages", function () {
    const layout = loadLayout();

    expect(layout.layoutVersion).toBe(1);
    expect(layout.properties.layers.ais).toBe(true);
    expect(Object.keys(layout.widgets)).toEqual([
      "gpspage1",
      "gpspage2",
      "gpspage3",
      "gpspage4",
      "navpage",
      "editroutepage"
    ]);
  });

  it("keeps gpspage1 and gpspage2 aligned and covers the intended dyni renderers", function () {
    const layout = loadLayout();
    const page1 = layout.widgets.gpspage1;
    const page2 = layout.widgets.gpspage2;

    expect(page1.left).toHaveLength(7);
    expect(page1.m1).toHaveLength(7);
    expect(page1.right).toHaveLength(7);

    expect(page2.left).toHaveLength(7);
    expect(page2.m1).toHaveLength(7);
    expect(page2.right).toHaveLength(7);

    expect(slotKinds(page1, "left")).toEqual([
      "hdtRadial",
      "hdtLinear",
      "sogRadial",
      "sogLinear",
      "depthRadial",
      "depthLinear",
      "tempRadial"
    ]);

    expect(slotKinds(page1, "m1")).toEqual([
      "tempLinear",
      "angleTrueRadial",
      "angleTrueLinear",
      "voltageRadial",
      "voltageLinear",
      "cog",
      "positionBoat"
    ]);

    expect(slotKinds(page1, "right")).toEqual([
      "activeRoute",
      "centerDisplay",
      "xteDisplay",
      "zoom",
      "aisTarget",
      "editRoute",
      "routePoints"
    ]);

    expect(slotKinds(page2, "left")).toEqual(slotKinds(page1, "left"));
    expect(slotKinds(page2, "m1")).toEqual(slotKinds(page1, "m1"));
    expect(slotKinds(page2, "right")).toEqual(slotKinds(page1, "right"));
  });

  it("uses explicit non-default settings on gpspage2", function () {
    const layout = loadLayout();
    const page2 = layout.widgets.gpspage2;

    expect(findWidget(page2, "hdtLinear")).toMatchObject({
      caption_hdtLinear: "Heading True — Linear Compass Tape",
      unit_hdtLinear: "degrees true",
      compassLinearTickMajor: 45,
      compassLinearTickMinor: 15,
      compassLinearShowEndLabels: true
    });

    expect(findWidget(page2, "sogRadial")).toMatchObject({
      caption_sogRadial: "Speed Over Ground — Radial Gauge",
      formatUnit_sogRadial: "kn",
      unit_sogRadial_kn: "knots through GPS",
      speedRadialMaxValue_kn: 16,
      speedRadialTickMajor_kn: 2,
      speedRadialTickMinor_kn: 0.5,
      speedRadialShowEndLabels: true,
      speedRadialWarningFrom_kn: 12,
      speedRadialAlarmFrom_kn: 14
    });

    expect(findWidget(page2, "sogLinear")).toMatchObject({
      caption_sogLinear: "Speed Over Ground — Linear Gauge",
      formatUnit_sogLinear: "kn",
      unit_sogLinear_kn: "knots through GPS",
      speedLinearMaxValue_kn: 16,
      speedLinearTickMajor_kn: 2,
      speedLinearTickMinor_kn: 0.5,
      speedLinearShowEndLabels: true,
      speedLinearWarningFrom_kn: 12,
      speedLinearAlarmFrom_kn: 14
    });

    expect(findWidget(page2, "depthRadial")).toMatchObject({
      caption_depthRadial: "Depth Below Transducer — Radial Gauge",
      formatUnit_depthRadial: "m",
      unit_depthRadial_m: "meters below transducer",
      depthRadialMaxValue_m: 12,
      depthRadialTickMajor_m: 2,
      depthRadialTickMinor_m: 0.5,
      depthRadialShowEndLabels: true,
      depthRadialWarningFrom_m: 4,
      depthRadialAlarmFrom_m: 2
    });

    expect(findWidget(page2, "depthLinear")).toMatchObject({
      caption_depthLinear: "Depth Below Transducer — Linear Gauge",
      formatUnit_depthLinear: "m",
      unit_depthLinear_m: "meters below transducer",
      depthLinearMaxValue_m: 12,
      depthLinearTickMajor_m: 2,
      depthLinearTickMinor_m: 0.5,
      depthLinearShowEndLabels: true,
      depthLinearWarningFrom_m: 4,
      depthLinearAlarmFrom_m: 2
    });

    expect(findWidget(page2, "tempLinear")).toMatchObject({
      caption_tempLinear: "Water Temperature — Linear Gauge",
      formatUnit_tempLinear: "celsius",
      unit_tempLinear_celsius: "degrees Celsius",
      tempLinearMinValue_celsius: -5,
      tempLinearMaxValue_celsius: 45,
      tempLinearTickMajor_celsius: 5,
      tempLinearTickMinor_celsius: 1,
      tempLinearShowEndLabels: true,
      tempLinearWarningEnabled: true,
      tempLinearAlarmEnabled: true,
      tempLinearWarningFrom_celsius: 28,
      tempLinearAlarmFrom_celsius: 34
    });

    expect(findWidget(page2, "tempRadial")).toMatchObject({
      caption_tempRadial: "Water Temperature — Radial Gauge",
      formatUnit_tempRadial: "celsius",
      unit_tempRadial_celsius: "degrees Celsius",
      tempRadialMinValue_celsius: -5,
      tempRadialMaxValue_celsius: 45,
      tempRadialTickMajor_celsius: 5,
      tempRadialTickMinor_celsius: 1,
      tempRadialShowEndLabels: true,
      tempRadialWarningEnabled: true,
      tempRadialAlarmEnabled: true,
      tempRadialWarningFrom_celsius: 28,
      tempRadialAlarmFrom_celsius: 34
    });

    expect(findWidget(page2, "angleTrueLinear")).toMatchObject({
      caption_angleTrueLinearAngle: "True Wind Angle — Linear",
      unit_angleTrueLinearAngle: "degrees relative",
      caption_angleTrueLinearSpeed: "True Wind Speed — Linear",
      formatUnit_angleTrueLinearSpeed: "kn",
      unit_angleTrueLinearSpeed_kn: "knots apparent-to-true",
      windLinearTickMajor: 45,
      windLinearShowEndLabels: true,
      windLinearLayMin: 30,
      windLinearLayMax: 60
    });

    expect(findWidget(page2, "voltageRadial")).toMatchObject({
      caption_voltageRadial: "Battery Voltage — Radial Gauge",
      unit_voltageRadial: "volts DC",
      voltageRadialMinValue: 10.5,
      voltageRadialMaxValue: 15.5,
      voltageRadialShowEndLabels: true,
      voltageRadialWarningFrom: 12.4,
      voltageRadialAlarmFrom: 11.8
    });

    expect(findWidget(page2, "cog")).toMatchObject({
      caption_cog: "Course Over Ground — Primary Numeric",
      unit_cog: "degrees true",
      leadingZero: false
    });

    expect(findWidget(page2, "positionBoat")).toMatchObject({
      caption_positionBoat: "Boat Position — Current GPS Fix",
      unit_positionBoat: ""
    });

    expect(findWidget(page2, "activeRoute")).toMatchObject({
      caption_activeRouteRemain: "Remaining Route Distance",
      formatUnit_activeRouteRemain: "nm",
      unit_activeRouteRemain_nm: "nautical miles",
      caption_activeRouteEta: "Estimated Time of Arrival",
      caption_activeRouteNextCourse: "Upcoming Course Change"
    });

    expect(findWidget(page2, "centerDisplay")).toMatchObject({
      caption_centerDisplayPosition: "Center Coordinates",
      caption_centerDisplayMarker: "Waypoint Distance From Center",
      formatUnit_centerDisplayMarker: "nm",
      unit_centerDisplayMarker_nm: "nautical miles",
      caption_centerDisplayBoat: "Boat Distance From Center",
      formatUnit_centerDisplayBoat: "nm",
      unit_centerDisplayBoat_nm: "nautical miles",
      caption_centerDisplayMeasure: "Measured Segment Distance"
    });

    expect(findWidget(page2, "xteDisplay")).toMatchObject({
      caption_xteDisplayXte: "Cross Track Error",
      caption_xteDisplayCog: "Course Over Ground",
      caption_xteDisplayDst: "Distance To Waypoint",
      caption_xteDisplayBrg: "Bearing To Waypoint",
      showWpNameXteDisplay: true,
      leadingZero: false
    });

    expect(findWidget(page2, "zoom")).toMatchObject({
      caption_zoom: "Map Zoom — Active Scale"
    });

    expect(findWidget(page2, "aisTarget")).toMatchObject({
      caption_aisTargetDst: "Target Distance",
      formatUnit_aisTargetDst: "nm",
      unit_aisTargetDst_nm: "nautical miles",
      caption_aisTargetCpa: "Closest Point of Approach",
      formatUnit_aisTargetCpa: "nm",
      unit_aisTargetCpa_nm: "nautical miles",
      caption_aisTargetTcpa: "Time To Closest Point",
      caption_aisTargetBrg: "Target Bearing"
    });

    expect(findWidget(page2, "editRoute")).toMatchObject({
      caption_editRoutePts: "Planned Waypoints",
      caption_editRouteDst: "Leg Distance Remaining",
      formatUnit_editRouteDst: "nm",
      unit_editRouteDst_nm: "nautical miles",
      caption_editRouteRte: "Route Distance Remaining",
      formatUnit_editRouteRte: "nm",
      unit_editRouteRte_nm: "nautical miles",
      caption_editRouteEta: "Estimated Route Arrival"
    });

    expect(findWidget(page2, "routePoints")).toMatchObject({
      showHeader: false,
      formatUnit_routePointsDistance: "nm",
      unit_routePointsDistance_nm: "nautical miles",
      courseUnit: "degrees true",
      waypointsText: "planned waypoints"
    });

    expect(findWidget(page2, "sogRadial").speedRadialMaxValue).toBeUndefined();
    expect(findWidget(page2, "sogLinear").speedLinearMaxValue).toBeUndefined();
    expect(findWidget(page2, "depthRadial").depthRadialMaxValue).toBeUndefined();
    expect(findWidget(page2, "depthLinear").depthLinearMaxValue).toBeUndefined();
    expect(findWidget(page2, "tempLinear").tempLinearMaxValue).toBeUndefined();
    expect(findWidget(page2, "tempRadial").tempRadialMaxValue).toBeUndefined();
    expect(findWidget(page2, "editRoute").unit_dst).toBeUndefined();
  });

  it("uses gpspage3 and gpspage4 as four-column dyni-vs-AvNav comparison pages", function () {
    const layout = loadLayout();
    const page3 = layout.widgets.gpspage3;
    const page4 = layout.widgets.gpspage4;

    expect(slotKinds(page3, "left")).toEqual([
      "cog",
      "hdtLinear",
      "hdtRadial",
      "sogRadial",
      "tempLinear",
      "depthLinear"
    ]);

    expect(slotNames(page3, "m1")).toEqual([
      "COG",
      "linGauge_Compass",
      "radGauge_Compass",
      "radGauge_Speed",
      "linGauge_Temperature",
      "DepthBelowTransducer"
    ]);

    expect(slotKinds(page3, "m2")).toEqual([
      "positionBoat",
      "rteEta",
      "xteDisplay",
      "dateTime",
      "timeStatus",
      "positionWp"
    ]);

    expect(slotNames(page3, "right")).toEqual([
      "Position",
      "RteEta",
      "XteDisplay",
      "DateTime",
      "TimeStatus",
      "WpPosition"
    ]);

    expect(slotKinds(page4, "left").slice(0, 5)).toEqual([
      "angleApparentLinear",
      "angleApparentRadial",
      "pitch",
      "roll",
      "activeRoute"
    ]);
    expect(page4.left[5]).toMatchObject({
      name: "dyni_Map_Instruments",
      weight: 1
    });
    expect(page4.left[5].kind).toBeUndefined();

    expect(slotNames(page4, "m1")).toEqual([
      "WindDisplay",
      "WindGraphics",
      "signalKPitch",
      "signalKRoll",
      "ActiveRoute",
      "CenterDisplay"
    ]);

    expect(slotKinds(page4, "m2")).toEqual([
      "zoom",
      "editRoute",
      "routePoints",
      "aisTarget",
      "positionWp",
      "voltageLinear"
    ]);

    expect(slotNames(page4, "right")).toEqual([
      "Zoom",
      "EditRoute",
      "RoutePoints",
      "AisTarget",
      "WpPosition",
      "signalKPitch"
    ]);

    ["left", "m2"].forEach(function (slotName) {
      page3[slotName].forEach(function (entry) {
        expect(entry.name.indexOf("dyni_")).toBe(0);
      });
    });

    ["m1", "right"].forEach(function (slotName) {
      page3[slotName].forEach(function (entry) {
        expect(entry.name.indexOf("dyni_")).toBe(-1);
      });
    });

    page4.left.forEach(function (entry) {
      expect(entry.name.indexOf("dyni_")).toBe(0);
    });

    page4.m2.forEach(function (entry) {
      expect(entry.name.indexOf("dyni_")).toBe(0);
    });

    ["m1", "right"].forEach(function (slotName) {
      page4[slotName].forEach(function (entry) {
        expect(entry.name.indexOf("dyni_")).toBe(-1);
      });
    });
  });

  it("keeps navpage and editroutepage available", function () {
    const layout = loadLayout();

    expect(layout.widgets.navpage.left[0].name).toBe("dyni_Map_Instruments");
    expect(layout.widgets.navpage.bottomRight[3].kind).toBe("positionBoat");

    expect(layout.widgets.editroutepage.left[0]).toMatchObject({
      name: "dyni_Nav_Instruments",
      kind: "editRoute"
    });
    expect(layout.widgets.editroutepage.top_small[0].name).toBe("EditRoute");
  });
});
