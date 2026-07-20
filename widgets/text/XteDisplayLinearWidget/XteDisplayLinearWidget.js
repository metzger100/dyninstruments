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
})(this, function () {
  "use strict";
  /** @param {unknown} def @param {DyniXteLinearContext} componentContext */
  function create(def, componentContext) {
    const toolkit = /** @type {DyniXteLinearToolkit} */ (componentContext.components.require("GaugeToolkit"));
    const cacheFactory = componentContext.components.require("CanvasLayerCache");
    const gaugeMath = componentContext.components.require("LinearGaugeMath");
    const linearPrimitives = componentContext.components.require("XteLinearPrimitives");
    const propsView = componentContext.components.require("XteDisplayPropsNormalize");
    const renderSetup = componentContext.components.require("XteDisplayRenderSetup");
    const layoutApi = componentContext.components.require("XteLinearLayout");
    const tileLayout = componentContext.components.require("TextTileLayout");
    const dynamicMetrics = componentContext.components.require("XteLinearDynamicMetrics");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back", "front"] });

    /** @param {DyniWidgetValues} props */
    function resolveStateKind(props) {
      const display = /** @type {DyniXteLinearData} */ (props.display);
      const waypointName = display.wpName;
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: display.disconnect === true },
        { kind: "noTarget", when: waypointName === "" },
        { kind: "data", when: true }
      ]);
    }

    /** @param {DyniXteLinearTheme} theme @param {boolean} stableDigitsEnabled @returns {{ family: unknown, labelWeight: unknown, valueWeight: unknown, captionOpacity: unknown, unitOpacity: unknown }} */
    function resolveThemeView(theme, stableDigitsEnabled) {
      const family = stableDigitsEnabled ? theme.font.familyMono || theme.font.family : theme.font.family;
      const labelWeight = theme.font.labelWeight;
      const valueWeight = theme.font.weight;
      const captionOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.caption : undefined;
      const unitOpacity = theme.opacity && typeof theme.opacity === "object" ? theme.opacity.unit : undefined;
      return {
        family,
        labelWeight,
        valueWeight,
        captionOpacity,
        unitOpacity
      };
    }

    /** @param {DyniWidgetValues} p @returns {{ display: DyniXteLinearData, captions: DyniXteLinearData, units: DyniXteLinearData, formatUnits: DyniXteLinearData, layoutConfig: DyniXteLinearLayoutConfig, easingEnabled: boolean, hideTextualMetrics: boolean, showWpName: boolean, xteScale: number }} */
    function readXteLinearProps(p) {
      const base = propsView.read(p);
      const layoutConfig = /** @type {DyniXteLinearLayoutConfig} */ (base.layoutConfig);
      return {
        display: /** @type {DyniXteLinearData} */ (base.display),
        captions: /** @type {DyniXteLinearData} */ (base.captions),
        units: /** @type {DyniXteLinearData} */ (base.units),
        formatUnits: /** @type {DyniXteLinearData} */ (base.formatUnits),
        layoutConfig,
        easingEnabled: base.easingEnabled,
        hideTextualMetrics: base.hideTextualMetrics,
        showWpName: /** @type {boolean} */ (layoutConfig.showWpName),
        xteScale: base.xteScale
      };
    }

    /** @param {{ W: number, H: number, layoutConfig: DyniXteLinearLayoutConfig, hideTextualMetrics: boolean, showWpName: boolean, display: DyniXteLinearData, theme: DyniXteLinearTheme, xteScale: number }} options @returns {{ mode: DyniXteMode, layout: DyniXteLinearLayoutResult, geom: DyniXteLinearGeometry, ticks: DyniLinearTicks, showEndLabels: boolean, wpName: string }} */
    function computeXteLinearLayoutAndGeometry(options) {
      const { W, H, layoutConfig, hideTextualMetrics, showWpName, display, theme, xteScale } = options;
      const mode = layoutApi.computeMode(W, H, layoutConfig.ratioThresholdNormal, layoutConfig.ratioThresholdFlat);
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(
        W,
        H,
        /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (insets))
      );
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
      const geom = linearPrimitives.resolveGeometry(layout, theme);
      const majorStep = /** @type {number} */ (layoutConfig.tickMajor);
      const minorStep = /** @type {number} */ (layoutConfig.tickMinor);
      const ticks = gaugeMath.buildTicks(-xteScale, xteScale, majorStep, minorStep);
      const showEndLabels = /** @type {boolean} */ (layoutConfig.showEndLabels);
      return {
        mode,
        layout,
        geom,
        ticks,
        showEndLabels,
        wpName
      };
    }

    /** @param {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, W: number, H: number, mode: DyniXteMode, layout: DyniXteLinearLayoutResult, geom: DyniXteLinearGeometry, ticks: DyniLinearTicks, showEndLabels: boolean, xteScale: number, theme: DyniXteLinearTheme, family: unknown, labelWeight: unknown }} options @returns {void} */
    function drawLinearStaticLayers(options) {
      const { canvas, ctx, W, H, mode, layout, geom, ticks, showEndLabels, xteScale, theme, family, labelWeight } =
        options;
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
          linearPrimitives.drawTrackLayer(layerCtx, geom, theme.surface.fg);
          return;
        }
        linearPrimitives.drawTicksLayer(layerCtx, geom, ticks, xteScale, theme.surface.fg);
        linearPrimitives.drawEndLabels({
          ctx: layerCtx,
          theme: theme,
          geom: geom,
          ticks: ticks,
          showEndLabels: showEndLabels,
          family: family,
          labelWeight: labelWeight
        });
      });
      staticLayer.blitLayer(ctx, "back");
    }

    /** @param {{ ctx: CanvasRenderingContext2D, metrics: Record<"cog"|"xte"|"dtw"|"btw", { caption: unknown, value: string, unit: unknown }>, metricRects: DyniXteMetricRects | null, layout: DyniXteLinearLayoutResult, theme: DyniXteLinearTheme, family: unknown, valueWeight: unknown, labelWeight: unknown, captionOpacity: unknown, unitOpacity: unknown }} options @returns {void} */
    function drawLinearMetricTiles(options) {
      const {
        ctx,
        metrics,
        metricRects,
        layout,
        theme,
        family,
        valueWeight,
        labelWeight,
        captionOpacity,
        unitOpacity
      } = options;
      if (!(metricRects && metricRects.cog && metricRects.xte && metricRects.dtw && metricRects.btw)) {
        return;
      }
      const spacing = {
        cog: layoutApi.computeMetricTileSpacing(metricRects.cog, layout.responsive),
        xte: layoutApi.computeMetricTileSpacing(metricRects.xte, layout.responsive),
        dtw: layoutApi.computeMetricTileSpacing(metricRects.dtw, layout.responsive),
        btw: layoutApi.computeMetricTileSpacing(metricRects.btw, layout.responsive)
      };
      const fields = /** @type {Array<"cog"|"xte"|"dtw"|"btw">} */ (["cog", "xte", "dtw", "btw"]);
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

    /** @param {{ ctx: CanvasRenderingContext2D, layout: DyniXteLinearLayoutResult, showWpName: boolean, wpName: string, family: unknown, labelWeight: unknown, theme: DyniXteLinearTheme }} options @returns {void} */
    function drawLinearWaypointName(options) {
      const { ctx, layout, showWpName, wpName, family, labelWeight, theme } = options;
      const nameRect = layout.nameRect;
      if (!(showWpName && wpName && nameRect && nameRect.w > 0 && nameRect.h > 0)) {
        return;
      }
      const fit = /** @type {DyniXteWaypointFit} */ (
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
      );
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
        stateScreenColor: function (theme) {
          return /** @type {DyniXteLinearTheme} */ (theme).surface.fg;
        }
      });
      if (!setup) {
        return;
      }
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;
      const theme = /** @type {DyniXteLinearTheme} */ (setup.theme);
      const themeView =
        /** @type {{ family: unknown, labelWeight: unknown, valueWeight: unknown, captionOpacity: unknown, unitOpacity: unknown }} */ (
          setup.themeView
        );
      const stableDigitsEnabled = p.stableDigits === true;

      const xteProps = readXteLinearProps(p);
      const {
        display,
        captions,
        units,
        formatUnits,
        layoutConfig,
        easingEnabled,
        hideTextualMetrics,
        showWpName,
        xteScale
      } = xteProps;

      const geometry = computeXteLinearLayoutAndGeometry({
        W,
        H,
        layoutConfig,
        hideTextualMetrics,
        showWpName,
        display,
        theme,
        xteScale
      });
      const { mode, layout, geom, ticks, showEndLabels, wpName } = geometry;

      drawLinearStaticLayers({
        canvas,
        ctx,
        W,
        H,
        mode,
        layout,
        geom,
        ticks,
        showEndLabels,
        xteScale,
        theme,
        family: themeView.family,
        labelWeight: themeView.labelWeight
      });

      const dyn = dynamicMetrics.resolveAndDrawLinearPointer({
        canvas: canvas,
        ctx: ctx,
        geom: geom,
        theme: theme,
        display: display,
        formatUnits: formatUnits,
        props: p,
        xteScale: xteScale,
        easingEnabled: easingEnabled
      });

      staticLayer.blitLayer(ctx, "front");

      if (hideTextualMetrics) {
        if (dyn.xteHasValue && dynamicMetrics.isPointerMotionActive(canvas)) {
          return { wantsFollowUpFrame: true };
        }
        return;
      }

      const xteSide =
        !dyn.xteDistanceMissing && dyn.xteNumber !== undefined
          ? dyn.xteNumber > 0
            ? "R"
            : dyn.xteNumber < 0
              ? "L"
              : ""
          : "";
      let xteValueText = dyn.xteDistance + xteSide;
      const metricRects = layout.metricRects;

      if (stableDigitsEnabled) {
        xteValueText = dynamicMetrics.resolveStableDigitsXteTextLinear({
          ctx: ctx,
          xteDistance: dyn.xteDistance,
          xteSide: xteSide,
          captions: captions,
          units: units,
          family: themeView.family,
          valueWeight: themeView.valueWeight,
          labelWeight: themeView.labelWeight,
          layout: layout,
          metricRects: metricRects
        });
      }

      const metrics = dynamicMetrics.buildLinearMetrics({
        display: display,
        formatUnits: formatUnits,
        layoutConfig: layoutConfig,
        defaultText: dyn.defaultText,
        xteValueText: xteValueText,
        captions: captions,
        units: units
      });

      drawLinearMetricTiles({
        ctx,
        metrics,
        metricRects,
        layout,
        theme,
        family: themeView.family,
        valueWeight: themeView.valueWeight,
        labelWeight: themeView.labelWeight,
        captionOpacity: themeView.captionOpacity,
        unitOpacity: themeView.unitOpacity
      });
      drawLinearWaypointName({
        ctx,
        layout,
        showWpName,
        wpName,
        family: themeView.family,
        labelWeight: themeView.labelWeight,
        theme
      });

      if (dyn.xteHasValue && dynamicMetrics.isPointerMotionActive(canvas)) {
        return { wantsFollowUpFrame: true };
      }
    }

    return {
      id: "XteDisplayLinearWidget",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: function () {
        return {};
      },
      finalizeFunction: function () {
        staticLayer.invalidate();
      }
    };
  }

  return { id: "XteDisplayLinearWidget", create: create };
});
