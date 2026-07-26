// @ts-check
const {
  createHarness,
  createMeasureContext,
  expectStyleFormat,
  extractPx,
  makeModel
} = require("./ActiveRouteHtmlFit-setup");

describe("ActiveRouteHtmlFit", function () {
  it("returns caption/value/unit style payload for all visible metrics", function () {
    const h = createHarness();
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const out = h.fit.compute({
      model: makeModel(),
      shellRect: { width: 320, height: 180 },
      targetEl: document.createElement("div"),
      hostContext: hostContext
    });

    expectStyleFormat(out.routeNameStyle);
    expect(Object.keys(out.metrics)).toEqual(["remain", "rteEta", "next"]);
    ["remain", "rteEta", "next"].forEach((metricId) => {
      expectStyleFormat(out.metrics[metricId].captionStyle);
      expectStyleFormat(out.metrics[metricId].valueStyle);
      expectStyleFormat(out.metrics[metricId].unitStyle);
      expect(out.metrics[metricId].gapStyle).toMatch(new RegExp("^gap:\\d+px\\x3b$"));
    });
  });

  it("shrinks caption style under tighter geometry without dropping caption payload", function () {
    const h = createHarness();
    const model = makeModel({ isApproaching: false });
    const targetEl = document.createElement("div");
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const relaxedOut = h.fit.compute({
      model: model,
      shellRect: { width: 620, height: 220 },
      targetEl: targetEl,
      hostContext: hostContext
    });
    const tightOut = h.fit.compute({
      model: model,
      shellRect: { width: 180, height: 90 },
      targetEl: targetEl,
      hostContext: hostContext
    });

    const relaxedCaptionPx = extractPx(relaxedOut.metrics.remain.captionStyle);
    const tightCaptionPx = extractPx(tightOut.metrics.remain.captionStyle);
    expect(relaxedCaptionPx).toBeGreaterThan(0);
    expect(tightCaptionPx).toBeGreaterThan(0);
    expect(tightCaptionPx).toBeLessThan(relaxedCaptionPx);
  });

  it("fails closed when required compute inputs are missing", function () {
    const h = createHarness();
    const model = makeModel();
    const targetEl = document.createElement("div");

    expect(
      h.fit.compute({
        shellRect: { width: 320, height: 180 },
        targetEl: targetEl,
        hostContext: {}
      })
    ).toBeNull();
    expect(
      h.fit.compute({
        model: model,
        targetEl: targetEl,
        hostContext: {}
      })
    ).toBeNull();
    expect(
      h.fit.compute({
        model: model,
        shellRect: { width: 320, height: 180 },
        hostContext: {}
      })
    ).toBeNull();
  });

  it("reuses identical fit requests and misses when semantic or geometric inputs change", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const baseModel = makeModel({ routeNameText: "Coastal Route" });
    const stableRect = { width: 320, height: 180 };

    const first = h.fit.compute({
      model: baseModel,
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const second = h.fit.compute({
      model: baseModel,
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(second).toBe(first);
    expect(hostContext.__dyniActiveRouteHtmlFitCache).toBeTruthy();

    const semanticMiss = h.fit.compute({
      model: makeModel({ routeNameText: "Ocean Crossing" }),
      shellRect: stableRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(semanticMiss).not.toBe(first);

    const geometryMiss = h.fit.compute({
      model: baseModel,
      shellRect: { width: 360, height: 180 },
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(geometryMiss).not.toBe(semanticMiss);
  });

  it("uses mono value family and invalidates cache when stableDigits toggles", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const measureCtx = createMeasureContext();
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: measureCtx });
    const shellRect = { width: 320, height: 180 };

    const proportional = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: false }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const mono = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: true }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const monoRepeat = h.fit.compute({
      model: makeModel({ stableDigitsEnabled: true }),
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(mono).not.toBe(proportional);
    expect(monoRepeat).toBe(mono);
    expect(
      measureCtx.calls.some((/** @type {any} */ call) => call.text === "12.4" && call.font.includes("mono-serif"))
    ).toBe(true);
    expect(
      measureCtx.calls.some((/** @type {any} */ call) => call.text === "nm" && call.font.includes("sans-serif"))
    ).toBe(true);
  });

  it("invalidates the top-level cache when familyMono changes under stableDigits", function () {
    const h = createHarness({
      font: {
        weight: 720,
        labelWeight: 610,
        family: "sans-serif",
        familyMono: "mono-a"
      }
    });
    const targetEl = document.createElement("div");
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const shellRect = { width: 320, height: 180 };
    const model = makeModel({ stableDigitsEnabled: true });

    const first = h.fit.compute({
      model: model,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    h.themeTokens.font.familyMono = "mono-b";
    const second = h.fit.compute({
      model: model,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(second).not.toBe(first);
  });

  it("avoids cache collisions when semantic text contains delimiter characters", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const shellRect = { width: 320, height: 180 };
    const modelA = makeModel({
      routeNameText: "A|B",
      remainCaption: "C"
    });
    const modelB = makeModel({
      routeNameText: "A",
      remainCaption: "B|C"
    });

    const first = h.fit.compute({
      model: modelA,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    const second = h.fit.compute({
      model: modelB,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(second).not.toBe(first);

    const secondRepeat = h.fit.compute({
      model: modelB,
      shellRect: shellRect,
      targetEl: targetEl,
      hostContext: hostContext
    });
    expect(secondRepeat).toBe(second);
  });

  it("switches to plain metric value when padded stable-digits text clips", function () {
    const h = createHarness();
    const targetEl = document.createElement("div");
    const hostContext = /** @type {any} */ ({ __dyniHtmlMeasureUtilsCtx: createMeasureContext() });
    const out = h.fit.compute({
      model: makeModel({
        stableDigitsEnabled: true,
        isApproaching: false,
        remainText: " 00012345.6",
        remainPlainText: "12345.6",
        etaText: " 0012:34",
        etaPlainText: "12:34"
      }),
      shellRect: { width: 12, height: 36 },
      targetEl: targetEl,
      hostContext: hostContext
    });

    expect(out.metricValues.remain).toBe("12345.6");
    expect(out.metricValues.rteEta).toBe("12:34");
    expect(
      hostContext.__dyniHtmlMeasureUtilsCtx.calls.some(
        (/** @type {any} */ call) => call.text === " 00012345.6" && call.font.includes("mono-serif")
      )
    ).toBe(true);
    expect(
      hostContext.__dyniHtmlMeasureUtilsCtx.calls.some(
        (/** @type {any} */ call) => call.text === "nm" && call.font.includes("sans-serif")
      )
    ).toBe(true);
  });
});
