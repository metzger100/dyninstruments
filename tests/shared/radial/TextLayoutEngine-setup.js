const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const { createMockContext2D } = require("../../helpers/mock-canvas");

function createSizingContext() {
  const ctx = createMockContext2D();
  // @ts-ignore -- pre-existing untyped test mock boundary
  ctx.measureText = function (text) {
    const match = /(\d+)px/.exec(String(this.font || ""));
    const px = match ? Number(match[1]) : 10;
    const width = String(text || "").length * px * 0.6;
    return {
      width: width,
      actualBoundingBoxAscent: px * 0.7,
      actualBoundingBoxDescent: px * 0.3
    };
  };
  return ctx;
}

function createEngine() {
  const engineModule = loadFresh("shared/widget-kits/text/TextLayoutEngine.js");
  const primitiveModule = loadFresh("shared/widget-kits/text/TextLayoutPrimitives.js");
  const compositeModule = loadFresh("shared/widget-kits/text/TextLayoutComposite.js");
  const textLayoutModule = loadFresh("shared/widget-kits/text/CanvasTextLayout.js");
  const textFittingModule = loadFresh("shared/widget-kits/radial/RadialTextFitting.js");
  const responsiveProfileModule = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const valueMathModule = {
    create() {
      return {
        // @ts-ignore -- pre-existing untyped test mock boundary
        isFiniteNumber(n) {
          return typeof n === "number" && isFinite(n);
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        clamp(n, lo, hi) {
          const num = Number(n);
          if (!isFinite(num)) return Number(lo);
          return Math.max(Number(lo), Math.min(Number(hi), num));
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        clampNumber(value, lo, hi, fallbackValue) {
          const n = Number(value);
          if (!Number.isFinite(n)) {
            return Number(fallbackValue);
          }
          return Math.max(Number(lo), Math.min(Number(hi), n));
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        lerp(from, to, t) {
          return from + (to - from) * t;
        },
        // @ts-ignore -- pre-existing untyped test mock boundary
        computeMode(ratio, normal, flat) {
          if (ratio < normal) return "high";
          if (ratio > flat) return "flat";
          return "normal";
        }
      };
    }
  };

  return engineModule.create(
    {},
    createComponentContextMock({
      modules: {
        ValueMath: valueMathModule,
        CanvasTextLayout: textLayoutModule,
        RadialTextFitting: textFittingModule,
        TextLayoutPrimitives: primitiveModule,
        TextLayoutComposite: compositeModule,
        ResponsiveScaleProfile: responsiveProfileModule
      }
    })
  );
}

module.exports = {
  createComponentContextMock,
  createEngine,
  createMockContext2D,
  createSizingContext,
  loadFresh
};
