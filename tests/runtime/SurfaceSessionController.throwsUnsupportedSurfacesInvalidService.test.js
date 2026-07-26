// @ts-check
const {
  createControllerMock,
  createPayload,
  createSurfacesMock,
  loadFactory
} = require("./SurfaceSessionController-setup");

describe("runtime/SurfaceSessionController.js", function () {
  it("throws for unsupported surfaces and invalid service/controller contracts", function () {
    const createSurfaceSessionController = loadFactory();

    expect(function () {
      createSurfaceSessionController({});
    }).toThrow("surfaces service must be an object");

    const invalidControllerSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return {
            attach: vi.fn(),
            update: vi.fn(),
            detach: vi.fn()
          };
        }
      }
    });

    expect(function () {
      invalidControllerSession.reconcileSession(createPayload());
    }).toThrow("must implement destroy()");

    const strictSurfaceSession = createSurfaceSessionController({
      surfaces: {
        createController: function () {
          return createControllerMock("x");
        }
      }
    });

    expect(function () {
      strictSurfaceSession.reconcileSession(
        createPayload({
          surface: "legacy-html",
          routeId: "legacy/html",
          rendererId: "LegacyHtmlWidget",
          rendererSpec: { id: "LegacyHtmlWidget", createCommittedRenderer: vi.fn() }
        })
      );
    }).toThrow("unsupported surface");
  });

  it("requires route identity and renderer metadata on activated payloads", function () {
    const createSurfaceSessionController = loadFactory();
    const surfaces = createSurfacesMock();
    const session = createSurfaceSessionController({
      surfaces: surfaces
    });

    expect(function () {
      session.reconcileSession(
        createPayload({
          routeId: "",
          rendererId: "ActiveRouteTextHtmlWidget"
        })
      );
    }).toThrow("requires routeId");

    expect(function () {
      session.reconcileSession(
        createPayload({
          routeId: "nav/activeRoute",
          rendererId: "",
          rendererSpec: { id: "ActiveRouteTextHtmlWidget", createCommittedRenderer: vi.fn() }
        })
      );
    }).toThrow("requires rendererId");

    expect(function () {
      session.reconcileSession(
        createPayload({
          routeId: "nav/activeRoute",
          rendererId: "ActiveRouteTextHtmlWidget",
          rendererSpec: null
        })
      );
    }).toThrow("requires rendererSpec");
  });
});
