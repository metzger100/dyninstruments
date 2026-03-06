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

  // dyni-lint-disable-next-line css-js-default-duplication -- ThemeResolver is the documented theme-token boundary and owns per-token defaults.
  function defineToken(path, cssVar, type, defaultValue) {
    return { path: path, cssVar: cssVar, type: type, defaultValue: defaultValue }; /* dyni-lint-disable-line css-js-default-duplication -- ThemeResolver is the documented theme-token boundary and owns per-token defaults. */
  }

  const TOKEN_DEFS = [
    defineToken("colors.pointer", "--dyni-pointer", "color", "#ff2b2b"),
    defineToken("colors.warning", "--dyni-warning", "color", "#e7c66a"),
    defineToken("colors.alarm", "--dyni-alarm", "color", "#ff7a76"),
    defineToken("colors.laylineStb", "--dyni-layline-stb", "color", "#82b683"),
    defineToken("colors.laylinePort", "--dyni-layline-port", "color", "#ff7a76"),
    defineToken("radial.ticks.majorLen", "--dyni-radial-tick-major-len", "number", 12),
    defineToken("radial.ticks.majorWidth", "--dyni-radial-tick-major-width", "number", 3),
    defineToken("radial.ticks.minorLen", "--dyni-radial-tick-minor-len", "number", 7),
    defineToken("radial.ticks.minorWidth", "--dyni-radial-tick-minor-width", "number", 1.5),
    defineToken("radial.pointer.sideFactor", "--dyni-radial-pointer-side", "number", 0.25),
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
    defineToken("linear.pointer.sideFactor", "--dyni-linear-pointer-side", "number", 0.25),
    defineToken("linear.pointer.lengthFactor", "--dyni-linear-pointer-length", "number", 2),
    defineToken("linear.labels.insetFactor", "--dyni-linear-label-inset", "number", 1.8),
    defineToken("linear.labels.fontFactor", "--dyni-linear-label-font", "number", 0.14),
    defineToken("font.weight", "--dyni-font-weight", "number", 700),
    defineToken("font.labelWeight", "--dyni-label-weight", "number", 700),
    defineToken("xte.lineWidthFactor", "--dyni-xte-line-width-factor", "number", 1.5)
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
