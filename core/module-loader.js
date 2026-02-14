/**
 * Module: DyniPlugin Module Loader - Dynamic JS/CSS loading with dependency resolution
 * Documentation: documentation/architecture/module-system.md
 * Depends: window.DyniModules
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const core = ns.core;

  function loadCssOnce(id, href) {
    if (!href) return Promise.resolve();
    if (document.getElementById(id)) return Promise.resolve();

    return new Promise(function (res, rej) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = href;
      l.onload = function () { res(); };
      l.onerror = rej;
      document.head.appendChild(l);
    });
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

  function createModuleLoader(modules) {
    // Invariant: modules is the fully assembled registry from config/modules.js.
    const registry = modules;
    const loadCache = new Map();

    function loadModule(id) {
      if (loadCache.has(id)) return loadCache.get(id);

      const m = registry[id];
      if (!m) {
        const p = Promise.reject(new Error("Unknown module: " + id));
        loadCache.set(id, p);
        return p;
      }

      const deps = Array.isArray(m.deps) ? m.deps : [];
      const depLoads = Promise.all(deps.map(loadModule));

      const p = depLoads
        .then(function () {
          return Promise.all([
            loadCssOnce("dyni-css-" + id, m.css),
            loadScriptOnce("dyni-js-" + id, m.js)
          ]);
        })
        .then(function () {
          const mod = root.DyniModules[m.globalKey];
          if (!mod || typeof mod.create !== "function") {
            throw new Error("Module not found or invalid: " + m.globalKey);
          }
          return mod;
        });

      loadCache.set(id, p);
      return p;
    }

    function uniqueModules(list) {
      const result = new Set();

      function addWithDeps(id) {
        if (!registry[id] || result.has(id)) return;
        result.add(id);
        const deps = registry[id].deps || [];
        deps.forEach(addWithDeps);
      }

      list.forEach(function (i) {
        addWithDeps(i.module);
      });

      return Array.from(result);
    }

    return {
      loadModule: loadModule,
      uniqueModules: uniqueModules
    };
  }

  core.loadCssOnce = loadCssOnce;
  core.loadScriptOnce = loadScriptOnce;
  core.createModuleLoader = createModuleLoader;
}(this));
