// @ts-check
const { createHarness, createModel } = require("./MapZoomHtmlFit-setup");

describe("MapZoomHtmlFit", function () {
  it("uses theme token weights for normal mode and required-row fitting", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("normal", true),
      hostContext: h.hostContext,
      shellRect: { width: 220, height: 110 }
    });

    expect(h.themeApi.resolveForRoot).toHaveBeenCalledWith(h.shellEl);
    expect(h.calls.normal).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[0].valueWeight).toBe(730);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[0].labelWeight).toBe(610);
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine.some((call) => call.weight === 610)).toBe(true);
  });

  it("uses theme token weights for high and flat fitting paths", function () {
    const h = createHarness();

    h.fit.compute({
      model: createModel("high", false),
      hostContext: h.hostContext,
      shellRect: { width: 120, height: 220 }
    });
    h.fit.compute({
      model: createModel("flat", false),
      hostContext: h.hostContext,
      shellRect: { width: 320, height: 90 }
    });

    expect(h.calls.high).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.high[0].valueWeight).toBe(730);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.high[0].labelWeight).toBe(610);
    expect(h.calls.flat).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.flat[0].valueWeight).toBe(730);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.flat[0].labelWeight).toBe(610);
  });

  it("uses mono family and invalidates the fit cache when stableDigits toggles", function () {
    const h = createHarness();
    const stableRect = { width: 220, height: 110 };
    const baseModel = Object.assign(createModel("normal", true), {
      stableDigitsEnabled: false,
      zoomPlainText: "12.2",
      requiredPlainText: "(10.8)"
    });

    const first = h.fit.compute({
      model: baseModel,
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(h.calls.normal).toHaveLength(1);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[0].family).toBe("sans-serif");
    expect(h.calls.singleLine.length).toBeGreaterThanOrEqual(3);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine[0].family).toBe("sans-serif");

    const second = h.fit.compute({
      model: Object.assign({}, baseModel, { stableDigitsEnabled: true }),
      hostContext: h.hostContext,
      shellRect: stableRect
    });
    expect(second).not.toBe(first);
    expect(h.calls.normal).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[1].family).toBe("sans-serif");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[1].useMono).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[1].monoFamily).toBe("monospace");
  });

  it("falls back to unpadded zoom and required text when the padded fit is tighter", function () {
    const h = createHarness({
      valuePxByText: {
        "07.2": 8,
        7.2: 12
      },
      singleLineWidthByText: {
        "07.2": 1000,
        7.2: 10,
        "(06.5)": 1000,
        "(6.5)": 10
      },
      requiredPxByText: {
        "(06.5)": 7,
        "(6.5)": 11
      }
    });

    const out = h.fit.compute({
      model: Object.assign(createModel("normal", true), {
        stableDigitsEnabled: true,
        zoomText: "07.2",
        zoomPlainText: "7.2",
        requiredText: "(06.5)",
        requiredPlainText: "(6.5)"
      }),
      hostContext: h.hostContext,
      shellRect: { width: 180, height: 100 }
    });

    expect(out.zoomText).toBe("7.2");
    expect(out.requiredText).toBe("(6.5)");
    expect(h.calls.normal).toHaveLength(2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[0].valueText).toBe("07.2");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.normal[1].valueText).toBe("7.2");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine[0].text).toBe("07.2");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine.some((call) => call.text === "07.2")).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine.some((call) => call.text === "(06.5)")).toBe(true);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(h.calls.singleLine.some((call) => call.text === "(6.5)")).toBe(true);
  });
});
