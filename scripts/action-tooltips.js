(function () {
  "use strict";

  var selector = [
    "[data-tooltip]",
    ".row-actions .action-btn[aria-label]",
    ".actions .action-btn[aria-label]",
    ".table-actions .table-action[aria-label]"
  ].join(",");
  var activeTarget = null;
  var tooltip = document.createElement("div");
  var style = document.createElement("style");

  style.textContent = [
    ".action-function-tooltip{position:fixed;z-index:10050;max-width:220px;padding:7px 10px;border-radius:6px;background:#202126;color:#fff;box-shadow:0 5px 14px rgba(15,23,42,.2);font-family:Poppins,Arial,sans-serif;font-size:11px;font-weight:600;line-height:1.25;letter-spacing:0;white-space:nowrap;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(2px);transition:opacity .12s ease,transform .12s ease,visibility .12s ease}",
    ".action-function-tooltip.is-visible{opacity:1;visibility:visible;transform:translateY(0)}",
    ".action-function-tooltip::after{content:\"\";position:absolute;left:50%;width:7px;height:7px;background:#202126;transform:translateX(-50%) rotate(45deg)}",
    ".action-function-tooltip[data-placement=\"top\"]::after{bottom:-3px}",
    ".action-function-tooltip[data-placement=\"bottom\"]::after{top:-3px}"
  ].join("");
  document.head.appendChild(style);

  tooltip.id = "action-function-tooltip";
  tooltip.className = "action-function-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  function resolveTarget(node) {
    return node && node.closest ? node.closest(selector) : null;
  }

  function getText(target) {
    return target.getAttribute("data-tooltip") || target.getAttribute("title") || target.getAttribute("aria-label") || "";
  }

  function positionTooltip(target) {
    var targetRect = target.getBoundingClientRect();
    var tipRect = tooltip.getBoundingClientRect();
    var gap = 8;
    var placement = "top";
    var top = targetRect.top - tipRect.height - gap;
    if (top < 8) {
      placement = "bottom";
      top = targetRect.bottom + gap;
    }
    var left = targetRect.left + (targetRect.width - tipRect.width) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    tooltip.dataset.placement = placement;
    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";
  }

  function show(target) {
    var text = getText(target);
    if (!text) return;
    if (target.hasAttribute("title")) {
      target.dataset.nativeTitle = target.getAttribute("title");
      target.removeAttribute("title");
    }
    activeTarget = target;
    tooltip.textContent = text;
    target.setAttribute("aria-describedby", tooltip.id);
    tooltip.classList.add("is-visible");
    positionTooltip(target);
  }

  function hide(target) {
    if (target && target !== activeTarget) return;
    if (activeTarget) activeTarget.removeAttribute("aria-describedby");
    activeTarget = null;
    tooltip.classList.remove("is-visible");
  }

  document.addEventListener("pointerover", function (event) {
    var target = resolveTarget(event.target);
    if (target && target !== activeTarget) show(target);
  });
  document.addEventListener("pointerout", function (event) {
    if (!activeTarget || activeTarget.contains(event.relatedTarget)) return;
    if (activeTarget.contains(event.target)) hide(activeTarget);
  });
  document.addEventListener("focusin", function (event) {
    var target = resolveTarget(event.target);
    if (target) show(target);
  });
  document.addEventListener("focusout", function (event) {
    if (activeTarget === event.target) hide(activeTarget);
  });
  window.addEventListener("scroll", function () {
    if (activeTarget && activeTarget.isConnected) positionTooltip(activeTarget);
  }, true);
  window.addEventListener("resize", function () {
    if (activeTarget && activeTarget.isConnected) positionTooltip(activeTarget);
  });
})();
