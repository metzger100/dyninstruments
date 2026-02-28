/**
 * Module: XteDisplayWidget - Responsive XTE highway renderer with integrated nav metrics
 * Documentation: documentation/widgets/xte-display.md
 * Depends: GaugeToolkit, CanvasLayerCache, XteHighwayPrimitives
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniXteDisplayWidget = factory(); }
}(this, function () {
  "use strict";

  const FIXED_XTE_SCALE = 1;

  function create(def, Helpers) {
    const toolkit = Helpers.getModule("GaugeToolkit").create(def, Helpers);
    const cacheFactory = Helpers.getModule("CanvasLayerCache").create(def, Helpers);
    const primitives = Helpers.getModule("XteHighwayPrimitives").create(def, Helpers);
    const staticLayer = cacheFactory.createLayerCache({ layers: ["back"] });

    function finiteNumber(value) {
      const checker = toolkit.value && toolkit.value.isFiniteNumber;
      if (typeof checker === "function") {
        return checker(value);
      }
      return typeof value === "number" && isFinite(value);
    }

    function fallbackText(value, fallback) {
      if (typeof value === "string") {
        return value;
      }
      if (value == null) {
        return fallback;
      }
      return String(value);
    }

    function parseNumericText(text, fallbackNumber) {
      const raw = fallbackText(text, "");
      const extract = toolkit.value && toolkit.value.extractNumberText;
      const token = typeof extract === "function" ? extract(raw) : String(raw).match(/-?\d+(?:\.\d+)?/)?.[0];
      if (!token) {
        return fallbackNumber;
      }
      const normalized = String(token).replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : fallbackNumber;
    }

    function trimWaypointName(raw) {
      if (typeof raw !== "string") {
        return "";
      }
      return raw.trim();
    }

    function drawWaypointName(ctx, textApi, rect, name, family, labelWeight, textColor) {
      if (!name || rect.w <= 0 || rect.h <= 0) {
        return;
      }

      let label = name;
      const maxPx = Math.max(10, Math.floor(rect.h * 0.72));
      let px = textApi.fitSingleTextPx(ctx, label, maxPx, rect.w, rect.h, family, labelWeight);
      textApi.setFont(ctx, px, labelWeight, family);
      while (label.length > 2 && ctx.measureText(label).width > rect.w) {
        label = label.slice(0, -1);
      }

      px = textApi.fitSingleTextPx(ctx, label, maxPx, rect.w, rect.h, family, labelWeight);
      textApi.setFont(ctx, px, labelWeight, family);
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, rect.x + rect.w * 0.5, rect.y + rect.h * 0.5);
    }

    function drawMetricStack(ctx, textApi, metric, rect, family, textColor, valueWeight, labelWeight, secScale) {
      if (!metric || rect.w <= 0 || rect.h <= 0) {
        return;
      }

      const caption = fallbackText(metric.caption, "");
      const value = fallbackText(metric.value, "---");
      const unit = fallbackText(metric.unit, "");
      const capH = Math.max(9, Math.floor(rect.h * 0.34));
      const valueY = rect.y + capH;
      const valueH = Math.max(8, rect.h - capH);

      ctx.fillStyle = textColor;
      textApi.drawCaptionMax(ctx, family, rect.x, rect.y, rect.w, capH, caption, capH, "center", labelWeight);
      const fit = textApi.measureValueUnitFit(
        ctx,
        family,
        value,
        unit,
        rect.w,
        valueH,
        secScale,
        valueWeight,
        labelWeight
      );
      textApi.drawValueUnitWithFit(
        ctx,
        family,
        rect.x,
        valueY,
        rect.w,
        valueH,
        value,
        unit,
        fit,
        "center",
        valueWeight,
        labelWeight
      );
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
      const theme = toolkit.theme.resolve(canvas) || {};
      const themeColors = theme.colors || {};
      const textColor = Helpers.resolveTextColor(canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const valueWeight = theme.font && finiteNumber(theme.font.weight) ? theme.font.weight : 700;
      const labelWeight = theme.font && finiteNumber(theme.font.labelWeight) ? theme.font.labelWeight : 700;

      const colors = {
        pointer: themeColors.pointer || textColor,
        laylineStb: themeColors.laylineStb || textColor,
        laylinePort: themeColors.laylinePort || textColor,
        warning: themeColors.warning || textColor,
        alarm: themeColors.alarm || textColor
      };

      const hasRequiredData =
        p.disconnect !== true &&
        finiteNumber(p.xte) &&
        finiteNumber(p.cog) &&
        finiteNumber(p.dtw) &&
        finiteNumber(p.btw);

      if (!hasRequiredData) {
        toolkit.text.drawDisconnectOverlay(ctx, W, H, family, textColor, "NO DATA", labelWeight);
        return;
      }

      const normalThreshold = finiteNumber(p.xteRatioThresholdNormal) ? p.xteRatioThresholdNormal : 0.85;
      const flatThreshold = finiteNumber(p.xteRatioThresholdFlat) ? p.xteRatioThresholdFlat : 2.3;
      const mode = primitives.computeMode(W, H, normalThreshold, flatThreshold, toolkit.value.computeMode);
      const pad = toolkit.value.computePad(W, H);
      const gap = toolkit.value.computeGap(W, H);
      const layout = primitives.computeLayout(W, H, pad, gap, mode);
      const geom = primitives.highwayGeometry(layout.highway, mode);

      const staticKey = {
        mode: mode,
        W: W,
        H: H,
        highway: layout.highway,
        geom: geom,
        textColor: textColor,
        family: family,
        labelWeight: labelWeight,
        pointer: colors.pointer,
        laylineStb: colors.laylineStb,
        laylinePort: colors.laylinePort,
        warning: colors.warning,
        alarm: colors.alarm
      };

      staticLayer.ensureLayer(canvas, staticKey, function (layerCtx, layerName, layerCanvas) {
        if (layerName !== "back") {
          return;
        }
        layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
        primitives.drawStaticHighway(layerCtx, geom, colors, textColor, mode);
      });
      staticLayer.blit(ctx);

      const headingUnit = fallbackText(p.headingUnit, "\u00b0");
      const headingParams = [p.leadingZero !== false];

      const xteDistance = fallbackText(Helpers.applyFormatter(Math.abs(p.xte), {
        formatter: "formatDistance",
        formatterParameters: [fallbackText(p.xteUnit, "nm")],
        default: "---"
      }), "---");

      const dtwDistance = fallbackText(Helpers.applyFormatter(p.dtw, {
        formatter: "formatDistance",
        formatterParameters: [fallbackText(p.dtwUnit, "nm")],
        default: "---"
      }), "---");

      const xteDisplayAbs = parseNumericText(xteDistance, Math.abs(p.xte));
      const signedDisplayXte = p.xte < 0 ? -xteDisplayAbs : xteDisplayAbs;
      const xteNormalized = signedDisplayXte / FIXED_XTE_SCALE;
      const overflow = Math.abs(xteDisplayAbs) > FIXED_XTE_SCALE;
      const xteSide = p.xte > 0 ? "R" : (p.xte < 0 ? "L" : "");

      primitives.drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow);

      const trackValue = fallbackText(Helpers.applyFormatter(p.cog, {
        formatter: "formatDirection360",
        formatterParameters: headingParams,
        default: "---"
      }), "---");

      const bearingValue = fallbackText(Helpers.applyFormatter(p.btw, {
        formatter: "formatDirection360",
        formatterParameters: headingParams,
        default: "---"
      }), "---");

      const metrics = {
        cog: { caption: fallbackText(p.trackCaption, "COG"), value: trackValue, unit: headingUnit },
        xte: { caption: fallbackText(p.xteCaption, "XTE"), value: xteDistance + xteSide, unit: "" },
        dtw: { caption: fallbackText(p.dtwCaption, "DST"), value: dtwDistance, unit: "" },
        btw: { caption: fallbackText(p.btwCaption, "BRG"), value: bearingValue, unit: headingUnit }
      };

      const wpName = trimWaypointName(p.wpName);
      if (primitives.shouldShowWaypoint(mode, layout.nameRect, p.showWpName !== false, wpName)) {
        drawWaypointName(ctx, toolkit.text, layout.nameRect, wpName, family, labelWeight, textColor);
      }

      drawMetricStack(ctx, toolkit.text, metrics.cog, layout.metricRects.cog, family, textColor, valueWeight, labelWeight, 0.75);
      drawMetricStack(ctx, toolkit.text, metrics.xte, layout.metricRects.xte, family, textColor, valueWeight, labelWeight, 0.7);
      drawMetricStack(ctx, toolkit.text, metrics.dtw, layout.metricRects.dtw, family, textColor, valueWeight, labelWeight, 0.7);
      drawMetricStack(ctx, toolkit.text, metrics.btw, layout.metricRects.btw, family, textColor, valueWeight, labelWeight, 0.75);
    }

    function translateFunction() {
      return {};
    }

    function finalizeFunction() {
      staticLayer.invalidate();
    }

    return {
      id: "XteDisplayWidget",
      version: "1.0.0",
      wantsHideNativeHead: true,
      renderCanvas: renderCanvas,
      translateFunction: translateFunction,
      finalizeFunction: finalizeFunction
    };
  }

  return { id: "XteDisplayWidget", create: create };
}));
