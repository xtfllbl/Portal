(function () {
  "use strict";

  if (window.frameElement && window.frameElement.getAttribute("data-platform-shell") === "disabled") {
    if (document.body) document.body.classList.add("pw-platform-shell-bypassed");
    return;
  }

  var profileStoreKey = "paywizard.portalAccessProfile.v1";
  var sidebarCollapsedStoreKey = "paywizard.platformSidebarCollapsed.v1";
  var profiles = {
    wizarpos: { label: "WizarPOS Provider" },
    "full-service": { label: "Full-Service Provider" },
    attended: { label: "Attended Provider" },
    unattended: { label: "Unattended Provider" },
    "attended-merchant": { label: "Attended Merchant", merchant: true, terminal: "attended" },
    "unattended-merchant": { label: "Unattended Merchant", merchant: true, terminal: "unattended" },
    "attended-store": { label: "Attended Store", store: true, terminal: "attended" },
    "unattended-store": { label: "Unattended Store", store: true, terminal: "unattended" },
    "billing-merchant": { label: "Billing-only Merchant", merchant: true, billingOnly: true }
  };
  var activeProfile = readProfile();
  var sidebarInitiallyCollapsed = readSidebarCollapsed();
  var fileName = decodeURIComponent((window.location.pathname.split("/").pop() || "").split("?")[0]);
  var pageMap = {
    "42.billing_payments.html": page("body > main.payments-page", "billing-payments", "billing-payments", ["Billing & Payments"], []),
    "44.billing_overview.html": page("body > main.overview-page", "matintain", "billing-overview", ["Matintain", "Billing Overview"], []),
    "41.billing_setup.html": page("body > main.billing-page", "matintain", "billing-setup", ["Matintain", "Billing Setup"], []),
    "1.terminalmanage.html": page(".main-body > .workspace", "device", "attended-terminals", ["Device Management", "Attended Terminals"], ["body > .top-header", "body > .main-body"]),
    "1.terminalmanage_CardReader.html": page(".main-body > .workspace", "device", "card-readers", ["Device Management", "Card Readers"], ["body > .top-header", "body > .main-body"]),
    "1.terminalmanage_nayax.html": page(".main-body > .workspace", "device", "unattended-terminals", ["Device Management", "Unattended Terminals"], ["body > .top-header", "body > .main-body"]),
    "2.agent_list_iso.html": page(".app > main.main > .content", "agents", "agent-list", ["Agents", "Agent List"], ["body > .app"]),
    "2.agent_analytics.html": page("body > main.analytics-page", "agents", "agent-analytics", ["Agents", "Analytics"], []),
    "2.resellermerchantterminal.html": page(".main-container > .content-area", "device", "device-overview", ["Device Management", "Overview"], ["body > .top-header", "body > .main-body"]),
    "3.Processor_template_new.html": page(".main-content > main.page-content", "matintain", "application-parameters", ["Matintain", "Application Parameters"], ["body > .sidebar", "body > .main-content"]),
    "3.version_provider_assign.html": page("body > main.page", "matintain", "application-parameters", ["Matintain", "Application Parameters", "Assign Service Providers"], []),
    "5.merchant_add_device_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "Add Device"], ["body > .page-shell"]),
    "5.merchant_add_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "New Merchant Onboarding"], ["body > .page-shell"]),
    "5.merchant_add_merchant_only_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "Add Merchant"], ["body > .page-shell"]),
    "5.merchant_detail_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "Merchant Overview"], ["body > .page-shell"]),
    "5.merchant_detail_no_store_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "Merchant Overview"], ["body > .page-shell"]),
    "5.merchant_device_settings_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List", "Device Settings"], ["body > .page-shell"]),
    "5.merchant_manage_iso.html": page(".main-container > .content-area", "merchants", "merchant-list", ["Merchants", "Merchant List"], ["body > .page-shell"]),
    "6.edit_application_parameters.html": page(".main-content > main.page-content", "matintain", "application-parameters", ["Matintain", "Application Parameters", "Edit Application Parameters"], ["body > .sidebar", "body > .main-content"]),
    "7.merchant_contact.html": page(".app-shell > main.workspace > .page-card", "merchants", "contact", ["Merchants", "Contact"], ["body > .app-shell"]),
    "8.splitbill.html": page("body > .min-h-screen > .flex-1 > section", "merchants", "split-rules", ["Merchants", "Split Rules"], ["body > .min-h-screen"]),
    "8.merchant_analytics.html": page("body > main.analytics-page", "merchants", "merchant-analytics", ["Merchants", "Analytics"], []),
    "9.trans.html": page(".app > section.main > main.content", "transactions", "transactions", ["Transactions"], ["body > .app"]),
    "10.customer_app_upload_manage.html": page(".main-body > .workspace", "apps", "apps", ["APP Management"], ["body > .top-header", "body > .main-body"]),
    "11.transaction_detail_redesign.html": page(".shell > .work", "transactions", "transactions", ["Transactions", "Transaction Details"], ["body > .top", "body > .shell"]),
    "12.transaction_list.html": page(".app > section.main > main.panel", "transactions", "transactions", ["Transactions"], ["body > .app"]),
    "13.remote_control.html": page(".main-container > main.content-area", "remote", "remote", ["Remote Diagnostic"], ["body > .page-shell"]),
    "14.prepaid_card_list.html": page(".main-container > .content-area", "prepaid", "prepaid-card-list", ["Prepaid Cards", "Card List"], ["body > .page-shell"]),
    "15.prepaid_card_activation.html": page(".main-container > .content-area", "prepaid", "prepaid-activation", ["Prepaid Cards", "Activation"], ["body > .page-shell"]),
    "16.prepaid_credit_adjustment.html": page(".main-container > .content-area", "prepaid", "prepaid-balance-adjustment", ["Prepaid Cards", "Balance Adjustment"], ["body > .page-shell"]),
    "17.prepaid_loss_replacement.html": page(".main-container > .content-area", "prepaid", "prepaid-loss-replacement", ["Prepaid Cards", "Loss & Replacement"], ["body > .page-shell"]),
    "19.prepaid_card_detail.html": page(".main-container > .content-area", "prepaid", "prepaid-card-list", ["Prepaid Cards", "Card List", "Card Details"], ["body > .page-shell"]),
    "20.provider_custom_email_service.html": page(".page-shell > main.content-panel", "settings", "branding", ["Settings", "Branding"], ["body > .page-shell"]),
    "21.service_provider.html": page(".page-shell > main.content-panel", "matintain", "service-providers", ["Matintain", "Service Providers"], ["body > .page-shell"]),
    "22.sp_payment_channel_setting.html": page(".page-shell > main.content-panel", "matintain", "service-providers", ["Matintain", "Service Providers", "SP Payment Channel Setting"], ["body > .page-shell"]),
    "23.payment_channel_setting.html": page(".page-shell > main.content-panel", "settings", "payment-channels", ["Settings", "Payment Channels"], ["body > .page-shell"]),
    "23.payment_channel_setting_v2.html": page("body > main.payment-channel-v2", "merchants", "merchant-list", ["Merchants", "Merchant List", "Merchant Overview", "Payment Channels"], []),
    "23.sp_merchant_list.html": page(".page-shell > main.content-panel", "matintain", "service-providers", ["Matintain", "Service Providers", "Merchant List"], ["body > .page-shell"]),
    "24.maintain_terminal_log.html": page(".app > section.main > main.panel", "device", "terminal", ["Device Management", "Terminal Logs"], ["body > .app"]),
    "26.partner_information.html": page(".app > main.main > .content-area", "partners", "partners", ["Partners", "Partner List"], ["body > .app"]),
    "27.Merchant_onboard_elavon.html": page(".app-main > main.content", "merchants", "onboarding", ["Merchants", "Onboarding", "Elavon Merchant Registration"], ["body > .sidebar", "body > .app-main"]),
    "27.Merchant_onboard_nuvei.html": page(".app-main > main.content", "merchants", "onboarding", ["Merchants", "Onboarding", "Nuvei Merchant Registration"], ["body > .sidebar", "body > .app-main"]),
    "28.INTL_PSP_merchant_lead_detail.html": page(".layout > main.workspace > .page", "merchants", "leads", ["Merchants", "Leads", "INTL PSP Merchant Information"], ["body > .layout"]),
    "28.UPT_merchant_lead_detail.html": page(".pw-app-frame > main.pw-workspace > .pw-content-panel", "merchants", "leads", ["Merchants", "Leads", "Merchant Information"], ["body > .pw-app-frame"]),
    "29.INTL_PSP_merchant_lead_list.html": page(".layout > main.workspace > .panel", "merchants", "leads", ["Merchants", "Leads"], ["body > .layout"]),
    "32.sla_alert_rules.html": page(".page-shell > main.content-panel", "matintain", "sla-alerts", ["Matintain", "SLA Alerts"], ["body > .page-shell"]),
    "34.card_reader_management.html": page(".main-body > .workspace", "device", "card-readers", ["Device Management", "Card Readers"], ["body > .top-header", "body > .main-body"]),
    "35.product_management.html": page(".shell > main.content", "settings", "products", ["Settings", "Products"], ["body > .shell"]),
    "36.product_map_templates.html": page(".shell > main.content", "settings", "product-map-templates", ["Settings", "Product Map Templates"], ["body > .shell"]),
    "37.pick_list.html": page(".shell > main.content", "device", "unattended-terminals", ["Device Management", "Unattended Terminals", "Pick List"], ["body > .shell"]),
    "38.Merchant_onboard.html": page(".app-frame > .workspace > main.panel", "merchants", "onboarding", ["Merchants", "Onboarding"], ["body > .app-frame"]),
    "39.customer_alerts.html": page(".alerts-app-frame > .alerts-workspace > main.alerts-panel", "settings", "alerts", ["Settings", "Alerts"], ["body > .alerts-app-frame"]),
    "40.notifications.html": page(".app-frame > .workspace > main.panel", "notifications", "notifications", ["Notifications"], ["body > .app-frame"])
  };

  var config = pageMap[fileName];
  if (!config || !document.body) return;

  function readProfile() {
    try {
      var stored = localStorage.getItem(profileStoreKey);
      return profiles[stored] ? stored : "wizarpos";
    } catch (_) {
      return "wizarpos";
    }
  }

  function readSidebarCollapsed() {
    try { return localStorage.getItem(sidebarCollapsedStoreKey) === "true"; }
    catch (_) { return false; }
  }

  function terminalProfile(profile) {
    return profiles[profile].terminal || profile;
  }

  function fallbackFor(targetFile, profile) {
    var target = pageMap[targetFile];
    if (profiles[profile].billingOnly) return targetFile === "42.billing_payments.html" ? "" : "42.billing_payments.html";
    if (!target) return "12.transaction_list.html";
    if (target.module === "matintain" && profile !== "wizarpos") return "12.transaction_list.html";
    if (target.active === "billing-payments" && !profiles[profile].merchant) return "12.transaction_list.html";
    if (profiles[profile].merchant) {
      var merchantPages = ["5.merchant_detail_iso.html", "5.merchant_detail_no_store_iso.html", "5.merchant_add_device_iso.html", "5.merchant_device_settings_iso.html", "23.payment_channel_setting_v2.html"];
      if (target.module === "merchants" && !merchantPages.includes(targetFile)) return "5.merchant_detail_iso.html";
      if (target.module === "settings" && target.active !== "branding") return "12.transaction_list.html";
      if (!["transactions", "merchants", "billing-payments", "device", "remote", "settings", "notifications"].includes(target.module)) return "12.transaction_list.html";
    }
    if (profiles[profile].store && !["transactions", "device", "notifications"].includes(target.module)) return "12.transaction_list.html";
    profile = terminalProfile(profile);
    if (profile === "attended" && ["products", "product-map-templates"].includes(target.active)) return "12.transaction_list.html";
    if (profile !== "wizarpos" && (target.module === "partners" || ["contact", "leads", "onboarding"].includes(target.active))) {
      return "5.merchant_manage_iso.html";
    }
    if (target.active === "split-rules") return "5.merchant_manage_iso.html";
    if (profile === "attended" && target.module === "prepaid") return "2.resellermerchantterminal.html";
    if (profile !== "wizarpos" && target.active === "sla-alerts") return "12.transaction_list.html";
    if (profile === "attended" && target.active === "alerts") return "12.transaction_list.html";
    if (profile !== "wizarpos" && ["1.terminalmanage_CardReader.html", "34.card_reader_management.html"].includes(targetFile)) {
      return profile === "attended" ? "1.terminalmanage.html" : "1.terminalmanage_nayax.html";
    }
    if (profile === "attended" && ["1.terminalmanage_nayax.html", "37.pick_list.html"].includes(targetFile)) return "1.terminalmanage.html";
    if (profile === "unattended" && targetFile === "1.terminalmanage.html") return "1.terminalmanage_nayax.html";
    return "";
  }

  var initialFallback = fallbackFor(fileName, activeProfile);
  if (initialFallback && initialFallback !== fileName) {
    window.location.replace(initialFallback);
    return;
  }

  window.PaywizardPortalAccess = {
    profile: activeProfile,
    label: profiles[activeProfile].label,
    terminalHref: function (kind) {
      if (terminalProfile(activeProfile) === "attended") return "1.terminalmanage.html";
      if (terminalProfile(activeProfile) === "unattended") return "1.terminalmanage_nayax.html";
      if (kind === "unattended") return "1.terminalmanage_nayax.html";
      if (kind === "card-reader") return "1.terminalmanage_CardReader.html";
      return "1.terminalmanage.html";
    }
  };

  var selfGutteredPages = new Set([
    "1.terminalmanage.html",
    "1.terminalmanage_CardReader.html",
    "1.terminalmanage_nayax.html"
  ]);
  var panelPages = new Set([
    "44.billing_overview.html",
    "42.billing_payments.html",
    "41.billing_setup.html",
    "2.agent_list_iso.html",
    "2.agent_analytics.html",
    "3.Processor_template_new.html",
    "6.edit_application_parameters.html",
    "7.merchant_contact.html",
    "8.splitbill.html",
    "8.merchant_analytics.html",
    "12.transaction_list.html",
    "20.provider_custom_email_service.html",
    "21.service_provider.html",
    "22.sp_payment_channel_setting.html",
    "23.payment_channel_setting.html",
    "23.payment_channel_setting_v2.html",
    "23.sp_merchant_list.html",
    "24.maintain_terminal_log.html",
    "28.UPT_merchant_lead_detail.html",
    "29.INTL_PSP_merchant_lead_list.html",
    "35.product_management.html",
    "36.product_map_templates.html",
    "37.pick_list.html",
    "38.Merchant_onboard.html",
    "39.customer_alerts.html",
    "40.notifications.html"
  ]);
  var layoutMode = selfGutteredPages.has(fileName)
    ? "self-guttered"
    : panelPages.has(fileName) ? "panel" : "canvas";

  function page(source, module, active, breadcrumb, remove) {
    return { source: source, module: module, active: active, breadcrumb: breadcrumb, remove: remove };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function link(label, href, icon, key) {
    var active = config.active === key;
    return '<a class="pw-platform-menu-item pw-menu-item menu-item' + (active ? ' active' : '') + '" href="' + href + '" data-pw-nav-label="' + escapeHtml(label) + '"' +
      (active ? ' aria-current="page"' : '') + '><span class="pw-platform-menu-main"><span class="material-symbols-rounded" aria-hidden="true">' +
      icon + '</span><span class="pw-platform-menu-label">' + label + '</span></span></a>';
  }

  function disabled(label, icon) {
    return '<span class="pw-platform-disabled pw-menu-item menu-item" aria-disabled="true" data-pw-nav-label="' + escapeHtml(label) + '"><span class="pw-platform-menu-main"><span class="material-symbols-rounded" aria-hidden="true">' +
      icon + '</span><span class="pw-platform-menu-label">' + label + '</span></span></span>';
  }

  function unavailableSub(label) {
    return '<span class="pw-platform-sub-item pw-platform-unavailable-sub pw-sub-item sub-item" aria-disabled="true">' + label + '</span>';
  }

  function sub(label, href, key) {
    var active = config.active === key;
    return '<a class="pw-platform-sub-item pw-sub-item sub-item' + (active ? ' active' : '') + '" href="' + href + '"' +
      (key === "alerts" ? ' data-key="settings-alerts" data-link="39.customer_alerts.html"' : '') +
      (active ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }

  function group(label, icon, name, items) {
    var active = config.module === name;
    var open = active;
    return '<button class="pw-platform-menu-toggle pw-menu-item menu-item' + (active ? ' active' : '') + '" type="button" data-pw-menu-toggle="' + name + '" data-target="' + name + '" data-pw-nav-label="' + escapeHtml(label) +
      '" aria-expanded="' + String(open) + '"><span class="pw-platform-menu-main"><span class="material-symbols-rounded" aria-hidden="true">' +
      icon + '</span><span class="pw-platform-menu-label">' + label + '</span></span><span class="material-symbols-rounded pw-platform-menu-arrow" aria-hidden="true">expand_more</span></button>' +
      '<div class="pw-platform-sub-menu" data-pw-menu="' + name + '"' + (open ? '' : ' hidden') + '>' + items + '</div>';
  }

  function buildNavigation() {
    var isWizarpos = activeProfile === "wizarpos";
    var isMerchant = profiles[activeProfile].merchant;
    if (profiles[activeProfile].billingOnly) return link("Billing & Payments", "42.billing_payments.html", "receipt_long", "billing-payments");
    var merchantItems = [
      isWizarpos ? sub("Contact", "7.merchant_contact.html", "contact") : "",
      isWizarpos ? sub("Leads", "29.INTL_PSP_merchant_lead_list.html", "leads") : "",
      isWizarpos ? sub("Onboarding", "38.Merchant_onboard.html", "onboarding") : "",
      sub("Merchant List", "5.merchant_manage_iso.html", "merchant-list"),
      sub("Analytics", "8.merchant_analytics.html", "merchant-analytics")
    ].join("");
    var agentItems = [
      sub("Agent List", "2.agent_list_iso.html", "agent-list"),
      sub("Analytics", "2.agent_analytics.html", "agent-analytics")
    ].join("");
    var deviceItems = [
      terminalProfile(activeProfile) !== "unattended" ? sub("Attended Terminals", "1.terminalmanage.html", "attended-terminals") : "",
      terminalProfile(activeProfile) !== "attended" ? sub("Unattended Terminals", "1.terminalmanage_nayax.html", "unattended-terminals") : "",
      isWizarpos ? sub("Card Readers", "1.terminalmanage_CardReader.html", "card-readers") : ""
    ].join("");
    var prepaidItems = [
      sub("Card List", "14.prepaid_card_list.html", "prepaid-card-list"),
      sub("Activation", "15.prepaid_card_activation.html", "prepaid-activation"),
      sub("Balance Adjustment", "16.prepaid_credit_adjustment.html", "prepaid-balance-adjustment"),
      sub("Loss & Replacement", "17.prepaid_loss_replacement.html", "prepaid-loss-replacement")
    ].join("");
    var userItems = [
      unavailableSub("User List"),
      unavailableSub("Role Management"),
      unavailableSub("Appeals")
    ].join("");
    var settingsItems = [
      terminalProfile(activeProfile) !== "attended" ? sub("Alerts", "39.customer_alerts.html", "alerts") : "",
      sub("Branding", "20.provider_custom_email_service.html", "branding"),
      terminalProfile(activeProfile) !== "attended" ? sub("Products", "35.product_management.html", "products") : "",
      terminalProfile(activeProfile) !== "attended" ? sub("Product Map Templates", "36.product_map_templates.html", "product-map-templates") : ""
    ].join("");
    if (isMerchant) {
      userItems = unavailableSub("User List") + unavailableSub("Role Permissions");
      settingsItems = sub("Branding", "20.provider_custom_email_service.html", "branding");
    }
    var deviceActive = config.module === "device";
    var deviceOpen = deviceActive;
    var device = '<div class="pw-platform-menu-row' + (deviceActive ? ' active' : '') + '">' +
      '<a class="pw-platform-menu-link" href="2.resellermerchantterminal.html" data-pw-nav-label="Device Management"' + (config.active === "device-overview" ? ' aria-current="page"' : '') + '>' +
      '<span class="pw-platform-menu-main"><span class="material-symbols-rounded" aria-hidden="true">devices</span><span class="pw-platform-menu-label">Device Management</span></span></a>' +
      '<button class="pw-platform-device-toggle" type="button" data-pw-menu-toggle="device" aria-label="Toggle Device Management menu" aria-expanded="' + String(deviceOpen) + '">' +
      '<span class="material-symbols-rounded pw-platform-menu-arrow" aria-hidden="true">expand_more</span></button></div>' +
      '<div class="pw-platform-sub-menu" data-pw-menu="device"' + (deviceOpen ? '' : ' hidden') + '>' + deviceItems + '</div>';

    if (profiles[activeProfile].store) return [
      disabled("Dashboard", "dashboard"),
      link("Transactions", "12.transaction_list.html", "credit_card", "transactions"),
      device,
      group("User Management", "manage_accounts", "users", unavailableSub("User List") + unavailableSub("Role Permissions"))
    ].join("");

    return [
      disabled("Dashboard", "dashboard"),
      link("Transactions", "12.transaction_list.html", "credit_card", "transactions"),
      !isMerchant ? group("Agents", "group", "agents", agentItems) : "",
      isMerchant ? link("Merchant", "5.merchant_detail_iso.html", "store", "merchant-list") : group("Merchants", "store", "merchants", merchantItems),
      isMerchant ? link("Billing & Payments", "42.billing_payments.html", "receipt_long", "billing-payments") : "",
      isWizarpos ? group("Partners", "lightbulb", "partners", sub("Partner List", "26.partner_information.html", "partners")) : "",
      device,
      !isMerchant ? link("APP Management", "10.customer_app_upload_manage.html", "apps", "apps") : "",
      link("Remote Diagnostic", "13.remote_control.html", "cast_connected", "remote"),
      !isMerchant && terminalProfile(activeProfile) !== "attended" ? group("Prepaid Cards", "redeem", "prepaid", prepaidItems) : "",
      group("User Management", "manage_accounts", "users", userItems),
      group("Settings", "settings", "settings", settingsItems),
      isWizarpos ? group("Matintain", "build", "matintain", sub("Billing Setup", "41.billing_setup.html", "billing-setup") + sub("Billing Overview", "44.billing_overview.html", "billing-overview") + sub("SLA Alerts", "32.sla_alert_rules.html", "sla-alerts") + sub("Service Providers", "21.service_provider.html", "service-providers") + sub("Application Parameters", "3.Processor_template_new.html", "application-parameters")) : "",
      disabled("Tickets", "support_agent"),
      isMerchant ? group("Developer Center", "code_blocks", "developer", unavailableSub("Document Center")) : disabled("Developer Center", "code_blocks")
    ].join("");
  }

  var breadcrumbTargets = {
    "Billing Setup": "41.billing_setup.html",
    "Transactions": "12.transaction_list.html",
    "Agents": "2.agent_list_iso.html",
    "Agent List": "2.agent_list_iso.html",
    "Merchants": "5.merchant_manage_iso.html",
    "Contact": "7.merchant_contact.html",
    "Leads": "29.INTL_PSP_merchant_lead_list.html",
    "Onboarding": "38.Merchant_onboard.html",
    "Merchant List": "5.merchant_manage_iso.html",
    "Analytics": config.module === "agents" ? "2.agent_analytics.html" : "8.merchant_analytics.html",
    "Device Management": "2.resellermerchantterminal.html",
    "Attended Terminals": "1.terminalmanage.html",
    "Unattended Terminals": "1.terminalmanage_nayax.html",
    "Card Readers": "1.terminalmanage_CardReader.html",
    "Partners": "26.partner_information.html",
    "Partner List": "26.partner_information.html",
    "APP Management": "10.customer_app_upload_manage.html",
    "Remote Diagnostic": "13.remote_control.html",
    "Prepaid Cards": "14.prepaid_card_list.html",
    "Card List": "14.prepaid_card_list.html",
    "Activation": "15.prepaid_card_activation.html",
    "Balance Adjustment": "16.prepaid_credit_adjustment.html",
    "Loss & Replacement": "17.prepaid_loss_replacement.html",
    "Settings": "39.customer_alerts.html",
    "SLA Alerts": "32.sla_alert_rules.html",
    "Alerts": "39.customer_alerts.html",
    "Branding": "20.provider_custom_email_service.html",
    "Service Providers": "21.service_provider.html",
    "Payment Channels": "23.payment_channel_setting.html",
    "Application Parameters": "3.Processor_template_new.html",
    "Products": "35.product_management.html",
    "Product Map Templates": "36.product_map_templates.html"
  };

  function buildBreadcrumb() {
    var crumbs = config.breadcrumb;
    if (profiles[activeProfile].merchant && config.module === "merchants") {
      crumbs = ["Merchant"].concat(config.breadcrumb.slice(3));
    }
    return crumbs.map(function (label, index) {
      var isCurrent = index === crumbs.length - 1;
      var item = isCurrent || !breadcrumbTargets[label]
        ? '<strong>' + escapeHtml(label) + '</strong>'
        : '<a href="' + breadcrumbTargets[label] + '">' + escapeHtml(label) + '</a>';
      return (index ? '<span class="material-symbols-rounded" aria-hidden="true">chevron_right</span>' : '') + item;
    }).join("");
  }

  function buildProfileOptions() {
    var groups = [
      { name: "WizarPOS", kind: "platform", keys: ["wizarpos", "full-service", "billing-merchant"] },
      { name: "Unattended", kind: "unattended", keys: ["unattended", "unattended-merchant", "unattended-store"] },
      { name: "Attended", kind: "attended", keys: ["attended", "attended-merchant", "attended-store"] }
    ];
    var icons = {
      platform: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      attended: '<rect x="7" y="3.5" width="10" height="17" rx="2"/><rect x="9.5" y="6" width="5" height="3.4" rx=".7"/><circle cx="12" cy="16.3" r="1"/>',
      unattended: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8" y="6" width="5" height="8" rx="1"/><path d="M16 7v3M8 18h8"/>',
      full: '<rect x="2" y="5" width="8" height="15" rx="1.5"/><path d="M5 8h2M5 16h2"/><rect x="13" y="3" width="9" height="18" rx="1.5"/><path d="M16 6h3v7h-3zM16 17h3"/>',
      billing: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 7h6M9 11h6M9 15h3"/>'
    };
    return '<div class="pw-platform-profile-grid">' + groups.map(function (group) {
      return '<div class="pw-platform-profile-column" role="group" aria-label="' + group.name + '">' + group.keys.map(function (key) {
        var kind = key === "billing-merchant" ? "billing" : key === "full-service" ? "full" : group.kind;
        return '<button class="pw-platform-profile-option' + (key === activeProfile ? ' active' : '') + '" type="button" role="menuitemradio" aria-checked="' + String(key === activeProfile) + '" data-pw-profile="' + key + '">' +
          '<span class="pw-profile-icon ' + kind + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[kind] + '</svg></span>' +
          '<span class="pw-profile-option-label">' + escapeHtml(profiles[key].label) + '</span><span class="material-symbols-rounded pw-profile-check" aria-hidden="true">check</span></button>';
      }).join("") + '</div>';
    }).join("") + '</div>';
  }

  var source = document.querySelector(config.source);
  if (!source) {
    console.error("PAYwizard platform shell could not find content for", fileName, config.source);
    return;
  }

  [
    ".wizard-subtitle",
    ".review-subtitle",
    ".page-header > div > .page-subtitle",
    ".page-header > div > .page-sub",
    ".page-header > .page-subtitle",
    ".page-header > .page-sub",
    "#pageSubtitle.subtitle"
  ].forEach(function (selector) {
    source.querySelectorAll(selector).forEach(function (element) { element.remove(); });
  });

  var frame = document.createElement("div");
  frame.className = "pw-platform-frame pw-app-frame app-frame";
  frame.classList.toggle("pw-sidebar-collapsed", sidebarInitiallyCollapsed);
  frame.innerHTML = '<aside class="pw-platform-sidebar pw-sidebar sidebar" id="pw-platform-primary-navigation" aria-label="Primary navigation">' +
    '<div class="pw-platform-brand pw-brand"><span class="brand-mark"><img src="assets/paywizard-logo-sidebar.png" alt="PAYwizard"></span></div>' +
    '<nav class="pw-platform-nav pw-nav" aria-label="Main navigation">' + buildNavigation() + '</nav></aside>' +
    '<button class="pw-platform-sidebar-toggle" type="button" aria-controls="pw-platform-primary-navigation" aria-expanded="' + String(!sidebarInitiallyCollapsed) + '" aria-label="' + (sidebarInitiallyCollapsed ? 'Expand navigation' : 'Collapse navigation') + '">' +
    '<span class="material-symbols-rounded pw-platform-sidebar-toggle-icon" aria-hidden="true">' + (sidebarInitiallyCollapsed ? 'chevron_right' : 'chevron_left') + '</span></button>' +
    '<div class="pw-platform-workspace pw-workspace"><header class="pw-platform-topbar pw-topbar topbar">' +
    '<button class="pw-platform-mobile-menu" type="button" aria-label="Open navigation" aria-expanded="false"><span class="material-symbols-rounded" aria-hidden="true">menu</span></button>' +
    '<div class="pw-platform-breadcrumb pw-breadcrumb breadcrumb" aria-label="Breadcrumb">' + buildBreadcrumb() + '</div>' +
    '<div class="pw-platform-top-actions pw-top-actions top-actions">' +
    '<a class="pw-platform-round-btn" href="40.notifications.html" aria-label="Notifications"' + (config.active === "notifications" ? ' aria-current="page"' : '') + '>' +
    '<span class="material-symbols-rounded" aria-hidden="true">notifications_none</span><span class="pw-platform-notice-count notice-count pw-notice-count alerts-notice-count" data-shell-notification-count data-notification-count></span></a>' +
    '<details class="pw-platform-profile-control" data-pw-profile-control><summary class="pw-platform-profile-trigger" aria-label="Change portal access profile" aria-haspopup="menu" aria-expanded="false" data-pw-profile-trigger>' +
    '<span class="pw-platform-profile-label">' + escapeHtml(profiles[activeProfile].label) + '</span><span class="pw-platform-round-btn dark" aria-hidden="true"><span class="material-symbols-rounded">person</span></span></summary>' +
    '<div class="pw-platform-profile-menu" role="menu" aria-label="View portal as" data-pw-profile-menu><div class="pw-platform-profile-heading">View portal as</div>' + buildProfileOptions() + '</div></details>' +
    '</div></header><div class="pw-platform-content-host"></div></div>';

  var host = frame.querySelector(".pw-platform-content-host");
  host.classList.add("pw-layout-" + layoutMode);
  source.classList.add("pw-platform-content", "pw-flow-content");
  host.appendChild(source);

  config.remove.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (element) {
      if (element !== frame && !element.contains(source)) element.remove();
      else if (element !== frame && element !== source) element.remove();
    });
  });

  document.body.classList.add("pw-platform-admin");
  if (/^5\./.test(fileName)) document.body.classList.add("pw-admin", "pw-merchant-flow-page");
  document.body.insertBefore(frame, document.body.firstChild);

  window.paywizardBrandingReady = new Promise(function (resolve, reject) {
    var brandingScript = document.createElement('script');
    brandingScript.src = new URL('branding-store.js', document.currentScript.src).href;
    brandingScript.onload = function () { resolve(window.PaywizardBranding); };
    brandingScript.onerror = function () { reject(new Error('Unable to load logo settings.')); };
    document.head.appendChild(brandingScript);
  });
  window.paywizardBrandingReady.catch(function () { /* Branding must not block portal navigation. */ });

  if (fileName === "39.customer_alerts.html") {
    frame.classList.add("alerts-app-frame");
    frame.querySelector(".pw-platform-sidebar").classList.add("alerts-sidebar");
    frame.querySelector(".pw-platform-topbar").classList.add("alerts-topbar");
  }

  var overlay = document.createElement("button");
  overlay.className = "pw-platform-drawer-overlay";
  overlay.type = "button";
  overlay.setAttribute("aria-label", "Close navigation");
  document.body.appendChild(overlay);

  var sidebar = frame.querySelector(".pw-platform-sidebar");
  var sidebarToggle = frame.querySelector(".pw-platform-sidebar-toggle");
  var mobileButton = frame.querySelector(".pw-platform-mobile-menu");
  var sidebarScrollStoreKey = "paywizard.platformSidebarScrollTop.v1." + activeProfile;

  function restoreSidebarScrollPosition() {
    try {
      var savedPosition = Number(sessionStorage.getItem(sidebarScrollStoreKey));
      if (Number.isFinite(savedPosition) && savedPosition >= 0) sidebar.scrollTop = savedPosition;
    } catch (_) {}
  }

  requestAnimationFrame(function () {
    restoreSidebarScrollPosition();
    requestAnimationFrame(restoreSidebarScrollPosition);
  });

  function setDrawer(open) {
    sidebar.classList.toggle("is-open", open);
    overlay.classList.toggle("is-open", open);
    mobileButton.setAttribute("aria-expanded", String(open));
  }

  function usesCompactNavigation() {
    return (window.innerWidth >= 761 && window.innerWidth <= 1100) ||
      (window.innerWidth > 1100 && frame.classList.contains("pw-sidebar-collapsed"));
  }

  function syncNavigationTooltips() {
    var compact = usesCompactNavigation();
    frame.querySelectorAll("[data-pw-nav-label]").forEach(function (item) {
      if (compact) item.setAttribute("title", item.getAttribute("data-pw-nav-label"));
      else item.removeAttribute("title");
    });
  }

  function setSidebarCollapsed(collapsed, persist) {
    frame.classList.toggle("pw-sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
    sidebarToggle.querySelector(".material-symbols-rounded").textContent = collapsed ? "chevron_right" : "chevron_left";
    syncNavigationTooltips();
    if (persist) {
      try { localStorage.setItem(sidebarCollapsedStoreKey, String(collapsed)); } catch (_) {}
    }
  }

  setSidebarCollapsed(sidebarInitiallyCollapsed, false);
  sidebarToggle.addEventListener("click", function () {
    setSidebarCollapsed(!frame.classList.contains("pw-sidebar-collapsed"), true);
  });
  window.addEventListener("resize", syncNavigationTooltips);
  mobileButton.addEventListener("click", function () { setDrawer(!sidebar.classList.contains("is-open")); });
  overlay.addEventListener("click", function () { setDrawer(false); });
  sidebar.querySelectorAll("a").forEach(function (anchor) {
    anchor.addEventListener("click", function () {
      try { sessionStorage.setItem(sidebarScrollStoreKey, String(sidebar.scrollTop)); } catch (_) {}
      setDrawer(false);
    });
  });

  function setMenuOpen(button, menu, open) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    menu.getAnimations().forEach(function (animation) { animation.cancel(); });
    button.setAttribute("aria-expanded", String(open));
    if (reducedMotion || typeof menu.animate !== "function") {
      menu.hidden = !open;
      menu.removeAttribute("style");
      return;
    }

    if (open) menu.hidden = false;
    var startHeight = open ? 0 : menu.getBoundingClientRect().height;
    var endHeight = open ? menu.scrollHeight : 0;
    menu.style.overflow = "hidden";
    var animation = menu.animate([
      { height: startHeight + "px", opacity: open ? 0 : 1 },
      { height: endHeight + "px", opacity: open ? 1 : 0 }
    ], { duration: open ? 180 : 160, easing: "ease-out" });
    animation.onfinish = function () {
      if (button.getAttribute("aria-expanded") !== String(open)) return;
      menu.hidden = !open;
      menu.removeAttribute("style");
    };
  }

  function closeOtherMenus(currentButton) {
    frame.querySelectorAll("[data-pw-menu-toggle]").forEach(function (otherButton) {
      if (otherButton === currentButton || otherButton.getAttribute("aria-expanded") !== "true") return;
      var otherName = otherButton.getAttribute("data-pw-menu-toggle");
      setMenuOpen(otherButton, frame.querySelector('[data-pw-menu="' + otherName + '"]'), false);
    });
  }

  frame.querySelectorAll("[data-pw-menu-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var name = button.getAttribute("data-pw-menu-toggle");
      var menu = frame.querySelector('[data-pw-menu="' + name + '"]');
      if (window.innerWidth > 1100 && frame.classList.contains("pw-sidebar-collapsed")) {
        var firstDestination = menu.querySelector("a[href]");
        if (firstDestination) {
          try { sessionStorage.setItem(sidebarScrollStoreKey, String(sidebar.scrollTop)); } catch (_) {}
          firstDestination.click();
          return;
        }
        setSidebarCollapsed(false, true);
        closeOtherMenus(button);
        setMenuOpen(button, menu, true);
        return;
      }
      var willOpen = button.getAttribute("aria-expanded") !== "true";
      if (willOpen) closeOtherMenus(button);
      setMenuOpen(button, menu, willOpen);
    });
  });

  var profileControl = frame.querySelector("[data-pw-profile-control]");
  var profileTrigger = frame.querySelector("[data-pw-profile-trigger]");
  var profileMenu = frame.querySelector("[data-pw-profile-menu]");
  function setProfileMenu(open) {
    profileControl.open = open;
    profileTrigger.setAttribute("aria-expanded", String(open));
  }
  profileControl.addEventListener("toggle", function () {
    profileTrigger.setAttribute("aria-expanded", String(profileControl.open));
  });
  profileMenu.addEventListener("click", function (event) {
    event.stopPropagation();
    var option = event.target.closest("[data-pw-profile]");
    if (!option) return;
    var nextProfile = option.getAttribute("data-pw-profile");
    if (!profiles[nextProfile]) return;
    var proceed = function () {
      try { localStorage.setItem(profileStoreKey, nextProfile); } catch (_) {}
      var fallback = fallbackFor(fileName, nextProfile);
      window.location.assign(fallback || window.location.href);
    };
    var request = new CustomEvent("pw:before-navigate", { cancelable: true, detail: { proceed: proceed } });
    if (document.dispatchEvent(request)) proceed();
  });
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".pw-platform-profile-control")) setProfileMenu(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setProfileMenu(false);
  });

  function currentUnreadCount() {
    var alertIds = ["i-mid-01", "i-mid-02", "i-mid-03", "i-lobby-01", "i-break-01", "i-boston-01", "i-lobby-02", "i-mid-04", "i-boston-02"];
    try {
      var alertState = JSON.parse(localStorage.getItem("paywizard.customerAlerts.v1") || "null");
      if (alertState && Array.isArray(alertState.incidents) && alertState.incidents.length) {
        alertIds = alertState.incidents.map(function (incident) { return String(incident.id); });
      }
    } catch (_) {}
    var ids = [];
    for (var leadIndex = 1; leadIndex <= 42; leadIndex += 1) ids.push("lead-" + String(leadIndex).padStart(2, "0"));
    for (var onboardingIndex = 1; onboardingIndex <= 10; onboardingIndex += 1) ids.push("onboarding-" + String(onboardingIndex).padStart(2, "0"));
    alertIds.forEach(function (id) { ids.push("alert-" + id); });
    var readIds = ["lead-01"];
    try {
      var notificationState = JSON.parse(localStorage.getItem("paywizard.notifications.v1") || "null");
      if (notificationState && Array.isArray(notificationState.readIds)) readIds = notificationState.readIds;
    } catch (_) {}
    var readSet = new Set(readIds);
    return ids.reduce(function (count, id) { return count + (readSet.has(id) ? 0 : 1); }, 0);
  }

  function refreshNotificationCount() {
    var count = currentUnreadCount();
    var badge = frame.querySelector("[data-shell-notification-count]");
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
  }
  refreshNotificationCount();
  window.addEventListener("storage", refreshNotificationCount);
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-mark-read], [data-mark-all-read]")) window.setTimeout(refreshNotificationCount, 0);
  });
  document.body.classList.add("pw-platform-shell-ready");
  var feedbackScript = document.createElement("script");
  feedbackScript.src = new URL("platform-ui-feedback.js", document.currentScript.src).href;
  document.body.appendChild(feedbackScript);
})();
