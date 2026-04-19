const { loadFresh } = require("../../helpers/load-umd");

describe("TextLayoutComposite", function () {
  function createHarness() {
    const calls = {
      fitSingleLineBinary: [],
      fitValueUnitRow: [],
      fitMultiRowBinary: []
    };

    const primitive = {
      fitSingleLineBinary: vi.fn(function (args) {
        calls.fitSingleLineBinary.push(args);
        return { px: 17 };
      }),
      fitValueUnitRow: vi.fn(function (args) {
        calls.fitValueUnitRow.push(args);
        return {
          px: 32,
          vPx: 21,
          uPx: 9,
          vW: 11,
          uW: 7,
          total: 18,
          gap: 1
        };
      }),
      fitMultiRowBinary: vi.fn(function (args) {
        calls.fitMultiRowBinary.push(args);
        return {
          px: 32,
          widths: [11, 11]
        };
      }),
      setFont: vi.fn(),
      drawInlineTriplet: vi.fn()
    };

    const compositeModule = loadFresh("shared/widget-kits/text/TextLayoutComposite.js");
    const composite = compositeModule.create({}, {
      getModule(id) {
        if (id === "TextLayoutPrimitives") {
          return {
            create() {
              return primitive;
            }
          };
        }
        throw new Error("unexpected module: " + id);
      }
    });

    return {
      composite,
      calls
    };
  }

  function findCall(calls, text) {
    return calls.find(function (call) {
      return call && call.text === text;
    });
  }

  it("pins the high-mode row ceilings used by fitThreeRowBlock", function () {
    const harness = createHarness();

    harness.composite.fitThreeRowBlock({
      W: 100,
      H: 100,
      padX: 0,
      innerY: 3,
      secScale: 0.8,
      textFillScale: 1,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600
    });

    expect(harness.calls.fitSingleLineBinary).toHaveLength(3);
    expect(findCall(harness.calls.fitSingleLineBinary, "12.3").maxPx).toBe(32);
    expect(findCall(harness.calls.fitSingleLineBinary, "12.3").maxH).toBe(32);
    expect(findCall(harness.calls.fitSingleLineBinary, "SPD").maxPx).toBe(25);
    expect(findCall(harness.calls.fitSingleLineBinary, "SPD").maxH).toBe(25);
    expect(findCall(harness.calls.fitSingleLineBinary, "kn").maxPx).toBe(25);
    expect(findCall(harness.calls.fitSingleLineBinary, "kn").maxH).toBe(25);
  });

  it("pins the normal-mode row ceilings used by fitValueUnitCaptionRows", function () {
    const harness = createHarness();

    harness.composite.fitValueUnitCaptionRows({
      W: 100,
      H: 100,
      padX: 0,
      innerY: 3,
      gapBase: 1,
      secScale: 0.8,
      textFillScale: 1,
      captionText: "SPD",
      valueText: "12.3",
      unitText: "kn",
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600
    });

    expect(harness.calls.fitValueUnitRow).toHaveLength(1);
    expect(harness.calls.fitValueUnitRow[0].baseValuePx).toBe(48);
    expect(harness.calls.fitValueUnitRow[0].maxH).toBe(48);
    expect(harness.calls.fitSingleLineBinary).toHaveLength(1);
    expect(harness.calls.fitSingleLineBinary[0].text).toBe("SPD");
    expect(harness.calls.fitSingleLineBinary[0].maxPx).toBe(37);
    expect(harness.calls.fitSingleLineBinary[0].maxH).toBe(37);
  });

  it("pins the stacked-header ceilings used by fitTwoRowsWithHeader", function () {
    const harness = createHarness();

    harness.composite.fitTwoRowsWithHeader({
      mode: "normal",
      W: 100,
      H: 100,
      padX: 0,
      innerY: 3,
      secScale: 0.8,
      textFillScale: 1,
      captionText: "LAT",
      unitText: "N",
      topText: "54.1234",
      bottomText: "10.9876",
      family: "sans-serif",
      valueWeight: 700,
      labelWeight: 600
    });

    expect(harness.calls.fitMultiRowBinary).toHaveLength(1);
    expect(harness.calls.fitMultiRowBinary[0].maxPx).toBe(32);
    expect(harness.calls.fitMultiRowBinary[0].maxH).toBe(32);

    expect(harness.calls.fitSingleLineBinary).toHaveLength(2);
    const captionCall = findCall(harness.calls.fitSingleLineBinary, "LAT");
    const unitCall = findCall(harness.calls.fitSingleLineBinary, "N");

    expect(captionCall.maxH).toBe(27);
    expect(captionCall.maxPx).toBe(25);
    expect(unitCall.maxH).toBe(27);
    expect(unitCall.maxPx).toBe(20);
  });
});
