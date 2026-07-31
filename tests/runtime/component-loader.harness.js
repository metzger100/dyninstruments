const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");

/**
 * @typedef {{
 *   id: string,
 *   async: boolean,
 *   src: string,
 *   href: string,
 *   rel: string,
 *   onload: (() => void) | null,
 *   onerror: ((error: Error) => void) | null
 * }} DyniLoaderDomNode
 * @typedef {{
 *   document: {
 *     getElementById(id: string): DyniLoaderDomNode | null,
 *     createElement(tag: string): DyniLoaderDomNode,
 *     head: { appendChild(node: DyniLoaderDomNode): DyniLoaderDomNode }
 *   }
 * }} DyniLoaderDom
 */

/** @param {DyniLoaderDom} dom @returns {(id: string, src: string) => Promise<void>} */
function createRuntimeScriptLoader(dom) {
  return vi.fn((id, src) => {
    if (dom.document.getElementById(id)) {
      return Promise.resolve();
    }

    return /** @type {Promise<void>} */ (
      new Promise(function (resolve, reject) {
        const script = dom.document.createElement("script");
        script.id = id;
        script.async = true;
        script.src = src;
        script.onload = function () {
          resolve();
        };
        script.onerror = reject;
        dom.document.head.appendChild(script);
      })
    );
  });
}

/** @param {DyniLoaderDom} dom @returns {(id: string, href: string | undefined) => Promise<void>} */
function createRuntimeCssLoader(dom) {
  return vi.fn((id, href) => {
    if (!href || dom.document.getElementById(id)) {
      return Promise.resolve();
    }

    return /** @type {Promise<void>} */ (
      new Promise(function (resolve, reject) {
        const link = dom.document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        link.onload = function () {
          resolve();
        };
        link.onerror = reject;
        dom.document.head.appendChild(link);
      })
    );
  });
}

/** @param {import("../helpers/mock-dom.js").DomHarnessOptions} [options] */
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
        loadCssOnce: runtimeLoadCssOnce
      },
      state: {},
      config: { shared: {}, clusters: [] }
    },
    DyniComponents: {
      DyniA: { id: "A", create() {} },
      DyniB: { id: "B", create() {} }
    }
  });

  runIifeScript("runtime/asset-preloader.js", context);
  runIifeScript("runtime/component-loader.js", context);

  return {
    dom,
    runtime: context.DyniPlugin.runtime,
    context,
    runtimeLoadScriptOnce,
    runtimeLoadCssOnce
  };
}

/** @param {Record<string, unknown>} runtime */
function installComponentContextRuntime(runtime) {
  runtime.theme = {
    tokens: {
      resolveForRoot: vi.fn(() => ({}))
    }
  };
  runtime.format = { applyFormatter: vi.fn((v) => String(v)) };
  runtime.canvas = { setupCanvas: vi.fn() };
  runtime.dom = {
    requirePluginRoot: vi.fn(),
    getNightModeState: vi.fn(() => false)
  };
  runtime.hostActions = vi.fn(() => ({}));
}

module.exports = {
  setupComponentLoader,
  installComponentContextRuntime
};
