// @ts-nocheck
const { runPatternCheck, createWorkspace, joinMessages, joinWarningMessages } = require("./check-patterns.harness.js");
const failFastRuleCases = require("../../tools/test-data/check-patterns-failfast-cases.js");

describe("tools/check-patterns.mjs", function () {
  function reportMessages(result, severity) {
    return severity === "block" ? joinMessages(result.findings || []) : joinWarningMessages(result.warnings || []);
  }

  failFastRuleCases.forEach(function (testCase) {
    it(`${testCase.severity === "block" ? "blocks" : "warns"} for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.positive });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = reportMessages(result, testCase.severity);

      expect(result.summary.ok).toBe(testCase.severity !== "block");
      if (testCase.severity === "block") {
        expect(result.summary.byRuleFailures[testCase.rule]).toBeGreaterThan(0);
        expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      } else {
        expect(result.summary.byRuleWarnings[testCase.rule]).toBeGreaterThan(0);
        expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
      }
      expect(out).toContain(`[${testCase.rule}]`);
    });

    it(`does not report for clean ${testCase.rule} sample`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.clean });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

      expect(result.summary.byRuleWarnings[testCase.rule]).toBe(0);
      expect(result.summary.byRuleFailures[testCase.rule]).toBe(0);
    });

    it(`rejects generic disable-next-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableNextLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);

      expect(result.summary.ok).toBe(false);
      expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
      expect(out).toContain("[invalid-lint-suppression]");
    });

    it(`rejects generic disable-line for ${testCase.rule}`, function () {
      const cwd = createWorkspace({ [testCase.rel]: testCase.disableLine });
      const result = runPatternCheck({ root: cwd, warnMode: false, print: false });
      const out = joinMessages(result.findings);

      expect(result.summary.ok).toBe(false);
      expect(result.summary.byRuleFailures["invalid-lint-suppression"]).toBeGreaterThan(0);
      expect(out).toContain("[invalid-lint-suppression]");
    });
  });

  it("blocks computed, compound, and attribute-based HTML sinks", function () {
    const cwd = createWorkspace({
      "runtime/example.js": `
function patch(root, markup) {
  root["innerHTML"] = markup;
  root.outerHTML += markup;
  root["onclick"] = function () {};
  root.setAttribute("onclick", markup);
  root.onerror = function () {};
  root.setAttribute("onload", markup);
  document["write"](markup);
  root["inner" + "HTML"] = markup;
  root[\`out\${"erHTML"}\`] = markup;
  root["on" + "click"] = function () {};
  root.setAttribute("on" + "load", markup);
  document["wr" + "ite"](markup);
  const htmlSink = "innerHTML";
  const handlerName = "onclick";
  root[htmlSink] = markup;
  root.setAttribute(handlerName, markup);
}
patch({}, "<div></div>");
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["unsafe-html-dom-sink"]).toBe(14);
  });

  it("allows only the reviewed resource-loader event assignments", function () {
    const cwd = createWorkspace({
      "runtime/asset-preloader.js": `
function loadImage(img, root, markup) {
  img.onload = function () {};
  img.onerror = function () {};
  root.onerror = function () {};
  img.setAttribute("onload", markup);
  img.onload = function () {};
  function unrelated() { img.onerror = function () {}; }
  unrelated();
}
loadImage({}, {}, "code");
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["unsafe-html-dom-sink"]).toBe(4);
  });

  it("allows only the exact reviewed HtmlDomPatchUtils assignment targets", function () {
    const cwd = createWorkspace({
      "shared/widget-kits/html/HtmlDomPatchUtils.js": `
function patchInnerHtml(rootEl, template, markup, handler) {
  rootEl.innerHTML = markup;
  template.innerHTML = markup;
  rootEl.onclick = handler;
  template.outerHTML = markup;
  rootEl.innerHTML += markup;
  rootEl.innerHTML = markup;
}
patchInnerHtml({}, {}, "<div></div>", function () {});
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["unsafe-html-dom-sink"]).toBe(4);
  });

  it("blocks Infinity and numeric magic sentinels in mapper output", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  function translate(props, toolkit) {
    let lowerWarning = -999;
    if (props.enabled) lowerWarning = toolkit.num(props.lowerWarning);
    return {
      warningFrom: props.enabled ? toolkit.num(props.warningFrom) : -999,
      warningTo: Infinity,
      lowerWarning: lowerWarning,
      upperWarning: -999,
      lowerAlarm: -1,
      upperAlarm: 999
    };
  }
  return { translate: translate };
}());
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["absent-numeric-sentinel"]).toBe(6);
  });

  it("blocks numeric and string prop normalization in every renderer file", function () {
    const cwd = createWorkspace({
      "widgets/text/OtherTextWidget/OtherTextWidget.js": `
function buildModel(props, valueMath) {
  const p = props || {};
  return {
    value: valueMath.toOptionalFiniteNumber(p.value),
    caption: valueMath.trimText(p.caption),
    unit: String(p.unit),
    label: p.label.trim()
  };
}
buildModel({}, {});
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["mapper-prop-renormalization"]).toBe(4);
  });

  it("blocks aliased, destructured, and delegated mapper-prop normalization", function () {
    const cwd = createWorkspace({
      "widgets/text/AliasWidget/AliasWidget.js": `
function buildModel(props, valueMath, propsNormalize) {
  const display = props.display;
  const { caption } = props;
  return {
    value: valueMath.toFiniteNumber(display.value),
    caption: valueMath.trimText(caption),
    delegated: propsNormalize.normalize(props)
  };
}
buildModel({}, {}, {});
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["mapper-prop-renormalization"]).toBe(3);
  });

  it("allows ordinary zero-valued mapper counts", function () {
    const cwd = createWorkspace({
      "cluster/mappers/SampleMapper.js": `
(function () {
  function translate(route) {
    return { pointCount: route ? route.points.length : 0 };
  }
  return { translate: translate };
}());
`
    });
    const result = runPatternCheck({ root: cwd, warnMode: false, print: false });

    expect(result.summary.byRuleFailures["absent-numeric-sentinel"]).toBe(0);
  });
});
