const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/init.js", function () {
  function createBridgeRuntimeMock() {
    const hostActions = { getCapabilities: vi.fn(), routePoints: {}, routeEditor: {}, ais: {} };
    const bridge = {
      getHostActions: vi.fn(() => hostActions),
      destroy: vi.fn()
    };
    return {
      hostActions,
      bridge,
      createTemporaryHostActionBridge: vi.fn(() => bridge)
    };
  }

  function createThemeModel(overrides) {
    const opts = overrides || {};
    return {
      id: "ThemeModel",
      normalizePresetName: opts.normalizePresetName || function (name) {
        const normalized = typeof name === "string" ? name.trim().toLowerCase() : "";
        return normalized === "slim" || normalized === "bold" || normalized === "highcontrast"
          ? normalized
          : "default";
      }
    };
  }

  function createThemeResolver() {
    return {
      id: "ThemeResolver",
      configure: vi.fn(),
      resolveForRoot: vi.fn(() => ({}))
    };
  }

  it("loads needed components and registers widgets", async function () {
    const registerWidget = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const resolver = createThemeResolver();
    const loadComponent = vi.fn((id) => Promise.resolve(
      id === "ThemeModel" ? createThemeModel()
        : (id === "ThemeResolver" ? resolver : { id, create: () => ({}) }
        )));
    const { bridge, createTemporaryHostActionBridge } = createBridgeRuntimeMock();

    const context = createScriptContext({
      DyniComponents: {
        DyniA: { id: "A", create() {} },
        DyniThemeModel: createThemeModel(),
        DyniThemeResolver: resolver
      },
      avnav: {
        api: {
          registerWidget,
          log: vi.fn()
        }
      },
      DyniPlugin: {
        runtime: {
          createTemporaryHostActionBridge,
          createHelpers: vi.fn((getComponent) => {
            getComponent("A");
            return { helper: true };
          }),
          createComponentLoader: vi.fn(() => ({ uniqueComponents, loadComponent })),
          registerWidget: vi.fn()
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { globalKey: "DyniA" },
            ThemeModel: { globalKey: "DyniThemeModel" },
            ThemeResolver: { globalKey: "DyniThemeResolver" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);

    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(uniqueComponents).toHaveBeenCalledWith([{ widget: "A", def: { name: "dyni_test" } }]);
    expect(loadComponent.mock.calls.map((call) => call[0]).sort()).toEqual(["A", "ThemeModel", "ThemeResolver"]);
    expect(resolver.configure).toHaveBeenCalledTimes(1);
    const configureArgs = resolver.configure.mock.calls[0][0];
    expect(configureArgs.ThemeModel.id).toBe("ThemeModel");
    expect(typeof configureArgs.getNightModeState).toBe("function");
    expect(typeof configureArgs.getActivePresetName).toBe("function");
    expect(configureArgs.getActivePresetName()).toBe("default");
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledTimes(1);
    expect(context.DyniPlugin.state.hostActionBridge).toBe(bridge);
    expect(createTemporaryHostActionBridge.mock.invocationCallOrder[0]).toBeLessThan(
      context.DyniPlugin.runtime.registerWidget.mock.invocationCallOrder[0]
    );
    expect(context.avnav.api.log).toHaveBeenCalled();
  });

  it("reads startup preset once from documentElement and does not expose legacy preset mutators", async function () {
    const uniqueComponents = vi.fn(() => ["A"]);
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const resolver = createThemeResolver();
    const loadComponent = vi.fn((id) => Promise.resolve(
      id === "ThemeModel" ? createThemeModel()
        : (id === "ThemeResolver" ? resolver : { id: "A", create: () => ({}) }
        )));
    const documentRoot = {};
    const cssReads = [];

    const context = createScriptContext({
      getComputedStyle(el) {
        cssReads.push(el);
        return {
          getPropertyValue(name) {
            if (el === documentRoot && name === "--dyni-theme-preset") {
              return " bold ";
            }
            return "";
          }
        };
      },
      document: {
        documentElement: documentRoot
      },
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn()
        }
      },
      DyniPlugin: {
        theme: "slim",
        runtime: {
          createTemporaryHostActionBridge,
          createHelpers: vi.fn(() => ({ helper: true })),
          createComponentLoader: vi.fn(() => ({ uniqueComponents, loadComponent })),
          registerWidget: vi.fn()
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { globalKey: "DyniA" },
            ThemeModel: { globalKey: "DyniThemeModel" },
            ThemeResolver: { globalKey: "DyniThemeResolver" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);

    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(context.DyniPlugin.state.themePresetName).toBe("bold");
    const configureArgs = resolver.configure.mock.calls[0][0];
    expect(configureArgs.getActivePresetName()).toBe("bold");
    expect(cssReads).toEqual([documentRoot]);
    expect(typeof context.DyniPlugin.runtime.applyThemePresetToContainer).toBe("undefined");
    expect(typeof context.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets).toBe("undefined");
  });

  it("falls back to default startup preset when :root value is missing or invalid", async function () {
    const uniqueComponents = vi.fn(() => ["A"]);
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const resolver = createThemeResolver();
    const loadComponent = vi.fn((id) => Promise.resolve(id === "ThemeModel" ? createThemeModel({
      normalizePresetName(name) {
        const normalized = typeof name === "string" ? name.trim().toLowerCase() : "";
        return ["default", "slim", "bold", "highcontrast"].includes(normalized) ? normalized : "default";
      }
    }) : (id === "ThemeResolver" ? resolver : { id: "A", create: () => ({}) })));
    const documentRoot = {};

    const context = createScriptContext({
      getComputedStyle(el) {
        return {
          getPropertyValue(name) {
            if (name === "--dyni-theme-preset" && el === documentRoot) {
              return "invalidPreset";
            }
            return "";
          }
        };
      },
      document: {
        documentElement: documentRoot
      },
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn()
        }
      },
      DyniPlugin: {
        runtime: {
          createTemporaryHostActionBridge,
          createHelpers: vi.fn(() => ({ helper: true })),
          createComponentLoader: vi.fn(() => ({ uniqueComponents, loadComponent })),
          registerWidget: vi.fn()
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { globalKey: "DyniA" },
            ThemeModel: { globalKey: "DyniThemeModel" },
            ThemeResolver: { globalKey: "DyniThemeResolver" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);
    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(context.DyniPlugin.state.themePresetName).toBe("default");
    const configureArgs = resolver.configure.mock.calls[0][0];
    expect(configureArgs.getActivePresetName()).toBe("default");
  });

  it("resets init state and logs when component loading fails", async function () {
    const err = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn(() => Promise.reject(new Error("load failed")));
    const { bridge, createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const context = createScriptContext({
      console: { error: err },
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn()
        }
      },
      DyniPlugin: {
        runtime: {
          createTemporaryHostActionBridge,
          createHelpers: vi.fn(() => ({ helper: true })),
          createComponentLoader: vi.fn(() => ({ uniqueComponents, loadComponent })),
          registerWidget: vi.fn()
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { globalKey: "DyniA" },
            ThemeModel: { globalKey: "DyniThemeModel" },
            ThemeResolver: { globalKey: "DyniThemeResolver" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);
    await expect(context.DyniPlugin.state.initPromise).rejects.toThrow("load failed");
    await flushPromises();

    expect(context.DyniPlugin.state.initStarted).toBe(false);
    expect(bridge.destroy).toHaveBeenCalledTimes(1);
    expect(context.DyniPlugin.state.hostActionBridge).toBeNull();
    expect(err).toHaveBeenCalled();
  });

  it("returns resolved promise and logs when avnav api is missing", async function () {
    const err = vi.fn();
    const context = createScriptContext({
      console: { error: err },
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [], components: {}, widgetDefinitions: [] }
      },
      avnav: undefined
    });

    runIifeScript("runtime/init.js", context);
    const p = context.DyniPlugin.runtime.runInit();

    await expect(p).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
  });

  it("is idempotent once init has started", async function () {
    const initPromise = Promise.resolve("done");
    const context = createScriptContext({
      avnav: { api: { registerWidget: vi.fn(), log: vi.fn() } },
      DyniPlugin: {
        runtime: {},
        state: { initStarted: true, initPromise },
        config: { shared: {}, clusters: [], components: {}, widgetDefinitions: [] }
      }
    });

    runIifeScript("runtime/init.js", context);
    const p = context.DyniPlugin.runtime.runInit();
    await expect(p).resolves.toBe("done");
  });
});
