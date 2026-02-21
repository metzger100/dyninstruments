function createMockContext2D(options) {
  const opts = options || {};
  const charWidth = Number.isFinite(opts.charWidth) ? opts.charWidth : 8;
  const calls = [];

  function rec(name, args) {
    calls.push({ name, args: Array.from(args || []) });
  }

  const ctx = {
    calls,
    fillStyle: "#000",
    strokeStyle: "#000",
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    textAlign: "left",
    textBaseline: "alphabetic",
    font: "10px sans-serif",
    save() { rec("save", arguments); },
    restore() { rec("restore", arguments); },
    beginPath() { rec("beginPath", arguments); },
    closePath() { rec("closePath", arguments); },
    arc() { rec("arc", arguments); },
    stroke() { rec("stroke", arguments); },
    fill() { rec("fill", arguments); },
    moveTo() { rec("moveTo", arguments); },
    lineTo() { rec("lineTo", arguments); },
    clearRect() { rec("clearRect", arguments); },
    fillRect() { rec("fillRect", arguments); },
    setTransform() { rec("setTransform", arguments); },
    setLineDash() { rec("setLineDash", arguments); },
    translate() { rec("translate", arguments); },
    rotate() { rec("rotate", arguments); },
    drawImage() { rec("drawImage", arguments); },
    fillText() { rec("fillText", arguments); },
    measureText(text) {
      rec("measureText", arguments);
      return { width: String(text || "").length * charWidth };
    }
  };

  return ctx;
}

function createMockCanvas(options) {
  const opts = options || {};
  const rectW = Number.isFinite(opts.rectWidth) ? opts.rectWidth : 320;
  const rectH = Number.isFinite(opts.rectHeight) ? opts.rectHeight : 180;
  const ctx = opts.ctx || createMockContext2D(opts);
  const ownerDocument = opts.ownerDocument || createMockOwnerDocument(opts);

  return {
    width: 0,
    height: 0,
    clientWidth: rectW,
    clientHeight: rectH,
    parentElement: null,
    __ctx: ctx,
    __dyniMarked: false,
    ownerDocument,
    getContext(type) {
      return type === "2d" ? ctx : null;
    },
    getBoundingClientRect() {
      return { width: rectW, height: rectH, top: 0, left: 0, right: rectW, bottom: rectH };
    },
    closest() {
      return null;
    }
  };
}

function createMockOwnerDocument(options) {
  const opts = options || {};
  const doc = {};
  doc.createElement = function (tagName) {
    if (String(tagName || "").toLowerCase() !== "canvas") {
      return { tagName: String(tagName || "").toUpperCase() };
    }
    const layerCtx = createMockContext2D(opts);
    return {
      width: 0,
      height: 0,
      parentElement: null,
      __ctx: layerCtx,
      __dyniMarked: false,
      ownerDocument: doc,
      getContext(type) {
        return type === "2d" ? layerCtx : null;
      },
      getBoundingClientRect() {
        const width = Number(this.width) || 0;
        const height = Number(this.height) || 0;
        return { width, height, top: 0, left: 0, right: width, bottom: height };
      },
      closest() {
        return null;
      }
    };
  };
  return doc;
}

module.exports = {
  createMockCanvas,
  createMockContext2D,
  createMockOwnerDocument
};
