/**
 * Module: ThemeModel - Canonical semantic owner for theme token/preset metadata
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemeModel = factory();
  }
}(this, function () {
  "use strict";

  const DEFAULT_PRESET_NAME = "default";
  const SUPPORTED_MODES = ["day", "night"];
  const DEFAULT_FONT_STACK = '"Inter","SF Pro Text",-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';

  const MERGE_ORDER = Object.freeze([
    "rootInputOverride",
    "presetModeOverride",
    "presetBaseOverride",
    "globalModeDefault",
    "globalBaseDefault"
  ]);

  function defineToken(path, inputVar, type, defaultValue, defaultByMode, outputVar) {
    return {
      path: path,
      inputVar: inputVar,
      type: type,
      default: defaultValue,
      defaultByMode: defaultByMode || undefined,
      outputVar: outputVar || undefined
    };
  }

  const TOKEN_DEFS = Object.freeze([
    defineToken("surface.fg", "--dyni-fg", "color", "black", { night: "rgba(252, 11, 11, 0.60)" }, "--dyni-theme-surface-fg"),
    defineToken("surface.bg", "--dyni-bg", "color", "white", { night: "black" }, "--dyni-theme-surface-bg"),
    defineToken("surface.border", "--dyni-border", "color", "rgba(0, 0, 0, 0.30)", { night: "rgba(252, 11, 11, 0.18)" }, "--dyni-theme-surface-border"),
    defineToken("font.family", "--dyni-font", "string", DEFAULT_FONT_STACK, undefined, "--dyni-theme-font-family"),
    defineToken("font.weight", "--dyni-font-weight", "number", 700, undefined, "--dyni-theme-font-weight"),
    defineToken("font.labelWeight", "--dyni-label-weight", "number", 700, undefined, "--dyni-theme-font-label-weight"),

    defineToken("colors.pointer", "--dyni-pointer", "color", "#ff2b2b", { night: "#cc2222" }),
    defineToken("colors.warning", "--dyni-warning", "color", "#e7c66a", { night: "#8b6914" }),
    defineToken("colors.alarm", "--dyni-alarm", "color", "#ff7a76", { night: "#992222" }),
    defineToken("colors.laylineStb", "--dyni-layline-stb", "color", "#82b683", { night: "#3d6b3d" }),
    defineToken("colors.laylinePort", "--dyni-layline-port", "color", "#ff7a76", { night: "#8b3333" }),
    defineToken("colors.ais.warning", "--dyni-ais-warning", "color", "#f39b52"),
    defineToken("colors.ais.nearest", "--dyni-ais-nearest", "color", "#66b8ff"),
    defineToken("colors.ais.tracking", "--dyni-ais-tracking", "color", "#89d38f"),
    defineToken("colors.ais.normal", "--dyni-ais-normal", "color", "#8da0b3"),

    defineToken("radial.ticks.majorLen", "--dyni-radial-tick-major-len", "number", 12),
    defineToken("radial.ticks.majorWidth", "--dyni-radial-tick-major-width", "number", 3),
    defineToken("radial.ticks.minorLen", "--dyni-radial-tick-minor-len", "number", 7),
    defineToken("radial.ticks.minorWidth", "--dyni-radial-tick-minor-width", "number", 1.5),
    defineToken("radial.pointer.widthFactor", "--dyni-radial-pointer-width", "number", 1),
    defineToken("radial.pointer.lengthFactor", "--dyni-radial-pointer-length", "number", 2),
    defineToken("radial.ring.arcLineWidth", "--dyni-radial-arc-linewidth", "number", 2),
    defineToken("radial.ring.widthFactor", "--dyni-radial-ring-width", "number", 0.16),
    defineToken("radial.labels.insetFactor", "--dyni-radial-label-inset", "number", 1.8),
    defineToken("radial.labels.fontFactor", "--dyni-radial-label-font", "number", 0.14),
    defineToken("radial.fullCircle.normal.innerMarginFactor", "--dyni-radial-fullcircle-normal-inner-margin", "number", 0.03),
    defineToken("radial.fullCircle.normal.minHeightFactor", "--dyni-radial-fullcircle-normal-min-height", "number", 0.45),
    defineToken("radial.fullCircle.normal.dualGapFactor", "--dyni-radial-fullcircle-normal-dual-gap", "number", 0.05),

    defineToken("linear.track.widthFactor", "--dyni-linear-track-width", "number", 0.16),
    defineToken("linear.track.lineWidth", "--dyni-linear-track-linewidth", "number", 2),
    defineToken("linear.ticks.majorLen", "--dyni-linear-tick-major-len", "number", 12),
    defineToken("linear.ticks.majorWidth", "--dyni-linear-tick-major-width", "number", 3),
    defineToken("linear.ticks.minorLen", "--dyni-linear-tick-minor-len", "number", 7),
    defineToken("linear.ticks.minorWidth", "--dyni-linear-tick-minor-width", "number", 1.5),
    defineToken("linear.pointer.widthFactor", "--dyni-linear-pointer-width", "number", 1),
    defineToken("linear.pointer.lengthFactor", "--dyni-linear-pointer-length", "number", 2),
    defineToken("linear.labels.insetFactor", "--dyni-linear-label-inset", "number", 1.8),
    defineToken("linear.labels.fontFactor", "--dyni-linear-label-font", "number", 0.14),

    defineToken("xte.lineWidthFactor", "--dyni-xte-line-width-factor", "number", 1.5),
    defineToken("xte.boatSizeFactor", "--dyni-xte-boat-size-factor", "number", 1)
  ]);

  const PRESETS = Object.freeze({
    default: {
      base: {},
      night: {
        surface: {
          fg: "rgba(252, 11, 11, 0.60)",
          bg: "black",
          border: "rgba(252, 11, 11, 0.18)"
        },
        colors: {
          pointer: "#cc2222",
          warning: "#8b6914",
          alarm: "#992222",
          laylineStb: "#3d6b3d",
          laylinePort: "#8b3333"
        }
      }
    },
    slim: {
      base: {
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
      }
    },
    bold: {
      base: {
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
      }
    },
    highcontrast: {
      base: {
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
    }
  });

  function setByPath(target, pathSegments, value) {
    let cursor = target;
    for (let i = 0; i < pathSegments.length - 1; i += 1) {
      const segment = pathSegments[i];
      if (!cursor[segment] || typeof cursor[segment] !== "object") {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }
    cursor[pathSegments[pathSegments.length - 1]] = value;
  }

  function buildBaseDefaults() {
    const out = {};
    TOKEN_DEFS.forEach(function (def) {
      setByPath(out, def.path.split("."), def.default);
    });
    return out;
  }

  function buildModeDefaults(mode) {
    const out = {};
    TOKEN_DEFS.forEach(function (def) {
      if (!def.defaultByMode || !Object.prototype.hasOwnProperty.call(def.defaultByMode, mode)) {
        return;
      }
      setByPath(out, def.path.split("."), def.defaultByMode[mode]);
    });
    return out;
  }

  const BASE_DEFAULTS = Object.freeze(buildBaseDefaults());
  const MODE_DEFAULTS = Object.freeze({
    day: Object.freeze(buildModeDefaults("day")),
    night: Object.freeze(buildModeDefaults("night"))
  });

  const TOKEN_DEF_BY_PATH = {};
  TOKEN_DEFS.forEach(function (def) {
    TOKEN_DEF_BY_PATH[def.path] = def;
  });

  const OUTPUT_TOKEN_DEFS = TOKEN_DEFS.filter(function (def) {
    return typeof def.outputVar === "string" && def.outputVar.length > 0;
  });

  function normalizePresetName(presetName) {
    if (typeof presetName !== "string") {
      return DEFAULT_PRESET_NAME;
    }
    const normalized = presetName.trim().toLowerCase();
    if (!normalized || normalized === "night") {
      return DEFAULT_PRESET_NAME;
    }
    return Object.prototype.hasOwnProperty.call(PRESETS, normalized)
      ? normalized
      : DEFAULT_PRESET_NAME;
  }

  function getSupportedPresetNames() {
    return Object.keys(PRESETS);
  }

  function getSupportedModes() {
    return SUPPORTED_MODES.slice();
  }

  function getPresetDefinition(presetName) {
    return PRESETS[normalizePresetName(presetName)];
  }

  function getPresetBase(presetName) {
    const preset = getPresetDefinition(presetName);
    return preset && preset.base ? preset.base : {};
  }

  function getPresetMode(presetName, mode) {
    const preset = getPresetDefinition(presetName);
    if (!preset || typeof mode !== "string") {
      return {};
    }
    return preset[mode] && typeof preset[mode] === "object" ? preset[mode] : {};
  }

  function getTokenDefinition(path) {
    return Object.prototype.hasOwnProperty.call(TOKEN_DEF_BY_PATH, path)
      ? TOKEN_DEF_BY_PATH[path]
      : null;
  }

  function getTokenDefinitions() {
    return TOKEN_DEFS.slice();
  }

  function getOutputTokenDefinitions() {
    return OUTPUT_TOKEN_DEFS.slice();
  }

  function getMergeOrder() {
    return MERGE_ORDER.slice();
  }

  return {
    id: "ThemeModel",
    DEFAULT_PRESET_NAME: DEFAULT_PRESET_NAME,
    PRESETS: PRESETS,
    BASE_DEFAULTS: BASE_DEFAULTS,
    MODE_DEFAULTS: MODE_DEFAULTS,
    normalizePresetName: normalizePresetName,
    getSupportedPresetNames: getSupportedPresetNames,
    getSupportedModes: getSupportedModes,
    getPresetDefinition: getPresetDefinition,
    getPresetBase: getPresetBase,
    getPresetMode: getPresetMode,
    getTokenDefinition: getTokenDefinition,
    getTokenDefinitions: getTokenDefinitions,
    getOutputTokenDefinitions: getOutputTokenDefinitions,
    getMergeOrder: getMergeOrder
  };
}));
