(function () {
  "use strict";
  const root = document.querySelector("[data-test-card-view]");
  if (!root) return;
  const S = window.PaywizardTestCardStore,
    C = window.PaywizardPartnerCatalog;
  const content = document.querySelector("#tcContent"),
    heading = document.querySelector("#tcHeading"),
    errorBox = document.querySelector("#tcError"),
    feedback = document.querySelector("#tcFeedback");
  const params = new URLSearchParams(location.search),
    view = root.dataset.testCardView;
  let db,
    manufacturers,
    pickers = [],
    dirty = false;
  const paths = {
    list: "51.test_card_list.html",
    activation: "51.test_card_activation.html",
    detail: "51.test_card_detail.html",
    adjustment: "51.test_card_adjustment.html",
    transactions: "51.test_card_transactions.html",
  };
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name) =>
    `<span class="material-symbols-rounded" aria-hidden="true">${esc(name)}</span>`;
  const href = (kind, values = {}) =>
    paths[kind] +
    (Object.keys(values).length ? "?" + new URLSearchParams(values) : "");
  const money = (amount, currency) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount / 100,
    ) +
    " " +
    currency;
  const amountOnly = (amount, currency) =>
    (({ USD: "$", CAD: "C$", EUR: "€", GBP: "£" })[currency] ||
      currency + " ") +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  const cardAmount = (amount, currency) =>
    `${esc(amountOnly(amount, currency))}<span class="cell-sub">${esc(currency)}</span>`;
  const prepaidIcons = {
    receipt:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M8 9h8"></path><path d="M8 13h5"></path></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
    reset:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v6h6"></path></svg>',
    search:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M16.65 16.65L21 21"></path></svg>',
  };
  const cardAction = (glyph, kind, uid, label) =>
    `<a class="icon-action" href="${esc(href(kind, { card: uid }))}" aria-label="${esc(label)} for ${uid}" title="${esc(label)}">${prepaidIcons[glyph]}</a>`;
  const cardBadge = (status) =>
    `<span class="badge ${status === "Active" ? "green" : status === "Suspended" ? "red" : status === "Expired" ? "orange" : "neutral"}">${esc(status)}</span>`;
  const queryInput = (id, label, value = "", type = "search") =>
    `<div class="tc-control"><input class="field" id="${id}" type="${type}" aria-label="${label}" placeholder="${label}" value="${esc(value)}"></div>`;
  const querySelect = (id) =>
    `<div class="tc-control"><div id="${id}"></div></div>`;
  const dateFilter = (id, label, value) =>
    `<div class="tc-control tc-date-control"><label for="${id}">${label}</label><input class="field" id="${id}" type="date" value="${esc(value)}"></div>`;
  const localDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const dateTime = (value) =>
    value
      ? new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })
          .format(new Date(value))
          .replace(",", "")
      : "—";
  const matches = (value, query) =>
    String(value ?? "")
      .toLocaleLowerCase()
      .includes(
        String(query ?? "")
          .trim()
          .toLocaleLowerCase(),
      );
  const manufacturerName = (card) =>
    manufacturers.find((m) => m.value === card.manufacturerId)?.label ||
    card.manufacturerName;
  const tag = (status) =>
    `<span class="tc-tag ${["Active", "Completed", "Top-up"].includes(status) ? "green" : ["Failed", "Suspended", "Deduct"].includes(status) ? "red" : status === "Expired" ? "amber" : ""}">${esc(status)}</span>`;
  const button = (text, attrs = "", primary = false) =>
    `<button type="button" class="pc-button${primary ? " pc-primary" : ""}" ${attrs}>${text}</button>`;
  const link = (text, kind, values = {}, primary = false, attrs = "") =>
    `<a class="pc-button${primary ? " pc-primary" : ""}" href="${esc(href(kind, values))}" ${attrs}>${text}</a>`;
  function title(text, actions = "", back) {
    heading.innerHTML = `<div class="tc-title">${back ? `<a class="pc-button tc-back" href="${esc(back)}" aria-label="Back" title="Back">${icon("arrow_back")}</a>` : ""}<h1>${esc(text)}</h1></div><div class="tc-actions">${actions}</div>`;
  }
  function showError(error, field) {
    errorBox.textContent = error.message || String(error);
    errorBox.hidden = false;
    feedback.hidden = true;
    if (field) field.setAttribute("aria-invalid", "true");
    errorBox.scrollIntoView({ block: "start", behavior: "instant" });
    errorBox.focus({ preventScroll: true });
  }
  function clearError() {
    errorBox.hidden = true;
    root
      .querySelectorAll("[aria-invalid]")
      .forEach((el) => el.removeAttribute("aria-invalid"));
  }
  function success(text) {
    feedback.textContent = text;
    feedback.hidden = false;
    errorBox.hidden = true;
    feedback.scrollIntoView({ block: "nearest" });
  }
  function attempt(fn) {
    try {
      clearError();
      return fn();
    } catch (error) {
      showError(error);
    }
  }
  function download(name, rows) {
    const blob = new Blob([S.csv(rows)], { type: "text/csv;charset=utf-8" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function picker(id, label, options, value = "", onChange = () => {}) {
    const p = window.PaywizardPaymentChannelPicker.mount(
      document.getElementById(id),
      { id: id + "-trigger", label, options, value, onChange },
    );
    pickers.push(p);
    return p;
  }
  const opts = (values) => values.map((value) => ({ value, label: value }));
  const allOpts = (label, values) => [{ value: "", label }, ...values];
  const field = (id, label, html, extra = "") =>
    `<div class="tc-field ${extra}"><label for="${id}">${label}</label>${html}</div>`;
  const input = (id, value = "", type = "text", extra = "") =>
    `<input id="${id}" type="${type}" value="${esc(value)}" ${extra}>`;
  const selectField = (id, label, extra = "") =>
    field(id + "-trigger", label, `<div id="${id}"></div>`, extra);
  const filterActions = () =>
    `<div class="tc-actions">${button(icon("restart_alt"), 'data-reset aria-label="Reset filters" title="Reset filters"')}<button class="pc-button pc-primary" type="submit" aria-label="Search" title="Search">${icon("search")}</button></div>`;
  function table(headers, rows, extra = "") {
    const prepaid = extra === "prepaid-card-table",
      transaction = extra === "tc-txn-table";
    const wrapper = prepaid ? "table-wrap" : "pc-table-scroll";
    const classes =
      prepaid || transaction ? extra : `pc-table tc-table ${extra}`;
    return `<div class="${wrapper}"><table class="${classes}"><thead><tr>${headers.map((h) => `<th scope="col"${h.class ? ` class="${h.class}"` : ""}>${h.label || h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="pc-empty">No records found.</td></tr>`}</tbody></table></div>`;
  }
  function paged(records, container, paint, size = 10) {
    let page = 1;
    function draw() {
      const total = records.length,
        pages = Math.max(1, Math.ceil(total / size));
      page = Math.min(page, pages);
      container.innerHTML =
        paint(records.slice((page - 1) * size, page * size)) +
        `<div class="tc-pagination"><span>${total ? `Showing ${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total}` : "0 records"}</span><nav class="tc-actions" aria-label="Pagination">${button(icon("chevron_left"), `data-page="prev" aria-label="Previous page" ${page === 1 ? "disabled" : ""}`)}<span>Page ${page} of ${pages}</span>${button(icon("chevron_right"), `data-page="next" aria-label="Next page" ${page === pages ? "disabled" : ""}`)}</nav></div>`;
      container.querySelectorAll("[data-page]").forEach(
        (b) =>
          (b.onclick = () => {
            page += b.dataset.page === "next" ? 1 : -1;
            draw();
          }),
      );
    }
    draw();
  }
  function notFound(message, kind) {
    title("Record Not Found");
    content.innerHTML = `<section class="tc-card tc-notfound"><p>${esc(message)}</p>${link("Back to " + (kind === "list" ? "Test Card List" : "Transactions"), kind)}</section>`;
  }
  function renderList() {
    heading.replaceChildren();
    heading.hidden = true;
    content.innerHTML = `<section class="tc-card prepaid-card-list"><div class="section-head compact"><h1 class="section-title">Test Card List</h1><div class="tc-actions">${link("Add New Card", "activation", {}, true)}<a class="pc-button" href="${paths.activation}#import">Import Cards</a>${button("Export Cards", 'id="exportCards"')}</div></div><form class="panel-filter-row" id="cardFilters"><div class="panel-filters test-card-filters"><label class="filter-field"><input id="cardQuery" type="search" placeholder="Card UID / Display No." aria-label="Card UID / Display No." value="${esc(params.get("card") || "")}"></label><div id="factoryFilter"></div><div id="statusFilter"></div><div id="balanceFilter"></div></div><div class="panel-toolbar"><button class="panel-tool" type="button" data-reset aria-label="Reset filters" title="Reset filters">${prepaidIcons.reset}</button><button class="panel-tool dark" type="submit" aria-label="Search" title="Search">${prepaidIcons.search}</button></div></form><div id="cardTable"></div></section>`;
    let factory = "",
      status = "",
      balance = "",
      filtered = [];
    const mf = picker(
      "factoryFilter",
      "Manufacturer",
      allOpts("Manufacturer", manufacturers),
      "",
      (v) => (factory = v),
    );
    const st = picker(
      "statusFilter",
      "Status",
      allOpts("Status", opts(S.STATUSES)),
      "",
      (v) => (status = v),
    );
    const ba = picker(
      "balanceFilter",
      "Balance",
      allOpts("Balance", opts(["Zero", "Below 10", "10 or more"])),
      "",
      (v) => (balance = v),
    );
    function draw() {
      const q = document.getElementById("cardQuery").value;
      filtered = db.cards.filter(
        (c) =>
          (matches(c.uid, q) || matches(c.displayNumber, q)) &&
          (!factory || c.manufacturerId === factory) &&
          (!status || S.effectiveStatus(c) === status) &&
          (!balance ||
            (balance === "Zero"
              ? c.balance === 0
              : balance === "Below 10"
                ? c.balance < 1000
                : c.balance >= 1000)),
      );
      paged(filtered, document.getElementById("cardTable"), (cards) =>
        table(
          [
            { label: "CARD UID / DISPLAY NO.", class: "tc-card-col" },
            { label: "MANUFACTURER", class: "tc-factory-col" },
            "BALANCE",
            { label: "STATUS", class: "tc-status-col" },
            "LAST TRANSACTION",
            "TXN COUNT",
            { label: "ACTIONS", class: "tc-actions-col" },
          ],
          cards
            .map((c) => {
              const tx = db.transactions
                .filter((t) => t.cardUid === c.uid)
                .sort((a, b) => b.at.localeCompare(a.at));
              return `<tr><td><a class="link mono cell-main" href="${esc(href("detail", { card: c.uid }))}">${esc(c.uid)}</a>${c.displayNumber ? `<span class="cell-sub mono">${esc(c.displayNumber)}</span>` : ""}</td><td>${esc(manufacturerName(c))}</td><td>${cardAmount(c.balance, c.currency)}</td><td>${cardBadge(S.effectiveStatus(c))}</td><td>${tx[0] ? esc(dateTime(tx[0].at)) : "—"}</td><td>${tx.length}</td><td><div class="icon-actions">${cardAction("receipt", "transactions", c.uid, "Transactions")}${cardAction("add", "adjustment", c.uid, "Adjust balance")}</div></td></tr>`;
            })
            .join(""),
          "prepaid-card-table",
        ),
      );
    }
    document.getElementById("cardFilters").onsubmit = (e) => {
      e.preventDefault();
      draw();
    };
    document.querySelector("[data-reset]").onclick = () => {
      document.getElementById("cardQuery").value = "";
      factory = status = balance = "";
      mf.setValue("");
      st.setValue("");
      ba.setValue("");
      draw();
    };
    document.getElementById("exportCards").onclick = () => {
      download("test-cards.csv", [
        [
          "Card UID",
          "Display Card Number",
          "Manufacturer",
          "Currency",
          "Balance",
          "Status",
          "Activation Date",
          "Expiration Date",
        ],
        ...filtered.map((c) => [
          c.uid,
          c.displayNumber,
          manufacturerName(c),
          c.currency,
          (c.balance / 100).toFixed(2),
          S.effectiveStatus(c),
          c.activatesAt,
          c.expiresAt,
        ]),
      ]);
      success(`${filtered.length} test cards exported.`);
    };
    draw();
  }

  function cardForm(card) {
    const editing = !!card;
    const formField = (id, label, html, extra = "") => editing
      ? `<div class="field ${extra.replace("tc-span-", "span-")}"><label for="${id}">${label}</label>${html}</div>`
      : field(id, label, html, extra);
    const formInput = (id, value = "", type = "text", extra = "") =>
      input(id, value, type, `${editing ? 'class="input"' : ""} ${extra}`);
    const formSelect = (id, label, extra = "") =>
      formField(id + "-trigger", label, `<div id="${id}"></div>`, extra);
    const section = (label, body) => editing
      ? `<section class="section"><div class="section-head"><h2 class="section-title">${label}</h2></div>${body}</section>`
      : `<section class="tc-form-section"><h2>${label}</h2>${body}</section>`;
    const grid = editing ? "form-grid" : "tc-form-grid";
    return `<form id="cardForm" class="${editing ? "content-inner" : ""}" novalidate>
      ${section("Card Details", `<div class="${grid}">
        ${formField("cardType", "Card Type", formInput("cardType", "Test Card", "text", "readonly"))}
        ${formField("physicalType", "Physical Type", formInput("physicalType", "Contactless Card (M1 RFID)", "text", "readonly"))}
        ${formField("uid", "Card Unique Identifier", formInput("uid", card?.uid || "", "text", `maxlength="20" autocomplete="off" ${editing ? "readonly" : "required"}`))}
        ${formField("displayNumber", "Display Card Number", formInput("displayNumber", card?.displayNumber || "", "text", 'maxlength="60"'))}
        ${formSelect("cardStatus", "Status")}</div>`)}
      ${section("Card Balance Attributes", `<div class="${grid}">
        ${editing ? formField("currency", "Card Currency", formInput("currency", card.currency, "text", "readonly")) : formSelect("cardCurrency", "Card Currency")}
        ${formField("balance", editing ? "Current Balance" : "Initial Balance", formInput("balance", editing ? (card.balance / 100).toFixed(2) : "", "number", editing ? "readonly" : 'min="0" step="0.01" required'))}</div>`)}
      ${section("Lifecycle Rules", `<div class="${editing ? "lifecycle-grid" : grid}">
        ${formField("activatesAt", "Activation Date", formInput("activatesAt", localDate(card?.activatesAt || new Date().toISOString()), "datetime-local", "required"))}
        ${formField("expiresAt", "Expiration Date", formInput("expiresAt", localDate(card?.expiresAt), "datetime-local"))}</div>
        ${editing ? `<div class="lifecycle-actions"><span class="field-hint">Leave Expiration Date empty for no expiration.</span><div class="quick-actions">${[1, 2, 3].map(years => `<button class="btn small" type="button" data-expiration-years="${years}">${years} ${years === 1 ? "Year" : "Years"}</button>`).join("")}<button class="btn small" type="button" data-clear-expiration>Clear</button></div></div>` : ""}`)}
      ${section("Applicable Manufacturer", `<div class="${grid}">${formSelect("cardManufacturer", "Manufacturer", "tc-span-2")}</div>`)}
      ${editing ? "" : `<div class="tc-form-footer">${link("Cancel", "list")}<button class="pc-button pc-primary" type="submit">Activate Card</button></div>`}
    </form>`;
  }
  function wireCardForm(card) {
    let status = card?.status || "Active",
      currency = card?.currency || "USD",
      manufacturerId = card?.manufacturerId || "";
    const form = document.getElementById("cardForm");
    const save = document.getElementById("cardDetailSave");
    const state = () => JSON.stringify([
      ...Array.from(form.querySelectorAll("input:not([readonly])"), el => el.value),
      status, currency, manufacturerId,
    ]);
    let initialState;
    function syncDirty() {
      if (initialState === undefined) return;
      dirty = state() !== initialState;
      if (save) save.hidden = !dirty || document.getElementById("panel-general").hidden;
    }
    picker(
      "cardStatus",
      "Card status",
      opts(card ? S.STATUSES : ["Active", "Not Active"]),
      status,
      (v) => {
        status = v;
        syncDirty();
      },
    );
    if (!card)
      picker(
        "cardCurrency",
        "Card currency",
        opts(S.CURRENCIES),
        currency,
        (v) => {
          currency = v;
          syncDirty();
        },
      );
    picker(
      "cardManufacturer",
      "Applicable manufacturer",
      manufacturers,
      manufacturerId,
      (v) => {
        manufacturerId = v;
        syncDirty();
      },
    );
    initialState = state();
    form.oninput = syncDirty;
    form.onchange = syncDirty;
    if (card) root.addEventListener("testcard:tabchange", syncDirty);
    form.querySelectorAll("[data-expiration-years], [data-clear-expiration]").forEach(button => {
      button.onclick = () => {
        const expiration = document.getElementById("expiresAt");
        if (button.hasAttribute("data-clear-expiration")) expiration.value = "";
        else {
          const base = new Date(document.getElementById("activatesAt").value || Date.now());
          base.setFullYear(base.getFullYear() + Number(button.dataset.expirationYears));
          expiration.value = localDate(base.toISOString());
        }
        syncDirty();
      };
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      attempt(() => {
        const values = {
          uid: document.getElementById("uid").value,
          displayNumber: document.getElementById("displayNumber").value,
          currency,
          status,
          manufacturerId,
          initialBalance: document.getElementById("balance").value,
          activatesAt: document.getElementById("activatesAt").value,
          expiresAt: document.getElementById("expiresAt").value,
        };
        manufacturers = C.manufacturers();
        if (card) {
          db = S.updateCard(card.uid, values, card.version, manufacturers);
          card = db.cards.find((c) => c.uid === card.uid);
          initialState = state();
          syncDirty();
          document.getElementById("cardSummary").innerHTML = cardSummary(card);
          success("Card changes saved.");
        } else {
          db = S.createCards([values], manufacturers);
          dirty = false;
          location.href = href("detail", {
            card: values.uid.trim().toUpperCase(),
            created: "1",
          });
        }
      });
    };
  }
  function tabs(items) {
    return `<div class="tc-tabs" role="tablist">${items.map(([key, label], i) => `<button class="tc-tab" type="button" role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${key}">${label}</button>`).join("")}</div>`;
  }
  function wireTabs(items, initial) {
    const buttons = [...root.querySelectorAll("[data-tab]")];
    function select(key, focus = false) {
      buttons.forEach((b) => {
        const active = b.dataset.tab === key;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
        b.classList.toggle("active", active);
        const panel = document.getElementById("panel-" + b.dataset.tab);
        panel.hidden = !active;
        panel.classList.toggle("active", active);
        if (active && focus) b.focus();
      });
      clearError();
      root.dispatchEvent(new Event("testcard:tabchange"));
    }
    buttons.forEach((b, i) => {
      b.onclick = () => select(b.dataset.tab);
      b.onkeydown = (e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          const next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? buttons.length - 1
                : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) %
                  buttons.length;
          select(buttons[next].dataset.tab, true);
        }
      };
    });
    select(initial || items[0][0]);
  }
  function renderActivation() {
    title("Card Activation", "", paths.list);
    content.innerHTML = `<section class="tc-card">${tabs([
      ["single", "Single Card"],
      ["import", "Batch Import"],
    ])}<div id="panel-single" role="tabpanel" aria-labelledby="tab-single">${cardForm()}</div><div id="panel-import" role="tabpanel" aria-labelledby="tab-import" hidden>${importPanel()}</div></section>`;
    wireCardForm();
    wireImport();
    wireTabs(
      [["single"], ["import"]],
      location.hash === "#import" ? "import" : "single",
    );
  }
  function cardSummary(card) {
    const status = S.effectiveStatus(card);
    return `<div class="summary"><span>Card UID</span><strong class="mono">${esc(card.uid)}</strong></div><div class="summary"><span>Display Card No.</span><strong class="mono">${esc(card.displayNumber || "—")}</strong></div><div class="summary"><span>Current Balance</span><strong>${esc(amountOnly(card.balance, card.currency))}</strong></div><div class="summary"><span>Status</span><strong class="summary-status-value ${status === "Suspended" ? "status-red" : status !== "Active" ? "status-neutral" : ""}">${esc(status)}</strong></div>`;
  }
  function historyTable(card) {
    const rows = db.history
      .filter((h) => h.cardUid === card.uid)
      .map((h) => ({
        at: h.at,
        event: h.event,
        before: h.before,
        after: h.after,
        amount: h.amount,
        currency: h.currency,
        operator: h.operator,
        remark: h.remark,
      }));
    db.transactions
      .filter((t) => t.cardUid === card.uid)
      .forEach((t) =>
        rows.push({
          at: t.at,
          event: t.type,
          before: t.before,
          after: t.after,
          amount: t.after - t.before,
          currency: t.cardCurrency || t.currency,
          operator: t.terminalName || t.terminalSn,
          remark: `${t.id} · ${t.result}${t.reason ? " · " + t.reason : ""}`,
        }),
      );
    rows.sort((a, b) => b.at.localeCompare(a.at));
    return table(
      [
        "DATE TIME",
        "EVENT",
        "BALANCE CHANGE",
        "BALANCE AFTER",
        "OPERATOR",
        "REMARK",
      ],
      rows
        .map(
          (h) =>
            `<tr><td>${esc(dateTime(h.at))}</td><td>${esc(h.event)}</td><td class="${h.amount > 0 ? "tc-positive" : h.amount < 0 ? "tc-negative" : ""}">${h.amount > 0 ? "+" : ""}${esc(money(h.amount, h.currency))}</td><td>${esc(money(h.after, h.currency))}</td><td>${esc(h.operator)}</td><td>${esc(h.remark)}</td></tr>`,
        )
        .join(""),
    );
  }
  function renderDetail() {
    let card = db.cards.find((c) => c.uid === params.get("card"));
    if (!card)
      return notFound("The requested test card was not found.", "list");
    heading.replaceChildren();
    heading.hidden = true;
    content.innerHTML = `<section class="tabbed-card prepaid-card-detail">
      <div class="page-header tabbed-card-header"><div class="pw-page-title-with-back"><a class="pw-page-back-button" href="${paths.list}" aria-label="Back to Test Card List" title="Back to Test Card List">${icon("arrow_back")}</a><h1 class="page-title">Card Details</h1></div><div class="page-actions"><button class="btn primary" id="cardDetailSave" type="submit" form="cardForm" hidden>Save</button></div></div>
      <section class="summary-grid detail-summary card-context-summary" id="cardSummary" aria-label="Card detail summary">${cardSummary(card)}</section>
      ${tabs([["general", "General"], ["history", "History"], ["transactions", "Transactions"]]).replace('class="tc-tabs"', 'class="tabs"').replaceAll('class="tc-tab"', 'class="tab"')}
      <div class="tab-panel" id="panel-general" role="tabpanel" aria-labelledby="tab-general">${cardForm(card)}</div>
      <div class="tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-history" hidden><div id="cardHistory">${historyTable(card)}</div></div>
      <div class="tab-panel portal-transaction-list" id="panel-transactions" role="tabpanel" aria-labelledby="tab-transactions" hidden><div class="tc-card-head"><h2>Transactions</h2>${link("Open Transactions", "transactions", { card: card.uid })}</div>${transactionTable(db.transactions.filter((t) => t.cardUid === card.uid))}</div>
    </section>`;
    wireCardForm(card);
    wireTabs(
      [["general"], ["history"], ["transactions"]],
      params.get("tab") || "general",
    );
    document.getElementById("cardForm").addEventListener("submit", () => {
      document.getElementById("cardHistory").innerHTML = historyTable(
        db.cards.find((c) => c.uid === card.uid),
      );
    });
    if (params.has("created")) success("Test card activated.");
  }

  function importPanel() {
    return `<div class="tc-import-controls">${selectField("batchManufacturer", "Manufacturer")}<div class="tc-actions">${button(icon("download") + "Download Template", 'id="downloadTemplate"')}</div></div><div class="tc-file"><label for="importFile">CSV File</label><input id="importFile" type="file" accept=".csv,text/csv"><span id="fileName" class="tc-field-note"></span></div><div id="importPreview" class="tc-empty-block">Select a manufacturer and upload a CSV file.</div><div class="tc-form-footer">${button("Import Cards", 'id="importCards" disabled', true)}</div>`;
  }
  function wireImport() {
    let manufacturerId = "",
      rawRows = [],
      checked = [],
      readVersion = 0;
    const importButton = document.getElementById("importCards");
    picker(
      "batchManufacturer",
      "Batch manufacturer",
      manufacturers,
      "",
      (v) => {
        manufacturerId = v;
        dirty = true;
        if (rawRows.length) validateBatch();
      },
    );
    document.getElementById("downloadTemplate").onclick = () =>
      download("test-card-import-template.csv", [
        [
          "Card UID",
          "Display Card Number",
          "Currency",
          "Initial Balance",
          "Status",
          "Activation Date",
          "Expiration Date",
        ],
        [
          "04CC0102030405",
          "TEST-001",
          "USD",
          "100.00",
          "Active",
          new Date().toISOString(),
          "",
        ],
      ]);
    function validateBatch() {
      clearError();
      manufacturers = C.manufacturers();
      const staged = structuredClone(S.read());
      checked = rawRows.map((raw) => {
        const row = { ...raw, manufacturerId };
        try {
          if (row.columnCount !== 7)
            throw new Error("Expected exactly 7 columns.");
          S.validateCard(row, staged, manufacturers);
          S.cents(row.initialBalance);
          staged.cards.push({ ...row, uid: row.uid.trim().toUpperCase() });
          return { ...row, valid: true, message: "Ready" };
        } catch (e) {
          return { ...row, valid: false, message: e.message };
        }
      });
      const valid = checked.filter((r) => r.valid).length;
      document.getElementById("importPreview").className = "";
      document.getElementById("importPreview").innerHTML =
        `<div class="tc-card-head"><h2>Import Review</h2><span class="tc-count">${valid} Valid · ${checked.length - valid} Invalid</span></div>` +
        table(
          [
            "ROW",
            "CARD UID",
            "DISPLAY NO.",
            "CURRENCY",
            "INITIAL BALANCE",
            "STATUS",
            "RESULT",
          ],
          checked
            .map(
              (r) =>
                `<tr><td>${r.row}</td><td class="tc-mono">${esc(r.uid)}</td><td>${esc(r.displayNumber)}</td><td>${esc(r.currency)}</td><td>${esc(r.initialBalance)}</td><td>${esc(r.status)}</td><td><span class="tc-tag ${r.valid ? "green" : "red"}">${r.valid ? "Valid" : "Invalid"}</span><span class="tc-secondary">${esc(r.message)}</span></td></tr>`,
            )
            .join(""),
          "tc-import-table",
        );
      importButton.disabled = !valid;
      importButton.textContent = valid
        ? `Import ${valid} Valid Card${valid === 1 ? "" : "s"}`
        : "Import Cards";
      return checked.filter((r) => r.valid);
    }
    document.getElementById("importFile").onchange = async (e) => {
      const current = ++readVersion,
        file = e.target.files[0];
      if (!file) return;
      clearError();
      rawRows = [];
      importButton.disabled = true;
      try {
        if (!/\.csv$/i.test(file.name))
          throw new Error(
            "Select a CSV file. Use Download Template for the required columns.",
          );
        if (file.size > 1024 * 1024)
          throw new Error("CSV file must be smaller than 1 MB.");
        const text = await file.text();
        if (current !== readVersion) return;
        rawRows = S.parseCSV(text);
        document.getElementById("fileName").textContent = file.name;
        dirty = true;
        validateBatch();
      } catch (error) {
        document.getElementById("importPreview").innerHTML =
          '<div class="tc-empty-block">Upload a corrected CSV file to continue.</div>';
        showError(error);
      }
    };
    importButton.onclick = () =>
      attempt(() => {
        const valid = validateBatch();
        if (!valid.length)
          throw new Error(
            "No valid cards to import. Correct the invalid rows and upload the file again.",
          );
        importButton.disabled = true;
        try {
          db = S.createCards(valid, manufacturers);
          const invalid = checked.length - valid.length;
          dirty = false;
          success(
            `${valid.length} test card${valid.length === 1 ? "" : "s"} imported.${invalid ? ` ${invalid} invalid row${invalid === 1 ? " was" : "s were"} skipped.` : ""}`,
          );
          rawRows = [];
          checked = [];
          document.getElementById("importFile").value = "";
          document.getElementById("fileName").textContent = "";
          document.getElementById("importPreview").innerHTML =
            `<div class="tc-empty-block">${valid.length} cards imported. ${link("View Test Card List", "list")}</div>`;
          importButton.textContent = "Import Cards";
        } catch (error) {
          importButton.disabled = false;
          throw error;
        }
      });
  }

  function renderAdjustment() {
    title("Balance Adjustment", "", paths.list);
    content.innerHTML = `<div class="tc-adjust-layout"><aside><section class="tc-card tc-search-card"><label for="findCard">Find Card</label><form id="findCardForm"><input id="findCard" type="search" aria-label="Card UID or Display Number" placeholder="Card UID / Display No." value="${esc(params.get("card") || "")}"><div class="tc-form-footer">${button("Search", 'id="findCardButton"', true)}</div></form><div id="cardChoices" hidden></div></section><section class="tc-card" id="selectedCard" hidden></section></aside><div><section class="tc-card" id="adjustPanel"><div class="tc-empty-block">Search for a test card to adjust its balance.</div></section><section class="tc-card" id="adjustHistory" hidden></section></div></div><dialog class="pc-dialog pc-confirm tc-dialog" id="adjustConfirm" aria-labelledby="adjustConfirmTitle"><header><h2 id="adjustConfirmTitle">Confirm Adjustment</h2>${button(icon("close"), 'data-cancel-adjust aria-label="Close"')}</header><div class="pc-dialog-body" id="adjustConfirmBody"></div><footer>${button("Cancel", "data-cancel-adjust")}${button("Confirm Adjustment", 'id="confirmAdjustment"', true)}</footer></dialog>`;
    let card = null,
      type = "Top-up",
      pending = null,
      choicePicker = null,
      typePicker = null;
    const dialog = document.getElementById("adjustConfirm");
    document
      .querySelectorAll("[data-cancel-adjust]")
      .forEach((b) => (b.onclick = () => dialog.close()));
    function drawHistory() {
      const rows = db.history
        .filter(
          (h) =>
            h.cardUid === card.uid &&
            ["Top-up", "Deduct", "Created"].includes(h.event),
        )
        .sort((a, b) => b.at.localeCompare(a.at));
      document.getElementById("adjustHistory").hidden = false;
      document.getElementById("adjustHistory").innerHTML =
        `<div class="tc-card-head"><h2>Adjustments</h2></div>` +
        table(
          [
            "DATE TIME",
            "TYPE",
            "BEFORE",
            "AFTER",
            "AMOUNT",
            "OPERATOR",
            "REMARK",
          ],
          rows
            .map(
              (h) =>
                `<tr><td>${esc(dateTime(h.at))}</td><td>${tag(h.event === "Created" ? "Initial Balance" : h.event)}</td><td>${esc(money(h.before, h.currency))}</td><td>${esc(money(h.after, h.currency))}</td><td class="${h.amount > 0 ? "tc-positive" : "tc-negative"}">${h.amount > 0 ? "+" : ""}${esc(money(h.amount, h.currency))}</td><td>${esc(h.operator)}</td><td>${esc(h.remark)}</td></tr>`,
            )
            .join(""),
        );
    }
    function selectCard(uid) {
      db = S.read();
      card = db.cards.find((c) => c.uid === uid);
      if (!card)
        throw new Error(
          "Test card not found. Search by Card UID or Display No.",
        );
      type = "Top-up";
      clearError();
      typePicker?.destroy();
      document.getElementById("selectedCard").hidden = false;
      document.getElementById("selectedCard").innerHTML =
        `<dl class="tc-kv"><dt>Status</dt><dd>${tag(S.effectiveStatus(card))}</dd><dt>Card UID</dt><dd class="tc-mono">${esc(card.uid)}</dd>${card.displayNumber ? `<dt>Display No.</dt><dd>${esc(card.displayNumber)}</dd>` : ""}<dt>Manufacturer</dt><dd>${esc(manufacturerName(card))}</dd><dt>Balance</dt><dd id="selectedBalance">${esc(money(card.balance, card.currency))}</dd></dl>`;
      document.getElementById("adjustPanel").innerHTML =
        `<div class="tc-card-head"><h2>Add / Deduct Balance</h2></div><form id="adjustForm" novalidate><div class="tc-form-grid">${field("adjustUid", "Card Unique Identifier", input("adjustUid", card.uid, "text", "readonly"), "tc-span-2")}${selectField("adjustType", "Transaction Type")}${field("adjustAmount", "Amount (" + esc(card.currency) + ")", input("adjustAmount", "", "number", 'min="0.01" step="0.01" required'))}${field("adjustRemark", "Remark", '<textarea id="adjustRemark" minlength="6" required></textarea>', "tc-span-2")}</div><div class="tc-form-footer"><button type="submit" class="pc-button pc-primary">Adjust</button></div></form>`;
      typePicker = picker(
        "adjustType",
        "Adjustment type",
        opts(["Top-up", "Deduct"]),
        type,
        (v) => {
          type = v;
          dirty = true;
        },
      );
      drawHistory();
      document.getElementById("adjustForm").oninput = () => (dirty = true);
      document.getElementById("adjustForm").onsubmit = (e) => {
        e.preventDefault();
        attempt(() => {
          const amount = S.cents(document.getElementById("adjustAmount").value),
            remark = document.getElementById("adjustRemark").value.trim();
          if (!amount)
            throw new Error("Adjustment amount must be greater than zero.");
          if (remark.length < 6)
            throw new Error("Enter a remark of at least 6 characters.");
          const after = card.balance + (type === "Deduct" ? -amount : amount);
          if (after < 0)
            throw new Error(
              "Deduction exceeds the current balance. Enter a smaller amount.",
            );
          if (after > 9999999999)
            throw new Error(
              "The resulting balance exceeds 99,999,999.99. Enter a smaller amount.",
            );
          pending = { type, amount: (amount / 100).toFixed(2), remark };
          document.getElementById("adjustConfirmBody").innerHTML =
            `<dl class="tc-kv"><dt>Card UID</dt><dd class="tc-mono">${esc(card.uid)}</dd><dt>Manufacturer</dt><dd>${esc(manufacturerName(card))}</dd><dt>Type</dt><dd>${esc(type)}</dd><dt>Amount</dt><dd>${esc(money(amount, card.currency))}</dd><dt>Before</dt><dd>${esc(money(card.balance, card.currency))}</dd><dt>After</dt><dd>${esc(money(after, card.currency))}</dd></dl>`;
          dialog.showModal();
        });
      };
    }
    function search() {
      attempt(() => {
        const query = document.getElementById("findCard").value.trim();
        if (!query) throw new Error("Enter a Card UID or Display No.");
        db = S.read();
        const exact = db.cards.find(
          (c) =>
            c.uid.toLowerCase() === query.toLowerCase() ||
            c.displayNumber.toLowerCase() === query.toLowerCase(),
        );
        const found = exact
          ? [exact]
          : db.cards.filter(
              (c) => matches(c.uid, query) || matches(c.displayNumber, query),
            );
        if (!found.length)
          throw new Error(
            "No test cards found. Check the Card UID or Display No.",
          );
        if (found.length === 1) {
          document.getElementById("cardChoices").hidden = true;
          selectCard(found[0].uid);
        } else {
          const host = document.getElementById("cardChoices");
          host.hidden = false;
          choicePicker?.destroy();
          choicePicker = picker(
            "cardChoices",
            "Matching cards",
            found.map((c) => ({
              value: c.uid,
              label: c.displayNumber || c.uid,
              description: `${c.uid} · ${manufacturerName(c)}`,
            })),
            "",
            (uid) => selectCard(uid),
          );
          choicePicker.trigger.click();
        }
      });
    }
    document.getElementById("findCardForm").onsubmit = (e) => {
      e.preventDefault();
      search();
    };
    document.getElementById("findCardButton").onclick = search;
    document.getElementById("confirmAdjustment").onclick = () => {
      dialog.close();
      attempt(() => {
        db = S.adjust(card.uid, pending, card.version);
        dirty = false;
        const uid = card.uid;
        selectCard(uid);
        success("Balance adjusted.");
      });
    };
    if (params.has("card")) search();
  }

  function transactionTable(records) {
    return table(
      [
        { label: "DATE TIME", class: "tc-txn-date" },
        { label: "TRANSACTION ID", class: "tc-txn-id" },
        { label: "MANUFACTURER", class: "tc-factory-col" },
        { label: "CARD UID / DISPLAY NO.", class: "tc-card-col" },
        "S/N",
        "TYPE",
        { label: "AMOUNT", class: "tc-txn-amount" },
        "RESULT",
      ],
      records
        .slice()
        .sort((a, b) => b.at.localeCompare(a.at))
        .map(
          (t) =>
            `<tr><td>${esc(dateTime(t.at))}</td><td><span class="tc-mono">${esc(t.id)}</span></td><td>${esc(t.manufacturerName)}</td><td class="tc-mono"><span class="account-main">${esc(t.cardUid)}</span>${t.displayNumber ? `<span class="account-sub">${esc(t.displayNumber)}</span>` : ""}</td><td class="tc-mono">${esc(t.terminalSn)}</td><td>${esc(t.type)}</td><td><span class="account-main">${esc(amountOnly(t.amount, t.currency))}</span><span class="account-sub">${esc(t.currency)}</span></td><td><span class="pill ${t.result === "Completed" ? "green" : "red"}">${esc(t.result)}</span></td></tr>`,
        )
        .join(""),
      "tc-txn-table",
    );
  }
  function renderTransactions() {
    heading.replaceChildren();
    heading.hidden = true;
    root.classList.add("tc-transactions-page");
    const filters = {
      manufacturer: params.get("manufacturer") || "",
      type: params.get("type") || "",
      result: params.get("result") || "",
    };
    content.innerHTML = `<section class="tc-card portal-transaction-list tc-transactions-panel"><div class="transaction-heading"><h1>Transactions</h1><span class="tc-count" id="txnCount"></span></div><form id="txnFilters" class="grid tc-query-filters">${dateFilter("dateFrom", "From", params.get("from") || "")}${dateFilter("dateTo", "To", params.get("to") || "")}${querySelect("txnManufacturer")}${queryInput("txnCard", "Card UID / Display No.", params.get("card") || "")}${queryInput("txnSn", "Terminal S/N", params.get("sn") || "")}${querySelect("txnType")}${querySelect("txnResult")}${filterActions()}</form><div id="txnTable"></div></section>`;
    const mf = picker(
      "txnManufacturer",
      "Transaction manufacturer",
      allOpts("Manufacturer", manufacturers),
      filters.manufacturer,
      (v) => (filters.manufacturer = v),
    );
    const tp = picker(
      "txnType",
      "Transaction type",
      allOpts(
        "Transaction Type",
        opts([...new Set(db.transactions.map((t) => t.type))]),
      ),
      filters.type,
      (v) => (filters.type = v),
    );
    const rs = picker(
      "txnResult",
      "Transaction result",
      allOpts("Result", opts(["Completed", "Failed"])),
      filters.result,
      (v) => (filters.result = v),
    );
    function draw() {
      attempt(() => {
        const from = document.getElementById("dateFrom").value,
          to = document.getElementById("dateTo").value,
          card = document.getElementById("txnCard").value,
          sn = document.getElementById("txnSn").value;
        if (from && to && from > to)
          throw new Error("From date cannot be later than To date.");
        const min = from ? new Date(from + "T00:00:00").getTime() : -Infinity,
          max = to ? new Date(to + "T23:59:59.999").getTime() : Infinity;
        const records = db.transactions
          .filter(
            (t) =>
              Date.parse(t.at) >= min &&
              Date.parse(t.at) <= max &&
              (!filters.manufacturer ||
                t.manufacturerId === filters.manufacturer) &&
              (!filters.type || t.type === filters.type) &&
              (!filters.result || t.result === filters.result) &&
              (matches(t.cardUid, card) || matches(t.displayNumber, card)) &&
              matches(t.terminalSn, sn),
          )
          .sort((a, b) => b.at.localeCompare(a.at));
        const query = new URLSearchParams();
        Object.entries({ from, to, card, sn, ...filters }).forEach(([k, v]) => {
          if (v) query.set(k, v);
        });
        history.replaceState(
          null,
          "",
          paths.transactions + (query.size ? "?" + query : ""),
        );
        document.getElementById("txnCount").textContent =
          `${records.length} Records`;
        paged(records, document.getElementById("txnTable"), transactionTable);
      });
    }
    document.getElementById("txnFilters").onsubmit = (e) => {
      e.preventDefault();
      draw();
    };
    document.querySelector("[data-reset]").onclick = () => {
      ["dateFrom", "dateTo", "txnCard", "txnSn"].forEach(
        (id) => (document.getElementById(id).value = ""),
      );
      filters.manufacturer = filters.type = filters.result = "";
      mf.setValue("");
      tp.setValue("");
      rs.setValue("");
      draw();
    };
    draw();
  }
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  // Picker handles own scroll listeners and top-layer surfaces for all routes.
  window.addEventListener("pagehide", () =>
    pickers.forEach((p) => p.destroy()),
  );
  try {
    db = S.read();
    manufacturers = C.manufacturers();
    ({
      list: renderList,
      activation: renderActivation,
      detail: renderDetail,
      adjustment: renderAdjustment,
      transactions: renderTransactions,
    })[view]();
  } catch (error) {
    showError(error);
  }
})();
