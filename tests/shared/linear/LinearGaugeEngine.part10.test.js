// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("maps pointer position according to axis mode", function () {
    const harnessRange = createHarness();
    const rangeRenderer = harnessRange.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "range",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      }
    });

    const harnessCentered = createHarness();
    const centeredRenderer = harnessCentered.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "centered180",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      }
    });

    const harnessFixed = createHarness();
    const fixedRenderer = harnessFixed.engine.createRenderer({
      rawValueKey: "value",
      axisMode: "fixed360",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      }
    });

    const rangeCanvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D()
    });
    const centeredCanvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D()
    });
    const fixedCanvas = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D()
    });

    rangeRenderer(rangeCanvas, {
      value: 15,
      min: 0,
      max: 30,
      major: 10,
      minor: 5
    });
    centeredRenderer(centeredCanvas, {
      value: 180,
      min: 0,
      max: 30,
      major: 90,
      minor: 30
    });
    fixedRenderer(fixedCanvas, {
      value: 180,
      min: 0,
      max: 30,
      major: 90,
      minor: 30
    });

    const xRange = harnessRange.calls.pointer[0].x;
    const xCentered = harnessCentered.calls.pointer[0].x;
    const xFixed = harnessFixed.calls.pointer[0].x;

    expect(xRange).toBeCloseTo(xFixed, 0);
    expect(xCentered).toBeGreaterThan(xFixed);
  });
});
