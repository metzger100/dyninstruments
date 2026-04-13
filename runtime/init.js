/**
 * Module: DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/component-system.md
 * Depends: runtime/theme-runtime.js, runtime/helpers.js, runtime/component-loader.js, runtime/widget-registrar.js, config/widget-definitions.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const state = ns.state;
  const hasOwn = Object.prototype.hasOwnProperty;

  function createGetComponent(components) {
    return function getComponent(id) {
      const c = components[id];
      return root.DyniComponents[c.globalKey];
    };
  }

  function readThemePresetCssVarFromElement(el) {
    if (!el || typeof root.getComputedStyle !== "function") {
      return null;
    }
    const style = root.getComputedStyle(el);
    if (!style || typeof style.getPropertyValue !== "function") {
      return null;
    }
    // dyni-lint-disable-next-line css-js-default-duplication -- Theme preset selection is intentionally read from the documented CSS boundary.
    const raw = style.getPropertyValue("--dyni-theme-preset");
    const value = (typeof raw === "string") ? raw.trim() : "";
    return value || null;
  }

  function normalizePresetName(themeModel, presetName) {
    if (!themeModel || typeof themeModel.normalizePresetName !== "function") {
      return "default";
    }
    return themeModel.normalizePresetName(presetName);
  }

  function resolveStartupThemePresetName(themeModel) {
    const doc = root.document;
    if (!doc) {
      return "default";
    }
    const cssPreset = readThemePresetCssVarFromElement(doc.documentElement);
    return normalizePresetName(themeModel, cssPreset);
  }

  function requireThemeRuntimeBoundary() {
    if (!runtime._theme || typeof runtime._theme.configure !== "function" || typeof runtime._theme.applyToRoot !== "function") {
      throw new Error("dyninstruments: runtime._theme boundary is required");
    }
    return runtime._theme;
  }

  function collectShadowCssUrls(components, componentIds) {
    if (!Array.isArray(componentIds) || !componentIds.length) {
      return [];
    }

    const seen = Object.create(null);
    const urls = [];
    for (let i = 0; i < componentIds.length; i += 1) {
      const componentId = componentIds[i];
      const componentDef = components[componentId];
      if (!componentDef || !Array.isArray(componentDef.shadowCss)) {
        continue;
      }
      for (let j = 0; j < componentDef.shadowCss.length; j += 1) {
        const url = componentDef.shadowCss[j];
        if (typeof url !== "string" || !url || seen[url]) {
          continue;
        }
        seen[url] = true;
        urls.push(url);
      }
    }
    return urls;
  }

  function runInit() {
    if (state.initStarted) {
      return state.initPromise;
    }

    if (!root.avnav || !root.avnav.api) {
      console && console.error && console.error("dyninstruments: avnav.api missing");
      return Promise.resolve();
    }

    state.hostActionBridge = runtime.createTemporaryHostActionBridge();

    // Invariants: namespace/config/runtime are bootstrapped in fixed order by plugin.js.
    const config = ns.config;
    const components = config.components;
    const widgetDefinitions = config.widgetDefinitions;
    const themeRuntime = requireThemeRuntimeBoundary();

    state.initStarted = true;

    const Helpers = runtime.createHelpers(createGetComponent(components));
    const loader = runtime.createComponentLoader(components);
    const needed = loader.uniqueComponents(widgetDefinitions).slice();
    if (!needed.includes("ThemeModel")) needed.push("ThemeModel");
    if (!needed.includes("ThemeResolver")) needed.push("ThemeResolver");
    const shadowCssUrls = collectShadowCssUrls(components, needed);

    state.initPromise = Promise.all([
      Promise.all(needed.map(loader.loadComponent)),
      themeRuntime.preloadShadowCssUrls(shadowCssUrls)
    ])
      .then(function (startupResults) {
        const componentsLoaded = startupResults[0];
        const byId = {};
        componentsLoaded.forEach(function (component) {
          byId[component.id] = component;
        });

        const themeModel = byId.ThemeModel ||
          (hasOwn.call(components, "ThemeModel")
            ? Helpers.getModule("ThemeModel")
            : null);
        const themeResolver = byId.ThemeResolver ||
          (hasOwn.call(components, "ThemeResolver")
            ? Helpers.getModule("ThemeResolver")
            : null);

        themeRuntime.configure({
          ThemeModel: themeModel,
          ThemeResolver: themeResolver,
          activePresetName: "default"
        });

        widgetDefinitions.forEach(function (widgetDef) {
          const component = byId[widgetDef.widget];
          runtime.registerWidget(component, widgetDef, Helpers);
        });

        root.avnav.api.log("dyninstruments component init ok (clustered): " + widgetDefinitions.length + " widgets");
      })
      .catch(function (e) {
        state.initStarted = false;
        state.hostActionBridge.destroy();
        state.hostActionBridge = null;
        console.error("dyninstruments init failed:", e);
        throw e;
      });

    return state.initPromise;
  }

  runtime.runInit = runInit;
}(this));
