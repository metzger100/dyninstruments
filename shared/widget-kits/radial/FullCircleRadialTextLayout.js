/**
 * Module: FullCircleRadialTextLayout - Shared text layout helpers for full-circle dial widgets
 * Documentation: documentation/radial/full-circle-dial-engine.md
 * Depends: RadialTextLayout state API from FullCircleRadialEngine callbacks
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleRadialTextLayout = factory(); }
}(this, function () {
  "use strict";
  const hasOwn = Object.prototype.hasOwnProperty;
  const FULL_CIRCLE_NORMAL_DEFAULTS = { innerMarginFactor: 0.03, minHeightFactor: 0.45, dualGapFactor: 0.05 };
  function fullCircleClamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }
  function fullCircleThemeNumber(source, key, fallback, minValue, maxValue) {
    if (!source || !hasOwn.call(source, key)) {
      return fallback;
    }
    const raw = Number(source[key]);
    if (!isFinite(raw)) {
      return fallback;
    }
    return fullCircleClamp(raw, minValue, maxValue);
  }
  function fullCircleNormalConfig(state) {
    const normal = state && state.theme && state.theme.radial && state.theme.radial.fullCircle && state.theme.radial.fullCircle.normal;
    return {
      innerMarginFactor: fullCircleThemeNumber(normal, "innerMarginFactor", FULL_CIRCLE_NORMAL_DEFAULTS.innerMarginFactor, 0, 0.25),
      minHeightFactor: fullCircleThemeNumber(normal, "minHeightFactor", FULL_CIRCLE_NORMAL_DEFAULTS.minHeightFactor, 0.25, 0.95),
      dualGapFactor: fullCircleThemeNumber(normal, "dualGapFactor", FULL_CIRCLE_NORMAL_DEFAULTS.dualGapFactor, 0, 0.25)
    };
  }
  function fullCircleSingleFlat(state, display, opts) {
    const cfg = opts || {};
    const side = cfg.side === "right" ? "right" : "left";
    const align = cfg.align || side;
    const top = side === "right" ? state.slots.rightTop : state.slots.leftTop;
    const bottom = side === "right" ? state.slots.rightBottom : state.slots.leftBottom;
    if (!top || !bottom) {
      return;
    }
    const fit = state.text.measureValueUnitFit(
      state.ctx,
      state.family,
      display.value,
      display.unit,
      bottom.w,
      bottom.h,
      display.secScale,
      state.valueWeight,
      state.labelWeight
    );
    state.text.drawCaptionMax(
      state.ctx,
      state.family,
      top.x,
      top.y,
      top.w,
      top.h,
      display.caption,
      Math.floor(fit.vPx * display.secScale),
      align,
      state.labelWeight
    );
    state.text.drawValueUnitWithFit(
      state.ctx,
      state.family,
      bottom.x,
      bottom.y,
      bottom.w,
      bottom.h,
      display.value,
      display.unit,
      fit,
      align,
      state.valueWeight,
      state.labelWeight
    );
  }
  function fullCircleSingleHigh(state, display, opts) {
    const cfg = opts || {};
    const slotName = cfg.slot === "bottom" ? "bottom" : "top";
    const slot = state.slots[slotName];
    if (!slot) {
      return;
    }
    const fit = state.text.fitInlineCapValUnit(
      state.ctx,
      state.family,
      display.caption,
      display.value,
      display.unit,
      slot.w,
      slot.h,
      display.secScale,
      state.valueWeight,
      state.labelWeight
    );
    state.text.drawInlineCapValUnit(
      state.ctx,
      state.family,
      slot.x,
      slot.y,
      slot.w,
      slot.h,
      display.caption,
      display.value,
      display.unit,
      fit,
      state.valueWeight,
      state.labelWeight
    );
  }
  function fullCircleSingleNormal(state, display) {
    const T = state.text;
    const R = state.geom.R;
    const cfg = fullCircleNormalConfig(state);
    const secScale = state.value.clamp(display.secScale, 0.3, 3.0);
    const rSafe = Math.max(10, state.geom.rOuter - (state.geom.labelInsetVal + Math.max(6, Math.floor(R * 0.06))));
    if (rSafe < 12) {
      const th = Math.max(10, Math.floor((state.pad + state.geom.topStrip) * 0.9));
      const fit = T.measureValueUnitFit(
        state.ctx,
        state.family,
        display.value,
        display.unit,
        state.W - 2 * state.pad,
        th,
        secScale,
        state.valueWeight,
        state.labelWeight
      );
      T.drawValueUnitWithFit(
        state.ctx,
        state.family,
        state.pad,
        state.pad,
        state.W - 2 * state.pad,
        th,
        display.value,
        display.unit,
        fit,
        "center",
        state.valueWeight,
        state.labelWeight
      );
      return;
    }
    const innerMargin = Math.max(4, Math.floor(R * cfg.innerMarginFactor));
    const rEff = Math.max(10, rSafe - innerMargin);
    let best = null;
    const mhMax = Math.floor(2 * rEff);
    const mhMin = Math.max(10, Math.floor(mhMax * cfg.minHeightFactor));
    for (let mh = mhMax; mh >= mhMin; mh -= 1) {
      const halfDiagY = mh / 2;
      const halfWMax = Math.floor(Math.sqrt(Math.max(0, rEff * rEff - halfDiagY * halfDiagY)));
      const boxW = Math.max(10, 2 * halfWMax);
      if (boxW <= 10) {
        continue;
      }
      const hVal = Math.max(12, Math.floor(mh / (1 + 2 * secScale)));
      const vPx = T.fitTextPx(state.ctx, display.value, boxW, hVal, state.family, state.valueWeight);
      const score = vPx * 10000 + boxW * 10 + mh;
      if (!best || score > best.score) {
        best = { maxH: mh, boxW: boxW, hVal: hVal, vPx: vPx, score: score };
      }
    }
    const maxH = best ? best.maxH : Math.floor(rEff * 0.9);
    const boxW = best ? best.boxW : Math.floor(rEff * 1.6);
    const hVal = best ? best.hVal : Math.max(12, Math.floor(maxH / (1 + 2 * secScale)));
    const hCap = Math.floor(hVal * display.secScale);
    const hUnit = Math.floor(hVal * display.secScale);
    const sizes = {
      cPx: T.fitTextPx(state.ctx, display.caption, boxW, hCap, state.family, state.labelWeight),
      vPx: best ? best.vPx : T.fitTextPx(state.ctx, display.value, boxW, hVal, state.family, state.valueWeight),
      uPx: T.fitTextPx(state.ctx, display.unit, boxW, hUnit, state.family, state.labelWeight),
      hCap: hCap,
      hVal: hVal,
      hUnit: hUnit
    };
    T.drawThreeRowsBlock(
      state.ctx,
      state.family,
      state.geom.cx - Math.floor(boxW / 2),
      state.geom.cy - Math.floor(maxH / 2),
      boxW,
      maxH,
      display.caption,
      display.value,
      display.unit,
      secScale,
      "center",
      sizes,
      state.valueWeight,
      state.labelWeight
    );
  }
  function fullCircleDualFlat(state, left, right, opts) {
    const cfg = opts || {};
    fullCircleSingleFlat(state, left, {
      side: "left",
      align: cfg.leftAlign || "left"
    });
    fullCircleSingleFlat(state, right, {
      side: "right",
      align: cfg.rightAlign || "right"
    });
  }
  function fullCircleDualHigh(state, left, right) {
    fullCircleSingleHigh(state, left, { slot: "top" });
    fullCircleSingleHigh(state, right, { slot: "bottom" });
  }
  function fullCircleDualNormal(state, left, right) {
    const T = state.text;
    const R = state.geom.R;
    const cfg = fullCircleNormalConfig(state);
    const secScale = state.value.clamp((left.secScale + right.secScale) / 2, 0.3, 3.0);
    const extra = Math.max(6, Math.floor(R * 0.06));
    const rSafe = Math.max(10, state.geom.rOuter - (state.geom.labelInsetVal + extra));
    if (rSafe < 12) {
      const innerW = Math.floor(state.geom.rOuter * 1.0);
      const halfW = Math.max(10, Math.floor(innerW / 2) - Math.max(4, Math.floor(R * 0.035)));
      const maxH = Math.floor(state.geom.rOuter * 0.46);
      const xLeft = state.geom.cx - Math.floor(innerW / 2);
      const xRight = state.geom.cx + Math.floor(innerW / 2) - halfW;
      const yTop = state.geom.cy - Math.floor(maxH / 2);
      const hv = Math.max(12, Math.floor(maxH / (1 + 2 * secScale)));
      const hc = Math.floor(hv * secScale);
      const hu = Math.floor(hv * secScale);
      const sizesTiny = {
        cPx: Math.min(
          T.fitTextPx(state.ctx, left.caption, halfW, hc, state.family, state.labelWeight),
          T.fitTextPx(state.ctx, right.caption, halfW, hc, state.family, state.labelWeight)
        ),
        vPx: Math.min(
          T.fitTextPx(state.ctx, left.value, halfW, hv, state.family, state.valueWeight),
          T.fitTextPx(state.ctx, right.value, halfW, hv, state.family, state.valueWeight)
        ),
        uPx: Math.min(
          T.fitTextPx(state.ctx, left.unit, halfW, hu, state.family, state.labelWeight),
          T.fitTextPx(state.ctx, right.unit, halfW, hu, state.family, state.labelWeight)
        ),
        hCap: hc,
        hVal: hv,
        hUnit: hu
      };
      T.drawThreeRowsBlock(
        state.ctx,
        state.family,
        xLeft,
        yTop,
        halfW,
        maxH,
        left.caption,
        left.value,
        left.unit,
        secScale,
        "right",
        sizesTiny,
        state.valueWeight,
        state.labelWeight
      );
      T.drawThreeRowsBlock(
        state.ctx,
        state.family,
        xRight,
        yTop,
        halfW,
        maxH,
        right.caption,
        right.value,
        right.unit,
        secScale,
        "left",
        sizesTiny,
        state.valueWeight,
        state.labelWeight
      );
      return;
    }
    const colGap = Math.max(6, Math.floor(R * cfg.dualGapFactor));
    const innerMargin = Math.max(4, Math.floor(R * cfg.innerMarginFactor));
    const rEff = Math.max(10, rSafe - innerMargin);
    let best = null;
    const mhMax = Math.floor(2 * rEff);
    const mhMin = Math.max(10, Math.floor(mhMax * cfg.minHeightFactor));
    for (let mh = mhMax; mh >= mhMin; mh -= 1) {
      const halfDiagY = mh / 2;
      const halfWMax = Math.floor(
        Math.sqrt(Math.max(0, rEff * rEff - halfDiagY * halfDiagY)) - Math.floor(colGap / 2)
      );
      if (halfWMax <= 10) {
        continue;
      }
      const hv = Math.max(12, Math.floor(mh / (1 + 2 * secScale)));
      const vPx = Math.min(
        T.fitTextPx(state.ctx, left.value, halfWMax, hv, state.family, state.valueWeight),
        T.fitTextPx(state.ctx, right.value, halfWMax, hv, state.family, state.valueWeight)
      );
      const score = vPx * 10000 + halfWMax * 10 + mh;
      if (!best || score > best.score) {
        best = { maxH: mh, halfW: halfWMax, hv: hv, vPx: vPx, score: score };
      }
    }
    const maxH = best ? best.maxH : Math.floor(rSafe * 0.9);
    const halfW = best ? best.halfW : Math.floor(rSafe * 0.6);
    const hv = best ? best.hv : Math.max(12, Math.floor(maxH / (1 + 2 * secScale)));
    const hc = Math.floor(hv * secScale);
    const hu = Math.floor(hv * secScale);
    const sizes = {
      cPx: Math.min(
        T.fitTextPx(state.ctx, left.caption, halfW, hc, state.family, state.labelWeight),
        T.fitTextPx(state.ctx, right.caption, halfW, hc, state.family, state.labelWeight)
      ),
      vPx: best ? best.vPx : Math.min(
        T.fitTextPx(state.ctx, left.value, halfW, hv, state.family, state.valueWeight),
        T.fitTextPx(state.ctx, right.value, halfW, hv, state.family, state.valueWeight)
      ),
      uPx: Math.min(
        T.fitTextPx(state.ctx, left.unit, halfW, hu, state.family, state.labelWeight),
        T.fitTextPx(state.ctx, right.unit, halfW, hu, state.family, state.labelWeight)
      ),
      hCap: hc,
      hVal: hv,
      hUnit: hu
    };
    const innerW = 2 * halfW + colGap;
    const xLeft = state.geom.cx - Math.floor(innerW / 2);
    const xRight = xLeft + halfW + colGap;
    const yTop = state.geom.cy - Math.floor(maxH / 2);

    T.drawThreeRowsBlock(
      state.ctx,
      state.family,
      xLeft,
      yTop,
      halfW,
      maxH,
      left.caption,
      left.value,
      left.unit,
      secScale,
      "right",
      sizes,
      state.valueWeight,
      state.labelWeight
    );
    T.drawThreeRowsBlock(
      state.ctx,
      state.family,
      xRight,
      yTop,
      halfW,
      maxH,
      right.caption,
      right.value,
      right.unit,
      secScale,
      "left",
      sizes,
      state.valueWeight,
      state.labelWeight
    );
  }
  function create(def, Helpers) {
    function drawSingleModeText(state, mode, display, opts) {
      if (mode === "flat") {
        fullCircleSingleFlat(state, display, opts);
        return;
      }
      if (mode === "high") {
        fullCircleSingleHigh(state, display, opts);
        return;
      }
      fullCircleSingleNormal(state, display);
    }
    function drawDualModeText(state, mode, left, right, opts) {
      if (mode === "flat") {
        fullCircleDualFlat(state, left, right, opts);
        return;
      }
      if (mode === "high") {
        fullCircleDualHigh(state, left, right);
        return;
      }
      fullCircleDualNormal(state, left, right);
    }
    return {
      id: "FullCircleRadialTextLayout",
      drawSingleModeText: drawSingleModeText,
      drawDualModeText: drawDualModeText
    };
  }
  return { id: "FullCircleRadialTextLayout", create: create };
}));
