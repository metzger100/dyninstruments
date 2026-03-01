/**
 * Module: LinearGaugeEngine - Shared renderer pipeline for linear gauge widgets
 * Documentation: documentation/linear/linear-shared-api.md
 * Depends: RadialToolkit, CanvasLayerCache, LinearCanvasPrimitives, LinearGaugeMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniLinearGaugeEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const layerCacheApi = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const primitives = Helpers.getModule("LinearCanvasPrimitives").create(def, Helpers);
    const math = Helpers.getModule("LinearGaugeMath").create(def, Helpers);
    const text = GU.text;
    const value = GU.value;
    function resolveSurface(canvas) {
      const setup = Helpers.setupCanvas(canvas);
      if (!setup || !setup.W || !setup.H || !setup.ctx) {
        return null;
      }
      return setup;
    }
    function resolveMode(props, W, H, ratioProps, ratioDefaults) {
      const pad = value.computePad(W, H);
      const gap = value.computeGap(W, H);
      const ratio = W / Math.max(1, H);
      const tNormal = value.isFiniteNumber(props[ratioProps.normal]) ? props[ratioProps.normal] : ratioDefaults.normal;
      const tFlat = value.isFiniteNumber(props[ratioProps.flat]) ? props[ratioProps.flat] : ratioDefaults.flat;
      return {
        pad: pad,
        gap: gap,
        ratio: ratio,
        mode: value.computeMode(ratio, tNormal, tFlat)
      };
    }
    function resolveLabelBoost(mode) {
      if (mode === "high") {
        return 1.2;
      }
      if (mode === "normal") {
        return 1.12;
      }
      return 1.0;
    }
    function drawTickLabels(layerCtx, state, ticks, showEndLabels) {
      if (!state.labelFontPx || !ticks || !ticks.major || !ticks.major.length) {
        return;
      }
      const fontPx = Math.max(9, Math.floor(state.labelFontPx));
      layerCtx.font = state.labelWeight + " " + fontPx + "px " + state.family;
      layerCtx.textAlign = "center";
      layerCtx.textBaseline = "top";
      const tickReach = Math.max(
        Number(state.theme.linear.ticks.majorLen) || 0,
        Number(state.theme.linear.ticks.minorLen) || 0
      );
      const labelY = Math.min(
        Math.round(state.layout.trackY + tickReach + Math.max(4, Math.floor(fontPx * 0.15))),
        Math.round(state.layout.trackBox.y + state.layout.trackBox.h - fontPx - 1)
      );
      const minGap = Math.max(2, Math.floor(fontPx * 0.2));
      let lastRight = -Infinity;

      for (let i = 0; i < ticks.major.length; i++) {
        const tickV = ticks.major[i];
        const isStart = Math.abs(tickV - state.axis.min) <= 1e-6;
        const isEnd = Math.abs(tickV - state.axis.max) <= 1e-6;
        if (!showEndLabels && (isStart || isEnd)) {
          continue;
        }
        const x = math.mapValueToX(
          tickV,
          state.axis.min,
          state.axis.max,
          state.layout.scaleX0,
          state.layout.scaleX1,
          true
        );
        if (!isFinite(x)) {
          continue;
        }
        const label = math.formatTickLabel(tickV);
        const width = layerCtx.measureText(label).width;
        const left = x - width / 2;
        const right = x + width / 2;
        if (left <= lastRight + minGap) {
          continue;
        }
        layerCtx.fillText(
          label,
          Math.round(x),
          labelY
        );
        lastRight = right;
      }
    }
    function drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors) {
      const theme = state.theme;
      primitives.drawTrack(layerCtx, state.layout.scaleX0, state.layout.scaleX1, state.layout.trackY, {
        lineWidth: theme.linear.track.lineWidth,
        strokeStyle: state.color
      });

      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i];
        if (!sector) continue;
        const from = Number(sector.from);
        const to = Number(sector.to);
        if (!isFinite(from) || !isFinite(to) || to <= from) {
          continue;
        }
        const x0 = math.mapValueToX(from, state.axis.min, state.axis.max, state.layout.scaleX0, state.layout.scaleX1, true);
        const x1 = math.mapValueToX(to, state.axis.min, state.axis.max, state.layout.scaleX0, state.layout.scaleX1, true);
        if (!isFinite(x0) || !isFinite(x1) || Math.abs(x1 - x0) <= 1) {
          continue;
        }
        primitives.drawBand(layerCtx, x0, x1, state.layout.trackY, state.trackThickness, {
          fillStyle: sector.color
        });
      }

      const majorStyle = {
        lineWidth: theme.linear.ticks.majorWidth,
        strokeStyle: state.color
      };
      const minorStyle = {
        lineWidth: theme.linear.ticks.minorWidth,
        strokeStyle: state.color
      };

      for (let i = 0; i < ticks.minor.length; i++) {
        const tickV = ticks.minor[i];
        const x = math.mapValueToX(tickV, state.axis.min, state.axis.max, state.layout.scaleX0, state.layout.scaleX1, true);
        if (isFinite(x)) {
          primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, theme.linear.ticks.minorLen, minorStyle);
        }
      }
      for (let i = 0; i < ticks.major.length; i++) {
        const tickV = ticks.major[i];
        const x = math.mapValueToX(tickV, state.axis.min, state.axis.max, state.layout.scaleX0, state.layout.scaleX1, true);
        if (isFinite(x)) {
          primitives.drawTick(layerCtx, Math.round(x), state.layout.trackY, theme.linear.ticks.majorLen, majorStyle);
        }
      }

      drawTickLabels(layerCtx, state, ticks, showEndLabels);
    }
    function drawCaptionRow(state, caption, box, secScale, align) {
      if (!caption || !box || box.w <= 0 || box.h <= 0) {
        return;
      }
      const fit = text.measureValueUnitFit(
        state.ctx,
        state.family,
        "88.8",
        "",
        box.w,
        box.h,
        secScale,
        state.valueWeight,
        state.labelWeight
      );
      const captionMax = Math.max(8, Math.floor(fit.vPx * secScale));
      text.drawCaptionMax(
        state.ctx,
        state.family,
        box.x,
        box.y,
        box.w,
        box.h,
        caption,
        captionMax,
        align,
        state.labelWeight
      );
    }
    function drawValueUnitRow(state, valueText, unitText, box, secScale, align) {
      if (!box || box.w <= 0 || box.h <= 0) {
        return;
      }
      const fit = text.measureValueUnitFit(
        state.ctx,
        state.family,
        valueText,
        unitText,
        box.w,
        box.h,
        secScale,
        state.valueWeight,
        state.labelWeight
      );
      text.drawValueUnitWithFit(
        state.ctx,
        state.family,
        box.x,
        box.y,
        box.w,
        box.h,
        valueText,
        unitText,
        fit,
        align,
        state.valueWeight,
        state.labelWeight
      );
    }
    function drawInlineRow(state, caption, valueText, unitText, box, secScale) {
      if (!box || box.w <= 0 || box.h <= 0) {
        return;
      }
      const fit = text.fitInlineCapValUnit(
        state.ctx,
        state.family,
        caption,
        valueText,
        unitText,
        box.w,
        box.h,
        secScale,
        state.valueWeight,
        state.labelWeight
      );
      text.drawInlineCapValUnit(
        state.ctx,
        state.family,
        box.x,
        box.y,
        box.w,
        box.h,
        caption,
        valueText,
        unitText,
        fit,
        state.valueWeight,
        state.labelWeight
      );
    }

    function createRenderer(spec) {
      const cfg = spec || {};
      const axisMode = cfg.axisMode || "range";
      const ratioProps = cfg.ratioProps || { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
      const ratioDefaults = cfg.ratioDefaults || { normal: 1.1, flat: 3.5 };
      const rangeDefaults = cfg.rangeDefaults || { min: 0, max: 30 };
      const rangeProps = cfg.rangeProps || { min: "minValue", max: "maxValue" };
      const tickProps = cfg.tickProps || { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
      const unitDefault = cfg.unitDefault || "";
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
        const modeState = resolveMode(p, W, H, ratioProps, ratioDefaults);
        const layout = math.computeLayout(modeState.mode, W, H, modeState.pad, modeState.gap);
        const range = value.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        const axis = math.resolveAxisDomain(axisMode, range);
        const raw = (typeof p.value !== "undefined") ? p.value : p[cfg.rawValueKey];
        const unit = String(p.unit || unitDefault).trim();
        const display = (typeof cfg.formatDisplay === "function")
          ? (cfg.formatDisplay(raw, p, unit, Helpers) || {})
          : { num: Number(raw), text: String(raw) };

        const valueText = (display.text && String(display.text).trim())
          ? String(display.text).trim()
          : (hasOwn.call(p, "default") ? p.default : "---");
        const valueNum = value.isFiniteNumber(display.num) ? display.num : NaN;
        const caption = String(p.caption || "").trim();
        const secScale = value.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
        const rowBoxes = math.splitCaptionValueRows(layout.captionBox, layout.valueBox, secScale);
        const tickPreset = (typeof cfg.tickSteps === "function")
          ? (cfg.tickSteps(axis.max - axis.min) || { major: 10, minor: 2 })
          : { major: 10, minor: 2 };
        const tickMajor = value.isFiniteNumber(p[tickProps.major]) ? p[tickProps.major] : tickPreset.major;
        const tickMinor = value.isFiniteNumber(p[tickProps.minor]) ? p[tickProps.minor] : tickPreset.minor;
        const showEndLabels = !!p[tickProps.showEndLabels];
        const ticks = math.buildTicks(axis.min, axis.max, tickMajor, tickMinor);
        const sectors = (typeof cfg.buildSectors === "function")
          ? (cfg.buildSectors(p, range.min, range.max, axis, value, theme) || [])
          : [];

        const baseTrack = Math.max(6, Math.floor(layout.trackBox.h * theme.linear.track.widthFactor));
        const maxTrack = Math.max(8, Math.floor(theme.linear.ticks.majorLen * 1.6));
        const trackThickness = math.clamp(baseTrack, 6, maxTrack);
        const labelBoost = resolveLabelBoost(modeState.mode);
        const labelFontPx = Math.max(10, Math.floor(layout.trackBox.h * theme.linear.labels.fontFactor * labelBoost));

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const state = {
          ctx: ctx,
          mode: modeState.mode,
          layout: layout,
          theme: theme,
          family: family,
          color: color,
          valueWeight: theme.font.weight,
          labelWeight: theme.font.labelWeight,
          axis: axis,
          trackThickness: trackThickness,
          labelFontPx: labelFontPx
        };

        const staticKey = math.keyToText({
          engine: {
            W: W,
            H: H,
            mode: state.mode,
            axisMode: axisMode,
            axisMin: axis.min,
            axisMax: axis.max,
            scaleX0: layout.scaleX0,
            scaleX1: layout.scaleX1,
            trackY: layout.trackY,
            trackThickness: trackThickness,
            labelFontPx: labelFontPx,
            labelBoost: labelBoost,
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
          widget: (typeof cfg.buildStaticKey === "function") ? cfg.buildStaticKey(state, p) : null
        });

        layerCache.ensureLayer(canvas, staticKey, function (layerCtx) {
          layerCtx.setTransform(1, 0, 0, 1, 0, 0);
          layerCtx.clearRect(0, 0, canvas.width, canvas.height);
          layerCtx.setTransform(
            canvas.width / Math.max(1, W),
            0,
            0,
            canvas.height / Math.max(1, H),
            0,
            0
          );
          layerCtx.fillStyle = color;
          layerCtx.strokeStyle = color;
          drawStaticLayer(layerCtx, state, ticks, showEndLabels, sectors);
        });
        layerCache.blit(ctx);

        if (value.isFiniteNumber(valueNum)) {
          const pointerX = math.mapValueToX(valueNum, axis.min, axis.max, layout.scaleX0, layout.scaleX1, true);
          const pointerTipY = layout.trackY - Math.floor(trackThickness / 2) - 1;
          if (isFinite(pointerX)) {
            const depthBase = Math.max(8, trackThickness);
            const depth = Math.max(8, Math.floor(depthBase * theme.linear.pointer.lengthFactor));
            const side = Math.max(4, Math.floor(depth * theme.linear.pointer.sideFactor));
            primitives.drawPointer(ctx, Math.round(pointerX), pointerTipY, {
              depth: depth,
              side: side,
              fillStyle: theme.colors.pointer
            });
          }
        }

        if (state.mode === "high") {
          drawCaptionRow(state, caption, rowBoxes.captionBox, secScale, "center");
          drawValueUnitRow(state, valueText, unit, rowBoxes.valueBox, secScale, "center");
        }
        else if (state.mode === "normal") {
          drawInlineRow(state, caption, valueText, unit, state.layout.inlineBox, secScale);
        }
        else {
          drawCaptionRow(state, caption, rowBoxes.captionBox, secScale, "right");
          drawValueUnitRow(state, valueText, unit, rowBoxes.valueBox, secScale, "right");
        }

        if (p.disconnect) {
          text.drawDisconnectOverlay(ctx, W, H, family, color, null, state.labelWeight);
        }
      };
    }

    return {
      id: "LinearGaugeEngine",
      version: "0.1.0",
      createRenderer: createRenderer
    };
  }

  return { id: "LinearGaugeEngine", create: create };
}));
