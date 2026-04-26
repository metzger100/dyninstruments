const { loadFresh } = require("../helpers/load-umd");
const { createMockCanvas, createMockContext2D } = require("../helpers/mock-canvas");

function createActiveRouteWidget() {
  const fitCompute = vi.fn(function () {
    return {
      routeNameStyle: "",
      metrics: {
        remain: { captionStyle: "", valueStyle: "", unitStyle: "" },
        eta: { captionStyle: "", valueStyle: "", unitStyle: "" },
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
    formatMetric(rawValue, formatter, formatterParameters, defaultText, Helpers, placeholderNormalize) {
      const out = String(Helpers.applyFormatter(rawValue, {
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
        return { padded: rawText, fallback: rawText };
      }
      return stableDigits.normalize(rawText, {
        integerWidth: stableDigits.resolveIntegerWidth(rawText, minWidth),
        reserveSignSlot: true
      });
    }
  };
  const Helpers = {
    applyFormatter(value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    },
    getModule(id) {
      if (id === "ActiveRouteHtmlFit") {
        return { create: () => Object.assign({ compute: fitCompute }, htmlFitStub) };
      }
      if (id === "HtmlWidgetUtils") {
        return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
      }
      if (id === "PreparedPayloadModelCache") {
        return loadFresh("shared/widget-kits/html/PreparedPayloadModelCache.js");
      }
      if (id === "PlaceholderNormalize") {
        return loadFresh("shared/widget-kits/format/PlaceholderNormalize.js");
      }
      if (id === "StableDigits") {
        return loadFresh("shared/widget-kits/format/StableDigits.js");
      }
      if (id === "StateScreenLabels") {
        return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
      }
      if (id === "StateScreenPrecedence") {
        return loadFresh("shared/widget-kits/state/StateScreenPrecedence.js");
      }
      if (id === "StateScreenInteraction") {
        return loadFresh("shared/widget-kits/state/StateScreenInteraction.js");
      }
      if (id === "StateScreenMarkup") {
        return loadFresh("shared/widget-kits/state/StateScreenMarkup.js");
      }
      if (id === "StateScreenTextFit") {
        return loadFresh("shared/widget-kits/state/StateScreenTextFit.js");
      }
      if (id === "ThemeResolver") {
        return {
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
        };
      }
      throw new Error("unexpected module: " + id);
    }
  };
  return loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, Helpers);
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

function createRenderModelHelpers() {
  const moduleCache = Object.create(null);
  return {
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
    },
    getModule(id) {
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
        else if (id === "RadialTextLayout") {
          moduleCache[id] = loadFresh("shared/widget-kits/radial/RadialTextLayout.js");
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
        else if (id === "ThemeResolver") {
          moduleCache[id] = {
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
          };
        }
        else {
          throw new Error("unexpected module: " + id);
        }
      }
      return moduleCache[id];
    }
  };
}

function createEditRouteRenderModel() {
  return loadFresh("shared/widget-kits/nav/EditRouteRenderModel.js").create({}, createRenderModelHelpers());
}

function createRoutePointsRenderModel() {
  return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, createRenderModelHelpers());
}

function createAisTargetRenderModel() {
  return loadFresh("shared/widget-kits/nav/AisTargetRenderModel.js").create({}, createRenderModelHelpers());
}

function createStateOverlay() {
  return loadFresh("shared/widget-kits/state/StateScreenCanvasOverlay.js").create({}, {
    getModule(id) {
      if (id === "StateScreenLabels") {
        return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
      }
      throw new Error("unexpected module: " + id);
    }
  });
}

function createSpringMotion() {
  return loadFresh("shared/widget-kits/anim/SpringEasing.js").create({}, {}).createMotion();
}

function readTextContent(root, selector) {
  const node = root.querySelector(selector);
  return node ? node.textContent : "";
}

describe("Phase 9 acceptance coverage", function () {
  it("keeps disconnected labels consistent across representative widgets and preserves the AIS hidden exception", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const routePoints = createRoutePointsRenderModel();
    const aisTarget = createAisTargetRenderModel();
    const overlay = createStateOverlay();
    const overlayCtx = createMockContext2D();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: 12.3,
        eta: new Date("2026-03-06T11:45:00Z"),
        nextCourse: 93,
        routeName: "Harbor Run",
        disconnect: true
      },
      captions: { remain: "RTE", eta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", eta: "", nextCourse: "deg" },
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
        disconnect: true,
        domain: { hasRoute: true, routeName: "Harbor Run", pointCount: 5 },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { pts: "PTS", dst: "DST", rte: "RTE", eta: "ETA" },
        units: { dst: "nm", rte: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    const routePointsModel = routePoints.buildModel({
      props: {
        disconnect: true,
        domain: {
          route: { points: [{ name: "A", lat: 54.1, lon: 10.0 }] },
          routeName: "Harbor Run"
        },
        layout: { showHeader: true },
        formatting: { courseUnit: "kt", distanceUnit: "nm", waypointsText: "waypoints" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 }
    });

    const aisHiddenModel = aisTarget.buildModel({
      props: {
        disconnect: true,
        domain: { hasTargetIdentity: false, mmsiNormalized: "", nameOrMmsi: "" },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { dst: "DST", cpa: "DCPA", tcpa: "TCPA", brg: "BRG" },
        units: { dst: "nm", cpa: "nm", tcpa: "min", brg: "°" },
        default: "---",
        surfacePolicy: {
          interaction: { mode: "dispatch" },
          pageId: "navpage"
        }
      },
      shellRect: { width: 320, height: 180 }
    });

    overlay.drawStateScreen({
      ctx: overlayCtx,
      W: 320,
      H: 180,
      family: "sans-serif",
      color: "#ffffff",
      labelWeight: 600,
      kind: "disconnected",
      label: "GPS Lost"
    });

    expect(activeMount.textContent).toContain("GPS Lost");
    expect(editModel.kind).toBe("disconnected");
    expect(editModel.stateLabel).toBe("GPS Lost");
    expect(routePointsModel.kind).toBe("disconnected");
    expect(routePointsModel.stateLabel).toBe("GPS Lost");
    expect(aisHiddenModel.kind).toBe("hidden");
    expect(aisHiddenModel.stateLabel).toBe("");
    expect(overlayCtx.calls.filter((entry) => entry.name === "fillText").map((entry) => entry.args[0])).toContain("GPS Lost");
  });

  it("keeps placeholder normalization on render outputs while preserving RoutePoints compound placeholders", function () {
    const activeRoute = createActiveRouteWidget();
    const editRoute = createEditRouteRenderModel();
    const routePoints = createRoutePointsRenderModel();

    const activeMount = mountHtml(activeRoute, {
      display: {
        isApproaching: true,
        remain: undefined,
        eta: undefined,
        nextCourse: undefined,
        routeName: "Harbor Run",
        disconnect: false
      },
      captions: { remain: "RTE", eta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", eta: "", nextCourse: "deg" },
      stableDigits: false,
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
        domain: {
          hasRoute: true,
          routeName: "Harbor Run",
          pointCount: 5,
          totalDistance: undefined,
          remainingDistance: undefined,
          eta: undefined,
          isActiveRoute: true,
          isLocalRoute: true,
          isServerRoute: false
        },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { pts: "PTS", dst: "DST", rte: "RTE", eta: "ETA" },
        units: { dst: "nm", rte: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    const routePointsModel = routePoints.buildModel({
      props: {
        disconnect: false,
        domain: {
          route: { points: [{ name: "A", lat: 54.1, lon: 10.0 }] },
          routeName: "Harbor Run"
        },
        layout: { showHeader: true },
        formatting: { courseUnit: "kt", waypointsText: "waypoints" },
        units: { distance: "nm" },
        formatUnits: { distance: "nm" },
        default: "---"
      },
      shellRect: { width: 320, height: 180 }
    });

    expect(readTextContent(activeMount, ".dyni-active-route-metric-value")).toBe("---");
    expect(editModel.metrics.dst.valueText).toBe("---");
    expect(editModel.metrics.rte.valueText).toBe("---");
    expect(routePointsModel.points[0].infoText).toBe("--kt/--nm");
    expect(routePointsModel.points[0].infoText).not.toBe("---");
  });

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
        eta: new Date("2026-03-06T11:45:00Z"),
        nextCourse: 93,
        routeName: "Harbor Run",
        disconnect: false
      },
      captions: { remain: "RTE", eta: "ETA", nextCourse: "NEXT" },
      units: { remain: "nm", eta: "", nextCourse: "deg" },
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
          eta: "2026-03-06T11:45:00Z",
          isActiveRoute: true,
          isLocalRoute: true,
          isServerRoute: false
        },
        layout: { ratioThresholdNormal: 1.2, ratioThresholdFlat: 3.8 },
        captions: { pts: "PTS", dst: "DST", rte: "RTE", eta: "ETA" },
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
