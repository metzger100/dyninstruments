const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/init.js", function () {
  function loadInitRuntime(context) {
    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/init.js", context);
  }

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

  function createThemeRuntimeMock() {
    return {
      configure: vi.fn(),
      applyToRoot: vi.fn(),
      preloadShadowCssUrls: vi.fn(() => Promise.resolve([]))
    };
  }

  it("loads needed components, preloads shadow CSS, and registers widgets through runtime._theme", async function () {
    const registerWidget = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const resolver = createThemeResolver();
    const themeRuntime = createThemeRuntimeMock();
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
          _theme: themeRuntime,
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

    loadInitRuntime(context);
    const initPromise = context.DyniPlugin.runtime.runInit();
    await initPromise;
    await flushPromises();

    expect(uniqueComponents).toHaveBeenCalledWith([{ widget: "A", def: { name: "dyni_test" } }]);
    expect(loadComponent.mock.calls.map((call) => call[0]).sort()).toEqual(["A", "ThemeModel", "ThemeResolver"]);
    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith([]);
    expect(themeRuntime.configure).toHaveBeenCalledTimes(1);
    const configureArgs = themeRuntime.configure.mock.calls[0][0];
    expect(configureArgs.ThemeModel.id).toBe("ThemeModel");
    expect(configureArgs.ThemeResolver.id).toBe("ThemeResolver");
    expect(configureArgs.activePresetName).toBe("default");
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledTimes(1);
    expect(context.DyniPlugin.state.hostActionBridge).toBe(bridge);
    expect(themeRuntime.configure.mock.invocationCallOrder[0]).toBeLessThan(
      context.DyniPlugin.runtime.registerWidget.mock.invocationCallOrder[0]
    );
    expect(createTemporaryHostActionBridge.mock.invocationCallOrder[0]).toBeLessThan(
      context.DyniPlugin.runtime.registerWidget.mock.invocationCallOrder[0]
    );
    expect(context.avnav.api.log).toHaveBeenCalled();
  });

  it("uses the captured DyniPlugin.avnavApi when the real global avnav.api is absent", async function () {
    const uniqueComponents = vi.fn(() => ["A"]);
    const resolver = createThemeResolver();
    const themeRuntime = createThemeRuntimeMock();
    const hostLog = vi.fn();
    const err = vi.fn();
    const loadComponent = vi.fn((id) => Promise.resolve(
      id === "ThemeModel" ? createThemeModel()
        : (id === "ThemeResolver" ? resolver : { id, create: () => ({}) }
        )));
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();

    const context = createScriptContext({
      console: { error: err },
      avnav: {},
      DyniComponents: {
        DyniA: { id: "A", create() {} },
        DyniThemeModel: createThemeModel(),
        DyniThemeResolver: resolver
      },
      DyniPlugin: {
        avnavApi: {
          log: hostLog
        },
        runtime: {
          _theme: themeRuntime,
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

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();
    await flushPromises();

    expect(hostLog).toHaveBeenCalledWith("dyninstruments component init ok (clustered): 1 widgets");
    expect(err).not.toHaveBeenCalled();
    expect(context.DyniPlugin.state.hostActionBridge).toBeTruthy();
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledTimes(1);
  });

  it("reads startup preset once from :root and preloads declared shadow CSS bundles", async function () {
    const uniqueComponents = vi.fn(() => ["ActiveRouteTextHtmlWidget"]);
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const resolver = createThemeResolver();
    const themeRuntime = createThemeRuntimeMock();
    const loadComponent = vi.fn((id) => Promise.resolve(
      id === "ThemeModel" ? createThemeModel()
        : (id === "ThemeResolver" ? resolver : { id: "ActiveRouteTextHtmlWidget", create: () => ({}) }
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
          _theme: themeRuntime,
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
            ActiveRouteTextHtmlWidget: {
              globalKey: "DyniActiveRouteTextHtmlWidget",
              shadowCss: ["/shadow-active-route.css"]
            },
            ThemeModel: { globalKey: "DyniThemeModel" },
            ThemeResolver: { globalKey: "DyniThemeResolver" }
          },
          widgetDefinitions: [{ widget: "ActiveRouteTextHtmlWidget", def: { name: "dyni_test" } }]
        }
      }
    });

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();
    await flushPromises();

    expect(themeRuntime.preloadShadowCssUrls).toHaveBeenCalledWith(["/shadow-active-route.css"]);
    const configureArgs = themeRuntime.configure.mock.calls[0][0];
    expect(configureArgs.activePresetName).toBe("bold");
    expect(cssReads).toEqual([documentRoot]);
    expect(typeof context.DyniPlugin.runtime.applyThemePresetToContainer).toBe("undefined");
    expect(typeof context.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets).toBe("undefined");
  });

  it("falls back to default startup preset when :root value is missing or invalid", async function () {
    const uniqueComponents = vi.fn(() => ["A"]);
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const resolver = createThemeResolver();
    const themeRuntime = createThemeRuntimeMock();
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
          _theme: themeRuntime,
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

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();
    await flushPromises();

    const configureArgs = themeRuntime.configure.mock.calls[0][0];
    expect(configureArgs.activePresetName).toBe("default");
  });

  it("resets init state and logs when component loading fails", async function () {
    const err = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn(() => Promise.reject(new Error("load failed")));
    const themeRuntime = createThemeRuntimeMock();
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
          _theme: themeRuntime,
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

    loadInitRuntime(context);
    await expect(context.DyniPlugin.runtime.runInit()).rejects.toThrow("load failed");
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

    loadInitRuntime(context);
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

    loadInitRuntime(context);
    const p = context.DyniPlugin.runtime.runInit();
    await expect(p).resolves.toBe("done");
  });

  it("does not self-invoke runInit when script is evaluated", function () {
    const context = createScriptContext({
      avnav: { api: { registerWidget: vi.fn(), log: vi.fn() } },
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [], components: {}, widgetDefinitions: [] }
      }
    });

    loadInitRuntime(context);
    expect(context.DyniPlugin.state.initPromise).toBeUndefined();
  });
});
