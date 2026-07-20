/**
 * @file ActiveRouteViewModel - Shared domain normalization for active-route kinds
 * Documentation: documentation/architecture/cluster-widget-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniActiveRouteViewModel = factory();
  }
})(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["trimText"]} */
  let trimText;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;

  /** @param {unknown} def @param {DyniComponentContext} componentContext */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    trimText = valueMath.trimText;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;

    /** @param {DyniMapperProps|null|undefined} props @param {DyniActiveRouteViewModelToolkit} toolkit @returns {Record<string, unknown>} */
    function build(props, toolkit) {
      const p = /** @type {DyniMapperProps} */ (props || {});
      const cap = toolkit.cap;
      const unit = toolkit.unit;
      const num = toolkit.num || toOptionalFiniteNumber;
      const routeName = trimText(p.activeRouteName);

      return {
        routeName: routeName,
        disconnect: p.disconnect === true || p.wpServer === false || routeName === "",
        display: {
          remain: num(p.activeRouteRemain),
          rteEta: p.activeRouteEta,
          nextCourse: num(p.activeRouteNextCourse),
          isApproaching: p.activeRouteApproaching === true
        },
        captions: {
          remain: cap("activeRouteRemain"),
          rteEta: cap("activeRouteEta"),
          nextCourse: cap("activeRouteNextCourse")
        },
        units: {
          rteEta: unit("activeRouteEta"),
          nextCourse: unit("activeRouteNextCourse")
        },
        hideSeconds: p.hideSeconds === true
      };
    }

    return {
      id: "ActiveRouteViewModel",
      build: build
    };
  }

  return { id: "ActiveRouteViewModel", create: create };
});
