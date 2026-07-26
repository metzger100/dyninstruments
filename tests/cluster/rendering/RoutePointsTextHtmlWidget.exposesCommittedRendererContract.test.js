// @ts-check
const { createRenderer } = require("./RoutePointsTextHtmlWidget-setup");

describe("RoutePointsTextHtmlWidget", function () {
  it("exposes committed renderer contract", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("RoutePointsTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
  });
});
