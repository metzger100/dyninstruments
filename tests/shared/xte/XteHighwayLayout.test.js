const { loadFresh } = require("../../helpers/load-umd");

describe("XteHighwayLayout", function () {
  function createLayout() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    return loadFresh("shared/widget-kits/xte/XteHighwayLayout.js").create({}, {
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

  function buildSnapshot(layout, width, height, mode, reserveNameSpace) {
    const insets = layout.computeInsets(width, height);
    const contentRect = layout.createContentRect(width, height, insets);
    return {
      insets: insets,
      contentRect: contentRect,
      out: layout.computeLayout({
        contentRect: contentRect,
        gap: insets.gap,
        mode: mode,
        reserveNameSpace: reserveNameSpace,
        responsive: insets.responsive
      })
    };
  }

  it("selects flat, normal, and high modes from aspect ratio", function () {
    const layout = createLayout();

    expect(layout.computeMode(480, 120, 0.85, 2.3)).toBe("flat");
    expect(layout.computeMode(220, 220, 0.85, 2.3)).toBe("normal");
    expect(layout.computeMode(120, 300, 0.85, 2.3)).toBe("high");
  });

  it("keeps flat, normal, and high geometry inside the content rect", function () {
    const layout = createLayout();
    const cases = [
      { width: 480, height: 120, mode: "flat", reserveNameSpace: true },
      { width: 220, height: 220, mode: "normal", reserveNameSpace: true },
      { width: 120, height: 300, mode: "high", reserveNameSpace: true }
    ];

    cases.forEach((testCase) => {
      const snapshot = buildSnapshot(layout, testCase.width, testCase.height, testCase.mode, testCase.reserveNameSpace);
      expectRectInside(snapshot.out.highway, snapshot.contentRect);
      expectRectInside(snapshot.out.nameRect, snapshot.contentRect);
      Object.keys(snapshot.out.metricRects).forEach((key) => {
        expectRectInside(snapshot.out.metricRects[key], snapshot.contentRect);
      });
    });
  });

  it("reclaims flat header space for metric rows when waypoint name is disabled", function () {
    const layout = createLayout();
    const withName = buildSnapshot(layout, 480, 120, "flat", true).out;
    const withoutName = buildSnapshot(layout, 480, 120, "flat", false).out;

    expect(withName.mode).toBe("flat");
    expect(withoutName.mode).toBe("flat");
    expect(withoutName.metricRects.cog.y).toBeLessThan(withName.metricRects.cog.y);
    expect(withoutName.metricRects.cog.h).toBeGreaterThan(withName.metricRects.cog.h);
  });

  it("compacts flat highway share and normal name height on smaller widgets", function () {
    const layout = createLayout();
    const compactFlat = buildSnapshot(layout, 220, 80, "flat", true);
    const largeFlat = buildSnapshot(layout, 520, 180, "flat", true);
    const compactNormal = buildSnapshot(layout, 161, 80, "normal", true);
    const largeNormal = buildSnapshot(layout, 520, 260, "normal", true);

    expect(compactFlat.out.highway.w / compactFlat.contentRect.w).toBeLessThan(
      largeFlat.out.highway.w / largeFlat.contentRect.w
    );
    expect(compactNormal.out.nameRect.h / compactNormal.out.highway.h).toBeLessThan(
      largeNormal.out.nameRect.h / largeNormal.out.highway.h
    );
    expect(compactNormal.out.responsive.textFillScale).toBeGreaterThan(largeNormal.out.responsive.textFillScale);
  });

  it("keeps high-mode metric columns balanced", function () {
    const layout = createLayout();
    const snapshot = buildSnapshot(layout, 120, 300, "high", true).out;

    expect(snapshot.metricRects.cog.w).toBe(snapshot.metricRects.btw.w);
    expect(snapshot.metricRects.xte.w).toBe(snapshot.metricRects.dtw.w);
    expect(snapshot.metricRects.cog.h).toBe(snapshot.nameRect.h);
  });
});
