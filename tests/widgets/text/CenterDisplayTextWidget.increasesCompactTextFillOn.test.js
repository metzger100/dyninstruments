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
    const captured = {};

    Object.keys(sizes).forEach((key) => {
      // @ts-ignore -- pre-existing untyped test mock boundary
      const size = sizes[key];
      const ctx = createMockContext2D();
      const fonts = captureTextFonts(ctx);
      const canvas = createMockCanvas({ rectWidth: size.width, rectHeight: size.height, ctx });
      spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));
      // @ts-ignore -- pre-existing untyped test mock boundary
      captured[key] = fonts;
    });

    const compactLayout = computeLayoutSnapshot(sizes.compact.width, sizes.compact.height, "normal", 2);
    const largeLayout = computeLayoutSnapshot(sizes.large.width, sizes.large.height, "normal", 2);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const compactLat = captured.compact.find((entry) => entry.text.indexOf("LAT:") === 0);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const largeLat = captured.large.find((entry) => entry.text.indexOf("LAT:") === 0);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const compactWpValue = captured.compact.find((entry) => entry.text.indexOf("92") === 0);
    // @ts-ignore -- pre-existing untyped test mock boundary
    const largeWpValue = captured.large.find((entry) => entry.text.indexOf("92") === 0);

    expect(compactLat).toBeTruthy();
    expect(largeLat).toBeTruthy();
    expect(compactWpValue).toBeTruthy();
    expect(largeWpValue).toBeTruthy();
    expect(parseFontPx(compactLat.font) / compactLayout.center.latRect.h).toBeGreaterThan(
      parseFontPx(largeLat.font) / largeLayout.center.latRect.h
    );
    expect(parseFontPx(compactWpValue.font) / compactLayout.rowRects[0].h).toBeGreaterThan(
      parseFontPx(largeWpValue.font) / largeLayout.rowRects[0].h
    );
  });
});
