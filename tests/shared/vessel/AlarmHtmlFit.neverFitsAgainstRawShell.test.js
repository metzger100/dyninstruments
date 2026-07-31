// @ts-check
const { computePadX, createHarness, createMeasuredTextLayoutApi, makeModel } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("never fits against raw shell rect dimensions", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 100 };

    h.fit.compute({
      model: makeModel({
        state: "active",
        interactionState: "dispatch",
        showStrip: false,
        showActiveBackground: true
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const layout = h.fit.resolveLayout({
      model: makeModel({
        state: "active",
        interactionState: "dispatch",
        showStrip: false,
        showActiveBackground: true
      }),
      shellRect: shellRect
    });
    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(
      layout.contentRect.width - computePadX(layout.contentRect.width, layout.contentRect.height) * 2
    );
    expect(fitArgs.H).toBe(layout.contentRect.height);
    expect(fitArgs.W).not.toBe(shellRect.width);
    expect(fitArgs.H).not.toBe(shellRect.height);
  });

  it("leaves padX space on both sides in flat mode by fitting against reduced width", function () {
    const textLayoutApi = createMeasuredTextLayoutApi();
    const h = createHarness({ textLayoutApi: textLayoutApi });
    const shellRect = { width: 800, height: 200 };
    const layout = h.fit.resolveLayout({
      model: makeModel({
        showStrip: false,
        captionText: "ALARM",
        valueText: "NONE"
      }),
      shellRect: shellRect
    });
    const contentWidth = layout.contentRect.width;
    const contentHeight = layout.contentRect.height;
    const padX = computePadX(contentWidth, contentHeight);

    const result = h.fit.compute({
      model: makeModel({
        showStrip: false,
        captionText: "ALARM",
        valueText: "NONE"
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitCall = textLayoutApi.fitInlineTriplet.mock.calls[0];
    const fitArg = fitCall && fitCall[0];
    if (!fitArg || typeof fitArg !== "object") {
      throw new Error("Expected the inline-fit input.");
    }
    const fitArgs = /** @type {{ gap: number, maxW: number }} */ (fitArg);
    const measureCtx = h.hostContext.__dyniAlarmMeasureCtx;
    measureCtx.font = "600 " + result.captionPx + "px sans-serif";
    const captionWidth = measureCtx.measureText("ALARM").width;
    measureCtx.font = "700 " + result.valuePx + "px sans-serif";
    const valueWidth = measureCtx.measureText("NONE").width;
    const totalWidth = captionWidth + fitArgs.gap + valueWidth;
    const contentEdgeGap = (contentWidth - totalWidth) / 2;

    expect(result.mode).toBe("flat");
    expect(fitArgs.maxW).toBe(contentWidth - padX * 2);
    expect(totalWidth).toBeLessThanOrEqual(fitArgs.maxW + 0.01);
    expect(contentEdgeGap).toBeGreaterThanOrEqual(padX - 0.01);
  });
});
