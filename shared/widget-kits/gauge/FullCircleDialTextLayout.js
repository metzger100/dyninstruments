/**
 * Module: FullCircleDialTextLayout - Shared text layout helpers for full-circle dial widgets
 * Documentation: documentation/gauges/full-circle-dial-engine.md
 * Depends: GaugeTextLayout state API from FullCircleDialEngine callbacks
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniFullCircleDialTextLayout = factory(); }
}(this, function () {
  "use strict";

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
        display.secScale,
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

    const innerMargin = Math.max(4, Math.floor(R * 0.03));
    const yBottom = state.geom.cy + Math.floor(rSafe / 2) - innerMargin;
    const maxH = Math.max(32, Math.floor(rSafe * 0.95));
    const boxW = Math.max(40, Math.floor(rSafe * 1.6));
    const hVal = Math.max(12, Math.floor(maxH / (1 + 2 * display.secScale)));
    const hCap = Math.floor(hVal * display.secScale);
    const hUnit = Math.floor(hVal * display.secScale);
    const sizes = {
      cPx: T.fitTextPx(state.ctx, display.caption, boxW, hCap, state.family, state.labelWeight),
      vPx: T.fitTextPx(state.ctx, display.value, boxW, hVal, state.family, state.valueWeight),
      uPx: T.fitTextPx(state.ctx, display.unit, boxW, hUnit, state.family, state.labelWeight),
      hCap: hCap,
      hVal: hVal,
      hUnit: hUnit
    };

    T.drawThreeRowsBlock(
      state.ctx,
      state.family,
      state.geom.cx - Math.floor(boxW / 2),
      yBottom - maxH,
      boxW,
      maxH,
      display.caption,
      display.value,
      display.unit,
      display.secScale,
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
    const secScale = state.value.clamp((left.secScale + right.secScale) / 2, 0.3, 3.0);
    const extra = Math.max(6, Math.floor(R * 0.06));
    const rSafe = Math.max(10, state.geom.rOuter - (state.geom.labelInsetVal + extra));
    const colGap = Math.max(6, Math.floor(R * 0.05));
    const innerMargin = Math.max(4, Math.floor(R * 0.03));

    const maxH = Math.max(30, Math.floor((rSafe - innerMargin) * 0.9));
    const halfW = Math.max(14, Math.floor((Math.max(20, rSafe * 1.2) - colGap) / 2));
    const hv = Math.max(12, Math.floor(maxH / (1 + 2 * secScale)));
    const hc = Math.floor(hv * secScale);
    const hu = Math.floor(hv * secScale);

    const sizes = {
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
      id: "FullCircleDialTextLayout",
      drawSingleModeText: drawSingleModeText,
      drawDualModeText: drawDualModeText
    };
  }

  return { id: "FullCircleDialTextLayout", create: create };
}));
