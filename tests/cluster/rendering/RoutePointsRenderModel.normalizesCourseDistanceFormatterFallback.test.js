// @ts-check
const { createRenderModel, makeProps, withSurfacePolicy } = require("./RoutePointsRenderModel-setup");

describe("RoutePointsRenderModel", function () {
  it("normalizes course and distance formatter fallback tokens while preserving compound row format", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatDirection") {
        return "--:--";
      }
      if (cfg.formatter === "formatDistance") {
        return "    -";
      }
      return cfg.default;
    });
    const renderModel = createRenderModel({ applyFormatter: applyFormatter });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].infoText).toBe("--°/--nm");
    expect(model.points[1].infoText).toBe("---°/---nm");
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ formatter: "formatDirection" })
    );
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ formatter: "formatDistance" })
    );
  });

  it("enforces editroutepage capability gate for row activation", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    expect(
      renderModel.canActivateRoutePoint({
        props: withSurfacePolicy(props, { mode: "dispatch" })
      })
    ).toBe(true);

    expect(
      renderModel.canActivateRoutePoint({
        props: withSurfacePolicy(props, { mode: "passive" })
      })
    ).toBe(false);

    expect(
      renderModel.canActivateRoutePoint({
        props: withSurfacePolicy(makeProps({ editing: true }), {
          mode: "dispatch"
        })
      })
    ).toBe(false);
  });
});
