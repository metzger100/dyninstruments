const { createComponentContextMock } = require("../helpers/component-context-mock");
const { loadFresh } = require("../helpers/load-umd");

const MODULE_EXPECTATIONS = [
  {
    rel: "shared/widget-kits/value/ValueMath.js",
    api: [
      "toObject",
      "toText",
      "clampNumber",
      "isObject",
      "toSafeInteger",
      "hasText",
      "keyToText",
      "textLength",
      "lerp",
      "appendUnit",
      "toFiniteNumber",
      "toOptionalFiniteNumber",
      "isFiniteNumber",
      "trimText",
      "clamp",
      "clampPositive",
      "ensureObject",
    ],
  },
  {
    rel: "shared/widget-kits/html/HtmlMeasureUtils.js",
    api: [
      "parseFontPx",
      "createApproximateMeasureContext",
      "resolveMeasureContext",
      "measurePx",
      "measureStyle",
      "toStyle",
      "resolveOwnerDocument",
      "resolveFitCache",
    ],
  },
  {
    rel: "shared/widget-kits/html/HtmlWidgetUtils.js",
    api: [
      "resolveDefaultText",
      "toFontStyle",
      "buildTextOptions",
      "toStyleText",
      "resolveMetricValueFamily",
      "resolveLabelEdgePolicy",
      "toPx",
      "joinStyles",
    ],
  },
  {
    rel: "shared/widget-kits/text/TextLayoutComposite.js",
    api: [
      "resolveTextFillScale",
      "clampTextFillScale",
      "scaleTextCeiling",
      "resolveOpacity",
      "resolveCompactGeometryScale",
      "scaleValueUnitFit",
      "scaleInlineFit",
    ],
  },
  {
    rel: "shared/widget-kits/text/TextLayoutEngine.js",
    api: ["makeFitCacheKey", "writeFitCache", "readFitCache", "createFitCache"],
  },
  {
    rel: "shared/widget-kits/text/CanvasTextFitting.js",
    api: ["setFont", "measureTextWidth", "fitSingleTextPx"],
  },
  {
    rel: "shared/widget-kits/text/CanvasTextLayout.js",
    api: ["resolveFamily"],
  },
  {
    rel: "shared/widget-kits/layout/LayoutRectMath.js",
    api: ["makeRect", "splitRow", "splitStack"],
  },
  {
    rel: "shared/widget-kits/radial/RadialAngleMath.js",
    api: ["valueToAngle", "valueToAngleFlat"],
  },
  {
    rel: "shared/widget-kits/radial/RadialValueMath.js",
    api: ["buildValueTickAngles"],
  },
  {
    rel: "shared/widget-kits/format/StableDigits.js",
    api: ["resolveIntegerWidth"],
    extra(api) {
      expect(api.resolveIntegerWidth.length).toBeGreaterThanOrEqual(3);
    },
  },
];

const EXTRA_MODULES = {
  PlaceholderNormalize: "shared/widget-kits/format/PlaceholderNormalize.js",
  RadialSectorMath: "shared/widget-kits/radial/RadialSectorMath.js",
  ResponsiveScaleProfile: "shared/widget-kits/layout/ResponsiveScaleProfile.js",
  TextLayoutComposite: "shared/widget-kits/text/TextLayoutComposite.js",
  TextLayoutPrimitives: "shared/widget-kits/text/TextLayoutPrimitives.js",
};

describe("canonical helper API contract", function () {
  it("keeps documented canonical helper APIs exported", function () {
    MODULE_EXPECTATIONS.forEach(function (entry) {
      const api = createApi(entry.rel);

      expect(api, entry.rel).toBeTruthy();
      expect(missingFunctions(api, entry.api), entry.rel).toEqual([]);
      if (entry.extra) entry.extra(api);
    });
  });

  it("reports missing helper functions in the local assertion", function () {
    expect(missingFunctions({ keep() {} }, ["keep", "missing"])).toEqual([
      "missing",
    ]);
  });
});

function createApi(rel) {
  const mod = loadFresh(rel);
  expect(typeof mod.create, rel).toBe("function");
  return mod.create({}, createComponentContextMock({ modules: loadExtraModules() }));
}

function missingFunctions(api, names) {
  return names.filter(function (name) {
    return !api || typeof api[name] !== "function";
  });
}

function loadExtraModules() {
  const modules = {};
  Object.keys(EXTRA_MODULES).forEach(function (id) {
    modules[id] = loadFresh(EXTRA_MODULES[id]);
  });
  return modules;
}
