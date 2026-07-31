const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const { computeWindLayout, makeWindProps } = require("./WindRadialWidget.caching.harness.js");

const { createWindCachingHarness } = require("./WindRadialWidget.caching.harness.js");

const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

/**
 * @typedef {{ left: { value: string }, mode: unknown, opts: unknown, right: { value: string } }} WindDrawCall
 * @typedef {{ drawMode: { normal: (state: unknown, props: Record<string, unknown>) => void }, rebuildLayer: (...args: unknown[]) => unknown }} WindRendererConfig
 */

function createCapturedSpec() {
  /** @type {WindRendererConfig | undefined} */
  let captured;
  const drawCalls = /** @type {WindDrawCall[]} */ ([]);
  loadFresh("widgets/radial/WindRadialWidget/WindRadialWidget.js").create(
    {},
    createComponentContextMock({
      modules: {
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        ValueMath: loadFresh("shared/widget-kits/value/ValueMath.js"),
        SpringEasing: loadFresh("shared/widget-kits/anim/SpringEasing.js"),
        FullCircleRadialTextLayout: {
          create() {
            return {
              /** @param {unknown} state @param {unknown} mode @param {unknown} left @param {unknown} right @param {unknown} opts */
              drawDualModeText(state, mode, left, right, opts) {
                drawCalls.push(
                  /** @type {WindDrawCall} */ ({
                    mode,
                    left: /** @type {{ value: string }} */ (left),
                    right: /** @type {{ value: string }} */ (right),
                    opts
                  })
                );
              }
            };
          }
        },
        FullCircleRadialEngine: {
          create() {
            return {
              /** @param {unknown} cfg */
              createRenderer(cfg) {
                captured = /** @type {WindRendererConfig} */ (cfg);
                return function () {};
              }
            };
          }
        }
      },
      services: {
        format: {
          /** @param {unknown} value */
          applyFormatter(value) {
            return String(value);
          }
        }
      }
    })
  );
  return {
    get cfg() {
      if (!captured) {
        throw new Error("Wind renderer configuration was not captured.");
      }
      return captured;
    },
    drawCalls
  };
}

function realValueMath() {
  return loadFresh("shared/widget-kits/value/ValueMath.js").create();
}

module.exports = {
  computeWindLayout,
  createCapturedSpec,
  createComponentContextMock,
  createMockCanvas,
  createMockContext2D,
  createScriptContext,
  createWindCachingHarness,
  loadFresh,
  makeWindProps,
  realValueMath,
  runIifeScript
};
