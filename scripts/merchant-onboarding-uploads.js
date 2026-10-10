(function () {
  "use strict";

  var form = document.getElementById("nuvei-form") || document.getElementById("elavon-form");
  if (!form) return;
  var LIMIT = 10;

  function focusMessage(message) {
    message.scrollIntoView({ block: "center", behavior: "instant" });
    message.focus({ preventScroll: true });
    // The public form lives in an expanding iframe; also reveal the message in its outer scroller.
    if (window.frameElement) {
      var frameRect = window.frameElement.getBoundingClientRect();
      var rect = message.getBoundingClientRect();
      window.parent.scrollBy({ top: frameRect.top + rect.top - window.parent.innerHeight / 2, behavior: "instant" });
    }
  }

  function errorMessage(container, id) {
    var message = document.createElement("p");
    message.id = id;
    message.className = "onboarding-field-error";
    message.setAttribute("role", "alert");
    message.tabIndex = -1;
    message.hidden = true;
    container.appendChild(message);
    return message;
  }

  function describe(input, id) {
    input.setAttribute("aria-describedby", [input.getAttribute("aria-describedby"), id].filter(Boolean).join(" "));
  }

  form.querySelectorAll('input[type="file"]').forEach(function (input) {
    var card = input.closest(".upload-card");
    var wrapper = document.createElement("div");
    wrapper.className = "onboarding-upload";
    card.parentNode.insertBefore(wrapper, card);
    wrapper.appendChild(card);
    var uploadField = wrapper.closest(".upload-field");
    var title = uploadField && uploadField.querySelector(".upload-title");
    var label = (title || card.querySelector("strong")).firstChild.textContent.trim();
    input.setAttribute("aria-label", label);
    var required = input.required;
    var items = [];
    var notifying = false;
    var hint = card.querySelector("[data-file-name]");
    var emptyHint = hint.getAttribute("data-default-text") || "Browse Files · Drag and drop files here";
    var formats = input.accept.split(",").map(function (value) { return value.trim().toLowerCase(); });
    var limitHint = document.createElement("span");
    limitHint.className = "upload-limit";
    limitHint.id = input.name + "-limit";
    limitHint.textContent = "Up to 10 files · " + formats.map(function (extension) { return extension.slice(1).toUpperCase(); }).join(", ");
    card.appendChild(limitHint);
    describe(input, limitHint.id);
    var list = document.createElement("ul");
    list.className = "onboarding-file-list";
    list.setAttribute("aria-label", label + " files");
    wrapper.appendChild(list);
    var error = errorMessage(wrapper, input.name + "-error");
    describe(input, error.id);

    function metadata(item) {
      return { name: item.name, type: item.type || "application/octet-stream", size: item.size || 0 };
    }

    function render() {
      var transfer = new DataTransfer();
      items.forEach(function (item) { if (item instanceof File) transfer.items.add(item); });
      input.files = transfer.files;
      // Saved prototype attachments have metadata but cannot be reconstructed as native Files.
      input.required = required && !items.some(function (item) { return !(item instanceof File); });
      input.toggleAttribute("data-existing-document", items.some(function (item) { return !(item instanceof File); }));
      card.classList.toggle("has-file", items.length > 0);
      hint.textContent = items.length ? items.length + " / 10 files selected · Add files" : emptyHint;
      list.replaceChildren();
      items.forEach(function (item, index) {
        var row = document.createElement("li");
        var name = document.createElement("span");
        name.textContent = item.name;
        name.title = item.name;
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "onboarding-file-remove";
        remove.setAttribute("aria-label", "Remove " + item.name);
        remove.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">close</span>';
        remove.addEventListener("click", function () {
          if (input.disabled) return;
          items.splice(index, 1);
          clearError();
          render();
          var next = list.querySelectorAll("button")[Math.min(index, items.length - 1)];
          (next || input).focus({ preventScroll: true });
          notifyChange();
        });
        row.append(name, remove);
        list.appendChild(row);
      });
    }

    function clearError() {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      error.hidden = true;
    }

    function notifyChange() {
      notifying = true;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      notifying = false;
    }

    function reject(message) {
      render();
      input.setCustomValidity(message);
      input.setAttribute("aria-invalid", "true");
      error.textContent = message;
      error.hidden = false;
      focusMessage(error);
    }

    function addFiles(files) {
      if (input.disabled) return;
      if (!files.length) { render(); return; }
      var unsupported = files.find(function (file) {
        return !formats.some(function (extension) { return file.name.toLowerCase().endsWith(extension); });
      });
      if (unsupported) {
        reject('"' + unsupported.name + '" is not supported. Choose ' + formats.join(", ") + " files. Your selected files have been kept.");
        return;
      }
      if (items.length + files.length > LIMIT) {
        reject("You can upload up to 10 files for this item. Remove files or choose fewer files. Your selected files have been kept.");
        return;
      }
      items = items.concat(files);
      clearError();
      render();
    }

    input.onboardingUpload = {
      collect: function () { return items.map(metadata); },
      restore: function (documents) { items = (documents || []).map(metadata); clearError(); render(); }
    };
    input.addEventListener("change", function () {
      if (!notifying) addFiles(Array.from(input.files));
    });
    card.addEventListener("dragover", function (event) {
      event.preventDefault();
      if (!input.disabled) card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", function () { card.classList.remove("drag-over"); });
    card.addEventListener("drop", function (event) {
      event.preventDefault();
      card.classList.remove("drag-over");
      if (input.disabled) return;
      addFiles(Array.from(event.dataTransfer.files));
      notifyChange();
    });
    input.addEventListener("invalid", function () {
      error.textContent = input.validationMessage;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
    });
    new MutationObserver(function () {
      hint.textContent = input.disabled ? items.length + " files" : (items.length ? items.length + " / 10 files selected · Add files" : emptyHint);
    }).observe(input, { attributes: true, attributeFilter: ["disabled"] });
    render();
  });

  form.addEventListener("invalid", function (event) {
    var input = event.target;
    if (input.type === "file") return;
    var field = input.closest(".field") || input.parentNode;
    var message = field.querySelector(".onboarding-field-error") || errorMessage(field, (input.id || input.name) + "-error");
    if (!(input.getAttribute("aria-describedby") || "").includes(message.id)) describe(input, message.id);
    message.textContent = input.validationMessage;
    message.hidden = false;
    input.setAttribute("aria-invalid", "true");
  }, true);

  form.addEventListener("input", function (event) {
    if (event.target.type === "file") return;
    var field = event.target.closest(".field");
    if (!field) return;
    field.querySelectorAll(".onboarding-field-error").forEach(function (message) { message.hidden = true; });
    field.querySelectorAll('[aria-invalid="true"]').forEach(function (input) { input.removeAttribute("aria-invalid"); });
  });

  window.PaywizardOnboardingUploads = {
    focusFirstError: function () {
      var input = form.querySelector("input:invalid,select:invalid,textarea:invalid");
      if (!input) return;
      var container = input.closest(".onboarding-upload, .field") || input.parentNode;
      var message = container.querySelector(".onboarding-field-error:not([hidden])");
      focusMessage(message || input);
    }
  };
})();
