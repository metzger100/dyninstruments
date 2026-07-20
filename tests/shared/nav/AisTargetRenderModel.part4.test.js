// @ts-nocheck
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("AisTargetRenderModel", function () {
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      vi.fn(function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null || Number.isNaN(value)) {
          return Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
        }
        const params = Array.isArray(cfg.formatterParameters) ? cfg.formatterParameters : [];
        return String(cfg.formatter) + "|" + String(value) + "|" + params.join(",");
      });

    const modules = {
      AisTargetLayout: loadFresh("shared/widget-kits/nav/AisTargetLayout.js"),
      AisTargetLayoutSizing: loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js"),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      AisTargetLayoutGeometry: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js"),
      AisTargetLayoutGeometryStyles: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js"),
      AisTargetLayoutMath: loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js")
    };
    const componentContext = createComponentContextMock({
      modules: modules,
      services: {
        format: {
          applyFormatter: applyFormatter
        }
      }
    });

    return {
      renderModel: loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js").create({}, componentContext),
      applyFormatter: applyFormatter
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: {
          mode: opts.mode === "passive" ? "passive" : "dispatch"
        },
        pageId: typeof opts.pageId === "string" ? opts.pageId : "navpage",
        containerOrientation: opts.orientation === "vertical" ? "vertical" : "default"
      }
    });
  }

  function makeProps(overrides) {
    const patch = overrides || {};
    const base = {
      domain: {
        hasTargetIdentity: true,
        hasDispatchMmsi: true,
        hasColorRole: true,
        colorRole: "warning",
        mmsiNormalized: "211234560",
        showTcpaBranch: true,
        nameOrMmsi: "Poseidon",
        frontText: "Front",
        distance: 4.2,
        cpa: 0.7,
        tcpa: 30,
        headingTo: 112
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8
      },
      captions: {
        dst: "DST",
        cpa: "DCPA",
        tcpa: "TCPA",
        brg: "BRG"
      },
      units: {
        dst: "nm",
        cpa: "nm",
        tcpa: "min",
        brg: "°"
      },
      formatUnits: {
        dst: "nm",
        cpa: "nm"
      },
      default: "---"
    };
    const out = Object.assign({}, base, patch);
    out.domain = Object.assign({}, base.domain, patch.domain || {});
    out.layout = Object.assign({}, base.layout, patch.layout || {});
    out.captions = Object.assign({}, base.captions, patch.captions || {});
    out.units = Object.assign({}, base.units, patch.units || {});
    return out;
  }

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
