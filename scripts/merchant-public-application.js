(function () {
  "use strict";

  var Store = window.PaywizardOnboardingStore;
  var body = document.body;
  var channel = body.getAttribute("data-channel") || "Payment";
  var frame = document.getElementById("source-frame");
  var params = new URLSearchParams(window.location.search);
  var applicationId = params.get("applicationId") || "";
  var application = Store && applicationId ? Store.findApplication(applicationId) : null;
  var merchantName = (application && application.merchantName) || params.get("merchantName") || "your business";
  var contactName = (application && application.contactName) || params.get("contactName") || "";
  var email = (application && application.email) || params.get("email") || "";
  var phone = (application && application.phone) || params.get("phone") || "";
  var resizeObserver;
  var dirtySections = {};

  document.getElementById("merchant-greeting").textContent = merchantName === "your business"
    ? "We have prepared this application for your business."
    : "We have prepared this application for " + merchantName + ".";
  document.title = channel + " Merchant Application - PAYwizard";

  function setValue(doc, name, value) {
    if (!value) return;
    var control = doc.querySelector('[name="' + name + '"]');
    if (!control || control.value) return;
    control.value = value;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function prefillMerchantDetails(doc) {
    if (channel === "Nuvei") {
      setValue(doc, "legalName", merchantName);
      setValue(doc, "dbaName", merchantName);
      setValue(doc, "legalPhone", phone);
      setValue(doc, "legalMobile", phone);
      setValue(doc, "dbaPhone", phone);
    } else {
      setValue(doc, "registeredBusinessName", merchantName);
      setValue(doc, "dbaName", merchantName);
      setValue(doc, "companyEmail", email);
      setValue(doc, "companyPhone", phone);
    }
    setValue(doc, "authorizedContact", contactName);
    setValue(doc, "statementEmail", email);
    setValue(doc, "merchantCustomerServicePhone", phone);
  }

  function resizeFrame(doc) {
    window.requestAnimationFrame(function () {
      var height = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight, 720);
      frame.style.height = Math.ceil(height + 4) + "px";
    });
  }

  function updateApplication(mutator) {
    if (!Store || !application) return null;
    mutator(application);
    application.lastUpdate = Store.timestamp();
    application = Store.upsertApplication(application);
    return application;
  }

  function storeFormState(form) {
    updateApplication(function (item) {
      item.formData = Object.assign({}, item.formData || {}, Store.serializeForm(form));
      item.documents = Store.collectDocuments(form, item.documents || {});
    });
  }

  function setSectionEditable(section, editable) {
    section.querySelectorAll("input,textarea,select").forEach(function (control) {
      if (control.type === "hidden") return;
      if (editable) {
        if (control.hasAttribute("data-public-was-disabled")) {
          control.disabled = false;
          control.removeAttribute("data-public-was-disabled");
        }
      } else {
        control.disabled = true;
        control.setAttribute("data-public-was-disabled", "true");
      }
    });
  }

  function addReturnedSummary() {
    if (!application || application.status !== "Returned") return;
    var issueCount = Object.keys((application.review && application.review.sections) || {}).filter(function (id) {
      return application.review.sections[id].status === "rejected";
    }).length;
    var summary = document.createElement("section");
    summary.className = "changes-requested";
    summary.id = "changes-requested";
    summary.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">assignment_late</span><div><strong>Changes requested</strong><p>The PAYwizard onboarding team found ' + issueCount + ' section' + (issueCount === 1 ? '' : 's') + ' that need attention. Review the comments below, update the application and submit it again.</p></div>';
    var embed = document.querySelector(".application-embed");
    embed.parentNode.insertBefore(summary, embed);
  }

  function addMerchantReviewState(doc, form) {
    if (!application || application.status !== "Returned" || !application.review) return;
    Object.keys(application.review.sections || {}).forEach(function (id) {
      var result = application.review.sections[id];
      var section = doc.querySelector('.form-section[data-section="' + id + '"]');
      if (!section || (result.status !== "approved" && result.status !== "rejected")) return;
      var header = section.querySelector(".section-header");
      var status = doc.createElement("div");
      status.className = "merchant-review-status " + result.status;
      if (result.status === "approved") {
        status.innerHTML = '<img src="assets/icons/task_alt.svg" alt="" /><span>Section approved</span><button type="button" class="edit-approved-section">Edit this section</button>';
        section.classList.add("merchant-review-approved");
        setSectionEditable(section, false);
        status.querySelector("button").addEventListener("click", function () {
          setSectionEditable(section, true);
          section.classList.add("merchant-review-editing");
          this.hidden = true;
          resizeFrame(doc);
        });
      } else {
        status.innerHTML = '<img src="assets/icons/close.svg" alt="" /><span><strong>Changes required</strong>' + (result.reason || result.previousReason || "Please update this section.") + '</span>';
        section.classList.add("merchant-review-rejected");
      }
      header.appendChild(status);
    });

    form.addEventListener("input", function (event) {
      var section = event.target.closest(".form-section[data-section]");
      if (!section || !section.classList.contains("merchant-review-editing")) return;
      dirtySections[section.getAttribute("data-section")] = true;
    });
    form.addEventListener("change", function (event) {
      var section = event.target.closest(".form-section[data-section]");
      if (!section || !section.classList.contains("merchant-review-editing")) return;
      dirtySections[section.getAttribute("data-section")] = true;
    });
  }

  function prepareReviewForResubmission() {
    if (!application || !application.review) return;
    Object.keys(application.review.sections || {}).forEach(function (id) {
      var result = application.review.sections[id];
      if (result.status === "rejected" || (result.status === "approved" && dirtySections[id])) {
        result.previousReason = result.reason || result.previousReason || "";
        result.status = "pending";
        result.reason = "";
        result.reviewedAt = "";
      }
    });
  }

  function clearReturnedPresentation(doc) {
    var summary = document.getElementById("changes-requested");
    if (summary) {
      summary.classList.add("resubmitted");
      summary.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">task_alt</span><div><strong>Application resubmitted</strong><p>Your updates have been sent to the PAYwizard onboarding team for review.</p></div>';
    }
    doc.querySelectorAll(".merchant-review-approved,.merchant-review-rejected").forEach(function (section) {
      setSectionEditable(section, true);
      section.classList.remove("merchant-review-approved", "merchant-review-rejected", "merchant-review-editing");
      var state = section.querySelector(".merchant-review-status");
      if (state) state.remove();
    });
  }

  function customizeEmbeddedApplication() {
    var doc = frame.contentDocument;
    if (!doc) return;

    var style = doc.createElement("style");
    style.textContent = [
      ":root{--sidebar:0px!important}",
      "html{scroll-padding-top:16px!important}",
      "body{min-width:0!important;background:#f4f6f8!important}",
      ".sidebar,.topbar,.page-heading,.context-card,.section-nav{display:none!important}",
      ".app-main{margin-left:0!important}",
      ".content{padding:0 0 48px!important}",
      ".registration-shell{max-width:none!important;display:block!important;margin:0!important}",
      ".form-section{border-radius:7px!important;transition:border-color .18s ease,background .18s ease}",
      ".form-section.merchant-review-approved{border-color:#64bd89!important;background:#f3fbf6!important}.form-section.merchant-review-rejected{border-color:#df655d!important;background:#fff7f6!important}",
      ".merchant-review-approved>.section-header{background:#eaf8f0!important;border-bottom-color:#b8dfc8!important}.merchant-review-rejected>.section-header{background:#fff0ef!important;border-bottom-color:#efbbb7!important}",
      ".merchant-review-status{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:9px;font-weight:700}.merchant-review-status img{width:15px;height:15px}.merchant-review-status.approved{color:#137541}.merchant-review-status.rejected{max-width:520px;align-items:flex-start;color:#b42318}.merchant-review-status.rejected span{display:grid;gap:2px}.merchant-review-status.rejected strong{font-size:10px}.edit-approved-section{margin-left:5px;padding:5px 8px;border:1px solid #74bb92;border-radius:5px;background:#fff;color:#137541;font:700 9px inherit;cursor:pointer}",
      ".merchant-review-approved:not(.merchant-review-editing) input,.merchant-review-approved:not(.merchant-review-editing) textarea,.merchant-review-approved:not(.merchant-review-editing) select{background:#f2f5f3!important;color:#626a65!important;opacity:1}.merchant-review-approved:not(.merchant-review-editing) .upload-card{pointer-events:none;background:#f2f5f3!important}",
      ".form-actions{position:sticky;bottom:0;z-index:10;padding:14px 16px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 -6px 18px rgba(30,35,44,.05)}",
      ".success-banner{position:fixed!important}",
      "@media(max-width:760px){.section-header{align-items:flex-start!important;flex-wrap:wrap!important}.merchant-review-status{width:100%;margin:4px 0 0}.merchant-review-status.rejected{max-width:none}.edit-approved-section{margin-left:auto}}",
      "@media(max-width:640px){.content{padding:0 0 32px!important}.form-actions{position:static!important;padding-inline:0!important}.section-body{padding:14px!important}}"
    ].join("");
    doc.head.appendChild(style);

    var form = doc.querySelector("form");
    if (!form) return;
    form.reset();
    if (application && Store) {
      Store.restoreForm(form, application.formData || {});
      Store.applyDocuments(form, application.documents || {});
    }
    prefillMerchantDetails(doc);
    addMerchantReviewState(doc, form);

    var saveDraft = doc.getElementById("save-draft");
    if (saveDraft) {
      saveDraft.addEventListener("click", function () {
        storeFormState(form);
        var title = doc.getElementById("success-title");
        var message = doc.getElementById("success-message");
        if (title) title.textContent = "Draft saved";
        if (message) message.textContent = "Your progress is saved to this application link in this browser.";
        resizeFrame(doc);
      });
    }

    form.addEventListener("submit", function () {
      window.setTimeout(function () {
        if (!form.checkValidity()) return;
        if (application && Store) {
          storeFormState(form);
          prepareReviewForResubmission();
          updateApplication(function (item) {
            item.status = "Merchant Submit";
            item.submissionVersion = Number(item.submissionVersion || 0) + 1;
            item.submittedAt = Store.timestamp();
            item.review = application.review;
          });
          clearReturnedPresentation(doc);
        }
        var title = doc.getElementById("success-title");
        var message = doc.getElementById("success-message");
        if (title) title.textContent = "Thank you — application received";
        if (message) message.textContent = "Your information is ready for the PAYwizard onboarding team to review.";
        resizeFrame(doc);
      }, 0);
    });

    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(function () { resizeFrame(doc); });
    resizeObserver.observe(doc.body);
    resizeFrame(doc);
    window.setTimeout(function () { resizeFrame(doc); }, 300);
    window.setTimeout(function () { resizeFrame(doc); }, 1200);
  }

  function handleFrameLoad() {
    document.getElementById("frame-loading").hidden = true;
    frame.hidden = false;
    customizeEmbeddedApplication();
  }

  addReturnedSummary();
  frame.addEventListener("load", handleFrameLoad);
  if (frame.contentDocument && frame.contentDocument.readyState === "complete") handleFrameLoad();
})();
