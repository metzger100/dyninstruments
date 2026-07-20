/**
 * @file DyniPlugin Theme Token Catalog - declarative token definition and preset data
 * Documentation: documentation/shared/theme-tokens.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown>} DyniThemeValues */
  /** @typedef {{ path: string, inputVar: string, type: string, default?: unknown, defaultByMode?: Record<string, unknown>, outputVar?: string, defaultFrom?: string, compatibilityInputVar?: string, [key: string]: unknown }} DyniThemeTokenDefinition */
  /** @typedef {{ base?: DyniThemeValues, day?: DyniThemeValues, night?: DyniThemeValues, [mode: string]: DyniThemeValues | undefined }} DyniThemePreset */
  /** @typedef {{ TOKEN_DEFS: readonly DyniThemeTokenDefinition[], PRESETS: Readonly<Record<string, DyniThemePreset>> }} DyniThemeTokenCatalog */
  /** @typedef {DyniRuntimeNamespace & { createThemeTokenCatalog?: () => DyniThemeTokenCatalog }} DyniThemeTokenCatalogRuntime */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { runtime: DyniThemeTokenCatalogRuntime } }} DyniThemeTokenCatalogRoot */

  const ns = /** @type {DyniThemeTokenCatalogRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const runtime = ns.runtime;

  const DEFAULT_FONT_STACK =
    '"Roboto","Inter","SF Pro Text",-apple-system,"Segoe UI","Helvetica Neue","Noto Sans",Ubuntu,Cantarell,"Liberation Sans",Arial,system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';
  const DEFAULT_MONO_STACK =
    '"Roboto Mono", ui-monospace, "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace';

  /** @param {string} path @param {string} inputVar @param {string} type @param {[unknown?, (Record<string, unknown> | undefined)?, (string | undefined)?, (string | undefined)?, (string | undefined)?]} options @returns {DyniThemeTokenDefinition} */
  function defineToken(path, inputVar, type, ...options) {
    const [defaultValue, defaultByMode, outputVar, defaultFrom, deprecatedInputVar] = options;
    return {
      path: path,
      inputVar: inputVar,
      type: type,
      default: defaultValue,
      defaultByMode: defaultByMode || undefined,
      outputVar: outputVar || undefined,
      defaultFrom: defaultFrom || undefined,
      deprecatedInputVar: deprecatedInputVar || undefined
    };
  }

  const TOKEN_DEFS = Object.freeze([
    defineToken(
      "surface.fg",
      "--dyni-fg",
      "color",
      "#000000",
      { night: "rgba(252, 11, 11, 0.60)" },
      "--dyni-theme-surface-fg"
    ),
    defineToken("surface.bg", "--dyni-bg", "color", "#ffffff", { night: "black" }, "--dyni-theme-surface-bg"),
    defineToken("surface.border", "--dyni-border", "color", undefined, undefined, "--dyni-theme-surface-border"),
    defineToken("font.family", "--dyni-font", "string", DEFAULT_FONT_STACK, undefined, "--dyni-theme-font-family"),
    defineToken(
      "font.familyMono",
      "--dyni-font-mono",
      "string",
      DEFAULT_MONO_STACK,
      undefined,
      "--dyni-theme-font-family-mono"
    ),
    defineToken("font.weight", "--dyni-font-weight", "number", 700, undefined, "--dyni-theme-font-weight"),
    defineToken("font.labelWeight", "--dyni-label-weight", "number", 700, undefined, "--dyni-theme-font-label-weight"),
    defineToken("opacity.caption", "--dyni-caption-opacity", "number", 1.0, undefined, "--dyni-theme-opacity-caption"),
    defineToken("opacity.unit", "--dyni-unit-opacity", "number", 1.0, undefined, "--dyni-theme-opacity-unit"),

    defineToken("colors.info", "--dyni-info", "color", "#3366cc", { night: "#cc2222" }),
    defineToken("colors.pointer", "--dyni-pointer", "color", undefined, undefined, undefined, "colors.info"),
    defineToken("colors.warning", "--dyni-warning", "color", "#e0a92e", { night: "#8b6914" }),
    defineToken("colors.alarm", "--dyni-alarm", "color", "#d9534a", { night: "rgba(250, 88, 74, 0.60)" }),
    defineToken("colors.ok", "--dyni-ok", "color", "#2e9e6b", { night: "rgba(112, 243, 175, 0.60)" }),
    defineToken(
      "colors.alarmWidget.bg",
      "--dyni-alarm-widget-bg",
      "color",
      undefined,
      undefined,
      undefined,
      "colors.alarm"
    ),
    defineToken("colors.alarmWidget.fg", "--dyni-alarm-widget-fg", "color", "#ffffff", { night: "#ffffff" }),
    defineToken(
      "colors.alarmWidget.strip",
      "--dyni-alarm-widget-strip",
      "color",
      undefined,
      undefined,
      undefined,
      "colors.ok"
    ),
    defineToken("colors.laylineStb", "--dyni-layline-stb", "color", undefined, undefined, undefined, "colors.ok"),
    defineToken("colors.laylinePort", "--dyni-layline-port", "color", undefined, undefined, undefined, "colors.alarm"),
    defineToken("colors.ais.warning", "--dyni-ais-warning", "color", undefined, undefined, undefined, "colors.alarm"),
    defineToken("colors.ais.nearest", "--dyni-ais-nearest", "color", undefined, undefined, undefined, "colors.ok"),
    defineToken(
      "colors.ais.tracking",
      "--dyni-ais-tracking",
      "color",
      undefined,
      undefined,
      undefined,
      "colors.warning"
    ),
    defineToken("colors.ais.normal", "--dyni-ais-normal", "color", undefined, undefined, undefined, "colors.ok"),
    defineToken(
      "colors.regatta.barWarning",
      "--dyni-regatta-bar-warning",
      "color",
      undefined,
      undefined,
      "--dyni-theme-regatta-bar-warning",
      "colors.warning",
      "--dyni-regatta-barWarning"
    ),
    defineToken(
      "colors.regatta.barCritical",
      "--dyni-regatta-bar-critical",
      "color",
      undefined,
      undefined,
      "--dyni-theme-regatta-bar-critical",
      "colors.alarm",
      "--dyni-regatta-barCritical"
    ),
    defineToken(
      "colors.regatta.barDefault",
      "--dyni-regatta-bar-default",
      "color",
      undefined,
      undefined,
      "--dyni-theme-regatta-bar-default",
      "colors.info",
      "--dyni-regatta-barDefault"
    ),

    defineToken("strokeWeight", "--dyni-stroke-weight", "number", 1.28),
    defineToken("pointerDepthWeight", "--dyni-pointer-depth-weight", "number", 1.15),
    defineToken("pointerSideWeight", "--dyni-pointer-side-weight", "number", 2.0),
    defineToken(
      "regatta.buttonStrokeWeight",
      "--dyni-regatta-button-stroke-weight",
      "number",
      undefined,
      undefined,
      undefined,
      "strokeWeight"
    ),

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
    defineToken(
      "radial.fullCircle.normal.innerMarginFactor",
      "--dyni-radial-fullcircle-normal-inner-margin",
      "number",
      0.03
    ),
    defineToken(
      "radial.fullCircle.normal.minHeightFactor",
      "--dyni-radial-fullcircle-normal-min-height",
      "number",
      0.45
    ),
    defineToken("radial.fullCircle.normal.dualGapFactor", "--dyni-radial-fullcircle-normal-dual-gap", "number", 0.05),
    defineToken(
      "radial.fullCircle.ticks.majorLenFactor",
      "--dyni-radial-fullcircle-tick-major-len-factor",
      "number",
      0.131
    ),
    defineToken(
      "radial.fullCircle.ticks.minorLenFactor",
      "--dyni-radial-fullcircle-tick-minor-len-factor",
      "number",
      0.077
    ),

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

  /** @type {Readonly<Record<string, DyniThemePreset>>} */
  const PRESETS = Object.freeze({
    default: {
      base: {},
      night: {
        surface: {
          fg: "rgba(252, 11, 11, 0.60)",
          bg: "black"
        },
        colors: {
          info: "#cc2222",
          warning: "#8b6914",
          alarm: "rgba(250, 88, 74, 0.60)",
          ok: "rgba(112, 243, 175, 0.60)",
          alarmWidget: {
            fg: "#ffffff"
          }
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
        strokeWeight: 2.2,
        pointerDepthWeight: 1.8,
        pointerSideWeight: 2.3
      }
    },
    darkmode: {
      base: {
        surface: {
          fg: "#ffffff",
          bg: "#000000",
          border: "#ffffff"
        },
        colors: {
          info: "#5aa2ff",
          warning: "#ffd24a",
          alarm: "#ff6b5c",
          ok: "#5fd68b",
          alarmWidget: {
            fg: "#ffffff"
          }
        }
      },
      night: {
        surface: {
          fg: "rgba(252, 11, 11, 0.60)",
          bg: "black",
          border: "rgba(252, 11, 11, 0.60)"
        },
        colors: {
          info: "#cc2222",
          warning: "#8b6914",
          alarm: "rgba(250, 88, 74, 0.60)",
          ok: "rgba(112, 243, 175, 0.60)",
          alarmWidget: {
            fg: "#ffffff"
          }
        }
      }
    },
    highcontrast: {
      base: {
        strokeWeight: 1.32,
        pointerDepthWeight: 1.15,
        pointerSideWeight: 2.15,
        colors: {
          info: "#0057ff",
          warning: "#ffd200",
          alarm: "#ff3b2f",
          ok: "#008f5a",
          alarmWidget: {
            fg: "#ffffff"
          }
        }
      },
      night: {
        colors: {
          info: "#cc2222",
          warning: "#8b6914",
          alarm: "rgba(250, 88, 74, 0.60)",
          ok: "rgba(112, 243, 175, 0.60)",
          alarmWidget: {
            fg: "#ffffff"
          }
        }
      }
    }
  });

  runtime.createThemeTokenCatalog = function createThemeTokenCatalog() {
    return {
      TOKEN_DEFS: TOKEN_DEFS,
      PRESETS: PRESETS
    };
  };
})(this);
