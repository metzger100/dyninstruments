/**
 * Module: TimeStatusRendererWrapper - Vessel GPS status/time renderer wrapper over PositionCoordinateWidget
 * Documentation: documentation/widgets/position-coordinates.md
 * Depends: PositionCoordinateWidget
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniTimeStatusRendererWrapper = factory(); }
}(this, function () {
  "use strict";

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

  function statusCircleFormatter(raw) {
    return isGpsValid(raw) ? "\ud83d\udfe2" : "\ud83d\udd34";
  }

  function create(def, Helpers) {
    const positionSpec = Helpers.getModule("PositionCoordinateWidget").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      return positionSpec.renderCanvas(canvas, {
        ...p,
        value: [p.clock, p.gpsValid],
        coordinateFormatterLat: statusCircleFormatter,
        coordinateFormatterLon: "formatTime",
        coordinateFlatFromAxes: true,
        coordinateRawValues: true
      });
    }

    function translateFunction() {
      return {};
    }

    return {
      id: "TimeStatusRendererWrapper",
      wantsHideNativeHead: !!(positionSpec && positionSpec.wantsHideNativeHead),
      renderCanvas: renderCanvas,
      translateFunction: translateFunction
    };
  }

  return { id: "TimeStatusRendererWrapper", create: create };
}));
