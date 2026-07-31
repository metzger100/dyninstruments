// @ts-check
const {
  createRenderer,
  makeProps,
  mountCommitted,
  readInlinePx,
  withSurfacePolicy
} = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("updates emitted accent strip width when shell width changes at the same height", function () {
    const renderer = createRenderer().renderer;
    const props = withSurfacePolicy(
      makeProps({
        domain: {
          hasColorRole: true,
          colorRole: "warning"
        }
      }),
      {
        interactionMode: "dispatch"
      }
    );
    const narrowMounted = mountCommitted(renderer, props, {
      shellSize: { width: 180, height: 100 }
    });
    const wideMounted = mountCommitted(renderer, props, {
      shellSize: { width: 320, height: 100 }
    });
    const narrowAccent = narrowMounted.mountEl.querySelector(".dyni-ais-target-state-accent");
    const wideAccent = wideMounted.mountEl.querySelector(".dyni-ais-target-state-accent");
    const narrowWidth = readInlinePx(narrowAccent instanceof HTMLElement ? narrowAccent.style.width : "");
    const wideWidth = readInlinePx(wideAccent instanceof HTMLElement ? wideAccent.style.width : "");
    const narrowRadius = readInlinePx(narrowAccent instanceof HTMLElement ? narrowAccent.style.borderRadius : "");
    const wideRadius = readInlinePx(wideAccent instanceof HTMLElement ? wideAccent.style.borderRadius : "");

    expect(narrowAccent).toBeTruthy();
    expect(wideAccent).toBeTruthy();
    expect(wideWidth).toBeGreaterThan(narrowWidth);
    expect(narrowRadius).toBe(narrowWidth);
    expect(wideRadius).toBe(wideWidth);
  });
});
