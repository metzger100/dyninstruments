// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

// Direct cfg-capture tests for WindRadialWidget's internal branches that the
// ratio-driven rendering tests in the other part files never reach: custom
// "default" placeholder text, a non-finite angle, a non-numeric speed
// reading, stableDigits padding, the layline sector guard, and the tick
// label formatter/filter callbacks (which the shared caching harness never
// invokes because its RadialToolkit stub replaces drawLabels with a plain
// counter instead of calling back into the passed options).
describe("WindRadialWidget internal display and layer branches", function () {
  function createCapturedSpec() {
    let captured;
    const drawCalls = [];
    loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          FullCircleRadialTextLayout: {
            create() {
              return {
                drawDualModeText(state, mode, left, right, opts) {
                  drawCalls.push({ mode, left, right, opts });
                }
              };
            }
          },
          FullCircleRadialEngine: {
            create() {
              return {
                createRenderer(cfg) {
                  captured = cfg;
                  return function () {};
                }
              };
            }
          }
        },
        services: {
          format: {
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );
    return {
      get cfg() {
        return captured;
      },
      drawCalls
    };
  }

  function realValueMath() {
    return loadFresh("shared/widget-kits/value/ValueMath.js").create();
  }

  it("uses a custom default placeholder for both metrics when angle is not finite and speed is not numeric", function () {
    const harness = createCapturedSpec();
    const state = { value: realValueMath() };

    harness.cfg.drawMode.normal(state, {
      default: "N/A",
      angle: null,
      speed: "abc"
    });

    const call = harness.drawCalls[harness.drawCalls.length - 1];
    expect(call.left.value).toBe("N/A");
    expect(call.right.value).toBe("N/A");
  });

  it("reuses the caller-supplied default text as the formatter fallback once the speed is a valid number", function () {
    const harness = createCapturedSpec();
    const state = { value: realValueMath() };

    harness.cfg.drawMode.normal(state, {
      default: "N/A2",
      angle: 12,
      speed: 7.5
    });

    const call = harness.drawCalls[harness.drawCalls.length - 1];
    expect(call.right.value).toBe("7.5");
    expect(call.left.value).toBe(String(realValueMath().formatAngle180(12, false)));
  });

  it("pads angle and speed text with StableDigits once stableDigits is enabled", function () {
    const harness = createCapturedSpec();
    const state = { value: realValueMath() };

    harness.cfg.drawMode.normal(state, {
      angle: 7,
      speed: 3.2,
      stableDigits: true
    });

    const call = harness.drawCalls[harness.drawCalls.length - 1];
    const stableDigits = loadFresh("shared/widget-kits/format/StableDigits.js").create(
      {},
      createComponentContextMock({
        modules: {
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js")
        }
      })
    );
    const rawAngleText = realValueMath().formatAngle180(7, false);
    const expectedAngle = stableDigits.normalize(rawAngleText, {
      integerWidth: stableDigits.resolveIntegerWidth(rawAngleText, 2),
      reserveSignSlot: true
    }).padded;
    const expectedSpeed = stableDigits.normalize("3.2", {
      integerWidth: stableDigits.resolveIntegerWidth("3.2", 2),
      reserveSignSlot: true
    }).padded;

    expect(call.left.value).toBe(expectedAngle);
    expect(call.right.value).toBe(expectedSpeed);
    expect(call.left.value).not.toBe(rawAngleText);
  });

  function createLayerState(overrides) {
    return Object.assign(
      {
        value: realValueMath(),
        geom: { cx: 150, cy: 150, rOuter: 120, ringW: 10 },
        theme: { colors: { laylineStb: "#2e9e6b", laylinePort: "#d9534a" } },
        draw: {
          drawAnnularSector: vi.fn(),
          drawLabels: vi.fn(),
          drawRing: vi.fn()
        },
        labels: { radiusOffset: 5, fontPx: 12 },
        labelWeight: 700,
        family: "sans-serif"
      },
      overrides || {}
    );
  }

  function createLayerApi() {
    return { drawFullCircleRing: vi.fn(), drawFullCircleTicks: vi.fn() };
  }

  it("skips the layline sectors when layEnabled is false", function () {
    const harness = createCapturedSpec();
    const state = createLayerState();
    const api = createLayerApi();

    harness.cfg.rebuildLayer(
      {},
      "back",
      state,
      {
        angle: 10,
        windRadialLayMin: 35,
        windRadialLayMax: 45,
        layEnabled: false
      },
      api
    );

    expect(state.draw.drawAnnularSector).not.toHaveBeenCalled();
    expect(api.drawFullCircleRing).toHaveBeenCalledTimes(1);
  });

  it("draws the layline sectors when layEnabled and the range is non-empty", function () {
    const harness = createCapturedSpec();
    const state = createLayerState();
    const api = createLayerApi();

    harness.cfg.rebuildLayer(
      {},
      "back",
      state,
      {
        angle: 10,
        windRadialLayMin: 35,
        windRadialLayMax: 45
      },
      api
    );

    expect(state.draw.drawAnnularSector).toHaveBeenCalledTimes(2);
  });

  it("formats and filters the -180..180 tick labels, hiding the endpoints", function () {
    const harness = createCapturedSpec();
    const state = createLayerState();
    const api = createLayerApi();
    let labelOptions;
    state.draw.drawLabels = function (ctx, cx, cy, r, options) {
      labelOptions = options;
    };

    harness.cfg.rebuildLayer({}, "front", state, { angle: 10 }, api);

    expect(api.drawFullCircleTicks).toHaveBeenCalledTimes(1);
    expect(labelOptions.labelFormatter(30)).toBe("30");
    expect(labelOptions.labelFormatter(-90)).toBe("-90");
    expect(labelOptions.labelFilter(-180)).toBe(false);
    expect(labelOptions.labelFilter(180)).toBe(false);
    expect(labelOptions.labelFilter(30)).toBe(true);
  });

  it("exposes a no-op translateFunction since the canvas surface owns rendering", function () {
    const harness = createCapturedSpec();
    const spec = loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create(
      {},
      createComponentContextMock({
        modules: {
          StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
          PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
          ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
          SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
          FullCircleRadialTextLayout: {
            create() {
              return {};
            }
          },
          FullCircleRadialEngine: {
            create() {
              return {
                createRenderer() {
                  return function () {};
                }
              };
            }
          }
        }
      })
    );

    expect(spec.translateFunction()).toEqual({});
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("widgets/radial/WindRadialWidget/WindRadialWidget.js", context);

    expect(context.DyniComponents.DyniWindRadialWidget.id).toBe("WindRadialWidget");
  });
});
