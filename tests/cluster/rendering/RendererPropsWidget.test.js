const { loadFresh } = require("../../helpers/load-umd");

describe("RendererPropsWidget", function () {
  it("merges rendererProps into delegated renderer props", function () {
    const delegated = {
      wantsHideNativeHead: true,
      renderCanvas: vi.fn()
    };

    const spec = loadFresh("cluster/rendering/RendererPropsWidget.js").create({}, {
      getModule(id) {
        if (id === "SpeedRadialWidget") {
          return {
            create() {
              return delegated;
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    }, "SpeedRadialWidget");

    const canvas = { id: "c" };
    spec.renderCanvas(canvas, {
      renderer: "SpeedRadialWidget",
      value: 1,
      unit: "kn",
      rendererProps: {
        value: 2,
        minValue: 0,
        maxValue: 30
      }
    });

    expect(spec.wantsHideNativeHead).toBe(true);
    expect(delegated.renderCanvas).toHaveBeenCalledTimes(1);
    expect(delegated.renderCanvas).toHaveBeenCalledWith(canvas, expect.objectContaining({
      renderer: "SpeedRadialWidget",
      value: 2,
      unit: "kn",
      minValue: 0,
      maxValue: 30
    }));
  });

  it("passes through finalizeFunction when delegated renderer exposes one", function () {
    const delegated = {
      renderCanvas: vi.fn(),
      finalizeFunction: vi.fn()
    };

    const spec = loadFresh("cluster/rendering/RendererPropsWidget.js").create({}, {
      getModule(id) {
        if (id === "SpeedRadialWidget") {
          return {
            create() {
              return delegated;
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    }, "SpeedRadialWidget");

    spec.finalizeFunction(1, 2, 3);
    expect(delegated.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
  });
});
