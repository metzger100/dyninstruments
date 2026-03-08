const { loadFresh } = require("../../helpers/load-umd");

describe("CenterDisplayLayout", function () {
  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  it("keeps compact normal-mode panels and rows inside the content rect", function () {
    const layout = loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create();
    const cases = [
      { width: 120, height: 60, relationCount: 2 },
      { width: 120, height: 80, relationCount: 3 },
      { width: 140, height: 90, relationCount: 3 }
    ];

    cases.forEach((testCase) => {
      const insets = layout.computeInsets(testCase.width, testCase.height);
      const contentRect = layout.createContentRect(testCase.width, testCase.height, insets);
      const out = layout.computeLayout({
        contentRect: contentRect,
        mode: "normal",
        relationCount: testCase.relationCount,
        gap: insets.gap,
        normalCaptionShare: 0.28
      });

      expectRectInside(out.center.rect, contentRect);
      expectRectInside(out.center.captionRect, out.center.rect);
      expectRectInside(out.center.latRect, out.center.rect);
      expectRectInside(out.center.lonRect, out.center.rect);
      out.rowRects.forEach((rect, index) => {
        expectRectInside(rect, contentRect);
        expect(rect.h).toBeGreaterThanOrEqual(Math.floor(contentRect.h * 0.12));
        if (index > 0) {
          expect(rect.y).toBeGreaterThan(out.rowRects[index - 1].y);
        }
      });
    });
  });

  it("scales compact row heights with available space and row count", function () {
    const layout = loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create();
    const smallInsets = layout.computeInsets(120, 60);
    const tallInsets = layout.computeInsets(120, 80);
    const smallContent = layout.createContentRect(120, 60, smallInsets);
    const tallContent = layout.createContentRect(120, 80, tallInsets);
    const compactThreeRows = layout.computeLayout({
      contentRect: smallContent,
      mode: "normal",
      relationCount: 3,
      gap: smallInsets.gap,
      normalCaptionShare: 0.28
    });
    const tallerThreeRows = layout.computeLayout({
      contentRect: tallContent,
      mode: "normal",
      relationCount: 3,
      gap: tallInsets.gap,
      normalCaptionShare: 0.28
    });
    const tallerTwoRows = layout.computeLayout({
      contentRect: tallContent,
      mode: "normal",
      relationCount: 2,
      gap: tallInsets.gap,
      normalCaptionShare: 0.28
    });

    expect(tallerThreeRows.rowRects[0].h).toBeGreaterThan(compactThreeRows.rowRects[0].h);
    expect(tallerTwoRows.rowRects[0].h).toBeGreaterThan(tallerThreeRows.rowRects[0].h);
  });

  it("compresses top-band spacing more aggressively on compact normal tiles", function () {
    const layout = loadFresh("shared/widget-kits/nav/CenterDisplayLayout.js").create();
    const compactInsets = layout.computeInsets(120, 60);
    const largeInsets = layout.computeInsets(260, 180);
    const compactContent = layout.createContentRect(120, 60, compactInsets);
    const largeContent = layout.createContentRect(260, 180, largeInsets);
    const compact = layout.computeLayout({
      contentRect: compactContent,
      mode: "normal",
      relationCount: 2,
      gap: compactInsets.gap,
      normalCaptionShare: 0.28
    });
    const large = layout.computeLayout({
      contentRect: largeContent,
      mode: "normal",
      relationCount: 2,
      gap: largeInsets.gap,
      normalCaptionShare: 0.28
    });
    const compactTopGap = compact.rowRects[0].y - (compact.center.rect.y + compact.center.rect.h);
    const largeTopGap = large.rowRects[0].y - (large.center.rect.y + large.center.rect.h);

    expect(compactTopGap).toBeLessThan(largeTopGap);
    expect(compact.center.rect.h / compactContent.h).toBeLessThan(large.center.rect.h / largeContent.h);
  });
});
