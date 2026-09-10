export const denominations = [500, 200, 100, 50, 20, 10];
export const saleFields = [
  "upi",
  "card",
  "expenses",
  "counterCash",
  "posSale",
  "cashGiven",
];
export const emptySale = () =>
  Object.fromEntries(
    [...saleFields, ...denominations.map((n) => "notes" + n)].map((key) => [
      key,
      "",
    ]),
  );
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
export function getPosBreakdown(data) {
  const difference = round(
    (Number(data.totalSale) || 0) - (Number(data.posSale) || 0),
  );
  return {
    unbilledSales: Math.max(0, difference),
    posShortfall: Math.max(0, -difference),
  };
}
export function calculateSale(data) {
  const notes = denominations.reduce(
    (sum, note) => sum + (Number(data["notes" + note]) || 0) * note,
    0,
  );
  const cash = round(
    notes + (Number(data.expenses) || 0) - (Number(data.counterCash) || 0),
  );
  const totalSale = round(
    cash + (Number(data.upi) || 0) + (Number(data.card) || 0),
  );
  return {
    cash,
    totalSale,
    remaining: round(totalSale - (Number(data.posSale) || 0)),
  };
}
export function validateSale(data) {
  const errors = {};
  for (const key of [...saleFields, ...denominations.map((n) => "notes" + n)]) {
    const value = data[key];
    if (saleFields.includes(key) && value === "")
      errors[key] = "Enter an amount (use 0 if none).";
    else if (!Number.isFinite(Number(value)) || Number(value) < 0)
      errors[key] = "Enter a valid, non-negative number.";
    else if (key.startsWith("notes") && !Number.isInteger(Number(value)))
      errors[key] = "Enter a whole number of notes.";
  }
  return errors;
}
