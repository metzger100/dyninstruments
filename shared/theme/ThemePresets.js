/**
 * Module: ThemePresets - Shared theme preset selector API for widget root containers
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: none
 * Thickness hierarchy: slim < default < bold; only thickness-related tokens shift.
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      const mod = factory();
      mod.PRESETS = mod.create.PRESETS;
      mod.normalizePresetName = mod.create.normalizePresetName;
      return mod;
    });
  } else if (typeof module === "object" && module.exports) {
    const mod = factory();
    mod.PRESETS = mod.create.PRESETS;
    mod.normalizePresetName = mod.create.normalizePresetName;
    module.exports = mod;
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemePresets = factory();
    root.DyniComponents.DyniThemePresets.PRESETS = root.DyniComponents.DyniThemePresets.create.PRESETS;
    root.DyniComponents.DyniThemePresets.normalizePresetName = root.DyniComponents.DyniThemePresets.create.normalizePresetName;
  }
}(this, function () {
  "use strict";

  const PRESETS = {
    default: {},
    slim: {
      radial: {
        ring: { arcLineWidth: 1 },
        ticks: { majorWidth: 2, minorWidth: 1 },
        pointer: { widthFactor: 0.72 }
      },
      linear: {
        track: { lineWidth: 1 },
        ticks: { majorWidth: 2, minorWidth: 1 },
        pointer: { widthFactor: 0.72 }
      },
      font: { labelWeight: 400 },
      xte: { lineWidthFactor: 1 }
    },
    bold: {
      radial: {
        ring: { arcLineWidth: 2.5 },
        ticks: { majorWidth: 4, minorWidth: 2 },
        pointer: { widthFactor: 1.54 }
      },
      linear: {
        track: { lineWidth: 2.5 },
        ticks: { majorWidth: 4, minorWidth: 2 },
        pointer: { widthFactor: 1.54 }
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
        pointer: { widthFactor: 1.4 }
      },
      linear: {
        track: { lineWidth: 2 },
        ticks: { majorWidth: 3, minorWidth: 2 },
        pointer: { widthFactor: 1.4 }
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
      remove: remove,
      normalizePresetName: normalizePresetName
    };
  }

  create.PRESETS = PRESETS;
  create.normalizePresetName = normalizePresetName;

  return { id: "ThemePresets", create };
}));
