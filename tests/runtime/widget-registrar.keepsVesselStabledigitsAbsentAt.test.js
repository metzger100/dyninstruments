// @ts-check
const {
  captureTextCalls,
  createMockCanvas,
  createMockContext2D,
  fillTextValues,
  loadFresh,
  loadVesselDef,
  makePositionComponentContext,
  setupContext
} = require("./widget-registrar-setup");

describe("runtime/widget-registrar.js", function () {
  it("keeps vessel stableDigits absent at registration so dateTime/timeStatus default at render time", function () {
    const { context, registerWidget } = setupContext();
    const vesselDef = loadVesselDef();
    const componentSpec = {};
    const previousAvnav = globalThis.avnav;

    try {
      context.DyniPlugin.runtime.registerWidget(componentSpec, {
        def: vesselDef
      });

      const [registeredDef] = registerWidget.mock.calls[0];
      expect(Object.prototype.hasOwnProperty.call(registeredDef, "stableDigits")).toBe(false);

      const rawClock = new Date("2026-02-22T15:00:00Z");
      globalThis.avnav = {
        api: {
          formatter: {
            /** @param {unknown} value */
            formatDate(value) {
              return value === rawClock ? "DATE" : "DATE_BAD";
            },
            /** @param {unknown} value */
            formatTime(value) {
              return value === rawClock ? "TIME" : "TIME_BAD";
            }
          }
        }
      };

      const spec = loadFresh("widgets/text/PositionCoordinateWidget/PositionCoordinateWidget.js").create(
        {},
        makePositionComponentContext()
      );

      const registeredProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const registeredCtx = createMockContext2D();
      const registeredCanvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx: registeredCtx
      });
      const registeredCaptured = captureTextCalls(registeredCtx);
      spec.renderCanvas(registeredCanvas, registeredProps);

      expect(fillTextValues(registeredCtx)).toContain("DATE");
      expect(fillTextValues(registeredCtx)).toContain("TIME");
      expect(String(registeredCtx.textAlign)).toBe("center");
      const registeredTime = registeredCaptured.find((entry) => entry.text === "TIME");
      if (!registeredTime) {
        throw new Error("Expected the registered time text capture.");
      }
      expect(String(registeredTime.font)).toContain("monospace");

      const explicitProps = Object.assign({}, registeredDef, {
        displayVariant: "dateTime",
        stableDigits: false,
        value: [rawClock, rawClock],
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.0,
        default: "NA"
      });

      const explicitCtx = createMockContext2D();
      const explicitCanvas = createMockCanvas({
        rectWidth: 220,
        rectHeight: 140,
        ctx: explicitCtx
      });
      const explicitCaptured = captureTextCalls(explicitCtx);
      spec.renderCanvas(explicitCanvas, explicitProps);

      expect(fillTextValues(explicitCtx)).toContain("DATE");
      expect(fillTextValues(explicitCtx)).toContain("TIME");
      expect(String(explicitCtx.textAlign)).toBe("center");
      const explicitTime = explicitCaptured.find((entry) => entry.text === "TIME");
      if (!explicitTime) {
        throw new Error("Expected the explicit time text capture.");
      }
      expect(String(explicitTime.font)).toContain("sans-serif");
    } finally {
      if (typeof previousAvnav === "undefined") delete globalThis.avnav;
      else globalThis.avnav = previousAvnav;
    }
  });
});
