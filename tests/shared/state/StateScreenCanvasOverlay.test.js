const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("StateScreenCanvasOverlay", function () {
  function createOverlay() {
    return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js").create({}, createComponentContextMock({
      modules: {
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js")
      }
    }));
  }

  function readFontPx(ctx) {
    const match = /(\d+)px/.exec(String(ctx.font || ""));
    return match ? Number(match[1]) : 0;
  }

  it("draws canonical labels for each valid kind without a dim overlay fill", function () {
    const overlay = createOverlay();
    const expected = {
      disconnected: "GPS Lost",
      noRoute: "No Route",
      noTarget: "No Waypoint",
      noAis: "No AIS"
    };

    Object.keys(expected).forEach((kind) => {
      const ctx = createMockContext2D();
      overlay.drawStateScreen({
        ctx: ctx,
        kind: kind,
        W: 300,
        H: 200,
        family: "Roboto",
        color: "#f0f0f0",
        labelWeight: 650
      });

      const fillRectCall = ctx.calls.find((entry) => entry.name === "fillRect");
      const fillTextCall = ctx.calls.find((entry) => entry.name === "fillText");
      expect(fillRectCall).toBeUndefined();
      expect(fillTextCall).toBeTruthy();
      expect(fillTextCall.args[0]).toBe(expected[kind]);
      expect(fillTextCall.args[1]).toBe(150);
      expect(fillTextCall.args[2]).toBe(100);
    });
  });

  it("reduces font size on a narrow canvas versus a same-area square canvas", function () {
    const overlay = createOverlay();
    const narrowCtx = createMockContext2D({
      charWidth: 1
    });
    const squareCtx = createMockContext2D({
      charWidth: 1
    });

    narrowCtx.measureText = function (text) {
      this.calls.push({ name: "measureText", args: [text] });
      const px = readFontPx(this);
      return { width: String(text || "").length * px * 0.6 };
    };
    squareCtx.measureText = function (text) {
      this.calls.push({ name: "measureText", args: [text] });
      const px = readFontPx(this);
      return { width: String(text || "").length * px * 0.6 };
    };

    overlay.drawStateScreen({
      ctx: narrowCtx,
      kind: "noTarget",
      W: 100,
      H: 400,
      family: "Roboto",
      color: "#f0f0f0",
      labelWeight: 650
    });
    overlay.drawStateScreen({
      ctx: squareCtx,
      kind: "noTarget",
      W: 200,
      H: 200,
      family: "Roboto",
      color: "#f0f0f0",
      labelWeight: 650
    });

    expect(readFontPx(narrowCtx)).toBeLessThan(readFontPx(squareCtx));
  });

  it("throws for hidden/data in dev mode", function () {
    const overlay = createOverlay();
    const ctx = createMockContext2D();

    expect(() => overlay.drawStateScreen({ ctx: ctx, kind: "hidden", W: 10, H: 10 })).toThrow("invalid on canvas");
    expect(() => overlay.drawStateScreen({ ctx: ctx, kind: "data", W: 10, H: 10 })).toThrow("invalid on canvas");
  });
});
