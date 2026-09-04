const { test, expect } = require("@playwright/test");

test("agent list keeps hierarchy and exposes five accessible row actions without settings", async ({ page }) => {
  await page.goto("/2.agent_list_iso.html");

  await expect(page.locator("#agentTableBody tr")).toHaveCount(8);
  await expect(page.locator("thead th")).toHaveText([
    "Agent Name",
    "Agent Level",
    "Agent Contacts",
    "Agent Email",
    "Status",
    "Date & Time",
    "Actions"
  ]);
  await expect(page.locator("#agentTableBody tr").first().locator("button[data-action]")).toHaveCount(5);
  await expect(page.locator("#agentTableBody button[data-action='setting']")).toHaveCount(0);
  await expect(page.locator("#agentTableBody .material-symbols-rounded").first()).toHaveText("add");

  await page.locator("#searchName").fill("twoAgent");
  await page.getByRole("button", { name: "Search agents" }).click();
  await expect(page.locator("#agentTableBody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator("#agentTableBody tr")).toHaveCount(8);
});

test("top Add selects an eligible parent while row Add locks its parent", async ({ page }) => {
  await page.goto("/2.agent_list_iso.html");

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.locator("#createMask")).toHaveClass(/show/);
  await expect(page.locator("#parentAgentSelect")).toBeEnabled();
  await expect(page.locator("#parentAgentSelect option")).toHaveCount(6);
  await page.locator("#parentAgentSelect").selectOption("sr-twoagent");
  await expect(page.locator("#resellerLevel")).toHaveValue("L3");
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Create child agent under agenttest" }).click();
  await expect(page.locator("#parentAgentSelect")).toBeDisabled();
  await expect(page.locator("#parentAgentSelect")).toHaveValue("r-agenttest");
  await expect(page.locator("#resellerLevel")).toHaveValue("L2");
});

test("agent list header is rounded and controls remain equal-height without page overflow", async ({ page }) => {
  for (const viewport of [{ width: 2048, height: 1140 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/2.agent_list_iso.html");

    const radii = await page.locator("thead th").evaluateAll((cells) => [
      getComputedStyle(cells[0]).borderTopLeftRadius,
      getComputedStyle(cells[cells.length - 1]).borderTopRightRadius
    ]);
    expect(radii).toEqual(["8px", "8px"]);

    const toolbarHeights = await page.locator("#searchName, #resetSearch, #doSearch").evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().height))
    );
    expect(new Set(toolbarHeights).size).toBe(1);
    expect(toolbarHeights[0]).toBe(40);

    const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasPageOverflow).toBe(false);
  }
});

test("updated analytics and agent list pages load without browser errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of ["/2.agent_analytics.html", "/8.merchant_analytics.html", "/2.agent_list_iso.html"]) {
    await page.goto(route);
    await expect(page.locator(".pw-platform-content")).toBeVisible();
  }

  expect(errors).toEqual([]);
});
