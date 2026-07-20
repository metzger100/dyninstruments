const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("WindRadialWidget", function () {
  it("passes full-circle ratio props without wrapper-owned ratioDefaults", function () {
    /** @type {any} */
    let captured;
    const renderCanvas = vi.fn();

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
                /** @param {any} cfg */
                createRenderer(cfg) {
                  captured = cfg;
                  return renderCanvas;
                }
              };
            }
          }
        },
        services: {
          format: {
            /** @param {any} value */
            applyFormatter(value) {
              return String(value);
            }
          }
        }
      })
    );

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.ratioProps).toEqual({
      normal: "windRadialRatioThresholdNormal",
      flat: "windRadialRatioThresholdFlat"
    });
    expect(captured.hideTextualMetricsProp).toBe("windRadialHideTextualMetrics");
    expect(captured).not.toHaveProperty("ratioDefaults");
  });
});
