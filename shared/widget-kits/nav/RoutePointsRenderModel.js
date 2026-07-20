/**
 * @file RoutePointsRenderModel - Pure normalization and display model owner for route-points HTML renderer
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsRenderModel = factory();
  }
})(this, function () {
  "use strict";

  /** @typedef {Record<string, unknown> & { points?: DyniRoutePointRecord[] }} DyniRouteRecord */
  /** @typedef {Record<string, unknown>} DyniRoutePointRecord */
  /** @typedef {{ idx: number, name: string, lat?: number, lon?: number, routeName: string, selected: boolean, course?: number, distance?: number }} DyniRoutePointSnapshot */
  /** @typedef {{ props?: unknown, shellRect?: DyniHtmlShellRect | null, isVerticalCommitted?: boolean, scrollbarGutterPx?: unknown, viewportHeight?: unknown }} DyniRoutePointsBuildArgs */
  /** @typedef {DyniRoutePointsLayoutResult & { mode: "flat" | "high" | "normal", rowPolicy?: DyniRoutePointsRowPolicy, contentRect: DyniRect, headerRect?: DyniRect | null, listRect?: DyniRect, headerLayout?: unknown, rows?: unknown[] }} DyniRoutePointsModelLayout */
  /** @typedef {{ resolveMode: (args?: unknown) => "flat" | "high" | "normal", computeNaturalHeight: (args?: unknown) => { cappedHeight: number }, computeInsets: (W: unknown, H: unknown) => Record<string, unknown>, createContentRect: (W: unknown, H: unknown, insets: Record<string, unknown>) => DyniRect, computeLayout: (args?: unknown) => DyniRoutePointsModelLayout, computeInlineGeometry: (args?: unknown) => DyniRoutePointsInlineGeometry }} DyniRoutePointsLayoutService */

  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber = /** @type {DyniValueMathApi["toFiniteNumber"]} */ (/** @type {unknown} */ (null));
  /** @type {DyniValueMathApi["toObject"]} */
  let toObject = /** @type {DyniValueMathApi["toObject"]} */ (/** @type {unknown} */ (null));
  /** @type {DyniValueMathApi["toSafeInteger"]} */
  let toSafeInteger = /** @type {DyniValueMathApi["toSafeInteger"]} */ (/** @type {unknown} */ (null));
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber = /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */ (
    /** @type {unknown} */ (null)
  );

  /** @param {unknown} value @param {number} defaultValue @returns {number} */
  function toSafeOptionalInteger(value, defaultValue) {
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number" || !Number.isFinite(n)) {
      return defaultValue;
    }
    return Math.floor(n);
  }

  /** @param {unknown} routeValue @returns {DyniRouteRecord | null} */
  function toRoute(routeValue) {
    const route = routeValue && typeof routeValue === "object" ? /** @type {DyniRouteRecord} */ (routeValue) : null;
    if (!route || !Array.isArray(route.points)) {
      return null;
    }
    return route;
  }

  /** @param {unknown} pointValue @returns {DyniRoutePointRecord} */
  function toPoint(pointValue) {
    return pointValue && typeof pointValue === "object" ? /** @type {DyniRoutePointRecord} */ (pointValue) : {};
  }

  const PLACEHOLDER_VALUE = "--";

  /** @param {DyniRoutePointRecord | null} point @returns {boolean} */
  function hasFiniteCoordinates(point) {
    if (!point || typeof point !== "object") {
      return false;
    }
    return (
      typeof toOptionalFiniteNumber(point.lat) === "number" && typeof toOptionalFiniteNumber(point.lon) === "number"
    );
  }

  /** @param {DyniRoutePointsRenderModel | Partial<DyniRoutePointsRenderModel>} model @returns {Array<string | number>} */
  function buildRoutePointsSignatureParts(model) {
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

  /** @param {string[]} parts @param {string} label @param {unknown} value */
  function appendIdentityPart(parts, label, value) {
    if (value == null) {
      return;
    }
    const text = String(value).trim();
    if (text) {
      parts.push(label + ":" + text);
    }
  }

  /** @param {string[]} parts @param {string} label @param {unknown} value */
  function appendCoordinatePart(parts, label, value) {
    const n = toOptionalFiniteNumber(value);
    if (typeof n !== "number") {
      return;
    }
    parts.push(label + ":" + n.toFixed(6));
  }

  /** @param {DyniRoutePointRecord} point @param {number} rowIndex @returns {string} */
  function buildPointIdentityKey(point, rowIndex) {
    const p = toPoint(point);
    const parts = /** @type {string[]} */ ([]);
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

  /** @param {DyniRoutePointRecord} point @param {number} rowIndex @param {string} routeName @param {boolean} selected @param {DyniHtmlWidgetUtilsApi} htmlUtils @returns {DyniRoutePointSnapshot} */
  function buildPointSnapshot(point, rowIndex, routeName, selected, htmlUtils) {
    const p = toPoint(point);
    const idxRaw = toOptionalFiniteNumber(p.idx);
    const courseRaw = toOptionalFiniteNumber(p.course);
    const distanceRaw = toOptionalFiniteNumber(p.distance);
    const snapshot = /** @type {DyniRoutePointSnapshot} */ ({
      idx: typeof idxRaw === "number" && Number.isInteger(idxRaw) && idxRaw >= 0 ? idxRaw : rowIndex,
      name: htmlUtils.trimText(p.name),
      lat: toOptionalFiniteNumber(p.lat),
      lon: toOptionalFiniteNumber(p.lon),
      routeName: routeName,
      selected: selected === true
    });

    if (typeof courseRaw === "number") {
      snapshot.course = courseRaw;
    }
    if (typeof distanceRaw === "number") {
      snapshot.distance = distanceRaw;
    }

    return snapshot;
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const routePointsHtmlFit = componentContext.components.require("RoutePointsHtmlFit");
    const centerMath = componentContext.components.require("CenterDisplayMath");
    const layoutApi = /** @type {DyniRoutePointsLayoutService} */ (
      /** @type {unknown} */ (componentContext.components.require("RoutePointsLayout"))
    );
    const htmlUtils = componentContext.components.require("HtmlWidgetUtils");
    const navInteractionPolicy = componentContext.components.require("NavInteractionPolicy");
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenInteraction = componentContext.components.require("StateScreenInteraction");
    const valueMath = componentContext.components.require("ValueMath");
    toFiniteNumber = valueMath.toFiniteNumber;
    toObject = valueMath.toObject;
    toSafeInteger = valueMath.toSafeInteger;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    /** @param {Record<string, unknown>} props @param {DyniRouteRecord | null} route @returns {string} */
    function resolveStateKind(props, route) {
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: props.disconnect === true },
        { kind: "noRoute", when: !route },
        { kind: "data", when: true }
      ]);
    }

    /** @param {DyniRoutePointsBuildArgs | undefined} args @returns {DyniRoutePointsRenderModel} */
    function buildModel(args) {
      const cfg = /** @type {DyniRoutePointsBuildArgs} */ (args || {});
      const props = toObject(cfg.props);
      const domain = toObject(props.domain);
      const layout = toObject(props.layout);
      const formatting = toObject(props.formatting);
      const isVerticalContainer = cfg.isVerticalCommitted === true;

      const route = toRoute(domain.route);
      const kind = resolveStateKind(props, route);
      const hasRoute = kind === "data" && !!route;
      const points = hasRoute ? /** @type {DyniRoutePointRecord[]} */ (route.points) : [];
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
      const activeKey = hasValidSelection ? buildPointIdentityKey(points[selectedIndex], selectedIndex) : null;
      const defaultText = Object.prototype.hasOwnProperty.call(props, "default")
        ? String(props.default)
        : placeholderNormalize.normalize(undefined, undefined);
      const formatUnits = toObject(props.formatUnits);
      const displayUnits = toObject(props.units);
      const distanceUnit = htmlUtils.trimText(displayUnits.distance);
      const formatDistanceUnit = htmlUtils.trimText(formatUnits.distance);
      const courseUnit = htmlUtils.trimText(formatting.courseUnit);
      const waypointsText = htmlUtils.trimText(formatting.waypointsText);
      const routeNameText = hasRoute ? htmlUtils.trimText(domain.routeName) : "";
      const stateLabel = kind === "data" ? "" : stateScreenLabels.LABELS[kind] || "";
      const isActiveRoute = domain.isActiveRoute === true;
      const baseInteraction = navInteractionPolicy.canDispatchWhenNotEditing(props) ? "dispatch" : "passive";
      const interactionState = /** @type {string} */ (
        stateScreenInteraction.resolveInteraction({
          kind: kind,
          baseInteraction: baseInteraction
        })
      );
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
        const normalizedName = htmlUtils.trimText(currentPoint.name);
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
          pointSnapshot: buildPointSnapshot(currentPoint, i, routeNameText, i === selectedIndex, htmlUtils)
        });
      }

      const model = /** @type {DyniRoutePointsRenderModel} */ (
        /** @type {unknown} */ ({
          kind: kind,
          stateLabel: stateLabel,
          interactionState: interactionState,
          mode: layoutOutput.mode,
          showHeader: showHeader,
          hasRoute: hasRoute,
          routeNameText: routeNameText,
          metaText: hasRoute ? [String(pointCount), waypointsText].filter(Boolean).join(" ") : "",
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
        })
      );

      model.resizeSignatureParts = buildRoutePointsSignatureParts(model);
      return model;
    }

    return {
      id: "RoutePointsRenderModel",
      buildModel: buildModel,
      buildResizeSignatureParts: buildRoutePointsSignatureParts,
      canActivateRoutePoint: /** @param {unknown} args */ function (args) {
        const input = args && typeof args === "object" ? /** @type {Record<string, unknown>} */ (args) : null;
        return navInteractionPolicy.canDispatchWhenNotEditing(input && input.props);
      }
    };
  }

  return { id: "RoutePointsRenderModel", create: create };
});
