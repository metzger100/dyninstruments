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
})(this, function () {
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
    const propsView = componentContext.components.require("XteDisplayPropsNormalize");
    const renderSetup = componentContext.components.require("XteDisplayRenderSetup");
    const layoutApi = componentContext.components.require("XteHighwayLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const springMotion = componentContext.components.require("SpringEasing").createMotion();
    const xteMetrics = componentContext.components.require("XteDisplayMetrics");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back"] });

    /** @param {DyniWidgetValues} props */
    function resolveStateKind(props) {
      const display = /** @type {DyniXteDisplayData} */ (props.display);
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: display.disconnect === true },
        { kind: "noTarget", when: display.wpName === "" },
        { kind: "data", when: true }
      ]);
    }

    /** @param {DyniXteWidgetTheme} theme @param {boolean} stableDigitsEnabled @returns {{ textColor: string, family: unknown, valueWeight: unknown, labelWeight: unknown, captionOpacity: unknown, unitOpacity: unknown }} */
    function resolveThemeView(theme, stableDigitsEnabled) {
      const textColor = theme.surface.fg;
      const family = stableDigitsEnabled ? theme.font.familyMono || theme.font.family : theme.font.family;
      const valueWeight = theme.font.weight;
      const labelWeight = theme.font.labelWeight;
      const captionOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.caption : undefined;
      const unitOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.unit : undefined;
      return {
        textColor,
        family,
        valueWeight,
        labelWeight,
        captionOpacity,
        unitOpacity
      };
    }

    /** @param {number} W @param {number} H @param {DyniXteDisplayLayoutConfig} layoutConfig @param {boolean} hideTextualMetrics @param {boolean} showWpName @param {DyniXteDisplayData} display @returns {{ mode: DyniXteMode, layout: DyniXteHighwayLayoutResult, primaryDim: number, geom: DyniHighwayGeom, wpName: string }} */
    function computeXteLayoutAndGeometry(W, H, layoutConfig, hideTextualMetrics, showWpName, display) {
      const mode = layoutApi.computeMode(
        W,
        H,
        layoutConfig.xteRatioThresholdNormal,
        layoutConfig.xteRatioThresholdFlat
      );
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const wpName = /** @type {string} */ (display.wpName);
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
      return {
        mode,
        layout,
        primaryDim,
        geom,
        wpName
      };
    }

    /** @param {DyniWidgetValues} p @returns {{ display: DyniXteDisplayData, captions: DyniXteDisplayData, units: DyniXteDisplayData, formatUnits: DyniXteDisplayData, layoutConfig: DyniXteDisplayLayoutConfig, easingEnabled: boolean, hideTextualMetrics: boolean, xteScale: number, showWpName: boolean }} */
    function readXteProps(p) {
      const base = propsView.read(p);
      const layoutConfig = /** @type {DyniXteDisplayLayoutConfig} */ (base.layoutConfig);
      return {
        display: /** @type {DyniXteDisplayData} */ (base.display),
        captions: /** @type {DyniXteDisplayData} */ (base.captions),
        units: /** @type {DyniXteDisplayData} */ (base.units),
        formatUnits: /** @type {DyniXteDisplayData} */ (base.formatUnits),
        layoutConfig,
        easingEnabled: base.easingEnabled,
        hideTextualMetrics: base.hideTextualMetrics,
        xteScale: base.xteScale,
        showWpName: /** @type {boolean} */ (layoutConfig.showWpName)
      };
    }

    /** @param {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, W: number, H: number, theme: DyniXteWidgetTheme, colors: DyniHighwayColors, mode: DyniXteMode, geom: DyniHighwayGeom, primaryDim: number }} options @returns {void} */
    function drawStaticHighwayLayer(options) {
      const { canvas, ctx, W, H, theme, colors, mode, geom, primaryDim } = options;
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
    }

    /** @param {{ ctx: CanvasRenderingContext2D, layout: DyniXteHighwayLayoutResult, showWpName: boolean, wpName: string, mode: DyniXteMode, family: unknown, labelWeight: unknown, textColor: string }} options @returns {void} */
    function drawWaypointName(options) {
      const { ctx, layout, showWpName, wpName, mode, family, labelWeight, textColor } = options;
      const nameRect = layout.nameRect;
      const waypointFit =
        showWpName && !!wpName && nameRect
          ? /** @type {DyniXteWaypointFit} */ (
              tileLayout.measureFittedLine({
                textApi: toolkit.text,
                ctx: ctx,
                text: wpName,
                maxW: nameRect.w,
                maxH: nameRect.h,
                maxPx: Math.max(1, Math.floor(nameRect.h * 0.72)),
                textFillScale: layout.responsive.textFillScale,
                family: family,
                weight: labelWeight
              })
            )
          : null;

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
    }

    /** @param {{ ctx: CanvasRenderingContext2D, metrics: Record<"cog"|"xte"|"dtw"|"btw", { caption: unknown, value: string, unit: unknown }>, metricRects: DyniXteMetricRects, metricSpacing: Record<"cog"|"xte"|"dtw"|"btw", DyniIntrinsicTileSpacing>, family: unknown, textColor: string, valueWeight: unknown, labelWeight: unknown, layout: DyniXteHighwayLayoutResult, captionOpacity: unknown, unitOpacity: unknown }} options @returns {void} */
    function drawMetricTiles(options) {
      const {
        ctx,
        metrics,
        metricRects,
        metricSpacing,
        family,
        textColor,
        valueWeight,
        labelWeight,
        layout,
        captionOpacity,
        unitOpacity
      } = options;
      const fields = /** @type {Array<"cog"|"xte"|"dtw"|"btw">} */ (["cog", "xte", "dtw", "btw"]);
      const secScales = { cog: 0.75, xte: 0.7, dtw: 0.7, btw: 0.75 };
      for (let i = 0; i < fields.length; i++) {
        const key = fields[i];
        tileLayout.drawMetricTile({
          textApi: toolkit.text,
          ctx: ctx,
          metric: metrics[key],
          rect: metricRects[key],
          family: family,
          color: textColor,
          valueWeight: valueWeight,
          labelWeight: labelWeight,
          secScale: secScales[key],
          textFillScale: layout.responsive.textFillScale,
          padX: metricSpacing[key].padX,
          captionHeightPx: metricSpacing[key].captionHeightPx,
          captionOpacity: captionOpacity,
          unitOpacity: unitOpacity
        });
      }
    }

    /** @param {HTMLCanvasElement} canvas @param {DyniWidgetValues} props */
    function renderCanvas(canvas, props) {
      const p = props;
      const setup = renderSetup.resolveRenderSetup({
        componentContext: componentContext,
        toolkit: toolkit,
        canvas: canvas,
        props: p,
        resolveThemeView: resolveThemeView,
        resolveStateKind: resolveStateKind,
        stateScreenLabels: stateScreenLabels,
        stateScreenCanvasOverlay: stateScreenCanvasOverlay,
        stateScreenColor: function (theme, themeView) {
          return /** @type {string} */ (themeView.textColor);
        }
      });
      if (!setup) {
        return;
      }
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;
      const theme = /** @type {DyniXteWidgetTheme} */ (setup.theme);
      const themeView =
        /** @type {{ textColor: string, family: unknown, valueWeight: unknown, labelWeight: unknown, captionOpacity: unknown, unitOpacity: unknown }} */ (
          setup.themeView
        );
      const stableDigitsEnabled = p.stableDigits === true;

      const colors = {
        pointer: theme.colors.pointer,
        alarm: theme.colors.alarm,
        roadLine: themeView.textColor,
        stripeLine: themeView.textColor
      };

      const xteProps = readXteProps(p);
      const {
        display,
        captions,
        units,
        formatUnits,
        layoutConfig,
        easingEnabled,
        hideTextualMetrics,
        xteScale,
        showWpName
      } = xteProps;

      const geometry = computeXteLayoutAndGeometry(W, H, layoutConfig, hideTextualMetrics, showWpName, display);
      const { mode, layout, primaryDim, geom, wpName } = geometry;

      drawStaticHighwayLayer({
        canvas: canvas,
        ctx: ctx,
        W: W,
        H: H,
        theme: theme,
        colors: colors,
        mode: mode,
        geom: geom,
        primaryDim: primaryDim
      });

      const dyn = xteMetrics.resolveAndDrawDynamicXte({
        springMotion: springMotion,
        canvas: canvas,
        ctx: ctx,
        geom: geom,
        colors: colors,
        primaryDim: primaryDim,
        theme: theme,
        display: display,
        formatUnits: formatUnits,
        layoutConfig: layoutConfig,
        props: p,
        xteScale: xteScale,
        easingEnabled: easingEnabled
      });

      if (hideTextualMetrics) {
        if (dyn.xteAvailable && springMotion.isActive(canvas)) {
          return { wantsFollowUpFrame: true };
        }
        return;
      }

      const metricRects = /** @type {DyniXteMetricRects | null} */ (layout.metricRects);
      if (!metricRects) {
        return;
      }
      const { metricSpacing, metrics } = xteMetrics.buildXteMetrics({
        ctx: ctx,
        dyn: dyn,
        captions: captions,
        units: units,
        stableDigitsEnabled: stableDigitsEnabled,
        themeView: themeView,
        layout: layout,
        metricRects: metricRects
      });

      drawWaypointName({
        ctx,
        layout,
        showWpName,
        wpName,
        mode,
        family: themeView.family,
        labelWeight: themeView.labelWeight,
        textColor: themeView.textColor
      });
      drawMetricTiles({
        ctx,
        metrics,
        metricRects,
        metricSpacing,
        family: themeView.family,
        textColor: themeView.textColor,
        valueWeight: themeView.valueWeight,
        labelWeight: themeView.labelWeight,
        layout,
        captionOpacity: themeView.captionOpacity,
        unitOpacity: themeView.unitOpacity
      });

      if (dyn.xteAvailable && springMotion.isActive(canvas)) {
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
});
