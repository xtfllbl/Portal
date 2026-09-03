(function () {
  "use strict";

  const ALERT_STORAGE_KEY = "paywizard.customerAlerts.v1";
  const NOTIFICATION_STORAGE_KEY = "paywizard.notifications.v1";

  const conditionLabels = {
    opc_offline: "Payment Service Offline",
    no_approved_transaction: "No Approved Transaction",
    machine_stock: "Machine Stock Below % PAR",
    any_bin: "Any BIN Below Quantity",
    selected_product: "Selected Product / BIN Below % PAR",
    sold_out: "Sold Out",
    temperature_range: "Temperature Out of Range",
    refrigeration_fault: "Refrigeration Fault"
  };

  const fallbackAlertIncidents = [
    { id: "i-mid-01", condition: "opc_offline", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Payment Service unavailable for 18 minutes", opened: "2026-08-28 10:24" },
    { id: "i-mid-02", condition: "machine_stock", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "On Hand 18 / PAR 24 · 75%", opened: "2026-08-28 06:52" },
    { id: "i-mid-03", condition: "temperature_range", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "Temperature returned to 6.4 °C", opened: "2026-08-28 05:40" },
    { id: "i-lobby-01", condition: "any_bin", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "BIN A4 On Hand 1 · threshold 2", opened: "2026-08-28 06:10" },
    { id: "i-break-01", condition: "sold_out", terminalName: "Breakroom Cooler Q3", store: "Midtown Store", evidence: "BIN B2 has On Hand = 0", opened: "2026-08-28 07:45" },
    { id: "i-boston-01", condition: "refrigeration_fault", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "Normalized refrigeration fault is active", opened: "2026-08-28 09:12" },
    { id: "i-lobby-02", condition: "no_approved_transaction", terminalName: "Lobby Vending Q3", store: "Midtown Store", evidence: "No approved transaction for 2h 16m", opened: "2026-08-27 20:30" },
    { id: "i-mid-04", condition: "any_bin", terminalName: "Terminal - WP6267UQ36002376", store: "Midtown Store", evidence: "BIN B1 replenished to 6 units", opened: "2026-08-27 19:10" },
    { id: "i-boston-02", condition: "sold_out", terminalName: "Cafeteria Q3", store: "Boston Office", evidence: "All monitored BINs have stock", opened: "2026-08-27 21:04" }
  ];

  const leadNames = [
    "Taps Santiago Canteen", "TAPS", "FLYPARK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ", "Mr Larry", "Evendissimo", "IU Parking", "IVI Pte Ltd", "Daisy dream flowers", "Central Coffee Works", "North Shore Market", "Mosaic Retail Group", "Bridgeway Foods", "Urban Pantry", "Metro Vend Services"
  ];

  const onboardingNames = [
    "Aster Retail Group", "Bluebird Vending", "Coastal Market", "Daily Brew Coffee", "Evergreen Foods", "Fieldstone Services", "Golden Square", "Harbor Mini Mart", "Iconic Retail", "Junction Pantry"
  ];

  function pad(value) { return String(value).padStart(2, "0"); }

  function leadNotifications() {
    return Array.from({ length: 42 }, (_, index) => {
      const name = leadNames[index % leadNames.length];
      const normalized = new Date(Date.UTC(2026, 7, 29, 13, 54, 38) - index * 7 * 60 * 1000);
      return {
        id: `lead-${pad(index + 1)}`,
        category: "leads",
        source: "Merchant Lead",
        content: `New Potential Merchant: ${name}`,
        createdAt: `${normalized.getUTCFullYear()}-${pad(normalized.getUTCMonth() + 1)}-${pad(normalized.getUTCDate())} ${pad(normalized.getUTCHours())}:${pad(normalized.getUTCMinutes())}:${pad(normalized.getUTCSeconds())}`,
        detailUrl: `28.UPT_merchant_lead_detail.html?leadProcessId=${String(439 - index).padStart(8, "0")}`
      };
    });
  }

  function onboardingNotifications() {
    return onboardingNames.map((name, index) => ({
      id: `onboarding-${pad(index + 1)}`,
      category: "onboarding",
      source: "Merchant Onboarding",
      content: `${index % 3 === 0 ? "Application approved" : index % 3 === 1 ? "Application submitted" : "Application requires review"}: ${name}`,
      createdAt: `2026-08-${pad(27 - Math.floor(index / 4))} ${pad(16 - (index % 5))}:${pad(42 - index)}:${pad(15 + index)}`,
      detailUrl: "38.Merchant_onboard.html"
    }));
  }

  function readAlertIncidents() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY));
      if (parsed && Array.isArray(parsed.incidents) && parsed.incidents.length) return parsed.incidents;
    } catch (_) {}
    return fallbackAlertIncidents;
  }

  function alertNotifications() {
    return readAlertIncidents().map((incident) => ({
      id: `alert-${incident.id}`,
      category: "alerts",
      source: "Customer Alert",
      content: `${conditionLabels[incident.condition] || "Alert"}: ${incident.terminalName || incident.store || "Monitoring Target"} · ${incident.evidence || "Monitoring threshold reached"}`,
      createdAt: String(incident.opened || "2026-08-28 00:00").length === 16 ? `${incident.opened}:00` : String(incident.opened || "2026-08-28 00:00:00"),
      detailUrl: `39.customer_alerts.html?view=incidents&incident=${encodeURIComponent(incident.id)}`
    }));
  }

  function readNotificationState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY));
      if (parsed && Array.isArray(parsed.readIds)) return { readIds: parsed.readIds };
    } catch (_) {}
    return { readIds: ["lead-01"] };
  }

  let state = readNotificationState();
  let notifications = [];
  let activeCategory = "leads";
  let selectedIds = new Set();

  const rows = document.querySelector("[data-notification-rows]");
  const selectAll = document.querySelector("[data-select-all]");
  const markRead = document.querySelector("[data-mark-read]");
  const markAllRead = document.querySelector("[data-mark-all-read]");
  const refreshButton = document.querySelector("[data-refresh]");
  const count = document.querySelector("[data-notification-count]");
  const status = document.querySelector("[data-notification-status]");
  const tabs = Array.from(document.querySelectorAll("[data-category]"));

  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

  function writeNotificationState() {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify({ readIds: state.readIds }));
  }

  function refreshData() {
    notifications = [...leadNotifications(), ...alertNotifications(), ...onboardingNotifications()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  function visibleNotifications() {
    return activeCategory === "all" ? notifications : notifications.filter((item) => item.category === activeCategory);
  }

  function isRead(id) { return state.readIds.includes(id); }

  function categoryMeta(category) {
    if (category === "alerts") return { icon: "warning", className: "alerts" };
    if (category === "onboarding") return { icon: "person", className: "onboarding" };
    return { icon: "campaign", className: "leads" };
  }

  function renderRows() {
    const visible = visibleNotifications();
    rows.innerHTML = visible.length ? visible.map((item) => {
      const read = isRead(item.id);
      const meta = categoryMeta(item.category);
      return `<tr class="${read ? "is-read" : "is-unread"}" data-notification-id="${escapeHtml(item.id)}">
        <td><input type="checkbox" aria-label="Select ${escapeHtml(item.source)} notification" data-select-notification="${escapeHtml(item.id)}"${selectedIds.has(item.id) ? " checked" : ""}></td>
        <td><div class="source-cell"><span class="source-icon ${meta.className}"><span class="material-symbols-rounded" aria-hidden="true">${meta.icon}</span></span><span class="notification-source">${escapeHtml(item.source)}</span></div></td>
        <td><span class="notification-content" title="${escapeHtml(item.content)}">${escapeHtml(item.content)}</span></td>
        <td><span class="status-pill ${read ? "read" : "unread"}">${read ? "Read" : "Unread"}</span></td>
        <td class="date-cell">${escapeHtml(item.createdAt)}</td>
        <td><button class="detail-btn" type="button" data-detail="${escapeHtml(item.id)}">Detail</button></td>
      </tr>`;
    }).join("") : '<tr><td class="empty-cell" colspan="6">No notifications in this category.</td></tr>';
    syncControls();
  }

  function syncControls() {
    const visible = visibleNotifications();
    const selectedVisible = visible.filter((item) => selectedIds.has(item.id));
    selectAll.checked = visible.length > 0 && selectedVisible.length === visible.length;
    selectAll.indeterminate = selectedVisible.length > 0 && selectedVisible.length < visible.length;
    markRead.disabled = selectedVisible.length === 0;
    markAllRead.disabled = visible.length === 0 || visible.every((item) => isRead(item.id));
    const unreadCount = notifications.filter((item) => !isRead(item.id)).length;
    count.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    count.dataset.empty = String(unreadCount === 0);
  }

  function announce(message) { status.textContent = ""; requestAnimationFrame(() => { status.textContent = message; }); }

  function revealActiveTab() {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const activeTab = tabs.find((item) => item.dataset.category === activeCategory);
    activeTab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    activeCategory = tab.dataset.category;
    selectedIds.clear();
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    renderRows();
    revealActiveTab();
  }));

  selectAll.addEventListener("change", () => {
    visibleNotifications().forEach((item) => {
      if (selectAll.checked) selectedIds.add(item.id);
      else selectedIds.delete(item.id);
    });
    renderRows();
  });

  rows.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-notification]");
    if (!checkbox) return;
    if (checkbox.checked) selectedIds.add(checkbox.dataset.selectNotification);
    else selectedIds.delete(checkbox.dataset.selectNotification);
    syncControls();
  });

  rows.addEventListener("click", (event) => {
    const detail = event.target.closest("[data-detail]");
    if (!detail) return;
    const notification = notifications.find((item) => item.id === detail.dataset.detail);
    if (notification) window.location.href = notification.detailUrl;
  });

  markRead.addEventListener("click", () => {
    const readSet = new Set(state.readIds);
    selectedIds.forEach((id) => readSet.add(id));
    state.readIds = Array.from(readSet);
    writeNotificationState();
    const changed = selectedIds.size;
    selectedIds.clear();
    renderRows();
    announce(`${changed} notification${changed === 1 ? "" : "s"} marked as read.`);
  });

  markAllRead.addEventListener("click", () => {
    const visible = visibleNotifications();
    const readSet = new Set(state.readIds);
    visible.forEach((item) => readSet.add(item.id));
    state.readIds = Array.from(readSet);
    selectedIds.clear();
    writeNotificationState();
    renderRows();
    announce(`${visible.length} notification${visible.length === 1 ? "" : "s"} marked as read.`);
  });

  refreshButton.addEventListener("click", () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing…";
    state = readNotificationState();
    refreshData();
    selectedIds.clear();
    window.setTimeout(() => {
      renderRows();
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh List";
      announce("Notification list refreshed.");
    }, 240);
  });

  document.querySelectorAll(".menu-item[aria-expanded]").forEach((item) => item.addEventListener("click", () => {
    item.setAttribute("aria-expanded", String(item.getAttribute("aria-expanded") !== "true"));
  }));

  window.addEventListener("storage", (event) => {
    if (event.key !== ALERT_STORAGE_KEY && event.key !== NOTIFICATION_STORAGE_KEY) return;
    state = readNotificationState();
    refreshData();
    renderRows();
  });

  refreshData();
  renderRows();
  requestAnimationFrame(revealActiveTab);
})();
