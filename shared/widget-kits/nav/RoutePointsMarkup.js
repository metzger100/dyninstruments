/**
 * Module: RoutePointsMarkup - Pure HTML assembly owner for route-points renderer output
 * Documentation: documentation/architecture/cluster-widget-system.md
 * Depends: StateScreenMarkup
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniRoutePointsMarkup = factory(); }
}(this, function () {
  "use strict";

  function toObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function toText(value) {
    return value == null ? "" : String(value);
  }

  function renderHeader(model, geometry, fit, htmlUtils) {
    if (model.showHeader !== true || model.hasRoute !== true) {
      return "";
    }
    if (!geometry.header) {
      return "";
    }

    const headerFit = toObject(fit.headerFit);

    return ""
      + '<div class="dyni-route-points-header"' + htmlUtils.toStyleAttr(geometry.header.style) + ">"
      + '<div class="dyni-route-points-header-route"' + htmlUtils.toStyleAttr(geometry.header.routeNameStyle) + ">"
      + '<span class="dyni-route-points-text dyni-route-points-header-route-text"'
      + htmlUtils.toStyleAttr(headerFit.routeNameStyle)
      + ">"
      + htmlUtils.escapeHtml(model.routeNameText)
      + "</span>"
      + "</div>"
      + '<div class="dyni-route-points-header-meta"' + htmlUtils.toStyleAttr(geometry.header.metaStyle) + ">"
      + '<span class="dyni-route-points-text dyni-route-points-header-meta-text"'
      + htmlUtils.toStyleAttr(headerFit.metaStyle)
      + ">"
      + htmlUtils.escapeHtml(model.metaText)
      + "</span>"
      + "</div>"
      + "</div>";
  }

  function renderRows(model, geometry, fit, htmlUtils, coordinatesTabular) {
    const rows = model.points;
    const rowGeometry = geometry.rows;
    const rowFits = fit.rowFits;
    const showOrdinal = model.showOrdinal !== false;
    let html = "";

    for (let i = 0; i < rows.length; i += 1) {
      const row = toObject(rows[i]);
      const geom = toObject(rowGeometry[i]);
      const rowFit = toObject(rowFits[i]);
      const rowClasses = ["dyni-route-points-row"];
      const markerClasses = ["dyni-route-points-marker"];

      if (row.selected === true) {
        rowClasses.push("dyni-route-points-row-selected");
        markerClasses.push("dyni-route-points-marker-selected");
      }

      const activateAttrs = ' data-rp-idx="' + String(row.index) + '"';
      const infoText = rowFit.infoText != null ? rowFit.infoText : row.infoText;

      const ordinalHtml = showOrdinal
        ? (
          '<div class="dyni-route-points-ordinal"' + htmlUtils.toStyleAttr(geom.ordinalStyle) + ">"
          + '<span class="dyni-route-points-text dyni-route-points-ordinal-text"'
          + htmlUtils.toStyleAttr(rowFit.ordinalStyle)
          + ">"
          + htmlUtils.escapeHtml(row.ordinalText)
          + "</span>"
          + "</div>"
        )
        : "";

      const infoTextClasses = ["dyni-route-points-text", "dyni-route-points-info-text"];
      if (model.showLatLon === true && coordinatesTabular !== false) {
        infoTextClasses.push("dyni-tabular");
      }
      if (model.stableDigitsEnabled === true && model.showLatLon !== true) {
        infoTextClasses.push("dyni-tabular");
      }

      html += ""
        + '<div class="' + rowClasses.join(" ") + '"'
        + ' data-rp-row="' + String(row.index) + '"'
        + activateAttrs
        + htmlUtils.toStyleAttr(geom.rowStyle)
        + ">"
        + ordinalHtml
        + '<div class="dyni-route-points-middle"' + htmlUtils.toStyleAttr(geom.middleStyle) + ">"
        + '<div class="dyni-route-points-name"' + htmlUtils.toStyleAttr(geom.nameStyle) + ">"
        + '<span class="dyni-route-points-text dyni-route-points-name-text"'
        + htmlUtils.toStyleAttr(rowFit.nameStyle)
        + ">"
        + htmlUtils.escapeHtml(row.nameText)
        + "</span>"
        + "</div>"
        + '<div class="dyni-route-points-info"' + htmlUtils.toStyleAttr(geom.infoStyle) + ">"
        + '<span class="' + infoTextClasses.join(" ") + '"'
        + htmlUtils.toStyleAttr(rowFit.infoStyle)
        + ">"
        + htmlUtils.escapeHtml(infoText)
        + "</span>"
        + "</div>"
        + "</div>"
        + '<div class="dyni-route-points-marker-cell"' + htmlUtils.toStyleAttr(geom.markerStyle) + ">"
        + '<span class="' + markerClasses.join(" ") + '"'
        + htmlUtils.toStyleAttr(geom.markerDotStyle)
        + "></span>"
        + "</div>"
        + "</div>";
    }

    return html;
  }

  function create(def, Helpers) {
    const stateScreenMarkup = Helpers.getModule("StateScreenMarkup").create(def, Helpers);

    function render(args) {
      const cfg = args || {};
      const model = toObject(cfg.model);
      const fit = toObject(cfg.fit);
      const htmlUtils = cfg.htmlUtils;
      const coordinatesTabular = cfg.coordinatesTabular !== false;
      const geometry = toObject(model.inlineGeometry);
      const interactionState = model.interactionState === "dispatch" ? "dispatch" : "passive";
      const wrapperClasses = [
        "dyni-route-points-html",
        "dyni-route-points-mode-" + (model.mode || "normal"),
        interactionState === "dispatch" ? "dyni-route-points-dispatch" : "dyni-route-points-passive"
      ];

      if (model.isActiveRoute === true) {
        wrapperClasses.push("dyni-route-points-active-route");
      }
      if (model.kind && model.kind !== "data") {
        return stateScreenMarkup.renderStateScreen({
          kind: model.kind,
          label: toText(model.stateLabel),
          wrapperClasses: wrapperClasses,
          extraAttrs: 'data-dyni-action="route-points-activate"' + htmlUtils.toStyleAttr(geometry.wrapper && geometry.wrapper.style),
          htmlUtils: htmlUtils,
          shellRect: cfg.shellRect,
          fontFamily: cfg.fontFamily,
          fontWeight: cfg.fontWeight
        });
      }

      const rowsHtml = renderRows(model, geometry, fit, htmlUtils, coordinatesTabular);

      return ""
        + '<div class="' + wrapperClasses.join(" ") + '"'
        + ' data-dyni-action="route-points-activate"'
        + htmlUtils.toStyleAttr(geometry.wrapper && geometry.wrapper.style)
        + ">"
        + renderHeader(model, geometry, fit, htmlUtils)
        + '<div class="dyni-route-points-list"'
        + htmlUtils.toStyleAttr(geometry.list && geometry.list.style)
        + ">"
        + '<div class="dyni-route-points-list-content"'
        + htmlUtils.toStyleAttr(geometry.list && geometry.list.contentStyle)
        + ">"
        + rowsHtml
        + "</div>"
        + "</div>"
        + "</div>";
    }

    return {
      id: "RoutePointsMarkup",
      render: render
    };
  }

  return { id: "RoutePointsMarkup", create: create };
}));
