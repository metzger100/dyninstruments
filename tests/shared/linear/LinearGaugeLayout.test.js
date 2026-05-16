const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("LinearGaugeLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/linear/LinearGaugeLayout.js").create({}, createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
      }
    }));
  }

  function createTheme(overrides) {
    const extra = overrides || {};
    return {
      strokeWeight: Object.prototype.hasOwnProperty.call(extra, "strokeWeight") ? extra.strokeWeight : 1,
      pointerDepthWeight: Object.prototype.hasOwnProperty.call(extra, "pointerDepthWeight") ? extra.pointerDepthWeight : 1,
      pointerSideWeight: Object.prototype.hasOwnProperty.call(extra, "pointerSideWeight") ? extra.pointerSideWeight : 1,
      linear: {
        track: Object.assign({
          widthFactor: 0.16,
          lineWidthFactor: 0.018
        }, extra.linear && extra.linear.track ? extra.linear.track : {}),
        ticks: Object.assign({
          majorLenFactor: 0.109,
          majorWidthFactor: 0.027,
          minorLenFactor: 0.064,
          minorWidthFactor: 0.014
        }, extra.linear && extra.linear.ticks ? extra.linear.ticks : {}),
        pointer: Object.assign({
          sideFactor: 0.12,
          depthFactor: 0.24
        }, extra.linear && extra.linear.pointer ? extra.linear.pointer : {}),
        labels: Object.assign({
          insetFactor: 1.8,
          fontFactor: 0.14
        }, extra.linear && extra.linear.labels ? extra.linear.labels : {})
      }
    };
  }

  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  function buildSnapshot(layout, width, height, mode, layoutConfig, extraArgs) {
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return {
      insets: insets,
      contentRect: contentRect,
      out: layout.computeLayout(Object.assign({
        W: width,
        H: height,
        theme: createTheme(),
        mode: mode,
        gap: insets.gap,
        contentRect: contentRect,
        responsive: insets.responsive,
        layoutConfig: layoutConfig
      }, extraArgs || {}))
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(480, 120, 1.1, 3.5)).toBe("flat");
    expect(layout.computeMode(260, 220, 1.1, 3.5)).toBe("normal");
    expect(layout.computeMode(120, 320, 1.1, 3.5)).toBe("high");
  });

  it("uses structural fallback thresholds only when explicit thresholds are absent", function () {
    const layout = createLayout();

    expect(layout.computeMode(260, 220, 1.2, 2.8)).toBe("high");
    expect(layout.computeMode(260, 220, undefined, undefined)).toBe("normal");
    expect(layout.computeMode(260, 220, null, null)).toBe("normal");
    expect(layout.computeMode(260, 220, "   ", "")).toBe("normal");
    expect(layout.computeMode(520, 160, undefined, undefined)).toBe("flat");
    expect(layout.computeMode(120, 320, undefined, undefined)).toBe("high");
  });

  it("keeps flat, normal, and high geometry inside the content rect", function () {
    const layout = createLayout();
    const cases = [
      { width: 520, height: 140, mode: "flat", expectInline: false },
      { width: 280, height: 220, mode: "normal", expectInline: true },
      { width: 120, height: 320, mode: "high", expectInline: false }
    ];

    cases.forEach(function (testCase) {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, testCase.mode);
      expectRectInside(snapshot.out.trackBox, snapshot.contentRect);
      if (snapshot.out.captionBox) expectRectInside(snapshot.out.captionBox, snapshot.contentRect);
      if (snapshot.out.valueBox) expectRectInside(snapshot.out.valueBox, snapshot.contentRect);
      if (testCase.expectInline) expectRectInside(snapshot.out.inlineBox, snapshot.contentRect);
    });
  });

  it("keeps the default normal/high layout contracts intact", function () {
    const layout = createLayout();
    const normal = buildSnapshot(layout, 280, 220, "normal").out;
    const high = buildSnapshot(layout, 120, 320, "high").out;

    expect(normal.inlineBox).toBeTruthy();
    expect(normal.captionBox).toBeNull();
    expect(normal.valueBox).toBeNull();
    expect(normal.textTopBox).toBeNull();
    expect(normal.textBottomBox).toBeNull();
    expect(high.inlineBox).toBeNull();
    expect(high.captionBox).toBeTruthy();
    expect(high.valueBox).toBeTruthy();
    expect(high.textTopBox).toBeNull();
    expect(high.textBottomBox).toBeNull();
  });

  it("removes every metric box and reclaims the layout when hideTextualMetrics is true", function () {
    const layout = createLayout();
    const flat = buildSnapshot(layout, 520, 140, "flat", null, { hideTextualMetrics: true }).out;
    const normal = buildSnapshot(layout, 280, 220, "normal", null, { hideTextualMetrics: true }).out;
    const high = buildSnapshot(layout, 120, 320, "high", null, { hideTextualMetrics: true }).out;

    [flat, normal, high].forEach(function (out) {
      expect(out.captionBox).toBeNull();
      expect(out.valueBox).toBeNull();
      expect(out.inlineBox).toBeNull();
      expect(out.textTopBox).toBeNull();
      expect(out.textBottomBox).toBeNull();
      expect(out.trackY).toBeGreaterThan(out.contentRect.y);
      expect(out.trackY).toBeLessThan(out.contentRect.y + out.contentRect.h);
      expect(out.trackY).toBe(out.contentRect.y + Math.floor(out.contentRect.h / 2));
    });

    expect(flat.scaleX0).toBe(flat.contentRect.x);
    expect(flat.scaleX1).toBe(flat.contentRect.x + flat.contentRect.w);
    expect(flat.trackBox.w).toBe(flat.contentRect.w);
    expect(flat.trackBox.h).toBe(flat.contentRect.h);

    expect(normal.scaleX0).toBeGreaterThan(normal.contentRect.x);
    expect(normal.scaleX1).toBeLessThan(normal.contentRect.x + normal.contentRect.w);
    expect(normal.trackBox.w).toBe(normal.scaleX1 - normal.scaleX0);
    expect(normal.trackBox.h).toBe(normal.contentRect.h);

    expect(high.scaleX0).toBe(high.contentRect.x);
    expect(high.scaleX1).toBe(high.contentRect.x + high.contentRect.w);
    expect(high.trackBox.w).toBe(high.contentRect.w);
    expect(high.trackBox.h).toBe(high.contentRect.h);
  });

  it("supports a stacked normal variant without an inline row", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 280, 220, "normal", {
      normalVariant: "stacked"
    });

    expectRectInside(snapshot.out.trackBox, snapshot.contentRect);
    expectRectInside(snapshot.out.captionBox, snapshot.contentRect);
    expectRectInside(snapshot.out.valueBox, snapshot.contentRect);
    expect(snapshot.out.inlineBox).toBeNull();
    expect(snapshot.out.normalVariant).toBe("stacked");
    expect(snapshot.out.dualRowGap).toBeGreaterThanOrEqual(1);
  });

  it("supports a split high variant with ordered top and bottom text bands", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 120, 320, "high", {
      highVariant: "split"
    });

    expectRectInside(snapshot.out.textTopBox, snapshot.contentRect);
    expectRectInside(snapshot.out.trackBox, snapshot.contentRect);
    expectRectInside(snapshot.out.textBottomBox, snapshot.contentRect);
    expect(snapshot.out.captionBox).toBeNull();
    expect(snapshot.out.valueBox).toBeNull();
    expect(snapshot.out.inlineBox).toBeNull();
    expect(snapshot.out.highVariant).toBe("split");
    expect(snapshot.out.textTopBox.y + snapshot.out.textTopBox.h).toBeLessThanOrEqual(snapshot.out.trackBox.y);
    expect(snapshot.out.trackBox.y + snapshot.out.trackBox.h).toBeLessThanOrEqual(snapshot.out.textBottomBox.y);
  });

  it("compacts insets and text fill for smaller widgets", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 120, 80, "flat");
    const medium = buildSnapshot(layout, 160, 120, "normal");
    const large = buildSnapshot(layout, 260, 180, "normal");

    expect(compact.insets.pad).toBeLessThan(large.insets.pad);
    expect(compact.insets.gap).toBeLessThan(large.insets.gap);
    expect(compact.out.responsive.textFillScale).toBeGreaterThan(medium.out.responsive.textFillScale);
    expect(medium.out.responsive.textFillScale).toBeGreaterThan(large.out.responsive.textFillScale);
    expect(large.out.responsive.textFillScale).toBe(1);
  });

  it("splits caption and value rows without fixed pixel floors", function () {
    const layout = createLayout();
    const lowScale = layout.splitCaptionValueRows(
      { x: 0, y: 2, w: 40, h: 3 },
      { x: 0, y: 5, w: 40, h: 5 },
      0.5
    );
    const highScale = layout.splitCaptionValueRows(
      { x: 0, y: 2, w: 40, h: 3 },
      { x: 0, y: 5, w: 40, h: 5 },
      1.2
    );

    expect(lowScale.captionBox.h).toBeGreaterThan(0);
    expect(lowScale.valueBox.h).toBeGreaterThan(0);
    expect(highScale.captionBox.h).toBeGreaterThan(lowScale.captionBox.h);
    expect(lowScale.valueBox.y).toBe(lowScale.captionBox.y + lowScale.captionBox.h);
  });

  it("derives wind dual gaps from layout-owned compact spacing", function () {
    const layout = createLayout();
    const compactFlat = buildSnapshot(layout, 120, 80, "flat").out;
    const largeFlat = buildSnapshot(layout, 520, 140, "flat").out;
    const compactNormal = buildSnapshot(layout, 160, 120, "normal").out;
    const largeNormal = buildSnapshot(layout, 320, 180, "normal").out;

    expect(compactFlat.dualRowGap).toBeLessThan(largeFlat.dualRowGap);
    expect(compactNormal.inlineDualGap).toBeLessThan(largeNormal.inlineDualGap);
    expect(compactFlat.dualRowGap).toBeGreaterThanOrEqual(1);
    expect(compactNormal.inlineDualGap).toBeGreaterThanOrEqual(1);
  });

  it("exposes geometry values computed from the track-box primary dimension", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 280, 220, "normal").out;

    expect(snapshot.primaryDim).toBe(Math.max(1, Math.min(snapshot.trackBox.w, snapshot.trackBox.h)));
    expect(snapshot.trackLineWidth).toBeGreaterThanOrEqual(1);
    expect(snapshot.majorTickLen).toBeGreaterThanOrEqual(1);
    expect(snapshot.majorTickWidth).toBeGreaterThanOrEqual(1);
    expect(snapshot.minorTickLen).toBeGreaterThanOrEqual(1);
    expect(snapshot.minorTickWidth).toBeGreaterThanOrEqual(1);
    expect(snapshot.pointerDepth).toBeGreaterThanOrEqual(1);
    expect(snapshot.pointerSide).toBeGreaterThanOrEqual(1);
    expect(snapshot.trackThickness).toBeGreaterThanOrEqual(1);
    expect(snapshot.labelFontPx).toBeGreaterThanOrEqual(1);
    expect(snapshot.labelInsetPx).toBeGreaterThanOrEqual(1);
  });

  it("scales linear geometry from a reference primary dimension and respects preset weights", function () {
    const layout = createLayout();
    const gs = loadFresh("shared/widget-kits/layout/GeometryScale.js").create();
    const contentRect = { x: 34, y: 34, w: 232, h: 232 };

    const reference = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme(),
      gap: 0,
      contentRect: contentRect,
      responsive: { textFillScale: 1 }
    });

    expect(reference.trackBox.h).toBe(110);
    expect(reference.primaryDim).toBe(110);
    expect(reference.majorTickLen).toBe(gs.scale(reference.primaryDim, 0.109, gs.extentFloor(1)));
    expect(reference.majorTickWidth).toBe(gs.scaleStroke(reference.primaryDim, 0.027, 1, gs.strokeFloor(1)));
    expect(reference.minorTickLen).toBe(gs.scale(reference.primaryDim, 0.064, gs.extentFloor(1)));
    expect(reference.minorTickWidth).toBe(gs.scaleStroke(reference.primaryDim, 0.014, 1, gs.strokeFloor(1)));
    expect(reference.trackLineWidth).toBe(gs.scaleStroke(reference.primaryDim, 0.018, 1, gs.strokeFloor(1)));
    expect(reference.pointerDepth).toBe(26);
    expect(reference.pointerSide).toBe(13);

    const bold = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme({
        strokeWeight: 1.4,
        pointerDepthWeight: 1,
        pointerSideWeight: 1.54
      }),
      gap: 0,
      contentRect: contentRect,
      responsive: { textFillScale: 1 }
    });
    const slim = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme({
        strokeWeight: 0.67,
        pointerDepthWeight: 1,
        pointerSideWeight: 0.72
      }),
      gap: 0,
      contentRect: contentRect,
      responsive: { textFillScale: 1 }
    });

    expect(bold.trackLineWidth).toBe(3);
    expect(bold.majorTickWidth).toBe(4);
    expect(bold.pointerDepth).toBe(reference.pointerDepth);
    expect(bold.pointerSide).toBe(20);
    expect(slim.trackLineWidth).toBe(1);
    expect(slim.majorTickWidth).toBe(1);
    expect(slim.pointerDepth).toBe(reference.pointerDepth);
    expect(slim.pointerSide).toBe(9);
    expect(bold.pointerSide).toBeGreaterThan(reference.pointerSide);
    expect(reference.pointerSide).toBeGreaterThan(slim.pointerSide);

    const flatSmall = layout.computeLayout({
      W: 150,
      H: 80,
      mode: "flat",
      theme: createTheme(),
      gap: 0,
      contentRect: { x: 0, y: 0, w: 150, h: 80 },
      responsive: { textFillScale: 1 }
    });

    expect(flatSmall.primaryDim).toBe(80);
    expect(flatSmall.primaryDim).toBe(flatSmall.trackBox.h);
    expect(flatSmall.primaryDim).toBe(Math.min(flatSmall.trackBox.w, flatSmall.trackBox.h));
  });
});
