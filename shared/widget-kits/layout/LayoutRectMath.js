/**
 * Module: LayoutRectMath - Shared rectangle rounding helper for responsive layout owners
 * Documentation: documentation/shared/responsive-scale-profile.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniLayoutRectMath = factory();
  }
}(this, function () {
  "use strict";

  function create() {
    function makeRect(x, y, w, h) {
      return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.max(0, Math.round(w)),
        h: Math.max(0, Math.round(h))
      };
    }

    function splitRow(rect, gap, count, makeRectFn) {
      const source = rect && typeof rect === "object" ? rect : makeRect(0, 0, 0, 0);
      const buildRect = typeof makeRectFn === "function" ? makeRectFn : makeRect;
      const safeCount = Math.max(1, Math.floor(count));
      const safeGap = Math.max(0, Math.floor(gap));
      const totalGaps = safeGap * Math.max(0, safeCount - 1);
      const availableWidth = Math.max(0, source.w - totalGaps);
      let cursorX = source.x;
      let remainingWidth = availableWidth;
      const out = [];

      for (let i = 0; i < safeCount; i += 1) {
        const remainingCols = safeCount - i;
        const width = remainingCols <= 1
          ? Math.max(1, remainingWidth)
          : Math.max(1, Math.floor(remainingWidth / remainingCols));
        out.push(buildRect(cursorX, source.y, width, source.h));
        cursorX += width + safeGap;
        remainingWidth = Math.max(0, source.x + source.w - cursorX - safeGap * Math.max(0, safeCount - i - 2));
      }
      return out;
    }

    function splitStack(rect, gap, count, makeRectFn) {
      const source = rect && typeof rect === "object" ? rect : makeRect(0, 0, 0, 0);
      const buildRect = typeof makeRectFn === "function" ? makeRectFn : makeRect;
      const safeCount = Math.max(1, Math.floor(count));
      const safeGap = Math.max(0, Math.floor(gap));
      const totalGaps = safeGap * Math.max(0, safeCount - 1);
      const availableHeight = Math.max(0, source.h - totalGaps);
      let cursorY = source.y;
      let remainingHeight = availableHeight;
      const out = [];

      for (let i = 0; i < safeCount; i += 1) {
        const remainingRows = safeCount - i;
        const height = remainingRows <= 1
          ? Math.max(1, remainingHeight)
          : Math.max(1, Math.floor(remainingHeight / remainingRows));
        out.push(buildRect(source.x, cursorY, source.w, height));
        cursorY += height + safeGap;
        remainingHeight = Math.max(0, source.y + source.h - cursorY - safeGap * Math.max(0, safeCount - i - 2));
      }
      return out;
    }

    return {
      id: "LayoutRectMath",
      makeRect: makeRect,
      splitRow: splitRow,
      splitStack: splitStack
    };
  }

  return { id: "LayoutRectMath", create: create };
}));
