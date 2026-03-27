/**
 * Module: HtmlWidgetUtils - Shared helper utilities for HTML widget renderers and fit modules
 * Documentation: documentation/architecture/component-system.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniHtmlWidgetUtils = factory(); }
}(this, function () {
  "use strict";

  function toFiniteNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  function trimText(value) {
    return value == null ? "" : String(value).trim();
  }

  function escapeHtml(value) {
    return String(value)
      .split("&").join("&amp;")
      .split("<").join("&lt;")
      .split(">").join("&gt;")
      .split("\"").join("&quot;")
      .split("'").join("&#39;");
  }

  function toStyleAttr(style) {
    const text = trimText(style);
    return text ? (' style="' + text + '"') : "";
  }

  function resolveHostCommitTarget(hostContext) {
    const commit = hostContext && hostContext.__dyniHostCommitState;
    return commit && (commit.shellEl || commit.rootEl);
  }

  function resolveShellRect(hostContext, targetEl) {
    const target = targetEl || resolveHostCommitTarget(hostContext);
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

  function resolveRatioMode(options) {
    const opts = options || {};
    const normalThresholdRaw = toFiniteNumber(opts.ratioThresholdNormal);
    const flatThresholdRaw = toFiniteNumber(opts.ratioThresholdFlat);
    const defaultNormalRaw = toFiniteNumber(opts.defaultRatioThresholdNormal);
    const defaultFlatRaw = toFiniteNumber(opts.defaultRatioThresholdFlat);
    const normalThreshold = typeof normalThresholdRaw === "number"
      ? normalThresholdRaw
      : (typeof defaultNormalRaw === "number" ? defaultNormalRaw : 1);
    const flatThreshold = typeof flatThresholdRaw === "number"
      ? flatThresholdRaw
      : (typeof defaultFlatRaw === "number" ? defaultFlatRaw : 3);
    const defaultMode = trimText(opts.defaultMode) || "normal";
    const rect = resolveShellRect(opts.hostContext, opts.targetEl);

    if (!rect) {
      return defaultMode;
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

  function isEditingMode(props) {
    const p = props && typeof props === "object" ? props : {};
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  function create() {
    return {
      id: "HtmlWidgetUtils",
      toFiniteNumber: toFiniteNumber,
      trimText: trimText,
      escapeHtml: escapeHtml,
      toStyleAttr: toStyleAttr,
      resolveShellRect: resolveShellRect,
      resolveRatioMode: resolveRatioMode,
      isEditingMode: isEditingMode
    };
  }

  return { id: "HtmlWidgetUtils", create: create };
}));
