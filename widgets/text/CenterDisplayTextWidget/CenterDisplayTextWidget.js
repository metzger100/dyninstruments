/**
 * Module: CenterDisplayTextWidget - Responsive center-position renderer for the nav cluster
 * Documentation: documentation/widgets/center-display.md
 * Depends: ThemeResolver, TextLayoutEngine, RadialTextLayout, TextTileLayout, CenterDisplayLayout, CenterDisplayMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniCenterDisplayTextWidget = factory(); }
}(this, function () {
  "use strict";

  const DEGREE_UNIT = "\u00b0";

  function trimString(value) {
    return value == null ? "" : String(value).trim();
  }
  function appendUnit(text, unit, defaultText) {
    if (!unit || text === defaultText) {
      return text;
    }
    return text + unit;
  }
  function formatCoordinate(point, axis, defaultText, Helpers) {
    const raw = point && axis === "lat" ? point.lat : point && point.lon;
    const out = String(Helpers.applyFormatter(raw, {
      formatter: "formatLonLatsDecimal",
      formatterParameters: [axis],
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }
  function formatCourse(value, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(value, {
      formatter: "formatDirection",
      formatterParameters: [],
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }
  function formatDistance(value, unit, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(value, {
      formatter: "formatDistance",
      formatterParameters: [unit],
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }
  function buildDisplayState(props, math, defaultText, Helpers) {
    const p = props || {};
    const display = (p.display && typeof p.display === "object") ? p.display : {};
    const captions = (p.captions && typeof p.captions === "object") ? p.captions : {};
    const units = (p.units && typeof p.units === "object") ? p.units : {};
    const position = math.normalizePoint(display.position);
    const measureInfo = (display.measure && typeof display.measure === "object") ? display.measure : {};
    const measureStart = math.extractMeasureStart(measureInfo.activeMeasure);
    const measureRelation = (measureStart && position)
      ? math.computeCourseDistance(measureStart, position, measureInfo.useRhumbLine === true)
      : null;

    const rows = [];
    if (measureRelation) {
      rows.push({
        id: "measure",
        caption: trimString(captions.measure),
        unit: trimString(units.measure),
        course: measureRelation.course,
        distance: measureRelation.distance
      });
    }
    rows.push({
      id: "marker",
      caption: trimString(captions.marker),
      unit: trimString(units.marker),
      course: display.marker ? display.marker.course : undefined,
      distance: display.marker ? display.marker.distance : undefined
    });
    rows.push({
      id: "boat",
      caption: trimString(captions.boat),
      unit: trimString(units.boat),
      course: display.boat ? display.boat.course : undefined,
      distance: display.boat ? display.boat.distance : undefined
    });

    return {
      positionCaption: trimString(captions.position),
      latText: formatCoordinate(position, "lat", defaultText, Helpers),
      lonText: formatCoordinate(position, "lon", defaultText, Helpers),
      rows: rows.map(function (row) {
        const courseText = appendUnit(formatCourse(row.course, defaultText, Helpers), DEGREE_UNIT, defaultText);
        const distanceText = appendUnit(formatDistance(row.distance, row.unit, defaultText, Helpers), row.unit, defaultText);
        return {
          id: row.id,
          caption: row.caption,
          fullValueText: courseText + " / " + distanceText,
          compactValueText: courseText + "/" + distanceText
        };
      })
    };
  }
  function measureTextWidth(ctx, textApi, text, family, weight, px) {
    textApi.setFont(ctx, Math.max(1, Math.floor(Number(px) || 0)), weight, family);
    return ctx.measureText(String(text || "")).width;
  }
  function computeLineMaxPx(rect, ratio) {
    return Math.max(1, Math.floor(rect.h * ratio));
  }
  function computeResponsiveLineMaxPx(rect, ratio, fillScale) {
    return computeLineMaxPx(rect, ratio * fillScale);
  }
  function computeRelationValueMaxPx(layout, textFillScale) {
    const rowRects = layout.rowRects;
    let maxPx = 0;
    for (let i = 0; i < rowRects.length; i++) {
      const rect = rowRects[i];
      if (!rect || !(rect.h > 0)) {
        continue;
      }
      maxPx = Math.max(maxPx, computeResponsiveLineMaxPx(rect, 0.66, textFillScale));
    }
    return maxPx;
  }
  function clampShare(value, minShare, maxShare) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return undefined;
    }
    return Math.max(minShare, Math.min(maxShare, n));
  }

  function computeMeasurementHints(args) {
    const cfg = args || {};
    const rows = cfg.rows;
    const baseCaptionPx = Math.max(1, Math.floor(cfg.contentRect.h * 0.15));
    const baseCoordPx = Math.max(1, Math.floor(cfg.contentRect.h * 0.17));
    const baseRowLabelPx = Math.max(1, Math.floor(cfg.contentRect.h / Math.max(3, rows.length + 1)));
    const baseRowValuePx = Math.max(1, Math.floor(baseRowLabelPx * 1.18));
    const positionCaptionWidth = cfg.positionCaption
      ? measureTextWidth(cfg.ctx, cfg.textApi, cfg.positionCaption, cfg.family, cfg.labelWeight, baseCaptionPx)
      : 0;
    const coordWidth = Math.max(
      measureTextWidth(cfg.ctx, cfg.textApi, cfg.latText, cfg.family, cfg.valueWeight, baseCoordPx),
      measureTextWidth(cfg.ctx, cfg.textApi, cfg.lonText, cfg.family, cfg.valueWeight, baseCoordPx)
    );
    let rowBlockWidth = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const labelWidth = row.caption
        ? measureTextWidth(cfg.ctx, cfg.textApi, row.caption, cfg.family, cfg.labelWeight, baseRowLabelPx)
        : 0;
      const valueWidth = Math.min(
        measureTextWidth(cfg.ctx, cfg.textApi, row.fullValueText, cfg.family, cfg.valueWeight, baseRowValuePx),
        measureTextWidth(cfg.ctx, cfg.textApi, row.compactValueText, cfg.family, cfg.valueWeight, baseRowValuePx)
      );
      rowBlockWidth = Math.max(rowBlockWidth, labelWidth + cfg.gap + valueWidth);
    }

    const normalCaptionShare = positionCaptionWidth > 0
      ? clampShare(
        (positionCaptionWidth + cfg.gap) / Math.max(1, positionCaptionWidth + coordWidth + cfg.gap * 2),
        0.16,
        0.42
      )
      : undefined;
    const flatCenterShare = clampShare(
      Math.max(positionCaptionWidth, coordWidth) / Math.max(1, Math.max(positionCaptionWidth, coordWidth) + rowBlockWidth),
      0.28,
      0.56
    );
    const stackedCaptionRatio = clampShare(
      positionCaptionWidth > 0
        ? 0.16 + ((positionCaptionWidth / Math.max(1, positionCaptionWidth + coordWidth)) * 0.18)
        : 0.24,
      0.16,
      0.34
    );

    return {
      normalCaptionShare: normalCaptionShare,
      flatCenterShare: flatCenterShare,
      highCaptionRatio: stackedCaptionRatio,
      flatCaptionRatio: clampShare((stackedCaptionRatio || 0.24) * 0.92, 0.16, 0.34)
    };
  }

  function drawCenterPanel(layout, state, displayState, family, valueWeight, labelWeight, color) {
    const textFillScale = layout.responsive.textFillScale;
    const relationValueMaxPx = computeRelationValueMaxPx(layout, textFillScale);
    state.ctx.fillStyle = color;
    state.tileLayout.drawFittedLine({
      textApi: state.radialText,
      ctx: state.ctx,
      text: displayState.positionCaption,
      rect: layout.center.captionRect,
      align: layout.center.captionAlign,
      family: family,
      weight: labelWeight,
      maxPx: computeResponsiveLineMaxPx(layout.center.captionRect, 0.76, textFillScale),
      padX: state.layoutApi.computeTextPadPx(layout.center.captionRect, layout.responsive),
      color: color
    });
    state.tileLayout.drawFittedLine({
      textApi: state.radialText,
      ctx: state.ctx,
      text: displayState.latText,
      rect: layout.center.latRect,
      align: layout.center.coordAlign,
      family: family,
      weight: valueWeight,
      maxPx: relationValueMaxPx,
      padX: state.layoutApi.computeTextPadPx(layout.center.latRect, layout.responsive),
      color: color
    });
    state.tileLayout.drawFittedLine({
      textApi: state.radialText,
      ctx: state.ctx,
      text: displayState.lonText,
      rect: layout.center.lonRect,
      align: layout.center.coordAlign,
      family: family,
      weight: valueWeight,
      maxPx: relationValueMaxPx,
      padX: state.layoutApi.computeTextPadPx(layout.center.lonRect, layout.responsive),
      color: color
    });
  }

  function computeRowLayout(row, rect, state, family, valueWeight, labelWeight) {
    const gap = state.layoutApi.computeRowValueGapPx(rect, state.responsive);
    const textFillScale = state.textFillScale;
    const labelMaxPx = computeResponsiveLineMaxPx(rect, 0.58, textFillScale);
    const valueMaxPx = computeResponsiveLineMaxPx(rect, 0.66, textFillScale);
    const desiredLabelWidth = row.caption
      ? measureTextWidth(state.ctx, state.radialText, row.caption, family, labelWeight, labelMaxPx)
      : 0;
    const fullValueWidth = measureTextWidth(
      state.ctx,
      state.radialText,
      row.fullValueText,
      family,
      valueWeight,
      valueMaxPx
    );
    const compactValueWidth = measureTextWidth(
      state.ctx,
      state.radialText,
      row.compactValueText,
      family,
      valueWeight,
      valueMaxPx
    );
    const maxLabelWidth = Math.floor(rect.w * 0.40);
    const minValueWidth = Math.floor(rect.w * 0.42);
    const availableLabelWidth = Math.max(0, rect.w - minValueWidth - (row.caption ? gap : 0));
    const labelWidth = row.caption
      ? Math.max(0, Math.min(maxLabelWidth, availableLabelWidth, Math.floor(desiredLabelWidth)))
      : 0;
    const valueOffset = row.caption ? (labelWidth + gap) : 0;
    const valueRect = {
      x: rect.x + valueOffset,
      y: rect.y,
      w: Math.max(1, rect.w - valueOffset),
      h: rect.h
    };

    return {
      labelRect: {
        x: rect.x,
        y: rect.y,
        w: labelWidth,
        h: rect.h
      },
      valueRect: valueRect,
      valueText: fullValueWidth <= valueRect.w + 0.01 ? row.fullValueText : row.compactValueText,
      labelMaxPx: labelMaxPx,
      valueMaxPx: valueMaxPx
    };
  }

  function drawRelationRows(layout, rows, state, family, valueWeight, labelWeight, color) {
    state.ctx.fillStyle = color;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rect = layout.rowRects[i];
      if (!rect || !(rect.w > 0) || !(rect.h > 0)) {
        continue;
      }
      const rowLayout = computeRowLayout(row, rect, state, family, valueWeight, labelWeight);
      if (row.caption && rowLayout.labelRect.w > 0) {
        state.tileLayout.drawFittedLine({
          textApi: state.radialText,
          ctx: state.ctx,
          text: row.caption,
          rect: rowLayout.labelRect,
          align: "left",
          family: family,
          weight: labelWeight,
          maxPx: rowLayout.labelMaxPx,
          padX: state.layoutApi.computeTextPadPx(rowLayout.labelRect, layout.responsive),
          color: color
        });
      }
      state.tileLayout.drawFittedLine({
        textApi: state.radialText,
        ctx: state.ctx,
        text: rowLayout.valueText,
        rect: rowLayout.valueRect,
        align: "right",
        family: family,
        weight: valueWeight,
        maxPx: rowLayout.valueMaxPx,
        padX: state.layoutApi.computeTextPadPx(rowLayout.valueRect, layout.responsive),
        color: color
      });
    }
  }

  function create(def, Helpers) {
    const theme = Helpers.getModule("ThemeResolver").create(def, Helpers);
    const text = Helpers.getModule("TextLayoutEngine").create(def, Helpers);
    const radialText = Helpers.getModule("RadialTextLayout").create(def, Helpers);
    const tileLayout = Helpers.getModule("TextTileLayout").create(def, Helpers);
    const layoutApi = Helpers.getModule("CenterDisplayLayout").create(def, Helpers);
    const math = Helpers.getModule("CenterDisplayMath").create(def, Helpers);

    function renderCanvas(canvas, props) {
      const p = props || {};
      const setup = Helpers.setupCanvas(canvas);
      const ctx = setup && setup.ctx;
      const W = setup && setup.W;
      const H = setup && setup.H;
      if (!ctx || !W || !H) {
        return;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "middle";

      const tokens = theme.resolve(canvas);
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      const valueWeight = tokens.font.weight;
      const labelWeight = tokens.font.labelWeight;
      const defaultText = String(p.default);
      const modeData = text.computeModeLayout({
        W: W,
        H: H,
        ratioThresholdNormal: p.ratioThresholdNormal,
        ratioThresholdFlat: p.ratioThresholdFlat,
        captionText: "",
        unitText: ""
      });
      const insets = layoutApi.computeInsets(W, H);
      const contentRect = layoutApi.createContentRect(W, H, insets);
      const displayState = buildDisplayState(p, math, defaultText, Helpers);
      const hints = computeMeasurementHints({
        ctx: ctx,
        textApi: radialText,
        rows: displayState.rows,
        positionCaption: displayState.positionCaption,
        latText: displayState.latText,
        lonText: displayState.lonText,
        contentRect: contentRect,
        gap: insets.gap,
        family: family,
        valueWeight: valueWeight,
        labelWeight: labelWeight
      });
      const layout = layoutApi.computeLayout({
        contentRect: contentRect,
        mode: modeData.mode,
        relationCount: displayState.rows.length,
        gap: insets.gap,
        responsive: insets.responsive,
        normalCaptionShare: hints.normalCaptionShare,
        flatCenterShare: hints.flatCenterShare,
        highCaptionRatio: hints.highCaptionRatio,
        flatCaptionRatio: hints.flatCaptionRatio
      });
      const renderState = {
        ctx: ctx,
        radialText: radialText,
        tileLayout: tileLayout,
        textFillScale: layout.responsive.textFillScale,
        layoutApi: layoutApi,
        responsive: layout.responsive
      };

      drawCenterPanel(layout, renderState, displayState, family, valueWeight, labelWeight, color);
      drawRelationRows(layout, displayState.rows, renderState, family, valueWeight, labelWeight, color);
    }

    function translateFunction() { return {}; }
    return { id: "CenterDisplayTextWidget", wantsHideNativeHead: true, renderCanvas: renderCanvas, translateFunction: translateFunction };
  }
  return { id: "CenterDisplayTextWidget", create: create };
}));
