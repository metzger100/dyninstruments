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
  const FALLBACK_PRESET_NAMES = ["default", "slim", "bold", "night", "highcontrast"];

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

  function readThemePresetFromCss() {
    const doc = root.document;
    if (!doc || typeof root.getComputedStyle !== "function") {
      return null;
    }

    const roots = listPluginContainers(doc);
    for (let i = 0; i < roots.length; i++) {
      const value = readThemePresetCssVarFromElement(roots[i]);
      if (value) {
        return value;
      }
    }

    const docRootValue = readThemePresetCssVarFromElement(doc.documentElement);
    if (docRootValue) {
      return docRootValue;
    }

    return readThemePresetCssVarFromElement(doc.body);
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

  function readThemePresetCssVarFromElement(el) {
    if (!el || typeof root.getComputedStyle !== "function") {
      return null;
    }
    const style = root.getComputedStyle(el);
    if (!style || typeof style.getPropertyValue !== "function") {
      return null;
    }
    const raw = style.getPropertyValue("--dyni-theme-preset");
    const value = (typeof raw === "string") ? raw.trim() : "";
    return value || null;
  }

  function knownPresetNames() {
    const presets = state.themePresetApi && state.themePresetApi.presets;
    if (!presets || typeof presets !== "object") {
      return FALLBACK_PRESET_NAMES.slice();
    }
    const names = Object.keys(presets);
    if (!names.length) {
      return ["default"];
    }
    if (!Object.prototype.hasOwnProperty.call(presets, "default")) {
      names.push("default");
    }
    return names;
  }

  function normalizePresetName(presetName) {
    if (typeof presetName !== "string") {
      return "default";
    }
    const normalized = presetName.trim().toLowerCase();
    if (!normalized) {
      return "default";
    }
    return knownPresetNames().includes(normalized) ? normalized : "default";
  }

  function resolveThemePresetName() {
    return resolveThemePresetNameForContainer(null);
  }

  function resolveThemePresetNameForContainer(rootEl) {
    const fromSettingsApi = readThemePresetFromSettingsApi();
    if (typeof fromSettingsApi === "string" && fromSettingsApi.trim()) {
      return normalizePresetName(fromSettingsApi);
    }
    if (typeof ns.theme === "string" && ns.theme.trim()) {
      return normalizePresetName(ns.theme);
    }
    const fromRootCss = readThemePresetCssVarFromElement(rootEl);
    if (typeof fromRootCss === "string" && fromRootCss.trim()) {
      return normalizePresetName(fromRootCss);
    }
    const fromCss = readThemePresetFromCss();
    if (typeof fromCss === "string" && fromCss.trim()) {
      return normalizePresetName(fromCss);
    }
    return "default";
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
      ? normalizePresetName(presetName)
      : resolveThemePresetNameForContainer(rootEl);

    state.themePresetApi.apply(rootEl, selected);
    invalidateThemeResolverCache(rootEl);
  }

  function applyThemePresetToRegisteredWidgets(presetName) {
    const selected = (typeof presetName === "string" && presetName.trim())
      ? normalizePresetName(presetName)
      : normalizePresetName(resolveThemePresetName());

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
