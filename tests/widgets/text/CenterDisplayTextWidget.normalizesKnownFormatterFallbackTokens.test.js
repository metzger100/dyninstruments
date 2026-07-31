// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("normalizes known formatter fallback tokens for coordinates and relation rows", function () {
    const helpers = makeComponentContext({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatLonLatsDecimal") {
          return cfg.formatterParameters && cfg.formatterParameters[0] === "lat" ? "-----" : "--:--";
        }
        if (cfg.formatter === "formatDirection") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        return cfg.default;
      }
    });
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(
      canvas,
      makeProps({
        activeMeasure: undefined,
        default: "---"
      })
    );

    const texts = fillTextCalls(ctx).map((entry) => entry.text);
    expect(texts.filter((entry) => entry === "---").length).toBeGreaterThanOrEqual(2);
    expect(texts.filter((entry) => entry === "--- / ---").length).toBe(2);
    expect(texts).not.toContain("-----");
    expect(texts).not.toContain("--:--");
  });
});
