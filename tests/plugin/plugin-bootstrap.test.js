const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");

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

  it("loads bootstrap-manifest first, then listed scripts in order, then calls runtime.runInit", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments///",
      avnav: { api: {} },
      window: {
        avnav: { api: {} },
        DyniPlugin: {
          config: { bootstrapManifest: BOOTSTRAP_MANIFEST },
          runtime: { runInit }
        }
      }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(120);

    const loadedScriptSrc = dom.appendedScripts.map((item) => item.src);
    const expected = [
      "http://host/plugins/dyninstruments/config/bootstrap-manifest.js"
    ].concat(BOOTSTRAP_MANIFEST.map((rel) => "http://host/plugins/dyninstruments/" + rel));

    expect(loadedScriptSrc).toEqual(expected);
    expect(typeof context.window.DyniPlugin.runtime.loadScriptOnce).toBe("function");
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("captures wrapper-local AvNav API for runtime bootstrap scripts", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());
    const hostApi = { log: vi.fn(), registerWidget: vi.fn() };

    const context = createScriptContext({
      document: dom.document,
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: hostApi },
      window: {
        avnav: {},
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
      window: { avnav: {} },
      avnav: undefined
    });

    runIifeScript("plugin.js", context);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts.length).toBe(0);
  });

  it("logs a clear error when bootstrap manifest cannot be loaded", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-config-bootstrap-manifest-js"]
    });
    const err = vi.fn();

    const context = createScriptContext({
      document: dom.document,
      console: { error: err },
      AVNAV_BASE_URL: "http://host/plugins/dyninstruments/",
      avnav: { api: {} },
      window: { avnav: { api: {} } }
    });

    runIifeScript("plugin.js", context);
    await flushPromises(60);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts).toHaveLength(1);
  });
});
