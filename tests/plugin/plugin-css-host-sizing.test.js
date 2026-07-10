const fs = require("node:fs");
const path = require("node:path");

function extractRuleBody(cssText, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escapedSelector + "\\s*\\{([\\s\\S]*?)\\}");
  const match = cssText.match(pattern);
  return match ? match[1] : "";
}

function extractRuleBodies(cssText, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escapedSelector + "\\s*\\{([\\s\\S]*?)\\}", "g");
  const bodies = [];
  let match = pattern.exec(cssText);
  while (match) {
    bodies.push(match[1]);
    match = pattern.exec(cssText);
  }
  return bodies;
}

describe("plugin.css host sizing contract", function () {
  it("prevents host intrinsic width expansion on dyniplugin roots", function () {
    const cssPath = path.join(process.cwd(), "plugin.css");
    const cssText = fs.readFileSync(cssPath, "utf8");
    const ruleBodies = extractRuleBodies(cssText, ".widget.dyniplugin");
    const sizingBody = ruleBodies.find((body) =>
      new RegExp("min-width:\\s*0\\s*\\x3b").test(body) &&
      new RegExp("max-width:\\s*100%\\s*\\x3b").test(body));

    expect(sizingBody).toBeTruthy();
  });

  it("defines the horizontal dyniplugin baseline width rule", function () {
    const cssPath = path.join(process.cwd(), "plugin.css");
    const cssText = fs.readFileSync(cssPath, "utf8");
    const selector =
      ".widgetContainer.horizontal .widget.dyniplugin.horizontal";
    const ruleBody = extractRuleBody(cssText, selector);

    expect(ruleBody).toBeTruthy();
    expect(ruleBody).toMatch(new RegExp("width:\\s*7em\\s*\\x3b"));
    expect(ruleBody).toMatch(new RegExp("min-width:\\s*7em\\s*\\x3b"));
  });
});
