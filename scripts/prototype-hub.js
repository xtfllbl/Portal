(() => {
  const search = document.querySelector("#search");
  const cards = [...document.querySelectorAll(".requirement-card")];
  const pageRows = [...document.querySelectorAll(".page-directory tbody tr")];
  const categories = [...document.querySelectorAll(".filters button")];
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
  let category = "all";
  let view = "prototypes";
  const normalize = (value) =>
    value.normalize("NFKC").toLocaleLowerCase().trim();
  function filter() {
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
    const rows = view === "pages" ? pageRows : cards;
    for (const row of rows) {
      const matchesCategory =
        view === "pages" ||
        category === "all" ||
        row.dataset.category === category;
      const matchesQuery = normalize(row.dataset.search).includes(query);
      row.hidden = !(matchesCategory && matchesQuery);
      if (!row.hidden) count++;
    }
    document.querySelector(".empty").hidden = count !== 0;
    document.querySelector("#result-status").textContent =
      `${count} 个${view === "pages" ? "页面" : "需求"}`;
  }
  function setView() {
    view =
      location.hash === "#pages"
        ? "pages"
        : location.hash === "#emails"
          ? "emails"
          : "prototypes";
    const views = {
      prototypes: ["原型中心", "搜索需求名称"],
      pages: ["全部页面", "搜索编号、文件名或功能"],
      emails: ["邮件模板", "搜索邮件模板"],
    };
    for (const key of Object.keys(views))
      document.getElementById(`${key}-panel`).hidden = view !== key;
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
  categories.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.category;
      categories.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      filter();
    }),
  );
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
    category = "all";
    categories.forEach((item) =>
      item.setAttribute(
        "aria-pressed",
        String(item.dataset.category === "all"),
      ),
    );
    filter();
    search.focus();
  });
  document.querySelectorAll("[data-open]").forEach((button) => {
    const dialog = document.getElementById(button.dataset.open);
    button.addEventListener("click", () => dialog.showModal());
    dialog
      .querySelector(".close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => button.focus());
  });
  window.addEventListener("hashchange", setView);
  setView();
})();
