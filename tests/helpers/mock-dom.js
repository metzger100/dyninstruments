function createDomHarness(options) {
  const opts = options || {};
  const failScriptIds = new Set(opts.failScriptIds || []);
  const failLinkIds = new Set(opts.failLinkIds || []);

  const elementsById = new Map();
  const appendedScripts = [];
  const appendedLinks = [];

  function schedule(cb) {
    Promise.resolve().then(cb);
  }

  function createElement(tagName) {
    const tag = String(tagName || "").toUpperCase();
    const attrs = new Map();

    const el = {
      tagName: tag,
      style: {},
      id: "",
      async: false,
      src: "",
      href: "",
      rel: "",
      onload: null,
      onerror: null,
      setAttribute(name, value) {
        const key = String(name);
        attrs.set(key, String(value));
        if (key === "id") this.id = String(value);
      },
      getAttribute(name) {
        const key = String(name);
        return attrs.has(key) ? attrs.get(key) : null;
      },
      hasAttribute(name) {
        return attrs.has(String(name));
      }
    };

    return el;
  }

  const head = {
    appendChild(node) {
      if (node && node.id) elementsById.set(node.id, node);

      if (node && node.tagName === "SCRIPT") {
        appendedScripts.push(node);
        schedule(function () {
          if (failScriptIds.has(node.id)) {
            if (typeof node.onerror === "function") node.onerror(new Error("script load failed: " + node.id));
            return;
          }
          if (typeof node.onload === "function") node.onload();
        });
      }

      if (node && node.tagName === "LINK") {
        appendedLinks.push(node);
        schedule(function () {
          if (failLinkIds.has(node.id)) {
            if (typeof node.onerror === "function") node.onerror(new Error("css load failed: " + node.id));
            return;
          }
          if (typeof node.onload === "function") node.onload();
        });
      }

      return node;
    }
  };

  const document = {
    head,
    createElement,
    getElementById(id) {
      return elementsById.get(String(id)) || null;
    }
  };

  return {
    document,
    elementsById,
    appendedScripts,
    appendedLinks
  };
}

module.exports = {
  createDomHarness
};
