/**
 * Module: DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/component-system.md
 * Depends: runtime/theme-runtime.js, runtime/component-loader.js, runtime/widget-registrar.js, config/widget-definitions.js, runtime/cluster/ClusterShellRenderer.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const state = ns.state;

  function requireThemeRuntimeBoundary() {
    if (!runtime.theme || typeof runtime.theme.configure !== "function" || typeof runtime.theme.applyToRoot !== "function") {
      throw new Error("dyninstruments: runtime.theme boundary is required");
    }
    return runtime.theme;
  }

  function requireClusterShellRenderer() {
    if (!runtime.clusterShellRenderer ||
      typeof runtime.clusterShellRenderer.normalizeRouteFrame !== "function" ||
      typeof runtime.clusterShellRenderer.renderRouteShell !== "function") {
      throw new Error("dyninstruments: runtime.clusterShellRenderer boundary is required");
    }
    return runtime.clusterShellRenderer;
  }

  function runInit() {
    if (state.initStarted) {
      return state.initPromise;
    }

    const avnavApi = runtime.getAvnavApi(root);
    if (!avnavApi) {
      console.error("dyninstruments: avnav.api missing");
      return Promise.resolve();
    }

    state.hostActionBridge = runtime.createTemporaryHostActionBridge();
    runtime.hostActions = function () {
      return state.hostActionBridge.getHostActions();
    };

    const config = ns.config;
    const components = config.components;
    const widgetDefinitions = config.widgetDefinitions;
    const themeRuntime = requireThemeRuntimeBoundary();
    requireClusterShellRenderer();

    state.initStarted = true;

    const loader = runtime.createComponentLoader(components);
    runtime.componentLoader = loader;

    const needed = loader.uniqueComponents(widgetDefinitions).slice();
    const startupPresetName = themeRuntime.resolveStartupPresetName(
      root.document && root.document.documentElement
    );

    state.initPromise = Promise.all(needed.map(loader.loadComponent))
      .then(function () {
        themeRuntime.configure({
          activePresetName: startupPresetName
        });

        widgetDefinitions.forEach(function (widgetDef) {
          const componentSpec = loader.createInstance(widgetDef.widget, widgetDef.def);
          runtime.registerWidget(componentSpec, widgetDef);
        });

        avnavApi.log("dyninstruments component init ok (clustered): " + widgetDefinitions.length + " widgets");
      })
      .catch(function (error) {
        state.initStarted = false;
        if (state.hostActionBridge) {
          state.hostActionBridge.destroy();
        }
        state.hostActionBridge = null;
        runtime.hostActions = null;
        console.error("dyninstruments init failed:", error);
        throw error;
      });

    return state.initPromise;
  }

  runtime.runInit = runInit;
}(this));
