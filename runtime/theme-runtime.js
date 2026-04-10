/**
 * Module: DyniPlugin Theme Runtime - Startup preset wiring, commit-time root materialization, and shadow CSS text cache
 * Documentation: documentation/architecture/runtime-lifecycle.md
 * Depends: ThemeModel, ThemeResolver
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const hasOwn = Object.prototype.hasOwnProperty;

  let configured = false;
  let themeModel = null;
  let themeResolver = null;
  let activePresetName = "default";

  const shadowCssTextCache = new Map();
  const shadowCssLoadCache = new Map();

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function normalizePresetName(model, presetName) {
    if (!model || typeof model.normalizePresetName !== "function") {
      return "default";
    }
    return model.normalizePresetName(presetName);
  }

  function resolveByPath(source, path) {
    if (!source || typeof source !== "object" || !isNonEmptyString(path)) {
      return undefined;
    }
    const segments = path.split(".");
    let cursor = source;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (!cursor || typeof cursor !== "object" || !hasOwn.call(cursor, segment)) {
        return undefined;
      }
      cursor = cursor[segment];
    }
    return cursor;
  }

  function ensureFetchApi() {
    if (typeof root.fetch === "function") {
      return root.fetch.bind(root);
    }
    throw new Error("dyninstruments: runtime._theme shadow CSS preload requires fetch()");
  }

  function fetchShadowCssText(url) {
    if (!isNonEmptyString(url)) {
      return Promise.reject(new Error("dyninstruments: runtime._theme.fetchShadowCssText() requires non-empty url"));
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

  function ensureConfigured(methodName) {
    if (!configured || !themeModel || !themeResolver) {
      throw new Error("dyninstruments: runtime._theme." + methodName + "() requires prior configure()");
    }
  }

  function configure(options) {
    const opts = options || {};
    const nextThemeModel = opts.ThemeModel;
    const nextThemeResolver = opts.ThemeResolver;

    if (!nextThemeModel || typeof nextThemeModel.getOutputTokenDefinitions !== "function") {
      throw new Error("dyninstruments: runtime._theme.configure() requires ThemeModel");
    }
    if (!nextThemeResolver || typeof nextThemeResolver.configure !== "function" || typeof nextThemeResolver.resolveForRoot !== "function") {
      throw new Error("dyninstruments: runtime._theme.configure() requires ThemeResolver");
    }

    themeModel = nextThemeModel;
    themeResolver = nextThemeResolver;
    activePresetName = normalizePresetName(themeModel, opts.activePresetName);

    themeResolver.configure({
      ThemeModel: themeModel,
      getNightModeState(rootEl) {
        return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
      },
      getActivePresetName() {
        return activePresetName;
      }
    });

    configured = true;
    return activePresetName;
  }

  function applyToRoot(rootEl) {
    ensureConfigured("applyToRoot");

    if (!rootEl || !rootEl.style || typeof rootEl.style.setProperty !== "function") {
      throw new Error("dyninstruments: runtime._theme.applyToRoot() requires root element with style.setProperty()");
    }

    const resolvedTheme = (typeof themeResolver.resolveOutputsForRoot === "function")
      ? themeResolver.resolveOutputsForRoot(rootEl)
      : themeResolver.resolveForRoot(rootEl);
    const outputDefs = themeModel.getOutputTokenDefinitions();
    for (let i = 0; i < outputDefs.length; i += 1) {
      const outputDef = outputDefs[i];
      const outputVar = outputDef && outputDef.outputVar;
      if (!isNonEmptyString(outputVar)) {
        continue;
      }
      const resolvedValue = resolveByPath(resolvedTheme, outputDef.path);
      if (typeof resolvedValue === "undefined") {
        throw new Error("dyninstruments: runtime._theme.applyToRoot() missing resolved token '" + outputDef.path + "'");
      }
      rootEl.style.setProperty(outputVar, String(resolvedValue));
    }

    return resolvedTheme;
  }

  runtime._theme = Object.freeze({
    configure: configure,
    applyToRoot: applyToRoot,
    fetchShadowCssText: fetchShadowCssText,
    preloadShadowCssUrls: preloadShadowCssUrls,
    getShadowCssText(url) {
      return shadowCssTextCache.has(url) ? shadowCssTextCache.get(url) : null;
    },
    hasShadowCssText(url) {
      return shadowCssTextCache.has(url);
    }
  });
}(this));
