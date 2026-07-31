// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./FullCircleRadialEngine-setup");

/** @typedef {{ ratioDefaults?: { normal: number, flat: number } }} SpecOverrides */
/** @typedef {{ mode: string, labels: { fontPx: number }, geom: { fixedPointerDepth: number }, textFillScale: number, layout: { compactGeometryScale: number } }} DrawFrameState */
/** @typedef {{ mode: string }} DrawModeState */

describe("FullCircleRadialEngine", function () {
  it("matches callback-visible layout state with or without wrapper-owned ratioDefaults when config thresholds are present", function () {
    /** @param {SpecOverrides} [specOverrides] */
    function captureState(specOverrides) {
      const harness = createHarness();
      let snapshot = null;
      const renderer = harness.engine.createRenderer(
        Object.assign(
          {
            ratioProps: { normal: "n", flat: "f" },
            /** @param {DrawFrameState} state */
            drawFrame(state) {
              snapshot = {
                mode: state.mode,
                labelFontPx: state.labels.fontPx,
                fixedPointerDepth: state.geom.fixedPointerDepth,
                textFillScale: state.textFillScale,
                compactGeometryScale: state.layout.compactGeometryScale
              };
            }
          },
          specOverrides || {}
        )
      );

      renderer(
        createMockCanvas({
          rectWidth: 225,
          rectHeight: 300,
          ctx: createMockContext2D()
        }),
        {
          n: 0.8,
          f: 2.2
        }
      );

      return snapshot;
    }

    expect(
      captureState({
        ratioDefaults: { normal: 0.8, flat: 2.2 }
      })
    ).toEqual(captureState());
  });

  it("routes layout mode using ratio thresholds", function () {
    const harness = createHarness();
    const renderer = harness.engine.createRenderer({
      ratioProps: { normal: "n", flat: "f" },
      ratioDefaults: { normal: 0.7, flat: 2.0 },
      drawMode: {
        /** @param {DrawModeState} state */
        high(state) {
          harness.calls.mode.push(state.mode);
        },
        /** @param {DrawModeState} state */
        normal(state) {
          harness.calls.mode.push(state.mode);
        },
        /** @param {DrawModeState} state */
        flat(state) {
          harness.calls.mode.push(state.mode);
        }
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 90,
        rectHeight: 300,
        ctx: createMockContext2D()
      }),
      {}
    );
    renderer(
      createMockCanvas({
        rectWidth: 300,
        rectHeight: 300,
        ctx: createMockContext2D()
      }),
      {}
    );
    renderer(
      createMockCanvas({
        rectWidth: 500,
        rectHeight: 120,
        ctx: createMockContext2D()
      }),
      {}
    );

    expect(harness.calls.mode).toEqual(["high", "normal", "flat"]);
  });
});
