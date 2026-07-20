/**
 * @file CanvasLayerCache - Shared offscreen canvas layer cache with explicit invalidation
 * Documentation: documentation/shared/canvas-layer-cache.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniCanvasLayerCache = factory();
  }
})(this, function () {
  "use strict";

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniCanvasLayerCacheApi}
   */
  function create(def, componentContext) {
    const keyToText = componentContext.components.require("ValueMath").keyToText;

    /** @param {unknown} spec @returns {string[]} */
    function normalizeLayers(spec) {
      const specObj = /** @type {{ layers?: unknown } | null | undefined} */ (spec);
      const source = specObj && Array.isArray(specObj.layers) ? specObj.layers : null;
      if (!source || !source.length) {
        return ["layer"];
      }
      const out = [];
      const seen = /** @type {Record<string, boolean>} */ (Object.create(null));
      for (let i = 0; i < source.length; i++) {
        const name = String(source[i] || "");
        if (!name || seen[name]) {
          continue;
        }
        seen[name] = true;
        out.push(name);
      }
      return out.length ? out : ["layer"];
    }

    /**
     * @param {unknown} canvas
     * @param {number} width
     * @param {number} height
     * @returns {DyniCanvasLayerCacheLayer | null}
     */
    function createLayer(canvas, width, height) {
      const canvasEl = /** @type {HTMLCanvasElement | null | undefined} */ (canvas);
      if (!canvasEl || !canvasEl.ownerDocument || typeof canvasEl.ownerDocument.createElement !== "function") {
        return null;
      }
      const layerCanvas = canvasEl.ownerDocument.createElement("canvas");
      layerCanvas.width = width;
      layerCanvas.height = height;
      const layerCtx = layerCanvas.getContext("2d");
      if (!layerCtx) {
        return null;
      }
      return { canvas: layerCanvas, ctx: layerCtx };
    }

    /**
     * @param {unknown} canvas
     * @param {number} defaultWidth
     * @param {number} defaultHeight
     * @returns {DyniCanvasLayerDrawSize}
     */
    function resolveDrawSize(canvas, defaultWidth, defaultHeight) {
      const canvasEl = /** @type {HTMLCanvasElement | null | undefined} */ (canvas);
      let W = Number(canvasEl && canvasEl.clientWidth);
      let H = Number(canvasEl && canvasEl.clientHeight);
      if (
        (!Number.isFinite(W) || W <= 0 || !Number.isFinite(H) || H <= 0) &&
        canvasEl &&
        typeof canvasEl.getBoundingClientRect === "function"
      ) {
        const rect = canvasEl.getBoundingClientRect();
        W = Number(rect && rect.width);
        H = Number(rect && rect.height);
      }
      if (!Number.isFinite(W) || W <= 0) {
        W = defaultWidth;
      }
      if (!Number.isFinite(H) || H <= 0) {
        H = defaultHeight;
      }
      return { W: Math.max(1, Math.round(W)), H: Math.max(1, Math.round(H)) };
    }

    /** @param {unknown} spec @returns {DyniCanvasLayerCacheInstance} */
    function createLayerCache(spec) {
      const layerNames = normalizeLayers(spec);
      const layers = /** @type {Record<string, DyniCanvasLayerCacheLayer | null | undefined>} */ (Object.create(null));
      /** @type {string | null | undefined} */
      let lastKey = null;
      let dirty = true;
      let drawW = 0;
      let drawH = 0;
      let bufferW = 0;
      let bufferH = 0;

      /** @param {unknown} canvas @param {unknown} key @param {unknown} rebuildFn @returns {void} */
      function ensureLayer(canvas, key, rebuildFn) {
        if (!canvas || typeof rebuildFn !== "function") {
          return;
        }
        const canvasEl = /** @type {HTMLCanvasElement} */ (canvas);
        const nextBufferW = Math.max(1, Math.round(Number(canvasEl.width) || 0));
        const nextBufferH = Math.max(1, Math.round(Number(canvasEl.height) || 0));
        const drawSize = resolveDrawSize(canvasEl, nextBufferW, nextBufferH);
        const keyText = keyToText(key);
        const keyChanged = keyText !== lastKey;
        let rebuiltAny = false;

        bufferW = nextBufferW;
        bufferH = nextBufferH;
        drawW = drawSize.W;
        drawH = drawSize.H;

        for (let i = 0; i < layerNames.length; i++) {
          const layerName = layerNames[i];
          const existing = layers[layerName];
          const needsRecreate =
            !existing ||
            !existing.canvas ||
            !existing.ctx ||
            existing.canvas.width !== nextBufferW ||
            existing.canvas.height !== nextBufferH;
          if (needsRecreate) {
            layers[layerName] = createLayer(canvasEl, nextBufferW, nextBufferH);
          }
          const layer = layers[layerName];
          if (!layer || !layer.ctx) {
            continue;
          }
          if (dirty || keyChanged || needsRecreate) {
            rebuildFn(layer.ctx, layerName, layer.canvas);
            rebuiltAny = true;
          }
        }

        if (rebuiltAny) {
          lastKey = keyText;
          dirty = false;
        }
      }

      /** @param {unknown} targetCtx @returns {void} */
      function blit(targetCtx) {
        const ctx = /** @type {CanvasRenderingContext2D | null | undefined} */ (targetCtx);
        if (!ctx || typeof ctx.drawImage !== "function") {
          return;
        }
        const outW = Math.max(1, drawW || bufferW);
        const outH = Math.max(1, drawH || bufferH);
        for (let i = 0; i < layerNames.length; i++) {
          const layer = layers[layerNames[i]];
          if (!layer || !layer.canvas) {
            continue;
          }
          ctx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, outW, outH);
        }
      }

      /** @param {unknown} targetCtx @param {unknown} layerName @returns {void} */
      function blitLayer(targetCtx, layerName) {
        const ctx = /** @type {CanvasRenderingContext2D | null | undefined} */ (targetCtx);
        if (!ctx || typeof ctx.drawImage !== "function") {
          return;
        }
        const layer = layers[String(layerName || "")];
        if (!layer || !layer.canvas) {
          return;
        }
        const outW = Math.max(1, drawW || bufferW);
        const outH = Math.max(1, drawH || bufferH);
        ctx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, outW, outH);
      }

      /** @returns {void} */
      function invalidate() {
        dirty = true;
      }

      return {
        ensureLayer: ensureLayer,
        blit: blit,
        blitLayer: blitLayer,
        invalidate: invalidate
      };
    }

    return { id: "CanvasLayerCache", createLayerCache: createLayerCache };
  }

  return { id: "CanvasLayerCache", create: create };
});
