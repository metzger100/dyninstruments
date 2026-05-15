/**
 * Module: DyniPlugin Widgets Registry Gauge - Gauge widget component definitions
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniPlugin.baseUrl, window.DyniPlugin.config.shared
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const config = ns.config;
  const shared = config.shared = config.shared || {};
  const BASE = ns.baseUrl;

  if (typeof BASE !== "string" || !BASE) {
    throw new Error("dyninstruments: baseUrl missing before config/components/registry-widgets-gauge.js load");
  }

  const groups = shared.componentRegistryGroups = shared.componentRegistryGroups || {};
  var w = groups.widgets = groups.widgets || {};

  w.CompassLinearWidget = {
      js: BASE + "widgets/linear/CompassLinearWidget/CompassLinearWidget.js",
      css: undefined,
      globalKey: "DyniCompassLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "SpringEasing"]
  };

  w.CompassRadialWidget = {
      js: BASE + "widgets/radial/CompassRadialWidget/CompassRadialWidget.js",
      css: undefined,
      globalKey: "DyniCompassRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits"]
  };

  w.DepthLinearWidget = {
      js: BASE + "widgets/linear/DepthLinearWidget/DepthLinearWidget.js",
      css: undefined,
      globalKey: "DyniDepthLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "DepthDisplayFormatter", "PlaceholderNormalize", "UnitAwareFormatter"]
  };

  w.DepthRadialWidget = {
      js: BASE + "widgets/radial/DepthRadialWidget/DepthRadialWidget.js",
      css: undefined,
      globalKey: "DyniDepthRadialWidget",
      deps: ["SemicircleRadialEngine", "ValueMath", "DepthDisplayFormatter", "PlaceholderNormalize", "UnitAwareFormatter"]
  };

  w.DefaultRadialWidget = {
      js: BASE + "widgets/radial/DefaultRadialWidget/DefaultRadialWidget.js",
      css: undefined,
      globalKey: "DyniDefaultRadialWidget",
      deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.DefaultLinearWidget = {
      js: BASE + "widgets/linear/DefaultLinearWidget/DefaultLinearWidget.js",
      css: undefined,
      globalKey: "DyniDefaultLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.SpeedLinearWidget = {
      js: BASE + "widgets/linear/SpeedLinearWidget/SpeedLinearWidget.js",
      css: undefined,
      globalKey: "DyniSpeedLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.SpeedRadialWidget = {
      js: BASE + "widgets/radial/SpeedRadialWidget/SpeedRadialWidget.js",
      css: undefined,
      globalKey: "DyniSpeedRadialWidget",
      deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.TemperatureLinearWidget = {
      js: BASE + "widgets/linear/TemperatureLinearWidget/TemperatureLinearWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.TemperatureRadialWidget = {
      js: BASE + "widgets/radial/TemperatureRadialWidget/TemperatureRadialWidget.js",
      css: undefined,
      globalKey: "DyniTemperatureRadialWidget",
      deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.VoltageLinearWidget = {
      js: BASE + "widgets/linear/VoltageLinearWidget/VoltageLinearWidget.js",
      css: undefined,
      globalKey: "DyniVoltageLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.VoltageRadialWidget = {
      js: BASE + "widgets/radial/VoltageRadialWidget/VoltageRadialWidget.js",
      css: undefined,
      globalKey: "DyniVoltageRadialWidget",
      deps: ["SemicircleRadialEngine", "ValueMath", "PlaceholderNormalize"]
  };

  w.WindLinearWidget = {
      js: BASE + "widgets/linear/WindLinearWidget/WindLinearWidget.js",
      css: undefined,
      globalKey: "DyniWindLinearWidget",
      deps: ["LinearGaugeEngine", "ValueMath", "StableDigits", "PlaceholderNormalize"]
  };

  w.WindRadialWidget = {
      js: BASE + "widgets/radial/WindRadialWidget/WindRadialWidget.js",
      css: undefined,
      globalKey: "DyniWindRadialWidget",
      deps: ["FullCircleRadialEngine", "FullCircleRadialTextLayout", "SpringEasing", "StableDigits", "PlaceholderNormalize"]
  };

}(this));
