// @ts-nocheck
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("takes the shortest wrapped arc across the 0/360 seam when springWrap is 360", function () {
    const harness = createHarness();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      const headingsForward = [];
      const forwardRenderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: "axis",
        springWrap: 360,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels"
        },
        resolveAxis(props) {
          headingsForward.push(Number(props.heading));
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        }
      });
      const forwardCanvas = createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D()
      });
      nowSpy.mockReturnValue(0);
      forwardRenderer(forwardCanvas, {
        heading: 350,
        min: 0,
        max: 360,
        major: 90,
        minor: 30
      });
      nowSpy.mockReturnValue(16);
      forwardRenderer(forwardCanvas, {
        heading: 10,
        min: 0,
        max: 360,
        major: 90,
        minor: 30
      });

      const headingsBackward = [];
      const backwardRenderer = harness.engine.createRenderer({
        rawValueKey: "heading",
        axisMode: "fixed360",
        springTarget: "axis",
        springWrap: 360,
        rangeDefaults: { min: 0, max: 360 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels"
        },
        resolveAxis(props) {
          headingsBackward.push(Number(props.heading));
          return {
            min: Number(props.heading) - 1,
            max: Number(props.heading) + 1
          };
        }
      });
      const backwardCanvas = createMockCanvas({
        rectWidth: 480,
        rectHeight: 120,
        ctx: createMockContext2D()
      });
      nowSpy.mockReturnValue(0);
      backwardRenderer(backwardCanvas, {
        heading: 10,
        min: 0,
        max: 360,
        major: 90,
        minor: 30
      });
      nowSpy.mockReturnValue(16);
      backwardRenderer(backwardCanvas, {
        heading: 350,
        min: 0,
        max: 360,
        major: 90,
        minor: 30
      });

      expect(headingsForward[0]).toBe(350);
      expect(headingsForward[1]).toBeGreaterThan(350);
      expect(headingsBackward[0]).toBe(10);
      expect(headingsBackward[1]).toBeLessThan(10);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
