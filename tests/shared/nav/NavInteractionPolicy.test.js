const { loadFresh } = require("../../helpers/load-umd");
const { createComponentContextMock } = require("../../helpers/component-context-mock");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("NavInteractionPolicy", function () {
  function createPolicy() {
    return loadFresh("shared/widget-kits/nav/NavInteractionPolicy.js").create({}, createComponentContextMock({}));
  }

  it("blocks dispatch while in editing mode even when the surface policy allows it", function () {
    const policy = createPolicy();
    const props = {
      editing: true,
      surfacePolicy: { interaction: { mode: "dispatch" } }
    };

    expect(policy.canDispatchWhenNotEditing(props)).toBe(false);
  });

  it("blocks dispatch while in layout-editing mode", function () {
    const policy = createPolicy();
    const props = {
      dyniLayoutEditing: true,
      surfacePolicy: { interaction: { mode: "dispatch" } }
    };

    expect(policy.canDispatchWhenNotEditing(props)).toBe(false);
  });

  it("allows dispatch when not editing and the surface policy permits dispatch", function () {
    const policy = createPolicy();
    const props = {
      editing: false,
      surfacePolicy: { interaction: { mode: "dispatch" } }
    };

    expect(policy.canDispatchWhenNotEditing(props)).toBe(true);
  });

  it("blocks dispatch when not editing but the surface policy forbids it", function () {
    const policy = createPolicy();
    const props = {
      surfacePolicy: { interaction: { mode: "observe" } }
    };

    expect(policy.canDispatchWhenNotEditing(props)).toBe(false);
  });

  it("safely handles missing/non-object props", function () {
    const policy = createPolicy();

    expect(policy.canDispatchWhenNotEditing(null)).toBe(false);
    expect(policy.canDispatchWhenNotEditing(undefined)).toBe(false);
  });

  it("registers itself on root.DyniComponents when loaded outside a module system", function () {
    const context = createScriptContext();
    runIifeScript("shared/widget-kits/nav/NavInteractionPolicy.js", context);

    const component = context.DyniComponents.DyniNavInteractionPolicy;
    expect(component.id).toBe("NavInteractionPolicy");

    const api = component.create({}, createComponentContextMock({}));
    expect(
      api.canDispatchWhenNotEditing({
        surfacePolicy: { interaction: { mode: "dispatch" } }
      })
    ).toBe(true);
  });
});
