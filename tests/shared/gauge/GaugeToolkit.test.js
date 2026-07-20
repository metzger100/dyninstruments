const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("GaugeToolkit", function () {
  /** @param {any} setupCanvasResult @returns {any} */
  function create(setupCanvasResult) {
    const mod = loadFresh("shared/widget-kits/gauge/GaugeToolkit.js");
    const componentContext = createComponentContextMock({
      services: {
        canvas: {
          setupCanvas: function () {
            return setupCanvasResult;
          }
        }
      }
    });
    return mod.create({}, componentContext);
  }

  it("reports its own id and re-exports the resolved theme tokens", function () {
    const toolkit = create(null);

    expect(toolkit.id).toBe("GaugeToolkit");
    expect(toolkit.theme).toEqual(expect.objectContaining({ resolveForRoot: expect.any(Function) }));
  });

  it("exposes text and value component facades", function () {
    const toolkit = create(null);

    expect(typeof toolkit.text.drawValueUnitWithFit).toBe("function");
    expect(typeof toolkit.value.clamp).toBe("function");
  });

  it("resolveSurface returns null when canvas setup is unavailable", function () {
    const toolkit = create(null);

    expect(toolkit.resolveSurface({})).toBe(null);
  });

  it("resolveSurface returns null when setup is missing width, height, or context", function () {
    const toolkit = create({ W: 100, H: 0, ctx: {} });

    expect(toolkit.resolveSurface({})).toBe(null);
  });

  it("resolveSurface returns the setup result when width, height, and context are present", function () {
    const setup = { W: 100, H: 50, ctx: {} };
    const toolkit = create(setup);

    expect(toolkit.resolveSurface({})).toBe(setup);
  });
});
