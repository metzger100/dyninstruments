// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  findFirstText,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("exposes the center-display renderer contract", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);

    expect(spec.id).toBe("CenterDisplayTextWidget");
    expect(spec.wantsHideNativeHead).toBe(true);
  });

  it("renders high mode with stacked coordinates and ordered relation rows", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 140, rectHeight: 260, ctx });

    spec.renderCanvas(canvas, makeProps());

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const lon = findFirstText(texts, "LON:10.456");
    const meas = findFirstText(texts, "MEAS");
    const wp = findFirstText(texts, "WP");
    const boat = findFirstText(texts, "POS");

    expect(center).toBeTruthy();
    expect(lat).toBeTruthy();
    expect(lon).toBeTruthy();
    expect(meas).toBeTruthy();
    expect(wp).toBeTruthy();
    expect(boat).toBeTruthy();
    if (!center || !lat || !lon || !meas || !wp || !boat) {
      throw new Error("Expected every relation-row text to be captured.");
    }
    expect(center.y).toBeLessThan(lat.y);
    expect(lat.y).toBeLessThan(lon.y);
    expect(lon.y).toBeLessThan(meas.y);
    expect(meas.y).toBeLessThan(wp.y);
    expect(wp.y).toBeLessThan(boat.y);
  });
});
