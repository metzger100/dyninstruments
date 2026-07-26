// @ts-check
const { createRenderer, makeProps, mountCommitted, withSurfacePolicy } = require("./AisTargetTextHtmlWidget-setup");

describe("AisTargetTextHtmlWidget", function () {
  it("applies AIS hidden/disconnected precedence exception", function () {
    const hiddenMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: { hasTargetIdentity: false, hasDispatchMmsi: false }
        }),
        {
          pageId: "other",
          interactionMode: "dispatch"
        }
      )
    );
    expect(hiddenMounted.html()).toContain("dyni-state-hidden");
    expect(hiddenMounted.html()).not.toContain("GPS Lost");

    const disconnectedMounted = mountCommitted(
      createRenderer().renderer,
      withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: { hasTargetIdentity: false, hasDispatchMmsi: false }
        }),
        {
          pageId: "gpspage",
          interactionMode: "dispatch"
        }
      )
    );
    expect(disconnectedMounted.html()).toContain("dyni-state-disconnected");
    expect(disconnectedMounted.html()).toContain("GPS Lost");
  });
});
