// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("keeps default pointer width independent from linear pointer depthFactor", function () {
    const shortHarness = createHarness({
      theme: {
        colors: { pointer: "#3366cc", warning: "#e0a92e", alarm: "#d9534a" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
          ticks: {
            majorLenFactor: 0.109,
            majorWidthFactor: 0.027,
            minorLenFactor: 0.064,
            minorWidthFactor: 0.014
          },
          pointer: { sideFactor: 0.12, depthFactor: 0.11 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const longHarness = createHarness({
      theme: {
        colors: { pointer: "#3366cc", warning: "#e0a92e", alarm: "#d9534a" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 }
        },
        linear: {
          track: { widthFactor: 0.2, lineWidthFactor: 0.018 },
          ticks: {
            majorLenFactor: 0.109,
            majorWidthFactor: 0.027,
            minorLenFactor: 0.064,
            minorWidthFactor: 0.014
          },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 }
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 }
      }
    });
    const spec = {
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      }
    };
    const props = { value: 40, min: 0, max: 100, major: 20, minor: 10 };

    shortHarness.engine.createRenderer(spec)(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D()
      }),
      props
    );
    longHarness.engine.createRenderer(spec)(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D()
      }),
      props
    );

    expect(shortHarness.calls.pointer[0].opts.depth).not.toBe(longHarness.calls.pointer[0].opts.depth);
    expect(shortHarness.calls.pointer[0].opts.side).toBe(longHarness.calls.pointer[0].opts.side);
  });
});
