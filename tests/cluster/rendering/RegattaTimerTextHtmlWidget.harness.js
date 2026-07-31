const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");
const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ height: number, width: number }} ShellRect
 * @typedef {{ reset: () => unknown, start: () => unknown, sync: () => unknown }} RegattaActions
 * @typedef {{ actions: { regatta: RegattaActions }, cluster: string, interaction: { mode: string }, kind: string, pageId: string, routeId: string }} RegattaSurfacePolicy
 * @typedef {Record<string, unknown> & { surfacePolicy?: RegattaSurfacePolicy }} RegattaProps
 * @typedef {{ cluster?: string, kind?: string, mode?: string, pageId?: string, routeId?: string }} SurfacePolicyOptions
 * @typedef {{ destroy: () => void, ensureContext: () => boolean, playTone: (frequency?: unknown, durationMs?: unknown) => void }} AudioEngine
 * @typedef {{ destroy: () => void, detach: (options?: Record<string, unknown>) => void, layoutSignature: (payload: Record<string, unknown>) => string, mount: (mountHostEl: HTMLElement, payload: Record<string, unknown>) => void, postPatch: (payload?: Record<string, unknown>) => boolean, update: (payload: Record<string, unknown>) => void }} CommittedRenderer
 * @typedef {{ createCommittedRenderer: (context: Record<string, unknown>) => CommittedRenderer, id: string, wantsHideNativeHead?: boolean }} RendererSpec
 * @typedef {{ audioEngine: AudioEngine, rendererSpec: RendererSpec }} RendererBundle
 * @typedef {{ hostContext?: Record<string, unknown>, props?: RegattaProps, rendererBundle?: RendererBundle, rendererOptions?: unknown, shellSize?: ShellRect }} CreateMountedRendererOptions
 * @typedef {{ maxH: number, maxW: number, text: string }} FitSingleLineBinaryArgs
 */

/** @param {unknown} styleText */
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
    }, /** @type {Record<string, string>} */ (Object.create(null)));
}

/** @param {unknown} styleText @param {string} key */
function readPx(styleText, key) {
  const raw = parseStyle(styleText)[key] || "";
  const match = raw.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : NaN;
}

/** @param {unknown} displayText */
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

/** @param {unknown} [options] @returns {RendererBundle} */
function buildRenderer(options) {
  const measureCtx = {
    font: "700 12px sans-serif",
    /** @param {unknown} text */
    measureText(text) {
      const match = String(this.font || "").match(/(\d+(?:\.\d+)?)px/);
      const px = match ? Number(match[1]) : 12;
      return { width: String(text || "").length * px * 0.52 };
    }
  };
  const audioEngine = {
    ensureContext: vi.fn(function () {
      return true;
    }),
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
    GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js"),
    HtmlMeasureUtils: {
      create() {
        return {
          id: "HtmlMeasureUtils",
          resolveMeasureContext: vi.fn(function () {
            return measureCtx;
          })
        };
      }
    },
    TextLayoutEngine: {
      create() {
        return {
          id: "TextLayoutEngine",
          /** @param {FitSingleLineBinaryArgs} args */
          fitSingleLineBinary: vi.fn(function (args) {
            return {
              px: Math.min(args.maxH, Math.floor(args.maxW / Math.max(1, args.text.length * 0.52))),
              width: 0
            };
          })
        };
      }
    },
    HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
    ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js")
  };
  const componentContext = createComponentContextMock({
    modules: modules,
    services: {
      dom: {
        /** @param {unknown} target */
        requirePluginRoot(target) {
          return target || null;
        },
        getNightModeState() {
          return false;
        }
      },
      themeTokens: {
        resolveForRoot: vi.fn(function () {
          return {
            surface: { fg: "#ffffff", bg: "#000000", border: "#333333" },
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 700,
              labelWeight: 700
            },
            strokeWeight: 1.28,
            regatta: { buttonStrokeWeight: 1.28 },
            colors: {
              regatta: {
                barWarning: "#e0a92e",
                barCritical: "#d9534a",
                barDefault: "#3366cc"
              }
            }
          };
        })
      }
    }
  });
  const rendererSpec = /** @type {RendererSpec} */ (
    loadFresh("widgets/text/RegattaTimerTextHtmlWidget/RegattaTimerTextHtmlWidget.js").create({}, componentContext)
  );
  return {
    rendererSpec: rendererSpec,
    audioEngine: audioEngine
  };
}

/** @param {RegattaProps} [overrides] @returns {RegattaProps} */
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
      regattaTimerRatioThresholdFlat: 3.0
    },
    overrides || {}
  );
}

/** @param {RegattaProps} props @param {SurfacePolicyOptions | string} [modeOrOptions] @returns {RegattaProps} */
function withSurfacePolicy(props, modeOrOptions) {
  const options = typeof modeOrOptions === "string" ? { mode: modeOrOptions } : modeOrOptions || {};
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

/** @param {CreateMountedRendererOptions} [options] */
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

  /** @param {RegattaProps} props @param {number} revision @param {ShellRect} [shellRect] */
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
    /** @param {RegattaProps} nextProps @param {number} nextRevision @param {ShellRect} [nextShellRect] */
    payloadFor(nextProps, nextRevision, nextShellRect) {
      return payload(nextProps, nextRevision, nextShellRect);
    },
    /** @param {RegattaProps} nextProps @param {ShellRect} [nextShellRect] */
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
    /** @param {string} action */
    clickAction(action) {
      const selector = '[data-dyni-action="' + action + '"]';
      const el = mountEl.querySelector(selector);
      expect(el, "missing action target: " + selector).toBeTruthy();
      if (el) {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
    }
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
  installFakeTimerHooks
};
