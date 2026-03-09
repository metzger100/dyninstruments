const { loadFresh } = require("../../helpers/load-umd");

describe("ClusterRendererRouter", function () {
  const TARGET_RENDERER_IDS = [
    "WindRadialWidget",
    "CompassRadialWidget",
    "WindLinearWidget",
    "CompassLinearWidget",
    "SpeedRadialWidget",
    "SpeedLinearWidget",
    "DepthRadialWidget",
    "DepthLinearWidget",
    "TemperatureRadialWidget",
    "TemperatureLinearWidget",
    "VoltageRadialWidget",
    "VoltageLinearWidget",
    "XteDisplayWidget"
  ];

  function makeSpec(name, opts) {
    const o = opts || {};
    const spec = {
      id: name,
      wantsHideNativeHead: !!o.hide
    };

    if (o.renderCanvas !== false) {
      spec.renderCanvas = typeof o.renderCanvas === "function" ? o.renderCanvas : vi.fn();
    }
    if (typeof o.renderHtml === "function") {
      spec.renderHtml = o.renderHtml;
    }
    if (typeof o.initFunction === "function") {
      spec.initFunction = o.initFunction;
    }
    if (o.finalizeFunction !== false) {
      spec.finalizeFunction = typeof o.finalizeFunction === "function" ? o.finalizeFunction : vi.fn();
    }

    return spec;
  }

  function createHelpers(overrides) {
    const specs = Object.assign({
      ThreeValueTextWidget: makeSpec("three"),
      PositionCoordinateWidget: makeSpec("position"),
      ActiveRouteTextWidget: makeSpec("activeRoute"),
      CenterDisplayTextWidget: makeSpec("centerDisplay")
    }, overrides || {});

    TARGET_RENDERER_IDS.forEach(function (id) {
      if (!Object.prototype.hasOwnProperty.call(specs, id)) {
        specs[id] = makeSpec(id);
      }
    });

    return {
      getModule(id) {
        const map = {
          ThreeValueTextWidget: { create: () => specs.ThreeValueTextWidget },
          PositionCoordinateWidget: { create: () => specs.PositionCoordinateWidget },
          ActiveRouteTextWidget: { create: () => specs.ActiveRouteTextWidget },
          CenterDisplayTextWidget: { create: () => specs.CenterDisplayTextWidget },
          RendererPropsWidget: {
            create: function (def, helpers, targetRendererId) {
              return specs[targetRendererId];
            }
          }
        };
        return map[id];
      }
    };
  }

  it("picks explicit renderer or falls back to ThreeValueTextWidget", function () {
    const three = makeSpec("three", { hide: false });
    const wind = makeSpec("wind", { hide: true });
    const windLinear = makeSpec("windLinear");
    const position = makeSpec("position");
    const activeRoute = makeSpec("activeRoute");
    const centerDisplay = makeSpec("centerDisplay");
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

    const Helpers = createHelpers({
      ThreeValueTextWidget: three,
      PositionCoordinateWidget: position,
      ActiveRouteTextWidget: activeRoute,
      CenterDisplayTextWidget: centerDisplay,
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
    });

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
    expect(router.pickRenderer({ renderer: "ActiveRouteTextWidget" })).toBe(activeRoute);
    expect(router.pickRenderer({ renderer: "CenterDisplayTextWidget" })).toBe(centerDisplay);
    expect(router.pickRenderer({ renderer: "Unknown" })).toBe(three);
    expect(router.pickRenderer({})).toBe(three);
  });

  it("delegates explicit html renderers and mixed renderers through the picked renderer", function () {
    const activeRoute = makeSpec("activeRoute", {
      hide: true,
      renderCanvas: false,
      renderHtml: vi.fn(() => "<div>route</div>")
    });
    const centerDisplay = makeSpec("centerDisplay", {
      renderCanvas: vi.fn(),
      renderHtml: vi.fn(() => "<div>center</div>")
    });

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, createHelpers({
      ActiveRouteTextWidget: activeRoute,
      CenterDisplayTextWidget: centerDisplay
    }));

    const activeProps = { renderer: "ActiveRouteTextWidget", routeName: "Leg 1" };
    const mixedProps = { renderer: "CenterDisplayTextWidget", value: 3 };
    const canvas = { id: "canvas" };

    expect(router.renderHtml(activeProps)).toBe("<div>route</div>");
    router.renderCanvas(canvas, mixedProps);
    expect(router.renderHtml(mixedProps)).toBe("<div>center</div>");

    expect(activeRoute.renderHtml).toHaveBeenCalledWith(activeProps);
    expect(centerDisplay.renderCanvas).toHaveBeenCalledWith(canvas, mixedProps);
    expect(centerDisplay.renderHtml).toHaveBeenCalledWith(mixedProps);
  });

  it("delegates initFunction only to the active renderer selected by init props", function () {
    const three = makeSpec("three", { initFunction: vi.fn() });
    const speed = makeSpec("speed", { initFunction: vi.fn() });
    const voltage = makeSpec("voltage", { initFunction: vi.fn() });

    const router = loadFresh("cluster/rendering/ClusterRendererRouter.js").create({}, createHelpers({
      ThreeValueTextWidget: three,
      SpeedRadialWidget: speed,
      VoltageRadialWidget: voltage
    }));

    const ctx = { marker: 1 };
    const initCtx = { eventHandler: {} };
    const voltageProps = { renderer: "VoltageRadialWidget", value: 12 };
    const fallbackProps = {};

    router.initFunction.call(ctx, initCtx, voltageProps);
    router.initFunction.call(ctx, initCtx, fallbackProps);

    expect(voltage.initFunction).toHaveBeenCalledWith(initCtx, voltageProps);
    expect(three.initFunction).toHaveBeenCalledWith(initCtx, fallbackProps);
    expect(speed.initFunction).not.toHaveBeenCalled();
  });

  it("delegates renderCanvas and fans out finalizeFunction safely", function () {
    const three = makeSpec("three");
    const activeRoute = makeSpec("activeRoute");
    const centerDisplay = makeSpec("centerDisplay");
    const speed = makeSpec("speed", { finalizeFunction: vi.fn(() => { throw new Error("ignored"); }) });
    const speedLinear = makeSpec("speedLinear");
    const voltage = makeSpec("voltage");
    const voltageLinear = makeSpec("voltageLinear");
    const depthLinear = makeSpec("depthLinear");
    const tempLinear = makeSpec("tempLinear");

    const Helpers = createHelpers({
      ThreeValueTextWidget: three,
      ActiveRouteTextWidget: activeRoute,
      CenterDisplayTextWidget: centerDisplay,
      SpeedRadialWidget: speed,
      SpeedLinearWidget: speedLinear,
      VoltageRadialWidget: voltage,
      VoltageLinearWidget: voltageLinear,
      DepthLinearWidget: depthLinear,
      TemperatureLinearWidget: tempLinear
    });

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
    expect(activeRoute.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(centerDisplay.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(speed.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(speedLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(depthLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(tempLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(voltage.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
    expect(voltageLinear.finalizeFunction).toHaveBeenCalledWith(1, 2, 3);
  });
});
