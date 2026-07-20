const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("HtmlDomPatchUtils", function () {
  const LAST_PATCHED_MARKUP_KEY = "__dyniLastPatchedMarkup";

  function createUtils() {
    return loadFresh("shared/widget-kits/html/HtmlDomPatchUtils.js").create();
  }

  function createNonJsDomDocument() {
    return document.implementation.createHTMLDocument("non-jsdom");
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/html/HtmlDomPatchUtils.js", context);

    expect(context.DyniComponents.DyniHtmlDomPatchUtils).toBeTruthy();
    expect(context.DyniComponents.DyniHtmlDomPatchUtils.id).toBe("HtmlDomPatchUtils");
  });

  it("returns null for a missing root element or a root without appendChild", function () {
    const utils = createUtils();

    expect(utils.patchInnerHtml(null, "<div></div>")).toBeNull();
    expect(utils.patchInnerHtml(undefined, "<div></div>")).toBeNull();
    expect(utils.patchInnerHtml({}, "<div></div>")).toBeNull();
  });

  it("coerces null/undefined markup to an empty string in the jsdom fast path", function () {
    const utils = createUtils();
    const root = document.createElement("div");

    expect(utils.patchInnerHtml(root, null)).toBeNull();
    expect(root.innerHTML).toBe("");
    expect(/** @type {any} */ (root)[LAST_PATCHED_MARKUP_KEY]).toBe("");
  });

  it("skips template parsing on the non-jsdom structural path when markup is unchanged", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");
    const createElementSpy = vi.spyOn(doc, "createElement");
    try {
      const markup = '<div class="one"><span>Alpha</span></div>';
      utils.patchInnerHtml(root, markup);
      createElementSpy.mockClear();

      const stableRoot = root.firstElementChild;
      const result = utils.patchInnerHtml(root, markup);

      expect(createElementSpy).not.toHaveBeenCalled();
      expect(result).toBe(stableRoot);
      expect(root.firstElementChild).toBe(stableRoot);
    } finally {
      createElementSpy.mockRestore();
    }
  });

  it("clears content and returns null on the non-jsdom path when the next markup has no parseable root element", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");
    root.textContent = "stale";

    const result = utils.patchInnerHtml(root, "just text, no element");

    expect(result).toBeNull();
    expect(root.textContent).toBe("");
    expect(/** @type {any} */ (root)[LAST_PATCHED_MARKUP_KEY]).toBe("just text, no element");
  });

  it("syncs comment node values in place on the non-jsdom structural path", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, "<div><!--first--></div>");
    const stableRoot = /** @type {Element} */ (root.firstElementChild);
    const commentNode = /** @type {ChildNode} */ (stableRoot.firstChild);
    expect(commentNode.nodeType).toBe(8);

    utils.patchInnerHtml(root, "<div><!--second--></div>");

    expect(root.firstElementChild).toBe(stableRoot);
    expect(stableRoot.firstChild).toBe(commentNode);
    expect(commentNode.nodeValue).toBe("second");
  });

  it("removes extra current children when the next markup has fewer children", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, "<div><span>1</span><span>2</span><span>3</span></div>");
    expect(/** @type {Element} */ (root.firstElementChild).children).toHaveLength(3);

    utils.patchInnerHtml(root, "<div><span>1</span></div>");

    expect(/** @type {Element} */ (root.firstElementChild).children).toHaveLength(1);
    expect(/** @type {Element} */ (root.firstElementChild).children[0].textContent).toBe("1");
  });

  it("appends new children when the next markup has more children than currently present", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, "<div><span>1</span></div>");
    expect(/** @type {Element} */ (root.firstElementChild).children).toHaveLength(1);

    utils.patchInnerHtml(root, "<div><span>1</span><span>2</span><span>3</span></div>");

    expect(/** @type {Element} */ (root.firstElementChild).children).toHaveLength(3);
    expect(/** @type {Element} */ (root.firstElementChild).children[2].textContent).toBe("3");
  });

  it("replaces a mismatched nested child (different tag) instead of syncing it in place", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, "<div><span>a</span></div>");
    const stableRoot = /** @type {Element} */ (root.firstElementChild);
    const originalChild = stableRoot.firstElementChild;

    utils.patchInnerHtml(root, "<div><p>b</p></div>");

    expect(root.firstElementChild).toBe(stableRoot);
    expect(stableRoot.firstElementChild).not.toBe(originalChild);
    expect(/** @type {Element} */ (stableRoot.firstElementChild).tagName).toBe("P");
    expect(/** @type {Element} */ (stableRoot.firstElementChild).textContent).toBe("b");
  });

  it("replaces every mismatched sibling without retaining stale children", function () {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, "<ul><li>a</li><li>b</li><li>c</li></ul>");
    utils.patchInnerHtml(root, "<ul><div>x</div><div>y</div><div>z</div></ul>");

    const list = /** @type {Element} */ (root.firstElementChild);
    expect(list.children).toHaveLength(3);
    expect(Array.from(list.children).map((child) => child.tagName)).toEqual(["DIV", "DIV", "DIV"]);
    expect(Array.from(list.children).map((child) => child.textContent)).toEqual(["x", "y", "z"]);
  });

  it("updates the marker in place via direct assignment when the existing property is writable", function () {
    const utils = createUtils();
    const root = document.createElement("div");
    Object.defineProperty(root, LAST_PATCHED_MARKUP_KEY, {
      value: "stale",
      writable: true,
      configurable: false,
      enumerable: false
    });

    utils.patchInnerHtml(root, "<span>content</span>");

    expect(/** @type {any} */ (root)[LAST_PATCHED_MARKUP_KEY]).toBe("<span>content</span>");
    expect(/** @type {Element} */ (root.firstElementChild).tagName).toBe("SPAN");
  });

  it("leaves the last-patched-markup marker untouched when it is both non-writable and non-configurable", function () {
    const utils = createUtils();
    const root = document.createElement("div");
    Object.defineProperty(root, LAST_PATCHED_MARKUP_KEY, {
      value: "locked",
      writable: false,
      configurable: false,
      enumerable: false
    });

    expect(function () {
      utils.patchInnerHtml(root, "<span>content</span>");
    }).not.toThrow();
    expect(/** @type {any} */ (root)[LAST_PATCHED_MARKUP_KEY]).toBe("locked");
    expect(/** @type {Element} */ (root.firstElementChild).tagName).toBe("SPAN");
  });

  it("skips writing the marker when the root element is not extensible", function () {
    const utils = createUtils();
    const root = document.createElement("div");
    Object.preventExtensions(root);

    expect(function () {
      utils.patchInnerHtml(root, "<span>content</span>");
    }).not.toThrow();
    expect(/** @type {any} */ (root)[LAST_PATCHED_MARKUP_KEY]).toBeUndefined();
    expect(/** @type {Element} */ (root.firstElementChild).tagName).toBe("SPAN");
  });
});
