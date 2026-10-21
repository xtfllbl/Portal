(() => {
  const search = document.querySelector("#search");
  const pageRows = [...document.querySelectorAll(".page-directory tbody tr")];
  const emailButtons = [...document.querySelectorAll("[data-email]")];
  const emailFrame = document.querySelector("#email-frame");
  const emailStorageKey = "paywizard.prototypeHub.selectedEmail";
  let selectedEmail = emailButtons[0].dataset.email;
  try {
    const saved = sessionStorage.getItem(emailStorageKey);
    if (emailButtons.some((button) => button.dataset.email === saved))
      selectedEmail = saved;
  } catch {
    /* Preview also works when browser storage is unavailable. */
  }
  function selectEmail(filename) {
    const button = emailButtons.find((item) => item.dataset.email === filename);
    if (!button) return;
    selectedEmail = filename;
    emailButtons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    const title = button.textContent.trim();
    const href = `邮件模版html/邮件模版html/${filename}`;
    document.querySelector("#email-title").textContent = title;
    document.querySelector("#email-open").href = href;
    emailFrame.title = `${title}预览`;
    if (emailFrame.getAttribute("src") !== href) emailFrame.src = href;
    try {
      sessionStorage.setItem(emailStorageKey, filename);
    } catch {
      /* Optional session memory. */
    }
  }
  emailButtons.forEach((button) =>
    button.addEventListener("click", () => selectEmail(button.dataset.email)),
  );
  let view = "prototypes";
  const normalize = (value) =>
    value.normalize("NFKC").toLocaleLowerCase().trim();
  function filter() {
    if (view === "prototypes") {
      document.querySelector(".empty").hidden = true;
      document.querySelector("#result-status").textContent = "";
      return;
    }
    const query = normalize(search.value);
    let count = 0;
    if (view === "emails") {
      emailButtons.forEach((button) => {
        const matches = normalize(button.dataset.search).includes(query);
        button.closest("li").hidden = !matches;
        if (matches) count++;
      });
      document.querySelectorAll(".email-group").forEach((group) => {
        group.hidden = ![...group.querySelectorAll("li")].some(
          (item) => !item.hidden,
        );
      });
      document.querySelector(".email-empty").hidden = count !== 0;
      document.querySelector(".empty").hidden = true;
      document.querySelector("#result-status").textContent =
        `${count} 个邮件模板`;
      return;
    }
    for (const row of pageRows) {
      row.hidden = !normalize(row.dataset.search).includes(query);
      if (!row.hidden) count++;
    }
    document.querySelector(".empty").hidden = count !== 0;
    document.querySelector("#result-status").textContent =
      `${count} 个页面`;
  }
  function setView() {
    view =
      location.hash === "#pages"
        ? "pages"
        : location.hash === "#emails"
          ? "emails"
          : "prototypes";
    const views = {
      prototypes: ["原型中心", ""],
      pages: ["全部页面", "搜索编号、文件名或功能"],
      emails: ["邮件模板", "搜索邮件模板"],
    };
    for (const key of Object.keys(views))
      document.getElementById(`${key}-panel`).hidden = view !== key;
    document.querySelector("#directory-heading").hidden = view === "prototypes";
    document.querySelector("#main").classList.toggle("launcher-view", view === "prototypes");
    document.querySelector("#page-title").textContent = views[view][0];
    document.title = `${views[view][0]} | Paywizard`;
    search.placeholder = views[view][1];
    search.setAttribute("aria-label", views[view][1]);
    if (view === "emails") selectEmail(selectedEmail);
    search.value = "";
    for (const link of document.querySelectorAll("[data-view]")) {
      if (link.dataset.view === view) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    filter();
  }
  search.addEventListener("input", filter);
  document
    .querySelector("#clear-email-search")
    .addEventListener("click", () => {
      search.value = "";
      filter();
      search.focus();
    });
  document.querySelector("#clear-search").addEventListener("click", () => {
    search.value = "";
    filter();
    search.focus();
  });
  const profileKey = "paywizard.portalAccessProfile.v1";
  const tabs = [...document.querySelectorAll("[data-role-group]")];
  const portalButton = document.querySelector("#enter-portal");
  let activeGroup = "provider";
  function selectGroup(group) {
    activeGroup = group;
    for (const tab of tabs) {
      const selected = tab.dataset.roleGroup === group;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectGroup(tab.dataset.roleGroup));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectGroup(tabs[next].dataset.roleGroup);
      tabs[next].focus();
    });
  });
  try {
    const saved = localStorage.getItem(profileKey);
    const option = [...document.querySelectorAll(".role-option input")].find((input) => input.value === saved);
    if (option) {
      option.checked = true;
      selectGroup(option.name.replace("profile-", ""));
    }
  } catch { /* Default role remains available. */ }
  function enterPlatform(profile, button) {
    const error = document.querySelector("#entry-error");
    try {
      // An explicit launcher choice starts a normal demo context in this tab.
      localStorage.setItem(profileKey, profile);
      sessionStorage.removeItem("paywizard.impersonation.session.v1");
    } catch {
      error.textContent = "无法保存所选身份。请允许此网站使用浏览器存储后重试。";
      error.hidden = false;
      error.scrollIntoView({ block: "center" });
      error.focus({ preventScroll: true });
      return;
    }
    error.hidden = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    location.assign(profile === "billing-merchant" ? "42.billing_payments.html" : "12.transaction_list.html");
  }
  portalButton.addEventListener("click", () => {
    const selected = document.querySelector(`#roles-${activeGroup} input:checked`);
    enterPlatform(selected.value, portalButton);
  });
  document.querySelector("#enter-maintain").addEventListener("click", (event) => enterPlatform("maintain", event.currentTarget));
  window.addEventListener("pageshow", () => {
    document.querySelectorAll(".platform-enter").forEach((button) => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
  });
  window.addEventListener("hashchange", setView);
  setView();
})();
