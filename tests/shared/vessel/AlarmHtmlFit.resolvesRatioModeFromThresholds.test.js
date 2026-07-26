// @ts-check
const { createHarness, makeModel } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("resolves ratio mode from thresholds", function () {
    const h = createHarness();

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 90, height: 100 }
      }).mode
    ).toBe("high");

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 200, height: 100 }
      }).mode
    ).toBe("normal");

    expect(
      h.fit.compute({
        model: makeModel(),
        targetEl: h.targetEl,
        hostContext: h.hostContext,
        shellRect: { width: 400, height: 100 }
      }).mode
    ).toBe("flat");

    expect(h.textLayoutApi.fitThreeRowBlock).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitInlineTriplet).toHaveBeenCalledTimes(1);
  });

  it("passes the summary text through unchanged so fit never re-decides the 3+ alarm rule", function () {
    const h = createHarness();
    const model = makeModel({
      valueText: "firstAlarm, secondAlarm +1"
    });

    const result = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 200, height: 100 }
    });

    expect(result.mode).toBe("normal");
    expect(h.textLayoutApi.fitValueUnitCaptionRows).toHaveBeenCalledTimes(1);
    expect(h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0].valueText).toBe("firstAlarm, secondAlarm +1");
  });

  it("sources active and idle token styles from theme tokens", function () {
    const h = createHarness();
    const active = h.fit.compute({
      model: makeModel({ showActiveBackground: true }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });
    const idle = h.fit.compute({
      model: makeModel({
        state: "idle",
        interactionState: "passive",
        showStrip: true,
        showActiveBackground: false
      }),
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 100 }
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.targetEl);
    expect(active.activeBackgroundStyle).toBe("background-color:#d9534a;");
    expect(active.activeForegroundStyle).toBe("color:#ffffff;");
    expect(idle.shellStyle).toContain("padding:");
    expect(idle.accentStyle).toContain("background-color:#2e9e6b;");
    expect(idle.idleStripStyle).toBe(idle.accentStyle);
  });
});
