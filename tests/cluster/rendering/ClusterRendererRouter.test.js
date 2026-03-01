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
    const windLinear = makeSpec("windLinear");
    const position = makeSpec("position");
    const compass = makeSpec("compass");
    const compassLinear = makeSpec("compassLinear");
    const speed = makeSpec("speed");
    const speedLinear = makeSpec("speedLinear");
    const depth = makeSpec("depth");
    const depthLinear = makeSpec("depthLinear");
    const temp = makeSpec("temp");
    const tempLinear = makeSpec("tempLinear");
    const volt = makeSpec("volt");
    const voltLinear = makeSpec("voltLinear");
    const xte = makeSpec("xte");
    const targetSpecs = {
      WindRadialWidget: wind,
      CompassRadialWidget: compass,
      WindLinearWidget: windLinear,
      CompassLinearWidget: compassLinear,
      SpeedRadialWidget: speed,
      SpeedLinearWidget: speedLinear,
      DepthRadialWidget: depth,
      DepthLinearWidget: depthLinear,
      TemperatureRadialWidget: temp,
      TemperatureLinearWidget: tempLinear,
      VoltageRadialWidget: volt,
      VoltageLinearWidget: voltLinear,
      XteDisplayWidget: xte
    };

    const Helpers = {
      getModule(id) {
        const map = {
          ThreeValueTextWidget: { create: () => three },
          PositionCoordinateWidget: { create: () => position },
          DateTimeRendererWrapper: { create: () => makeSpec("vesselDateTime") },
          TimeStatusRendererWrapper: { create: () => makeSpec("vesselTimeStatus") },
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
    expect(router.pickRenderer({ renderer: "WindRadialWidget" })).toBe(wind);
    expect(router.pickRenderer({ renderer: "WindLinearWidget" })).toBe(windLinear);
    expect(router.pickRenderer({ renderer: "CompassLinearWidget" })).toBe(compassLinear);
    expect(router.pickRenderer({ renderer: "XteDisplayWidget" })).toBe(xte);
    expect(router.pickRenderer({ renderer: "SpeedLinearWidget" })).toBe(speedLinear);
    expect(router.pickRenderer({ renderer: "DepthLinearWidget" })).toBe(depthLinear);
    expect(router.pickRenderer({ renderer: "TemperatureLinearWidget" })).toBe(tempLinear);
    expect(router.pickRenderer({ renderer: "VoltageLinearWidget" })).toBe(voltLinear);
    expect(router.pickRenderer({ renderer: "PositionCoordinateWidget" })).toBe(position);
    expect(router.pickRenderer({ renderer: "Unknown" })).toBe(three);
    expect(router.pickRenderer({})).toBe(three);
  });

  it("delegates renderCanvas and fans out finalizeFunction safely", function () {
    const three = makeSpec("three");
    const speed = makeSpec("speed", { finalizeFunction: vi.fn(() => { throw new Error("ignored"); }) });
    const speedLinear = makeSpec("speedLinear");
    const voltage = makeSpec("voltage");
    const voltageLinear = makeSpec("voltageLinear");
    const wind = makeSpec("wind");
    const windLinear = makeSpec("windLinear");
    const compass = makeSpec("compass");
    const compassLinear = makeSpec("compassLinear");
    const depth = makeSpec("depth");
    const depthLinear = makeSpec("depthLinear");
    const temp = makeSpec("temp");
    const tempLinear = makeSpec("tempLinear");
    const xte = makeSpec("xte");
    const targetSpecs = {
      WindRadialWidget: wind,
      CompassRadialWidget: compass,
      WindLinearWidget: windLinear,
      CompassLinearWidget: compassLinear,
      SpeedRadialWidget: speed,
      SpeedLinearWidget: speedLinear,
      DepthRadialWidget: depth,
      DepthLinearWidget: depthLinear,
      TemperatureRadialWidget: temp,
      TemperatureLinearWidget: tempLinear,
      VoltageRadialWidget: voltage,
      VoltageLinearWidget: voltageLinear,
      XteDisplayWidget: xte
    };

    const Helpers = {
      getModule(id) {
        const map = {
          ThreeValueTextWidget: { create: () => three },
          PositionCoordinateWidget: { create: () => makeSpec("position") },
          DateTimeRendererWrapper: { create: () => makeSpec("vesselDateTime") },
          TimeStatusRendererWrapper: { create: () => makeSpec("vesselTimeStatus") },
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
    const props = { renderer: "VoltageRadialWidget" };

    router.renderCanvas.call(ctx, canvas, props);
    expect(voltage.renderCanvas).toHaveBeenCalledWith(canvas, props);

    expect(function () {
      router.finalizeFunction.call(ctx, 1, 2, 3);
    }).not.toThrow();

    expect(three.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(speed.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(speedLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(depthLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(tempLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(voltage.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(voltageLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
  });
});
