const fs = require("node:fs");
const path = require("node:path");

function extractRuleBody(cssText, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(escapedSelector + "\\s*\\{([\\s\\S]*?)\\}");
  const match = cssText.match(pattern);
  return match ? match[1] : "";
}

describe("plugin.css horizontal host sizing contract", function () {
  it("defines the horizontal dyniplugin baseline width rule", function () {
    const cssPath = path.join(process.cwd(), "plugin.css");
    const cssText = fs.readFileSync(cssPath, "utf8");
    const selector =
      ".widgetContainer.horizontal .widget.dyniplugin.horizontal";
    const ruleBody = extractRuleBody(cssText, selector);

    expect(ruleBody).toBeTruthy();
    expect(ruleBody).toMatch(new RegExp("width:\\s*7em\\s*\\x3b"));
  });
});
