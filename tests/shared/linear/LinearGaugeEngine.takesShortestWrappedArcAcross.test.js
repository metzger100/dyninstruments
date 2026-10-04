// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("takes the shortest wrapped arc across the 0/360 seam when springWrap is 360", function () {
    const harness = createHarness();
    const nowSpy = vi.spyOn(Date, "now");

    try {
      const headingsForward = /** @type {number[]} */ ([]);
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
        /** @param {{ heading?: unknown }} props */
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

      const headingsBackward = /** @type {number[]} */ ([]);
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
        /** @param {{ heading?: unknown }} props */
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

  it("eases a centered180 angle from 179 to -179 the short way and keeps the pointer on the axis", function () {
    const harness = createHarness();
    const nowSpy = vi.spyOn(Date, "now");
    const pointerValues = /** @type {number[]} */ ([]);

    try {
      const renderer = harness.engine.createRenderer({
        rawValueKey: "angle",
        axisMode: "centered180",
        springWrap: 360,
        rangeDefaults: { min: -180, max: 180 },
        rangeProps: { min: "min", max: "max" },
        tickProps: { major: "major", minor: "minor", showEndLabels: "showEndLabels" },
        /** @param {unknown} state @param {unknown} props @param {{ easedNum: number }} display @param {{ drawDefaultPointer: () => void }} api */
        drawFrame(state, props, display, api) {
          pointerValues.push(display.easedNum);
          api.drawDefaultPointer();
        }
      });
      const canvas = createMockCanvas({ rectWidth: 480, rectHeight: 120, ctx: createMockContext2D() });
      const frameProps = { min: -180, max: 180, major: 30, minor: 10 };

      nowSpy.mockReturnValue(0);
      renderer(canvas, Object.assign({ angle: 179 }, frameProps));
      for (let frame = 1; frame <= 60; frame += 1) {
        nowSpy.mockReturnValue(frame * 16);
        renderer(canvas, Object.assign({ angle: -179 }, frameProps));
      }
    } finally {
      nowSpy.mockRestore();
    }

    expect(pointerValues[0]).toBe(179);
    expect(pointerValues[pointerValues.length - 1]).toBeCloseTo(-179, 1);
    pointerValues.forEach(function (pointerValue) {
      expect(Math.abs(pointerValue)).toBeGreaterThanOrEqual(170);
      expect(pointerValue).toBeGreaterThanOrEqual(-180);
      expect(pointerValue).toBeLessThan(180);
    });
  });
});
