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
  let themeMetadataByModel = new WeakMap();
  let rootResolutionCache = new WeakMap();

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

  function getInlineStyleSafe(rootEl) {
    const style = rootEl && rootEl.style;
    return style && typeof style.getPropertyValue === "function" ? style : null;
  }

  function readCssInputVar(style, inputVar) {
    if (!style || typeof style.getPropertyValue !== "function" || !inputVar) {
      return "";
    }
    const raw = style.getPropertyValue(inputVar);
    return typeof raw === "string" ? raw.trim() : "";
  }

  function createTokenMetadata(tokenDefs) {
    const entries = [];
    const inputVars = [];
    const seenInputVars = Object.create(null);

    for (let i = 0; i < tokenDefs.length; i += 1) {
      const tokenDef = tokenDefs[i];
      const pathSegments = Object.freeze(tokenDef.path.split("."));
      entries.push(Object.freeze({
        tokenDef: tokenDef,
        pathSegments: pathSegments
      }));

      const inputVar = tokenDef && tokenDef.inputVar;
      if (typeof inputVar === "string" && inputVar.length > 0 && !seenInputVars[inputVar]) {
        seenInputVars[inputVar] = true;
        inputVars.push(inputVar);
      }
    }

    return Object.freeze({
      entries: Object.freeze(entries),
      inputVars: Object.freeze(inputVars)
    });
  }

  function resolveThemeMetadata(themeModel) {
    if (themeMetadataByModel.has(themeModel)) {
      return themeMetadataByModel.get(themeModel);
    }

    const tokenMetadata = createTokenMetadata(themeModel.getTokenDefinitions());
    const outputTokenMetadata = createTokenMetadata(themeModel.getOutputTokenDefinitions());
    const metadata = Object.freeze({
      tokenEntries: tokenMetadata.entries,
      outputTokenEntries: outputTokenMetadata.entries,
      snapshotInputVars: tokenMetadata.inputVars
    });

    themeMetadataByModel.set(themeModel, metadata);
    return metadata;
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
    const cfg = toObject(config);
    const configured = cfg && cfg.ThemeModel;
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
    const cfg = toObject(config);
    const configured = cfg && cfg.getNightModeState;
    if (typeof configured === "function") {
      return configured;
    }
    return function (rootEl) {
      return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
    };
  }

  function resolveInputReader() {
    const cfg = toObject(config);
    const configured = cfg && cfg.readCssInputVar;
    if (typeof configured === "function") {
      return configured;
    }
    return readCssInputVar;
  }

  function resolveActivePresetNameGetter(themeModel) {
    const cfg = toObject(config);
    const configured = cfg && cfg.getActivePresetName;
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

  function getRootClassSignature(rootEl) {
    let rawClassName = "";
    if (!rootEl) {
      return rawClassName;
    }
    if (typeof rootEl.className === "string") {
      rawClassName = rootEl.className;
    } else if (typeof rootEl.getAttribute === "function") {
      const classAttr = rootEl.getAttribute("class");
      rawClassName = typeof classAttr === "string" ? classAttr : "";
    }
    return rawClassName.trim().replace(/\s+/g, " ");
  }

  function buildInlineInputSignature(inlineStyle, inputVars) {
    const parts = [];
    for (let i = 0; i < inputVars.length; i += 1) {
      const inputVar = inputVars[i];
      parts.push(inputVar + "=" + readCssInputVar(inlineStyle, inputVar));
    }
    return parts.join(";");
  }

  function createRootSnapshot(rootEl, themeModel, metadata) {
    const getNightModeState = resolveNightModeGetter();
    const getActivePresetName = resolveActivePresetNameGetter(themeModel);
    const mode = getNightModeState(rootEl) ? "night" : "day";
    const inlineStyle = getInlineStyleSafe(rootEl);
    const presetName = themeModel.normalizePresetName(getActivePresetName(rootEl, inlineStyle, mode));
    const classSignature = getRootClassSignature(rootEl);
    const inlineInputSignature = buildInlineInputSignature(inlineStyle, metadata.snapshotInputVars);

    return {
      mode: mode,
      presetName: presetName,
      signature: mode + "|" + presetName + "|" + classSignature + "|" + inlineInputSignature
    };
  }

  function createResolutionContext(rootEl, themeModel, snapshot) {
    const inputReader = resolveInputReader();
    const style = getComputedStyleSafe(rootEl);
    return {
      inputReader: inputReader,
      style: style,
      mode: snapshot.mode,
      presetMode: themeModel.getPresetMode(snapshot.presetName, snapshot.mode),
      presetBase: themeModel.getPresetBase(snapshot.presetName)
    };
  }

  function resolveTokenValue(tokenDef, pathSegments, context) {
    const rootOverride = readTokenInputOverride(context.style, tokenDef, context.inputReader);
    if (rootOverride.hasValue) {
      return rootOverride.value;
    }

    const presetModeValue = getByPath(context.presetMode, pathSegments);
    if (typeof presetModeValue !== "undefined") {
      return presetModeValue;
    }

    const presetBaseValue = getByPath(context.presetBase, pathSegments);
    if (typeof presetBaseValue !== "undefined") {
      return presetBaseValue;
    }

    const modeDefault = tokenDef.defaultByMode && Object.prototype.hasOwnProperty.call(tokenDef.defaultByMode, context.mode)
      ? tokenDef.defaultByMode[context.mode]
      : undefined;
    if (typeof modeDefault !== "undefined") {
      return modeDefault;
    }

    return tokenDef.default;
  }

  function createRootCacheBucket() {
    return {
      full: new Map(),
      output: new Map()
    };
  }

  function resolveRootCacheBucket(rootEl) {
    let bucket = rootResolutionCache.get(rootEl);
    if (!bucket) {
      bucket = createRootCacheBucket();
      rootResolutionCache.set(rootEl, bucket);
    }
    return bucket;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.freeze(value);
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      deepFreeze(value[keys[i]]);
    }
    return value;
  }

  function resolveTokenEntries(entries, context) {
    const out = {};
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      setByPath(out, entry.pathSegments, resolveTokenValue(entry.tokenDef, entry.pathSegments, context));
    }
    return out;
  }

  function resolveWithCache(rootEl, kind) {
    requireCommittedPluginRoot(rootEl);
    const themeModel = resolveThemeModel();
    const metadata = resolveThemeMetadata(themeModel);
    const snapshot = createRootSnapshot(rootEl, themeModel, metadata);
    const bucket = resolveRootCacheBucket(rootEl);
    const cache = kind === "output" ? bucket.output : bucket.full;

    if (cache.has(snapshot.signature)) {
      return cache.get(snapshot.signature);
    }

    const context = createResolutionContext(rootEl, themeModel, snapshot);
    const entries = kind === "output" ? metadata.outputTokenEntries : metadata.tokenEntries;
    const resolved = deepFreeze(resolveTokenEntries(entries, context));
    cache.set(snapshot.signature, resolved);
    return resolved;
  }

  function resolveForRoot(rootEl) {
    return resolveWithCache(rootEl, "full");
  }

  function resolveOutputsForRoot(rootEl) {
    return resolveWithCache(rootEl, "output");
  }

  function resetCacheState() {
    themeMetadataByModel = new WeakMap();
    rootResolutionCache = new WeakMap();
  }

  function configure(nextConfig) {
    config = toObject(nextConfig) || null;
    resetCacheState();
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
    resolveOutputsForRoot: resolveOutputsForRoot,
    getTokenDefinitions: getTokenDefinitions,
    getOutputTokenDefinitions: getOutputTokenDefinitions
  };

  return moduleApi;
}));
