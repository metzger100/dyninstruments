/**
 * Module: SemicircleGaugeEngine - Shared renderer for semicircle gauge widgets
 * Documentation: documentation/widgets/semicircle-gauges.md
 * Depends: GaugeToolkit
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniSemicircleGaugeEngine = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const GU = Helpers.getModule("GaugeToolkit").create(def, Helpers);
    const T = GU.text;
    const V = GU.value;
    const draw = GU.draw;

    function drawMajorValueLabels(ctx, family, geom, minV, maxV, majorStep, arc, showEndLabels) {
      if (!isFinite(minV) || !isFinite(maxV) || maxV <= minV) return;
      const step = Math.abs(Number(majorStep));
      if (!isFinite(step) || step <= 0) return;

      const angles = [];
      const labels = {};
      const count = Math.max(1, Math.round((maxV - minV) / step));

      for (let i = 0; i <= count; i++) {
        let v = minV + i * step;
        if (v > maxV) v = maxV;

        if (!showEndLabels && (i === 0 || V.isApprox(v, maxV, 1e-6))) {
          if (V.isApprox(v, maxV, 1e-6)) break;
          continue;
        }

        const angle = V.valueToAngle(v, minV, maxV, arc, true);
        angles.push(angle);
        labels[angle] = V.formatMajorLabel(v);

        if (V.isApprox(v, maxV, 1e-6)) break;
      }

      if (!angles.length) return;
      const labelInset = Math.max(18, Math.floor(geom.ringW * 1.8));
      const labelPx = Math.max(10, Math.floor(geom.R * 0.14));

      draw.drawLabels(ctx, geom.cx, geom.cy, geom.rOuter, {
        angles: angles,
        radiusOffset: labelInset,
        fontPx: labelPx,
        bold: true,
        family,
        labelsMap: labels
      });
    }

    function drawFlatText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap) {
      const rightX = geom.gaugeLeft + 2 * geom.R + gap;
      const rightW = Math.max(0, (pad + geom.availW) - rightX);
      const box = { x: rightX, y: geom.gaugeTop, w: rightW, h: geom.R };
      if (box.w <= 0 || box.h <= 0) return;

      const topBox = { x: box.x, y: box.y, w: box.w, h: Math.floor(box.h / 2) };
      const bottomBox = {
        x: box.x,
        y: box.y + Math.floor(box.h / 2),
        w: box.w,
        h: box.h - Math.floor(box.h / 2)
      };

      const fit = T.measureValueUnitFit(ctx, family, valueText, unit, bottomBox.w, bottomBox.h, secScale);
      T.drawCaptionMax(
        ctx,
        family,
        topBox.x,
        topBox.y,
        topBox.w,
        topBox.h,
        caption,
        Math.floor(fit.vPx * secScale),
        "right"
      );
      T.drawValueUnitWithFit(
        ctx,
        family,
        bottomBox.x,
        bottomBox.y,
        bottomBox.w,
        bottomBox.h,
        valueText,
        unit,
        fit,
        "right"
      );
    }

    function drawHighText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, W) {
      const bandY = geom.gaugeTop + geom.R + gap;
      const bandH = Math.max(0, (pad + geom.availH) - bandY);
      if (bandH <= 0) return;

      const bandBox = { x: pad, y: bandY, w: W - 2 * pad, h: bandH };
      const fit = T.fitInlineCapValUnit(ctx, family, caption, valueText, unit, bandBox.w, bandBox.h, secScale);
      T.drawInlineCapValUnit(ctx, family, bandBox.x, bandBox.y, bandBox.w, bandBox.h, caption, valueText, unit, fit);
    }

    function drawNormalText(ctx, family, caption, valueText, unit, secScale, geom) {
      const labelInset = Math.max(18, Math.floor(geom.ringW * 1.8));
      const extra = Math.max(6, Math.floor(geom.R * 0.06));
      const rSafe = Math.max(10, geom.rOuter - (labelInset + extra));

      const innerMargin = Math.max(4, Math.floor(geom.R * 0.04));
      const yBottom = geom.cy - innerMargin;

      let best = null;
      const mhMax = Math.floor(rSafe * 0.92);
      const mhMin = Math.floor(rSafe * 0.55);

      for (let mh = mhMax; mh >= mhMin; mh--) {
        const yTop = yBottom - mh;
        const yTopRel = yTop - geom.cy;
        if (Math.abs(yTopRel) >= rSafe) continue;

        const halfW = Math.floor(Math.sqrt(Math.max(0, rSafe * rSafe - yTopRel * yTopRel)));
        const boxW = Math.max(10, 2 * halfW);
        if (boxW <= 10) continue;

        const hv = Math.max(12, Math.floor(mh / (1 + 2 * secScale)));
        const vPx = T.fitTextPx(ctx, valueText, boxW, hv, family, true);
        const score = vPx * 10000 + boxW * 10 + mh;
        if (!best || score > best.score) best = { mh, boxW, score };
      }

      const blockH = best ? best.mh : Math.floor(rSafe * 0.75);
      const boxW = best ? best.boxW : Math.floor(rSafe * 1.6);
      const xBox = geom.cx - Math.floor(boxW / 2);
      const yBox = yBottom - blockH;

      T.drawThreeRowsBlock(ctx, family, xBox, yBox, boxW, blockH, caption, valueText, unit, secScale, "center");
    }

    function createRenderer(spec) {
      const cfg = spec || {};
      const arc = cfg.arc || { startDeg: 270, endDeg: 450 };
      const modeDefaults = cfg.ratioDefaults || { normal: 1.1, flat: 3.5 };
      const rangeDefaults = cfg.rangeDefaults || { min: 0, max: 30 };
      const ratioProps = cfg.ratioProps || { normal: "ratioThresholdNormal", flat: "ratioThresholdFlat" };
      const unitDefault = cfg.unitDefault || "";

      return function renderCanvas(canvas, props) {
        const p = props || {};
        const setup = Helpers.setupCanvas(canvas);
        const ctx = setup.ctx;
        const W = setup.W;
        const H = setup.H;
        if (!W || !H) return;
        const theme = GU.theme.resolve(canvas);

        ctx.clearRect(0, 0, W, H);
        const family = Helpers.resolveFontFamily(canvas);
        const color = Helpers.resolveTextColor(canvas);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        const pad = V.computePad(W, H);
        const gap = V.computeGap(W, H);
        const ratio = W / Math.max(1, H);

        const tN = Number(p[ratioProps.normal] ?? modeDefaults.normal);
        const tF = Number(p[ratioProps.flat] ?? modeDefaults.flat);
        const mode = V.computeMode(ratio, tN, tF);

        const caption = String(p.caption || "").trim();
        const unit = String(p.unit || unitDefault).trim();
        const raw = (typeof p.value !== "undefined") ? p.value : p[cfg.rawValueKey];

        const display = (typeof cfg.formatDisplay === "function")
          ? (cfg.formatDisplay(raw, p, unit, Helpers) || {})
          : { num: Number(raw), text: String(raw) };

        const valueText = (display.text && String(display.text).trim())
          ? String(display.text).trim()
          : (p.default || "---");

        const valueNum = V.isFiniteNumber(display.num) ? display.num : NaN;
        const range = V.normalizeRange(p.minValue, p.maxValue, rangeDefaults.min, rangeDefaults.max);
        const tickPreset = (typeof cfg.tickSteps === "function")
          ? (cfg.tickSteps(range.range) || { major: 10, minor: 2 })
          : { major: 10, minor: 2 };

        const tickMajor = Number(p.tickMajor ?? tickPreset.major);
        const tickMinor = Number(p.tickMinor ?? tickPreset.minor);
        const secScale = V.clamp(p.captionUnitScale ?? 0.8, 0.3, 3.0);

        const geom = V.computeSemicircleGeometry(W, H, pad);
        const vClamped = V.isFiniteNumber(valueNum) ? V.clamp(valueNum, range.min, range.max) : NaN;
        const aNow = V.isFiniteNumber(vClamped)
          ? V.valueToAngle(vClamped, range.min, range.max, arc, true)
          : NaN;

        const sectorList = (typeof cfg.buildSectors === "function")
          ? (cfg.buildSectors(p, range.min, range.max, arc, V, theme) || [])
          : [];

        const ticks = V.buildValueTickAngles(range.min, range.max, tickMajor, tickMinor, arc);
        const showEndLabels = !!p.showEndLabels;

        draw.drawArcRing(ctx, geom.cx, geom.cy, geom.rOuter, arc.startDeg, arc.endDeg, { lineWidth: 1 });

        for (let i = 0; i < sectorList.length; i++) {
          const s = sectorList[i];
          if (!s) continue;
          if (!V.isFiniteNumber(s.a0) || !V.isFiniteNumber(s.a1)) continue;
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
            theme: theme,
            variant: "long",
            sideFactor: 0.25,
            lengthFactor: 2
          });
        }

        draw.drawTicksFromAngles(ctx, geom.cx, geom.cy, geom.rOuter, ticks, {
          major: { len: 9, width: 2 },
          minor: { len: 5, width: 1 }
        });

        drawMajorValueLabels(ctx, family, geom, range.min, range.max, tickMajor, arc, showEndLabels);

        if (mode === "flat") drawFlatText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap);
        else if (mode === "high") drawHighText(ctx, family, caption, valueText, unit, secScale, geom, pad, gap, W);
        else drawNormalText(ctx, family, caption, valueText, unit, secScale, geom);

        if (p.disconnect) T.drawDisconnectOverlay(ctx, W, H, family, color);
      };
    }

    return {
      id: "SemicircleGaugeEngine",
      version: "0.1.0",
      createRenderer
    };
  }

  return { id: "SemicircleGaugeEngine", create };
}));
