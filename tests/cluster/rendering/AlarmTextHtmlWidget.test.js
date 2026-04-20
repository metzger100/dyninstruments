const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmTextHtmlWidget", function () {
  function createHelpers() {
    const htmlWidgetUtilsModule = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
    const renderModelModule = loadFresh("shared/widget-kits/vessel/AlarmRenderModel.js");
    const markupModule = loadFresh("shared/widget-kits/vessel/AlarmMarkup.js");
    const htmlUtils = htmlWidgetUtilsModule.create();
    const fit = {
      compute: vi.fn(function (args) {
        const model = args && args.model ? args.model : {};
        return {
          mode: "normal",
          captionPx: 12,
          valuePx: 18,
          captionStyle: "font-size:12px;",
          valueStyle: "font-size:18px;",
          activeBackgroundStyle: model.showActiveBackground === true ? "background-color:#e04040;" : "",
          activeForegroundStyle: model.state === "active" ? "color:#ffffff;" : "",
          idleStripStyle: model.showStrip === true ? "background-color:#4488cc;" : "",
          showStrip: model.showStrip === true,
          showActiveBackground: model.showActiveBackground === true,
          valueSingleLine: true,
          interactionState: model.interactionState || "passive",
          state: model.state || "idle"
        };
      })
    };
    const themeResolver = {
      resolveForRoot: vi.fn(function () {
        return {
          colors: {
            alarmWidget: {
              bg: "#e04040",
              fg: "#ffffff",
              strip: "#4488cc"
            }
          },
          font: {
            family: "sans-serif",
            weight: 700,
            labelWeight: 600
          }
        };
      })
    };

    const Helpers = {
      requirePluginRoot(target) {
        return target;
      },
      getModule(id) {
        if (id === "AlarmHtmlFit") {
          return { create: () => fit };
        }
        if (id === "HtmlWidgetUtils") {
          return htmlWidgetUtilsModule;
        }
        if (id === "AlarmRenderModel") {
          return renderModelModule;
        }
        if (id === "AlarmMarkup") {
          return markupModule;
        }
        if (id === "ThemeResolver") {
          return themeResolver;
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return {
      htmlUtils: htmlUtils,
      fit: fit,
      rendererSpec: loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, Helpers)
    };
  }

  function makePayload(overrides) {
    const stopAll = vi.fn(() => true);
    const props = Object.assign({
      caption: "ALARM",
      ratioThresholdNormal: 1.0,
      ratioThresholdFlat: 3.0,
      surfacePolicy: {
        interaction: {
          mode: "dispatch"
        },
        actions: {
          alarm: {
            stopAll: stopAll
          }
        }
      },
      domain: {
        state: "active",
        alarmText: "ENGINE",
        hasActiveAlarms: true,
        activeCount: 1,
        alarmNames: ["ENGINE"]
      }
    }, overrides && overrides.props ? overrides.props : {});

    return Object.assign({
      rootEl: document.createElement("div"),
      shellEl: document.createElement("div"),
      shellRect: { width: 220, height: 100 },
      revision: 1,
      props: props,
      hostContext: {}
    }, overrides || {});
  }

  it("mounts a committed alarm root and dispatches only when active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload();

    committed.mount(mountHost, payload);

    expect(mountHost.querySelector(".dyni-alarm-root")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-shell")).toBeTruthy();

    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(payload.props.surfacePolicy.actions.alarm.stopAll).toHaveBeenCalledTimes(1);
  });

  it("removes dispatch handling when the widget becomes passive or editing is active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const payload = makePayload();
    const passivePayload = makePayload({
      props: {
        editing: true,
        surfacePolicy: {
          interaction: {
            mode: "passive"
          },
          actions: {
            alarm: {
              stopAll: payload.props.surfacePolicy.actions.alarm.stopAll
            }
          }
        },
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: []
        }
      }
    });
    const stopAll = payload.props.surfacePolicy.actions.alarm.stopAll;

    committed.mount(mountHost, payload);
    committed.update(passivePayload);

    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(stopAll).toHaveBeenCalledTimes(0);
  });

  it("keeps the active alarm shell passive when the surface policy is passive", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({ hostContext: {} });
    const mountHost = document.createElement("div");
    const stopAll = vi.fn(() => true);
    const payload = makePayload({
      props: {
        surfacePolicy: {
          interaction: {
            mode: "passive"
          },
          actions: {
            alarm: {
              stopAll: stopAll
            }
          }
        },
        domain: {
          state: "active",
          alarmText: "ENGINE",
          hasActiveAlarms: true,
          activeCount: 1,
          alarmNames: ["ENGINE"]
        }
      }
    });

    committed.mount(mountHost, payload);
    mountHost.querySelector(".dyni-alarm-root").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(stopAll).not.toHaveBeenCalled();
    expect(mountHost.querySelector(".dyni-alarm-shell")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-shell").classList.contains("dyni-alarm-state-active")).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-shell").classList.contains("dyni-alarm-cursor-passive")).toBe(true);
  });

  it("returns the locked vertical shell sizing", function () {
    const h = createHelpers();

    expect(h.rendererSpec.getVerticalShellSizing()).toEqual({
      kind: "ratio",
      aspectRatio: 2
    });
  });
});
