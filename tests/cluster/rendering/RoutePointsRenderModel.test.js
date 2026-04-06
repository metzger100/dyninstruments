const { loadFresh } = require("../../helpers/load-umd");

describe("RoutePointsRenderModel", function () {
  function createLayoutApi() {
    const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
    const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
    return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create({}, {
      getModule(id) {
        if (id === "ResponsiveScaleProfile") {
          return responsiveScaleProfile;
        }
        if (id === "LayoutRectMath") {
          return loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
        }
        if (id === "RoutePointsLayoutSizing") {
          return routePointsLayoutSizing;
        }
        if (id === "RoutePointsRowGeometry") {
          return loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js");
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function createRenderModel(options) {
    const opts = options || {};
    const moduleCache = Object.create(null);
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

    const Helpers = {
      applyFormatter: applyFormatter,
      getModule(id) {
        if (!moduleCache[id]) {
          if (id === "CenterDisplayMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/CenterDisplayMath.js");
          }
          else if (id === "RoutePointsLayout") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsLayout.js");
          }
          else if (id === "HtmlWidgetUtils") {
            moduleCache[id] = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
          }
          else if (id === "ResponsiveScaleProfile") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
          }
          else if (id === "LayoutRectMath") {
            moduleCache[id] = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
          }
          else if (id === "RoutePointsLayoutSizing") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
          }
          else if (id === "RoutePointsRowGeometry") {
            moduleCache[id] = loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js");
          }
          else {
            throw new Error("unexpected module: " + id);
          }
        }
        return moduleCache[id];
      }
    };

    return loadFresh("shared/widget-kits/nav/RoutePointsRenderModel.js").create({}, Helpers);
  }

  function createHostContext(capabilities) {
    const caps = capabilities || {
      routePoints: { activate: "dispatch" },
      routeEditor: { openEditRoute: "dispatch" }
    };

    return {
      hostActions: {
        getCapabilities: vi.fn(() => caps),
        routePoints: {
          activate: vi.fn(() => true)
        }
      }
    };
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
        distanceUnit: "nm",
        courseUnit: "°",
        waypointsText: "waypoints"
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
      props: makeProps(),
      hostContext: createHostContext(),
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
    expect(model.emptyText).toBe("");
  });

  it("disables ordinal in high mode and keeps row text geometry available", function () {
    const renderModel = createRenderModel();
    const model = renderModel.buildModel({
      props: makeProps(),
      hostContext: createHostContext(),
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
      props: props,
      hostContext: createHostContext(),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.activeWaypointKey).toContain("id:wp-0");
    expect(model.activeWaypointKey).not.toBe("idx:0");
  });

  it("formats lat/lon rows through formatLonLats and preserves formatter placeholder output", function () {
    const applyFormatter = vi.fn(function (value, formatterOptions) {
      const cfg = formatterOptions || {};
      if (cfg.formatter === "formatLonLats") {
        if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lon)) {
          return "LL-PLACEHOLDER";
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
      props: props,
      hostContext: createHostContext(),
      shellRect: { width: 320, height: 180 },
      isVerticalCommitted: false
    });

    expect(model.points[0].infoText).toBe("LL:54.1,10.4");
    expect(model.points[1].infoText).toBe("LL-PLACEHOLDER");
    expect(applyFormatter).toHaveBeenCalledWith(
      expect.objectContaining({ lat: undefined, lon: 10.5 }),
      expect.objectContaining({ formatter: "formatLonLats" })
    );
  });

  it("enforces editroutepage capability gate for row activation", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    expect(renderModel.canActivateRoutePoint({
      props: props,
      hostContext: createHostContext({
        routePoints: { activate: "dispatch" },
        routeEditor: { openEditRoute: "dispatch" }
      })
    })).toBe(true);

    expect(renderModel.canActivateRoutePoint({
      props: props,
      hostContext: createHostContext({
        routePoints: { activate: "dispatch" },
        routeEditor: { openEditRoute: "unsupported" }
      })
    })).toBe(false);

    expect(renderModel.canActivateRoutePoint({
      props: makeProps({ editing: true }),
      hostContext: createHostContext({
        routePoints: { activate: "dispatch" },
        routeEditor: { openEditRoute: "dispatch" }
      })
    })).toBe(false);
  });

  it("uses vertical resize signature contract that excludes shell height", function () {
    const renderModel = createRenderModel();
    const props = makeProps();

    const verticalA = renderModel.buildModel({
      props: props,
      hostContext: createHostContext(),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: true
    });
    const verticalB = renderModel.buildModel({
      props: props,
      hostContext: createHostContext(),
      shellRect: { width: 260, height: 400 },
      isVerticalCommitted: true
    });

    const nonVerticalA = renderModel.buildModel({
      props: props,
      hostContext: createHostContext(),
      shellRect: { width: 260, height: 120 },
      isVerticalCommitted: false
    });
    const nonVerticalB = renderModel.buildModel({
      props: props,
      hostContext: createHostContext(),
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
      props: props,
      hostContext: createHostContext(),
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
    expect(model.inlineGeometry.wrapper.style).toContain("height:" + expectedHeight + "px;");
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
      props: props,
      hostContext: createHostContext(),
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
      props: makeProps({
        domain: {
          route: null,
          routeName: "",
          pointCount: 0,
          selectedIndex: -1,
          isActiveRoute: false,
          showLatLon: false,
          useRhumbLine: false
        }
      }),
      hostContext: createHostContext(),
      shellRect: { width: 220, height: 140 },
      isVerticalCommitted: false
    });

    expect(model.hasRoute).toBe(false);
    expect(model.routeNameText).toBe("No Route");
    expect(model.emptyText).toBe("No Route");
    expect(model.pointCount).toBe(0);
    expect(model.points).toEqual([]);
    expect(model.hasValidSelection).toBe(false);
  });
});
