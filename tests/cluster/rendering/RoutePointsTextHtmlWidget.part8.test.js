// @ts-nocheck
const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RoutePointsTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel =
      opts.buildModel ||
      vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        const interactionState = props.__interactionState || (props.__canActivate === true ? "dispatch" : "passive");
        const points = Array.isArray(props.__points)
          ? props.__points
          : [
              {
                index: 0,
                ordinalText: "1",
                nameText: "WP1",
                infoText: "I",
                selected: false
              }
            ];
        return {
          mode: props.__mode || "normal",
          kind: props.__kind || "data",
          stateLabel: props.__stateLabel || "",
          interactionState,
          stableDigitsEnabled: props.__stableDigits === true,
          showHeader: true,
          showOrdinal: true,
          hasRoute: (props.__kind || "data") === "data",
          routeNameText: "Route",
          metaText: "1 WP",
          points,
          isActiveRoute: false,
          canActivateRoutePoint: interactionState === "dispatch",
          hasValidSelection: props.__hasValidSelection === true,
          selectedIndex: Number.isInteger(props.__selectedIndex) ? props.__selectedIndex : -1,
          activeWaypointKey: props.__activeKey || null,
          resizeSignatureParts: ["sig", props.__token || "1"],
          inlineGeometry: {
            wrapper: { style: "" },
            list: { style: "", contentStyle: "" },
            header: { style: "", routeNameStyle: "", metaStyle: "" },
            rows: points.map(function () {
              return {
                rowStyle: "",
                ordinalStyle: "",
                middleStyle: "",
                nameStyle: "",
                infoStyle: "",
                markerStyle: "",
                markerDotStyle: ""
              };
            })
          }
        };
      });
    const fitCompute =
      opts.fitCompute ||
      vi.fn(function (args) {
        const model = args && args.model ? args.model : { points: [] };
        return {
          headerFit: { routeNameStyle: "", metaStyle: "" },
          rowFits: model.points.map(function () {
            return { ordinalStyle: "", nameStyle: "", infoStyle: "" };
          }),
          emptyStyle: ""
        };
      });
    const maybeReveal = opts.maybeReveal || vi.fn(() => true);
    const measureListScrollbarGutter = opts.measureListScrollbarGutter || vi.fn(() => 0);
    const computeNaturalHeight = opts.computeNaturalHeight || vi.fn(() => ({ cappedHeight: 240 }));

    const componentContext = createComponentContextMock({
      modules: {
        RoutePointsHtmlFit: {
          create() {
            return { compute: fitCompute };
          }
        },
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        RoutePointsRenderModel: {
          create() {
            return { buildModel };
          }
        },
        RoutePointsMarkup: loadFresh("shared/widget-kits/nav/RoutePointsMarkup.js"),
        RoutePointsDomEffects: {
          create() {
            return {
              measureListScrollbarGutter,
              maybeRevealActiveRow: maybeReveal,
              scheduleSelectedRowVisibility: maybeReveal
            };
          }
        },
        RoutePointsLayout: {
          create() {
            return { computeNaturalHeight };
          }
        },
        StateScreenMarkup: loadFresh("shared/widget-kits/state/StateScreenMarkup.js"),
        StateScreenTextFit: loadFresh("shared/widget-kits/state/StateScreenTextFit.js"),
        StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js")
      },
      services: {
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

    return {
      renderer: loadFresh("widgets/text/RoutePointsTextHtmlWidget/RoutePointsTextHtmlWidget.js").create(
        {},
        componentContext
      ),
      buildModel,
      fitCompute,
      maybeReveal,
      measureListScrollbarGutter,
      computeNaturalHeight
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const activate = opts.activate || vi.fn(() => true);
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        interaction: { mode },
        containerOrientation: orientation,
        actions: {
          routePoints: {
            activate
          }
        }
      }
    });
  }

  function mountCommitted(rendererSpec, props, options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 300, height: 160 };
    const hostContext = opts.hostContext || {};
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    hostContext.__dyniHostCommitState = { rootEl, shellEl };

    mountEl.getBoundingClientRect = vi.fn(() => ({
      width: shellSize.width,
      height: shellSize.height
    }));

    const committed = rendererSpec.createCommittedRenderer({
      hostContext,
      mountEl,
      shadowRoot: null
    });

    let revision = 0;

    function payload(nextProps, layoutChanged) {
      revision += 1;
      return {
        props: nextProps,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect: { width: shellSize.width, height: shellSize.height },
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = payload(props, true);
    committed.mount(mountEl, initial);
    const postPatchResult = committed.postPatch(initial);

    return {
      mountEl,
      committed,
      postPatchResult,
      update(nextProps, layoutChanged) {
        const next = payload(nextProps, layoutChanged === true);
        committed.update(next);
        return committed.postPatch(next);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("derives layout signature from model resizeSignatureParts", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({
      hostContext: {},
      mountEl: null,
      shadowRoot: null
    });

    const sigA = committed.layoutSignature({
      props: { __token: "A" },
      shellRect: { width: 300, height: 160 }
    });
    const sigB = committed.layoutSignature({
      props: { __token: "B" },
      shellRect: { width: 300, height: 160 }
    });

    expect(sigB).not.toBe(sigA);
  });
});
