// @ts-check
const { createComponentContextMock, loadFresh } = require("./CompassLinearWidget-setup");

describe("CompassLinearWidget", function () {
  it("does not render a marker when markerCourse is null", function () {
    /** @typedef {{ drawDefaultPointer: () => void, drawMarkerAtValue: (value: number, options: { strokeStyle: string }) => void }} FrameApi */
    /** @typedef {{ canvas: Record<string, unknown>, nowMs: number, theme: { colors: { pointer: string } } }} DrawState */
    /** @typedef {{ drawFrame: (state: DrawState, props: { markerCourse: unknown }, display: { num: number, easedNum: number }, api: FrameApi) => { wantsFollowUpFrame: boolean } | undefined }} DrawConfig */
    /** @type {DrawConfig | undefined} */
    let captured;
    const markerMotion = {
      resolve: vi.fn(),
      isActive: vi.fn(() => false)
    };

    loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          ValueMath: {
            create() {
              return {
                /** @param {unknown} value @returns {boolean} */
                isFiniteNumber(value) {
                  return typeof value === "number" && Number.isFinite(value);
                },
                /** @param {unknown} value @returns {number | undefined} */
                toFiniteNumber(value) {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value @returns {number | undefined} */
                toOptionalFiniteNumber(value) {
                  if (value === null || value === undefined) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value @param {boolean} leadingZero @returns {string} */
                formatDirection360(value, leadingZero) {
                  const n = Number(value);
                  if (!isFinite(n)) return "---";
                  const norm = ((Math.round(n) % 360) + 360) % 360;
                  const out = String(norm);
                  return leadingZero ? out.padStart(3, "0") : out;
                }
              };
            }
          },
          SpringEasing: {
            create() {
              return {
                createMotion() {
                  return markerMotion;
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                /** @param {DrawConfig} cfg */
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                }
              };
            }
          }
        }
      })
    );

    const api = {
      drawDefaultPointer: vi.fn(),
      drawMarkerAtValue: vi.fn()
    };
    const state = {
      canvas: {},
      nowMs: 48,
      theme: {
        colors: { pointer: "#3366cc" }
      }
    };

    if (!captured) {
      throw new Error("Expected the compass-linear draw-frame configuration.");
    }
    const result = captured.drawFrame(state, { markerCourse: null }, { num: 350, easedNum: 350 }, api);
    expect(markerMotion.resolve).not.toHaveBeenCalled();
    expect(markerMotion.isActive).not.toHaveBeenCalled();
    expect(api.drawMarkerAtValue).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("returns fallback text for invalid heading values", function () {
    /** @typedef {{ min: number, max: number }} AxisRange */
    /** @typedef {{ formatDisplay: (value: unknown, props: { default?: unknown }) => { num: number, text: unknown }, resolveAxis: (props: { heading?: unknown }, range: unknown, defaultAxis: AxisRange) => AxisRange }} CompassConfig */
    /** @type {CompassConfig | undefined} */
    let captured;
    loadFresh("widgets/linear/CompassLinearWidget/CompassLinearWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          ValueMath: {
            create() {
              return {
                /** @param {unknown} value @returns {boolean} */
                isFiniteNumber(value) {
                  return typeof value === "number" && Number.isFinite(value);
                },
                /** @param {unknown} value @returns {number | undefined} */
                toFiniteNumber(value) {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                /** @param {unknown} value @returns {number | undefined} */
                toOptionalFiniteNumber(value) {
                  if (value === null || value === undefined) return undefined;
                  if (typeof value === "string" && value.trim() === "") return undefined;
                  const n = Number(value);
                  return Number.isFinite(n) ? n : undefined;
                },
                formatDirection360() {
                  return "---";
                }
              };
            }
          },
          SpringEasing: {
            create() {
              return {
                createMotion() {
                  return {
                    /** @param {unknown} canvas @param {unknown} target */
                    resolve(canvas, target) {
                      void canvas;
                      return target;
                    },
                    isActive() {
                      return false;
                    }
                  };
                }
              };
            }
          },
          LinearGaugeEngine: {
            create() {
              return {
                /** @param {CompassConfig} cfg */
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                }
              };
            }
          }
        }
      })
    );

    if (!captured) {
      throw new Error("Expected the compass-linear display configuration.");
    }
    const compassConfig = captured;

    expect(compassConfig.formatDisplay(undefined, { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A"
    });
    expect(compassConfig.formatDisplay("", { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A"
    });
    expect(compassConfig.formatDisplay("   ", { default: "N/A" })).toEqual({
      num: NaN,
      text: "N/A"
    });
    expect(compassConfig.resolveAxis({ heading: undefined }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
    expect(compassConfig.resolveAxis({ heading: null }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
    expect(compassConfig.resolveAxis({ heading: "" }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
    expect(compassConfig.resolveAxis({ heading: "   " }, {}, { min: 0, max: 360 })).toEqual({ min: 0, max: 360 });
  });
});
