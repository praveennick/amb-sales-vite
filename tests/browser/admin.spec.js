import { test, expect } from "@playwright/test";

test("sales deletion confirms, retains failed records, and removes only the selected store", async ({
  page,
}) => {
  await page.goto("/sales-records");
  const store = page.locator("section").filter({
    has: page.getByRole("heading", { name: "The Juice Hut", exact: true }),
  });
  const remove = store.getByRole("button", {
    name: "Delete sales for The Juice Hut",
  });
  page.once("dialog", (dialog) => dialog.dismiss());
  await remove.click();
  await expect(remove).toBeVisible();
  expect(await page.evaluate(() => window.__testWrites.length)).toBe(0);
  await page.evaluate(() => localStorage.setItem("test-fail", "true"));
  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(page.getByRole("alert")).toContainText("Could not delete");
  await expect(remove).toBeEnabled();
  await page.evaluate(() => localStorage.removeItem("test-fail"));
  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(store).toContainText("No sales recorded");
  await expect(
    page.getByRole("button", { name: "Delete sales for Coffee N Candy" }),
  ).toBeVisible();
  const writes = await page.evaluate(() => window.__testWrites);
  expect(writes).toHaveLength(1);
  expect(writes[0].reference).toMatch(
    /^shops\/The Juice Hut\/\d{2}-\d{2}-\d{4}\/data$/,
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(store).toContainText("No sales recorded");
});

test("admins can grant and remove access but cannot remove themselves", async ({
  page,
}) => {
  await page.goto("/admin-access");
  await expect(page.getByText("admin@abc.com (you)")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove admin admin@abc.com" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("User UID", { exact: true })).toHaveCount(0);
  await page.getByLabel("Email address").fill("manager@example.com");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Grant admin access" }).click();
  const remove = page.getByRole("button", {
    name: "Remove admin manager@example.com",
  });
  await expect(remove).toBeVisible();
  await expect(page.getByText("another-user", { exact: true })).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(remove).toHaveCount(0);
  expect(await page.evaluate(() => window.__testWrites)).toEqual([
    {
      reference: "admins/another-user",
      data: { active: true, email: "manager@example.com" },
    },
    { reference: "admins/another-user" },
  ]);
});

test("staff cannot open admin access or sales records", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("test-role", "staff"));
  for (const route of ["/admin-access", "/sales-records"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/stores$/);
    await expect(page.getByRole("link", { name: "Admin access" })).toHaveCount(
      0,
    );
  }
});
