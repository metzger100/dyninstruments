const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("CanvasTextLayout", function () {
  /** @returns {any} */
  function createCtx() {
    const fillCalls = /** @type {any[]} */ ([]);
    const alphaStack = /** @type {any[]} */ ([]);
    const ctx = /** @type {any} */ ({
      globalAlpha: 1,
      textAlign: "left",
      textBaseline: "alphabetic",
      font: "10px sans-serif",
      saveCount: 0,
      restoreCount: 0,
      save() {
        this.saveCount += 1;
        alphaStack.push(this.globalAlpha);
      },
      restore() {
        this.restoreCount += 1;
        if (alphaStack.length) {
          this.globalAlpha = alphaStack.pop();
        }
      },
      translate() {},
      scale() {},
      /** @param {any} text */
      measureText(text) {
        return { width: String(text || "").length * 10 };
      },
      /** @param {any} text */
      fillText(text) {
        fillCalls.push({ text: String(text), alpha: this.globalAlpha });
      }
    });
    ctx.fillCalls = fillCalls;
    return ctx;
  }

  function createHarness() {
    const fitting = {
      MIN_FONT_PX: 1,
      WIDTH_EPSILON: 0.01,
      /** @param {any} value @param {any} fallback */
      clampPositive(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : fallback;
      },
      /** @param {any} ctx @param {any} px @param {any} weight @param {any} family */
      setFont(ctx, px, weight, family) {
        ctx.font =
          Math.floor(Number(weight) || 0) +
          " " +
          Math.max(1, Math.floor(Number(px) || 0)) +
          "px " +
          (family || "sans-serif");
      },
      /** @param {any} ctx @param {any} text */
      measureTextWidth(ctx, text) {
        return ctx.measureText(String(text || "")).width;
      },
      fitTextPx() {
        return 12;
      },
      fitSingleTextPx() {
        return 12;
      },
      measureValueUnitFit() {
        return { vPx: 18, uPx: 12, gap: 4 };
      },
      fitInlineCapValUnit() {
        return { cPx: 10, vPx: 16, uPx: 10, g1: 4, g2: 3, total: 120 };
      }
    };
    const moduleApi = loadFresh("shared/widget-kits/text/CanvasTextLayout.js");
    return moduleApi.create(
      {},
      createComponentContextMock({
        modules: {
          CanvasTextFitting: {
            create() {
              return fitting;
            }
          }
        }
      })
    );
  }

  it("drawCaptionMax applies captionOpacity via globalAlpha", function () {
    const textApi = createHarness();
    const ctx = createCtx();

    textApi.drawCaptionMax(ctx, "sans-serif", 0, 0, 200, 40, "SPD", 20, "left", 700, {
      captionOpacity: 0.6
    });

    expect(ctx.fillCalls[0].alpha).toBe(0.6);
    expect(ctx.saveCount).toBe(1);
    expect(ctx.restoreCount).toBe(1);
  });

  it("drawCaptionMax does not save/restore when captionOpacity is 1", function () {
    const textApi = createHarness();
    const ctx = createCtx();

    textApi.drawCaptionMax(ctx, "sans-serif", 0, 0, 200, 40, "SPD", 20, "left", 700, {
      captionOpacity: 1
    });

    expect(ctx.fillCalls[0].alpha).toBe(1);
    expect(ctx.saveCount).toBe(0);
    expect(ctx.restoreCount).toBe(0);
  });

  it("drawValueUnitWithFit applies unitOpacity to unit only", function () {
    const textApi = createHarness();
    const ctx = createCtx();

    textApi.drawValueUnitWithFit(
      ctx,
      "sans-serif",
      0,
      0,
      220,
      60,
      "12.3",
      "kn",
      { vPx: 18, uPx: 12, gap: 4 },
      "left",
      700,
      600,
      { unitOpacity: 0.5 }
    );

    expect(ctx.fillCalls[0].alpha).toBe(1);
    expect(ctx.fillCalls[1].alpha).toBe(0.5);
  });

  it("drawThreeRowsBlock applies captionOpacity and unitOpacity independently", function () {
    const textApi = createHarness();
    const ctx = createCtx();

    textApi.drawThreeRowsBlock(
      ctx,
      "sans-serif",
      0,
      0,
      220,
      90,
      "CAP",
      "12.3",
      "kn",
      0.8,
      "center",
      { cPx: 12, vPx: 18, uPx: 12, hCap: 20, hVal: 30, hUnit: 20 },
      700,
      600,
      { captionOpacity: 0.7, unitOpacity: 0.5 }
    );

    expect(ctx.fillCalls[0].alpha).toBe(0.7);
    expect(ctx.fillCalls[1].alpha).toBe(1);
    expect(ctx.fillCalls[2].alpha).toBe(0.5);
  });

  it("drawInlineCapValUnit applies both opacities", function () {
    const textApi = createHarness();
    const ctx = createCtx();

    textApi.drawInlineCapValUnit(
      ctx,
      "sans-serif",
      0,
      0,
      260,
      80,
      "CAP",
      "12.3",
      "kn",
      { cPx: 12, vPx: 20, uPx: 12, g1: 4, g2: 3, total: 100 },
      700,
      600,
      { captionOpacity: 0.7, unitOpacity: 0.5 }
    );

    expect(ctx.fillCalls[0].alpha).toBe(0.7);
    expect(ctx.fillCalls[1].alpha).toBe(1);
    expect(ctx.fillCalls[2].alpha).toBe(0.5);
  });
});
