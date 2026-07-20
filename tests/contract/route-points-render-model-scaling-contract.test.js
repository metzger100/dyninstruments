const { loadFresh } = require("../helpers/load-umd");
const { createComponentContextMock } = require("../helpers/component-context-mock");
const { evaluateLinearScaling } = require("../../tools/quality-policy/operation-count-evaluator.mjs");

// RoutePointsRenderModel.buildModel iterates every route
// point once. This proves that point reads plus formatter/helper work
// grow linearly with point count, not
// quadratically, and that the produced rows stay correct at every size.
describe("RoutePointsRenderModel.buildModel scaling contract", function () {
  /** @param {{ onOperation?: () => void }} [options] @returns {any} */
  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter =
      /** @param {any} value @param {any} formatterOptions @returns {any} */
      function (value, formatterOptions) {
        opts.onOperation?.();
        const cfg = formatterOptions || {};
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return cfg.default;
        }
        if (cfg.formatter === "formatDirection") {
          return "DIR:" + Math.round(numeric);
        }
        if (cfg.formatter === "formatDistance") {
          return "DST:" + Math.round(numeric);
        }
        return String(value);
      };

    const services = {
      format: { applyFormatter: applyFormatter },
      themeTokens: {
        resolveForRoot() {
          return { font: { family: "sans-serif", familyMono: "monospace", weight: 720, labelWeight: 610 } };
        }
      }
    };
    const moduleSources = {
      CenterDisplayMath: loadFresh("shared/widget-kits/nav/CenterDisplayMath.js"),
      HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
      LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
      NavInteractionPolicy: loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js"),
      PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
      RadialTextFitting: loadFresh("shared/widget-kits/radial/RadialTextFitting.js"),
      CanvasTextLayout: loadFresh("shared/widget-kits/text/CanvasTextLayout.js"),
      ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
      RoutePointsHtmlFit: loadFresh("shared/widget-kits/nav/RoutePointsHtmlFit.js"),
      RoutePointsInfoText: loadFresh("shared/widget-kits/nav/RoutePointsInfoText.js"),
      RoutePointsLayout: loadFresh("shared/widget-kits/nav/RoutePointsLayout.js"),
      RoutePointsLayoutSizing: loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js"),
      RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js"),
      StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
      StateScreenPrecedence: loadFresh("shared/widget-kits/state/StateScreenPrecedence.js"),
      StateScreenInteraction: loadFresh("shared/widget-kits/state/StateScreenInteraction.js"),
      StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
      TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
      UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js")
    };
    const moduleSourceContext = createComponentContextMock({ modules: moduleSources, services: services });
    const modules = Object.create(null);
    Object.keys(moduleSources).forEach(function (id) {
      modules[id] = moduleSourceContext.components.require(id);
    });

    const onOperation = opts.onOperation;
    if (typeof onOperation === "function") {
      const centerMath = modules.CenterDisplayMath;
      const realComputeCourseDistance = centerMath.computeCourseDistance;
      /** @param {unknown} previousPoint @param {unknown} currentPoint @param {unknown} useRhumbLine */
      centerMath.computeCourseDistance = function (previousPoint, currentPoint, useRhumbLine) {
        onOperation();
        return realComputeCourseDistance(previousPoint, currentPoint, useRhumbLine);
      };
    }

    const componentContext = createComponentContextMock({ modules: modules, services: services });
    return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, componentContext);
  }

  /** @param {number} count @param {() => void} [onOperation] @returns {any[]} */
  function makePoints(count, onOperation) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      points.push({ name: "P" + i, lat: 54 + i * 0.001, lon: 10 + i * 0.001 });
    }
    if (!onOperation) return points;
    return new Proxy(points, {
      get(target, property, receiver) {
        if (property === "length" || (typeof property === "string" && /^\d+$/.test(property))) onOperation();
        return Reflect.get(target, property, receiver);
      }
    });
  }

  /** @param {number} pointCount @param {() => void} [onOperation] @returns {any} */
  function buildModelForPointCount(pointCount, onOperation) {
    const renderModel = createRenderModel({ onOperation: onOperation });
    return renderModel.buildModel({
      props: {
        default: "---",
        domain: {
          route: { name: "Scaling Route", points: makePoints(pointCount, onOperation) },
          routeName: "Scaling Route",
          pointCount: pointCount,
          selectedIndex: -1,
          isActiveRoute: false,
          showLatLon: false,
          useRhumbLine: false
        },
        layout: { ratioThresholdNormal: 1.0, ratioThresholdFlat: 3.5, showHeader: true },
        formatting: { courseUnit: "°", waypointsText: "waypoints" },
        units: { distance: "nm" },
        formatUnits: { distance: "nm" },
        surfacePolicy: { interaction: { mode: "passive" } }
      },
      shellRect: { width: 320, height: 480 },
      isVerticalCommitted: false
    });
  }

  it("counts all observable per-point collection, formatter, and helper work", function () {
    const sizes = [25, 50, 100, 200];
    /** @type {any} */
    let lastModel = null;

    const result = evaluateLinearScaling({
      sizes: sizes,
      fixedOverhead: 4,
      measure: function (n) {
        let calls = 0;
        lastModel = buildModelForPointCount(n, function () {
          calls += 1;
        });
        return calls;
      }
    });

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.samples.map((sample) => sample.count)).toEqual([122, 247, 497, 997]);
    expect(lastModel.pointCount).toBe(sizes[sizes.length - 1]);
  });

  it("makes a quadratic rescan of the proxied collection violate the envelope", function () {
    const sizes = [25, 50, 100, 200];
    const result = evaluateLinearScaling({
      sizes: sizes,
      fixedOverhead: 4,
      measure(n) {
        let calls = 0;
        const points = makePoints(n, function () {
          calls += 1;
        });
        for (let outer = 0; outer < points.length; outer += 1) {
          for (let inner = 0; inner < points.length; inner += 1) void points[inner];
        }
        return calls;
      }
    });

    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("produces correct row content at both a small and a doubled point count", function () {
    const small = buildModelForPointCount(25);
    const doubled = buildModelForPointCount(50);

    expect(small.points).toHaveLength(25);
    expect(doubled.points).toHaveLength(50);

    [small, doubled].forEach(function (model) {
      expect(model.points[0].infoText).toBe("--°/--nm");
      expect(model.points[0].nameText).toBe("P0");
      for (let i = 1; i < model.points.length; i += 1) {
        expect(model.points[i].infoText).toMatch(/^DIR:\d+°\/DST:\d+nm$/);
        expect(model.points[i].nameText).toBe("P" + i);
      }
    });
  });
});
