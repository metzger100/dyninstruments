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

  function resolveRatioModeForRect(options) {
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
    const rect = opts.shellRect;

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

  function toClassToken(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-{2,}/g, "-");
  }

  function resolveSurfacePolicy(props) {
    const p = props && typeof props === "object" ? props : null;
    return p && p.surfacePolicy && typeof p.surfacePolicy === "object" ? p.surfacePolicy : null;
  }

  function applyMirroredContext(rootEl, props) {
    if (!rootEl || typeof rootEl.setAttribute !== "function") {
      return;
    }
    const policy = resolveSurfacePolicy(props);
    const pageId = policy && typeof policy.pageId === "string" && policy.pageId
      ? policy.pageId
      : "other";
    const orientation = policy && policy.containerOrientation === "vertical"
      ? "vertical"
      : "default";

    rootEl.className = "dyni-html-root dyni-page-" + toClassToken(pageId) + " dyni-orientation-" + toClassToken(orientation);
    rootEl.setAttribute("data-dyni-page-id", pageId);
    rootEl.setAttribute("data-dyni-orientation", orientation);
  }

  function syncAttributes(currentEl, nextEl) {
    if (!currentEl || !nextEl || !currentEl.attributes || !nextEl.attributes) {
      return;
    }
    const currentAttrs = currentEl.attributes;
    for (let i = currentAttrs.length - 1; i >= 0; i -= 1) {
      const attr = currentAttrs[i];
      if (!nextEl.hasAttribute(attr.name)) {
        currentEl.removeAttribute(attr.name);
      }
    }
    const nextAttrs = nextEl.attributes;
    for (let i = 0; i < nextAttrs.length; i += 1) {
      const attr = nextAttrs[i];
      if (currentEl.getAttribute(attr.name) !== attr.value) {
        currentEl.setAttribute(attr.name, attr.value);
      }
    }
  }

  function canSyncInPlace(currentNode, nextNode) {
    if (!currentNode || !nextNode) {
      return false;
    }
    if (currentNode.nodeType !== nextNode.nodeType) {
      return false;
    }
    if (currentNode.nodeType === 1) {
      return currentNode.tagName === nextNode.tagName;
    }
    return true;
  }

  function syncNodeTree(currentNode, nextNode) {
    if (!canSyncInPlace(currentNode, nextNode)) {
      return;
    }
    if (currentNode.nodeType === 3 || currentNode.nodeType === 8) {
      if (currentNode.nodeValue !== nextNode.nodeValue) {
        currentNode.nodeValue = nextNode.nodeValue;
      }
      return;
    }
    if (currentNode.nodeType !== 1) {
      return;
    }

    syncAttributes(currentNode, nextNode);

    let currentChild = currentNode.firstChild;
    let nextChild = nextNode.firstChild;
    while (currentChild || nextChild) {
      if (!nextChild) {
        const toRemove = currentChild;
        currentChild = currentChild.nextSibling;
        currentNode.removeChild(toRemove);
        continue;
      }
      if (!currentChild) {
        currentNode.appendChild(nextChild.cloneNode(true));
        nextChild = nextChild.nextSibling;
        continue;
      }
      if (canSyncInPlace(currentChild, nextChild)) {
        syncNodeTree(currentChild, nextChild);
      } else {
        currentNode.replaceChild(nextChild.cloneNode(true), currentChild);
      }
      currentChild = currentChild.nextSibling;
      nextChild = nextChild.nextSibling;
    }
  }

  function patchInnerHtml(rootEl, nextHtml) {
    if (!rootEl || typeof rootEl.appendChild !== "function") {
      return null;
    }
    const markup = nextHtml == null ? "" : String(nextHtml);
    const doc = rootEl.ownerDocument;
    const template = doc.createElement("template");
    template.innerHTML = markup;
    const nextRoot = template.content.firstElementChild;

    if (!nextRoot) {
      rootEl.textContent = "";
      return null;
    }

    let currentRoot = rootEl.firstElementChild;
    while (rootEl.firstChild && rootEl.firstChild !== currentRoot) {
      rootEl.removeChild(rootEl.firstChild);
    }

    if (!currentRoot) {
      rootEl.appendChild(nextRoot.cloneNode(true));
      return rootEl.firstElementChild;
    }

    if (!canSyncInPlace(currentRoot, nextRoot)) {
      rootEl.replaceChild(nextRoot.cloneNode(true), currentRoot);
      return rootEl.firstElementChild;
    }

    syncNodeTree(currentRoot, nextRoot);
    while (currentRoot.nextSibling) {
      rootEl.removeChild(currentRoot.nextSibling);
    }
    return currentRoot;
  }

  function isEditingMode(props) {
    const p = props && typeof props === "object" ? props : {};
    return p.editing === true || p.dyniLayoutEditing === true;
  }

  function canDispatchSurfaceInteraction(props) {
    const p = props && typeof props === "object" ? props : {};
    const surfacePolicy = p.surfacePolicy && typeof p.surfacePolicy === "object"
      ? p.surfacePolicy
      : null;
    return !!(surfacePolicy && surfacePolicy.interaction && surfacePolicy.interaction.mode === "dispatch");
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
      resolveRatioModeForRect: resolveRatioModeForRect,
      applyMirroredContext: applyMirroredContext,
      patchInnerHtml: patchInnerHtml,
      isEditingMode: isEditingMode,
      canDispatchSurfaceInteraction: canDispatchSurfaceInteraction
    };
  }

  return { id: "HtmlWidgetUtils", create: create };
}));
