/**
 * Module: EditRouteLayoutGeometry - Shared name/metric measurement box builders for edit-route layout
 * Documentation: documentation/widgets/edit-route.md
 * Depends: LayoutRectMath, EditRouteLayoutMath
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniEditRouteLayoutGeometry = factory(); }
}(this, function () {
  "use strict";

  function create(def, Helpers) {
    const makeRect = Helpers.getModule("LayoutRectMath").create(def, Helpers).makeRect;
    const mathApi = Helpers.getModule("EditRouteLayoutMath").create(def, Helpers);

    function resolveInsetValue(insets, key, fallback) {
      const source = insets && typeof insets === "object" ? insets : null;
      return Math.max(0, Math.floor(mathApi.clampNumber(
        source && Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined,
        0,
        Number.MAX_SAFE_INTEGER,
        fallback
      )));
    }

    function computeNameRects(args) {
      const cfg = args || {};
      const nameBarRect = cfg.nameBarRect || makeRect(0, 0, 1, 1);
      const showSourceBadge = cfg.showSourceBadge === true;
      const sourceBadgeRatio = mathApi.clampNumber(cfg.sourceBadgeRatio, 0, 1, 0.22);
      const sourceBadgeMinPx = Math.max(1, Math.floor(mathApi.clampNumber(cfg.sourceBadgeMinPx, 1, Number.MAX_SAFE_INTEGER, 26)));
      const sourceBadgeMaxRatio = mathApi.clampNumber(cfg.sourceBadgeMaxRatio, 0, 1, 0.4);
      const gap = Math.max(1, resolveInsetValue(cfg.insets, "gap", 1));

      if (!showSourceBadge) {
        return {
          nameTextRect: makeRect(nameBarRect.x, nameBarRect.y, nameBarRect.w, nameBarRect.h),
          sourceBadgeRect: null
        };
      }

      const maxBadgeWidth = Math.max(sourceBadgeMinPx, Math.floor(nameBarRect.w * sourceBadgeMaxRatio));
      const badgeWidth = Math.max(
        sourceBadgeMinPx,
        Math.min(maxBadgeWidth, Math.floor(nameBarRect.w * sourceBadgeRatio))
      );
      const nameTextWidth = Math.max(1, nameBarRect.w - badgeWidth - gap);
      const nameTextRect = makeRect(nameBarRect.x, nameBarRect.y, nameTextWidth, nameBarRect.h);
      const sourceBadgeRect = makeRect(nameTextRect.x + nameTextRect.w + gap, nameBarRect.y, badgeWidth, nameBarRect.h);

      return {
        nameTextRect: nameTextRect,
        sourceBadgeRect: sourceBadgeRect
      };
    }

    function computeInlineValueRects(args) {
      const cfg = args || {};
      const valueRect = cfg.valueRect || makeRect(0, 0, 1, 1);
      const includeUnit = cfg.includeUnit !== false;
      if (!includeUnit) {
        return {
          valueTextRect: makeRect(valueRect.x, valueRect.y, valueRect.w, valueRect.h),
          unitRect: null
        };
      }

      const gap = Math.max(1, resolveInsetValue(cfg.insets, "gap", 1));
      const usableWidth = Math.max(1, valueRect.w - gap);
      const unitShare = mathApi.clampNumber(cfg.unitShare, 0, 1, 0.28);
      const unitMinPx = Math.max(1, Math.floor(mathApi.clampNumber(cfg.unitMinPx, 1, Number.MAX_SAFE_INTEGER, 12)));
      const unitMaxRatio = mathApi.clampNumber(cfg.unitMaxRatio, 0, 1, 0.46);
      const maxUnitWidth = Math.max(unitMinPx, Math.floor(valueRect.w * unitMaxRatio));

      let unitWidth = Math.max(
        unitMinPx,
        Math.min(maxUnitWidth, Math.floor(usableWidth * unitShare))
      );
      if (unitWidth >= usableWidth) {
        unitWidth = Math.max(1, usableWidth - 1);
      }
      const valueTextWidth = Math.max(1, valueRect.w - unitWidth - gap);
      return {
        valueTextRect: makeRect(valueRect.x, valueRect.y, valueTextWidth, valueRect.h),
        unitRect: makeRect(valueRect.x + valueTextWidth + gap, valueRect.y, unitWidth, valueRect.h)
      };
    }

    function computeStackedValueRects(args) {
      const cfg = args || {};
      const valueRect = cfg.valueRect || makeRect(0, 0, 1, 1);
      const includeUnit = cfg.includeUnit !== false;
      if (!includeUnit) {
        return {
          valueTextRect: makeRect(valueRect.x, valueRect.y, valueRect.w, valueRect.h),
          unitRect: null
        };
      }

      const gap = Math.max(1, resolveInsetValue(cfg.insets, "gap", 1));
      const usableHeight = Math.max(1, valueRect.h - gap);
      const unitShare = mathApi.clampNumber(cfg.unitShare, 0, 1, 0.36);
      const unitMinPx = Math.max(1, Math.floor(mathApi.clampNumber(cfg.unitMinPx, 1, Number.MAX_SAFE_INTEGER, 10)));
      const unitMaxRatio = mathApi.clampNumber(cfg.unitMaxRatio, 0, 1, 0.48);
      const maxUnitHeight = Math.max(unitMinPx, Math.floor(valueRect.h * unitMaxRatio));

      let unitHeight = Math.max(
        unitMinPx,
        Math.min(maxUnitHeight, Math.floor(usableHeight * unitShare))
      );
      if (unitHeight >= usableHeight) {
        unitHeight = Math.max(1, usableHeight - 1);
      }
      const valueTextHeight = Math.max(1, valueRect.h - unitHeight - gap);
      return {
        valueTextRect: makeRect(valueRect.x, valueRect.y, valueRect.w, valueTextHeight),
        unitRect: makeRect(valueRect.x, valueRect.y + valueTextHeight + gap, valueRect.w, unitHeight)
      };
    }

    function createMetricTile(args) {
      const cfg = args || {};
      const tileRect = cfg.tileRect || makeRect(0, 0, 1, 1);
      const metricPadX = resolveInsetValue(cfg.insets, "metricPadX", 1);
      const metricTileCaptionRatio = mathApi.clampNumber(cfg.metricTileCaptionRatio, 0, 1, 0.34);
      // Keep the JS split aligned with the CSS fr-based row split.
      const safeTileHeight = Math.max(1, Math.floor(Number(tileRect.h) || 0));
      const labelHeight = safeTileHeight <= 1
        ? 1
        : Math.max(1, Math.min(safeTileHeight - 1, Math.round(safeTileHeight * metricTileCaptionRatio)));
      const valueHeight = Math.max(1, safeTileHeight - labelHeight);
      const labelRect = makeRect(tileRect.x + metricPadX, tileRect.y, Math.max(1, tileRect.w - metricPadX * 2), labelHeight);
      const valueRect = makeRect(
        tileRect.x + metricPadX,
        tileRect.y + labelHeight,
        Math.max(1, tileRect.w - metricPadX * 2),
        valueHeight
      );

      return {
        tileRect: tileRect,
        labelRect: labelRect,
        valueRect: valueRect,
        valueTextRect: valueRect,
        unitRect: null
      };
    }

    function createHighMetricRow(args) {
      const cfg = args || {};
      const rowRect = cfg.rowRect || makeRect(0, 0, 1, 1);
      const gap = Math.max(1, resolveInsetValue(cfg.insets, "gap", 1));
      const labelRatio = mathApi.clampNumber(cfg.labelRatio, cfg.labelMinRatio, cfg.labelMaxRatio, 0.34);
      const usableWidth = Math.max(1, rowRect.w - gap);
      const labelWidth = Math.max(1, Math.floor(usableWidth * labelRatio));
      const valueWidth = Math.max(1, rowRect.w - labelWidth - gap);
      const labelRect = makeRect(rowRect.x, rowRect.y, labelWidth, rowRect.h);
      const valueRect = makeRect(rowRect.x + labelWidth + gap, rowRect.y, valueWidth, rowRect.h);

      const valueParts = computeInlineValueRects({
        valueRect: valueRect,
        insets: cfg.insets,
        includeUnit: cfg.includeUnit !== false,
        unitShare: cfg.unitShare,
        unitMinPx: cfg.unitMinPx,
        unitMaxRatio: cfg.unitMaxRatio
      });

      return {
        tileRect: rowRect,
        labelRect: labelRect,
        valueRect: valueRect,
        valueTextRect: valueParts.valueTextRect,
        unitRect: valueParts.unitRect
      };
    }

    return {
      id: "EditRouteLayoutGeometry",
      computeNameRects: computeNameRects,
      createMetricTile: createMetricTile,
      createHighMetricRow: createHighMetricRow
    };
  }

  return { id: "EditRouteLayoutGeometry", create: create };
}));
