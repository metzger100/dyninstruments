// @ts-check
const { createHarness, makeModel, parseStyleText, readPx } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("caches identical results on hostContext", function () {
    const h = createHarness();
    const model = makeModel();
    const shellRect = { width: 240, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    expect(second).toBe(first);
    const hostContextWithCache =
      /** @type {{ __dyniAlarmHtmlFitCache?: { result: unknown } }} */
      (h.hostContext);
    if (!hostContextWithCache.__dyniAlarmHtmlFitCache) {
      throw new Error("expected hostContext to carry a cached fit result");
    }
    expect(hostContextWithCache.__dyniAlarmHtmlFitCache.result).toBe(first);
  });

  it("derives idle strip chrome from shell width so accent and content reservation stay aligned", function () {
    const h = createHarness();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const narrowRect = { width: 180, height: 100 };
    const wideRect = { width: 320, height: 100 };
    const narrow = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: narrowRect
    });
    const wide = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: wideRect
    });
    const narrowLayout = h.fit.resolveLayout({
      model: model,
      shellRect: narrowRect
    });
    const wideLayout = h.fit.resolveLayout({
      model: model,
      shellRect: wideRect
    });

    const narrowAccent = parseStyleText(narrow.accentStyle);
    const wideAccent = parseStyleText(wide.accentStyle);
    const narrowShell = parseStyleText(narrow.shellStyle);
    const wideShell = parseStyleText(wide.shellStyle);
    const narrowShellPadding = String(narrowShell.padding || "").split(/\s+/);
    const wideShellPadding = String(wideShell.padding || "").split(/\s+/);
    const narrowLeft = readPx({ value: narrowShellPadding[3] }, "value");
    const narrowRight = readPx({ value: narrowShellPadding[1] }, "value");
    const wideLeft = readPx({ value: wideShellPadding[3] }, "value");
    const wideRight = readPx({ value: wideShellPadding[1] }, "value");
    const narrowWidth = readPx(narrowAccent, "width");
    const wideWidth = readPx(wideAccent, "width");

    expect(wideWidth).toBeGreaterThan(narrowWidth);
    expect(wideLeft).toBeGreaterThan(narrowLeft);
    expect(narrowLeft - narrowRight).toBeGreaterThan(narrowWidth);
    expect(wideLeft - wideRight).toBeGreaterThan(wideWidth);
    expect(narrowLayout.contentRect.chrome.left).toBe(narrowLeft);
    expect(wideLayout.contentRect.chrome.left).toBe(wideLeft);
    expect(wideLayout.contentRect.width).toBeLessThan(wideRect.width - wideRight * 2);
  });
});
