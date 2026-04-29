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
  // dyni-lint-disable-next-line css-js-default-duplication -- ThemeModel owns the canonical default font stack for both CSS and JS token resolution.
  const DEFAULT_FONT_STACK = '"Roboto","Inter","SF Pro Text",-apple-system,"Segoe UI","Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';
  const DEFAULT_MONO_STACK = '"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace';

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
    // dyni-lint-disable-next-line css-js-default-duplication -- ThemeModel owns the canonical font-family default token mapping.
    defineToken("font.family", "--dyni-font", "string", DEFAULT_FONT_STACK, undefined, "--dyni-theme-font-family"),
    defineToken("font.familyMono", "--dyni-font-mono", "string", DEFAULT_MONO_STACK, undefined, "--dyni-theme-font-family-mono"),
    defineToken("font.weight", "--dyni-font-weight", "number", 700, undefined, "--dyni-theme-font-weight"),
    defineToken("font.labelWeight", "--dyni-label-weight", "number", 700, undefined, "--dyni-theme-font-label-weight"),

    defineToken("colors.pointer", "--dyni-pointer", "color", "#ff2b2b", { night: "#cc2222" }),
    defineToken("colors.warning", "--dyni-warning", "color", "#e7c66a", { night: "#8b6914" }),
    defineToken("colors.alarm", "--dyni-alarm", "color", "#ff7a76", { night: "#992222" }),
    defineToken("colors.alarmWidget.bg", "--dyni-alarm-widget-bg", "color", "#e04040", { night: "#991111" }),
    defineToken("colors.alarmWidget.fg", "--dyni-alarm-widget-fg", "color", "#ffffff", { night: "#ffffff" }),
    defineToken("colors.alarmWidget.strip", "--dyni-alarm-widget-strip", "color", "#66b8ff", { night: "#66b8ff" }),
    defineToken("colors.laylineStb", "--dyni-layline-stb", "color", "#82b683", { night: "#3d6b3d" }),
    defineToken("colors.laylinePort", "--dyni-layline-port", "color", "#ff7a76", { night: "#8b3333" }),
    defineToken("colors.ais.warning", "--dyni-ais-warning", "color", "#f39b52"),
    defineToken("colors.ais.nearest", "--dyni-ais-nearest", "color", "#66b8ff"),
    defineToken("colors.ais.tracking", "--dyni-ais-tracking", "color", "#89d38f"),
    defineToken("colors.ais.normal", "--dyni-ais-normal", "color", "#8da0b3"),

    defineToken("strokeWeight", "--dyni-stroke-weight", "number", 1.0),
    defineToken("pointerDepthWeight", "--dyni-pointer-depth-weight", "number", 1.0),
    defineToken("pointerSideWeight", "--dyni-pointer-side-weight", "number", 1.0),

    defineToken("radial.ticks.majorLenFactor", "--dyni-radial-tick-major-len-factor", "number", 0.087),
    defineToken("radial.ticks.majorWidthFactor", "--dyni-radial-tick-major-width-factor", "number", 0.022),
    defineToken("radial.ticks.minorLenFactor", "--dyni-radial-tick-minor-len-factor", "number", 0.051),
    defineToken("radial.ticks.minorWidthFactor", "--dyni-radial-tick-minor-width-factor", "number", 0.011),
    defineToken("radial.pointer.sideFactor", "--dyni-radial-pointer-side-factor", "number", 0.11),
    defineToken("radial.pointer.depthFactor", "--dyni-radial-pointer-depth-factor", "number", 0.22),
    defineToken("radial.ring.arcLineWidthFactor", "--dyni-radial-arc-linewidth-factor", "number", 0.0145),
    defineToken("radial.ring.widthFactor", "--dyni-radial-ring-width", "number", 0.16),
    defineToken("radial.labels.insetFactor", "--dyni-radial-label-inset", "number", 1.8),
    defineToken("radial.labels.fontFactor", "--dyni-radial-label-font", "number", 0.14),
    defineToken("radial.fullCircle.normal.innerMarginFactor", "--dyni-radial-fullcircle-normal-inner-margin", "number", 0.03),
    defineToken("radial.fullCircle.normal.minHeightFactor", "--dyni-radial-fullcircle-normal-min-height", "number", 0.45),
    defineToken("radial.fullCircle.normal.dualGapFactor", "--dyni-radial-fullcircle-normal-dual-gap", "number", 0.05),

    defineToken("linear.track.widthFactor", "--dyni-linear-track-width", "number", 0.16),
    defineToken("linear.track.lineWidthFactor", "--dyni-linear-track-linewidth-factor", "number", 0.018),
    defineToken("linear.ticks.majorLenFactor", "--dyni-linear-tick-major-len-factor", "number", 0.109),
    defineToken("linear.ticks.majorWidthFactor", "--dyni-linear-tick-major-width-factor", "number", 0.027),
    defineToken("linear.ticks.minorLenFactor", "--dyni-linear-tick-minor-len-factor", "number", 0.064),
    defineToken("linear.ticks.minorWidthFactor", "--dyni-linear-tick-minor-width-factor", "number", 0.014),
    defineToken("linear.pointer.sideFactor", "--dyni-linear-pointer-side-factor", "number", 0.12),
    defineToken("linear.pointer.depthFactor", "--dyni-linear-pointer-depth-factor", "number", 0.24),
    defineToken("linear.labels.insetFactor", "--dyni-linear-label-inset", "number", 1.8),
    defineToken("linear.labels.fontFactor", "--dyni-linear-label-font", "number", 0.14)
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
          alarmWidget: {
            bg: "#991111",
            fg: "#ffffff",
            strip: "#66b8ff"
          },
          laylineStb: "#3d6b3d",
          laylinePort: "#8b3333"
        }
      }
    },
    slim: {
      base: {
        strokeWeight: 0.66,
        pointerDepthWeight: 1.0,
        pointerSideWeight: 0.72,
        font: { labelWeight: 400 }
      }
    },
    bold: {
      base: {
        strokeWeight: 1.32,
        pointerDepthWeight: 1.0,
        pointerSideWeight: 1.54
      }
    },
    highcontrast: {
      base: {
        strokeWeight: 1.32,
        pointerDepthWeight: 1.0,
        pointerSideWeight: 1.4,
        colors: {
          pointer: "#ff0000",
          warning: "#ffcc00",
          alarm: "#ff3300",
          alarmWidget: {
            bg: "#ff2200",
            fg: "#ffffff",
            strip: "#3399ff"
          }
        }
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
