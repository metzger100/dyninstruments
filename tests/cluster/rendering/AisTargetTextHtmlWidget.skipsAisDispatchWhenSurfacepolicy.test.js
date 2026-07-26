// @ts-check
const {
  createRenderer,
  makeProps,
  mountCommitted,
  withSurfacePolicyBadShowInfo,
  withSurfacePolicyNoAisAction
} = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("skips ais dispatch when surfacePolicy has no ais action entry", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicyNoAisAction(makeProps(), { interactionMode: "dispatch" })
    );

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });

  it("skips ais dispatch when showInfo is not a function", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(setup.renderer, withSurfacePolicyBadShowInfo(makeProps()));

    const wrapper = mounted.mountEl.querySelector(".dyni-ais-target-html");
    // @ts-ignore -- pre-existing untyped test mock boundary
    expect(() => wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))).not.toThrow();
  });
});
