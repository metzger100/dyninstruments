/**
 * Module: AlarmTextHtmlWidget - Placeholder HTML renderer for vessel alarm routing
 * Documentation: documentation/guides/add-new-html-kind.md
 * Depends: none
 */

(function (root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else { (root.DyniComponents = root.DyniComponents || {}).DyniAlarmTextHtmlWidget = factory(); }
}(this, function () {
  "use strict";

  function create() {
    function createCommittedRenderer() {
      let rootEl = null;

      function removeRoot() {
        if (rootEl && rootEl.parentNode) {
          rootEl.parentNode.removeChild(rootEl);
        }
        rootEl = null;
      }

      return {
        mount: function (mountHostEl) {
          removeRoot();
          if (!mountHostEl || !mountHostEl.ownerDocument || typeof mountHostEl.appendChild !== "function") {
            return;
          }
          rootEl = mountHostEl.ownerDocument.createElement("div");
          rootEl.className = "alarmWidget";
          mountHostEl.appendChild(rootEl);
        },
        update: function () {
        },
        postPatch: function () {},
        detach: function () {
          removeRoot();
        },
        destroy: function () {
          removeRoot();
        }
      };
    }

    return {
      id: "AlarmTextHtmlWidget",
      wantsHideNativeHead: true,
      createCommittedRenderer: createCommittedRenderer
    };
  }

  return { id: "AlarmTextHtmlWidget", create: create };
}));
