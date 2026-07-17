/**
 * @file EditRouteViewModel - Shared domain normalization for nav edit-route summary kind
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteViewModel = factory();
  }
}(this, function () {
  "use strict";

  const LOCAL_ROUTE_PREFIX = "local@";

  /** @typedef {{ name?: unknown, points: unknown[], computeLength?: (fromIndex: number, useRhumbLine: boolean) => unknown } & Record<string, unknown>} DyniEditRouteSource */
  /** @typedef {{ rawName: string, displayName: string, pointCount: number, totalDistance: number, isLocalRoute: boolean, isServerRoute: boolean, sourceRoute: DyniEditRouteSource }} DyniEditRouteSummary */
  /** @typedef {{ editingRoute?: unknown, useRhumbLine?: unknown, activeName?: unknown, rteDistance?: unknown, rteEta?: unknown, hideSeconds?: unknown }} DyniEditRouteProps */
  /** @typedef {{ route: DyniEditRouteSummary | null, hasRoute: boolean, isActiveRoute: boolean, remainingDistance: number | undefined, rteEta: unknown, hideSeconds: boolean }} DyniEditRouteViewModelOutput */
  /** @typedef {{ id: "EditRouteViewModel", build: (props?: DyniEditRouteProps) => DyniEditRouteViewModelOutput }} DyniEditRouteViewModelApi */

  /** @type {DyniValueMathApi["isObject"]} */
  let isObject;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;

  /** @param {unknown} value @returns {string} */
  function toRawName(value) {
    return typeof value === "string" ? value : "";
  }

  /** @param {string} rawName @returns {string} */
  function toDisplayName(rawName) {
    if (rawName.indexOf(LOCAL_ROUTE_PREFIX) === 0) {
      return rawName.slice(LOCAL_ROUTE_PREFIX.length);
    }
    return rawName;
  }

  /** @param {string} rawName @returns {boolean} */
  function isServerName(rawName) {
    return typeof rawName === "string" && rawName !== "" && rawName.indexOf(LOCAL_ROUTE_PREFIX) !== 0;
  }

  /** @param {unknown} previousPoint @param {unknown} currentPoint @param {boolean} useRhumbLine @param {DyniCenterDisplayMathApi} centerMath @returns {number} */
  function computeLegDistance(previousPoint, currentPoint, useRhumbLine, centerMath) {
    const leg = centerMath.computeCourseDistance(previousPoint, currentPoint, useRhumbLine === true);
    if (!leg || typeof leg !== "object") {
      return 0;
    }
    const distance = toOptionalFiniteNumber(leg.distance);
    return typeof distance === "number" ? distance : 0;
  }

  /** @param {unknown[]} points @param {boolean} useRhumbLine @param {DyniCenterDisplayMathApi} centerMath @returns {number} */
  function computeLegSumDistance(points, useRhumbLine, centerMath) {
    if (!Array.isArray(points) || points.length <= 1) {
      return 0;
    }

    let totalDistance = 0;
    for (let index = 1; index < points.length; index += 1) {
      totalDistance += computeLegDistance(points[index - 1], points[index], useRhumbLine, centerMath);
    }
    return totalDistance;
  }

  /** @param {unknown} sourceRoute @param {unknown[]} points @param {boolean} useRhumbLine @param {DyniCenterDisplayMathApi} centerMath @returns {number} */
  function computeTotalDistance(sourceRoute, points, useRhumbLine, centerMath) {
    if (isObject(sourceRoute) && typeof sourceRoute.computeLength === "function") {
      try {
        const computeLength = /** @type {(fromIndex: number, useRhumbLine: boolean) => unknown} */ (sourceRoute.computeLength);
        const computed = toOptionalFiniteNumber(computeLength(0, useRhumbLine === true));
        if (typeof computed === "number") {
          return computed;
        }
      } catch (err) { /* dyni-lint-disable-line catch-fallback-without-suppression -- Host-provided route objects may throw from computeLength; fail closed to leg-sum math. */
        // Ignore computeLength failures and fail closed via leg-sum fallback.
      }
    }

    try {
      return computeLegSumDistance(points, useRhumbLine, centerMath);
    } catch (err) { /* dyni-lint-disable-line catch-fallback-without-suppression -- Malformed point payloads must fail closed and keep summary rendering alive. */
      return 0;
    }
  }

  /** @param {unknown} rawRoute @param {boolean} useRhumbLine @param {DyniCenterDisplayMathApi} centerMath @returns {DyniEditRouteSummary | null} */
  function normalizeRoute(rawRoute, useRhumbLine, centerMath) {
    if (!isObject(rawRoute) || !Array.isArray(rawRoute.points)) {
      return null;
    }

    const sourceRoute = /** @type {DyniEditRouteSource} */ (rawRoute);
    const rawName = toRawName(sourceRoute.name);
    const isServerRoute = isServerName(rawName);

    return {
      rawName: rawName,
      displayName: toDisplayName(rawName),
      pointCount: sourceRoute.points.length,
      totalDistance: computeTotalDistance(sourceRoute, sourceRoute.points, useRhumbLine, centerMath),
      isLocalRoute: !isServerRoute,
      isServerRoute: isServerRoute,
      sourceRoute: sourceRoute
    };
  }

  /** @param {DyniEditRouteSummary | null} route @param {unknown} activeName @returns {boolean} */
  function isActiveRoute(route, activeName) {
    return !!route && typeof activeName === "string" && activeName !== "" && route.rawName === activeName;
  }

  /** @param {unknown} def @param {DyniComponentContext} componentContext @returns {DyniEditRouteViewModelApi} */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    isObject = valueMath.isObject;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    const centerMath = componentContext.components.require("CenterDisplayMath");

    /** @param {DyniEditRouteProps | undefined} props @returns {DyniEditRouteViewModelOutput} */
    function build(props) {
      const p = /** @type {DyniEditRouteProps} */ (props || {});
      const route = normalizeRoute(p.editingRoute, p.useRhumbLine === true, centerMath);
      const active = isActiveRoute(route, p.activeName);

      return {
        route: route,
        hasRoute: !!route,
        isActiveRoute: active,
        remainingDistance: active ? toOptionalFiniteNumber(p.rteDistance) : undefined,
        rteEta: active ? p.rteEta : undefined,
        hideSeconds: p.hideSeconds === true
      };
    }

    return {
      id: "EditRouteViewModel",
      build: build
    };
  }

  return { id: "EditRouteViewModel", create: create };
}));
