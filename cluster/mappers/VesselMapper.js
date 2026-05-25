/**
 * Module: VesselMapper - Cluster translation for vessel voltage/time/attitude/alarm/regatta kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: routeContext.toolkit, routeContext.viewModel
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniVesselMapper = factory(); }
}(this, function () {
  "use strict";

  function create(def, componentContext) {
    function translate(props, routeContext) {
      const p = props || {};
      const toolkit = routeContext.toolkit;
      const alarmViewModel = routeContext.viewModel;
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num;

      const req = p.kind;

      if (req === "voltageLinear") {
        const warnEnabled = (p.voltageLinearWarningEnabled !== false);
        const alarmEnabled = (p.voltageLinearAlarmEnabled !== false);
        return {
          value: p.value,
          caption: cap("voltageLinear"),
          unit: unit("voltageLinear"),
          formatter: "formatDecimal",
          formatterParameters: [3, 1, true],
          rendererProps: {
            voltageLinearMinValue: num(p.voltageLinearMinValue),
            voltageLinearMaxValue: num(p.voltageLinearMaxValue),
            voltageLinearTickMajor: num(p.voltageLinearTickMajor),
            voltageLinearTickMinor: num(p.voltageLinearTickMinor),
            voltageLinearShowEndLabels: !!p.voltageLinearShowEndLabels,
            voltageLinearWarningFrom: warnEnabled ? num(p.voltageLinearWarningFrom) : undefined,
            voltageLinearAlarmFrom: alarmEnabled ? num(p.voltageLinearAlarmFrom) : undefined,
            voltageLinearRatioThresholdNormal: num(p.voltageLinearRatioThresholdNormal),
            voltageLinearRatioThresholdFlat: num(p.voltageLinearRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale),
            voltageLinearHideTextualMetrics: !!p.voltageLinearHideTextualMetrics
          }
        };
      }

      if (req === "voltageRadial") {
        const warnEnabled = (p.voltageRadialWarningEnabled !== false);
        const alarmEnabled = (p.voltageRadialAlarmEnabled !== false);
        return {
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
            captionUnitScale: num(p.captionUnitScale),
            voltageRadialHideTextualMetrics: !!p.voltageRadialHideTextualMetrics
          }
        };
      }

      if (req === "voltage") {
        const u = unit("voltage");
        return out(p.value, cap("voltage"), u, "formatDecimal", [3, 1, true]);
      }
      if (req === "clock") {
        return out(p.clock, cap("clock"), unit("clock"), p.hideSeconds === true ? "formatClock" : "formatTime", []);
      }
      if (req === "dateTime") {
        return {
          displayVariant: "dateTime",
          value: [p.clock, p.clock],
          caption: cap("dateTime"),
          unit: unit("dateTime"),
          hideSeconds: p.hideSeconds === true,
          ratioThresholdNormal: num(p.dateTimeRatioThresholdNormal),
          ratioThresholdFlat: num(p.dateTimeRatioThresholdFlat)
        };
      }
      if (req === "timeStatus") {
        return {
          displayVariant: "timeStatus",
          value: [p.clock, p.gpsValid],
          caption: cap("timeStatus"),
          unit: unit("timeStatus"),
          hideSeconds: p.hideSeconds === true
        };
      }
      if (req === "regattaTimer") {
        return {
          caption: cap("regattaTimer"),
          unit: unit("regattaTimer"),
          rendererProps: {
            regattaSoundEnabled: p.regattaSoundEnabled !== false,
            regattaProgressBar: p.regattaProgressBar !== false,
            regattaDuration: p.regattaDuration,
            stableDigits: p.stableDigits === true,
            regattaTimerRatioThresholdNormal: num(p.regattaTimerRatioThresholdNormal),
            regattaTimerRatioThresholdFlat: num(p.regattaTimerRatioThresholdFlat),
            captionUnitScale: num(p.captionUnitScale)
          }
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
      if (req === "alarm") {
        if (!alarmViewModel || typeof alarmViewModel.build !== "function") {
          throw new Error("VesselMapper: routeContext.viewModel is required for 'alarm'");
        }
        const alarmDomain = alarmViewModel.build(p);
        return {
          caption: cap("alarm"),
          unit: unit("alarm"),
          default: "NONE",
          domain: alarmDomain,
          ratioThresholdNormal: num(p.alarmRatioThresholdNormal),
          ratioThresholdFlat: num(p.alarmRatioThresholdFlat)
        };
      }
      if (req === "clockRadial") {
        return {
          value: p.clock,
          formatterParameters: [],
          rendererProps: {
            clockRadialRatioThresholdNormal: num(p.clockRadialRatioThresholdNormal),
            clockRadialRatioThresholdFlat: num(p.clockRadialRatioThresholdFlat),
            hideSeconds: p.hideSeconds === true
          }
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
