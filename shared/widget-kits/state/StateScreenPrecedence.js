/**
 * Module: StateScreenPrecedence - Shared first-match precedence helper for widget state-screens
 * Documentation: documentation/shared/state-screens.md
 * Depends: none
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenPrecedence = factory(); }
}(this, function () {
  "use strict";

  function validateCandidate(candidate, index) {
    if (!candidate || typeof candidate !== "object") {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] must be an object");
    }
    if (typeof candidate.kind !== "string" || candidate.kind.trim() === "") {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] requires a non-empty kind");
    }
    if (!Object.prototype.hasOwnProperty.call(candidate, "when")) {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] requires a when field");
    }
  }

  function pickFirst(candidates) {
    if (typeof candidates === "undefined") {
      return "data";
    }
    if (!Array.isArray(candidates)) {
      throw new Error("StateScreenPrecedence.pickFirst: candidates must be an array");
    }

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      validateCandidate(candidate, i);
      if (candidate.when) {
        return candidate.kind;
      }
    }

    return "data";
  }

  function create() {
    return {
      id: "StateScreenPrecedence",
      pickFirst: pickFirst
    };
  }

  return {
    id: "StateScreenPrecedence",
    create: create
  };
}));
