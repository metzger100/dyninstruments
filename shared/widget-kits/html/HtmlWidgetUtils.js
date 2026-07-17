/**
 * @file HtmlWidgetUtils - Shared helper utilities for HTML widget renderers and fit modules
 * Documentation: documentation/architecture/component-system.md
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniHtmlWidgetUtils = factory();
  }
})(this, function () {
  "use strict";

  /** @type {DyniValueMathApi["toFiniteNumber"]} */
  let toFiniteNumber;
  /** @type {DyniValueMathApi["toOptionalFiniteNumber"]} */
  let toOptionalFiniteNumber;
  /** @type {DyniValueMathApi["toText"]} */
  let toText;
  /** @type {DyniValueMathApi["trimText"]} */
  let trimText;
  /** @type {DyniValueMathApi["clampNumber"]} */
  let clampNumber;
  let patchInnerHtml;

  /** @param {unknown} value @returns {string} */
  function escapeHtml(value) {
    return String(value)
      .split("&")
      .join("&amp;")
      .split("<")
      .join("&lt;")
      .split(">")
      .join("&gt;")
      .split('"')
      .join("&quot;")
      .split("'")
      .join("&#39;");
  }

  /** @param {unknown} style @returns {string} */
  function toStyleAttr(style) {
    const text = trimText(style);
    return text ? ' style="' + text + '"' : "";
  }

  /** @param {unknown} hostContext @returns {HTMLElement | null | undefined} */
  function resolveHostCommitTarget(hostContext) {
    const host = /** @type {{ __dyniHostCommitState?: DyniHostCommitState } | null | undefined} */ (hostContext);
    const commit = host && host.__dyniHostCommitState;
    return /** @type {HTMLElement | null | undefined} */ (
      /** @type {unknown} */ (commit && (commit.shellEl || commit.rootEl))
    );
  }

  /** @param {unknown} hostContext @param {unknown} [targetEl] @returns {DyniHtmlShellRect | null} */
  function resolveShellRect(hostContext, targetEl) {
    const target = /** @type {HTMLElement | null | undefined} */ (targetEl || resolveHostCommitTarget(hostContext));
    if (!target || typeof target.getBoundingClientRect !== "function") {
      return null;
    }
    const rect = target.getBoundingClientRect();
    const width = /** @type {number} */ (toFiniteNumber(rect && rect.width));
    const height = /** @type {number} */ (toFiniteNumber(rect && rect.height));
    if (!(width > 0) || !(height > 0)) {
      return null;
    }
    return { width: width, height: height };
  }

  /** @param {unknown} [options] @returns {string} */
  function resolveRatioMode(options) {
    const opts = /** @type {Record<string, unknown>} */ (options || {});
    const rect = resolveShellRect(opts.hostContext, opts.targetEl);
    return resolveRatioModeForRect({
      ratioThresholdNormal: opts.ratioThresholdNormal,
      ratioThresholdFlat: opts.ratioThresholdFlat,
      defaultRatioThresholdNormal: opts.defaultRatioThresholdNormal,
      defaultRatioThresholdFlat: opts.defaultRatioThresholdFlat,
      defaultMode: opts.defaultMode,
      shellRect: rect
    });
  }

  /** @param {unknown} [options] @returns {string} */
  function resolveRatioModeForRect(options) {
    const opts = /** @type {Record<string, unknown>} */ (options || {});
    const normalThresholdRaw = toOptionalFiniteNumber(opts.ratioThresholdNormal);
    const flatThresholdRaw = toOptionalFiniteNumber(opts.ratioThresholdFlat);
    const defaultNormalRaw = toOptionalFiniteNumber(opts.defaultRatioThresholdNormal);
    const defaultFlatRaw = toOptionalFiniteNumber(opts.defaultRatioThresholdFlat);
    const normalThreshold =
      typeof normalThresholdRaw === "number"
        ? normalThresholdRaw
        : typeof defaultNormalRaw === "number"
          ? defaultNormalRaw
          : 1;
    let flatThreshold = 3;
    if (typeof flatThresholdRaw === "number") {
      flatThreshold = flatThresholdRaw;
    } else if (typeof defaultFlatRaw === "number") {
      flatThreshold = defaultFlatRaw;
    }
    const defaultMode = trimText(opts.defaultMode) || "normal";
    const rect = /** @type {DyniHtmlShellRect | null | undefined} */ (opts.shellRect);

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

  /** @param {unknown} value @returns {string} */
  function toClassToken(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-{2,}/g, "-");
  }

  /** @param {unknown} props @returns {Record<string, unknown> | null} */
  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? /** @type {Record<string, unknown>} */ (props) : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object"
      ? /** @type {Record<string, unknown>} */ (p.surfacePolicy)
      : null;
  }

  /** @param {string} colorKey @param {unknown} value @returns {string} */
  function toStyleText(colorKey, value) {
    const color = toText(value).trim();
    return color ? colorKey + ":" + color + ";" : "";
  }

  // dyni-lint-disable-next-line duplicate-functions -- PLAN27 Phase 2 adds canonical helper exports before Phase 3 call-site migration removes file-local copies.
  /** @param {unknown} model @param {unknown} tokens @param {unknown} baseFamily @returns {unknown} */
  function resolveMetricValueFamily(model, tokens, baseFamily) {
    const tokensObj = /** @type {{ font?: unknown } | null | undefined} */ (tokens);
    const font = /** @type {{ familyMono?: unknown, family?: unknown }} */ (
      tokensObj && tokensObj.font ? tokensObj.font : {}
    );
    const modelObj = /** @type {{ stableDigitsEnabled?: unknown } | null | undefined} */ (model);
    if (modelObj && modelObj.stableDigitsEnabled === true) {
      return font.familyMono || baseFamily || font.family || "";
    }
    return baseFamily || font.family || "";
  }

  /** @param {unknown} cfg @returns {"sliding" | "inset"} */
  function resolveLabelEdgePolicy(cfg) {
    const c = /** @type {{ labelEdgePolicy?: unknown } | null | undefined} */ (cfg);
    return c && c.labelEdgePolicy === "sliding" ? "sliding" : "inset";
  }

  // dyni-lint-disable-next-line duplicate-functions -- PLAN27 Phase 2 adds canonical helper exports before Phase 3 call-site migration removes file-local copies.
  /** @returns {string} */
  function joinStyles() {
    let text = "";
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (typeof value !== "string") {
        continue;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      text += trimmed;
    }
    return text;
  }

  /** @param {unknown} state @returns {DyniHtmlTextOptions} */
  function buildTextOptions(state) {
    const stateObj = /** @type {{ theme?: { opacity?: unknown } } | null | undefined} */ (state);
    const opacity = /** @type {{ caption?: unknown, unit?: unknown }} */ (
      stateObj && stateObj.theme && stateObj.theme.opacity && typeof stateObj.theme.opacity === "object"
        ? stateObj.theme.opacity
        : {}
    );
    return { captionOpacity: opacity.caption, unitOpacity: opacity.unit };
  }

  /** @param {unknown} px @returns {string} */
  function toFontStyle(px) {
    const n = /** @type {number} */ (toFiniteNumber(px));
    if (!(n > 0)) {
      return "";
    }
    return "font-size:" + Math.max(1, Math.floor(n)) + "px;";
  }

  /** @param {unknown} value @returns {string} */
  function toPx(value) {
    const px = Math.max(0, Math.floor(clampNumber(value, 0, Number.MAX_SAFE_INTEGER, 0)));
    return String(px) + "px";
  }

  /** @param {unknown} props @returns {string | undefined} */
  function resolveDefaultText(props) {
    if (Object.prototype.hasOwnProperty.call(props, "default")) {
      return String(/** @type {Record<string, unknown>} */ (props).default);
    }
    return undefined;
  }

  /** @param {unknown} rootEl @param {unknown} props @returns {void} */
  function applyMirroredContext(rootEl, props) {
    const el = /** @type {HTMLElement | null | undefined} */ (rootEl);
    if (!el || typeof el.setAttribute !== "function") {
      return;
    }
    const policy = resolveSurfacePolicy(props);
    const pageId = policy && typeof policy.pageId === "string" && policy.pageId ? policy.pageId : "other";
    const orientation = policy && policy.containerOrientation === "vertical" ? "vertical" : "default";

    el.className =
      "dyni-html-root dyni-page-" + toClassToken(pageId) + " dyni-orientation-" + toClassToken(orientation);
    el.setAttribute("data-dyni-page-id", pageId);
    el.setAttribute("data-dyni-orientation", orientation);
  }

  /** @param {unknown} props @returns {boolean} */
  function isEditingMode(props) {
    const p = /** @type {Record<string, unknown>} */ (props && typeof props === "object" ? props : {});
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  /** @param {unknown} props @returns {boolean} */
  function canDispatchSurfaceInteraction(props) {
    const p = /** @type {Record<string, unknown>} */ (props && typeof props === "object" ? props : {});
    const surfacePolicy = /** @type {Record<string, unknown> | null} */ (
      p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null
    );
    return !!(
      surfacePolicy &&
      surfacePolicy.interaction &&
      /** @type {Record<string, unknown>} */ (surfacePolicy.interaction).mode === "dispatch"
    );
  }

  /**
   * @param {unknown} def
   * @param {DyniComponentContext} componentContext
   * @returns {DyniHtmlWidgetUtilsApi}
   */
  function create(def, componentContext) {
    const valueMath = componentContext.components.require("ValueMath");
    const domPatchUtils = componentContext.components.require("HtmlDomPatchUtils");
    toFiniteNumber = valueMath.toFiniteNumber;
    toOptionalFiniteNumber = valueMath.toOptionalFiniteNumber;
    toText = valueMath.toText;
    trimText = valueMath.trimText;
    clampNumber = valueMath.clampNumber;
    patchInnerHtml = domPatchUtils.patchInnerHtml;

    return {
      id: "HtmlWidgetUtils",
      toFiniteNumber: toFiniteNumber,
      toText: toText,
      trimText: trimText,
      escapeHtml: escapeHtml,
      toStyleAttr: toStyleAttr,
      toStyleText: toStyleText,
      resolveHostCommitTarget: resolveHostCommitTarget,
      resolveShellRect: resolveShellRect,
      resolveRatioMode: resolveRatioMode,
      resolveRatioModeForRect: resolveRatioModeForRect,
      resolveMetricValueFamily: resolveMetricValueFamily,
      resolveLabelEdgePolicy: resolveLabelEdgePolicy,
      resolveSurfacePolicy: resolveSurfacePolicy,
      joinStyles: joinStyles,
      buildTextOptions: buildTextOptions,
      toFontStyle: toFontStyle,
      toPx: toPx,
      resolveDefaultText: resolveDefaultText,
      applyMirroredContext: applyMirroredContext,
      patchInnerHtml: patchInnerHtml,
      isEditingMode: isEditingMode,
      canDispatchSurfaceInteraction: canDispatchSurfaceInteraction
    };
  }

  return { id: "HtmlWidgetUtils", create: create };
});
