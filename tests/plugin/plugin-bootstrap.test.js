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
    const loadedScriptSrc = dom.appendedScripts.map((item) => item.src);
    const perfHelperIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/PerfSpanHelper.js");
    const registrySharedFoundationIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-foundation.js");
    const registrySharedEnginesIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-engines.js");
    const registryWidgetsIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-widgets.js");
    const registryClusterIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-cluster.js");
    const componentsConfigIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components.js");
    const hostCommitIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/HostCommitController.js");
    const surfaceSessionIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/SurfaceSessionController.js");
    const initIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/init.js");

    expect(perfHelperIndex).toBeGreaterThan(-1);
    expect(perfHelperIndex).toBeLessThan(registrySharedFoundationIndex);
    expect(registrySharedFoundationIndex).toBeGreaterThan(-1);
    expect(registrySharedEnginesIndex).toBeGreaterThan(-1);
    expect(registryWidgetsIndex).toBeGreaterThan(-1);
    expect(registryClusterIndex).toBeGreaterThan(-1);
    expect(componentsConfigIndex).toBeGreaterThan(-1);
    expect(registrySharedFoundationIndex).toBeLessThan(registrySharedEnginesIndex);
    expect(registrySharedEnginesIndex).toBeLessThan(registryWidgetsIndex);
    expect(registryWidgetsIndex).toBeLessThan(registryClusterIndex);
    expect(registryClusterIndex).toBeLessThan(componentsConfigIndex);
    expect(componentsConfigIndex).toBeLessThan(hostCommitIndex);
    expect(hostCommitIndex).toBeGreaterThan(-1);
    expect(surfaceSessionIndex).toBeGreaterThan(-1);
    expect(hostCommitIndex).toBeLessThan(initIndex);
    expect(surfaceSessionIndex).toBeLessThan(initIndex);
    expect(dom.appendedScripts[dom.appendedScripts.length - 1].src)
      .toBe("http://host/plugins/dyninstruments/runtime/init.js");
    expect(typeof context.window.DyniPlugin.runtime.loadScriptOnce).toBe("function");
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
