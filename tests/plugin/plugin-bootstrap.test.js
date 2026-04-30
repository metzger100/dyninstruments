const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");

describe("plugin.js bootstrap", function () {
  const BOOTSTRAP_MANIFEST = [
    "runtime/namespace.js",
    "runtime/PerfSpanHelper.js",
    "runtime/helpers.js",
    "runtime/editable-defaults.js",
    "config/components/registry-shared-foundation-format.js",
    "config/components/registry-shared-foundation-geometry.js",
    "config/components/registry-shared-foundation-layout.js",
    "config/components/registry-shared-foundation-state.js",
    "config/components/registry-shared-engines.js",
    "config/components/registry-widgets-nav.js",
    "config/components/registry-widgets-vessel.js",
    "config/components/registry-widgets-gauge.js",
    "config/components/registry-cluster.js",
    "shared/unit-format-families.js",
    "config/components.js",
    "config/shared/editable-param-utils.js",
    "config/shared/kind-defaults.js",
    "config/shared/unit-editable-utils.js",
    "config/shared/common-editables.js",
    "config/shared/environment-base-editables.js",
    "config/shared/environment-depth-editables.js",
    "config/shared/environment-temperature-editables.js",
    "config/shared/environment-editables.js",
    "config/clusters/course-heading.js",
    "config/clusters/speed.js",
    "config/clusters/environment.js",
    "config/clusters/wind.js",
    "config/clusters/nav.js",
    "config/clusters/map.js",
    "config/clusters/anchor.js",
    "config/clusters/vessel.js",
    "config/clusters/default.js",
    "config/widget-definitions.js",
    "runtime/asset-preloader.js",
    "runtime/component-loader.js",
    "runtime/widget-registrar.js",
    "runtime/HostCommitController.js",
    "runtime/SurfaceSessionController.js",
    "runtime/TemporaryHostActionBridgeDiscovery.js",
    "runtime/TemporaryHostActionBridge.js",
    "runtime/theme-runtime.js",
    "runtime/init.js"
  ];

  it("loads the bootstrap manifest first, then the manifest-listed scripts in order, and finally calls runtime.runInit", async function () {
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
    await flushPromises(50);

    expect(dom.appendedScripts.length).toBeGreaterThan(10);
    expect(dom.appendedScripts[0].src).toBe("http://host/plugins/dyninstruments/config/bootstrap-manifest.js");
    const loadedScriptSrc = dom.appendedScripts.map((item) => item.src);
    const bootstrapManifestIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/bootstrap-manifest.js");
    const namespaceIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/namespace.js");
    const perfHelperIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/PerfSpanHelper.js");
    const registrySharedFoundationFormatIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-foundation-format.js");
    const registrySharedFoundationGeometryIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-foundation-geometry.js");
    const registrySharedFoundationLayoutIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-foundation-layout.js");
    const registrySharedFoundationStateIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-foundation-state.js");
    const registrySharedEnginesIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-shared-engines.js");
    const registryWidgetsNavIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-widgets-nav.js");
    const registryWidgetsVesselIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-widgets-vessel.js");
    const registryWidgetsGaugeIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-widgets-gauge.js");
    const registryClusterIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components/registry-cluster.js");
    const componentsConfigIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/components.js");
    const assetPreloaderIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/asset-preloader.js");
    const componentLoaderIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/component-loader.js");
    const defaultClusterIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/clusters/default.js");
    const widgetDefinitionsIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/config/widget-definitions.js");
    const hostCommitIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/HostCommitController.js");
    const surfaceSessionIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/SurfaceSessionController.js");
    const themeRuntimeIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/theme-runtime.js");
    const initIndex = loadedScriptSrc.indexOf("http://host/plugins/dyninstruments/runtime/init.js");

    expect(bootstrapManifestIndex).toBe(0);
    expect(namespaceIndex).toBeGreaterThan(-1);
    expect(bootstrapManifestIndex).toBeLessThan(namespaceIndex);
    expect(perfHelperIndex).toBeGreaterThan(-1);
    expect(namespaceIndex).toBeLessThan(perfHelperIndex);
    expect(registrySharedFoundationFormatIndex).toBeGreaterThan(-1);
    expect(registrySharedFoundationGeometryIndex).toBeGreaterThan(-1);
    expect(registrySharedFoundationLayoutIndex).toBeGreaterThan(-1);
    expect(registrySharedFoundationStateIndex).toBeGreaterThan(-1);
    expect(registrySharedEnginesIndex).toBeGreaterThan(-1);
    expect(registryWidgetsNavIndex).toBeGreaterThan(-1);
    expect(registryWidgetsVesselIndex).toBeGreaterThan(-1);
    expect(registryWidgetsGaugeIndex).toBeGreaterThan(-1);
    expect(registryClusterIndex).toBeGreaterThan(-1);
    expect(componentsConfigIndex).toBeGreaterThan(-1);
    expect(assetPreloaderIndex).toBeGreaterThan(-1);
    expect(componentLoaderIndex).toBeGreaterThan(-1);
    expect(registrySharedFoundationFormatIndex).toBeLessThan(registrySharedFoundationGeometryIndex);
    expect(registrySharedFoundationGeometryIndex).toBeLessThan(registrySharedFoundationLayoutIndex);
    expect(registrySharedFoundationLayoutIndex).toBeLessThan(registrySharedFoundationStateIndex);
    expect(registrySharedFoundationStateIndex).toBeLessThan(registrySharedEnginesIndex);
    expect(registrySharedEnginesIndex).toBeLessThan(registryWidgetsNavIndex);
    expect(registryWidgetsNavIndex).toBeLessThan(registryWidgetsVesselIndex);
    expect(registryWidgetsVesselIndex).toBeLessThan(registryWidgetsGaugeIndex);
    expect(registryWidgetsGaugeIndex).toBeLessThan(registryClusterIndex);
    expect(registryClusterIndex).toBeLessThan(componentsConfigIndex);
    expect(componentsConfigIndex).toBeLessThan(assetPreloaderIndex);
    expect(assetPreloaderIndex).toBeLessThan(componentLoaderIndex);
    expect(widgetDefinitionsIndex).toBeLessThan(componentLoaderIndex);
    expect(componentsConfigIndex).toBeLessThan(hostCommitIndex);
    expect(defaultClusterIndex).toBeGreaterThan(componentsConfigIndex);
    expect(defaultClusterIndex).toBeLessThan(widgetDefinitionsIndex);
    expect(hostCommitIndex).toBeGreaterThan(-1);
    expect(surfaceSessionIndex).toBeGreaterThan(-1);
    expect(hostCommitIndex).toBeLessThan(themeRuntimeIndex);
    expect(surfaceSessionIndex).toBeLessThan(themeRuntimeIndex);
    expect(themeRuntimeIndex).toBeLessThan(initIndex);
    expect(dom.appendedScripts[dom.appendedScripts.length - 1].src)
      .toBe("http://host/plugins/dyninstruments/runtime/init.js");
    expect(typeof context.window.DyniPlugin.runtime.loadScriptOnce).toBe("function");
    expect(runInit).toHaveBeenCalledOnce();
  });

  it("captures the wrapper-local AvNav API for runtime bootstrap scripts", async function () {
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
    await flushPromises(50);

    expect(context.window.DyniPlugin.avnavApi).toBe(hostApi);
    expect(dom.appendedScripts.length).toBeGreaterThan(0);
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
      window: { avnav: {} },
      avnav: undefined
    });

    runIifeScript("plugin.js", context);

    expect(err).toHaveBeenCalled();
    expect(dom.appendedScripts.length).toBe(0);
  });

  it("logs a clear error when the bootstrap manifest cannot be loaded", async function () {
    const dom = createDomHarness({
      failScriptIds: ["dyni-internal-config-bootstrap-manifest-js"]
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
    expect(err).toHaveBeenCalledWith("dyninstruments: failed to load bootstrap manifest at config/bootstrap-manifest.js");
    expect(dom.appendedScripts.length).toBe(1);
  });
});
