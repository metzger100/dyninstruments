// @ts-check
const { createHarness, makeModel } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("recomputes when fontMetricsEpoch changes so cold-load font metrics do not reuse stale fit cache", function () {
    const h = createHarness();
    const model = makeModel();
    const shellRect = { width: 240, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 0
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 0
    });
    const third = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect,
      fontMetricsEpoch: 1
    });

    expect(second).toBe(first);
    expect(third).not.toBe(first);
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(2);
  });
});
