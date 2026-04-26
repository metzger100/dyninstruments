/**
 * Module: NavMapper - Cluster translation for navigation ETA/distance/position kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: ClusterMapperToolkit, ActiveRouteViewModel, EditRouteViewModel, RoutePointsViewModel
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniNavMapper = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const activeRouteViewModel = Helpers.getModule("ActiveRouteViewModel").create(def, Helpers);
    const editRouteViewModel = Helpers.getModule("EditRouteViewModel").create(def, Helpers);
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
        return out(p.eta, cap("eta"), unit("eta"), p.hideSeconds === true ? "formatClock" : "formatTime", []);
      }
      if (req === "rteEta") {
        return out(p.rteEta, cap("rteEta"), unit("rteEta"), p.hideSeconds === true ? "formatClock" : "formatTime", []);
      }
      if (req === "dst") {
        const token = toolkit.formatUnit("dst", "distance", "nm");
        return out(p.dst, cap("dst"), toolkit.unitText("dst", "distance", token), "formatDistance", [token]);
      }
      if (req === "rteDistance") {
        const token = toolkit.formatUnit("rteDistance", "distance", "nm");
        return out(p.rteDistance, cap("rteDistance"), toolkit.unitText("rteDistance", "distance", token), "formatDistance", [token]);
      }
      if (req === "vmg") {
        const token = toolkit.formatUnit("vmg", "speed", "kn");
        return out(p.vmg, cap("vmg"), toolkit.unitText("vmg", "speed", token), "formatSpeed", [token]);
      }
      if (req === "activeRoute") {
        const activeRouteDomain = activeRouteViewModel.build(p, toolkit);
        const remainToken = toolkit.formatUnit("activeRouteRemain", "distance", "nm");
        activeRouteDomain.units.remain = toolkit.unitText("activeRouteRemain", "distance", remainToken);
        activeRouteDomain.formatUnits = { remain: remainToken };
        return {
          renderer: "ActiveRouteTextHtmlWidget",
          display: {
            remain: activeRouteDomain.display.remain,
            eta: activeRouteDomain.display.eta,
            nextCourse: activeRouteDomain.display.nextCourse,
            isApproaching: activeRouteDomain.display.isApproaching,
            routeName: activeRouteDomain.routeName,
            disconnect: p.disconnect === true,
            hideSeconds: activeRouteDomain.hideSeconds
          },
          captions: activeRouteDomain.captions,
          units: activeRouteDomain.units,
          formatUnits: activeRouteDomain.formatUnits,
          ratioThresholdNormal: num(p.activeRouteRatioThresholdNormal),
          ratioThresholdFlat: num(p.activeRouteRatioThresholdFlat)
        };
      }
      if (req === "routePoints") {
        const routePointsDomain = routePointsViewModel.build(p, toolkit);
        const distanceToken = toolkit.formatUnit("routePointsDistance", "distance", "nm");
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
            courseUnit: p.courseUnit,
            waypointsText: p.waypointsText
          },
          units: {
            distance: toolkit.unitText("routePointsDistance", "distance", distanceToken)
          },
          formatUnits: {
            distance: distanceToken
          }
        };
      }
      if (req === "editRoute") {
        const editRouteDomain = editRouteViewModel.build(p, toolkit);
        const route = editRouteDomain.route;
        return {
          renderer: "EditRouteTextHtmlWidget",
          domain: {
            hasRoute: editRouteDomain.hasRoute,
            routeName: route ? route.displayName : "",
            pointCount: route ? route.pointCount : 0,
            totalDistance: route ? route.totalDistance : undefined,
            remainingDistance: editRouteDomain.remainingDistance,
            eta: editRouteDomain.eta,
            hideSeconds: editRouteDomain.hideSeconds,
            isActiveRoute: editRouteDomain.isActiveRoute,
            isLocalRoute: route ? route.isLocalRoute : false,
            isServerRoute: route ? route.isServerRoute : false
          },
          layout: {
            ratioThresholdNormal: num(p.editRouteRatioThresholdNormal),
            ratioThresholdFlat: num(p.editRouteRatioThresholdFlat)
          },
          captions: {
            pts: cap("editRoutePts"),
            dst: cap("editRouteDst"),
            rte: cap("editRouteRte"),
            eta: cap("editRouteEta")
          },
          units: {
            dst: toolkit.unitText("editRouteDst", "distance", toolkit.formatUnit("editRouteDst", "distance", "nm")),
            rte: toolkit.unitText("editRouteRte", "distance", toolkit.formatUnit("editRouteRte", "distance", "nm"))
          },
          formatUnits: {
            dst: toolkit.formatUnit("editRouteDst", "distance", "nm"),
            rte: toolkit.formatUnit("editRouteRte", "distance", "nm")
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
        const xteToken = toolkit.formatUnit("xteDisplayXte", "distance", "nm");
        const dtwToken = toolkit.formatUnit("xteDisplayDst", "distance", "nm");
        const headingUnit = unit("xteDisplayCog");
        return {
          renderer: "XteDisplayWidget",
          display: {
            xte: num(p.xte),
            cog: num(p.cog),
            dtw: num(p.dtw),
            btw: num(p.btw),
            wpName: typeof p.wpName === "string" ? p.wpName : "",
            disconnect: p.disconnect === true
          },
          captions: {
            xte: cap("xteDisplayXte"),
            track: cap("xteDisplayCog"),
            dtw: cap("xteDisplayDst"),
            brg: cap("xteDisplayBrg")
          },
          units: {
            xte: toolkit.unitText("xteDisplayXte", "distance", xteToken),
            track: headingUnit,
            dtw: toolkit.unitText("xteDisplayDst", "distance", dtwToken),
            brg: unit("xteDisplayBrg")
          },
          formatUnits: {
            xte: xteToken,
            dtw: dtwToken
          },
          xteScale: toolkit.unitNumber("xteDisplayScale", xteToken),
          layout: {
            leadingZero: p.leadingZero !== false,
            showWpName: p.showWpNameXteDisplay === true,
            hideTextualMetrics: !!p.xteHideTextualMetrics,
            xteRatioThresholdNormal: num(p.xteRatioThresholdNormal),
            xteRatioThresholdFlat: num(p.xteRatioThresholdFlat),
            easing: p.easing !== false
          },
          stableDigits: p.stableDigits === true
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
