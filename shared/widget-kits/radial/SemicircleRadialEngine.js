/**
 * @file SemicircleRadialEngine - Shared renderer for semicircle gauge widgets
 * Documentation: documentation/widgets/semicircle-gauges.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialEngine = factory();
  }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniSemicircleRadialEngineApi}
   */
  function create(def, componentContext) {
    const DEFAULT_ARC = { startDeg: 270, endDeg: 450 };
    // Engine-owned last-resort fallback for callers that omit threshold props.
    const DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 };
    const DEFAULT_RANGE_DEFAULTS = { min: 0, max: 30 };
    const DEFAULT_RANGE_PROPS = { min: "minValue", max: "maxValue" };
    const DEFAULT_TICK_PROPS = { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
    const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
    const DEFAULT_TICK_PRESET = { major: 10, minor: 2 };
    const GU = componentContext.components.require("RadialToolkit");
    const layerCacheApi = componentContext.components.require("CanvasLayerCache");
    const layoutApi = componentContext.components.require("SemicircleRadialLayout");
    const textLayout = componentContext.components.require("SemicircleRadialTextLayout");
    const sectorMath = componentContext.components.require("RadialSectorMath");
    const radialValueMath = componentContext.components.require("RadialValueMath");
    const stableDigits = componentContext.components.require("StableDigits");
    const stateScreenLabels = componentContext.components.require("StateScreenLabels");
    const stateScreenPrecedence = componentContext.components.require("StateScreenPrecedence");
    const stateScreenCanvasOverlay = componentContext.components.require("StateScreenCanvasOverlay");
    const springMotion = componentContext.components.require("SpringEasing").createMotion();
    const text = GU.text;
    const value = GU.value;
    const angle = GU.angle;
    const draw = GU.draw;

    /**
     * @param {DyniRadialResolvedTheme} theme
     * @param {CanvasRenderingContext2D} ctx
     * @returns {{ family: unknown, color: unknown }}
     */
    function setupTextPaint(theme, ctx) {
      const family = theme.font.family;
      const color = theme.surface.fg;
      ctx.fillStyle = /** @type {string} */ (color);
      ctx.strokeStyle = /** @type {string} */ (color);
      return { family: family, color: color };
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {unknown} family
     * @param {DyniSemicircleGeom} geom
     * @param {DyniSemicircleLabels} labels
     * @param {number} minV
     * @param {number} maxV
     * @param {unknown} majorStep
     * @param {DyniArc} arc
     * @param {unknown} showEndLabels
     * @param {unknown} labelWeight
     * @returns {void}
     */
    function drawMajorValueLabels(ctx, family, geom, labels, minV, maxV, majorStep, arc, showEndLabels, labelWeight) {
      if (!Number.isFinite(minV) || !Number.isFinite(maxV) || maxV <= minV) {
        return;
      }
      const step = Math.abs(Number(majorStep));
      if (!Number.isFinite(step) || step <= 0) {
        return;
      }

      const angles = [];
      /** @type {Record<string, string>} */
      const labelsMap = {};
      const count = Math.max(1, Math.round((maxV - minV) / step));
      for (let i = 0; i <= count; i += 1) {
        let tickValue = minV + i * step;
        if (tickValue > maxV) {
          tickValue = maxV;
        }

        if (!showEndLabels && (i === 0 || value.isApprox(tickValue, maxV, 1e-6))) {
          if (value.isApprox(tickValue, maxV, 1e-6)) {
            break;
          }
          continue;
        }

        const angleDeg = angle.valueToAngleFlat(tickValue, minV, maxV, arc, true);
        angles.push(angleDeg);
      labelsMap[angleDeg] = value.formatMajorLabel(tickValue);

        if (value.isApprox(tickValue, maxV, 1e-6)) {
          break;
        }
      }

      if (!angles.length) {
        return;
      }

      draw.drawLabels(ctx, geom.cx, geom.cy, geom.rOuter, {
        angles: angles,
        radiusOffset: labels.radiusOffset,
        fontPx: labels.fontPx,
        weight: labelWeight,
        family: family,
        labelsMap: labelsMap
      });
    }

    /**
     * @param {DyniSemicircleRendererSpec} [spec]
     * @returns {DyniRadialRenderCanvas}
     */
    function createRenderer(spec) {
      const cfg = spec || {};
      const arc = /** @type {DyniArc} */ (hasOwn.call(cfg, "arc") ? cfg.arc : DEFAULT_ARC);
      const modeDefaults = /** @type {DyniSemicircleRatioDefaults} */ (hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS);
      const rangeDefaults = /** @type {DyniSemicircleRangeDefaults} */ (hasOwn.call(cfg, "rangeDefaults") ? cfg.rangeDefaults : DEFAULT_RANGE_DEFAULTS);
      const rangeProps = /** @type {DyniSemicirclePropKeys} */ (hasOwn.call(cfg, "rangeProps") ? cfg.rangeProps : DEFAULT_RANGE_PROPS);
      const tickProps = /** @type {DyniSemicircleTickPropKeys} */ (hasOwn.call(cfg, "tickProps") ? cfg.tickProps : DEFAULT_TICK_PROPS);
      const ratioProps = /** @type {DyniSemicircleRatioPropKeys} */ (hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS);
      const hideTextualMetricsProp = typeof cfg.hideTextualMetricsProp === "string" && cfg.hideTextualMetricsProp
        ? cfg.hideTextualMetricsProp
        : null;
      const unitDefault = hasOwn.call(cfg, "unitDefault") ? cfg.unitDefault : "";
      const customFormat = cfg.formatDisplay;
      const rawValueKey = typeof cfg.rawValueKey === "string" ? cfg.rawValueKey : "";
      const formatDisplay = typeof customFormat === "function"
        ? /** @type {DyniSemicircleFormatDisplay} */ (function (rawValue, props, unitText) {
          return customFormat(rawValue, props, unitText, componentContext);
        })
        : /** @type {DyniSemicircleFormatDisplay} */ (function (rawValue) {
          const numericRaw = value.toOptionalFiniteNumber(rawValue);
          if (typeof numericRaw !== "number") {
            return { num: NaN, text: "" };
          }
          return { num: numericRaw, text: String(rawValue) };
        });
      const tickSteps = typeof cfg.tickSteps === "function"
        ? cfg.tickSteps
        : function () {
          return DEFAULT_TICK_PRESET;
        };
      const buildSectors = typeof cfg.buildSectors === "function"
        ? cfg.buildSectors
        : function () {
          return [];
        };
      const fitCache = textLayout.createFitCache();
      const layerCache = layerCacheApi.createLayerCache({ layers: ["back", "front"] });
      /** @type {DyniSemicircleMemoLayout | null} */
      let memoLayout = null;

      /**
       * @param {unknown} canvas
       * @param {unknown} props
       * @returns {DyniRadialRenderResult}
       */
      return function renderCanvas(canvas, props) {
        const p = /** @type {DyniSemicircleEngineProps} */ (props || {});
        const surface = GU.resolveSurface(canvas);
        if (!surface) {
          return;
        }

        const ctx = surface.ctx;
        const W = surface.W;
        const H = surface.H;
        const rootEl = componentContext.dom.requirePluginRoot(canvas);
        const theme = (/** @type {DyniGaugeThemeResolver} */ (/** @type {unknown} */ (GU.theme))).resolveForRoot(rootEl);
        const paint = setupTextPaint(theme, ctx);
        const labelWeight = theme.font.labelWeight;
        const stableDigitsEnabled = p.stableDigits === true;
        const stateKind = stateScreenPrecedence.pickFirst([{ kind: "disconnected", when: p.disconnect === true }, { kind: "data", when: true }]);
        ctx.clearRect(0, 0, W, H);
        if (stateKind !== stateScreenLabels.KINDS.DATA) {
          stateScreenCanvasOverlay.drawStateScreen({
            ctx: ctx,
            W: W,
            H: H,
            family: paint.family,
            color: paint.color,
            labelWeight: labelWeight,
            kind: stateKind
          });
          return;
        }
        const ratioNormal = value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : modeDefaults.normal;
        const ratioFlat = value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : modeDefaults.flat;
        const memoKey = W + "," + H + "," + ratioNormal + "," + ratioFlat + "," + paint.family + "," + labelWeight + "," + paint.color;
        let mode;
        let insets;
        let layout;
        if (memoLayout && memoLayout.key === memoKey && memoLayout.themeRef === theme) {
          mode = memoLayout.mode;
          insets = memoLayout.insets;
          layout = memoLayout.layout;
        } else {
          mode = layoutApi.computeMode(W, H, ratioNormal, ratioFlat);
          insets = layoutApi.computeInsets(W, H);
          layout = layoutApi.computeLayout({
            W: W,
            H: H,
            theme: theme,
            mode: mode,
            insets: insets,
            responsive: insets.responsive
          });
          memoLayout = {
            key: memoKey,
            themeRef: theme,
            mode: mode,
            insets: insets,
            layout: layout
          };
        }
        const valueWeight = theme.font.weight;
        const family = stableDigitsEnabled
          ? (theme.font.familyMono || paint.family)
          : paint.family;
        const color = paint.color;
        const caption = p.caption;
        const unit = hasOwn.call(p, "unit") ? p.unit : unitDefault;
        const raw = (typeof p.value !== "undefined") ? p.value : p[rawValueKey];
        const display = formatDisplay(raw, p, unit);
        const range = value.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        const valueRawText = display.text.trim() || p.default;
        const valueText = stableDigitsEnabled
          ? stableDigits.normalize(valueRawText, {
            integerWidth: stableDigits.resolveIntegerWidth(valueRawText, 2, range.max),
            reserveSignSlot: true
          }).padded
          : valueRawText;
        const tickPreset = tickSteps(range.range);
        const tickMajor = value.isFiniteNumber(p[tickProps.major]) ? p[tickProps.major] : tickPreset.major;
        const tickMinor = value.isFiniteNumber(p[tickProps.minor]) ? p[tickProps.minor] : tickPreset.minor;
        const sectorList = buildSectors(p, range.min, range.max, arc, {
          sectorAngles: sectorMath.sectorAngles,
          buildHighEndSectors: sectorMath.buildHighEndSectors,
          buildLowEndSectors: sectorMath.buildLowEndSectors
        }, theme);
        const ticks = radialValueMath.buildValueTickAngles(range.min, range.max, tickMajor, tickMinor, arc);
        const showEndLabels = !!p[tickProps.showEndLabels];
        const staticKey = JSON.stringify({
          W: W,
          H: H,
          bufferW: /** @type {HTMLCanvasElement} */ (canvas).width,
          bufferH: /** @type {HTMLCanvasElement} */ (canvas).height,
          cx: layout.geom.cx,
          cy: layout.geom.cy,
          rOuter: layout.geom.rOuter,
          ringW: layout.geom.ringW,
          arcLineWidth: layout.geom.arcLineWidth,
          majorTickLen: layout.geom.majorTickLen,
          majorTickWidth: layout.geom.majorTickWidth,
          minorTickLen: layout.geom.minorTickLen,
          minorTickWidth: layout.geom.minorTickWidth,
          pointerDepth: layout.geom.pointerDepth,
          pointerSide: layout.geom.pointerSide,
          labelRadiusOffset: layout.labels.radiusOffset,
          labelFontPx: layout.labels.fontPx,
          labelWeight: labelWeight,
          family: family,
          color: paint.color,
          arcStart: arc.startDeg,
          arcEnd: arc.endDeg,
          tickMajor: tickMajor,
          tickMinor: tickMinor,
          showEndLabels: showEndLabels,
          rangeMin: range.min,
          rangeMax: range.max,
          sectorCount: sectorList.length,
          sectors: sectorList
        });
        const hideTextualMetrics = hideTextualMetricsProp ? p[hideTextualMetricsProp] === true : false;
        const numericDisplay = Number(display.num);
        const clampedValue = Number.isFinite(numericDisplay) ? value.clamp(numericDisplay, range.min, range.max) : NaN;
        const angleNow = Number.isFinite(clampedValue)
          ? angle.valueToAngleFlat(clampedValue, range.min, range.max, arc, true)
          : NaN;
        const easedAngle = springMotion.resolve(/** @type {object} */ (canvas), angleNow, p.easing !== false, Date.now());

        layerCache.ensureLayer(canvas, staticKey, function (layerCtx, layerName) {
          const dpr = Math.max(1, /** @type {HTMLCanvasElement} */ (canvas).width / Math.max(1, W));
          layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          layerCtx.clearRect(0, 0, W, H);
          layerCtx.fillStyle = /** @type {string} */ (paint.color);
          layerCtx.strokeStyle = /** @type {string} */ (paint.color);

          if (layerName === "back") {
            for (let i = 0; i < sectorList.length; i += 1) {
              const sector = sectorList[i];
              if (!sector || !value.isFiniteNumber(sector.a0) || !value.isFiniteNumber(sector.a1)) {
                continue;
              }
              draw.drawAnnularSector(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, {
                startDeg: sector.a0,
                endDeg: sector.a1,
                thickness: layout.geom.ringW,
                fillStyle: sector.color
              });
            }

            draw.drawArcRing(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, arc.startDeg, arc.endDeg, {
              lineWidth: layout.geom.arcLineWidth
            });
            return;
          }

          draw.drawTicksFromAngles(layerCtx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, ticks, {
            major: { len: layout.geom.majorTickLen, width: layout.geom.majorTickWidth },
            minor: { len: layout.geom.minorTickLen, width: layout.geom.minorTickWidth }
          });

          drawMajorValueLabels(
            layerCtx,
            family,
            layout.geom,
            layout.labels,
            range.min,
            range.max,
            tickMajor,
            arc,
            showEndLabels,
            labelWeight
          );
        });
        layerCache.blitLayer(ctx, "back");

        if (value.isFiniteNumber(easedAngle)) {
          draw.drawPointerAtRim(ctx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, easedAngle, {
            depth: layout.geom.pointerDepth,
            halfWidth: Math.max(1, Math.floor(layout.geom.pointerSide / 2)),
            fillStyle: theme.colors.pointer,
            variant: "long"
          });
        }

        layerCache.blitLayer(ctx, "front");

        if (!hideTextualMetrics) {
          textLayout.drawModeText({
            ctx: ctx,
            W: W,
            H: H,
            family: family,
            color: color,
            theme: theme,
            valueWeight: valueWeight,
            labelWeight: labelWeight,
            text: text,
            value: value,
            layout: layout,
            geom: layout.geom,
            responsive: layout.responsive,
            textFillScale: layout.textFillScale
            }, {
            caption: caption,
            valueText: valueText,
            unit: unit,
            secScale: value.clamp(p.captionUnitScale, 0.3, 3.0),
            hideTextualMetrics: hideTextualMetrics
          }, fitCache);
        }

        if (springMotion.isActive(/** @type {object} */ (canvas))) {
          return { wantsFollowUpFrame: true };
        }

      };
    }

    return {
      id: "SemicircleRadialEngine",
      createRenderer: createRenderer
    };
  }

  return { id: "SemicircleRadialEngine", create: create };
}));
