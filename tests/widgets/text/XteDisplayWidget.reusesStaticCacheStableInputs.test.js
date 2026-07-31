// @ts-check
const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
  fillTextValues,
  makeProps
} = require("./XteDisplayWidget-setup");

describe("XteDisplayWidget", function () {
  it("reuses static cache for stable inputs and invalidates on geometry changes", function () {
    const harness = createHarness();
    const canvasA = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });
    const canvasB = createMockCanvas({
      rectWidth: 360,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvasA, makeProps());
    harness.spec.renderCanvas(canvasA, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(1);

    harness.spec.renderCanvas(canvasB, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(2);
  });

  it("applies a DPR-aware transform when rebuilding the static layer cache", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });
    canvas.width = 640;
    canvas.height = 360;

    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.25, easing: false }));
    harness.spec.renderCanvas(canvas, makeProps({ xte: 0.4, easing: false }));

    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(2);

    const drawImageCalls = canvas.__ctx.calls.filter((/** @type {DyniTestCall} */ entry) => entry.name === "drawImage");
    expect(drawImageCalls.length).toBeGreaterThan(0);
    const drawImage = drawImageCalls[0];
    if (!drawImage || !drawImage.args[0] || typeof drawImage.args[0] !== "object") {
      throw new Error("Expected a cached layer canvas draw.");
    }
    const layerCanvas = /** @type {{ __ctx: DyniTestCanvasContext }} */ (drawImage.args[0]);
    const layerCalls = layerCanvas.__ctx.calls;
    const layerSetTransform = layerCalls.find((entry) => entry.name === "setTransform");
    const layerClearRect = layerCalls.find((entry) => entry.name === "clearRect");
    const setTransformIndex = layerCalls.findIndex((entry) => entry.name === "setTransform");
    const clearRectIndex = layerCalls.findIndex((entry) => entry.name === "clearRect");

    if (!layerSetTransform || !layerClearRect) {
      throw new Error("Expected cache transform and clear calls.");
    }

    expect(layerSetTransform.args).toEqual([2, 0, 0, 2, 0, 0]);
    expect(layerClearRect.args).toEqual([0, 0, 320, 180]);
    expect(setTransformIndex).toBeGreaterThanOrEqual(0);
    expect(clearRectIndex).toBeGreaterThanOrEqual(0);
    expect(setTransformIndex).toBeLessThan(clearRectIndex);
  });

  it("invalidates static cache when strokeWeight changes", function () {
    const harness = createHarness({
      theme: {
        strokeWeight: 1
      }
    });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(1);

    harness.theme.strokeWeight = 1.8;
    harness.spec.renderCanvas(canvas, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(2);
  });

  it("keeps the static cache when only pointerDepthWeight changes", function () {
    const harness = createHarness({
      theme: {
        pointerDepthWeight: 1
      }
    });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(1);
    const initialDynamicDraw = harness.calls.dynamicDraws[0];
    if (!initialDynamicDraw) {
      throw new Error("Expected the initial dynamic draw.");
    }
    expect(initialDynamicDraw.pointerDepthWeight).toBe(1);

    harness.theme.pointerDepthWeight = 1.6;
    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(2);
    const updatedDynamicDraw = harness.calls.dynamicDraws[1];
    if (!updatedDynamicDraw) {
      throw new Error("Expected the updated dynamic draw.");
    }
    expect(updatedDynamicDraw.pointerDepthWeight).toBe(1.6);
  });

  it("keeps the static cache when only dynamic pointer/alarm colors change", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps());
    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(1);

    harness.theme.colors.pointer = "#00ccee";
    harness.theme.colors.alarm = "#ff1100";
    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(2);
    const recoloredDraw = harness.calls.dynamicDraws[1];
    if (!recoloredDraw) {
      throw new Error("Expected the recolored dynamic draw.");
    }
    expect(recoloredDraw.colors.pointer).toBe("#00ccee");
    expect(recoloredDraw.colors.alarm).toBe("#ff1100");
  });

  it("keeps the highway frame visible and suppresses the indicator when required values are missing", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps({ xte: undefined }));
    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(0);
    const missingXteRow = harness.calls.valueRows[1];
    const distanceRow = harness.calls.valueRows[2];
    if (!missingXteRow || !distanceRow) {
      throw new Error("Expected XTE value rows.");
    }
    expect(missingXteRow.value).toBe("---");
    expect(distanceRow.value).toBe("0.72");

    harness.spec.renderCanvas(canvas, makeProps({ disconnect: true }));
    expect(harness.calls.overlays).toBe(0);
    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(4);
    expect(fillTextValues(canvas.__ctx)).toContain("GPS Lost");
  });

  it("draws the highway indicator when xte is finite even if other guidance values are missing", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        cog: undefined,
        dtw: undefined,
        btw: undefined
      })
    );

    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(1);
    const [cogRow, , btwRow, dtwRow] = harness.calls.valueRows;
    if (!cogRow || !btwRow || !dtwRow) {
      throw new Error("Expected graphics-only value rows.");
    }
    expect(cogRow.value).toBe("---");
    expect(btwRow.value).toBe("---");
    expect(dtwRow.value).toBe("---");
  });

  it("renders noTarget state-screen when wpName is an empty string", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps({ wpName: "" }));

    expect(harness.calls.staticDraws).toHaveLength(0);
    expect(harness.calls.dynamicDraws).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(0);
    expect(fillTextValues(canvas.__ctx)).toContain("No Waypoint");
  });

  it("renders noTarget state-screen when wpName is empty even with hidden textual metrics", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        wpName: "",
        hideTextualMetrics: true
      })
    );

    expect(harness.calls.staticDraws).toHaveLength(0);
    expect(harness.calls.dynamicDraws).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(0);
    expect(harness.calls.waypointChecks).toHaveLength(0);
    expect(fillTextValues(canvas.__ctx)).toContain("No Waypoint");
  });

  it("keeps disconnected precedence over noTarget", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        disconnect: true,
        wpName: "",
        hideTextualMetrics: true
      })
    );

    expect(harness.calls.staticDraws).toHaveLength(0);
    expect(harness.calls.dynamicDraws).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(0);
    expect(fillTextValues(canvas.__ctx)).toContain("GPS Lost");
    expect(fillTextValues(canvas.__ctx)).not.toContain("No Waypoint");
  });

  it("renders graphics-only highway layout and skips text fitting when textual metrics are hidden", function () {
    const harness = createHarness();
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(
      canvas,
      makeProps({
        hideTextualMetrics: true,
        wpName: "Fairway Buoy",
        showWpName: true
      })
    );

    const graphicsLayout = harness.calls.layoutHistory[0];
    if (!graphicsLayout) {
      throw new Error("Expected graphics-only layout history.");
    }
    expect(graphicsLayout.nameRect).toBeNull();
    expect(graphicsLayout.metricRects).toBeNull();
    expect(harness.calls.waypointTextFillScales).toHaveLength(0);
    expect(harness.calls.metricTextFillScales).toHaveLength(0);
    expect(harness.calls.valueRows).toHaveLength(0);
    expect(harness.calls.staticDraws).toHaveLength(1);
    expect(harness.calls.dynamicDraws).toHaveLength(1);
  });

  it("normalizes known formatter fallback tokens to --- across all metric rows", function () {
    const harness = createHarness({
      /** @param {unknown} value @param {{ default?: unknown, formatter?: string }} [formatterOptions] */
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        if (cfg.formatter === "formatDirection360") {
          return "--:--:--";
        }
        return cfg.default;
      }
    });
    const canvas = createMockCanvas({
      rectWidth: 320,
      rectHeight: 180,
      ctx: createMockContext2D()
    });

    harness.spec.renderCanvas(canvas, makeProps());

    expect(harness.calls.valueRows).toHaveLength(4);
    harness.calls.valueRows.forEach((row) => expect(row.value).toBe("---"));
  });
});
