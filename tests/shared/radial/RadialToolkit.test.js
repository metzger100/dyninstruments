const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RadialToolkit", function () {
  /** @param {Record<string, any>} [overrides] */
  function create(overrides) {
    const mod = loadFresh("shared/widget-kits/radial/RadialToolkit.js");
    const gauge = { id: "GaugeToolkit", format: function () {} };
    const angle = { id: "RadialAngleMath", degToCanvasRad: function () {} };
    const tick = { id: "RadialTickMath", buildTickAngles: function () {} };
    const primitive = {
      drawRing: function () {},
      drawArcRing: function () {},
      drawAnnularSector: function () {},
      drawArrow: function () {},
      drawPointerAtRim: function () {},
      drawRimMarker: function () {}
    };
    const dial = {
      drawTicksFromAngles: function () {},
      drawTicks: function () {},
      drawLabels: function () {},
      drawDialFrame: function () {}
    };
    const componentContext = createComponentContextMock({
      modules: Object.assign(
        {
          GaugeToolkit: gauge,
          RadialAngleMath: angle,
          RadialTickMath: tick,
          RadialCanvasPrimitives: primitive,
          RadialFrameRenderer: dial
        },
        overrides
      )
    });
    return {
      toolkit: mod.create({}, componentContext),
      gauge,
      angle,
      tick,
      primitive,
      dial
    };
  }

  it("reports its own id and merges the gauge facade fields", function () {
    const { toolkit, gauge } = create();

    expect(toolkit.id).toBe("RadialToolkit");
    expect(toolkit.format).toBe(gauge.format);
  });

  it("exposes the angle and tick modules directly", function () {
    const { toolkit, angle, tick } = create();

    expect(toolkit.angle).toBe(angle);
    expect(toolkit.tick).toBe(tick);
  });

  it("composes draw from primitive drawing functions and frame-renderer tick/label/frame helpers", function () {
    const { toolkit, primitive, dial } = create();

    expect(toolkit.draw.drawRing).toBe(primitive.drawRing);
    expect(toolkit.draw.drawArcRing).toBe(primitive.drawArcRing);
    expect(toolkit.draw.drawAnnularSector).toBe(primitive.drawAnnularSector);
    expect(toolkit.draw.drawArrow).toBe(primitive.drawArrow);
    expect(toolkit.draw.drawPointerAtRim).toBe(primitive.drawPointerAtRim);
    expect(toolkit.draw.drawRimMarker).toBe(primitive.drawRimMarker);
    expect(toolkit.draw.drawTicksFromAngles).toBe(dial.drawTicksFromAngles);
    expect(toolkit.draw.drawTicks).toBe(dial.drawTicks);
    expect(toolkit.draw.drawLabels).toBe(dial.drawLabels);
    expect(toolkit.draw.drawDialFrame).toBe(dial.drawDialFrame);
  });

  it("lets the RadialToolkit id win over an id field on the gauge facade", function () {
    const { toolkit } = create();

    expect(toolkit.id).not.toBe("GaugeToolkit");
    expect(toolkit.id).toBe("RadialToolkit");
  });
});
