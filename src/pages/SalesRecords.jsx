import { useEffect, useState } from "react";
import { localDate, currency } from "../lib/format";
import { shops } from "../lib/shops";
import { readSales } from "../services/reports";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
const fields = [
  "shopName",
  "upi",
  "card",
  "notes500",
  "notes200",
  "notes100",
  "notes50",
  "notes20",
  "notes10",
  "counterCash",
  "expenses",
  "cash",
  "totalSale",
  "posSale",
  "remaining",
  "cashGiven",
  "submissionDate",
  "submittedBy",
];
export default function SalesRecords() {
  const [date, setDate] = useState(localDate),
    [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    readSales([date])
      .then((data) => {
        if (!cancelled) setRecords(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load sales records. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, revision]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sales records</h2>
        <p className="mt-2 text-sm text-slate-500">
          Review the original daily entries for each shop.
        </p>
      </div>
      <div className="panel flex flex-wrap items-end gap-4">
        <label>
          <span className="field-label">Sales date</span>
          <input
            className="field"
            type="date"
            value={date}
            required
            onChange={(event) => {
              if (event.target.value) setDate(event.target.value);
            }}
          />
        </label>
        <button
          className="btn-secondary"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          Refresh
        </button>
      </div>
      {error ? (
        <div role="alert" className="panel text-red-700">
          {error}
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-3">
          {shops.map((shop) => {
            const record = records.find((item) => item.shopName === shop.name);
            return (
              <section className="panel" key={shop.name}>
                <h3 className="mb-4 font-semibold">{shop.name}</h3>
                {record ? (
                  <>
                    <p className="mb-5 text-2xl font-semibold text-emerald-800">
                      {currency(record.totalSale)}
                    </p>
                    <dl className="divide-y divide-slate-100">
                      {fields.map((key) => (
                        <div
                          key={key}
                          className="grid grid-cols-2 gap-3 py-3 text-xs"
                        >
                          <dt className="break-words text-slate-500">
                            {key.replace(/([A-Z])/g, " $1")}
                          </dt>
                          <dd className="break-words text-right font-medium">
                            {String(record[key] ?? "N/A")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="py-8 text-sm text-slate-500">
                    No sales recorded for this date.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
