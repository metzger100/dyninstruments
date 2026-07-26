const { loadFresh } = require("../../helpers/load-umd");

const { createComponentContextMock } = require("../../helpers/component-context-mock");

const EFFECT_STATE_KEY = "__dyniRoutePointsDomEffects";

afterEach(function () {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function createDomEffects() {
  const htmlWidgetUtils = loadFresh("shared/widget-kits/html/HtmlWidgetUtils.js");
  return loadFresh("shared/widget-kits/nav/RoutePointsDomEffects.js").create(
    {},
    createComponentContextMock({
      modules: {
        HtmlWidgetUtils: htmlWidgetUtils
      }
    })
  );
}

// @ts-ignore -- pre-existing untyped test mock boundary
function defineFixedMetric(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    get() {
      return value;
    }
  });
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createListRoot(rowCount) {
  const root = document.createElement("div");
  const list = document.createElement("div");
  list.className = "dyni-route-points-list";
  root.appendChild(list);

  defineFixedMetric(list, "clientHeight", 40);
  defineFixedMetric(list, "clientWidth", 96);
  defineFixedMetric(list, "offsetWidth", 112);

  for (let i = 0; i < rowCount; i += 1) {
    const row = document.createElement("div");
    row.setAttribute("data-rp-row", String(i));
    defineFixedMetric(row, "offsetTop", i * 20);
    defineFixedMetric(row, "offsetHeight", 20);
    list.appendChild(row);
  }

  document.body.appendChild(root);
  return { root, list };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function createHostContext(root) {
  return {
    __dyniHostCommitState: {
      rootEl: root,
      shellEl: null
    }
  };
}

// @ts-ignore -- pre-existing untyped test mock boundary
function runReveal(domEffects, hostContext, list, args) {
  const scheduled = domEffects.maybeRevealActiveRow(
    Object.assign(
      {
        hostContext: hostContext,
        rootEl: hostContext.__dyniHostCommitState.rootEl
      },
      args || {}
    )
  );
  vi.runAllTimers();
  return { scheduled, scrollTop: list.scrollTop };
}

module.exports = {
  createComponentContextMock,
  createDomEffects,
  createHostContext,
  createListRoot,
  defineFixedMetric,
  EFFECT_STATE_KEY,
  loadFresh,
  runReveal
};
