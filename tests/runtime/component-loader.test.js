const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");

describe("runtime/component-loader.js", function () {
  function setup(options) {
    const dom = createDomHarness(options);
    const context = createScriptContext({
      document: dom.document,
      DyniPlugin: {
        runtime: {},
        state: {},
        config: { shared: {}, clusters: [] }
      },
      DyniComponents: {
        DyniA: { id: "A", create() {} },
        DyniB: { id: "B", create() {} }
      }
    });

    runIifeScript("runtime/component-loader.js", context);

    return {
      dom,
      runtime: context.DyniPlugin.runtime,
      context
    };
  }

  it("loads deps first and deduplicates script/css loads", async function () {
    const { runtime, dom } = setup();
    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: "/a.css", globalKey: "DyniA", deps: ["B"] },
      B: { js: "/b.js", css: undefined, globalKey: "DyniB" }
    });

    const first = loader.loadComponent("A");
    const second = loader.loadComponent("A");

    expect(first).toBe(second);
    await first;
    await flushPromises();

    expect(dom.appendedScripts.map((s) => s.id)).toEqual(["dyni-js-B", "dyni-js-A"]);
    expect(dom.appendedLinks.map((l) => l.id)).toEqual(["dyni-css-A"]);
  });

  it("returns rejected promise for unknown component", async function () {
    const { runtime } = setup();
    const loader = runtime.createComponentLoader({});

    await expect(loader.loadComponent("missing")).rejects.toThrow("Unknown component");
  });

  it("rejects if loaded global component has no create function", async function () {
    const { runtime, context } = setup();
    context.DyniComponents.Broken = { id: "Broken" };

    const loader = runtime.createComponentLoader({
      Broken: { js: "/broken.js", css: undefined, globalKey: "Broken" }
    });

    await expect(loader.loadComponent("Broken")).rejects.toThrow("Component not found or invalid");
  });

  it("collects unique widgets with transitive dependencies", function () {
    const { runtime } = setup();
    const loader = runtime.createComponentLoader({
      A: { deps: ["B"] },
      B: { deps: ["C"] },
      C: {}
    });

    const ids = loader.uniqueComponents([{ widget: "A" }, { widget: "A" }, { widget: "C" }]);
    expect(new Set(ids)).toEqual(new Set(["A", "B", "C"]));
  });
});
