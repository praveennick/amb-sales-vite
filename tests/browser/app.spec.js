import { test, expect } from "@playwright/test";

test("previous links redirect to the renamed routes", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("test-role", "admin"));
  for (const [previous, current] of [
    ["/shopSelection", "/stores"],
    ["/daily-spends", "/expenses"],
    ["/testing", "/sales-records"],
    ["/submit/juice-hut", "/sales/juice-hut"],
    ["/submit/bubble-tea", "/sales/bubble-tea"],
    ["/submit/coffee-candy", "/sales/coffee-candy"],
  ]) {
    await page.goto(previous);
    await expect(page).toHaveURL(new RegExp(current + "$"));
  }
});
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test("failed sales writes retain inputs and can be retried", async ({
  page,
}) => {
  await page.goto("/sales/juice-hut");
  for (const label of [
    "UPI amount",
    "Card amount",
    "Expenses",
    "Counter cash",
    "POS sales",
    "Cash given",
  ])
    await page.getByLabel(label, { exact: true }).fill("0");
  await page.getByLabel("UPI amount").fill("250");
  await page.evaluate(() => localStorage.setItem("test-fail", "true"));
  await page.getByRole("button", { name: "Save daily sales" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not save sales");
  await expect(page.getByLabel("UPI amount")).toHaveValue("250");
  await expect(
    page.getByRole("button", { name: "Save daily sales" }),
  ).toBeEnabled();
  await page.evaluate(() => localStorage.removeItem("test-fail"));
  await page.getByRole("button", { name: "Save daily sales" }).click();
  await expect(page).toHaveURL(/stores/);
});

test("switching expense days in the same month does not fetch again", async ({
  page,
}) => {
  await page.goto("/expenses");
  await expect(
    page.getByRole("button", { name: "Add expense", exact: true }),
  ).toBeEnabled();
  const reads = await page.evaluate(() => window.__testReads.length);
  const current = await page.getByLabel("Expense date").inputValue();
  await page
    .getByLabel("Expense date")
    .fill(current.slice(0, 8) + (current.endsWith("01") ? "02" : "01"));
  await expect(
    page.getByText("No expenses recorded for this date."),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__testReads.length)).toBe(reads);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("test-role"))
      localStorage.setItem("test-role", "admin");
  });
});
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
test("all pages render without runtime errors or viewport overflow", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [route, title] of [
    ["/stores", "Your stores"],
    ["/dashboard", "Sales overview"],
    ["/sales/juice-hut", "The Juice Hut"],
    ["/expenses", "Daily expenses"],
    ["/inventory", "Store inventory"],
    ["/sales-records", "Sales records"],
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true }).last(),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Loading" }),
    ).toHaveCount(0);
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(route.replaceAll("/", "-") + ".png"),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("mobile navigation traps focus, closes on Escape and updates route title", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile");
  await page.goto("/stores");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Sign out" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Inventory", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inventory", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("sales recalculate after POS changes and save expected document", async ({
  page,
}) => {
  await page.goto("/sales/juice-hut");
  for (const [label, value] of [
    ["UPI amount", "200"],
    ["Card amount", "50"],
    ["₹500 notes", "2"],
    ["Expenses", "50"],
    ["Counter cash", "100"],
    ["POS sales", "1200"],
    ["Cash given", "900"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("UPI amount").fill("250");
  const difference = page
    .locator("dl > div")
    .filter({ hasText: "Difference from POS" });
  await expect(difference).toContainText("₹50");
  await page.getByRole("button", { name: "Save daily sales" }).click();
  await expect(page).toHaveURL(/stores/);
  const writes = await page.evaluate(() => window.__testWrites);
  expect(writes).toHaveLength(1);
  expect(writes[0].data).toMatchObject({
    totalSale: 1250,
    remaining: 50,
    cash: 950,
    shopName: "The Juice Hut",
  });
});
test("inventory cancel discards draft and save persists edits", async ({
  page,
}) => {
  await page.goto("/inventory");
  const card = page.getByRole("article").filter({ hasText: "Sugar" });
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await card.getByLabel("Opening stock").fill("99");
  await card.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(card).toContainText("12");
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(card.getByLabel("Opening stock")).toHaveValue("10");
  await card.getByLabel("Opening stock").fill("20");
  await card.getByRole("button", { name: "Save", exact: true }).click();
  await expect(card).toContainText("22");
  await expect(
    card.getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible();
});
test("expenses add/edit/delete without re-reading the whole month", async ({
  page,
}) => {
  await page.goto("/expenses");
  await expect(
    page.getByRole("button", { name: "Add expense", exact: true }),
  ).toBeEnabled();
  const before = await page.evaluate(() => window.__testReads.length);
  await page.getByLabel("What did you buy?").fill("Packaging");
  await page.getByLabel("Amount (₹)", { exact: true }).fill("120.50");
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  const row = page.getByRole("listitem").filter({ hasText: "Packaging" });
  await expect(row).toContainText("₹120.5");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Expense amount", { exact: true }).fill("130");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row).toContainText("₹130");
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await row
    .getByRole("button", { name: "Delete expense", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  expect(await page.evaluate(() => window.__testReads.length)).toBe(before);
});
test("report reads unique documents and exports a real Excel workbook", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Export Excel" }),
  ).toBeEnabled();
  const reads = await page.evaluate(() => window.__testReads);
  expect(new Set(reads).size).toBe(21);
  expect(reads).toHaveLength(21);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^Sales-.*\.xlsx$/);
  const buffer = await readFile(await download.path());
  const archive = unzipSync(buffer);
  expect(archive["xl/worksheets/sheet1.xml"]).toBeTruthy();
  expect(strFromU8(archive["xl/worksheets/sheet1.xml"])).toContain("3750");
});
test("failed expense reads recover with retry", async ({ page }) => {
  await page.goto("/expenses");
  await expect(
    page.getByRole("button", { name: "Add expense", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => localStorage.setItem("test-fail", "true"));
  await page.getByRole("button", { name: "Refresh expenses" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not load");
  await page.evaluate(() => localStorage.removeItem("test-fail"));
  await page.getByRole("button", { name: "Retry loading" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add expense", exact: true }),
  ).toBeEnabled();
});
test("staff cannot access admin routes and guests return to login", async ({
  page,
}) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("test-role", "staff"));
  await page.goto("/inventory");
  await expect(page).toHaveURL(/stores/);
  await page.evaluate(() => localStorage.setItem("test-role", "guest"));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await noOverflow(page);
});
