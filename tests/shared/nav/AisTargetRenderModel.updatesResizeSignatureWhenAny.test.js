// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./AisTargetRenderModel-setup");

describe("AisTargetRenderModel", function () {
  it("updates resize signature when any of the four metric strings changes", function () {
    const setup = createRenderModel();
    const props = withSurfacePolicy(makeProps(), {
      pageId: "navpage",
      mode: "dispatch"
    });
    const shellRect = { width: 320, height: 180 };
    const baseSig = setup.renderModel
      .buildModel({
        props: props,
        shellRect: shellRect,
        mode: "normal",
        isVerticalCommitted: false
      })
      .resizeSignatureParts.join("|");

    const sigDistance = setup.renderModel
      .buildModel({
        props: withSurfacePolicy(makeProps({ domain: { distance: 9.1 } }), {
          pageId: "navpage",
          mode: "dispatch"
        }),
        shellRect: shellRect,
        mode: "normal",
        isVerticalCommitted: false
      })
      .resizeSignatureParts.join("|");
    const sigCpa = setup.renderModel
      .buildModel({
        props: withSurfacePolicy(makeProps({ domain: { cpa: 1.9 } }), {
          pageId: "navpage",
          mode: "dispatch"
        }),
        shellRect: shellRect,
        mode: "normal",
        isVerticalCommitted: false
      })
      .resizeSignatureParts.join("|");
    const sigTcpa = setup.renderModel
      .buildModel({
        props: withSurfacePolicy(makeProps({ domain: { tcpa: 12 } }), {
          pageId: "navpage",
          mode: "dispatch"
        }),
        shellRect: shellRect,
        mode: "normal",
        isVerticalCommitted: false
      })
      .resizeSignatureParts.join("|");
    const sigBrg = setup.renderModel
      .buildModel({
        props: withSurfacePolicy(makeProps({ domain: { headingTo: 302 } }), {
          pageId: "navpage",
          mode: "dispatch"
        }),
        shellRect: shellRect,
        mode: "normal",
        isVerticalCommitted: false
      })
      .resizeSignatureParts.join("|");

    expect(sigDistance).not.toBe(baseSig);
    expect(sigCpa).not.toBe(baseSig);
    expect(sigTcpa).not.toBe(baseSig);
    expect(sigBrg).not.toBe(baseSig);
  });

  it("keeps vertical resize signatures stable across host-height drift", function () {
    const setup = createRenderModel();
    const props = withSurfacePolicy(makeProps(), {
      pageId: "navpage",
      mode: "dispatch",
      orientation: "vertical"
    });

    const verticalA = setup.renderModel.buildModel({
      props: props,
      shellRect: { width: 220, height: 120 },
      mode: "normal",
      isVerticalCommitted: true
    });
    const verticalB = setup.renderModel.buildModel({
      props: props,
      shellRect: { width: 220, height: 360 },
      mode: "normal",
      isVerticalCommitted: true
    });
    const hostSizedA = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 220, height: 120 },
      mode: "normal",
      isVerticalCommitted: false
    });
    const hostSizedB = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), {
        pageId: "navpage",
        mode: "dispatch"
      }),
      shellRect: { width: 220, height: 360 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(verticalA.resizeSignatureParts.join("|")).toBe(verticalB.resizeSignatureParts.join("|"));
    expect(hostSizedA.resizeSignatureParts.join("|")).not.toBe(hostSizedB.resizeSignatureParts.join("|"));
    expect(Math.abs(verticalA.layout.nameRect.h - verticalA.layout.frontRect.h)).toBeLessThanOrEqual(1);
  });
});
