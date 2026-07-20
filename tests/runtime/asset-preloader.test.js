const { createScriptContext, runIifeScript } = require("../helpers/eval-iife");

/** @param {any} kind @param {any} value @param {any} [ok] */
function createFetchResponse(kind, value, ok) {
  return {
    ok: ok !== false,
    status: ok === false ? 404 : 200,
    text:
      kind === "text"
        ? vi.fn(() => Promise.resolve(value))
        : vi.fn(() => Promise.reject(new Error("unexpected text()"))),
    json:
      kind === "json"
        ? vi.fn(() => Promise.resolve(value))
        : vi.fn(() => Promise.reject(new Error("unexpected json()"))),
    arrayBuffer:
      kind === "arrayBuffer"
        ? vi.fn(() => Promise.resolve(value))
        : vi.fn(() => Promise.reject(new Error("unexpected arrayBuffer()")))
  };
}

/** @param {Record<string, any>} [options] */
function setup(options) {
  const opts = options || {};
  const fontsAdd = vi.fn();
  const fetchMock = vi.fn((/** @type {any} */ url) => {
    const entry = opts.responses[url];
    if (entry instanceof Error) {
      return Promise.reject(entry);
    }
    return Promise.resolve(entry);
  });

  class FakeImage {
    constructor() {
      /** @type {any} */
      this.onload = null;
      this.onerror = null;
      this.srcValue = "";
    }

    /** @param {any} value */
    set src(value) {
      this.srcValue = value;
      Promise.resolve().then(() => {
        if (typeof this.onload === "function") {
          this.onload();
        }
      });
    }
  }

  class FakeFontFace {
    /** @param {any} family @param {any} source */
    constructor(family, source) {
      this.family = family;
      this.source = source;
    }
  }

  const context = createScriptContext({
    fetch: fetchMock,
    Image: FakeImage,
    FontFace: FakeFontFace,
    document: {
      fonts: {
        add: fontsAdd
      }
    },
    DyniPlugin: {
      baseUrl: "http://host/plugins/dyninstruments/",
      runtime: {}
    }
  });

  runIifeScript("runtime/asset-preloader.js", context);

  return {
    context,
    fetchMock,
    fontsAdd
  };
}

describe("runtime/asset-preloader.js", function () {
  it("preloads each declared asset type and exposes cached lookups", async function () {
    const svgResponse = createFetchResponse("text", "<svg></svg>");
    const audioBuffer = new ArrayBuffer(8);
    const jsonValue = { ok: true };
    const jsonResponse = createFetchResponse("json", jsonValue);
    const audioResponse = createFetchResponse("arrayBuffer", audioBuffer);
    const imageUrl = "http://host/plugins/dyninstruments/assets/image.png";
    const svgUrl = "http://host/plugins/dyninstruments/assets/icon.svg";
    const audioUrl = "http://host/plugins/dyninstruments/assets/tone.mp3";
    const jsonUrl = "http://host/plugins/dyninstruments/assets/meta.json";
    const fontUrl = "http://host/plugins/dyninstruments/assets/font.woff2";

    const { context, fetchMock, fontsAdd } = setup({
      responses: {
        [svgUrl]: svgResponse,
        [audioUrl]: audioResponse,
        [jsonUrl]: jsonResponse,
        [fontUrl]: createFetchResponse("arrayBuffer", new ArrayBuffer(16))
      }
    });

    const preloader = context.DyniPlugin.runtime.createAssetPreloader(context.DyniPlugin.baseUrl);

    await preloader.preloadAssets([
      { key: "icon", path: "assets/icon.svg", type: "svg" },
      { key: "image", path: "assets/image.png", type: "image" },
      { key: "tone", path: "assets/tone.mp3", type: "audio" },
      { key: "meta", path: "assets/meta.json", type: "json" },
      { key: "font", path: "assets/font.woff2", type: "font" }
    ]);

    expect(fetchMock).toHaveBeenCalledWith(svgUrl);
    expect(fetchMock).toHaveBeenCalledWith(audioUrl);
    expect(fetchMock).toHaveBeenCalledWith(jsonUrl);
    expect(fetchMock).toHaveBeenCalledWith(fontUrl);
    expect(preloader.getAsset("icon")).toBe("<svg></svg>");
    expect(preloader.getAsset("tone")).toBe(audioBuffer);
    expect(preloader.getAsset("meta")).toEqual(jsonValue);
    expect(preloader.getAsset("image").srcValue).toBe(imageUrl);
    expect(preloader.getAsset("font").family).toBe("font");
    expect(fontsAdd).toHaveBeenCalledTimes(1);
    expect(function () {
      preloader.getAsset("missing");
    }).toThrow("unknown asset key");
  });

  it("returns null for failed loads and rejects duplicate asset keys", async function () {
    const failedUrl = "http://host/plugins/dyninstruments/assets/fail.svg";
    const dupOneUrl = "http://host/plugins/dyninstruments/assets/one.svg";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { context } = setup({
      responses: {
        [failedUrl]: createFetchResponse("text", "nope", false),
        [dupOneUrl]: createFetchResponse("text", "<svg></svg>")
      }
    });

    const preloader = context.DyniPlugin.runtime.createAssetPreloader(context.DyniPlugin.baseUrl);
    await preloader.preloadAssets([{ key: "failed", path: "assets/fail.svg", type: "svg" }]);

    expect(preloader.getAsset("failed")).toBeNull();
    expect(function () {
      preloader.preloadAssets([
        { key: "dup", path: "assets/one.svg", type: "svg" },
        { key: "dup", path: "assets/two.svg", type: "svg" }
      ]);
    }).toThrow("duplicate asset key");
    warn.mockRestore();
  });
});
