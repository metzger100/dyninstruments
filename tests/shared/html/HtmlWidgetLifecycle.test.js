const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("HtmlWidgetLifecycle", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/html/HtmlWidgetLifecycle.js").create();
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/html/HtmlWidgetLifecycle.js", context);

    expect(context.DyniComponents.DyniHtmlWidgetLifecycle).toBeTruthy();
    expect(context.DyniComponents.DyniHtmlWidgetLifecycle.id).toBe("HtmlWidgetLifecycle");
  });

  it("mountRootDiv appends a fresh child div to the mount host and returns both elements", function () {
    const api = createApi();
    const host = document.createElement("div");

    const mounted = api.mountRootDiv(host);

    expect(mounted.mountEl).toBe(host);
    expect(mounted.rootEl.tagName).toBe("DIV");
    expect(host.firstElementChild).toBe(mounted.rootEl);
    expect(host.children).toHaveLength(1);
  });

  it("joinSignatureParts joins parts with a pipe separator", function () {
    const api = createApi();

    expect(api.joinSignatureParts(["a", "b", "c"])).toBe("a|b|c");
    expect(api.joinSignatureParts([])).toBe("");
    expect(api.joinSignatureParts(["solo"])).toBe("solo");
  });

  it("createMountHandler mounts a root div then invokes applyMounted and patchDom with the payload", function () {
    const api = createApi();
    const applyMounted = vi.fn();
    const patchDom = vi.fn();
    const mount = api.createMountHandler({ applyMounted: applyMounted, patchDom: patchDom });
    const host = document.createElement("div");
    const payload = { some: "payload" };

    mount(host, payload);

    expect(applyMounted).toHaveBeenCalledTimes(1);
    const mountedArg = applyMounted.mock.calls[0][0];
    expect(mountedArg.mountEl).toBe(host);
    expect(mountedArg.rootEl.tagName).toBe("DIV");
    expect(patchDom).toHaveBeenCalledWith(payload);
  });

  it("createMountHandler defaults to an empty spec object without throwing during construction", function () {
    const api = createApi();

    expect(function () {
      api.createMountHandler();
    }).not.toThrow();
    expect(function () {
      api.createMountHandler(null);
    }).not.toThrow();
    expect(function () {
      api.createMountHandler("not-an-object");
    }).not.toThrow();
  });

  it("createResizeSignatureHandler builds the signature from buildModel's resizeSignatureParts", function () {
    const api = createApi();
    const buildModel = vi.fn(() => ({ resizeSignatureParts: ["w:100", "h:50"] }));
    const layoutSignature = api.createResizeSignatureHandler(buildModel);

    const result = layoutSignature({ props: { a: 1 }, shellRect: { width: 100, height: 50 } });

    expect(result).toBe("w:100|h:50");
    expect(buildModel).toHaveBeenCalledWith({ a: 1 }, { width: 100, height: 50 });
  });

  it("createResizeSignatureHandler defaults missing payload, props, and shellRect to empty/null values", function () {
    const api = createApi();
    const buildModel = vi.fn(() => ({ resizeSignatureParts: [] }));
    const layoutSignature = api.createResizeSignatureHandler(buildModel);

    layoutSignature();

    expect(buildModel).toHaveBeenCalledWith({}, null);

    layoutSignature({ props: null, shellRect: null });

    expect(buildModel).toHaveBeenCalledWith({}, null);
  });
});
