const { loadFresh } = require("../../helpers/load-umd");
const { createMockContext2D } = require("../../helpers/mock-canvas");

describe("GaugeCanvasPrimitives", function () {
  function create() {
    const mod = loadFresh("shared/widget-kits/gauge/GaugeCanvasPrimitives.js");
    return mod.create({}, {
      getModule(id) {
        if (id !== "GaugeAngleMath") throw new Error("unexpected module: " + id);
        return loadFresh("shared/widget-kits/gauge/GaugeAngleMath.js");
      }
    });
  }

  it("uses pointer color from required theme token", function () {
    const draw = create();
    const ctx = createMockContext2D();

    draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
      theme: {
        colors: {
          pointer: "#123456"
        }
      }
    });
    expect(ctx.fillStyle).toBe("#123456");
  });

  it("throws when required theme pointer token is missing", function () {
    const draw = create();
    const ctx = createMockContext2D();

    expect(function () {
      draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {});
    }).toThrow(/missing required opts\.theme\.colors\.pointer/);
  });

  it("rejects deprecated explicit pointer color overrides", function () {
    const draw = create();
    const ctx = createMockContext2D();

    expect(function () {
      draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
        color: "#abcdef",
        theme: {
          colors: {
            pointer: "#123456"
          }
        }
      });
    }).toThrow(/overrides are no longer supported/);

    expect(function () {
      draw.drawPointerAtRim(ctx, 100, 100, 50, 0, {
        fillStyle: "#abcdef",
        theme: {
          colors: {
            pointer: "#123456"
          }
        }
      });
    }).toThrow(/overrides are no longer supported/);
  });
});
