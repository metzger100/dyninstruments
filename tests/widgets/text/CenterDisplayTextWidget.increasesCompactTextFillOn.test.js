// @ts-check
const {
  captureTextFonts,
  computeLayoutSnapshot,
  createMockCanvas,
  createMockContext2D,
  loadFresh,
  makeComponentContext,
  makeProps,
  parseFontPx
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("increases compact text fill on smaller normal widgets without changing the layout mode", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const sizes = {
      compact: { width: 161, height: 80 },
      large: { width: 512, height: 265 }
    };
    /** @typedef {keyof typeof sizes} SizeKey */
    /** @type {{ [K in SizeKey]?: Array<{ font: string, text: string }> }} */
    const captured = {};

    /** @type {SizeKey[]} */ (Object.keys(sizes)).forEach((key) => {
      const size = sizes[key];
      const ctx = createMockContext2D();
      const fonts = captureTextFonts(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });
      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));
      captured[key] = fonts;
    });

    if (!captured.compact || !captured.large) {
      throw new Error("expected fonts to be captured for both compact and large sizes");
    }

    const compactLayout = computeLayoutSnapshot(sizes.compact.width, sizes.compact.height, "normal", 2);
    const largeLayout = computeLayoutSnapshot(sizes.large.width, sizes.large.height, "normal", 2);
    const compactLat = captured.compact.find((entry) => entry.text.indexOf("LAT:") === 0);
    const largeLat = captured.large.find((entry) => entry.text.indexOf("LAT:") === 0);
    const compactWpValue = captured.compact.find((entry) => entry.text.indexOf("92") === 0);
    const largeWpValue = captured.large.find((entry) => entry.text.indexOf("92") === 0);

    expect(compactLat).toBeTruthy();
    expect(largeLat).toBeTruthy();
    expect(compactWpValue).toBeTruthy();
    expect(largeWpValue).toBeTruthy();
    if (!compactLat || !largeLat || !compactWpValue || !largeWpValue) {
      throw new Error("expected LAT and waypoint value text entries to be found");
    }
    expect(parseFontPx(compactLat.font) / compactLayout.center.latRect.h).toBeGreaterThan(
      parseFontPx(largeLat.font) / largeLayout.center.latRect.h
    );
    expect(parseFontPx(compactWpValue.font) / compactLayout.rowRects[0].h).toBeGreaterThan(
      parseFontPx(largeWpValue.font) / largeLayout.rowRects[0].h
    );
  });
});
