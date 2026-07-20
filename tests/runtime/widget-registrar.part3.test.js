// @ts-nocheck
const { loadFresh } = require("../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");
const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createComponentContextMock } = require("../helpers/component-context-mock");

describe("runtime/widget-registrar.js", function () {
  function setupContext(options) {
    const opts = options || {};
    const registerWidget = opts.registerWidget || vi.fn();
    const hostActions = {
      getCapabilities: vi.fn(),
      routePoints: {},
      routeEditor: {},
      ais: {}
    };
    const runtimeHostActions = opts.runtimeHostActions || vi.fn(() => hostActions);
    const includeGlobalApi = opts.includeGlobalApi !== false;
    const capturedApi =
      opts.hostApi ||
      (includeGlobalApi
        ? {
            registerWidget: registerWidget
          }
        : null);

    const context = createScriptContext({
      DyniPlugin: {
        runtime: {
          hostActions: runtimeHostActions
        },
        state: {},
        config: { shared: {}, clusters: [] },
        ...(capturedApi ? { avnavApi: capturedApi } : {})
      },
      avnav: includeGlobalApi
        ? {
            api: {
              registerWidget
            }
          }
        : {}
    });

    runIifeScript("runtime/namespace.js", context);
    runIifeScript("runtime/editable-defaults.js", context);
    runIifeScript("runtime/widget-registrar.js", context);

    return { context, registerWidget, hostActions, runtimeHostActions };
  }

  function loadVesselDef() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/shared/vessel-voltage-editables.js", context);
    runIifeScript("config/clusters/vessel.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "vessel").def;
  }

  function makePositionComponentContext() {
    const themeTokens = {
      surface: { fg: "#fff" },
      font: {
        family: "sans-serif",
        familyMono: "monospace",
        weight: 730,
        labelWeight: 610
      }
    };
    const textLayoutEngineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
    return createComponentContextMock({
      modules: {
        RadialAngleMath: loadFresh("shared/widget-kits/radial/RadialAngleMath.js"),
        RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
        CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
        TextLayoutPrimitives: loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js"),
        TextLayoutComposite: loadFresh("shared/widget-kits/text/TextLayoutComposite.js"),
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        TextLayoutEngine: textLayoutEngineModule,
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
        StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
        StateScreenCanvasOverlay: loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js")
      },
      services: {
        format: {
          applyFormatter(raw, props) {
            const cfg = props || {};
            const fpRaw = cfg.formatterParameters;
            let fp;
            if (Array.isArray(fpRaw)) {
              fp = fpRaw;
            } else if (typeof fpRaw === "string") {
              fp = fpRaw.split(",");
            } else {
              fp = [];
            }
            if (cfg && typeof cfg.formatter === "function") {
              return cfg.formatter.apply(null, [raw].concat(fp));
            }
            if (
              cfg &&
              typeof cfg.formatter === "string" &&
              globalThis.avnav &&
              globalThis.avnav.api &&
              globalThis.avnav.api.formatter &&
              typeof globalThis.avnav.api.formatter[cfg.formatter] === "function"
            ) {
              return globalThis.avnav.api.formatter[cfg.formatter].apply(
                globalThis.avnav.api.formatter,
                [raw].concat(fp)
              );
            }
            if (raw == null || Number.isNaN(raw)) return cfg.default || "---";
            return String(raw);
          }
        },
        canvas: {
          setupCanvas(canvas) {
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            return {
              ctx,
              W: Math.round(rect.width),
              H: Math.round(rect.height)
            };
          }
        },
        dom: {
          requirePluginRoot(target) {
            return target;
          }
        },
        themeTokens: {
          resolveForRoot() {
            return themeTokens;
          }
        }
      }
    });
  }

  function fillTextValues(ctx) {
    return ctx.calls.filter((c) => c.name === "fillText").map((c) => String(c.args[0]));
  }

  function captureTextCalls(ctx) {
    const captured = [];
    const originalFillText = ctx.fillText;
    ctx.fillText = function () {
      captured.push({
        text: String(arguments[0]),
        font: ctx.font
      });
      return originalFillText.apply(this, arguments);
    };
    return captured;
  }

  it("keeps vessel stableDigits absent at registration so dateTime/timeStatus default at render time", function () {
    const { context, registerWidget, hostActions } = setupContext();
    const vesselDef = loadVesselDef();
    const componentSpec = {};
    const previousAvnav = globalThis.avnav;

    try {
      context.DyniPlugin.runtime.registerWidget(componentSpec, {
        def: vesselDef
      });

      const [registeredDef] = registerWidget.mock.calls[0];
      expect(Object.prototype.hasOwnProperty.call(registeredDef, "stableDigits")).toBe(false);

      const rawClock = new Date("2026-02-22T15:00:00Z");
      globalThis.avnav = {
        api: {
          formatter: {
            formatDate(value) {
              return value === rawClock ? "DATE" : "DATE_BAD";
            },
            formatTime(value) {
              return value === rawClock ? "TIME" : "TIME_BAD";
            }
          }
        }
      };

      const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js").create(
        {},
        makePositionComponentContext()
      );

      const registeredProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const registeredCtx = createMockContext2D();
      const registeredCanvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx: registeredCtx
      });
      const registeredCaptured = captureTextCalls(registeredCtx);
      spec.renderCanvas(registeredCanvas, registeredProps);

      expect(fillTextValues(registeredCtx)).toContain("DATE");
      expect(fillTextValues(registeredCtx)).toContain("TIME");
      expect(String(registeredCtx.textAlign)).toBe("center");
      expect(String(registeredCaptured.find((entry) => entry.text === "TIME").font)).toContain("monospace");

      const explicitProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        stableDigits: false,
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const explicitCtx = createMockContext2D();
      const explicitCanvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx: explicitCtx
      });
      const explicitCaptured = captureTextCalls(explicitCtx);
      spec.renderCanvas(explicitCanvas, explicitProps);

      expect(fillTextValues(explicitCtx)).toContain("DATE");
      expect(fillTextValues(explicitCtx)).toContain("TIME");
      expect(String(explicitCtx.textAlign)).toBe("center");
      expect(String(explicitCaptured.find((entry) => entry.text === "TIME").font)).toContain("sans-serif");
    } finally {
      if (typeof previousAvnav === "undefined") delete globalThis.avnav;
      else globalThis.avnav = previousAvnav;
    }
  });
});
