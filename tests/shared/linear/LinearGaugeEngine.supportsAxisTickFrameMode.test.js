// @ts-check
const { createHarness, createMockCanvas, createMockContext2D } = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("supports axis/tick/frame/mode hooks without breaking default rendering pipeline", function () {
    const harness = createHarness();
    let resolveAxisCalls = 0;
    let buildTicksCalls = 0;
    let drawFrameCalls = 0;
    let drawModeCalls = 0;
    let markerTrackY = NaN;
    let markerTrackLayout = null;

    // @ts-ignore -- pre-existing untyped test mock boundary
    const layerContexts = [];
    const ownerDocument = {
      // @ts-ignore -- pre-existing untyped test mock boundary
      createElement(tagName) {
        if (String(tagName || "").toLowerCase() !== "canvas") {
          return { tagName: String(tagName || "").toUpperCase() };
        }
        const layerCtx = createMockContext2D();
        layerContexts.push(layerCtx);
        return {
          width: 0,
          height: 0,
          parentElement: null,
          __ctx: layerCtx,
          ownerDocument: ownerDocument,
          // @ts-ignore -- pre-existing untyped test mock boundary
          getContext(type) {
            return type === "2d" ? layerCtx : null;
          },
          getBoundingClientRect() {
            const width = Number(this.width) || 0;
            const height = Number(this.height) || 0;
            return {
              width,
              height,
              top: 0,
              left: 0,
              right: width,
              bottom: height
            };
          },
          closest() {
            return null;
          }
        };
      }
    };

    const renderer = harness.engine.createRenderer({
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 360 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels"
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      resolveAxis(props, range, defaultAxis, api) {
        resolveAxisCalls += 1;
        expect(defaultAxis).toEqual({ min: 0, max: 360 });
        expect(typeof api.math.mapValueToX).toBe("function");
        return { min: -180, max: 180 };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      buildTicks(axis, tickMajor, tickMinor, props, api) {
        buildTicksCalls += 1;
        expect(axis).toEqual({ min: -180, max: 180 });
        expect(typeof api.primitives.drawTrack).toBe("function");
        return { major: [0], minor: [-90, 90] };
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      formatTickLabel(tickValue) {
        return "L" + String(Math.round(tickValue));
      },
      // @ts-ignore -- pre-existing untyped test mock boundary
      drawFrame(state, props, display, api) {
        drawFrameCalls += 1;
        markerTrackY = state.layout.trackY;
        markerTrackLayout = state.layout;
        api.drawDefaultPointer();
        api.drawMarkerAtValue(45, {
          lineWidth: 7,
          len: 9,
          strokeStyle: "#00ff00"
        });
        api.drawMarkerAtValue(75, { strokeStyle: "#3366cc" });
      },
      drawMode: {
        // @ts-ignore -- pre-existing untyped test mock boundary
        normal(state, props, display, api) {
          drawModeCalls += 1;
        }
      }
    });

    renderer(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D(),
        ownerDocument: ownerDocument
      }),
      {
        value: 15,
        min: 0,
        max: 360,
        major: 30,
        minor: 10,
        showEndLabels: true
      }
    );

    expect(resolveAxisCalls).toBe(1);
    expect(buildTicksCalls).toBe(1);
    expect(drawFrameCalls).toBe(1);
    expect(drawModeCalls).toBe(1);
    expect(harness.calls.pointer).toHaveLength(1);
    const explicitMarker = harness.calls.ticks.find(function (entry) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      return entry.opts && entry.opts.strokeStyle === "#00ff00";
    });
    const defaultMarker = harness.calls.ticks.find(function (entry) {
      // @ts-ignore -- pre-existing untyped test mock boundary
      return entry.opts && entry.opts.strokeStyle === "#3366cc";
    });
    expect(explicitMarker).toEqual(
      expect.objectContaining({
        len: 9,
        opts: expect.objectContaining({
          lineWidth: 7,
          strokeStyle: "#00ff00"
        })
      })
    );
    expect(defaultMarker).toEqual(
      expect.objectContaining({
        opts: expect.objectContaining({
          lineCap: "butt",
          strokeStyle: "#3366cc"
        })
      })
    );
    expect(markerTrackLayout).toBeTruthy();
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.depth).toBe(
      // @ts-ignore -- pre-existing untyped test mock boundary
      markerTrackLayout.pointerDepth
    );
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(harness.calls.pointer[0] && harness.calls.pointer[0].opts && harness.calls.pointer[0].opts.side).toBe(
      // @ts-ignore -- pre-existing untyped test mock boundary
      Math.max(1, Math.floor(markerTrackLayout.pointerSide / 2))
    );
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(defaultMarker && defaultMarker.len).toBe(Math.max(1, Math.floor(markerTrackLayout.pointerDepth * 0.45)));
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(defaultMarker && defaultMarker.opts && defaultMarker.opts.lineWidth).toBe(
      // @ts-ignore -- pre-existing untyped test mock boundary
      Math.max(1, Math.floor(markerTrackLayout.pointerDepth * 0.2))
    );
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(defaultMarker && defaultMarker.y - defaultMarker.len).toBe(markerTrackY);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(explicitMarker && explicitMarker.len).toBe(9);
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(explicitMarker && explicitMarker.opts && explicitMarker.opts.lineWidth).toBe(7);
    expect(harness.calls.drawCaptionMax).toBe(0);
    expect(harness.calls.drawValueUnitWithFit).toBe(0);
    expect(harness.calls.drawInlineCapValUnit).toBe(0);

    // @ts-ignore -- pre-existing untyped test mock boundary
    const fillTextCalls = layerContexts
      .flatMap((lc) => (lc && lc.calls) || [])
      .filter((entry) => entry.name === "fillText");
    const labels = fillTextCalls.map((entry) => entry.args[0]);
    expect(labels).toContain("L0");
  });
});
