const {
  createHarness,
  createMockCanvas,
  createMockContext2D,
} = require("./LinearGaugeEngine.harness");

describe("LinearGaugeEngine", function () {
  it("uses linear.labels.insetFactor to position tick labels", function () {
    function renderLabelY(insetFactor) {
      const harness = createHarness();
      harness.theme.linear.labels.insetFactor = insetFactor;
      const renderer = harness.engine.createRenderer({
        rawValueKey: "value",
        rangeDefaults: { min: 0, max: 30 },
        rangeProps: { min: "min", max: "max" },
        tickProps: {
          major: "major",
          minor: "minor",
          showEndLabels: "showEndLabels",
        },
      });

      const layerContexts = [];
      const ownerDocument = {
        createElement(tagName) {
          if (String(tagName || "").toLowerCase() !== "canvas") {
            return { tagName: String(tagName || "").toUpperCase() };
          }
          const layerCtx = createMockContext2D();
          layerContexts.push(layerCtx);
          return {
            width: 0,
            height: 0,
            parentElement: null,
            __ctx: layerCtx,
            ownerDocument: ownerDocument,
            getContext(type) {
              return type === "2d" ? layerCtx : null;
            },
            getBoundingClientRect() {
              const width = Number(this.width) || 0;
              const height = Number(this.height) || 0;
              return {
                width,
                height,
                top: 0,
                left: 0,
                right: width,
                bottom: height,
              };
            },
            closest() {
              return null;
            },
          };
        },
      };

      renderer(
        createMockCanvas({
          rectWidth: 480,
          rectHeight: 120,
          ctx: createMockContext2D(),
          ownerDocument: ownerDocument,
        }),
        {
          value: 12,
          min: 0,
          max: 30,
          major: 10,
          minor: 5,
          showEndLabels: true,
        },
      );

      const fillTextCalls = (
        (layerContexts[0] && layerContexts[0].calls) ||
        []
      ).filter((entry) => entry.name === "fillText");
      const ys = fillTextCalls.map((entry) => entry.args[2]);
      expect(ys.length).toBeGreaterThan(0);
      return Math.min.apply(null, ys);
    }

    const yLowInset = renderLabelY(0.5);
    const yHighInset = renderLabelY(3.0);
    expect(yHighInset).toBeGreaterThan(yLowInset);
  });

});
