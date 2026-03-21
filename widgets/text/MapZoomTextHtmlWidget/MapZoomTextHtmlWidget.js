/**
 * Module: MapZoomTextHtmlWidget - Interactive HTML renderer for map zoom kind
 * Documentation: documentation/widgets/map-zoom.md
 * Depends: Helpers.applyFormatter, MapZoomHtmlFit, hostActions.map.checkAutoZoom
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniMapZoomTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  const CHECK_AUTO_ZOOM_HANDLER_NAME = "mapZoomCheckAutoZoom";
  const DEFAULT_RATIO_THRESHOLD_NORMAL = 1.0;
  const DEFAULT_RATIO_THRESHOLD_FLAT = 3.0;
  const DEFAULT_CAPTION_UNIT_SCALE = 0.8;
  const MIN_CAPTION_UNIT_SCALE = 0.5;
  const MAX_CAPTION_UNIT_SCALE = 1.5;

  const toFiniteNumber = function (value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  const trimText = function (value) {
    return value == null ? "" : String(value).trim();
  };

  const escapeHtml = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const toStyleAttr = function (style) {
    const text = trimText(style);
    return text ? (' style="' + text + '"') : "";
  };

  function formatZoom(value, defaultText, Helpers) {
    const out = String(Helpers.applyFormatter(value, {
      formatter: "formatDecimalOpt",
      formatterParameters: [2, 1],
      default: defaultText
    }));
    return out.trim() ? out : defaultText;
  }

  function clampCaptionUnitScale(value) {
    const scale = toFiniteNumber(value);
    if (typeof scale !== "number") {
      return DEFAULT_CAPTION_UNIT_SCALE;
    }
    return Math.max(MIN_CAPTION_UNIT_SCALE, Math.min(MAX_CAPTION_UNIT_SCALE, scale));
  }

  function resolveShellRect(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    const target = commit && (commit.shellEl || commit.rootEl);
    if (!target || typeof target.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = target.getBoundingClientRect();
    const width = toFiniteNumber(rect && rect.width);
    const height = toFiniteNumber(rect && rect.height);
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return { width: width, height: height };
  }

  function resolveMode(props, hostContext) {
    const p = props || {};
    const normal = toFiniteNumber(p.ratioThresholdNormal);
    const flat = toFiniteNumber(p.ratioThresholdFlat);
    const normalThreshold = typeof normal === "number" ? normal : DEFAULT_RATIO_THRESHOLD_NORMAL;
    const flatThreshold = typeof flat === "number" ? flat : DEFAULT_RATIO_THRESHOLD_FLAT;
    const rect = resolveShellRect(hostContext);
    if (!rect) {
      return "normal";
    }
    const ratio = rect.width / rect.height;
    if (ratio < normalThreshold) {
      return "high";
    }
    if (ratio > flatThreshold) {
      return "flat";
    }
    return "normal";
  }

  function resolveDisplayMode(baseMode, caption, unit) {
    if (!caption) {
      return "flat";
    }
    if (baseMode === "high" && !unit) {
      return "normal";
    }
    return baseMode;
  }

  function canDispatchCheckAutoZoom(hostContext) {
    const actions = hostContext && hostContext.hostActions;
    if (!actions || typeof actions.getCapabilities !== "function") {
      return false;
    }
    if (!actions.map || typeof actions.map.checkAutoZoom !== "function") {
      return false;
    }
    const capabilities = actions.getCapabilities();
    return !!(
      capabilities &&
      capabilities.map &&
      capabilities.map.checkAutoZoom === "dispatch"
    );
  }

  function isEditingMode(props) {
    const p = props || {};
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  function dispatchCheckAutoZoom(hostContext, props) {
    const p = props || {};
    if (isEditingMode(p)) {
      return false;
    }
    if (!canDispatchCheckAutoZoom(hostContext)) {
      return false;
    }
    return hostContext.hostActions.map.checkAutoZoom() !== false;
  }

  function ensureProps(props) {
    const p = props || {};
    if (!Object.prototype.hasOwnProperty.call(p, "default")) {
      throw new Error("MapZoomTextHtmlWidget: props.default is required");
    }
    return p;
  }

  function renderMainRows(model) {
    if (model.mode === "flat") {
      return ""
        + '<div class="dyni-map-zoom-main dyni-map-zoom-main-flat">'
        + '<div class="dyni-map-zoom-inline-row">'
        + '<span class="dyni-map-zoom-caption"' + toStyleAttr(model.captionStyle) + ">" + escapeHtml(model.caption) + "</span>"
        + '<span class="dyni-map-zoom-value"' + toStyleAttr(model.valueStyle) + ">" + escapeHtml(model.zoomText) + "</span>"
        + '<span class="dyni-map-zoom-unit"' + toStyleAttr(model.unitStyle) + ">" + escapeHtml(model.unit) + "</span>"
        + "</div>"
        + "</div>";
    }
    if (model.mode === "high") {
      return ""
        + '<div class="dyni-map-zoom-main dyni-map-zoom-main-high">'
        + '<div class="dyni-map-zoom-caption-row">'
        + '<span class="dyni-map-zoom-caption"' + toStyleAttr(model.captionStyle) + ">" + escapeHtml(model.caption) + "</span>"
        + "</div>"
        + '<div class="dyni-map-zoom-value-row">'
        + '<span class="dyni-map-zoom-value"' + toStyleAttr(model.valueStyle) + ">" + escapeHtml(model.zoomText) + "</span>"
        + "</div>"
        + '<div class="dyni-map-zoom-unit-row">'
        + '<span class="dyni-map-zoom-unit"' + toStyleAttr(model.unitStyle) + ">" + escapeHtml(model.unit) + "</span>"
        + "</div>"
        + "</div>";
    }
    return ""
      + '<div class="dyni-map-zoom-main dyni-map-zoom-main-normal">'
      + '<div class="dyni-map-zoom-value-row">'
      + '<span class="dyni-map-zoom-value"' + toStyleAttr(model.valueStyle) + ">" + escapeHtml(model.zoomText) + "</span>"
      + '<span class="dyni-map-zoom-unit"' + toStyleAttr(model.unitStyle) + ">" + escapeHtml(model.unit) + "</span>"
      + "</div>"
      + '<div class="dyni-map-zoom-caption-row">'
      + '<span class="dyni-map-zoom-caption"' + toStyleAttr(model.captionStyle) + ">" + escapeHtml(model.caption) + "</span>"
      + "</div>"
      + "</div>";
  }

  function create(def, Helpers) {
    const htmlFit = Helpers.getModule("MapZoomHtmlFit").create(def, Helpers);

    function buildModel(props, hostContext) {
      const p = ensureProps(props);
      const defaultText = String(p.default);
      const caption = trimText(p.caption);
      const unit = trimText(p.unit);
      const ratioMode = resolveMode(p, hostContext);
      const mode = resolveDisplayMode(ratioMode, caption, unit);
      const zoomNumber = toFiniteNumber(p.zoom);
      const requiredZoomNumber = toFiniteNumber(p.requiredZoom);
      const zoomText = formatZoom(zoomNumber, defaultText, Helpers);
      const requiredText = formatZoom(requiredZoomNumber, defaultText, Helpers);
      const showRequired = typeof requiredZoomNumber === "number" && requiredZoomNumber !== zoomNumber;
      const isEditing = isEditingMode(p);
      const canDispatch = !isEditing && canDispatchCheckAutoZoom(hostContext);
      const captionUnitScale = clampCaptionUnitScale(p.captionUnitScale);

      const modelBase = {
        mode: mode,
        caption: caption,
        unit: unit,
        zoomText: zoomText,
        requiredText: showRequired ? "(" + requiredText + ")" : "",
        showRequired: showRequired,
        canDispatch: canDispatch,
        captionUnitScale: captionUnitScale
      };
      const fitStyles = htmlFit.compute({
        model: modelBase,
        hostContext: hostContext,
        shellRect: resolveShellRect(hostContext)
      });

      return {
        mode: modelBase.mode,
        caption: modelBase.caption,
        unit: modelBase.unit,
        zoomText: modelBase.zoomText,
        requiredText: modelBase.requiredText,
        showRequired: modelBase.showRequired,
        canDispatch: modelBase.canDispatch,
        captionUnitScale: modelBase.captionUnitScale,
        captionStyle: fitStyles.captionStyle,
        valueStyle: fitStyles.valueStyle,
        unitStyle: fitStyles.unitStyle,
        requiredStyle: fitStyles.requiredStyle
      };
    }

    const namedHandlers = function (props, hostContext) {
      return {
        mapZoomCheckAutoZoom: function mapZoomCheckAutoZoomHandler() {
          return dispatchCheckAutoZoom(hostContext, props);
        }
      };
    };

    const renderHtml = function (props) {
      const model = buildModel(props, this);
      const classes = [
        "dyni-map-zoom-html",
        "dyni-map-zoom-mode-" + model.mode,
        model.canDispatch ? "dyni-map-zoom-open-dispatch" : "dyni-map-zoom-open-passive"
      ];
      if (model.showRequired) {
        classes.push("dyni-map-zoom-has-required");
      }

      const wrapperOnClickAttr = model.canDispatch ? ' onclick="catchAll"' : "";
      const hotspotHtml = model.canDispatch
        ? ('<div class="dyni-map-zoom-open-hotspot" onclick="' + CHECK_AUTO_ZOOM_HANDLER_NAME + '"></div>')
        : "";
      const requiredHtml = model.showRequired
        ? ('<div class="dyni-map-zoom-required"' + toStyleAttr(model.requiredStyle) + ">" + escapeHtml(model.requiredText) + "</div>")
        : "";
      const scaleStyle = ' style="--dyni-map-zoom-sec-scale:' + model.captionUnitScale + ';"';

      return ""
        + '<div class="' + classes.join(" ") + '"' + scaleStyle + wrapperOnClickAttr + ">"
        + hotspotHtml
        + renderMainRows(model)
        + requiredHtml
        + "</div>";
    };

    const resizeSignature = function (props) {
      const model = buildModel(props, this);
      const rect = resolveShellRect(this);
      return [
        model.caption.length,
        model.zoomText.length,
        model.unit.length,
        model.requiredText.length,
        model.mode,
        model.captionUnitScale,
        model.showRequired ? 1 : 0,
        model.canDispatch ? 1 : 0,
        rect ? Math.round(rect.width) : 0,
        rect ? Math.round(rect.height) : 0
      ].join("|");
    };

    const initFunction = function () {
      if (this && typeof this.triggerResize === "function") {
        this.triggerResize();
      }
    };

    const translateFunction = function () {
      return {};
    };

    return {
      id: "MapZoomTextHtmlWidget",
      wantsHideNativeHead: true,
      renderHtml: renderHtml,
      namedHandlers: namedHandlers,
      resizeSignature: resizeSignature,
      initFunction: initFunction,
      translateFunction: translateFunction
    };
  }

  return { id: "MapZoomTextHtmlWidget", create: create };
}));
