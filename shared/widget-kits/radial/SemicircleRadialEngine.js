/**
 * Module: SemicircleRadialEngine - Shared renderer for semicircle gauge widgets
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: RadialToolkit, SemicircleRadialLayout, SemicircleRadialTextLayout, SpringEasing, StableDigits, StateScreenLabels, StateScreenPrecedence, StateScreenCanvasOverlay
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const DEFAULT_ARC = { startDeg: 270, endDeg: 450 };
    // Engine-owned last-resort fallback for callers that omit threshold props.
    const DEFAULT_RATIO_DEFAULTS = { normal: 1.1, flat: 3.5 };
    const DEFAULT_RANGE_DEFAULTS = { min: 0, max: 30 };
    const DEFAULT_RANGE_PROPS = { min: "minValue", max: "maxValue" };
    const DEFAULT_TICK_PROPS = { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
    const DEFAULT_RATIO_PROPS = { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
    const DEFAULT_TICK_PRESET = { major: 10, minor: 2 };
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const layoutApi = Helpers.getModule("SemicircleRadialLayout").create(def, Helpers);
    const textLayout = Helpers.getModule("SemicircleRadialTextLayout").create(def, Helpers);
    const stableDigits = Helpers.getModule("StableDigits").create(def, Helpers);
    const stateScreenLabels = Helpers.getModule("StateScreenLabels").create(def, Helpers);
    const stateScreenPrecedence = Helpers.getModule("StateScreenPrecedence").create(def, Helpers);
    const stateScreenCanvasOverlay = Helpers.getModule("StateScreenCanvasOverlay").create(def, Helpers);
    const springMotion = Helpers.getModule("SpringEasing").create(def, Helpers).createMotion();
    const text = GU.text;
    const value = GU.value;
    const draw = GU.draw;

    function resolveSurface(canvas) {
      const setup = Helpers.setupCanvas(canvas);
      return setup && setup.W && setup.H && setup.ctx ? setup : null;
    }

    function setupTextPaint(theme, ctx) {
      const family = theme.font.family;
      const color = theme.surface.fg;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      return { family: family, color: color };
    }

    function resolveIntegerWidth(textValue, rangeMax, minWidth) {
      const match = String(textValue).match(/^\s*[+-]?(\d+)/);
      const textDigits = match ? match[1].length : 0;
      const maxAbs = Math.max(0, Math.abs(Number(rangeMax) || 0));
      const rangeDigits = Math.max(1, String(Math.floor(maxAbs)).length);
      return Math.max(minWidth, textDigits, rangeDigits);
    }

    function drawMajorValueLabels(ctx, family, geom, labels, minV, maxV, majorStep, arc, showEndLabels, labelWeight) {
      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) {
        return;
      }
      const step = Math.abs(Number(majorStep));
      if (!isFinite(step) || step <= 0) {
        return;
      }

      const angles = [];
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

        const angle = value.valueToAngle(tickValue, minV, maxV, arc, true);
        angles.push(angle);
        labelsMap[angle] = value.formatMajorLabel(tickValue);

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

    function createRenderer(spec) {
      const cfg = spec || {};
      const arc = hasOwn.call(cfg, "arc") ? cfg.arc : DEFAULT_ARC;
      const modeDefaults = hasOwn.call(cfg, "ratioDefaults") ? cfg.ratioDefaults : DEFAULT_RATIO_DEFAULTS;
      const rangeDefaults = hasOwn.call(cfg, "rangeDefaults") ? cfg.rangeDefaults : DEFAULT_RANGE_DEFAULTS;
      const rangeProps = hasOwn.call(cfg, "rangeProps") ? cfg.rangeProps : DEFAULT_RANGE_PROPS;
      const tickProps = hasOwn.call(cfg, "tickProps") ? cfg.tickProps : DEFAULT_TICK_PROPS;
      const ratioProps = hasOwn.call(cfg, "ratioProps") ? cfg.ratioProps : DEFAULT_RATIO_PROPS;
      const unitDefault = hasOwn.call(cfg, "unitDefault") ? cfg.unitDefault : "";
      const formatDisplay = typeof cfg.formatDisplay === "function"
        ? function (rawValue, props, unitText) {
          return cfg.formatDisplay(rawValue, props, unitText, Helpers);
        }
        : function (rawValue) {
          return { num: Number(rawValue), text: String(rawValue) };
        };
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

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const surface = resolveSurface(canvas);
        if (!surface) {
          return;
        }

        const ctx = surface.ctx;
        const W = surface.W;
        const H = surface.H;
        const rootEl = Helpers.requirePluginRoot(canvas);
        const theme = GU.theme.resolveForRoot(rootEl);
        const paint = setupTextPaint(theme, ctx);
        const labelWeight = theme.font.labelWeight;
        const stableDigitsEnabled = p.stableDigits === true;
        const stateKind = stateScreenPrecedence.pickFirst([{ kind: "disconnected", when: p.disconnect === true }, { kind: "data", when: true }]);
        ctx.clearRect(0, 0, W, H);
        if (stateKind !== stateScreenLabels.KINDS.DATA) {
          stateScreenCanvasOverlay.drawStateScreen({ ctx: ctx, W: W, H: H, family: paint.family, color: paint.color, labelWeight: labelWeight, kind: stateKind });
          return;
        }
        const mode = layoutApi.computeMode(
          W,
          H,
          value.isFiniteNumber(p[ratioProps.normal]) ? p[ratioProps.normal] : modeDefaults.normal,
          value.isFiniteNumber(p[ratioProps.flat]) ? p[ratioProps.flat] : modeDefaults.flat
        );
        const insets = layoutApi.computeInsets(W, H);
        const layout = layoutApi.computeLayout({
          W: W,
          H: H,
          theme: theme,
          mode: mode,
          insets: insets,
          responsive: insets.responsive
        });
        const valueWeight = theme.font.weight;
        const family = stableDigitsEnabled
          ? (theme.font.familyMono || paint.family)
          : paint.family;
        const color = paint.color;
        const caption = String(p.caption).trim();
        const unit = String(hasOwn.call(p, "unit") ? p.unit : unitDefault).trim();
        const raw = (typeof p.value !== "undefined") ? p.value : p[cfg.rawValueKey];
        const display = formatDisplay(raw, p, unit);
        const range = value.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        const valueRawText = display.text.trim() || p.default;
        const valueText = stableDigitsEnabled
          ? stableDigits.normalize(valueRawText, {
            integerWidth: resolveIntegerWidth(valueRawText, range.max, 2),
            reserveSignSlot: true
          }).padded
          : valueRawText;
        const tickPreset = tickSteps(range.range);
        const tickMajor = value.isFiniteNumber(p[tickProps.major]) ? p[tickProps.major] : tickPreset.major;
        const tickMinor = value.isFiniteNumber(p[tickProps.minor]) ? p[tickProps.minor] : tickPreset.minor;
        const sectorList = buildSectors(p, range.min, range.max, arc, value, theme);
        const ticks = value.buildValueTickAngles(range.min, range.max, tickMajor, tickMinor, arc);
        const showEndLabels = !!p[tickProps.showEndLabels];
        const numericDisplay = Number(display.num);
        const clampedValue = Number.isFinite(numericDisplay) ? value.clamp(numericDisplay, range.min, range.max) : NaN;
        const angleNow = Number.isFinite(clampedValue)
          ? value.valueToAngle(clampedValue, range.min, range.max, arc, true)
          : NaN;
        const easedAngle = springMotion.resolve(canvas, angleNow, p.easing !== false, Date.now());

        for (let i = 0; i < sectorList.length; i += 1) {
          const sector = sectorList[i];
          if (!sector || !value.isFiniteNumber(sector.a0) || !value.isFiniteNumber(sector.a1)) {
            continue;
          }
          draw.drawAnnularSector(ctx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, {
            startDeg: sector.a0,
            endDeg: sector.a1,
            thickness: layout.geom.ringW,
            fillStyle: sector.color
          });
        }

        draw.drawArcRing(ctx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, arc.startDeg, arc.endDeg, {
          lineWidth: theme.radial.ring.arcLineWidth
        });

        if (value.isFiniteNumber(easedAngle)) {
          draw.drawPointerAtRim(ctx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, easedAngle, {
            depth: layout.geom.needleDepth,
            fillStyle: theme.colors.pointer,
            variant: "long",
            widthFactor: theme.radial.pointer.widthFactor,
            lengthFactor: theme.radial.pointer.lengthFactor
          });
        }

        draw.drawTicksFromAngles(ctx, layout.geom.cx, layout.geom.cy, layout.geom.rOuter, ticks, {
          major: { len: theme.radial.ticks.majorLen, width: theme.radial.ticks.majorWidth },
          minor: { len: theme.radial.ticks.minorLen, width: theme.radial.ticks.minorWidth }
        });

        drawMajorValueLabels(
          ctx,
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
          secScale: value.clamp(p.captionUnitScale, 0.3, 3.0)
        }, fitCache);

        if (springMotion.isActive(canvas)) {
          return { wantsFollowUpFrame: true };
        }

      };
    }

    return {
      id: "SemicircleRadialEngine",
      version: "0.1.0",
      createRenderer: createRenderer
    };
  }

  return { id: "SemicircleRadialEngine", create: create };
}));
