/**
 * @file HtmlDomPatchUtils - DOM patch helper for HTML widget roots
 * Documentation: documentation/architecture/html-renderer-lifecycle.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniHtmlDomPatchUtils = factory();
  }
})(this, function () {
  "use strict";

  const LAST_PATCHED_MARKUP_KEY = "__dyniLastPatchedMarkup";

  /**
   * @typedef {Element & Record<string, string | undefined>} DyniPatchedRootElement
   */

  /**
   * @param {Element | null | undefined} currentEl
   * @param {Element | null | undefined} nextEl
   * @returns {void}
   */
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
  /**
   * @param {Node | null | undefined} currentNode
   * @param {Node | null | undefined} nextNode
   * @returns {boolean}
   */
  function canSyncInPlace(currentNode, nextNode) {
    if (!currentNode || !nextNode) {
      return false;
    }
    if (currentNode.nodeType !== nextNode.nodeType) {
      return false;
    }
    if (currentNode.nodeType === 1) {
      return /** @type {Element} */ (currentNode).tagName === /** @type {Element} */ (nextNode).tagName;
    }
    return true;
  }
  /** @param {DyniPatchedRootElement | null | undefined} rootEl @returns {string | undefined} */
  function readLastPatchedMarkup(rootEl) {
    return rootEl ? rootEl[LAST_PATCHED_MARKUP_KEY] : undefined;
  }

  /** @param {DyniPatchedRootElement | null | undefined} rootEl @param {unknown} markup @returns {void} */
  function writeLastPatchedMarkup(rootEl, markup) {
    if (!rootEl) {
      return;
    }
    const value = markup == null ? "" : String(markup);
    const desc = Object.getOwnPropertyDescriptor(rootEl, LAST_PATCHED_MARKUP_KEY);
    if (desc && desc.writable) {
      rootEl[LAST_PATCHED_MARKUP_KEY] = value;
      return;
    }
    if (desc && !desc.configurable) {
      return;
    }
    if (!Object.isExtensible(rootEl)) {
      return;
    }
    Object.defineProperty(rootEl, LAST_PATCHED_MARKUP_KEY, {
      value: value,
      writable: true,
      configurable: true,
      enumerable: false
    });
  }

  /** @param {Element | null | undefined} rootEl @returns {boolean} */
  function isJsDomEnvironment(rootEl) {
    const doc = rootEl && rootEl.ownerDocument;
    const ownerView = doc && doc.defaultView;
    const userAgent = ownerView && ownerView.navigator ? String(ownerView.navigator.userAgent || "") : "";
    return /jsdom/i.test(userAgent);
  }

  /** @param {Node} currentNode @param {Node} nextNode @returns {void} */
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

    const currentEl = /** @type {Element} */ (currentNode);
    const nextEl = /** @type {Element} */ (nextNode);
    syncAttributes(currentEl, nextEl);

    let currentChild = currentEl.firstChild;
    let nextChild = nextEl.firstChild;
    while (currentChild || nextChild) {
      if (!nextChild) {
        const toRemove = /** @type {Node} */ (currentChild);
        currentChild = toRemove.nextSibling;
        currentEl.removeChild(toRemove);
        continue;
      }
      if (!currentChild) {
        currentEl.appendChild(nextChild.cloneNode(true));
        nextChild = nextChild.nextSibling;
        continue;
      }
      const followingCurrentChild = currentChild.nextSibling;
      const followingNextChild = nextChild.nextSibling;
      if (canSyncInPlace(currentChild, nextChild)) {
        syncNodeTree(currentChild, nextChild);
      } else {
        currentEl.replaceChild(nextChild.cloneNode(true), currentChild);
      }
      currentChild = followingCurrentChild;
      nextChild = followingNextChild;
    }
  }

  /** @param {Element | null | undefined} rootEl @param {unknown} nextHtml @returns {Element | null} */
  function patchInnerHtml(rootEl, nextHtml) {
    if (!rootEl || typeof rootEl.appendChild !== "function") {
      return null;
    }
    const markup = nextHtml == null ? "" : String(nextHtml);
    const patchedRoot = /** @type {DyniPatchedRootElement} */ (rootEl);
    if (readLastPatchedMarkup(patchedRoot) === markup) {
      return rootEl.firstElementChild || null;
    }

    if (isJsDomEnvironment(rootEl)) {
      rootEl.innerHTML = markup;
      writeLastPatchedMarkup(patchedRoot, markup);
      return rootEl.firstElementChild || null;
    }

    const doc = rootEl.ownerDocument;
    const template = doc.createElement("template");
    template.innerHTML = markup;
    const nextRoot = template.content.firstElementChild;

    if (!nextRoot) {
      rootEl.textContent = "";
      writeLastPatchedMarkup(patchedRoot, markup);
      return null;
    }

    let currentRoot = rootEl.firstElementChild;
    while (rootEl.firstChild && rootEl.firstChild !== currentRoot) {
      rootEl.removeChild(rootEl.firstChild);
    }

    if (!currentRoot) {
      rootEl.appendChild(nextRoot.cloneNode(true));
      writeLastPatchedMarkup(patchedRoot, markup);
      return rootEl.firstElementChild;
    }

    if (!canSyncInPlace(currentRoot, nextRoot)) {
      rootEl.replaceChild(nextRoot.cloneNode(true), currentRoot);
      writeLastPatchedMarkup(patchedRoot, markup);
      return rootEl.firstElementChild;
    }

    syncNodeTree(currentRoot, nextRoot);
    while (currentRoot.nextSibling) {
      rootEl.removeChild(currentRoot.nextSibling);
    }
    writeLastPatchedMarkup(patchedRoot, markup);
    return currentRoot;
  }

  /** @returns {DyniHtmlDomPatchUtilsApi} */
  function create() {
    return {
      id: "HtmlDomPatchUtils",
      patchInnerHtml: patchInnerHtml
    };
  }

  return { id: "HtmlDomPatchUtils", create: create };
});
