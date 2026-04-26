/**
 * Module: MapMapper - Cluster translation for map center-display, zoom, and AIS target kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit, AisTargetViewModel
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapMapper = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const aisTargetViewModel = Helpers.getModule("AisTargetViewModel").create(def, Helpers);

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
            marker: toolkit.unitText("centerDisplayMarker", "distance", toolkit.formatUnit("centerDisplayMarker", "distance")),
            boat: toolkit.unitText("centerDisplayBoat", "distance", toolkit.formatUnit("centerDisplayBoat", "distance")),
            measure: toolkit.unitText("centerDisplayMeasure", "distance", toolkit.formatUnit("centerDisplayMeasure", "distance"))
          },
          formatUnits: {
            marker: toolkit.formatUnit("centerDisplayMarker", "distance"),
            boat: toolkit.formatUnit("centerDisplayBoat", "distance"),
            measure: toolkit.formatUnit("centerDisplayMeasure", "distance")
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

      if (req === "aisTarget") {
        return {
          renderer: "AisTargetTextHtmlWidget",
          domain: aisTargetViewModel.build(p),
          layout: {
            ratioThresholdNormal: num(p.aisTargetRatioThresholdNormal),
            ratioThresholdFlat: num(p.aisTargetRatioThresholdFlat)
          },
          captions: {
            dst: cap("aisTargetDst"),
            cpa: cap("aisTargetCpa"),
            tcpa: cap("aisTargetTcpa"),
            brg: cap("aisTargetBrg")
          },
          units: {
            dst: toolkit.unitText("aisTargetDst", "distance", toolkit.formatUnit("aisTargetDst", "distance")),
            cpa: toolkit.unitText("aisTargetCpa", "distance", toolkit.formatUnit("aisTargetCpa", "distance")),
            tcpa: toolkit.unit("aisTargetTcpa"),
            brg: toolkit.unit("aisTargetBrg")
          },
          formatUnits: {
            dst: toolkit.formatUnit("aisTargetDst", "distance"),
            cpa: toolkit.formatUnit("aisTargetCpa", "distance")
          },
          default: p.default
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
