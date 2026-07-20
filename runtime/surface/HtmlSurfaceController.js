/**
 * @file DyniPlugin Html Surface Runtime - Committed html-surface lifecycle owner
 * Documentation: documentation/architecture/cluster-widget-system.md
 */
(function (root) {
  "use strict";

  const ns = /** @type {DyniPluginNamespace & { runtime: DyniHtmlRuntime }} */ (root.DyniPlugin);
  const runtime = ns.runtime;

  const SURFACE_ID = "html";
  const MOUNT_CLASS = "dyni-surface-html-mount";
  const BASE_SHADOW_STYLE_ATTR = "data-dyni-shadow-base";
  const BASE_SHADOW_STYLE_ID = "html-surface-box-contract";
  const BASE_SHADOW_STYLE_CSS = [
    ":host {",
    "  display: block;",
    "  width: 100%;",
    "  height: 100%;",
    "  min-width: 0;",
    "  min-height: 0;",
    "  box-sizing: border-box;",
    "}",
    ".dyni-html-root {",
    "  display: block;",
    "  width: 100%;",
    "  height: 100%;",
    "  min-width: 0;",
    "  min-height: 0;",
    "  box-sizing: border-box;",
    "}"
  ].join("\n");

  /** @param {string} methodName @param {DyniHtmlSurfacePayload} payload */
  function ensurePayload(methodName, payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires a payload object");
    }
    if (!Number.isFinite(payload.revision)) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires finite payload.revision");
    }
    if (!payload.rootEl) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.rootEl");
    }
    if (!payload.shellEl) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.shellEl");
    }
    if (payload.surface && payload.surface !== SURFACE_ID) {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires payload.surface === 'html'");
    }
  }

  /** @param {string} methodName @param {unknown} hostContext */
  function ensureHostContext(methodName, hostContext) {
    if (!hostContext || typeof hostContext !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires hostContext object");
    }
  }

  /** @param {string} methodName @param {DyniHtmlSurfaceRendererSpec | null} rendererSpec */
  function ensureRendererSpec(methodName, rendererSpec) {
    if (!rendererSpec || typeof rendererSpec !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec object");
    }
    if (typeof rendererSpec.createCommittedRenderer !== "function") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec.createCommittedRenderer()");
    }
  }

  /** @param {string} methodName @param {DyniHtmlSurfaceRendererInstance} instance */
  function ensureRendererInstance(methodName, instance) {
    if (!instance || typeof instance !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() renderer factory must return an object instance");
    }
    const methods = ["mount", "update", "postPatch", "detach", "destroy"];
    for (let i = 0; i < methods.length; i += 1) {
      const method = methods[i];
      const dynamicInstance = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (instance));
      if (typeof dynamicInstance[method] !== "function") {
        throw new Error(
          "HtmlSurfaceController: " + methodName + "() committed renderer must implement " + method + "()"
        );
      }
    }
  }

  /** @param {unknown} signature @param {string} methodName @returns {string} */
  function normalizeSignature(signature, methodName) {
    if (signature == null) {
      return "null";
    }
    const type = typeof signature;
    if (type === "string" || type === "number" || type === "boolean") {
      return type + ":" + String(signature);
    }
    throw new Error("HtmlSurfaceController: " + methodName + "() layoutSignature() must return primitive signature");
  }

  /** @param {DyniHtmlSurfaceRendererInstance} rendererInstance @param {DyniHtmlSurfacePayload} rendererPayload @param {string} methodName @returns {string} */
  function resolveLayoutSignature(rendererInstance, rendererPayload, methodName) {
    if (typeof rendererInstance.layoutSignature !== "function") {
      return "none";
    }
    return normalizeSignature(rendererInstance.layoutSignature(rendererPayload), methodName);
  }

  /** @param {HTMLElement} shellEl @returns {HTMLElement} */
  function ensureMountHost(shellEl) {
    if (!shellEl || typeof shellEl.querySelector !== "function") {
      throw new Error("HtmlSurfaceController: shell element does not support querySelector()");
    }
    const mountEl = shellEl.querySelector("." + MOUNT_CLASS);
    if (!mountEl) {
      throw new Error("HtmlSurfaceController: shell is missing ." + MOUNT_CLASS + " mount host");
    }
    return /** @type {HTMLElement} */ (mountEl);
  }

  /** @param {HTMLElement} mountEl @returns {ShadowRoot} */
  function ensureShadowRoot(mountEl) {
    if (mountEl.shadowRoot) {
      return mountEl.shadowRoot;
    }
    if (typeof mountEl.attachShadow !== "function") {
      throw new Error("HtmlSurfaceController: mount host does not support attachShadow()");
    }
    return mountEl.attachShadow({ mode: "open" });
  }

  /** @param {HTMLElement} mountEl @param {Record<string, unknown> | null | undefined} route @returns {DyniHtmlShellRect | null} */
  function measureShellRect(mountEl, route) {
    if (!mountEl || typeof mountEl.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = mountEl.getBoundingClientRect();
    const width = Number(rect && rect.width);
    const height = Number(rect && rect.height);
    const shellSizing =
      route && route.shellSizing && typeof route.shellSizing === "object"
        ? /** @type {Record<string, unknown>} */ (route.shellSizing)
        : null;
    const shellSizingKind = shellSizing ? shellSizing.kind : null;

    if (shellSizingKind === "natural") {
      if (!(width > 0)) {
        return null;
      }
      return {
        width: width,
        height: height > 0 ? height : 0
      };
    }

    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return {
      width: width,
      height: height
    };
  }

  /** @param {DyniHtmlSurfaceState} state @param {DyniHtmlSurfacePayload} payload @param {boolean} layoutChanged @param {number} relayoutPass @returns {DyniHtmlSurfacePayload} */
  function createRendererPayload(state, payload, layoutChanged, relayoutPass) {
    return {
      props: payload.props,
      revision: payload.revision,
      rootEl: payload.rootEl,
      shellEl: payload.shellEl,
      mountEl: state.mountEl,
      shadowRoot: state.shadowRoot,
      route: payload.route || null,
      shellRect: state.mountEl ? measureShellRect(state.mountEl, payload.route) : null,
      hostContext: state.hostContext,
      layoutChanged: layoutChanged === true,
      relayoutPass: relayoutPass || 0,
      fontMetricsEpoch: state.fontMetricsEpoch
    };
  }

  /** @param {unknown} result @returns {boolean} */
  function shouldRelayout(result) {
    if (result === true) {
      return true;
    }
    const resultRecord = result && typeof result === "object" ? /** @type {Record<string, unknown>} */ (result) : null;
    return !!(resultRecord && resultRecord.relayout === true);
  }

  /** @param {DyniThemeRuntime | null} themeRuntime @param {string} url @returns {string} */
  function ensureShadowCssCached(themeRuntime, url) {
    if (!themeRuntime || typeof themeRuntime.getShadowCssText !== "function") {
      throw new Error("HtmlSurfaceController: runtime.theme.getShadowCssText() is required for shadow CSS injection");
    }
    const cssText = themeRuntime.getShadowCssText(url);
    if (typeof cssText !== "string") {
      throw new Error("HtmlSurfaceController: missing preloaded shadow CSS text for '" + url + "'");
    }
    return cssText;
  }

  /** @param {ShadowRoot} shadowRoot */
  function injectBaseShadowStyle(shadowRoot) {
    const selector = "style[" + BASE_SHADOW_STYLE_ATTR + '="' + BASE_SHADOW_STYLE_ID + '"]';
    if (typeof shadowRoot.querySelector === "function" && shadowRoot.querySelector(selector)) {
      return;
    }
    const styleEl = shadowRoot.ownerDocument.createElement("style");
    styleEl.setAttribute(BASE_SHADOW_STYLE_ATTR, BASE_SHADOW_STYLE_ID);
    styleEl.textContent = BASE_SHADOW_STYLE_CSS;
    shadowRoot.appendChild(styleEl);
  }

  /** @param {ShadowRoot} shadowRoot @param {string[]} shadowCssUrls @param {DyniThemeRuntime | null} themeRuntime */
  function injectShadowStyles(shadowRoot, shadowCssUrls, themeRuntime) {
    if (!Array.isArray(shadowCssUrls) || !shadowCssUrls.length) {
      return;
    }
    for (let i = 0; i < shadowCssUrls.length; i += 1) {
      const url = shadowCssUrls[i];
      if (typeof url !== "string" || !url) {
        continue;
      }
      const selector = 'style[data-dyni-shadow-css="' + url.replace(new RegExp('"', "g"), '\\"') + '"]';
      if (typeof shadowRoot.querySelector === "function" && shadowRoot.querySelector(selector)) {
        continue;
      }
      const cssText = ensureShadowCssCached(themeRuntime, url);
      const styleEl = shadowRoot.ownerDocument.createElement("style");
      styleEl.setAttribute("data-dyni-shadow-css", url);
      styleEl.textContent = cssText;
      shadowRoot.appendChild(styleEl);
    }
  }

  /** @returns {DyniSurfaceControllerFactory} */
  function createHtmlSurfaceController() {
    const runtimeApi = runtime;
    const themeRuntime = runtimeApi && runtimeApi.theme ? runtimeApi.theme : null;

    /** @param {DyniHtmlSurfaceOptions} options */
    function createSurfaceController(options) {
      const opts = /** @type {DyniHtmlSurfaceOptions} */ (options || {});
      const rendererSpec = /** @type {DyniHtmlSurfaceRendererSpec} */ (opts.rendererSpec);
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;
      const shadowCssUrls = Array.isArray(opts.shadowCssUrls) ? opts.shadowCssUrls.slice() : [];

      ensureRendererSpec("createSurfaceController", rendererSpec);
      ensureHostContext("createSurfaceController", hostContext);

      let attached = false;
      let destroyed = false;
      let lastLayoutSignature = "none";

      const state = /** @type {DyniHtmlSurfaceState} */ ({
        hostContext: hostContext,
        shellEl: null,
        mountEl: null,
        shadowRoot: null,
        renderer: null,
        latestPayload: null,
        fontMetricsEpoch: 0,
        fontMetricsRefreshToken: 0
      });

      /** @param {DyniHtmlSurfacePayload} payload @param {DyniHtmlSurfacePayload} rendererPayload */
      function runPostPatch(payload, rendererPayload) {
        if (!state.renderer) {
          return;
        }
        const postPatchResult = state.renderer.postPatch(rendererPayload);
        if (!shouldRelayout(postPatchResult)) {
          return;
        }

        const relayoutPayload = createRendererPayload(state, payload, true, 1);
        state.renderer.update(relayoutPayload);
        state.renderer.postPatch(relayoutPayload);
      }

      function scheduleFontMetricsRefresh() {
        if (!state.mountEl || !state.renderer || !state.latestPayload) {
          return;
        }
        const ownerDocument = state.mountEl.ownerDocument || null;
        const fonts = ownerDocument && ownerDocument.fonts ? ownerDocument.fonts : null;
        if (!fonts || fonts.status === "loaded" || !fonts.ready || typeof fonts.ready.then !== "function") {
          return;
        }

        const refreshToken = state.fontMetricsRefreshToken + 1;
        state.fontMetricsRefreshToken = refreshToken;
        fonts.ready.then(
          function () {
            if (destroyed || !attached || refreshToken !== state.fontMetricsRefreshToken) {
              return;
            }
            if (!state.renderer || !state.mountEl || !state.latestPayload) {
              return;
            }
            state.fontMetricsEpoch += 1;
            const latestPayload = state.latestPayload;
            const rendererPayload = createRendererPayload(state, latestPayload, false, 0);
            state.renderer.update(rendererPayload);
            runPostPatch(latestPayload, rendererPayload);
          },
          function () {}
        );
      }

      /** @param {DyniHtmlSurfacePayload} payload */
      function attach(payload) {
        if (destroyed) {
          throw new Error("HtmlSurfaceController: attach() after destroy()");
        }
        ensurePayload("attach", payload);
        state.mountEl = ensureMountHost(payload.shellEl);
        state.shadowRoot = ensureShadowRoot(state.mountEl);
        state.shellEl = payload.shellEl;
        injectBaseShadowStyle(state.shadowRoot);
        injectShadowStyles(state.shadowRoot, shadowCssUrls, themeRuntime);

        const rendererInstance = rendererSpec.createCommittedRenderer({
          hostContext: hostContext,
          shadowRoot: state.shadowRoot,
          mountEl: state.mountEl
        });
        ensureRendererInstance("attach", rendererInstance);
        state.renderer = rendererInstance;
        state.latestPayload = payload;

        const rendererPayload = createRendererPayload(state, payload, true, 0);
        lastLayoutSignature = resolveLayoutSignature(rendererInstance, rendererPayload, "attach");
        rendererInstance.mount(state.shadowRoot, rendererPayload);
        runPostPatch(payload, rendererPayload);
        scheduleFontMetricsRefresh();

        attached = true;
      }

      /** @param {DyniHtmlSurfacePayload} payload */
      function update(payload) {
        ensurePayload("update", payload);
        if (!attached || !state.renderer) {
          throw new Error("HtmlSurfaceController: update() requires an attached surface");
        }
        if (payload.shellEl !== state.shellEl) {
          throw new Error("HtmlSurfaceController: update() received a different shellEl; remount required");
        }
        const signaturePayload = createRendererPayload(state, payload, false, 0);
        const nextLayoutSignature = resolveLayoutSignature(state.renderer, signaturePayload, "update");
        const layoutChanged = nextLayoutSignature !== lastLayoutSignature;
        lastLayoutSignature = nextLayoutSignature;

        const rendererPayload = createRendererPayload(state, payload, layoutChanged, 0);
        state.latestPayload = payload;
        state.renderer.update(rendererPayload);
        runPostPatch(payload, rendererPayload);

        return {
          updated: true,
          changed: true,
          layoutChanged: layoutChanged
        };
      }

      /** @param {string} reason */
      function detach(reason) {
        if (!state.renderer) {
          attached = false;
          return;
        }
        state.fontMetricsRefreshToken += 1;
        state.renderer.detach(reason || "detach");
        if (state.shadowRoot && state.shadowRoot.textContent !== undefined) {
          state.shadowRoot.textContent = "";
        }
        state.renderer = null;
        state.shellEl = null;
        state.mountEl = null;
        state.shadowRoot = null;
        state.latestPayload = null;
        lastLayoutSignature = "none";
        attached = false;
      }

      function destroy() {
        if (destroyed) {
          return;
        }
        if (state.renderer) {
          state.renderer.destroy();
        }
        detach("destroy");
        destroyed = true;
      }

      return {
        attach: attach,
        update: update,
        detach: detach,
        destroy: destroy
      };
    }

    return {
      createSurfaceController: createSurfaceController
    };
  }

  runtime._createHtmlSurfaceController = createHtmlSurfaceController;
})(this);
