// @ts-check
const {
  createAisLayout,
  createHarness,
  createMeasureContext,
  makeModel,
  parseStyleText,
  readPx
} = require("./AlarmHtmlFit-setup");

describe("AlarmHtmlFit", function () {
  it("keeps AIS chrome parity at 120x100 where Alarm and AIS mode thresholds diverge", function () {
    const h = createHarness();
    const aisLayout = createAisLayout();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false,
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0
    });
    const shell = { width: 120, height: 100 };
    const alarmFit = h.fit.compute({
      model: model,
      targetEl: h.targetEl,
      hostContext: {
        __dyniAlarmMeasureCtx: createMeasureContext()
      },
      shellRect: shell
    });
    const alarmLayout = h.fit.resolveLayout({
      model: model,
      shellRect: shell
    });
    const ais = aisLayout.computeLayout({
      W: shell.width,
      H: shell.height,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true
    });

    expect(ais.mode).toBe("high");
    expect(alarmLayout.mode).toBe("normal");

    const alarmAccent = parseStyleText(alarmFit.accentStyle);
    const alarmShell = parseStyleText(alarmFit.shellStyle);
    const shellPadding = String(alarmShell.padding || "").split(/\s+/);
    const alarmTopPad = shellPadding.length === 4 ? readPx({ value: shellPadding[0] }, "value") : NaN;
    const alarmRightPad = shellPadding.length === 4 ? readPx({ value: shellPadding[1] }, "value") : NaN;
    const alarmBottomPad = shellPadding.length === 4 ? readPx({ value: shellPadding[2] }, "value") : NaN;
    const alarmLeftPad = shellPadding.length === 4 ? readPx({ value: shellPadding[3] }, "value") : NaN;
    const aisBottom = ais.effectiveLayoutHeight - ais.accentRect.y - ais.accentRect.h;
    const aisContentRight = ais.shellWidth - ais.contentRect.x - ais.contentRect.w;
    const aisContentBottom = ais.effectiveLayoutHeight - ais.contentRect.y - ais.contentRect.h;

    expect(readPx(alarmAccent, "left")).toBe(ais.accentRect.x);
    expect(readPx(alarmAccent, "top")).toBe(ais.accentRect.y);
    expect(readPx(alarmAccent, "bottom")).toBe(aisBottom);
    expect(readPx(alarmAccent, "width")).toBe(ais.accentRect.w);
    expect(readPx(alarmAccent, "border-radius")).toBe(ais.accentRect.w);
    expect(alarmLeftPad).toBe(ais.contentRect.x);
    expect(alarmRightPad).toBe(aisContentRight);
    expect(alarmTopPad).toBe(ais.contentRect.y);
    expect(alarmBottomPad).toBe(aisContentBottom);
  });
});
