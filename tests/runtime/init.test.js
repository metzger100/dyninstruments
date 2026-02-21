const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/init.js", function () {
  it("loads needed components and registers widgets", async function () {
    const registerWidget = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn((id) => Promise.resolve({ id, create: () => ({}) }));

    const context = createScriptContext({
      DyniComponents: {
        DyniA: { id: "A", create() {} },
        DyniThemePresets: { id: "ThemePresets", create() {} }
      },
      avnav: {
        api: {
          registerWidget,
          log: vi.fn()
        }
      },
      DyniPlugin: {
        runtime: {
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
            ThemePresets: { globalKey: "DyniThemePresets" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);

    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(uniqueComponents).toHaveBeenCalledWith([{ widget: "A", def: { name: "dyni_test" } }]);
    expect(loadComponent.mock.calls.map((call) => call[0]).sort()).toEqual(["A", "ThemePresets"]);
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledTimes(1);
    expect(context.avnav.api.log).toHaveBeenCalled();
  });

  it("applies runtime theme preset to discovered containers and exposes reapply helper", async function () {
    const applyPreset = vi.fn();
    const registerWidget = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn((id) => {
      if (id === "ThemePresets") {
        return Promise.resolve({
          id: "ThemePresets",
          create: () => ({ presets: { default: {}, slim: {}, bold: {} }, apply: applyPreset, remove: vi.fn() })
        });
      }
      return Promise.resolve({ id: "A", create: () => ({}) });
    });

    const rootEl = {
      classList: {
        contains(name) {
          return name === "dyniplugin";
        }
      },
      hasAttribute() {
        return false;
      },
      style: {
        setProperty() {},
        removeProperty() {}
      }
    };

    const canvas = {
      closest() {
        return rootEl;
      },
      parentElement: rootEl
    };

    const context = createScriptContext({
      document: {
        querySelectorAll: vi.fn(() => [canvas])
      },
      avnav: {
        api: {
          registerWidget,
          log: vi.fn()
        }
      },
      DyniPlugin: {
        theme: "slim",
        runtime: {
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
            ThemePresets: { globalKey: "DyniThemePresets" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);

    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(applyPreset).toHaveBeenCalledWith(rootEl, "slim");
    expect(typeof context.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets).toBe("function");
    context.DyniPlugin.runtime.applyThemePresetToRegisteredWidgets("bold");
    expect(applyPreset).toHaveBeenLastCalledWith(rootEl, "bold");
  });

  it("resets init state and logs when component loading fails", async function () {
    const err = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn(() => Promise.reject(new Error("load failed")));
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
          createHelpers: vi.fn(() => ({ helper: true })),
          createComponentLoader: vi.fn(() => ({ uniqueComponents, loadComponent })),
          registerWidget: vi.fn()
        },
        state: {
          themePresetApi: { apply: vi.fn(), remove: vi.fn() }
        },
        config: {
          shared: {},
          clusters: [],
          components: {
            A: { globalKey: "DyniA" },
            ThemePresets: { globalKey: "DyniThemePresets" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);
    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(context.DyniPlugin.state.initStarted).toBe(false);
    expect(context.DyniPlugin.state.themePresetApi).toBeNull();
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
