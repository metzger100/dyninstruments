/**
 * Module: DyniPlugin Kind Maps - Per-kind caption and unit defaults
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: none
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared;

  shared.kindMaps = {
    DEFAULT_KIND: {
      text: { cap: "VALUE", unit: "" },
      linearGauge: { cap: "VALUE", unit: "" },
      radialGauge: { cap: "VALUE", unit: "" }
    },
    COURSE_KIND: {
      cog: { cap: "COG", unit: "\u00b0" },
      hdt: { cap: "HDT", unit: "\u00b0" },
      hdm: { cap: "HDM", unit: "\u00b0" },
      brg: { cap: "BRG", unit: "\u00b0" },
      hdtRadial: { cap: "HDT", unit: "\u00b0" },
      hdmRadial: { cap: "HDM", unit: "\u00b0" },
      hdtLinear: { cap: "HDT", unit: "\u00b0" },
      hdmLinear: { cap: "HDM", unit: "\u00b0" }
    },
    SPEED_KIND: {
      sog: { cap: "SOG" },
      stw: { cap: "STW" },
      sogLinear: { cap: "SOG" },
      stwLinear: { cap: "STW" },
      sogRadial: { cap: "SOG" },
      stwRadial: { cap: "STW" }
    },
    ENV_KIND: {
      depth: { cap: "DPT" },
      depthLinear: { cap: "DPT" },
      depthRadial: { cap: "DPT" },
      temp: { cap: "TEMP" },
      tempLinear: { cap: "TEMP" },
      tempRadial: { cap: "TEMP" },
      pressure: { cap: "PRES" }
    },
    WIND_ANGLE_KIND: {
      angleTrue: { cap: "TWA", unit: "\u00b0" },
      angleApparent: { cap: "AWA", unit: "\u00b0" },
      angleTrueDirection: { cap: "TWD", unit: "\u00b0" },
      angleTrueRadialAngle: {
        cap: "TWA",
        unit: "\u00b0",
        kind: "angleTrueRadial",
        captionName: "Angle caption",
        unitName: "Angle unit"
      },
      angleApparentRadialAngle: {
        cap: "AWA",
        unit: "\u00b0",
        kind: "angleApparentRadial",
        captionName: "Angle caption",
        unitName: "Angle unit"
      },
      angleTrueLinearAngle: {
        cap: "TWA",
        unit: "\u00b0",
        kind: "angleTrueLinear",
        captionName: "Angle caption",
        unitName: "Angle unit"
      },
      angleApparentLinearAngle: {
        cap: "AWA",
        unit: "\u00b0",
        kind: "angleApparentLinear",
        captionName: "Angle caption",
        unitName: "Angle unit"
      }
    },
    WIND_SPEED_KIND: {
      speedTrue: { cap: "TWS" },
      speedApparent: { cap: "AWS" },
      angleTrueRadialSpeed: {
        cap: "TWS",
        kind: "angleTrueRadial",
        captionName: "Speed caption",
        unitName: "Speed unit"
      },
      angleApparentRadialSpeed: {
        cap: "AWS",
        kind: "angleApparentRadial",
        captionName: "Speed caption",
        unitName: "Speed unit"
      },
      angleTrueLinearSpeed: {
        cap: "TWS",
        kind: "angleTrueLinear",
        captionName: "Speed caption",
        unitName: "Speed unit"
      },
      angleApparentLinearSpeed: {
        cap: "AWS",
        kind: "angleApparentLinear",
        captionName: "Speed caption",
        unitName: "Speed unit"
      }
    },
    NAV_TEXT_KIND: {
      eta: { cap: "ETA", unit: "" },
      rteEta: { cap: "RTE ETA", unit: "" },
      positionBoat: { cap: "POS", unit: "" },
      positionWp: { cap: "WP", unit: "" },
      activeRouteEta: {
        cap: "ETA",
        unit: "",
        kind: "activeRoute",
        captionName: "ETA caption",
        unitName: "ETA unit"
      },
      activeRouteNextCourse: {
        cap: "NEXT",
        unit: "\u00b0",
        kind: "activeRoute",
        captionName: "Next course caption",
        unitName: "Next course unit"
      },
      xteDisplayCog: {
        cap: "COG",
        unit: "\u00b0",
        kind: "xteDisplay",
        captionName: "Track caption",
        unitName: "Track unit"
      },
      xteDisplayBrg: {
        cap: "BRG",
        unit: "\u00b0",
        kind: "xteDisplay",
        captionName: "BRG caption",
        unitName: "BRG unit"
      }
    },
    NAV_UNIT_AWARE_KIND: {
      dst: { cap: "DST" },
      rteDistance: { cap: "RTE" },
      vmg: { cap: "VMG" },
      activeRouteRemain: {
        cap: "RTE",
        kind: "activeRoute",
        captionName: "Route distance caption",
        unitName: "Route distance unit"
      },
      xteDisplayXte: {
        cap: "XTE",
        kind: "xteDisplay",
        captionName: "XTE caption",
        unitName: "XTE unit"
      },
      xteDisplayDst: {
        cap: "DST",
        kind: "xteDisplay",
        captionName: "DST caption",
        unitName: "DST unit"
      }
    },
    MAP_TEXT_KIND: {
      zoom: { cap: "ZOOM", unit: "" },
      aisTargetTcpa: {
        cap: "TCPA",
        unit: "min",
        kind: "aisTarget",
        captionName: "TCPA caption",
        unitName: "TCPA unit"
      },
      aisTargetBrg: {
        cap: "BRG",
        unit: "\u00b0",
        kind: "aisTarget",
        captionName: "BRG caption",
        unitName: "BRG unit"
      },
      centerDisplayPosition: {
        cap: "CENTER",
        unit: "",
        kind: "centerDisplay",
        captionName: "Center caption",
        unitName: "Center unit"
      }
    },
    MAP_UNIT_AWARE_KIND: {
      aisTargetDst: {
        cap: "DST",
        kind: "aisTarget",
        captionName: "Distance caption",
        unitName: "Distance unit"
      },
      aisTargetCpa: {
        cap: "DCPA",
        kind: "aisTarget",
        captionName: "DCPA caption",
        unitName: "DCPA unit"
      },
      centerDisplayMarker: {
        cap: "WP",
        kind: "centerDisplay",
        captionName: "Waypoint caption",
        unitName: "Waypoint distance unit"
      },
      centerDisplayBoat: {
        cap: "POS",
        kind: "centerDisplay",
        captionName: "Boat caption",
        unitName: "Boat distance unit"
      },
      centerDisplayMeasure: {
        cap: "MEAS",
        kind: "centerDisplay",
        captionName: "Measure caption",
        unitName: "Measure distance unit"
      }
    },
    ANCHOR_TEXT_KIND: {
      anchorBearing: { cap: "ABRG", unit: "\u00b0" }
    },
    ANCHOR_UNIT_AWARE_KIND: {
      anchorDistance: { cap: "ANCHOR" },
      anchorWatch: { cap: "AWATCH" }
    },
    VESSEL_KIND: {
      voltage: { cap: "VOLT", unit: "V" },
      voltageLinear: { cap: "VOLT", unit: "V" },
      voltageRadial: { cap: "VOLT", unit: "V" },
      alarm: { cap: "ALARM", unit: "" },
      clock: { cap: "TIME", unit: "" },
      dateTime: { cap: "", unit: "" },
      timeStatus: { cap: "", unit: "" },
      pitch: { cap: "PITCH", unit: "\u00b0" },
      roll: { cap: "ROLL", unit: "\u00b0" }
    }
  };
}(this));
