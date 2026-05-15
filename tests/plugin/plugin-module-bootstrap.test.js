const path = require("node:path");
const { pathToFileURL } = require("node:url");

const bootstrapCore = require("../../runtime/plugin-bootstrap-core.js");
const { createDomHarness } = require("../helpers/mock-dom");

async function importPluginModule() {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "plugin.mjs")).href + `?v=${Date.now()}-${Math.random()}`;
  return import(moduleUrl);
}

function withBootstrapGlobals(overrides, fn) {
  const prevWindow = global.window;
  const prevDocument = global.document;
  const prevConsole = global.console;
  const prevAvnavBase = global.AVNAV_BASE_URL;

  global.window = Object.assign({
    DyniPluginBootstrapCore: bootstrapCore,
    DyniPlugin: { runtime: {} }
  }, overrides.window || {});
  global.document = overrides.document;
  global.console = overrides.console || console;
  global.AVNAV_BASE_URL = overrides.AVNAV_BASE_URL;

  return Promise.resolve()
    .then(fn)
    .finally(function () {
      global.window = prevWindow;
      global.document = prevDocument;
      global.console = prevConsole;
      global.AVNAV_BASE_URL = prevAvnavBase;
    });
}

describe("plugin.mjs bootstrap", function () {
  it("accepts AvNav API, uses api.getBaseUrl(), and reaches runtime.runInit", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());
    const api = {
      getBaseUrl: vi.fn(() => "http://host/plugins/dyninstruments-modern///")
    };

    await withBootstrapGlobals({
      document: dom.document,
      AVNAV_BASE_URL: "http://wrong/base/should/not/be/used/",
      window: {
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: { runtime: { runInit } }
      }
    }, async function () {
      const mod = await importPluginModule();
      await mod.default(api);
    });

    expect(api.getBaseUrl).toHaveBeenCalledOnce();
    expect(runInit).toHaveBeenCalledOnce();
    expect(dom.appendedScripts).toHaveLength(1);
    expect(dom.appendedScripts[0].src).toBe("http://host/plugins/dyninstruments-modern/bootstrap-bundle.js");
  });

  it("stores the provided module API at window.DyniPlugin.avnavApi", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());
    const api = {
      getBaseUrl: () => "http://host/plugins/dyninstruments-module/"
    };

    let capturedNs;
    await withBootstrapGlobals({
      document: dom.document,
      window: {
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: { runtime: { runInit } }
      }
    }, async function () {
      const mod = await importPluginModule();
      await mod.default(api);
      capturedNs = global.window.DyniPlugin;
    });

    expect(capturedNs.avnavApi).toBe(api);
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("falls back to manifest on module path when bootstrap-bundle fails", async function () {
    const baseUrl = "http://host/plugins/dyninstruments-module/";
    const scope = bootstrapCore.resolveScriptScope({ entrypoint: "module" }, baseUrl);
    const bundleId = bootstrapCore.makeScriptId("bootstrap-bundle.js", scope);

    const dom = createDomHarness({
      failScriptIds: [bundleId]
    });
    const runInit = vi.fn(() => Promise.resolve());
    const api = {
      getBaseUrl: () => baseUrl
    };

    const bootstrapManifest = ["runtime/namespace.js", "runtime/init.js"];

    await withBootstrapGlobals({
      document: dom.document,
      window: {
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: {
          config: { bootstrapManifest },
          runtime: { runInit }
        }
      }
    }, async function () {
      const mod = await importPluginModule();
      await mod.default(api);
    });

    expect(dom.appendedScripts.map((item) => item.src)).toEqual([
      "http://host/plugins/dyninstruments-module/bootstrap-bundle.js",
      "http://host/plugins/dyninstruments-module/config/bootstrap-manifest.js",
      "http://host/plugins/dyninstruments-module/runtime/namespace.js",
      "http://host/plugins/dyninstruments-module/runtime/init.js"
    ]);
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("deduplicates same-base module loads and creates distinct script IDs for timestamped base changes", async function () {
    const dom = createDomHarness();
    const runInit = vi.fn(() => Promise.resolve());

    await withBootstrapGlobals({
      document: dom.document,
      window: {
        DyniPluginBootstrapCore: bootstrapCore,
        DyniPlugin: { runtime: { runInit } }
      }
    }, async function () {
      const mod = await importPluginModule();

      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__1111111/"
      });
      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__1111111/"
      });
      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__2222222/"
      });
    });

    const bundleScripts = dom.appendedScripts.filter((item) => item.src.endsWith("/bootstrap-bundle.js"));
    expect(bundleScripts).toHaveLength(2);
    expect(bundleScripts[0].id).not.toBe(bundleScripts[1].id);
    expect(bundleScripts[0].id).toContain("dyni-internal-module-gen-1111111");
    expect(bundleScripts[1].id).toContain("dyni-internal-module-gen-2222222");
    expect(runInit).toHaveBeenCalledTimes(3);
  });

  it("reloads bootstrap-core across module base generations while deduplicating same-base core loads", async function () {
    const dom = createDomHarness({
      onScriptAppended(node) {
        if (node.src.endsWith("/runtime/plugin-bootstrap-core.js")) {
          global.window.DyniPluginBootstrapCore = bootstrapCore;
        }
      }
    });
    const runInit = vi.fn(() => Promise.resolve());

    await withBootstrapGlobals({
      document: dom.document,
      window: {
        DyniPluginBootstrapCore: undefined,
        DyniPlugin: { runtime: { runInit } }
      }
    }, async function () {
      const mod = await importPluginModule();

      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__1111111/"
      });
      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__1111111/"
      });
      await mod.default({
        getBaseUrl: () => "http://host/plugins/dyninstruments/__2222222/"
      });
    });

    const coreScripts = dom.appendedScripts.filter((item) => item.src.endsWith("/runtime/plugin-bootstrap-core.js"));
    expect(coreScripts).toHaveLength(2);
    expect(coreScripts[0].id).not.toBe(coreScripts[1].id);
    expect(coreScripts[0].src).toBe("http://host/plugins/dyninstruments/__1111111/runtime/plugin-bootstrap-core.js");
    expect(coreScripts[1].src).toBe("http://host/plugins/dyninstruments/__2222222/runtime/plugin-bootstrap-core.js");
    expect(runInit).toHaveBeenCalledTimes(3);
  });
});
