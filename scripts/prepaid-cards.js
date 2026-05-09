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

  function formatMoney(value) {
    return "$" + value.toFixed(2);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatSignedAmount(value, isTopUp) {
    return (isTopUp ? "+" : "-") + value.toFixed(2);
  }

  function formatDateTime(date) {
    const pad = function (value) { return String(value).padStart(2, "0"); };
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":");
  }

  function getDefaultBalanceRemark(type) {
    return type === "Top-up" ? "System remark: manual top-up." : "System remark: manual deduction.";
  }

  function syncBalanceRemarkForType() {
    const typeSelect = document.querySelector("#balanceChangeType");
    const remark = document.querySelector("#remark");
    if (!typeSelect || !remark) return;

    const current = remark.value.trim();
    const isSystemDefault = current === "" || current === getDefaultBalanceRemark("Top-up") || current === getDefaultBalanceRemark("Deduct");
    if (isSystemDefault) remark.value = getDefaultBalanceRemark(typeSelect.value);
  }

  function syncBalanceConfirmModal() {
    const modal = document.getElementById("balanceConfirm");
    const typeSelect = document.querySelector("#balanceChangeType");
    const amountInput = document.querySelector("#changeAmount");
    if (!modal || !typeSelect || !amountInput) return true;

    const currentNode = modal.querySelector("[data-balance-current]");
    const typeNode = modal.querySelector("[data-balance-confirm-type]");
    const amountNode = modal.querySelector("[data-balance-confirm-amount]");
    const newBalanceNode = modal.querySelector("[data-balance-confirm-new]");
    const submitButton = modal.querySelector("[data-balance-confirm-submit]");
    const current = Number(currentNode ? currentNode.getAttribute("data-balance-current") : 0);
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Amount must be greater than 0.");
      amountInput.classList.add("is-invalid");
      amountInput.focus();
      return false;
    }

    amountInput.classList.remove("is-invalid");
    const isTopUp = typeSelect.value === "Top-up";
    const nextBalance = isTopUp ? current + amount : current - amount;
    if (typeNode) typeNode.textContent = typeSelect.value;
    if (amountNode) {
      amountNode.textContent = formatMoney(amount);
      amountNode.classList.toggle("positive", isTopUp);
      amountNode.classList.toggle("negative", !isTopUp);
    }
    if (newBalanceNode) newBalanceNode.textContent = formatMoney(nextBalance);
    if (submitButton) {
      submitButton.textContent = isTopUp ? "Confirm Top-up" : "Confirm Deduction";
      submitButton.classList.toggle("primary", isTopUp);
      submitButton.classList.toggle("danger", !isTopUp);
      submitButton.setAttribute("data-toast", isTopUp ? "Balance topped up." : "Balance deducted.");
    }
    return true;
  }

  function applyBalanceAdjustment() {
    const modal = document.getElementById("balanceConfirm");
    const typeSelect = document.querySelector("#balanceChangeType");
    const amountInput = document.querySelector("#changeAmount");
    const remark = document.querySelector("#remark");
    const historyBody = document.querySelector("[data-adjustment-history]");
    if (!modal || !typeSelect || !amountInput || !historyBody) return;

    const currentNode = modal.querySelector("[data-balance-current]");
    const current = Number(currentNode ? currentNode.getAttribute("data-balance-current") : 0);
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const isTopUp = typeSelect.value === "Top-up";
    const nextBalance = isTopUp ? current + amount : current - amount;
    const now = new Date();
    const row = document.createElement("tr");
    row.innerHTML = [
      "<td>" + formatDateTime(now) + "</td>",
      '<td><span class="badge ' + (isTopUp ? "green" : "red") + '">' + escapeHtml(typeSelect.value) + "</span></td>",
      "<td>" + formatMoney(current) + "</td>",
      "<td>" + formatMoney(nextBalance) + "</td>",
      '<td class="amount ' + (isTopUp ? "positive" : "negative") + '">' + formatSignedAmount(amount, isTopUp) + "</td>",
      "<td>ops.manager@paywizard.io</td>",
      "<td>" + escapeHtml((remark && remark.value.trim()) || getDefaultBalanceRemark(typeSelect.value)) + "</td>"
    ].join("");
    historyBody.prepend(row);

    if (currentNode) {
      currentNode.setAttribute("data-balance-current", nextBalance.toFixed(2));
      currentNode.textContent = formatMoney(nextBalance);
    }
    document.querySelectorAll("[data-balance-display]").forEach(function (item) {
      item.textContent = formatMoney(nextBalance);
    });
    document.querySelectorAll("[data-last-adjustment-time]").forEach(function (item) {
      item.textContent = formatDateTime(now).slice(0, 16);
    });
  }

  function syncReplacementConfirm() {
    const oldUid = document.querySelector("#oldUid");
    const oldDisplay = document.querySelector("#oldDisplay");
    const newUid = document.querySelector("#newUid");
    const newDisplay = document.querySelector("#newDisplay");
    const transferAmount = document.querySelector("#transferAmount");
    const newStatus = document.querySelector("#newStatus");
    const oldStatus = document.querySelector("#oldStatus");
    const currency = document.querySelector("#replacementCurrency");
    const amountValue = Number(transferAmount && transferAmount.value);
    const balanceText = Number.isFinite(amountValue) ? formatMoney(amountValue) : "$0.00";
    const oldStatusText = oldStatus && oldStatus.value ? oldStatus.value : "Replaced";
    const newStatusText = newStatus && newStatus.value ? newStatus.value : "Active";
    const oldUidText = oldUid && oldUid.value ? oldUid.value : "";
    const oldDisplayText = oldDisplay && oldDisplay.value ? oldDisplay.value : "";
    const newUidText = newUid && newUid.value ? newUid.value : "";
    const newDisplayText = newDisplay && newDisplay.value ? newDisplay.value : "";
    const currencyText = currency && currency.value ? currency.value : "";

    const setDocumentText = function (selector, value) {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    };
    setDocumentText("[data-preview-old-uid]", oldUidText);
    setDocumentText("[data-preview-old-display]", oldDisplayText);
    setDocumentText("[data-preview-new-uid]", newUidText);
    setDocumentText("[data-preview-new-display]", newDisplayText);
    setDocumentText("[data-preview-old-balance]", balanceText);
    setDocumentText("[data-preview-new-balance]", balanceText);
    setDocumentText("[data-preview-old-currency]", currencyText);
    setDocumentText("[data-preview-new-currency]", currencyText);

    const oldStatusNode = document.querySelector("[data-preview-old-status]");
    if (oldStatusNode) oldStatusNode.innerHTML = '<span class="badge neutral">' + escapeHtml(oldStatusText) + "</span>";
    const newStatusNode = document.querySelector("[data-preview-new-status]");
    if (newStatusNode) newStatusNode.innerHTML = '<span class="badge ' + (newStatusText === "Active" ? "green" : "neutral") + '">' + escapeHtml(newStatusText) + "</span>";
  }

  function syncPanelScopedActions(panelId) {
    document.querySelectorAll("[data-visible-panel]").forEach(function (item) {
      item.hidden = item.getAttribute("data-visible-panel") !== panelId;
    });
  }

  let cardDetailInitialValues = null;

  function getCardDetailGeneralFields() {
    const generalTab = document.getElementById("generalTab");
    if (!generalTab) return [];
    return Array.from(generalTab.querySelectorAll("input, select, textarea")).filter(function (field) {
      return !field.disabled && !field.readOnly;
    });
  }

  function captureCardDetailGeneralValues() {
    cardDetailInitialValues = getCardDetailGeneralFields().map(function (field) {
      return field.value;
    });
  }

  function syncCardDetailSaveButton() {
    const saveButton = document.querySelector("[data-card-detail-save]");
    if (!saveButton || !cardDetailInitialValues) return;
    const generalTab = document.getElementById("generalTab");
    const generalVisible = generalTab && generalTab.classList.contains("active");
    const fields = getCardDetailGeneralFields();
    const dirty = fields.some(function (field, index) {
      return field.value !== cardDetailInitialValues[index];
    });
    saveButton.hidden = !generalVisible || !dirty;
  }

  function syncCardDetailStatusSummary(status) {
    const statusSummary = document.querySelector("[data-detail-status]");
    if (!statusSummary) return;

    const nextStatus = status || "Active";
    statusSummary.textContent = nextStatus;
    statusSummary.classList.toggle("status-neutral", nextStatus === "Not Active" || nextStatus === "Replaced" || nextStatus === "Expired");
    statusSummary.classList.toggle("status-red", nextStatus === "Suspended");
  }

  function applyCardDetailSavedSummary() {
    const statusSelect = document.querySelector("#status");
    if (statusSelect) syncCardDetailStatusSummary(statusSelect.value);
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
        syncCardDetailSaveButton();
      }
    }

    const guardedAction = event.target.closest("[data-requires-valid-dates]");
    if (guardedAction && !validateLifecycleDates(true)) {
      event.preventDefault();
      return;
    }

    const replacementConfirmButton = event.target.closest("[data-build-replacement-confirm]");
    if (replacementConfirmButton) {
      syncReplacementConfirm();
      const modal = document.getElementById("replaceConfirm");
      if (modal) {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
      }
      return;
    }

    const openModalButton = event.target.closest("[data-open-modal]");
    if (openModalButton) {
      const modalId = openModalButton.getAttribute("data-open-modal");
      if (modalId === "balanceConfirm" && !syncBalanceConfirmModal()) {
        event.preventDefault();
        return;
      }
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
      }
    }

    const balanceConfirmSubmit = event.target.closest("[data-balance-confirm-submit]");
    if (balanceConfirmSubmit) {
      applyBalanceAdjustment();
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

    const cardDetailSaveButton = event.target.closest("[data-card-detail-save]");
    if (cardDetailSaveButton) {
      applyCardDetailSavedSummary();
      captureCardDetailGeneralValues();
      syncCardDetailSaveButton();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".modal-backdrop.open").forEach(function (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });
  });

  const balanceChangeType = document.querySelector("#balanceChangeType");
  if (balanceChangeType) balanceChangeType.addEventListener("change", syncBalanceRemarkForType);

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
      const badge = item.querySelector(".badge");
      if (!badge) return;
      if (target > 3 && index === 3) {
        badge.className = "badge green";
        badge.textContent = "Done";
        return;
      }
      badge.className = "badge " + (index < target ? "green" : index === target ? "purple" : "neutral");
      badge.textContent = index < target ? "Done" : index === target ? "Current" : "Pending";
    });
  }

  function applyImportValidationResults() {
    let readyCount = 0;
    let errorCount = 0;
    const statusMap = {
      valid: { label: "Ready", className: "badge green" },
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
    return { readyCount: readyCount, errorCount: errorCount };
  }

  document.querySelectorAll("[data-import-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = Number(button.getAttribute("data-import-step"));
      setImportStep(target);
      showToast(button.getAttribute("data-toast") || "Import step updated.");
    });
  });

  const importUploadButton = document.querySelector("[data-import-upload]");
  const batchActivateButton = document.querySelector("[data-batch-activate]");
  if (importUploadButton) {
    importUploadButton.addEventListener("click", function () {
      const emptyState = document.querySelector("[data-import-empty]");
      const reviewTable = document.querySelector("[data-import-review-table]");
      const reviewNote = document.querySelector("[data-import-review-note]");
      const resultSummary = document.querySelector("[data-import-result-summary]");
      const readyCount = document.querySelector("[data-import-ready-count]");
      const errorCount = document.querySelector("[data-import-error-count]");
      const result = applyImportValidationResults();
      if (emptyState) emptyState.hidden = true;
      if (reviewTable) reviewTable.hidden = false;
      if (resultSummary) resultSummary.hidden = false;
      if (batchActivateButton) {
        batchActivateButton.disabled = result.readyCount === 0;
        batchActivateButton.textContent = result.readyCount > 0 ? "Activate Batch" : "No Valid Cards";
      }
      if (reviewNote) reviewNote.textContent = "Review the validated rows before activation.";
      if (readyCount) readyCount.textContent = result.readyCount + " cards ready";
      if (errorCount) errorCount.textContent = result.errorCount + " error card skipped";
      setImportStep(3);
      showToast(importUploadButton.getAttribute("data-toast") || "File uploaded and validated.");
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
    const enabledCheckboxes = merchantCheckboxes.filter(function (checkbox) { return !checkbox.disabled; });
    const selected = enabledCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;
    if (merchantSelectedCount) merchantSelectedCount.textContent = selected + " Selected";
    if (merchantSelectAll) {
      merchantSelectAll.checked = selected === enabledCheckboxes.length;
      merchantSelectAll.indeterminate = selected > 0 && selected < enabledCheckboxes.length;
    }
  }
  if (merchantSelectAll && merchantCheckboxes.length) {
    merchantSelectAll.addEventListener("change", function () {
      merchantCheckboxes.forEach(function (checkbox) {
        if (!checkbox.disabled) checkbox.checked = merchantSelectAll.checked;
      });
      syncMerchantSelection();
    });
    merchantCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", syncMerchantSelection);
    });
    syncMerchantSelection();
  }

  const cardCurrency = document.querySelector("[data-card-currency]");
  function syncCardCurrencyLabel() {
    if (!cardCurrency) return;
    document.querySelectorAll("[data-card-currency-label]").forEach(function (item) {
      item.textContent = cardCurrency.value + " only";
    });
  }
  if (cardCurrency) {
    cardCurrency.addEventListener("change", syncCardCurrencyLabel);
    syncCardCurrencyLabel();
  }

  function applyCardDetailQuery() {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;

    const cardUid = params.get("cardUid");
    const displayNo = params.get("displayNo");
    const status = params.get("status");
    const cardUidInput = document.querySelector("#cardUid");
    const displayNoInput = document.querySelector("#displayNumber");
    const statusSelect = document.querySelector("#status");
    const statusSummary = document.querySelector("[data-detail-status]");

    if (cardUid) {
      document.querySelectorAll("[data-detail-card-uid]").forEach(function (item) {
        item.textContent = cardUid;
      });
      if (cardUidInput) cardUidInput.value = cardUid;
    }
    if (displayNo) {
      document.querySelectorAll("[data-detail-display-no]").forEach(function (item) {
        item.textContent = displayNo;
      });
      if (displayNoInput) displayNoInput.value = displayNo;
    }
    if (status) {
      if (statusSummary) syncCardDetailStatusSummary(status);
      if (statusSelect) statusSelect.value = status;
    }
  }
  applyCardDetailQuery();
  if (document.getElementById("generalTab")) {
    captureCardDetailGeneralValues();
    getCardDetailGeneralFields().forEach(function (field) {
      field.addEventListener("input", syncCardDetailSaveButton);
      field.addEventListener("change", syncCardDetailSaveButton);
    });
    syncCardDetailSaveButton();
  }

  if (window.location.hash === "#import") {
    const importTab = document.querySelector('[data-tab-target="batchImport"]');
    if (importTab) importTab.click();
  }

  const activePanel = document.querySelector(".tab-panel.active");
  if (activePanel) syncPanelScopedActions(activePanel.id);
})();
