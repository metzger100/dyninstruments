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

  function runInit() {
    if (state.initStarted) return state.initPromise;

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
    const needed = loader.uniqueComponents(widgetDefinitions);

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

        root.avnav.api.log("dyninstruments component init ok (clustered): " + widgetDefinitions.length + " widgets");
      })
      .catch(function (e) {
        state.initStarted = false;
        console.error("dyninstruments init failed:", e);
      });

    return state.initPromise;
  }

  runtime.runInit = runInit;
  runInit();
}(this));
