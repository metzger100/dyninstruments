/**
 * @file DyniPlugin Theme Runtime - Startup preset wiring, commit-time root materialization, and shadow CSS text cache
 * Documentation: documentation/architecture/runtime-lifecycle.md
 */
(function (root) {
  "use strict";

  /** @typedef {{ outputVar?: unknown, path?: string }} DyniThemeOutputDefinition */
  /** @typedef {{ normalizePresetName(presetName: unknown): string, getOutputTokenDefinitions(): DyniThemeOutputDefinition[] }} DyniThemeModel */
  /** @typedef {{ resolveOutputsForRoot(rootEl: Element): Record<string, unknown>, resolveForRoot(rootEl: Element): unknown }} DyniThemeResolver */
  /** @typedef {{ getNightModeState(rootEl: Element): boolean, getActivePresetName(rootEl: Element): string }} DyniThemeResolverOptions */
  /** @typedef {{ ok?: unknown, status?: unknown, text(): Promise<unknown> }} DyniThemeFetchResponse */
  /** @typedef {{ style: { setProperty(name: string, value: string): void } }} DyniThemeStyleRoot */
  /** @typedef {DyniRuntimeNamespace & { createThemeModel: () => DyniThemeModel, createThemeResolver: (model: DyniThemeModel, options: DyniThemeResolverOptions) => DyniThemeResolver, dom: { getNightModeState(rootEl: Element): boolean }, theme?: unknown }} DyniThemeRuntime */
  /** @typedef {{ DyniPlugin: DyniPluginNamespace & { runtime: DyniThemeRuntime }, fetch?: (url: string) => Promise<DyniThemeFetchResponse>, getComputedStyle?: (element: Element) => CSSStyleDeclaration }} DyniThemeRoot */

  const ns = /** @type {DyniThemeRoot} */ (/** @type {unknown} */ (root)).DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;

  let configured = false;
  /** @type {DyniThemeModel | null} */
  let themeModel = null;
  /** @type {DyniThemeResolver | null} */
  let themeResolver = null;
  let activePresetName = "default";

  const shadowCssTextCache = new Map();
  const shadowCssLoadCache = new Map();

  /** @param {unknown} value @returns {value is string} */
  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  /** @param {unknown} presetName @returns {string} */
  function normalizePresetName(presetName) {
    const model = themeModel || runtime.createThemeModel();
    return model.normalizePresetName(presetName);
  }

  /** @param {unknown} source @param {unknown} path @returns {unknown} */
  function resolveByPath(source, path) {
    if (!source || typeof source !== "object" || !isNonEmptyString(path)) {
      return undefined;
    }
    const segments = path.split(".");
    /** @type {unknown} */
    let cursor = source;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (!cursor || typeof cursor !== "object" || !hasOwn.call(cursor, segment)) {
        return undefined;
      }
      cursor = /** @type {Record<string, unknown>} */ (cursor)[segment];
    }
    return cursor;
  }

  /** @returns {(url: string) => Promise<DyniThemeFetchResponse>} */
  function ensureFetchApi() {
    if (typeof root.fetch === "function") {
      return root.fetch.bind(root);
    }
    throw new Error("dyninstruments: runtime.theme shadow CSS preload requires fetch()");
  }

  /** @param {unknown} url @returns {Promise<string>} */
  function fetchShadowCssText(url) {
    if (!isNonEmptyString(url)) {
      return Promise.reject(new Error("dyninstruments: shadow CSS preload requires non-empty url"));
    }

    if (shadowCssTextCache.has(url)) {
      return Promise.resolve(shadowCssTextCache.get(url));
    }
    if (shadowCssLoadCache.has(url)) {
      return shadowCssLoadCache.get(url);
    }

    const fetchApi = ensureFetchApi();
    const loadPromise = fetchApi(url)
      .then(function (response) {
        if (!response || (hasOwn.call(response, "ok") && response.ok === false)) {
          const status = response && hasOwn.call(response, "status") ? response.status : "unknown";
          throw new Error("dyninstruments: failed to preload shadow CSS '" + url + "' (status " + String(status) + ")");
        }
        if (typeof response.text !== "function") {
          throw new Error("dyninstruments: invalid response for shadow CSS '" + url + "'");
        }
        return response.text();
      })
      .then(function (cssText) {
        const normalizedText = (typeof cssText === "string") ? cssText : String(cssText || "");
        shadowCssTextCache.set(url, normalizedText);
        return normalizedText;
      })
      .then(function (cssText) {
        shadowCssLoadCache.delete(url);
        return cssText;
      }, function (error) {
        shadowCssLoadCache.delete(url);
        throw error;
      });

    shadowCssLoadCache.set(url, loadPromise);
    return loadPromise;
  }

  /** @param {unknown} urls @returns {Promise<string[]>} */
  function preloadShadowCssUrls(urls) {
    if (!Array.isArray(urls) || !urls.length) {
      return Promise.resolve([]);
    }

    const unique = [];
    const seen = Object.create(null);
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      if (!isNonEmptyString(url) || seen[url]) {
        continue;
      }
      seen[url] = true;
      unique.push(url);
    }

    if (!unique.length) {
      return Promise.resolve([]);
    }
    return Promise.all(unique.map(fetchShadowCssText));
  }

  /** @param {Element | null | undefined} el @returns {string | null} */
  function readThemePresetCssVarFromElement(el) {
    if (!el || typeof root.getComputedStyle !== "function") {
      return null;
    }
    const style = root.getComputedStyle(el);
    if (!style || typeof style.getPropertyValue !== "function") {
      return null;
    }
    // dyni-lint-disable-next-line css-js-default-duplication -- Theme preset selection is intentionally read from the documented CSS boundary.
    const raw = style.getPropertyValue("--dyni-theme-preset");
    const value = (typeof raw === "string") ? raw.trim() : "";
    return value || null;
  }

  /** @param {Element | null | undefined} docElement @returns {string} */
  function resolveStartupPresetName(docElement) {
    const rootPreset = readThemePresetCssVarFromElement(docElement);
    return normalizePresetName(rootPreset);
  }

  /** @param {string} methodName */
  function ensureConfigured(methodName) {
    if (!configured || !themeModel || !themeResolver) {
      throw new Error("dyninstruments: runtime.theme." + methodName + "() requires prior configure()");
    }
  }

  /** @param {{ activePresetName?: unknown } | null | undefined} options @returns {string} */
  function configure(options) {
    const opts = options || {};

    const model = runtime.createThemeModel();
    themeModel = model;
    activePresetName = model.normalizePresetName(opts.activePresetName);

    themeResolver = runtime.createThemeResolver(model, {
      getNightModeState: function (rootEl) {
        return runtime.dom.getNightModeState(rootEl);
      },
      getActivePresetName: function (rootEl) {
        const rootPreset = readThemePresetCssVarFromElement(rootEl);
        return model.normalizePresetName(rootPreset || activePresetName);
      }
    });

    configured = true;
    return activePresetName;
  }

  /** @param {unknown} rootEl @returns {Record<string, unknown>} */
  function applyToRoot(rootEl) {
    ensureConfigured("applyToRoot");

    if (!rootEl || typeof rootEl !== "object") {
      throw new Error("dyninstruments: runtime.theme.applyToRoot() requires root element with style.setProperty()");
    }

    const styleRoot = /** @type {DyniThemeStyleRoot} */ (/** @type {unknown} */ (rootEl));
    if (!styleRoot.style || typeof styleRoot.style.setProperty !== "function") {
      throw new Error("dyninstruments: runtime.theme.applyToRoot() requires root element with style.setProperty()");
    }

    const element = /** @type {Element} */ (rootEl);
    const resolvedTheme = /** @type {DyniThemeResolver} */ (themeResolver).resolveOutputsForRoot(element);
    const outputDefs = /** @type {DyniThemeModel} */ (themeModel).getOutputTokenDefinitions();
    for (let i = 0; i < outputDefs.length; i += 1) {
      const outputDef = outputDefs[i];
      const outputVar = outputDef && outputDef.outputVar;
      if (!isNonEmptyString(outputVar)) {
        continue;
      }
      const resolvedValue = resolveByPath(resolvedTheme, outputDef.path);
      if (typeof resolvedValue === "undefined") {
        throw new Error("dyninstruments: runtime.theme.applyToRoot() missing resolved token '" + outputDef.path + "'");
      }
      styleRoot.style.setProperty(outputVar, String(resolvedValue));
    }

    return resolvedTheme;
  }

  /** @param {Element} rootEl @returns {unknown} */
  function resolveForRoot(rootEl) {
    ensureConfigured("resolveForRoot");
    return /** @type {DyniThemeResolver} */ (themeResolver).resolveForRoot(rootEl);
  }

  runtime.theme = Object.freeze({
    configure: configure,
    applyToRoot: applyToRoot,
    resolveStartupPresetName: resolveStartupPresetName,
    preloadShadowCssUrls: preloadShadowCssUrls,
    tokens: Object.freeze({
      resolveForRoot: resolveForRoot
    }),
    /** @param {unknown} url @returns {string | null} */
    getShadowCssText: function (url) {
      return shadowCssTextCache.has(url) ? shadowCssTextCache.get(url) : null;
    },
    /** @param {unknown} url @returns {boolean} */
    hasShadowCssText: function (url) {
      return shadowCssTextCache.has(url);
    }
  });
}(this));
