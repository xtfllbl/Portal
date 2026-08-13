(function (global) {
  "use strict";

  var STATUS_LABELS = {
    Draft: "Application created",
    "Awaiting Merchant": "Shared with merchant",
    "Merchant Draft": "Merchant started application",
    "Merchant Submit": "Merchant submitted application",
    "Under Review": "Application under review",
    Returned: "Changes requested",
    Approved: "Application approved",
    "Merchant Created": "Merchant created"
  };
  var STAGES = [
    { label: "Shared", statuses: ["Awaiting Merchant"] },
    { label: "Merchant Started", statuses: ["Merchant Draft"] },
    { label: "Submitted", statuses: ["Merchant Submit"] },
    { label: "Under Review", statuses: ["Under Review"] },
    { label: "Decision", statuses: ["Returned", "Approved"] },
    { label: "Merchant Created", statuses: ["Merchant Created"] }
  ];
  var CURRENT_STAGE = { "Awaiting Merchant": 0, "Merchant Draft": 1, "Merchant Submit": 2, "Under Review": 3, Returned: 4, Approved: 4, "Merchant Created": 5 };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function stageEvent(history, statuses) {
    return history.slice().reverse().find(function (event) { return statuses.indexOf(event.status) !== -1; }) || null;
  }

  function eventLabel(event) {
    if (event.status === "Merchant Submit" && Number(event.submissionVersion || 0) > 1) return "Application resubmitted";
    return STATUS_LABELS[event.status] || event.status;
  }

  function eventClass(status) {
    if (status === "Returned") return " is-event-returned";
    return " is-event-complete";
  }

  function render(container, data, options) {
    if (!container || !data) return;
    options = options || {};
    var history = Array.isArray(data.statusHistory) ? data.statusHistory.slice() : [];
    history.sort(function (left, right) { return String(left.occurredAt).localeCompare(String(right.occurredAt)); });
    var currentStage = Object.prototype.hasOwnProperty.call(CURRENT_STAGE, data.status) ? CURRENT_STAGE[data.status] : -1;
    var hasDecision = data.status === "Approved" || data.status === "Returned" || data.status === "Merchant Created";
    var stateClass = hasDecision ? " has-decision" : "";
    var steps = STAGES.map(function (stage, index) {
      var event = stageEvent(history, stage.statuses);
      var reached = Boolean(event) && index <= currentStage;
      var displayedEvent = reached ? event : null;
      var isDecision = index === 4 && hasDecision;
      var outcomeClass = isDecision ? (data.status === "Returned" ? " is-outcome-returned" : " is-outcome-approved") : "";
      var createdClass = index === 5 && reached ? " is-merchant-created" : "";
      var completedClass = reached && index < currentStage ? " is-completed-stage" : "";
      var label = isDecision ? (data.status === "Returned" ? "Changes Requested" : "Approved") : stage.label;
      var marker = reached ? (data.status === "Returned" && isDecision ? '<img class="progress-change-icon" src="assets/icons/edit.svg" alt="" />' : "&#10003;") : String(index + 1);
      return '<div class="progress-step' + (reached ? ' is-reached' : '') + completedClass + outcomeClass + createdClass + (index === currentStage ? ' is-current' : '') + '">' +
        '<span class="progress-dot" aria-hidden="true">' + marker + '</span>' +
        '<strong>' + escapeHtml(label) + '</strong><time>' + (displayedEvent ? escapeHtml(displayedEvent.occurredAt) : 'Not reached') + '</time></div>';
    }).join("");
    var events = history.map(function (event) {
      var meta = [];
      if (options.showActor !== false && event.actor) meta.push(event.actor);
      if (Number(event.submissionVersion || 0) > 0 && event.status === "Merchant Submit") meta.push("Submission v" + event.submissionVersion);
      if (options.showInferred && event.inferred) meta.push("Migrated estimate");
      return '<li class="progress-event' + eventClass(event.status) + '"><span class="progress-event-dot"></span><div class="progress-event-main"><strong>' + escapeHtml(eventLabel(event)) + '</strong>' + (meta.length ? '<span>' + escapeHtml(meta.join(" · ")) + '</span>' : '') + '</div><time>' + escapeHtml(event.occurredAt) + '</time></li>';
    }).join("");
    var historyOpen = options.historyExpanded === true ? " open" : "";
    var description = Object.prototype.hasOwnProperty.call(options, "description") ? options.description : "Track each milestone in this onboarding application.";
    container.innerHTML = '<section class="onboarding-progress' + stateClass + '" aria-label="Application progress">' +
      '<div class="progress-heading"><div><h2>' + escapeHtml(options.title || "Application Progress") + '</h2>' + (description ? '<p>' + escapeHtml(description) + '</p>' : '') + '</div></div>' +
      '<div class="progress-steps">' + steps + '</div><details class="progress-history"' + historyOpen + '><summary class="progress-history-summary"><span>Status history</span><span class="progress-history-toggle" aria-hidden="true"></span></summary><div class="progress-history-content">' +
      (events ? '<ol class="progress-event-list">' + events + '</ol>' : '<p class="progress-empty">No status events have been recorded yet.</p>') + '</div></details></section>';
  }

  global.PaywizardOnboardingProgress = { render: render, labels: STATUS_LABELS };
})(window);
