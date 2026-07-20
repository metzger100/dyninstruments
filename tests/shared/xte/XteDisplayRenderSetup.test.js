const { loadFresh } = require("../../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteDisplayRenderSetup", function () {
  function create() {
    return loadFresh("shared/widget-kits/xte/XteDisplayRenderSetup.js").create();
  }

  /** @param {Record<string, any>} [overrides] */
  function makeArgs(overrides) {
    const ctx = createMockContext2D();
    const canvas = createMockCanvas({ rectWidth: 200, rectHeight: 80, ctx: ctx });
    const componentContext = {
      canvas: {
        setupCanvas() {
          return { ctx: ctx, W: 200, H: 80 };
        }
      },
      dom: {
        requirePluginRoot(/** @type {any} */ target) {
          return target;
        }
      }
    };
    const toolkit = {
      theme: {
        resolveForRoot() {
          return { name: "theme" };
        }
      }
    };
    const calls = { drawStateScreen: /** @type {any[]} */ ([]) };
    const base = {
      componentContext: componentContext,
      toolkit: toolkit,
      canvas: canvas,
      props: { stableDigits: false },
      resolveThemeView(/** @type {any} */ theme, /** @type {any} */ stableDigitsEnabled) {
        return {
          family: "sans-serif",
          labelWeight: 700,
          stableDigitsEnabled: stableDigitsEnabled,
          theme: theme
        };
      },
      resolveStateKind() {
        return "data";
      },
      stateScreenLabels: { KINDS: { DATA: "data" } },
      stateScreenCanvasOverlay: {
        drawStateScreen(/** @type {any} */ drawArgs) {
          calls.drawStateScreen.push(drawArgs);
        }
      },
      stateScreenColor() {
        return "#ffffff";
      }
    };
    return Object.assign({}, base, overrides || {}, { calls: calls, ctx: ctx });
  }

  it("returns null when canvas setup fails", function () {
    const api = create();
    const args = makeArgs({
      componentContext: {
        canvas: {
          setupCanvas() {
            return null;
          }
        },
        dom: { requirePluginRoot: (/** @type {any} */ t) => t }
      }
    });

    expect(api.resolveRenderSetup(args)).toBeNull();
  });

  it("returns null when the canvas has zero width or height", function () {
    const api = create();
    const args = makeArgs({
      componentContext: {
        canvas: {
          setupCanvas() {
            return { ctx: createMockContext2D(), W: 0, H: 80 };
          }
        },
        dom: { requirePluginRoot: (/** @type {any} */ t) => t }
      }
    });

    expect(api.resolveRenderSetup(args)).toBeNull();
  });

  it("clears the canvas and returns ctx/W/H/theme/themeView for the data state", function () {
    const api = create();
    const args = makeArgs();

    const result = api.resolveRenderSetup(args);

    expect(result).not.toBeNull();
    expect(result.W).toBe(200);
    expect(result.H).toBe(80);
    expect(result.theme).toEqual({ name: "theme" });
    expect(result.themeView.family).toBe("sans-serif");
    expect(args.ctx.calls.some((/** @type {any} */ c) => c.name === "clearRect")).toBe(true);
    expect(args.calls.drawStateScreen).toHaveLength(0);
  });

  it("draws the state screen and returns null for a non-data state kind", function () {
    const api = create();
    const args = makeArgs({
      resolveStateKind() {
        return "disconnected";
      }
    });

    const result = api.resolveRenderSetup(args);

    expect(result).toBeNull();
    expect(args.calls.drawStateScreen).toHaveLength(1);
    expect(args.calls.drawStateScreen[0].kind).toBe("disconnected");
    expect(args.calls.drawStateScreen[0].color).toBe("#ffffff");
  });
});
