// @ts-check
const { createHarness, makeModel, parseStyleText, readPx } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("invalidates cache when shell width changes strip chrome while content width stays the same", function () {
    const h = createHarness();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const firstRect = { width: 118, height: 100 };
    const secondRect = { width: 119, height: 100 };
    const first = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: firstRect
    });
    const second = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: secondRect
    });
    const firstLayout = h.fit.resolveLayout({
      model: model,
      shellRect: firstRect
    });
    const secondLayout = h.fit.resolveLayout({
      model: model,
      shellRect: secondRect
    });

    expect(firstLayout.contentRect.width).toBe(secondLayout.contentRect.width);

    const firstAccent = parseStyleText(first.accentStyle);
    const secondAccent = parseStyleText(second.accentStyle);
    const firstShell = parseStyleText(first.shellStyle);
    const secondShell = parseStyleText(second.shellStyle);
    const firstPadding = String(firstShell.padding || "").split(/\s+/);
    const secondPadding = String(secondShell.padding || "").split(/\s+/);
    const firstLeft = firstPadding.length === 4 ? readPx({ value: firstPadding[3] }, "value") : NaN;
    const firstRight = firstPadding.length === 4 ? readPx({ value: firstPadding[1] }, "value") : NaN;
    const secondLeft = secondPadding.length === 4 ? readPx({ value: secondPadding[3] }, "value") : NaN;
    const secondRight = secondPadding.length === 4 ? readPx({ value: secondPadding[1] }, "value") : NaN;
    const firstStripWidth = readPx(firstAccent, "width");
    const secondStripWidth = readPx(secondAccent, "width");
    const firstStripGap = firstLeft - firstRight - firstStripWidth;
    const secondStripGap = secondLeft - secondRight - secondStripWidth;

    expect(secondStripWidth).not.toBe(firstStripWidth);
    expect(secondStripWidth).toBe(secondLayout.contentRect.chrome.stripWidth);
    expect(secondLeft).toBe(secondLayout.contentRect.chrome.left);
    expect(secondRight).toBe(secondLayout.contentRect.chrome.right);
    expect(firstStripGap).toBe(firstLayout.contentRect.chrome.stripGap);
    expect(secondStripGap).toBe(secondLayout.contentRect.chrome.stripGap);
  });
});
