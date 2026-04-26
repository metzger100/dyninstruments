const { loadFresh } = require("../../helpers/load-umd");

describe("AisTargetRenderModel", function () {
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter = opts.applyFormatter || vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value == null || Number.isNaN(value)) {
        return Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
      }
      const params = Array.isArray(cfg.formatterParameters) ? cfg.formatterParameters : [];
      return String(cfg.formatter) + "|" + String(value) + "|" + params.join(",");
    });

    const moduleCache = Object.create(null);
    const Helpers = {
      applyFormatter: applyFormatter,
      getModule(id) {
        if (!moduleCache[id]) {
          if (id === "AisTargetLayout") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayout.js");
          } else if (id === "HtmlWidgetUtils") {
            moduleCache[id] = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
          } else if (id === "ResponsiveScaleProfile") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
          } else if (id === "LayoutRectMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
          } else if (id === "AisTargetLayoutGeometry") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
          } else if (id === "AisTargetLayoutMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
          } else if (id === "PlaceholderNormalize") {
            moduleCache[id] = loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
          } else if (id === "StateScreenLabels") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenLabels.js");
          } else if (id === "StateScreenPrecedence") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
          } else if (id === "StateScreenInteraction") {
            moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenInteraction.js");
          } else if (id === "StableDigits") {
            moduleCache[id] = loadFresh("shared/widget-kits/format/StableDigits.js");
          } else {
            throw new Error("unexpected module: " + id);
          }
        }
        return moduleCache[id];
      }
    };

    return {
      renderModel: loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js").create({}, Helpers),
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

  it("builds dispatch data state with all metrics and formatter output", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("data");
    expect(model.interactionState).toBe("dispatch");
    expect(model.captureClicks).toBe(true);
    expect(model.showHotspot).toBe(true);
    expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(model.metricVisibility).toEqual({ dst: true, cpa: true, tcpa: true, brg: true });
    expect(model.wrapperClasses).toContain("dyni-ais-target-open-dispatch");
    expect(model.wrapperClasses).toContain("dyni-ais-target-branch-tcpa");
    expect(model.wrapperClasses).toContain("dyni-ais-target-color-warning");
    expect(model.inlineGeometry.wrapperStyle).toContain("grid-template-areas");
    expect(model.inlineGeometry.metricStyles.cpa.valueRowStyle).toContain("grid-template-columns:");
    expect(model.layout.accentRect).toBeTruthy();
    expect(model.layout.insets.accentReserve).toBeGreaterThan(0);
    expect(model.layout.accentRect.w).toBeGreaterThanOrEqual(6);
    expect(model.layout.insets.identityGap).toBeGreaterThanOrEqual(model.layout.insets.metricGridGap);
    expect(Math.abs(model.layout.nameRect.h - model.layout.frontRect.h)).toBeLessThanOrEqual(1);
    expect(model.layout.metricBoxes.dst.unitRect.w / model.layout.metricBoxes.dst.valueRect.w).toBeGreaterThan(0.24);
    expect(Object.prototype.hasOwnProperty.call(model, "frontInitialText")).toBe(false);
    expect(model.metrics.dst.valueText).toBe("formatDistance|4.2|nm");
    expect(model.metrics.cpa.valueText).toBe("formatDistance|0.7|nm");
    expect(model.metrics.tcpa.valueText).toBe("formatDecimal|0.5|3,2");
    expect(model.metrics.brg.valueText).toBe("formatDirection|112|");
    expect(setup.applyFormatter).toHaveBeenCalledWith(0.5, expect.objectContaining({
      formatter: "formatDecimal",
      formatterParameters: [3, 2]
    }));
  });

  it("pads metric values and exposes fallback values when stableDigits is enabled", function () {
    const setup = createRenderModel({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null || Number.isNaN(value)) {
          return Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
        }
        return String(value);
      }
    });
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ stableDigits: true }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.stableDigitsEnabled).toBe(true);
    expect(model.metrics.dst.valueText).toBe("04.2");
    expect(model.metrics.dst.fallbackValueText).toBe("4.2");
    expect(model.metrics.cpa.valueText).toBe("00.7");
    expect(model.metrics.cpa.fallbackValueText).toBe("0.7");
    expect(model.metrics.brg.valueText).toBe("112");
    expect(model.metrics.brg.fallbackValueText).toBe("112");
  });

  it("keeps full identity text and all four metrics in flat BRG branch mode", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          showTcpaBranch: false,
          tcpa: 0,
          nameOrMmsi: "Athena",
          frontText: "Back"
        }
      }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 620, height: 120 },
      mode: "flat",
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("flat");
    expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
    expect(model.metricVisibility).toEqual({ dst: true, cpa: true, tcpa: true, brg: true });
    expect(model.nameText).toBe("Athena");
    expect(model.frontText).toBe("Back");
    expect(model.wrapperClasses).toContain("dyni-ais-target-branch-brg");
    expect(model.wrapperClasses.join(" ")).not.toContain("flat-rows");
  });

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
      }
    });
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.metrics.dst.valueText).toBe("---");
    expect(model.metrics.cpa.valueText).toBe("---");
    expect(model.metrics.tcpa.valueText).toBe("---");
    expect(model.metrics.brg.valueText).toBe("---");
  });

  it("keeps all four metrics visible for flat, normal, and high data modes without flat-row state classes", function () {
    const setup = createRenderModel();
    ["flat", "normal", "high"].forEach((mode) => {
      const shellRect = mode === "flat" ? { width: 620, height: 120 } : { width: 280, height: 220 };
      const model = setup.renderModel.buildModel({
        props: withSurfacePolicy(
          makeProps({ domain: { showTcpaBranch: false, tcpa: 0 } }),
          { pageId: "navpage", mode: "dispatch" }
        ),
        shellRect: shellRect,
        mode: mode,
        isVerticalCommitted: false
      });

      expect(model.visibleMetricIds).toEqual(["dst", "cpa", "tcpa", "brg"]);
      expect(model.metricVisibility).toEqual({ dst: true, cpa: true, tcpa: true, brg: true });
      expect(model.wrapperClasses.join(" ")).not.toContain("flat-rows");
    });
  });

  it("keeps noAis state on gpspage without target identity", function () {
    const setup = createRenderModel();
    const model = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          hasTargetIdentity: false,
          hasDispatchMmsi: false
        }
      }), { pageId: "gpspage", mode: "dispatch" }),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
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
      props: withSurfacePolicy(makeProps({
        domain: {
          hasTargetIdentity: false,
          hasDispatchMmsi: false
        }
      }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("hidden");
    expect(model.interactionState).toBe("passive");
    expect(model.visibleMetricIds).toEqual([]);
    expect(model.stateLabel).toBe("");
  });

  it("keeps hidden before disconnected outside gpspage and shows disconnected on gpspage", function () {
    const setup = createRenderModel();
    const hidden = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        disconnect: true,
        domain: {
          hasTargetIdentity: false,
          hasDispatchMmsi: false
        }
      }), { pageId: "other", mode: "dispatch" }),
      shellRect: { width: 300, height: 170 },
      mode: "normal",
      isVerticalCommitted: false
    });
    const disconnected = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        disconnect: true,
        domain: {
          hasTargetIdentity: false,
          hasDispatchMmsi: false
        }
      }), { pageId: "gpspage", mode: "dispatch" }),
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
      props: withSurfacePolicy(makeProps({ editing: true }), { pageId: "navpage", mode: "dispatch" }),
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
      props: withSurfacePolicy(makeProps({
        domain: {
          tcpa: 7200,
          showTcpaBranch: true
        }
      }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(setup.applyFormatter).toHaveBeenCalledWith(120, expect.objectContaining({
      formatter: "formatDecimal",
      formatterParameters: [3, 0]
    }));
  });

  it("updates resize signature when any of the four metric strings changes", function () {
    const setup = createRenderModel();
    const props = withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch" });
    const shellRect = { width: 320, height: 180 };
    const baseSig = setup.renderModel.buildModel({
      props: props,
      shellRect: shellRect,
      mode: "normal",
      isVerticalCommitted: false
    }).resizeSignatureParts.join("|");

    const sigDistance = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ domain: { distance: 9.1 } }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: shellRect,
      mode: "normal",
      isVerticalCommitted: false
    }).resizeSignatureParts.join("|");
    const sigCpa = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ domain: { cpa: 1.9 } }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: shellRect,
      mode: "normal",
      isVerticalCommitted: false
    }).resizeSignatureParts.join("|");
    const sigTcpa = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ domain: { tcpa: 12 } }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: shellRect,
      mode: "normal",
      isVerticalCommitted: false
    }).resizeSignatureParts.join("|");
    const sigBrg = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps({ domain: { headingTo: 302 } }), { pageId: "navpage", mode: "dispatch" }),
      shellRect: shellRect,
      mode: "normal",
      isVerticalCommitted: false
    }).resizeSignatureParts.join("|");

    expect(sigDistance).not.toBe(baseSig);
    expect(sigCpa).not.toBe(baseSig);
    expect(sigTcpa).not.toBe(baseSig);
    expect(sigBrg).not.toBe(baseSig);
  });

  it("keeps vertical resize signatures stable across host-height drift", function () {
    const setup = createRenderModel();
    const props = withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch", orientation: "vertical" });

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
      props: withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 220, height: 120 },
      mode: "normal",
      isVerticalCommitted: false
    });
    const hostSizedB = setup.renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { pageId: "navpage", mode: "dispatch" }),
      shellRect: { width: 220, height: 360 },
      mode: "normal",
      isVerticalCommitted: false
    });

    expect(verticalA.resizeSignatureParts.join("|")).toBe(verticalB.resizeSignatureParts.join("|"));
    expect(hostSizedA.resizeSignatureParts.join("|")).not.toBe(hostSizedB.resizeSignatureParts.join("|"));
    expect(Math.abs(verticalA.layout.nameRect.h - verticalA.layout.frontRect.h)).toBeLessThanOrEqual(1);
  });
});
