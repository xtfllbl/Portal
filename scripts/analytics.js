(function () {
  "use strict";

  var page = document.querySelector("[data-analytics-page]");
  if (!page) return;

  var activePeriod = "7D";

  page.querySelectorAll("[data-period]").forEach(function (button) {
    button.addEventListener("click", function () {
      activePeriod = button.getAttribute("data-period");
      page.querySelectorAll("[data-period]").forEach(function (item) {
        var selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      page.querySelectorAll("[data-period-badge]").forEach(function (badge) { badge.textContent = activePeriod; });
      renderMetrics();
    });
  });

  var metricSets = {
    agent: {
      "7D": ["$0.00", "0", "0", "$0.00", "4", "0"],
      "30D": ["$8,942.15", "11", "1,284", "$6.96", "3.4", "117"],
      "90D": ["$31,508.74", "23", "4,618", "$6.82", "4.1", "201"]
    },
    merchant: {
      "7D": ["129", "$104,116.19", "11392"],
      "30D": ["137", "$398,744.62", "43817"],
      "90D": ["151", "$1,108,509.30", "121460"]
    }
  };
  var merchantTrends = {
    "7D": [["▼", "-14.29%", "negative"], ["▲", "+2.08%", "positive"], ["▼", "-6.78%", "negative"]],
    "30D": [["▲", "+6.20%", "positive"], ["▲", "+8.17%", "positive"], ["▲", "+4.83%", "positive"]],
    "90D": [["▲", "+16.15%", "positive"], ["▲", "+14.62%", "positive"], ["▲", "+12.09%", "positive"]]
  };

  function renderMetrics() {
    var kind = page.getAttribute("data-analytics-page");
    var values = metricSets[kind][activePeriod];
    var select = page.querySelector("[data-agent-filter]");
    var factor = select && select.value !== "all" ? Number(select.selectedOptions[0].dataset.factor || 1) : 1;

    page.querySelectorAll("[data-metric]").forEach(function (element, index) {
      var value = values[index];
      if (factor !== 1) {
        var numeric = Number(String(value).replace(/[$,]/g, ""));
        var scaled = numeric * factor;
        value = String(value).includes("$")
          ? "$" + scaled.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : scaled.toLocaleString("en-US", { maximumFractionDigits: index === 4 ? 1 : 0 });
      }
      element.textContent = value;
    });

    if (kind === "merchant") {
      page.querySelectorAll("[data-merchant-trend]").forEach(function (element, index) {
        var trend = merchantTrends[activePeriod][index];
        element.classList.remove("positive", "negative");
        element.classList.add(trend[2]);
        element.textContent = trend[0] + " " + trend[1] + " from the past " + activePeriod.replace("D", "") + " days";
      });
    }
  }

  var agentFilter = page.querySelector("[data-agent-filter]");
  if (agentFilter) {
    agentFilter.addEventListener("change", function () {
      renderMetrics();
      renderAgentTables();
    });
  }

  var agents = [
    { name: "Luoq", merchants: 1, transactions: 576, revenue: "$2,676.78" },
    { name: "JMSC POS", merchants: 6, transactions: 0, revenue: "$0.00" },
    { name: "WizarPOS Direct", merchants: 4, transactions: 1284, revenue: "$8,942.15" },
    { name: "Northstar Payments", merchants: 3, transactions: 843, revenue: "$5,781.24" }
  ];
  var recentMerchants = [
    { merchant: "JMSC POS Testing", agent: "JMSC POS", status: "Enable", date: "Aug 5, 2026" },
    { merchant: "Lukman hudda", agent: "JMSC POS", status: "Enable", date: "Jul 30, 2026" },
    { merchant: "Sunset Spirits", agent: "JMSC POS", status: "Enable", date: "Feb 13, 2026" },
    { merchant: "Demo", agent: "JMSC POS", status: "Disable", date: "Jan 11, 2026" },
    { merchant: "Stop 24 - Merchant", agent: "JMSC POS", status: "Enable", date: "Jan 2, 2026" },
    { merchant: "Orchid Retail", agent: "Luoq", status: "Enable", date: "Dec 18, 2025" },
    { merchant: "Metro Mini Mart", agent: "WizarPOS Direct", status: "Enable", date: "Dec 8, 2025" }
  ];
  var expandedTables = { agents: false, merchants: false };

  function renderAgentTables() {
    var topBody = page.querySelector("[data-agent-table]");
    var recentBody = page.querySelector("[data-recent-merchant-table]");
    if (!topBody || !recentBody) return;
    var filter = agentFilter.value;
    var filteredAgents = agents.filter(function (agent) { return filter === "all" || agent.name === filter; });
    var filteredMerchants = recentMerchants.filter(function (merchant) { return filter === "all" || merchant.agent === filter; });
    if (!expandedTables.agents) filteredAgents = filteredAgents.slice(0, 2);
    if (!expandedTables.merchants) filteredMerchants = filteredMerchants.slice(0, 5);

    topBody.innerHTML = filteredAgents.length ? filteredAgents.map(function (agent) {
      return "<tr><td>" + agent.name + "</td><td class=\"align-right\">" + agent.merchants + "</td><td class=\"align-right\">" + agent.transactions + "</td><td class=\"align-right\">" + agent.revenue + "</td></tr>";
    }).join("") : '<tr class="empty-row"><td colspan="4">No agents match this filter.</td></tr>';

    recentBody.innerHTML = filteredMerchants.length ? filteredMerchants.map(function (merchant) {
      return "<tr><td>" + merchant.merchant + "</td><td>" + merchant.agent + "</td><td><span class=\"status-badge " + (merchant.status === "Disable" ? "disabled" : "") + "\">" + merchant.status + "</span></td><td>" + merchant.date + "</td></tr>";
    }).join("") : '<tr class="empty-row"><td colspan="4">No merchants match this filter.</td></tr>';
  }

  page.querySelectorAll("[data-view-all]").forEach(function (button) {
    button.addEventListener("click", function () {
      var target = button.getAttribute("data-view-all");
      expandedTables[target] = !expandedTables[target];
      button.textContent = expandedTables[target] ? "Show Less" : "View All";
      button.setAttribute("aria-expanded", String(expandedTables[target]));
      renderAgentTables();
    });
  });

  var merchants = [
    ["EASY GRAB GO LTD", "Enable", "$62,440.01", "3797", 100],
    ["DIDIMATT", "Enable", "$11,376.00", "2260", 100],
    ["OpenFridge", "Enable", "$5,289.96", "1685", 100],
    ["G&A Robot", "Enable", "$6,756.72", "1049", 100],
    ["Retail Tech Pte Ltd", "Enable", "$2,676.78", "576", 100],
    ["Nourish and Bloom Markets", "Enable", "$5,224.57", "500", 100],
    ["ROTOMLOOT S.L.", "Enable", "$3,732.00", "448", 100],
    ["Trend Twist", "Enable", "$5,137.20", "396", 100],
    ["LPH CATERING", "Enable", "$501.50", "359", 100],
    ["Five 10 Private Limi", "Enable", "$981.45", "322", 100],
    ["Harbour Pantry", "Enable", "$648.00", "214", 88],
    ["Bluebird Market", "Enable", "$492.00", "176", 81],
    ["Parkside Pantry", "Disable", "$0.00", "0", 22]
  ];
  var currentPage = 1;
  var pageSize = 10;

  function renderMerchantTable() {
    var body = page.querySelector("[data-merchant-table]");
    if (!body) return;
    var totalPages = Math.ceil(merchants.length / pageSize);
    currentPage = Math.min(currentPage, totalPages);
    var visible = merchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    body.innerHTML = visible.map(function (merchant, index) {
      var statusClass = merchant[1] === "Disable" ? " disabled" : "";
      return "<tr><td>" + merchant[0] + "</td><td><span class=\"status-badge" + statusClass + "\">" + merchant[1] + "</span></td><td>" + merchant[2] + "</td><td>" + merchant[3] + "</td><td><div class=\"performance-cell\"><span class=\"performance-bar\"><span class=\"performance-fill\" style=\"width:" + merchant[4] + "%\"></span></span><span class=\"performance-label\">" + (merchant[4] >= 80 ? "Excellent" : "Review") + "</span></div></td><td><button class=\"detail-button\" type=\"button\" data-merchant-index=\"" + ((currentPage - 1) * pageSize + index) + "\" aria-label=\"View " + merchant[0] + " details\"><span class=\"material-symbols-rounded\" aria-hidden=\"true\">article</span></button></td></tr>";
    }).join("");

    var pagination = page.querySelector("[data-pagination]");
    var numbered = "";
    for (var pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      numbered += '<button class="page-button' + (pageNumber === currentPage ? ' active' : '') + '" type="button" data-page="' + pageNumber + '" aria-label="Page ' + pageNumber + '"' + (pageNumber === currentPage ? ' aria-current="page"' : '') + '>' + pageNumber + '</button>';
    }
    pagination.innerHTML = '<button class="page-button" type="button" data-page="first" aria-label="First page"' + (currentPage === 1 ? " disabled" : "") + '><span class="material-symbols-rounded">keyboard_double_arrow_left</span></button>' +
      '<button class="page-button" type="button" data-page="prev" aria-label="Previous page"' + (currentPage === 1 ? " disabled" : "") + '><span class="material-symbols-rounded">chevron_left</span></button>' + numbered +
      '<button class="page-button" type="button" data-page="next" aria-label="Next page"' + (currentPage === totalPages ? " disabled" : "") + '><span class="material-symbols-rounded">chevron_right</span></button>' +
      '<button class="page-button" type="button" data-page="last" aria-label="Last page"' + (currentPage === totalPages ? " disabled" : "") + '><span class="material-symbols-rounded">keyboard_double_arrow_right</span></button>' +
      '<select class="page-size" data-page-size aria-label="Rows per page"><option value="10"' + (pageSize === 10 ? " selected" : "") + '>10</option><option value="5"' + (pageSize === 5 ? " selected" : "") + '>5</option></select>' +
      '<span class="page-count">' + currentPage + ' / ' + totalPages + ' (' + merchants.length + ')</span>';
  }

  page.addEventListener("click", function (event) {
    var pager = event.target.closest("[data-page]");
    if (pager && !pager.disabled) {
      var value = pager.getAttribute("data-page");
      var totalPages = Math.ceil(merchants.length / pageSize);
      if (value === "first") currentPage = 1;
      else if (value === "prev") currentPage -= 1;
      else if (value === "next") currentPage += 1;
      else if (value === "last") currentPage = totalPages;
      else currentPage = Number(value);
      renderMerchantTable();
    }
    var detail = event.target.closest("[data-merchant-index]");
    if (detail) window.alert("Merchant details: " + merchants[Number(detail.getAttribute("data-merchant-index"))][0] + " (mock).");
  });

  page.addEventListener("change", function (event) {
    if (!event.target.matches("[data-page-size]")) return;
    pageSize = Number(event.target.value);
    currentPage = 1;
    renderMerchantTable();
  });

  renderMetrics();
  if (agentFilter) renderAgentTables();
  renderMerchantTable();
})();
