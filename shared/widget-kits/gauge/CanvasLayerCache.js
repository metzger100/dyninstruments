/**
 * Module: CanvasLayerCache - Shared offscreen canvas layer cache with explicit invalidation
 * Documentation: documentation/shared/canvas-layer-cache.md
 * Depends: Canvas ownerDocument.createElement("canvas"), CanvasRenderingContext2D
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCanvasLayerCache = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    function normalizeLayers(spec) {
      const source = spec && Array.isArray(spec.layers) ? spec.layers : null;
      if (!source || !source.length) {
        return ["layer"];
      }
      const out = [];
      const seen = Object.create(null);
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

    function keyToText(key) {
      if (typeof key === "string") {
        return key;
      }
      try {
        return JSON.stringify(key);
      } catch (e) {
        return String(key);
      }
    }

    function createLayer(canvas, width, height) {
      if (!canvas || !canvas.ownerDocument || typeof canvas.ownerDocument.createElement !== "function") {
        return null;
      }
      const layerCanvas = canvas.ownerDocument.createElement("canvas");
      layerCanvas.width = width;
      layerCanvas.height = height;
      const layerCtx = layerCanvas.getContext("2d");
      if (!layerCtx) {
        return null;
      }
      return { canvas: layerCanvas, ctx: layerCtx };
    }

    function resolveDrawSize(canvas, fallbackW, fallbackH) {
      let W = Number(canvas && canvas.clientWidth);
      let H = Number(canvas && canvas.clientHeight);
      if ((!isFinite(W) || W <= 0 || !isFinite(H) || H <= 0) && canvas && typeof canvas.getBoundingClientRect === "function") {
        const rect = canvas.getBoundingClientRect();
        W = Number(rect && rect.width);
        H = Number(rect && rect.height);
      }
      if (!isFinite(W) || W <= 0) {
        W = fallbackW;
      }
      if (!isFinite(H) || H <= 0) {
        H = fallbackH;
      }
      return { W: Math.max(1, Math.round(W)), H: Math.max(1, Math.round(H)) };
    }

    function createLayerCache(spec) {
      const layerNames = normalizeLayers(spec);
      const layers = Object.create(null);
      let lastKey = null;
      let dirty = true;
      let drawW = 0;
      let drawH = 0;
      let bufferW = 0;
      let bufferH = 0;

      function ensureLayer(canvas, key, rebuildFn) {
        if (!canvas || typeof rebuildFn !== "function") {
          return;
        }
        const nextBufferW = Math.max(1, Math.round(Number(canvas.width) || 0));
        const nextBufferH = Math.max(1, Math.round(Number(canvas.height) || 0));
        const drawSize = resolveDrawSize(canvas, nextBufferW, nextBufferH);
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
          const needsRecreate = !existing || !existing.canvas || !existing.ctx ||
            existing.canvas.width !== nextBufferW || existing.canvas.height !== nextBufferH;
          if (needsRecreate) {
            layers[layerName] = createLayer(canvas, nextBufferW, nextBufferH);
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

      function blit(targetCtx) {
        if (!targetCtx || typeof targetCtx.drawImage !== "function") {
          return;
        }
        const outW = Math.max(1, drawW || bufferW);
        const outH = Math.max(1, drawH || bufferH);
        for (let i = 0; i < layerNames.length; i++) {
          const layer = layers[layerNames[i]];
          if (!layer || !layer.canvas) {
            continue;
          }
          targetCtx.drawImage(layer.canvas, 0, 0, layer.canvas.width, layer.canvas.height, 0, 0, outW, outH);
        }
      }

      function invalidate() {
        dirty = true;
      }

      return { ensureLayer: ensureLayer, blit: blit, invalidate: invalidate };
    }

    return { id: "CanvasLayerCache", createLayerCache: createLayerCache };
  }

  return { id: "CanvasLayerCache", create: create };
}));
