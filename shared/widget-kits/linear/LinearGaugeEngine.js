/**
 * Module: LinearGaugeEngine - Shared renderer pipeline for linear gauge widgets
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: RadialToolkit, CanvasLayerCache, LinearCanvasPrimitives, LinearGaugeMath, LinearGaugeLayout, LinearGaugeTextLayout
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const DEFAULT_AXIS_MODE = "range";
    const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
    // Engine-owned last-resort fallback for callers that omit threshold props.
    const DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 };
    const DEFAULT_RANGE_DEFAULTS = { min: 0, max: 30 };
    const DEFAULT_RANGE_PROPS = { min: "minValue", max: "maxValue" };
    const DEFAULT_TICK_PROPS = { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
    const DEFAULT_TICK_PRESET = { major: 10, minor: 2 };
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const layerCacheApi = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const primitives = Helpers.getModule("LinearCanvasPrimitives").create(def, Helpers);
    const math = Helpers.getModule("LinearGaugeMath").create(def, Helpers);
    const layoutApi = Helpers.getModule("LinearGaugeLayout").create(def, Helpers);
    const textLayout = Helpers.getModule("LinearGaugeTextLayout").create(def, Helpers);
    const text = GU.text;
    const value = GU.value;

    function resolveSurface(canvas) {
      const setup = Helpers.setupCanvas(canvas);
      return setup && setup.W && setup.H && setup.ctx ? setup : null;
    }

    function resolveTextFillScale(responsive) {
      const scale = Number(responsive && responsive.textFillScale);
      return Number.isFinite(scale) && scale > 0 ? scale : 1;
    }

    function resolveCompactGeometryScale(textFillScale) {
      return Math.max(0.5, 1 - Math.max(0, textFillScale - 1));
    }

    function drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors, labelFormatter) {
      const theme = state.theme;
      const mapValueToX = state.mapValueToX;
      const majorStyle = { lineWidth: theme.linear.ticks.majorWidth, strokeStyle: state.color };
      const minorStyle = { lineWidth: theme.linear.ticks.minorWidth, strokeStyle: state.color };

      primitives.drawTrack(layerCtx, state.layout.scaleX0, state.layout.scaleX1, state.layout.trackY, {
        lineWidth: theme.linear.track.lineWidth,
        strokeStyle: state.color
      });

      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        if (!sector) continue;
        const from = Number(sector.from);
        const to = Number(sector.to);
        if (!isFinite(from) || !isFinite(to) || to <= from) continue;
        const x0 = mapValueToX(from, true);
        const x1 = mapValueToX(to, true);
        if (!isFinite(x0) || !isFinite(x1) || Math.abs(x1 - x0) <= 1) continue;
        primitives.drawBand(layerCtx, x0, x1, state.sectorBandY, state.trackThickness, { fillStyle: sector.color });
      }

      for (let i = 0; i < ticks.minor.length; i++) {
        const x = mapValueToX(ticks.minor[i], true);
        if (isFinite(x)) primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, theme.linear.ticks.minorLen, minorStyle);
      }
      for (let i = 0; i < ticks.major.length; i++) {
        const x = mapValueToX(ticks.major[i], true);
        if (isFinite(x)) primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, theme.linear.ticks.majorLen, majorStyle);
      }

      textLayout.drawTickLabels(layerCtx, state, ticks, showEndLabels, math, labelFormatter);
    }

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

    function createRenderer(spec) {
      const cfg = spec || {};
      const axisMode = hasOwn.call(cfg, "axisMode") ? cfg.axisMode : DEFAULT_AXIS_MODE;
      const ratioProps = hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS;
      const ratioDefaults = hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS;
      const rangeDefaults = hasOwn.call(cfg, "rangeDefaults") ? cfg.rangeDefaults : DEFAULT_RANGE_DEFAULTS;
      const rangeProps = hasOwn.call(cfg, "rangeProps") ? cfg.rangeProps : DEFAULT_RANGE_PROPS;
      const tickProps = hasOwn.call(cfg, "tickProps") ? cfg.tickProps : DEFAULT_TICK_PROPS;
      const unitDefault = hasOwn.call(cfg, "unitDefault") ? cfg.unitDefault : "";
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
      const formatDisplay = typeof cfg.formatDisplay === "function"
        ? function (rawValue, props, unitText) {
          return cfg.formatDisplay(rawValue, props, unitText, Helpers);
        }
        : function (rawValue) {
          return { num: Number(rawValue), text: String(rawValue) };
        };
      const layerCache = layerCacheApi.createLayerCache({ layers: ["base"] });

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const surface = resolveSurface(canvas);
        if (!surface) {
          return;
        }

        const ctx = surface.ctx;
        const W = surface.W;
        const H = surface.H;
        const theme = GU.theme.resolve(canvas);
        const family = Helpers.resolveFontFamily(canvas);
        const color = Helpers.resolveTextColor(canvas);
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
          contentRect: layoutApi.createContentRect(W, H, insets),
          responsive: insets.responsive,
          layoutConfig: layoutCfg
        });
        const textFillScale = resolveTextFillScale(layout.responsive);
        const compactGeometryScale = resolveCompactGeometryScale(textFillScale);
        const range = value.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        const hookApiBase = { primitives: primitives, math: math, textLayout: textLayout, text: text, value: value, theme: theme };
        const defaultAxis = math.resolveAxisDomain(axisMode, range);
        const axis = resolveAxisFn ? resolveAxisFn(p, range, defaultAxis, hookApiBase) : defaultAxis;
        const raw = (typeof p.value !== "undefined") ? p.value : p[cfg.rawValueKey];
        const unit = String(hasOwn.call(p, "unit") ? p.unit : unitDefault).trim();
        const display = formatDisplay(raw, p, unit);
        const valueText = display.text.trim() || p.default;
        const secScale = value.clamp(p.captionUnitScale, 0.3, 3.0);
        const rowBoxes = {
          captionBox: null,
          valueBox: null,
          top: null,
          bottom: null
        };
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
        const trackThickness = math.clamp(
          Math.max(1, Math.floor(layout.trackBox.h * theme.linear.track.widthFactor * compactGeometryScale)),
          1,
          Math.max(1, Math.floor(theme.linear.ticks.majorLen * 1.6))
        );
        const pointerDepthBase = Math.max(1, Math.floor(layout.trackBox.h * 0.12 * compactGeometryScale));
        const markerSizeBase = Math.max(1, Math.floor(layout.trackBox.h * 0.12 * compactGeometryScale));
        const sectorBandY = layout.trackY - (trackThickness / 2) - Math.max(1, Math.ceil(theme.linear.track.lineWidth / 2));
        const labelBoost = textLayout.resolveLabelBoost(layout.mode);
        const labelFontPx = Math.max(1, Math.min(
          layout.trackBox.h,
          Math.floor(layout.trackBox.h * theme.linear.labels.fontFactor * labelBoost * textFillScale)
        ));
        const labelInsetPx = Math.max(1, Math.floor((labelFontPx * theme.linear.labels.insetFactor * 0.2) / textFillScale));

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const state = {
          ctx: ctx,
          mode: layout.mode,
          layout: layout,
          responsive: layout.responsive,
          textFillScale: textFillScale,
          theme: theme,
          family: family,
          color: color,
          valueWeight: theme.font.weight,
          labelWeight: theme.font.labelWeight,
          axis: axis,
          trackThickness: trackThickness,
          sectorBandY: sectorBandY,
          labelFontPx: labelFontPx,
          labelInsetPx: labelInsetPx,
          mapValueToX: function (valueNum, doClamp) {
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
          mapValueToX: function (valueNum, axisOverride, doClamp) {
            const refAxis = axisOverride || axis;
            return math.mapValueToX(valueNum, refAxis.min, refAxis.max, layout.scaleX0, layout.scaleX1, doClamp);
          }
        };
        const displayState = {
          raw: raw,
          num: display.num,
          text: valueText,
          unit: unit,
          caption: String(p.caption).trim(),
          secScale: secScale,
          rowBoxes: rowBoxes,
          parsed: display
        };
        const tickLabelFormatter = typeof cfg.formatTickLabel === "function"
          ? function (tickValue, tickState) { return cfg.formatTickLabel(tickValue, tickState || state, p, hookApi); }
          : null;
        const staticKey = math.keyToText({
          engine: {
            W: W,
            H: H,
            mode: state.mode,
            textFillScale: textFillScale,
            axisMode: axisMode,
            axisMin: axis.min,
            axisMax: axis.max,
            scaleX0: layout.scaleX0,
            scaleX1: layout.scaleX1,
            trackY: layout.trackY,
            trackThickness: trackThickness,
            labelFontPx: labelFontPx,
            labelBoost: labelBoost,
            linearLabelInsetFactor: theme.linear.labels.insetFactor,
            labelInsetPx: labelInsetPx,
            linearTrackWidth: theme.linear.track.widthFactor,
            linearTrackLineWidth: theme.linear.track.lineWidth,
            linearMajorLen: theme.linear.ticks.majorLen,
            linearMajorWidth: theme.linear.ticks.majorWidth,
            linearMinorLen: theme.linear.ticks.minorLen,
            linearMinorWidth: theme.linear.ticks.minorWidth,
            family: family,
            color: color,
            labelWeight: theme.font.labelWeight,
            tickMajor: tickMajor,
            tickMinor: tickMinor,
            showEndLabels: showEndLabels
          },
          sectors: sectors,
          widget: typeof cfg.buildStaticKey === "function" ? cfg.buildStaticKey(state, p) : null
        });

        layerCache.ensureLayer(canvas, staticKey, function (layerCtx) {
          layerCtx.setTransform(1, 0, 0, 1, 0, 0);
          layerCtx.clearRect(0, 0, canvas.width, canvas.height);
          layerCtx.setTransform(canvas.width / Math.max(1, W), 0, 0, canvas.height / Math.max(1, H), 0, 0);
          layerCtx.fillStyle = color;
          layerCtx.strokeStyle = color;
          drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors, tickLabelFormatter);
        });
        layerCache.blit(ctx);

        function drawPointerAtValue(targetCtx, markerValue, markerOpts) {
          const pointerNum = Number(markerValue);
          if (!isFinite(pointerNum)) {
            return;
          }
          const pointerX = state.mapValueToX(pointerNum, true);
          if (!isFinite(pointerX)) {
            return;
          }
          const opts = markerOpts || {};
          const basePointerSize = Number.isFinite(Number(opts.depth)) ? Math.max(1, Math.floor(opts.depth)) : pointerDepthBase;
          const pointerWidth = Math.max(1, Math.floor(basePointerSize * theme.linear.pointer.widthFactor));
          primitives.drawPointer(targetCtx || ctx, Math.round(pointerX), layout.trackY - Math.floor(trackThickness / 2) - 1, {
            depth: Number.isFinite(Number(opts.depth)) ? basePointerSize : Math.max(1, Math.floor(pointerDepthBase * theme.linear.pointer.lengthFactor)),
            side: Number.isFinite(Number(opts.side)) ? Math.max(1, Math.floor(opts.side)) : Math.max(1, Math.floor(pointerWidth / 2)),
            fillStyle: hasOwn.call(opts, "fillStyle") ? opts.fillStyle : theme.colors.pointer
          });
        }

        function drawMarkerAtValue(targetCtx, markerValue, markerOpts) {
          const markerNum = Number(markerValue);
          if (!isFinite(markerNum)) {
            return;
          }
          const markerX = state.mapValueToX(markerNum, true);
          if (!isFinite(markerX)) {
            return;
          }
          const opts = markerOpts || {};
          const len = Number.isFinite(Number(opts.len)) ? Math.max(1, opts.len) : Math.max(1, Math.floor(markerSizeBase * 0.9));
          const width = Number.isFinite(Number(opts.lineWidth)) ? Math.max(1, opts.lineWidth) : Math.max(1, Math.floor(markerSizeBase * 0.4));
          primitives.drawTick(targetCtx || ctx, Math.round(markerX), layout.trackY + len, len, {
            lineWidth: width,
            lineCap: "butt",
            strokeStyle: hasOwn.call(opts, "strokeStyle") ? opts.strokeStyle : theme.colors.pointer
          });
        }

        const drawApi = {
          drawDefaultPointer: function (opts) { drawPointerAtValue(ctx, displayState.num, opts); },
          drawPointerAtValue: function (valueNum, opts) { drawPointerAtValue(ctx, valueNum, opts); },
          drawMarkerAtValue: function (valueNum, opts) { drawMarkerAtValue(ctx, valueNum, opts); }
        };
        if (typeof cfg.drawFrame === "function") cfg.drawFrame(state, p, displayState, Object.assign({}, hookApi, drawApi));
        else drawApi.drawDefaultPointer();

        const modeRenderer = cfg.drawMode && cfg.drawMode[state.mode];
        if (typeof modeRenderer === "function") {
          modeRenderer(state, p, displayState, Object.assign({}, hookApi, drawApi));
        } else if (state.mode === "high") {
          textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "center");
          textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "center");
        } else if (state.mode === "normal") {
          textLayout.drawInlineRow(state, text, displayState.caption, valueText, unit, state.layout.inlineBox, secScale);
        } else {
          textLayout.drawCaptionRow(state, text, displayState.caption, rowBoxes.captionBox, secScale, "right");
          textLayout.drawValueUnitRow(state, text, valueText, unit, rowBoxes.valueBox, secScale, "right");
        }

        if (p.disconnect) text.drawDisconnectOverlay(ctx, W, H, family, color, null, state.labelWeight);
      };
    }

    return { id: "LinearGaugeEngine", version: "0.2.0", createRenderer: createRenderer };
  }

  return { id: "LinearGaugeEngine", create: create };
}));
