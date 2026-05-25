const { loadFresh } = require("../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");
const { createComponentContextMock } = require("../helpers/component-context-mock");

function createActiveRouteWidget() {
  const fitCompute = vi.fn(function () {
    return {
      routeNameStyle: "",
      metrics: {
        remain: { captionStyle: "", valueStyle: "", unitStyle: "" },
        rteEta: { captionStyle: "", valueStyle: "", unitStyle: "" },
        next: { captionStyle: "", valueStyle: "", unitStyle: "" }
      }
    };
  });
  const htmlFitStub = {
    ensureDisplayProps(props) {
      return props;
    },
    resolveDisplayMode(props, shellRect, htmlUtils) {
      return htmlUtils.resolveRatioModeForRect({
        shellRect: shellRect,
        ratioThresholdNormal: props.ratioThresholdNormal,
        ratioThresholdFlat: props.ratioThresholdFlat,
        defaultRatioThresholdNormal: 1.2,
        defaultRatioThresholdFlat: 3.8,
        defaultMode: "normal"
      });
    },
    formatActiveRouteMetric(rawValue, formatter, formatterParameters, defaultText, placeholderNormalize) {
      const out = String(componentContext.format.applyFormatter(rawValue, {
        formatter: formatter,
        formatterParameters: formatterParameters,
        default: defaultText
      }));
      return placeholderNormalize.normalize(out, defaultText);
    },
    textLength(value) {
      return value == null ? 0 : String(value).length;
    },
    normalizeStableValue(rawText, stableDigitsEnabled, stableDigits, minWidth) {
      if (!stableDigitsEnabled) {
        return { padded: rawText, plain: rawText };
      }
      return stableDigits.normalize(rawText, {
        integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
        reserveSignSlot: true
      });
    }
  };
  const componentContext = createComponentContextMock({
    modules: {
      ActiveRouteHtmlFit: { create: () => Object.assign({ compute: fitCompute }, htmlFitStub) },
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      PreparedPayloadModelCache: loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
      StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
      StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js")
    },
    services: {
      format: {
        applyFormatter(value, formatterOptions) {
          const cfg = formatterOptions || {};
          return value == null ? cfg.default : String(value);
        }
      },
      themeTokens: {
        resolveForRoot() {
          return {
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 720,
              labelWeight: 610
            }
          };
        }
      }
    }
  });
  return loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, componentContext);
}

function mountHtml(rendererSpec, props) {
  const hostContext = {};
  const rootEl = document.createElement("div");
  const shellEl = document.createElement("div");
  const mountEl = document.createElement("div");
  rootEl.appendChild(shellEl);
  shellEl.appendChild(mountEl);
  hostContext.__dyniHostCommitState = { rootEl, shellEl };

  const committed = rendererSpec.createCommittedRenderer({ hostContext, mountEl, shadowRoot: null });
  const payload = {
    props,
    revision: 1,
    rootEl,
    shellEl,
    mountEl,
    shadowRoot: null,
    shellRect: { width: 320, height: 180 },
    hostContext,
    layoutChanged: true,
    relayoutPass: 0
  };
  committed.mount(mountEl, payload);
  committed.postPatch(payload);
  return mountEl;
}

function createRenderModelContext() {
  const moduleCache = Object.create(null);
  function loadModuleById(id) {
    if (!moduleCache[id]) {
      if (id === "EditRouteLayout") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayout.js");
      }
      else if (id === "EditRouteLayoutMath") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayoutMath.js");
      }
      else if (id === "EditRouteLayoutGeometry") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/EditRouteLayoutGeometry.js");
      }
      else if (id === "ResponsiveScaleProfile") {
        moduleCache[id] = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
      }
      else if (id === "LayoutRectMath") {
        moduleCache[id] = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
      }
      else if (id === "RoutePointsLayout") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsLayout.js");
      }
      else if (id === "RadialTextFitting") {
        moduleCache[id] = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
      }
      else if (id === "CanvasTextLayout") {
        moduleCache[id] = loadFresh("shared/widget-kits/text/CanvasTextLayout.js");
      }
      else if (id === "TextTileLayout") {
        moduleCache[id] = loadFresh("shared/widget-kits/text/TextTileLayout.js");
      }
      else if (id === "RoutePointsInfoText") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsInfoText.js");
      }
      else if (id === "RoutePointsHtmlFit") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsHtmlFit.js");
      }
      else if (id === "RoutePointsLayoutSizing") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
      }
      else if (id === "RoutePointsRowGeometry") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js");
      }
      else if (id === "CenterDisplayMath") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js");
      }
      else if (id === "AisTargetLayout") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayout.js");
      }
      else if (id === "AisTargetLayoutSizing") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js");
      }
      else if (id === "AisTargetLayoutGeometry") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js");
      }
      else if (id === "AisTargetLayoutMath") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js");
      }
      else if (id === "HtmlWidgetUtils") {
        moduleCache[id] = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
      }
      else if (id === "UnitAwareFormatter") {
        moduleCache[id] = loadFresh("shared/widget-kits/format/UnitAwareFormatter.js");
      }
      else if (id === "NavInteractionPolicy") {
        moduleCache[id] = loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js");
      }
      else if (id === "PlaceholderNormalize") {
        moduleCache[id] = loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
      }
      else if (id === "StableDigits") {
        moduleCache[id] = loadFresh("shared/widget-kits/format/StableDigits.js");
      }
      else if (id === "StateScreenLabels") {
        moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenLabels.js");
      }
      else if (id === "StateScreenPrecedence") {
        moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
      }
      else if (id === "StateScreenInteraction") {
        moduleCache[id] = loadFresh("shared/widget-kits/state/StateScreenInteraction.js");
      }
      else {
        throw new Error("unexpected module: " + id);
      }
    }
    return moduleCache[id];
  }
  const moduleIds = [
    "EditRouteLayout",
    "EditRouteLayoutMath",
    "EditRouteLayoutGeometry",
    "ResponsiveScaleProfile",
    "LayoutRectMath",
    "RoutePointsLayout",
    "RadialTextFitting",
    "CanvasTextLayout",
    "TextTileLayout",
    "RoutePointsInfoText",
    "RoutePointsHtmlFit",
    "RoutePointsLayoutSizing",
    "RoutePointsRowGeometry",
    "CenterDisplayMath",
    "AisTargetLayout",
    "AisTargetLayoutSizing",
    "AisTargetLayoutGeometry",
    "AisTargetLayoutMath",
    "HtmlWidgetUtils",
    "UnitAwareFormatter",
    "NavInteractionPolicy",
    "PlaceholderNormalize",
    "StableDigits",
    "StateScreenLabels",
    "StateScreenPrecedence",
    "StateScreenInteraction"
  ];
  const modules = Object.create(null);
  moduleIds.forEach(function (id) {
    modules[id] = loadModuleById(id);
  });
  return createComponentContextMock({
    modules,
    services: {
      format: {
        applyFormatter(value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value == null || Number.isNaN(value)) {
        return Object.prototype.hasOwnProperty.call(cfg, "default") ? cfg.default : "---";
      }
      if (cfg.formatter === "formatDecimal") {
        const precision = Array.isArray(cfg.formatterParameters) ? Number(cfg.formatterParameters[0]) : 0;
        const places = Number.isFinite(precision) ? Math.max(0, Math.floor(precision)) : 0;
        return Number(value).toFixed(places);
      }
      if (cfg.formatter === "formatDistance") {
        return Number(value).toFixed(1);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatClock") {
        return "CLOCK:" + String(value);
      }
      return String(value);
        }
      },
      themeTokens: {
        resolveForRoot() {
          return {
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 720,
              labelWeight: 610
            }
          };
        }
      }
    }
  });
}

function createEditRouteRenderModel() {
  return loadFresh("shared/widget-kits/nav/EditRouteRenderModel.js").create({}, createRenderModelContext());
}

function createRoutePointsRenderModel() {
  return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, createRenderModelContext());
}

function createAisTargetRenderModel() {
  return loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js").create({}, createRenderModelContext());
}

function createStateOverlay() {
  return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js").create({}, createComponentContextMock({
    modules: {
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js")
    }
  }));
}

function createSpringMotion() {
  return loadFresh("shared/widget-kits/anim/SpringEasing.js").create({}, createComponentContextMock({})).createMotion();
}

function readTextContent(root, selector) {
  const node = root.querySelector(selector);
  return node ? node.textContent : "";
}

describe("Phase 9 acceptance coverage", function () {
  it("keeps stable-digit widths aligned and spring motion isolated per canvas", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const springMotion = createSpringMotion();
    const canvasA = createMockCanvas();
    const canvasB = createMockCanvas();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: 12.3,
        rteEta: new Date("2026-03-06T11:45:00Z"),
        nextCourse: 93,
        routeName: "Harbor Run",
        disconnect: false
      },
      captions: { remain: "RTE", rteEta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", rteEta: "", nextCourse: "deg" },
      stableDigits: true,
      default: "---",
      surfacePolicy: {
        interaction: { mode: "dispatch" },
        pageId: "navpage",
        containerOrientation: "default",
        actions: { routeEditor: { openActiveRoute() { return true; } } }
      }
    });

    const editModel = editRoute.buildModel({
      props: {
        disconnect: false,
        stableDigits: true,
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: 12.3,
          remainingDistance: 18.4,
          rteEta: "2026-03-06T11:45:00Z",
          isActiveRoute: true,
          isLocalRoute: true,
          isServerRoute: false
        },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { pts: "PTS", dst: "DST", rte: "RTE", rteEta: "ETA" },
        units: { dst: "nm", rte: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    const activeRemainText = readTextContent(activeMount, ".dyni-active-route-metric-remain .dyni-active-route-metric-value");
    const editDistanceText = editModel.metrics.dst.valueText;

    expect(activeRemainText.length).toBe(editDistanceText.length);
    expect(activeRemainText).not.toBe("---");
    expect(editDistanceText).not.toBe("---");

    expect(springMotion.resolve(canvasA, 10, true, 0)).toBe(10);
    expect(springMotion.resolve(canvasB, 100, true, 0)).toBe(100);

    const nextA = springMotion.resolve(canvasA, 20, true, 16);
    const nextB = springMotion.resolve(canvasB, 100, true, 16);

    expect(nextA).not.toBe(nextB);
    expect(nextB).toBe(100);
    expect(springMotion.isActive(canvasA)).toBe(true);
    expect(springMotion.isActive(canvasB)).toBe(false);
  });
});
