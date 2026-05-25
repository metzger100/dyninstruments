const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      rawValueKey: "speed",
      rangeDefaults: { min: 0, max: 30 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels",
      },
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 1.1, flat: 3.5 },
    });
    const canvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D(),
    });
    const canvasB = createMockCanvas({
      rectWidth: 480,
      rectHeight: 120,
      ctx: createMockContext2D(),
    });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(
        renderer(canvasA, {
          speed: 0,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          showEndLabels: false,
        }),
      ).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(
        renderer(canvasA, {
          speed: 20,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          showEndLabels: false,
        }),
      ).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(
        renderer(canvasB, {
          speed: 20,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          showEndLabels: false,
        }),
      ).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(
        renderer(canvasA, {
          speed: 20,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          showEndLabels: false,
          easing: false,
        }),
      ).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });

});
