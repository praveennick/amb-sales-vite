export function stockLeft(item) {
  return (
    Math.round(
      ((Number(item.open) || 0) +
        (Number(item.buy) || 0) -
        (Number(item.waste) || 0) -
        (Number(item.sold) || 0)) *
        1000,
    ) / 1000
  );
}
export function validateStock(item) {
  if (!item.name.trim()) return "Enter an item name.";
  if (
    ["open", "buy", "waste", "sold"].some(
      (key) => !Number.isFinite(Number(item[key])) || Number(item[key]) < 0,
    )
  )
    return "Stock quantities must be valid, non-negative numbers.";
  return "";
}
