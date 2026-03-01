/**
 * Module: VesselMapper - Cluster translation for vessel voltage/time/attitude kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVesselMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      const req = p.kind;

      if (req === "voltageRadial") {
        const warnEnabled = (p.voltageRadialWarningEnabled !== false);
        const alarmEnabled = (p.voltageRadialAlarmEnabled !== false);
        return {
          renderer: "VoltageRadialWidget",
          value: p.value,
          caption: cap("voltageRadial"),
          unit: unit("voltageRadial"),
          formatter: "formatDecimal",
          formatterParameters: [3, 1, true],
          rendererProps: {
            voltageRadialMinValue: num(p.voltageRadialMinValue),
            voltageRadialMaxValue: num(p.voltageRadialMaxValue),
            voltageRadialTickMajor: num(p.voltageRadialTickMajor),
            voltageRadialTickMinor: num(p.voltageRadialTickMinor),
            voltageRadialShowEndLabels: !!p.voltageRadialShowEndLabels,
            voltageRadialWarningFrom: warnEnabled ? num(p.voltageRadialWarningFrom) : undefined,
            voltageRadialAlarmFrom: alarmEnabled ? num(p.voltageRadialAlarmFrom) : undefined,
            voltageRadialRatioThresholdNormal: num(p.voltageRadialRatioThresholdNormal),
            voltageRadialRatioThresholdFlat: num(p.voltageRadialRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale)
          }
        };
      }

      if (req === "voltage") {
        const u = unit("voltage");
        return out(p.value, cap("voltage"), u, "formatDecimal", [3, 1, true]);
      }
      if (req === "clock") {
        return out(p.clock, cap("clock"), unit("clock"), "formatTime", []);
      }
      if (req === "dateTime") {
        return {
          renderer: "DateTimeRendererWrapper",
          clock: p.clock,
          caption: cap("dateTime"),
          unit: unit("dateTime")
        };
      }
      if (req === "timeStatus") {
        return {
          renderer: "TimeStatusRendererWrapper",
          clock: p.clock,
          gpsValid: p.gpsValid,
          caption: cap("timeStatus"),
          unit: unit("timeStatus")
        };
      }
      if (req === "pitch") {
        const rawPitch = p.pitch;
        const pitchValue = (rawPitch == null || (typeof rawPitch === "string" && rawPitch.trim() === ""))
          ? undefined
          : rawPitch;
        return {
          value: pitchValue,
          caption: cap("pitch"),
          unit: unit("pitch"),
          formatter: "formatDirection",
          formatterParameters: [true, true, false]
        };
      }
      if (req === "roll") {
        const rawRoll = p.roll;
        const rollValue = (rawRoll == null || (typeof rawRoll === "string" && rawRoll.trim() === ""))
          ? undefined
          : rawRoll;
        return {
          value: rollValue,
          caption: cap("roll"),
          unit: unit("roll"),
          formatter: "formatDirection",
          formatterParameters: [true, true, false]
        };
      }

      return {};
    }

    return {
      cluster: "vessel",
      translate: translate
    };
  }

  return { id: "VesselMapper", create: create };
}));
