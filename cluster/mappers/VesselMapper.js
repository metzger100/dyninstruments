/*!
 * ClusterHost dispatch: vessel
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniModules = root.DyniModules || {}).DyniClusterHostDispatchVessel = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;

      const req = p.kind;

      if (req === "voltageGraphic") {
        const warnEnabled = !!p.voltageWarningEnabled;
        const alarmEnabled = !!p.voltageAlarmEnabled;
        return {
          renderer: "VoltageGauge",
          value: (typeof p.value !== "undefined") ? p.value : p.voltage,
          caption: cap("voltageGraphic"),
          unit: unit("voltageGraphic"),

          minValue: Number(p.voltageMinValue),
          maxValue: Number(p.voltageMaxValue),
          tickMajor: Number(p.voltageTickMajor),
          tickMinor: Number(p.voltageTickMinor),
          showEndLabels: !!p.voltageShowEndLabels,

          warningFrom: warnEnabled ? Number(p.voltageWarningFrom) : undefined,
          alarmFrom: alarmEnabled ? Number(p.voltageAlarmFrom) : undefined,

          voltageRatioThresholdNormal: Number(p.voltageRatioThresholdNormal),
          voltageRatioThresholdFlat: Number(p.voltageRatioThresholdFlat),
          captionUnitScale: Number(p.captionUnitScale)
        };
      }

      if (req === "voltage") {
        const u = unit("voltage");
        return out(p.value, cap("voltage"), u, "formatDecimal", [3, 1, true]);
      }

      return {};
    }

    return {
      cluster: "vessel",
      translate: translate
    };
  }

  return { id: "ClusterHostDispatchVessel", create: create };
}));
