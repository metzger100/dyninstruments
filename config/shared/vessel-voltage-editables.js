/**
 * Module: DyniPlugin Vessel Voltage Editables - Voltage gauge editable parameter fragments
 * Documentation: documentation/guides/add-new-cluster.md
 * Depends: config/shared/editable-param-utils.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const shared = ns.config.shared;

  shared.buildVesselVoltageGaugeParams = function () {
    return {
      voltageLinearMinValue: {
        type: "FLOAT", min: 0, max: 60, step: 0.1, default: 7.0,
        name: "Min voltage",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearMaxValue: {
        type: "FLOAT", min: 1, max: 80, step: 0.1, default: 15.0,
        name: "Max voltage",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearTickMajor: {
        type: "FLOAT", min: 0.1, max: 20, step: 0.1, default: 1.0,
        name: "Major tick step",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearTickMinor: {
        type: "FLOAT", min: 0.1, max: 10, step: 0.1, default: 0.2,
        name: "Minor tick step",
        condition: { kind: "voltageLinear" }
      },
      voltageLinearShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "voltageLinear" }
      },
      voltageRadialMinValue: {
        type: "FLOAT", min: 0, max: 60, step: 0.1, default: 7.0,
        name: "Min voltage",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialMaxValue: {
        type: "FLOAT", min: 1, max: 80, step: 0.1, default: 15.0,
        name: "Max voltage",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialTickMajor: {
        type: "FLOAT", min: 0.1, max: 20, step: 0.1, default: 1.0,
        name: "Major tick step",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialTickMinor: {
        type: "FLOAT", min: 0.1, max: 10, step: 0.1, default: 0.2,
        name: "Minor tick step",
        condition: { kind: "voltageRadial" }
      },
      voltageRadialShowEndLabels: {
        type: "BOOLEAN", default: false,
        name: "Show min/max labels",
        condition: { kind: "voltageRadial" }
      }
    };
  };
}(this));