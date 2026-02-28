const { loadFresh } = require("../../helpers/load-umd");

describe("TimeStatusRendererWrapper", function () {
  it("delegates to PositionCoordinateWidget with status formatter and time", function () {
    const delegated = {
      wantsHideNativeHead: true,
      renderCanvas: vi.fn()
    };

    const spec = loadFresh("cluster/rendering/TimeStatusRendererWrapper.js").create({}, {
      getModule(id) {
        if (id === "PositionCoordinateWidget") {
          return {
            create() {
              return delegated;
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    });

    const canvas = { id: "c" };
    const rawClock = new Date("2026-02-22T15:00:00Z");
    spec.renderCanvas(canvas, {
      clock: rawClock,
      gpsValid: true,
      caption: "TIME",
      unit: ""
    });

    expect(spec.wantsHideNativeHead).toBe(true);
    expect(delegated.renderCanvas).toHaveBeenCalledTimes(1);
    const forwarded = delegated.renderCanvas.mock.calls[0][1];
    expect(forwarded.value).toEqual([rawClock, true]);
    expect(forwarded.coordinateFormatterLon).toBe("formatTime");
    expect(forwarded.coordinateFlatFromAxes).toBe(true);
    expect(forwarded.coordinateRawValues).toBe(true);
    expect(typeof forwarded.coordinateFormatterLat).toBe("function");
    expect(forwarded.coordinateFormatterLat(true)).toBe("🟢");
    expect(forwarded.coordinateFormatterLat(false)).toBe("🔴");
    expect(forwarded.coordinateFormatterLat("off")).toBe("🔴");
    expect(forwarded.coordinateFormatterLat("on")).toBe("🟢");
  });
});
