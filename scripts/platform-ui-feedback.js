(function () {
  "use strict";
  if (window.PaywizardUI) return;
  var activeRegions = new WeakMap();
  var activeButtons = new WeakMap();

  var revealDelay = 200;
  // Optional, repeatable visual preview; ordinary synchronous actions stay instant.
  var previewDelay = Math.min(5000, Math.max(0, Number(new URLSearchParams(location.search).get("uiDelay")) || 0));

  // The caller ends feedback when its operation finishes. Fast work never paints it.
  function loading(region, initial) {
    if (!region) return function () {};
    activeRegions.get(region)?.();
    var oldBusy = region.getAttribute("aria-busy");
    var overlay = document.createElement("div");
    overlay.className = initial ? "pw-ui-loading pw-ui-page-progress" : "pw-ui-loading pw-ui-refresh";
    overlay.setAttribute("role", "status");
    overlay.innerHTML = initial
      ? '<span class="pw-ui-sr-only">Loading content</span>'
      : '<span class="pw-ui-loading-label"><span class="pw-ui-spinner" aria-hidden="true"></span><span>Loading…</span></span>';
    region.setAttribute("aria-busy", "true");
    var timer = setTimeout(function () {
      region.classList.add("pw-ui-loading-region");
      if (!initial) region.classList.add("pw-ui-refreshing");
      region.appendChild(overlay);
    }, revealDelay);
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      overlay.remove();
      region.classList.remove("pw-ui-loading-region", "pw-ui-refreshing");
      if (oldBusy === null) region.removeAttribute("aria-busy");
      else region.setAttribute("aria-busy", oldBusy);
      activeRegions.delete(region);
    }
    activeRegions.set(region, finish);
    return finish;
  }

  function buttonFeedback(button) {
    if (!button) return function () {};
    activeButtons.get(button)?.();
    var oldBusy = button.getAttribute("aria-busy");
    button.setAttribute("aria-busy", "true");
    var spinner = document.createElement("span");
    spinner.className = "pw-ui-button-indicator";
    spinner.setAttribute("aria-hidden", "true");
    spinner.innerHTML = '<span class="pw-ui-spinner"></span>';
    var timer = setTimeout(function () {
      button.classList.add("pw-ui-button-busy");
      button.appendChild(spinner);
    }, revealDelay);
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      spinner.remove();
      button.classList.remove("pw-ui-button-busy");
      if (oldBusy === null) button.removeAttribute("aria-busy");
      else button.setAttribute("aria-busy", oldBusy);
      activeButtons.delete(button);
    }
    activeButtons.set(button, finish);
    return finish;
  }

  function settle(finish) {
    if (previewDelay) setTimeout(finish, previewDelay);
    else queueMicrotask(finish);
  }

  var toastRegion = document.createElement("div");
  toastRegion.className = "pw-ui-toasts";
  toastRegion.setAttribute("aria-live", "polite");
  toastRegion.setAttribute("aria-relevant", "additions");
  document.body.appendChild(toastRegion);
  function toast(message) {
    var item = document.createElement("div");
    item.className = "pw-ui-toast";
    var text = document.createElement("span");
    text.textContent = message;
    var close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Dismiss notification");
    close.textContent = "×";
    item.append(text, close);
    toastRegion.appendChild(item);
    var timer;
    function dismiss() { clearTimeout(timer); item.remove(); }
    function schedule() { clearTimeout(timer); timer = setTimeout(dismiss, 5000); }
    close.addEventListener("click", dismiss);
    item.addEventListener("mouseenter", function () { clearTimeout(timer); });
    item.addEventListener("mouseleave", schedule);
    item.addEventListener("focusin", function () { clearTimeout(timer); });
    item.addEventListener("focusout", schedule);
    schedule();
  }
  window.PaywizardUI = { loading: loading, buttonFeedback: buttonFeedback, toast: toast };

  var content = document.querySelector(".pw-platform-content");
  if (!content) return;
  var finishInitial = loading(content, true);
  if (document.readyState === "complete") settle(finishInitial);
  else window.addEventListener("load", function () { settle(finishInitial); }, { once: true });

  var file = decodeURIComponent(location.pathname.split("/").pop());
  var adapters = {
    "2.agent_list_iso.html": { buttons: "#doSearch, #resetSearch", region: ".table-wrap", inputs: "#searchName", dialog: "#createMask", close: "#closeCreate" },
    "10.customer_app_upload_manage.html": { buttons: "#applyFilter", region: ".table-wrap", dialog: "#updateModal" },
    "12.transaction_list.html": { buttons: "#searchBtn, #resetFilters, #prevPage, #nextPage, [data-page]", region: ".tablewrap .scroll", inputs: ".filterpanel input", changes: "#pageSize" }
  };
  var adapter = adapters[file];
  if (!adapter) return;
  function refresh(button) {
    var finishRegion = loading(content.querySelector(adapter.region), false);
    var finishButton = buttonFeedback(button);
    settle(function () { finishRegion(); finishButton(); });
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest(adapter.buttons);
    if (!button || button.disabled || button.getAttribute("aria-current") === "page") return;
    refresh(button);
  }, true);
  if (adapter.inputs) document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches(adapter.inputs)) {
      // Run after the page's own Enter handler, which may click its Search button.
      queueMicrotask(function () { refresh(); });
    }
  });
  if (adapter.changes) document.addEventListener("change", function (event) {
    if (event.target.matches(adapter.changes)) refresh();
  });

  var mask = adapter.dialog && document.querySelector(adapter.dialog);
  if (!mask) return;
  var dialog = mask.querySelector('[role="dialog"]') || mask;
  var lastOutside = null;
  var wasOpen = false;
  function isOpen() { return !mask.hidden && getComputedStyle(mask).display !== "none"; }
  function focusable() {
    return Array.from(dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')).filter(function (el) {
      return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0;
    });
  }
  document.addEventListener("focusin", function (event) {
    if (!mask.contains(event.target) && !isOpen()) lastOutside = event.target;
  });
  new MutationObserver(function () {
    var open = isOpen();
    if (open && !wasOpen) {
      if (!dialog.contains(document.activeElement)) {
        var input = focusable().find(function (el) { return el.matches("input:not([readonly]), select, textarea"); });
        (input || focusable()[0])?.focus();
      }
    } else if (!open && wasOpen && lastOutside?.isConnected) lastOutside.focus();
    wasOpen = open;
  }).observe(mask, { attributes: true, attributeFilter: ["hidden", "class", "aria-hidden"] });
  mask.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && adapter.close && isOpen()) {
      event.preventDefault();
      mask.querySelector(adapter.close)?.click();
      return;
    }
    if (event.key !== "Tab" || !isOpen()) return;
    var items = focusable();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
