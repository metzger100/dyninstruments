const {
  readCss,
  escapeRegExp,
  normalizeRuleBody,
  readRuleBody,
  normalizeSelectorList,
  readCombinedRuleBody,
  expectDeclaration,
  createHelpers,
  makePayload,
  createRealAlarmRenderer,
  createAisRendererWithRealLayout,
  mountRenderer,
  readStyleFields,
  createAlarmMeasureContext,
} = require("./AlarmTextHtmlWidget.harness.js");

describe("AlarmTextHtmlWidget", function () {
  it("mounts a committed alarm root and dispatches only when active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const mountHost = document.createElement("div");
    const payload = makePayload();

    committed.mount(mountHost, payload);

    expect(mountHost.querySelector(".dyni-alarm-root")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-html")).toBeTruthy();
    expect(
      mountHost
        .querySelector(".dyni-alarm-html")
        .classList.contains("dyni-alarm-open-dispatch"),
    ).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-main")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main-normal")).toBeTruthy();

    mountHost
      .querySelector(".dyni-alarm-root")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(
      payload.props.surfacePolicy.actions.alarm.stopAll,
    ).toHaveBeenCalledTimes(1);
  });

  it("forwards fontMetricsEpoch into AlarmHtmlFit.compute", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const mountHost = document.createElement("div");
    const payload = makePayload({ fontMetricsEpoch: 7 });

    committed.mount(mountHost, payload);

    expect(h.fit.compute).toHaveBeenCalledTimes(1);
    expect(h.fit.compute.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        fontMetricsEpoch: 7,
      }),
    );
  });

  it("removes dispatch handling when the widget becomes passive or editing is active", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const mountHost = document.createElement("div");
    const payload = makePayload();
    const passivePayload = makePayload({
      props: {
        editing: true,
        surfacePolicy: {
          interaction: {
            mode: "passive",
          },
          actions: {
            alarm: {
              stopAll: payload.props.surfacePolicy.actions.alarm.stopAll,
            },
          },
        },
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: [],
        },
      },
    });
    const stopAll = payload.props.surfacePolicy.actions.alarm.stopAll;

    committed.mount(mountHost, payload);
    committed.update(passivePayload);

    expect(
      mountHost
        .querySelector(".dyni-alarm-html")
        .classList.contains("dyni-alarm-open-passive"),
    ).toBe(true);
    expect(mountHost.querySelector(".dyni-alarm-open-hotspot")).toBeFalsy();

    mountHost
      .querySelector(".dyni-alarm-root")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(stopAll).toHaveBeenCalledTimes(0);
  });

  it("keeps the active alarm shell passive when the surface policy is passive", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const mountHost = document.createElement("div");
    const stopAll = vi.fn(() => true);
    const payload = makePayload({
      props: {
        surfacePolicy: {
          interaction: {
            mode: "passive",
          },
          actions: {
            alarm: {
              stopAll: stopAll,
            },
          },
        },
        domain: {
          state: "active",
          alarmText: "ENGINE",
          hasActiveAlarms: true,
          activeCount: 1,
          alarmNames: ["ENGINE"],
        },
      },
    });

    committed.mount(mountHost, payload);
    mountHost
      .querySelector(".dyni-alarm-root")
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(stopAll).not.toHaveBeenCalled();
    expect(mountHost.querySelector(".dyni-alarm-html")).toBeTruthy();
    expect(
      mountHost
        .querySelector(".dyni-alarm-html")
        .classList.contains("dyni-alarm-state-active"),
    ).toBe(true);
    expect(
      mountHost
        .querySelector(".dyni-alarm-html")
        .classList.contains("dyni-alarm-open-passive"),
    ).toBe(true);
  });

  it("renders the idle accent and main content wrapper when the alarm is idle", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const mountHost = document.createElement("div");
    const payload = makePayload({
      props: {
        surfacePolicy: {
          interaction: {
            mode: "passive",
          },
          actions: {
            alarm: {
              stopAll: vi.fn(() => true),
            },
          },
        },
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: [],
        },
      },
    });

    committed.mount(mountHost, payload);

    expect(mountHost.querySelector(".dyni-alarm-state-accent")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main")).toBeTruthy();
    expect(mountHost.querySelector(".dyni-alarm-main-normal")).toBeTruthy();
    expect(
      mountHost
        .querySelector(".dyni-alarm-html")
        .classList.contains("dyni-alarm-open-passive"),
    ).toBe(true);
  });

  it("emits the same accent inline geometry as AIS at identical shell sizes", function () {
    const alarmRenderer = createRealAlarmRenderer();
    const aisRenderer = createAisRendererWithRealLayout();
    const sizes = [
      { width: 120, height: 100 },
      { width: 180, height: 100 },
      { width: 220, height: 100 },
      { width: 320, height: 100 },
      { width: 220, height: 300 },
    ];

    sizes.forEach((size) => {
      const aisNormalThreshold =
        size.width === 120 && size.height === 100 ? 1.21 : 1.2;
      const alarmMount = mountRenderer(alarmRenderer, {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: size.width, height: size.height },
        revision: 1,
        props: {
          caption: "ALARM",
          ratioThresholdNormal: 1.0,
          ratioThresholdFlat: 3.0,
          surfacePolicy: {
            interaction: { mode: "passive" },
            actions: { alarm: { stopAll: vi.fn(() => true) } },
          },
          domain: {
            state: "idle",
            alarmText: "NONE",
            hasActiveAlarms: false,
            activeCount: 0,
            alarmNames: [],
          },
        },
        hostContext: {
          __dyniAlarmMeasureCtx: createAlarmMeasureContext(),
        },
      });
      const aisMount = mountRenderer(aisRenderer, {
        rootEl: document.createElement("div"),
        shellEl: document.createElement("div"),
        shellRect: { width: size.width, height: size.height },
        revision: 1,
        props: {
          domain: {
            hasTargetIdentity: true,
            hasDispatchMmsi: true,
            mmsiNormalized: "211234560",
            showTcpaBranch: true,
            hasColorRole: true,
            colorRole: "warning",
            nameOrMmsi: "Poseidon",
            frontText: "Front",
            distance: 4.2,
            cpa: 0.7,
            tcpa: 42,
            headingTo: 112,
          },
          layout: {
            ratioThresholdNormal: aisNormalThreshold,
            ratioThresholdFlat: 3.8,
          },
          captions: {
            dst: "DST",
            cpa: "DCPA",
            tcpa: "TCPA",
            brg: "BRG",
          },
          units: {
            dst: "nm",
            cpa: "nm",
            tcpa: "min",
            brg: "°",
          },
          formatUnits: {
            dst: "nm",
            cpa: "nm",
          },
          default: "---",
          surfacePolicy: {
            pageId: "navpage",
            containerOrientation: "default",
            interaction: { mode: "dispatch" },
            actions: {
              ais: {
                showInfo: vi.fn(() => true),
              },
            },
          },
        },
        hostContext: {},
      });

      const alarmAccent = alarmMount.mountHost.querySelector(
        ".dyni-alarm-state-accent",
      );
      const aisAccent = aisMount.mountHost.querySelector(
        ".dyni-ais-target-state-accent",
      );
      expect(alarmAccent).toBeTruthy();
      expect(aisAccent).toBeTruthy();
      expect(readStyleFields(alarmAccent)).toEqual(readStyleFields(aisAccent));
    });
  });

  it("uses fit-owned inner geometry for layout signatures", function () {
    const h = createHelpers();
    const committed = h.rendererSpec.createCommittedRenderer({
      hostContext: {},
    });
    const payload = makePayload({
      props: {
        domain: {
          state: "idle",
          alarmText: "NONE",
          hasActiveAlarms: false,
          activeCount: 0,
          alarmNames: [],
        },
      },
    });

    const signature = committed.layoutSignature(payload);
    const parts = signature.split("|");

    expect(h.fit.resolveLayout).toHaveBeenCalledWith({
      model: expect.objectContaining({ showStrip: true }),
      shellRect: payload.shellRect,
    });
    expect(parts[parts.length - 2]).toBe("197");
    expect(parts[parts.length - 1]).toBe("96");
    expect(signature).not.toContain("|220|100");
  });

});
