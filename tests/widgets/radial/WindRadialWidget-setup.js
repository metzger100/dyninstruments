const { loadFresh } = require("../../helpers/load-umd");

const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const { computeWindLayout, makeWindProps } = require("./WindRadialWidget.caching.harness.js");

const { createWindCachingHarness } = require("./WindRadialWidget.caching.harness.js");

const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

function createCapturedSpec() {
  // @ts-ignore -- pre-existing untyped test mock boundary
  let captured;
  // @ts-ignore -- pre-existing untyped test mock boundary
  const drawCalls = [];
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
              // @ts-ignore -- pre-existing untyped test mock boundary
              drawDualModeText(state, mode, left, right, opts) {
                drawCalls.push({ mode, left, right, opts });
              }
            };
          }
        },
        FullCircleRadialEngine: {
          create() {
            return {
              // @ts-ignore -- pre-existing untyped test mock boundary
              createRenderer(cfg) {
                captured = cfg;
                return function () {};
              }
            };
          }
        }
      },
      services: {
        format: {
          // @ts-ignore -- pre-existing untyped test mock boundary
          applyFormatter(value) {
            return String(value);
          }
        }
      }
    })
  );
  return {
    get cfg() {
      // @ts-ignore -- pre-existing untyped test mock boundary
      return captured;
    },
    // @ts-ignore -- pre-existing untyped test mock boundary
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
