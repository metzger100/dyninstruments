/**
 * Module: DyniPlugin Component Loader - Dynamic JS/CSS loading and scoped component instantiation
 * Documentation: documentation/architecture/component-system.md
 * Depends: window.DyniComponents, runtime/asset-preloader.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const createAssetPreloader = runtime.createAssetPreloader;
  const runtimeLoadScriptOnce = runtime.loadScriptOnce;
  const runtimeLoadCssOnce = runtime.loadCssOnce;

  if (typeof createAssetPreloader !== "function") {
    throw new Error("dyninstruments: runtime.createAssetPreloader missing before runtime/component-loader.js load");
  }
  if (typeof runtimeLoadScriptOnce !== "function") {
    throw new Error("dyninstruments: runtime.loadScriptOnce missing before runtime/component-loader.js load");
  }
  if (typeof runtimeLoadCssOnce !== "function") {
    throw new Error("dyninstruments: runtime.loadCssOnce missing before runtime/component-loader.js load");
  }

  const assetPreloader = createAssetPreloader(ns.baseUrl);

  runtime.assetUrl = function (relativePath) {
    return ns.baseUrl + relativePath;
  };
  runtime.getAsset = assetPreloader.getAsset;

  function ensureComponent(registry, id, methodName) {
    const componentDef = registry[id];
    if (!componentDef) {
      throw new Error(methodName + ": unknown component '" + id + "'");
    }
    return componentDef;
  }

  function ensureNoDependencyCycle(registry, id, methodName) {
    const visiting = Object.create(null);
    const visited = Object.create(null);

    function walk(nodeId, path) {
      if (visiting[nodeId]) {
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = cycleStart >= 0 ? path.slice(cycleStart).concat(nodeId) : path.concat(nodeId);
        throw new Error(methodName + ": dependency cycle detected (" + cyclePath.join(" -> ") + ")");
      }
      if (visited[nodeId]) {
        return;
      }
      visiting[nodeId] = true;
      const componentDef = ensureComponent(registry, nodeId, methodName);
      const deps = componentDef.deps || [];
      for (let i = 0; i < deps.length; i += 1) {
        walk(deps[i], path.concat(nodeId));
      }
      visiting[nodeId] = false;
      visited[nodeId] = true;
    }

    walk(id, []);
  }

  function buildComponentContext(runtimeRef, def, dependencyInstancesById, declaredDepsByOwner, ownerId) {
    const themeTokens = Object.freeze({
      resolveForRoot: function (rootEl) {
        return runtimeRef.theme.tokens.resolveForRoot(rootEl);
      }
    });

    return {
      components: {
        require: function (dependencyId) {
          if (!declaredDepsByOwner[dependencyId]) {
            throw new Error(
              "componentContext.components.require: '" + ownerId + "' requested undeclared dependency '" + dependencyId + "'"
            );
          }
          return dependencyInstancesById[dependencyId];
        }
      },
      theme: {
        tokens: themeTokens
      },
      perf: runtimeRef.perf,
      format: runtimeRef.format,
      canvas: runtimeRef.canvas,
      dom: runtimeRef.dom,
      // Pass the runtime.hostActions function reference through unchanged so components can snapshot on demand.
      hostActions: runtimeRef.hostActions
    };
  }

  function createComponentLoader(components) {
    const registry = components;
    const loadCache = new Map();
    const loadedComponents = Object.create(null);

    function validateComponentApi(componentId, componentDef, mod) {
      const apiShape = componentDef.apiShape || "factory";
      if (apiShape === "factory") {
        if (!mod || typeof mod.create !== "function") {
          throw new Error("Component not found or invalid: " + componentDef.globalKey);
        }
        return mod;
      }
      if (apiShape === "module") {
        if (!mod || typeof mod !== "object") {
          throw new Error("Component not found or invalid: " + componentDef.globalKey);
        }
        return mod;
      }
      throw new Error("Unsupported apiShape '" + apiShape + "' for component: " + componentId);
    }

    function loadComponent(id) {
      ensureNoDependencyCycle(registry, id, "loadComponent");

      if (loadCache.has(id)) {
        return loadCache.get(id);
      }

      const componentDef = registry[id];
      if (!componentDef) {
        return Promise.reject(new Error("Unknown component: " + id));
      }

      const deps = componentDef.deps || [];
      const promise = Promise.all(deps.map(loadComponent))
        .then(function () {
          return Promise.all([
            runtimeLoadCssOnce("dyni-css-" + id, componentDef.css),
            runtimeLoadScriptOnce("dyni-js-" + id, componentDef.js)
          ]);
        })
        .then(function () {
          const assetDecls = componentDef.assets || [];
          if (!assetDecls.length) {
            return null;
          }
          return assetPreloader.preloadAssets(assetDecls);
        })
        .then(function () {
          const mod = root.DyniComponents[componentDef.globalKey];
          const validated = validateComponentApi(id, componentDef, mod);
          loadedComponents[id] = validated;
          return validated;
        })
        .catch(function (error) {
          loadCache.delete(id);
          delete loadedComponents[id];
          throw error;
        });

      loadCache.set(id, promise);
      return promise;
    }

    function areComponentsLoaded(ids) {
      if (!Array.isArray(ids)) {
        return false;
      }
      for (let i = 0; i < ids.length; i += 1) {
        if (!loadedComponents[ids[i]]) {
          return false;
        }
      }
      return true;
    }

    function uniqueComponents(list) {
      const result = new Set();

      function addWithDeps(id) {
        if (!registry[id] || result.has(id)) {
          return;
        }
        result.add(id);
        const deps = registry[id].deps || [];
        for (let i = 0; i < deps.length; i += 1) {
          addWithDeps(deps[i]);
        }
      }

      for (let i = 0; i < list.length; i += 1) {
        addWithDeps(list[i].widget);
      }

      return Array.from(result);
    }

    function assertLoadedClosure(id, visited) {
      const componentDef = ensureComponent(registry, id, "createInstance");
      if (!loadedComponents[id]) {
        throw new Error("createInstance: component '" + id + "' is not loaded; call loadComponent('" + id + "') first");
      }
      if (visited[id]) {
        return;
      }
      visited[id] = true;
      const deps = componentDef.deps || [];
      for (let i = 0; i < deps.length; i += 1) {
        assertLoadedClosure(deps[i], visited);
      }
    }

    function createInstance(id, def) {
      ensureNoDependencyCycle(registry, id, "createInstance");
      assertLoadedClosure(id, Object.create(null));

      const building = Object.create(null);
      const built = Object.create(null);

      function instantiate(componentId, path) {
        if (Object.prototype.hasOwnProperty.call(built, componentId)) {
          return built[componentId];
        }
        if (building[componentId]) {
          const cycleStart = path.indexOf(componentId);
          const cyclePath = cycleStart >= 0 ? path.slice(cycleStart).concat(componentId) : path.concat(componentId);
          throw new Error("createInstance: dependency cycle detected (" + cyclePath.join(" -> ") + ")");
        }

        const componentDef = ensureComponent(registry, componentId, "createInstance");
        const moduleApi = loadedComponents[componentId];
        if (!moduleApi) {
          throw new Error("createInstance: component '" + componentId + "' is not loaded; call loadComponent('" + componentId + "') first");
        }

        building[componentId] = true;
        const deps = componentDef.deps || [];
        const dependencyInstancesById = Object.create(null);
        const declaredDepsByOwner = Object.create(null);

        for (let i = 0; i < deps.length; i += 1) {
          const depId = deps[i];
          declaredDepsByOwner[depId] = true;
          dependencyInstancesById[depId] = instantiate(depId, path.concat(componentId));
        }

        const apiShape = componentDef.apiShape || "factory";
        let instance;
        if (apiShape === "module") {
          instance = moduleApi;
        } else {
          const componentContext = buildComponentContext(runtime, def, dependencyInstancesById, declaredDepsByOwner, componentId);
          instance = moduleApi.create(def, componentContext);
        }

        built[componentId] = instance;
        building[componentId] = false;
        return instance;
      }

      return instantiate(id, []);
    }

    return {
      loadComponent: loadComponent,
      uniqueComponents: uniqueComponents,
      areComponentsLoaded: areComponentsLoaded,
      createInstance: createInstance
    };
  }

  runtime.createComponentLoader = createComponentLoader;
}(this));
