const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");
const { createDomHarness } = require("../helpers/mock-dom");
const { flushPromises } = require("../helpers/async");
const { setupComponentLoader } = require("./component-loader.harness");

describe("runtime/component-loader.js", function () {
  it("loads deps first and deduplicates script/css loads", async function () {
    const { runtime, dom } = setupComponentLoader();
    const loader = runtime.createComponentLoader({
      A: { js: "/a.js", css: "/a.css", globalKey: "DyniA", deps: ["B"] },
      B: { js: "/b.js", css: undefined, globalKey: "DyniB" },
    });

    const first = loader.loadComponent("A");
    const second = loader.loadComponent("A");

    expect(first).toBe(second);
    await first;
    await flushPromises();

    expect(dom.appendedScripts.map((s) => s.id)).toEqual([
      "dyni-js-B",
      "dyni-js-A",
    ]);
    expect(dom.appendedLinks.map((l) => l.id)).toEqual(["dyni-css-A"]);
  });

  it("throws for unknown component", function () {
    const { runtime } = setupComponentLoader();
    const loader = runtime.createComponentLoader({});

    expect(function () {
      loader.loadComponent("missing");
    }).toThrow("unknown component");
  });

  it("rejects if loaded global component has no create function", async function () {
    const { runtime, context } = setupComponentLoader();
    context.DyniComponents.Broken = { id: "Broken" };

    const loader = runtime.createComponentLoader({
      Broken: { js: "/broken.js", css: undefined, globalKey: "Broken" },
    });

    await expect(loader.loadComponent("Broken")).rejects.toThrow(
      "Component not found or invalid",
    );
  });

  it("accepts module-shaped components when apiShape is module", async function () {
    const { runtime, context } = setupComponentLoader();
    context.DyniComponents.ThemeModel = {
      id: "ThemeModel",
      normalizePresetName() {
        return "default";
      },
    };

    const loader = runtime.createComponentLoader({
      ThemeModel: {
        js: "/theme-model.js",
        css: undefined,
        globalKey: "ThemeModel",
        apiShape: "module",
      },
    });

    await expect(loader.loadComponent("ThemeModel")).resolves.toEqual(
      context.DyniComponents.ThemeModel,
    );
  });

  it("rejects unknown apiShape values", async function () {
    const { runtime, context } = setupComponentLoader();
    context.DyniComponents.Weird = { id: "Weird", create() {} };

    const loader = runtime.createComponentLoader({
      Weird: {
        js: "/weird.js",
        css: undefined,
        globalKey: "Weird",
        apiShape: "mystery",
      },
    });

    await expect(loader.loadComponent("Weird")).rejects.toThrow(
      "Unsupported apiShape",
    );
  });

  it("collects unique widgets with transitive dependencies", function () {
    const { runtime } = setupComponentLoader();
    const loader = runtime.createComponentLoader({
      A: { deps: ["B"] },
      B: { deps: ["C"] },
      C: {},
    });

    const ids = loader.uniqueComponents([
      { widget: "A" },
      { widget: "A" },
      { widget: "C" },
    ]);
    expect(new Set(ids)).toEqual(new Set(["A", "B", "C"]));
  });

  it("reuses runtime.loadScriptOnce when plugin bootstrap already provided it", async function () {
    const dom = createDomHarness();
    const runtimeLoadScriptOnce = vi.fn(() => Promise.resolve());
    const runtimeLoadCssOnce = vi.fn(() => Promise.resolve());
    const context = createScriptContext({
      document: dom.document,
      DyniPlugin: {
        baseUrl: "http://host/plugins/dyninstruments/",
        runtime: {
          loadScriptOnce: runtimeLoadScriptOnce,
          loadCssOnce: runtimeLoadCssOnce,
        },
        state: {},
        config: { shared: {}, clusters: [] },
      },
      DyniComponents: {
        DyniA: { id: "A", create() {} },
      },
    });

    runIifeScript("runtime/asset-preloader.js", context);
    runIifeScript("runtime/component-loader.js", context);
    const loader = context.DyniPlugin.runtime.createComponentLoader({
      A: { js: "/a.js", css: undefined, globalKey: "DyniA" },
    });

    await loader.loadComponent("A");
    await flushPromises();

    expect(runtimeLoadScriptOnce).toHaveBeenCalledWith("dyni-js-A", "/a.js");
    expect(dom.appendedScripts).toHaveLength(0);
  });

  it("preloads declared assets and exposes runtime asset helpers", async function () {
    const svgUrl = "http://host/plugins/dyninstruments/assets/icon.svg";
    const imageUrl = "http://host/plugins/dyninstruments/assets/photo.png";
    const svgResponse = {
      ok: true,
      status: 200,
      text: vi.fn(() => Promise.resolve("<svg></svg>")),
      json: vi.fn(() => Promise.resolve({})),
      arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(1))),
    };
    const imageLoadCalls = [];
    class FakeImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.srcValue = "";
      }

      set src(value) {
        this.srcValue = value;
        imageLoadCalls.push(value);
        Promise.resolve().then(() => {
          if (typeof this.onload === "function") {
            this.onload();
          }
        });
      }
    }
    const contextFetch = vi.fn((url) => {
      if (url === svgUrl) {
        return Promise.resolve(svgResponse);
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    });

    const dom = createDomHarness();
    const runtimeLoadScriptOnce = vi.fn((id, src) => {
      if (dom.document.getElementById(id)) {
        return Promise.resolve();
      }
      return Promise.resolve();
    });
    const runtimeLoadCssOnce = vi.fn(() => Promise.resolve());
    const context = createScriptContext({
      document: {
        ...dom.document,
        fonts: {
          add: vi.fn(),
        },
      },
      fetch: contextFetch,
      Image: FakeImage,
      FontFace: class FakeFontFace {
        constructor(family, source) {
          this.family = family;
          this.source = source;
        }
      },
      DyniPlugin: {
        runtime: {
          loadScriptOnce: runtimeLoadScriptOnce,
          loadCssOnce: runtimeLoadCssOnce,
        },
        state: {},
        config: { shared: {}, clusters: [] },
        baseUrl: "http://host/plugins/dyninstruments/",
      },
      DyniComponents: {
        DyniA: { id: "A", create() {} },
      },
    });

    runIifeScript("runtime/asset-preloader.js", context);
    runIifeScript("runtime/component-loader.js", context);

    const loader = context.DyniPlugin.runtime.createComponentLoader({
      A: {
        js: "/a.js",
        css: undefined,
        globalKey: "DyniA",
        assets: [
          { key: "svg-icon", path: "assets/icon.svg", type: "svg" },
          { key: "photo", path: "assets/photo.png", type: "image" },
        ],
      },
    });

    await loader.loadComponent("A");
    await flushPromises();

    expect(context.DyniPlugin.runtime.assetUrl("assets/icon.svg")).toBe(
      "http://host/plugins/dyninstruments/assets/icon.svg",
    );
    expect(context.DyniPlugin.runtime.getAsset("svg-icon")).toBe("<svg></svg>");
    expect(context.DyniPlugin.runtime.getAsset("photo").srcValue).toBe(
      imageUrl,
    );
    expect(imageLoadCalls).toEqual([imageUrl]);
    expect(contextFetch).toHaveBeenCalledWith(svgUrl);
  });

});
