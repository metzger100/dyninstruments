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
  it("matches AIS visual chrome geometry for representative shell sizes", function () {
    const h = createHarness();
    const aisLayout = createAisLayout();
    const model = makeModel({
      state: "idle",
      interactionState: "passive",
      showStrip: true,
      showActiveBackground: false
    });
    const sizes = [
      { width: 180, height: 100 },
      { width: 220, height: 100 },
      { width: 320, height: 100 },
      { width: 220, height: 300 }
    ];

    sizes.forEach((size) => {
      const alarmFit = h.fit.compute({
        model: model,
        targetEl: h.targetEl,
        hostContext: {
          __dyniAlarmMeasureCtx: createMeasureContext()
        },
        shellRect: size
      });
      const alarmLayout = h.fit.resolveLayout({
        model: model,
        shellRect: size
      });
      const ais = aisLayout.computeLayout({
        W: size.width,
        H: size.height,
        renderState: "data",
        showTcpaBranch: true,
        hasAccent: true
      });

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
      expect(alarmLayout.contentRect.chrome.left).toBe(alarmLeftPad);
      expect(alarmLayout.contentRect.chrome.right).toBe(alarmRightPad);
      expect(alarmLayout.contentRect.chrome.top).toBe(alarmTopPad);
      expect(alarmLayout.contentRect.chrome.bottom).toBe(alarmBottomPad);
    });
  });
});
