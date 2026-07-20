const { loadFresh } = require("../../helpers/load-umd");
const { evaluateLinearScaling } = require("../../../tools/quality-policy/operation-count-evaluator.mjs");

// HtmlDomPatchUtils.patchInnerHtml's structural diff walks
// the current/next trees in lockstep. This proves patching an n-row list
// costs a linear number of DOM attribute, clone, and mutation operations, not a
// quadratic one, and that the patched DOM stays correct at every size. The
// non-jsdom document trick forces the real structural-diff path: jsdom hosts
// take a fast `innerHTML =` shortcut that this contract must not measure.
describe("HtmlDomPatchUtils.patchInnerHtml scaling contract", function () {
  function createUtils() {
    return loadFresh("shared/widget-kits/html/HtmlDomPatchUtils.js").create();
  }

  function createNonJsDomDocument() {
    return document.implementation.createHTMLDocument("non-jsdom");
  }

  /** @param {number} count @param {string} dataVersion @param {string} tagName @returns {string} */
  function makeListMarkup(count, dataVersion, tagName) {
    const rows = [];
    for (let i = 0; i < count; i += 1) {
      rows.push("<" + tagName + ' id="row-' + i + '" data-v="' + dataVersion + '">Row ' + i + "</" + tagName + ">");
    }
    return "<ul>" + rows.join("") + "</ul>";
  }

  /** @param {number} count @param {() => void} onOperation @returns {{ root: Element, doc: Document }} */
  function seedAndPatch(count, onOperation) {
    const utils = createUtils();
    const doc = createNonJsDomDocument();
    const root = doc.createElement("div");

    utils.patchInnerHtml(root, makeListMarkup(count, "0", "li"));

    /** @type {Array<[any, string]>} */
    const patchedMethods = [
      [Element.prototype, "getAttribute"],
      [Element.prototype, "hasAttribute"],
      [Element.prototype, "removeAttribute"],
      [Element.prototype, "setAttribute"],
      [Node.prototype, "appendChild"],
      [Node.prototype, "cloneNode"],
      [Node.prototype, "removeChild"],
      [Node.prototype, "replaceChild"]
    ];
    /** @type {Array<[any, string, Function]>} */
    const originals = patchedMethods.map(function ([prototype, name]) {
      return [prototype, name, prototype[name]];
    });
    originals.forEach(function ([prototype, name, original]) {
      prototype[name] = function (/** @type {any[]} */ ...args) {
        onOperation();
        return original.apply(this, args);
      };
    });
    try {
      utils.patchInnerHtml(root, makeListMarkup(count, "1", "div"));
    } finally {
      originals.forEach(function ([prototype, name, original]) {
        prototype[name] = original;
      });
    }

    return { root: root, doc: doc };
  }

  it("counts the full observable DOM patch operation surface", function () {
    const sizes = [25, 50, 100, 200];
    /** @type {Element | null} */
    let lastRoot = null;

    const result = evaluateLinearScaling({
      sizes: sizes,
      fixedOverhead: 0,
      measure: function (n) {
        let calls = 0;
        const outcome = seedAndPatch(n, function () {
          calls += 1;
        });
        lastRoot = outcome.root;
        return calls;
      }
    });

    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.samples).toEqual(sizes.map((n) => ({ n: n, count: 2 * n })));
    expect(/** @type {Element} */ (/** @type {unknown} */ (lastRoot)).querySelectorAll("div[id^='row-']")).toHaveLength(
      sizes[sizes.length - 1]
    );
  });

  it("produces a correctly patched DOM at both a small and a doubled row count", function () {
    [25, 50].forEach(function (n) {
      const outcome = seedAndPatch(n, function () {});
      const list = /** @type {Element} */ (outcome.root.firstElementChild);
      const items = outcome.root.querySelectorAll("div[id^='row-']");

      expect(list.children).toHaveLength(n);
      expect(items).toHaveLength(n);
      expect(Array.from(list.children).every((child) => child.tagName === "DIV")).toBe(true);
      for (let i = 0; i < n; i += 1) {
        expect(items[i].id).toBe("row-" + i);
        expect(items[i].getAttribute("data-v")).toBe("1");
        expect(items[i].textContent).toBe("Row " + i);
      }
    });
  });
});
