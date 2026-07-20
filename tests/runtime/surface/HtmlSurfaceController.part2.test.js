// @ts-nocheck
const {
  createModule,
  createSurfaceDom,
  makePayload,
  installGlobalCleanup
} = require("./HtmlSurfaceController.harness.js");

describe("runtime/surface/HtmlSurfaceController.js contract violations", function () {
  installGlobalCleanup();

  it("throws for strict renderer contracts and invalid payload", function () {
    const runtime = createModule();
    const surfaceDom = createSurfaceDom();

    expect(function () {
      runtime.module.createSurfaceController({
        rendererSpec: { createCommittedRenderer: vi.fn() },
        hostContext: null
      });
    }).toThrow("requires hostContext object");

    const invalidController = runtime.module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => ({
          mount: vi.fn(),
          update: vi.fn(),
          postPatch: vi.fn(),
          detach: vi.fn()
        }))
      },
      hostContext: {}
    });

    expect(function () {
      invalidController.attach(makePayload(surfaceDom, {}, 1));
    }).toThrow("must implement destroy()");

    const rendererInstance = {
      mount: vi.fn(),
      update: vi.fn(),
      postPatch: vi.fn(() => false),
      detach: vi.fn(),
      destroy: vi.fn(),
      layoutSignature: vi.fn(() => "sig")
    };
    const controller = runtime.module.createSurfaceController({
      rendererSpec: {
        createCommittedRenderer: vi.fn(() => rendererInstance)
      },
      hostContext: {}
    });

    expect(function () {
      controller.attach({});
    }).toThrow("payload.revision");

    controller.attach(makePayload(surfaceDom, {}, 1));
    expect(function () {
      controller.update({
        surface: "html",
        rootEl: surfaceDom.rootEl,
        shellEl: document.createElement("div"),
        props: {},
        revision: 2
      });
    }).toThrow("different shellEl");
  });
});
