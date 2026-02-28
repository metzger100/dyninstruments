const { loadFresh } = require("../../helpers/load-umd");

describe("DateTimeRendererWrapper", function () {
  it("delegates to PositionCoordinateWidget with date/time-specific props", function () {
    const delegated = {
      wantsHideNativeHead: true,
      renderCanvas: vi.fn()
    };

    const spec = loadFresh("cluster/rendering/DateTimeRendererWrapper.js").create({}, {
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
    const props = {
      clock: rawClock,
      dateTimeRatioThresholdNormal: "1.35",
      dateTimeRatioThresholdFlat: "4.55",
      caption: "DATE",
      unit: "",
      default: "---"
    };
    spec.renderCanvas(canvas, props);

    expect(spec.wantsHideNativeHead).toBe(true);
    expect(delegated.renderCanvas).toHaveBeenCalledTimes(1);
    expect(delegated.renderCanvas.mock.calls[0][0]).toBe(canvas);
    expect(delegated.renderCanvas.mock.calls[0][1]).toEqual(expect.objectContaining({
      value: [rawClock, rawClock],
      ratioThresholdNormal: "1.35",
      ratioThresholdFlat: "4.55",
      formatter: "formatDateTime",
      formatterParameters: [],
      coordinateFormatterLat: "formatDate",
      coordinateFormatterLon: "formatTime",
      coordinateFlatFromAxes: true,
      coordinateRawValues: true
    }));
  });
});
