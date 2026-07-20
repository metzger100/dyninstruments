/**
 * @file DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/component-system.md
 */
(function (/** @type {DyniInitRoot} */ root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const state = ns.state;

  /** @returns {DyniInitThemeRuntime} */
  function requireThemeRuntimeBoundary() {
    if (
      !runtime.theme ||
      typeof runtime.theme.configure !== "function" ||
      typeof runtime.theme.applyToRoot !== "function"
    ) {
      throw new Error("dyninstruments: runtime.theme boundary is required");
    }
    return runtime.theme;
  }

  /** @returns {DyniClusterShellRendererApi} */
  function requireClusterShellRenderer() {
    if (
      !runtime.clusterShellRenderer ||
      typeof runtime.clusterShellRenderer.normalizeRouteFrame !== "function" ||
      typeof runtime.clusterShellRenderer.renderRouteShell !== "function"
    ) {
      throw new Error("dyninstruments: runtime.clusterShellRenderer boundary is required");
    }
    return runtime.clusterShellRenderer;
  }

  /** @returns {DyniInitGeneration} */
  function getStartupGeneration() {
    return (
      ns.startupGeneration || {
        id: "legacy",
        entrypoint: "legacy",
        baseUrl: ns.baseUrl || "",
        hostApi: ns.avnavApi || null
      }
    );
  }

  /** @param {string} generationId */
  function clearGenerationState(generationId) {
    if (generationId && state.initGenerationId !== generationId) {
      return;
    }
    if (state.hostActionBridge) {
      state.hostActionBridge.destroy();
    }
    state.hostActionBridge = null;
    state.initStarted = false;
    state.initPromise = null;
    state.initGenerationId = null;
    runtime.hostActions = null;
    runtime.componentLoader = null;
  }

  /** @param {string} generationId @returns {() => void} */
  function createShutdown(generationId) {
    let shutdownDone = false;
    return function shutdownDyniPlugin() {
      if (shutdownDone) {
        return;
      }
      shutdownDone = true;
      clearGenerationState(generationId);
    };
  }

  /** @returns {DyniInitAvnavApi | null} */
  function requireAvnavApi() {
    const avnavApi = runtime.getAvnavApi(root);
    if (!avnavApi) {
      console.error("dyninstruments: avnav.api missing");
      return null;
    }
    if (typeof avnavApi.registerWidget !== "function") {
      throw new Error("dyninstruments: avnav.api.registerWidget missing");
    }
    if (typeof avnavApi.log !== "function") {
      throw new Error("dyninstruments: avnav.api.log missing");
    }
    return avnavApi;
  }

  /** @returns {Promise<(() => void) | undefined>} */
  function runInit() {
    const generation = getStartupGeneration();
    if (state.initStarted && state.initGenerationId === generation.id) {
      return /** @type {Promise<(() => void) | undefined>} */ (state.initPromise);
    }

    if (state.initStarted && state.initGenerationId) {
      clearGenerationState(state.initGenerationId);
    }

    if (state.initStarted) {
      return /** @type {Promise<(() => void) | undefined>} */ (state.initPromise);
    }

    const avnavApi = requireAvnavApi();
    if (!avnavApi) {
      return Promise.resolve(undefined);
    }

    const hostActionBridge = runtime.createTemporaryHostActionBridge();
    state.hostActionBridge = hostActionBridge;
    runtime.hostActions = function () {
      return hostActionBridge.getHostActions();
    };

    const config = ns.config;
    const components = config.components;
    const widgetDefinitions = config.widgetDefinitions;
    const themeRuntime = requireThemeRuntimeBoundary();
    requireClusterShellRenderer();

    state.initStarted = true;
    state.initGenerationId = generation.id;

    const loader = runtime.createComponentLoader(components);
    runtime.componentLoader = loader;

    const needed = loader.uniqueComponents(widgetDefinitions).slice();
    const startupPresetName = themeRuntime.resolveStartupPresetName(
      root.document ? root.document.documentElement : null
    );

    state.initPromise = Promise.all(needed.map(loader.loadComponent))
      .then(function () {
        if (state.initGenerationId !== generation.id) {
          return undefined;
        }

        themeRuntime.configure({
          activePresetName: startupPresetName
        });

        widgetDefinitions.forEach(function (widgetDef) {
          const componentSpec = loader.createInstance(widgetDef.widget, widgetDef.def);
          runtime.registerWidget(componentSpec, widgetDef);
        });

        avnavApi.log("dyninstruments component init ok (clustered): " + widgetDefinitions.length + " widgets");
        return createShutdown(generation.id);
      })
      .catch(function (error) {
        clearGenerationState(generation.id);
        console.error("dyninstruments init failed:", error);
        throw error;
      });

    return state.initPromise;
  }

  runtime.runInit = runInit;
})(/** @type {DyniInitRoot} */ (/** @type {unknown} */ (this)));
