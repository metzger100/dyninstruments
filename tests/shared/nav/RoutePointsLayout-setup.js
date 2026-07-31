const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

/**
 * @typedef {{ h: number, w: number, x: number, y: number }} ContentRect
 * @typedef {{ computeInsets: (width: number, height: number) => unknown, createContentRect: (width: number, height: number, insets: unknown) => ContentRect, constants: { MARKER_DIAMETER_MAX_PX: number, MARKER_DIAMETER_MIN_PX: number, MARKER_DIAMETER_RATIO: number } }} RoutePointsLayout
 */

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

/** @param {RoutePointsLayout} layout @param {number} width @param {number} height */
function buildContentRect(layout, width, height) {
  const insets = layout.computeInsets(width, height);
  return {
    insets: insets,
    contentRect: layout.createContentRect(width, height, insets)
  };
}

/** @param {string} style */
function parseMarkerDiameter(style) {
  const match = new RegExp("^width:(\\d+)px\\x3bheight:(\\d+)px\\x3b$").exec(style || "");
  if (!match) {
    return 0;
  }
  return Number(match[1]) === Number(match[2]) ? Number(match[1]) : 0;
}

/** @param {RoutePointsLayout} layout @param {number} markerHeight */
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
