/**
 * Module: FullCircleRadialEngine - Shared renderer pipeline for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 * Depends: RadialToolkit, CanvasLayerCache, FullCircleRadialLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
  // Engine-owned last-resort fallback for callers that omit threshold props.
  const DEFAULT_RATIO_DEFAULTS = { normal: 0.8, flat: 2.2 };
  const DEFAULT_LAYOUT = {};

  function fullCircleKeyToText(value) {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }
  function pickFinite(value, defaultValue) {
    const n = Number(value);
    return isFinite(n) ? n : defaultValue;
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

  function create(def, Helpers) {
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const layerCacheApi = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const layoutApi = Helpers.getModule("FullCircleRadialLayout").create(def, Helpers);
    const draw = GU.draw;
    const text = GU.text;
    const value = GU.value;
    const angle = GU.angle;

    const fullCircleCreateRenderer = function (spec) {
      const cfg = spec || {};
      const ratioProps = hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS;
      const ratioDefaults = hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS;
      const layers = fullCircleNormalizeLayers(cfg.cacheLayers);
      const layerCache = layerCacheApi.createLayerCache({ layers: layers });
      const layerCanvases = Object.create(null);
      const cacheMeta = Object.create(null);
      const layoutCfg = hasOwn.call(cfg, "layout") ? cfg.layout : DEFAULT_LAYOUT;

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const setup = Helpers.setupCanvas(canvas);
        const ctx = setup.ctx;
        const W = setup.W;
        const H = setup.H;
        if (!W || !H) {
          return;
        }

        const theme = GU.theme.resolveForRoot(Helpers.resolveWidgetRoot(canvas) || canvas);
        const valueWeight = theme.font.weight;
        const labelWeight = theme.font.labelWeight;

        ctx.clearRect(0, 0, W, H);
        const family = Helpers.resolveFontFamily(canvas);
        const color = Helpers.resolveTextColor(canvas);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const ratio = W / Math.max(1, H);
        const tNormal = value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : ratioDefaults.normal;
        const tFlat = value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : ratioDefaults.flat;
        const mode = layoutApi.computeMode(W, H, tNormal, tFlat);
        const insets = layoutApi.computeInsets(W, H);
        const layout = layoutApi.computeLayout({
          W: W,
          H: H,
          mode: mode,
          theme: theme,
          insets: insets,
          responsive: insets.responsive,
          layoutConfig: layoutCfg
        });
        const geom = layout.geom;
        const slots = layout.slots;
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
          pad: layout.pad,
          gap: layout.gap,
          ratio: ratio,
          layout: layout,
          responsive: layout.responsive,
          textFillScale: layout.textFillScale,
          compactGeometryScale: layout.compactGeometryScale,
          geom: geom,
          labels: layout.labels,
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
            labelInsetVal: layout.labels.radiusOffset,
            labelPx: layout.labels.fontPx,
            ringLineWidth: theme.radial.ring.arcLineWidth,
            ticksMajorLen: theme.radial.ticks.majorLen,
            ticksMajorWidth: theme.radial.ticks.majorWidth,
            ticksMinorLen: theme.radial.ticks.minorLen,
            ticksMinorWidth: theme.radial.ticks.minorWidth,
            pointerWidth: theme.radial.pointer.widthFactor,
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
              widthFactor: value.isFiniteNumber(options.widthFactor) ? options.widthFactor : state.theme.radial.pointer.widthFactor,
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

        const drawMode = hasOwn.call(cfg, "drawMode") ? cfg.drawMode : null;
        const modeRenderer = drawMode && drawMode[state.mode];
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
