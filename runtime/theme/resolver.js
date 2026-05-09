/**
 * Module: DyniPlugin Theme Resolver Runtime - Plugin-wide theme token resolver
 * Documentation: documentation/shared/theme-tokens.md
 * Depends: runtime/theme/model.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

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
    if (!el || typeof root.getComputedStyle !== "function") {
      return null;
    }
    const style = root.getComputedStyle(el);
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

  runtime.createThemeResolver = function createThemeResolver(themeModel, options) {
    const opts = toObject(options) || {};
    const model = themeModel;
    let themeMetadata = null;
    let rootResolutionCache = new WeakMap();

    function getNightModeState(rootEl) {
      const override = opts.getNightModeState;
      if (typeof override === "function") {
        return !!override(rootEl);
      }
      return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
    }

    function getActivePresetName(rootEl, inlineStyle, mode) {
      const override = opts.getActivePresetName;
      if (typeof override === "function") {
        return override(rootEl, inlineStyle, mode);
      }
      return "default";
    }

    function resolveInputReader() {
      return typeof opts.readCssInputVar === "function" ? opts.readCssInputVar : readCssInputVar;
    }

    function resolveThemeMetadata() {
      if (themeMetadata) {
        return themeMetadata;
      }
      const tokenMetadata = createTokenMetadata(model.getTokenDefinitions());
      const outputTokenMetadata = createTokenMetadata(model.getOutputTokenDefinitions());
      themeMetadata = Object.freeze({
        tokenEntries: tokenMetadata.entries,
        outputTokenEntries: outputTokenMetadata.entries,
        snapshotInputVars: tokenMetadata.inputVars
      });
      return themeMetadata;
    }

    function createRootSnapshot(rootEl, metadata) {
      const mode = getNightModeState(rootEl) ? "night" : "day";
      const inlineStyle = getInlineStyleSafe(rootEl);
      const presetName = model.normalizePresetName(getActivePresetName(rootEl, inlineStyle, mode));
      const classSignature = getRootClassSignature(rootEl);
      const inlineInputSignature = buildInlineInputSignature(inlineStyle, metadata.snapshotInputVars);

      return {
        mode: mode,
        presetName: presetName,
        signature: mode + "|" + presetName + "|" + classSignature + "|" + inlineInputSignature
      };
    }

    function createResolutionContext(rootEl, snapshot) {
      const inputReader = resolveInputReader();
      const style = getComputedStyleSafe(rootEl);
      return {
        inputReader: inputReader,
        style: style,
        mode: snapshot.mode,
        presetMode: model.getPresetMode(snapshot.presetName, snapshot.mode),
        presetBase: model.getPresetBase(snapshot.presetName)
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

    function resolveRootCacheBucket(rootEl) {
      let bucket = rootResolutionCache.get(rootEl);
      if (!bucket) {
        bucket = { full: new Map(), output: new Map() };
        rootResolutionCache.set(rootEl, bucket);
      }
      return bucket;
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
      const metadata = resolveThemeMetadata();
      const snapshot = createRootSnapshot(rootEl, metadata);
      const bucket = resolveRootCacheBucket(rootEl);
      const cache = kind === "output" ? bucket.output : bucket.full;

      if (cache.has(snapshot.signature)) {
        return cache.get(snapshot.signature);
      }

      const context = createResolutionContext(rootEl, snapshot);
      const entries = kind === "output" ? metadata.outputTokenEntries : metadata.tokenEntries;
      const resolved = deepFreeze(resolveTokenEntries(entries, context));
      cache.set(snapshot.signature, resolved);
      return resolved;
    }

    return {
      resolveForRoot: function (rootEl) {
        return resolveWithCache(rootEl, "full");
      },
      resolveOutputsForRoot: function (rootEl) {
        return resolveWithCache(rootEl, "output");
      },
      resetCache: function () {
        themeMetadata = null;
        rootResolutionCache = new WeakMap();
      }
    };
  };
}(this));
