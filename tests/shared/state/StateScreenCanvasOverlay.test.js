const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("StateScreenCanvasOverlay", function () {
  function createOverlay() {
    return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js").create({}, {
      getModule(id) {
        if (id === "StateScreenLabels") {
          return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  it("draws dimmed fill and canonical labels for each valid kind", function () {
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
      expect(fillRectCall).toBeTruthy();
      expect(fillRectCall.args).toEqual([0, 0, 300, 200]);
      expect(fillTextCall).toBeTruthy();
      expect(fillTextCall.args[0]).toBe(expected[kind]);
      expect(fillTextCall.args[1]).toBe(150);
      expect(fillTextCall.args[2]).toBe(100);
    });
  });

  it("throws for hidden/data in dev mode", function () {
    const overlay = createOverlay();
    const ctx = createMockContext2D();

    expect(() => overlay.drawStateScreen({ ctx: ctx, kind: "hidden", W: 10, H: 10 })).toThrow("invalid on canvas");
    expect(() => overlay.drawStateScreen({ ctx: ctx, kind: "data", W: 10, H: 10 })).toThrow("invalid on canvas");
  });
});
