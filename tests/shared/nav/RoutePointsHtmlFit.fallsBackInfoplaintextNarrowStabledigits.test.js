// @ts-check
const { buildModel, createHarness, expectStyleFormat } = require("./RoutePointsHtmlFit-setup");

describe("RoutePointsHtmlFit", function () {
  it("falls back to infoPlainText for narrow stableDigits course-distance rows", function () {
    const h = createHarness();
    const shellRect = { width: 40, height: 120 };
    const model = buildModel({
      stableDigitsEnabled: true,
      points: [
        {
          ordinalText: "1",
          nameText: "Start",
          infoText: "000°/000.0nm",
          infoPlainText: "0°/0.0nm"
        },
        {
          ordinalText: "2",
          nameText: "Finish",
          infoText: "00360°/00012.3nm",
          infoPlainText: "360°/12.3nm"
        }
      ]
    });

    const out = h.fit.compute({
      model: model,
      hostContext: h.hostContext,
      targetEl: h.targetEl,
      shellRect: shellRect
    });

    expect(out.rowFits[1].infoText).toBe("360°/12.3nm");
    expectStyleFormat(out.rowFits[1].infoStyle);
  });
});
