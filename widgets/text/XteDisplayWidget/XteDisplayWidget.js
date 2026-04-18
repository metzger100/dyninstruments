/**
 * Module: XteDisplayWidget - Responsive XTE highway renderer with integrated nav metrics
 * Documentation: documentation/widgets/xte-display.md
 * Depends: RadialToolkit, CanvasLayerCache, XteHighwayPrimitives, XteHighwayLayout, TextTileLayout, PlaceholderNormalize, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenCanvasOverlay
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayWidget = factory(); }
}(this, function () {
  "use strict";

  const FIXED_XTE_SCALE = 1;
  const DEFAULT_XTE_THEME = { lineWidthFactor: 1, boatSizeFactor: 1 };

  function create(def, Helpers) {
    const toolkit = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const cacheFactory = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const primitives = Helpers.getModule("XteHighwayPrimitives").create(def, Helpers);
    const layoutApi = Helpers.getModule("XteHighwayLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const placeholderNormalize = Helpers.getModule("PlaceholderNormalize").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenCanvasOverlay = Helpers.getModule("StateScreenCanvasOverlay").create(def, Helpers);
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back"] });

    function finiteNumber(value) {
      const checker = toolkit.value && toolkit.value.isFiniteNumber;
      if (typeof checker === "function") {
        return checker(value);
      }
      return typeof value === "number" && isFinite(value);
    }

    function textOrDefault(value, defaultText) {
      if (typeof value === "string") {
        return value;
      }
      if (value == null) {
        return defaultText;
      }
      return String(value);
    }

    function parseNumericText(text, defaultNumber) {
      const raw = textOrDefault(text, "");
      const extract = toolkit.value && toolkit.value.extractNumberText;
      const token = typeof extract === "function" ? extract(raw) : String(raw).match(/-?\d+(?:\.\d+)?/)?.[0];
      if (!token) {
        return defaultNumber;
      }
      const normalized = String(token).replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : defaultNumber;
    }

    function trimWaypointName(raw) {
      if (typeof raw !== "string") {
        return "";
      }
      return raw.trim();
    }

    function resolveStateKind(props) {
      const p = props || {};
      return stateScreenPrecedence.pickFirst([
        { kind: "disconnected", when: p.disconnect === true },
        { kind: "noTarget", when: typeof p.wpName === "string" && p.wpName.trim() === "" },
        { kind: "data", when: true }
      ]);
    }

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup.ctx;
      const W = setup.W;
      const H = setup.H;

      if (!W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      const rootEl = Helpers.requirePluginRoot(canvas);
      const theme = toolkit.theme.resolveForRoot(rootEl);
      const xteTheme = theme.xte || DEFAULT_XTE_THEME;
      const textColor = theme.surface.fg;
      const stableDigitsEnabled = p.stableDigits === true;
      const family = stableDigitsEnabled
        ? (theme.font.familyMono || theme.font.family)
        : theme.font.family;
      const valueWeight = theme.font.weight;
      const labelWeight = theme.font.labelWeight;
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
      const lineWidthFactor = xteTheme.lineWidthFactor > 0 ? xteTheme.lineWidthFactor : 1;
      const boatSizeFactor = xteTheme.boatSizeFactor > 0 ? xteTheme.boatSizeFactor : 1;

      const colors = {
        pointer: theme.colors.pointer,
        alarm: theme.colors.alarm,
        roadLine: textColor,
        stripeLine: textColor
      };

      const xteStaticStyle = {
        lineWidthFactor: lineWidthFactor
      };
      const xteDynamicStyle = {
        lineWidthFactor: lineWidthFactor,
        boatSizeFactor: boatSizeFactor
      };

      const guidanceAvailable =
        finiteNumber(p.xte) &&
        finiteNumber(p.cog) &&
        finiteNumber(p.dtw) &&
        finiteNumber(p.btw);

      const normalThreshold = p.xteRatioThresholdNormal;
      const flatThreshold = p.xteRatioThresholdFlat;
      const mode = layoutApi.computeMode(W, H, normalThreshold, flatThreshold);
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const wpName = trimWaypointName(p.wpName);
      const reserveNameSpace = (p.showWpName !== false) && !!wpName;
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        mode: mode,
        responsive: insets.responsive,
        reserveNameSpace: reserveNameSpace
      });
      const geom = primitives.highwayGeometry(layout.highway, mode, {
        compactTop: !reserveNameSpace
      });

      const staticKey = {
        mode: mode,
        geom: geom,
        lineWidthFactor: xteStaticStyle.lineWidthFactor,
        roadLine: colors.roadLine,
        stripeLine: colors.stripeLine
      };

      staticLayer.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
        if (layerName !== "back") {
          return;
        }
        layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
        primitives.drawStaticHighway(layerCtx, geom, colors, mode, xteStaticStyle);
      });
      staticLayer.blit(ctx);

      const xteRaw = p.xte;
      const cogRaw = p.cog;
      const dtwRaw = p.dtw;
      const btwRaw = p.btw;
      const headingParams = [p.leadingZero !== false];
      const defaultText = placeholderNormalize.normalize(undefined, p.default);

      const xteDistanceRaw = String(Helpers.applyFormatter(
        finiteNumber(xteRaw) ? Math.abs(xteRaw) : undefined,
        {
        formatter: "formatDistance",
        formatterParameters: [p.xteUnit],
        default: defaultText
        }
      ));
      const xteDistance = placeholderNormalize.normalize(xteDistanceRaw, defaultText);

      const dtwDistanceRaw = String(Helpers.applyFormatter(dtwRaw, {
        formatter: "formatDistance",
        formatterParameters: [p.dtwUnit],
        default: defaultText
      }));
      const dtwDistance = placeholderNormalize.normalize(dtwDistanceRaw, defaultText);

      const xteDistanceMissing = placeholderNormalize.isPlaceholder(xteDistanceRaw);
      const xteSide = (!xteDistanceMissing && finiteNumber(xteRaw)) ? (xteRaw > 0 ? "R" : (xteRaw < 0 ? "L" : "")) : "";
      if (guidanceAvailable) {
        const xteDisplayAbs = parseNumericText(xteDistance, Math.abs(xteRaw));
        const signedDisplayXte = xteRaw < 0 ? -xteDisplayAbs : xteDisplayAbs;
        const xteNormalized = signedDisplayXte / FIXED_XTE_SCALE;
        const overflow = Math.abs(xteDisplayAbs) > FIXED_XTE_SCALE;
        primitives.drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow, xteDynamicStyle);
      }

      const trackValueRaw = String(Helpers.applyFormatter(cogRaw, {
        formatter: "formatDirection360",
        formatterParameters: headingParams,
        default: defaultText
      }));
      const trackValue = placeholderNormalize.normalize(trackValueRaw, defaultText);

      const bearingValueRaw = String(Helpers.applyFormatter(btwRaw, {
        formatter: "formatDirection360",
        formatterParameters: headingParams,
        default: defaultText
      }));
      const bearingValue = placeholderNormalize.normalize(bearingValueRaw, defaultText);

      const metricSpacing = {
        cog: layoutApi.computeMetricTileSpacing(layout.metricRects.cog, layout.responsive),
        xte: layoutApi.computeMetricTileSpacing(layout.metricRects.xte, layout.responsive),
        dtw: layoutApi.computeMetricTileSpacing(layout.metricRects.dtw, layout.responsive),
        btw: layoutApi.computeMetricTileSpacing(layout.metricRects.btw, layout.responsive)
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
        if (xteStable.padded !== xteStable.fallback) {
          const probe = tileLayout.measureMetricTile({
            textApi: toolkit.text,
            ctx: ctx,
            metric: { caption: p.xteCaption, value: xteStable.padded, unit: "" },
            rect: layout.metricRects.xte,
            family: family,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            secScale: 0.7,
            textFillScale: layout.responsive.textFillScale,
            padX: metricSpacing.xte.padX,
            captionHeightPx: metricSpacing.xte.captionHeightPx
          });
          const fit = probe && probe.fit ? probe.fit : null;
          const clipped = !!(probe && fit && fit.total > probe.textW + 0.01);
          if (clipped) {
            xteValueText = xteStable.fallback;
          }
        }
      }

      const metrics = {
        cog: { caption: p.trackCaption, value: trackValue, unit: p.trackUnit },
        xte: { caption: p.xteCaption, value: xteValueText, unit: "" },
        dtw: { caption: p.dtwCaption, value: dtwDistance, unit: p.dtwUnit },
        btw: { caption: p.btwCaption, value: bearingValue, unit: p.btwUnit }
      };

      const waypointFit = reserveNameSpace ? tileLayout.measureFittedLine({
        textApi: toolkit.text,
        ctx: ctx,
        text: wpName,
        maxW: layout.nameRect.w,
        maxH: layout.nameRect.h,
        maxPx: Math.max(1, Math.floor(layout.nameRect.h * 0.72)),
        textFillScale: layout.responsive.textFillScale,
        family: family,
        weight: labelWeight
      }) : null;

      if (primitives.shouldShowWaypoint(mode, layout, p.showWpName !== false, wpName, waypointFit)) {
        tileLayout.drawFittedLine({
          textApi: toolkit.text,
          ctx: ctx,
          fit: waypointFit,
          text: wpName,
          rect: layout.nameRect,
          align: "center",
          family: family,
          weight: labelWeight,
          maxPx: Math.max(1, Math.floor(layout.nameRect.h * 0.72)),
          color: textColor
        });
      }

      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.cog,
        rect: layout.metricRects.cog,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.75,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.cog.padX,
        captionHeightPx: metricSpacing.cog.captionHeightPx
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.xte,
        rect: layout.metricRects.xte,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.7,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.xte.padX,
        captionHeightPx: metricSpacing.xte.captionHeightPx
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.dtw,
        rect: layout.metricRects.dtw,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.7,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.dtw.padX,
        captionHeightPx: metricSpacing.dtw.captionHeightPx
      });
      tileLayout.drawMetricTile({
        textApi: toolkit.text,
        ctx: ctx,
        metric: metrics.btw,
        rect: layout.metricRects.btw,
        family: family,
        color: textColor,
        valueWeight: valueWeight,
        labelWeight: labelWeight,
        secScale: 0.75,
        textFillScale: layout.responsive.textFillScale,
        padX: metricSpacing.btw.padX,
        captionHeightPx: metricSpacing.btw.captionHeightPx
      });
    }

    function translateFunction() {
      return {};
    }

    function finalizeFunction() {
      staticLayer.invalidate();
    }

    function getVerticalShellSizing() {
      return { kind: "ratio", aspectRatio: 2 };
    }

    return {
      id: "XteDisplayWidget",
      version: "1.0.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      getVerticalShellSizing: getVerticalShellSizing,
      translateFunction: translateFunction,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "XteDisplayWidget", create: create };
}));
