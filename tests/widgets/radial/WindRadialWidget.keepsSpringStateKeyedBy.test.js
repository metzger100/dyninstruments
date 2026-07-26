// @ts-check
const {
  createMockCanvas,
  createMockContext2D,
  createWindCachingHarness,
  makeWindProps
} = require("./WindRadialWidget-setup");

describe("WindRadialWidget", function () {
  it("keeps spring state keyed by canvas and snaps immediately when easing is disabled", function () {
    const harness = createWindCachingHarness();
    const canvasA = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    const canvasB = createMockCanvas({
      rectWidth: 480,
      rectHeight: 110,
      ctx: createMockContext2D()
    });
    const nowSpy = vi.spyOn(Date, "now");

    try {
      nowSpy.mockReturnValue(0);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 12 }))).toBeUndefined();

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 42 }))).toEqual({ wantsFollowUpFrame: true });

      nowSpy.mockReturnValue(16);
      expect(harness.spec.renderCanvas(canvasB, makeWindProps({ angle: 42 }))).toBeUndefined();

      nowSpy.mockReturnValue(32);
      expect(harness.spec.renderCanvas(canvasA, makeWindProps({ angle: 42, easing: false }))).toBeUndefined();
    } finally {
      nowSpy.mockRestore();
    }
  });
});
