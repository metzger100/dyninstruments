const { loadFresh } = require("../../helpers/load-umd");

describe("FullCircleDialTextLayout", function () {
  function createHarness(overrides) {
    const cfg = overrides || {};
    const calls = {
      threeRows: [],
      valueUnit: []
    };

    const state = {
      ctx: {},
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 700,
      pad: 10,
      W: 300,
      H: 300,
      theme: cfg.theme || {},
      geom: Object.assign({
        R: 120,
        rOuter: 120,
        labelInsetVal: 36,
        cx: 150,
        cy: 150,
        topStrip: 0
      }, cfg.geom || {}),
      value: {
        clamp(value, lo, hi) {
          const n = Number(value);
          if (!isFinite(n)) return Number(lo);
          return Math.max(Number(lo), Math.min(Number(hi), n));
        }
      },
      text: {
        measureValueUnitFit() {
          return { vPx: 12, uPx: 10, gap: 6 };
        },
        drawValueUnitWithFit(ctx, family, x, y, w, h, valueText, unitText, fit, align) {
          calls.valueUnit.push({ x, y, w, h, valueText, unitText, align });
        },
        fitTextPx(ctx, text, maxW, maxH) {
          const len = Math.max(1, String(text || "").length);
          const byWidth = Math.floor(maxW / len);
          return Math.max(1, Math.min(byWidth, Math.floor(maxH)));
        },
        drawThreeRowsBlock(ctx, family, x, y, w, h, caption, value, unit, secScale, align, sizes) {
          calls.threeRows.push({ x, y, w, h, caption, value, unit, secScale, align, sizes });
        },
        drawCaptionMax() {},
        fitInlineCapValUnit() {
          return { cPx: 10, vPx: 12, uPx: 10, gap: 6, total: 40, g1: 6, g2: 6 };
        },
        drawInlineCapValUnit() {}
      }
    };

    return { state, calls };
  }

  function makeSingleDisplay(overrides) {
    return Object.assign({
      caption: "HDM",
      value: "185",
      unit: "°",
      secScale: 0.8
    }, overrides || {});
  }

  function makeDualDisplay() {
    return {
      left: { caption: "AWA", value: "041", unit: "°", secScale: 0.8 },
      right: { caption: "AWS", value: "15.3", unit: "kn", secScale: 0.8 }
    };
  }

  it("packs single normal text using diameter-aware fit and center alignment", function () {
    const layout = loadFresh("shared/widget-kits/gauge/FullCircleDialTextLayout.js").create({}, {});
    const harness = createHarness();

    layout.drawSingleModeText(harness.state, "normal", makeSingleDisplay());

    expect(harness.calls.threeRows).toHaveLength(1);
    const block = harness.calls.threeRows[0];
    const rSafe = Math.max(
      10,
      harness.state.geom.rOuter - (harness.state.geom.labelInsetVal + Math.max(6, Math.floor(harness.state.geom.R * 0.06)))
    );
    const fixedWidth = Math.max(40, Math.floor(rSafe * 1.6));
    const fixedHeight = Math.max(32, Math.floor(rSafe * 0.95));
    const fixedArea = fixedWidth * fixedHeight;

    expect(block.w * block.h).toBeGreaterThan(fixedArea);
    expect(block.x).toBe(harness.state.geom.cx - Math.floor(block.w / 2));
    expect(block.y).toBe(harness.state.geom.cy - Math.floor(block.h / 2));
  });

  it("packs dual normal text with tokenized default column gap and wider columns", function () {
    const layout = loadFresh("shared/widget-kits/gauge/FullCircleDialTextLayout.js").create({}, {});
    const harness = createHarness();
    const display = makeDualDisplay();

    layout.drawDualModeText(harness.state, "normal", display.left, display.right);

    expect(harness.calls.threeRows).toHaveLength(2);
    const leftBlock = harness.calls.threeRows[0];
    const rightBlock = harness.calls.threeRows[1];
    const gap = rightBlock.x - (leftBlock.x + leftBlock.w);
    const expectedGap = Math.max(6, Math.floor(harness.state.geom.R * 0.05));
    const rSafe = Math.max(
      10,
      harness.state.geom.rOuter - (harness.state.geom.labelInsetVal + Math.max(6, Math.floor(harness.state.geom.R * 0.06)))
    );
    const fixedHalfWidth = Math.max(14, Math.floor((Math.max(20, rSafe * 1.2) - expectedGap) / 2));

    expect(gap).toBe(expectedGap);
    expect(leftBlock.w).toBeGreaterThan(fixedHalfWidth);
    expect(leftBlock.align).toBe("right");
    expect(rightBlock.align).toBe("left");
  });

  it("applies full-circle normal layout token overrides deterministically", function () {
    const layout = loadFresh("shared/widget-kits/gauge/FullCircleDialTextLayout.js").create({}, {});
    const defaultHarness = createHarness();
    const overrideHarness = createHarness({
      theme: {
        fullCircle: {
          normal: {
            innerMarginFactor: 0.10,
            minHeightFactor: 0.60,
            dualGapFactor: 0.12
          }
        }
      }
    });
    const display = makeDualDisplay();

    layout.drawDualModeText(defaultHarness.state, "normal", display.left, display.right);
    layout.drawDualModeText(overrideHarness.state, "normal", display.left, display.right);

    const defaultLeft = defaultHarness.calls.threeRows[0];
    const defaultRight = defaultHarness.calls.threeRows[1];
    const overrideLeft = overrideHarness.calls.threeRows[0];
    const overrideRight = overrideHarness.calls.threeRows[1];
    const defaultGap = defaultRight.x - (defaultLeft.x + defaultLeft.w);
    const overrideGap = overrideRight.x - (overrideLeft.x + overrideLeft.w);

    expect(overrideGap).toBe(Math.max(6, Math.floor(overrideHarness.state.geom.R * 0.12)));
    expect(overrideGap).toBeGreaterThan(defaultGap);
    expect(overrideLeft.w).toBeLessThan(defaultLeft.w);
    expect(overrideLeft.h).toBeGreaterThan(defaultLeft.h);

    const singleDefault = createHarness();
    const singleOverride = createHarness({
      theme: {
        fullCircle: {
          normal: {
            innerMarginFactor: 0.20
          }
        }
      }
    });

    layout.drawSingleModeText(singleDefault.state, "normal", makeSingleDisplay());
    layout.drawSingleModeText(singleOverride.state, "normal", makeSingleDisplay());

    expect(singleOverride.calls.threeRows[0].w).toBeLessThan(singleDefault.calls.threeRows[0].w);
  });
});
