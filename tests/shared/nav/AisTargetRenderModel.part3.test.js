const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

describe("AisTargetRenderModel", function () {
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      opts.applyFormatter ||
      vi.fn(function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null || Number.isNaN(value)) {
          return Object.prototype.hasOwnProperty.call(cfg, "default")
            ? cfg.default
            : "---";
        }
        const params = Array.isArray(cfg.formatterParameters)
          ? cfg.formatterParameters
          : [];
        return (
          String(cfg.formatter) + "|" + String(value) + "|" + params.join(",")
        );
      });

    const modules = {
      AisTargetLayout: loadFresh("shared/widget-kits/nav/AisTargetLayout.js"),
      AisTargetLayoutSizing: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutSizing.js",
      ),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      ResponsiveScaleProfile: loadFresh(
        "shared/widget-kits/layout/ResponsiveScaleProfile.js",
      ),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      AisTargetLayoutGeometry: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutGeometry.js",
      ),
      AisTargetLayoutGeometryStyles: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js",
      ),
      AisTargetLayoutMath: loadFresh(
        "shared/widget-kits/nav/AisTargetLayoutMath.js",
      ),
      PlaceholderNormalize: loadFresh(
        "shared/widget-kits/format/PlaceholderNormalize.js",
      ),
      UnitAwareFormatter: loadFresh(
        "shared/widget-kits/format/UnitAwareFormatter.js",
      ),
      StateScreenLabels: loadFresh(
        "shared/widget-kits/state/StateScreenLabels.js",
      ),
      StateScreenPrecedence: loadFresh(
        "shared/widget-kits/state/StateScreenPrecedence.js",
      ),
      StateScreenInteraction: loadFresh(
        "shared/widget-kits/state/StateScreenInteraction.js",
      ),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
    };
    const componentContext = createComponentContextMock({
      modules: modules,
      services: {
        format: {
          applyFormatter: applyFormatter,
        },
      },
    });

    return {
      renderModel: loadFresh(
        "shared/widget-kits/nav/AisTargetRenderModel.js",
      ).create({}, componentContext),
      applyFormatter: applyFormatter,
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: {
          mode: opts.mode === "passive" ? "passive" : "dispatch",
        },
        pageId: typeof opts.pageId === "string" ? opts.pageId : "navpage",
        containerOrientation:
          opts.orientation === "vertical" ? "vertical" : "default",
      },
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
        headingTo: 112,
      },
      layout: {
        ratioThresholdNormal: 1.2,
        ratioThresholdFlat: 3.8,
      },
      captions: {
        dst: "DST",
        cpa: "DCPA",
        tcpa: "TCPA",
        brg: "BRG",
      },
      units: {
        dst: "nm",
        cpa: "nm",
        tcpa: "min",
        brg: "°",
      },
      formatUnits: {
        dst: "nm",
        cpa: "nm",
      },
      default: "---",
    };
    const out = Object.assign({}, base, patch);
    out.domain = Object.assign({}, base.domain, patch.domain || {});
    out.layout = Object.assign({}, base.layout, patch.layout || {});
    out.captions = Object.assign({}, base.captions, patch.captions || {});
    out.units = Object.assign({}, base.units, patch.units || {});
    return out;
  }

  it("renders noAis state for vertical containers outside gpspage when identity is missing", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false,
          },
        }),
        { pageId: "navpage", mode: "dispatch", orientation: "vertical" },
      ),
      shellRect: { width: 220, height: 300 },
      mode: "normal",
      isVerticalCommitted: true,
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
            hasDispatchMmsi: false,
          },
        }),
        { pageId: "other", mode: "dispatch" },
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false,
    });
    const disconnected = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          disconnect: true,
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false,
          },
        }),
        { pageId: "gpspage", mode: "dispatch" },
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false,
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
        mode: "dispatch",
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false,
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
            showTcpaBranch: true,
          },
        }),
        { pageId: "navpage", mode: "dispatch" },
      ),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false,
    });

    expect(setup.applyFormatter).toHaveBeenCalledWith(
      120,
      expect.objectContaining({
        formatter: "formatDecimal",
        formatterParameters: [3, 0],
      }),
    );
  });

});
