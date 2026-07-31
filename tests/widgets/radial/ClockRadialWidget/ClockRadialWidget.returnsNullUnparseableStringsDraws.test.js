// @ts-check
const { createMockCanvas, createMockContext2D, createWidget } = require("./ClockRadialWidget-setup");

describe("ClockRadialWidget", function () {
  it("returns null for unparseable strings and draws no hands", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, {
      value: "not-a-time",
      hideSeconds: false
    });
    var strokes = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokes.length).toBe(0);
  });

  it("returns null for NaN and draws no hands", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: NaN, hideSeconds: false });
    var strokes = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokes.length).toBe(0);
  });

  it("parses Date objects correctly", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    var d = new Date("2026-05-25T15:30:00Z");
    result.spec.renderCanvas(canvas, { value: d, hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("parses numeric timestamps correctly", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    var ts = new Date("2026-05-25T12:00:00Z").getTime();
    result.spec.renderCanvas(canvas, { value: ts, hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("skips second hand when hideSeconds is true", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: true });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(2);
  });

  it("draws second hand when hideSeconds is false", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var lineTos = ctx.calls.filter(function (c) {
      return c.name === "lineTo";
    });
    expect(lineTos.length).toBe(3);
  });

  it("uses pointer color for second hand", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var strokeCalls = ctx.calls.filter(function (c) {
      return c.name === "stroke";
    });
    expect(strokeCalls.length).toBe(3);
  });

  it("draws center cap circle after hands", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    var arcCalls = ctx.calls.filter(function (c) {
      return c.name === "arc";
    });
    expect(arcCalls.length).toBeGreaterThan(0);
  });

  it("draws hour hand with lineCap round", function () {
    var ctx = /** @type {DyniTestCanvasContext} */ (createMockContext2D());
    var result = createWidget({ overrides: { cx: 100, cy: 100, rOuter: 80 } });
    var canvas = createMockCanvas({
      rectWidth: 240,
      rectHeight: 240,
      ctx: ctx
    });
    result.spec.renderCanvas(canvas, { value: "12:00:00", hideSeconds: false });
    expect(ctx.lineCap).toBe("round");
  });
});
