/**
 * Module: DateTimeRendererWrapper - Vessel date/time renderer wrapper over PositionCoordinateWidget
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: PositionCoordinateWidget
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniDateTimeRendererWrapper = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const positionSpec = Helpers.getModule("PositionCoordinateWidget").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      return positionSpec.renderCanvas(canvas, {
        ...p,
        value: [p.clock, p.clock],
        ratioThresholdNormal: p.dateTimeRatioThresholdNormal,
        ratioThresholdFlat: p.dateTimeRatioThresholdFlat,
        formatter: "formatDateTime",
        formatterParameters: [],
        coordinateFormatterLat: "formatDate",
        coordinateFormatterLon: "formatTime",
        coordinateFlatFromAxes: true,
        coordinateRawValues: true
      });
    }

    function translateFunction() {
      return {};
    }

    return {
      id: "DateTimeRendererWrapper",
      wantsHideNativeHead: !!(positionSpec && positionSpec.wantsHideNativeHead),
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "DateTimeRendererWrapper", create: create };
}));
