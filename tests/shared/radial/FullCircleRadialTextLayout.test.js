const { loadFresh } = require("../../helpers/load-umd");

describe("FullCircleRadialTextLayout", function () {
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
      geom: Object.assign({
        R: 120,
        rOuter: 120,
        cx: 150,
        cy: 150
      }, cfg.geom || {}),
      layout: Object.assign({
        contentRect: { x: 8, y: 8, w: 284, h: 284 },
        normal: {
          safeRadius: 78,
          compactCenterHeight: 14,
          dualCompactWidth: 120,
          dualCompactInset: 5,
          dualCompactHeight: 55
        }
      }, cfg.layout || {}),
      slots: Object.assign({
        leftTop: { x: 8, y: 90, w: 36, h: 42 },
        leftBottom: { x: 8, y: 132, w: 36, h: 42 },
        rightTop: { x: 256, y: 90, w: 36, h: 42 },
        rightBottom: { x: 256, y: 132, w: 36, h: 42 },
        top: { x: 8, y: 8, w: 284, h: 26 },
        bottom: { x: 8, y: 266, w: 284, h: 26 }
      }, cfg.slots || {}),
      text: {
        measureValueUnitFit(ctx, family, valueText, unitText, maxW, maxH) {
          return { vPx: Math.max(1, Math.floor(maxH * 0.7)), uPx: Math.max(1, Math.floor(maxH * 0.45)), gap: 4 };
        },
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit, align) {
          calls.valueUnit.push({ x, y, w, h, valueText, unitText, fit, align });
        },
        fitTextPx(ctx, text, maxW, maxH) {
          const len = Math.max(1, String(text || "").length);
          return Math.max(1, Math.min(Math.floor(maxW / len), Math.max(1, Math.floor(maxH * 0.8))));
        },
        drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
          calls.threeRows.push({ x, y, w, h, caption, value, unit, secScale, align, sizes });
        },
        drawCaptionMax() {},
        fitInlineCapValUnit(ctx, family, caption, valueText, unitText, maxW, maxH) {
          return { cPx: Math.max(1, Math.floor(maxH * 0.4)), vPx: Math.max(1, Math.floor(maxH * 0.7)), uPx: Math.max(1, Math.floor(maxH * 0.45)), g1: 4, g2: 4, total: maxW };
        },
        drawInlineCapValUnit(ctx, family, x, y, w, h, caption, valueText, unitText, fit) {
          calls.inline.push({ x, y, w, h, caption, valueText, unitText, fit });
        }
      }
    };

    return { state, calls };
  }

  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  function makeSingleDisplay(overrides) {
    return Object.assign({
      caption: "HDM",
      value: "185",
      unit: "deg",
      secScale: 0.8
    }, overrides || {});
  }

  function makeDualDisplay() {
    return {
      left: { caption: "AWA", value: "041", unit: "deg", secScale: 0.8 },
      right: { caption: "AWS", value: "15.3", unit: "kn", secScale: 0.8 }
    };
  }

  it("packs single normal text inside the layout-owned safe radius and centers the block", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create({}, {});
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.threeRows).toHaveLength(1);
    const block = harness.calls.threeRows[0];
    expect(block.x).toBe(harness.state.geom.cx - Math.floor(block.w / 2));
    expect(block.y).toBe(harness.state.geom.cy - Math.floor(block.h / 2));
    expect(block.w / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
    expect(block.h / 2).toBeLessThanOrEqual(harness.state.layout.normal.safeRadius);
  });

  it("packs dual normal text with a theme-driven column gap and mirrored alignment", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create({}, {});
    const harness = createHarness();
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    expect(harness.calls.threeRows).toHaveLength(2);
    const leftBlock = harness.calls.threeRows[0];
    const rightBlock = harness.calls.threeRows[1];
    const expectedGap = Math.max(1, Math.floor(harness.state.geom.R * 0.05));

    expect(rightBlock.x - (leftBlock.x + leftBlock.w)).toBe(expectedGap);
    expect(leftBlock.align).toBe("right");
    expect(rightBlock.align).toBe("left");
  });

  it("boosts compact text occupancy while keeping layout geometry fixed", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create({}, {});
    const large = createHarness({ textFillScale: 1 });
    const compact = createHarness({ textFillScale: 1.18 });
    const display = makeSingleDisplay();

    layout.drawSingleModeText(large.state, "normal", display);
    layout.drawSingleModeText(compact.state, "normal", display);

    expect(compact.calls.threeRows[0].sizes.vPx).toBeGreaterThan(large.calls.threeRows[0].sizes.vPx);
    expect(compact.calls.threeRows[0].sizes.cPx).toBeGreaterThan(large.calls.threeRows[0].sizes.cPx);
    expect(compact.calls.threeRows[0].w).toBe(large.calls.threeRows[0].w);
    expect(compact.calls.threeRows[0].h).toBe(large.calls.threeRows[0].h);
  });

  it("applies full-circle normal layout token overrides deterministically", function () {
    const layout = loadFresh("shared/widget-kits/radial/FullCircleRadialTextLayout.js").create({}, {});
    const base = createHarness();
    const override = createHarness({
      theme: {
        radial: {
          fullCircle: {
            normal: {
              innerMarginFactor: 0.10,
              minHeightFactor: 0.60,
              dualGapFactor: 0.12
            }
          }
        }
      }
    });
    const display = makeDualDisplay();

    layout.drawDualModeText(base.state, "normal", display.left, display.right);
    layout.drawDualModeText(override.state, "normal", display.left, display.right);

    const baseLeft = base.calls.threeRows[0];
    const baseRight = base.calls.threeRows[1];
    const overrideLeft = override.calls.threeRows[0];
    const overrideRight = override.calls.threeRows[1];

    expect(overrideRight.x - (overrideLeft.x + overrideLeft.w)).toBe(Math.max(1, Math.floor(override.state.geom.R * 0.12)));
    expect(overrideRight.x - (overrideLeft.x + overrideLeft.w)).toBeGreaterThan(baseRight.x - (baseLeft.x + baseLeft.w));
    expect(overrideLeft.w).toBeLessThan(baseLeft.w);
    expect(overrideLeft.h).toBeGreaterThan(baseLeft.h);
  });
});
