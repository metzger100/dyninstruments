/**
 * Module: RoutePointsRenderModel - Pure normalization and display model owner for route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: CenterDisplayMath, RoutePointsLayout, HtmlWidgetUtils
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsRenderModel = factory(); }
}(this, function () {
  "use strict";

  const PLACEHOLDER_VALUE = "---"; /* dyni-lint-disable-line hardcoded-runtime-default -- RoutePoints segment info contract requires a fixed placeholder token. */

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function toSafeInteger(value, fallback) {
    const n = toFiniteNumber(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.floor(n);
  }

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value, htmlUtils) {
    return htmlUtils.trimText(value);
  }

  function toRoute(routeValue) {
    const route = routeValue && typeof routeValue === "object" ? routeValue : null;
    if (!route || !Array.isArray(route.points)) {
      return null;
    }
    return route;
  }

  function toPoint(pointValue) {
    return pointValue && typeof pointValue === "object" ? pointValue : {};
  }

  function hasFiniteCoordinates(point, htmlUtils) {
    if (!point || typeof point !== "object") {
      return false;
    }
    return (
      typeof htmlUtils.toFiniteNumber(point.lat) === "number" &&
      typeof htmlUtils.toFiniteNumber(point.lon) === "number"
    );
  }

  function toCapabilities(hostContext) {
    const ctx = hostContext && typeof hostContext === "object" ? hostContext : null;
    const hostActions = ctx && ctx.hostActions ? ctx.hostActions : null;
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return null;
    }
    const capabilities = hostActions.getCapabilities();
    return capabilities && typeof capabilities === "object" ? capabilities : null;
  }

  function canActivateRoutePoint(args) {
    const cfg = args || {};
    const htmlUtils = cfg.htmlUtils;
    if (!htmlUtils) {
      return false;
    }

    const props = toObject(cfg.props);
    if (htmlUtils.isEditingMode(props)) {
      return false;
    }

    const hostContext = cfg.hostContext && typeof cfg.hostContext === "object" ? cfg.hostContext : null;
    const hostActions = hostContext && hostContext.hostActions ? hostContext.hostActions : null;
    if (!hostActions || typeof hostActions.getCapabilities !== "function") {
      return false;
    }
    if (!hostActions.routePoints || typeof hostActions.routePoints.activate !== "function") {
      return false;
    }

    const capabilities = toCapabilities(hostContext);
    if (!capabilities || !capabilities.routePoints || !capabilities.routeEditor) {
      return false;
    }

    return (
      capabilities.routePoints.activate === "dispatch" &&
      capabilities.routeEditor.openEditRoute === "dispatch"
    );
  }

  function formatLatLonInfo(point, defaultText, Helpers) {
    return String(Helpers.applyFormatter({ lat: point.lat, lon: point.lon }, {
      formatter: "formatLonLats",
      formatterParameters: [],
      default: defaultText
    }));
  }

  function formatCourseDistanceInfo(previousPoint, currentPoint, useRhumbLine, distanceUnit, courseUnit, Helpers, centerMath) {
    if (!previousPoint || !currentPoint) {
      return PLACEHOLDER_VALUE + courseUnit + "/" + PLACEHOLDER_VALUE + distanceUnit;
    }

    const leg = centerMath.computeCourseDistance(previousPoint, currentPoint, useRhumbLine === true);
    if (!leg) {
      return PLACEHOLDER_VALUE + courseUnit + "/" + PLACEHOLDER_VALUE + distanceUnit;
    }

    const courseText = String(Helpers.applyFormatter(leg.course, {
      formatter: "formatDirection",
      formatterParameters: [],
      default: PLACEHOLDER_VALUE
    }));
    const distanceText = String(Helpers.applyFormatter(leg.distance, {
      formatter: "formatDistance",
      formatterParameters: [distanceUnit],
      default: PLACEHOLDER_VALUE
    }));

    return courseText + courseUnit + "/" + distanceText + distanceUnit;
  }

  function buildRowInfo(args) {
    const cfg = args || {};
    if (cfg.showLatLon === true) {
      return formatLatLonInfo(cfg.currentPoint, cfg.defaultText, cfg.Helpers);
    }
    if (cfg.index <= 0) {
      return PLACEHOLDER_VALUE + cfg.courseUnit + "/" + PLACEHOLDER_VALUE + cfg.distanceUnit;
    }
    if (!cfg.previousValid || !cfg.currentValid) {
      return PLACEHOLDER_VALUE + cfg.courseUnit + "/" + PLACEHOLDER_VALUE + cfg.distanceUnit;
    }
    return formatCourseDistanceInfo(
      cfg.previousPoint,
      cfg.currentPoint,
      cfg.useRhumbLine,
      cfg.distanceUnit,
      cfg.courseUnit,
      cfg.Helpers,
      cfg.centerMath
    );
  }

  function buildResizeSignatureParts(model) {
    const m = model || {};
    const shellWidth = toSafeInteger(m.shellWidth, 0);
    const shellHeight = toSafeInteger(m.shellHeight, 0);
    const scrollbarGutterPx = Math.max(0, toSafeInteger(m.scrollbarGutterPx, 0));

    if (m.isVerticalContainer === true) {
      return [
        1,
        shellWidth,
        toSafeInteger(m.pointCount, 0),
        m.showHeader ? 1 : 0,
        m.showLatLon ? 1 : 0,
        toSafeInteger(m.selectedIndex, -1),
        m.canActivateRoutePoint ? 1 : 0,
        scrollbarGutterPx
      ];
    }

    return [
      toSafeInteger(m.pointCount, 0),
      m.mode || "normal",
      m.showHeader ? 1 : 0,
      m.showLatLon ? 1 : 0,
      toSafeInteger(m.selectedIndex, -1),
      m.canActivateRoutePoint ? 1 : 0,
      shellWidth,
      shellHeight,
      scrollbarGutterPx,
      0
    ];
  }

  function appendIdentityPart(parts, label, value) {
    if (value == null) {
      return;
    }
    const text = String(value).trim();
    if (text) {
      parts.push(label + ":" + text);
    }
  }

  function appendCoordinatePart(parts, label, value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return;
    }
    parts.push(label + ":" + n.toFixed(6));
  }

  function buildPointIdentityKey(point, rowIndex) {
    const p = toPoint(point);
    const parts = [];
    appendIdentityPart(parts, "id", p.id);
    appendIdentityPart(parts, "uid", p.uid);
    appendIdentityPart(parts, "uuid", p.uuid);
    appendIdentityPart(parts, "key", p.key);
    appendIdentityPart(parts, "pointId", p.pointId);
    appendCoordinatePart(parts, "lat", p.lat);
    appendCoordinatePart(parts, "lon", p.lon);
    appendIdentityPart(parts, "name", p.name);

    if (parts.length <= 0) {
      return "idx:" + String(rowIndex);
    }
    return parts.join("|");
  }

  function create(def, Helpers) {
    const centerMath = Helpers.getModule("CenterDisplayMath").create(def, Helpers);
    const layoutApi = Helpers.getModule("RoutePointsLayout").create(def, Helpers);
    const htmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layout = toObject(props.layout);
      const formatting = toObject(props.formatting);
      const isVerticalContainer = cfg.isVerticalCommitted === true;

      const route = toRoute(domain.route);
      const points = route ? route.points : [];
      const pointCount = points.length;

      const shellRect = cfg.shellRect && typeof cfg.shellRect === "object" ? cfg.shellRect : null;
      const shellWidth = shellRect ? Math.max(1, Math.round(toFiniteNumber(shellRect.width) || 0)) : 1;
      const shellHeight = shellRect ? Math.max(1, Math.round(toFiniteNumber(shellRect.height) || 0)) : 1;
      const scrollbarGutterPx = Math.max(0, toSafeInteger(cfg.scrollbarGutterPx, 0));
      const showHeader = layout.showHeader !== false;
      const showLatLon = domain.showLatLon === true;
      const useRhumbLine = domain.useRhumbLine === true;
      const selectedIndex = toSafeInteger(domain.selectedIndex, -1);
      const hasValidSelection = selectedIndex >= 0 && selectedIndex < pointCount;
      const activeKey = hasValidSelection
        ? buildPointIdentityKey(points[selectedIndex], selectedIndex)
        : null;
      const defaultText = Object.prototype.hasOwnProperty.call(props, "default")
        ? String(props.default)
        : PLACEHOLDER_VALUE;
      const distanceUnit = toText(formatting.distanceUnit, htmlUtils);
      const courseUnit = toText(formatting.courseUnit, htmlUtils);
      const waypointsText = toText(formatting.waypointsText, htmlUtils);
      const routeNameText = toText(domain.routeName, htmlUtils);
      const isActiveRoute = domain.isActiveRoute === true;
      const canActivate = canActivateRoutePoint({
        props: props,
        hostContext: cfg.hostContext,
        htmlUtils: htmlUtils
      });

      const resolvedMode = layoutApi.resolveMode({
        W: shellWidth,
        H: shellHeight,
        ratioThresholdNormal: layout.ratioThresholdNormal,
        ratioThresholdFlat: layout.ratioThresholdFlat,
        isVerticalContainer: isVerticalContainer
      });

      const naturalHeight = isVerticalContainer
        ? layoutApi.computeNaturalHeight({
          W: shellWidth,
          pointCount: pointCount,
          showHeader: showHeader,
          viewportHeight: toFiniteNumber(cfg.viewportHeight)
        })
        : null;

      const effectiveShellHeight = naturalHeight
        ? Math.max(1, toSafeInteger(naturalHeight.cappedHeight, shellHeight))
        : shellHeight;
      const insets = layoutApi.computeInsets(shellWidth, effectiveShellHeight);
      const contentRect = layoutApi.createContentRect(shellWidth, effectiveShellHeight, insets);
      const layoutOutput = layoutApi.computeLayout({
        contentRect: contentRect,
        mode: resolvedMode,
        ratioThresholdNormal: layout.ratioThresholdNormal,
        ratioThresholdFlat: layout.ratioThresholdFlat,
        isVerticalContainer: isVerticalContainer,
        verticalAnchorWidth: shellWidth,
        showHeader: showHeader,
        pointCount: pointCount,
        responsive: insets.responsive,
        trailingGutterPx: scrollbarGutterPx
      });
      const inlineGeometry = layoutApi.computeInlineGeometry({
        layout: layoutOutput,
        wrapperHeight: naturalHeight ? naturalHeight.cappedHeight : undefined
      });
      const showOrdinal = !!(layoutOutput.rowPolicy && layoutOutput.rowPolicy.showOrdinal);

      const rows = [];
      for (let i = 0; i < pointCount; i += 1) {
        const currentPoint = toPoint(points[i]);
        const previousPoint = i > 0 ? toPoint(points[i - 1]) : null;
        const currentValid = hasFiniteCoordinates(currentPoint, htmlUtils);
        const previousValid = hasFiniteCoordinates(previousPoint, htmlUtils);
        const normalizedName = toText(currentPoint.name, htmlUtils);
        const nameText = normalizedName || String(i);
        const infoText = buildRowInfo({
          index: i,
          showLatLon: showLatLon,
          previousPoint: previousPoint,
          currentPoint: currentPoint,
          previousValid: previousValid,
          currentValid: currentValid,
          useRhumbLine: useRhumbLine,
          distanceUnit: distanceUnit,
          courseUnit: courseUnit,
          defaultText: defaultText,
          Helpers: Helpers,
          centerMath: centerMath
        });

        rows.push({
          index: i,
          ordinalText: String(i + 1),
          nameText: nameText,
          infoText: infoText,
          selected: i === selectedIndex
        });
      }

      const model = {
        mode: layoutOutput.mode,
        showHeader: showHeader,
        hasRoute: !!route,
        routeNameText: routeNameText,
        metaText: waypointsText
          ? String(pointCount) + " " + waypointsText
          : String(pointCount),
        waypointsText: waypointsText,
        distanceUnit: distanceUnit,
        courseUnit: courseUnit,
        showLatLon: showLatLon,
        useRhumbLine: useRhumbLine,
        isVerticalContainer: isVerticalContainer,
        naturalHeight: naturalHeight,
        layoutShellHeight: effectiveShellHeight,
        inlineGeometry: inlineGeometry,
        showOrdinal: showOrdinal,
        points: rows,
        pointCount: pointCount,
        selectedIndex: selectedIndex,
        activeWaypointKey: activeKey,
        hasValidSelection: hasValidSelection,
        canActivateRoutePoint: canActivate,
        isActiveRoute: isActiveRoute,
        scrollbarGutterPx: scrollbarGutterPx,
        shellWidth: shellWidth,
        shellHeight: shellHeight,
        ratioThresholdNormal: layout.ratioThresholdNormal,
        ratioThresholdFlat: layout.ratioThresholdFlat
      };

      model.resizeSignatureParts = buildResizeSignatureParts(model);
      return model;
    }

    return {
      id: "RoutePointsRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildResizeSignatureParts,
      canActivateRoutePoint: function (args) {
        return canActivateRoutePoint({
          props: args && args.props,
          hostContext: args && args.hostContext,
          htmlUtils: htmlUtils
        });
      }
    };
  }

  return { id: "RoutePointsRenderModel", create: create };
}));
