const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { flushPromises } = require("../helpers/async");

describe("runtime/init.js", function () {
  it("loads needed components and registers widgets", async function () {
    const registerWidget = vi.fn();
    const uniqueComponents = vi.fn(() => ["A"]);
    const loadComponent = vi.fn(() => Promise.resolve({ id: "A", create: () => ({}) }));

    const context = createScriptContext({
      DyniComponents: {
        DyniA: { id: "A", create() {} }
      },
      avnav: {
        api: {
          registerWidget,
          log: vi.fn()
        }
      },
      DyniPlugin: {
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
            A: { globalKey: "DyniA" }
          },
          widgetDefinitions: [{ widget: "A", def: { name: "dyni_test" } }]
        }
      }
    });

    runIifeScript("runtime/init.js", context);

    await context.DyniPlugin.state.initPromise;
    await flushPromises();

    expect(uniqueComponents).toHaveBeenCalledWith([{ widget: "A", def: { name: "dyni_test" } }]);
    expect(loadComponent).toHaveBeenCalled();
    expect(loadComponent.mock.calls[0][0]).toBe("A");
    expect(context.DyniPlugin.runtime.registerWidget).toHaveBeenCalledTimes(1);
    expect(context.avnav.api.log).toHaveBeenCalled();
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
