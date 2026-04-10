/**
 * Module: ThemeResolver - Plugin-wide theme token resolver
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: ThemeModel, CSS custom properties
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], function () {
      return factory(root);
    });
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    (root.DyniComponents = root.DyniComponents || {}).DyniThemeResolver = factory(root);
  }
}(this, function (root) {
  "use strict";

  let config = null;
  let requiredThemeModel = null;

  function toObject(value) {
    return value && typeof value === "object" ? value : null;
  }

  function setByPath(target, pathSegments, value) {
    let cursor = target;
    const lastIndex = pathSegments.length - 1;
    for (let i = 0; i < lastIndex; i += 1) {
      const segment = pathSegments[i];
      const next = cursor[segment];
      if (!next || typeof next !== "object") {
        cursor[segment] = Object.create(null);
      }
      cursor = cursor[segment];
    }
    cursor[pathSegments[lastIndex]] = value;
  }

  function getByPath(source, pathSegments) {
    let cursor = source;
    for (let i = 0; i < pathSegments.length; i += 1) {
      if (!cursor || typeof cursor !== "object" || !Object.prototype.hasOwnProperty.call(cursor, pathSegments[i])) {
        return undefined;
      }
      cursor = cursor[pathSegments[i]];
    }
    return cursor;
  }

  function getComputedStyleSafe(el) {
    if (!el || typeof getComputedStyle !== "function") {
      return null;
    }
    const style = getComputedStyle(el);
    return style && typeof style.getPropertyValue === "function" ? style : null;
  }

  function readCssInputVar(style, inputVar) {
    if (!style || typeof style.getPropertyValue !== "function" || !inputVar) {
      return "";
    }
    const raw = style.getPropertyValue(inputVar);
    return typeof raw === "string" ? raw.trim() : "";
  }

  function readTokenInputOverride(style, tokenDef, inputReader) {
    const raw = inputReader(style, tokenDef.inputVar);
    if (!raw) {
      return { hasValue: false, value: tokenDef.default };
    }
    if (tokenDef.type === "number") {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed)
        ? { hasValue: true, value: parsed }
        : { hasValue: false, value: tokenDef.default };
    }
    return { hasValue: true, value: raw };
  }

  function resolveThemeModel() {
    const configured = toObject(config) && toObject(config).ThemeModel;
    if (configured && typeof configured.getTokenDefinitions === "function") {
      return configured;
    }
    const dyni = root && root.DyniComponents;
    const discovered = dyni && dyni.DyniThemeModel;
    if (discovered && typeof discovered.getTokenDefinitions === "function") {
      return discovered;
    }
    if (requiredThemeModel && typeof requiredThemeModel.getTokenDefinitions === "function") {
      return requiredThemeModel;
    }
    if (typeof require === "function") {
      try {
        const loaded = require("./ThemeModel.js");
        if (loaded && typeof loaded.getTokenDefinitions === "function") {
          requiredThemeModel = loaded;
          return requiredThemeModel;
        }
      }
      // dyni-lint-disable-next-line catch-fallback-without-suppression -- CommonJS require fallback is optional for test/runtime host boundaries.
      catch (error) { /* no-op */ }
    }
    throw new Error("ThemeResolver: ThemeModel is required");
  }

  function resolveNightModeGetter() {
    const configured = toObject(config) && config.getNightModeState;
    if (typeof configured === "function") {
      return configured;
    }
    return function (rootEl) {
      return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
    };
  }

  function resolveInputReader() {
    const configured = toObject(config) && config.readCssInputVar;
    if (typeof configured === "function") {
      return configured;
    }
    return readCssInputVar;
  }

  function resolveActivePresetNameGetter(themeModel) {
    const configured = toObject(config) && config.getActivePresetName;
    if (typeof configured === "function") {
      return configured;
    }
    return function () {
      return "default";
    };
  }

  function isCommittedPluginRoot(rootEl) {
    return !!(rootEl &&
      rootEl.nodeType === 1 &&
      rootEl.classList &&
      typeof rootEl.classList.contains === "function" &&
      rootEl.classList.contains("widget") &&
      rootEl.classList.contains("dyniplugin"));
  }

  function requireCommittedPluginRoot(rootEl) {
    if (!isCommittedPluginRoot(rootEl)) {
      throw new Error("ThemeResolver.resolveForRoot: rootEl must be a committed .widget.dyniplugin root element");
    }
  }

  function resolveForRoot(rootEl) {
    requireCommittedPluginRoot(rootEl);
    const themeModel = resolveThemeModel();
    const inputReader = resolveInputReader();
    const getNightModeState = resolveNightModeGetter();
    const getActivePresetName = resolveActivePresetNameGetter(themeModel);
    const style = getComputedStyleSafe(rootEl);
    const mode = getNightModeState(rootEl) ? "night" : "day";
    const presetName = themeModel.normalizePresetName(getActivePresetName(rootEl, style, mode));
    const presetMode = themeModel.getPresetMode(presetName, mode);
    const presetBase = themeModel.getPresetBase(presetName);
    const out = {};

    themeModel.getTokenDefinitions().forEach(function (tokenDef) {
      const pathSegments = tokenDef.path.split(".");
      const rootOverride = readTokenInputOverride(style, tokenDef, inputReader);
      if (rootOverride.hasValue) {
        setByPath(out, pathSegments, rootOverride.value);
        return;
      }

      const presetModeValue = getByPath(presetMode, pathSegments);
      if (typeof presetModeValue !== "undefined") {
        setByPath(out, pathSegments, presetModeValue);
        return;
      }

      const presetBaseValue = getByPath(presetBase, pathSegments);
      if (typeof presetBaseValue !== "undefined") {
        setByPath(out, pathSegments, presetBaseValue);
        return;
      }

      const modeDefault = tokenDef.defaultByMode && Object.prototype.hasOwnProperty.call(tokenDef.defaultByMode, mode)
        ? tokenDef.defaultByMode[mode]
        : undefined;
      if (typeof modeDefault !== "undefined") {
        setByPath(out, pathSegments, modeDefault);
        return;
      }

      setByPath(out, pathSegments, tokenDef.default);
    });

    return out;
  }

  function configure(nextConfig) {
    config = toObject(nextConfig) || null;
    return moduleApi;
  }

  function getTokenDefinitions() {
    return resolveThemeModel().getTokenDefinitions();
  }

  function getOutputTokenDefinitions() {
    return resolveThemeModel().getOutputTokenDefinitions();
  }

  const moduleApi = {
    id: "ThemeResolver",
    configure: configure,
    resolveForRoot: resolveForRoot,
    getTokenDefinitions: getTokenDefinitions,
    getOutputTokenDefinitions: getOutputTokenDefinitions
  };

  return moduleApi;
}));
