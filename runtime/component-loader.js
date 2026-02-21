/**
 * Module: DyniPlugin Component Loader - Dynamic JS/CSS loading with dependency resolution
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniComponents
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;

  function loadCssOnce(id, href) {
    if (!href) {
      return Promise.resolve();
    }
    if (document.getElementById(id)) {
      return Promise.resolve();
    }

    return new Promise(function (res, rej) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = href;
      l.onload = function () {
        res();
      };
      l.onerror = rej;
      document.head.appendChild(l);
    });
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

  function createComponentLoader(components) {
    // Invariant: components is the fully assembled registry from config/components.js.
    const registry = components;
    const loadCache = new Map();

    function loadComponent(id) {
      if (loadCache.has(id)) {
        return loadCache.get(id);
      }

      const m = registry[id];
      if (!m) {
        const p = Promise.reject(new Error("Unknown component: " + id));
        loadCache.set(id, p);
        return p;
      }

      const deps = Array.isArray(m.deps) ? m.deps : [];
      const depLoads = Promise.all(deps.map(loadComponent));

      const p = depLoads
        .then(function () {
          return Promise.all([
            loadCssOnce("dyni-css-" + id, m.css),
            loadScriptOnce("dyni-js-" + id, m.js)
          ]);
        })
        .then(function () {
          const mod = root.DyniComponents[m.globalKey];
          if (!mod || typeof mod.create !== "function") {
            throw new Error("Component not found or invalid: " + m.globalKey);
          }
          return mod;
        });

      loadCache.set(id, p);
      return p;
    }

    function uniqueComponents(list) {
      const result = new Set();

      function addWithDeps(id) {
        if (!registry[id] || result.has(id)) {
          return;
        }
        result.add(id);
        const deps = registry[id].deps || [];
        deps.forEach(addWithDeps);
      }

      list.forEach(function (i) {
        addWithDeps(i.widget);
      });

      return Array.from(result);
    }

    return {
      loadComponent: loadComponent,
      uniqueComponents: uniqueComponents
    };
  }

  runtime.loadCssOnce = loadCssOnce;
  runtime.loadScriptOnce = loadScriptOnce;
  runtime.createComponentLoader = createComponentLoader;
}(this));
