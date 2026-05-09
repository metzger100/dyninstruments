/**
 * Module: DyniPlugin Canvas Runtime - HiDPI canvas setup service
 * Documentation: documentation/shared/helpers.md
 * Depends: browser Canvas 2D
 */
(function (root) {
  "use strict";

  const ns = root.DyniPlugin;
  const runtime = ns.runtime;
  const layoutByCanvas = new WeakMap();

  function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const dpr = root.devicePixelRatio || 1;

    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const cachedLayout = layoutByCanvas.get(canvas);
    const layout = cachedLayout &&
      cachedLayout.clientWidth === clientWidth &&
      cachedLayout.clientHeight === clientHeight
      ? cachedLayout
      : (function () {
        const rect = canvas.getBoundingClientRect();
        const nextLayout = {
          clientWidth: clientWidth,
          clientHeight: clientHeight,
          cssWidth: rect.width,
          cssHeight: rect.height
        };
        layoutByCanvas.set(canvas, nextLayout);
        return nextLayout;
      }());

    const w = Math.max(1, Math.round(layout.cssWidth * dpr));
    const h = Math.max(1, Math.round(layout.cssHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {
      ctx: ctx,
      W: Math.max(1, Math.round(layout.cssWidth)),
      H: Math.max(1, Math.round(layout.cssHeight))
    };
  }

  runtime.canvas = Object.freeze({
    setupCanvas: setupCanvas
  });
}(this));
