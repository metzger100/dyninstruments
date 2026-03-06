/**
 * Module: ThemePresets - Shared theme preset selector API for widget root containers
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: none
 * Thickness hierarchy: slim < default < bold; only stroke-related tokens shift.
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
      radial: {
        ring: { arcLineWidth: 1, widthFactor: 0.12 },
        ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
        pointer: { sideFactor: 0.18 }
      },
      linear: {
        track: { widthFactor: 0.12, lineWidth: 1 },
        ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
        pointer: { sideFactor: 0.18 }
      },
      font: { labelWeight: 400 },
      xte: { lineWidthFactor: 1 }
    },
    bold: {
      radial: {
        ring: { arcLineWidth: 2.5, widthFactor: 0.2 },
        ticks: { majorLen: 16, majorWidth: 4, minorLen: 9, minorWidth: 2 },
        pointer: { sideFactor: 0.35, lengthFactor: 2.2 }
      },
      linear: {
        track: { widthFactor: 0.2, lineWidth: 2.5 },
        ticks: { majorLen: 16, majorWidth: 4, minorLen: 9, minorWidth: 2 },
        pointer: { sideFactor: 0.35, lengthFactor: 2.2 }
      },
      xte: { lineWidthFactor: 2 }
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
      radial: {
        ring: { arcLineWidth: 2 },
        ticks: { majorWidth: 3, minorWidth: 2 },
        pointer: { sideFactor: 0.35 }
      },
      linear: {
        track: { lineWidth: 2 },
        ticks: { majorWidth: 3, minorWidth: 2 },
        pointer: { sideFactor: 0.35 }
      },
      xte: { lineWidthFactor: 1.3 }
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
