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
      return !field.disabled && !field.readOnly && !field.matches("[data-non-persistent]");
    });
  }

  function getFieldState(field) {
    if (field.type === "checkbox" || field.type === "radio") return field.checked;
    return field.value;
  }

  function captureCardDetailGeneralValues() {
    cardDetailInitialValues = getCardDetailGeneralFields().map(function (field) {
      return getFieldState(field);
    });
  }

  function syncCardDetailSaveButton() {
    const saveButton = document.querySelector("[data-card-detail-save]");
    if (!saveButton || !cardDetailInitialValues) return;
    const generalTab = document.getElementById("generalTab");
    const generalVisible = generalTab && generalTab.classList.contains("active");
    const fields = getCardDetailGeneralFields();
    const dirty = fields.some(function (field, index) {
      return getFieldState(field) !== cardDetailInitialValues[index];
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
      if (modalId === "batchConfirm") {
        syncBatchConfirmModal();
        setImportStep(4);
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
      badge.className = "badge " + (index < target ? "green" : index === target ? "purple" : "neutral");
      badge.textContent = index < target ? "Done" : index === target ? "Current" : "Pending";
    });
  }

  function applyImportValidationResults() {
    let readyCount = 0;
    let errorCount = 0;
    let firstError = null;
    const statusMap = {
      valid: { label: "Ready", className: "badge green" },
      warning: { label: "Warning", className: "badge orange" },
      error: { label: "Error", className: "badge red" }
    };
    document.querySelectorAll("[data-import-row]").forEach(function (row) {
      const status = row.getAttribute("data-validation-status");
      const badge = row.querySelector(".badge");
      const messageCell = row.lastElementChild;
      const display = statusMap[status] || statusMap.error;
      if (badge) {
        badge.className = display.className;
        badge.textContent = display.label;
      }
      if (messageCell) {
        messageCell.textContent = row.getAttribute("data-validation-message") || "";
        messageCell.classList.toggle("validation-message", status === "error");
      }
      row.classList.toggle("is-error-row", status === "error");
      row.classList.toggle("is-ready-row", status !== "error");
      if (status === "error") {
        errorCount += 1;
        if (!firstError) firstError = row;
      } else {
        readyCount += 1;
      }
    });
    return { readyCount: readyCount, errorCount: errorCount, firstError: firstError };
  }

  function getImportRowSearchText(row) {
    return Array.from(row.children).map(function (cell) {
      return cell.textContent || "";
    }).join(" ").toLowerCase();
  }

  function syncImportReviewFilter() {
    const activeFilter = document.querySelector("[data-import-filter].active");
    const searchInput = document.querySelector("[data-import-review-search]");
    const mode = activeFilter ? activeFilter.getAttribute("data-import-filter") : "all";
    const query = searchInput && searchInput.value ? searchInput.value.trim().toLowerCase() : "";
    document.querySelectorAll("[data-import-row]").forEach(function (row) {
      const status = row.getAttribute("data-validation-status");
      const matchesMode = mode !== "error" || status === "error";
      const matchesSearch = !query || getImportRowSearchText(row).indexOf(query) !== -1;
      row.hidden = !(matchesMode && matchesSearch);
    });
  }

  function syncImportErrorCallout(result) {
    const callout = document.querySelector("[data-import-error-callout]");
    const title = document.querySelector("[data-import-error-title]");
    const detail = document.querySelector("[data-import-error-detail]");
    if (!callout) return;
    callout.hidden = result.errorCount === 0;
    if (!result.firstError) return;
    const rowNumber = result.firstError.children[0] ? result.firstError.children[0].textContent : "";
    const message = result.firstError.getAttribute("data-validation-message") || "";
    if (title) title.textContent = result.errorCount + (result.errorCount === 1 ? " row needs correction" : " rows need correction");
    if (detail) detail.textContent = "Row " + rowNumber + ": " + message;
  }

  function getSelectedBatchUsageScopeSummary() {
    const scope = document.querySelector("[data-batch-scope-mount] [data-merchant-scope]");
    if (!scope) return "Not selected";
    const selectedMode = scope.querySelector("[data-merchant-scope-mode]:checked");
    const mode = selectedMode ? selectedMode.value : "";
    const countText = scope.querySelector("[data-merchant-selected-count]")?.textContent?.trim() || "";
    const selectedCount = countText.split("/")[0]?.trim() || "";
    if (mode === "scene") {
      const count = scope.querySelectorAll("[data-scene-checkbox]:checked").length;
      return "Scene Level, " + count + (count === 1 ? " scene" : " scenes");
    }
    if (mode === "merchant") {
      const merchantMode = scope.querySelector("[data-merchant-selection-mode]:checked")?.value || "future";
      if (merchantMode === "future") return "Merchant Level, current & future merchants";
      if (merchantMode === "current") return "Merchant Level, current merchants only";
      return "Merchant Level, " + (selectedCount || "custom selection");
    }
    if (mode === "sn") return "SN Level, " + (selectedCount || "custom selection");
    return "Not selected";
  }

  function syncBatchConfirmModal() {
    const summary = document.querySelector("[data-batch-confirm-scope]");
    if (summary) summary.textContent = getSelectedBatchUsageScopeSummary();
  }

  function csvEscape(value) {
    const text = String(value == null ? "" : value);
    if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function exportImportResults() {
    const rows = Array.from(document.querySelectorAll("[data-import-row]"));
    if (!rows.length) return;
    const headers = [
      "row",
      "card_uid",
      "cardholder",
      "employee_id",
      "initial_balance",
      "daily_limit",
      "validate_result",
      "validate_reason"
    ];
    const csvRows = [headers.join(",")].concat(rows.map(function (row) {
      const cells = Array.from(row.children);
      const hasError = row.getAttribute("data-validation-status") === "error";
      const status = hasError ? "Error" : "Passed";
      const reason = hasError ? (row.getAttribute("data-validation-message") || "") : "";
      return [
        cells[0],
        cells[1],
        cells[2],
        cells[3],
        cells[4],
        cells[5]
      ].map(function (cell) {
        return csvEscape(cell ? cell.textContent.trim() : "");
      }).concat([csvEscape(status), csvEscape(reason)]).join(",");
    }));
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "prepaid_card_import_validation_result.csv";
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
    showToast("Validation result CSV exported.");
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
      const reviewTools = document.querySelector("[data-import-review-tools]");
      const exportButton = document.querySelector("[data-export-import-results]");
      const importScopeSection = document.querySelector("[data-import-scope-section]");
      const readyCount = document.querySelector("[data-import-ready-count]");
      const errorCount = document.querySelector("[data-import-error-count]");
      const result = applyImportValidationResults();
      if (emptyState) emptyState.hidden = true;
      if (importScopeSection) importScopeSection.hidden = false;
      if (reviewTable) reviewTable.hidden = false;
      if (resultSummary) resultSummary.hidden = false;
      if (reviewTools) reviewTools.hidden = false;
      if (exportButton) exportButton.hidden = false;
      if (batchActivateButton) {
        batchActivateButton.disabled = result.readyCount === 0;
        batchActivateButton.textContent = result.readyCount > 0 ? "Activate Batch" : "No Valid Cards";
      }
      if (reviewNote) reviewNote.textContent = "Choose usage scope limits for this batch, then review validated rows and activate valid cards.";
      if (readyCount) readyCount.textContent = result.readyCount + " cards ready";
      if (errorCount) errorCount.textContent = result.errorCount + " error card skipped";
      syncImportErrorCallout(result);
      syncImportReviewFilter();
      setImportStep(3);
      showToast(importUploadButton.getAttribute("data-toast") || "File uploaded and validated.");
    });
  }

  document.querySelectorAll("[data-import-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-import-filter]").forEach(function (item) {
        item.classList.toggle("active", item === button);
      });
      syncImportReviewFilter();
    });
  });
  const importReviewSearch = document.querySelector("[data-import-review-search]");
  if (importReviewSearch) importReviewSearch.addEventListener("input", syncImportReviewFilter);

  const importFirstErrorButton = document.querySelector("[data-import-first-error]");
  if (importFirstErrorButton) {
    importFirstErrorButton.addEventListener("click", function () {
      const firstError = document.querySelector("[data-import-row].is-error-row");
      if (!firstError) return;
      firstError.hidden = false;
      firstError.scrollIntoView({ block: "center", behavior: "smooth" });
      firstError.classList.add("is-focused-error");
      window.setTimeout(function () {
        firstError.classList.remove("is-focused-error");
      }, 1500);
    });
  }

  const exportImportResultsButton = document.querySelector("[data-export-import-results]");
  if (exportImportResultsButton) exportImportResultsButton.addEventListener("click", exportImportResults);

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

  function getMerchantRowText(row) {
    return [
      row.getAttribute("data-scope-level"),
      row.getAttribute("data-agent"),
      row.getAttribute("data-merchant-name"),
      row.getAttribute("data-merchant-id"),
      row.getAttribute("data-currency"),
      row.getAttribute("data-terminal-scene"),
      row.getAttribute("data-terminal-sn")
    ].join(" ").toLowerCase();
  }

  function mountBatchUsageScope() {
    const mount = document.querySelector("[data-batch-scope-mount]");
    const source = document.querySelector("#singleActivation [data-merchant-scope]");
    if (!mount || !source || mount.querySelector("[data-merchant-scope]")) return;
    const clone = source.cloneNode(true);
    clone.setAttribute("data-batch-usage-scope", "");
    clone.querySelectorAll('[name="usageScopeLevel"]').forEach(function (input) {
      input.name = "batchUsageScopeLevel";
    });
    clone.querySelectorAll('[name="merchantSelectionMode"]').forEach(function (input) {
      input.name = "batchMerchantSelectionMode";
    });
    const title = clone.querySelector(".section-title");
    if (title) title.textContent = "Usage Scope Limits";
    const titleWrap = clone.querySelector(".title-line > div");
    if (titleWrap && !titleWrap.querySelector(".section-note")) {
      const note = document.createElement("p");
      note.className = "section-note";
      note.textContent = "These limits apply to every valid card in this batch import.";
      titleWrap.appendChild(note);
    }
    mount.appendChild(clone);
  }

  mountBatchUsageScope();

  function syncMerchantScope(scope, includeNewAvailable) {
    const cardCurrencyField = document.querySelector("[data-card-currency]");
    const cardCurrencyValue = cardCurrencyField && cardCurrencyField.value ? cardCurrencyField.value : "USD";
    const rows = Array.from(scope.querySelectorAll("[data-merchant-row]"));
    const sceneOptions = Array.from(scope.querySelectorAll("[data-scene-option]"));
    const scopeModeInput = scope.querySelector("[data-merchant-scope-mode]:checked");
    const scopeMode = scopeModeInput ? scopeModeInput.value : "";
    const scenePicker = scope.querySelector("[data-scene-scope-picker]");
    const merchantSelectionOptions = scope.querySelector("[data-merchant-selection-options]");
    const merchantSelectionModeInput = scope.querySelector("[data-merchant-selection-mode]:checked");
    const merchantSelectionMode = scopeMode === "merchant" && merchantSelectionModeInput ? merchantSelectionModeInput.value : "";
    const merchantToolbar = scope.querySelector("[data-merchant-toolbar]");
    const merchantTable = scope.querySelector("[data-merchant-table]");
    const merchantPagination = scope.querySelector("[data-merchant-pagination]");
    const pageSummary = scope.querySelector("[data-merchant-page-summary]");
    const pageIndicator = scope.querySelector("[data-merchant-page-indicator]");
    const prevPage = scope.querySelector("[data-merchant-page-prev]");
    const nextPage = scope.querySelector("[data-merchant-page-next]");
    const search = scope.querySelector("[data-merchant-search]");
    const agentFilter = scope.querySelector("[data-merchant-agent-filter]");
    const merchantNameFilter = scope.querySelector("[data-merchant-name-filter]");
    const sceneFilter = scope.querySelector("[data-merchant-scene-filter]");
    const availabilityFilter = scope.querySelector("[data-merchant-availability-filter]");
    const selectionFilter = scope.querySelector("[data-merchant-selection-filter]");
    const selectAll = scope.querySelector("[data-merchant-select-all]");
    const selectedCount = scope.querySelector("[data-merchant-selected-count]");
    const availableCount = scope.querySelector("[data-merchant-available-count]");
    const unavailableCount = scope.querySelector("[data-merchant-unavailable-count]");
    const visibleCount = scope.querySelector("[data-merchant-visible-count]");
    const autoInclude = scope.querySelector("[data-merchant-auto-include]");
    const scopeGuidance = scope.querySelector("[data-scope-guidance]");
    const query = search && search.value ? search.value.trim().toLowerCase() : "";
    const selectedMode = selectionFilter && selectionFilter.value ? selectionFilter.value : "all";
    const availabilityMode = availabilityFilter && availabilityFilter.value ? availabilityFilter.value : "available";
    const agentValue = agentFilter && agentFilter.value && scopeMode !== "scene" ? agentFilter.value : "";
    const merchantNameValue = merchantNameFilter && merchantNameFilter.value && scopeMode !== "scene" ? merchantNameFilter.value : "";
    const sceneValue = sceneFilter && sceneFilter.value && scopeMode !== "merchant" ? sceneFilter.value : "";
    const pageSize = Math.max(1, Number(scope.getAttribute("data-merchant-page-size")) || 25);
    const scopeGuidanceText = {
      merchant: {
        future: "All current and future same-currency merchants under this service provider will be included automatically.",
        current: "All current same-currency merchants are selected. Future merchants are not included automatically.",
        custom: "Only merchants matching the card currency can be selected."
      },
      scene: "Future same-currency merchants and terminals will be included automatically when they match selected scenes.",
      sn: "SN Level uses exact terminal selection; future terminals are not auto included."
    };
    const activeRows = rows.filter(function (row) {
      return !scopeMode || row.getAttribute("data-scope-level") === scopeMode;
    });
    let available = 0;
    let visible = 0;
    let currentPage = Math.max(1, Number(scope.getAttribute("data-merchant-page")) || 1);

    if (scenePicker) scenePicker.hidden = scopeMode !== "scene";
    if (merchantSelectionOptions) merchantSelectionOptions.hidden = scopeMode !== "merchant";
    if (merchantToolbar) merchantToolbar.hidden = scopeMode === "scene" || (scopeMode === "merchant" && merchantSelectionMode !== "custom");
    if (merchantTable) merchantTable.hidden = scopeMode === "scene" || (scopeMode === "merchant" && merchantSelectionMode !== "custom");
    if (merchantPagination) merchantPagination.hidden = scopeMode === "scene" || (scopeMode === "merchant" && merchantSelectionMode !== "custom");
    if (agentFilter) agentFilter.disabled = scopeMode === "scene";
    if (merchantNameFilter) merchantNameFilter.disabled = scopeMode === "scene";
    if (sceneFilter) sceneFilter.disabled = scopeMode === "merchant";
    if (scopeGuidance) {
      scopeGuidance.textContent = scopeMode === "merchant"
        ? (scopeGuidanceText.merchant[merchantSelectionMode] || scopeGuidanceText.merchant.future)
        : (scopeGuidanceText[scopeMode] || scopeGuidanceText.merchant.custom);
    }
    if (autoInclude) {
      autoInclude.disabled = scopeMode === "sn";
      if (scopeMode === "sn") autoInclude.checked = false;
    }

    if (scopeMode === "scene") {
      sceneOptions.forEach(function (option) {
        const checkbox = option.querySelector("[data-scene-checkbox]");
        const isAvailable = true;
        if (isAvailable) available += 1;
        visible += 1;
        option.classList.toggle("is-unavailable", !isAvailable);
        if (checkbox) {
          checkbox.disabled = !isAvailable;
          if (!isAvailable) checkbox.checked = false;
          if (isAvailable && includeNewAvailable && autoInclude && autoInclude.checked) checkbox.checked = true;
        }
      });
      const enabledSceneCheckboxes = sceneOptions.map(function (option) {
        return option.querySelector("[data-scene-checkbox]");
      }).filter(function (checkbox) {
        return checkbox && !checkbox.disabled;
      });
      const selectedScenes = enabledSceneCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;
      if (selectedCount) selectedCount.textContent = selectedScenes + " selected / " + available + " available";
      if (availableCount) availableCount.textContent = String(available);
      if (unavailableCount) unavailableCount.textContent = String(sceneOptions.length - available);
      if (visibleCount) visibleCount.textContent = String(visible);
      if (selectAll) {
        selectAll.checked = selectedScenes > 0 && selectedScenes === enabledSceneCheckboxes.length;
        selectAll.indeterminate = selectedScenes > 0 && selectedScenes < enabledSceneCheckboxes.length;
        selectAll.disabled = true;
      }
      rows.forEach(function (row) { row.hidden = true; });
      if (merchantPagination) merchantPagination.hidden = true;
      return;
    }

    if (scopeMode === "merchant" && merchantSelectionMode !== "custom") {
      rows.forEach(function (row) {
        const checkbox = row.querySelector("[data-merchant-checkbox]");
        const availability = row.querySelector("[data-merchant-availability]");
        const rowCurrency = row.getAttribute("data-currency") || "";
        const matchesScope = row.getAttribute("data-scope-level") === "merchant";
        const isAvailable = rowCurrency === cardCurrencyValue;
        if (!matchesScope) {
          row.hidden = true;
          return;
        }
        if (matchesScope && isAvailable) available += 1;
        row.classList.toggle("is-unavailable", !isAvailable);
        row.hidden = true;
        if (checkbox) {
          checkbox.disabled = !isAvailable;
          checkbox.checked = isAvailable;
        }
        if (availability) {
          availability.textContent = isAvailable ? "Available" : "Currency mismatch";
          availability.classList.toggle("muted", !isAvailable);
        }
      });
      if (selectedCount) selectedCount.textContent = available + " selected / " + available + " available";
      if (availableCount) availableCount.textContent = String(available);
      if (unavailableCount) unavailableCount.textContent = String(activeRows.length - available);
      if (visibleCount) visibleCount.textContent = "0";
      if (selectAll) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
        selectAll.disabled = true;
      }
      if (merchantPagination) merchantPagination.hidden = true;
      return;
    }

    const filteredRows = [];
    rows.forEach(function (row) {
      const checkbox = row.querySelector("[data-merchant-checkbox]");
      const availability = row.querySelector("[data-merchant-availability]");
      const rowCurrency = row.getAttribute("data-currency") || "";
      const rowScope = row.getAttribute("data-scope-level") || "";
      const isAvailable = rowCurrency === cardCurrencyValue;
      const matchesScope = !scopeMode || rowScope === scopeMode;
      if (matchesScope && isAvailable) available += 1;

      if (checkbox) {
        checkbox.disabled = !isAvailable;
        if (!isAvailable) checkbox.checked = false;
        if (matchesScope && isAvailable && includeNewAvailable && autoInclude && autoInclude.checked) checkbox.checked = true;
      }
      row.classList.toggle("is-unavailable", !isAvailable);
      if (availability) {
        availability.textContent = isAvailable ? "Available" : "Currency mismatch";
        availability.classList.toggle("muted", !isAvailable);
      }

      const matchesSearch = !query || getMerchantRowText(row).indexOf(query) !== -1;
      const matchesAgent = !agentValue || row.getAttribute("data-agent") === agentValue;
      const matchesMerchantName = !merchantNameValue || row.getAttribute("data-merchant-name") === merchantNameValue;
      const matchesScene = !sceneValue || row.getAttribute("data-terminal-scene") === sceneValue;
      const matchesAvailability =
        availabilityMode === "all" ||
        (availabilityMode === "available" && isAvailable) ||
        (availabilityMode === "unavailable" && !isAvailable);
      const currentSelected = !!(checkbox && checkbox.checked);
      const matchesSelection =
        selectedMode === "all" ||
        (selectedMode === "selected" && currentSelected) ||
        (selectedMode === "unselected" && isAvailable && !currentSelected);
      const showRow = matchesScope && matchesSearch && matchesAgent && matchesMerchantName && matchesScene && matchesAvailability && matchesSelection;
      row.hidden = true;
      if (showRow) filteredRows.push(row);
    });

    const totalFiltered = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    scope.setAttribute("data-merchant-page", String(currentPage));
    const pageStartIndex = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(pageStartIndex, pageStartIndex + pageSize);
    pageRows.forEach(function (row) {
      row.hidden = false;
    });
    visible = pageRows.length;

    const enabledCheckboxes = activeRows.map(function (row) {
      return row.querySelector("[data-merchant-checkbox]");
    }).filter(function (checkbox) {
      return checkbox && !checkbox.disabled;
    });
    const selected = enabledCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;
    const visibleEnabledCheckboxes = activeRows.filter(function (row) {
      return !row.hidden;
    }).map(function (row) {
      return row.querySelector("[data-merchant-checkbox]");
    }).filter(function (checkbox) {
      return checkbox && !checkbox.disabled;
    });
    const visibleSelected = visibleEnabledCheckboxes.filter(function (checkbox) { return checkbox.checked; }).length;

    if (selectedCount) selectedCount.textContent = selected + " selected / " + available + " available";
    if (availableCount) availableCount.textContent = String(available);
    if (unavailableCount) unavailableCount.textContent = String(activeRows.length - available);
    if (visibleCount) visibleCount.textContent = String(visible);
    if (pageSummary) {
      const pageEnd = totalFiltered === 0 ? 0 : pageStartIndex + pageRows.length;
      pageSummary.textContent = totalFiltered === 0
        ? "No matching records · " + selected + " selected across all pages"
        : "Showing " + (pageStartIndex + 1) + "-" + pageEnd + " of " + totalFiltered + " filtered · " + selected + " selected across all pages";
    }
    if (pageIndicator) pageIndicator.textContent = "Page " + currentPage + " of " + totalPages;
    if (prevPage) prevPage.disabled = currentPage <= 1;
    if (nextPage) nextPage.disabled = currentPage >= totalPages;
    if (selectAll) {
      selectAll.checked = visibleEnabledCheckboxes.length > 0 && visibleSelected === visibleEnabledCheckboxes.length;
      selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleEnabledCheckboxes.length;
      selectAll.disabled = visibleEnabledCheckboxes.length === 0;
    }
  }

  function syncAllMerchantScopes(includeNewAvailable) {
    document.querySelectorAll("[data-merchant-scope]").forEach(function (scope) {
      syncMerchantScope(scope, includeNewAvailable);
    });
  }

  document.querySelectorAll("[data-merchant-scope]").forEach(function (scope) {
    const selectAll = scope.querySelector("[data-merchant-select-all]");
    const controls = scope.querySelectorAll("[data-merchant-search], [data-merchant-agent-filter], [data-merchant-name-filter], [data-merchant-scene-filter], [data-merchant-availability-filter], [data-merchant-selection-filter], [data-merchant-scope-mode], [data-merchant-selection-mode], [data-scene-checkbox]");
    controls.forEach(function (control) {
      control.addEventListener("input", function () {
        scope.setAttribute("data-merchant-page", "1");
        syncMerchantScope(scope, false);
      });
      control.addEventListener("change", function () {
        scope.setAttribute("data-merchant-page", "1");
        syncMerchantScope(scope, false);
      });
    });
    const prevPage = scope.querySelector("[data-merchant-page-prev]");
    const nextPage = scope.querySelector("[data-merchant-page-next]");
    if (prevPage) {
      prevPage.addEventListener("click", function () {
        const currentPage = Math.max(1, Number(scope.getAttribute("data-merchant-page")) || 1);
        scope.setAttribute("data-merchant-page", String(Math.max(1, currentPage - 1)));
        syncMerchantScope(scope, false);
      });
    }
    if (nextPage) {
      nextPage.addEventListener("click", function () {
        const currentPage = Math.max(1, Number(scope.getAttribute("data-merchant-page")) || 1);
        scope.setAttribute("data-merchant-page", String(currentPage + 1));
        syncMerchantScope(scope, false);
      });
    }
    if (selectAll) {
      selectAll.addEventListener("change", function () {
        scope.querySelectorAll("[data-merchant-row]").forEach(function (row) {
          const checkbox = row.querySelector("[data-merchant-checkbox]");
          if (!row.hidden && checkbox && !checkbox.disabled) checkbox.checked = selectAll.checked;
        });
        syncMerchantScope(scope, false);
        syncCardDetailSaveButton();
      });
    }
    scope.querySelectorAll("[data-merchant-checkbox], [data-merchant-auto-include]").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        syncMerchantScope(scope, false);
        syncCardDetailSaveButton();
      });
    });
    syncMerchantScope(scope, false);
  });

  const cardCurrency = document.querySelector("[data-card-currency]");
  function syncCardCurrencyLabel() {
    if (!cardCurrency) return;
    document.querySelectorAll("[data-card-currency-label]").forEach(function (item) {
      item.textContent = cardCurrency.value + " only";
    });
  }
  if (cardCurrency) {
    cardCurrency.addEventListener("change", function () {
      syncCardCurrencyLabel();
      syncAllMerchantScopes(true);
    });
    syncCardCurrencyLabel();
    syncAllMerchantScopes(false);
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
