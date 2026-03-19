const { loadFresh } = require("../helpers/load-umd");

describe("ClusterWidget", function () {
  it("wires mapper toolkit, registry and renderer router", function () {
    const mapCluster = vi.fn(() => ({ value: 7 }));
    const createToolkit = vi.fn(() => ({ t: true }));
    const renderHtml = vi.fn(() => "<div>ok</div>");

    const Helpers = {
      getModule(id) {
        if (id === "ClusterMapperToolkit") return { create: () => ({ createToolkit }) };
        if (id === "ClusterMapperRegistry") return { create: () => ({ mapCluster }) };
        if (id === "ClusterRendererRouter") {
          return { create: () => ({ wantsHideNativeHead: true, renderHtml }) };
        }
        throw new Error("unexpected module: " + id);
      }
    };

    const widget = loadFresh("cluster/ClusterWidget.js").create({ cluster: "speed" }, Helpers);

    expect(widget.id).toBe("ClusterWidget");
    expect(widget.wantsHideNativeHead).toBe(true);
    expect(widget.translateFunction({ kind: "sog" })).toEqual({ value: 7 });
    expect(mapCluster).toHaveBeenCalledWith({ kind: "sog" }, createToolkit);
    expect(widget.renderHtml).toBe(renderHtml);
    expect(widget.renderCanvas).toBeUndefined();
    expect(widget.initFunction).toBeUndefined();
    expect(widget.finalizeFunction).toBeUndefined();
  });
});
