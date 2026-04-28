const { loadFresh } = require("../../helpers/load-umd");

describe("SemicircleRadialLayout", function () {
  const themeDefaults = {
    radial: {
      ticks: {
        majorLenFactor: 0.08,
        majorWidthFactor: 0.02,
        minorLenFactor: 0.047,
        minorWidthFactor: 0.01
      },
      pointer: {
        depthFactor: 0.22,
        sideFactor: 0.11
      },
      ring: { widthFactor: 0.18, arcLineWidthFactor: 0.013 },
      labels: {
        insetFactor: 2.2,
        fontFactor: 0.2
      }
    },
    strokeWeight: 1,
    pointerDepthWeight: 1,
    pointerSideWeight: 1
  };

  const geometryScale = loadFresh("shared/widget-kits/layout/GeometryScale.js");

  function createTheme(overrides) {
    const extra = overrides || {};
    return {
      radial: {
        ticks: Object.assign({
          majorLenFactor: 0.08,
          majorWidthFactor: 0.02,
          minorLenFactor: 0.047,
          minorWidthFactor: 0.01
        }, extra.radial && extra.radial.ticks ? extra.radial.ticks : {}),
        pointer: Object.assign({
          depthFactor: 0.22,
          sideFactor: 0.11
        }, extra.radial && extra.radial.pointer ? extra.radial.pointer : {}),
        ring: Object.assign({
          widthFactor: 0.18,
          arcLineWidthFactor: 0.013
        }, extra.radial && extra.radial.ring ? extra.radial.ring : {}),
        labels: Object.assign({
          insetFactor: 2.2,
          fontFactor: 0.2
        }, extra.radial && extra.radial.labels ? extra.radial.labels : {})
      },
      strokeWeight: Object.prototype.hasOwnProperty.call(extra, "strokeWeight") ? extra.strokeWeight : 1,
      pointerDepthWeight: Object.prototype.hasOwnProperty.call(extra, "pointerDepthWeight") ? extra.pointerDepthWeight : 1,
      pointerSideWeight: Object.prototype.hasOwnProperty.call(extra, "pointerSideWeight") ? extra.pointerSideWeight : 1
    };
  }

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
        if (id === "GeometryScale") {
          return geometryScale;
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

  it("scales semicircle graphical geometry through GeometryScale and exposes the precomputed dimensions", function () {
    const layout = createLayout();
    const gs = geometryScale.create();
    const snapshot = buildSnapshot(layout, 300, 180, "normal").out;
    const geom = snapshot.geom;
    const sFloor = gs.strokeFloor(themeDefaults.strokeWeight);
    const eFloor = gs.extentFloor(themeDefaults.strokeWeight);

    expect(geom.majorTickLen).toBe(gs.scale(geom.R, themeDefaults.radial.ticks.majorLenFactor, eFloor));
    expect(geom.majorTickWidth).toBe(gs.scaleStroke(geom.R, themeDefaults.radial.ticks.majorWidthFactor, themeDefaults.strokeWeight, sFloor));
    expect(geom.minorTickLen).toBe(gs.scale(geom.R, themeDefaults.radial.ticks.minorLenFactor, eFloor));
    expect(geom.minorTickWidth).toBe(gs.scaleStroke(geom.R, themeDefaults.radial.ticks.minorWidthFactor, themeDefaults.strokeWeight, sFloor));
    expect(geom.arcLineWidth).toBe(gs.scaleStroke(geom.R, themeDefaults.radial.ring.arcLineWidthFactor, themeDefaults.strokeWeight, sFloor));
    expect(geom.pointerDepth).toBe(gs.scalePointer(geom.R, themeDefaults.radial.pointer.depthFactor, themeDefaults.pointerDepthWeight, eFloor));
    expect(geom.pointerSide).toBe(gs.scalePointer(geom.R, themeDefaults.radial.pointer.sideFactor, themeDefaults.pointerSideWeight, eFloor));
    expect(geom).not.toHaveProperty("needleDepth");
  });

  it("keeps radial geometry proportional to the radius and preset weights", function () {
    const layout = createLayout();
    const sizes = [300, 600, 150, 100];
    const geoms = sizes.map(function (size) {
      return layout.computeLayout({
        W: size,
        H: size,
        mode: "normal",
        theme: createTheme(),
        insets: {
          pad: 0,
          gap: 0,
          responsive: {
            textFillScale: 1
          }
        },
        responsive: {
          textFillScale: 1
        }
      }).geom;
    });

    expect(geoms[0].R).toBe(150);
    expect(geoms[0].majorTickLen).toBe(12);
    expect(geoms[0].majorTickWidth).toBe(3);
    expect(geoms[0].minorTickLen).toBe(7);
    expect(geoms[0].minorTickWidth).toBe(2);
    expect(geoms[1].R).toBe(300);
    expect(geoms[1].majorTickLen).toBe(24);
    expect(geoms[1].majorTickWidth).toBe(6);
    expect(geoms[2].R).toBe(75);
    expect(geoms[2].majorTickLen).toBe(6);
    expect(geoms[2].majorTickWidth).toBe(2);
    expect(geoms[3].R).toBe(50);
    expect(geoms[3].majorTickLen).toBeGreaterThanOrEqual(3);
    expect(geoms[3].majorTickWidth).toBeGreaterThanOrEqual(2);
    expect(geoms[3].minorTickLen).toBeGreaterThanOrEqual(3);
    expect(geoms[3].minorTickWidth).toBeGreaterThanOrEqual(2);

    sizes.forEach(function (_size, idx) {
      expect(geoms[idx].majorTickLen / geoms[idx].R).toBeCloseTo(0.08, 6);
    });
    expect(geoms[0].majorTickLen / geoms[0].R).toBeCloseTo(geoms[1].majorTickLen / geoms[1].R, 6);
    expect(geoms[1].majorTickLen / geoms[1].R).toBeCloseTo(geoms[2].majorTickLen / geoms[2].R, 6);
    expect(geoms[2].majorTickLen / geoms[2].R).toBeCloseTo(geoms[3].majorTickLen / geoms[3].R, 6);

    const bold = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme({
        strokeWeight: 1.4,
        pointerDepthWeight: 1,
        pointerSideWeight: 1.54
      }),
      insets: {
        pad: 0,
        gap: 0,
        responsive: {
          textFillScale: 1
        }
      },
      responsive: {
        textFillScale: 1
      }
    }).geom;
    const slim = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme({
        strokeWeight: 0.67,
        pointerDepthWeight: 1,
        pointerSideWeight: 0.72
      }),
      insets: {
        pad: 0,
        gap: 0,
        responsive: {
          textFillScale: 1
        }
      },
      responsive: {
        textFillScale: 1
      }
    }).geom;
    const highcontrast = layout.computeLayout({
      W: 300,
      H: 300,
      mode: "normal",
      theme: createTheme({
        strokeWeight: 1.35,
        pointerDepthWeight: 1,
        pointerSideWeight: 1.4
      }),
      insets: {
        pad: 0,
        gap: 0,
        responsive: {
          textFillScale: 1
        }
      },
      responsive: {
        textFillScale: 1
      }
    }).geom;

    expect(bold.majorTickWidth).toBe(4);
    expect(slim.majorTickWidth).toBe(2);
    expect(highcontrast.minorTickWidth).toBe(3);
    expect(geoms[0].pointerDepth).toBe(bold.pointerDepth);
    expect(geoms[0].pointerDepth).toBe(slim.pointerDepth);
    expect(geoms[0].pointerDepth).toBe(highcontrast.pointerDepth);
    expect(bold.pointerSide).toBeGreaterThan(geoms[0].pointerSide);
    expect(geoms[0].pointerSide).toBeGreaterThan(slim.pointerSide);
  });
});
