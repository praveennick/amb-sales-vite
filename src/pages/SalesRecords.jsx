import DateField from "../components/common/DateField";
import { FaRegFileAlt, FaSyncAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { localDate, currency, displayTimestamp } from "../lib/format";
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
      <div className="page-hero">
        <div className="hero-orb" />
        <h2 className="flex items-center gap-3 text-2xl font-semibold">
          <FaRegFileAlt className="text-cyan-300" aria-hidden="true" />
          Sales records
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          Review the original daily entries for each store.
        </p>
      </div>
      <div className="panel flex flex-wrap items-end gap-4">
        <label className="w-full min-w-0 sm:w-48">
          <span className="field-label">Sales date</span>
          <DateField
            aria-label="Sales date"
            className="min-w-0"
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
          <FaSyncAlt aria-hidden="true" /> Refresh
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
                    <p className="mb-5 text-2xl font-semibold text-violet-800">
                      {currency(record.totalSale)}
                    </p>
                    <dl className="divide-y divide-slate-100">
                      {fields.map((key) => (
                        <div
                          key={key}
                          className="grid grid-cols-2 gap-3 py-3 text-xs"
                        >
                          <dt className="break-words text-slate-500">
                            {key === "shopName"
                              ? "Store"
                              : key === "remaining"
                                ? "Difference from POS"
                                : key.replace(/([A-Z])/g, " $1")}
                          </dt>
                          <dd className="break-words text-right font-medium">
                            {record[key] == null
                              ? "N/A"
                              : key === "submissionDate"
                                ? displayTimestamp(record[key])
                                : ["shopName", "submittedBy"].includes(key)
                                  ? String(record[key])
                                  : key.startsWith("notes")
                                    ? Number(record[key]).toLocaleString(
                                        "en-IN",
                                      )
                                    : currency(record[key])}
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
