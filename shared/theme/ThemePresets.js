/**
 * Module: ThemePresets - Shared theme preset overrides for widget container CSS variables
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: ThemeResolver
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniThemePresets = factory(); }
}(this, function () {
  "use strict";

  const PRESETS = {
    default: {},
    slim: {
      ring: { arcLineWidth: 0.5, widthFactor: 0.09 },
      ticks: { majorWidth: 1.5, minorWidth: 0.75 },
      pointer: { sideFactor: 0.18 },
      font: { labelWeight: 400 }
    },
    bold: {
      ring: { arcLineWidth: 2, widthFactor: 0.16 },
      ticks: { majorLen: 12, majorWidth: 3, minorLen: 7, minorWidth: 1.5 },
      pointer: { sideFactor: 0.35, lengthFactor: 2.2 }
    },
    night: {
      colors: {
        pointer: "#cc2222",
        warning: "#8b6914",
        alarm: "#992222",
        laylineStb: "#3d6b3d",
        laylinePort: "#8b3333"
      }
    },
    highcontrast: {
      colors: {
        pointer: "#ff0000",
        warning: "#ffcc00",
        alarm: "#ff3300"
      },
      ring: { arcLineWidth: 2 },
      ticks: { majorWidth: 3, minorWidth: 2 },
      pointer: { sideFactor: 0.35 }
    }
  };

  function flattenTokenOverrides(source, prefix, out) {
    Object.keys(source || {}).forEach(function (key) {
      const value = source[key];
      const path = prefix ? (prefix + "." + key) : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flattenTokenOverrides(value, path, out);
        return;
      }
      out[path] = value;
    });
  }

  function create(def, Helpers) {
    const resolverMod = Helpers.getModule("ThemeResolver");
    const tokenDefs = Array.isArray(resolverMod && resolverMod.TOKEN_DEFS)
      ? resolverMod.TOKEN_DEFS
      : [];
    const pathToCssVar = {};
    const knownCssVars = [];

    tokenDefs.forEach(function (tokenDef) {
      if (!tokenDef || typeof tokenDef.path !== "string" || typeof tokenDef.cssVar !== "string") return;
      pathToCssVar[tokenDef.path] = tokenDef.cssVar;
      knownCssVars.push(tokenDef.cssVar);
    });

    function remove(containerEl) {
      const style = containerEl && containerEl.style;
      if (!style || typeof style.removeProperty !== "function") return;
      knownCssVars.forEach(function (cssVar) {
        style.removeProperty(cssVar);
      });
    }

    function apply(containerEl, presetName) {
      const style = containerEl && containerEl.style;
      if (!style || typeof style.setProperty !== "function") return;

      const name = (typeof presetName === "string" && presetName.trim())
        ? presetName.trim()
        : "default";
      const preset = PRESETS[name] || PRESETS.default;
      const flatOverrides = {};
      flattenTokenOverrides(preset, "", flatOverrides);

      remove(containerEl);
      Object.keys(flatOverrides).forEach(function (path) {
        const cssVar = pathToCssVar[path];
        if (!cssVar) return;
        style.setProperty(cssVar, String(flatOverrides[path]));
      });
    }

    return {
      id: "ThemePresets",
      presets: PRESETS,
      apply: apply,
      remove: remove
    };
  }

  return { id: "ThemePresets", create };
}));
