/**
 * Module: FullCircleRadialEngine - Shared renderer pipeline for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 * Depends: RadialToolkit, CanvasLayerCache
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialEngine = factory(); }
}(this, function () {
  "use strict";
  function fullCircleKeyToText(value) {
    if (typeof value === "string") {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  function pickFinite(value, fallback) {
    const n = Number(value);
    return isFinite(n) ? n : fallback;
  }
  function fullCircleNormalizeLayers(raw) {
    const source = Array.isArray(raw) ? raw : null;
    if (!source || !source.length) {
      return ["layer"];
    }
    const out = [];
    const seen = Object.create(null);
    for (let i = 0; i < source.length; i++) {
      const layer = String(source[i] || "");
      if (!layer || seen[layer]) {
        continue;
      }
      seen[layer] = true;
      out.push(layer);
    }
    return out.length ? out : ["layer"];
  }

  function computeGeometry(W, H, pad, theme) {
    const D = Math.min(W - 2 * pad, H - 2 * pad);
    const R = Math.max(14, Math.floor(D / 2));
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);
    const ringW = Math.max(6, Math.floor(R * theme.radial.ring.widthFactor));
    const leftStrip = Math.max(0, Math.floor((W - 2 * pad - 2 * R) / 2));
    const topStrip = Math.max(0, Math.floor((H - 2 * pad - 2 * R) / 2));
    return {
      D: D,
      R: R,
      cx: cx,
      cy: cy,
      rOuter: R,
      ringW: ringW,
      needleDepth: Math.max(8, Math.floor(ringW * 0.9)),
      leftStrip: leftStrip,
      rightStrip: leftStrip,
      topStrip: topStrip,
      bottomStrip: topStrip,
      labelInsetVal: Math.max(18, Math.floor(ringW * theme.radial.labels.insetFactor)),
      labelPx: Math.max(10, Math.floor(R * theme.radial.labels.fontFactor))
    };
  }

  function computeSlots(mode, W, H, pad, geom, layoutCfg) {
    const cfg = layoutCfg || {};
    const slots = {
      leftTop: null,
      leftBottom: null,
      rightTop: null,
      rightBottom: null,
      top: null,
      bottom: null
    };
    if (mode === "flat") {
      const lh = 2 * geom.R;
      if (geom.leftStrip > 0) {
        slots.leftTop = {
          x: pad,
          y: geom.cy - geom.R,
          w: geom.leftStrip,
          h: Math.floor(lh / 2)
        };
        slots.leftBottom = {
          x: pad,
          y: geom.cy,
          w: geom.leftStrip,
          h: Math.floor(lh / 2)
        };
      }
      if (geom.rightStrip > 0) {
        const rightX = W - pad - geom.rightStrip;
        slots.rightTop = {
          x: rightX,
          y: geom.cy - geom.R,
          w: geom.rightStrip,
          h: Math.floor(lh / 2)
        };
        slots.rightBottom = {
          x: rightX,
          y: geom.cy,
          w: geom.rightStrip,
          h: Math.floor(lh / 2)
        };
      }
      return slots;
    }

    if (mode === "high") {
      const topFactor = pickFinite(cfg.highTopFactor, 0.85);
      const bottomFactor = pickFinite(cfg.highBottomFactor, 0.85);
      const availTop = pad + geom.topStrip;
      const availBottom = pad + geom.bottomStrip;
      const topHeight = Math.max(10, Math.floor(availTop * topFactor));
      const bottomHeight = Math.max(10, Math.floor(availBottom * bottomFactor));

      slots.top = {
        x: pad,
        y: pad,
        w: W - 2 * pad,
        h: topHeight
      };
      slots.bottom = {
        x: pad,
        y: H - pad - bottomHeight,
        w: W - 2 * pad,
        h: bottomHeight
      };
    }

    return slots;
  }

  function create(def, Helpers) {
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const layerCacheApi = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const draw = GU.draw;
    const text = GU.text;
    const value = GU.value;
    const angle = GU.angle;

    const fullCircleCreateRenderer = function (spec) {
      const cfg = spec || {};
      const ratioProps = cfg.ratioProps || { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
      const ratioDefaults = cfg.ratioDefaults || { normal: 0.8, flat: 2.2 };
      const layers = fullCircleNormalizeLayers(cfg.cacheLayers);
      const layerCache = layerCacheApi.createLayerCache({ layers: layers });
      const layerCanvases = Object.create(null);
      const cacheMeta = Object.create(null);
      const layoutCfg = cfg.layout || {};

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const setup = Helpers.setupCanvas(canvas);
        const ctx = setup.ctx;
        const W = setup.W;
        const H = setup.H;
        if (!W || !H) {
          return;
        }

        const theme = GU.theme.resolve(canvas);
        const valueWeight = theme.font.weight;
        const labelWeight = theme.font.labelWeight;

        ctx.clearRect(0, 0, W, H);
        const family = Helpers.resolveFontFamily(canvas);
        const color = Helpers.resolveTextColor(canvas);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const pad = value.computePad(W, H);
        const gap = value.computeGap(W, H);
        const ratio = W / Math.max(1, H);
        const tNormal = value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : ratioDefaults.normal;
        const tFlat = value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : ratioDefaults.flat;
        const mode = value.computeMode(ratio, tNormal, tFlat);

        const geom = computeGeometry(W, H, pad, theme);
        const slots = computeSlots(mode, W, H, pad, geom, layoutCfg);
        const bufferW = Math.max(1, Math.round(canvas.width || W));
        const bufferH = Math.max(1, Math.round(canvas.height || H));
        const dpr = Math.max(1, bufferW / Math.max(1, W));

        const state = {
          ctx: ctx,
          canvas: canvas,
          W: W,
          H: H,
          mode: mode,
          theme: theme,
          family: family,
          color: color,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          pad: pad,
          gap: gap,
          ratio: ratio,
          geom: geom,
          slots: slots,
          bufferW: bufferW,
          bufferH: bufferH,
          dpr: dpr,
          draw: draw,
          text: text,
          value: value,
          angle: angle
        };

        const staticKey = {
          engine: {
            bufferW: bufferW,
            bufferH: bufferH,
            W: W,
            H: H,
            dpr: dpr,
            cx: geom.cx,
            cy: geom.cy,
            rOuter: geom.rOuter,
            ringW: geom.ringW,
            labelInsetVal: geom.labelInsetVal,
            labelPx: geom.labelPx,
            ringLineWidth: theme.radial.ring.arcLineWidth,
            ticksMajorLen: theme.radial.ticks.majorLen,
            ticksMajorWidth: theme.radial.ticks.majorWidth,
            ticksMinorLen: theme.radial.ticks.minorLen,
            ticksMinorWidth: theme.radial.ticks.minorWidth,
            pointerSide: theme.radial.pointer.sideFactor,
            pointerLength: theme.radial.pointer.lengthFactor,
            family: family,
            labelWeight: labelWeight,
            color: color
          },
          widget: (typeof cfg.buildStaticKey === "function") ? cfg.buildStaticKey(state, p) : null
        };
        state.staticKey = fullCircleKeyToText(staticKey);

        const api = {
          drawFullCircleRing(targetCtx, opts) {
            const target = targetCtx || state.ctx;
            const options = opts || {};
            draw.drawRing(target, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              lineWidth: value.isFiniteNumber(options.lineWidth)
                ? options.lineWidth
                : state.theme.radial.ring.arcLineWidth
            });
          },
          drawFullCircleTicks(targetCtx, opts) {
            const target = targetCtx || state.ctx;
            const options = opts || {};
            draw.drawTicks(target, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              rotationDeg: pickFinite(options.rotationDeg, 0),
              startDeg: pickFinite(options.startDeg, 0),
              endDeg: pickFinite(options.endDeg, 360),
              stepMajor: pickFinite(options.stepMajor, 30),
              stepMinor: pickFinite(options.stepMinor, 10),
              includeEnd: !!options.includeEnd,
              major: {
                len: value.isFiniteNumber(options.majorLen) ? options.majorLen : state.theme.radial.ticks.majorLen,
                width: value.isFiniteNumber(options.majorWidth) ? options.majorWidth : state.theme.radial.ticks.majorWidth
              },
              minor: {
                len: value.isFiniteNumber(options.minorLen) ? options.minorLen : state.theme.radial.ticks.minorLen,
                width: value.isFiniteNumber(options.minorWidth) ? options.minorWidth : state.theme.radial.ticks.minorWidth
              }
            });
          },
          drawFixedPointer(targetCtx, angleDeg, opts) {
            const target = targetCtx || state.ctx;
            const options = opts || {};
            draw.drawPointerAtRim(target, state.geom.cx, state.geom.cy, state.geom.rOuter, pickFinite(angleDeg, 0), {
              depth: value.isFiniteNumber(options.depth) ? options.depth : state.geom.needleDepth,
              fillStyle: options.fillStyle || state.theme.colors.pointer,
              variant: options.variant || "long",
              sideFactor: value.isFiniteNumber(options.sideFactor) ? options.sideFactor : state.theme.radial.pointer.sideFactor,
              lengthFactor: value.isFiniteNumber(options.lengthFactor) ? options.lengthFactor : state.theme.radial.pointer.lengthFactor
            });
          },
          drawCachedLayer(layerName, opts) {
            const name = String(layerName || layers[0]);
            const layer = layerCanvases[name];
            if (!layer) {
              return;
            }
            const options = opts || {};
            const target = options.ctx || state.ctx;
            const rotationDeg = Number(options.rotationDeg);
            if (isFinite(rotationDeg) && rotationDeg !== 0) {
              target.save();
              target.translate(state.geom.cx, state.geom.cy);
              target.rotate((rotationDeg * Math.PI) / 180);
              target.translate(-state.geom.cx, -state.geom.cy);
              target.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, state.W, state.H);
              target.restore();
              return;
            }
            target.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, state.W, state.H);
          },
          getCacheMeta(key) {
            return cacheMeta[String(key || "")];
          },
          setCacheMeta(key, metaValue) {
            cacheMeta[String(key || "")] = metaValue;
            return metaValue;
          }
        };

        if (typeof cfg.rebuildLayer === "function") {
          layerCache.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
            layerCanvases[layerName] = layerCanvas;
            layerCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
            layerCtx.clearRect(0, 0, state.W, state.H);
            layerCtx.fillStyle = state.color;
            layerCtx.strokeStyle = state.color;
            cfg.rebuildLayer(layerCtx, layerName, state, p, api);
          });
        }

        if (typeof cfg.drawFrame === "function") {
          cfg.drawFrame(state, p, api);
        }
        else if (layerCanvases[layers[0]]) {
          api.drawCachedLayer(layers[0]);
        }

        const drawMode = cfg.drawMode || {};
        const modeRenderer = drawMode[state.mode];
        if (typeof modeRenderer === "function") {
          modeRenderer(state, p, api);
        }

        if (cfg.drawDisconnect !== false && p.disconnect) {
          text.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
        }
      };
    };

    return {
      id: "FullCircleRadialEngine",
      version: "0.1.0",
      createRenderer: fullCircleCreateRenderer
    };
  }

  return { id: "FullCircleRadialEngine", create: create };
}));
