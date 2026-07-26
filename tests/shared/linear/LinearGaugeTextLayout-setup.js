const { createMockContext2D } = require("../../helpers/mock-canvas");

const { createFontAwareContext, createTextLayout } = require("../../helpers/linear-label-fit");

// @ts-ignore -- pre-existing untyped test mock boundary
function createState(textFillScale) {
  return {
    ctx: createMockContext2D({ charWidth: 7 }),
    family: "sans-serif",
    valueWeight: 700,
    labelWeight: 600,
    textFillScale: textFillScale,
    theme: {
      linear: {
        ticks: {
          majorLen: 8,
          minorLen: 4
        }
      }
    },
    layout: {
      trackY: 20,
      trackBox: { y: 0, h: 40 },
      scaleX0: 0,
      scaleX1: 100
    },
    axis: {
      min: 0,
      max: 100
    },
    labelFontPx: 12,
    labelInsetPx: 4
  };
}

module.exports = {
  createFontAwareContext,
  createMockContext2D,
  createState,
  createTextLayout
};
