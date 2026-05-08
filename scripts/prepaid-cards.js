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
      }
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

  document.querySelectorAll("[data-import-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = Number(button.getAttribute("data-import-step"));
      document.querySelectorAll("[data-import-state]").forEach(function (item) {
        const index = Number(item.getAttribute("data-import-state"));
        item.querySelector(".badge").className = "badge " + (index < target ? "green" : index === target ? "purple" : "neutral");
        item.querySelector(".badge").textContent = index < target ? "Done" : index === target ? "Current" : "Pending";
      });
      showToast(button.getAttribute("data-toast") || "Import step updated.");
    });
  });

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
})();
