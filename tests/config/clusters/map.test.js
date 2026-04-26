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
    runIifeScript("shared/unit-format-families.js", context);
    runIifeScript("config/shared/unit-editable-utils.js", context);
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
    expect(def.storeKeys.target).toBe("nav.ais.nearest");
    expect(def.storeKeys.trackedMmsi).toBe("nav.ais.trackedMmsi");
    expect(def.storeKeys.aisMarkAllWarning).toBe("properties.aisMarkAllWarning");

    expect(def.editableParameters.kind.default).toBe("centerDisplay");
    expect(def.editableParameters.kind.list).toEqual([
      { name: "Center display", value: "centerDisplay" },
      { name: "Zoom", value: "zoom" },
      { name: "AIS target", value: "aisTarget" }
    ]);

    expect(def.editableParameters.centerDisplayRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.centerDisplayRatioThresholdNormal.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.centerDisplayRatioThresholdNormal.default).toBe(1.1);
    expect(def.editableParameters.centerDisplayRatioThresholdFlat.default).toBe(2.4);
    expect(def.editableParameters.coordinatesTabular.default).toBe(true);
    expect(def.editableParameters.coordinatesTabular.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.stableDigits.default).toBe(false);
    expect(def.editableParameters.stableDigits.condition).toEqual([
      { kind: "centerDisplay" },
      { kind: "zoom" },
      { kind: "aisTarget" }
    ]);
    expect(def.editableParameters.aisTargetRatioThresholdNormal.internal).toBe(true);
    expect(def.editableParameters.aisTargetRatioThresholdFlat.internal).toBe(true);
    expect(def.editableParameters.aisTargetRatioThresholdNormal.condition).toEqual({ kind: "aisTarget" });
    expect(def.editableParameters.aisTargetRatioThresholdFlat.condition).toEqual({ kind: "aisTarget" });
    expect(def.editableParameters.aisTargetRatioThresholdNormal.default).toBe(1.2);
    expect(def.editableParameters.aisTargetRatioThresholdFlat.default).toBe(3.8);

    expect(def.editableParameters.caption_zoom.condition).toEqual({ kind: "zoom" });
    expect(def.editableParameters.unit_zoom.condition).toEqual({ kind: "zoom" });
    expect(def.editableParameters.caption_zoom.default).toBe("ZOOM");
    expect(def.editableParameters.unit_zoom.default).toBe("");
    expect(def.editableParameters.caption_aisTargetDst.default).toBe("DST");
    expect(def.editableParameters.formatUnit_aisTargetDst.default).toBe("nm");
    expect(def.editableParameters.unit_aisTargetDst_nm.default).toBe("nm");
    expect(def.editableParameters.caption_aisTargetCpa.default).toBe("DCPA");
    expect(def.editableParameters.formatUnit_aisTargetCpa.default).toBe("nm");
    expect(def.editableParameters.unit_aisTargetCpa_nm.default).toBe("nm");
    expect(def.editableParameters.caption_aisTargetTcpa.default).toBe("TCPA");
    expect(def.editableParameters.unit_aisTargetTcpa.default).toBe("min");
    expect(def.editableParameters.caption_aisTargetBrg.default).toBe("BRG");
    expect(def.editableParameters.unit_aisTargetBrg.default).toBe("°");
    expect(def.editableParameters.caption_aisTargetTcpa.displayName).toBe("TCPA caption");
    expect(def.editableParameters.unit_aisTargetBrg.displayName).toBe("BRG unit");
    expect(def.editableParameters.caption_centerDisplayPosition.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.unit_centerDisplayPosition.condition).toEqual({ kind: "centerDisplay" });
    expect(def.editableParameters.caption_centerDisplayMeasure.displayName).toBe("Measure caption");
    expect(def.editableParameters.unit_centerDisplayMeasure_nm.displayName).toBe("nm unit");
    expect(def.editableParameters.formatUnit_centerDisplayMarker.default).toBe("nm");
    expect(def.editableParameters.unit_centerDisplayMeasure_nm.default).toBe("nm");
    expect(def.editableParameters.unit_aisTargetDst).toBeUndefined();
    expect(def.editableParameters.unit_aisTargetCpa).toBeUndefined();
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
