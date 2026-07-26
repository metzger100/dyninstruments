// @ts-check
const { computePadX, createHarness, makeModel, parseStyleText, readPx } = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("shares one chrome contract between layout mode resolution and fit sizing", function () {
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

    expect(layout).toBeTruthy();
    expect(layout.mode).toBe("normal");
    expect(layout.shellRect).toEqual({ width: 220, height: 100 });
    expect(layout.contentRect.width).toBeGreaterThan(0);
    expect(layout.contentRect.height).toBeGreaterThan(0);
    expect(layout.contentRect.chrome.left).toBeGreaterThan(layout.contentRect.chrome.right);

    const fit = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: h.hostContext,
      shellRect: shellRect
    });

    const accentStyle = parseStyleText(fit.accentStyle);
    const shellStyle = parseStyleText(fit.shellStyle);
    const stripWidth = readPx(accentStyle, "width");
    const stripRadius = readPx(accentStyle, "border-radius");
    const stripPadding = readPx(accentStyle, "left");
    const shellPadding = String(shellStyle.padding || "").split(/\s+/);
    const shellLeft = shellPadding.length === 4 ? readPx({ value: shellPadding[3] }, "value") : NaN;
    const shellRight = shellPadding.length === 4 ? readPx({ value: shellPadding[1] }, "value") : NaN;
    const stripGap = shellLeft - shellRight - stripWidth;

    expect(stripWidth).toBeGreaterThan(0);
    expect(stripRadius).toBe(stripWidth);
    expect(stripPadding).toBe(shellRight);
    expect(stripGap).toBeGreaterThanOrEqual(1);
    expect(layout.contentRect.chrome.left).toBe(shellLeft);
    expect(layout.contentRect.chrome.right).toBe(shellRight);

    const fitArgs = h.textLayoutApi.fitValueUnitCaptionRows.mock.calls[0][0];
    const padX = computePadX(layout.contentRect.width, layout.contentRect.height);
    expect(fitArgs.W).toBe(layout.contentRect.width - padX * 2);
    expect(fitArgs.H).toBe(layout.contentRect.height);
  });
});
