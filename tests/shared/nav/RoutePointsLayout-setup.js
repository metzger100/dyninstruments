const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createLayout() {
  const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const routePointsLayoutSizing = loadFresh("shared/widget-kits/nav/RoutePointsLayoutSizing.js");
  return loadFresh("shared/widget-kits/nav/RoutePointsLayout.js").create(
    {},
    createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: loadFresh("shared/widget-kits/layout/LayoutRectMath.js"),
        RoutePointsLayoutSizing: routePointsLayoutSizing,
        RoutePointsRowGeometry: loadFresh("shared/widget-kits/nav/RoutePointsRowGeometry.js")
      }
    })
  );
}

// @ts-ignore -- pre-existing untyped test mock boundary
function buildContentRect(layout, width, height) {
  const insets = layout.computeInsets(width, height);
  return {
    insets: insets,
    contentRect: layout.createContentRect(width, height, insets)
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function parseMarkerDiameter(style) {
  const match = new RegExp("^width:(\\d+)px\\x3bheight:(\\d+)px\\x3b$").exec(style || "");
  if (!match) {
    return 0;
  }
  return Number(match[1]) === Number(match[2]) ? Number(match[1]) : 0;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function expectedMarkerDiameterFromHeight(layout, markerHeight) {
  const scaled = Math.floor(Math.max(1, markerHeight) * layout.constants.MARKER_DIAMETER_RATIO);
  const preferred = Math.max(
    layout.constants.MARKER_DIAMETER_MIN_PX,
    Math.min(layout.constants.MARKER_DIAMETER_MAX_PX, scaled)
  );
  return Math.max(1, Math.min(Math.max(1, markerHeight), preferred));
}

module.exports = {
  buildContentRect,
  createComponentContextMock,
  createLayout,
  expectedMarkerDiameterFromHeight,
  loadFresh,
  parseMarkerDiameter
};
