const {
  createModule,
  createSurfaceDom,
  makePayload,
  installGlobalCleanup
} = require("./HtmlSurfaceController.harness.js");

const {
  getBaseContractStyles,
  flushMicrotasks,
  setDocumentFonts,
  createDeferredFonts
} = require("./HtmlSurfaceController.harness.js");

module.exports = {
  createDeferredFonts,
  createModule,
  createSurfaceDom,
  flushMicrotasks,
  getBaseContractStyles,
  installGlobalCleanup,
  makePayload,
  setDocumentFonts
};
