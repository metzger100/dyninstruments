/**
 * Module: DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/component-system.md
 * Depends: runtime/helpers.js, runtime/component-loader.js, runtime/widget-registrar.js, config/widget-definitions.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const state = ns.state;

  function createGetComponent(components) {
    return function getComponent(id) {
      const c = components[id];
      return root.DyniComponents[c.globalKey];
    };
  }

  // Stub for future AvNav/plugin settings API integration.
  function readThemePresetFromSettingsApi() {
    return null;
  }

  function resolveThemePresetName() {
    const fromSettingsApi = readThemePresetFromSettingsApi();
    if (typeof fromSettingsApi === "string" && fromSettingsApi.trim()) {
      return fromSettingsApi.trim();
    }
    if (typeof ns.theme === "string" && ns.theme.trim()) {
      return ns.theme.trim();
    }
    return "default";
  }

  function isPluginContainer(rootEl) {
    if (!rootEl) {
      return false;
    }
    if (rootEl.classList && typeof rootEl.classList.contains === "function" && rootEl.classList.contains("dyniplugin")) {
      return true;
    }
    return !!(typeof rootEl.hasAttribute === "function" && rootEl.hasAttribute("data-dyni"));
  }

  function discoverWidgetRoot(canvas) {
    if (!canvas) {
      return null;
    }
    if (typeof canvas.closest === "function") {
      const found = canvas.closest(".widget, .DirectWidget");
      if (found) {
        return found;
      }
    }
    return canvas.parentElement || null;
  }

  function listPluginContainers(doc) {
    if (!doc || typeof doc.querySelectorAll !== "function") {
      return [];
    }
    const canvases = doc.querySelectorAll("canvas.widgetData");
    const seen = new Set();
    const roots = [];

    for (let i = 0; i < canvases.length; i++) {
      const rootEl = discoverWidgetRoot(canvases[i]);
      if (!isPluginContainer(rootEl)) {
        continue;
      }
      if (seen.has(rootEl)) {
        continue;
      }
      seen.add(rootEl);
      roots.push(rootEl);
    }

    return roots;
  }

  function buildThemePresetApi(component, Helpers) {
    if (!component || typeof component.create !== "function") {
      return null;
    }
    const api = component.create({}, Helpers);
    if (!api || typeof api.apply !== "function" || typeof api.remove !== "function") {
      return null;
    }
    return api;
  }

  function invalidateThemeResolverCache(rootEl) {
    const resolverMod = state.themeResolverModule;
    if (!resolverMod) {
      return;
    }

    if (rootEl && typeof resolverMod.invalidateCanvas === "function" && typeof rootEl.querySelectorAll === "function") {
      const canvases = rootEl.querySelectorAll("canvas.widgetData");
      if (canvases && canvases.length) {
        for (let i = 0; i < canvases.length; i++) {
          resolverMod.invalidateCanvas(canvases[i]);
        }
        return;
      }
    }

    if (typeof resolverMod.invalidateAll === "function") {
      resolverMod.invalidateAll();
    }
  }

  function applyThemePresetToContainer(rootEl, presetName) {
    if (!isPluginContainer(rootEl)) {
      return;
    }
    if (!state.themePresetApi || typeof state.themePresetApi.apply !== "function") {
      return;
    }

    const selected = (typeof presetName === "string" && presetName.trim())
      ? presetName.trim()
      : (state.themePresetName || resolveThemePresetName());

    state.themePresetApi.apply(rootEl, selected);
    invalidateThemeResolverCache(rootEl);
  }

  function applyThemePresetToRegisteredWidgets(presetName) {
    const selected = (typeof presetName === "string" && presetName.trim())
      ? presetName.trim()
      : resolveThemePresetName();

    state.themePresetName = selected;
    const roots = listPluginContainers(root.document);
    roots.forEach(function (rootEl) {
      applyThemePresetToContainer(rootEl, selected);
    });
    return roots.length;
  }

  runtime.applyThemePresetToContainer = applyThemePresetToContainer;
  runtime.applyThemePresetToRegisteredWidgets = applyThemePresetToRegisteredWidgets;

  function runInit() {
    if (state.initStarted) {
      return state.initPromise;
    }

    if (!root.avnav || !root.avnav.api) {
      console && console.error && console.error("dyninstruments: avnav.api missing");
      return Promise.resolve();
    }

    // Invariants: namespace/config/runtime are bootstrapped in fixed order by plugin.js.
    const config = ns.config;
    const components = config.components;
    const widgetDefinitions = config.widgetDefinitions;

    state.initStarted = true;

    const Helpers = runtime.createHelpers(createGetComponent(components));
    const loader = runtime.createComponentLoader(components);
    const needed = loader.uniqueComponents(widgetDefinitions).slice();
    if (!needed.includes("ThemePresets")) needed.push("ThemePresets");

    state.initPromise = Promise.all(needed.map(loader.loadComponent))
      .then(function (componentsLoaded) {
        const byId = {};
        componentsLoaded.forEach(function (component) {
          byId[component.id] = component;
        });

        widgetDefinitions.forEach(function (widgetDef) {
          const component = byId[widgetDef.widget];
          runtime.registerWidget(component, widgetDef, Helpers);
        });

        state.themeResolverModule = byId.ThemeResolver ||
          ((Helpers && typeof Helpers.getModule === "function") ? Helpers.getModule("ThemeResolver") : null);
        state.themePresetApi = buildThemePresetApi(byId.ThemePresets, Helpers);
        state.themePresetName = resolveThemePresetName();
        applyThemePresetToRegisteredWidgets(state.themePresetName);

        root.avnav.api.log("dyninstruments component init ok (clustered): " + widgetDefinitions.length + " widgets");
      })
      .catch(function (e) {
        state.initStarted = false;
        state.themePresetApi = null;
        state.themeResolverModule = null;
        console.error("dyninstruments init failed:", e);
      });

    return state.initPromise;
  }

  runtime.runInit = runInit;
  runInit();
}(this));
