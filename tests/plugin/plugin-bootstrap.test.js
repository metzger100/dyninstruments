const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");

/** @param {string} relativePath @returns {any} */
function requireModule(relativePath) {
  return require(relativePath);
}
const bootstrapCore = requireModule("../../runtime/plugin-bootstrap-core.js");

function loadBootstrapManifest() {
  const context = createScriptContext({
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });
  runIifeScript("runtime/namespace.js", context);
  runIifeScript("config/bootstrap-manifest.js", context);
  return context.DyniPlugin.config.bootstrapManifest.slice();
}

describe("plugin.js bootstrap", function () {
  const BOOTSTRAP_MANIFEST = loadBootstrapManifest();

  function createHostApi() {
    return {
      registerWidget: vi.fn(),
      log: vi.fn()
    };
  }

  it("loads bootstrap-manifest first, then listed scripts in order, then calls runtime.runInit", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-legacy-bootstrap-bundle-js"]
    });
    const runInit = vi.fn(() => Promise.resolve());

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments///",
      avnav: { api: createHostApi() },
      window: {
        avnav: { api: createHostApi() },
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: {
          config: { bootstrapManifest: BOOTSTRAP_MANIFEST },
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    const loadedScriptSrc = dom.appendedScripts.map((/** @type {any} */ item) => item.src);
    const expected = [
      "http://host/plugins/dyninstruments/bootstrap-bundle.js",
      "http://host/plugins/dyninstruments/config/bootstrap-manifest.js"
    ].concat(BOOTSTRAP_MANIFEST.map((/** @type {any} */ rel) => "http://host/plugins/dyninstruments/" + rel));

    expect(loadedScriptSrc).toEqual(expected);
    expect(typeof context.window.DyniPlugin.runtime.loadScriptOnce).toBe("function");
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("captures wrapper-local AvNav API for runtime bootstrap scripts", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-legacy-bootstrap-bundle-js"]
    });
    const runInit = vi.fn(() => Promise.resolve());
    const hostApi = createHostApi();

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: hostApi },
      window: {
        avnav: {},
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: {
          config: { bootstrapManifest: BOOTSTRAP_MANIFEST },
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    expect(context.window.DyniPlugin.avnavApi).toBe(hostApi);
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("loads bootstrap-bundle.js first and skips manifest walk when bundle succeeds", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: createHostApi() },
      window: {
        avnav: { api: createHostApi() },
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: {
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    expect(dom.appendedScripts.map((/** @type {any} */ item) => item.src)).toEqual([
      "http://host/plugins/dyninstruments/bootstrap-bundle.js"
    ]);
    expect(
      dom.appendedScripts.some((/** @type {any} */ item) => item.src.includes("config/bootstrap-manifest.js"))
    ).toBe(false);
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("falls back to manifest loading when bootstrap-bundle.js fails", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-legacy-bootstrap-bundle-js"]
    });
    const runInit = vi.fn(() => Promise.resolve());

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: createHostApi() },
      window: {
        avnav: { api: createHostApi() },
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: {
          config: { bootstrapManifest: BOOTSTRAP_MANIFEST },
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    expect(dom.appendedScripts.map((/** @type {any} */ item) => item.src)).toEqual(
      [
        "http://host/plugins/dyninstruments/bootstrap-bundle.js",
        "http://host/plugins/dyninstruments/config/bootstrap-manifest.js"
      ].concat(BOOTSTRAP_MANIFEST.map((/** @type {any} */ rel) => "http://host/plugins/dyninstruments/" + rel))
    );
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("fails fast when AVNAV_BASE_URL is missing", function () {
    const dom = createDomHarness();
    const context = createScriptContext({
      document: dom.document,
      avnav: { api: createHostApi() },
      window: { avnav: { api: createHostApi() } }
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
      window: { avnav: {} },
      avnav: undefined
    });

    runIifeScript("plugin.js", context);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts.length).toBe(0);
  });

  it("logs a clear error when bootstrap manifest cannot be loaded", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-legacy-bootstrap-bundle-js", "dyni-internal-legacy-config-bootstrap-manifest-js"]
    });
    const err = vi.fn();

    const context = createScriptContext({
      document: dom.document,
      console: { error: err },
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: createHostApi() },
      window: {
        avnav: { api: createHostApi() },
        DyniPluginBootstrapCore: bootstrapCore
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(60);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts).toHaveLength(2);
  });

  it("loads runtime/plugin-bootstrap-core.js when the shared core is not preloaded", async function () {
    const runInit = vi.fn(() => Promise.resolve());
    /** @type {any} */
    let context;
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-legacy-bootstrap-bundle-js"],
      onScriptAppended(node) {
        if (node.src === "http://host/plugins/dyninstruments/runtime/plugin-bootstrap-core.js") {
          context.window.DyniPluginBootstrapCore = bootstrapCore;
        }
      }
    });

    context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: createHostApi() },
      window: {
        avnav: { api: createHostApi() },
        DyniPlugin: {
          config: { bootstrapManifest: BOOTSTRAP_MANIFEST },
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    expect(dom.appendedScripts.map((/** @type {any} */ item) => item.src)).toEqual(
      [
        "http://host/plugins/dyninstruments/runtime/plugin-bootstrap-core.js",
        "http://host/plugins/dyninstruments/bootstrap-bundle.js",
        "http://host/plugins/dyninstruments/config/bootstrap-manifest.js"
      ].concat(BOOTSTRAP_MANIFEST.map((/** @type {any} */ rel) => "http://host/plugins/dyninstruments/" + rel))
    );
    expect(runInit).toHaveBeenCalledOnce();
  });
});

describe("plugin-bootstrap-core resolveGlobalRoot", function () {
  it("falls back to globalThis when no window global is present", function () {
    expect(bootstrapCore.resolveGlobalRoot()).toBe(globalThis);
  });
});
