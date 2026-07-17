/**
 * @file LinearGaugeEngine - Shared renderer pipeline for linear gauge widgets
 * Documentation: documentation/linear/linear-shared-api.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngine = factory();
  }
})(this, function () {
  "use strict";
  /** @typedef {DyniLinearGaugeTheme & { font: { family: string, familyMono?: string, weight: unknown, labelWeight: unknown }, surface: { fg: string }, strokeWeight: unknown, pointerDepthWeight: unknown, pointerSideWeight: unknown, linear: Record<string, unknown> }} DyniLinearEngineTheme */
  /** @typedef {DyniLinearRendererSpec & { buildStaticKey?: (state: DyniLinearGaugeDrawingState, props: DyniLinearGaugeProps) => unknown, formatDisplay?: DyniLinearFormatDisplay, buildSectors?: DyniLinearBuildSectors, resolveAxis?: (props: DyniLinearGaugeProps, range: DyniLinearRange, defaultAxis: DyniLinearRange, hooks?: Record<string, unknown>) => DyniLinearRange, buildTicks?: (axis: DyniLinearRange, majorStep: unknown, minorStep: unknown, props?: DyniLinearGaugeProps, hooks?: Record<string, unknown>) => DyniLinearTicks }} DyniLinearEngineConfig */
  /** @typedef {DyniComponentContext & { dom: { requirePluginRoot: (element: unknown) => Element } }} DyniLinearEngineContext */
  /** @typedef {DyniGaugeToolkitApi & { theme: { resolveForRoot: (rootEl: Element) => DyniLinearEngineTheme } }} DyniLinearGaugeFacade */
  const hasOwn = Object.prototype.hasOwnProperty;

  /** @param {unknown} def @param {DyniLinearEngineContext} componentContext */
  function create(def, componentContext) {
    const DEFAULT_AXIS_MODE = "range";
    const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
    // Engine-owned last-resort fallback for callers that omit threshold props.
    const DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 };
    const DEFAULT_RANGE_DEFAULTS = { min: 0, max: 30 };
    const DEFAULT_RANGE_PROPS = { min: "minValue", max: "maxValue" };
    const DEFAULT_TICK_PROPS = { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
    const DEFAULT_TICK_PRESET = { major: 10, minor: 2 };
    const GU = /** @type {DyniLinearGaugeFacade} */ (componentContext.components.require("GaugeToolkit"));
    const layerCacheApi = /** @type {DyniCanvasLayerCacheApi} */ (componentContext.components.require("CanvasLayerCache"));
    const primitives = componentContext.components.require("LinearCanvasPrimitives");
    const drawing = componentContext.components.require("LinearGaugeEngineDrawing");
    const math = componentContext.components.require("LinearGaugeMath");
    const layoutApi = componentContext.components.require("LinearGaugeLayout");
    const textLayout = componentContext.components.require("LinearGaugeTextLayout");
    const engineSupport = componentContext.components.require("LinearGaugeEngineSupport");
    const scaleHelpers = componentContext.components.require("TextLayoutScaleHelpers");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const text = GU.text;
    const value = GU.value;

    /** @param {DyniRect | null | undefined} box @param {unknown} secScale @returns {{ captionBox: DyniRect | null | undefined, valueBox: DyniRect | null | undefined } | null} */
    function splitTextBoxRows(box, secScale) {
      if (!box) {
        return null;
      }
      const captionSeedHeight = Math.max(1, Math.floor(Number(box.h) / 2));
      return layoutApi.splitCaptionValueRows(
        { x: box.x, y: box.y, w: box.w, h: captionSeedHeight },
        { x: box.x, y: box.y + captionSeedHeight, w: box.w, h: Math.max(1, box.h - captionSeedHeight) },
        secScale
      );
    }

    /** @param {DyniLinearEngineConfig | undefined} spec @returns {DyniLinearRenderCanvas} */
    function createRenderer(spec) {
      const cfg = /** @type {DyniLinearEngineConfig} */ (spec || {});
      const axisMode = /** @type {string} */ (hasOwn.call(cfg, "axisMode") ? cfg.axisMode : DEFAULT_AXIS_MODE);
      const ratioProps = /** @type {{ normal: string, flat: string }} */ (
        hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS
      );
      const ratioDefaults = /** @type {{ normal: number, flat: number }} */ (
        hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS
      );
      const rangeDefaults = /** @type {DyniLinearRange} */ (
        hasOwn.call(cfg, "rangeDefaults") ? cfg.rangeDefaults : DEFAULT_RANGE_DEFAULTS
      );
      const rangeProps = /** @type {{ min: string, max: string }} */ (
        hasOwn.call(cfg, "rangeProps") ? cfg.rangeProps : DEFAULT_RANGE_PROPS
      );
      const tickProps = /** @type {{ major: string, minor: string, showEndLabels: string }} */ (
        hasOwn.call(cfg, "tickProps") ? cfg.tickProps : DEFAULT_TICK_PROPS
      );
      const unitDefault = hasOwn.call(cfg, "unitDefault") ? cfg.unitDefault : "";
      const springTarget = cfg.springTarget === "axis" ? "axis" : "pointer";
      const springWrap = Number(cfg.springWrap);
      const springMotion = componentContext.components.require("SpringEasing").createMotion(Number.isFinite(springWrap) ? { wrap: springWrap } : {});
      const layoutCfg = hasOwn.call(cfg, "layout") ? cfg.layout : null;
      const resolveAxisFn = typeof cfg.resolveAxis === "function" ? cfg.resolveAxis : null;
      const buildTicksFn = typeof cfg.buildTicks === "function" ? cfg.buildTicks : null;
      const buildSectorsFn = typeof cfg.buildSectors === "function"
        ? cfg.buildSectors
        : function () {
          return [];
        };
      const tickSteps = typeof cfg.tickSteps === "function"
        ? cfg.tickSteps
        : function () {
          return DEFAULT_TICK_PRESET;
        };
      const hideTextualMetricsProp =
        typeof cfg.hideTextualMetricsProp === "string" && cfg.hideTextualMetricsProp ? cfg.hideTextualMetricsProp : "";
      const labelEdgePolicy = engineSupport.resolveLabelEdgePolicy(cfg);
      const formatDisplayFn = /** @type {DyniLinearFormatDisplay | undefined} */ (cfg.formatDisplay);
      const formatDisplay = typeof formatDisplayFn === "function"
        ? /** @type {DyniLinearFormatDisplay} */ (function (rawValue, props, unitText) {
          return formatDisplayFn(rawValue, props, unitText, componentContext);
        })
        : /** @type {DyniLinearFormatDisplay} */ (function (rawValue) {
          const numericRaw = value.toOptionalFiniteNumber(rawValue);
          if (typeof numericRaw !== "number") return { num: NaN, text: "" };
          return { num: numericRaw, text: String(rawValue) };
        });
      const layerCache = layerCacheApi.createLayerCache({ layers: ["back", "front"] });

      /** @param {HTMLCanvasElement} canvas @param {DyniLinearGaugeProps} props */
      /** @param {unknown} canvas @param {DyniLinearGaugeProps} props @returns {DyniLinearRenderResult} */
      return function renderCanvas(canvas, props) {
        const p = /** @type {DyniLinearGaugeProps} */ (props || {});
        const canvasElement = /** @type {HTMLCanvasElement} */ (canvas);
        const surface = GU.resolveSurface(canvas);
        if (!surface) {
          return;
        }

        const ctx = surface.ctx;
        const W = surface.W;
        const H = surface.H;
        const rootEl = componentContext.dom.requirePluginRoot(canvas);
        const theme = /** @type {DyniLinearEngineTheme} */ (GU.theme.resolveForRoot(rootEl));
        const stableDigitsEnabled = p.stableDigits === true;
        const family = stableDigitsEnabled ? theme.font.familyMono || theme.font.family : theme.font.family;
        const color = theme.surface.fg;
        const labelWeight = theme.font.labelWeight;
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
        const hideTextualMetrics = p.hideTextualMetrics === true || (hideTextualMetricsProp && p[hideTextualMetricsProp] === true);
        const mode = layoutApi.computeMode(
          W,
          H,
          value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : ratioDefaults.normal,
          value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : ratioDefaults.flat
        );
        const insets = layoutApi.computeInsets(W, H);
        const layout = layoutApi.computeLayout({
          W: W,
          H: H,
          theme: theme,
          mode: mode,
          gap: insets.gap,
          hideTextualMetrics: hideTextualMetrics,
          contentRect: layoutApi.createContentRect(W, H, insets),
          responsive: insets.responsive,
          layoutConfig: layoutCfg
        });
        const textFillScale = scaleHelpers.resolveTextFillScale(layout.responsive);
        const range = value.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        let raw = p.value;
        if (typeof raw === "undefined" && cfg.rawValueKey) {
          raw = p[cfg.rawValueKey];
        }
        const unit = hasOwn.call(p, "unit") ? p.unit : unitDefault;
        const display = formatDisplay(raw, p, unit);
        const easingEnabled = p.easing !== false;
        const nowMs = Date.now();
        const easedDisplayNum = springMotion.resolve(canvasElement, display.num, easingEnabled, nowMs);
        const axisProps = springTarget === "axis" ? Object.assign({}, p) : p;
        if (springTarget === "axis") {
          if (cfg.rawValueKey && cfg.rawValueKey !== "value") {
            axisProps[cfg.rawValueKey] = easedDisplayNum;
          }
          axisProps.value = easedDisplayNum;
        }
        const hookApiBase = {
          primitives: primitives,
          math: math,
          textLayout: textLayout,
          text: text,
          value: value,
          theme: theme
        };
        const defaultAxis = math.resolveAxisDomain(axisMode, range);
        const axis = resolveAxisFn ? resolveAxisFn(axisProps, range, defaultAxis, hookApiBase) : defaultAxis;
        const valueRawText = /** @type {string} */ (display.text).trim() || p.default;
        const valueText = stableDigitsEnabled
          ? stableDigits.normalize(valueRawText, {
              integerWidth: stableDigits.resolveIntegerWidth(valueRawText, 2, axis.max),
              reserveSignSlot: true
            }).padded
          : valueRawText;
        const secScale = value.clamp(p.captionUnitScale, 0.3, 3.0);
        const rowBoxes = /** @type {{ captionBox: DyniRect | null | undefined, valueBox: DyniRect | null | undefined, top: { captionBox: DyniRect | null | undefined, valueBox: DyniRect | null | undefined } | null, bottom: { captionBox: DyniRect | null | undefined, valueBox: DyniRect | null | undefined } | null }} */ ({
            captionBox: null,
            valueBox: null,
            top: null,
            bottom: null
          });
        if (layout.captionBox && layout.valueBox) {
          const primaryRows = layoutApi.splitCaptionValueRows(layout.captionBox, layout.valueBox, secScale);
          rowBoxes.captionBox = primaryRows.captionBox;
          rowBoxes.valueBox = primaryRows.valueBox;
        }
        if (layout.textTopBox) {
          rowBoxes.top = splitTextBoxRows(layout.textTopBox, secScale);
        }
        if (layout.textBottomBox) {
          rowBoxes.bottom = splitTextBoxRows(layout.textBottomBox, secScale);
        }
        const tickPreset = tickSteps(axis.max - axis.min);
        const tickMajor = value.isFiniteNumber(p[tickProps.major]) ? p[tickProps.major] : tickPreset.major;
        const tickMinor = value.isFiniteNumber(p[tickProps.minor]) ? p[tickProps.minor] : tickPreset.minor;
        const showEndLabels = !!p[tickProps.showEndLabels];
        const ticks = buildTicksFn
          ? buildTicksFn(axis, tickMajor, tickMinor, p, hookApiBase)
          : math.buildTicks(axis.min, axis.max, tickMajor, tickMinor);
        const sectors = buildSectorsFn(p, range.min, range.max, axis, value, theme);
        const trackThickness = layout.trackThickness;
        const pointerDepthBase = layout.pointerDepth;
        const markerSizeBase = layout.pointerDepth;
        const sectorBandY = layout.trackY - trackThickness / 2 - Math.max(1, Math.ceil(layout.trackLineWidth / 2));
        const labelFontPx = layout.labelFontPx;
        const labelInsetPx = layout.labelInsetPx;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const state = {
          ctx: ctx,
          canvas: canvasElement,
          nowMs: nowMs,
          W: W,
          H: H,
          mode: layout.mode,
          axisMode: axisMode,
          layout: layout,
          responsive: layout.responsive,
          textFillScale: textFillScale,
          theme: theme,
          family: family,
          color: color,
          valueWeight: theme.font.weight,
          labelWeight: theme.font.labelWeight,
          axis: axis,
          primitives: primitives,
          math: math,
          textLayout: textLayout,
          trackThickness: trackThickness,
          sectorBandY: sectorBandY,
          labelFontPx: labelFontPx,
          labelInsetPx: labelInsetPx,
          labelEdgePolicy: labelEdgePolicy,
          mapValueToX: /** @param {unknown} valueNum @param {boolean} [doClamp] @returns {number} */ function (valueNum, doClamp) {
            return math.mapValueToX(valueNum, axis.min, axis.max, layout.scaleX0, layout.scaleX1, doClamp);
          }
        };
        const hookApi = {
          primitives: primitives,
          math: math,
          textLayout: textLayout,
          text: text,
          value: value,
          theme: theme,
          mapValueToX:
            /** @param {unknown} valueNum @param {DyniLinearRange | undefined} axisOverride @param {boolean} [doClamp] @returns {number} */ function (
              valueNum,
              axisOverride,
              doClamp
            ) {
              const refAxis = axisOverride || axis;
              return math.mapValueToX(valueNum, refAxis.min, refAxis.max, layout.scaleX0, layout.scaleX1, doClamp);
            }
        };
        const displayState = {
          raw: raw,
          num: display.num,
          easedNum: easedDisplayNum,
          text: valueText,
          unit: unit,
          caption: p.caption,
          secScale: secScale,
          rowBoxes: rowBoxes,
          parsed: display
        };
        const formatTickLabelFn = /** @type {((tickValue: unknown, state: DyniLinearGaugeDrawingState, props: DyniLinearGaugeProps, hooks: Record<string, unknown>) => string) | undefined} */ (cfg.formatTickLabel);
        const tickLabelFormatter = typeof formatTickLabelFn === "function"
          ? /** @param {unknown} tickValue @param {DyniLinearGaugeDrawingState} tickState */ function (tickValue, tickState) {
            return formatTickLabelFn(tickValue, tickState || state, p, hookApi);
          }
          : null;
        const staticKey = engineSupport.buildStaticKey(math, state, {
          tickMajor: tickMajor,
          tickMinor: tickMinor,
          showEndLabels: showEndLabels,
          labelEdgePolicy: labelEdgePolicy,
          sectors: sectors,
          widget: typeof cfg.buildStaticKey === "function" ? cfg.buildStaticKey(state, p) : null
        });

        layerCache.ensureLayer(canvas, staticKey, function (layerCtx, layerName) {
          layerCtx.setTransform(1, 0, 0, 1, 0, 0);
          layerCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          layerCtx.setTransform(canvasElement.width / Math.max(1, W), 0, 0, canvasElement.height / Math.max(1, H), 0, 0);
          layerCtx.fillStyle = color;
          layerCtx.strokeStyle = color;
          if (layerName === "back") {
            drawing.drawStaticBack(layerCtx, state, sectors);
            return;
          }
          drawing.drawStaticFront(layerCtx, state, ticks, showEndLabels, tickLabelFormatter);
        });
        layerCache.blitLayer(ctx, "back");

        const drawApi = {
          drawDefaultPointer: /** @param {DyniLinearDrawOptions} [opts] */ function (opts) {
            drawing.drawPointerAtValue(
              ctx,
              state,
              layout,
              theme,
              primitives,
              state.mapValueToX,
              easedDisplayNum,
              pointerDepthBase,
              markerSizeBase,
              opts
            );
          },
          drawPointerAtValue: /** @param {unknown} valueNum @param {DyniLinearDrawOptions} [opts] */ function (valueNum, opts) {
            drawing.drawPointerAtValue(
              ctx,
              state,
              layout,
              theme,
              primitives,
              state.mapValueToX,
              valueNum,
              pointerDepthBase,
              markerSizeBase,
              opts
            );
          },
          drawMarkerAtValue: /** @param {unknown} valueNum @param {DyniLinearDrawOptions} [opts] */ function (valueNum, opts) {
            drawing.drawMarkerAtValue(
              ctx,
              state,
              layout,
              theme,
              primitives,
              state.mapValueToX,
              valueNum,
              markerSizeBase,
              opts
            );
          }
        };
        let drawResult = null;
        if (typeof cfg.drawFrame === "function")
          drawResult = cfg.drawFrame(
            state,
            p,
            /** @type {DyniLinearRichDisplay} */ (/** @type {unknown} */ (displayState)),
            Object.assign({}, hookApi, drawApi)
          );
        else drawApi.drawDefaultPointer();

        layerCache.blitLayer(ctx, "front");

        const modeKey = /** @type {"flat" | "normal" | "high"} */ (state.mode);
        const modeRenderer = cfg.drawMode && cfg.drawMode[modeKey];
        let modeResult = null;
        if (typeof modeRenderer === "function") {
          modeResult = modeRenderer(state, p, /** @type {DyniLinearRichDisplay} */ (/** @type {unknown} */ (displayState)), Object.assign({}, hookApi, drawApi));
        } else if (state.mode === "high") {
          textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "center");
          textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "center");
        } else if (state.mode === "normal") {
          textLayout.drawInlineRow(state, text, displayState.caption, valueText, unit, state.layout.inlineBox, secScale);
        } else {
          textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "right");
          textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "right");
        }

        if (
          (drawResult && drawResult.wantsFollowUpFrame === true) ||
          (modeResult && modeResult.wantsFollowUpFrame === true) ||
          springMotion.isActive(canvasElement)
        ) {
          return { wantsFollowUpFrame: true };
        }
      };
    }

    return { id: "LinearGaugeEngine", createRenderer: createRenderer };
  }

  return { id: "LinearGaugeEngine", create: create };
});
