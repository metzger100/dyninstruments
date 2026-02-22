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

  const RAD2DEG = 180 / Math.PI;
  const DATE_TIME_RATIO_THRESHOLD_NORMAL_DEFAULT = 1.2;
  const DATE_TIME_RATIO_THRESHOLD_FLAT_DEFAULT = 4.0;
  const hasOwn = Object.prototype.hasOwnProperty;

  function defaultText(props) {
    if (props && hasOwn.call(props, "default")) {
      return props.default;
    }
    return "---";
  }

  function isGpsValid(value) {
    if (value === true) {
      return true;
    }
    if (value === false || value == null) {
      return false;
    }
    if (typeof value === "number") {
      return Number.isFinite(value) && value !== 0;
    }
    if (typeof value === "string") {
      const text = value.trim().toLowerCase();
      if (!text || text === "0" || text === "false" || text === "off" || text === "no") {
        return false;
      }
      return true;
    }
    return !!value;
  }

  function statusCircle(value) {
    return isGpsValid(value) ? "\ud83d\udfe2" : "\ud83d\udd34";
  }

  function statusCircleFormatter(raw) {
    return statusCircle(raw);
  }

  function makeAttitudeFormatter(fallback, makeAngleFormatter) {
    const angleFormatter = (typeof makeAngleFormatter === "function")
      ? makeAngleFormatter(false, false, fallback)
      : function (rawDeg) {
        const n = Number(rawDeg);
        if (!isFinite(n)) {
          return fallback;
        }
        const rounded = Math.round(n);
        if (rounded === 180) {
          return "-180";
        }
        return String(rounded);
      };

    return function (raw) {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        return fallback;
      }
      return angleFormatter(n * RAD2DEG);
    };
  }

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const makeAngleFormatter = toolkit.makeAngleFormatter;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };
      const fallback = defaultText(p);

      const req = p.kind;

      if (req === "voltageGraphic") {
        const warnEnabled = !!p.voltageWarningEnabled;
        const alarmEnabled = !!p.voltageAlarmEnabled;
        return {
          renderer: "VoltageGaugeWidget",
          value: (typeof p.value !== "undefined") ? p.value : p.voltage,
          caption: cap("voltageGraphic"),
          unit: unit("voltageGraphic"),
          formatter: "formatDecimal",
          formatterParameters: [3, 1, true],

          minValue: num(p.voltageMinValue),
          maxValue: num(p.voltageMaxValue),
          tickMajor: num(p.voltageTickMajor),
          tickMinor: num(p.voltageTickMinor),
          showEndLabels: !!p.voltageShowEndLabels,

          warningFrom: warnEnabled ? num(p.voltageWarningFrom) : undefined,
          alarmFrom: alarmEnabled ? num(p.voltageAlarmFrom) : undefined,

          voltageRatioThresholdNormal: num(p.voltageRatioThresholdNormal),
          voltageRatioThresholdFlat: num(p.voltageRatioThresholdFlat),
          captionUnitScale: num(p.captionUnitScale)
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
        const dateTimeRatioNormal = num(p.dateTimeRatioThresholdNormal);
        const dateTimeRatioFlat = num(p.dateTimeRatioThresholdFlat);
        return {
          renderer: "PositionCoordinateWidget",
          value: [p.clock, p.clock],
          caption: cap("dateTime"),
          unit: unit("dateTime"),
          ratioThresholdNormal: (typeof dateTimeRatioNormal === "number")
            ? dateTimeRatioNormal
            : DATE_TIME_RATIO_THRESHOLD_NORMAL_DEFAULT,
          ratioThresholdFlat: (typeof dateTimeRatioFlat === "number")
            ? dateTimeRatioFlat
            : DATE_TIME_RATIO_THRESHOLD_FLAT_DEFAULT,
          formatter: "formatDateTime",
          formatterParameters: [],
          coordinateFormatterLat: "formatDate",
          coordinateFormatterLon: "formatTime",
          coordinateFlatFromAxes: true,
          coordinateRawValues: true,
          default: fallback
        };
      }
      if (req === "timeStatus") {
        return {
          renderer: "PositionCoordinateWidget",
          value: [p.clock, p.gpsValid],
          caption: cap("timeStatus"),
          unit: unit("timeStatus"),
          coordinateFormatterLat: statusCircleFormatter,
          coordinateFormatterLon: "formatTime",
          coordinateFlatFromAxes: true,
          coordinateRawValues: true,
          default: fallback
        };
      }
      if (req === "pitch") {
        return out(
          p.pitch,
          cap("pitch"),
          unit("pitch"),
          makeAttitudeFormatter(fallback, makeAngleFormatter),
          []
        );
      }
      if (req === "roll") {
        return out(
          p.roll,
          cap("roll"),
          unit("roll"),
          makeAttitudeFormatter(fallback, makeAngleFormatter),
          []
        );
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
