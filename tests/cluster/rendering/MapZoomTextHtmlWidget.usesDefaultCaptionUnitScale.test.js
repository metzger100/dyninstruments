// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("uses default caption-unit scale for null and blank values and keeps numeric-string clamping", function () {
    const renderer = createRenderer();
    const missingValues = [null, undefined, "", "   "];

    missingValues.forEach(function (rawScale) {
      const mounted = mountCommitted(
        renderer,
        withSurfacePolicy(
          makeProps({
            captionUnitScale: rawScale
          }),
          { mode: "dispatch" }
        )
      );
      expect(mounted.html()).toContain("--dyni-map-zoom-sec-scale:0.8;");
      expect(mounted.html()).not.toContain("--dyni-map-zoom-sec-scale:0.5;");
    });

    const numericStringMounted = mountCommitted(
      renderer,
      withSurfacePolicy(
        makeProps({
          captionUnitScale: "1.2"
        }),
        { mode: "dispatch" }
      )
    );
    expect(numericStringMounted.html()).toContain("--dyni-map-zoom-sec-scale:1.2;");

    const maxClampMounted = mountCommitted(
      renderer,
      withSurfacePolicy(
        makeProps({
          captionUnitScale: "9"
        }),
        { mode: "dispatch" }
      )
    );
    expect(maxClampMounted.html()).toContain("--dyni-map-zoom-sec-scale:1.5;");
  });
});
