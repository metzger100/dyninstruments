// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

// This part covers the "high" single/dual mode and the safeRadius<=1 compact
// fallback paths. Every other part file in this suite only ever drives
// "flat" and "normal" modes with a generously sized safeRadius, so
// drawSingleHigh/drawDualCompactRows/drawSingleCompactCenterRow (and the
// boostInlineFit helper they depend on) were never exercised even though
// "high" mode is a real production mode used by CompassRadialWidget and
// WindRadialWidget, and the compact fallback is the real degenerate-size
// path taken when the responsive layout shrinks safeRadius to ~0.
describe("FullCircleRadialTextLayout high mode and compact fallback", function () {
  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  function createHarness(overrides) {
    const cfg = overrides || {};
    const calls = {
      threeRows: [],
      valueUnit: [],
      inline: []
    };
    const state = {
      ctx: {},
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 700,
      pad: 8,
      W: 300,
      H: 300,
      textFillScale: hasOwn(cfg, "textFillScale") ? cfg.textFillScale : 1,
      theme: cfg.theme || {},
      geom: Object.assign({ R: 120, rOuter: 120, cx: 150, cy: 150 }, cfg.geom || {}),
      layout: Object.assign(
        {
          contentRect: { x: 8, y: 8, w: 284, h: 284 },
          normal: {
            safeRadius: 78,
            compactCenterHeight: 14,
            dualCompactWidth: 120,
            dualCompactInset: 5,
            dualCompactHeight: 55
          }
        },
        cfg.layout || {}
      ),
      slots: Object.assign(
        {
          leftTop: { x: 8, y: 90, w: 36, h: 42 },
          leftBottom: { x: 8, y: 132, w: 36, h: 42 },
          rightTop: { x: 256, y: 90, w: 36, h: 42 },
          rightBottom: { x: 256, y: 132, w: 36, h: 42 },
          top: { x: 8, y: 8, w: 284, h: 26 },
          bottom: { x: 8, y: 266, w: 284, h: 26 }
        },
        cfg.slots || {}
      ),
      text: {
        measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH) {
          return {
            vPx: Math.max(1, Math.floor(maxH * 0.7)),
            uPx: Math.max(1, Math.floor(maxH * 0.45)),
            gap: 4
          };
        },
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit, align) {
          calls.valueUnit.push({ x, y, w, h, valueText, unitText, fit, align });
        },
        fitTextPx(ctx, text, maxW, maxH) {
          const len = Math.max(1, String(text || "").length);
          return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
        },
        drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
          calls.threeRows.push({
            x,
            y,
            w,
            h,
            caption,
            value,
            unit,
            secScale,
            align,
            sizes
          });
        },
        drawCaptionMax() {},
        fitInlineCapValUnit(ctx, family, caption, valueText, unitText, maxW, maxH) {
          return {
            cPx: Math.max(1, Math.floor(maxH * 0.4)),
            vPx: Math.max(1, Math.floor(maxH * 0.7)),
            uPx: Math.max(1, Math.floor(maxH * 0.45)),
            g1: 4,
            g2: 4,
            total: maxW
          };
        },
        drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
          calls.inline.push({ x, y, w, h, caption, valueText, unitText, fit });
        }
      }
    };

    return { state, calls };
  }

  function makeSingleDisplay(overrides) {
    const defaults = { caption: "HDM", value: "185", unit: "deg", secScale: 0.8 };
    return Object.assign(defaults, overrides || {});
  }

  function makeDualDisplay() {
    return {
      left: { caption: "AWA", value: "041", unit: "deg", secScale: 0.8 },
      right: { caption: "AWS", value: "15.3", unit: "kn", secScale: 0.8 }
    };
  }

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/radial/FullCircleRadialTextLayout.js", context);

    expect(context.DyniComponents.DyniFullCircleRadialTextLayout.id).toBe("FullCircleRadialTextLayout");
  });

  it("draws single high-mode text into the top slot by default and the bottom slot when requested", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "high", makeSingleDisplay(), { slot: "top" });
    layout.drawSingleModeText(harness.state, "high", makeSingleDisplay(), { slot: "bottom" });

    expect(harness.calls.inline).toHaveLength(2);
    expect(harness.calls.inline[0].x).toBe(harness.state.slots.top.x);
    expect(harness.calls.inline[1].x).toBe(harness.state.slots.bottom.x);
  });

  it("draws dual high-mode text into the top and bottom slots for the mirrored pair", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "high", display.left, display.right);

    expect(harness.calls.inline).toHaveLength(2);
    expect(harness.calls.inline[0].caption).toBe(display.left.caption);
    expect(harness.calls.inline[0].x).toBe(harness.state.slots.top.x);
    expect(harness.calls.inline[1].caption).toBe(display.right.caption);
    expect(harness.calls.inline[1].x).toBe(harness.state.slots.bottom.x);
  });

  it("falls back to the compact single center row once safeRadius shrinks to the degenerate floor", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness({ layout: { normal: { safeRadius: 1, compactCenterHeight: 14 } } });

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.valueUnit).toHaveLength(1);
    expect(harness.calls.valueUnit[0].h).toBe(14);
    expect(harness.calls.valueUnit[0].align).toBe("center");
  });

  it("falls back to the compact dual rows once safeRadius shrinks to the degenerate floor", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness({
      layout: {
        normal: {
          safeRadius: 1,
          dualCompactWidth: 120,
          dualCompactInset: 5,
          dualCompactHeight: 55
        }
      }
    });
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    expect(harness.calls.threeRows).toHaveLength(2);
    expect(harness.calls.threeRows[0].align).toBe("right");
    expect(harness.calls.threeRows[1].align).toBe("left");
  });

  it("reuses the cached block measurement on a repeat render with the same box and display", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();
    let fitTextPxCalls = 0;
    const originalFitTextPx = harness.state.text.fitTextPx;
    harness.state.text.fitTextPx = function () {
      fitTextPxCalls += 1;
      return originalFitTextPx.apply(this, arguments);
    };

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());
    const callsAfterFirstRender = fitTextPxCalls;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(fitTextPxCalls).toBe(callsAfterFirstRender);
    expect(harness.calls.threeRows).toHaveLength(2);
    expect(harness.calls.threeRows[1].w).toBe(harness.calls.threeRows[0].w);
    expect(harness.calls.threeRows[1].sizes).toEqual(harness.calls.threeRows[0].sizes);
  });
});
