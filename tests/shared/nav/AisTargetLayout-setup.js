const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

function createLayout() {
  const responsiveScaleProfile = loadFresh("shared/widget-kits/layout/ResponsiveScaleProfile.js");
  const layoutRectMath = loadFresh("shared/widget-kits/layout/LayoutRectMath.js");
  return loadFresh("shared/widget-kits/nav/AisTargetLayout.js").create(
    {},
    createComponentContextMock({
      modules: {
        ResponsiveScaleProfile: responsiveScaleProfile,
        LayoutRectMath: layoutRectMath,
        AisTargetLayoutSizing: loadFresh("shared/widget-kits/nav/AisTargetLayoutSizing.js"),
        AisTargetLayoutGeometry: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometry.js"),
        AisTargetLayoutGeometryStyles: loadFresh("shared/widget-kits/nav/AisTargetLayoutGeometryStyles.js"),
        AisTargetLayoutMath: loadFresh("shared/widget-kits/nav/AisTargetLayoutMath.js")
      }
    })
  );
}

// @ts-ignore -- pre-existing untyped test mock boundary
function expectStackedSubRects(box) {
  expect(box.captionRect).toBeTruthy();
  expect(box.valueRect).toBeTruthy();
  expect(box.unitRect).toBeTruthy();
  expect(box.valueRect.y).toBeGreaterThanOrEqual(box.captionRect.y + box.captionRect.h);
  expect(box.unitRect.y).toBeGreaterThanOrEqual(box.valueRect.y + box.valueRect.h);
}

// @ts-ignore -- pre-existing untyped test mock boundary
function expectInlineSubRects(box) {
  expect(box.labelRect).toBeTruthy();
  expect(box.valueRect).toBeTruthy();
  expect(box.valueTextRect).toBeTruthy();
  expect(box.unitRect).toBeTruthy();
  expect(box.valueRect.x).toBeGreaterThanOrEqual(box.labelRect.x + box.labelRect.w);
  expect(box.unitRect.x).toBeGreaterThanOrEqual(box.valueTextRect.x + box.valueTextRect.w);
}

// @ts-ignore -- pre-existing untyped test mock boundary
function readPxFromStyle(styleText, key) {
  const match = String(styleText || "").match(new RegExp(key + ":(\\d+)px;"));
  return match ? Number(match[1]) : NaN;
}

// @ts-ignore -- pre-existing untyped test mock boundary
function expectedAlarmStripWidth(shellWidth) {
  const preferred = Math.round(shellWidth * 0.072);
  const maxWidth = Math.max(8, Math.floor(shellWidth * 0.19));
  return Math.max(8, Math.min(maxWidth, preferred));
}

module.exports = {
  createComponentContextMock,
  createLayout,
  expectInlineSubRects,
  expectStackedSubRects,
  expectedAlarmStripWidth,
  loadFresh,
  readPxFromStyle
};
