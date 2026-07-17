/**
 * @file DyniPlugin CanvasDom Surface Runtime - Canvas surface controller for internal canvas lifecycle
 * Documentation: documentation/architecture/canvas-dom-surface-adapter.md
 */
(function (root) {
  "use strict";

  /** @typedef {{ id?: unknown, renderCanvas(canvas: HTMLCanvasElement, props: Record<string, unknown> | undefined): { wantsFollowUpFrame?: boolean } | void }} DyniCanvasSurfaceRendererSpec */
  /** @typedef {{ revision: number, rootEl: Element, shellEl: HTMLElement, props?: Record<string, unknown>, surface?: unknown }} DyniCanvasSurfacePayload */
  /** @typedef {{ rendererSpec: DyniCanvasSurfaceRendererSpec, requestAnimationFrame?: (callback: () => void) => number, cancelAnimationFrame?: (handle: number) => void, ResizeObserver?: typeof ResizeObserver, hostContext?: unknown }} DyniCanvasSurfaceOptions */
  /** @typedef {{ _createCanvasDomSurfaceAdapter: () => DyniSurfaceControllerFactory }} DyniCanvasRuntime */

  const ns = /** @type {DyniPluginNamespace & { runtime: DyniCanvasRuntime }} */ (root.DyniPlugin);
  const runtime = ns.runtime;

  const hasOwn = Object.prototype.hasOwnProperty;
  const SURFACE_SELECTOR = ".dyni-surface-canvas";
  const MOUNT_SELECTOR = ".dyni-surface-canvas-mount";
  const CANVAS_CLASS = "dyni-surface-canvas-node";
  const RENDER_NOT_READY = { updated: false, changed: false };
  let globalRoot = {};
  if (typeof globalThis !== "undefined") {
    globalRoot = globalThis;
  } else if (typeof self !== "undefined") {
    globalRoot = self;
  }
  const GLOBAL_ROOT = /** @type {Window & typeof globalThis} */ (globalRoot);

  /** @param {Element | null | undefined} el @param {string} className @returns {boolean} */
  function hasClass(el, className) {
    return !!(el && el.classList && typeof el.classList.contains === "function" && el.classList.contains(className));
  }

  /** @param {Element | null | undefined} rootEl @param {string} className @returns {HTMLElement | null} */
  function findDescendantByClass(rootEl, className) {
    if (!rootEl || !rootEl.children || !rootEl.children.length) {
      return null;
    }
    for (let i = 0; i < rootEl.children.length; i += 1) {
      const child = /** @type {HTMLElement} */ (rootEl.children[i]);
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

  /** @param {string} methodName @param {DyniCanvasSurfacePayload} payload */
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

  /** @param {Record<string, unknown> | undefined} a @param {Record<string, unknown> | undefined} b @returns {boolean} */
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

  /** @returns {DyniSurfaceControllerFactory} */
  function createCanvasDomSurfaceAdapter() {
    /** @param {DyniCanvasSurfaceOptions} options */
    function createSurfaceController(options) {
      const opts = /** @type {DyniCanvasSurfaceOptions} */ (options || {});
      const rendererSpec = opts.rendererSpec;
      if (!rendererSpec || typeof rendererSpec.renderCanvas !== "function") {
        throw new Error("CanvasDomSurfaceAdapter: rendererSpec.renderCanvas is required");
      }

      const requestFrame =
        typeof opts.requestAnimationFrame === "function"
          ? opts.requestAnimationFrame
          : typeof GLOBAL_ROOT.requestAnimationFrame === "function"
            ? GLOBAL_ROOT.requestAnimationFrame.bind(GLOBAL_ROOT)
            : function (/** @type {() => void} */ cb) {
                return GLOBAL_ROOT.setTimeout(cb, 16);
              };

      const cancelFrame =
        typeof opts.cancelAnimationFrame === "function"
          ? opts.cancelAnimationFrame
          : typeof GLOBAL_ROOT.cancelAnimationFrame === "function"
            ? GLOBAL_ROOT.cancelAnimationFrame.bind(GLOBAL_ROOT)
            : function (/** @type {number} */ handle) {
                GLOBAL_ROOT.clearTimeout(handle);
              };

      const ResizeObserverCtor = hasOwn.call(opts, "ResizeObserver") ? opts.ResizeObserver : GLOBAL_ROOT.ResizeObserver;

      if (typeof ResizeObserverCtor !== "function") {
        throw new Error("CanvasDomSurfaceAdapter: ResizeObserver is required");
      }

      const hostContext = hasOwn.call(opts, "hostContext") ? opts.hostContext : null;

      /** @type {Element | null} */
      let rootEl = null;
      /** @type {HTMLElement | null} */
      let shellEl = null;
      /** @type {HTMLElement | null} */
      let surfaceEl = null;
      /** @type {HTMLElement | null} */
      let mountEl = null;
      /** @type {HTMLCanvasElement | null} */
      let canvasEl = null;
      /** @type {ResizeObserver | null} */
      let observer = null;
      /** @type {number | null} */
      let rafHandle = null;

      /** @type {Record<string, unknown> | undefined} */
      let props = undefined;
      let revision = 0;
      let attached = false;
      let destroyed = false;
      let paintDirty = false;
      let sizeDirty = false;
      let consecutiveAnimateFrames = 0;

      function cancelPendingFrame() {
        if (rafHandle == null) {
          return;
        }
        cancelFrame(rafHandle);
        rafHandle = null;
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

      /** @param {unknown} reason */
      function markDirty(reason) {
        if (reason !== "animate") {
          consecutiveAnimateFrames = 0;
        }
        if (reason === "size") {
          sizeDirty = true;
          return;
        }
        paintDirty = true;
      }

      /** @param {HTMLElement | null} hostShellEl @returns {HTMLElement | null} */
      function findSurfaceElement(hostShellEl) {
        if (!hostShellEl) {
          return null;
        }
        const nestedFromChildren = findDescendantByClass(hostShellEl, "dyni-surface-canvas");
        if (nestedFromChildren) {
          return nestedFromChildren;
        }
        if (typeof hostShellEl.querySelector === "function") {
          const nestedSurfaceEl = /** @type {HTMLElement | null} */ (hostShellEl.querySelector(SURFACE_SELECTOR));
          if (nestedSurfaceEl) {
            return nestedSurfaceEl;
          }
        }
        if (hasClass(hostShellEl, "dyni-surface-canvas")) {
          return hostShellEl;
        }
        return null;
      }

      /** @param {HTMLElement} hostSurfaceEl @returns {HTMLElement | null} */
      function findMountElement(hostSurfaceEl) {
        if (hasClass(hostSurfaceEl, "dyni-surface-canvas-mount")) {
          return hostSurfaceEl;
        }
        if (typeof hostSurfaceEl.querySelector !== "function") {
          return null;
        }
        return /** @type {HTMLElement | null} */ (hostSurfaceEl.querySelector(MOUNT_SELECTOR));
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

      /** @returns {HTMLCanvasElement} */
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
        if (!surfaceEl || !mountEl || !canvasEl) {
          throw new Error("CanvasDomSurfaceAdapter: surface DOM references are required before styling");
        }
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

        let paintResult;
          if (hostContext) {
            paintResult = rendererSpec.renderCanvas.call(hostContext, canvasEl, props);
          } else {
            paintResult = rendererSpec.renderCanvas(canvasEl, props);
          }
        clearRenderFlags();
        if (paintResult && paintResult.wantsFollowUpFrame === true && consecutiveAnimateFrames < 600) {
          if (schedulePaint("animate")) {
            consecutiveAnimateFrames += 1;
          }
        }
      }

      /** @param {unknown} reason @returns {boolean} */
      function schedulePaint(reason) {
        if (!attached || destroyed || !canvasEl) {
          return false;
        }
        markDirty(reason);

        if (rafHandle != null) {
          return false;
        }

        rafHandle = requestFrame(function () {
          rafHandle = null;
          paintNow();
        });
        return true;
      }

      function bindResizeObserver() {
        const ResizeObserverClass = /** @type {typeof ResizeObserver} */ (ResizeObserverCtor);
        if (!surfaceEl) {
          throw new Error("CanvasDomSurfaceAdapter: surface element is required before observing resize");
        }
        observer = new ResizeObserverClass(function () {
          if (!attached || destroyed) {
            return;
          }
          schedulePaint("size");
        });
        observer.observe(surfaceEl);
      }

      /** @param {DyniCanvasSurfacePayload} payload */
      function setPayloadState(payload) {
        rootEl = payload.rootEl;
        shellEl = payload.shellEl;
        props = payload.props;
        revision = payload.revision;
      }

      /** @param {DyniCanvasSurfacePayload} payload */
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

      /** @param {DyniCanvasSurfacePayload} payload */
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

      /** @param {unknown} reason */
      function detach(reason) {
        cancelPendingFrame();
        disconnectObserver();
        removeCanvasNode();
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
      createSurfaceController: createSurfaceController
    };
  }

  runtime._createCanvasDomSurfaceAdapter = createCanvasDomSurfaceAdapter;
})(this);
