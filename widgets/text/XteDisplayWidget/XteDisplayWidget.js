/**
 * @file XteDisplayWidget - Responsive XTE highway renderer with integrated nav metrics
 * Documentation: documentation/widgets/xte-display.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayWidget = factory();
  }
}(this, function () {
  "use strict";
  /** @typedef {Record<string, unknown> & { disconnect?: unknown, wpName?: unknown, xte?: unknown, cog?: unknown, dtw?: unknown, btw?: unknown }} DyniXteDisplayData */
  /** @typedef {Record<string, unknown> & { easing?: unknown, hideTextualMetrics?: unknown, xteRatioThresholdNormal?: unknown, xteRatioThresholdFlat?: unknown, showWpName?: unknown, leadingZero?: unknown }} DyniXteDisplayLayoutConfig */
  /** @typedef {DyniRadialResolvedTheme & { surface: { fg: string }, colors: { pointer: string, alarm: string } }} DyniXteWidgetTheme */
  /** @typedef {{ resolveForRoot(rootEl: unknown): DyniXteWidgetTheme }} DyniXteWidgetThemeResolver */
  /** @typedef {DyniGaugeToolkitApi & { theme: DyniXteWidgetThemeResolver }} DyniXteWidgetToolkit */
  /** @typedef {DyniComponentContext & { canvas: DyniCanvasHostApi }} DyniXteWidgetContext */

  /** @param {unknown} def @param {DyniXteWidgetContext} componentContext */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniXteWidgetToolkit} */ (componentContext.components.require("GaugeToolkit"));
    const cacheFactory = componentContext.components.require("CanvasLayerCache");
    const primitives = componentContext.components.require("XteHighwayPrimitives");
    const layoutApi = componentContext.components.require("XteHighwayLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const springMotion = componentContext.components.require("SpringEasing").createMotion();
    const placeholderNormalize = componentContext.components.require("PlaceholderNormalize");
    const stableDigits = componentContext.components.require("StableDigits");
    const unitFormatter = componentContext.components.require("UnitAwareFormatter");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back"] });

    /** @param {unknown} raw @returns {string} */
    function trimWaypointName(raw) {
      if (typeof raw !== "string") {
        return "";
      }
      return raw.trim();
    }

    /** @param {DyniWidgetValues} props */
    function resolveStateKind(props) {
      const p = props;
      const display = p.display && typeof p.display === "object" ? /** @type {DyniXteDisplayData} */ (p.display) : null;
      const waypointName = display && typeof display.wpName === "string" ? display.wpName : "";
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: display && display.disconnect === true },
        { kind: "noTarget", when: waypointName === "" },
        { kind: "data", when: true }
      ]);
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
      const textColor = theme.surface.fg;
      const stableDigitsEnabled = p.stableDigits === true;
      const family = stableDigitsEnabled
        ? (theme.font.familyMono || theme.font.family)
        : theme.font.family;
      const valueWeight = theme.font.weight;
      const labelWeight = theme.font.labelWeight;
      const captionOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.caption : undefined;
      const unitOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.unit : undefined;
      const stateKind = resolveStateKind(p);
      if (stateKind !== stateScreenLabels.KINDS.DATA) {
        stateScreenCanvasOverlay.drawStateScreen({
          ctx: ctx,
          W: W,
          H: H,
          family: family,
          color: textColor,
          labelWeight: labelWeight,
          kind: stateKind
        });
        return;
      }

      const colors = {
        pointer: theme.colors.pointer,
        alarm: theme.colors.alarm,
        roadLine: textColor,
        stripeLine: textColor
      };

      const display = p.display && typeof p.display === "object" ? /** @type {DyniXteDisplayData} */ (p.display) : null;
      const captions = p.captions && typeof p.captions === "object" ? /** @type {DyniXteDisplayData} */ (p.captions) : null;
      const units = p.units && typeof p.units === "object" ? /** @type {DyniXteDisplayData} */ (p.units) : null;
      const formatUnits = p.formatUnits && typeof p.formatUnits === "object" ? /** @type {DyniXteDisplayData} */ (p.formatUnits) : null;
      const layoutConfig = p.layout && typeof p.layout === "object" ? /** @type {DyniXteDisplayLayoutConfig} */ (p.layout) : null;
      const easingEnabled = !layoutConfig || layoutConfig.easing !== false;
      const hideTextualMetrics = !!(layoutConfig && layoutConfig.hideTextualMetrics === true);
      const rawXteScale = p.xteScale;
      const xteScale = typeof rawXteScale === "number" && Number.isFinite(rawXteScale) && rawXteScale > 0 ? rawXteScale : 1;

      const normalThreshold = layoutConfig ? layoutConfig.xteRatioThresholdNormal : undefined;
      const flatThreshold = layoutConfig ? layoutConfig.xteRatioThresholdFlat : undefined;
      const mode = layoutApi.computeMode(W, H, normalThreshold, flatThreshold);
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const wpName = trimWaypointName(display && display.wpName);
      const showWpName = !layoutConfig || layoutConfig.showWpName !== false;
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        mode: mode,
        responsive: insets.responsive,
        hideTextualMetrics: hideTextualMetrics,
        showWpName: showWpName,
        hasWaypointName: !!wpName
      });
      const primaryDim = Math.max(1, Math.min(layout.highway.w, layout.highway.h));
      const geom = primitives.highwayGeometry(layout.highway, mode, primaryDim, {
        compactTop: hideTextualMetrics || !(showWpName && !!wpName)
      });

      const staticKey = {
        mode: mode,
        geom: geom,
        strokeWeight: theme.strokeWeight,
        roadLine: colors.roadLine,
        stripeLine: colors.stripeLine
      };

      staticLayer.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
        if (layerName !== "back") {
          return;
        }
        const scaleX = layerCanvas.width / Math.max(1, W);
        const scaleY = layerCanvas.height / Math.max(1, H);
        layerCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        layerCtx.clearRect(0, 0, W, H);
        primitives.drawStaticHighway(layerCtx, geom, colors, mode, primaryDim, theme.strokeWeight);
      });
      staticLayer.blit(ctx);

      const xteRaw = display ? display.xte : undefined;
      const xteNumber = typeof xteRaw === "number" && Number.isFinite(xteRaw) ? xteRaw : undefined;
      const xteAvailable = xteNumber !== undefined;
      const cogRaw = display ? display.cog : undefined;
      const dtwRaw = display ? display.dtw : undefined;
      const btwRaw = display ? display.btw : undefined;
      const headingParams = [!layoutConfig || layoutConfig.leadingZero !== false];
      const defaultText = placeholderNormalize.normalize(undefined, p.default);

      const xteDistance = unitFormatter.formatDistance(
        xteNumber === undefined ? undefined : Math.abs(xteNumber),
        formatUnits && formatUnits.xte,
        defaultText
      );
      const dtwDistance = unitFormatter.formatDistance(dtwRaw, formatUnits && formatUnits.dtw, defaultText);

      const xteDistanceMissing = placeholderNormalize.isPlaceholder(xteDistance);
      const xteSide = (!xteDistanceMissing && xteNumber !== undefined) ? (xteNumber > 0 ? "R" : (xteNumber < 0 ? "L" : "")) : "";
      if (xteNumber !== undefined) {
        const xteDisplayAbs = unitFormatter.extractNumericDisplay(xteDistance, Math.abs(xteNumber));
        const signedDisplayXte = xteNumber < 0 ? -xteDisplayAbs : xteDisplayAbs;
        const overflow = Math.abs(xteDisplayAbs) > xteScale;
        const xteTarget = signedDisplayXte / xteScale;
        const xteEased = springMotion.resolve(canvas, xteTarget, easingEnabled, Date.now());
        const xteNormalized = toolkit.value.isFiniteNumber(xteEased) ? xteEased : (signedDisplayXte / xteScale);
        primitives.drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow, primaryDim, theme.strokeWeight, theme.pointerDepthWeight);
      }

      if (hideTextualMetrics) {
        if (xteAvailable && springMotion.isActive(canvas)) {
          return { wantsFollowUpFrame: true };
        }
        return;
      }

      const trackValue = unitFormatter.formatWithToken(cogRaw, "formatDirection360", headingParams[0], defaultText);
      const bearingValue = unitFormatter.formatWithToken(btwRaw, "formatDirection360", headingParams[0], defaultText);

      const metricRects = /** @type {DyniXteMetricRects | null} */ (layout.metricRects);
      if (!metricRects) {
        return;
      }
      const metricSpacing = {
        cog: layoutApi.computeMetricTileSpacing(metricRects.cog, layout.responsive),
        xte: layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive),
        dtw: layoutApi.computeMetricTileSpacing(metricRects.dtw, layout.responsive),
        btw: layoutApi.computeMetricTileSpacing(metricRects.btw, layout.responsive)
      };
      let xteValueText = xteDistance + xteSide;
      if (stableDigitsEnabled) {
        const xteStable = stableDigits.normalize(xteDistance, {
          integerWidth: stableDigits.resolveIntegerWidth(xteDistance, 2),
          reserveSignSlot: false,
          sideSuffix: xteSide,
          reserveSideSuffixSlot: true
        });
        xteValueText = xteStable.padded;
        if (xteStable.padded !== xteStable.plain) {
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
            padX: metricSpacing.xte.padX,
            captionHeightPx: metricSpacing.xte.captionHeightPx
          }));
          const fit = probe && probe.fit ? probe.fit : null;
          const clipped = !!(probe && fit && fit.total > probe.textW + 0.01);
          if (clipped) {
            xteValueText = xteStable.plain;
          }
        }
      }

      const metrics = {
        cog: { caption: captions && captions.track, value: trackValue, unit: units && units.track },
        xte: { caption: captions && captions.xte, value: xteValueText, unit: units && units.xte },
        dtw: { caption: captions && captions.dtw, value: dtwDistance, unit: units && units.dtw },
        btw: { caption: captions && captions.brg, value: bearingValue, unit: units && units.brg }
      };

      const nameRect = layout.nameRect;
      const waypointFit = showWpName && !!wpName && nameRect ? /** @type {DyniXteWaypointFit} */ (tileLayout.measureFittedLine({
        textApi: toolkit.text,
        ctx: ctx,
        text: wpName,
        maxW: nameRect.w,
        maxH: nameRect.h,
        maxPx: Math.max(1, Math.floor(nameRect.h * 0.72)),
        textFillScale: layout.responsive.textFillScale,
        family: family,
        weight: labelWeight
      })) : null;

      if (nameRect && primitives.shouldShowWaypoint(mode, layout, showWpName, wpName, waypointFit)) {
        tileLayout.drawFittedLine({
          textApi: toolkit.text,
          ctx: ctx,
          fit: waypointFit,
          text: wpName,
          rect: nameRect,
          align: "center",
          family: family,
          weight: labelWeight,
          maxPx: Math.max(1, Math.floor(nameRect.h * 0.72)),
          color: textColor
        });
      }

      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.cog,
        rect: metricRects.cog,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.75,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.cog.padX,
        captionHeightPx: metricSpacing.cog.captionHeightPx,
        captionOpacity: captionOpacity,
        unitOpacity: unitOpacity
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.xte,
        rect: metricRects.xte,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.7,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.xte.padX,
        captionHeightPx: metricSpacing.xte.captionHeightPx,
        captionOpacity: captionOpacity,
        unitOpacity: unitOpacity
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.dtw,
        rect: metricRects.dtw,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.7,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.dtw.padX,
        captionHeightPx: metricSpacing.dtw.captionHeightPx,
        captionOpacity: captionOpacity,
        unitOpacity: unitOpacity
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.btw,
        rect: metricRects.btw,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.75,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.btw.padX,
        captionHeightPx: metricSpacing.btw.captionHeightPx,
        captionOpacity: captionOpacity,
        unitOpacity: unitOpacity
      });

      if (xteAvailable && springMotion.isActive(canvas)) {
        return { wantsFollowUpFrame: true };
      }
    }

    function translateFunction() {
      return {};
    }

    function finalizeFunction() {
      staticLayer.invalidate();
    }

    return {
      id: "XteDisplayWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "XteDisplayWidget", create: create };
}));
