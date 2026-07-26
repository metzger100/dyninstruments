// @ts-check
const { computePadX, createHarness, makeModel } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("fits against the inner content rect when the idle strip is present", function () {
    const h = createHarness();
    const shellRect = { width: 220, height: 100 };
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const layout = h.fit.resolveLayout({
      model: model,
      shellRect: shellRect
    });
    const padX = computePadX(layout.contentRect.width, layout.contentRect.height);

    const result = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    expect(fitArgs.W).toBe(layout.contentRect.width - padX * 2);
    expect(fitArgs.H).toBe(layout.contentRect.height);
    expect(result.valuePx).toBe(17);
  });
});
