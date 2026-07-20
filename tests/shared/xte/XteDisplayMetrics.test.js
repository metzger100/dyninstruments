const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createMockCanvas, createMockContext2D } = require("../../helpers/mock-canvas");

describe("XteDisplayMetrics", function () {
  /** @param {unknown} value @param {Record<string, any>} cfg @param {Record<string, any>} [overrides] */
  function applyFormatter(value, cfg, overrides) {
    const opts = overrides || {};
    if (cfg.formatter === "formatDistance") {
      if (typeof value !== "number" || !isFinite(value)) {
        return cfg.default;
      }
      return (opts.distanceScale ? value * opts.distanceScale : value).toFixed(1) + "nm";
    }
    if (cfg.formatter === "formatDirection360") {
      if (typeof value !== "number" || !isFinite(value)) {
        return cfg.default;
      }
      return String(((Math.round(value) % 360) + 360) % 360);
    }
    return String(value);
  }

  /** @param {{ dynamicDraws: any[] }} [calls] @returns {any} */
  function create(calls) {
    const trackedCalls = calls || { dynamicDraws: /** @type {any[]} */ ([]) };
    const realPrimitives = loadFresh("shared/widget-kits/xte/XteHighwayPrimitives.js").create(
      {},
      createComponentContextMock({
        modules: {
          GeometryScale: loadFresh("shared/widget-kits/layout/GeometryScale.js")
        }
      })
    );
    const primitives = {
      id: "XteHighwayPrimitives",
      highwayGeometry: realPrimitives.highwayGeometry,
      drawStaticHighway: realPrimitives.drawStaticHighway,
      /**
       * @param {unknown} ctx @param {unknown} geom @param {unknown} colors @param {unknown} xteNormalized
       * @param {unknown} overflow @param {unknown} primaryDim @param {unknown} strokeWeight @param {unknown} pointerDepthWeight
       */
      drawDynamicHighway(ctx, geom, colors, xteNormalized, overflow, primaryDim, strokeWeight, pointerDepthWeight) {
        trackedCalls.dynamicDraws.push({
          geom,
          colors,
          xteNormalized,
          overflow,
          primaryDim,
          strokeWeight,
          pointerDepthWeight
        });
      },
      shouldShowWaypoint: realPrimitives.shouldShowWaypoint
    };

    const context = createComponentContextMock({
      modules: {
        XteHighwayPrimitives: { create: () => primitives },
        XteHighwayLayout: loadFresh("shared/widget-kits/xte/XteHighwayLayout.js"),
        ResponsiveScaleProfile: loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js"),
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        TextTileLayout: loadFresh("shared/widget-kits/text/TextTileLayout.js"),
        PlaceholderNormalize: loadFresh("shared/widget-kits/format/PlaceholderNormalize.js"),
        StableDigits: loadFresh("shared/widget-kits/format/StableDigits.js"),
        UnitAwareFormatter: loadFresh("shared/widget-kits/format/UnitAwareFormatter.js")
      },
      services: {
        format: {
          applyFormatter: applyFormatter
        }
      }
    });

    const api = loadFresh("shared/widget-kits/xte/XteDisplayMetrics.js").create({}, context);
    return { api: api, context: context, primitives: primitives };
  }

  /** @param {any} context @returns {{ mode: string, layout: any, primaryDim: number, geom: any }} */
  function makeGeometry(context) {
    const layoutApi = context.components.require("XteHighwayLayout");
    const primitivesApi = context.components.require("XteHighwayPrimitives");
    const insets = layoutApi.computeInsets(400, 300);
    const contentRect = layoutApi.createContentRect(400, 300, insets);
    const mode = layoutApi.computeMode(400, 300, undefined, undefined);
    const layout = layoutApi.computeLayout({
      contentRect: contentRect,
      gap: insets.gap,
      mode: mode,
      responsive: insets.responsive,
      hideTextualMetrics: false,
      showWpName: true,
      hasWaypointName: true
    });
    const primaryDim = Math.max(1, Math.min(layout.highway.w, layout.highway.h));
    const geom = primitivesApi.highwayGeometry(layout.highway, mode, primaryDim, { compactTop: false });
    return { mode: mode, layout: layout, primaryDim: primaryDim, geom: geom };
  }

  const theme = { strokeWeight: 1, pointerDepthWeight: 1 };
  const colors = {
    pointer: "#f00",
    alarm: "#ff0",
    roadLine: "#fff",
    stripeLine: "#fff"
  };

  /** @param {number} [value] @returns {any} */
  function makeSpringMotion(value) {
    const calls = /** @type {any[]} */ ([]);
    return {
      calls: calls,
      /** @param {unknown} canvas @param {number} target @param {boolean} easingEnabled @param {number} nowMs */
      resolve(canvas, target, easingEnabled, nowMs) {
        calls.push({ canvas, target, easingEnabled, nowMs });
        return value === undefined ? target : value;
      },
      isActive() {
        return true;
      }
    };
  }

  /** @param {any} api @param {any} springMotion @param {any} canvas @param {any} ctx @param {any} geom @param {any} colorsValue @param {any} primaryDim @param {any} themeValue @param {any} display @param {any} formatUnits @param {any} layoutConfig @param {any} props @param {any} xteScale @param {any} easingEnabled */
  function resolveDynamic(
    api,
    springMotion,
    canvas,
    ctx,
    geom,
    colorsValue,
    primaryDim,
    themeValue,
    display,
    formatUnits,
    layoutConfig,
    props,
    xteScale,
    easingEnabled
  ) {
    return api.resolveAndDrawDynamicXte({
      springMotion,
      canvas,
      ctx,
      geom,
      colors: colorsValue,
      primaryDim,
      theme: themeValue,
      display,
      formatUnits,
      layoutConfig,
      props,
      xteScale,
      easingEnabled
    });
  }

  /** @param {any} api @param {any} ctx @param {any} dyn @param {any} captions @param {any} units @param {any} stableDigitsEnabled @param {any} themeView @param {any} layout @param {any} metricRects */
  function buildMetrics(api, ctx, dyn, captions, units, stableDigitsEnabled, themeView, layout, metricRects) {
    return api.buildXteMetrics({
      ctx,
      dyn,
      captions,
      units,
      stableDigitsEnabled,
      themeView,
      layout,
      metricRects
    });
  }

  describe("resolveAndDrawDynamicXte", function () {
    it("returns placeholder defaults and skips drawing when xte is unavailable", function () {
      const calls = { dynamicDraws: /** @type {any[]} */ ([]) };
      const { api, context } = create(calls);
      const geometry = makeGeometry(context);
      const canvas = createMockCanvas();
      const ctx = createMockContext2D();
      const springMotion = makeSpringMotion();

      const dyn = resolveDynamic(
        api,
        springMotion,
        canvas,
        ctx,
        geometry.geom,
        colors,
        geometry.primaryDim,
        theme,
        {},
        {},
        { leadingZero: true },
        {},
        1,
        true
      );

      expect(dyn.xteAvailable).toBe(false);
      expect(dyn.xteNumber).toBeUndefined();
      expect(dyn.xteDistance).toBe("---");
      expect(dyn.xteDistanceMissing).toBe(true);
      expect(dyn.xteSide).toBe("");
      expect(dyn.dtwDistance).toBe("---");
      expect(springMotion.calls).toHaveLength(0);
      expect(calls.dynamicDraws).toHaveLength(0);
    });

    it("resolves a positive xte to side 'R' and draws the normalized spring-eased pointer", function () {
      const calls = { dynamicDraws: /** @type {any[]} */ ([]) };
      const { api, context } = create(calls);
      const geometry = makeGeometry(context);
      const canvas = createMockCanvas();
      const ctx = createMockContext2D();
      const springMotion = makeSpringMotion(0.6);

      const dyn = resolveDynamic(
        api,
        springMotion,
        canvas,
        ctx,
        geometry.geom,
        colors,
        geometry.primaryDim,
        theme,
        { xte: 0.25, cog: 45, dtw: 120, btw: 90 },
        {},
        { leadingZero: true },
        {},
        1,
        true
      );

      expect(dyn.xteAvailable).toBe(true);
      expect(dyn.xteNumber).toBe(0.25);
      expect(dyn.xteSide).toBe("R");
      expect(dyn.xteDistance).toBe("0.3nm");
      expect(springMotion.calls).toHaveLength(1);
      expect(springMotion.calls[0].target).toBeCloseTo(0.3, 5);
      expect(springMotion.calls[0].easingEnabled).toBe(true);
      expect(calls.dynamicDraws).toHaveLength(1);
      expect(calls.dynamicDraws[0].xteNormalized).toBe(0.6);
      expect(calls.dynamicDraws[0].overflow).toBe(false);
      expect(calls.dynamicDraws[0].strokeWeight).toBe(theme.strokeWeight);
      expect(calls.dynamicDraws[0].pointerDepthWeight).toBe(theme.pointerDepthWeight);
    });

    it("resolves a negative xte to side 'L' and flags overflow past the xte scale", function () {
      const calls = { dynamicDraws: /** @type {any[]} */ ([]) };
      const { api, context } = create(calls);
      const geometry = makeGeometry(context);
      const canvas = createMockCanvas();
      const ctx = createMockContext2D();
      const springMotion = makeSpringMotion();

      const dyn = resolveDynamic(
        api,
        springMotion,
        canvas,
        ctx,
        geometry.geom,
        colors,
        geometry.primaryDim,
        theme,
        { xte: -2 },
        {},
        { leadingZero: true },
        {},
        1,
        true
      );

      expect(dyn.xteSide).toBe("L");
      expect(calls.dynamicDraws).toHaveLength(1);
      expect(calls.dynamicDraws[0].overflow).toBe(true);
      expect(calls.dynamicDraws[0].xteNormalized).toBeLessThan(0);
    });

    it("uses the mapper-owned leadingZero setting for heading parameters", function () {
      const { api, context } = create();
      const geometry = makeGeometry(context);
      const canvas = createMockCanvas();
      const ctx = createMockContext2D();

      const withDefault = resolveDynamic(
        api,
        makeSpringMotion(),
        canvas,
        ctx,
        geometry.geom,
        colors,
        geometry.primaryDim,
        theme,
        {},
        {},
        { leadingZero: true },
        {},
        1,
        true
      );
      const withDisabled = resolveDynamic(
        api,
        makeSpringMotion(),
        canvas,
        ctx,
        geometry.geom,
        colors,
        geometry.primaryDim,
        theme,
        {},
        {},
        { leadingZero: false },
        {},
        1,
        true
      );

      expect(withDefault.headingParams).toEqual([true]);
      expect(withDisabled.headingParams).toEqual([false]);
    });
  });

  describe("buildXteMetrics", function () {
    /** @param {Record<string, any>} [overrides] */
    function makeDyn(overrides) {
      return Object.assign(
        {
          cogRaw: 45,
          btwRaw: 90,
          headingParams: [true],
          defaultText: "---",
          xteDistance: "0.3nm",
          xteSide: "R",
          dtwDistance: "1.2nm"
        },
        overrides || {}
      );
    }

    it("formats the cog/btw metrics via unitFormatter and assembles the xte value without stable digits", function () {
      const { api, context } = create();
      const geometry = makeGeometry(context);
      const captions = { track: "COG", xte: "XTE", dtw: "DTW", brg: "BTW" };
      const units = { track: "°", xte: "nm", dtw: "nm", brg: "°" };
      const themeView = { family: "sans-serif", valueWeight: 700, labelWeight: 700 };
      const ctx = createMockContext2D();

      const result = buildMetrics(
        api,
        ctx,
        makeDyn(),
        captions,
        units,
        false,
        themeView,
        geometry.layout,
        geometry.layout.metricRects
      );

      expect(result.metrics.cog).toEqual({ caption: "COG", value: "45", unit: "°" });
      expect(result.metrics.btw).toEqual({ caption: "BTW", value: "90", unit: "°" });
      expect(result.metrics.xte).toEqual({ caption: "XTE", value: "0.3nmR", unit: "nm" });
      expect(result.metrics.dtw).toEqual({ caption: "DTW", value: "1.2nm", unit: "nm" });
      expect(Object.keys(result.metricSpacing).sort()).toEqual(["btw", "cog", "dtw", "xte"]);
    });

    it("pads the xte value through stable digits when enabled and it fits the metric tile", function () {
      const { api, context } = create();
      const geometry = makeGeometry(context);
      const stableDigits = context.components.require("StableDigits");
      const captions = { xte: "XTE" };
      const units = { xte: "nm" };
      const themeView = { family: "sans-serif", valueWeight: 700, labelWeight: 700 };
      const ctx = createMockContext2D();
      const dyn = makeDyn({ xteDistance: "0.3nm", xteSide: "R" });

      const result = buildMetrics(
        api,
        ctx,
        dyn,
        captions,
        units,
        true,
        themeView,
        geometry.layout,
        geometry.layout.metricRects
      );

      const expectedStable = stableDigits.normalize(dyn.xteDistance, {
        integerWidth: stableDigits.resolveIntegerWidth(dyn.xteDistance, 2),
        reserveSignSlot: false,
        sideSuffix: dyn.xteSide,
        reserveSideSuffixSlot: true
      });
      expect([expectedStable.padded, expectedStable.plain]).toContain(result.metrics.xte.value);
    });
  });
});
