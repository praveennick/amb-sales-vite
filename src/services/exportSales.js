import writeExcelFile from "write-excel-file/browser";

const fields = [
  "date",
  "shopName",
  "posSale",
  "upi",
  "card",
  "cashGiven",
  "remaining",
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
  const rows = [
    fields.map((value) => ({
      value,
      fontWeight: "bold",
      backgroundColor: "#047857",
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
              format: "#,##0.00",
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
      backgroundColor: "#ECFDF5",
    })),
  );
  await writeExcelFile(rows, {
    sheet: "Sales",
    columns: fields.map((key) => ({
      width: key === "shopName" || key === "submittedBy" ? 30 : 18,
    })),
  }).toFile("Sales-" + range.start + "-to-" + range.end + ".xlsx");
}
