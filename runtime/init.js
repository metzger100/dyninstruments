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

  function configureThemeResolver(themeResolver, themeModel) {
    if (!themeResolver || typeof themeResolver.configure !== "function") {
      throw new Error("dyninstruments: ThemeResolver.configure() is required");
    }
    themeResolver.configure({
      ThemeModel: themeModel,
      getNightModeState(rootEl) {
        return !!(rootEl && typeof rootEl.closest === "function" && rootEl.closest(".nightMode"));
      },
      getActivePresetName() {
        return state.themePresetName;
      }
    });
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

    state.initStarted = true;

    const Helpers = runtime.createHelpers(createGetComponent(components));
    const loader = runtime.createComponentLoader(components);
    const needed = loader.uniqueComponents(widgetDefinitions).slice();
    if (!needed.includes("ThemeModel")) needed.push("ThemeModel");
    if (!needed.includes("ThemeResolver")) needed.push("ThemeResolver");

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

        const themeModel = byId.ThemeModel ||
          (Object.prototype.hasOwnProperty.call(components, "ThemeModel")
            ? Helpers.getModule("ThemeModel")
            : null);
        state.themePresetName = resolveStartupThemePresetName(themeModel);
        const themeResolver = byId.ThemeResolver ||
          (Object.prototype.hasOwnProperty.call(components, "ThemeResolver")
            ? Helpers.getModule("ThemeResolver")
            : null);
        configureThemeResolver(themeResolver, themeModel);

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
  runInit();
}(this));
