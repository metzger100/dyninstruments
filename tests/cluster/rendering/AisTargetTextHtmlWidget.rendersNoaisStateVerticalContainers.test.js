// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("renders noAis state for vertical containers outside gpspage when identity is missing", function () {
    const mounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        {
          pageId: "other",
          containerOrientation: "vertical",
          interactionMode: "passive"
        }
      ),
      { shellSize: { width: 220, height: 300 } }
    );

    expect(mounted.html()).toContain("dyni-state-no-ais");
    expect(mounted.html()).toContain("No AIS");
    expect(mounted.html()).not.toContain("dyni-state-hidden");
  });

  it("renders stableDigits metric values with tabular classes", function () {
    const renderer = createRenderer({
      /** @param {unknown} value @param {{ default?: unknown }} [formatterOptions] */
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value === null || value === undefined) {
          return cfg.default;
        }
        return String(value);
      }
    }).renderer;
    const mounted = mountCommitted(
      renderer,
      withSurfacePolicy(makeProps({ stableDigits: true }), {
        interactionMode: "dispatch"
      })
    );

    expect(mounted.html()).toContain("dyni-ais-target-metric-value-text dyni-tabular");
    expect(mounted.html()).toContain("04.2");
    expect(mounted.html()).toContain("00.7");
  });
});
