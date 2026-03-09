const { loadFresh } = require("../../helpers/load-umd");

describe("RendererPropsWidget", function () {
  it("merges rendererProps into delegated canvas and html props", function () {
    const delegated = {
      wantsHideNativeHead: true,
      renderCanvas: vi.fn(),
      renderHtml: vi.fn(() => "<div>ok</div>")
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
    const htmlOut = spec.renderHtml({
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
    expect(htmlOut).toBe("<div>ok</div>");
    expect(delegated.renderCanvas).toHaveBeenCalledTimes(1);
    expect(delegated.renderCanvas).toHaveBeenCalledWith(canvas, expect.objectContaining({
      renderer: "SpeedRadialWidget",
      value: 2,
      unit: "kn",
      minValue: 0,
      maxValue: 30
    }));
    expect(delegated.renderHtml).toHaveBeenCalledWith(expect.objectContaining({
      renderer: "SpeedRadialWidget",
      value: 2,
      unit: "kn",
      minValue: 0,
      maxValue: 30
    }));
  });

  it("passes through initFunction with merged props and finalizeFunction when delegated renderer exposes them", function () {
    const delegated = {
      renderCanvas: vi.fn(),
      initFunction: vi.fn(),
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

    spec.initFunction("ctx", {
      renderer: "SpeedRadialWidget",
      value: 1,
      rendererProps: {
        value: 2,
        minValue: 0
      }
    });
    spec.finalizeFunction(1, 2, 3);

    expect(delegated.initFunction).toHaveBeenCalledWith("ctx", expect.objectContaining({
      renderer: "SpeedRadialWidget",
      value: 2,
      minValue: 0
    }));
    expect(delegated.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
  });
});
