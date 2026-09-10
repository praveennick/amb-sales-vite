import test from "node:test";
import assert from "node:assert/strict";
import { calculateSale, emptySale, validateSale } from "../../src/lib/sales.js";
import { dateRange, localDate, documentDate } from "../../src/lib/format.js";
import { stockLeft, validateStock } from "../../src/lib/inventory.js";
import { mapLimit } from "../../src/lib/async.js";
import {
  currency,
  displayDate,
  displayTimestamp,
  weekday,
} from "../../src/lib/format.js";

test("whole amounts omit .00 while real fractional amounts remain visible", () => {
  assert.equal(currency(1250), "₹1,250");
  assert.equal(currency(0), "₹0");
  assert.equal(currency(120.5), "₹120.5");
  assert.equal(currency(120.55), "₹120.55");
});
test("visible dates use DD/MM/YY and weekday labels use short English names", () => {
  assert.equal(displayDate("2026-09-10"), "10/09/26");
  assert.equal(displayDate("10-09-2026"), "10/09/26");
  assert.equal(displayTimestamp("10-09-2026 13:45:00"), "10/09/26 13:45:00");
  assert.equal(weekday("2026-09-07"), "Mon");
});
test("cancelled reports stop scheduling new database reads", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(
    mapLimit(
      [1, 2, 3, 4],
      async () => {
        calls++;
        controller.abort();
      },
      1,
      controller.signal,
    ),
    { name: "AbortError" },
  );
  assert.equal(calls, 1);
});
test("sales reconciliation updates when payments change after POS entry", () => {
  const sale = {
    ...emptySale(),
    notes500: "2",
    expenses: "50",
    counterCash: "100",
    upi: "200",
    card: "50",
    posSale: "1200",
  };
  assert.deepEqual(calculateSale(sale), {
    cash: 950,
    totalSale: 1200,
    remaining: 0,
  });
  assert.equal(calculateSale({ ...sale, upi: "250" }).remaining, 50);
  assert.equal(calculateSale({ ...sale, notes500: "1" }).remaining, -500);
});
test("currency calculations round decimal amounts", () => {
  assert.equal(
    calculateSale({ upi: "0.1", card: "0.2", posSale: "0.3" }).remaining,
    0,
  );
});
test("sales reject negative, fractional note counts, and non-finite values", () => {
  const errors = validateSale({
    ...emptySale(),
    notes500: "1.5",
    upi: "-1",
    card: "Infinity",
  });
  assert.ok(errors.notes500);
  assert.ok(errors.upi);
  assert.ok(errors.card);
  assert.ok(errors.cashGiven);
});
test("date ranges cover leap days, month and year boundaries, and reject invalid dates", () => {
  assert.deepEqual(dateRange("2024-02-28", "2024-03-01"), [
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
  ]);
  assert.equal(dateRange("2025-12-31", "2026-01-01").length, 2);
  assert.deepEqual(dateRange("2026-02-30", "2026-03-01"), []);
  assert.deepEqual(dateRange("", "2026-03-01"), []);
  assert.deepEqual(dateRange("2026-03-02", "2026-03-01"), []);
  assert.equal(dateRange("2020-01-01", "2026-01-01").length, 367);
  assert.equal(
    documentDate(localDate(new Date(2026, 0, 2, 0, 30))),
    "02-01-2026",
  );
});
test("stock arithmetic supports decimal units and validation", () => {
  assert.equal(
    stockLeft({ open: "0.3", buy: "0.1", waste: "0.2", sold: "0.1" }),
    0.1,
  );
  assert.ok(
    validateStock({ name: "Sugar", open: "-1", buy: 0, waste: 0, sold: 0 }),
  );
});
test("bounded concurrent reads retain result order", async () => {
  let active = 0,
    peak = 0;
  const values = await mapLimit(
    [1, 2, 3, 4, 5],
    async (number) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 6 - number));
      active--;
      return number * 2;
    },
    2,
  );
  assert.deepEqual(values, [2, 4, 6, 8, 10]);
  assert.equal(peak, 2);
});
