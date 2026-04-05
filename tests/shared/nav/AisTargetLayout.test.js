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
        throw new Error("unexpected module: " + id);
      }
    });
  }

  it("resolves high/normal/flat mode by ratio thresholds", function () {
    const layout = createLayout();

    expect(layout.resolveMode({ W: 180, H: 200, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("high");
    expect(layout.resolveMode({ W: 260, H: 180, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("normal");
    expect(layout.resolveMode({ W: 520, H: 120, ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 })).toBe("flat");
  });

  it("builds flat BRG layout with front initial and two metric boxes", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 520,
      H: 120,
      renderState: "data",
      showTcpaBranch: false,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("flat");
    expect(out.frontInitialRect).toBeTruthy();
    expect(out.nameRect).toBeNull();
    expect(out.frontRect).toBeNull();
    expect(out.metricVisibility).toEqual({ dst: true, cpa: false, tcpa: false, brg: true });
    expect(out.metricOrder).toEqual(["dst", "brg"]);
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.brg).toBeTruthy();
    expect(out.metricBoxes.cpa).toBeUndefined();
    expect(out.metricBoxes.tcpa).toBeUndefined();
  });

  it("builds normal TCPA layout with DST + DCPA top row and full-width TCPA row", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 320,
      H: 210,
      renderState: "data",
      showTcpaBranch: true,
      ratioThresholdNormal: 1.2,
      ratioThresholdFlat: 3.8
    });

    expect(out.mode).toBe("normal");
    expect(out.metricVisibility).toEqual({ dst: true, cpa: true, tcpa: true, brg: false });
    expect(out.metricOrder).toEqual(["dst", "cpa", "tcpa"]);
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.cpa).toBeTruthy();
    expect(out.metricBoxes.tcpa).toBeTruthy();
    expect(out.metricBoxes.brg).toBeUndefined();
    expect(out.metricBoxes.tcpa.w).toBe(out.metricsRect.w);
    expect(out.metricBoxes.tcpa.y).toBeGreaterThan(out.metricBoxes.dst.y);
  });

  it("builds high BRG layout as stacked DST/BRG rows without filler tiles", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      mode: "high",
      W: 170,
      H: 320,
      renderState: "data",
      showTcpaBranch: false
    });

    expect(out.mode).toBe("high");
    expect(out.metricOrder).toEqual(["dst", "brg"]);
    expect(out.metricBoxes.dst).toBeTruthy();
    expect(out.metricBoxes.brg).toBeTruthy();
    expect(out.metricBoxes.cpa).toBeUndefined();
    expect(out.metricBoxes.tcpa).toBeUndefined();
    expect(out.metricBoxes.brg.y).toBeGreaterThan(out.metricBoxes.dst.y);
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

  it("anchors responsive compaction to width in committed vertical mode", function () {
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
