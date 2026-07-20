const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("FullCircleRadialTextLayout", function () {
  /** @param {any} [overrides] */
  function createHarness(overrides) {
    const cfg = overrides || {};
    const calls = {
      threeRows: /** @type {any[]} */ ([]),
      valueUnit: /** @type {any[]} */ ([]),
      inline: /** @type {any[]} */ ([])
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
      geom: Object.assign(
        {
          R: 120,
          rOuter: 120,
          cx: 150,
          cy: 150
        },
        cfg.geom || {}
      ),
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
        measureValueUnitFit(
          /** @type {any} */ ctx,
          /** @type {any} */ family,
          /** @type {any} */ valueText,
          /** @type {any} */ unitText,
          /** @type {any} */ maxW,
          /** @type {any} */ maxH
        ) {
          return {
            vPx: Math.max(1, Math.floor(maxH * 0.7)),
            uPx: Math.max(1, Math.floor(maxH * 0.45)),
            gap: 4
          };
        },
        drawValueUnitWithFit(
          /** @type {any} */ ctx,
          /** @type {any} */ family,
          /** @type {any} */ x,
          /** @type {any} */ y,
          /** @type {any} */ w,
          /** @type {any} */ h,
          /** @type {any} */ valueText,
          /** @type {any} */ unitText,
          /** @type {any} */ fit,
          /** @type {any} */ align
        ) {
          calls.valueUnit.push({ x, y, w, h, valueText, unitText, fit, align });
        },
        fitTextPx(/** @type {any} */ ctx, /** @type {any} */ text, /** @type {any} */ maxW, /** @type {any} */ maxH) {
          const len = Math.max(1, String(text || "").length);
          return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
        },
        drawThreeRowsBlock(
          /** @type {any} */ ctx,
          /** @type {any} */ family,
          /** @type {any} */ x,
          /** @type {any} */ y,
          /** @type {any} */ w,
          /** @type {any} */ h,
          /** @type {any} */ caption,
          /** @type {any} */ value,
          /** @type {any} */ unit,
          /** @type {any} */ secScale,
          /** @type {any} */ align,
          /** @type {any} */ sizes
        ) {
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
        fitInlineCapValUnit(
          /** @type {any} */ ctx,
          /** @type {any} */ family,
          /** @type {any} */ caption,
          /** @type {any} */ valueText,
          /** @type {any} */ unitText,
          /** @type {any} */ maxW,
          /** @type {any} */ maxH
        ) {
          return {
            cPx: Math.max(1, Math.floor(maxH * 0.4)),
            vPx: Math.max(1, Math.floor(maxH * 0.7)),
            uPx: Math.max(1, Math.floor(maxH * 0.45)),
            g1: 4,
            g2: 4,
            total: maxW
          };
        },
        drawInlineCapValUnit(
          /** @type {any} */ ctx,
          /** @type {any} */ family,
          /** @type {any} */ x,
          /** @type {any} */ y,
          /** @type {any} */ w,
          /** @type {any} */ h,
          /** @type {any} */ caption,
          /** @type {any} */ valueText,
          /** @type {any} */ unitText,
          /** @type {any} */ fit
        ) {
          calls.inline.push({ x, y, w, h, caption, valueText, unitText, fit });
        }
      }
    };

    return { state, calls };
  }

  /** @param {any} source @param {any} key */
  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  /** @param {any} [overrides] */
  function makeSingleDisplay(overrides) {
    return Object.assign(
      {
        caption: "HDM",
        value: "185",
        unit: "deg",
        secScale: 0.8
      },
      overrides || {}
    );
  }

  it("packs single normal text inside the layout-owned safe radius and centers the block", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create(
      {},
      createComponentContextMock()
    );
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.threeRows).toHaveLength(1);
    const block = harness.calls.threeRows[0];
    expect(block.x).toBe(harness.state.geom.cx - Math.floor(block.w / 2));
    expect(block.y).toBe(harness.state.geom.cy - Math.floor(block.h / 2));
    expect(block.w / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
    expect(block.h / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
  });
});
