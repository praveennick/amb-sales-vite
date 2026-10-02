const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const currency = (value) => currencyFormatter.format(Number(value) || 0);
export const localDate = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
export const documentDate = (date) => date.split("-").reverse().join("-");
export const displayDate = (value) => {
  if (!value) return "DD/MM/YY";
  const date = value.slice(0, 10);
  const parts = date.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] =
    parts[0].length === 4 ? parts : [...parts].reverse();
  return `${day}/${month}/${year.slice(-2)}`;
};
export const displayTimestamp = (value) =>
  value
    ? displayDate(value) + (value.length > 10 ? value.slice(10) : "")
    : "N/A";
export const weekday = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
  });
export function dateRange(start, end) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end
  )
    return [];
  const dates = [];
  const cursor = new Date(start + "T12:00:00");
  if (
    !Number.isFinite(cursor.getTime()) ||
    localDate(cursor) !== start ||
    localDate(new Date(end + "T12:00:00")) !== end
  )
    return [];
  while (localDate(cursor) <= end && dates.length <= 366) {
    dates.push(localDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
export function presetRange(preset) {
  const end = new Date();
  const start = new Date(end);
  switch (preset) {
    case "today":
      break;
    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      break;
    case "month":
      start.setDate(1);
      break;
    case "last-month":
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
      break;
    case "last-30-days":
      start.setDate(start.getDate() - 29);
      break;
    case "last-90-days":
      start.setDate(start.getDate() - 89);
      break;
    case "year":
      start.setMonth(0, 1);
      break;
    case "week":
    default:
      start.setDate(start.getDate() - 6);
  }
  return { start: localDate(start), end: localDate(end) };
}
