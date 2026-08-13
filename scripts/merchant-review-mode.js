(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var mode = params.get("mode");
  if (mode !== "review" && mode !== "view") return;

  var Store = window.PaywizardOnboardingStore;
  var applicationId = params.get("applicationId") || "";
  var application = Store && Store.findApplication(applicationId);
  var form = document.querySelector("form");
  if (!Store || !application || !form) return;

  var isReview = mode === "review";
  var channel = application.channel;
  var sections = Array.prototype.slice.call(form.querySelectorAll(".form-section[data-section]"));
  var review = application.review || Store.createReview(channel);
  var successBanner = document.getElementById("success-banner");
  var successTitle = document.getElementById("success-title");
  var successMessage = document.getElementById("success-message");

  var style = document.createElement("style");
  style.textContent = [
    ".application-mode-banner{max-width:1520px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 auto 14px;padding:13px 16px;border:1px solid #bfd6ee;border-radius:7px;background:#f1f7fd;color:#34495e}",
    ".platform-application-progress{max-width:1520px;margin:0 auto 14px}",
    ".application-mode-banner strong{display:block;margin-bottom:2px;font-size:12px}.application-mode-banner span{font-size:10px;color:#657789}.application-back-link{flex:none;padding:8px 12px;border:1px solid #b9c7d6;border-radius:6px;background:#fff;color:#334155;font-size:10px;font-weight:700;text-decoration:none}",
    ".application-mode-page .form-section{box-sizing:border-box;overflow:hidden}",
    ".application-mode-page .form-section>.section-header{border-radius:0}",
    ".form-section.review-approved{border-color:#55b981!important;background:#f2fbf6!important;box-shadow:0 0 0 1px rgba(18,130,73,.08)}",
    ".form-section.review-rejected{border-color:#e36a62!important;background:#fff6f5!important;box-shadow:0 0 0 1px rgba(217,45,32,.08)}",
    ".form-section.review-approved>.section-header{background:#eaf8f0!important;border-bottom-color:#b9e1c9!important}.form-section.review-rejected>.section-header{background:#fff0ef!important;border-bottom-color:#f1c1bd!important}",
    ".form-section.review-rejected .upload-card,.form-section.review-rejected .upload-card.has-file{border-color:#e36a62!important;background:#fffafa!important;box-shadow:none!important}",
    ".review-controls{display:flex;align-items:center;gap:7px;margin-left:auto}.review-choice{min-height:31px;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid #cfd5dc;border-radius:6px;background:#fff;color:#4d5560;font:600 10px inherit;cursor:pointer}.review-choice img{width:14px;height:14px}.review-choice.pass.is-selected{border-color:#2e9c60;background:#e1f6e9;color:#13733d}.review-choice.reject.is-selected{border-color:#d92d20;background:#ffe6e3;color:#b42318}",
    ".review-reason,.view-review-result{padding:14px 18px 16px;border-top:1px solid #f0c2be;background:#fff9f8}.review-reason[hidden]{display:none}.review-reason label,.view-review-result strong{display:block;margin-bottom:6px;color:#9f2d25;font-size:10px;font-weight:700}.review-reason textarea{box-sizing:border-box;width:100%;min-height:78px;padding:10px 12px;border:1px solid #e49a94;border-radius:6px;background:#fff;color:#363a42;font:11px/1.5 inherit;resize:vertical}.review-reason textarea:focus{outline:2px solid rgba(217,45,32,.13);border-color:#d92d20}.view-review-result p{margin:0;color:#7f312b;font-size:10px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".review-result-chip{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:700}.review-result-chip img{width:13px;height:13px}.review-result-chip.approved{background:#dcf7e7;color:#147a41}.review-result-chip.rejected{background:#ffe2df;color:#b42318}",
    ".application-mode-page .section-nav a{grid-template-columns:18px minmax(0,1fr) auto;align-items:center}.review-nav-status{grid-column:3;grid-row:1;margin:0 0 0 5px!important;padding:2px 6px;border-radius:999px;font-size:8px!important;font-weight:700;line-height:1.25;white-space:nowrap}.review-nav-status.approved{background:#dcf7e7;color:#147a41}.review-nav-status.rejected{background:#ffe2df;color:#b42318}.review-nav-status.pending{background:#eceff3;color:#6b7280}",
    ".application-readonly input[readonly],.application-readonly textarea[readonly],.application-readonly select:disabled,.application-readonly input:disabled{background:#f5f6f8!important;color:#50555e!important;cursor:default;opacity:1}.application-readonly .upload-card{pointer-events:none;background:#f5f6f8}",
    ".review-final-actions,.view-final-actions{display:flex;justify-content:flex-end;gap:10px;width:100%}.review-final-actions button,.review-final-actions a,.view-final-actions a{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 16px;border-radius:6px;font:700 11px inherit;text-decoration:none;cursor:pointer}.review-final-actions img{width:15px;height:15px}.review-approve{border:1px solid #128249;background:#128249;color:#fff}.review-return{border:1px solid #d92d20;background:#d92d20;color:#fff}.review-final-actions button:disabled{cursor:not-allowed;opacity:.48}.review-back{border:1px solid #31343a;background:#31343a;color:#fff}.view-final-actions a{border:1px solid #20242a;background:#20242a;color:#fff}",
    "@media(max-width:760px){.application-mode-banner{align-items:flex-start;flex-direction:column}.section-header{align-items:flex-start!important;flex-wrap:wrap!important}.review-controls{width:100%;margin:4px 0 0}.review-choice{flex:1;justify-content:center}.review-result-chip{margin:5px 0 0 36px}.review-final-actions{flex-direction:column}.review-final-actions button{justify-content:center;width:100%}}"
  ].join("");
  document.head.appendChild(style);

  form.reset();
  Store.restoreForm(form, application.formData || {});
  Store.applyDocuments(form, application.documents || {});
  form.classList.add("application-readonly");
  document.body.classList.add("application-mode-page", isReview ? "review-mode-page" : "view-mode-page");
  form.querySelectorAll("input,textarea,select").forEach(function (control) {
    if (control.type === "hidden") return;
    if (control.tagName === "SELECT" || control.type === "radio" || control.type === "checkbox" || control.type === "file") control.disabled = true;
    else control.readOnly = true;
  });

  function sectionReview(id) {
    if (!review.sections[id]) review.sections[id] = { status: "pending", reason: "", previousReason: "", reviewedAt: "" };
    return review.sections[id];
  }

  function updateNavStatus(id, status) {
    var link = document.querySelector('.section-nav a[href="#' + id + '"]');
    if (!link) return;
    var badge = link.querySelector(".review-nav-status");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "review-nav-status";
      link.appendChild(badge);
    }
    badge.className = "review-nav-status " + status;
    badge.textContent = status === "approved" ? "Pass" : (status === "rejected" ? "Issue" : "Pending");
  }

  function markReviewStarted() {
    if (application.status === "Merchant Submit") Store.recordStatus(application, "Under Review", "Operations", Store.timestamp());
  }

  function persistReview() {
    markReviewStarted();
    application.review = review;
    application.lastUpdate = Store.timestamp();
    application = Store.upsertApplication(application);
  }

  function allReviewed() {
    return sections.every(function (section) { return sectionReview(section.getAttribute("data-section")).status !== "pending"; });
  }

  function allApproved() {
    return sections.every(function (section) { return sectionReview(section.getAttribute("data-section")).status === "approved"; });
  }

  function hasRejected() {
    return sections.some(function (section) { return sectionReview(section.getAttribute("data-section")).status === "rejected"; });
  }

  function rejectedReasonsComplete() {
    return sections.every(function (section) {
      var result = sectionReview(section.getAttribute("data-section"));
      return result.status !== "rejected" || Boolean((result.reason || "").trim());
    });
  }

  function updateFinalButtons() {
    var approve = document.getElementById("review-approve-application");
    var returnButton = document.getElementById("review-return-application");
    if (!approve || !returnButton) return;
    approve.disabled = !allApproved();
    returnButton.disabled = !allReviewed() || !hasRejected() || !rejectedReasonsComplete();
  }

  function showResult(title, message) {
    if (!successBanner) return;
    successTitle.textContent = title;
    successMessage.textContent = message;
    successBanner.hidden = false;
  }

  function paintReviewSection(section) {
    var id = section.getAttribute("data-section");
    var result = sectionReview(id);
    section.classList.toggle("review-approved", result.status === "approved");
    section.classList.toggle("review-rejected", result.status === "rejected");
    section.querySelectorAll(".upload-card").forEach(function (card) {
      if (result.status === "rejected") {
        card.style.setProperty("border-color", "#e36a62", "important");
        card.style.setProperty("background", "#fffafa", "important");
        card.style.setProperty("transition", "none", "important");
      } else {
        card.style.removeProperty("border-color");
        card.style.removeProperty("background");
        card.style.removeProperty("transition");
      }
    });
    section.querySelector('[data-review-decision="approved"]').classList.toggle("is-selected", result.status === "approved");
    section.querySelector('[data-review-decision="rejected"]').classList.toggle("is-selected", result.status === "rejected");
    var reasonBox = section.querySelector(".review-reason");
    reasonBox.hidden = result.status !== "rejected";
    reasonBox.querySelector("textarea").value = result.reason || result.previousReason || "";
    updateNavStatus(id, result.status);
    updateFinalButtons();
  }

  var heading = document.querySelector(".page-heading h1");
  if (heading) heading.textContent = (isReview ? "Review " : "View ") + channel + " Application";
  var registrationShell = document.querySelector(".registration-shell");
  var modeBanner = document.createElement("div");
  modeBanner.className = "application-mode-banner";
  modeBanner.innerHTML = '<div><strong>' + application.merchantName + '</strong><span>Process ' + application.processId + ' · ' + (isReview ? 'Review every application section before the final decision.' : 'Read-only merchant application record.') + '</span></div><a class="application-back-link" href="38.Merchant_onboard.html">Back to Onboarding</a>';
  registrationShell.parentNode.insertBefore(modeBanner, registrationShell);

  if (!isReview) {
    if (window.PaywizardOnboardingProgress) {
      var progress = document.createElement("div");
      progress.className = "platform-application-progress";
      registrationShell.parentNode.insertBefore(progress, registrationShell);
      window.PaywizardOnboardingProgress.render(progress, Store.publicProgress(application), {
        title: "Application Progress & Audit History",
        description: "A read-only record of every lifecycle status, submission round, actor and event time.",
        showActor: true,
        showInferred: true
      });
    }
    sections.forEach(function (section) {
      var id = section.getAttribute("data-section");
      var result = sectionReview(id);
      if ((application.status !== "Approved" && application.status !== "Returned" && application.status !== "Merchant Created") || (result.status !== "approved" && result.status !== "rejected")) return;
      section.classList.add(result.status === "approved" ? "review-approved" : "review-rejected");
      var chip = document.createElement("span");
      chip.className = "review-result-chip " + result.status;
      chip.innerHTML = '<img src="assets/icons/' + (result.status === "approved" ? "task_alt.svg" : "close.svg") + '" alt="" />' + (result.status === "approved" ? "Pass" : "Issue");
      section.querySelector(".section-header").appendChild(chip);
      updateNavStatus(id, result.status);
      if (result.status === "rejected") {
        var resultBox = document.createElement("div");
        resultBox.className = "view-review-result";
        resultBox.innerHTML = '<strong>Review feedback</strong><p></p>';
        resultBox.querySelector("p").textContent = result.reason || result.previousReason || "Changes were requested for this section.";
        section.appendChild(resultBox);
      }
    });
    if (successBanner) successBanner.hidden = true;
    form.querySelector(".form-actions").innerHTML = '<div class="view-final-actions"><a href="38.Merchant_onboard.html">Back to Onboarding</a></div>';
    return;
  }

  sections.forEach(function (section) {
    var id = section.getAttribute("data-section");
    var header = section.querySelector(".section-header");
    var controls = document.createElement("div");
    controls.className = "review-controls";
    controls.innerHTML = '<button class="review-choice pass" type="button" data-review-decision="approved"><img src="assets/icons/task_alt.svg" alt="" />Pass</button><button class="review-choice reject" type="button" data-review-decision="rejected"><img src="assets/icons/close.svg" alt="" />Issue</button>';
    header.appendChild(controls);
    var reason = document.createElement("div");
    reason.className = "review-reason";
    reason.hidden = true;
    reason.innerHTML = '<label for="review-reason-' + id + '">Reason for returning this section</label><textarea id="review-reason-' + id + '" placeholder="Explain what the merchant needs to correct before resubmitting."></textarea>';
    section.appendChild(reason);

    controls.addEventListener("click", function (event) {
      var button = event.target.closest("[data-review-decision]");
      if (!button) return;
      var result = sectionReview(id);
      result.status = button.getAttribute("data-review-decision");
      result.reviewedAt = Store.timestamp();
      if (result.status === "approved") result.reason = "";
      paintReviewSection(section);
      persistReview();
    });
    reason.querySelector("textarea").addEventListener("input", function () {
      var result = sectionReview(id);
      result.reason = this.value.trim();
      this.setCustomValidity("");
      persistReview();
      updateFinalButtons();
    });
    paintReviewSection(section);
  });

  var formActions = form.querySelector(".form-actions");
  formActions.innerHTML = '<div class="review-final-actions"><button class="review-approve" id="review-approve-application" type="button"><img src="assets/icons/task_alt.svg" alt="" />Approve Application</button><button class="review-return" id="review-return-application" type="button"><img src="assets/icons/close.svg" alt="" />Return to Merchant</button></div>';
  updateFinalButtons();

  function finishReviewActions() {
    var actionGroup = formActions.querySelector(".review-final-actions");
    actionGroup.querySelectorAll("button").forEach(function (button) { button.disabled = true; });
    if (!actionGroup.querySelector(".review-back")) {
      var back = document.createElement("a");
      back.className = "review-back";
      back.href = "38.Merchant_onboard.html";
      back.textContent = "Back to Onboarding";
      actionGroup.appendChild(back);
      back.focus();
    }
  }

  document.getElementById("review-approve-application").addEventListener("click", function () {
    if (!allApproved()) {
      showResult("Review incomplete", "Every section must pass before the application can be approved.");
      return;
    }
    review.reviewedAt = Store.timestamp();
    application.review = review;
    application.reviewedAt = review.reviewedAt;
    Store.recordStatus(application, "Approved", "Operations", review.reviewedAt);
    application = Store.upsertApplication(application);
    showResult("Application approved", application.merchantName + " is ready for the next onboarding step. Use Back to Onboarding to return to the list.");
    finishReviewActions();
  });

  document.getElementById("review-return-application").addEventListener("click", function () {
    var valid = true;
    sections.forEach(function (section) {
      var result = sectionReview(section.getAttribute("data-section"));
      if (result.status !== "rejected") return;
      var textarea = section.querySelector(".review-reason textarea");
      result.reason = textarea.value.trim();
      textarea.setCustomValidity(result.reason ? "" : "Enter a reason before returning this section.");
      if (!result.reason) valid = false;
    });
    if (!allReviewed() || !hasRejected() || !valid) {
      showResult("Review incomplete", "Review all six sections and add a reason to every section marked Issue.");
      return;
    }
    review.reviewedAt = Store.timestamp();
    application.review = review;
    application.reviewedAt = review.reviewedAt;
    Store.recordStatus(application, "Returned", "Operations", review.reviewedAt);
    application = Store.upsertApplication(application);
    showResult("Returned to merchant", "The merchant can now open the original link, review your comments and resubmit the application.");
    finishReviewActions();
  });
})();
