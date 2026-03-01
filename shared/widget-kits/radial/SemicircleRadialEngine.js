/**
 * Module: SemicircleRadialEngine - Shared renderer for semicircle gauge widgets
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: RadialToolkit
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleRadialEngine = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;

  function create(def, Helpers) {
    const GU = Helpers.getModule("RadialToolkit").create(def, Helpers);
    const T = GU.text;
    const V = GU.value;
    const draw = GU.draw;

    function makeEngineFitCacheKey(data) {
      return JSON.stringify(data);
    }
    function readEngineFitCache(entry, key) {
      return entry && entry.key === key ? entry.result : null;
    }
    function writeEngineFitCache(cache, mode, key, result) {
      cache[mode] = { key: key, result: result };
      return result;
    }
    function computeThreeRowsSizes(ctx, family, caption, valueText, unit, secScale, boxW, blockH, valueWeight, labelWeight) {
      const scale = isFinite(Number(secScale)) ? Number(secScale) : 0.8;
      const hVal = Math.max(10, Math.floor(blockH / (1 + 2 * scale)));
      const hCap = Math.max(8, Math.floor(hVal * scale));
      const hUnit = Math.max(8, Math.floor(hVal * scale));
      return {
        cPx: T.fitTextPx(ctx, caption, boxW, hCap, family, labelWeight),
        vPx: T.fitTextPx(ctx, valueText, boxW, hVal, family, valueWeight),
        uPx: T.fitTextPx(ctx, unit, boxW, hUnit, family, labelWeight),
        hCap: hCap, hVal: hVal, hUnit: hUnit
      };
    }

    function drawMajorValueLabels(ctx, family, geom, minV, maxV, majorStep, arc, showEndLabels, labelTheme, labelWeight) {
      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) {
        return;
      }
      const step = Math.abs(Number(majorStep));
      if (!isFinite(step) || step <= 0) {
        return;
      }

      const angles = [];
      const labels = {};
      const count = Math.max(1, Math.round((maxV - minV) / step));

      for (let i = 0; i <= count; i++) {
        let v = minV + i * step;
        if (v > maxV) v = maxV;

        if (!showEndLabels && (i === 0 || V.isApprox(v, maxV, 1e-6))) {
          if (V.isApprox(v, maxV, 1e-6)) {
            break;
          }
          continue;
        }

        const angle = V.valueToAngle(v, minV, maxV, arc, true);
        angles.push(angle);
        labels[angle] = V.formatMajorLabel(v);

        if (V.isApprox(v, maxV, 1e-6)) {
          break;
        }
      }

      if (!angles.length) {
        return;
      }
      const labelInset = Math.max(18, Math.floor(geom.ringW * labelTheme.insetFactor));
      const labelPx = Math.max(10, Math.floor(geom.R * labelTheme.fontFactor));

      draw.drawLabels(ctx, geom.cx, geom.cy, geom.rOuter, {
        angles: angles,
        radiusOffset: labelInset,
        fontPx: labelPx,
        weight: labelWeight,
        family: family,
        labelsMap: labels
      });
    }

    function drawFlatText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, valueWeight, labelWeight, fitCache, commonFitKey) {
      const rightX = geom.gaugeLeft + 2 * geom.R + gap;
      const rightW = Math.max(0, (pad + geom.availW) - rightX);
      const box = { x: rightX, y: geom.gaugeTop, w: rightW, h: geom.R };
      if (box.w <= 0 || box.h <= 0) {
        return;
      }

      const topBox = { x: box.x, y: box.y, w: box.w, h: Math.floor(box.h / 2) };
      const bottomBox = {
        x: box.x,
        y: box.y + Math.floor(box.h / 2),
        w: box.w,
        h: box.h - Math.floor(box.h / 2)
      };

      const key = makeEngineFitCacheKey({
        ...commonFitKey,
        mode: "flat",
        pad: pad,
        gap: gap,
        R: geom.R,
        ringW: geom.ringW,
        gaugeLeft: geom.gaugeLeft,
        gaugeTop: geom.gaugeTop,
        availW: geom.availW,
        availH: geom.availH,
        rightX: rightX,
        rightW: rightW,
        boxW: box.w,
        boxH: box.h,
        topH: topBox.h,
        bottomW: bottomBox.w,
        bottomH: bottomBox.h
      });
      const fit = readEngineFitCache(fitCache.flat, key) || writeEngineFitCache(
        fitCache,
        "flat",
        key,
        T.measureValueUnitFit(
          ctx,
          family,
          valueText,
          unit,
          bottomBox.w,
          bottomBox.h,
          secScale,
          valueWeight,
          labelWeight
        )
      );
      T.drawCaptionMax(ctx, family, topBox.x, topBox.y, topBox.w, topBox.h, caption, Math.floor(fit.vPx * secScale), "right", labelWeight);
      T.drawValueUnitWithFit(ctx, family, bottomBox.x, bottomBox.y, bottomBox.w, bottomBox.h, valueText, unit, fit, "right", valueWeight, labelWeight);
    }

    function drawHighText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, W, valueWeight, labelWeight, fitCache, commonFitKey) {
      const bandY = geom.gaugeTop + geom.R + gap;
      const bandH = Math.max(0, (pad + geom.availH) - bandY);
      if (bandH <= 0) {
        return;
      }

      const bandBox = { x: pad, y: bandY, w: W - 2 * pad, h: bandH };
      const key = makeEngineFitCacheKey({
        ...commonFitKey,
        mode: "high",
        pad: pad,
        gap: gap,
        R: geom.R,
        ringW: geom.ringW,
        gaugeTop: geom.gaugeTop,
        availH: geom.availH,
        bandY: bandY,
        bandH: bandH,
        bandW: bandBox.w
      });
      const fit = readEngineFitCache(fitCache.high, key) || writeEngineFitCache(
        fitCache,
        "high",
        key,
        T.fitInlineCapValUnit(
          ctx,
          family,
          caption,
          valueText,
          unit,
          bandBox.w,
          bandBox.h,
          secScale,
          valueWeight,
          labelWeight
        )
      );
      T.drawInlineCapValUnit(ctx, family, bandBox.x, bandBox.y, bandBox.w, bandBox.h, caption, valueText, unit, fit, valueWeight, labelWeight);
    }

    function drawNormalText(ctx, family, caption, valueText, unit, secScale, geom, labelTheme, valueWeight, labelWeight, fitCache, commonFitKey) {
      const labelInset = Math.max(18, Math.floor(geom.ringW * labelTheme.insetFactor));
      const extra = Math.max(6, Math.floor(geom.R * 0.06));
      const rSafe = Math.max(10, geom.rOuter - (labelInset + extra));

      const innerMargin = Math.max(4, Math.floor(geom.R * 0.04));
      const yBottom = geom.cy - innerMargin;
      const mhMax = Math.floor(rSafe * 0.92);
      const mhMin = Math.floor(rSafe * 0.55);

      const key = makeEngineFitCacheKey({
        ...commonFitKey,
        mode: "normal",
        R: geom.R,
        ringW: geom.ringW,
        rOuter: geom.rOuter,
        cx: geom.cx,
        cy: geom.cy,
        labelInsetFactor: labelTheme.insetFactor,
        labelInset: labelInset,
        extra: extra,
        rSafe: rSafe,
        yBottom: yBottom,
        mhMax: mhMax,
        mhMin: mhMin
      });

      let layout = readEngineFitCache(fitCache.normal, key);
      if (!layout) {
        let best = null;
        for (let mh = mhMax; mh >= mhMin; mh--) {
          const yTop = yBottom - mh;
          const yTopRel = yTop - geom.cy;
          if (Math.abs(yTopRel) >= rSafe) {
            continue;
          }

          const halfW = Math.floor(Math.sqrt(Math.max(0, rSafe * rSafe - yTopRel * yTopRel)));
          const boxW = Math.max(10, 2 * halfW);
          if (boxW <= 10) {
            continue;
          }

          const hv = Math.max(12, Math.floor(mh / (1 + 2 * secScale)));
          const vPx = T.fitTextPx(ctx, valueText, boxW, hv, family, valueWeight);
          const score = vPx * 10000 + boxW * 10 + mh;
          if (!best || score > best.score) best = { mh, boxW, score };
        }

        const blockH = best ? best.mh : Math.floor(rSafe * 0.75);
        const boxW = best ? best.boxW : Math.floor(rSafe * 1.6);
        const sizes = computeThreeRowsSizes(ctx, family, caption, valueText, unit, secScale, boxW, blockH, valueWeight, labelWeight);
        layout = writeEngineFitCache(fitCache, "normal", key, { blockH: blockH, boxW: boxW, sizes: sizes });
      }

      const xBox = geom.cx - Math.floor(layout.boxW / 2);
      const yBox = yBottom - layout.blockH;

      T.drawThreeRowsBlock(ctx, family, xBox, yBox, layout.boxW, layout.blockH, caption, valueText, unit, secScale, "center", layout.sizes, valueWeight, labelWeight);
    }

    function setupRenderSurface(canvas) {
      const setup = Helpers.setupCanvas(canvas);
      const W = setup.W;
      const H = setup.H;
      if (!W || !H) {
        return null;
      }
      return {
        ctx: setup.ctx,
        W: W,
        H: H
      };
    }

    function setupTextPaint(canvas, ctx) {
      const family = Helpers.resolveFontFamily(canvas);
      const color = Helpers.resolveTextColor(canvas);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      return { family: family, color: color };
    }

    function resolveModeState(W, H, props, ratioProps, modeDefaults) {
      const pad = V.computePad(W, H);
      const gap = V.computeGap(W, H);
      const ratio = W / Math.max(1, H);
      const tN = V.isFiniteNumber(props[ratioProps.normal]) ? props[ratioProps.normal] : modeDefaults.normal;
      const tF = V.isFiniteNumber(props[ratioProps.flat]) ? props[ratioProps.flat] : modeDefaults.flat;
      return {
        pad: pad,
        gap: gap,
        ratio: ratio,
        mode: V.computeMode(ratio, tN, tF)
      };
    }

    function createRenderer(spec) {
      const cfg = spec || {};
      const arc = cfg.arc || { startDeg: 270, endDeg: 450 };
      const modeDefaults = cfg.ratioDefaults || { normal: 1.1, flat: 3.5 };
      const rangeDefaults = cfg.rangeDefaults || { min: 0, max: 30 };
      const rangeProps = cfg.rangeProps || { min: "minValue", max: "maxValue" };
      const tickProps = cfg.tickProps || { major: "tickMajor", minor: "tickMinor", showEndLabels: "showEndLabels" };
      const ratioProps = cfg.ratioProps || { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
      const unitDefault = cfg.unitDefault || "";
      const fitCache = { flat: null, high: null, normal: null };

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const surface = setupRenderSurface(canvas);
        if (!surface) {
          return;
        }
        const ctx = surface.ctx;
        const W = surface.W;
        const H = surface.H;
        const theme = GU.theme.resolve(canvas);
        const valueWeight = theme.font.weight;
        const labelWeight = theme.font.labelWeight;

        ctx.clearRect(0, 0, W, H);
        const paint = setupTextPaint(canvas, ctx);
        const family = paint.family;
        const color = paint.color;
        const modeState = resolveModeState(W, H, p, ratioProps, modeDefaults);
        const pad = modeState.pad;
        const gap = modeState.gap;
        const ratio = modeState.ratio;
        const mode = modeState.mode;

        const caption = String(p.caption || "").trim();
        const unit = String(p.unit || unitDefault).trim();
        const raw = (typeof p.value !== "undefined") ? p.value : p[cfg.rawValueKey];

        const display = (typeof cfg.formatDisplay === "function")
          ? (cfg.formatDisplay(raw, p, unit, Helpers) || {})
          : { num: Number(raw), text: String(raw) };

        const valueText = (display.text && String(display.text).trim())
          ? String(display.text).trim()
          : (hasOwn.call(p, "default") ? p.default : "---");

        const valueNum = V.isFiniteNumber(display.num) ? display.num : NaN;
        const range = V.normalizeRange(p[rangeProps.min], p[rangeProps.max], rangeDefaults.min, rangeDefaults.max);
        const tickPreset = (typeof cfg.tickSteps === "function")
          ? (cfg.tickSteps(range.range) || { major: 10, minor: 2 })
          : { major: 10, minor: 2 };

        const tickMajor = V.isFiniteNumber(p[tickProps.major]) ? p[tickProps.major] : tickPreset.major;
        const tickMinor = V.isFiniteNumber(p[tickProps.minor]) ? p[tickProps.minor] : tickPreset.minor;
        const secScale = V.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);
        const fitKeyBase = {
          W: W,
          H: H,
          mode: mode,
          caption: caption,
          valueText: valueText,
          unit: unit,
          secScale: secScale,
          family: family,
          valueWeight: valueWeight,
          labelWeight: labelWeight
        };

        const geom = V.computeSemicircleGeometry(W, H, pad, {
          ringWidthFactor: theme.radial.ring.widthFactor
        });
        const vClamped = V.isFiniteNumber(valueNum) ? V.clamp(valueNum, range.min, range.max) : NaN;
        const aNow = V.isFiniteNumber(vClamped)
          ? V.valueToAngle(vClamped, range.min, range.max, arc, true)
          : NaN;

        const sectorList = (typeof cfg.buildSectors === "function")
          ? (cfg.buildSectors(p, range.min, range.max, arc, V, theme) || [])
          : [];

        const ticks = V.buildValueTickAngles(range.min, range.max, tickMajor, tickMinor, arc);
        const showEndLabels = !!p[tickProps.showEndLabels];

        draw.drawArcRing(ctx, geom.cx, geom.cy, geom.rOuter, arc.startDeg, arc.endDeg, {
          lineWidth: theme.radial.ring.arcLineWidth
        });

        for (let i = 0; i < sectorList.length; i++) {
          const s = sectorList[i];
          if (!s) {
            continue;
          }
          if (!V.isFiniteNumber(s.a0) || !V.isFiniteNumber(s.a1)) {
            continue;
          }
          draw.drawAnnularSector(ctx, geom.cx, geom.cy, geom.rOuter, {
            startDeg: s.a0,
            endDeg: s.a1,
            thickness: geom.ringW,
            fillStyle: s.color
          });
        }

        if (V.isFiniteNumber(aNow)) {
          draw.drawPointerAtRim(ctx, geom.cx, geom.cy, geom.rOuter, aNow, {
            depth: geom.needleDepth,
            fillStyle: theme.colors.pointer,
            variant: "long",
            sideFactor: theme.radial.pointer.sideFactor,
            lengthFactor: theme.radial.pointer.lengthFactor
          });
        }

        draw.drawTicksFromAngles(ctx, geom.cx, geom.cy, geom.rOuter, ticks, {
          major: { len: theme.radial.ticks.majorLen, width: theme.radial.ticks.majorWidth },
          minor: { len: theme.radial.ticks.minorLen, width: theme.radial.ticks.minorWidth }
        });

        drawMajorValueLabels(ctx, family, geom, range.min, range.max, tickMajor, arc, showEndLabels, theme.radial.labels, labelWeight);

        if (mode === "flat") drawFlatText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, valueWeight, labelWeight, fitCache, fitKeyBase);
        else if (mode === "high") drawHighText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, W, valueWeight, labelWeight, fitCache, fitKeyBase);
        else drawNormalText(ctx, family, caption, valueText, unit, secScale, geom, theme.radial.labels, valueWeight, labelWeight, fitCache, fitKeyBase);

        if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color, null, labelWeight);
      };
    }

    return {
      id: "SemicircleRadialEngine",
      version: "0.1.0",
      createRenderer
    };
  }

  return { id: "SemicircleRadialEngine", create };
}));
