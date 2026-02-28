const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterRendererRouter", function () {
  function makeSpec(name, opts) {
    const o = opts || {};
    return {
      id: name,
      wantsHideNativeHead: !!o.hide,
      renderCanvas: o.renderCanvas || vi.fn(),
      finalizeFunction: o.finalizeFunction || vi.fn()
    };
  }

  it("picks explicit renderer or falls back to ThreeValueTextWidget", function () {
    const three = makeSpec("three", { hide: false });
    const wind = makeSpec("wind", { hide: true });
    const position = makeSpec("position");
    const compass = makeSpec("compass");
    const speed = makeSpec("speed");
    const depth = makeSpec("depth");
    const temp = makeSpec("temp");
    const volt = makeSpec("volt");
    const targetSpecs = {
      WindDialWidget: wind,
      CompassGaugeWidget: compass,
      SpeedGaugeWidget: speed,
      DepthGaugeWidget: depth,
      TemperatureGaugeWidget: temp,
      VoltageGaugeWidget: volt
    };

    const Helpers = {
      getModule(id) {
        const map = {
          ThreeValueTextWidget: { create: () => three },
          PositionCoordinateWidget: { create: () => position },
          DateTimeWidget: { create: () => makeSpec("vesselDateTime") },
          TimeStatusWidget: { create: () => makeSpec("vesselTimeStatus") },
          RendererPropsWidget: {
            create: function (def, helpers, targetRendererId) {
              return targetSpecs[targetRendererId];
            }
          }
        };
        return map[id];
      }
    };

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, Helpers);

    expect(router.wantsHideNativeHead).toBe(true);
    expect(router.pickRenderer({ renderer: "WindDialWidget" })).toBe(wind);
    expect(router.pickRenderer({ renderer: "PositionCoordinateWidget" })).toBe(position);
    expect(router.pickRenderer({ renderer: "Unknown" })).toBe(three);
    expect(router.pickRenderer({})).toBe(three);
  });

  it("delegates renderCanvas and fans out finalizeFunction safely", function () {
    const three = makeSpec("three");
    const speed = makeSpec("speed", { finalizeFunction: vi.fn(() => { throw new Error("ignored"); }) });
    const voltage = makeSpec("voltage");
    const wind = makeSpec("wind");
    const compass = makeSpec("compass");
    const depth = makeSpec("depth");
    const temp = makeSpec("temp");
    const targetSpecs = {
      WindDialWidget: wind,
      CompassGaugeWidget: compass,
      SpeedGaugeWidget: speed,
      DepthGaugeWidget: depth,
      TemperatureGaugeWidget: temp,
      VoltageGaugeWidget: voltage
    };

    const Helpers = {
      getModule(id) {
        const map = {
          ThreeValueTextWidget: { create: () => three },
          PositionCoordinateWidget: { create: () => makeSpec("position") },
          DateTimeWidget: { create: () => makeSpec("vesselDateTime") },
          TimeStatusWidget: { create: () => makeSpec("vesselTimeStatus") },
          RendererPropsWidget: {
            create: function (def, helpers, targetRendererId) {
              return targetSpecs[targetRendererId];
            }
          }
        };
        return map[id];
      }
    };

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, Helpers);

    const ctx = { marker: 1 };
    const canvas = { id: "canvas" };
    const props = { renderer: "VoltageGaugeWidget" };

    router.renderCanvas.call(ctx, canvas, props);
    expect(voltage.renderCanvas).toHaveBeenCalledWith(canvas, props);

    expect(function () {
      router.finalizeFunction.call(ctx, 1, 2, 3);
    }).not.toThrow();

    expect(three.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(speed.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(voltage.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
  });
});
