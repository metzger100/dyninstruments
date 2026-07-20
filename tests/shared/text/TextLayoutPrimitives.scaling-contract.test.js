const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { evaluateBoundedByConfiguredSteps } = require("../../../tools/quality-policy/operation-count-evaluator.mjs");

// TextLayoutPrimitives.fitSingleLineBinary shrinks font size
// via a fixed-iteration binary search, not a scan proportional to text
// length. This proves ctx.measureText call count is bounded by the
// configured `steps` value regardless of how long the input text is, and
// that the fitted result stays correct (never exceeds the requested box).
describe("TextLayoutPrimitives.fitSingleLineBinary scaling contract", function () {
  function createPrimitives() {
    const canvasTextLayout = {
      /** @param {any} family @param {any} [options] */
      resolveFamily(family, options) {
        if (options && options.useMono === true) {
          return options.monoFamily || family;
        }
        return family;
      },
      /** @param {any} ctx @param {any} px @param {any} weight @param {any} family */
      setFont(ctx, px, weight, family) {
        ctx.currentPx = Math.max(1, Math.floor(Number(px) || 0));
        ctx.font = Math.floor(Number(weight) || 0) + " " + ctx.currentPx + "px " + (family || "sans-serif");
      }
    };
    const moduleApi = loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js");
    return moduleApi.create(
      {},
      createComponentContextMock({
        modules: {
          CanvasTextLayout: {
            create() {
              return canvasTextLayout;
            }
          }
        }
      })
    );
  }

  /** @param {() => void} onMeasureText @returns {any} */
  function createCtx(onMeasureText) {
    return /** @type {any} */ ({
      currentPx: 1,
      font: "",
      /** @param {string} text */
      measureText(text) {
        onMeasureText();
        // Width scales with both text length and current font size, matching
        // a real canvas measurement's proportional behavior.
        return { width: String(text).length * this.currentPx * 0.6 };
      }
    });
  }

  /** @param {number} textLength @param {() => void} onMeasureText @param {number} [steps] @returns {any} */
  function fit(textLength, onMeasureText, steps) {
    const primitives = createPrimitives();
    const ctx = createCtx(onMeasureText);
    return primitives.fitSingleLineBinary({
      ctx: ctx,
      text: "x".repeat(textLength),
      maxW: 200,
      maxH: 40,
      family: "sans-serif",
      weight: 700,
      steps: steps
    });
  }

  // Text length is capped so the mocked measurement (length * px * 0.6) still
  // fits inside maxW (200) at the minimum font size (1px): once the smallest
  // candidate size fits, the binary search always records a best-fit result
  // during its fixed iteration budget instead of falling back to one final
  // unconditional measurement after the loop.
  const FITTABLE_LENGTH_CAP = 300;

  it("keeps ctx.measureText call count bounded by the configured steps value as steps vary", function () {
    const result = evaluateBoundedByConfiguredSteps({
      steps: [8, 14, 20],
      tolerancePerStep: 1,
      measure: function (configuredSteps) {
        let calls = 0;
        fit(
          FITTABLE_LENGTH_CAP,
          function () {
            calls += 1;
          },
          configuredSteps
        );
        return calls;
      }
    });

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.samples).toEqual([
      { steps: 8, count: 8 },
      { steps: 14, count: 14 },
      { steps: 20, count: 20 }
    ]);
  });

  it("keeps ctx.measureText call count fixed at the default steps regardless of input text length", function () {
    const lengths = [5, 50, 150, FITTABLE_LENGTH_CAP];
    const counts = lengths.map(function (length) {
      let calls = 0;
      fit(length, function () {
        calls += 1;
      });
      return calls;
    });

    expect(counts).toEqual([14, 14, 14, 14]);
  });

  it("produces a correctly bounded fit for both short and near-limit text", function () {
    [5, FITTABLE_LENGTH_CAP].forEach(function (length) {
      const result = fit(length, function () {});

      expect(result.px).toBeGreaterThanOrEqual(1);
      expect(result.px).toBeLessThanOrEqual(40);
      expect(result.width).toBeLessThanOrEqual(200 + 0.01);
    });
  });
});
