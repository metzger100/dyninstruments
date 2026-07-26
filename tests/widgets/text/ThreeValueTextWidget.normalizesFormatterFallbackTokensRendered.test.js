// @ts-check
const { findTextCall, loadFresh, makeComponentContext, renderCaptured } = require("./ThreeValueTextWidget-setup");

describe("ThreeValueTextWidget", function () {
  it("normalizes formatter fallback tokens to --- for rendered values", function () {
    const helpers = makeComponentContext({
      applyFormatter() {
        return "--:--:--";
      }
    });
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const captured = renderCaptured(spec, 220, 140, {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
      default: "---"
    });

    const textValues = captured.map((entry) => entry.text);
    expect(textValues).toContain("---");
    expect(textValues).not.toContain("--:--:--");
  });

  it("renders disconnected state-screen instead of numeric content", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const captured = renderCaptured(spec, 220, 140, {
      value: 12.3,
      caption: "SPD",
      unit: "kn",
      disconnect: true,
      default: "---"
    });

    const textValues = captured.map((entry) => entry.text);
    expect(textValues).toContain("GPS Lost");
    expect(textValues).not.toContain("12.3");
  });

  it("uses padded mono value text when stableDigits is enabled", function () {
    const helpers = makeComponentContext();
    const spec = loadFresh("widgets/text/ThreeValueTextWidget/ThreeValueTextWidget.js").create({}, helpers);
    const captured = renderCaptured(spec, 220, 140, {
      value: 7.5,
      caption: "SPD",
      unit: "kn",
      stableDigits: true
    });
    const valueCall = findTextCall(captured, " 07.5");

    expect(valueCall).toBeTruthy();
    expect(String(valueCall.font)).toContain("monospace");
  });
});
