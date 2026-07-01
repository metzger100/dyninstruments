const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("CompassLinearWidget", function () {
  it("does not render a marker when markerCourse is null", function () {
    let captured;
    const markerMotion = {
      resolve: vi.fn(),
      isActive: vi.fn(() => false),
    };

    loadFresh(
      "widgets/linear/CompassLinearWidget/CompassLinearWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          ValueMath: {
            create() {
              return {
                isFiniteNumber(value) {
                  return typeof value === "number" && Number.isFinite(value);
                },
                toFiniteNumber(value) {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                toOptionalFiniteNumber(value) {
                  if (value == null) return undefined;
                  if (typeof value === "string" && value.trim() === "")
                    return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatDirection360(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  const out = String(norm);
                  return leadingZero ? out.padStart(3, "0") : out;
                },
              };
            },
          },
          SpringEasing: {
            create() {
              return {
                createMotion() {
                  return markerMotion;
                },
              };
            },
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                },
              };
            },
          },
        },
      }),
    );

    const api = {
      drawDefaultPointer: vi.fn(),
      drawMarkerAtValue: vi.fn(),
    };
    const state = {
      canvas: {},
      nowMs: 48,
      theme: {
        colors: { pointer: "#3366cc" },
      },
    };

    const result = captured.drawFrame(
      state,
      { markerCourse: null },
      { num: 350, easedNum: 350 },
      api,
    );
    expect(markerMotion.resolve).not.toHaveBeenCalled();
    expect(markerMotion.isActive).not.toHaveBeenCalled();
    expect(api.drawMarkerAtValue).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("returns fallback text for invalid heading values", function () {
    let captured;
    loadFresh(
      "widgets/linear/CompassLinearWidget/CompassLinearWidget.js",
    ).create(
      {},
      createComponentContextMock({
        modules: {
          ValueMath: {
            create() {
              return {
                isFiniteNumber(value) {
                  return typeof value === "number" && Number.isFinite(value);
                },
                toFiniteNumber(value) {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                toOptionalFiniteNumber(value) {
                  if (value == null) return undefined;
                  if (typeof value === "string" && value.trim() === "")
                    return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatDirection360() {
                  return "---";
                },
              };
            },
          },
          SpringEasing: {
            create() {
              return {
                createMotion() {
                  return {
                    resolve(canvas, target) {
                      void canvas;
                      return target;
                    },
                    isActive() {
                      return false;
                    },
                  };
                },
              };
            },
          },
          LinearGaugeEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                },
              };
            },
          },
        },
      }),
    );

    expect(captured.formatDisplay(undefined, { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A",
    });
    expect(captured.formatDisplay("", { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A",
    });
    expect(captured.formatDisplay("   ", { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A",
    });
    expect(
      captured.resolveAxis({ heading: undefined }, {}, { min: 0, max: 360 }),
    ).toEqual({ min: 0, max: 360 });
    expect(
      captured.resolveAxis({ heading: null }, {}, { min: 0, max: 360 }),
    ).toEqual({ min: 0, max: 360 });
    expect(
      captured.resolveAxis({ heading: "" }, {}, { min: 0, max: 360 }),
    ).toEqual({ min: 0, max: 360 });
    expect(
      captured.resolveAxis({ heading: "   " }, {}, { min: 0, max: 360 }),
    ).toEqual({ min: 0, max: 360 });
  });
});
