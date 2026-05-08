(function () {
  const toast = document.querySelector("[data-toast-root]");
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message || "Saved";
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function syncPanelScopedActions(panelId) {
    document.querySelectorAll("[data-visible-panel]").forEach(function (item) {
      item.hidden = item.getAttribute("data-visible-panel") !== panelId;
    });
  }

  document.addEventListener("click", function (event) {
    const tab = event.target.closest("[data-tab-target]");
    if (tab) {
      const group = tab.closest("[data-tabs]");
      const panelId = tab.getAttribute("data-tab-target");
      if (group && panelId) {
        const groupName = group.getAttribute("data-tabs");
        group.querySelectorAll("[data-tab-target]").forEach(function (item) {
          item.classList.toggle("active", item === tab);
        });
        document.querySelectorAll('[data-tab-panel-for="' + groupName + '"]').forEach(function (panel) {
          panel.classList.toggle("active", panel.id === panelId);
        });
        syncPanelScopedActions(panelId);
      }
    }

    const guardedAction = event.target.closest("[data-requires-valid-dates]");
    if (guardedAction && !validateLifecycleDates(true)) {
      event.preventDefault();
      return;
    }

    const openModalButton = event.target.closest("[data-open-modal]");
    if (openModalButton) {
      const modal = document.getElementById(openModalButton.getAttribute("data-open-modal"));
      if (modal) {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
      }
    }

    const closeModalButton = event.target.closest("[data-close-modal]");
    if (closeModalButton) {
      const modal = closeModalButton.closest(".modal-backdrop");
      if (modal) {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
      }
    }

    const toastButton = event.target.closest("[data-toast]");
    if (toastButton) showToast(toastButton.getAttribute("data-toast"));
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".modal-backdrop.open").forEach(function (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });
  });

  document.querySelectorAll("[data-autofill-new-card]").forEach(function (button) {
    button.addEventListener("click", function () {
      const uid = document.querySelector("#newCardUid");
      const display = document.querySelector("#displayCardNo");
      if (uid) uid.value = "04A37C91B25F80";
      if (display) display.value = "EMP-CARD-004218";
      showToast("Card UID captured from reader.");
    });
  });

  function setImportStep(target) {
    document.querySelectorAll("[data-import-state]").forEach(function (item) {
      const index = Number(item.getAttribute("data-import-state"));
      item.querySelector(".badge").className = "badge " + (index < target ? "green" : index === target ? "purple" : "neutral");
      item.querySelector(".badge").textContent = index < target ? "Done" : index === target ? "Current" : "Pending";
    });
  }

  document.querySelectorAll("[data-import-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = Number(button.getAttribute("data-import-step"));
      setImportStep(target);
      showToast(button.getAttribute("data-toast") || "Import step updated.");
    });
  });

  const validateImportButton = document.querySelector("[data-validate-import]");
  const batchActivateButton = document.querySelector("[data-batch-activate]");
  if (validateImportButton) {
    validateImportButton.addEventListener("click", function () {
      let readyCount = 0;
      let errorCount = 0;
      const statusMap = {
        valid: { label: "Valid", className: "badge green" },
        warning: { label: "Warning", className: "badge orange" },
        error: { label: "Error", className: "badge red" }
      };
      document.querySelectorAll("[data-validation-status]").forEach(function (row) {
        const status = row.getAttribute("data-validation-status");
        const badge = row.querySelector(".badge");
        const messageCell = row.lastElementChild;
        const display = statusMap[status] || statusMap.error;
        if (badge) {
          badge.className = display.className;
          badge.textContent = display.label;
        }
        if (messageCell) messageCell.textContent = row.getAttribute("data-validation-message") || "";
        if (status === "error") errorCount += 1;
        else readyCount += 1;
      });
      if (batchActivateButton) {
        batchActivateButton.disabled = readyCount === 0;
        batchActivateButton.textContent = readyCount > 0 ? "Activate " + readyCount + " Ready Cards" : "No Valid Cards";
      }
      validateImportButton.textContent = "Re-validate";
      setImportStep(3);
      showToast("Validation completed. " + readyCount + " rows ready, " + errorCount + " error row skipped.");
    });
  }

  const dailyLimitToggle = document.querySelector("[data-daily-limit-toggle]");
  const dailyLimitAmount = document.querySelector("[data-daily-limit-amount]");
  function syncDailyLimitAmount() {
    if (!dailyLimitToggle || !dailyLimitAmount) return;
    const enabled = dailyLimitToggle.value === "Yes";
    dailyLimitAmount.disabled = !enabled;
    dailyLimitAmount.required = enabled;
    if (!enabled) dailyLimitAmount.value = "";
    if (enabled && !dailyLimitAmount.value) dailyLimitAmount.value = "50.00";
  }
  if (dailyLimitToggle && dailyLimitAmount) {
    dailyLimitToggle.addEventListener("change", syncDailyLimitAmount);
    syncDailyLimitAmount();
  }

  const expirationDate = document.querySelector("[data-expiration-date]");
  const activationDate = document.querySelector("#activationDate");
  const expirationError = document.querySelector("[data-expiration-error]");
  function formatDateTimeLocal(date) {
    const pad = function (value) { return String(value).padStart(2, "0"); };
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-") + "T" + [pad(date.getHours()), pad(date.getMinutes())].join(":");
  }
  function getExpirationBaseDate() {
    const raw = activationDate && activationDate.value ? activationDate.value : "";
    const parsed = raw ? new Date(raw) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  function validateLifecycleDates(showMessage) {
    if (!activationDate || !expirationDate) return true;
    const hasExpiration = Boolean(expirationDate.value);
    const start = activationDate.value ? new Date(activationDate.value) : null;
    const end = hasExpiration ? new Date(expirationDate.value) : null;
    const invalid = Boolean(
      hasExpiration &&
      start &&
      end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end < start
    );
    expirationDate.classList.toggle("is-invalid", invalid);
    if (expirationError) expirationError.hidden = !invalid;
    if (invalid && showMessage) showToast("Expiration Date cannot be earlier than Activation Date.");
    return !invalid;
  }
  document.querySelectorAll("[data-expiration-years]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!expirationDate) return;
      const years = Number(button.getAttribute("data-expiration-years"));
      const next = getExpirationBaseDate();
      next.setFullYear(next.getFullYear() + years);
      expirationDate.value = formatDateTimeLocal(next);
      validateLifecycleDates(false);
    });
  });
  const clearExpiration = document.querySelector("[data-clear-expiration]");
  if (clearExpiration) {
    clearExpiration.addEventListener("click", function () {
      if (expirationDate) expirationDate.value = "";
      validateLifecycleDates(false);
    });
  }
  if (activationDate) activationDate.addEventListener("change", function () { validateLifecycleDates(false); });
  if (expirationDate) expirationDate.addEventListener("change", function () { validateLifecycleDates(false); });
  validateLifecycleDates(false);

  const merchantSelectAll = document.querySelector("[data-merchant-select-all]");
  const merchantCheckboxes = Array.from(document.querySelectorAll("[data-merchant-checkbox]"));
  const merchantSelectedCount = document.querySelector("[data-merchant-selected-count]");
  function syncMerchantSelection() {
    if (!merchantCheckboxes.length) return;
    const selected = merchantCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;
    if (merchantSelectedCount) merchantSelectedCount.textContent = selected + " Selected";
    if (merchantSelectAll) {
      merchantSelectAll.checked = selected === merchantCheckboxes.length;
      merchantSelectAll.indeterminate = selected > 0 && selected < merchantCheckboxes.length;
    }
  }
  if (merchantSelectAll && merchantCheckboxes.length) {
    merchantSelectAll.addEventListener("change", function () {
      merchantCheckboxes.forEach(function (checkbox) {
        checkbox.checked = merchantSelectAll.checked;
      });
      syncMerchantSelection();
    });
    merchantCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", syncMerchantSelection);
    });
    syncMerchantSelection();
  }

  if (window.location.hash === "#import") {
    const importTab = document.querySelector('[data-tab-target="batchImport"]');
    if (importTab) importTab.click();
  }

  const activePanel = document.querySelector(".tab-panel.active");
  if (activePanel) syncPanelScopedActions(activePanel.id);
})();
