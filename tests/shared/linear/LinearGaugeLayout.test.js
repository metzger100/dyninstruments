const { loadFresh } = require("../../helpers/load-umd");

describe("LinearGaugeLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/linear/LinearGaugeLayout.js").create({}, {
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

  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  function buildSnapshot(layout, width, height, mode) {
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return {
      insets: insets,
      contentRect: contentRect,
      out: layout.computeLayout({
        W: width,
        H: height,
        mode: mode,
        gap: insets.gap,
        contentRect: contentRect,
        responsive: insets.responsive
      })
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(480, 120, 1.1, 3.5)).toBe("flat");
    expect(layout.computeMode(260, 220, 1.1, 3.5)).toBe("normal");
    expect(layout.computeMode(120, 320, 1.1, 3.5)).toBe("high");
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
});
