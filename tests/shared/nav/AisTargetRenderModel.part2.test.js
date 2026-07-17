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

  it("normalizes formatter fallback tokens to --- across AIS metrics", function () {
    const setup = createRenderModel({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "    -";
        }
        if (cfg.formatter === "formatDecimal") {
          return "-----";
        }
        if (cfg.formatter === "formatDirection") {
          return "NO DATA";
        }
        return cfg.default;
      },
    });
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), {
        pageId: "navpage",
        mode: "dispatch",
      }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false,
    });

    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.cpa.valueText).toBe("---");
    expect(model.metrics.tcpa.valueText).toBe("---");
    expect(model.metrics.brg.valueText).toBe("---");
  });

  it("keeps null and blank AIS metric payload values missing instead of coercing to zero", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            distance: null,
            cpa: "   ",
            tcpa: "",
            headingTo: undefined,
          },
        }),
        { pageId: "navpage", mode: "dispatch" },
      ),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false,
    });

    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.cpa.valueText).toBe("---");
    expect(model.metrics.tcpa.valueText).toBe("---");
    expect(model.metrics.brg.valueText).toBe("---");
    expect(model.metrics.dst.valueText).not.toContain("0");
    expect(model.metrics.cpa.valueText).not.toContain("0");
    expect(model.metrics.tcpa.valueText).not.toContain("0");
    expect(model.metrics.brg.valueText).not.toContain("0");
  });

  it("keeps all four metrics visible for flat, normal, and high data modes without flat-row state classes", function () {
    const setup = createRenderModel();
    ["flat", "normal", "high"].forEach((mode) => {
      const shellRect =
        mode === "flat"
          ? { width: 620, height: 120 }
          : { width: 280, height: 220 };
      const model = setup.renderModel.buildModel({
        props: withSurfacePolicy(
          makeProps({ domain: { showTcpaBranch: false, tcpa: 0 } }),
          { pageId: "navpage", mode: "dispatch" },
        ),
        shellRect: shellRect,
        mode: mode,
        isVerticalCommitted: false,
      });

      expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
      expect(model.metricVisibility).toEqual({
        dst: true,
        cpa: true,
        tcpa: true,
        brg: true,
      });
      expect(model.wrapperClasses.join(" ")).not.toContain("flat-rows");
    });
  });

  it("keeps noAis state on gpspage without target identity", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
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

    expect(model.kind).toBe("noAis");
    expect(model.interactionState).toBe("passive");
    expect(model.captureClicks).toBe(false);
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.stateLabel).toBe("No AIS");
  });

  it("keeps hidden state outside gpspage when no target identity exists", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(
        makeProps({
          domain: {
            hasTargetIdentity: false,
            hasDispatchMmsi: false,
          },
        }),
        { pageId: "navpage", mode: "dispatch" },
      ),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false,
    });

    expect(model.kind).toBe("hidden");
    expect(model.interactionState).toBe("passive");
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.stateLabel).toBe("");
  });

});
