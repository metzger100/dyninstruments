const { loadFresh } = require("../../helpers/load-umd");

describe("StateScreenInteraction", function () {
  function createApi() {
    return loadFresh("shared/widget-kits/state/StateScreenInteraction.js").create();
  }

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
