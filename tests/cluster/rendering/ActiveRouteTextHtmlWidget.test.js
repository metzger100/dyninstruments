const fs = require("node:fs");
const path = require("node:path");
const { loadFresh } = require("../../helpers/load-umd");

describe("ActiveRouteTextHtmlWidget", function () {
  const ORIGINAL_DYNI_PLUGIN = globalThis.DyniPlugin;

  function createRenderer(options) {
    const opts = options || {};
    const fitCompute = opts.fitCompute || vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { captionStyle: "font-size:12px;", valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { captionStyle: "font-size:11px;", valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { captionStyle: "font-size:10px;", valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
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
      applyFormatter: opts.applyFormatter || function (value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (value == null) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDistance") {
          return "DIST:" + String(value);
        }
        if (cfg.formatter === "formatTime") {
          return "TIME:" + String(value);
        }
        if (cfg.formatter === "formatClock") {
          return "CLOCK:" + String(value);
        }
        if (cfg.formatter === "formatDirection") {
          return "DIR:" + String(value);
        }
        return String(value);
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

    return {
      renderer: loadFresh("widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.js").create({}, Helpers),
      fitCompute
    };
  }

  afterEach(function () {
    if (typeof ORIGINAL_DYNI_PLUGIN === "undefined") {
      delete globalThis.DyniPlugin;
    } else {
      globalThis.DyniPlugin = ORIGINAL_DYNI_PLUGIN;
    }
  });

  function makeProps(overrides) {
    const opts = overrides || {};
    const base = {
      display: {
        remain: 12.4,
        eta: "2026-03-06T11:45:00Z",
        nextCourse: 93,
        isApproaching: true,
        routeName: "Harbor Run",
        disconnect: false,
        hideSeconds: false
      },
      captions: {
        remain: "RTE",
        eta: "ETA",
        nextCourse: "NEXT"
      },
      units: {
        remain: "nm",
        eta: "",
        nextCourse: "deg"
      },
      formatUnits: {
        remain: "nm"
      },
      default: "---"
    };
    const out = Object.assign({}, base, opts);
    out.display = Object.assign({}, base.display, opts.display || {});
    out.captions = Object.assign({}, base.captions, opts.captions || {});
    out.units = Object.assign({}, base.units, opts.units || {});
    out.formatUnits = Object.assign({}, base.formatUnits, opts.formatUnits || {});
    if (Object.prototype.hasOwnProperty.call(opts, "routeName")) out.display.routeName = opts.routeName;
    if (Object.prototype.hasOwnProperty.call(opts, "disconnect")) out.display.disconnect = opts.disconnect;
    if (Object.prototype.hasOwnProperty.call(opts, "hideSeconds")) out.display.hideSeconds = opts.hideSeconds;
    return out;
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const mode = opts.mode === "passive" ? "passive" : "dispatch";
    const openActiveRoute = opts.openActiveRoute || vi.fn(() => true);
    const pageId = opts.pageId || "navpage";
    const orientation = opts.orientation === "vertical" ? "vertical" : "default";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId,
        containerOrientation: orientation,
        interaction: { mode },
        actions: {
          routeEditor: {
            openActiveRoute
          }
        }
      }
    });
  }

  function createSurfaceDom() {
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin dyni-host-html";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    shellEl.appendChild(mountEl);
    rootEl.appendChild(shellEl);
    mountEl.getBoundingClientRect = vi.fn(() => ({
      width: 320,
      height: 180
    }));
    return {
      rootEl,
      shellEl,
      mountEl
    };
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

    function buildPayload(nextProps, revision, layoutChanged) {
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

    const initial = buildPayload(props, 1, true);
    committed.mount(mountEl, initial);
    committed.postPatch(initial);

    return {
      hostContext,
      mountEl,
      committed,
      update(nextProps) {
        const payload = buildPayload(nextProps, 2, true);
        committed.update(payload);
        committed.postPatch(payload);
      },
      html() {
        return mountEl.innerHTML;
      }
    };
  }

  it("exposes committed renderer contract", function () {
    const setup = createRenderer();
    const renderer = setup.renderer;

    expect(renderer.id).toBe("ActiveRouteTextHtmlWidget");
    expect(typeof renderer.createCommittedRenderer).toBe("function");
    expect(renderer.getVerticalShellSizing()).toEqual({ kind: "ratio", aspectRatio: 2 });
  });

  it("renders dispatch markup and dispatches route open on click", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-html");
    expect(html).toContain("dyni-active-route-open-dispatch");
    expect(html).toContain('data-dyni-action="active-route-open"');
    expect(html).toContain("dyni-active-route-open-hotspot");
    expect(html).toContain("DIST:12.4");
    expect(setup.fitCompute).toHaveBeenCalledTimes(1);
    expect(mounted.mountEl.querySelector(".dyni-active-route-metric-caption").getAttribute("style")).toBe("font-size:12px;");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).toHaveBeenCalledTimes(1);
  });

  it("keeps passive interaction in edit mode and does not dispatch", function () {
    const openActiveRoute = vi.fn(() => true);
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch", openActiveRoute })
    );

    const html = mounted.html();
    expect(html).toContain("dyni-active-route-open-passive");

    const wrapper = mounted.mountEl.querySelector(".dyni-active-route-html");
    wrapper.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).not.toHaveBeenCalled();
  });

  it("renders disconnected and no-route state screens with passive interaction", function () {
    const setup = createRenderer();
    const openActiveRoute = vi.fn(() => true);

    const disconnected = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), { mode: "dispatch", openActiveRoute })
    );
    expect(disconnected.html()).toContain("dyni-state-disconnected");
    expect(disconnected.html()).toContain("GPS Lost");
    expect(disconnected.html()).toContain("dyni-active-route-open-passive");
    expect(disconnected.html()).not.toContain("dyni-active-route-open-hotspot");
    disconnected.mountEl.querySelector(".dyni-active-route-html").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(openActiveRoute).not.toHaveBeenCalled();

    const noRouteByWpServer = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: false, wpServer: false, routeName: "Harbor Run" }), { mode: "dispatch", openActiveRoute })
    );
    expect(noRouteByWpServer.html()).toContain("dyni-state-no-route");
    expect(noRouteByWpServer.html()).toContain("No Route");

    const noRouteByEmptyName = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: false, wpServer: true, routeName: "   " }), { mode: "dispatch", openActiveRoute })
    );
    expect(noRouteByEmptyName.html()).toContain("dyni-state-no-route");
    expect(noRouteByEmptyName.html()).toContain("No Route");
  });

  it("keeps inline fitted font sizing on tiny state screens", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ disconnect: true }), { mode: "dispatch" }),
      { shellSize: { width: 2, height: 2 } }
    );

    const label = mounted.mountEl.querySelector(".dyni-state-screen-label");
    expect(label.textContent).toBe("GPS Lost");
    expect(label.getAttribute("style")).toBe("font-size:1px;");
  });

  it("renders ETA with formatClock when hideSeconds is enabled", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ hideSeconds: true }), { mode: "dispatch" })
    );

    expect(mounted.html()).toContain("CLOCK:");
    expect(mounted.html()).toContain("dyni-active-route-html");
  });

  it("normalizes known formatter fallback tokens to the configured default", function () {
    const setup = createRenderer({
      applyFormatter(value, formatterOptions) {
        const cfg = formatterOptions || {};
        if (cfg.formatter === "formatDistance") {
          return "  -";
        }
        if (cfg.formatter === "formatTime") {
          return "--:--:--";
        }
        if (cfg.formatter === "formatClock") {
          return "--:--";
        }
        if (cfg.formatter === "formatDirection") {
          return "NO DATA";
        }
        return value == null ? cfg.default : String(value);
      }
    });
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch" })
    );

    const valueTexts = Array.from(mounted.mountEl.querySelectorAll(".dyni-active-route-metric-value"))
      .map((el) => el.textContent);
    expect(valueTexts).toEqual(["---", "---", "---"]);
    expect(mounted.html()).not.toContain("--:--:--");
    expect(mounted.html()).not.toContain("NO DATA");
  });

  it("adds dyni-tabular class to metric values when stableDigits is enabled", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps({ stableDigits: true }), { mode: "dispatch" })
    );

    const valueEls = mounted.mountEl.querySelectorAll(".dyni-active-route-metric-value");
    expect(valueEls.length).toBeGreaterThan(0);
    valueEls.forEach((el) => {
      expect(el.classList.contains("dyni-tabular")).toBe(true);
    });
  });

  it("injects shared shadow css for stable digits into the committed shadow root", function () {
    const setup = createRenderer();
    const surfaceDom = createSurfaceDom();
    const sharedShadowCssUrl = "http://host/plugins/dyninstruments/shared/html/HtmlShadowCommon.css";
    const widgetShadowCssUrl = "http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css";
    const sharedShadowCssPath = path.join(process.cwd(), "shared/html/HtmlShadowCommon.css");
    const widgetShadowCssPath = path.join(process.cwd(), "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    const getShadowCssText = vi.fn(function (url) {
      if (url === sharedShadowCssUrl) {
        return fs.readFileSync(sharedShadowCssPath, "utf8");
      }
      if (url === widgetShadowCssUrl) {
        return fs.readFileSync(widgetShadowCssPath, "utf8");
      }
      return "";
    });

    globalThis.DyniPlugin = {
      runtime: {
        _theme: {
          getShadowCssText
        }
      }
    };

    const htmlSurfaceController = loadFresh("cluster/rendering/HtmlSurfaceController.js").create({}, {
      getModule(id) {
        if (id === "PerfSpanHelper") {
          return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
    const controller = htmlSurfaceController.createSurfaceController({
      rendererSpec: setup.renderer,
      hostContext: {},
      shadowCssUrls: [sharedShadowCssUrl, widgetShadowCssUrl]
    });

    controller.attach({
      surface: "html",
      rootEl: surfaceDom.rootEl,
      shellEl: surfaceDom.shellEl,
      props: withSurfacePolicy(makeProps({ stableDigits: true }), { mode: "dispatch" }),
      revision: 1
    });

    const shadowRoot = surfaceDom.mountEl.shadowRoot;
    const styles = Array.from(shadowRoot.querySelectorAll("style[data-dyni-shadow-css]"));
    expect(styles.map((styleEl) => styleEl.getAttribute("data-dyni-shadow-css"))).toEqual([
      sharedShadowCssUrl,
      widgetShadowCssUrl
    ]);
    expect(styles[0].textContent).toContain(".dyni-tabular");
    expect(styles[0].textContent).toContain(".dyni-state-screen-body");
    expect(styles[0].textContent).toContain(".dyni-state-screen-label");
    expect(styles[0].textContent).toContain("font-weight: var(--dyni-theme-font-label-weight, 700);");
    expect(styles[0].textContent).not.toContain("font-weight: var(--dyni-theme-font-label-weight, 650);");
    expect(shadowRoot.querySelector(".dyni-active-route-metric-value.dyni-tabular")).toBeTruthy();
    expect(getShadowCssText).toHaveBeenCalledWith(sharedShadowCssUrl);
    expect(getShadowCssText).toHaveBeenCalledWith(widgetShadowCssUrl);
  });

  it("renders no-route state screens in the committed shadow root with shared shadow css", function () {
    const setup = createRenderer();
    const surfaceDom = createSurfaceDom();
    const sharedShadowCssUrl = "http://host/plugins/dyninstruments/shared/html/HtmlShadowCommon.css";
    const widgetShadowCssUrl = "http://host/plugins/dyninstruments/widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css";
    const sharedShadowCssPath = path.join(process.cwd(), "shared/html/HtmlShadowCommon.css");
    const widgetShadowCssPath = path.join(process.cwd(), "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    const getShadowCssText = vi.fn(function (url) {
      if (url === sharedShadowCssUrl) {
        return fs.readFileSync(sharedShadowCssPath, "utf8");
      }
      if (url === widgetShadowCssUrl) {
        return fs.readFileSync(widgetShadowCssPath, "utf8");
      }
      return "";
    });

    globalThis.DyniPlugin = {
      runtime: {
        _theme: {
          getShadowCssText
        }
      }
    };

    const htmlSurfaceController = loadFresh("cluster/rendering/HtmlSurfaceController.js").create({}, {
      getModule(id) {
        if (id === "PerfSpanHelper") {
          return loadFresh("shared/widget-kits/perf/PerfSpanHelper.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
    const controller = htmlSurfaceController.createSurfaceController({
      rendererSpec: setup.renderer,
      hostContext: {},
      shadowCssUrls: [sharedShadowCssUrl, widgetShadowCssUrl]
    });

    controller.attach({
      surface: "html",
      rootEl: surfaceDom.rootEl,
      shellEl: surfaceDom.shellEl,
      props: withSurfacePolicy(makeProps({ disconnect: false, wpServer: false, routeName: "Harbor Run" }), { mode: "dispatch" }),
      revision: 1
    });

    const shadowRoot = surfaceDom.mountEl.shadowRoot;
    expect(shadowRoot.querySelector(".dyni-state-no-route")).toBeTruthy();
    expect(shadowRoot.querySelector(".dyni-state-screen-body")).toBeTruthy();
    const labelEl = shadowRoot.querySelector(".dyni-state-screen-label");
    expect(labelEl.textContent).toBe("No Route");
    expect(labelEl.getAttribute("style")).toMatch(/font-size:\d+px;/);

    const styles = Array.from(shadowRoot.querySelectorAll("style[data-dyni-shadow-css]"));
    expect(styles[0].textContent).toContain(".dyni-state-screen-body");
    expect(styles[0].textContent).toContain(".dyni-state-screen-label");
    expect(styles[0].textContent).toContain("font-weight: var(--dyni-theme-font-label-weight, 700);");
    expect(getShadowCssText).toHaveBeenCalledWith(sharedShadowCssUrl);
    expect(getShadowCssText).toHaveBeenCalledWith(widgetShadowCssUrl);
  });

  it("always consults ActiveRouteHtmlFit when a shell rect exists", function () {
    const fitCompute = vi.fn(function () {
      return {
        routeNameStyle: "font-size:14px;",
        metrics: {
          remain: { captionStyle: "font-size:12px;", valueStyle: "font-size:18px;", unitStyle: "font-size:11px;" },
          eta: { captionStyle: "font-size:11px;", valueStyle: "font-size:17px;", unitStyle: "font-size:10px;" },
          next: { captionStyle: "font-size:10px;", valueStyle: "font-size:16px;", unitStyle: "font-size:9px;" }
        }
      };
    });
    const setup = createRenderer({ fitCompute });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function payload(revision, layoutChanged) {
      return {
        props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        mountEl: mountEl,
        shadowRoot: null,
        shellRect: { width: 320, height: 180 },
        hostContext: hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const initial = payload(1, true);
    committed.mount(mountEl, initial);
    expect(fitCompute).toHaveBeenCalledTimes(1);

    const stableUpdate = payload(2, false);
    committed.update(stableUpdate);
    expect(fitCompute).toHaveBeenCalledTimes(2);
  });

  it("updates layout signature when ratio-driven mode changes", function () {
    const setup = createRenderer();
    const committed = setup.renderer.createCommittedRenderer({ hostContext: {}, mountEl: null, shadowRoot: null });

    const baseSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 220, height: 180 }
    });
    const flatSig = committed.layoutSignature({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 520, height: 120 }
    });

    expect(flatSig).not.toBe(baseSig);
  });

  it("mirrors page/orientation context into shadow-root-visible root", function () {
    const setup = createRenderer();
    const mounted = mountCommitted(
      setup.renderer,
      withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "editroutepage", orientation: "vertical" })
    );

    const root = mounted.mountEl.querySelector(".dyni-html-root");
    expect(root).toBeTruthy();
    expect(root.getAttribute("data-dyni-page-id")).toBe("editroutepage");
    expect(root.getAttribute("data-dyni-orientation")).toBe("vertical");
  });

  it("uses shadow-local css selectors", function () {
    const cssPath = path.join(process.cwd(), "widgets/text/ActiveRouteTextHtmlWidget/ActiveRouteTextHtmlWidget.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain(".dyni-html-root .dyni-active-route-html");
    expect(css).not.toContain("#navpage .widgetContainer.vertical");
    // Vertical mode must not self-expand beyond the committed surface box
    expect(css).not.toMatch(/aspect-ratio.*2\s*\/\s*1/);
    expect(css).not.toMatch(/min-height.*4\.8em/);
  });

  it("reuses prepared semantic model across layoutSignature and patchDom and invalidates on structural boundaries", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (value == null) {
        return cfg.default;
      }
      if (cfg.formatter === "formatDistance") {
        return "DIST:" + String(value);
      }
      if (cfg.formatter === "formatTime") {
        return "TIME:" + String(value);
      }
      if (cfg.formatter === "formatClock") {
        return "CLOCK:" + String(value);
      }
      if (cfg.formatter === "formatDirection") {
        return "DIR:" + String(value);
      }
      return String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    function buildPayload(props, revision, shellRect, layoutChanged) {
      return {
        props,
        revision,
        rootEl,
        shellEl,
        mountEl,
        shadowRoot: null,
        shellRect,
        hostContext,
        layoutChanged: layoutChanged === true,
        relayoutPass: 0
      };
    }

    const propsA = withSurfacePolicy(makeProps(), { mode: "dispatch" });
    const initial = buildPayload(propsA, 1, { width: 320, height: 180 }, true);
    committed.layoutSignature(initial);
    committed.mount(mountEl, initial);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    const revisionChanged = buildPayload(propsA, 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(revisionChanged);
    committed.update(revisionChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    const propsIdentityChanged = buildPayload(withSurfacePolicy(makeProps(), { mode: "dispatch" }), 2, { width: 320, height: 180 }, false);
    committed.layoutSignature(propsIdentityChanged);
    committed.update(propsIdentityChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(9);

    const shellSizeChanged = buildPayload(propsIdentityChanged.props, 2, { width: 321, height: 180 }, true);
    committed.layoutSignature(shellSizeChanged);
    committed.update(shellSizeChanged);
    expect(applyFormatter).toHaveBeenCalledTimes(12);
  });

  it("clears prepared semantic model state on detach and destroy", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      return value == null ? cfg.default : String(value);
    });
    const setup = createRenderer({ applyFormatter });
    const hostContext = {};
    const committed = setup.renderer.createCommittedRenderer({ hostContext, mountEl: null, shadowRoot: null });
    const rootEl = document.createElement("div");
    const shellEl = document.createElement("div");
    const mountEl = document.createElement("div");
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    const payload = {
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      revision: 7,
      rootEl,
      shellEl,
      mountEl,
      shadowRoot: null,
      shellRect: { width: 320, height: 180 },
      hostContext,
      layoutChanged: true,
      relayoutPass: 0
    };

    committed.layoutSignature(payload);
    committed.mount(mountEl, payload);
    expect(applyFormatter).toHaveBeenCalledTimes(3);

    committed.detach("test");
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(6);

    committed.mount(mountEl, payload);
    committed.destroy();
    committed.layoutSignature(payload);
    expect(applyFormatter).toHaveBeenCalledTimes(9);
  });
});
