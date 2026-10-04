/**
 * @file DyniPlugin Widgets Registry Gauge - Gauge widget component definitions
 * Documentation: documentation/architecture/component-system.md
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = (config.shared = config.shared || {});
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets-gauge.js load");
  }

  const groups = (shared.componentRegistryGroups = shared.componentRegistryGroups || {});
  var w = (groups.widgets = groups.widgets || {});

  w.ClockRadialWidget = {
    js: BASE + "widgets/radial/ClockRadialWidget/ClockRadialWidget.js",
    globalKey: "DyniClockRadialWidget",
    deps: ["FullCircleRadialEngine", "GeometryScale"]
  };

  w.CompassLinearWidget = {
    js: BASE + "widgets/linear/CompassLinearWidget/CompassLinearWidget.js",
    globalKey: "DyniCompassLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "SpringEasing"]
  };

  w.CompassRadialWidget = {
    js: BASE + "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
    globalKey: "DyniCompassRadialWidget",
    deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits"]
  };

  w.DepthLinearWidget = {
    js: BASE + "widgets/linear/DepthLinearWidget/DepthLinearWidget.js",
    globalKey: "DyniDepthLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "DepthDisplayFormatter", "PlaceholderNormalize", "UnitAwareFormatter"]
  };

  w.DepthRadialWidget = {
    js: BASE + "widgets/radial/DepthRadialWidget/DepthRadialWidget.js",
    globalKey: "DyniDepthRadialWidget",
    deps: ["SemicircleRadialEngine", "ValueMath", "DepthDisplayFormatter", "PlaceholderNormalize", "UnitAwareFormatter"]
  };

  w.DefaultRadialWidget = {
    js: BASE + "widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js",
    globalKey: "DyniDefaultRadialWidget",
    deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.DefaultLinearWidget = {
    js: BASE + "widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js",
    globalKey: "DyniDefaultLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.SpeedLinearWidget = {
    js: BASE + "widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js",
    globalKey: "DyniSpeedLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.SpeedRadialWidget = {
    js: BASE + "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js",
    globalKey: "DyniSpeedRadialWidget",
    deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.TemperatureLinearWidget = {
    js: BASE + "widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js",
    globalKey: "DyniTemperatureLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.TemperatureRadialWidget = {
    js: BASE + "widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js",
    globalKey: "DyniTemperatureRadialWidget",
    deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.VoltageLinearWidget = {
    js: BASE + "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js",
    globalKey: "DyniVoltageLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.VoltageRadialWidget = {
    js: BASE + "widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js",
    globalKey: "DyniVoltageRadialWidget",
    deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.WindLinearWidget = {
    js: BASE + "widgets/linear/WindLinearWidget/WindLinearWidget.js",
    globalKey: "DyniWindLinearWidget",
    deps: ["LinearGaugeEngine", "ValueMath", "StableDigits", "PlaceholderNormalize"]
  };

  w.WindRadialWidget = {
    js: BASE + "widgets/radial/WindRadialWidget/WindRadialWidget.js",
    globalKey: "DyniWindRadialWidget",
    deps: [
      "FullCircleRadialEngine",
      "FullCircleRadialTextLayout",
      "ValueMath",
      "SpringEasing",
      "StableDigits",
      "PlaceholderNormalize"
    ]
  };
})(this);
