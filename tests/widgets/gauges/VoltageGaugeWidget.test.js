const { loadFresh } = require("../../helpers/load-umd");

describe("VoltageGaugeWidget", function () {
  it("builds low-end sectors with default warning/alarm values", function () {
    let captured;
    const renderCanvas = vi.fn();
    const applyFormatter = vi.fn((value) => Number(value).toFixed(1));

    const mod = loadFresh("widgets/gauges/VoltageGaugeWidget/VoltageGaugeWidget.js");
    const spec = mod.create({}, {
      applyFormatter,
      getModule(id) {
        if (id === "GaugeValueMath") {
          return {
            create() {
              return {
                extractNumberText(text) {
                  const match = String(text).match(/-?\d+(?:\.\d+)?/);
                  return match ? match[0] : "";
                },
                buildLowEndSectors(props, minV, maxV, arc, options) {
                  const warningFrom = Number((typeof props.warningFrom !== "undefined")
                    ? props.warningFrom
                    : options.defaultWarningFrom);
                  const alarmFrom = Number((typeof props.alarmFrom !== "undefined")
                    ? props.alarmFrom
                    : options.defaultAlarmFrom);
                  const alarmTo = isFinite(alarmFrom)
                    ? Math.max(minV, Math.min(maxV, alarmFrom))
                    : NaN;
                  const warningTo = isFinite(warningFrom)
                    ? Math.max(minV, Math.min(maxV, warningFrom))
                    : NaN;
                  const sectors = [];
                  if (isFinite(alarmTo) && alarmTo > minV) sectors.push({ a0: minV, a1: alarmTo, color: "#ff7a76" });
                  if (isFinite(alarmTo) && isFinite(warningTo) && warningTo > alarmTo) sectors.push({ a0: alarmTo, a1: warningTo, color: "#e7c66a" });
                  if (!(isFinite(alarmTo) && alarmTo > minV) && isFinite(warningTo) && warningTo > minV) sectors.push({ a0: minV, a1: warningTo, color: "#e7c66a" });
                  return sectors;
                }
              };
            }
          };
        }
        if (id !== "SemicircleGaugeEngine") throw new Error("unexpected module: " + id);
        return {
          create() {
            return {
              createRenderer(cfg) {
                captured = cfg;
                return renderCanvas;
              }
            };
          }
        };
      }
    });

    expect(spec.renderCanvas).toBe(renderCanvas);
    expect(captured.rangeDefaults).toEqual({ min: 10, max: 15 });
    expect(captured.formatDisplay(12.34, {
      formatter: "formatDecimal",
      formatterParameters: [3, 1, true]
    })).toEqual({ num: 12.3, text: "12.3" });
    expect(applyFormatter).toHaveBeenCalledWith(12.34, expect.objectContaining({
      formatter: "formatDecimal"
    }));

    const sectors = captured.buildSectors({}, 10, 15, {}, {
      clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Number(v))); },
      sectorAngles(from, to) { return { a0: from, a1: to }; }
    });

    expect(sectors).toEqual([
      { a0: 10, a1: 11.6, color: "#ff7a76" },
      { a0: 11.6, a1: 12.2, color: "#e7c66a" }
    ]);
  });
});
