/**
 * Module: VesselMapper - Cluster translation for voltage and clock kinds
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

      return {};
    }

    return {
      cluster: "vessel",
      translate: translate
    };
  }

  return { id: "VesselMapper", create: create };
}));
