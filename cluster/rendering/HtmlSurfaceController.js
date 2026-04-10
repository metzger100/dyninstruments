/**
 * Module: HtmlSurfaceController - Committed html-surface lifecycle owner for shell rendering and shadow DOM mount/update/detach/destroy
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: PerfSpanHelper
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniHtmlSurfaceController = factory(); }
}(this, function () {
  "use strict";

  const SURFACE_ID = "html";
  const SURFACE_CLASS = "dyni-surface-html";
  const MOUNT_CLASS = "dyni-surface-html-mount";

  function resolveRuntimeApi() {
    const globalRoot = (typeof globalThis !== "undefined")
      ? globalThis
      : (typeof self !== "undefined" ? self : {});
    const ns = globalRoot.DyniPlugin;
    return ns && ns.runtime ? ns.runtime : null;
  }

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

  function ensureHostContext(methodName, hostContext) {
    if (!hostContext || typeof hostContext !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires hostContext object");
    }
  }

  function ensureRendererSpec(methodName, rendererSpec) {
    if (!rendererSpec || typeof rendererSpec !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec object");
    }
    if (typeof rendererSpec.createCommittedRenderer !== "function") {
      throw new Error("HtmlSurfaceController: " + methodName + "() requires rendererSpec.createCommittedRenderer()");
    }
  }

  function ensureRendererInstance(methodName, instance) {
    if (!instance || typeof instance !== "object") {
      throw new Error("HtmlSurfaceController: " + methodName + "() renderer factory must return an object instance");
    }
    const methods = ["mount", "update", "postPatch", "detach", "destroy"];
    for (let i = 0; i < methods.length; i += 1) {
      const method = methods[i];
      if (typeof instance[method] !== "function") {
        throw new Error("HtmlSurfaceController: " + methodName + "() committed renderer must implement " + method + "()");
      }
    }
  }

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

  function resolveLayoutSignature(rendererInstance, rendererPayload, methodName) {
    if (typeof rendererInstance.layoutSignature !== "function") {
      return "none";
    }
    return normalizeSignature(rendererInstance.layoutSignature(rendererPayload), methodName);
  }

  function ensureMountHost(shellEl) {
    if (!shellEl || typeof shellEl.querySelector !== "function") {
      throw new Error("HtmlSurfaceController: shell element does not support querySelector()");
    }
    const mountEl = shellEl.querySelector("." + MOUNT_CLASS);
    if (!mountEl) {
      throw new Error("HtmlSurfaceController: shell is missing ." + MOUNT_CLASS + " mount host");
    }
    return mountEl;
  }

  function ensureShadowRoot(mountEl) {
    if (mountEl.shadowRoot) {
      return mountEl.shadowRoot;
    }
    if (typeof mountEl.attachShadow !== "function") {
      throw new Error("HtmlSurfaceController: mount host does not support attachShadow()");
    }
    return mountEl.attachShadow({ mode: "open" });
  }

  function measureShellRect(mountEl) {
    if (!mountEl || typeof mountEl.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = mountEl.getBoundingClientRect();
    const width = Number(rect && rect.width);
    const height = Number(rect && rect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return {
      width: width,
      height: height
    };
  }

  function createRendererPayload(state, payload, layoutChanged, relayoutPass) {
    return {
      props: payload.props,
      revision: payload.revision,
      rootEl: payload.rootEl,
      shellEl: payload.shellEl,
      mountEl: state.mountEl,
      shadowRoot: state.shadowRoot,
      shellRect: measureShellRect(state.mountEl),
      hostContext: state.hostContext,
      layoutChanged: layoutChanged === true,
      relayoutPass: relayoutPass || 0
    };
  }

  function shouldRelayout(result) {
    if (result === true) {
      return true;
    }
    return !!(result && typeof result === "object" && result.relayout === true);
  }

  function ensureShadowCssCached(themeRuntime, url) {
    if (!themeRuntime || typeof themeRuntime.getShadowCssText !== "function") {
      throw new Error("HtmlSurfaceController: runtime._theme.getShadowCssText() is required for shadow CSS injection");
    }
    const cssText = themeRuntime.getShadowCssText(url);
    if (typeof cssText !== "string") {
      throw new Error("HtmlSurfaceController: missing preloaded shadow CSS text for '" + url + "'");
    }
    return cssText;
  }

  function injectShadowStyles(shadowRoot, shadowCssUrls, themeRuntime) {
    if (!Array.isArray(shadowCssUrls) || !shadowCssUrls.length) {
      return;
    }
    for (let i = 0; i < shadowCssUrls.length; i += 1) {
      const url = shadowCssUrls[i];
      if (typeof url !== "string" || !url) {
        continue;
      }
      const selector = 'style[data-dyni-shadow-css="' + url.replace(/"/g, "\\\"") + '"]';
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

  function create(def, Helpers) {
    const perf = Helpers.getModule("PerfSpanHelper").create(def, Helpers);
    const runtimeApi = resolveRuntimeApi();
    const themeRuntime = runtimeApi && runtimeApi._theme ? runtimeApi._theme : null;

    function renderSurfaceShell(options) {
      const opts = options || {};
      ensureRendererSpec("renderSurfaceShell", opts.rendererSpec);
      return '<div class="' + SURFACE_CLASS + '"><div class="' + MOUNT_CLASS + '" data-dyni-html-mount="1"></div></div>';
    }

    function createSurfaceController(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec || null;
      const hostContext = Object.prototype.hasOwnProperty.call(opts, "hostContext") ? opts.hostContext : null;
      const shadowCssUrls = Array.isArray(opts.shadowCssUrls) ? opts.shadowCssUrls.slice() : [];

      ensureRendererSpec("createSurfaceController", rendererSpec);
      ensureHostContext("createSurfaceController", hostContext);

      let attached = false;
      let destroyed = false;
      let lastLayoutSignature = "none";

      const state = {
        hostContext: hostContext,
        shellEl: null,
        mountEl: null,
        shadowRoot: null,
        renderer: null
      };

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

      function attach(payload) {
        const span = perf.startSpan("HtmlSurfaceController.attach", {
          rendererId: rendererSpec.id || "unknown",
          revision: payload && payload.revision
        });
        if (destroyed) {
          throw new Error("HtmlSurfaceController: attach() after destroy()");
        }
        ensurePayload("attach", payload);
        try {
          state.mountEl = ensureMountHost(payload.shellEl);
          state.shadowRoot = ensureShadowRoot(state.mountEl);
          state.shellEl = payload.shellEl;
          injectShadowStyles(state.shadowRoot, shadowCssUrls, themeRuntime);

          const rendererInstance = rendererSpec.createCommittedRenderer({
            hostContext: hostContext,
            shadowRoot: state.shadowRoot,
            mountEl: state.mountEl
          });
          ensureRendererInstance("attach", rendererInstance);
          state.renderer = rendererInstance;

          const rendererPayload = createRendererPayload(state, payload, true, 0);
          lastLayoutSignature = resolveLayoutSignature(rendererInstance, rendererPayload, "attach");
          rendererInstance.mount(state.shadowRoot, rendererPayload);
          runPostPatch(payload, rendererPayload);

          attached = true;
        }
        finally {
          perf.endSpan(span, {
            rendererId: rendererSpec.id || "unknown",
            revision: payload && payload.revision
          });
        }
      }

      function update(payload) {
        const span = perf.startSpan("HtmlSurfaceController.update", {
          rendererId: rendererSpec.id || "unknown",
          revision: payload && payload.revision
        });
        ensurePayload("update", payload);
        if (!attached || !state.renderer) {
          throw new Error("HtmlSurfaceController: update() requires an attached surface");
        }
        if (payload.shellEl !== state.shellEl) {
          throw new Error("HtmlSurfaceController: update() received a different shellEl; remount required");
        }
        try {
          const signaturePayload = createRendererPayload(state, payload, false, 0);
          const nextLayoutSignature = resolveLayoutSignature(state.renderer, signaturePayload, "update");
          const layoutChanged = nextLayoutSignature !== lastLayoutSignature;
          lastLayoutSignature = nextLayoutSignature;

          const rendererPayload = createRendererPayload(state, payload, layoutChanged, 0);
          state.renderer.update(rendererPayload);
          runPostPatch(payload, rendererPayload);

          return {
            updated: true,
            changed: true,
            layoutChanged: layoutChanged
          };
        }
        finally {
          perf.endSpan(span, {
            rendererId: rendererSpec.id || "unknown",
            revision: payload && payload.revision
          });
        }
      }

      function detach(reason) {
        if (!state.renderer) {
          attached = false;
          return;
        }
        state.renderer.detach(reason || "detach");
        if (state.shadowRoot && state.shadowRoot.textContent !== undefined) {
          state.shadowRoot.textContent = "";
        }
        state.renderer = null;
        state.shellEl = null;
        state.mountEl = null;
        state.shadowRoot = null;
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
      id: "HtmlSurfaceController",
      renderSurfaceShell: renderSurfaceShell,
      createSurfaceController: createSurfaceController
    };
  }

  return { id: "HtmlSurfaceController", create: create };
}));
