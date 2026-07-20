const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("LayoutSizingHelpers", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/layout/LayoutSizingHelpers.js").create();
  }

  /** @param {number} x @param {number} y @param {number} w @param {number} h @returns {any} */
  function makeRect(x, y, w, h) {
    return { x: x, y: y, w: w, h: h };
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/layout/LayoutSizingHelpers.js", context);

    expect(context.DyniComponents.DyniLayoutSizingHelpers).toBeTruthy();
    expect(context.DyniComponents.DyniLayoutSizingHelpers.id).toBe("LayoutSizingHelpers");
  });

  it("createInsetContentRectFactory insets width/height by the configured padding keys", function () {
    const api = createApi();
    const createInsetContentRect = api.createInsetContentRectFactory(makeRect, "padX", "padY");

    expect(createInsetContentRect(100, 60, { padX: 10, padY: 5 })).toEqual({
      x: 10,
      y: 5,
      w: 80,
      h: 50
    });
  });

  it("createInsetContentRectFactory treats missing insets, negative padding, and non-numeric W/H as zero/defaults", function () {
    const api = createApi();
    const createInsetContentRect = api.createInsetContentRectFactory(makeRect, "padX", "padY");

    expect(createInsetContentRect(100, 60)).toEqual({ x: 0, y: 0, w: 100, h: 60 });
    expect(createInsetContentRect(100, 60, { padX: -5, padY: -5 })).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 60
    });
    expect(createInsetContentRect(undefined, undefined, {})).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
  });

  it("createInsetContentRectFactory clamps the content rect to a minimum of one pixel when padding exceeds the dimension", function () {
    const api = createApi();
    const createInsetContentRect = api.createInsetContentRectFactory(makeRect, "padX", "padY");

    expect(createInsetContentRect(10, 10, { padX: 20, padY: 20 })).toEqual({
      x: 20,
      y: 20,
      w: 1,
      h: 1
    });
  });

  it("createMetricTileSpacingFactory delegates to profileApi.computeIntrinsicTileSpacing with the configured ratios", function () {
    const api = createApi();
    const profileApi = { computeIntrinsicTileSpacing: vi.fn(() => ({ padPx: 4, captionPx: 6 })) };
    const computeMetricTileSpacing = api.createMetricTileSpacingFactory(profileApi, 0.05, 0.1);
    const rect = { w: 100, h: 50 };
    const responsive = { compactLevel: 1 };

    const result = computeMetricTileSpacing(rect, responsive);

    expect(profileApi.computeIntrinsicTileSpacing).toHaveBeenCalledWith(responsive, rect, 0.05, 0.1);
    expect(result).toEqual({ padPx: 4, captionPx: 6 });
  });
});
