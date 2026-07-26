// @ts-check
const {
  captureTextCalls,
  createMockCanvas,
  createMockContext2D,
  fillTextCalls,
  findFirstText,
  loadFresh,
  makeComponentContext,
  makeProps
} = require("./CenterDisplayTextWidget-setup");

describe("CenterDisplayTextWidget", function () {
  it("renders normal mode with caption left and right-aligned tabular coordinates", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/CenterDisplayTextWidget/CenterDisplayTextWidget.js").create({}, helpers);
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 260, rectHeight: 180, ctx });
    const calls = captureTextCalls(ctx);

    spec.renderCanvas(canvas, makeProps({ activeMeasure: undefined }));

    const texts = fillTextCalls(ctx);
    const center = findFirstText(texts, "CENTER");
    const lat = findFirstText(texts, "LAT:54.123");
    const lon = findFirstText(texts, "LON:10.456");
    const wp = findFirstText(texts, "WP");
    const latCall = calls.find((entry) => entry.text.indexOf("LAT:") === 0);
    const lonCall = calls.find((entry) => entry.text.indexOf("LON:") === 0);

    expect(center).toBeTruthy();
    expect(lat).toBeTruthy();
    expect(lon).toBeTruthy();
    expect(wp).toBeTruthy();
    expect(center.x).toBeLessThan(lat.x);
    expect(center.x).toBeLessThan(lon.x);
    expect(latCall).toBeTruthy();
    expect(lonCall).toBeTruthy();
    expect(latCall.textAlign).toBe("right");
    expect(lonCall.textAlign).toBe("right");
    expect(lat.y).toBeLessThan(wp.y);
    expect(lon.y).toBeLessThan(wp.y);
  });
});
