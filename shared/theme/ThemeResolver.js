/**
 * Module: ThemeResolver - Plugin-wide CSS token resolver with root-scoped cache
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: ThemePresets, Helpers.getNightModeState, CSS custom properties
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      const mod = factory();
      mod.DEFAULTS = mod.create.DEFAULTS;
      mod.TOKEN_DEFS = mod.create.TOKEN_DEFS;
      mod.invalidateRoot = mod.create.invalidateRoot;
      mod.invalidateAll = mod.create.invalidateAll;
      return mod;
    });
  } else if (typeof module === "object" && module.exports) {
    const mod = factory();
    mod.DEFAULTS = mod.create.DEFAULTS;
    mod.TOKEN_DEFS = mod.create.TOKEN_DEFS;
    mod.invalidateRoot = mod.create.invalidateRoot;
    mod.invalidateAll = mod.create.invalidateAll;
    module.exports = mod;
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemeResolver = factory();
    root.DyniComponents.DyniThemeResolver.DEFAULTS = root.DyniComponents.DyniThemeResolver.create.DEFAULTS;
    root.DyniComponents.DyniThemeResolver.TOKEN_DEFS = root.DyniComponents.DyniThemeResolver.create.TOKEN_DEFS;
    root.DyniComponents.DyniThemeResolver.invalidateRoot = root.DyniComponents.DyniThemeResolver.create.invalidateRoot;
    root.DyniComponents.DyniThemeResolver.invalidateAll = root.DyniComponents.DyniThemeResolver.create.invalidateAll;
  }
}(this, function () {
  "use strict";

  const EMPTY_PRESET = {};
  const DEFAULT_PRESET_NAME = "default";

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
    defineToken("font.weight", "--dyni-font-weight", "number", 700),
    defineToken("font.labelWeight", "--dyni-label-weight", "number", 700),
    defineToken("xte.lineWidthFactor", "--dyni-xte-line-width-factor", "number", 1.5),
    defineToken("xte.boatSizeFactor", "--dyni-xte-boat-size-factor", "number", 1)
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

  function getByPath(source, pathSegments) {
    let cursor = source;
    for (let i = 0; i < pathSegments.length; i++) {
      if (!cursor || typeof cursor !== "object" || !Object.prototype.hasOwnProperty.call(cursor, pathSegments[i])) {
        return undefined;
      }
      cursor = cursor[pathSegments[i]];
    }
    return cursor;
  }

  function readTokenOverride(style, tokenDef) {
    if (!style || typeof style.getPropertyValue !== "function") {
      return { hasValue: false, value: tokenDef.defaultValue };
    }
    const raw = style.getPropertyValue(tokenDef.cssVar);
    if (tokenDef.type === "number") {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed)
        ? { hasValue: true, value: parsed }
        : { hasValue: false, value: tokenDef.defaultValue };
    }
    const val = typeof raw === "string" ? raw.trim() : "";
    return val
      ? { hasValue: true, value: val }
      : { hasValue: false, value: tokenDef.defaultValue };
  }

  function resolvePresetModule(Helpers) {
    if (!Helpers || typeof Helpers.getModule !== "function") {
      return {
        PRESETS: { default: EMPTY_PRESET },
        normalizePresetName: function () {
          return DEFAULT_PRESET_NAME;
        }
      };
    }
    const presetsMod = Helpers.getModule("ThemePresets");
    if (!presetsMod || typeof presetsMod !== "object") {
      throw new Error("ThemeResolver: ThemePresets module is required");
    }
    return presetsMod;
  }

  function resolveNightModeGetter(Helpers) {
    if (!Helpers || typeof Helpers.getModule !== "function") {
      return function () {
        return false;
      };
    }
    if (typeof Helpers.getNightModeState !== "function") {
      throw new Error("ThemeResolver: Helpers.getNightModeState() is required");
    }
    return Helpers.getNightModeState;
  }

  function resolvePresetDefs(presetsMod) {
    if (presetsMod.PRESETS && typeof presetsMod.PRESETS === "object") {
      return presetsMod.PRESETS;
    }
    if (presetsMod.create && presetsMod.create.PRESETS && typeof presetsMod.create.PRESETS === "object") {
      return presetsMod.create.PRESETS;
    }
    throw new Error("ThemeResolver: ThemePresets.PRESETS is required");
  }

  function resolvePresetNormalizer(presetsMod) {
    if (typeof presetsMod.normalizePresetName === "function") {
      return presetsMod.normalizePresetName;
    }
    if (presetsMod.create && typeof presetsMod.create.normalizePresetName === "function") {
      return presetsMod.create.normalizePresetName;
    }
    throw new Error("ThemeResolver: ThemePresets.normalizePresetName() is required");
  }

  function readPresetCssVar(style) {
    if (!style || typeof style.getPropertyValue !== "function") {
      return "";
    }
    // dyni-lint-disable-next-line css-js-default-duplication -- ThemeResolver is the documented boundary owner for reading preset selection from CSS.
    const raw = style.getPropertyValue("--dyni-theme-preset");
    return typeof raw === "string" ? raw.trim() : "";
  }

  function getActivePresetName(rootEl, rootStyle, normalizePresetName) {
    if (!rootEl) {
      return DEFAULT_PRESET_NAME;
    }
    if (typeof rootEl.hasAttribute === "function" &&
      rootEl.hasAttribute("data-dyni-theme") &&
      typeof rootEl.getAttribute === "function") {
      return normalizePresetName(rootEl.getAttribute("data-dyni-theme"));
    }

    const cssPresetName = readPresetCssVar(rootStyle);
    if (cssPresetName) {
      return normalizePresetName(cssPresetName);
    }
    return DEFAULT_PRESET_NAME;
  }

  function getComputedStyleSafe(el) {
    if (!el || typeof getComputedStyle !== "function") {
      return null;
    }
    const style = getComputedStyle(el);
    return style && typeof style.getPropertyValue === "function" ? style : null;
  }

  function resolveTokens(styles, presetValues) {
    const out = {};
    TOKEN_DEFS.forEach(function (tokenDef) {
      const pathSegments = tokenDef.path.split(".");
      let value = getByPath(presetValues, pathSegments);
      if (typeof value === "undefined") {
        value = tokenDef.defaultValue;
      }

      for (let i = 0; i < styles.length; i++) {
        const override = readTokenOverride(styles[i], tokenDef);
        if (override.hasValue) {
          value = override.value;
          break;
        }
      }

      setByPath(out, pathSegments, value);
    });
    return out;
  }

  let byRoot = new WeakMap();
  let lastNightModeState = null;

  function invalidateRoot(rootEl) {
    if (!rootEl) {
      return;
    }
    byRoot.delete(rootEl);
  }

  function invalidateAll() {
    byRoot = new WeakMap();
    lastNightModeState = null;
  }

  function create(def, Helpers) {
    const presetsMod = resolvePresetModule(Helpers);
    const presetDefs = resolvePresetDefs(presetsMod);
    const normalizePresetName = resolvePresetNormalizer(presetsMod);
    const getNightModeState = resolveNightModeGetter(Helpers);

    function resolveForRoot(rootEl) {
      if (!rootEl) {
        return resolveTokens([], EMPTY_PRESET);
      }

      const nightMode = getNightModeState(rootEl);
      if (lastNightModeState === null) lastNightModeState = nightMode;
      else if (nightMode !== lastNightModeState) {
        invalidateAll();
        lastNightModeState = nightMode;
      }

      if (byRoot.has(rootEl)) {
        return byRoot.get(rootEl);
      }

      const rootStyle = getComputedStyleSafe(rootEl);
      const presetName = getActivePresetName(rootEl, rootStyle, normalizePresetName);
      const presetValues = Object.prototype.hasOwnProperty.call(presetDefs, presetName)
        ? presetDefs[presetName]
        : EMPTY_PRESET;

      const resolved = resolveTokens([rootStyle], presetValues);
      byRoot.set(rootEl, resolved);
      return resolved;
    }

    return {
      resolveForRoot: resolveForRoot,
      invalidateRoot: invalidateRoot,
      invalidateAll: invalidateAll
    };
  }

  create.DEFAULTS = DEFAULTS;
  create.TOKEN_DEFS = TOKEN_DEFS;
  create.invalidateRoot = invalidateRoot;
  create.invalidateAll = invalidateAll;

  return { id: "ThemeResolver", create };
}));
