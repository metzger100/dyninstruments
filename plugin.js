/**
 * @file plugin.js - Legacy Dyni bootstrap adapter
 * Documentation: documentation/architecture/runtime-lifecycle.md
 */
/* global avnav */
(function () {
  "use strict";

  /** @typedef {DyniAvnavApi & { registerWidget: (definition: Record<string, unknown>, editable: Record<string, unknown>) => void, log: (...args: unknown[]) => void }} DyniRequiredHostApi */

  /** @returns {DyniAvnavApi | null} */
  function resolveHostApi() {
    if (typeof avnav !== "undefined" && avnav && avnav.api) {
      return avnav.api;
    }
    if (window.avnav && window.avnav.api) {
      return window.avnav.api;
    }
    return null;
  }

  /** @returns {string} */
  function resolveBaseUrl() {
    if (typeof AVNAV_BASE_URL !== "string" || !AVNAV_BASE_URL) {
      throw new Error("AVNAV_BASE_URL is missing - AvNav must provide this global for plugins.");
    }
    return AVNAV_BASE_URL.replace(/\/+$/, "") + "/";
  }

  /** @param {DyniAvnavApi | null | undefined} hostApi @returns {hostApi is DyniRequiredHostApi} */
  function hasRequiredHostApi(hostApi) {
    return !!(hostApi && typeof hostApi.registerWidget === "function" && typeof hostApi.log === "function");
  }

  /** @param {string} scriptId @param {string} src @returns {Promise<void>} */
  function loadScriptOnce(scriptId, src) {
    if (document.getElementById(scriptId)) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var scriptEl = /** @type {HTMLScriptElement} */ (document.createElement("script"));
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
      document.head.appendChild(scriptEl);
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

  /** @param {string} baseUrl @returns {Promise<DyniBootstrapCoreApi>} */
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
  if (!hasRequiredHostApi(hostApi)) {
    console.error("dyninstruments: avnav.api missing required registerWidget/log methods");
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
    // dyni-boundary-next-line(category: browser-runtime-boundary, owner: Metzger100, date: 2026-07-17) -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
    .catch(function (error) {
      console.error("dyninstruments bootstrap failed:", error);
    });
})();
