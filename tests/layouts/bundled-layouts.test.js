const fs = require("node:fs");
const path = require("node:path");

const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

const BUNDLED_LAYOUT_FILES = [
  "layouts/dyni-motorboat.json",
  "layouts/dyni-sailboat.json"
];

const REQUIRED_NAVPAGE_PANELS = [
  "left",
  "bottomLeft",
  "bottomRight",
  "left_small",
  "top_small",
  "bottomLeft_small",
  "bottomRight_small",
  "left_anchor",
  "bottomLeft_anchor",
  "bottomRight_anchor",
  "left_small_anchor",
  "top_small_anchor",
  "bottomLeft_small_anchor",
  "bottomRight_small_anchor"
];

const VALID_DYNI_WIDGET_NAMES = [
  "dyni_CourseHeading_Instruments",
  "dyni_Speed_Instruments",
  "dyni_Environment_Instruments",
  "dyni_Wind_Instruments",
  "dyni_Nav_Instruments",
  "dyni_Map_Instruments",
  "dyni_Vessel_Instruments",
  "dyni_Default_Instruments",
  "dyni_Anchor_Instruments"
];

const CLUSTER_WIDGET_BY_CLUSTER = {
  courseHeading: "dyni_CourseHeading_Instruments",
  speed: "dyni_Speed_Instruments",
  environment: "dyni_Environment_Instruments",
  wind: "dyni_Wind_Instruments",
  nav: "dyni_Nav_Instruments",
  map: "dyni_Map_Instruments",
  vessel: "dyni_Vessel_Instruments",
  default: "dyni_Default_Instruments",
  anchor: "dyni_Anchor_Instruments"
};

const CLUSTER_ROUTE_SCRIPTS = [
  "config/cluster-routes.js",
  "config/cluster-routes/course-heading.js",
  "config/cluster-routes/speed.js",
  "config/cluster-routes/environment.js",
  "config/cluster-routes/wind.js",
  "config/cluster-routes/nav.js",
  "config/cluster-routes/map.js",
  "config/cluster-routes/anchor.js",
  "config/cluster-routes/vessel.js",
  "config/cluster-routes/default.js",
  "config/cluster-routes/finalize.js"
];

function loadBundledLayout(relPath) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relPath), "utf8"));
}

function collectWidgetsFromLayout(layout) {
  const widgets = [];
  const pages = layout && layout.widgets ? layout.widgets : {};
  Object.keys(pages).forEach(function (pageName) {
    const page = pages[pageName];
    if (!page || typeof page !== "object") return;
    Object.keys(page).forEach(function (panelName) {
      const panelWidgets = page[panelName];
      if (!Array.isArray(panelWidgets)) return;
      panelWidgets.forEach(function (entry) {
        collectWidgetEntry(entry, widgets);
      });
    });
  });
  return widgets;
}

function collectWidgetEntry(entry, out) {
  if (!entry || typeof entry !== "object") return;
  if (Object.prototype.hasOwnProperty.call(entry, "name") || Object.prototype.hasOwnProperty.call(entry, "kind")) {
    out.push(entry);
  }
  if (Array.isArray(entry.children)) {
    entry.children.forEach(function (child) {
      collectWidgetEntry(child, out);
    });
  }
}

function loadRouteCatalog() {
  const context = createScriptContext({
    DyniPlugin: {
      config: {}
    }
  });
  runIifeScript("runtime/namespace.js", context);
  CLUSTER_ROUTE_SCRIPTS.forEach(function (scriptPath) {
    runIifeScript(scriptPath, context);
  });
  return context.DyniPlugin.config.clusterRoutes.routes;
}

describe("bundled layouts", function () {
  const kindToCluster = Object.create(null);

  beforeAll(function () {
    const routes = loadRouteCatalog();
    routes.forEach(function (route) {
      kindToCluster[route.kind] = route.cluster;
    });
  });

  it("parses all bundled layout JSON files and keeps layoutVersion at 1", function () {
    BUNDLED_LAYOUT_FILES.forEach(function (relPath) {
      const layout = loadBundledLayout(relPath);
      expect(layout.layoutVersion).toBe(1);
    });
  });

  it("uses only known dyninstruments widget names and valid kinds from cluster-routes", function () {
    BUNDLED_LAYOUT_FILES.forEach(function (relPath) {
      const layout = loadBundledLayout(relPath);
      const widgets = collectWidgetsFromLayout(layout);

      widgets.forEach(function (widget) {
        if (typeof widget.name === "string" && widget.name.startsWith("dyni_")) {
          expect(VALID_DYNI_WIDGET_NAMES).toContain(widget.name);
        }
        if (typeof widget.kind === "string" && widget.kind.trim() !== "") {
          expect(kindToCluster[widget.kind]).toBeTruthy();
        }
      });
    });
  });

  it("keeps kind-to-cluster ownership consistent for every kind-bearing dyni widget", function () {
    BUNDLED_LAYOUT_FILES.forEach(function (relPath) {
      const layout = loadBundledLayout(relPath);
      const widgets = collectWidgetsFromLayout(layout);

      widgets.forEach(function (widget) {
        if (typeof widget.kind !== "string" || widget.kind.trim() === "") return;
        if (typeof widget.name !== "string" || !widget.name.startsWith("dyni_")) return;

        const ownerCluster = kindToCluster[widget.kind];
        const expectedWidgetName = CLUSTER_WIDGET_BY_CLUSTER[ownerCluster];
        expect(expectedWidgetName).toBeTruthy();
        expect(widget.name).toBe(expectedWidgetName);
      });
    });
  });

  it("defines all required navpage panels for normal/small/anchor/anchor+small modes", function () {
    BUNDLED_LAYOUT_FILES.forEach(function (relPath) {
      const layout = loadBundledLayout(relPath);
      const navpage = layout.widgets && layout.widgets.navpage;

      expect(navpage && typeof navpage).toBe("object");
      REQUIRED_NAVPAGE_PANELS.forEach(function (panelName) {
        expect(Array.isArray(navpage[panelName])).toBe(true);
      });
      expect(Object.prototype.hasOwnProperty.call(navpage, "top")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(navpage, "top_anchor")).toBe(false);
    });
  });

  it("defines gpspage1 and gpspage2 left_anchor panels with the expected anchor widgets", function () {
    const requiredAnchorKinds = ["anchorBearing", "anchorDistance", "anchorWatch"];

    BUNDLED_LAYOUT_FILES.forEach(function (relPath) {
      const layout = loadBundledLayout(relPath);

      ["gpspage1", "gpspage2"].forEach(function (pageName) {
        const page = layout.widgets && layout.widgets[pageName];
        const leftAnchorPanel = page && page.left_anchor;
        expect(Array.isArray(leftAnchorPanel)).toBe(true);

        requiredAnchorKinds.forEach(function (kind) {
          const match = leftAnchorPanel.find(function (entry) {
            return entry && entry.name === "dyni_Anchor_Instruments" && entry.kind === kind;
          });
          expect(match).toBeTruthy();
        });
      });
    });
  });

  it("registers bundled layouts via plugin.json and references existing files", function () {
    const pluginJsonPath = path.join(process.cwd(), "plugin.json");
    const pluginConfig = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));

    expect(pluginConfig.layouts).toEqual([
      { name: "Dyni Motorboat", file: "layouts/dyni-motorboat.json" },
      { name: "Dyni Sailboat", file: "layouts/dyni-sailboat.json" }
    ]);

    pluginConfig.layouts.forEach(function (layoutDef) {
      const filePath = path.join(process.cwd(), layoutDef.file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
