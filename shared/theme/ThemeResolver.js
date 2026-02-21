/**
 * Module: ThemeResolver - Plugin-wide CSS token resolver with canvas-scoped cache
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: CSS custom properties, document root night mode class
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      const mod = factory();
      mod.DEFAULTS = mod.create.DEFAULTS;
      return mod;
    });
  } else if (typeof module === "object" && module.exports) {
    const mod = factory();
    mod.DEFAULTS = mod.create.DEFAULTS;
    module.exports = mod;
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemeResolver = factory();
    root.DyniComponents.DyniThemeResolver.DEFAULTS = root.DyniComponents.DyniThemeResolver.create.DEFAULTS;
  }
}(this, function () {
  "use strict";

  const DEFAULTS = {
    colors: {
      pointer: "#ff2b2b",
      warning: "#e7c66a",
      alarm: "#ff7a76",
      laylineStb: "#82b683",
      laylinePort: "#ff7a76"
    },
    ticks: {
      majorLen: 9,
      majorWidth: 2,
      minorLen: 5,
      minorWidth: 1
    },
    pointer: {
      sideFactor: 0.25,
      lengthFactor: 2
    },
    ring: {
      arcLineWidth: 1,
      widthFactor: 0.12
    },
    labels: {
      insetFactor: 1.8,
      fontFactor: 0.14
    },
    font: {
      weight: 700,
      labelWeight: 700
    }
  };

  function pickColor(style, varName, fallback) {
    if (!style || typeof style.getPropertyValue !== "function") return fallback;
    const raw = style.getPropertyValue(varName);
    const val = typeof raw === "string" ? raw.trim() : "";
    return val || fallback;
  }

  function pickNumber(style, varName, fallback) {
    if (!style || typeof style.getPropertyValue !== "function") return fallback;
    const raw = style.getPropertyValue(varName);
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getNightModeState(canvas) {
    if (!canvas) return false;
    const doc = canvas.ownerDocument;
    if (!doc) return false;

    const rootEl = doc.documentElement;
    if (rootEl && rootEl.classList && rootEl.classList.contains("nightMode")) return true;

    const body = doc.body;
    return !!(body && body.classList && body.classList.contains("nightMode"));
  }

  function resolveTokens(style) {
    return {
      colors: {
        pointer: pickColor(style, "--dyni-pointer", DEFAULTS.colors.pointer),
        warning: pickColor(style, "--dyni-warning", DEFAULTS.colors.warning),
        alarm: pickColor(style, "--dyni-alarm", DEFAULTS.colors.alarm),
        laylineStb: pickColor(style, "--dyni-layline-stb", DEFAULTS.colors.laylineStb),
        laylinePort: pickColor(style, "--dyni-layline-port", DEFAULTS.colors.laylinePort)
      },
      ticks: {
        majorLen: pickNumber(style, "--dyni-tick-major-len", DEFAULTS.ticks.majorLen),
        majorWidth: pickNumber(style, "--dyni-tick-major-width", DEFAULTS.ticks.majorWidth),
        minorLen: pickNumber(style, "--dyni-tick-minor-len", DEFAULTS.ticks.minorLen),
        minorWidth: pickNumber(style, "--dyni-tick-minor-width", DEFAULTS.ticks.minorWidth)
      },
      pointer: {
        sideFactor: pickNumber(style, "--dyni-pointer-side", DEFAULTS.pointer.sideFactor),
        lengthFactor: pickNumber(style, "--dyni-pointer-length", DEFAULTS.pointer.lengthFactor)
      },
      ring: {
        arcLineWidth: pickNumber(style, "--dyni-arc-linewidth", DEFAULTS.ring.arcLineWidth),
        widthFactor: pickNumber(style, "--dyni-ring-width", DEFAULTS.ring.widthFactor)
      },
      labels: {
        insetFactor: pickNumber(style, "--dyni-label-inset", DEFAULTS.labels.insetFactor),
        fontFactor: pickNumber(style, "--dyni-label-font", DEFAULTS.labels.fontFactor)
      },
      font: {
        weight: pickNumber(style, "--dyni-font-weight", DEFAULTS.font.weight),
        labelWeight: pickNumber(style, "--dyni-label-weight", DEFAULTS.font.labelWeight)
      }
    };
  }

  function create() {
    let byCanvas = new WeakMap();
    let lastNightModeState = null;

    function resolve(canvas) {
      if (!canvas) return resolveTokens(null);

      const nightMode = getNightModeState(canvas);
      if (lastNightModeState === null) lastNightModeState = nightMode;
      else if (nightMode !== lastNightModeState) {
        byCanvas = new WeakMap();
        lastNightModeState = nightMode;
      }

      if (byCanvas.has(canvas)) return byCanvas.get(canvas);

      const style = getComputedStyle(canvas);
      const resolved = resolveTokens(style);
      byCanvas.set(canvas, resolved);
      return resolved;
    }

    return { resolve: resolve };
  }

  create.DEFAULTS = DEFAULTS;

  return { id: "ThemeResolver", create };
}));
