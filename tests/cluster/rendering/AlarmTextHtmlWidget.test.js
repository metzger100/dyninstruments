const { loadFresh } = require("../../helpers/load-umd");

describe("AlarmTextHtmlWidget", function () {
  function createRenderer() {
    const Helpers = {
      getModule(id) {
        throw new Error("unexpected module: " + id);
      }
    };

    return loadFresh("widgets/text/AlarmTextHtmlWidget/AlarmTextHtmlWidget.js").create({}, Helpers);
  }

  it("preserves existing shadow-root children and only manages its own placeholder root", function () {
    const rendererSpec = createRenderer();
    const committed = rendererSpec.createCommittedRenderer({});
    const mountHost = document.createElement("div");
    const styleA = document.createElement("style");
    styleA.id = "alarm-style-a";
    styleA.textContent = ".base {}";
    const styleB = document.createElement("style");
    styleB.id = "alarm-style-b";
    styleB.textContent = ".theme {}";

    mountHost.appendChild(styleA);
    mountHost.appendChild(styleB);

    committed.mount(mountHost, {});

    expect(mountHost.querySelector("#alarm-style-a")).toBe(styleA);
    expect(mountHost.querySelector("#alarm-style-b")).toBe(styleB);

    const placeholderRoot = mountHost.querySelector(".alarmWidget");
    expect(placeholderRoot).toBeTruthy();
    expect(mountHost.childNodes).toHaveLength(3);

    committed.detach();

    expect(mountHost.querySelector("#alarm-style-a")).toBe(styleA);
    expect(mountHost.querySelector("#alarm-style-b")).toBe(styleB);
    expect(mountHost.querySelector(".alarmWidget")).toBeNull();
    expect(mountHost.childNodes).toHaveLength(2);
  });
});
