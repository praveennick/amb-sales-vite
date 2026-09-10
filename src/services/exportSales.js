import writeExcelFile from "write-excel-file/browser";
import { displayDate, displayTimestamp } from "../lib/format";
import { getPosBreakdown } from "../lib/sales";

const fields = [
  "date",
  "shopName",
  "posSale",
  "upi",
  "card",
  "cashGiven",
  "unbilledSales",
  "posShortfall",
  "cash",
  "totalSale",
  "expenses",
  "counterCash",
  "submittedBy",
  "submissionDate",
];
const textFields = new Set([
  "date",
  "shopName",
  "submittedBy",
  "submissionDate",
]);
export async function exportSales(records, range) {
  records = records.map((record) => ({
    ...record,
    ...getPosBreakdown(record),
    date: displayDate(record.isoDate || record.date),
    submissionDate: record.submissionDate
      ? displayTimestamp(record.submissionDate)
      : "",
  }));
  const rows = [
    fields.map((value) => ({
      value:
        value === "unbilledSales"
          ? "Sales outside POS"
          : value === "posShortfall"
            ? "POS shortfall"
            : value,
      fontWeight: "bold",
      backgroundColor: "#7C3AED",
      textColor: "#FFFFFF",
    })),
  ];
  for (const record of records)
    rows.push(
      fields.map((key) =>
        textFields.has(key)
          ? { value: String(record[key] ?? ""), type: String }
          : {
              value: Number(record[key]) || 0,
              type: Number,
              format: Number.isInteger(Number(record[key]) || 0)
                ? "#,##0"
                : "#,##0.##",
            },
      ),
    );
  rows.push(
    fields.map((key) => ({
      value:
        key === "date"
          ? "Total"
          : textFields.has(key)
            ? ""
            : records.reduce(
                (sum, record) => sum + (Number(record[key]) || 0),
                0,
              ),
      fontWeight: "bold",
      backgroundColor: "#F5F3FF",
    })),
  );
  await writeExcelFile(rows, {
    sheet: "Sales",
    columns: fields.map((key) => ({
      width: key === "shopName" || key === "submittedBy" ? 30 : 18,
    })),
  }).toFile("Sales-" + range.start + "-to-" + range.end + ".xlsx");
}
