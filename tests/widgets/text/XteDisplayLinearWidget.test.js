const { createHarness, createCanvas, makeProps, findPointerTriangles } = require("./XteDisplayLinearWidget.harness.js");

describe("XteDisplayLinearWidget", function () {
  it("creates widget with expected id and wantsHideNativeHead", function () {
    const h = /** @type {any} */ (createHarness());

    expect(h.spec.id).toBe("XteDisplayLinearWidget");
    expect(h.spec.wantsHideNativeHead).toBe(true);
    expect(typeof h.spec.renderCanvas).toBe("function");
  });

  it("renders disconnected and noTarget states through the state-screen overlay", function () {
    const h = /** @type {any} */ (createHarness());
    const disconnected = createCanvas(320, 180);
    const noTarget = createCanvas(320, 180);

    h.spec.renderCanvas(
      disconnected.canvas,
      makeProps({
        display: {
          disconnect: true,
          wpName: "Fairway Buoy"
        }
      })
    );
    h.spec.renderCanvas(
      noTarget.canvas,
      makeProps({
        display: {
          disconnect: false,
          wpName: ""
        }
      })
    );

    expect(h.calls.stateKinds).toEqual(["disconnected", "noTarget"]);
    expect(h.calls.tracks).toHaveLength(0);
  });

  it("draws static gauge layer and uses flat/normal/high modes by canvas ratio", function () {
    const h = /** @type {any} */ (createHarness());

    h.spec.renderCanvas(createCanvas(520, 140).canvas, makeProps());
    h.spec.renderCanvas(createCanvas(220, 220).canvas, makeProps());
    h.spec.renderCanvas(createCanvas(120, 320).canvas, makeProps());

    expect(h.calls.tracks.length).toBeGreaterThanOrEqual(3);
    expect(h.calls.ticks.length).toBeGreaterThan(0);
    expect(h.calls.ensureKeys[0].mode).toBe("flat");
    expect(h.calls.ensureKeys[1].mode).toBe("normal");
    expect(h.calls.ensureKeys[2].mode).toBe("high");
  });

  it("draws an upward-pointing pointer below the track at the expected x position", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: {
          xte: 0,
          wpName: "Fairway Buoy"
        }
      })
    );

    const track = h.calls.tracks[0];
    const triangles = findPointerTriangles(cv.ctx.calls);
    const pointer = triangles[triangles.length - 1];
    const expectedCenter = Math.round((track.x0 + track.x1) / 2);

    expect(pointer).toBeTruthy();
    expect(pointer.tip[0]).toBe(expectedCenter);
    expect(pointer.tip[1]).toBeGreaterThan(track.y);
    expect(pointer.leftBase[1]).toBeGreaterThan(pointer.tip[1]);
    expect(pointer.rightBase[1]).toBeGreaterThan(pointer.tip[1]);
  });

  it("clamps overflow pointer to the gauge edge and uses alarm color", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: { xte: 3 },
        xteScale: 1
      })
    );

    const track = h.calls.tracks[0];
    const triangles = findPointerTriangles(cv.ctx.calls);
    const pointer = triangles[triangles.length - 1];

    expect(pointer.tip[0]).toBe(Math.round(track.x1));
    expect(cv.fillColors).toContain(h.theme.colors.alarm);
  });

  it("uses pointer color within range", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: { xte: 0.4 },
        xteScale: 1
      })
    );

    expect(cv.fillColors).toContain(h.theme.colors.pointer);
  });

  it("returns wantsFollowUpFrame when spring easing is active", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);
    const nowSpy = vi.spyOn(Date, "now");
    let now = 1000;
    nowSpy.mockImplementation(function () {
      now += 16;
      return now;
    });

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: { xte: 0.1 }
      })
    );
    const followUp = h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: { xte: 0.9 }
      })
    );

    expect(followUp).toEqual({ wantsFollowUpFrame: true });
    nowSpy.mockRestore();
  });

  it("suppresses text metrics when hideTextualMetrics is enabled", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        layout: {
          hideTextualMetrics: true
        }
      })
    );

    expect(h.calls.metricTiles).toHaveLength(0);
  });

  it("renders four metric tiles with expected captions and L/R suffix on XTE", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        display: {
          xte: -0.52,
          cog: 8,
          dtw: 1.24,
          btw: 12
        }
      })
    );

    expect(h.calls.metricTiles).toHaveLength(4);
    expect(
      h.calls.metricTiles.map(
        /** @param {any} metric */ function (metric) {
          return metric.caption;
        }
      )
    ).toEqual(["COG", "XTE", "DST", "BRG"]);
    const xteMetric = h.calls.metricTiles.find(
      /** @param {any} metric */ function (metric) {
        return metric.caption === "XTE";
      }
    );
    expect(xteMetric.value.endsWith("L")).toBe(true);
  });

  it("falls back from padded stable digits to plain text when tile fit clips", function () {
    const h = /** @type {any} */ (createHarness({ forceStableDigitsClip: true }));
    const cv = createCanvas(360, 180);

    h.spec.renderCanvas(
      cv.canvas,
      makeProps({
        stableDigits: true,
        display: {
          xte: 1.2
        }
      })
    );

    const xteMetric = h.calls.metricTiles.find(
      /** @param {any} metric */ function (metric) {
        return metric.caption === "XTE";
      }
    );
    expect(xteMetric.value).toBe("1.20R");
  });

  it("draws tick labels only for min/max and hides labels when showEndLabels is false", function () {
    const withLabels = /** @type {any} */ (createHarness());
    withLabels.spec.renderCanvas(
      createCanvas(360, 180).canvas,
      makeProps({
        xteScale: 1,
        layout: {
          tickMajor: 1,
          showEndLabels: true
        }
      })
    );
    expect(withLabels.calls.tickLabelValues).toEqual([-1, 1]);

    const withoutLabels = /** @type {any} */ (createHarness());
    withoutLabels.spec.renderCanvas(
      createCanvas(360, 180).canvas,
      makeProps({
        xteScale: 1,
        layout: {
          tickMajor: 1,
          showEndLabels: false
        }
      })
    );
    expect(withoutLabels.calls.tickLabelValues).toEqual([]);
  });

  it("renders waypoint name only when enabled and space check succeeds", function () {
    const shown = /** @type {any} */ (createHarness());
    const hidden = /** @type {any} */ (createHarness({ blockWaypointName: true }));

    shown.spec.renderCanvas(
      createCanvas(360, 180).canvas,
      makeProps({
        layout: { showWpName: true },
        display: { wpName: "Waypoint Alpha" }
      })
    );
    hidden.spec.renderCanvas(
      createCanvas(360, 180).canvas,
      makeProps({
        layout: { showWpName: true },
        display: { wpName: "Waypoint Alpha" }
      })
    );

    expect(shown.calls.waypointMeasures.length).toBeGreaterThan(0);
    expect(shown.calls.waypointDraws.length).toBe(1);
    expect(hidden.calls.waypointDraws.length).toBe(0);
  });

  it("invalidates static layer cache in finalizeFunction", function () {
    const h = /** @type {any} */ (createHarness());
    const cv = createCanvas(360, 180);
    const props = makeProps();

    h.spec.renderCanvas(cv.canvas, props);
    h.spec.renderCanvas(cv.canvas, props);
    const beforeFinalize = h.calls.tracks.length;

    h.spec.finalizeFunction();
    h.spec.renderCanvas(cv.canvas, props);
    const afterFinalize = h.calls.tracks.length;

    expect(beforeFinalize).toBe(1);
    expect(afterFinalize).toBe(2);
  });
});
