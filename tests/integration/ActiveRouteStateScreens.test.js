const { loadFresh } = require("../helpers/load-umd");
const { createComponentContextMock } = require("../helpers/component-context-mock");
const { makeRouteContext } = require("../helpers/mapper-route-context");

function createToolkit() {
  loadFresh("shared/unit-format-families.js");
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
    caption_activeRouteRemain: "RTE CAP",
    formatUnit_activeRouteRemain: "nm",
    unit_activeRouteRemain_nm: "nm",
    caption_activeRouteEta: "ETA CAP",
    unit_activeRouteEta: "",
    caption_activeRouteNextCourse: "NEXT CAP",
    unit_activeRouteNextCourse: "deg"
  });
}

function createNavMapper() {
  const componentContext = createComponentContextMock({
    modules: {
      ActiveRouteViewModel: loadFresh("cluster/viewmodels/ActiveRouteViewModel.js"),
      EditRouteViewModel: loadFresh("cluster/viewmodels/EditRouteViewModel.js"),
      RoutePointsViewModel: loadFresh("cluster/viewmodels/RoutePointsViewModel.js"),
      CenterDisplayMath: loadFresh("shared/widget-kits/nav/CenterDisplayMath.js")
    }
  });
  return loadFresh("cluster/mappers/NavMapper.js").create({}, componentContext);
}

function createActiveRouteViewModel() {
  return loadFresh("cluster/viewmodels/ActiveRouteViewModel.js").create();
}

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
    formatMetric(rawValue, formatter, formatterParameters, defaultText, _context, placeholderNormalize) {
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
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js"),
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
  return mountEl.innerHTML;
}

function makeRawProps(overrides) {
  return Object.assign({
    kind: "activeRoute",
    activeRouteName: "R1",
    activeRouteRemain: 18.2,
    activeRouteEta: new Date("2026-03-06T11:45:00Z"),
    activeRouteNextCourse: 93,
    activeRouteApproaching: true,
    wpServer: true,
    disconnect: false,
    default: "---"
  }, overrides || {});
}

function withSurfacePolicy(props) {
  return Object.assign({}, props, {
    surfacePolicy: {
      pageId: "navpage",
      containerOrientation: "default",
      interaction: { mode: "dispatch" },
      actions: {
        routeEditor: {
          openActiveRoute: vi.fn(() => true)
        }
      }
    }
  });
}

describe("ActiveRoute state-screen integration", function () {
  it("classifies data/disconnected/noRoute from raw mapper + widget signals", function () {
    const mapper = createNavMapper();
    const toolkit = createToolkit();
    const activeRouteViewModel = createActiveRouteViewModel();
    const widget = createActiveRouteWidget();

    function renderFromRaw(rawProps) {
      const mapped = mapper.translate(rawProps, makeRouteContext({
        routeId: "nav/activeRoute",
        cluster: "nav",
        kind: "activeRoute",
        toolkit: toolkit,
        viewModel: activeRouteViewModel
      }));
      const merged = withSurfacePolicy(Object.assign({}, rawProps, mapped));
      return mountHtml(widget, merged);
    }

    const dataHtml = renderFromRaw(makeRawProps({
      disconnect: false,
      wpServer: true,
      activeRouteName: "R1"
    }));
    const disconnectedHtml = renderFromRaw(makeRawProps({
      disconnect: true,
      wpServer: true,
      activeRouteName: "R1"
    }));
    const noRouteByNameHtml = renderFromRaw(makeRawProps({
      disconnect: false,
      wpServer: true,
      activeRouteName: ""
    }));
    const noRouteByWpServerHtml = renderFromRaw(makeRawProps({
      disconnect: false,
      wpServer: false,
      activeRouteName: "R1"
    }));

    expect(dataHtml).toContain("dyni-active-route-html");
    expect(dataHtml).not.toContain("dyni-state-disconnected");
    expect(dataHtml).not.toContain("dyni-state-no-route");

    expect(disconnectedHtml).toContain("dyni-state-disconnected");
    expect(disconnectedHtml).toContain("GPS Lost");

    expect(noRouteByNameHtml).toContain("dyni-state-no-route");
    expect(noRouteByNameHtml).toContain("No Route");

    expect(noRouteByWpServerHtml).toContain("dyni-state-no-route");
    expect(noRouteByWpServerHtml).toContain("No Route");
  });
});
