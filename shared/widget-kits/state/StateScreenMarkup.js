/**
 * Module: StateScreenMarkup - Shared HTML wrapper/body markup for semantic state-screens
 * Documentation: documentation/shared/state-screens.md
 * Depends: HtmlWidgetUtils, StateScreenLabels, StateScreenTextFit
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenMarkup = factory(); }
}(this, function () {
  "use strict";

  function normalizeClasses(input) {
    if (Array.isArray(input)) {
      return input.filter(Boolean).map((entry) => String(entry));
    }
    if (typeof input === "string" && input.trim()) {
      return input.trim().split(/\s+/);
    }
    return [];
  }

  function dedupeClasses(classList) {
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < classList.length; i += 1) {
      const cls = String(classList[i] || "").trim();
      if (!cls || seen[cls]) {
        continue;
      }
      seen[cls] = true;
      out.push(cls);
    }
    return out;
  }

  function kindToClassSuffix(kind) {
    return String(kind || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();
  }

  function forcePassiveClasses(classList) {
    const out = [];
    for (let i = 0; i < classList.length; i += 1) {
      const cls = classList[i];
      if (/-dispatch$/.test(cls)) {
        out.push(cls.replace(/-dispatch$/, "-passive"));
      } else {
        out.push(cls);
      }
    }
    return dedupeClasses(out);
  }

  function resolveExtraAttrs(extraAttrs, htmlUtils) {
    if (typeof extraAttrs === "string") {
      const text = extraAttrs.trim();
      return text ? (" " + text) : "";
    }
    if (!extraAttrs || typeof extraAttrs !== "object") {
      return "";
    }

    let attrs = "";
    const keys = Object.keys(extraAttrs);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = extraAttrs[key];
      if (!key || value == null || value === false) {
        continue;
      }
      if (value === true) {
        attrs += " " + key;
      } else {
        attrs += " " + key + '="' + htmlUtils.escapeHtml(String(value)) + '"';
      }
    }
    return attrs;
  }

  function create(def, Helpers) {
    const labelsApi = Helpers.getModule("StateScreenLabels");
    const labels = labelsApi.create(def, Helpers);
    const defaultHtmlUtils = Helpers.getModule("HtmlWidgetUtils").create(def, Helpers);
    const stateScreenTextFit = Helpers.getModule("StateScreenTextFit").create(def, Helpers);

    function resolveLabelStyle(cfg, labelText) {
      const explicit = typeof cfg.labelStyle === "string" ? cfg.labelStyle : cfg.fitStyle;
      if (typeof explicit === "string" && explicit.trim()) {
        return explicit;
      }
      return stateScreenTextFit.compute({
        label: labelText,
        shellRect: cfg.shellRect,
        availableRect: cfg.availableRect,
        textApi: cfg.textApi,
        measureCtx: cfg.measureCtx,
        family: cfg.fontFamily,
        weight: cfg.fontWeight,
        hostContext: cfg.hostContext,
        targetEl: cfg.targetEl,
        ownerDocument: cfg.ownerDocument
      });
    }

    function renderStateScreen(args) {
      const cfg = args || {};
      const htmlUtils = cfg.htmlUtils || defaultHtmlUtils;
      const kind = typeof cfg.kind === "string" && cfg.kind ? cfg.kind : labels.KINDS.DATA;
      const stateClass = "dyni-state-" + kindToClassSuffix(kind);
      const baseClasses = normalizeClasses(cfg.wrapperClasses);
      const wrapperClasses = forcePassiveClasses(dedupeClasses(baseClasses.concat([stateClass])));
      const labelText = typeof cfg.label === "string"
        ? cfg.label
        : (labels.LABELS[kind] || "");
      const labelStyle = resolveLabelStyle(cfg, labelText);
      const attrs = resolveExtraAttrs(cfg.extraAttrs, htmlUtils);

      if (kind === labels.KINDS.HIDDEN) {
        return '<div class="' + wrapperClasses.join(" ") + '"' + attrs + "></div>";
      }

      return ''
        + '<div class="' + wrapperClasses.join(" ") + '"' + attrs + ">"
        + '<div class="dyni-state-screen-body">'
        + '<span class="dyni-state-screen-label"' + htmlUtils.toStyleAttr(labelStyle) + ">"
        + htmlUtils.escapeHtml(labelText)
        + "</span>"
        + "</div>"
        + "</div>";
    }

    return {
      id: "StateScreenMarkup",
      renderStateScreen: renderStateScreen
    };
  }

  return {
    id: "StateScreenMarkup",
    create: create
  };
}));
