const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/init.js", function () {
  function loadInitRuntime(context) {
    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/init.js", context);
  }

  function createBridgeRuntimeMock() {
    const hostActions = {
      getCapabilities: vi.fn(),
      routePoints: {},
      routeEditor: {},
      ais: {},
    };
    const bridge = {
      getHostActions: vi.fn(() => hostActions),
      destroy: vi.fn(),
    };
    return {
      hostActions,
      bridge,
      createTemporaryHostActionBridge: vi.fn(() => bridge),
    };
  }

  function createThemeRuntimeMock() {
    return {
      configure: vi.fn(),
      applyToRoot: vi.fn(),
      resolveStartupPresetName: vi.fn(() => "default"),
      preloadShadowCssUrls: vi.fn(() => Promise.resolve([])),
    };
  }

  function createShellRendererMock() {
    return {
      normalizeRouteFrame: vi.fn(),
      renderRouteShell: vi.fn(),
    };
  }

  it("loads required components and registers widget specs", async function () {
    const registerWidget = vi.fn();
    const loadComponent = vi.fn(() => Promise.resolve({}));
    const createInstance = vi.fn(() => ({ id: "WidgetSpec" }));
    const uniqueComponents = vi.fn(() => ["A", "B"]);
    const themeRuntime = createThemeRuntimeMock();
    const shellRenderer = createShellRendererMock();
    const { bridge, hostActions, createTemporaryHostActionBridge } =
      createBridgeRuntimeMock();

    const context = createScriptContext({
      avnav: {
        api: {
          registerWidget,
          log: vi.fn(),
        },
      },
      DyniPlugin: {
        avnavApi: {
          registerWidget,
          log: vi.fn(),
        },
        runtime: {
          theme: themeRuntime,
          createTemporaryHostActionBridge,
          clusterShellRenderer: shellRenderer,
          createComponentLoader: vi.fn(() => ({
            uniqueComponents,
            loadComponent,
            createInstance,
          })),
          registerWidget: vi.fn(),
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { shadowCss: ["/a.css", "/shared.css"] },
            B: { shadowCss: ["/b.css", "/shared.css"] },
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }],
        },
      },
    });

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();
    await flushPromises();

    expect(uniqueComponents).toHaveBeenCalledWith([
      { widget: "A", def: { name: "dyni_test" } },
    ]);
    expect(loadComponent.mock.calls.map((call) => call[0])).toEqual(["A", "B"]);
    expect(themeRuntime.preloadShadowCssUrls).not.toHaveBeenCalled();
    expect(themeRuntime.configure).toHaveBeenCalledWith({
      activePresetName: "default",
    });
    expect(context.DyniPlugin.runtime.clusterShellRenderer).toBe(shellRenderer);
    expect(createInstance).toHaveBeenCalledWith("A", { name: "dyni_test" });
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledWith(
      { id: "WidgetSpec" },
      { widget: "A", def: { name: "dyni_test" } },
    );
    expect(context.DyniPlugin.state.hostActionBridge).toBe(bridge);
    expect(typeof context.DyniPlugin.runtime.hostActions).toBe("function");
    expect(context.DyniPlugin.runtime.hostActions()).toBe(hostActions);
  });

  it("re-reads the current host action facade on every runtime.hostActions call", async function () {
    const themeRuntime = createThemeRuntimeMock();
    const shellRenderer = createShellRendererMock();
    const firstHostActions = {
      getCapabilities: vi.fn(),
      routePoints: {},
      routeEditor: {},
      ais: {},
    };
    const secondHostActions = {
      getCapabilities: vi.fn(),
      routePoints: {},
      routeEditor: {},
      ais: {},
    };
    const bridge = {
      getHostActions: vi.fn(() => firstHostActions),
      destroy: vi.fn(),
    };

    const context = createScriptContext({
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
      },
      DyniPlugin: {
        avnavApi: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
        runtime: {
          theme: themeRuntime,
          createTemporaryHostActionBridge: vi.fn(() => bridge),
          clusterShellRenderer: shellRenderer,
          createComponentLoader: vi.fn(() => ({
            uniqueComponents: () => ["A"],
            loadComponent: () => Promise.resolve({}),
            createInstance: () => ({}),
          })),
          registerWidget: vi.fn(),
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: { A: {} },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }],
        },
      },
    });

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();

    expect(context.DyniPlugin.runtime.hostActions()).toBe(firstHostActions);
    bridge.getHostActions.mockImplementation(() => secondHostActions);
    expect(context.DyniPlugin.runtime.hostActions()).toBe(secondHostActions);
  });

  it("uses captured DyniPlugin.avnavApi when global avnav.api is absent", async function () {
    const themeRuntime = createThemeRuntimeMock();
    const hostLog = vi.fn();
    const shellRenderer = createShellRendererMock();
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();

    const context = createScriptContext({
      avnav: {},
      DyniPlugin: {
        avnavApi: {
          log: hostLog,
          registerWidget: vi.fn(),
        },
        runtime: {
          theme: themeRuntime,
          createTemporaryHostActionBridge,
          clusterShellRenderer: shellRenderer,
          createComponentLoader: vi.fn(() => ({
            uniqueComponents: () => ["A"],
            loadComponent: () => Promise.resolve({}),
            createInstance: () => ({}),
          })),
          registerWidget: vi.fn(),
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: { A: {} },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }],
        },
      },
    });

    loadInitRuntime(context);
    await context.DyniPlugin.runtime.runInit();

    expect(hostLog).toHaveBeenCalledWith(
      "dyninstruments component init ok (clustered): 1 widgets",
    );
  });

  it("resets init state and bridge when component loading fails", async function () {
    const err = vi.fn();
    const themeRuntime = createThemeRuntimeMock();
    const shellRenderer = createShellRendererMock();
    const { bridge, createTemporaryHostActionBridge } =
      createBridgeRuntimeMock();
    const context = createScriptContext({
      console: { error: err },
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
      },
      DyniPlugin: {
        avnavApi: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
        runtime: {
          theme: themeRuntime,
          createTemporaryHostActionBridge,
          clusterShellRenderer: shellRenderer,
          createComponentLoader: vi.fn(() => ({
            uniqueComponents: () => ["A"],
            loadComponent: () => Promise.reject(new Error("load failed")),
            createInstance: vi.fn(),
          })),
          registerWidget: vi.fn(),
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: { A: {} },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }],
        },
      },
    });

    loadInitRuntime(context);
    await expect(context.DyniPlugin.runtime.runInit()).rejects.toThrow(
      "load failed",
    );

    expect(context.DyniPlugin.state.initStarted).toBe(false);
    expect(bridge.destroy).toHaveBeenCalledTimes(1);
    expect(context.DyniPlugin.state.hostActionBridge).toBeNull();
    expect(context.DyniPlugin.runtime.hostActions).toBeNull();
    expect(err).toHaveBeenCalled();
  });

  it("can retry registration after component loading fails", async function () {
    let shouldFail = true;
    const themeRuntime = createThemeRuntimeMock();
    const shellRenderer = createShellRendererMock();
    const { createTemporaryHostActionBridge } = createBridgeRuntimeMock();
    const registerWidget = vi.fn();
    const context = createScriptContext({
      avnav: {
        api: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
      },
      DyniPlugin: {
        avnavApi: {
          registerWidget: vi.fn(),
          log: vi.fn(),
        },
        runtime: {
          theme: themeRuntime,
          createTemporaryHostActionBridge,
          clusterShellRenderer: shellRenderer,
          createComponentLoader: vi.fn(() => ({
            uniqueComponents: () => ["A"],
            loadComponent: () => shouldFail
              ? Promise.reject(new Error("load failed"))
              : Promise.resolve({}),
            createInstance: () => ({}),
          })),
          registerWidget,
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: { A: {} },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }],
        },
      },
    });

    loadInitRuntime(context);
    await expect(context.DyniPlugin.runtime.runInit()).rejects.toThrow(
      "load failed",
    );

    shouldFail = false;
    await expect(context.DyniPlugin.runtime.runInit()).resolves.toEqual(
      expect.any(Function),
    );
    expect(registerWidget).toHaveBeenCalledOnce();
  });

  it("returns resolved promise and logs when avnav api is missing", async function () {
    const err = vi.fn();
    const context = createScriptContext({
      console: { error: err },
      DyniPlugin: {
        runtime: {
          theme: createThemeRuntimeMock(),
          clusterShellRenderer: createShellRendererMock(),
        },
        state: {},
        config: {
          shared: {},
          clusters: [],
          components: {},
          widgetDefinitions: [],
        },
      },
      avnav: undefined,
    });

    loadInitRuntime(context);
    await expect(context.DyniPlugin.runtime.runInit()).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
  });

  it("is idempotent once init has started", async function () {
    const initPromise = Promise.resolve("done");
    const context = createScriptContext({
      avnav: { api: { registerWidget: vi.fn(), log: vi.fn() } },
      DyniPlugin: {
        runtime: {
          theme: createThemeRuntimeMock(),
          clusterShellRenderer: createShellRendererMock(),
        },
        state: { initStarted: true, initPromise },
        config: {
          shared: {},
          clusters: [],
          components: {},
          widgetDefinitions: [],
        },
      },
    });

    loadInitRuntime(context);
    await expect(context.DyniPlugin.runtime.runInit()).resolves.toBe("done");
  });
});
