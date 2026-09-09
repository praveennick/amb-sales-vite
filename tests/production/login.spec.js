import { test, expect } from "@playwright/test";
test("production login boots without database or export bundles", async ({
  page,
}, info) => {
  const errors = [],
    scripts = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  // No authentication or writes; prevent any external service access in this smoke test.
  await page.route(/https:\/\//, (route) => route.abort());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Sign in to your workspace" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("login-" + width + ".png"),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
  expect(
    scripts.some((url) => /firebaseDb|exportSales|Dashboard/.test(url)),
  ).toBe(false);
});
