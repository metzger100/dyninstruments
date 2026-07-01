const {
  createScriptContext,
  runIifeScript,
} = require("../../helpers/eval-iife");
const { loadFresh } = require("../../helpers/load-umd");
const {
  createComponentContextMock,
} = require("../../helpers/component-context-mock");

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
      return Number(parts[0]) * 60 + Number(parts[1]);
    }
    if (parts.length === 3) {
      return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
    }
    return NaN;
  }

  function buildRenderer(options) {
    const measureCtx = {
      font: "700 12px sans-serif",
      measureText(text) {
        const match = String(this.font || "").match(/(\d+(?:\.\d+)?)px/);
        const px = match ? Number(match[1]) : 12;
        return { width: String(text || "").length * px * 0.52 };
      },
    };
    const audioEngine = {
      ensureContext: vi.fn(function () {
        return true;
      }),
      playTone: vi.fn(),
      destroy: vi.fn(),
    };
    const audioModule = {
      create() {
        return {
          id: "RegattaTimerAudio",
          createAudioEngine() {
            return audioEngine;
          },
        };
      },
    };

    const modules = {
      RegattaTimerModel: loadFresh(
        "shared/widget-kits/vessel/RegattaTimerModel.js",
      ),
      RegattaTimerAudio: audioModule,
      RegattaTimerSessionStore: loadFresh(
        "shared/widget-kits/vessel/RegattaTimerSessionStore.js",
      ),
      RegattaTimerMarkup: loadFresh(
        "shared/widget-kits/vessel/RegattaTimerMarkup.js",
      ),
      RegattaTimerHtmlFit: loadFresh(
        "shared/widget-kits/vessel/RegattaTimerHtmlFit.js",
      ),
      HtmlMeasureUtils: {
        create() {
          return {
            id: "HtmlMeasureUtils",
            resolveMeasureContext: vi.fn(function () {
              return measureCtx;
            }),
          };
        },
      },
      TextLayoutEngine: {
        create() {
          return {
            id: "TextLayoutEngine",
            fitSingleLineBinary: vi.fn(function (args) {
              return {
                px: Math.min(
                  args.maxH,
                  Math.floor(args.maxW / Math.max(1, args.text.length * 0.52)),
                ),
                width: 0,
              };
            }),
          };
        },
      },
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
    };
    const componentContext = createComponentContextMock({
      modules: modules,
      services: {
        dom: {
          requirePluginRoot(target) {
            return target || null;
          },
          getNightModeState() {
            return false;
          },
        },
        themeTokens: {
          resolveForRoot: vi.fn(function () {
            return {
              surface: { fg: "#ffffff", bg: "#000000", border: "#333333" },
              font: {
                family: "sans-serif",
                familyMono: "monospace",
                weight: 700,
                labelWeight: 700,
              },
              colors: {
                regatta: {
                  barWarning: "#e0a92e",
                  barCritical: "#d9534a",
                  barDefault: "#3366cc",
                },
              },
            };
          }),
        },
      },
    });
    const rendererSpec = loadFresh(
      "widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js",
    ).create({}, componentContext);
    return {
      rendererSpec: rendererSpec,
      audioEngine: audioEngine,
    };
  }

  function makeProps(overrides) {
    return Object.assign(
      {
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
        regattaTimerRatioThresholdFlat: 3.0,
      },
      overrides || {},
    );
  }

  function withSurfacePolicy(props, modeOrOptions) {
    const options =
      typeof modeOrOptions === "string"
        ? { mode: modeOrOptions }
        : modeOrOptions || {};
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
            reset: vi.fn(),
          },
        },
      },
    });
  }

  function createMountedRenderer(options) {
    const opts = options || {};
    const shellSize = opts.shellSize || { width: 260, height: 130 };
    const hostContext = opts.hostContext || {};
    const rendererBundle =
      opts.rendererBundle || buildRenderer(opts.rendererOptions);
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
      shadowRoot: null,
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
        relayoutPass: 0,
      };
    }

    const initialProps =
      opts.props || withSurfacePolicy(makeProps(), "dispatch");
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
        const nextPayload = payload(
          this.currentProps,
          this.currentRevision,
          nextShellRect,
        );
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
        el.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      },
    };
  }

  function installFakeTimerHooks() {
    beforeEach(function () {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-01T12:00:00.000Z"));
    });

    afterEach(function () {
      vi.useRealTimers();
    });
  }

module.exports = {
  parseStyle,
  readPx,
  toTimerSeconds,
  buildRenderer,
  makeProps,
  withSurfacePolicy,
  createMountedRenderer,
  installFakeTimerHooks,
};
