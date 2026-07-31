// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./MapZoomTextHtmlWidget-setup");

describe("MapZoomTextHtmlWidget", function () {
  it("normalizes placeholder formatter output to the shared default token", function () {
    const renderer = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDecimalOpt") {
          return "NO DATA";
        }
        return value === null || value === undefined ? cfg.default : String(value);
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ zoom: 12.2, requiredZoom: 11.9 }), {
        mode: "dispatch"
      })
    );

    expect(mounted.html()).toContain("---");
    expect(mounted.html()).not.toContain("NO DATA");
  });

  it("renders stable digits with tabular value classes and padded numbers", function () {
    const renderer = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value === null || value === undefined) {
          return cfg.default;
        }
        return String(value);
      }
    });
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ stableDigits: true, zoom: 7.2, requiredZoom: 6.5 }), { mode: "dispatch" })
    );

    expect(mounted.html()).toContain("dyni-map-zoom-value dyni-tabular");
    expect(mounted.html()).toContain("dyni-map-zoom-required dyni-tabular");
    expect(mounted.html()).toContain("07.2");
    expect(mounted.html()).toContain("(06.5)");
  });

  it("keeps default ratio-mode selection when ratio thresholds are null/blank", function () {
    const renderer = createRenderer();
    const baseProps = withSurfacePolicy(
      makeProps({
        ratioThresholdNormal: undefined,
        ratioThresholdFlat: undefined
      }),
      { mode: "dispatch" }
    );
    const nullProps = withSurfacePolicy(
      makeProps({
        ratioThresholdNormal: null,
        ratioThresholdFlat: null
      }),
      { mode: "dispatch" }
    );
    const blankProps = withSurfacePolicy(
      makeProps({
        ratioThresholdNormal: "   ",
        ratioThresholdFlat: ""
      }),
      { mode: "dispatch" }
    );

    const baseline = mountCommitted(renderer, baseProps).html();
    const nullHtml = mountCommitted(renderer, nullProps).html();
    const blankHtml = mountCommitted(renderer, blankProps).html();

    expect(baseline).toContain("dyni-map-zoom-mode-normal");
    expect(nullHtml).toContain("dyni-map-zoom-mode-normal");
    expect(blankHtml).toContain("dyni-map-zoom-mode-normal");
  });
});
