const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmRenderModel", function () {
  function createRenderModel() {
    const Helpers = {
      getModule(id) {
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        throw new Error("unexpected module: " + id);
      }
    };

    return loadFresh("shared/widget-kits/vessel/AlarmRenderModel.js").create({}, Helpers);
  }

  function withSurfacePolicy(props, mode) {
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: {
          mode: mode
        }
      }
    });
  }

  it("keeps idle text fixed at NONE and ignores props.default", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: {
        caption: "ALARM",
        default: "CUSTOM",
        unit: "ignored"
      },
      domain: {
        state: "idle"
      }
    });

    expect(model.captionText).toBe("ALARM");
    expect(model.idleValueText).toBe("NONE");
    expect(model.valueText).toBe("NONE");
    expect(model.unitText).toBe("");
  });

  it("uses domain.alarmText as the active value text", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: {
        caption: "ALARM"
      },
      domain: {
        state: "active",
        alarmText: "ENGINE, FIRE"
      }
    });

    expect(model.activeValueText).toBe("ENGINE, FIRE");
    expect(model.alarmText).toBe("ENGINE, FIRE");
    expect(model.valueText).toBe("ENGINE, FIRE");
    expect(model.idleValueText).toBe("NONE");
  });

  it("keeps idle state passive even if the surface policy dispatches", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy({ caption: "ALARM" }, "dispatch"),
      domain: {
        state: "idle",
        alarmText: "ENGINE"
      }
    });

    expect(model.state).toBe("idle");
    expect(model.interactionState).toBe("passive");
    expect(model.canDispatch).toBe(false);
  });

  it("dispatches only when active and the surface policy dispatches", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy({ caption: "ALARM" }, "dispatch"),
      domain: {
        state: "active",
        alarmText: "ENGINE"
      }
    });

    expect(model.state).toBe("active");
    expect(model.interactionState).toBe("dispatch");
    expect(model.canDispatch).toBe(true);
    expect(model.showHotspot).toBe(true);
  });

  it("forces passive interaction in editing mode", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy({
        caption: "ALARM",
        editing: true
      }, "dispatch"),
      domain: {
        state: "active",
        alarmText: "ENGINE"
      }
    });

    expect(model.state).toBe("active");
    expect(model.interactionState).toBe("passive");
    expect(model.canDispatch).toBe(false);
  });
});
