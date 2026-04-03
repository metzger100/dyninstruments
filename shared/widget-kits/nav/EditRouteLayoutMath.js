/**
 * Module: EditRouteLayoutMath - Numeric guards and row/stack split helpers for edit-route layout
 * Documentation: documentation/widgets/edit-route.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayoutMath = factory(); }
}(this, function () {
  "use strict";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function clampNumber(value, minValue, maxValue, defaultValue) {
    const n = toFiniteNumber(value);
    if (typeof n !== "number") {
      return defaultValue;
    }
    return Math.max(minValue, Math.min(maxValue, n));
  }

  function splitRow(rect, gap, columns, makeRect) {
    const count = Math.max(1, Math.floor(columns));
    const safeGap = Math.max(0, Math.floor(gap));
    const totalGaps = safeGap * Math.max(0, count - 1);
    const availableWidth = Math.max(0, rect.w - totalGaps);
    let cursorX = rect.x;
    let remainingWidth = availableWidth;
    const out = [];

    for (let i = 0; i < count; i += 1) {
      const remainingCells = count - i;
      const width = remainingCells <= 1
        ? Math.max(1, remainingWidth)
        : Math.max(1, Math.floor(remainingWidth / remainingCells));
      out.push(makeRect(cursorX, rect.y, width, rect.h));
      cursorX += width + safeGap;
      remainingWidth = Math.max(0, rect.x + rect.w - cursorX - safeGap * Math.max(0, count - i - 2));
    }
    return out;
  }

  function splitStack(rect, gap, rows, makeRect) {
    const count = Math.max(1, Math.floor(rows));
    const safeGap = Math.max(0, Math.floor(gap));
    const totalGaps = safeGap * Math.max(0, count - 1);
    const availableHeight = Math.max(0, rect.h - totalGaps);
    let cursorY = rect.y;
    let remainingHeight = availableHeight;
    const out = [];

    for (let i = 0; i < count; i += 1) {
      const remainingRows = count - i;
      const height = remainingRows <= 1
        ? Math.max(1, remainingHeight)
        : Math.max(1, Math.floor(remainingHeight / remainingRows));
      out.push(makeRect(rect.x, cursorY, rect.w, height));
      cursorY += height + safeGap;
      remainingHeight = Math.max(0, rect.y + rect.h - cursorY - safeGap * Math.max(0, count - i - 2));
    }
    return out;
  }

  function create() {
    return {
      id: "EditRouteLayoutMath",
      toFiniteNumber: toFiniteNumber,
      clampNumber: clampNumber,
      splitRow: splitRow,
      splitStack: splitStack
    };
  }

  return { id: "EditRouteLayoutMath", create: create };
}));
