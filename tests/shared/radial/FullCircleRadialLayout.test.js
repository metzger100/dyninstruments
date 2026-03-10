const { loadFresh } = require("../../helpers/load-umd");

describe("FullCircleRadialLayout", function () {
  const themeDefaults = {
    radial: {
      ring: { widthFactor: 0.35 },
      labels: {
        insetFactor: 2.1,
        fontFactor: 0.35
      }
    }
  };

  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/radial/FullCircleRadialLayout.js").create({}, {
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

  function buildSnapshot(layout, width, height, mode, layoutConfig) {
    const insets = layout.computeInsets(width, height);
    const out = layout.computeLayout({
      W: width,
      H: height,
      mode: mode,
      theme: themeDefaults,
      insets: insets,
      responsive: insets.responsive,
      layoutConfig: layoutConfig
    });
    return { insets: insets, out: out };
  }

  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(520, 120, 0.8, 2.2)).toBe("flat");
    expect(layout.computeMode(240, 220, 0.8, 2.2)).toBe("normal");
    expect(layout.computeMode(120, 280, 0.8, 2.2)).toBe("high");
  });

  it("uses structural fallback thresholds only when explicit thresholds are absent", function () {
    const layout = createLayout();

    expect(layout.computeMode(260, 220, 1.2, 2.4)).toBe("high");
    expect(layout.computeMode(260, 220, undefined, undefined)).toBe("normal");
    expect(layout.computeMode(420, 200, undefined, undefined)).toBe("flat");
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

  it("keeps dial geometry and mode slots inside the padded content rect", function () {
    const layout = createLayout();
    const flat = buildSnapshot(layout, 520, 140, "flat").out;
    const high = buildSnapshot(layout, 140, 320, "high", { highTopFactor: 0.9, highBottomFactor: 0.9 }).out;

    expect(flat.geom.cx - flat.geom.rOuter).toBeGreaterThanOrEqual(flat.contentRect.x);
    expect(flat.geom.cy - flat.geom.rOuter).toBeGreaterThanOrEqual(flat.contentRect.y);
    expect(flat.geom.cx + flat.geom.rOuter).toBeLessThanOrEqual(flat.contentRect.x + flat.contentRect.w);
    expect(flat.geom.cy + flat.geom.rOuter).toBeLessThanOrEqual(flat.contentRect.y + flat.contentRect.h);
    expectRectInside(flat.slots.leftTop, flat.contentRect);
    expectRectInside(flat.slots.leftBottom, flat.contentRect);
    expectRectInside(flat.slots.rightTop, flat.contentRect);
    expectRectInside(flat.slots.rightBottom, flat.contentRect);
    expectRectInside(high.slots.top, high.contentRect);
    expectRectInside(high.slots.bottom, high.contentRect);
  });

  it("compacts label and marker geometry while keeping normal-mode bounds valid", function () {
    const layout = createLayout();
    const compact = buildSnapshot(layout, 160, 120, "normal").out;
    const large = buildSnapshot(layout, 360, 280, "normal").out;

    expect(compact.labels.radiusOffset).toBeLessThan(large.labels.radiusOffset);
    expect(compact.labels.fontPx).toBeLessThan(large.labels.fontPx);
    expect(compact.labels.spriteRadius).toBeGreaterThan(0);
    expect(compact.geom.markerLen).toBeGreaterThan(0);
    expect(compact.geom.markerWidth).toBeGreaterThan(0);
    expect(compact.normal.safeRadius).toBeGreaterThan(0);
    expect(compact.normal.dualCompactInset).toBeGreaterThan(0);
  });
});
