/**
 * Module: DyniPlugin Init - Runtime initialization and widget registration
 * Documentation: documentation/architecture/module-system.md
 * Depends: core/helpers.js, core/module-loader.js, core/register-instrument.js, config/instruments.js
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin || {};
  const core = ns.core || (ns.core = {});
  const state = ns.state || (ns.state = {});

  function createGetModule(modules) {
    return function getModule(id) {
      const m = modules[id];
      if (!m) return undefined;
      const nsModules = root.DyniModules || {};
      return nsModules[m.globalKey];
    };
  }

  function runInit() {
    if (state.initStarted) return state.initPromise || Promise.resolve();

    if (!root.avnav || !root.avnav.api) {
      console && console.error && console.error("dyninstruments: avnav.api missing");
      return Promise.resolve();
    }

    const config = ns.config || {};
    const modules = config.modules || {};
    const instruments = Array.isArray(config.instruments) ? config.instruments : [];

    if (!Object.keys(modules).length) {
      throw new Error("dyninstruments: config.modules missing");
    }
    if (!instruments.length) {
      throw new Error("dyninstruments: config.instruments missing");
    }

    const createHelpers = core.createHelpers;
    const createModuleLoader = core.createModuleLoader;
    const registerInstrument = core.registerInstrument;

    if (typeof createHelpers !== "function") {
      throw new Error("dyninstruments: core.createHelpers missing");
    }
    if (typeof createModuleLoader !== "function") {
      throw new Error("dyninstruments: core.createModuleLoader missing");
    }
    if (typeof registerInstrument !== "function") {
      throw new Error("dyninstruments: core.registerInstrument missing");
    }

    state.initStarted = true;

    const Helpers = createHelpers({ getModule: createGetModule(modules) });
    const loader = createModuleLoader(modules);
    const needed = loader.uniqueModules(instruments);

    state.initPromise = Promise.all(needed.map(loader.loadModule))
      .then(function (mods) {
        const byId = {};
        mods.forEach(function (m) {
          byId[m.id] = m;
        });

        instruments.forEach(function (inst) {
          const mod = byId[inst.module];
          if (!mod) {
            const defName = inst && inst.def ? inst.def.name : "unknown";
            console.warn("dyninstruments: module not loaded", inst.module, defName);
            return;
          }
          registerInstrument(mod, inst, Helpers);
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
