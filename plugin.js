/**
 * Module: plugin.js - Legacy Dyni bootstrap adapter
 * Documentation: documentation/architecture/runtime-lifecycle.md
 * Depends: runtime/plugin-bootstrap-core.js
 */
/* global avnav */
(function () {
  "use strict";

  function resolveHostApi() {
    if (typeof avnav !== "undefined" && avnav && avnav.api) {
      return avnav.api;
    }
    if (window.avnav && window.avnav.api) {
      return window.avnav.api;
    }
    return null;
  }

  function resolveBaseUrl() {
    if (typeof AVNAV_BASE_URL !== "string" || !AVNAV_BASE_URL) {
      throw new Error("AVNAV_BASE_URL is missing - AvNav must provide this global for plugins.");
    }
    return AVNAV_BASE_URL.replace(/\/+$/, "") + "/";
  }

  function loadScriptOnce(scriptId, src) {
    if (document.getElementById(scriptId)) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.src = src;
      scriptEl.onload = function () {
        resolve();
      };
      scriptEl.onerror = reject;
      document.head.appendChild(scriptEl);
    });
  }

  function ensureBootstrapCore(baseUrl) {
    if (window.DyniPluginBootstrapCore) {
      return Promise.resolve(window.DyniPluginBootstrapCore);
    }

    var corePath = "runtime/plugin-bootstrap-core.js";
    var coreId = "dyni-bootstrap-core-legacy";
    return loadScriptOnce(coreId, baseUrl + corePath).then(function () {
      if (!window.DyniPluginBootstrapCore) {
        throw new Error("dyninstruments: bootstrap core did not register");
      }
      return window.DyniPluginBootstrapCore;
    });
  }

  var hostApi = resolveHostApi();
  if (!hostApi) {
    console.error("dyninstruments: avnav.api missing");
    return;
  }

  var baseUrl = resolveBaseUrl();

  ensureBootstrapCore(baseUrl)
    .then(function (core) {
      return core.start({
        root: window,
        document: document,
        logger: console,
        baseUrl: baseUrl,
        hostApi: hostApi,
        entrypoint: "legacy"
      });
    })
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
    .catch(function (error) {
      console.error("dyninstruments bootstrap failed:", error);
    });
}());
