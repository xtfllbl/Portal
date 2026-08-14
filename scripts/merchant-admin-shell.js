(function () {
  "use strict";

  var body = document.body;
  if (!body) return;

  body.classList.add("pw-admin", "pw-merchant-flow-page");

  var frame = document.querySelector(".page-shell");
  var sidebar = document.querySelector(".sidebar");
  var workspace = document.querySelector(".main-container");
  var topbar = document.querySelector(".top-header");
  var content = document.querySelector(".content-area");

  if (frame) frame.classList.add("pw-app-frame");
  if (workspace) workspace.classList.add("pw-workspace");
  if (content) content.classList.add("pw-flow-content");

  if (sidebar) {
    sidebar.classList.add("pw-sidebar");
    sidebar.setAttribute("aria-label", "Primary navigation");
    sidebar.innerHTML = [
      '<a class="pw-brand" href="5.merchant_manage_iso.html" aria-label="PAYwizard Merchant List">',
      '  <span class="pw-brand-mark"><img src="assets/paywizard-logo.png" alt="PAYwizard"></span>',
      '  <span class="pw-brand-environment">SANDBOX</span>',
      '</a>',
      '<nav class="menu pw-nav" aria-label="Main navigation">',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">dashboard</span><span>Dashboard</span></span></a>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">credit_card</span><span>Transactions</span></span></a>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">group</span><span>Agents</span></span><span class="material-symbols-rounded pw-menu-arrow" aria-hidden="true">expand_more</span></a>',
      '  <div class="menu-item pw-menu-item active"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">store</span><span>Merchants</span></span><span class="material-symbols-rounded pw-menu-arrow" aria-hidden="true">expand_more</span></div>',
      '  <div class="sub-menu pw-sub-menu">',
      '    <a class="sub-item pw-sub-item" href="#">Contact</a>',
      '    <a class="sub-item pw-sub-item" href="29.INTL_PSP_merchant_lead_list.html">Leads</a>',
      '    <a class="sub-item pw-sub-item" href="38.Merchant_onboard.html">Onboarding</a>',
      '    <a class="sub-item pw-sub-item active" href="5.merchant_manage_iso.html" aria-current="page">Merchant List</a>',
      '    <a class="sub-item pw-sub-item" href="#">Analytics</a>',
      '  </div>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">lightbulb</span><span>Partners</span></span><span class="material-symbols-rounded pw-menu-arrow" aria-hidden="true">expand_more</span></a>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">devices</span><span>Device Management</span></span></a>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">apps</span><span>APP Management</span></span></a>',
      '  <a class="menu-item pw-menu-item" href="#"><span class="menu-main pw-menu-main"><span class="material-symbols-rounded" aria-hidden="true">cast_connected</span><span>Remote Diagnostic</span></span></a>',
      '</nav>'
    ].join("");
  }

  if (topbar) {
    var trail = String(body.getAttribute("data-pw-breadcrumb") || "Merchant List")
      .split("|")
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
    var breadcrumb = document.createElement("div");
    breadcrumb.className = "breadcrumbs pw-breadcrumb";
    trail.forEach(function (item, index) {
      if (index) {
        var separator = document.createElement("span");
        separator.className = "material-symbols-rounded";
        separator.setAttribute("aria-hidden", "true");
        separator.textContent = "chevron_right";
        breadcrumb.appendChild(separator);
      }
      if (index === trail.length - 1) {
        var current = document.createElement("strong");
        current.textContent = item;
        breadcrumb.appendChild(current);
      } else {
        var label = document.createElement("span");
        label.textContent = item;
        breadcrumb.appendChild(label);
      }
    });

    topbar.classList.add("pw-topbar");
    topbar.replaceChildren(breadcrumb);

    var actions = document.createElement("div");
    actions.className = "user-controls pw-top-actions";
    actions.innerHTML = [
      '<button class="icon-circle pw-round-btn" type="button" aria-label="Notifications"><span class="pw-notice-count">2</span><span class="material-symbols-rounded" aria-hidden="true">notifications</span></button>',
      '<button class="icon-circle pw-round-btn dark" type="button" aria-label="User"><span class="material-symbols-rounded" aria-hidden="true">person</span></button>'
    ].join("");
    topbar.appendChild(actions);
  }
})();
