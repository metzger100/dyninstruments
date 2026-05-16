/**
 * Module: RoutePointsRenderModel - Pure normalization and display model owner for route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: CenterDisplayMath, RoutePointsHtmlFit, RoutePointsLayout, HtmlWidgetUtils, NavInteractionPolicy, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenInteraction, ValueMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsRenderModel = factory(); }
}(this, function () {
  "use strict";

  let toFiniteNumber;
  let toOptionalFiniteNumber;

  function toSafeInteger(value, defaultValue) {
    const n = toFiniteNumber(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.floor(n);
  }

  function toSafeOptionalInteger(value, defaultValue) {
    const n = toOptionalFiniteNumber(value);
    if (!Number.isFinite(n)) {
      return defaultValue;
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

  const PLACEHOLDER_VALUE = "--"; /* dyni-lint-disable-line hardcoded-runtime-default -- RoutePoints segment info contract requires a fixed placeholder token. */

  function hasFiniteCoordinates(point) {
    if (!point || typeof point !== "object") {
      return false;
    }
    return (
      typeof toOptionalFiniteNumber(point.lat) === "number" &&
      typeof toOptionalFiniteNumber(point.lon) === "number"
    );
  }

  function buildResizeSignatureParts(model) {
    const m = model || {};
    const shellWidth = toSafeInteger(m.shellWidth, 0);
    const shellHeight = toSafeInteger(m.shellHeight, 0);
    const scrollbarGutterPx = Math.max(0, toSafeInteger(m.scrollbarGutterPx, 0));

    if (m.kind && m.kind !== "data") {
      if (m.isVerticalContainer === true) {
        return [
          m.kind,
          shellWidth,
          m.showHeader ? 1 : 0,
          m.interactionState || "passive",
          m.stateLabel || "",
          scrollbarGutterPx
        ];
      }
      return [
        m.kind,
        m.mode || "normal",
        m.showHeader ? 1 : 0,
        m.interactionState || "passive",
        m.stableDigitsEnabled === true ? 1 : 0,
        shellWidth,
        shellHeight,
        m.stateLabel || "",
        scrollbarGutterPx
      ];
    }

    if (m.isVerticalContainer === true) {
      return [
        1,
        shellWidth,
        toSafeInteger(m.pointCount, 0),
        m.showHeader ? 1 : 0,
        m.showLatLon ? 1 : 0,
        m.stableDigitsEnabled === true ? 1 : 0,
        toSafeOptionalInteger(m.selectedIndex, -1),
        m.canActivateRoutePoint ? 1 : 0,
        scrollbarGutterPx
      ];
    }

    return [
      toSafeInteger(m.pointCount, 0),
      m.mode || "normal",
      m.showHeader ? 1 : 0,
      m.showLatLon ? 1 : 0,
      m.stableDigitsEnabled === true ? 1 : 0,
      toSafeOptionalInteger(m.selectedIndex, -1),
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
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number") {
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

  function buildPointSnapshot(point, rowIndex, routeName, selected, htmlUtils) {
    const p = toPoint(point);
    const idxRaw = toOptionalFiniteNumber(p.idx);
    const courseRaw = toOptionalFiniteNumber(p.course);
    const distanceRaw = toOptionalFiniteNumber(p.distance);
    const snapshot = {
      idx: Number.isInteger(idxRaw) && idxRaw >= 0 ? idxRaw : rowIndex,
      name: toText(p.name, htmlUtils),
      lat: toOptionalFiniteNumber(p.lat),
      lon: toOptionalFiniteNumber(p.lon),
      routeName: routeName,
      selected: selected === true
    };

    if (typeof courseRaw === "number") {
      snapshot.course = courseRaw;
    }
    if (typeof distanceRaw === "number") {
      snapshot.distance = distanceRaw;
    }

    return snapshot;
  }

  function create(def, componentContext) {
    const routePointsHtmlFit = componentContext.components.require("RoutePointsHtmlFit");
    const centerMath = componentContext.components.require("CenterDisplayMath");
    const layoutApi = componentContext.components.require("RoutePointsLayout");
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const navInteractionPolicy = componentContext.components.require("NavInteractionPolicy");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");
    const valueMath = componentContext.components.require("ValueMath");
    toFiniteNumber = valueMath.toFiniteNumber;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber || valueMath.toFiniteNumber;

    function resolveStateKind(props, route) {
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props.disconnect === true },
        { kind: "noRoute", when: !route },
        { kind: "data", when: true }
      ]);
    }

    function buildModel(args) {
      const cfg = args || {};
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layout = toObject(props.layout);
      const formatting = toObject(props.formatting);
      const isVerticalContainer = cfg.isVerticalCommitted === true;

      const route = toRoute(domain.route);
      const kind = resolveStateKind(props, route);
      const hasRoute = kind === "data" && !!route;
      const points = hasRoute ? route.points : [];
      const pointCount = points.length;

      const shellRect = cfg.shellRect && typeof cfg.shellRect === "object" ? cfg.shellRect : null;
      const shellWidth = shellRect ? Math.max(1, Math.round(toFiniteNumber(shellRect.width) || 0)) : 1;
      const shellHeight = shellRect ? Math.max(1, Math.round(toFiniteNumber(shellRect.height) || 0)) : 1;
      const scrollbarGutterPx = Math.max(0, toSafeInteger(cfg.scrollbarGutterPx, 0));
      const showHeader = layout.showHeader !== false;
      const showLatLon = domain.showLatLon === true;
      const useRhumbLine = domain.useRhumbLine === true;
      const stableDigitsEnabled = props.stableDigits === true;
      const selectedIndex = toSafeOptionalInteger(domain.selectedIndex, -1);
      const hasValidSelection = selectedIndex >= 0 && selectedIndex < pointCount;
      const activeKey = hasValidSelection
        ? buildPointIdentityKey(points[selectedIndex], selectedIndex)
        : null;
      const defaultText = Object.prototype.hasOwnProperty.call(props, "default")
        ? String(props.default)
        : placeholderNormalize.normalize(undefined, undefined);
      const formatUnits = toObject(props.formatUnits);
      const displayUnits = toObject(props.units);
      const distanceUnit = toText(displayUnits.distance, htmlUtils);
      const formatDistanceUnit = toText(formatUnits.distance, htmlUtils);
      const courseUnit = toText(formatting.courseUnit, htmlUtils);
      const waypointsText = toText(formatting.waypointsText, htmlUtils);
      const routeNameText = hasRoute
        ? toText(domain.routeName, htmlUtils)
        : "";
      const stateLabel = kind === "data" ? "" : (stateScreenLabels.LABELS[kind] || "");
      const isActiveRoute = domain.isActiveRoute === true;
      const baseInteraction = navInteractionPolicy.canDispatchWhenNotEditing(props) ? "dispatch" : "passive";
      const interactionState = stateScreenInteraction.resolveInteraction({
        kind: kind,
        baseInteraction: baseInteraction
      });
      const canActivate = interactionState === "dispatch";

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
        const currentValid = hasFiniteCoordinates(currentPoint);
        const previousValid = hasFiniteCoordinates(previousPoint);
        const normalizedName = toText(currentPoint.name, htmlUtils);
        const nameText = normalizedName || String(i);
        const infoText = routePointsHtmlFit.buildRowInfoText({
          index: i,
          showLatLon: showLatLon,
          previousPoint: previousPoint,
          currentPoint: currentPoint,
          previousValid: previousValid,
          currentValid: currentValid,
          useRhumbLine: useRhumbLine,
          formatDistanceUnit: formatDistanceUnit,
          distanceUnit: distanceUnit,
          courseUnit: courseUnit,
          defaultText: defaultText,
          componentContext: componentContext,
          centerMath: centerMath,
          placeholderNormalize: placeholderNormalize,
          stableDigitsEnabled: stableDigitsEnabled,
          stableDigits: stableDigits,
          placeholderValue: PLACEHOLDER_VALUE
        });

        rows.push({
          index: i,
          ordinalText: String(i + 1),
          nameText: nameText,
      infoText: infoText.valueText,
      infoPlainText: infoText.plainValueText,
          selected: i === selectedIndex,
          pointSnapshot: buildPointSnapshot(
            currentPoint,
            i,
            routeNameText,
            i === selectedIndex,
            htmlUtils
          )
        });
      }

      const model = {
        kind: kind,
        stateLabel: stateLabel,
        interactionState: interactionState,
        mode: layoutOutput.mode,
        showHeader: showHeader,
        hasRoute: hasRoute,
        routeNameText: routeNameText,
        metaText: hasRoute && waypointsText
          ? String(pointCount) + " " + waypointsText
          : (hasRoute ? String(pointCount) : ""),
        waypointsText: waypointsText,
        courseUnit: courseUnit,
        units: {
          distance: distanceUnit
        },
        formatUnits: {
          distance: formatDistanceUnit
        },
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
        stableDigitsEnabled: stableDigitsEnabled,
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
        return navInteractionPolicy.canDispatchWhenNotEditing(args && args.props);
      }
    };
  }

  return { id: "RoutePointsRenderModel", create: create };
}));
