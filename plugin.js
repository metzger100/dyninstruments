/**
 * Module: plugin.js - DyniPlugin bootstrap entrypoint
 * Documentation: documentation/architecture/component-system.md
 * Depends: AVNAV_BASE_URL, config/bootstrap-manifest.js
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

  const hostApi = resolveHostApi();
  if (!hostApi) {
    console.error("dyninstruments: avnav.api missing");
    return;
  }

  function getBaseUrl() {
    if (typeof AVNAV_BASE_URL !== "string" || !AVNAV_BASE_URL) {
      throw new Error("AVNAV_BASE_URL is missing - AvNav must provide this global for plugins.");
    }
    return AVNAV_BASE_URL.replace(/\/+$/, "") + "/";
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) {
      return Promise.resolve();
    }

    return new Promise(function (res, rej) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = src;
      s.onload = function () {
        res();
      };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function makeScriptId(path) {
    return "dyni-internal-" + path.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  }

  const BASE = getBaseUrl();
  const ns = window.DyniPlugin = window.DyniPlugin || {};
  ns.baseUrl = BASE;
  ns.avnavApi = hostApi;
  ns.config = ns.config || {};
  ns.runtime = ns.runtime || {};
  ns.runtime.loadScriptOnce = loadScriptOnce;

  const bootstrapManifestPath = "config/bootstrap-manifest.js";

  function loadBootstrapManifest() {
    return loadScriptOnce(makeScriptId(bootstrapManifestPath), BASE + bootstrapManifestPath)
      .catch(function (err) {
        console.error("dyninstruments: failed to load bootstrap manifest at config/bootstrap-manifest.js");
        throw err;
      })
      .then(function () {
        const manifest = ns.config && ns.config.bootstrapManifest;

        if (!Array.isArray(manifest)) {
          throw new Error("dyninstruments: bootstrap manifest missing or invalid");
        }

        return manifest.reduce(function (chain, path) {
          return chain.then(function () {
            return loadScriptOnce(makeScriptId(path), BASE + path);
          });
        }, Promise.resolve());
      });
  }

  loadBootstrapManifest()
    .then(function () {
      return window.DyniPlugin.runtime.runInit();
    })
    // dyni-lint-disable-next-line catch-fallback-without-suppression -- Top-level bootstrap should log startup failures without turning them into unhandled browser promise rejections.
    .catch(function (e) {
      console.error("dyninstruments bootstrap failed:", e);
    });
}());
