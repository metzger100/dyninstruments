const { loadFresh } = require("../../helpers/load-umd");

describe("EditRouteLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/nav/EditRouteLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  it("returns flat boxes for name, PTS, and DST only", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 520,
      H: 120,
      hasRoute: true,
      isLocalRoute: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("flat");
    expect(out.metricVisibility).toEqual({ pts: true, dst: true, rte: false, eta: false });
    expect(out.metricBoxes.pts).toBeTruthy();
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.rte).toBeUndefined();
    expect(out.metricBoxes.eta).toBeUndefined();
    expect(out.metricBoxes.dst.valueTextRect).toBeTruthy();
    expect(out.metricBoxes.dst.unitRect).toBeTruthy();
    expect(out.metricBoxes.dst.unitRect.x).toBeGreaterThan(out.metricBoxes.dst.valueTextRect.x);
  });

  it("returns normal boxes for name, PTS, DST, RTE, and ETA", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 320,
      H: 220,
      hasRoute: true,
      isLocalRoute: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("normal");
    expect(out.metricVisibility).toEqual({ pts: true, dst: true, rte: true, eta: true });
    expect(out.metricBoxes.pts).toBeTruthy();
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.rte).toBeTruthy();
    expect(out.metricBoxes.eta).toBeTruthy();
    expect(out.metricBoxes.rte.valueTextRect.w).toBeGreaterThan(0);
    expect(out.metricBoxes.rte.unitRect.w).toBeGreaterThan(0);
  });

  it("returns high mode as stacked metric rows", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 170,
      H: 320,
      hasRoute: true,
      isLocalRoute: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("high");
    expect(out.metricBoxes.pts.labelRect.x).toBeLessThan(out.metricBoxes.pts.valueRect.x);
    expect(out.metricBoxes.dst.tileRect.y).toBeGreaterThan(out.metricBoxes.pts.tileRect.y);
    expect(out.metricBoxes.rte.tileRect.y).toBeGreaterThan(out.metricBoxes.dst.tileRect.y);
    expect(out.metricBoxes.eta.tileRect.y).toBeGreaterThan(out.metricBoxes.rte.tileRect.y);
    expect(out.metricBoxes.rte.unitRect.x).toBeGreaterThan(out.metricBoxes.rte.valueTextRect.x);
  });

  it("omits all metric boxes when no route is available", function () {
    const layout = createLayout();

    ["flat", "normal", "high"].forEach(function (mode) {
      const out = layout.computeLayout({
        mode: mode,
        W: 280,
        H: 180,
        hasRoute: false,
        isLocalRoute: true
      });

      expect(out.metricVisibility).toEqual({ pts: false, dst: false, rte: false, eta: false });
      expect(Object.keys(out.metricBoxes)).toEqual([]);
      expect(out.sourceBadgeRect).toBeNull();
    });
  });

  it("creates a source-badge box only for local routes with route data", function () {
    const layout = createLayout();

    const localOut = layout.computeLayout({
      mode: "normal",
      W: 320,
      H: 220,
      hasRoute: true,
      isLocalRoute: true
    });
    const serverOut = layout.computeLayout({
      mode: "normal",
      W: 320,
      H: 220,
      hasRoute: true,
      isLocalRoute: false
    });

    expect(localOut.sourceBadgeRect).toBeTruthy();
    expect(serverOut.sourceBadgeRect).toBeNull();
    expect(localOut.nameTextRect.w).toBeLessThan(localOut.nameBarRect.w);
  });

  it("forces high mode when committed vertical state is active", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 420,
      H: 100,
      hasRoute: true,
      isLocalRoute: false,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 410,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("high");
    expect(out.verticalShell.forceHigh).toBe(true);
    expect(out.isVerticalCommitted).toBe(true);
    expect(out.verticalShell.effectiveLayoutHeight).toBe(410);
  });

  it("uses width-only responsive anchoring in committed vertical mode", function () {
    const layout = createLayout();
    const hostSized = layout.computeLayout({
      W: 240,
      H: 70,
      hasRoute: true,
      isLocalRoute: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });
    const verticalA = layout.computeLayout({
      W: 240,
      H: 70,
      hasRoute: true,
      isLocalRoute: false,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 400
    });
    const verticalB = layout.computeLayout({
      W: 240,
      H: 70,
      hasRoute: true,
      isLocalRoute: false,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 640
    });

    expect(hostSized.responsive.minDim).toBe(70);
    expect(verticalA.responsive.minDim).toBe(240);
    expect(verticalA.responsive.textFillScale).toBe(verticalB.responsive.textFillScale);
  });

  it("exposes vertical-shell metadata with 7/8 aspect-ratio and 8em min-height", function () {
    const layout = createLayout();
    const vertical = layout.computeVerticalShellProfile({ W: 280, H: 100, isVerticalCommitted: true });

    expect(vertical.aspectRatio).toBe("7/8");
    expect(vertical.minHeight).toBe("8em");
    expect(vertical.wrapperStyle).toContain("aspect-ratio:7/8;");
    expect(vertical.wrapperStyle).toContain("min-height:8em;");
  });
});
