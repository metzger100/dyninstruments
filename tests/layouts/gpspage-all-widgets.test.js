const fs = require("node:fs");
const path = require("node:path");

describe("tests/layouts/gpspage-all-widgets.json", function () {
  const fixturePath = path.join(__dirname, "gpspage-all-widgets.json");

  function loadLayout() {
    return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  }

  function stripLabelFields(value) {
    if (Array.isArray(value)) {
      return value.map(stripLabelFields);
    }
    if (!value || typeof value !== "object") {
      return value;
    }

    const out = {};
    Object.keys(value).forEach(function (key) {
      if (key === "caption" || key === "unit") return;
      if (key.indexOf("caption_") === 0) return;
      if (key.indexOf("unit_") === 0) return;
      out[key] = stripLabelFields(value[key]);
    });
    return out;
  }

  function findWidget(page, kind) {
    const slotNames = Object.keys(page);
    for (let i = 0; i < slotNames.length; i += 1) {
      const slot = page[slotNames[i]];
      if (!Array.isArray(slot)) continue;
      const widget = slot.find(function (entry) {
        return entry && entry.kind === kind;
      });
      if (widget) return widget;
    }
    throw new Error("Missing widget kind " + kind);
  }

  it("keeps gpspage1 and gpspage2 aligned except for label overrides", function () {
    const layout = loadLayout();
    const page1 = layout.widgets.gpspage1;
    const page2 = layout.widgets.gpspage2;

    expect(layout.layoutVersion).toBe(1);
    expect(layout.properties.layers.ais).toBe(true);
    expect(Object.keys(layout.widgets)).toEqual(expect.arrayContaining([
      "gpspage1",
      "gpspage2",
      "gpspage3",
      "gpspage4",
      "gpspage5"
    ]));

    expect(page1.left).toHaveLength(12);
    expect(page1.left_anchor).toHaveLength(8);
    expect(page1.right).toHaveLength(4);
    expect(page2.left).toHaveLength(12);
    expect(page2.left_anchor).toHaveLength(8);
    expect(page2.right).toHaveLength(4);

    expect(stripLabelFields(page1)).toEqual(stripLabelFields(page2));
  });

  it("uses default labels on gpspage1 and expanded labels on gpspage2", function () {
    const layout = loadLayout();
    const page1 = layout.widgets.gpspage1;
    const page2 = layout.widgets.gpspage2;

    expect(findWidget(page1, "hdtRadial")).toEqual({
      kind: "hdtRadial",
      name: "dyni_CourseHeading_Instruments",
      weight: 1.5
    });
    expect(findWidget(page1, "activeRoute")).toEqual({
      kind: "activeRoute",
      name: "dyni_Nav_Instruments",
      weight: 1.5
    });

    const page2Expectations = [
      {
        kind: "hdtRadial",
        fields: {
          caption_hdtRadial: "True Heading - Radial",
          unit_hdtRadial: "Degree"
        }
      },
      {
        kind: "hdtLinear",
        fields: {
          caption_hdtLinear: "True Heading - Linear",
          unit_hdtLinear: "Degree"
        }
      },
      {
        kind: "sogRadial",
        fields: {
          caption_sogRadial: "Speed Over Ground - Radial",
          unit_sogRadial: "Knot"
        }
      },
      {
        kind: "sogLinear",
        fields: {
          caption_sogLinear: "Speed Over Ground - Linear",
          unit_sogLinear: "Knot"
        }
      },
      {
        kind: "depthRadial",
        fields: {
          caption_depthRadial: "Depth Below Transducer - Radial",
          unit_depthRadial: "Meter"
        }
      },
      {
        kind: "depthLinear",
        fields: {
          caption_depthLinear: "Depth Below Transducer - Linear",
          unit_depthLinear: "Meter"
        }
      },
      {
        kind: "tempRadial",
        fields: {
          caption_tempRadial: "Water Temperature - Radial",
          unit_tempRadial: "Degree Celsius"
        }
      },
      {
        kind: "tempLinear",
        fields: {
          caption_tempLinear: "Water Temperature - Linear",
          unit_tempLinear: "Degree Celsius"
        }
      },
      {
        kind: "angleTrueRadial",
        fields: {
          caption_angleTrueRadialAngle: "True Wind Angle - Radial",
          unit_angleTrueRadialAngle: "Degree",
          caption_angleTrueRadialSpeed: "True Wind Speed - Radial",
          unit_angleTrueRadialSpeed: "Knot"
        }
      },
      {
        kind: "angleTrueLinear",
        fields: {
          caption_angleTrueLinearAngle: "True Wind Angle - Linear",
          unit_angleTrueLinearAngle: "Degree",
          caption_angleTrueLinearSpeed: "True Wind Speed - Linear",
          unit_angleTrueLinearSpeed: "Knot"
        }
      },
      {
        kind: "voltageRadial",
        fields: {
          caption_voltageRadial: "Battery Voltage - Radial",
          unit_voltageRadial: "Volt"
        }
      },
      {
        kind: "voltageLinear",
        fields: {
          caption_voltageLinear: "Battery Voltage - Linear",
          unit_voltageLinear: "Volt"
        }
      },
      {
        kind: "cog",
        fields: {
          caption_cog: "Course Over Ground",
          unit_cog: "Degree"
        }
      },
      {
        kind: "sog",
        fields: {
          caption_sog: "Speed Over Ground",
          unit_sog: "Knot"
        }
      },
      {
        kind: "dst",
        fields: {
          caption_dst: "Distance to Waypoint",
          unit_dst: "Nautical Mile"
        }
      },
      {
        kind: "distance",
        fields: {
          caption_distance: "Distance From Anchor",
          unit_distance: "Meter"
        }
      },
      {
        kind: "voltage",
        fields: {
          caption_voltage: "Battery Voltage",
          unit_voltage: "Volt"
        }
      },
      {
        kind: "pitch",
        fields: {
          caption_pitch: "Pitch Angle",
          unit_pitch: "Degree"
        }
      },
      {
        kind: "roll",
        fields: {
          caption_roll: "Roll Angle",
          unit_roll: "Degree"
        }
      },
      {
        kind: "positionBoat",
        fields: {
          caption_positionBoat: "Boat Position",
          unit_positionBoat: ""
        }
      },
      {
        kind: "activeRoute",
        fields: {
          caption_activeRouteRemain: "Route Distance Remaining",
          unit_activeRouteRemain: "Nautical Mile",
          caption_activeRouteEta: "Estimated Time of Arrival",
          unit_activeRouteEta: "",
          caption_activeRouteNextCourse: "Next Course",
          unit_activeRouteNextCourse: "Degree"
        }
      },
      {
        kind: "centerDisplay",
        fields: {
          caption_centerDisplayPosition: "Center Position",
          unit_centerDisplayPosition: "",
          caption_centerDisplayMarker: "Waypoint Distance",
          unit_centerDisplayMarker: "Nautical Mile",
          caption_centerDisplayBoat: "Boat Distance",
          unit_centerDisplayBoat: "Nautical Mile",
          caption_centerDisplayMeasure: "Measure Distance",
          unit_centerDisplayMeasure: "Nautical Mile"
        }
      },
      {
        kind: "xteDisplay",
        fields: {
          caption_xteDisplayXte: "Cross Track Error",
          unit_xteDisplayXte: "Nautical Mile",
          caption_xteDisplayCog: "Course Over Ground",
          unit_xteDisplayCog: "Degree",
          caption_xteDisplayDst: "Distance to Waypoint",
          unit_xteDisplayDst: "Nautical Mile",
          caption_xteDisplayBrg: "Bearing to Waypoint",
          unit_xteDisplayBrg: "Degree"
        }
      },
      {
        kind: "zoom",
        fields: {
          caption_zoom: "Map Zoom Level",
          unit_zoom: ""
        }
      }
    ];

    page2Expectations.forEach(function (entry) {
      const widget = findWidget(page2, entry.kind);
      Object.keys(entry.fields).forEach(function (key) {
        expect(widget[key]).toBe(entry.fields[key]);
      });
    });
  });

  it("keeps gpspage3 to gpspage5 unchanged", function () {
    const layout = loadLayout();

    expect(layout.widgets.gpspage3.left[0].kind).toBe("voltageLinear");
    expect(layout.widgets.gpspage3.left[0].storeKeys.value).toBe("nav.gps.depthBelowTransducer");
    expect(layout.widgets.gpspage4.m1[0].caption).toBe("COG");
    expect(layout.widgets.gpspage4.m2[2].name).toBe("WindGraphics");
    expect(layout.widgets.gpspage5.left[0].name).toBe("ActiveRoute");
    expect(layout.widgets.gpspage5.right[2].kind).toBe("zoom");
  });
});
