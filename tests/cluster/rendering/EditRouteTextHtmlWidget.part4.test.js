// @ts-nocheck
const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("EditRouteTextHtmlWidget", function () {
  function createRenderer(options) {
    const opts = options || {};
    const buildModel =
      opts.buildModel ||
      vi.fn(function (args) {
        const props = args && args.props ? args.props : {};
        const canOpen = props.__canOpen === true;
        return {
          kind: props.__kind || "data",
          mode: "normal",
          hasRoute: true,
          isLocalRoute: false,
          isServerRoute: false,
          isActiveRoute: false,
          canOpenEditRoute: canOpen,
          captureClicks: canOpen,
          resizeSignatureParts: ["sig", props.__token || "1"],
          nameText: "Route",
          sourceBadgeText: "",
          metrics: Object.create(null),
          visibleMetricIds: [],
          flatMetricRows: 1,
          metricsStyle: "",
          wrapperStyle: ""
        };
      });
    const fitCompute =
      opts.fitCompute ||
      vi.fn(() => ({
        nameTextStyle: "font-size:12px;",
        sourceBadgeStyle: "font-size:9px;",
        metrics: Object.create(null)
      }));
    const markupRender =
      opts.markupRender ||
      vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        const state = model.canOpenEditRoute ? "dispatch" : "passive";
        return (
          "" +
          '<div class="dyni-edit-route-html dyni-edit-route-open-' +
          state +
          '" data-dyni-action="edit-route-open">' +
          (model.canOpenEditRoute ? '<div class="dyni-edit-route-open-hotspot"></div>' : "") +
          "</div>"
        );
      });

    const componentContext = createComponentContextMock({
      modules: {
        EditRouteHtmlFit: {
          create() {
            return { compute: fitCompute };
          }
        },
        HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
        EditRouteRenderModel: {
          create() {
            return { buildModel };
          }
        },
        EditRouteMarkup: {
          create() {
            return { render: markupRender };
          }
        }
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
      renderer: loadFresh("widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.js").create(
        {},
        componentContext
      ),
      buildModel,
      fitCompute,
      markupRender
    };
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    const openEditRoute = opts.openEditRoute || vi.fn(() => true);

    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: opts.pageId || "navpage",
        interaction: { mode },
        containerOrientation: orientation,
        actions: {
          routeEditor: {
            openEditRoute
          }
        }
      }
    });
  }

  function mountCommitted(rendererSpec, props, options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 320, height: 180 };
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
    committed.postPatch(initial);

    return {
      mountEl,
      committed,
      update(nextProps, layoutChanged) {
        const next = payload(nextProps, layoutChanged === true);
        committed.update(next);
        committed.postPatch(next);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-edit-route-html");
    expect(css).not.toContain(".widgetContainer.vertical .widget.dyniplugin");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*7\s*\/\s*8/);
    expect(css).not.toMatch(/min-height.*8em/);
    expect(css).toContain("padding: 0.08em 0.12em;");
    expect(css).toContain("gap: 0.08em;");
    expect(css).toContain("row-gap: 0.04em;");
    expect(css).not.toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(css).toContain("grid-template-rows: minmax(0, 0.34fr) minmax(0, 0.66fr);");
    expect(css).toContain("align-content: stretch;");
    expect(css).toContain("flex: 0 1 auto;");
    expect(css).toContain("flex: 0 0 auto;");
    expect(css).not.toContain("overflow: hidden;");
  });

  it("keeps metric row fractions and shrink guards in css", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/EditRouteTextHtmlWidget/EditRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    const labelBlockPattern = /\.dyni-html-root \.dyni-edit-route-metric-label \{[\s\S]*?min-height: 0\x3b/;
    const valueBlockPattern = /\.dyni-html-root \.dyni-edit-route-metric-value \{[\s\S]*?min-height: 0\x3b/;
    expect(css).toMatch(labelBlockPattern);
    expect(css).toMatch(valueBlockPattern);
    expect(css).not.toContain("overflow: hidden;");
  });
});
