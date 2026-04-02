/**
 * Module: NavMapper - Cluster translation for navigation ETA/distance/position kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit, ActiveRouteViewModel, RoutePointsViewModel
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNavMapper = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const activeRouteViewModel = Helpers.getModule("ActiveRouteViewModel").create(def, Helpers);
    const routePointsViewModel = Helpers.getModule("RoutePointsViewModel").create(def, Helpers);

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

      if (req === "eta") {
        return out(p.eta, cap("eta"), unit("eta"), "formatTime", []);
      }
      if (req === "rteEta") {
        return out(p.rteEta, cap("rteEta"), unit("rteEta"), "formatTime", []);
      }
      if (req === "dst") {
        return out(p.dst, cap("dst"), unit("dst"), "formatDistance", []);
      }
      if (req === "rteDistance") {
        return out(p.rteDistance, cap("rteDistance"), unit("rteDistance"), "formatDistance", []);
      }
      if (req === "vmg") {
        const u = unit("vmg");
        return out(p.vmg, cap("vmg"), u, "formatSpeed", [u]);
      }
      if (req === "activeRoute") {
        const activeRouteDomain = activeRouteViewModel.build(p, toolkit);
        return {
          renderer: "ActiveRouteTextHtmlWidget",
          routeName: activeRouteDomain.routeName,
          disconnect: activeRouteDomain.disconnect,
          display: activeRouteDomain.display,
          captions: activeRouteDomain.captions,
          units: activeRouteDomain.units,
          ratioThresholdNormal: num(p.activeRouteRatioThresholdNormal),
          ratioThresholdFlat: num(p.activeRouteRatioThresholdFlat)
        };
      }
      if (req === "routePoints") {
        const routePointsDomain = routePointsViewModel.build(p, toolkit);
        return {
          renderer: "RoutePointsTextHtmlWidget",
          domain: {
            route: routePointsDomain.route,
            routeName: routePointsDomain.route ? routePointsDomain.route.name : "",
            pointCount: routePointsDomain.route ? routePointsDomain.route.points.length : 0,
            selectedIndex: routePointsDomain.selectedIndex,
            isActiveRoute: routePointsDomain.isActiveRoute,
            showLatLon: routePointsDomain.showLatLon,
            useRhumbLine: routePointsDomain.useRhumbLine
          },
          layout: {
            ratioThresholdNormal: num(p.routePointsRatioThresholdNormal),
            ratioThresholdFlat: num(p.routePointsRatioThresholdFlat),
            showHeader: p.showHeader
          },
          formatting: {
            distanceUnit: p.distanceUnit,
            courseUnit: p.courseUnit,
            waypointsText: p.waypointsText
          }
        };
      }
      if (req === "positionBoat") {
        const o = out(p.positionBoat, cap("positionBoat"), unit("positionBoat"), "formatLonLats", []);
        o.renderer = "PositionCoordinateWidget";
        o.coordinateFormatter = "formatLonLatsDecimal";
        o.coordinateFormatterParameters = [];
        return o;
      }
      if (req === "positionWp") {
        const o = out(p.positionWp, cap("positionWp"), unit("positionWp"), "formatLonLats", []);
        o.renderer = "PositionCoordinateWidget";
        o.coordinateFormatter = "formatLonLatsDecimal";
        o.coordinateFormatterParameters = [];
        return o;
      }
      if (req === "xteDisplay") {
        const headingUnit = unit("xteDisplayCog");
        return {
          renderer: "XteDisplayWidget",
          xte: num(p.xte),
          cog: num(p.cog),
          dtw: num(p.dtw),
          btw: num(p.btw),
          wpName: typeof p.wpName === "string" ? p.wpName : "",
          disconnect: p.disconnect === true,
          rendererProps: {
            xteCaption: cap("xteDisplayXte"),
            trackCaption: cap("xteDisplayCog"),
            dtwCaption: cap("xteDisplayDst"),
            btwCaption: cap("xteDisplayBrg"),
            xteUnit: unit("xteDisplayXte"),
            trackUnit: headingUnit,
            dtwUnit: unit("xteDisplayDst"),
            btwUnit: unit("xteDisplayBrg"),
            headingUnit: headingUnit,
            leadingZero: p.leadingZero !== false,
            showWpName: p.showWpNameXteDisplay === true,
            xteRatioThresholdNormal: num(p.xteRatioThresholdNormal),
            xteRatioThresholdFlat: num(p.xteRatioThresholdFlat)
          }
        };
      }
      return {};
    }

    return {
      cluster: "nav",
      translate: translate
    };
  }

  return { id: "NavMapper", create: create };
}));
