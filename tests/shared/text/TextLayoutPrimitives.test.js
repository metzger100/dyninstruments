const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("TextLayoutPrimitives", function () {
  function createHarness() {
    const canvasTextLayout = {
      setFont(ctx, px, weight, family) {
        ctx.font = Math.floor(Number(weight) || 0) + " " + Math.max(1, Math.floor(Number(px) || 0)) + "px " + (family || "sans-serif");
      }
    };
    const moduleApi = loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js");
    return moduleApi.create({}, createComponentContextMock({
      modules: {
        CanvasTextLayout: {
          create() {
            return canvasTextLayout;
          }
        }
      }
    }));
  }

  function createCtx() {
    const fillCalls = [];
    const ctx = {
      globalAlpha: 1,
      textAlign: "left",
      textBaseline: "alphabetic",
      fillText(text) {
        fillCalls.push({ text: String(text), alpha: this.globalAlpha });
      }
    };
    ctx.fillCalls = fillCalls;
    return ctx;
  }

  it("drawInlineTriplet applies captionOpacity and unitOpacity", function () {
    const primitive = createHarness();
    const ctx = createCtx();

    primitive.drawInlineTriplet({
      ctx: ctx,
      fit: { vPx: 20, sPx: 12, cW: 24, vW: 30, uW: 16, total: 80, gap: 4 },
      captionText: "CAP",
      valueText: "12.3",
      unitText: "kn",
      x: 0,
      y: 0,
      W: 220,
      H: 80,
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600,
      captionOpacity: 0.6,
      unitOpacity: 0.4
    });

    expect(ctx.fillCalls[0].alpha).toBe(0.6);
    expect(ctx.fillCalls[1].alpha).toBe(1);
    expect(ctx.fillCalls[2].alpha).toBe(0.4);
  });
});
