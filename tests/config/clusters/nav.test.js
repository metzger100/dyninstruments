const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/nav.js", function () {
  function loadNavDef() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("shared/unit-format-families.js", context);
    runIifeScript("config/shared/unit-editable-utils.js", context);
    runIifeScript("config/shared/common-editables.js", context);
    runIifeScript("config/clusters/nav.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "nav").def;
  }

  it("registers nav cluster definition", function () {
    const def = loadNavDef();
    expect(def.name).toBe("dyni_Nav_Instruments");
    expect(def.storeKeys.eta).toBe("nav.wp.eta");
    expect(def.storeKeys.xte).toBe("nav.wp.xte");
    expect(def.storeKeys.cog).toBe("nav.gps.course");
    expect(def.storeKeys.btw).toBe("nav.wp.course");
    expect(def.storeKeys.dtw).toBe("nav.wp.distance");
    expect(def.storeKeys.wpName).toBe("nav.wp.name");
    expect(def.storeKeys.activeRouteName).toBe("nav.route.name");
    expect(def.storeKeys.activeRouteRemain).toBe("nav.route.remain");
    expect(def.storeKeys.activeRouteEta).toBe("nav.route.eta");
    expect(def.storeKeys.activeRouteNextCourse).toBe("nav.route.nextCourse");
    expect(def.storeKeys.activeRouteApproaching).toBe("nav.route.isApproaching");
    expect(def.storeKeys.editingRoute).toBe("nav.routeHandler.editingRoute");
    expect(def.storeKeys.editingIndex).toBe("nav.routeHandler.editingIndex");
    expect(def.storeKeys.activeName).toBe("nav.routeHandler.activeName");
    expect(def.storeKeys.useRhumbLine).toBe("nav.routeHandler.useRhumbLine");
    expect(def.storeKeys.routeShowLL).toBe("properties.routeShowLL");
    expect(def.editableParameters.kind.default).toBe("eta");
    expect(def.editableParameters.kind.name).toBe("Instrument");
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "activeRoute")).toBe(true);
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "editRoute")).toBe(true);
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "routePoints")).toBe(true);
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "activeRouteInteractive")).toBe(false);
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "centerDisplay")).toBe(false);
    expect(def.editableParameters.kind.list.some((entry) => entry.value === "xteDisplay")).toBe(true);
    expect(def.editableParameters.centerDisplayRatioThresholdNormal).toBeUndefined();
    expect(def.editableParameters.centerDisplayRatioThresholdFlat).toBeUndefined();
    expect(def.editableParameters.leadingZero.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteRatioThresholdNormal.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteRatioThresholdFlat.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.xteRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.activeRouteRatioThresholdNormal.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.activeRouteRatioThresholdFlat.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.activeRouteRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.activeRouteRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.activeRouteRatioThresholdNormal.default).toBe(1.2);
    expect(def.editableParameters.activeRouteRatioThresholdFlat.default).toBe(3.8);
    expect(def.editableParameters.editRouteRatioThresholdNormal.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.editRouteRatioThresholdFlat.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.editRouteRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.editRouteRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.editRouteRatioThresholdNormal.default).toBe(1.2);
    expect(def.editableParameters.editRouteRatioThresholdFlat.default).toBe(3.8);
    expect(def.editableParameters.caption_editRoutePts.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.caption_editRoutePts.default).toBe("PTS");
    expect(def.editableParameters.caption_editRouteDst.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.caption_editRouteDst.default).toBe("DST");
    expect(def.editableParameters.formatUnit_editRouteDst.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.formatUnit_editRouteDst.default).toBe("nm");
    expect(def.editableParameters.unit_editRouteDst_nm.condition).toEqual({
      kind: "editRoute",
      formatUnit_editRouteDst: "nm"
    });
    expect(def.editableParameters.unit_editRouteDst_nm.default).toBe("nm");
    expect(def.editableParameters.caption_editRouteRte.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.caption_editRouteRte.default).toBe("RTE");
    expect(def.editableParameters.formatUnit_editRouteRte.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.formatUnit_editRouteRte.default).toBe("nm");
    expect(def.editableParameters.unit_editRouteRte_nm.condition).toEqual({
      kind: "editRoute",
      formatUnit_editRouteRte: "nm"
    });
    expect(def.editableParameters.unit_editRouteRte_nm.default).toBe("nm");
    expect(def.editableParameters.caption_editRouteEta.condition).toEqual({ kind: "editRoute" });
    expect(def.editableParameters.caption_editRouteEta.default).toBe("ETA");
    expect(def.editableParameters.unit_editRoutePts).toBeUndefined();
    expect(def.editableParameters.unit_editRouteEta).toBeUndefined();
    expect(def.editableParameters.caption_activeRouteRemain.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.formatUnit_activeRouteRemain.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.formatUnit_activeRouteRemain.default).toBe("nm");
    expect(def.editableParameters.unit_activeRouteRemain_nm.condition).toEqual({
      kind: "activeRoute",
      formatUnit_activeRouteRemain: "nm"
    });
    expect(def.editableParameters.unit_activeRouteRemain_nm.default).toBe("nm");
    expect(def.editableParameters.caption_xteDisplayXte.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.formatUnit_xteDisplayXte.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.unit_xteDisplayXte_nm.condition).toEqual({
      kind: "xteDisplay",
      formatUnit_xteDisplayXte: "nm"
    });
    expect(def.editableParameters.xteDisplayScale_nm).toEqual({
      type: "FLOAT",
      min: 0,
      max: 20,
      step: 0.1,
      default: 1,
      name: "XTE highway scale",
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "nm" }
    });
    expect(def.editableParameters.xteDisplayScale_m).toEqual({
      type: "FLOAT",
      min: 0,
      max: 20000,
      step: 10,
      default: 1852,
      name: "XTE highway scale",
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "m" }
    });
    expect(def.editableParameters.xteDisplayScale_km).toEqual({
      type: "FLOAT",
      min: 0,
      max: 20,
      step: 0.01,
      default: 1.852,
      name: "XTE highway scale",
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "km" }
    });
    expect(def.editableParameters.xteDisplayScale_ft).toEqual({
      type: "FLOAT",
      min: 0,
      max: 40000,
      step: 10,
      default: 6076,
      name: "XTE highway scale",
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "ft" }
    });
    expect(def.editableParameters.xteDisplayScale_yd).toEqual({
      type: "FLOAT",
      min: 0,
      max: 40000,
      step: 1,
      default: 2025,
      name: "XTE highway scale",
      condition: { kind: "xteDisplay", formatUnit_xteDisplayXte: "yd" }
    });
    expect(def.editableParameters.routePointsRatioThresholdNormal.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.routePointsRatioThresholdFlat.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.routePointsRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.routePointsRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.routePointsRatioThresholdNormal.default).toBe(1.0);
    expect(def.editableParameters.routePointsRatioThresholdFlat.default).toBe(3.5);
    expect(def.editableParameters.showHeader.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.showHeader.default).toBe(true);
    expect(def.editableParameters.formatUnit_routePointsDistance.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.formatUnit_routePointsDistance.default).toBe("nm");
    expect(def.editableParameters.unit_routePointsDistance_nm.condition).toEqual({
      kind: "routePoints",
      formatUnit_routePointsDistance: "nm"
    });
    expect(def.editableParameters.unit_routePointsDistance_nm.default).toBe("nm");
    expect(def.editableParameters.courseUnit.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.courseUnit.default).toBe("°");
    expect(def.editableParameters.waypointsText.condition).toEqual({ kind: "routePoints" });
    expect(def.editableParameters.waypointsText.default).toBe("waypoints");
    expect(def.editableParameters.showWpNameXteDisplay.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.showWpNameXteDisplay.default).toBe(false);
    expect(def.editableParameters.xteHideTextualMetrics.condition).toEqual({ kind: "xteDisplay" });
    expect(def.editableParameters.xteHideTextualMetrics.default).toBe(false);
    expect(def.editableParameters.coordinatesTabular.default).toBe(true);
    expect(def.editableParameters.coordinatesTabular.name).toBe("Tabular coordinates");
    expect(def.editableParameters.coordinatesTabular.condition).toEqual([
      { kind: "routePoints" },
      { kind: "positionBoat" },
      { kind: "positionWp" }
    ]);
    expect(def.editableParameters.stableDigits.default).toBe(false);
    expect(def.editableParameters.stableDigits.name).toBe("Stable digits");
    expect(def.editableParameters.stableDigits.condition).toEqual([
      { kind: "eta" },
      { kind: "rteEta" },
      { kind: "dst" },
      { kind: "rteDistance" },
      { kind: "vmg" },
      { kind: "xteDisplay" },
      { kind: "activeRoute" },
      { kind: "editRoute" },
      { kind: "routePoints" }
    ]);
    expect(def.editableParameters.hideSeconds.default).toBe(false);
    expect(def.editableParameters.hideSeconds.name).toBe("Hide seconds");
    expect(def.editableParameters.hideSeconds.condition).toEqual([
      { kind: "eta" },
      { kind: "rteEta" },
      { kind: "activeRoute" },
      { kind: "editRoute" }
    ]);
    expect(def.editableParameters.ratioThresholdNormal.condition).toEqual([
      { kind: "eta" },
      { kind: "rteEta" },
      { kind: "dst" },
      { kind: "rteDistance" },
      { kind: "vmg" },
      { kind: "positionBoat" },
      { kind: "positionWp" }
    ]);
    expect(def.editableParameters.ratioThresholdFlat.condition).toEqual([
      { kind: "eta" },
      { kind: "rteEta" },
      { kind: "dst" },
      { kind: "rteDistance" },
      { kind: "vmg" },
      { kind: "positionBoat" },
      { kind: "positionWp" }
    ]);
    expect(def.editableParameters.ratioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.ratioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.captionUnitScale.internal).not.toBe(true);
    expect(def.editableParameters.captionUnitScale.name).toBe("Caption/Unit size");
    expect(def.editableParameters.caption_xteDisplay).toBeUndefined();
    expect(def.editableParameters.unit_xteDisplay).toBeUndefined();
    expect(def.editableParameters.caption_activeRoute).toBeUndefined();
    expect(def.editableParameters.unit_activeRoute).toBeUndefined();
    expect(def.editableParameters.caption_editRoute).toBeUndefined();
    expect(def.editableParameters.unit_editRoute).toBeUndefined();
    expect(def.editableParameters.caption_routePoints).toBeUndefined();
    expect(def.editableParameters.unit_routePoints).toBeUndefined();
    expect(def.editableParameters.caption_centerDisplayPosition).toBeUndefined();
    expect(def.editableParameters.unit_centerDisplayPosition).toBeUndefined();
    expect(def.editableParameters.caption_activeRouteRemain.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.caption_activeRouteEta.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.unit_activeRouteEta.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.caption_activeRouteNextCourse.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.unit_activeRouteNextCourse.condition).toEqual({ kind: "activeRoute" });
    expect(def.editableParameters.caption_activeRouteRemain.displayName).toBe("Route distance caption");
    expect(def.editableParameters.formatUnit_activeRouteRemain.displayName).toBe("Formatter unit");
    expect(def.editableParameters.unit_activeRouteRemain_nm.displayName).toBe("nm unit");
    expect(def.editableParameters.caption_activeRouteEta.displayName).toBe("ETA caption");
    expect(def.editableParameters.unit_activeRouteEta.displayName).toBe("ETA unit");
    expect(def.editableParameters.caption_activeRouteNextCourse.displayName).toBe("Next course caption");
    expect(def.editableParameters.unit_activeRouteNextCourse.displayName).toBe("Next course unit");
    expect(def.editableParameters.caption_xteDisplayCog.displayName).toBe("Track caption");
    expect(def.editableParameters.unit_xteDisplayCog.displayName).toBe("Track unit");
    expect(def.editableParameters.caption_xteDisplayDst.displayName).toBe("DST caption");
    expect(def.editableParameters.unit_xteDisplayDst_nm.displayName).toBe("nm unit");
    expect(def.editableParameters.caption_xteDisplayBrg.displayName).toBe("BRG caption");
    expect(def.editableParameters.unit_xteDisplayBrg.displayName).toBe("BRG unit");
    expect(def.editableParameters.unit_editRouteDst).toBeUndefined();
    expect(def.editableParameters.unit_editRouteRte).toBeUndefined();
    expect(def.editableParameters.distanceUnit).toBeUndefined();
  });

  it("sets disconnect for waypoint-dependent kinds when wpServer is false", function () {
    const def = loadNavDef();

    const a = def.updateFunction({ kind: "dst", wpServer: false });
    expect(a.disconnect).toBe(true);

    const b = def.updateFunction({ kind: "positionWp", wpServer: false });
    expect(b.disconnect).toBe(true);

    const x = def.updateFunction({ kind: "xteDisplay", wpServer: false });
    expect(x.disconnect).toBe(true);

    const c = def.updateFunction({ kind: "eta", wpServer: false, disconnect: true });
    expect(c.disconnect).toBeUndefined();
  });

  it("does not derive disconnect for activeRoute kinds in updateFunction", function () {
    const def = loadNavDef();

    const serverDown = def.updateFunction({
      kind: "activeRoute",
      wpServer: false,
      activeRouteName: "Harbor Run"
    });
    expect(serverDown.disconnect).toBeUndefined();

    const emptyName = def.updateFunction({
      kind: "activeRoute",
      wpServer: true,
      activeRouteName: "   "
    });
    expect(emptyName.disconnect).toBeUndefined();

    const staleDisconnect = def.updateFunction({
      kind: "activeRoute",
      wpServer: true,
      activeRouteName: "Harbor Run",
      disconnect: true
    });
    expect(staleDisconnect.disconnect).toBeUndefined();

  });

  it("clears stale visible state on nav kinds", function () {
    const def = loadNavDef();

    const cleared = def.updateFunction({ kind: "eta", visible: true });
    expect(cleared.visible).toBeUndefined();
  });
});
