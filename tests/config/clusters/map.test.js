const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("config/clusters/map.js", function () {
  function loadMapDef() {
    const context = createScriptContext({
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      }
    });

    runIifeScript("config/shared/kind-defaults.js", context);
    runIifeScript("config/shared/editable-param-utils.js", context);
    runIifeScript("config/clusters/map.js", context);

    return context.DyniPlugin.config.clusters.find((c) => c.def && c.def.cluster === "map").def;
  }

  it("registers map cluster definition", function () {
    const def = loadMapDef();

    expect(def.name).toBe("dyni_Map_Instruments");
    expect(def.storeKeys.zoom).toBe("map.currentZoom");
    expect(def.storeKeys.requiredZoom).toBe("map.requiredZoom");
    expect(def.storeKeys.centerCourse).toBe("nav.center.course");
    expect(def.storeKeys.centerDistance).toBe("nav.center.distance");
    expect(def.storeKeys.centerMarkerCourse).toBe("nav.center.markerCourse");
    expect(def.storeKeys.centerMarkerDistance).toBe("nav.center.markerDistance");
    expect(def.storeKeys.centerPosition).toBe("map.centerPosition");
    expect(def.storeKeys.activeMeasure).toBe("map.activeMeasure");
    expect(def.storeKeys.measureRhumbLine).toBe("properties.measureRhumbLine");
    expect(def.storeKeys.lockPosition).toBe("map.lockPosition");

    expect(def.editableParameters.kind.default).toBe("centerDisplay");
    expect(def.editableParameters.kind.list).toEqual([
      { name: "Center display", value: "centerDisplay" },
      { name: "Zoom", value: "zoom" }
    ]);

    expect(def.editableParameters.centerDisplayRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.centerDisplayRatioThresholdNormal.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.centerDisplayRatioThresholdNormal.default).toBe(1.1);
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.default).toBe(2.4);

    expect(def.editableParameters.caption_zoom.condition).toEqual({ kind: "zoom" });
    expect(def.editableParameters.unit_zoom.condition).toEqual({ kind: "zoom" });
    expect(def.editableParameters.caption_zoom.default).toBe("ZOOM");
    expect(def.editableParameters.unit_zoom.default).toBe("");
    expect(def.editableParameters.caption_centerDisplayPosition.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.unit_centerDisplayPosition.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.caption_centerDisplayMeasure.displayName).toBe("Measure caption");
    expect(def.editableParameters.unit_centerDisplayMeasure.displayName).toBe("Measure distance unit");
  });

  it("applies center-display visibility semantics and clears stale visible state for zoom", function () {
    const def = loadMapDef();

    const unlocked = def.updateFunction({ kind: "centerDisplay", lockPosition: false, editing: false });
    expect(unlocked.visible).toBe(true);

    const lockedEditing = def.updateFunction({ kind: "centerDisplay", lockPosition: true, editing: true });
    expect(lockedEditing.visible).toBe(true);

    const locked = def.updateFunction({ kind: "centerDisplay", lockPosition: true, editing: false });
    expect(locked.visible).toBe(false);

    const zoom = def.updateFunction({ kind: "zoom", visible: true });
    expect(zoom.visible).toBeUndefined();
  });
});
