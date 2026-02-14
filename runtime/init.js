/**
 * Module: DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/module-system.md
 * Depends: core/helpers.js, core/module-loader.js, core/register-instrument.js, config/instruments.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const core = ns.core;
  const state = ns.state;

  function createGetModule(modules) {
    return function getModule(id) {
      const m = modules[id];
      return root.DyniModules[m.globalKey];
    };
  }

  function runInit() {
    if (state.initStarted) return state.initPromise;

    if (!root.avnav || !root.avnav.api) {
      console && console.error && console.error("dyninstruments: avnav.api missing");
      return Promise.resolve();
    }

    // Invariants: namespace/config/core are bootstrapped in fixed order by plugin.js.
    const config = ns.config;
    const modules = config.modules;
    const instruments = config.instruments;

    state.initStarted = true;

    const Helpers = core.createHelpers(createGetModule(modules));
    const loader = core.createModuleLoader(modules);
    const needed = loader.uniqueModules(instruments);

    state.initPromise = Promise.all(needed.map(loader.loadModule))
      .then(function (mods) {
        const byId = {};
        mods.forEach(function (m) {
          byId[m.id] = m;
        });

        instruments.forEach(function (inst) {
          const mod = byId[inst.module];
          core.registerInstrument(mod, inst, Helpers);
        });

        root.avnav.api.log("dyninstruments modular init ok (wind/compass clustered): " + instruments.length + " widgets");
      })
      .catch(function (e) {
        state.initStarted = false;
        console.error("dyninstruments init failed:", e);
      });

    return state.initPromise;
  }

  core.runInit = runInit;
  runInit();
}(this));
