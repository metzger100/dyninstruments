const { loadFresh } = require("../helpers/load-umd");

function createToolkit() {
  return loadFresh("cluster/mappers/ClusterMapperToolkit.js").create().createToolkit({
    caption_activeRouteRemain: "RTE CAP",
    unit_activeRouteRemain: "nm",
    caption_activeRouteEta: "ETA CAP",
    unit_activeRouteEta: "",
    caption_activeRouteNextCourse: "NEXT CAP",
    unit_activeRouteNextCourse: "deg"
  });
}

function createNavMapper() {
  const Helpers = {
    getModule(id) {
      if (id === "ActiveRouteViewModel") {
        return loadFresh("cluster/viewmodels/ActiveRouteViewModel.js");
      }
      if (id === "EditRouteViewModel") {
        return loadFresh("cluster/viewmodels/EditRouteViewModel.js");
      }
      if (id === "RoutePointsViewModel") {
        return loadFresh("cluster/viewmodels/RoutePointsViewModel.js");
      }
      if (id === "CenterDisplayMath") {
        return loadFresh("shared/widget-kits/nav/CenterDisplayMath.js");
      }
      throw new Error("unexpected module: " + id);
    }
  };
  return loadFresh("cluster/mappers/NavMapper.js").create({}, Helpers);
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
  const Helpers = {
    applyFormatter(value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    },
    getModule(id) {
      if (id === "ActiveRouteHtmlFit") {
        return { create: () => ({ compute: fitCompute }) };
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
    const widget = createActiveRouteWidget();

    function renderFromRaw(rawProps) {
      const mapped = mapper.translate(rawProps, toolkit);
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
