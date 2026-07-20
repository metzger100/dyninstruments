/**
 * @file StateScreenPrecedence - Shared first-match precedence helper for widget state-screens
 * Documentation: documentation/shared/state-screens.md
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    (root.DyniComponents = root.DyniComponents || {}).DyniStateScreenPrecedence = factory();
  }
})(this, function () {
  "use strict";

  /** @param {unknown} candidate @param {number} index @returns {void} */
  function validateCandidate(candidate, index) {
    if (!candidate || typeof candidate !== "object") {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] must be an object");
    }
    const entry = /** @type {{ kind?: unknown, when?: unknown }} */ (candidate);
    if (typeof entry.kind !== "string" || entry.kind.trim() === "") {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] requires a non-empty kind");
    }
    if (!Object.prototype.hasOwnProperty.call(candidate, "when")) {
      throw new Error("StateScreenPrecedence.pickFirst: candidate[" + index + "] requires a when field");
    }
  }

  /** @param {unknown} candidates @returns {string} */
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

  /** @returns {DyniStateScreenPrecedenceApi} */
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
});
