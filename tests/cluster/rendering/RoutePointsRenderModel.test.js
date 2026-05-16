const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");

describe("RoutePointsRenderModel", function () {
  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create({}, createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        RoutePointsLayoutSizing: routePointsLayoutSizing,
        RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js")
      }
    }));
  }

  function createRenderModel(options) {
    const opts = options || {};
    const applyFormatter = opts.applyFormatter || function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatLonLats") {
        if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
          return cfg.default;
        }
        return "LL:" + value.lat.toFixed(2) + "," + value.lon.toFixed(2);
      }

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
          return {
            font: {
              family: "sans-serif",
              familyMono: "monospace",
              weight: 720,
              labelWeight: 610
            }
          };
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
    const moduleSourceContext = createComponentContextMock({
      modules: moduleSources,
      services: services
    });
    const modules = Object.create(null);
    Object.keys(moduleSources).forEach(function (id) {
      modules[id] = moduleSourceContext.components.require(id);
    });
    const componentContext = createComponentContextMock({
      modules: modules,
      services: services
    });

    return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, componentContext);
  }

  function withSurfacePolicy(props, options) {
    const opts = options || {};
    const interactionMode = opts.mode === "passive" ? "passive" : "dispatch";
    return Object.assign({}, props || {}, {
      surfacePolicy: {
        interaction: { mode: interactionMode },
        containerOrientation: opts.orientation === "vertical" ? "vertical" : "default",
        actions: {
          routePoints: {
            activate: vi.fn(() => true)
          }
        }
      }
    });
  }

  function makeProps(overrides) {
    return Object.assign({
      default: "---",
      domain: {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "Mid", lat: 54.2, lon: 10.5 },
            { name: "", lat: 54.3, lon: 10.6 }
          ]
        },
        routeName: "Harbor Run",
        pointCount: 3,
        selectedIndex: 2,
        isActiveRoute: true,
        showLatLon: false,
        useRhumbLine: false
      },
      layout: {
        ratioThresholdNormal: 1.0,
        ratioThresholdFlat: 3.5,
        showHeader: true
      },
      formatting: {
        courseUnit: "°",
        waypointsText: "waypoints"
      },
      units: {
        distance: "nm"
      },
      formatUnits: {
        distance: "nm"
      }
    }, overrides || {});
  }

  function extractHeight(style) {
    const match = String(style || "").match(/height:(\d+)px;/);
    return match ? Number(match[1]) : 0;
  }

  function extractMinHeight(style) {
    const match = String(style || "").match(/min-height:(\d+)px;/);
    return match ? Number(match[1]) : 0;
  }

  it("builds course/distance rows with placeholder first row and name fallback", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("normal");
    expect(model.pointCount).toBe(3);
    expect(model.metaText).toBe("3 waypoints");
    expect(model.points[0].infoText).toBe("--°/--nm");
    expect(model.points[1].infoText).toMatch(/^DIR:\d+°\/DST:\d+nm$/);
    expect(model.points[2].nameText).toBe("2");
    expect(model.activeWaypointKey).toContain("lat:54.300000");
    expect(model.activeWaypointKey).toContain("lon:10.600000");
    expect(model.hasValidSelection).toBe(true);
    expect(model.canActivateRoutePoint).toBe(true);
    expect(model.showOrdinal).toBe(true);
    expect(model.inlineGeometry.showOrdinal).toBe(true);
    expect(model.kind).toBe("data");
    expect(model.interactionState).toBe("dispatch");
    expect(model.points[2].pointSnapshot).toMatchObject({
      idx: 2, name: "", lat: 54.3, lon: 10.6, routeName: "Harbor Run", selected: true
    });
  });

  it("keeps missing coordinate and optional leg fields out of numeric zero coercion in point snapshots", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          route: {
            name: "Harbor Run",
            points: [
              { name: "Start", lat: 54.1, lon: 10.4, course: "", distance: "   " },
              { name: "Gap", idx: null, lat: null, lon: "   ", course: null, distance: "" }
            ]
          },
          routeName: "Harbor Run",
          pointCount: 2,
          selectedIndex: 1,
          isActiveRoute: false,
          showLatLon: false,
          useRhumbLine: false
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].pointSnapshot).toMatchObject({
      idx: 0,
      lat: 54.1,
      lon: 10.4
    });
    expect(model.points[0].pointSnapshot).not.toHaveProperty("course");
    expect(model.points[0].pointSnapshot).not.toHaveProperty("distance");

    expect(model.points[1].pointSnapshot.idx).toBe(1);
    expect(model.points[1].pointSnapshot.lat).toBeUndefined();
    expect(model.points[1].pointSnapshot.lon).toBeUndefined();
    expect(model.points[1].pointSnapshot).not.toHaveProperty("course");
    expect(model.points[1].pointSnapshot).not.toHaveProperty("distance");
    expect(model.activeWaypointKey).not.toContain("lat:0.000000");
    expect(model.activeWaypointKey).not.toContain("lon:0.000000");
  });

  it("keeps missing selectedIndex values unselected instead of coercing to index zero", function () {
    const renderModel = createRenderModel();
    [null, undefined, "", "   "].forEach(function (rawSelectedIndex) {
      const model = renderModel.buildModel({
        props: withSurfacePolicy(makeProps({
          domain: {
            route: {
              name: "Harbor Run",
              points: [
                { name: "Start", lat: 54.1, lon: 10.4 },
                { name: "Mid", lat: 54.2, lon: 10.5 }
              ]
            },
            routeName: "Harbor Run",
            pointCount: 2,
            selectedIndex: rawSelectedIndex,
            isActiveRoute: false,
            showLatLon: false,
            useRhumbLine: false
          }
        }), { mode: "dispatch" }),
        shellRect: { width: 320, height: 180 },
        isVerticalCommitted: false
      });

      expect(model.selectedIndex).toBe(-1);
      expect(model.hasValidSelection).toBe(false);
      expect(model.activeWaypointKey).toBeNull();
    });
  });

  it("disables ordinal in high mode and keeps row text geometry available", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 180, height: 340 },
      isVerticalCommitted: false
    });

    expect(model.mode).toBe("high");
    expect(model.showOrdinal).toBe(false);
    expect(model.inlineGeometry.showOrdinal).toBe(false);
    expect(model.inlineGeometry.rows[0].ordinalStyle).toBe("");
    expect(model.inlineGeometry.rows[0].nameStyle).toMatch(/width:\d+px;/);
    expect(model.inlineGeometry.rows[0].infoStyle).toMatch(/width:\d+px;/);
    expect(model.inlineGeometry.rows[0].markerStyle).toMatch(/width:\d+px;/);
  });

  it("prefers stable raw waypoint identity fields for active waypoint key", function () {
    const renderModel = createRenderModel();
    const props = makeProps({
      domain: {
        route: {
          name: "Identity Route",
          points: [
            { id: "wp-0", name: "Start", lat: 54.1, lon: 10.4 },
            { uid: "wp-1", name: "Mid", lat: 54.2, lon: 10.5 }
          ]
        },
        routeName: "Identity Route",
        pointCount: 2,
        selectedIndex: 0,
        isActiveRoute: false,
        showLatLon: false,
        useRhumbLine: false
      }
    });

    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.activeWaypointKey).toContain("id:wp-0");
    expect(model.activeWaypointKey).not.toBe("idx:0");
  });

  it("formats lat/lon rows through formatLonLats and normalizes known formatter placeholders", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatLonLats") {
        if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
          return "-----";
        }
        return "LL:" + value.lat + "," + value.lon;
      }
      return cfg.default;
    });
    const renderModel = createRenderModel({ applyFormatter: applyFormatter });
    const props = makeProps({
      domain: {
        route: {
          name: "Harbor Run",
          points: [
            { name: "Start", lat: 54.1, lon: 10.4 },
            { name: "Mid", lat: undefined, lon: 10.5 }
          ]
        },
        routeName: "Harbor Run",
        pointCount: 2,
        selectedIndex: 0,
        isActiveRoute: false,
        showLatLon: true,
        useRhumbLine: false
      }
    });

    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].infoText).toBe("LL:54.1,10.4");
    expect(model.points[1].infoText).toBe("---");
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ lat: undefined, lon: 10.5 }),
      expect.objectContaining({ formatter: "formatLonLats" })
    );
  });

  it("normalizes course and distance formatter fallback tokens while preserving compound row format", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatDirection") {
        return "--:--";
      }
      if (cfg.formatter === "formatDistance") {
        return "    -";
      }
      return cfg.default;
    });
    const renderModel = createRenderModel({ applyFormatter: applyFormatter });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps(), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].infoText).toBe("--°/--nm");
    expect(model.points[1].infoText).toBe("---°/---nm");
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ formatter: "formatDirection" })
    );
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ formatter: "formatDistance" })
    );
  });

  it("enforces editroutepage capability gate for row activation", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    expect(renderModel.canActivateRoutePoint({
      props: withSurfacePolicy(props, { mode: "dispatch" })
    })).toBe(true);

    expect(renderModel.canActivateRoutePoint({
      props: withSurfacePolicy(props, { mode: "passive" })
    })).toBe(false);

    expect(renderModel.canActivateRoutePoint({
      props: withSurfacePolicy(makeProps({ editing: true }), { mode: "dispatch" })
    })).toBe(false);
  });

  it("uses vertical resize signature contract that excludes shell height", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    const verticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: true
    });
    const verticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 260, height: 400 },
      isVerticalCommitted: true
    });

    const nonVerticalA = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: false
    });
    const nonVerticalB = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch" }),
      shellRect: { width: 260, height: 400 },
      isVerticalCommitted: false
    });

    expect(verticalA.mode).toBe("high");
    expect(verticalA.showOrdinal).toBe(false);
    expect(verticalB.showOrdinal).toBe(false);
    expect(nonVerticalA.showOrdinal).toBe(true);
    expect(verticalA.resizeSignatureParts.join("|")).toBe(verticalB.resizeSignatureParts.join("|"));
    expect(nonVerticalA.resizeSignatureParts.join("|")).not.toBe(nonVerticalB.resizeSignatureParts.join("|"));
  });

  it("uses capped natural height as the effective vertical layout height input", function () {
    const renderModel = createRenderModel();
    const layoutApi = createLayoutApi();
    const props = makeProps();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 260, height: 520 },
      isVerticalCommitted: true,
      viewportHeight: 500
    });

    const expectedHeight = model.naturalHeight.cappedHeight;
    const insets = layoutApi.computeInsets(model.shellWidth, expectedHeight);
    const contentRect = layoutApi.createContentRect(model.shellWidth, expectedHeight, insets);
    const expectedLayout = layoutApi.computeLayout({
      contentRect: contentRect,
      mode: model.mode,
      ratioThresholdNormal: model.ratioThresholdNormal,
      ratioThresholdFlat: model.ratioThresholdFlat,
      isVerticalContainer: true,
      verticalAnchorWidth: model.shellWidth,
      showHeader: model.showHeader,
      pointCount: model.pointCount,
      responsive: insets.responsive,
      trailingGutterPx: model.scrollbarGutterPx
    });

    expect(model.layoutShellHeight).toBe(expectedHeight);
    expect(model.layoutShellHeight).not.toBe(model.shellHeight);
    expect(model.inlineGeometry.wrapper.style).not.toContain("height:");
    expect(extractHeight(model.inlineGeometry.list.style)).toBe(expectedLayout.listRect.h);
  });

  it("keeps vertical list viewport height aligned with row-stack min-height when uncapped", function () {
    const renderModel = createRenderModel();
    const points = [];
    for (let i = 0; i < 25; i += 1) {
      points.push({ name: "WP" + i, lat: 54 + i * 0.01, lon: 10 + i * 0.01 });
    }
    const props = makeProps({
      domain: {
        route: { name: "Long Route", points: points },
        routeName: "Long Route",
        pointCount: points.length,
        selectedIndex: 12,
        isActiveRoute: false,
        showLatLon: false,
        useRhumbLine: false
      }
    });
    const model = renderModel.buildModel({
      props: withSurfacePolicy(props, { mode: "dispatch", orientation: "vertical" }),
      shellRect: { width: 320, height: 900 },
      isVerticalCommitted: true,
      viewportHeight: 10000
    });

    expect(model.naturalHeight.isCapped).toBe(false);
    expect(extractHeight(model.inlineGeometry.list.style)).toBe(extractMinHeight(model.inlineGeometry.list.contentStyle));
  });

  it("fails closed when route payload is missing", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        domain: {
          route: null,
          routeName: "",
          pointCount: 0,
          selectedIndex: -1,
          isActiveRoute: false,
          showLatLon: false,
          useRhumbLine: false
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 220, height: 140 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("noRoute");
    expect(model.stateLabel).toBe("No Route");
    expect(model.hasRoute).toBe(false);
    expect(model.routeNameText).toBe("");
    expect(model.pointCount).toBe(0);
    expect(model.points).toEqual([]);
    expect(model.hasValidSelection).toBe(false);
  });

  it("classifies disconnected before noRoute and disables row activation", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: withSurfacePolicy(makeProps({
        disconnect: true,
        domain: {
          route: {
            name: "Harbor Run",
            points: [
              { name: "Start", lat: 54.1, lon: 10.4 }
            ]
          },
          routeName: "Harbor Run",
          pointCount: 1,
          selectedIndex: 0,
          isActiveRoute: false,
          showLatLon: false,
          useRhumbLine: false
        }
      }), { mode: "dispatch" }),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.kind).toBe("disconnected");
    expect(model.stateLabel).toBe("GPS Lost");
    expect(model.hasRoute).toBe(false);
    expect(model.points).toEqual([]);
    expect(model.canActivateRoutePoint).toBe(false);
    expect(model.interactionState).toBe("passive");
  });
});
