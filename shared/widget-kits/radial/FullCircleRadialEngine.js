/**
 * @file FullCircleRadialEngine - Shared renderer pipeline for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialEngine = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
  // Engine-owned last-resort fallback for callers that omit threshold props.
  const DEFAULT_RATIO_DEFAULTS = { normal: 0.8, flat: 2.2 };
  const DEFAULT_LAYOUT = {};

  /** @param {unknown} value @returns {string} */
  function fullCircleKeyToText(value) {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }
  /** @param {unknown} raw @returns {string[]} */
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

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniFullCircleRadialEngineApi}
   */
  function create(def, componentContext) {
    const GU = componentContext.components.require("RadialToolkit");
    const layerCacheApi = componentContext.components.require("CanvasLayerCache");
    const layoutApi = componentContext.components.require("FullCircleRadialLayout");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const draw = GU.draw;
    const text = GU.text;
    const value = GU.value;
    const angle = GU.angle;

    /**
     * @param {DyniFullCircleRendererSpec | undefined} spec
     * @returns {DyniRadialRenderCanvas}
     */
    const fullCircleCreateRenderer = function (spec) {
      const cfg = spec || {};
      const ratioProps = /** @type {{ normal: string, flat: string }} */ (
        hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS
      );
      const ratioDefaults = /** @type {{ normal: number, flat: number }} */ (
        hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS
      );
      const hideTextualMetricsProp = typeof cfg.hideTextualMetricsProp === "string" && cfg.hideTextualMetricsProp
        ? cfg.hideTextualMetricsProp
        : null;
      const layers = fullCircleNormalizeLayers(cfg.cacheLayers);
      const layerCache = layerCacheApi.createLayerCache({ layers: layers });
      /** @type {Record<string, HTMLCanvasElement>} */
      const layerCanvases = Object.create(null);
      /** @type {Record<string, unknown>} */
      const cacheMeta = Object.create(null);
      const layoutCfg = /** @type {DyniRadialConfigMap} */ (
        hasOwn.call(cfg, "layout") ? cfg.layout : DEFAULT_LAYOUT
      );

      /**
       * @param {unknown} canvas
       * @param {unknown} props
       * @returns {{ wantsFollowUpFrame: boolean } | undefined}
       */
      return function renderCanvas(canvas, props) {
        const p = /** @type {Record<string, unknown>} */ (props || {});
        const setup = /** @type {DyniCanvasSurface} */ (
          (/** @type {DyniCanvasHostApi} */ (componentContext.canvas)).setupCanvas(canvas)
        );
        const ctx = setup.ctx;
        const W = setup.W;
        const H = setup.H;
        if (!W || !H) {
          return;
        }

        const rootEl = componentContext.dom.requirePluginRoot(canvas);
        const theme = (/** @type {DyniGaugeThemeResolver} */ (/** @type {unknown} */ (GU.theme))).resolveForRoot(rootEl);
        const valueWeight = theme.font.weight;
        const labelWeight = theme.font.labelWeight;
        const family = p.stableDigits === true
          ? (theme.font.familyMono || theme.font.family)
          : theme.font.family;
        const color = theme.surface.fg;
        const hideTextualMetrics = hideTextualMetricsProp ? p[hideTextualMetricsProp] === true : false;
        const stateKind = stateScreenPrecedence.pickFirst([{ kind: "disconnected", when: p.disconnect === true }, { kind: "data", when: true }]);

        ctx.clearRect(0, 0, W, H);
        if (stateKind !== stateScreenLabels.KINDS.DATA) {
          stateScreenCanvasOverlay.drawStateScreen({
            ctx: ctx,
            W: W,
            H: H,
            family: family,
            color: color,
            labelWeight: labelWeight,
            kind: stateKind
          });
          return;
        }
        ctx.fillStyle = /** @type {string} */ (color);
        ctx.strokeStyle = /** @type {string} */ (color);

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
        const canvasEl = /** @type {HTMLCanvasElement} */ (canvas);
        const bufferW = Math.max(1, Math.round(canvasEl.width || W));
        const bufferH = Math.max(1, Math.round(canvasEl.height || H));
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
          geom: geom,
          labels: layout.labels,
          slots: slots,
          bufferW: bufferW,
          bufferH: bufferH,
          dpr: dpr,
          draw: draw,
          text: text,
          value: value,
          angle: angle,
          staticKey: ""
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
            majorTickLen: geom.majorTickLen,
            majorTickWidth: geom.majorTickWidth,
            minorTickLen: geom.minorTickLen,
            minorTickWidth: geom.minorTickWidth,
            arcLineWidth: geom.arcLineWidth,
            pointerDepth: geom.pointerDepth,
            pointerSide: geom.pointerSide,
            fixedPointerDepth: geom.fixedPointerDepth,
            markerLen: geom.markerLen,
            markerWidth: geom.markerWidth,
            labelInsetVal: layout.labels.radiusOffset,
            labelPx: layout.labels.fontPx,
            family: family,
            labelWeight: labelWeight,
            color: color
          },
          widget: (typeof cfg.buildStaticKey === "function") ? cfg.buildStaticKey(state, p) : null
        };
        state.staticKey = fullCircleKeyToText(staticKey);

        const api = {
          /** @param {CanvasRenderingContext2D} [targetCtx] @returns {void} */
          drawFullCircleRing(targetCtx) {
            const target = /** @type {CanvasRenderingContext2D} */ (targetCtx || state.ctx);
            draw.drawRing(target, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              lineWidth: state.geom.arcLineWidth
            });
          },
          /** @param {CanvasRenderingContext2D} [targetCtx] @param {DyniRadialDrawOptions} [opts] @returns {void} */
          drawFullCircleTicks(targetCtx, opts) {
            const target = /** @type {CanvasRenderingContext2D} */ (targetCtx || state.ctx);
            const options = opts || {};
            draw.drawTicks(target, state.geom.cx, state.geom.cy, state.geom.rOuter, {
              rotationDeg: value.resolveFiniteNumber(options.rotationDeg, 0),
              startDeg: value.resolveFiniteNumber(options.startDeg, 0),
              endDeg: value.resolveFiniteNumber(options.endDeg, 360),
              stepMajor: value.resolveFiniteNumber(options.stepMajor, 30),
              stepMinor: value.resolveFiniteNumber(options.stepMinor, 10),
              includeEnd: !!options.includeEnd,
              major: {
                len: state.geom.majorTickLen,
                width: state.geom.majorTickWidth
              },
              minor: {
                len: state.geom.minorTickLen,
                width: state.geom.minorTickWidth
              }
            });
          },
          /**
           * @param {CanvasRenderingContext2D} [targetCtx]
           * @param {unknown} [angleDeg]
           * @param {DyniRadialDrawOptions} [opts]
           * @returns {void}
           */
          drawFixedPointer(targetCtx, angleDeg, opts) {
            const target = /** @type {CanvasRenderingContext2D} */ (targetCtx || state.ctx);
            draw.drawPointerAtRim(target, state.geom.cx, state.geom.cy, state.geom.rOuter, value.resolveFiniteNumber(angleDeg, 0), {
              depth: state.geom.fixedPointerDepth,
              halfWidth: Math.max(1, Math.floor(state.geom.pointerSide / 2)),
              fillStyle: (opts && opts.fillStyle) || state.theme.colors.pointer
            });
          },
          /** @param {unknown} layerName @param {DyniRadialDrawOptions} [opts] @returns {void} */
          drawCachedLayer(layerName, opts) {
            const name = String(layerName || layers[0]);
            const layer = layerCanvases[name];
            if (!layer) {
              return;
            }
            const options = opts || {};
            const target = /** @type {CanvasRenderingContext2D} */ (options.ctx || state.ctx);
            const rotationDeg = Number(options.rotationDeg);
            if (Number.isFinite(rotationDeg) && rotationDeg !== 0) {
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
          /** @param {unknown} key @returns {unknown} */
          getCacheMeta(key) {
            return cacheMeta[String(key || "")];
          },
          /** @param {unknown} key @param {unknown} metaValue @returns {unknown} */
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
            layerCtx.fillStyle = /** @type {string} */ (state.color);
            layerCtx.strokeStyle = /** @type {string} */ (state.color);
            (/** @type {Function} */ (cfg.rebuildLayer))(layerCtx, layerName, state, p, api);
          });
        }

        let drawResult = null;
        if (typeof cfg.drawFrame === "function") {
          drawResult = cfg.drawFrame(state, p, api);
        }
        else if (layerCanvases[layers[0]]) {
          api.drawCachedLayer(layers[0]);
        }

        const drawMode = /** @type {Record<string, unknown> | null} */ (
          hasOwn.call(cfg, "drawMode") ? cfg.drawMode : null
        );
        const modeRenderer = drawMode && drawMode[state.mode];
        let modeResult = null;
        if (!hideTextualMetrics && typeof modeRenderer === "function") {
          modeResult = modeRenderer(state, p, api);
        }
        if ((drawResult && drawResult.wantsFollowUpFrame === true) || (modeResult && modeResult.wantsFollowUpFrame === true)) {
          return { wantsFollowUpFrame: true };
        }

      };
    };

    return {
      id: "FullCircleRadialEngine",
      createRenderer: fullCircleCreateRenderer
    };
  }

  return { id: "FullCircleRadialEngine", create: create };
}));
