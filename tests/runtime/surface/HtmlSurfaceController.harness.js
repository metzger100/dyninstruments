// @ts-nocheck
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

/** @param {Record<string, any>} [options] */
function createModule(options) {
  const opts = options || {};
  const context = createScriptContext({
    DyniPlugin: {
      runtime: {},
      state: {},
      config: { shared: {}, clusters: [] }
    }
  });

  runIifeScript("runtime/namespace.js", context);
  context.DyniPlugin.runtime.theme = {
    getShadowCssText: opts.getShadowCssText || vi.fn(() => "")
  };
  runIifeScript("runtime/surface/HtmlSurfaceController.js", context);
  return {
    context,
    module: context.DyniPlugin.runtime._createHtmlSurfaceController(),
    theme: context.DyniPlugin.runtime.theme
  };
}

/** @param {Record<string, any>} [options] */
function createSurfaceDom(options) {
  const opts = options || {};
  const width = Object.prototype.hasOwnProperty.call(opts, "width") ? opts.width : 320;
  const height = Object.prototype.hasOwnProperty.call(opts, "height") ? opts.height : 180;
  const rootEl = document.createElement("div");
  const shellEl = document.createElement("div");
  const mountEl = document.createElement("div");
  mountEl.className = "dyni-surface-html-mount";
  mountEl.getBoundingClientRect = vi.fn(() => /** @type {DOMRect} */ ({ width, height }));
  shellEl.appendChild(mountEl);
  rootEl.appendChild(shellEl);
  return { rootEl, shellEl, mountEl };
}

/** @param {any} shadowRoot */
function getBaseContractStyles(shadowRoot) {
  return shadowRoot.querySelectorAll('style[data-dyni-shadow-base="html-surface-box-contract"]');
}

/**
 * @param {any} surfaceDom
 * @param {Record<string, any>} [props]
 * @param {number} [revision]
 */
function makePayload(surfaceDom, props, revision) {
  return {
    surface: "html",
    rootEl: surfaceDom.rootEl,
    shellEl: surfaceDom.shellEl,
    props: props || {},
    revision
  };
}

function flushMicrotasks() {
  return Promise.resolve().then(function () {
    return Promise.resolve();
  });
}

/** @param {any} fonts */
function setDocumentFonts(fonts) {
  try {
    /** @type {any} */ (document).fonts = fonts;
  } catch (err) {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: fonts
    });
  }
}

/** @param {string} [status] */
function createDeferredFonts(status) {
  /** @type {((value?: any) => void) | null} */
  let resolveReady = null;
  const ready = new Promise(function (resolve) {
    resolveReady = resolve;
  });
  return {
    fonts: {
      status: status || "loading",
      ready: ready
    },
    resolveReady: /** @type {((value?: any) => void) | null} */ (resolveReady)
  };
}

// Captures globalThis.DyniPlugin/document.fonts at call time and registers an
// afterEach that restores them; call once per describe block that uses
// createModule/setDocumentFonts, since each split test file mutates these
// globals independently.
function installGlobalCleanup() {
  const originalDyniPlugin = /** @type {any} */ (globalThis).DyniPlugin;
  const originalDocumentFonts = document.fonts;

  afterEach(function () {
    if (typeof originalDyniPlugin === "undefined") {
      delete (/** @type {any} */ (globalThis).DyniPlugin);
    } else {
      /** @type {any} */ (globalThis).DyniPlugin = originalDyniPlugin;
    }
    if (typeof originalDocumentFonts === "undefined") {
      delete (/** @type {any} */ (document).fonts);
    } else {
      setDocumentFonts(originalDocumentFonts);
    }
  });
}

module.exports = {
  createModule,
  createSurfaceDom,
  getBaseContractStyles,
  makePayload,
  flushMicrotasks,
  setDocumentFonts,
  createDeferredFonts,
  installGlobalCleanup
};
