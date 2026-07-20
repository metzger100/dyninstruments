/**
 * @file PluginBootstrapCore - Shared startup orchestration for plugin.js and plugin.mjs
 * Documentation: documentation/architecture/runtime-lifecycle.md
 */
(function (/** @type {DyniBootstrapRoot} */ root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DyniPluginBootstrapCore = factory();
  }
})(/** @type {DyniBootstrapRoot} */ (typeof globalThis !== "undefined" ? globalThis : this), function () {
  "use strict";

  var SCRIPT_ID_PREFIX = "dyni-internal";
  var BOOTSTRAP_MANIFEST_PATH = "config/bootstrap-manifest.js";
  var BOOTSTRAP_BUNDLE_PATH = "bootstrap-bundle.js";
  var startupSequence = 0;

  /** @param {unknown} baseUrl @returns {string} */
  function normalizeBaseUrl(baseUrl) {
    if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
      throw new Error("dyninstruments: bootstrap base URL is missing");
    }
    return baseUrl.replace(/\/+$/, "") + "/";
  }

  /** @param {unknown} value @returns {string} */
  function sanitizeIdToken(value) {
    return (
      String(value || "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "x"
    );
  }

  /** @param {unknown} value @returns {string} */
  function hashText(value) {
    var hash = 2166136261;
    var text = String(value || "");
    var i;
    for (i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36);
  }

  /** @param {unknown} baseUrl @returns {string} */
  function resolveGenerationDiscriminator(baseUrl) {
    var normalized = normalizeBaseUrl(baseUrl);
    var match = normalized.match(/\/__([^/]+)\/$/);
    if (match && match[1]) {
      return "gen-" + sanitizeIdToken(match[1]);
    }
    return "base-" + hashText(normalized);
  }

  /** @param {DyniBootstrapOptions | undefined} options @param {string} baseUrl @returns {string} */
  function resolveScriptScope(options, baseUrl) {
    var explicitScope = options && typeof options.scriptIdScope === "string" ? options.scriptIdScope.trim() : "";
    if (explicitScope) {
      return sanitizeIdToken(explicitScope);
    }
    if (options && options.entrypoint === "module") {
      return "module-" + sanitizeIdToken(resolveGenerationDiscriminator(baseUrl));
    }
    return "legacy";
  }

  /** @param {DyniBootstrapOptions | undefined} options @returns {"legacy" | "module"} */
  function resolveEntrypoint(options) {
    if (options && options.entrypoint === "module") {
      return "module";
    }
    return "legacy";
  }

  /** @param {unknown} relativePath @param {unknown} scope @returns {string} */
  function makeScriptId(relativePath, scope) {
    return [SCRIPT_ID_PREFIX, sanitizeIdToken(scope || "legacy"), sanitizeIdToken(relativePath)].join("-");
  }

  /** @param {Document} documentRef @param {string} scriptId @param {string} src @returns {Promise<void>} */
  function loadScriptOnceById(documentRef, scriptId, src) {
    if (documentRef.getElementById(scriptId)) {
      return Promise.resolve();
    }

    return new Promise(function (/** @type {() => void} */ resolve, /** @type {(reason?: unknown) => void} */ reject) {
      var scriptEl = documentRef.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.src = src;
      scriptEl.onload = function () {
        resolve();
      };
      scriptEl.onerror = function (error) {
        removeElement(scriptEl);
        reject(error);
      };
      documentRef.head.appendChild(scriptEl);
    });
  }

  /** @param {Element | null | undefined} element */
  function removeElement(element) {
    if (!element) {
      return;
    }
    if (element.parentNode && typeof element.parentNode.removeChild === "function") {
      element.parentNode.removeChild(element);
      return;
    }
    if (typeof element.remove === "function") {
      element.remove();
    }
  }

  /** @param {Document} documentRef @param {string} cssId @param {string} href @returns {Promise<void>} */
  function loadCssOnceById(documentRef, cssId, href) {
    if (!href) {
      return Promise.resolve();
    }
    if (documentRef.getElementById(cssId)) {
      return Promise.resolve();
    }

    return new Promise(function (/** @type {() => void} */ resolve, /** @type {(reason?: unknown) => void} */ reject) {
      var linkEl = documentRef.createElement("link");
      linkEl.id = cssId;
      linkEl.rel = "stylesheet";
      linkEl.href = href;
      linkEl.onload = function () {
        resolve();
      };
      linkEl.onerror = function (error) {
        removeElement(linkEl);
        reject(error);
      };
      documentRef.head.appendChild(linkEl);
    });
  }

  /**
   * @param {DyniBootstrapRoot} rootRef
   * @param {string} baseUrl
   * @param {unknown} hostApi
   * @param {DyniBootstrapLoader} loadScriptOnce
   * @param {DyniBootstrapLoader} loadCssOnce
   * @param {DyniBootstrapGeneration} generation
   * @returns {DyniBootstrapNamespace}
   */
  function prepareNamespace(rootRef, baseUrl, hostApi, loadScriptOnce, loadCssOnce, generation) {
    var win = rootRef.window || rootRef;
    var ns = /** @type {DyniBootstrapNamespace} */ (win.DyniPlugin || {});
    win.DyniPlugin = ns;
    ns.baseUrl = baseUrl;
    ns.avnavApi = hostApi;
    ns.config = ns.config || {};
    ns.runtime = ns.runtime || {};
    ns.state = ns.state || {};
    ns.startupGeneration = generation;
    ns.runtime.loadScriptOnce = loadScriptOnce;
    ns.runtime.loadCssOnce = loadCssOnce;
    return ns;
  }

  /**
   * @param {DyniBootstrapNamespace} ns
   * @param {Document} documentRef
   * @param {string} baseUrl
   * @param {string} scope
   * @param {DyniBootstrapLogger} logger
   * @param {DyniBootstrapLoader} loadScriptOnce
   * @returns {Promise<void>}
   */
  function loadBootstrapManifest(ns, documentRef, baseUrl, scope, logger, loadScriptOnce) {
    return loadScriptOnce(makeScriptId(BOOTSTRAP_MANIFEST_PATH, scope), baseUrl + BOOTSTRAP_MANIFEST_PATH)
      .catch(function (error) {
        logger.error("dyninstruments: failed to load bootstrap manifest at config/bootstrap-manifest.js");
        throw error;
      })
      .then(function () {
        var manifest = ns.config && ns.config.bootstrapManifest;

        if (!Array.isArray(manifest)) {
          throw new Error("dyninstruments: bootstrap manifest missing or invalid");
        }

        return manifest.reduce(function (chain, relativePath) {
          return chain.then(function () {
            return loadScriptOnce(makeScriptId(relativePath, scope), baseUrl + relativePath);
          });
        }, Promise.resolve());
      });
  }

  /** @returns {DyniBootstrapRoot} */
  function resolveGlobalRoot() {
    return /** @type {DyniBootstrapRoot} */ (
      (typeof window !== "undefined" && window) || (typeof globalThis !== "undefined" && globalThis) || {}
    );
  }

  /** @param {DyniBootstrapNamespace} ns @returns {Promise<(() => void) | undefined>} */
  function runInit(ns) {
    var init = ns.runtime.runInit;
    if (typeof init !== "function") {
      throw new Error("dyninstruments: runtime.runInit missing");
    }
    return init();
  }

  /** @param {DyniBootstrapOptions | undefined} options @returns {Promise<(() => void) | undefined>} */
  function start(options) {
    var opts = /** @type {DyniBootstrapOptions} */ (options || {});
    var documentRef = opts.document || (typeof document !== "undefined" ? document : null);
    var logger = /** @type {DyniBootstrapLogger} */ (
      opts.logger || (typeof console !== "undefined" ? console : { error: function () {} })
    );

    if (!documentRef || !documentRef.head) {
      throw new Error("dyninstruments: document.head missing");
    }
    var activeDocument = /** @type {Document} */ (documentRef);

    var baseUrl = normalizeBaseUrl(opts.baseUrl);
    var scope = resolveScriptScope(opts, baseUrl);
    startupSequence += 1;

    /** @type {DyniBootstrapGeneration} */
    var generation = {
      id: scope + "-" + startupSequence,
      entrypoint: resolveEntrypoint(opts),
      baseUrl: baseUrl,
      hostApi: opts.hostApi || null
    };

    /** @type {DyniBootstrapLoader} */
    var loadScriptOnceByScopedId = function (scriptId, src) {
      return loadScriptOnceById(activeDocument, makeScriptId(scriptId, scope), src);
    };
    /** @type {DyniBootstrapLoader} */
    var loadCssOnceByScopedId = function (cssId, href) {
      return loadCssOnceById(activeDocument, makeScriptId(cssId, scope), href);
    };
    /** @type {DyniBootstrapLoader} */
    var loadScriptById = function (scriptId, src) {
      return loadScriptOnceById(activeDocument, scriptId, src);
    };

    var rootRef = /** @type {DyniBootstrapRoot} */ (opts.root || resolveGlobalRoot());
    var ns = prepareNamespace(
      rootRef,
      baseUrl,
      opts.hostApi || null,
      loadScriptOnceByScopedId,
      loadCssOnceByScopedId,
      generation
    );

    return (
      loadScriptById(makeScriptId(BOOTSTRAP_BUNDLE_PATH, scope), baseUrl + BOOTSTRAP_BUNDLE_PATH)
        .then(
          function () {
            return runInit(ns);
          },
          function () {
            return loadBootstrapManifest(ns, activeDocument, baseUrl, scope, logger, loadScriptById).then(function () {
              return runInit(ns);
            });
          }
        )
        // dyni-boundary-next-line(category: browser-runtime-boundary, owner: Metzger100, date: 2026-07-17) -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
        .catch(function (error) {
          logger.error("dyninstruments bootstrap failed:", error);
          return undefined;
        })
    );
  }

  return {
    start: start,
    makeScriptId: makeScriptId,
    resolveGenerationDiscriminator: resolveGenerationDiscriminator,
    resolveScriptScope: resolveScriptScope,
    resolveEntrypoint: resolveEntrypoint,
    normalizeBaseUrl: normalizeBaseUrl,
    resolveGlobalRoot: resolveGlobalRoot
  };
});
