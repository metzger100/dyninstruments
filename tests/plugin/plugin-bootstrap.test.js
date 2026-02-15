const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");

describe("plugin.js bootstrap", function () {
  it("loads internal scripts in order and then calls runtime.runInit", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments///",
      avnav: { api: {} },
      window: {
        avnav: { api: {} },
        DyniPlugin: {
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(50);

    expect(dom.appendedScripts.length).toBeGreaterThan(10);
    expect(dom.appendedScripts[0].src).toBe("http://host/plugins/dyninstruments/runtime/namespace.js");
    expect(dom.appendedScripts[dom.appendedScripts.length - 1].src)
      .toBe("http://host/plugins/dyninstruments/runtime/init.js");
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("fails fast when AVNAV_BASE_URL is missing", function () {
    const dom = createDomHarness();
    const context = createScriptContext({
      document: dom.document,
      avnav: { api: {} },
      window: { avnav: { api: {} } }
    });

    expect(function () {
      runIifeScript("plugin.js", context);
    }).toThrow("AVNAV_BASE_URL is missing");
  });

  it("logs and exits when avnav.api is missing", function () {
    const dom = createDomHarness();
    const err = vi.fn();

    const context = createScriptContext({
      document: dom.document,
      console: { error: err },
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      window: {},
      avnav: undefined
    });

    runIifeScript("plugin.js", context);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts.length).toBe(0);
  });

  it("logs bootstrap failure when an internal script cannot be loaded", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-runtime-namespace-js"]
    });
    const err = vi.fn();

    const context = createScriptContext({
      document: dom.document,
      console: { error: err },
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: {} },
      window: {
        avnav: { api: {} },
        DyniPlugin: {
          runtime: { runInit: vi.fn(() => Promise.resolve()) }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(20);

    expect(err).toHaveBeenCalled();
  });
});
