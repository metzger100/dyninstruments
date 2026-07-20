/**
 * @file DyniUnitFormatFamilies - Bootstrap-loaded formatter family catalog and metric bindings
 * Documentation: documentation/architecture/component-system.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniUnitFormatFamilies = factory();
  }
})(
  this,
  /** @this {unknown} */ function () {
    "use strict";

    /** @typedef {{ tokens: readonly string[], labels: Readonly<Record<string, string>>, selectorList: readonly DyniEditableOption[] }} DyniUnitFormatFamilyRecord */
    /** @typedef {{ families: Readonly<Record<string, DyniUnitFormatFamilyRecord>>, metricBindings: Readonly<Record<string, DyniUnitFormatBinding>> }} DyniUnitFormatCatalogRecord */
    /** @typedef {{ config?: DyniPluginConfig }} DyniUnitFormatNamespace */
    /** @typedef {{ DyniPlugin?: DyniUnitFormatNamespace, DyniComponents?: Record<string, unknown> }} DyniUnitFormatGlobalRoot */

    const globalRoot = /** @type {DyniUnitFormatGlobalRoot} */ (
      typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
          ? window
          : /** @type {unknown} */ (this)
    );
    const ns = (globalRoot.DyniPlugin = globalRoot.DyniPlugin || {});
    const config = (ns.config = ns.config || /** @type {DyniPluginConfig} */ ({}));
    const shared = (config.shared = config.shared || {});

    /** @param {string} name @param {string} value @returns {DyniEditableOption} */
    function opt(name, value) {
      return { name: name, value: value };
    }

    /** @param {readonly string[]} tokens @param {Readonly<Record<string, string>>} labels @returns {readonly DyniEditableOption[]} */
    function freezeSelectorList(tokens, labels) {
      return Object.freeze(
        tokens.map(function (token) {
          return opt(labels[token], token);
        })
      );
    }

    /** @param {readonly string[]} tokens @param {Readonly<Record<string, string>>} labels @returns {DyniUnitFormatFamilyRecord} */
    function freezeFamily(tokens, labels) {
      const frozenTokens = Object.freeze(tokens.slice());
      const frozenLabels = Object.freeze(Object.assign({}, labels));
      return Object.freeze({
        tokens: frozenTokens,
        labels: frozenLabels,
        selectorList: freezeSelectorList(frozenTokens, frozenLabels)
      });
    }

    /** @param {string} family @param {string} defaultToken @param {string | undefined} [rendererKey] @returns {DyniUnitFormatBinding} */
    function freezeBinding(family, defaultToken, rendererKey) {
      /** @type {DyniUnitFormatBinding} */
      const out = {
        family: family,
        defaultToken: defaultToken
      };
      if (typeof rendererKey === "string" && rendererKey.length > 0) {
        out.rendererKey = rendererKey;
      }
      return Object.freeze(out);
    }

    const families = Object.freeze({
      speed: freezeFamily(["kn", "ms", "kmh"], {
        kn: "kn",
        ms: "m/s",
        kmh: "km/h"
      }),
      distance: freezeFamily(["nm", "m", "km", "ft", "yd"], {
        nm: "nm",
        m: "m",
        km: "km",
        ft: "ft",
        yd: "yd"
      }),
      temperature: freezeFamily(["celsius", "kelvin"], {
        celsius: "\u00b0C",
        kelvin: "K"
      }),
      pressure: freezeFamily(["pa", "hpa", "bar"], {
        pa: "Pa",
        hpa: "hPa",
        bar: "bar"
      })
    });

    const metricBindings = Object.freeze({
      sog: freezeBinding("speed", "kn"),
      stw: freezeBinding("speed", "kn"),
      sogLinear: freezeBinding("speed", "kn"),
      stwLinear: freezeBinding("speed", "kn"),
      sogRadial: freezeBinding("speed", "kn"),
      stwRadial: freezeBinding("speed", "kn"),
      vmg: freezeBinding("speed", "kn"),
      speedTrue: freezeBinding("speed", "kn"),
      speedApparent: freezeBinding("speed", "kn"),
      angleTrueRadialSpeed: freezeBinding("speed", "kn"),
      angleApparentRadialSpeed: freezeBinding("speed", "kn"),
      angleTrueLinearSpeed: freezeBinding("speed", "kn"),
      angleApparentLinearSpeed: freezeBinding("speed", "kn"),

      dst: freezeBinding("distance", "nm"),
      rteDistance: freezeBinding("distance", "nm"),
      activeRouteRemain: freezeBinding("distance", "nm", "remain"),
      xteDisplayXte: freezeBinding("distance", "nm", "xte"),
      xteDisplayDst: freezeBinding("distance", "nm", "dtw"),
      xteDisplayLinearXte: freezeBinding("distance", "nm", "xte"),
      xteDisplayLinearDst: freezeBinding("distance", "nm", "dtw"),
      editRouteDst: freezeBinding("distance", "nm", "dst"),
      editRouteRte: freezeBinding("distance", "nm", "rte"),
      routePointsDistance: freezeBinding("distance", "nm", "distance"),
      aisTargetDst: freezeBinding("distance", "nm", "dst"),
      aisTargetCpa: freezeBinding("distance", "nm", "cpa"),
      centerDisplayMarker: freezeBinding("distance", "nm", "marker"),
      centerDisplayBoat: freezeBinding("distance", "nm", "boat"),
      centerDisplayMeasure: freezeBinding("distance", "nm", "measure"),
      anchorDistance: freezeBinding("distance", "m"),
      anchorWatch: freezeBinding("distance", "m"),
      depth: freezeBinding("distance", "m"),
      depthLinear: freezeBinding("distance", "m"),
      depthRadial: freezeBinding("distance", "m"),

      temp: freezeBinding("temperature", "celsius"),
      tempLinear: freezeBinding("temperature", "celsius"),
      tempRadial: freezeBinding("temperature", "celsius"),

      pressure: freezeBinding("pressure", "hpa")
    });

    /** @type {DyniUnitFormatCatalogRecord} */
    const catalog = Object.freeze({
      families: families,
      metricBindings: metricBindings
    });

    shared.unitFormatFamilies = catalog;

    return catalog;
  }
);
