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
      mod.TOKEN_DEFS = mod.create.TOKEN_DEFS;
      mod.invalidateCanvas = mod.create.invalidateCanvas;
      mod.invalidateAll = mod.create.invalidateAll;
      return mod;
    });
  } else if (typeof module === "object" && module.exports) {
    const mod = factory();
    mod.DEFAULTS = mod.create.DEFAULTS;
    mod.TOKEN_DEFS = mod.create.TOKEN_DEFS;
    mod.invalidateCanvas = mod.create.invalidateCanvas;
    mod.invalidateAll = mod.create.invalidateAll;
    module.exports = mod;
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemeResolver = factory();
    root.DyniComponents.DyniThemeResolver.DEFAULTS = root.DyniComponents.DyniThemeResolver.create.DEFAULTS;
    root.DyniComponents.DyniThemeResolver.TOKEN_DEFS = root.DyniComponents.DyniThemeResolver.create.TOKEN_DEFS;
    root.DyniComponents.DyniThemeResolver.invalidateCanvas = root.DyniComponents.DyniThemeResolver.create.invalidateCanvas;
    root.DyniComponents.DyniThemeResolver.invalidateAll = root.DyniComponents.DyniThemeResolver.create.invalidateAll;
  }
}(this, function () {
  "use strict";

  const TOKEN_DEFS = [
    { path: "colors.pointer", cssVar: "--dyni-pointer", type: "color", defaultValue: "#ff2b2b" },
    { path: "colors.warning", cssVar: "--dyni-warning", type: "color", defaultValue: "#e7c66a" },
    { path: "colors.alarm", cssVar: "--dyni-alarm", type: "color", defaultValue: "#ff7a76" },
    { path: "colors.laylineStb", cssVar: "--dyni-layline-stb", type: "color", defaultValue: "#82b683" },
    { path: "colors.laylinePort", cssVar: "--dyni-layline-port", type: "color", defaultValue: "#ff7a76" },
    { path: "ticks.majorLen", cssVar: "--dyni-tick-major-len", type: "number", defaultValue: 9 },
    { path: "ticks.majorWidth", cssVar: "--dyni-tick-major-width", type: "number", defaultValue: 2 },
    { path: "ticks.minorLen", cssVar: "--dyni-tick-minor-len", type: "number", defaultValue: 5 },
    { path: "ticks.minorWidth", cssVar: "--dyni-tick-minor-width", type: "number", defaultValue: 1 },
    { path: "pointer.sideFactor", cssVar: "--dyni-pointer-side", type: "number", defaultValue: 0.25 },
    { path: "pointer.lengthFactor", cssVar: "--dyni-pointer-length", type: "number", defaultValue: 2 },
    { path: "ring.arcLineWidth", cssVar: "--dyni-arc-linewidth", type: "number", defaultValue: 1 },
    { path: "ring.widthFactor", cssVar: "--dyni-ring-width", type: "number", defaultValue: 0.12 },
    { path: "labels.insetFactor", cssVar: "--dyni-label-inset", type: "number", defaultValue: 1.8 },
    { path: "labels.fontFactor", cssVar: "--dyni-label-font", type: "number", defaultValue: 0.14 },
    { path: "fullCircle.normal.innerMarginFactor", cssVar: "--dyni-fullcircle-normal-inner-margin", type: "number", defaultValue: 0.03 },
    { path: "fullCircle.normal.minHeightFactor", cssVar: "--dyni-fullcircle-normal-min-height", type: "number", defaultValue: 0.45 },
    { path: "fullCircle.normal.dualGapFactor", cssVar: "--dyni-fullcircle-normal-dual-gap", type: "number", defaultValue: 0.05 },
    { path: "font.weight", cssVar: "--dyni-font-weight", type: "number", defaultValue: 700 },
    { path: "font.labelWeight", cssVar: "--dyni-label-weight", type: "number", defaultValue: 700 }
  ];

  function setByPath(target, pathSegments, value) {
    let cursor = target;
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      if (!cursor[segment] || typeof cursor[segment] !== "object") cursor[segment] = {};
      cursor = cursor[segment];
    }
    cursor[pathSegments[pathSegments.length - 1]] = value;
  }

  function buildDefaults() {
    const defaults = {};
    TOKEN_DEFS.forEach(function (tokenDef) {
      setByPath(defaults, tokenDef.path.split("."), tokenDef.defaultValue);
    });
    return defaults;
  }

  const DEFAULTS = buildDefaults();

  function pickTokenValue(style, tokenDef) {
    if (!style || typeof style.getPropertyValue !== "function") {
      return tokenDef.defaultValue;
    }
    const raw = style.getPropertyValue(tokenDef.cssVar);
    if (tokenDef.type === "number") {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : tokenDef.defaultValue;
    }
    const val = typeof raw === "string" ? raw.trim() : "";
    return val || tokenDef.defaultValue;
  }

  function getNightModeState(canvas) {
    if (!canvas) {
      return false;
    }
    const doc = canvas.ownerDocument;
    if (!doc) {
      return false;
    }

    const rootEl = doc.documentElement;
    if (rootEl && rootEl.classList && rootEl.classList.contains("nightMode")) {
      return true;
    }

    const body = doc.body;
    return !!(body && body.classList && body.classList.contains("nightMode"));
  }

  function resolveTokens(style) {
    const out = {};
    TOKEN_DEFS.forEach(function (tokenDef) {
      setByPath(out, tokenDef.path.split("."), pickTokenValue(style, tokenDef));
    });
    return out;
  }

  let byCanvas = new WeakMap();
  let lastNightModeState = null;

  function invalidateCanvas(canvas) {
    if (!canvas) {
      return;
    }
    byCanvas.delete(canvas);
  }

  function invalidateAll() {
    byCanvas = new WeakMap();
    lastNightModeState = null;
  }

  function resolveWithCache(canvas) {
    if (!canvas) {
      return resolveTokens(null);
    }

    const nightMode = getNightModeState(canvas);
    if (lastNightModeState === null) lastNightModeState = nightMode;
    else if (nightMode !== lastNightModeState) {
      invalidateAll();
      lastNightModeState = nightMode;
    }

    if (byCanvas.has(canvas)) {
      return byCanvas.get(canvas);
    }

    const style = getComputedStyle(canvas);
    const resolved = resolveTokens(style);
    byCanvas.set(canvas, resolved);
    return resolved;
  }

  function create() {
    return {
      resolve: resolveWithCache,
      invalidateCanvas: invalidateCanvas,
      invalidateAll: invalidateAll
    };
  }

  create.DEFAULTS = DEFAULTS;
  create.TOKEN_DEFS = TOKEN_DEFS;
  create.invalidateCanvas = invalidateCanvas;
  create.invalidateAll = invalidateAll;

  return { id: "ThemeResolver", create };
}));
