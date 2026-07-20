const { loadFresh } = require("../../helpers/load-umd");
const { createScriptContext, runIifeScript } = require("../../helpers/eval-iife");

describe("StateScreenInteraction", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/state/StateScreenInteraction.js").create();
  }

  it("registers itself on the global DyniComponents root in a non-module browser load", function () {
    const context = createScriptContext();

    runIifeScript("shared/widget-kits/state/StateScreenInteraction.js", context);

    expect(context.DyniComponents.DyniStateScreenInteraction).toBeTruthy();
    expect(context.DyniComponents.DyniStateScreenInteraction.id).toBe("StateScreenInteraction");
  });

  it("defaults to passive when called without options", function () {
    const interaction = createApi();

    expect(interaction.resolveInteraction()).toBe("passive");
  });

  it("passes through baseInteraction in data state", function () {
    const interaction = createApi();

    expect(interaction.resolveInteraction({ kind: "data", baseInteraction: "dispatch" })).toBe("dispatch");
    expect(interaction.resolveInteraction({ kind: "data", baseInteraction: "passive" })).toBe("passive");
  });

  it("forces passive for every non-data state", function () {
    const interaction = createApi();

    ["disconnected", "noRoute", "noTarget", "noAis", "hidden"].forEach((kind) => {
      expect(interaction.resolveInteraction({ kind: kind, baseInteraction: "dispatch" })).toBe("passive");
    });
  });
});
