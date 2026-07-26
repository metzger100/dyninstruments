// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("takes the shortest wrapped arc across the 0/360 seam when springWrap is 360", function () {
    const harness = createHarness();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      // @ts-ignore -- pre-existing untyped test mock boundary
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
        // @ts-ignore -- pre-existing untyped test mock boundary
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

      // @ts-ignore -- pre-existing untyped test mock boundary
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
        // @ts-ignore -- pre-existing untyped test mock boundary
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

      // @ts-ignore -- pre-existing untyped test mock boundary
      expect(headingsForward[0]).toBe(350);
      // @ts-ignore -- pre-existing untyped test mock boundary
      expect(headingsForward[1]).toBeGreaterThan(350);
      // @ts-ignore -- pre-existing untyped test mock boundary
      expect(headingsBackward[0]).toBe(10);
      // @ts-ignore -- pre-existing untyped test mock boundary
      expect(headingsBackward[1]).toBeLessThan(10);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
