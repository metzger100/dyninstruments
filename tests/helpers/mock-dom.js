function createDomHarness(options) {
  const opts = options || {};
  const failScriptIds = new Set(opts.failScriptIds || []);
  const failLinkIds = new Set(opts.failLinkIds || []);
  const shouldFailScript = typeof opts.shouldFailScript === "function" ? opts.shouldFailScript : null;
  const shouldFailLink = typeof opts.shouldFailLink === "function" ? opts.shouldFailLink : null;
  const onScriptAppended = typeof opts.onScriptAppended === "function" ? opts.onScriptAppended : null;
  const onLinkAppended = typeof opts.onLinkAppended === "function" ? opts.onLinkAppended : null;

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
      },
      remove() {
        if (this.parentNode && typeof this.parentNode.removeChild === "function") {
          this.parentNode.removeChild(this);
        }
      }
    };

    return el;
  }

  const head = {
    appendChild(node) {
      if (node && node.id) elementsById.set(node.id, node);
      if (node) node.parentNode = head;

      if (node && node.tagName === "SCRIPT") {
        appendedScripts.push(node);
        if (onScriptAppended) {
          onScriptAppended(node);
        }
        schedule(function () {
          if (failScriptIds.has(node.id) || (shouldFailScript && shouldFailScript(node))) {
            if (typeof node.onerror === "function") node.onerror(new Error("script load failed: " + node.id));
            return;
          }
          if (typeof node.onload === "function") node.onload();
        });
      }

      if (node && node.tagName === "LINK") {
        appendedLinks.push(node);
        if (onLinkAppended) {
          onLinkAppended(node);
        }
        schedule(function () {
          if (failLinkIds.has(node.id) || (shouldFailLink && shouldFailLink(node))) {
            if (typeof node.onerror === "function") node.onerror(new Error("css load failed: " + node.id));
            return;
          }
          if (typeof node.onload === "function") node.onload();
        });
      }

      return node;
    },
    removeChild(node) {
      if (node && node.id && elementsById.get(node.id) === node) {
        elementsById.delete(node.id);
      }
      if (node) node.parentNode = null;
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
