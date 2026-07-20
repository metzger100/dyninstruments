const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("LinearGaugeLayoutVariants", function () {
  function createVariants() {
    return loadFresh("shared/widget-kits/linear/LinearGaugeLayoutVariants.js").create(
      {},
      createComponentContextMock({
        modules: {
          LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js")
        }
      })
    );
  }

  function createProfileApi() {
    return loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js").create();
  }

  /** @param {{ x: number, y: number, w: number, h: number }} inner @param {{ x: number, y: number, w: number, h: number }} outer */
  function expectRectInside(inner, outer) {
    expect(inner.x).toBeGreaterThanOrEqual(outer.x);
    expect(inner.y).toBeGreaterThanOrEqual(outer.y);
    expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w);
    expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h);
  }

  it("computes a flat layout with side-by-side scale and text columns", function () {
    const variants = createVariants();
    const profileApi = createProfileApi();
    const contentRect = { x: 10, y: 10, w: 500, h: 120 };
    const responsive = profileApi.computeProfile(contentRect.w, contentRect.h, {});
    const right = contentRect.x + contentRect.w;

    const out = variants.computeFlatLayout(contentRect, right, 8, responsive, profileApi);

    expectRectInside(out.trackBox, contentRect);
    expectRectInside(out.captionBox, contentRect);
    expectRectInside(out.valueBox, contentRect);
    expect(out.inlineBox).toBeNull();
    expect(out.textTopBox).toBeNull();
    expect(out.textBottomBox).toBeNull();
    expect(out.dualRowGap).toBeGreaterThanOrEqual(1);
    expect(out.inlineDualGap).toBe(0);
    expect(out.valueBox.y).toBe(out.captionBox.y + out.captionBox.h);
  });

  it("computes a stacked layout with the scale above a caption/value column", function () {
    const variants = createVariants();
    const profileApi = createProfileApi();
    const contentRect = { x: 4, y: 4, w: 120, h: 320 };
    const responsive = profileApi.computeProfile(contentRect.w, contentRect.h, {});
    const bottom = contentRect.y + contentRect.h;

    const out = variants.computeStackedLayout(contentRect, bottom, 6, responsive, profileApi);

    expectRectInside(out.trackBox, contentRect);
    expectRectInside(out.captionBox, contentRect);
    expectRectInside(out.valueBox, contentRect);
    expect(out.inlineBox).toBeNull();
    expect(out.textTopBox).toBeNull();
    expect(out.textBottomBox).toBeNull();
    expect(out.valueBox.y).toBe(out.captionBox.y + out.captionBox.h);
  });

  it("computes a split-high layout with ordered top text, track, and bottom text bands", function () {
    const variants = createVariants();
    const contentRect = { x: 4, y: 4, w: 120, h: 320 };

    const out = variants.computeSplitHighLayout(contentRect, 6);

    expectRectInside(out.textTopBox, contentRect);
    expectRectInside(out.trackBox, contentRect);
    expectRectInside(out.textBottomBox, contentRect);
    expect(out.captionBox).toBeNull();
    expect(out.valueBox).toBeNull();
    expect(out.inlineBox).toBeNull();
    expect(out.textTopBox.y + out.textTopBox.h).toBeLessThanOrEqual(out.trackBox.y);
    expect(out.trackBox.y + out.trackBox.h).toBeLessThanOrEqual(out.textBottomBox.y);
  });

  it("computes graphics-only flat, normal, and high layouts spanning the full content rect", function () {
    const variants = createVariants();
    const contentRect = { x: 10, y: 10, w: 500, h: 120 };
    const right = contentRect.x + contentRect.w;

    const flat = variants.computeGraphicsOnlyFlatLayout(contentRect);
    const normal = variants.computeGraphicsOnlyNormalLayout(contentRect, right);
    const high = variants.computeGraphicsOnlyHighLayout(contentRect);

    [flat, normal, high].forEach(function (out) {
      expect(out.captionBox).toBeNull();
      expect(out.valueBox).toBeNull();
      expect(out.inlineBox).toBeNull();
      expect(out.textTopBox).toBeNull();
      expect(out.textBottomBox).toBeNull();
      expect(out.dualRowGap).toBe(0);
      expect(out.inlineDualGap).toBe(0);
      expect(out.trackY).toBe(contentRect.y + Math.floor(contentRect.h / 2));
    });

    expect(flat.trackBox.w).toBe(contentRect.w);
    expect(flat.trackBox.h).toBe(contentRect.h);
    expect(flat.scaleX0).toBe(contentRect.x);
    expect(flat.scaleX1).toBe(contentRect.x + contentRect.w);

    expect(normal.scaleX0).toBeGreaterThan(contentRect.x);
    expect(normal.scaleX1).toBeLessThan(contentRect.x + contentRect.w);

    expect(high.trackBox.w).toBe(contentRect.w);
    expect(high.trackBox.h).toBe(contentRect.h);
  });

  it("computes an inline layout with a bottom-anchored inline row", function () {
    const variants = createVariants();
    const profileApi = createProfileApi();
    const contentRect = { x: 10, y: 10, w: 280, h: 220 };
    const responsive = profileApi.computeProfile(contentRect.w, contentRect.h, {});
    const right = contentRect.x + contentRect.w;
    const bottom = contentRect.y + contentRect.h;

    const out = variants.computeInlineLayout(contentRect, right, bottom, 6, responsive, profileApi);

    expectRectInside(out.trackBox, contentRect);
    expectRectInside(out.inlineBox, contentRect);
    expect(out.captionBox).toBeNull();
    expect(out.valueBox).toBeNull();
    expect(out.dualRowGap).toBe(0);
    expect(out.inlineDualGap).toBeGreaterThanOrEqual(1);
    expect(out.inlineBox.y + out.inlineBox.h).toBe(bottom);
  });

  it("keeps every variant finite and non-empty for a minimum-size content rect", function () {
    const variants = createVariants();
    const profileApi = createProfileApi();
    const contentRect = { x: 0, y: 0, w: 1, h: 1 };
    const responsive = profileApi.computeProfile(1, 1, {});
    const layouts = [
      variants.computeFlatLayout(contentRect, 1, 8, responsive, profileApi),
      variants.computeStackedLayout(contentRect, 1, 8, responsive, profileApi),
      variants.computeSplitHighLayout(contentRect, 8),
      variants.computeGraphicsOnlyNormalLayout(contentRect, 1),
      variants.computeInlineLayout(contentRect, 1, 1, 8, responsive, profileApi)
    ];

    layouts.forEach(function (layout) {
      expect(layout.scaleX1).toBeGreaterThan(layout.scaleX0);
      expect(layout.trackBox.w).toBeGreaterThanOrEqual(1);
      expect(layout.trackBox.h).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(layout.trackY)).toBe(true);
    });
  });

  it("registers through both AMD and browser-global UMD branches", function () {
    /** @type {any} */
    let amdApi;
    const define = function (/** @type {any[]} */ dependencies, /** @type {() => any} */ factory) {
      expect(dependencies).toEqual([]);
      amdApi = factory();
    };
    define.amd = true;
    runIifeScript(
      "shared/widget-kits/linear/LinearGaugeLayoutVariants.js",
      createScriptContext({ define: define, __skipDefaultDyniComponents: true })
    );

    const browserContext = createScriptContext({ __skipDefaultDyniComponents: true });
    runIifeScript("shared/widget-kits/linear/LinearGaugeLayoutVariants.js", browserContext);

    expect(amdApi.id).toBe("LinearGaugeLayoutVariants");
    expect(browserContext.DyniComponents.DyniLinearGaugeLayoutVariants.id).toBe("LinearGaugeLayoutVariants");
  });
});
