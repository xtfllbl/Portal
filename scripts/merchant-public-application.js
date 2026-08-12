(function () {
  "use strict";

  var APPLICATIONS_KEY = "paywizard-onboarding-applications-v2";
  var body = document.body;
  var channel = body.getAttribute("data-channel") || "Payment";
  var frame = document.getElementById("source-frame");
  var params = new URLSearchParams(window.location.search);
  var applicationId = params.get("applicationId") || "Pending reference";
  var merchantName = params.get("merchantName") || "your business";
  var contactName = params.get("contactName") || "";
  var email = params.get("email") || "";
  var phone = params.get("phone") || "";
  var resizeObserver;

  document.getElementById("merchant-greeting").textContent = merchantName === "your business"
    ? "We have prepared this application for your business."
    : "We have prepared this application for " + merchantName + ".";
  document.getElementById("application-reference").textContent = applicationId;
  document.getElementById("channel-name").textContent = channel;
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

  function updateApplicationStatus(status) {
    if (!applicationId || applicationId === "Pending reference") return;
    try {
      var applications = JSON.parse(window.localStorage.getItem(APPLICATIONS_KEY) || "[]");
      if (!Array.isArray(applications)) return;
      var application = applications.find(function (item) { return item.applicationId === applicationId; });
      if (!application) return;
      application.status = status;
      application.lastUpdate = new Date().toISOString().replace("T", " ").slice(0, 19);
      window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
    } catch (error) {
      return;
    }
  }

  function customizeEmbeddedApplication() {
    var doc = frame.contentDocument;
    if (!doc) return;

    var style = doc.createElement("style");
    style.textContent = [
      ":root{--sidebar:0px!important}",
      "html{scroll-padding-top:16px!important}",
      "body{min-width:0!important;background:#f5f6f8!important}",
      ".sidebar,.topbar,.page-heading,.context-card,.section-nav{display:none!important}",
      ".app-main{margin-left:0!important}",
      ".content{padding:14px 14px 48px!important}",
      ".registration-shell{max-width:none!important;display:block!important;margin:0!important}",
      ".form-section{border-radius:7px!important}",
      ".form-actions{position:sticky;bottom:0;z-index:10;padding:14px 16px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 -6px 18px rgba(30,35,44,.05)}",
      ".success-banner{position:fixed!important}",
      "@media(max-width:640px){.content{padding:10px 8px 32px!important}.form-actions{position:static!important;padding-inline:0!important}.section-body{padding:14px!important}}"
    ].join("");
    doc.head.appendChild(style);

    prefillMerchantDetails(doc);

    var saveDraft = doc.getElementById("save-draft");
    var form = doc.querySelector("form");
    if (saveDraft) {
      saveDraft.addEventListener("click", function () {
        document.getElementById("progress-message").textContent = "Progress saved in this browser. Keep this link to return later.";
        resizeFrame(doc);
      });
    }

    if (form) {
      form.addEventListener("submit", function () {
        window.setTimeout(function () {
          if (!form.checkValidity()) return;
          var title = doc.getElementById("success-title");
          var message = doc.getElementById("success-message");
          if (title) title.textContent = "Thank you — application received";
          if (message) message.textContent = "Your information is ready for the PAYwizard onboarding team to review.";
          document.getElementById("progress-message").textContent = "Application submitted. The PAYwizard onboarding team can now review your information.";
          updateApplicationStatus("Merchant Submit");
          resizeFrame(doc);
        }, 0);
      });
    }

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

  frame.addEventListener("load", handleFrameLoad);
  if (frame.contentDocument && frame.contentDocument.readyState === "complete") handleFrameLoad();
})();
