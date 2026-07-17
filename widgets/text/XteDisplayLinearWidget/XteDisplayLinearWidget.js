/**
 * @file XteDisplayLinearWidget - Responsive XTE linear bar renderer with integrated nav metrics
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayLinearWidget = factory();
  }
}(this, function () {
  "use strict";
  /** @param {unknown} def @param {DyniXteLinearContext} componentContext */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniXteLinearToolkit} */ (componentContext.components.require("GaugeToolkit"));
    const cacheFactory = componentContext.components.require("CanvasLayerCache");
    const primitives = componentContext.components.require("LinearCanvasPrimitives");
    const gaugeMath = componentContext.components.require("LinearGaugeMath");
    const geometryScale = componentContext.components.require("GeometryScale");
    const layoutApi = componentContext.components.require("XteLinearLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const springMotion = componentContext.components.require("SpringEasing").createMotion();
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back", "front"] });

    /** @param {DyniWidgetValues} props */
    function resolveStateKind(props) {
      const display = props.display && typeof props.display === "object" ? /** @type {DyniXteLinearData} */ (props.display) : null;
      const waypointName = display && typeof display.wpName === "string" ? toolkit.value.trimText(display.wpName) : "";
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: display && display.disconnect === true },
        { kind: "noTarget", when: waypointName === "" },
        { kind: "data", when: true }
      ]);
    }

    /** @param {DyniXteLinearLayoutResult} layout @param {DyniXteLinearTheme} theme @returns {DyniXteLinearGeometry} */
    function resolveGaugeGeometry(layout, theme) {
      const lt = theme.linear;
      const gb = layout.gaugeBar;
      const primaryDim = Math.max(1, Math.min(gb.w, gb.h));
      const sw = toolkit.value.clampNumber(theme.strokeWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const pdw = toolkit.value.clampNumber(theme.pointerDepthWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const psw = toolkit.value.clampNumber(theme.pointerSideWeight, 0, Number.MAX_SAFE_INTEGER, 1);
      const sFloor = geometryScale.strokeFloor(sw);
      const eFloor = geometryScale.extentFloor(sw);
      const trackFactor = toolkit.value.clampNumber(lt.track.widthFactor, 0, Number.MAX_SAFE_INTEGER, 0.16);
      const trackThickness = geometryScale.scale(primaryDim, trackFactor, eFloor);
      const trackLineWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.track.lineWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.018),
        sw,
        sFloor
      );
      const majorTickLen = geometryScale.scale(primaryDim, toolkit.value.clampNumber(lt.ticks.majorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.109), eFloor);
      const majorTickWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.majorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.027),
        sw,
        sFloor
      );
      const minorTickLen = geometryScale.scale(primaryDim, toolkit.value.clampNumber(lt.ticks.minorLenFactor, 0, Number.MAX_SAFE_INTEGER, 0.064), eFloor);
      const minorTickWidth = geometryScale.scaleStroke(
        primaryDim,
        toolkit.value.clampNumber(lt.ticks.minorWidthFactor, 0, Number.MAX_SAFE_INTEGER, 0.014),
        sw,
        sFloor
      );
      const pointerDepth = geometryScale.scalePointer(primaryDim, toolkit.value.clampNumber(lt.pointer.depthFactor, 0, Number.MAX_SAFE_INTEGER, 0.24), pdw, eFloor);
      const pointerSide = geometryScale.scalePointer(primaryDim, toolkit.value.clampNumber(lt.pointer.sideFactor, 0, Number.MAX_SAFE_INTEGER, 0.12), psw, eFloor);
      const inset = Math.max(1, geometryScale.scale(primaryDim, trackFactor, eFloor));
      const x0 = gb.x + inset;
      const x1 = Math.max(x0 + 1, gb.x + gb.w - inset);
      const trackY = gb.y + Math.floor(gb.h / 2);
      const labelFontPx = Math.max(1, Math.min(
        gb.h,
        Math.floor(
          primaryDim *
          toolkit.value.clampNumber(lt.labels.fontFactor, 0, Number.MAX_SAFE_INTEGER, 0.14) *
          (layout.responsive.textFillScale || 1)
        )
      ));
      const labelInset = Math.max(1, Math.floor(labelFontPx * toolkit.value.clampNumber(lt.labels.insetFactor, 0, Number.MAX_SAFE_INTEGER, 1.8) * 0.2));
      return {
        primaryDim: primaryDim,
        trackThickness: trackThickness,
        trackLineWidth: trackLineWidth,
        majorTickLen: majorTickLen,
        majorTickWidth: majorTickWidth,
        minorTickLen: minorTickLen,
        minorTickWidth: minorTickWidth,
        pointerDepth: pointerDepth,
        pointerSide: pointerSide,
        x0: x0,
        x1: x1,
        trackY: trackY,
        labelFontPx: labelFontPx,
        labelInset: labelInset
      };
    }

    /** @param {CanvasRenderingContext2D} ctx @param {DyniXteLinearTheme} theme @param {DyniXteLinearGeometry} geom @param {DyniLinearTicks} ticks @param {boolean} showEndLabels @param {unknown} family @param {unknown} labelWeight */
    function drawEndLabels(ctx, theme, geom, ticks, showEndLabels, family, labelWeight) {
      if (!showEndLabels || ticks.major.length < 2) {
        return;
      }
      const first = ticks.major[0];
      const last = ticks.major[ticks.major.length - 1];
      const firstX = gaugeMath.mapValueToX(first, first, last, geom.x0, geom.x1, true);
      const lastX = gaugeMath.mapValueToX(last, first, last, geom.x0, geom.x1, true);
      const labelY = geom.trackY + Math.floor(geom.trackThickness / 2) + geom.pointerDepth + geom.labelInset + Math.floor(geom.labelFontPx / 2);
      ctx.save();
      ctx.fillStyle = theme.surface.fg;
      ctx.textBaseline = "middle";
      toolkit.text.setFont(ctx, geom.labelFontPx, labelWeight, family);
      ctx.textAlign = "left";
      ctx.fillText(gaugeMath.formatTickLabel(first), Math.round(firstX), labelY);
      ctx.textAlign = "right";
      ctx.fillText(gaugeMath.formatTickLabel(last), Math.round(lastX), labelY);
      ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx @param {number} x @param {DyniXteLinearGeometry} geom @param {string} color */
    function drawPointerUpward(ctx, x, geom, color) {
      const tipY = geom.trackY + Math.floor(geom.trackThickness / 2) + 1;
      const side = Math.max(1, Math.floor(geom.pointerSide));
      const depth = Math.max(1, Math.floor(geom.pointerDepth));
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, tipY);
      ctx.lineTo(x - side, tipY + depth);
      ctx.lineTo(x + side, tipY + depth);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx @param {DyniXteLinearGeometry} geom @param {string} color */
    function drawTrackLayer(ctx, geom, color) {
      primitives.drawTrack(ctx, geom.x0, geom.x1, geom.trackY, { lineWidth: geom.trackLineWidth, strokeStyle: color });
    }

    /** @param {CanvasRenderingContext2D} ctx @param {DyniXteLinearGeometry} geom @param {DyniLinearTicks} ticks @param {number} xteScale @param {string} color */
    function drawTicksLayer(ctx, geom, ticks, xteScale, color) {
      const minorStyle = { lineWidth: geom.minorTickWidth, strokeStyle: color };
      const majorStyle = { lineWidth: geom.majorTickWidth, strokeStyle: color };
      for (let i = 0; i < ticks.minor.length; i++) {
        const x = gaugeMath.mapValueToX(ticks.minor[i], -xteScale, xteScale, geom.x0, geom.x1, true);
        if (Number.isFinite(x)) primitives.drawTick(ctx, Math.round(x), geom.trackY, geom.minorTickLen, minorStyle);
      }
      for (let i = 0; i < ticks.major.length; i++) {
        const x = gaugeMath.mapValueToX(ticks.major[i], -xteScale, xteScale, geom.x0, geom.x1, true);
        if (Number.isFinite(x)) primitives.drawTick(ctx, Math.round(x), geom.trackY, geom.majorTickLen, majorStyle);
      }
    }

    /** @param {HTMLCanvasElement} canvas @param {DyniWidgetValues} props */
    function renderCanvas(canvas, props) {
      const p = props;
      const setup = componentContext.canvas.setupCanvas(canvas);
      if (!setup) {
        return;
      }
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;
      if (!W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      const rootEl = componentContext.dom.requirePluginRoot(canvas);
      const theme = toolkit.theme.resolveForRoot(rootEl);
      const stableDigitsEnabled = p.stableDigits === true;
      const family = stableDigitsEnabled ? (theme.font.familyMono || theme.font.family) : theme.font.family;
      const labelWeight = theme.font.labelWeight;
      const valueWeight = theme.font.weight;
      const captionOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.caption : undefined;
      const unitOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.unit : undefined;
      const stateKind = resolveStateKind(p);
      if (stateKind !== stateScreenLabels.KINDS.DATA) {
        stateScreenCanvasOverlay.drawStateScreen({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: theme.surface.fg,
          labelWeight: labelWeight,
          kind: stateKind
        });
        return;
      }

      const display = p.display && typeof p.display === "object" ? /** @type {DyniXteLinearData} */ (p.display) : null;
      const captions = p.captions && typeof p.captions === "object" ? /** @type {DyniXteLinearData} */ (p.captions) : null;
      const units = p.units && typeof p.units === "object" ? /** @type {DyniXteLinearData} */ (p.units) : null;
      const formatUnits = p.formatUnits && typeof p.formatUnits === "object" ? /** @type {DyniXteLinearData} */ (p.formatUnits) : null;
      const layoutConfig = p.layout && typeof p.layout === "object" ? /** @type {DyniXteLinearLayoutConfig} */ (p.layout) : null;
      const easingEnabled = !layoutConfig || layoutConfig.easing !== false;
      const hideTextualMetrics = !!(layoutConfig && layoutConfig.hideTextualMetrics === true);
      const showWpName = !!(layoutConfig && layoutConfig.showWpName === true);
      const rawXteScale = p.xteScale;
      const xteScale = typeof rawXteScale === "number" && Number.isFinite(rawXteScale) && rawXteScale > 0 ? rawXteScale : 1;

      const mode = layoutApi.computeMode(
        W,
        H,
        layoutConfig ? layoutConfig.ratioThresholdNormal : undefined,
        layoutConfig ? layoutConfig.ratioThresholdFlat : undefined
      );
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(
        W,
        H,
        /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (insets))
      );
      const wpName = toolkit.value.trimText(display && display.wpName);
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        mode: mode,
        responsive: insets.responsive,
        hideTextualMetrics: hideTextualMetrics,
        showWpName: showWpName,
        hasWaypointName: !!wpName
      });

      const geom = resolveGaugeGeometry(layout, theme);
      const majorStep = toolkit.value.clampNumber(layoutConfig && layoutConfig.tickMajor, 0.1, 999999, 1.0);
      const minorStep = toolkit.value.clampNumber(layoutConfig && layoutConfig.tickMinor, 0.05, 999999, 0.25);
      const ticks = gaugeMath.buildTicks(-xteScale, xteScale, majorStep, minorStep);
      const showEndLabels = !(layoutConfig && layoutConfig.showEndLabels === false);
      const staticKey = {
        mode: mode,
        gaugeBar: layout.gaugeBar,
        geom: geom,
        ticks: ticks,
        showEndLabels: showEndLabels,
        xteScale: xteScale,
        color: theme.surface.fg,
        strokeWeight: theme.strokeWeight,
        pointerDepthWeight: theme.pointerDepthWeight,
        pointerSideWeight: theme.pointerSideWeight
      };

      staticLayer.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
        const scaleX = layerCanvas.width / Math.max(1, W);
        const scaleY = layerCanvas.height / Math.max(1, H);
        layerCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        layerCtx.clearRect(0, 0, W, H);
        if (layerName === "back") {
          drawTrackLayer(layerCtx, geom, theme.surface.fg);
          return;
        }
        drawTicksLayer(layerCtx, geom, ticks, xteScale, theme.surface.fg);
        drawEndLabels(layerCtx, theme, geom, ticks, showEndLabels, family, labelWeight);
      });
      staticLayer.blitLayer(ctx, "back");

      const xteRaw = display ? display.xte : undefined;
      const xteNumber = typeof xteRaw === "number" && Number.isFinite(xteRaw) ? xteRaw : undefined;
      const xteHasValue = xteNumber !== undefined;
      const defaultText = placeholderNormalize.normalize(undefined, p.default);
      const xteDistance = unitFormatter.formatDistance(
        xteNumber === undefined ? undefined : Math.abs(xteNumber),
        formatUnits && formatUnits.xte,
        defaultText
      );
      const xteDistanceMissing = placeholderNormalize.isPlaceholder(xteDistance);
      const xteNumeric = unitFormatter.extractNumericDisplay(xteDistance, xteNumber === undefined ? NaN : Math.abs(xteNumber));
      const signedXte = xteNumber !== undefined && Number.isFinite(xteNumeric) ? (xteNumber < 0 ? -xteNumeric : xteNumeric) : NaN;
      const overflow = Number.isFinite(signedXte) && Math.abs(signedXte) > xteScale;

      if (Number.isFinite(signedXte)) {
        const targetRatio = signedXte / xteScale;
        const easedRatio = springMotion.resolve(canvas, targetRatio, easingEnabled, Date.now());
        const resolvedRatio = Number.isFinite(easedRatio) ? easedRatio : targetRatio;
        const pointerX = gaugeMath.mapValueToX(resolvedRatio * xteScale, -xteScale, xteScale, geom.x0, geom.x1, true);
        if (Number.isFinite(pointerX)) drawPointerUpward(ctx, Math.round(pointerX), geom, overflow ? theme.colors.alarm : theme.colors.pointer);
      }

      staticLayer.blitLayer(ctx, "front");

      if (hideTextualMetrics) {
        if (xteHasValue && springMotion.isActive(canvas)) {
          return { wantsFollowUpFrame: true };
        }
        return;
      }

      const dtwRaw = display ? display.dtw : undefined;
      const cogRaw = display ? display.cog : undefined;
      const btwRaw = display ? display.btw : undefined;
      const leadingZero = !layoutConfig || layoutConfig.leadingZero !== false;
      const dtwDistance = unitFormatter.formatDistance(dtwRaw, formatUnits && formatUnits.dtw, defaultText);
      const cogHeading = unitFormatter.formatWithToken(cogRaw, "formatDirection360", leadingZero, defaultText);
      const brgHeading = unitFormatter.formatWithToken(btwRaw, "formatDirection360", leadingZero, defaultText);
      const xteSide = (!xteDistanceMissing && xteNumber !== undefined) ? (xteNumber > 0 ? "R" : (xteNumber < 0 ? "L" : "")) : "";
      let xteValueText = xteDistance + xteSide;
      const metricRects = layout.metricRects;

      if (stableDigitsEnabled) {
        const xteStable = stableDigits.normalize(xteDistance, {
          integerWidth: stableDigits.resolveIntegerWidth(xteDistance, 2),
          reserveSignSlot: false,
          sideSuffix: xteSide,
          reserveSideSuffixSlot: true
        });
        xteValueText = xteStable.padded;
        if (xteStable.padded !== xteStable.plain && metricRects && metricRects.xte) {
          const xteSpacing = layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive);
          const probe = /** @type {{ fit?: { total: number }, textW: number } | null} */ (tileLayout.measureMetricTile({
            textApi: toolkit.text,
            ctx: ctx,
            metric: { caption: captions && captions.xte, value: xteStable.padded, unit: units && units.xte },
            rect: metricRects.xte,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            secScale: 0.7,
            textFillScale: layout.responsive.textFillScale,
            padX: xteSpacing.padX,
            captionHeightPx: xteSpacing.captionHeightPx
          }));
          const fit = probe && probe.fit ? probe.fit : null;
          const clipped = !!(probe && fit && fit.total > probe.textW + 0.01);
          if (clipped) xteValueText = xteStable.plain;
        }
      }

      const metrics = /** @type {Record<keyof DyniXteMetricRects, { caption: unknown, value: string, unit: unknown }>} */ ({
        cog: { caption: captions && captions.track, value: cogHeading, unit: units && units.track },
        xte: { caption: captions && captions.xte, value: xteValueText, unit: units && units.xte },
        dtw: { caption: captions && captions.dtw, value: dtwDistance, unit: units && units.dtw },
        btw: { caption: captions && captions.brg, value: brgHeading, unit: units && units.brg }
      });

      if (metricRects && metricRects.cog && metricRects.xte && metricRects.dtw && metricRects.btw) {
        const spacing = {
          cog: layoutApi.computeMetricTileSpacing(metricRects.cog, layout.responsive),
          xte: layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive),
          dtw: layoutApi.computeMetricTileSpacing(metricRects.dtw, layout.responsive),
          btw: layoutApi.computeMetricTileSpacing(metricRects.btw, layout.responsive)
        };
        const fields = /** @type {Array<keyof DyniXteMetricRects>} */ ([
          "cog",
          "xte",
          "dtw",
          "btw"
        ]);
        for (let i = 0; i < fields.length; i++) {
          const key = fields[i];
          tileLayout.drawMetricTile({
            textApi: toolkit.text,
            ctx: ctx,
            metric: metrics[key],
            rect: metricRects[key],
            family: family,
            color: theme.surface.fg,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            secScale: key === "xte" || key === "dtw" ? 0.7 : 0.75,
            textFillScale: layout.responsive.textFillScale,
            padX: spacing[key].padX,
            captionHeightPx: spacing[key].captionHeightPx,
            captionOpacity: captionOpacity,
            unitOpacity: unitOpacity
          });
        }
      }

      const nameRect = layout.nameRect;
      if (showWpName && wpName && nameRect && nameRect.w > 0 && nameRect.h > 0) {
        const fit = /** @type {DyniXteWaypointFit} */ (tileLayout.measureFittedLine({
          textApi: toolkit.text,
          ctx: ctx,
          text: wpName,
          maxW: nameRect.w,
          maxH: nameRect.h,
          maxPx: Math.max(1, Math.floor(nameRect.h * 0.72)),
          textFillScale: layout.responsive.textFillScale,
          family: family,
          weight: labelWeight
        }));
        if (fit && typeof fit.text === "string" && fit.text) {
          tileLayout.drawFittedLine({
            textApi: toolkit.text,
            ctx: ctx,
            fit: fit,
            text: wpName,
            rect: nameRect,
            align: "center",
            family: family,
            weight: labelWeight,
            maxPx: Math.max(1, Math.floor(nameRect.h * 0.72)),
            color: theme.surface.fg
          });
        }
      }

      if (xteHasValue && springMotion.isActive(canvas)) {
        return { wantsFollowUpFrame: true };
      }
    }

    return {
      id: "XteDisplayLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: function () { return {}; },
      finalizeFunction: function () { staticLayer.invalidate(); }
    };
  }

  return { id: "XteDisplayLinearWidget", create: create };
}));
