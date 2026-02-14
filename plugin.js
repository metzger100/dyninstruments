/**
 * Module: plugin.js - DyniPlugin bootstrap entrypoint
 * Documentation: documentation/architecture/component-system.md
 * Depends: avnav.api, AVNAV_BASE_URL, internal DyniPlugin scripts
 */
/* global avnav */
(function () {
  "use strict";

  if (!window.avnav || !avnav.api) {
    console && console.error && console.error("dyninstruments: avnav.api missing");
    return;
  }

  function getBaseUrl() {
    if (typeof AVNAV_BASE_URL !== "string" || !AVNAV_BASE_URL) {
      throw new Error("AVNAV_BASE_URL is missing - AvNav must provide this global for plugins.");
    }
    return AVNAV_BASE_URL.replace(/\/+$/, "") + "/";
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) return Promise.resolve();

    return new Promise(function (res, rej) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = src;
      s.onload = function () { res(); };
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

  // Invariant: this load order is authoritative for all internal namespace/config/runtime setup.
  const internalScripts = [
    "runtime/namespace.js",
    "runtime/helpers.js",
    "runtime/editable-defaults.js",
    "config/components.js",
    "config/shared/editable-param-utils.js",
    "config/shared/kind-defaults.js",
    "config/shared/common-editables.js",
    "config/clusters/course-heading.js",
    "config/clusters/speed.js",
    "config/clusters/position.js",
    "config/clusters/distance.js",
    "config/clusters/environment.js",
    "config/clusters/wind.js",
    "config/clusters/large-time.js",
    "config/clusters/nav.js",
    "config/clusters/anchor.js",
    "config/clusters/vessel.js",
    "config/widget-definitions.js",
    "runtime/component-loader.js",
    "runtime/widget-registrar.js",
    "runtime/init.js"
  ];

  internalScripts
    .reduce(function (chain, path) {
      return chain.then(function () {
        return loadScriptOnce(makeScriptId(path), BASE + path);
      });
    }, Promise.resolve())
    .then(function () {
      return window.DyniPlugin.runtime.runInit();
    })
    .catch(function (e) {
      console.error("dyninstruments bootstrap failed:", e);
    });
}());
