(function (global) {
  "use strict";

  var STATUS_LABELS = {
    Draft: "Application created",
    "Awaiting Merchant": "Shared with merchant",
    "Merchant Draft": "Merchant started application",
    "Merchant Submit": "Merchant submitted application",
    "Under Review": "Application under review",
    Returned: "Changes requested",
    Approved: "Application approved"
  };
  var STAGES = [
    { label: "Shared", statuses: ["Awaiting Merchant"] },
    { label: "Merchant Started", statuses: ["Merchant Draft"] },
    { label: "Submitted", statuses: ["Merchant Submit"] },
    { label: "Under Review", statuses: ["Under Review"] },
    { label: "Decision", statuses: ["Returned", "Approved"] }
  ];
  var CURRENT_STAGE = { "Awaiting Merchant": 0, "Merchant Draft": 1, "Merchant Submit": 2, "Under Review": 3, Returned: 4, Approved: 4 };

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

  function render(container, data, options) {
    if (!container || !data) return;
    options = options || {};
    var history = Array.isArray(data.statusHistory) ? data.statusHistory.slice() : [];
    history.sort(function (left, right) { return String(left.occurredAt).localeCompare(String(right.occurredAt)); });
    var currentStage = Object.prototype.hasOwnProperty.call(CURRENT_STAGE, data.status) ? CURRENT_STAGE[data.status] : -1;
    var stateClass = data.status === "Approved" ? " is-approved" : (data.status === "Returned" ? " is-returned" : "");
    var steps = STAGES.map(function (stage, index) {
      var event = stageEvent(history, stage.statuses);
      var reached = Boolean(event) && index <= currentStage;
      var displayedEvent = reached ? event : null;
      return '<div class="progress-step' + (reached ? ' is-reached' : '') + (index === currentStage ? ' is-current' : '') + '">' +
        '<span class="progress-dot">' + (reached ? '&#10003;' : String(index + 1)) + '</span>' +
        '<strong>' + stage.label + '</strong><time>' + (displayedEvent ? escapeHtml(displayedEvent.occurredAt) : 'Not reached') + '</time></div>';
    }).join("");
    var events = history.map(function (event) {
      var meta = [];
      if (options.showActor !== false && event.actor) meta.push(event.actor);
      if (Number(event.submissionVersion || 0) > 0 && event.status === "Merchant Submit") meta.push("Submission v" + event.submissionVersion);
      return '<li class="progress-event"><span class="progress-event-dot"></span><div class="progress-event-main"><strong>' + escapeHtml(eventLabel(event)) + '</strong>' + (meta.length ? '<span>' + escapeHtml(meta.join(" · ")) + '</span>' : '') + '</div><time>' + escapeHtml(event.occurredAt) + '</time></li>';
    }).join("");
    container.innerHTML = '<section class="onboarding-progress' + stateClass + '" aria-label="Application progress">' +
      '<div class="progress-heading"><div><h2>' + escapeHtml(options.title || "Application Progress") + '</h2><p>' + escapeHtml(options.description || "Track each milestone in this onboarding application.") + '</p></div><span class="progress-current">' + escapeHtml(data.status) + '</span></div>' +
      '<div class="progress-steps">' + steps + '</div><div class="progress-history"><h3 class="progress-history-title">Status history</h3>' +
      (events ? '<ol class="progress-event-list">' + events + '</ol>' : '<p class="progress-empty">No status events have been recorded yet.</p>') + '</div></section>';
  }

  global.PaywizardOnboardingProgress = { render: render, labels: STATUS_LABELS };
})(window);
