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
    COURSE_KIND: {
      cog: { cap: "COG", unit: "\u00b0" },
      hdt: { cap: "HDT", unit: "\u00b0" },
      hdm: { cap: "HDM", unit: "\u00b0" },
      brg: { cap: "BRG", unit: "\u00b0" },
      hdtRadial: { cap: "HDT", unit: "\u00b0" },
      hdmRadial: { cap: "HDM", unit: "\u00b0" }
    },
    SPEED_KIND: {
      sog: { cap: "SOG", unit: "kn" },
      stw: { cap: "STW", unit: "kn" },
      sogLinear: { cap: "SOG", unit: "kn" },
      stwLinear: { cap: "STW", unit: "kn" },
      sogRadial: { cap: "SOG", unit: "kn" },
      stwRadial: { cap: "STW", unit: "kn" }
    },
    ENV_KIND: {
      depth: { cap: "DPT", unit: "m" },
      depthLinear: { cap: "DPT", unit: "m" },
      depthRadial: { cap: "DPT", unit: "m" },
      temp: { cap: "TEMP", unit: "\u00b0C" },
      tempLinear: { cap: "TEMP", unit: "\u00b0C" },
      tempRadial: { cap: "TEMP", unit: "\u00b0C" },
      pressure: { cap: "PRES", unit: "hPa" }
    },
    WIND_KIND: {
      angleTrue: { cap: "TWA", unit: "\u00b0" },
      angleApparent: { cap: "AWA", unit: "\u00b0" },
      angleTrueDirection: { cap: "TWD", unit: "\u00b0" },
      speedTrue: { cap: "TWS", unit: "kn" },
      speedApparent: { cap: "AWS", unit: "kn" },
      angleTrueRadialAngle: {
        cap: "TWA",
        unit: "\u00b0",
        kind: "angleTrueRadial",
        captionName: "Angle caption",
        unitName: "Angle unit"
      },
      angleTrueRadialSpeed: {
        cap: "TWS",
        unit: "kn",
        kind: "angleTrueRadial",
        captionName: "Speed caption",
        unitName: "Speed unit"
      },
      angleApparentRadialAngle: {
        cap: "AWA",
        unit: "\u00b0",
        kind: "angleApparentRadial",
        captionName: "Angle caption",
        unitName: "Angle unit"
      },
      angleApparentRadialSpeed: {
        cap: "AWS",
        unit: "kn",
        kind: "angleApparentRadial",
        captionName: "Speed caption",
        unitName: "Speed unit"
      }
    },
    NAV_KIND: {
      eta: { cap: "ETA", unit: "" },
      rteEta: { cap: "RTE ETA", unit: "" },
      dst: { cap: "DST", unit: "nm" },
      rteDistance: { cap: "RTE", unit: "nm" },
      vmg: { cap: "VMG", unit: "kn" },
      positionBoat: { cap: "POS", unit: "" },
      positionWp: { cap: "WP", unit: "" },
      xteDisplayXte: {
        cap: "XTE",
        unit: "nm",
        kind: "xteDisplay",
        captionName: "XTE caption",
        unitName: "XTE unit"
      },
      xteDisplayCog: {
        cap: "COG",
        unit: "\u00b0",
        kind: "xteDisplay",
        captionName: "Track caption",
        unitName: "Track unit"
      },
      xteDisplayDst: {
        cap: "DST",
        unit: "nm",
        kind: "xteDisplay",
        captionName: "DST caption",
        unitName: "DST unit"
      },
      xteDisplayBrg: {
        cap: "BRG",
        unit: "\u00b0",
        kind: "xteDisplay",
        captionName: "BRG caption",
        unitName: "BRG unit"
      }
    },
    ANCHOR_KIND: {
      distance: { cap: "ANCHOR", unit: "m" },
      watch: { cap: "AWATCH", unit: "m" },
      bearing: { cap: "ABRG", unit: "\u00b0" }
    },
    VESSEL_KIND: {
      voltage: { cap: "VOLT", unit: "V" },
      voltageLinear: { cap: "VOLT", unit: "V" },
      voltageRadial: { cap: "VOLT", unit: "V" },
      clock: { cap: "TIME", unit: "" },
      dateTime: { cap: "", unit: "" },
      timeStatus: { cap: "", unit: "" },
      pitch: { cap: "PITCH", unit: "\u00b0" },
      roll: { cap: "ROLL", unit: "\u00b0" }
    }
  };
}(this));
