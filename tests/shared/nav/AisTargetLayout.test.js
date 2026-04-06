const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    return loadFresh("shared/widget-kits/nav/AisTargetLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return layoutRectMath;
        }
        if (id === "AisTargetLayoutGeometry") {
          return loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function expectInlineSubRects(box) {
    expect(box.captionRect).toBeTruthy();
    expect(box.valueRowRect).toBeTruthy();
    expect(box.valueTextRect).toBeTruthy();
    expect(box.unitRect).toBeTruthy();
    expect(box.valueTextRect.w).toBeLessThanOrEqual(box.valueRowRect.w);
  }

  function expectHighSubRects(box) {
    expect(box.labelRect).toBeTruthy();
    expect(box.valueRect).toBeTruthy();
    expect(box.unitRect).toBeTruthy();
    expect(box.valueRect.x).toBeGreaterThanOrEqual(box.labelRect.x + box.labelRect.w);
    expect(box.unitRect.x).toBeGreaterThanOrEqual(box.valueRect.x + box.valueRect.w);
  }

  it("resolves high/normal/flat mode by ratio thresholds", function () {
    const layout = createLayout();

    expect(layout.resolveMode({ W: 180, H: 200, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("high");
    expect(layout.resolveMode({ W: 260, H: 180, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("normal");
    expect(layout.resolveMode({ W: 520, H: 120, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("flat");
  });

  it("builds flat data layout with all four metrics and inline sub-rects", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      mode: "flat",
      W: 620,
      H: 120,
      renderState: "data",
      showTcpaBranch: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("flat");
    expect(out.nameRect).toBeTruthy();
    expect(out.frontRect).toBeTruthy();
    expect(out.metricVisibility).toEqual({ dst: true, cpa: true, tcpa: true, brg: true });
    expect(out.metricOrder).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(out.flatMetricRows).toBe(1);
    expect(out.flatMetricColumns).toBe(4);
    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expect(out.metricBoxes[id]).toBeTruthy();
      expectInlineSubRects(out.metricBoxes[id]);
    });
  });

  it("switches flat data layout to 2x2 metrics when tiles are narrow", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      mode: "flat",
      W: 290,
      H: 140,
      renderState: "data",
      showTcpaBranch: true
    });

    expect(out.mode).toBe("flat");
    expect(out.flatMetricRows).toBe(2);
    expect(out.flatMetricColumns).toBe(2);
    expect(out.metricBoxes.tcpa.y).toBeGreaterThan(out.metricBoxes.dst.y);
    expect(out.metricBoxes.brg.y).toBeGreaterThan(out.metricBoxes.cpa.y);
  });

  it("builds normal data layout as a 2x2 metrics grid with inline sub-rects", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      mode: "normal",
      W: 320,
      H: 210,
      renderState: "data",
      showTcpaBranch: true,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("normal");
    expect(out.metricOrder).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(out.metricBoxes.dst.y).toBe(out.metricBoxes.cpa.y);
    expect(out.metricBoxes.tcpa.y).toBeGreaterThan(out.metricBoxes.dst.y);
    expect(out.metricBoxes.brg.y).toBeGreaterThan(out.metricBoxes.cpa.y);
    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectInlineSubRects(out.metricBoxes[id]);
    });
  });

  it("builds high data layout as four stacked metric rows with row sub-rects", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      mode: "high",
      W: 170,
      H: 320,
      renderState: "data",
      showTcpaBranch: false
    });

    expect(out.mode).toBe("high");
    expect(out.metricOrder).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(out.metricBoxes.cpa.y).toBeGreaterThan(out.metricBoxes.dst.y);
    expect(out.metricBoxes.tcpa.y).toBeGreaterThan(out.metricBoxes.cpa.y);
    expect(out.metricBoxes.brg.y).toBeGreaterThan(out.metricBoxes.tcpa.y);
    ["dst", "cpa", "tcpa", "brg"].forEach((id) => {
      expectHighSubRects(out.metricBoxes[id]);
    });
  });

  it("omits metric boxes for placeholder and hidden states", function () {
    const layout = createLayout();

    ["placeholder", "hidden"].forEach((state) => {
      const out = layout.computeLayout({
        mode: "flat",
        W: 320,
        H: 180,
        renderState: state,
        showTcpaBranch: true
      });

      expect(out.metricVisibility).toEqual({ dst: false, cpa: false, tcpa: false, brg: false });
      expect(out.metricOrder).toEqual([]);
      expect(Object.keys(out.metricBoxes)).toEqual([]);
      expect(out.placeholderRect).toEqual(out.contentRect);
    });
  });

  it("exposes committed vertical shell profile with 7/8 ratio and 8em min-height", function () {
    const layout = createLayout();
    const vertical = layout.computeVerticalShellProfile({
      W: 280,
      H: 100,
      isVerticalCommitted: true
    });

    expect(vertical.isVerticalCommitted).toBe(true);
    expect(vertical.forceHigh).toBe(true);
    expect(vertical.effectiveLayoutHeight).toBe(320);
    expect(vertical.aspectRatio).toBe("7/8");
    expect(vertical.minHeight).toBe("8em");
    expect(vertical.wrapperStyle).toContain("aspect-ratio:7/8;");
    expect(vertical.wrapperStyle).toContain("min-height:8em;");
  });

  it("anchors responsive compaction to width in committed vertical mode and forces high", function () {
    const layout = createLayout();
    const verticalA = layout.computeLayout({
      W: 240,
      H: 80,
      renderState: "data",
      showTcpaBranch: true,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 360
    });
    const verticalB = layout.computeLayout({
      W: 240,
      H: 80,
      renderState: "data",
      showTcpaBranch: true,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 640
    });

    expect(verticalA.mode).toBe("high");
    expect(verticalB.mode).toBe("high");
    expect(verticalA.responsive.minDim).toBe(240);
    expect(verticalA.responsive.textFillScale).toBe(verticalB.responsive.textFillScale);
  });
});
