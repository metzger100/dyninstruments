const { loadFresh } = require("../../helpers/load-umd");

describe("SemicircleRadialLayout", function () {
  const themeDefaults = {
    radial: {
      ring: { widthFactor: 0.18 },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      }
    }
  };

  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/SemicircleRadialLayout.js").create({}, {
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
    const out = layout.computeLayout({
      W: width,
      H: height,
      mode: mode,
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive
    });
    return {
      insets: insets,
      out: out
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(480, 120, 1.1, 3.5)).toBe("flat");
    expect(layout.computeMode(240, 180, 1.1, 3.5)).toBe("normal");
    expect(layout.computeMode(120, 240, 1.1, 3.5)).toBe("high");
  });

  it("uses structural fallback thresholds only when explicit thresholds are absent", function () {
    const layout = createLayout();

    expect(layout.computeMode(260, 220, 1.2, 2.8)).toBe("high");
    expect(layout.computeMode(260, 220, undefined, undefined)).toBe("normal");
    expect(layout.computeMode(520, 160, undefined, undefined)).toBe("flat");
    expect(layout.computeMode(120, 320, undefined, undefined)).toBe("high");
  });

  it("derives compact insets and text fill from the shared responsive profile", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 120, 80, "flat");
    const medium = buildSnapshot(layout, 180, 120, "normal");
    const large = buildSnapshot(layout, 300, 220, "normal");

    expect(compact.insets.pad).toBeLessThan(large.insets.pad);
    expect(compact.insets.gap).toBeLessThan(large.insets.gap);
    expect(compact.out.responsive.textFillScale).toBeGreaterThan(medium.out.responsive.textFillScale);
    expect(medium.out.responsive.textFillScale).toBeGreaterThan(large.out.responsive.textFillScale);
    expect(large.out.textFillScale).toBe(1);
  });

  it("keeps flat and high text boxes inside the padded content rect", function () {
    const layout = createLayout();
    const flat = buildSnapshot(layout, 260, 90, "flat").out;
    const high = buildSnapshot(layout, 130, 220, "high").out;

    expectRectInside(flat.flat.box, flat.contentRect);
    expectRectInside(flat.flat.topBox, flat.flat.box);
    expectRectInside(flat.flat.bottomBox, flat.flat.box);
    expectRectInside(high.high.bandBox, high.contentRect);
  });

  it("tightens label spacing for compact layouts without leaving the content rect", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 200, 120, "normal").out;
    const large = buildSnapshot(layout, 420, 240, "normal").out;

    expect(compact.labels.radiusOffset).toBeLessThan(large.labels.radiusOffset);
    expect(compact.labels.fontPx).toBeLessThan(large.labels.fontPx);
    expect(compact.normal.rSafe).toBeGreaterThan(0);
    expect(compact.normal.yBottom).toBeGreaterThanOrEqual(compact.contentRect.y);
    expect(compact.normal.yBottom).toBeLessThanOrEqual(compact.contentRect.y + compact.contentRect.h);
  });
});
