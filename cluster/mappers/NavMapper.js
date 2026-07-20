/**
 * @file NavMapper - Cluster translation for navigation ETA/distance/position kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniNavMapper = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {{ display: { remain: unknown, rteEta: unknown, nextCourse: unknown, isApproaching: unknown }, routeName: unknown, captions: Record<string, unknown>, units: Record<string, unknown>, formatUnits?: Record<string, unknown>, hideSeconds: unknown }} DyniActiveRouteDomain */
  /** @typedef {{ build: (props: DyniMapperProps, toolkit: DyniMapperToolkit) => DyniActiveRouteDomain }} DyniActiveRouteMapperViewModel */
  /** @typedef {{ name: unknown, points: unknown[] }} DyniRoutePointsRoute */
  /** @typedef {{ route: DyniRoutePointsRoute | null, selectedIndex: unknown, isActiveRoute: unknown, showLatLon: unknown, useRhumbLine: unknown }} DyniRoutePointsDomain */
  /** @typedef {{ build: (props: DyniMapperProps, toolkit: DyniMapperToolkit) => DyniRoutePointsDomain }} DyniRoutePointsMapperViewModel */
  /** @typedef {{ displayName: unknown, pointCount: unknown, totalDistance: unknown, isLocalRoute: unknown, isServerRoute: unknown }} DyniEditRouteMapperRoute */
  /** @typedef {{ route: DyniEditRouteMapperRoute | null, hasRoute: unknown, remainingDistance: unknown, rteEta: unknown, hideSeconds: unknown, isActiveRoute: unknown }} DyniEditRouteDomain */
  /** @typedef {{ build: (props: DyniMapperProps, toolkit: DyniMapperToolkit) => DyniEditRouteDomain }} DyniEditRouteMapperViewModel */

  /** @param {unknown} def @param {unknown} componentContext */
  function create(def, componentContext) {
    /** @param {DyniMapperProps|null|undefined} props @param {DyniMapperRouteContextWithViewModel} routeContext @returns {Record<string, unknown>} */
    function translate(props, routeContext) {
      const p = /** @type {DyniMapperProps} */ (props || {});
      const toolkit = routeContext.toolkit;
      const viewModel = routeContext.viewModel;
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const out = toolkit.out;
      const num = toolkit.num;

      const req = p.kind;

      if (req === "wpEta") {
        return out(p.wpEta, cap("wpEta"), unit("wpEta"), p.hideSeconds === true ? "formatClock" : "formatTime", []);
      }
      if (req === "rteEta") {
        return out(p.rteEta, cap("rteEta"), unit("rteEta"), p.hideSeconds === true ? "formatClock" : "formatTime", []);
      }
      if (req === "dst") {
        const token = toolkit.formatUnit("dst", "distance");
        const o = out(p.dst, cap("dst"), toolkit.unitText("dst", "distance", token), "formatDistance", [token]);
        o.disconnect = p.disconnect === true;
        return o;
      }
      if (req === "rteDistance") {
        const token = toolkit.formatUnit("rteDistance", "distance");
        return out(
          p.rteDistance,
          cap("rteDistance"),
          toolkit.unitText("rteDistance", "distance", token),
          "formatDistance",
          [token]
        );
      }
      if (req === "vmg") {
        const token = toolkit.formatUnit("vmg", "speed");
        return out(p.vmg, cap("vmg"), toolkit.unitText("vmg", "speed", token), "formatSpeed", [token]);
      }
      if (req === "activeRoute") {
        const activeRouteViewModel = /** @type {DyniActiveRouteMapperViewModel | null | undefined} */ (viewModel);
        if (!activeRouteViewModel || typeof activeRouteViewModel.build !== "function") {
          throw new Error("NavMapper: routeContext.viewModel is required for 'activeRoute'");
        }
        const activeRouteDomain = activeRouteViewModel.build(p, toolkit);
        const remainToken = toolkit.formatUnit("activeRouteRemain", "distance");
        activeRouteDomain.units.remain = toolkit.unitText("activeRouteRemain", "distance", remainToken);
        activeRouteDomain.formatUnits = { remain: remainToken };
        return {
          wpServer: p.wpServer,
          display: {
            remain: activeRouteDomain.display.remain,
            rteEta: activeRouteDomain.display.rteEta,
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
        const routePointsViewModel = /** @type {DyniRoutePointsMapperViewModel | null | undefined} */ (viewModel);
        if (!routePointsViewModel || typeof routePointsViewModel.build !== "function") {
          throw new Error("NavMapper: routeContext.viewModel is required for 'routePoints'");
        }
        const routePointsDomain = routePointsViewModel.build(p, toolkit);
        const distanceToken = toolkit.formatUnit("routePointsDistance", "distance");
        return {
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
        const editRouteViewModel = /** @type {DyniEditRouteMapperViewModel | null | undefined} */ (viewModel);
        if (!editRouteViewModel || typeof editRouteViewModel.build !== "function") {
          throw new Error("NavMapper: routeContext.viewModel is required for 'editRoute'");
        }
        const editRouteDomain = editRouteViewModel.build(p, toolkit);
        const route = editRouteDomain.route;
        return {
          domain: {
            hasRoute: editRouteDomain.hasRoute,
            routeName: route ? route.displayName : "",
            pointCount: route ? route.pointCount : 0,
            totalDistance: route ? route.totalDistance : undefined,
            remainingDistance: editRouteDomain.remainingDistance,
            rteEta: editRouteDomain.rteEta,
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
            rteEta: cap("editRouteEta")
          },
          units: {
            dst: toolkit.unitText("editRouteDst", "distance", toolkit.formatUnit("editRouteDst", "distance")),
            rte: toolkit.unitText("editRouteRte", "distance", toolkit.formatUnit("editRouteRte", "distance"))
          },
          formatUnits: {
            dst: toolkit.formatUnit("editRouteDst", "distance"),
            rte: toolkit.formatUnit("editRouteRte", "distance")
          }
        };
      }
      if (req === "positionBoat") {
        const o = out(p.positionBoat, cap("positionBoat"), unit("positionBoat"), "formatLonLats", []);
        o.coordinateFormatter = "formatLonLatsDecimal";
        o.coordinateFormatterParameters = [];
        return o;
      }
      if (req === "positionWp") {
        const o = out(p.positionWp, cap("positionWp"), unit("positionWp"), "formatLonLats", []);
        o.coordinateFormatter = "formatLonLatsDecimal";
        o.coordinateFormatterParameters = [];
        o.disconnect = p.disconnect === true;
        return o;
      }
      if (req === "xteDisplay") {
        const xteToken = toolkit.formatUnit("xteDisplayXte", "distance");
        const dtwToken = toolkit.formatUnit("xteDisplayDst", "distance");
        const headingUnit = unit("xteDisplayCog");
        return {
          display: {
            xte: num(p.xte),
            cog: num(p.cog),
            dtw: num(p.dtw),
            btw: num(p.btw),
            wpName: typeof p.wpName === "string" ? p.wpName.trim() : "",
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
          xteScale: toolkit.positiveUnitNumber("xteDisplayScale", xteToken, 1),
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
      if (req === "xteDisplayLinear") {
        const xteToken = toolkit.formatUnit("xteDisplayLinearXte", "distance");
        const dtwToken = toolkit.formatUnit("xteDisplayLinearDst", "distance");
        return {
          display: {
            xte: num(p.xte),
            cog: num(p.cog),
            dtw: num(p.dtw),
            btw: num(p.btw),
            wpName: typeof p.wpName === "string" ? p.wpName.trim() : "",
            disconnect: p.disconnect === true
          },
          captions: {
            xte: cap("xteDisplayLinearXte"),
            track: cap("xteDisplayLinearCog"),
            dtw: cap("xteDisplayLinearDst"),
            brg: cap("xteDisplayLinearBrg")
          },
          units: {
            xte: toolkit.unitText("xteDisplayLinearXte", "distance", xteToken),
            track: unit("xteDisplayLinearCog"),
            dtw: toolkit.unitText("xteDisplayLinearDst", "distance", dtwToken),
            brg: unit("xteDisplayLinearBrg")
          },
          formatUnits: {
            xte: xteToken,
            dtw: dtwToken
          },
          xteScale: toolkit.positiveUnitNumber("xteLinearScale", xteToken, 1),
          layout: {
            leadingZero: p.xteLinearLeadingZero !== false,
            showWpName: p.xteLinearShowWpName === true,
            hideTextualMetrics: !!p.xteLinearHideTextualMetrics,
            easing: p.xteLinearEasing !== false,
            ratioThresholdNormal: num(p.xteLinearRatioThresholdNormal),
            ratioThresholdFlat: num(p.xteLinearRatioThresholdFlat),
            tickMajor: num(p.xteLinearTickMajor),
            tickMinor: num(p.xteLinearTickMinor),
            showEndLabels: !!p.xteLinearShowEndLabels
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
});
