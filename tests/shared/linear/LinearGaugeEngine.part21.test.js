const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("keeps default pointer and marker sizing independent from track thickness theme tokens", function () {
    let thinTrackThickness = NaN;
    let thickTrackThickness = NaN;
    const thinHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#FA584A" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 },
        },
        linear: {
          track: { widthFactor: 0.08, lineWidthFactor: 0.018 },
          ticks: {
            majorLenFactor: 0.109,
            majorWidthFactor: 0.027,
            minorLenFactor: 0.064,
            minorWidthFactor: 0.014,
          },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 },
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 },
      },
    });
    const thickHarness = createHarness({
      theme: {
        colors: { pointer: "#ff2b2b", warning: "#e7c66a", alarm: "#FA584A" },
        radial: {
          ticks: { majorLen: 9, majorWidth: 2, minorLen: 5, minorWidth: 1 },
          pointer: { widthFactor: 1, lengthFactor: 2 },
          ring: { arcLineWidth: 1, widthFactor: 0.12 },
          labels: { insetFactor: 1.8, fontFactor: 0.14 },
        },
        linear: {
          track: { widthFactor: 0.3, lineWidthFactor: 0.018 },
          ticks: {
            majorLenFactor: 0.109,
            majorWidthFactor: 0.027,
            minorLenFactor: 0.064,
            minorWidthFactor: 0.014,
          },
          pointer: { sideFactor: 0.12, depthFactor: 0.24 },
          labels: { insetFactor: 1.2, fontFactor: 0.2 },
        },
        font: { weight: 700, labelWeight: 650 },
        xte: { lineWidthFactor: 1 },
      },
    });
    const spec = {
      rawValueKey: "value",
      rangeDefaults: { min: 0, max: 100 },
      rangeProps: { min: "min", max: "max" },
      tickProps: {
        major: "major",
        minor: "minor",
        showEndLabels: "showEndLabels",
      },
      drawFrame(state, props, display, api) {
        if (!isFinite(thinTrackThickness))
          thinTrackThickness = state.trackThickness;
        else thickTrackThickness = state.trackThickness;
        api.drawDefaultPointer();
        api.drawMarkerAtValue(60, { strokeStyle: "#ff2b2b" });
      },
    };
    const thinRenderer = thinHarness.engine.createRenderer(spec);
    const thickRenderer = thickHarness.engine.createRenderer(spec);
    const props = { value: 40, min: 0, max: 100, major: 20, minor: 10 };

    thinRenderer(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      props,
    );
    thickRenderer(
      createMockCanvas({
        rectWidth: 280,
        rectHeight: 220,
        ctx: createMockContext2D(),
      }),
      props,
    );

    expect(thinTrackThickness).not.toBe(thickTrackThickness);
    expect(thinHarness.calls.pointer[0].opts.depth).toBe(
      thickHarness.calls.pointer[0].opts.depth,
    );
    expect(thinHarness.calls.pointer[0].opts.side).toBe(
      thickHarness.calls.pointer[0].opts.side,
    );
    const thinMarker =
      thinHarness.calls.ticks[thinHarness.calls.ticks.length - 1];
    const thickMarker =
      thickHarness.calls.ticks[thickHarness.calls.ticks.length - 1];
    expect(thinMarker.len).toBe(thickMarker.len);
    expect(thinMarker.opts.lineWidth).toBe(thickMarker.opts.lineWidth);
  });

});
