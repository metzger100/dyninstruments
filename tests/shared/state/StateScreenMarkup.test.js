const { loadFresh } = require("../../helpers/load-umd");

describe("StateScreenMarkup", function () {
  function createMarkup(options) {
    const opts = options || {};
    const textFitCompute = opts.textFitCompute || vi.fn(() => "font-size:18px;");
    return loadFresh("shared/widget-kits/state/StateScreenMarkup.js").create({}, {
      getModule(id) {
        if (id === "StateScreenLabels") {
          return loadFresh("shared/widget-kits/state/StateScreenLabels.js");
        }
        if (id === "HtmlWidgetUtils") {
          return loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
        }
        if (id === "StateScreenTextFit") {
          return { create: () => ({ compute: textFitCompute }) };
        }
        throw new Error("unexpected module: " + id);
      }
    });
  }

  function parseHtml(html) {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host.firstElementChild;
  }

  it("adds state class, renders label text, and forces interaction classes to passive", function () {
    const markup = createMarkup();

    const root = parseHtml(markup.renderStateScreen({
      kind: "noRoute",
      wrapperClasses: ["dyni-edit-route-html", "dyni-edit-route-open-dispatch"],
      extraAttrs: 'data-dyni-action="edit-route-open"',
      labelStyle: "font-size:18px;"
    }));

    expect(root.className).toContain("dyni-edit-route-html");
    expect(root.className).toContain("dyni-state-no-route");
    expect(root.className).toContain("dyni-edit-route-open-passive");
    expect(root.className).not.toContain("dyni-edit-route-open-dispatch");
    expect(root.getAttribute("data-dyni-action")).toBe("edit-route-open");

    const label = root.querySelector(".dyni-state-screen-label");
    expect(label).toBeTruthy();
    expect(label.textContent).toBe("No Route");
    expect(label.getAttribute("style")).toBe("font-size:18px;");
  });

  it("forwards themed font settings to the fit helper", function () {
    const textFitCompute = vi.fn(() => "font-size:16px;");
    const markup = createMarkup({ textFitCompute });

    const root = parseHtml(markup.renderStateScreen({
      kind: "noRoute",
      wrapperClasses: ["dyni-edit-route-html"],
      shellRect: { width: 2, height: 2 },
      fontFamily: "My Font",
      fontWeight: 612
    }));

    expect(root.querySelector(".dyni-state-screen-label").getAttribute("style")).toBe("font-size:16px;");
    expect(textFitCompute).toHaveBeenCalledWith(expect.objectContaining({
      label: "No Route",
      family: "My Font",
      weight: 612
    }));
  });

  it("renders hidden state as wrapper-only without body content", function () {
    const markup = createMarkup();

    const root = parseHtml(markup.renderStateScreen({
      kind: "hidden",
      wrapperClasses: "dyni-ais-target-html dyni-ais-target-open-dispatch"
    }));

    expect(root.className).toContain("dyni-state-hidden");
    expect(root.className).toContain("dyni-ais-target-open-passive");
    expect(root.querySelector(".dyni-state-screen-body")).toBeNull();
    expect(root.children).toHaveLength(0);
  });
});
