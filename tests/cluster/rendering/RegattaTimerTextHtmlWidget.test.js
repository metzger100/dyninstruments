const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RegattaTimerTextHtmlWidget", function () {
  function parseStyle(styleText) {
    return String(styleText || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce((acc, part) => {
        const idx = part.indexOf(":");
        if (idx <= 0) {
          return acc;
        }
        acc[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
        return acc;
      }, Object.create(null));
  }

  function readPx(styleText, key) {
    const raw = parseStyle(styleText)[key] || "";
    const match = raw.match(/^(\d+(?:\.\d+)?)px$/);
    return match ? Number(match[1]) : NaN;
  }

  function toTimerSeconds(displayText) {
    const text = String(displayText || "");
    const parts = text.split(":");
    if (parts.length === 2) {
      return (Number(parts[0]) * 60) + Number(parts[1]);
    }
    if (parts.length === 3) {
      return (Number(parts[0]) * 3600) + (Number(parts[1]) * 60) + Number(parts[2]);
    }
    return NaN;
  }

  function buildRenderer(options) {
    const audioEngine = {
      ensureContext: vi.fn(function () { return true; }),
      playTone: vi.fn(),
      destroy: vi.fn()
    };
    const audioModule = {
      create() {
        return {
          id: "RegattaTimerAudio",
          createAudioEngine() {
            return audioEngine;
          }
        };
      }
    };

    const modules = {
      RegattaTimerModel: loadFresh("shared/widget-kits/vessel/RegattaTimerModel.js"),
      RegattaTimerAudio: audioModule,
      RegattaTimerSessionStore: loadFresh("shared/widget-kits/vessel/RegattaTimerSessionStore.js"),
      RegattaTimerMarkup: loadFresh("shared/widget-kits/vessel/RegattaTimerMarkup.js"),
      RegattaTimerHtmlFit: loadFresh("shared/widget-kits/vessel/RegattaTimerHtmlFit.js"),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
    };
    const componentContext = createComponentContextMock({
      modules: modules,
      services: {
        dom: {
          requirePluginRoot(target) { return target || null; },
          getNightModeState() { return false; }
        },
        themeTokens: {
          resolveForRoot: vi.fn(function () {
            return {
              surface: { fg: "#ffffff", bg: "#000000", border: "#333333" },
              font: { family: "sans-serif", familyMono: "monospace", weight: 700, labelWeight: 700 },
              colors: {
                regatta: {
                  barWarning: "#e7a834",
                  barCritical: "#FA584A",
                  barDefault: "#70B0F3"
                }
              }
            };
          })
        }
      }
    });
    const rendererSpec = loadFresh("widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js").create({}, componentContext);
    return {
      rendererSpec: rendererSpec,
      audioEngine: audioEngine
    };
  }

  function makeProps(overrides) {
    return Object.assign({
      caption: "REGATTA",
      unit: "",
      cluster: "vessel",
      kind: "regattaTimer",
      regattaRouteId: "vessel/regattaTimer",
      regattaSoundEnabled: true,
      regattaProgressBar: true,
      regattaDuration: 5,
      stableDigits: false,
      regattaTimerRatioThresholdNormal: 1.0,
      regattaTimerRatioThresholdFlat: 3.0
    }, overrides || {});
  }

  function withSurfacePolicy(props, modeOrOptions) {
    const options = typeof modeOrOptions === "string" ? { mode: modeOrOptions } : (modeOrOptions || {});
    const interactionMode = options.mode === "passive" ? "passive" : "dispatch";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        pageId: options.pageId || "regattapage",
        routeId: options.routeId || "vessel/regattaTimer",
        cluster: options.cluster || "vessel",
        kind: options.kind || "regattaTimer",
        interaction: { mode: interactionMode },
        actions: {
          regatta: {
            start: vi.fn(),
            sync: vi.fn(),
            reset: vi.fn()
          }
        }
      }
    });
  }

  function createMountedRenderer(options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 260, height: 130 };
    const hostContext = opts.hostContext || {};
    const rendererBundle = opts.rendererBundle || buildRenderer(opts.rendererOptions);
    const { rendererSpec, audioEngine } = rendererBundle;
    const rootEl = document.createElement("div");
    rootEl.className = "widget dyniplugin";
    const shellEl = document.createElement("div");
    shellEl.className = "widgetData dyni-shell";
    shellEl.setAttribute("data-dyni-route", "vessel/regattaTimer");
    const mountEl = document.createElement("div");
    mountEl.className = "dyni-surface-html-mount";
    rootEl.appendChild(shellEl);
    shellEl.appendChild(mountEl);

    const committed = rendererSpec.createCommittedRenderer({
      hostContext: hostContext,
      mountEl: mountEl,
      shadowRoot: null
    });

    function payload(props, revision, shellRect) {
      const rect = shellRect || shellSize;
      return {
        props: props,
        revision: revision,
        rootEl: rootEl,
        shellEl: shellEl,
        mountEl: mountEl,
        shellRect: { width: rect.width, height: rect.height },
        shadowRoot: null,
        hostContext: hostContext,
        relayoutPass: 0
      };
    }

    const initialProps = opts.props || withSurfacePolicy(makeProps(), "dispatch");
    const initialPayload = payload(initialProps, 1);
    committed.mount(mountEl, initialPayload);
    committed.postPatch(initialPayload);

    return {
      rendererBundle: rendererBundle,
      rendererSpec: rendererSpec,
      committed: committed,
      mountEl: mountEl,
      audioEngine: audioEngine,
      currentProps: initialProps,
      currentRevision: 1,
      payloadFor(nextProps, nextRevision, nextShellRect) {
        return payload(nextProps, nextRevision, nextShellRect);
      },
      update(nextProps, nextShellRect) {
        this.currentProps = nextProps;
        this.currentRevision += 1;
        const nextPayload = payload(this.currentProps, this.currentRevision, nextShellRect);
        committed.update(nextPayload);
        committed.postPatch(nextPayload);
        return nextPayload;
      },
      html() {
        return mountEl.innerHTML;
      },
      wrapper() {
        return mountEl.querySelector(".dyni-regatta-html");
      },
      timeText() {
        const timeEl = mountEl.querySelector(".dyni-regatta-time");
        return timeEl ? String(timeEl.textContent || "").trim() : "";
      },
      clickAction(action) {
        const selector = '[data-dyni-action="' + action + '"]';
        const el = mountEl.querySelector(selector);
        expect(el, "missing action target: " + selector).toBeTruthy();
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
    };
  }

  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T12:00:00.000Z"));
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("resolves route metadata, preload assets, and inert pre-commit shell for regattaTimer", function () {
    const routeContext = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: {
          clusterRoutes: { routes: [] }
        }
      }
    });
    runIifeScript("config/cluster-routes/vessel.js", routeContext);

    const route = routeContext.DyniPlugin.config.clusterRoutes.routes.find(function (entry) {
      return entry.cluster === "vessel" && entry.kind === "regattaTimer";
    });

    expect(route).toEqual({
      cluster: "vessel",
      kind: "regattaTimer",
      mapperId: "VesselMapper",
      rendererId: "RegattaTimerTextHtmlWidget",
      surface: "html",
      shellSizing: { kind: "ratio", aspectRatio: 2 }
    });

    const registryContext = createScriptContext({
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {},
        state: {},
        config: { shared: {} }
      }
    });
    runIifeScript("config/components/registry-widgets-vessel.js", registryContext);
    const widgets = registryContext.DyniPlugin.config.shared.componentRegistryGroups.widgets;
    const component = widgets.RegattaTimerTextHtmlWidget;

    expect(component).toBeTruthy();
    expect(component.globalKey).toBe("DyniRegattaTimerTextHtmlWidget");
    expect(Array.isArray(component.shadowCss)).toBe(true);
    expect(component.shadowCss).toEqual([
      "http://host/plugins/dyninstruments/shared/html/HtmlShadowCommon.css",
      "http://host/plugins/dyninstruments/widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.css"
    ]);
    const context = createScriptContext({
      DyniPlugin: { runtime: {}, state: {}, config: {} }
    });
    runIifeScript("runtime/cluster/ClusterShellRenderer.js", context);

    const html = context.DyniPlugin.runtime.clusterShellRenderer.renderRouteShell(
      {
        cluster: "vessel",
        kind: "regattaTimer",
        __dyniRouteId: "vessel/regattaTimer",
        __dyniRawProps: {}
      },
      {
        surface: "html",
        shellSizing: { kind: "ratio", aspectRatio: 2 }
      },
      "test-instance",
      {}
    );

    expect(html).toContain('class="widgetData dyni-shell dyni-surface-html dyni-kind-regattaTimer dyni-cluster-vessel"');
    expect(html).toContain('<div class="dyni-surface-html"><div class="dyni-surface-html-mount" data-dyni-html-mount="1"></div></div>');
    expect(html).not.toContain("dyni-regatta-html");
    expect(html).not.toContain("dyni-regatta-time");
  });

  it("mounts idle markup and transitions across countdown, sync, elapsed, and reset", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.html()).toContain("05:00");
    expect(mounted.html()).toContain("dyni-regatta-bar");

    mounted.clickAction("regatta-start");
    expect(mounted.audioEngine.ensureContext).toHaveBeenCalledTimes(1);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    mounted.update(withSurfacePolicy(makeProps({ regattaDuration: 6 }), "dispatch"));
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(mounted.html()).not.toContain("06:00");

    vi.advanceTimersByTime(35000);
    expect(mounted.html()).toContain("04:25");
    mounted.clickAction("regatta-sync");
    expect(mounted.html()).toContain("04:00");

    vi.advanceTimersByTime(240000);
    expect(mounted.html()).toContain("dyni-regatta-phase-elapsed");
    expect(mounted.html()).toContain("00:00");

    mounted.clickAction("regatta-reset");
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.html()).toContain("05:00");
  });

  it("keeps listeners in dispatch mode, suppresses wrapper blank-space clicks, and stays passive otherwise", function () {
    const dispatchMounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    const parentClick = vi.fn();
    dispatchMounted.mountEl.addEventListener("click", parentClick);
    const wrapper = dispatchMounted.wrapper();
    const blankSpaceEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    const dispatchResult = wrapper.dispatchEvent(blankSpaceEvent);

    expect(wrapper.className).toContain("dyni-regatta-open-dispatch");
    expect(dispatchResult).toBe(false);
    expect(parentClick).not.toHaveBeenCalled();
    expect(blankSpaceEvent.defaultPrevented).toBe(true);

    dispatchMounted.clickAction("regatta-start");
    expect(dispatchMounted.html()).toContain("dyni-regatta-phase-countdown");

    const passiveMounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "passive")
    });
    expect(passiveMounted.wrapper().className).toContain("dyni-regatta-open-passive");
    passiveMounted.clickAction("regatta-start");
    expect(passiveMounted.html()).toContain("dyni-regatta-phase-idle");
  });

  it("preserves active countdown across detach/remount on the same hostContext", function () {
    const sharedHostContext = {};
    const mounted = createMountedRenderer({
      hostContext: sharedHostContext,
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 260, height: 130 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(35000);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(mounted.timeText()).toBe("04:25");

    mounted.committed.detach();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      hostContext: sharedHostContext,
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 260, height: 130 }
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:20");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores active countdown after remount with a new hostContext using stable route identity", function () {
    const props = withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "regattapage", routeId: "vessel/regattaTimer" });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props,
      shellSize: { width: 260, height: 130 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(35000);
    expect(mounted.timeText()).toBe("04:25");
    mounted.committed.detach();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props,
      shellSize: { width: 260, height: 130 }
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:20");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores to elapsed mode when remounted after countdown end with a new hostContext", function () {
    const props = withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "regattapage", routeId: "vessel/regattaTimer" });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(299000);
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");
    mounted.committed.destroy();
    vi.advanceTimersByTime(3000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-elapsed");
    expect(remounted.html()).not.toContain("dyni-regatta-phase-idle");
    expect(remounted.html()).not.toContain("05:00");
  });

  it("restores active countdown after destroy/remount with a new hostContext", function () {
    const props = withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "regattapage", routeId: "vessel/regattaTimer" });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(45000);
    expect(mounted.timeText()).toBe("04:15");
    mounted.committed.destroy();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-countdown");
    expect(remounted.timeText()).toBe("04:10");
  });

  it("reset clears persisted timer session across new hostContext remount", function () {
    const props = withSurfacePolicy(makeProps(), { mode: "dispatch", pageId: "regattapage", routeId: "vessel/regattaTimer" });
    const rendererBundle = buildRenderer();
    const mounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "first" },
      props: props
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(45000);
    mounted.clickAction("regatta-reset");
    expect(mounted.html()).toContain("dyni-regatta-phase-idle");
    expect(mounted.timeText()).toBe("05:00");
    mounted.committed.destroy();
    vi.advanceTimersByTime(5000);

    const remounted = createMountedRenderer({
      rendererBundle: rendererBundle,
      hostContext: { name: "second" },
      props: props
    });

    expect(remounted.html()).toContain("dyni-regatta-phase-idle");
    expect(remounted.timeText()).toBe("05:00");
  });

  it("keeps active countdown running when shellRect changes during update", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch"),
      shellSize: { width: 240, height: 120 }
    });

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(31000);
    const beforeResizeText = mounted.timeText();
    const beforeResizeSeconds = toTimerSeconds(beforeResizeText);
    expect(beforeResizeText).toBe("04:29");

    mounted.update(mounted.currentProps, { width: 320, height: 120 });
    expect(mounted.html()).toContain("dyni-regatta-phase-countdown");

    const afterResizeText = mounted.timeText();
    const afterResizeSeconds = toTimerSeconds(afterResizeText);
    expect(afterResizeSeconds).toBeLessThanOrEqual(beforeResizeSeconds);
    expect(afterResizeText).not.toBe("05:00");
  });

  it("keeps stable digits off by default and enables dyni-tabular only when configured", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({ stableDigits: false }), "dispatch")
    });
    const initialTime = mounted.mountEl.querySelector(".dyni-regatta-time");
    expect(initialTime.classList.contains("dyni-tabular")).toBe(false);

    mounted.update(withSurfacePolicy(makeProps({ stableDigits: true }), "dispatch"));
    const tabularTime = mounted.mountEl.querySelector(".dyni-regatta-time");
    expect(tabularTime.classList.contains("dyni-tabular")).toBe(true);
  });

  it("updates mode selection from ratio thresholds and toggles progress bar visibility", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0,
        regattaProgressBar: true
      }), "dispatch"),
      shellSize: { width: 200, height: 100 }
    });
    expect(mounted.html()).toContain("dyni-regatta-mode-normal");
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeTruthy();

    mounted.update(withSurfacePolicy(makeProps({
      regattaTimerRatioThresholdNormal: 1.0,
      regattaTimerRatioThresholdFlat: 1.5,
      regattaProgressBar: true
    }), "dispatch"));
    expect(mounted.html()).toContain("dyni-regatta-mode-flat");

    mounted.update(withSurfacePolicy(makeProps({
      regattaTimerRatioThresholdNormal: 2.5,
      regattaTimerRatioThresholdFlat: 4.0,
      regattaProgressBar: false
    }), "dispatch"));
    expect(mounted.html()).toContain("dyni-regatta-mode-high");
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeFalsy();
  });

  it("renders progress strip as top-level wrapper child across normal/high/flat modes when enabled", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaProgressBar: true,
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0
      }), "dispatch"),
      shellSize: { width: 220, height: 120 }
    });

    function expectTopBar(expectedModeClass) {
      const wrapper = mounted.wrapper();
      const bar = wrapper.querySelector(".dyni-regatta-bar");
      const display = wrapper.querySelector(".dyni-regatta-display");
      expect(wrapper.className).toContain(expectedModeClass);
      expect(bar).toBeTruthy();
      expect(bar.parentElement).toBe(wrapper);
      expect(display.querySelector(".dyni-regatta-bar")).toBeFalsy();
    }

    expectTopBar("dyni-regatta-mode-normal");

    mounted.update(withSurfacePolicy(makeProps({
      regattaProgressBar: true,
      regattaTimerRatioThresholdNormal: 1.0,
      regattaTimerRatioThresholdFlat: 1.5
    }), "dispatch"));
    expectTopBar("dyni-regatta-mode-flat");

    mounted.update(withSurfacePolicy(makeProps({
      regattaProgressBar: true,
      regattaTimerRatioThresholdNormal: 2.5,
      regattaTimerRatioThresholdFlat: 4.0
    }), "dispatch"));
    expectTopBar("dyni-regatta-mode-high");

    mounted.update(withSurfacePolicy(makeProps({ regattaProgressBar: false }), "dispatch"));
    expect(mounted.mountEl.querySelector(".dyni-regatta-bar")).toBeFalsy();
  });

  it("keeps compact geometry styles positive and separated for timer and controls", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0
      }), "dispatch"),
      shellSize: { width: 128, height: 64 }
    });
    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(56000);

    const wrapper = mounted.wrapper();
    const display = mounted.mountEl.querySelector(".dyni-regatta-display");
    const controls = mounted.mountEl.querySelector(".dyni-regatta-controls");
    const timer = mounted.mountEl.querySelector(".dyni-regatta-time");
    const button = mounted.mountEl.querySelector(".dyni-regatta-btn-sync");
    const timerSize = readPx(timer.getAttribute("style"), "font-size");
    const buttonHeight = readPx(button.getAttribute("style"), "height");

    expect(timerSize).toBeGreaterThan(0);
    expect(buttonHeight).toBeGreaterThan(0);
    expect(parseStyle(button.getAttribute("style"))["max-height"]).toBe(parseStyle(button.getAttribute("style"))["height"]);
    expect(parseStyle(button.getAttribute("style"))["min-height"]).toBe("0");
    expect(parseStyle(display.getAttribute("style"))["min-height"]).toBe("0");
    expect(parseStyle(controls.getAttribute("style"))["min-height"]).toBe("0");
    expect(wrapper.className).toContain("dyni-regatta-mode-normal");
  });

  it("uses a two-column controls grid in normal-mode countdown", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0
      }), "dispatch"),
      shellSize: { width: 220, height: 120 }
    });

    mounted.clickAction("regatta-start");

    const controls = mounted.mountEl.querySelector(".dyni-regatta-controls");
    const syncButton = mounted.mountEl.querySelector(".dyni-regatta-btn-sync");
    const resetButton = mounted.mountEl.querySelector(".dyni-regatta-btn-reset");
    const controlsStyle = parseStyle(controls.getAttribute("style"));
    const syncStyle = parseStyle(syncButton.getAttribute("style"));
    const resetStyle = parseStyle(resetButton.getAttribute("style"));

    expect(syncButton).toBeTruthy();
    expect(resetButton).toBeTruthy();
    expect(controlsStyle["grid-template-columns"]).toBe("repeat(2,minmax(0,1fr))");
    expect(controlsStyle["grid-template-rows"]).toBe("minmax(0,1fr)");
    expect(syncStyle.height).toBe(syncStyle["max-height"]);
    expect(resetStyle.height).toBe(resetStyle["max-height"]);
  });

  it("shrinks button labels for very narrow tall shells instead of enforcing intrinsic size", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0
      }), "dispatch"),
      shellSize: { width: 70, height: 220 }
    });
    const timeEl = mounted.mountEl.querySelector(".dyni-regatta-time");
    const startBtn = mounted.mountEl.querySelector(".dyni-regatta-btn-start");
    const timerFont = readPx(timeEl.getAttribute("style"), "font-size");
    const buttonFont = readPx(startBtn.getAttribute("style"), "font-size");
    const buttonHeight = readPx(startBtn.getAttribute("style"), "height");

    expect(buttonFont).toBeGreaterThan(0);
    expect(buttonFont).toBeLessThan(timerFont);
    expect(buttonHeight).toBeGreaterThan(0);
    expect(parseStyle(startBtn.getAttribute("style"))["min-height"]).toBe("0");
    expect(startBtn.getAttribute("style")).not.toContain("min-width");
    expect(startBtn.getAttribute("style")).not.toContain("em");
    expect(startBtn.getAttribute("style")).not.toContain("32px");
  });

  it("changes layoutSignature for phase/display time, shellRect, and mode", function () {
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaTimerRatioThresholdNormal: 1.0,
        regattaTimerRatioThresholdFlat: 3.0
      }), "dispatch"),
      shellSize: { width: 220, height: 120 }
    });
    const basePayload = mounted.payloadFor(mounted.currentProps, mounted.currentRevision, { width: 220, height: 120 });
    const baseSig = mounted.committed.layoutSignature(basePayload);

    mounted.clickAction("regatta-start");
    vi.advanceTimersByTime(1200);
    const tickingSig = mounted.committed.layoutSignature(basePayload);
    expect(tickingSig).not.toBe(baseSig);

    const shellChangedPayload = mounted.payloadFor(mounted.currentProps, mounted.currentRevision + 1, { width: 260, height: 120 });
    const shellSig = mounted.committed.layoutSignature(shellChangedPayload);
    expect(shellSig).not.toBe(tickingSig);

    const modeProps = withSurfacePolicy(makeProps({
      regattaTimerRatioThresholdNormal: 1.0,
      regattaTimerRatioThresholdFlat: 1.5
    }), "dispatch");
    const modePayload = mounted.payloadFor(modeProps, mounted.currentRevision + 2, { width: 220, height: 120 });
    const modeSig = mounted.committed.layoutSignature(modePayload);
    expect(modeSig).not.toBe(shellSig);
  });

  it("gates tone playback from regattaSoundEnabled", function () {
    const silent = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaSoundEnabled: false,
        regattaDuration: 3
      }), "dispatch")
    });
    silent.clickAction("regatta-start");
    vi.advanceTimersByTime(61000);
    expect(silent.audioEngine.playTone).not.toHaveBeenCalled();

    const audible = createMountedRenderer({
      props: withSurfacePolicy(makeProps({
        regattaSoundEnabled: true,
        regattaDuration: 3
      }), "dispatch")
    });
    audible.clickAction("regatta-start");
    vi.advanceTimersByTime(61000);
    expect(audible.audioEngine.playTone).toHaveBeenCalled();
  });

  it("detach removes root and clears timer interval, and destroy delegates to detach", function () {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const mounted = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    mounted.clickAction("regatta-start");
    expect(mounted.mountEl.querySelector(".dyni-regatta-root")).toBeTruthy();

    mounted.committed.detach();
    expect(mounted.mountEl.querySelector(".dyni-regatta-root")).toBeFalsy();
    expect(clearIntervalSpy).toHaveBeenCalled();
    const afterDetachHtml = mounted.mountEl.innerHTML;
    vi.advanceTimersByTime(5000);
    expect(mounted.mountEl.innerHTML).toBe(afterDetachHtml);

    const mountedForDestroy = createMountedRenderer({
      props: withSurfacePolicy(makeProps(), "dispatch")
    });
    mountedForDestroy.clickAction("regatta-start");
    expect(mountedForDestroy.mountEl.querySelector(".dyni-regatta-root")).toBeTruthy();
    mountedForDestroy.committed.destroy();
    expect(mountedForDestroy.mountEl.querySelector(".dyni-regatta-root")).toBeFalsy();

    clearIntervalSpy.mockRestore();
  });
});
