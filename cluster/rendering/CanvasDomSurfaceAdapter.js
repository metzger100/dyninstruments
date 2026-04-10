/**
 * Module: CanvasDomSurfaceAdapter - Standalone canvas-dom surface controller for internal canvas lifecycle
 * Documentation: documentation/architecture/canvas-dom-surface-adapter.md
 * Depends: PerfSpanHelper
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCanvasDomSurfaceAdapter = factory(); }
}(this, function () {
  "use strict";

  const hasOwn = Object.prototype.hasOwnProperty;
  const SHELL_HTML = '<div class="dyni-surface-canvas"><div class="dyni-surface-canvas-mount"></div></div>';
  const SURFACE_SELECTOR = ".dyni-surface-canvas";
  const MOUNT_SELECTOR = ".dyni-surface-canvas-mount";
  const CANVAS_CLASS = "dyni-surface-canvas-node";
  const RENDER_NOT_READY = { updated: false, changed: false };
  const GLOBAL_ROOT = (typeof globalThis !== "undefined") ? globalThis : (typeof self !== "undefined" ? self : {});

  function hasClass(el, className) {
    return !!(el &&
      el.classList &&
      typeof el.classList.contains === "function" &&
      el.classList.contains(className));
  }

  function findDescendantByClass(rootEl, className) {
    if (!rootEl || !rootEl.children || !rootEl.children.length) {
      return null;
    }
    for (let i = 0; i < rootEl.children.length; i += 1) {
      const child = rootEl.children[i];
      if (hasClass(child, className)) {
        return child;
      }
      const nested = findDescendantByClass(child, className);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  function ensurePayload(methodName, payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("CanvasDomSurfaceAdapter: " + methodName + "() requires a payload object");
    }
    if (!Number.isFinite(payload.revision)) {
      throw new Error("CanvasDomSurfaceAdapter: " + methodName + "() requires finite payload.revision");
    }
    if (!payload.rootEl) {
      throw new Error("CanvasDomSurfaceAdapter: " + methodName + "() requires payload.rootEl");
    }
    if (!payload.shellEl) {
      throw new Error("CanvasDomSurfaceAdapter: " + methodName + "() requires payload.shellEl");
    }
  }

  function shallowEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (!a || !b || typeof a !== "object" || typeof b !== "object") {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }

    for (let i = 0; i < keysA.length; i += 1) {
      const key = keysA[i];
      if (!hasOwn.call(b, key) || a[key] !== b[key]) {
        return false;
      }
    }
    return true;
  }

  function create(def, Helpers) {
    const perf = Helpers.getModule("PerfSpanHelper").create(def, Helpers);

    function renderSurfaceShell() {
      return SHELL_HTML;
    }

    function createSurfaceController(options) {
      const opts = options || {};
      const rendererSpec = opts.rendererSpec;
      if (!rendererSpec || typeof rendererSpec.renderCanvas !== "function") {
        throw new Error("CanvasDomSurfaceAdapter: rendererSpec.renderCanvas is required");
      }

      const requestFrame = (typeof opts.requestAnimationFrame === "function")
        ? opts.requestAnimationFrame
        : (typeof GLOBAL_ROOT.requestAnimationFrame === "function"
          ? GLOBAL_ROOT.requestAnimationFrame.bind(GLOBAL_ROOT)
          : function (cb) {
            return GLOBAL_ROOT.setTimeout(cb, 16);
          });

      const cancelFrame = (typeof opts.cancelAnimationFrame === "function")
        ? opts.cancelAnimationFrame
        : (typeof GLOBAL_ROOT.cancelAnimationFrame === "function"
          ? GLOBAL_ROOT.cancelAnimationFrame.bind(GLOBAL_ROOT)
          : function (handle) {
            GLOBAL_ROOT.clearTimeout(handle);
          });

      const ResizeObserverCtor = hasOwn.call(opts, "ResizeObserver")
        ? opts.ResizeObserver
        : GLOBAL_ROOT.ResizeObserver;

      if (typeof ResizeObserverCtor !== "function") {
        throw new Error("CanvasDomSurfaceAdapter: ResizeObserver is required");
      }

      const hostContext = hasOwn.call(opts, "hostContext") ? opts.hostContext : null;

      let rootEl = null;
      let shellEl = null;
      let surfaceEl = null;
      let mountEl = null;
      let canvasEl = null;
      let observer = null;
      let rafHandle = null;

      let props = undefined;
      let revision = 0;
      let attached = false;
      let destroyed = false;
      let paintDirty = false;
      let sizeDirty = false;
      let pendingPaintWaitSpan = null;

      function cancelPendingFrame() {
        if (rafHandle == null) {
          return;
        }
        cancelFrame(rafHandle);
        rafHandle = null;
        perf.endSpan(pendingPaintWaitSpan, {
          rendererId: rendererSpec.id || "unknown",
          status: "canceled"
        });
        pendingPaintWaitSpan = null;
      }

      function disconnectObserver() {
        if (!observer) {
          return;
        }
        observer.disconnect();
        observer = null;
      }

      function clearDomRefs() {
        rootEl = null;
        shellEl = null;
        surfaceEl = null;
        mountEl = null;
        canvasEl = null;
      }

      function clearRenderFlags() {
        paintDirty = false;
        sizeDirty = false;
      }

      function markDirty(reason) {
        if (reason === "size") {
          sizeDirty = true;
          return;
        }
        paintDirty = true;
      }

      function findSurfaceElement(hostShellEl) {
        if (!hostShellEl) {
          return null;
        }
        const nestedFromChildren = findDescendantByClass(hostShellEl, "dyni-surface-canvas");
        if (nestedFromChildren) {
          return nestedFromChildren;
        }
        if (typeof hostShellEl.querySelector === "function") {
          const nestedSurfaceEl = hostShellEl.querySelector(SURFACE_SELECTOR);
          if (nestedSurfaceEl) {
            return nestedSurfaceEl;
          }
        }
        if (hasClass(hostShellEl, "dyni-surface-canvas")) {
          return hostShellEl;
        }
        return null;
      }

      function findMountElement(hostSurfaceEl) {
        if (hasClass(hostSurfaceEl, "dyni-surface-canvas-mount")) {
          return hostSurfaceEl;
        }
        if (typeof hostSurfaceEl.querySelector !== "function") {
          return null;
        }
        return hostSurfaceEl.querySelector(MOUNT_SELECTOR);
      }

      function removeCanvasNode() {
        if (!mountEl || !canvasEl || typeof mountEl.removeChild !== "function") {
          return;
        }
        if (canvasEl.parentElement !== mountEl) {
          return;
        }
        mountEl.removeChild(canvasEl);
      }

      function createCanvasNode() {
        const doc = shellEl && shellEl.ownerDocument;
        if (!doc || typeof doc.createElement !== "function") {
          throw new Error("CanvasDomSurfaceAdapter: attach() requires shellEl.ownerDocument.createElement");
        }
        const canvas = doc.createElement("canvas");
        canvas.className = CANVAS_CLASS;
        return canvas;
      }

      function applySurfaceContractStyles() {
        surfaceEl.style.fontSize = "initial";
        surfaceEl.style.width = "100%";
        surfaceEl.style.height = "100%";
        surfaceEl.style.display = "block";

        mountEl.style.width = "100%";
        mountEl.style.height = "100%";
        mountEl.style.display = "block";

        canvasEl.style.width = "100%";
        canvasEl.style.height = "100%";
        canvasEl.style.display = "block";
      }

      function paintNow() {
        if (!attached || !canvasEl || (!paintDirty && !sizeDirty)) {
          return;
        }

        const renderSpan = perf.startSpan("Renderer.renderCanvas", {
          rendererId: rendererSpec.id || "unknown",
          cluster: props && props.cluster,
          kind: props && props.kind
        });
        try {
          if (hostContext) {
            rendererSpec.renderCanvas.call(hostContext, canvasEl, props);
          } else {
            rendererSpec.renderCanvas(canvasEl, props);
          }
        }
        finally {
          perf.endSpan(renderSpan, {
            rendererId: rendererSpec.id || "unknown",
            cluster: props && props.cluster,
            kind: props && props.kind
          });
        }
        perf.endSpan(pendingPaintWaitSpan, {
          rendererId: rendererSpec.id || "unknown",
          revision: revision,
          status: "painted"
        });
        pendingPaintWaitSpan = null;
        clearRenderFlags();
      }

      function schedulePaint(reason) {
        if (!attached || destroyed || !canvasEl) {
          return false;
        }
        markDirty(reason);

        if (rafHandle != null) {
          return false;
        }

        pendingPaintWaitSpan = perf.startSpan("CanvasDomSurfaceAdapter.schedulePaint->paintNow", {
          rendererId: rendererSpec.id || "unknown",
          reason: reason || "update",
          revision: revision
        });
        rafHandle = requestFrame(function () {
          rafHandle = null;
          paintNow();
        });
        return true;
      }

      function bindResizeObserver() {
        observer = new ResizeObserverCtor(function () {
          if (!attached || destroyed) {
            return;
          }
          schedulePaint("size");
        });
        observer.observe(surfaceEl);
      }

      function setPayloadState(payload) {
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;
      }

      function attach(payload) {
        if (destroyed) {
          throw new Error("CanvasDomSurfaceAdapter: attach() after destroy()");
        }
        ensurePayload("attach", payload);
        if (payload.surface && payload.surface !== "canvas-dom") {
          throw new Error("CanvasDomSurfaceAdapter: attach() requires payload.surface === 'canvas-dom'");
        }

        if (attached) {
          detach("remount");
        }

        setPayloadState(payload);
        surfaceEl = findSurfaceElement(shellEl);
        if (!surfaceEl) {
          throw new Error("CanvasDomSurfaceAdapter: attach() missing .dyni-surface-canvas in shellEl");
        }

        mountEl = findMountElement(surfaceEl);
        if (!mountEl) {
          throw new Error("CanvasDomSurfaceAdapter: attach() missing .dyni-surface-canvas-mount in shellEl");
        }

        canvasEl = createCanvasNode();
        applySurfaceContractStyles();
        mountEl.appendChild(canvasEl);

        attached = true;
        bindResizeObserver();
        schedulePaint("attach");
      }

      function update(payload) {
        ensurePayload("update", payload);
        if (!attached) {
          throw new Error("CanvasDomSurfaceAdapter: update() requires an attached surface");
        }
        if (payload.shellEl !== shellEl) {
          throw new Error("CanvasDomSurfaceAdapter: update() received a different shellEl; remount required");
        }

        const changed = !shallowEqual(props, payload.props);
        setPayloadState(payload);
        if (!changed) {
          return RENDER_NOT_READY;
        }
        schedulePaint("update");
        return { updated: true, changed: true };
      }

      function detach(reason) {
        cancelPendingFrame();
        disconnectObserver();
        removeCanvasNode();
        perf.endSpan(pendingPaintWaitSpan, {
          rendererId: rendererSpec.id || "unknown",
          status: "detached"
        });
        pendingPaintWaitSpan = null;
        clearRenderFlags();
        clearDomRefs();
        props = undefined;
        revision = 0;
        attached = false;
      }

      function destroy() {
        if (destroyed) {
          return;
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
      id: "CanvasDomSurfaceAdapter",
      renderSurfaceShell: renderSurfaceShell,
      createSurfaceController: createSurfaceController
    };
  }

  return { id: "CanvasDomSurfaceAdapter", create: create };
}));
