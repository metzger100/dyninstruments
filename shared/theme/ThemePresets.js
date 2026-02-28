/**
 * Module: ThemePresets - Shared theme preset selector API for widget root containers
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: none
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

  function normalizePresetName(presetName) {
    if (typeof presetName !== "string") {
      return "default";
    }
    const normalized = presetName.trim().toLowerCase();
    if (!normalized || !Object.prototype.hasOwnProperty.call(PRESETS, normalized)) {
      return "default";
    }
    return normalized;
  }

  function create() {
    function remove(containerEl) {
      if (!containerEl || typeof containerEl.removeAttribute !== "function") {
        return;
      }
      containerEl.removeAttribute("data-dyni-theme");
    }

    function apply(containerEl, presetName) {
      if (!containerEl || typeof containerEl.setAttribute !== "function") {
        return;
      }

      const name = normalizePresetName(presetName);
      if (name === "default") {
        remove(containerEl);
        return;
      }
      containerEl.setAttribute("data-dyni-theme", name);
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
