// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("resolves ratio modes and required row correctly", function () {
    const renderer = createRenderer();
    const highMounted = mountCommitted(renderer, withSurfacePolicy(makeProps({ unit: "x" }), { mode: "dispatch" }), {
      shellSize: { width: 90, height: 200 }
    });
    const flatMounted = mountCommitted(renderer, withSurfacePolicy(makeProps({ unit: "x" }), { mode: "dispatch" }), {
      shellSize: { width: 460, height: 100 }
    });
    const requiredMounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ zoom: 12.2, requiredZoom: 0, captionUnitScale: 1.1 }), { mode: "dispatch" })
    );

    expect(highMounted.html()).toContain("dyni-map-zoom-mode-high");
    expect(flatMounted.html()).toContain("dyni-map-zoom-mode-flat");
    expect(requiredMounted.html()).toContain('class="dyni-map-zoom-required"');
    expect(requiredMounted.html()).toContain("(Z:0)");
    expect(requiredMounted.html()).toContain("--dyni-map-zoom-sec-scale:1.1;");
  });

  it("keeps null and blank zoom inputs missing instead of coercing them to zero", function () {
    const renderer = createRenderer();
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(
        makeProps({
          zoom: null,
          requiredZoom: "   "
        }),
        { mode: "dispatch" }
      )
    );

    expect(mounted.html()).toContain("---");
    expect(mounted.html()).not.toContain("Z:0");
    expect(mounted.html()).not.toContain("(Z:0)");
  });
});
