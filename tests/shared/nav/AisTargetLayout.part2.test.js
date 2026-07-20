// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("AisTargetLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
    return loadFresh("shared/widget-kits/nav/AisTargetLayout.js").create(
      {},
      createComponentContextMock({
        modules: {
          ResponsiveScaleProfile: responsiveScaleProfile,
          LayoutRectMath: layoutRectMath,
          AisTargetLayoutSizing: loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js"),
          AisTargetLayoutGeometry: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js"),
          AisTargetLayoutGeometryStyles: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js"),
          AisTargetLayoutMath: loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js")
        }
      })
    );
  }

  function expectStackedSubRects(box) {
    expect(box.captionRect).toBeTruthy();
    expect(box.valueRect).toBeTruthy();
    expect(box.unitRect).toBeTruthy();
    expect(box.valueRect.y).toBeGreaterThanOrEqual(box.captionRect.y + box.captionRect.h);
    expect(box.unitRect.y).toBeGreaterThanOrEqual(box.valueRect.y + box.valueRect.h);
  }

  function expectInlineSubRects(box) {
    expect(box.labelRect).toBeTruthy();
    expect(box.valueRect).toBeTruthy();
    expect(box.valueTextRect).toBeTruthy();
    expect(box.unitRect).toBeTruthy();
    expect(box.valueRect.x).toBeGreaterThanOrEqual(box.labelRect.x + box.labelRect.w);
    expect(box.unitRect.x).toBeGreaterThanOrEqual(box.valueTextRect.x + box.valueTextRect.w);
  }

  function readPxFromStyle(styleText, key) {
    const match = String(styleText || "").match(new RegExp(key + ":(\\d+)px;"));
    return match ? Number(match[1]) : NaN;
  }

  function expectedAlarmStripWidth(shellWidth) {
    const preferred = Math.round(shellWidth * 0.072);
    const maxWidth = Math.max(8, Math.floor(shellWidth * 0.19));
    return Math.max(8, Math.min(maxWidth, preferred));
  }

  it("matches Alarm strip width formula across representative shell widths", function () {
    const layout = createLayout();
    const widths = [118, 180, 220, 320];

    widths.forEach((width) => {
      const out = layout.computeLayout({
        W: width,
        H: 100,
        renderState: "data",
        showTcpaBranch: true,
        hasAccent: true
      });
      const expected = expectedAlarmStripWidth(width);
      const inlineWidth = readPxFromStyle(out.inlineGeometry.accentStyle, "width");
      const inlineRadius = readPxFromStyle(out.inlineGeometry.accentStyle, "border-radius");

      expect(out.accentRect.w).toBe(expected);
      expect(inlineWidth).toBe(expected);
      expect(inlineRadius).toBe(expected);
    });
  });

  it("uses Alarm-equivalent width 16px at shell width 220 (old AIS formula would be 19px)", function () {
    const layout = createLayout();
    const out = layout.computeLayout({
      W: 220,
      H: 100,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true
    });

    expect(expectedAlarmStripWidth(220)).toBe(16);
    expect(out.accentRect.w).toBe(16);
    expect(readPxFromStyle(out.inlineGeometry.accentStyle, "width")).toBe(16);
    expect(readPxFromStyle(out.inlineGeometry.accentStyle, "border-radius")).toBe(16);
  });

  it("scales accent geometry with committed vertical shell width", function () {
    const layout = createLayout();
    const narrow = layout.computeLayout({
      W: 180,
      H: 120,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true,
      isVerticalCommitted: true
    });
    const wide = layout.computeLayout({
      W: 260,
      H: 120,
      renderState: "data",
      showTcpaBranch: true,
      hasAccent: true,
      isVerticalCommitted: true
    });
    const narrowAccentWidth = readPxFromStyle(narrow.inlineGeometry.accentStyle, "width");
    const wideAccentWidth = readPxFromStyle(wide.inlineGeometry.accentStyle, "width");

    expect(narrow.mode).toBe("high");
    expect(wide.mode).toBe("high");
    expect(wide.accentRect.w).toBeGreaterThan(narrow.accentRect.w);
    expect(wideAccentWidth).toBeGreaterThan(narrowAccentWidth);
    expect(narrowAccentWidth).toBe(narrow.accentRect.w);
    expect(wideAccentWidth).toBe(wide.accentRect.w);
  });

  it("keeps identity spacing independent from denser metric grid spacing", function () {
    const layout = createLayout();
    const normal = layout.computeLayout({
      mode: "normal",
      W: 320,
      H: 200,
      renderState: "data",
      showTcpaBranch: true
    });
    const high = layout.computeLayout({
      mode: "high",
      W: 180,
      H: 320,
      renderState: "data",
      showTcpaBranch: true
    });

    const normalIdentityGap = normal.frontRect.y - (normal.nameRect.y + normal.nameRect.h);
    const normalMetricRowGap = normal.metricBoxes.tcpa.y - (normal.metricBoxes.dst.y + normal.metricBoxes.dst.h);
    const highIdentityGap = high.frontRect.y - (high.nameRect.y + high.nameRect.h);
    const highMetricRowGap = high.metricBoxes.cpa.y - (high.metricBoxes.dst.y + high.metricBoxes.dst.h);

    expect(normalIdentityGap).toBe(normal.insets.identityGap);
    expect(highIdentityGap).toBe(high.insets.identityGap);
    expect(normalMetricRowGap).toBe(normal.insets.metricGridGap);
    expect(highMetricRowGap).toBe(high.insets.metricGridGap);
    expect(normalIdentityGap).toBeGreaterThanOrEqual(normalMetricRowGap);
    expect(highIdentityGap).toBeGreaterThanOrEqual(highMetricRowGap);
    expect(normal.insets.identityMetricsGap).toBeGreaterThanOrEqual(normal.insets.metricGridGap);
    expect(high.insets.identityMetricsGap).toBeGreaterThanOrEqual(high.insets.metricGridGap);
  });

  it("tightens normal/high/vertical identity gaps while keeping them positive", function () {
    const layout = createLayout();
    const normal = layout.computeLayout({
      mode: "normal",
      W: 320,
      H: 200,
      renderState: "data",
      showTcpaBranch: true
    });
    const high = layout.computeLayout({
      mode: "high",
      W: 180,
      H: 320,
      renderState: "data",
      showTcpaBranch: true
    });
    const vertical = layout.computeLayout({
      W: 220,
      H: 120,
      renderState: "data",
      showTcpaBranch: true,
      isVerticalCommitted: true,
      effectiveLayoutHeight: 320
    });

    const normalGap = normal.frontRect.y - (normal.nameRect.y + normal.nameRect.h);
    const highGap = high.frontRect.y - (high.nameRect.y + high.nameRect.h);
    const verticalGap = vertical.frontRect.y - (vertical.nameRect.y + vertical.nameRect.h);

    expect(normalGap).toBe(normal.insets.identityGap);
    expect(highGap).toBe(high.insets.identityGap);
    expect(verticalGap).toBe(vertical.insets.identityGap);
    expect(normalGap).toBeGreaterThan(0);
    expect(highGap).toBeGreaterThan(0);
    expect(verticalGap).toBeGreaterThan(0);
    expect(normalGap).toBeLessThan(4);
    expect(highGap).toBeLessThan(2);
    expect(verticalGap).toBeLessThan(2);
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
    expect(vertical.wrapperStyle).toBe("");
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
    expect(Math.abs(verticalA.nameRect.h - verticalA.frontRect.h)).toBeLessThanOrEqual(1);
    expect(verticalA.metricsRect.h).toBeGreaterThan(verticalA.identityRect.h);
  });

  it("allocates more inline unit width in normal and high metric rows", function () {
    const layout = createLayout();
    const normal = layout.computeLayout({
      mode: "normal",
      W: 300,
      H: 190,
      renderState: "data",
      showTcpaBranch: true
    });
    const high = layout.computeLayout({
      mode: "high",
      W: 180,
      H: 320,
      renderState: "data",
      showTcpaBranch: true
    });

    const normalUnitShare = normal.metricBoxes.dst.unitRect.w / normal.metricBoxes.dst.valueRect.w;
    const highUnitShare = high.metricBoxes.dst.unitRect.w / high.metricBoxes.dst.valueRect.w;
    expect(normalUnitShare).toBeGreaterThan(0.24);
    expect(highUnitShare).toBeGreaterThan(0.21);
  });
});
