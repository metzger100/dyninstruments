// @ts-check
const {
  captureTextCalls,
  computeLayoutSnapshot,
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  findFirstText,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("centers relation rows while keeping the WP and POS captions attached to their values", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const cases = [
      { width: 140, height: 260, mode: "high" },
      { width: 260, height: 180, mode: "normal" },
      { width: 520, height: 100, mode: "flat" }
    ];

    cases.forEach((size) => {
      const ctx = createMockContext2D();
      const calls = captureTextCalls(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });

      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

      const texts = fillTextCalls(ctx);
      const wp = findFirstText(texts, "WP");
      const pos = findFirstText(texts, "POS");
      const latCall = calls.find((entry) => entry.text.indexOf("LAT:") === 0);
      const lonCall = calls.find((entry) => entry.text.indexOf("LON:") === 0);
      const layout = computeLayoutSnapshot(size.width, size.height, size.mode, 2);

      expect(wp).toBeTruthy();
      expect(pos).toBeTruthy();
      expect(latCall).toBeTruthy();
      expect(lonCall).toBeTruthy();
      if (!wp || !pos || !latCall || !lonCall) {
        throw new Error("Expected every relation-row text to be captured.");
      }
      expect(latCall.textAlign).toBe("right");
      expect(lonCall.textAlign).toBe("right");
      expect(wp.x).toBeGreaterThan(layout.rowRects[0].x);
      expect(wp.x).toBeLessThan(layout.rowRects[0].x + layout.rowRects[0].w / 2);
      expect(pos.x).toBeGreaterThan(layout.rowRects[1].x);
      expect(pos.x).toBeLessThan(layout.rowRects[1].x + layout.rowRects[1].w / 2);
    });
  });

  it("omits the measure row when no active measure is available", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const texts = fillTextCalls(ctx);
    expect(findFirstText(texts, "MEAS")).toBeUndefined();
    expect(findFirstText(texts, "WP")).toBeTruthy();
    expect(findFirstText(texts, "POS")).toBeTruthy();
  });
});
