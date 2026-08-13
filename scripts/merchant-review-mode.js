(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  if (params.get("mode") !== "review") return;

  var Store = window.PaywizardOnboardingStore;
  var applicationId = params.get("applicationId") || "";
  var application = Store && Store.findApplication(applicationId);
  var form = document.querySelector("form");
  if (!Store || !application || !form) return;

  var channel = application.channel;
  var sections = Array.prototype.slice.call(form.querySelectorAll(".form-section[data-section]"));
  var review = application.review || Store.createReview(channel);
  var successBanner = document.getElementById("success-banner");
  var successTitle = document.getElementById("success-title");
  var successMessage = document.getElementById("success-message");

  var style = document.createElement("style");
  style.textContent = [
    ".review-application-banner{max-width:1520px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 auto 14px;padding:13px 16px;border:1px solid #bfd6ee;border-radius:7px;background:#f1f7fd;color:#34495e}",
    ".review-application-banner strong{display:block;margin-bottom:2px;font-size:12px}.review-application-banner span{font-size:10px;color:#657789}.review-back-link{flex:none;padding:8px 12px;border:1px solid #b9c7d6;border-radius:6px;background:#fff;color:#334155;font-size:10px;font-weight:700;text-decoration:none}",
    ".form-section.review-approved{border-color:#55b981;background:#f2fbf6;box-shadow:0 0 0 1px rgba(18,130,73,.08)}",
    ".form-section.review-rejected{border-color:#e36a62;background:#fff6f5;box-shadow:0 0 0 1px rgba(217,45,32,.08)}",
    ".form-section.review-approved>.section-header{background:#eaf8f0;border-bottom-color:#b9e1c9}.form-section.review-rejected>.section-header{background:#fff0ef;border-bottom-color:#f1c1bd}",
    ".review-controls{display:flex;align-items:center;gap:7px;margin-left:auto}.review-choice{min-height:31px;display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid #cfd5dc;border-radius:6px;background:#fff;color:#4d5560;font:600 10px inherit;cursor:pointer}.review-choice img{width:14px;height:14px}.review-choice.pass.is-selected{border-color:#2e9c60;background:#e1f6e9;color:#13733d}.review-choice.reject.is-selected{border-color:#d92d20;background:#ffe6e3;color:#b42318}",
    ".review-reason{padding:14px 18px 16px;border-top:1px solid #f0c2be;background:#fff9f8}.review-reason[hidden]{display:none}.review-reason label{display:block;margin-bottom:6px;color:#9f2d25;font-size:10px;font-weight:700}.review-reason textarea{width:100%;min-height:78px;padding:10px 12px;border:1px solid #e49a94;border-radius:6px;background:#fff;color:#363a42;font:11px/1.5 inherit;resize:vertical}.review-reason textarea:focus{outline:2px solid rgba(217,45,32,.13);border-color:#d92d20}",
    ".review-mode-page .section-nav a{grid-template-columns:18px minmax(0,1fr) auto;align-items:start}.review-nav-status{grid-column:3;grid-row:1;align-self:center;margin:0 0 0 5px!important;padding:2px 6px;border-radius:999px;font-size:8px!important;font-weight:700;line-height:1.25;white-space:nowrap}.review-nav-status.approved{background:#dcf7e7;color:#147a41}.review-nav-status.rejected{background:#ffe2df;color:#b42318}.review-nav-status.pending{background:#eceff3;color:#6b7280}",
    ".review-mode input[readonly],.review-mode textarea[readonly],.review-mode select:disabled,.review-mode input:disabled{background:#f5f6f8!important;color:#50555e!important;cursor:default;opacity:1}.review-mode .upload-card{pointer-events:none;background:#f5f6f8}",
    ".review-mode-page .form-section.review-rejected .upload-card,.review-mode-page .form-section.review-rejected .upload-card.has-file{border-color:#e36a62!important;background:#fffafa!important;box-shadow:none!important;transition:none!important}",
    ".review-final-actions{display:flex;justify-content:flex-end;gap:10px;width:100%}.review-final-actions button{min-height:40px;display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:6px;font:700 11px inherit;cursor:pointer}.review-final-actions img{width:15px;height:15px}.review-approve{border:1px solid #128249;background:#128249;color:#fff}.review-return{border:1px solid #d92d20;background:#d92d20;color:#fff}.review-final-actions button:disabled{cursor:not-allowed;opacity:.48}",
    "@media(max-width:760px){.review-application-banner{align-items:flex-start;flex-direction:column}.section-header{align-items:flex-start;flex-wrap:wrap}.review-controls{width:100%;margin:4px 0 0}.review-choice{flex:1;justify-content:center}.review-final-actions{flex-direction:column}.review-final-actions button{justify-content:center;width:100%}}"
  ].join("");
  document.head.appendChild(style);

  function sampleValue(control) {
    var name = control.name || "";
    if (control.type === "date") return "1988-06-15";
    if (control.type === "email") return "merchant.review@example.com";
    if (control.type === "tel") return name.toLowerCase().indexOf("countrycode") >= 0 ? "+1" : "4165550188";
    if (control.type === "number") {
      if (/percent/i.test(name)) return "100";
      return String(Math.max(Number(control.min) || 0, 1));
    }
    if (/postal/i.test(name)) return "M5H 2N2";
    if (/city/i.test(name)) return channel === "Nuvei" ? "Toronto" : "Dublin";
    if (/province/i.test(name)) return channel === "Nuvei" ? "Ontario" : "Leinster";
    if (/street/i.test(name)) return "King Street";
    if (/civic/i.test(name)) return "128";
    if (/url|validation/i.test(name)) return "https://merchant.example.com";
    if (/name/i.test(name)) return application.merchantName || "Sample Merchant";
    return "Sample merchant information";
  }

  function completeSampleData() {
    Store.restoreForm(form, application.formData || {});
    form.querySelectorAll("select[required]").forEach(function (control) {
      if (control.value) return;
      var option = Array.prototype.slice.call(control.options).find(function (item) { return item.value; });
      if (option) control.value = option.value;
    });
    form.querySelectorAll('input[type="radio"][required]').forEach(function (control) {
      if (!form.querySelector('input[type="radio"][name="' + CSS.escape(control.name) + '"]:checked')) control.checked = true;
    });
    form.querySelectorAll('input[type="checkbox"][required]').forEach(function (control) { control.checked = true; });
    form.querySelectorAll("input[required],textarea[required]").forEach(function (control) {
      if (control.type === "file" || control.type === "radio" || control.type === "checkbox" || control.value) return;
      control.value = sampleValue(control);
    });
    Store.applyDocuments(form, application.documents || {});
    application.formData = Object.assign({}, application.formData || {}, Store.serializeForm(form));
    application = Store.upsertApplication(application);
  }

  function lockMerchantFields() {
    form.classList.add("review-mode");
    document.body.classList.add("review-mode-page");
    form.querySelectorAll("input,textarea,select").forEach(function (control) {
      if (control.type === "hidden") return;
      if (control.tagName === "SELECT" || control.type === "radio" || control.type === "checkbox" || control.type === "file") control.disabled = true;
      else control.readOnly = true;
    });
  }

  function persistReview() {
    application.review = review;
    application.lastUpdate = Store.timestamp();
    application = Store.upsertApplication(application);
  }

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

  function paintSection(section) {
    var id = section.getAttribute("data-section");
    var result = sectionReview(id);
    section.classList.toggle("review-approved", result.status === "approved");
    section.classList.toggle("review-rejected", result.status === "rejected");
    section.querySelector('[data-review-decision="approved"]').classList.toggle("is-selected", result.status === "approved");
    section.querySelector('[data-review-decision="rejected"]').classList.toggle("is-selected", result.status === "rejected");
    var reasonBox = section.querySelector(".review-reason");
    reasonBox.hidden = result.status !== "rejected";
    reasonBox.querySelector("textarea").value = result.reason || result.previousReason || "";
    updateNavStatus(id, result.status);
    updateFinalButtons();
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
    successTitle.textContent = title;
    successMessage.textContent = message;
    successBanner.hidden = false;
  }

  function validateReasons() {
    var valid = true;
    sections.forEach(function (section) {
      var id = section.getAttribute("data-section");
      var result = sectionReview(id);
      if (result.status !== "rejected") return;
      var textarea = section.querySelector(".review-reason textarea");
      result.reason = textarea.value.trim();
      textarea.setCustomValidity(result.reason ? "" : "Enter a reason before returning this section.");
      if (!result.reason) {
        valid = false;
        textarea.reportValidity();
        section.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    return valid;
  }

  completeSampleData();
  lockMerchantFields();
  application.status = "Under Review";
  application.lastUpdate = Store.timestamp();
  application = Store.upsertApplication(application);

  var heading = document.querySelector(".page-heading h1");
  if (heading) heading.textContent = "Review " + channel + " Application";
  var registrationShell = document.querySelector(".registration-shell");
  var reviewBanner = document.createElement("div");
  reviewBanner.className = "review-application-banner";
  reviewBanner.innerHTML = '<div><strong>' + application.merchantName + '</strong><span>Process ' + application.processId + ' · Review every application section before the final decision.</span></div><a class="review-back-link" href="38.Merchant_onboard.html">Back to Onboarding</a>';
  registrationShell.parentNode.insertBefore(reviewBanner, registrationShell);

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
      paintSection(section);
      persistReview();
    });
    reason.querySelector("textarea").addEventListener("input", function () {
      var result = sectionReview(id);
      result.reason = this.value.trim();
      this.setCustomValidity("");
      persistReview();
      updateFinalButtons();
    });
    paintSection(section);
  });

  var formActions = form.querySelector(".form-actions");
  formActions.innerHTML = '<div class="review-final-actions"><button class="review-approve" id="review-approve-application" type="button"><img src="assets/icons/task_alt.svg" alt="" />Approve Application</button><button class="review-return" id="review-return-application" type="button"><img src="assets/icons/close.svg" alt="" />Return to Merchant</button></div>';
  updateFinalButtons();

  document.getElementById("review-approve-application").addEventListener("click", function () {
    if (!allApproved()) {
      showResult("Review incomplete", "Every section must pass before the application can be approved.");
      return;
    }
    review.reviewedAt = Store.timestamp();
    application.review = review;
    application.status = "Approved";
    application.reviewedAt = review.reviewedAt;
    application.lastUpdate = review.reviewedAt;
    application = Store.upsertApplication(application);
    showResult("Application approved", application.merchantName + " is ready for the next onboarding step. Use Back to Onboarding to return to the list.");
    updateFinalButtons();
  });

  document.getElementById("review-return-application").addEventListener("click", function () {
    if (!allReviewed() || !hasRejected() || !validateReasons()) {
      showResult("Review incomplete", "Review all six sections and add a reason to every section marked Issue.");
      return;
    }
    review.reviewedAt = Store.timestamp();
    application.review = review;
    application.status = "Returned";
    application.reviewedAt = review.reviewedAt;
    application.lastUpdate = review.reviewedAt;
    application = Store.upsertApplication(application);
    showResult("Returned to merchant", "The merchant can now open the original link, review your comments and resubmit the application.");
    updateFinalButtons();
  });
})();
