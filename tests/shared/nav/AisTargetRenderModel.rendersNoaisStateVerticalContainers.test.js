// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./AisTargetRenderModel-setup");

describe("AisTargetRenderModel", function () {
  it("renders noAis state for vertical containers outside gpspage when identity is missing", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        { pageId: "navpage", mode: "dispatch", orientation: "vertical" }
      ),
      shellRect: { width: 220, height: 300 },
      mode: "normal",
      isVerticalCommitted: true
    });

    expect(model.kind).toBe("noAis");
    expect(model.stateLabel).toBe("No AIS");
    expect(model.wrapperClasses).toContain("dyni-ais-target-html");
    expect(model.wrapperClasses).not.toContain("dyni-state-hidden");
  });

  it("keeps hidden before disconnected outside gpspage and shows disconnected on gpspage", function () {
    const setup = createRenderModel();
    const hidden = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        { pageId: "other", mode: "dispatch" }
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });
    const disconnected = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false
          }
        }),
        { pageId: "gpspage", mode: "dispatch" }
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(hidden.kind).toBe("hidden");
    expect(disconnected.kind).toBe("disconnected");
    expect(disconnected.stateLabel).toBe("GPS Lost");
  });

  it("forces passive interaction in editing mode even when dispatch capability exists", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ editing: true }), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("data");
    expect(model.interactionState).toBe("passive");
    expect(model.captureClicks).toBe(false);
    expect(model.showHotspot).toBe(false);
  });

  it("uses tcpa decimal precision 0 when absolute tcpa exceeds 60 seconds", function () {
    const setup = createRenderModel();
    setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            tcpa: 7200,
            showTcpaBranch: true
          }
        }),
        { pageId: "navpage", mode: "dispatch" }
      ),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(setup.applyFormatter).toHaveBeenCalledWith(
      120,
      expect.objectContaining({
        formatter: "formatDecimal",
        formatterParameters: [3, 0]
      })
    );
  });
});
