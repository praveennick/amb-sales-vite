import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("test-role", "admin"));
});

test("dates use DD/MM/YY and remain inside their cards at narrow widths", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [route, label] of [
      ["/sales/juice-hut", "Sales date"],
      ["/dashboard", "From"],
      ["/expenses", "Expense date"],
      ["/sales-records", "Sales date"],
    ]) {
      await page.goto(route);
      const input = page.getByLabel(label, { exact: true });
      await expect(input).toBeAttached();
      await input.fill("2026-09-07");
      await expect(input.locator("..")).toContainText("07/09/26");
      const bounds = await input.evaluate((element) => {
        const inputRect = element.getBoundingClientRect();
        const card = element.closest(".panel").getBoundingClientRect();
        return {
          left: inputRect.left,
          right: inputRect.right,
          cardLeft: card.left,
          cardRight: card.right,
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
        };
      });
      expect(bounds.left).toBeGreaterThan(bounds.cardLeft);
      expect(bounds.right).toBeLessThan(bounds.cardRight);
      expect(bounds.scroll).toBeLessThanOrEqual(bounds.viewport);
      if (width === 390 && route === "/sales/juice-hut")
        await page.screenshot({
          path: info.outputPath("sales-mobile.png"),
          fullPage: true,
        });
    }
  }
  expect(errors).toEqual([]);
});

test("charts show weekdays and signed POS differences without .00", async ({
  page,
}, info) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("button", { name: "Export Excel" }),
  ).toBeEnabled();
  const chart = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Difference from POS",
      exact: true,
    }),
  });
  await expect(chart).toContainText("-₹150");
  await expect(chart).not.toContainText("₹150.00");
  await expect(
    chart.locator("svg[role=group] text").filter({ hasText: "Mon" }),
  ).toHaveCount(1);
  const bar = chart.getByRole("button").first();
  await expect(bar.locator("text")).toHaveText("-₹50");
  await bar.click();
  await expect(chart.getByRole("status")).toContainText("-₹50");
  await chart.getByRole("button", { name: "Dismiss bar details" }).click();
  await expect(chart.getByRole("status")).toHaveCount(0);
  await bar.focus();
  await page.keyboard.press("Enter");
  await expect(chart.getByRole("status")).toContainText("-₹50");
  await expect(
    page.getByRole("heading", { name: "Sales outside POS", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "POS shortfall", exact: true }),
  ).toHaveCount(0);
  await chart.getByText("View exact values", { exact: true }).click();
  await expect(chart.locator("tbody tr").first()).toContainText(
    /\d{2}\/\d{2}\/\d{2}/,
  );
  await page.screenshot({
    path: info.outputPath("dashboard.png"),
    fullPage: true,
  });
});
