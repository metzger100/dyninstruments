/**
 * @file DyniPlugin Theme Resolver Runtime - Plugin-wide theme token resolver
 * Documentation: documentation/shared/theme-tokens.md
 */
(function (root) {
  "use strict";

  /** @typedef {Record<string, unknown>} DyniThemeValues */
  /** @typedef {{ path: string, inputVar: string, type: string, default?: unknown, defaultByMode?: Record<string, unknown>, defaultFrom?: string, deprecatedInputVar?: string }} DyniThemeTokenDefinition */
  /** @typedef {{ getTokenDefinitions: () => DyniThemeTokenDefinition[], getOutputTokenDefinitions: () => DyniThemeTokenDefinition[], normalizePresetName: (value: unknown) => string, getPresetMode: (presetName: string, mode: string) => DyniThemeValues, getPresetBase: (presetName: string) => DyniThemeValues, getTokenDefinition: (path: string) => DyniThemeTokenDefinition | null }} DyniThemeModel */
  /** @typedef {{ getNightModeState?: (rootEl: Element) => boolean, getActivePresetName?: (rootEl: Element, inlineStyle: CSSStyleDeclaration | null, mode: string) => string, readCssInputVar?: (style: CSSStyleDeclaration | null, inputVar: string) => string }} DyniThemeResolverOptions */
  /** @typedef {{ create: () => DyniValueMathApi }} DyniThemeValueMathModule */
  /** @typedef {{ inputReader: (style: CSSStyleDeclaration | null, inputVar: string) => string, style: CSSStyleDeclaration | null, mode: string, presetMode: DyniThemeValues, presetBase: DyniThemeValues, warnedDeprecations: Set<string>, tokenPathSegmentsByPath?: Record<string, string[]> }} DyniThemeResolutionContext */
  /** @typedef {{ tokenDef: DyniThemeTokenDefinition, pathSegments: string[], parentPathSegments: string[] | null }} DyniThemeMetadataEntry */
  /** @typedef {{ entries: DyniThemeMetadataEntry[], inputVars: string[], pathSegmentsByPath: Record<string, string[]> }} DyniThemeTokenMetadata */
  /** @typedef {{ tokenEntries: DyniThemeMetadataEntry[], outputTokenEntries: DyniThemeMetadataEntry[], snapshotInputVars: string[], tokenPathSegmentsByPath: Record<string, string[]> }} DyniThemeMetadata */
  /** @typedef {{ full: Map<string, DyniThemeValues>, output: Map<string, DyniThemeValues> }} DyniThemeCacheBucket */
  /** @typedef {{ resolveForRoot: (rootEl: Element) => DyniThemeValues, resolveOutputsForRoot: (rootEl: Element) => DyniThemeValues, resetCache: () => void }} DyniThemeResolverApi */
  /** @typedef {DyniRuntimeNamespace & { createThemeResolver: (model: DyniThemeModel, options?: DyniThemeResolverOptions) => DyniThemeResolverApi }} DyniThemeResolverRuntime */
  /** @typedef {Window & { DyniPlugin: DyniPluginNamespace & { runtime: DyniThemeResolverRuntime }, DyniComponents?: Record<string, unknown>, getComputedStyle?: (el: Element) => CSSStyleDeclaration, console: Console }} DyniThemeResolverRoot */

  const browserRoot = /** @type {DyniThemeResolverRoot} */ (/** @type {unknown} */ (root));
  const ns = browserRoot.DyniPlugin;
  const runtime = ns.runtime;

  const valueMathModule =
    browserRoot.DyniComponents &&
    /** @type {DyniThemeValueMathModule | undefined} */ (browserRoot.DyniComponents.DyniValueMath);
  if (!valueMathModule || typeof valueMathModule.create !== "function") {
    throw new Error("ThemeResolver runtime: DyniValueMath module is required before resolver bootstrap");
  }
  const valueMath = valueMathModule.create();
  if (!valueMath || typeof valueMath.toObject !== "function") {
    throw new Error("ThemeResolver runtime: ValueMath.toObject is required before resolver bootstrap");
  }
  const toObject = valueMath.toObject;

  /** @param {DyniThemeValues} target @param {string[]} pathSegments @param {unknown} value */
  function setByPath(target, pathSegments, value) {
    /** @type {DyniThemeValues} */
    let cursor = target;
    const lastIndex = pathSegments.length - 1;
    for (let i = 0; i < lastIndex; i += 1) {
      const segment = pathSegments[i];
      const next = cursor[segment];
      if (!next || typeof next !== "object") {
        cursor[segment] = Object.create(null);
      }
      cursor = /** @type {DyniThemeValues} */ (cursor[segment]);
    }
    cursor[pathSegments[lastIndex]] = value;
  }

  /** @param {unknown} source @param {string[]} pathSegments @returns {unknown} */
  function getByPath(source, pathSegments) {
    let cursor = source;
    for (let i = 0; i < pathSegments.length; i += 1) {
      if (!cursor || typeof cursor !== "object" || !Object.prototype.hasOwnProperty.call(cursor, pathSegments[i])) {
        return undefined;
      }
      cursor = /** @type {Record<string, unknown>} */ (cursor)[pathSegments[i]];
    }
    return cursor;
  }

  /** @param {Element | null} el @returns {CSSStyleDeclaration | null} */
  function getComputedStyleSafe(el) {
    if (!el || typeof browserRoot.getComputedStyle !== "function") {
      return null;
    }
    const style = browserRoot.getComputedStyle(el);
    return style && typeof style.getPropertyValue === "function" ? style : null;
  }

  /** @param {Element | null} rootEl @returns {CSSStyleDeclaration | null} */
  function getInlineStyleSafe(rootEl) {
    const styledRoot = rootEl && /** @type {{ style?: CSSStyleDeclaration }} */ (/** @type {unknown} */ (rootEl));
    const style = styledRoot && styledRoot.style;
    return style && typeof style.getPropertyValue === "function" ? style : null;
  }

  /** @param {CSSStyleDeclaration | null} style @param {string} inputVar @returns {string} */
  function readCssInputVar(style, inputVar) {
    if (!style || typeof style.getPropertyValue !== "function" || !inputVar) {
      return "";
    }
    const raw = style.getPropertyValue(inputVar);
    return typeof raw === "string" ? raw.trim() : "";
  }

  /** @param {string[]} inputVars @param {Record<string, boolean>} seenInputVars @param {unknown} inputVar */
  function addInputVar(inputVars, seenInputVars, inputVar) {
    if (typeof inputVar !== "string" || inputVar.length === 0 || seenInputVars[inputVar]) {
      return;
    }
    seenInputVars[inputVar] = true;
    inputVars.push(inputVar);
  }

  /** @param {DyniThemeTokenDefinition[]} tokenDefs @returns {DyniThemeTokenMetadata} */
  function createTokenMetadata(tokenDefs) {
    /** @type {DyniThemeMetadataEntry[]} */
    const entries = [];
    /** @type {string[]} */
    const inputVars = [];
    const seenInputVars = /** @type {Record<string, boolean>} */ (Object.create(null));
    const pathSegmentsByPath = /** @type {Record<string, string[]>} */ (Object.create(null));

    for (let i = 0; i < tokenDefs.length; i += 1) {
      const tokenDef = tokenDefs[i];
      const pathSegments = tokenDef.path.split(".");
      Object.freeze(pathSegments);
      pathSegmentsByPath[tokenDef.path] = pathSegments;
      const parentPathSegments =
        typeof tokenDef.defaultFrom === "string" && tokenDef.defaultFrom.length > 0
          ? pathSegmentsByPath[tokenDef.defaultFrom] || tokenDef.defaultFrom.split(".")
          : null;
      entries.push({
        tokenDef: tokenDef,
        pathSegments: pathSegments,
        parentPathSegments: parentPathSegments
      });

      addInputVar(inputVars, seenInputVars, tokenDef && tokenDef.inputVar);
      addInputVar(inputVars, seenInputVars, tokenDef && tokenDef.deprecatedInputVar);
    }

    return /** @type {DyniThemeTokenMetadata} */ (
      /** @type {unknown} */ (
        Object.freeze({
          entries: Object.freeze(entries),
          inputVars: Object.freeze(inputVars),
          pathSegmentsByPath: Object.freeze(pathSegmentsByPath)
        })
      )
    );
  }

  /** @param {string} raw @param {DyniThemeTokenDefinition} tokenDef @returns {{ hasValue: boolean, value: unknown }} */
  function parseOverride(raw, tokenDef) {
    if (tokenDef.type === "number") {
      const parsed = parseFloat(raw);
      return Number.isFinite(parsed) ? { hasValue: true, value: parsed } : { hasValue: false, value: tokenDef.default };
    }
    return { hasValue: true, value: raw };
  }

  /** @param {string} oldVar @param {string} newVar @param {Set<string>} warnedDeprecations */
  function logDeprecationWarning(oldVar, newVar, warnedDeprecations) {
    if (warnedDeprecations.has(oldVar)) {
      return;
    }
    warnedDeprecations.add(oldVar);
    if (browserRoot.console && typeof browserRoot.console.warn === "function") {
      browserRoot.console.warn("DyniPlugin: CSS variable " + oldVar + " is deprecated. Use " + newVar + " instead.");
    }
  }

  /** @param {CSSStyleDeclaration | null} style @param {DyniThemeTokenDefinition} tokenDef @param {(style: CSSStyleDeclaration | null, inputVar: string) => string} inputReader @param {Set<string>} warnedDeprecations @returns {{ hasValue: boolean, value: unknown }} */
  function readTokenInputOverride(style, tokenDef, inputReader, warnedDeprecations) {
    const raw = inputReader(style, tokenDef.inputVar);
    if (raw) {
      return parseOverride(raw, tokenDef);
    }
    // dyni-lint-disable-next-line premature-legacy-support -- Regatta camelCase CSS aliases remain supported for existing user.css files.
    const deprecatedAliasInputVar = tokenDef.deprecatedInputVar;
    if (deprecatedAliasInputVar) {
      const aliasRaw = inputReader(style, deprecatedAliasInputVar);
      if (aliasRaw) {
        logDeprecationWarning(deprecatedAliasInputVar, tokenDef.inputVar, warnedDeprecations);
        return parseOverride(aliasRaw, tokenDef);
      }
    }
    return { hasValue: false, value: tokenDef.default };
  }

  /** @param {Element | null} rootEl @returns {boolean} */
  function isCommittedPluginRoot(rootEl) {
    return !!(
      rootEl &&
      rootEl.nodeType === 1 &&
      rootEl.classList &&
      typeof rootEl.classList.contains === "function" &&
      rootEl.classList.contains("widget") &&
      rootEl.classList.contains("dyniplugin")
    );
  }

  /** @param {Element | null} rootEl */
  function requireCommittedPluginRoot(rootEl) {
    if (!isCommittedPluginRoot(rootEl)) {
      throw new Error("ThemeResolver.resolveForRoot: rootEl must be a committed .widget.dyniplugin root element");
    }
  }

  /** @param {Element | null} rootEl @returns {string} */
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

  /** @param {CSSStyleDeclaration | null} inlineStyle @param {string[]} inputVars @returns {string} */
  function buildInlineInputSignature(inlineStyle, inputVars) {
    const parts = /** @type {string[]} */ ([]);
    for (let i = 0; i < inputVars.length; i += 1) {
      const inputVar = inputVars[i];
      parts.push(inputVar + "=" + readCssInputVar(inlineStyle, inputVar));
    }
    return parts.join(";");
  }

  /** @param {unknown} value @returns {unknown} */
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.freeze(value);
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      deepFreeze(/** @type {Record<string, unknown>} */ (value)[keys[i]]);
    }
    return value;
  }

  /** @param {DyniThemeValues} tokens @returns {DyniThemeValues} */
  function applyDerivedSurfaceBorder(tokens) {
    if (!tokens || typeof tokens !== "object") {
      return tokens;
    }
    if (!tokens.surface || typeof tokens.surface !== "object") {
      return tokens;
    }
    const surface = /** @type {DyniThemeValues} */ (tokens.surface);
    if (typeof surface.border !== "undefined") {
      return tokens;
    }
    surface.border = surface.fg;
    return tokens;
  }

  runtime.createThemeResolver = function createThemeResolver(themeModel, options) {
    const model = /** @type {DyniThemeModel} */ (themeModel);
    const opts = /** @type {DyniThemeResolverOptions} */ (toObject(options));
    const warnedDeprecations = new Set();
    /** @type {DyniThemeMetadata | null} */
    let themeMetadata = null;
    /** @type {WeakMap<Element, DyniThemeCacheBucket>} */
    let rootResolutionCache = new WeakMap();

    /** @param {Element} rootEl @returns {boolean} */
    function getNightModeState(rootEl) {
      const override = opts.getNightModeState;
      if (typeof override === "function") {
        return !!override(rootEl);
      }
      return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
    }

    /** @param {Element} rootEl @param {CSSStyleDeclaration | null} inlineStyle @param {string} mode @returns {string} */
    function getActivePresetName(rootEl, inlineStyle, mode) {
      const override = opts.getActivePresetName;
      if (typeof override === "function") {
        return override(rootEl, inlineStyle, mode);
      }
      return "default";
    }

    /** @returns {(style: CSSStyleDeclaration | null, inputVar: string) => string} */
    function resolveInputReader() {
      return typeof opts.readCssInputVar === "function" ? opts.readCssInputVar : readCssInputVar;
    }

    /** @returns {DyniThemeMetadata} */
    function resolveThemeMetadata() {
      if (themeMetadata) {
        return themeMetadata;
      }
      const tokenMetadata = createTokenMetadata(model.getTokenDefinitions());
      const outputTokenMetadata = createTokenMetadata(model.getOutputTokenDefinitions());
      themeMetadata = Object.freeze({
        tokenEntries: tokenMetadata.entries,
        outputTokenEntries: outputTokenMetadata.entries,
        snapshotInputVars: tokenMetadata.inputVars,
        tokenPathSegmentsByPath: tokenMetadata.pathSegmentsByPath
      });
      return themeMetadata;
    }

    /** @param {Element} rootEl @param {DyniThemeMetadata} metadata @returns {{ mode: string, presetName: string, signature: string }} */
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

    /** @param {Element} rootEl @param {{ mode: string, presetName: string }} snapshot @returns {DyniThemeResolutionContext} */
    function createResolutionContext(rootEl, snapshot) {
      const inputReader = resolveInputReader();
      const style = getComputedStyleSafe(rootEl);
      return {
        inputReader: inputReader,
        style: style,
        mode: snapshot.mode,
        presetMode: model.getPresetMode(snapshot.presetName, snapshot.mode),
        presetBase: model.getPresetBase(snapshot.presetName),
        warnedDeprecations: warnedDeprecations
      };
    }

    /** @param {DyniThemeTokenDefinition} tokenDef @param {string[]} pathSegments @param {string[] | null} parentPathSegments @param {DyniThemeResolutionContext} context @returns {unknown} */
    function resolveTokenValue(tokenDef, pathSegments, parentPathSegments, context) {
      const rootOverride = readTokenInputOverride(
        context.style,
        tokenDef,
        context.inputReader,
        context.warnedDeprecations
      );
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

      const modeDefault =
        tokenDef.defaultByMode && Object.prototype.hasOwnProperty.call(tokenDef.defaultByMode, context.mode)
          ? tokenDef.defaultByMode[context.mode]
          : undefined;
      if (typeof modeDefault !== "undefined") {
        return modeDefault;
      }

      if (typeof tokenDef.default !== "undefined") {
        return tokenDef.default;
      }

      if (tokenDef.defaultFrom) {
        const parentDef = model.getTokenDefinition(tokenDef.defaultFrom);
        if (parentDef) {
          const tokenPathSegmentsByPath = context.tokenPathSegmentsByPath || {};
          const resolvedParentPathSegments =
            parentPathSegments || tokenPathSegmentsByPath[parentDef.path] || parentDef.path.split(".");
          return resolveTokenValue(parentDef, resolvedParentPathSegments, null, context);
        }
      }

      return undefined;
    }

    /** @param {Element} rootEl @returns {DyniThemeCacheBucket} */
    function resolveRootCacheBucket(rootEl) {
      let bucket = rootResolutionCache.get(rootEl);
      if (!bucket) {
        bucket = { full: new Map(), output: new Map() };
        rootResolutionCache.set(rootEl, bucket);
      }
      return bucket;
    }

    /** @param {DyniThemeMetadataEntry[]} entries @param {DyniThemeResolutionContext} context @returns {DyniThemeValues} */
    function resolveTokenEntries(entries, context) {
      const out = /** @type {DyniThemeValues} */ ({});
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        setByPath(
          out,
          entry.pathSegments,
          resolveTokenValue(entry.tokenDef, entry.pathSegments, entry.parentPathSegments, context)
        );
      }
      return applyDerivedSurfaceBorder(out);
    }

    /** @param {Element} rootEl @param {"full" | "output"} kind @returns {DyniThemeValues} */
    function resolveWithCache(rootEl, kind) {
      requireCommittedPluginRoot(rootEl);
      const metadata = resolveThemeMetadata();
      const snapshot = createRootSnapshot(rootEl, metadata);
      const bucket = resolveRootCacheBucket(rootEl);
      const cache = kind === "output" ? bucket.output : bucket.full;

      if (cache.has(snapshot.signature)) {
        return /** @type {DyniThemeValues} */ (cache.get(snapshot.signature));
      }

      const context = createResolutionContext(rootEl, snapshot);
      context.tokenPathSegmentsByPath = metadata.tokenPathSegmentsByPath;
      const entries = kind === "output" ? metadata.outputTokenEntries : metadata.tokenEntries;
      const resolved = /** @type {DyniThemeValues} */ (deepFreeze(resolveTokenEntries(entries, context)));
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
})(this);
