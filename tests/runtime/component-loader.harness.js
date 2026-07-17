const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");

function createRuntimeScriptLoader(dom) {
  return vi.fn((id, src) => {
    if (dom.document.getElementById(id)) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      const script = dom.document.createElement("script");
      script.id = id;
      script.async = true;
      script.src = src;
      script.onload = function () {
        resolve();
      };
      script.onerror = reject;
      dom.document.head.appendChild(script);
    });
  });
}

function createRuntimeCssLoader(dom) {
  return vi.fn((id, href) => {
    if (!href || dom.document.getElementById(id)) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      const link = dom.document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      link.onload = function () {
        resolve();
      };
      link.onerror = reject;
      dom.document.head.appendChild(link);
    });
  });
}

function setupComponentLoader(options) {
  const dom = createDomHarness(options);
  const runtimeLoadScriptOnce = createRuntimeScriptLoader(dom);
  const runtimeLoadCssOnce = createRuntimeCssLoader(dom);
  const context = createScriptContext({
    document: dom.document,
    DyniPlugin: {
      baseUrl: "http://host/plugins/dyninstruments/",
      runtime: {
        loadScriptOnce: runtimeLoadScriptOnce,
        loadCssOnce: runtimeLoadCssOnce,
      },
      state: {},
      config: { shared: {}, clusters: [] },
    },
    DyniComponents: {
      DyniA: { id: "A", create() {} },
      DyniB: { id: "B", create() {} },
    },
  });

  runIifeScript("runtime/asset-preloader.js", context);
  runIifeScript("runtime/component-loader.js", context);

  return {
    dom,
    runtime: context.DyniPlugin.runtime,
    context,
    runtimeLoadScriptOnce,
    runtimeLoadCssOnce,
  };
}

function installComponentContextRuntime(runtime) {
  runtime.theme = {
    tokens: {
      resolveForRoot: vi.fn(() => ({})),
    },
  };
  runtime.format = { applyFormatter: vi.fn((v) => String(v)) };
  runtime.canvas = { setupCanvas: vi.fn() };
  runtime.dom = {
    requirePluginRoot: vi.fn(),
    getNightModeState: vi.fn(() => false),
  };
  runtime.hostActions = vi.fn(() => ({}));
}

module.exports = {
  setupComponentLoader,
  installComponentContextRuntime,
};
