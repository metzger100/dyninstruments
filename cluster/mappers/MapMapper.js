/**
 * Module: MapMapper - Cluster translation for map center-display and zoom kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapMapper = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function translate(props, toolkit) {
      const p = props || {};
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const num = toolkit.num || function (value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };
      const req = p.kind;

      if (req === "centerDisplay") {
        return {
          renderer: "CenterDisplayTextWidget",
          display: {
            position: p.centerPosition,
            marker: {
              course: num(p.centerMarkerCourse),
              distance: num(p.centerMarkerDistance)
            },
            boat: {
              course: num(p.centerCourse),
              distance: num(p.centerDistance)
            },
            measure: {
              activeMeasure: p.activeMeasure,
              useRhumbLine: p.measureRhumbLine === true
            }
          },
          captions: {
            position: cap("centerDisplayPosition"),
            marker: cap("centerDisplayMarker"),
            boat: cap("centerDisplayBoat"),
            measure: cap("centerDisplayMeasure")
          },
          units: {
            marker: unit("centerDisplayMarker"),
            boat: unit("centerDisplayBoat"),
            measure: unit("centerDisplayMeasure")
          },
          ratioThresholdNormal: num(p.centerDisplayRatioThresholdNormal),
          ratioThresholdFlat: num(p.centerDisplayRatioThresholdFlat)
        };
      }

      if (req === "zoom") {
        return {
          renderer: "MapZoomTextHtmlWidget",
          zoom: num(p.zoom),
          requiredZoom: num(p.requiredZoom),
          caption: cap("zoom"),
          unit: unit("zoom")
        };
      }

      return {};
    }

    return {
      cluster: "map",
      translate: translate
    };
  }

  return { id: "MapMapper", create: create };
}));
