const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("StateScreenMarkup", function () {
  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/state/StateScreenMarkup.js", context);

    expect(context.DyniComponents.DyniStateScreenMarkup).toBeTruthy();
    expect(context.DyniComponents.DyniStateScreenMarkup.id).toBe("StateScreenMarkup");
  });

  /** @param {Record<string, any>} [options] */
  function createMarkup(options) {
    const opts = options || {};
    const textFitCompute = opts.textFitCompute || vi.fn(() => "font-size:18px;");
    return loadFresh("shared/widget-kits/state/StateScreenMarkup.js").create(
      {},
      createComponentContextMock({
        modules: {
          StateScreenLabels: loadFresh("shared/widget-kits/state/StateScreenLabels.js"),
          HtmlWidgetUtils: loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js"),
          StateScreenTextFit: {
            create() {
              return { compute: textFitCompute };
            }
          }
        }
      })
    );
  }

  /** @param {string} html @returns {Element} */
  function parseHtml(html) {
    const host = document.createElement("div");
    host.innerHTML = html;
    return /** @type {Element} */ (host.firstElementChild);
  }

  it("adds state class, renders label text, and forces interaction classes to passive", function () {
    const markup = createMarkup();

    const root = parseHtml(
      markup.renderStateScreen({
        kind: "noRoute",
        wrapperClasses: ["dyni-edit-route-html", "dyni-edit-route-open-dispatch"],
        extraAttrs: 'data-dyni-action="edit-route-open"',
        labelStyle: "font-size:18px;"
      })
    );

    expect(root.className).toContain("dyni-edit-route-html");
    expect(root.className).toContain("dyni-state-no-route");
    expect(root.className).toContain("dyni-edit-route-open-passive");
    expect(root.className).not.toContain("dyni-edit-route-open-dispatch");
    expect(root.getAttribute("data-dyni-action")).toBe("edit-route-open");

    const label = /** @type {Element} */ (root.querySelector(".dyni-state-screen-label"));
    expect(label).toBeTruthy();
    expect(label.textContent).toBe("No Route");
    expect(label.getAttribute("style")).toBe("font-size:18px;");
  });

  it("forwards themed font settings to the fit helper", function () {
    const textFitCompute = vi.fn(() => "font-size:16px;");
    const markup = createMarkup({ textFitCompute });

    const root = parseHtml(
      markup.renderStateScreen({
        kind: "noRoute",
        wrapperClasses: ["dyni-edit-route-html"],
        shellRect: { width: 2, height: 2 },
        fontFamily: "My Font",
        fontWeight: 612
      })
    );

    expect(/** @type {Element} */ (root.querySelector(".dyni-state-screen-label")).getAttribute("style")).toBe(
      "font-size:16px;"
    );
    expect(textFitCompute).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "No Route",
        family: "My Font",
        weight: 612
      })
    );
  });

  it("renders hidden state as wrapper-only without body content", function () {
    const markup = createMarkup();

    const root = parseHtml(
      markup.renderStateScreen({
        kind: "hidden",
        wrapperClasses: "dyni-ais-target-html dyni-ais-target-open-dispatch"
      })
    );

    expect(root.className).toContain("dyni-state-hidden");
    expect(root.className).toContain("dyni-ais-target-open-passive");
    expect(root.querySelector(".dyni-state-screen-body")).toBeNull();
    expect(root.children).toHaveLength(0);
  });

  it("serializes object-form extraAttrs, skipping null/false and rendering boolean-true as a bare attribute", function () {
    const markup = createMarkup();

    const root = parseHtml(
      markup.renderStateScreen({
        kind: "noTarget",
        extraAttrs: {
          "data-dyni-flag": true,
          "data-dyni-off": false,
          "data-dyni-missing": null,
          "data-dyni-action": 'edit"quote'
        }
      })
    );

    expect(root.hasAttribute("data-dyni-flag")).toBe(true);
    expect(root.getAttribute("data-dyni-flag")).toBe("");
    expect(root.hasAttribute("data-dyni-off")).toBe(false);
    expect(root.hasAttribute("data-dyni-missing")).toBe(false);
    expect(root.getAttribute("data-dyni-action")).toBe('edit"quote');
  });

  it("defaults to the data kind and label overrides/fitStyle when kind/label/style are omitted or explicit", function () {
    const markup = createMarkup();

    const defaultKindRoot = parseHtml(markup.renderStateScreen({}));
    expect(defaultKindRoot.className).toContain("dyni-state-data");

    const explicitLabelRoot = parseHtml(
      markup.renderStateScreen({
        kind: "noRoute",
        label: "Custom Label",
        fitStyle: "font-size:12px;"
      })
    );
    expect(/** @type {Element} */ (explicitLabelRoot.querySelector(".dyni-state-screen-label")).textContent).toBe(
      "Custom Label"
    );
    expect(
      /** @type {Element} */ (explicitLabelRoot.querySelector(".dyni-state-screen-label")).getAttribute("style")
    ).toBe("font-size:12px;");
  });

  it("normalizes missing wrapperClasses to none and dedupes repeated class names", function () {
    const markup = createMarkup();

    const root = parseHtml(
      markup.renderStateScreen({
        kind: "noAis",
        wrapperClasses: ["dyni-a", "dyni-a", "dyni-b"]
      })
    );

    const classes = root.className.split(/\s+/).filter(Boolean);
    expect(classes.filter((/** @type {string} */ cls) => cls === "dyni-a")).toHaveLength(1);
    expect(classes).toContain("dyni-b");
    expect(classes).toContain("dyni-state-no-ais");
  });
});
