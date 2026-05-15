/**
 * Module: PluginBootstrapCore - Shared startup orchestration for plugin.js and plugin.mjs
 * Documentation: documentation/architecture/runtime-lifecycle.md
 * Depends: window.DyniPlugin
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DyniPluginBootstrapCore = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var SCRIPT_ID_PREFIX = "dyni-internal";
  var BOOTSTRAP_MANIFEST_PATH = "config/bootstrap-manifest.js";
  var BOOTSTRAP_BUNDLE_PATH = "bootstrap-bundle.js";

  function normalizeBaseUrl(baseUrl) {
    if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
      throw new Error("dyninstruments: bootstrap base URL is missing");
    }
    return baseUrl.replace(/\/+$/, "") + "/";
  }

  function sanitizeIdToken(value) {
    return String(value || "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "x";
  }

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

  function resolveGenerationDiscriminator(baseUrl) {
    var normalized = normalizeBaseUrl(baseUrl);
    var match = normalized.match(/\/__([^/]+)\/$/);
    if (match && match[1]) {
      return "gen-" + sanitizeIdToken(match[1]);
    }
    return "base-" + hashText(normalized);
  }

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

  function makeScriptId(relativePath, scope) {
    return [
      SCRIPT_ID_PREFIX,
      sanitizeIdToken(scope || "legacy"),
      sanitizeIdToken(relativePath)
    ].join("-");
  }

  function loadScriptOnceById(documentRef, scriptId, src) {
    if (documentRef.getElementById(scriptId)) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var scriptEl = documentRef.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.src = src;
      scriptEl.onload = function () {
        resolve();
      };
      scriptEl.onerror = reject;
      documentRef.head.appendChild(scriptEl);
    });
  }

  function prepareNamespace(rootRef, baseUrl, hostApi, loadScriptOnce) {
    var win = rootRef.window || rootRef;
    var ns = win.DyniPlugin = win.DyniPlugin || {};
    ns.baseUrl = baseUrl;
    ns.avnavApi = hostApi;
    ns.config = ns.config || {};
    ns.runtime = ns.runtime || {};
    ns.runtime.loadScriptOnce = loadScriptOnce;
    return ns;
  }

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

  function runInit(ns) {
    if (!ns.runtime || typeof ns.runtime.runInit !== "function") {
      throw new Error("dyninstruments: runtime.runInit missing");
    }
    return ns.runtime.runInit();
  }

  function start(options) {
    var opts = options || {};
    var documentRef = opts.document || (typeof document !== "undefined" ? document : null);
    var logger = opts.logger || (typeof console !== "undefined" ? console : { error: function () {} });

    if (!documentRef || !documentRef.head) {
      throw new Error("dyninstruments: document.head missing");
    }

    var baseUrl = normalizeBaseUrl(opts.baseUrl);
    var scope = resolveScriptScope(opts, baseUrl);
    var loadScriptOnce = function (scriptId, src) {
      return loadScriptOnceById(documentRef, scriptId, src);
    };

    var rootRef = opts.root || (typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {}));
    var ns = prepareNamespace(rootRef, baseUrl, opts.hostApi || null, loadScriptOnce);

    return loadScriptOnce(makeScriptId(BOOTSTRAP_BUNDLE_PATH, scope), baseUrl + BOOTSTRAP_BUNDLE_PATH)
      .then(function () {
        return runInit(ns);
      }, function () {
        return loadBootstrapManifest(ns, documentRef, baseUrl, scope, logger, loadScriptOnce)
          .then(function () {
            return runInit(ns);
          });
      })
      // dyni-lint-disable-next-line catch-fallback-without-suppression -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
      .catch(function (error) {
        logger.error("dyninstruments bootstrap failed:", error);
      });
  }

  return {
    start: start,
    makeScriptId: makeScriptId,
    resolveGenerationDiscriminator: resolveGenerationDiscriminator,
    resolveScriptScope: resolveScriptScope,
    normalizeBaseUrl: normalizeBaseUrl
  };
}));
