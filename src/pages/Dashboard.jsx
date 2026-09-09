import { useEffect, useMemo, useState } from "react";
import { shops } from "../lib/shops";
import { currency, dateRange, localDate, presetRange } from "../lib/format";
import { readSales } from "../services/reports";
import SalesChart from "../components/charts/SalesChart";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
import ToastHandler from "../components/common/ToastHandler";
const metrics = [
  ["totalSale", "Total sales"],
  ["posSale", "POS sales"],
  ["cash", "Cash sales"],
  ["upi", "UPI sales"],
  ["card", "Card sales"],
  ["cashGiven", "Cash given"],
  ["remaining", "Difference from POS"],
];
export default function Dashboard() {
  const [range, setRange] = useState(() => presetRange("week"));
  const [preset, setPreset] = useState("week"),
    [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0),
    [exporting, setExporting] = useState(false);
  const dates = useMemo(() => dateRange(range.start, range.end), [range]);
  const valid = dates.length > 0 && dates.length <= 366;
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      const yesterday = new Date(),
        before = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      before.setDate(before.getDate() - 2);
      try {
        const next = await readSales(
          [...dates, localDate(yesterday), localDate(before)],
          controller.signal,
        );
        if (!cancelled) setRecords(next);
      } catch {
        if (!cancelled)
          setError(
            "Could not load the report. Check your connection and try again.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [dates, valid, revision]);
  const data = useMemo(
    () =>
      records.filter(
        (record) =>
          record.isoDate >= range.start && record.isoDate <= range.end,
      ),
    [records, range],
  );
  const total = data.reduce(
    (sum, record) => sum + (Number(record.totalSale) || 0),
    0,
  );
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const before = new Date();
  before.setDate(before.getDate() - 2);
  const yesterdayData = records.filter(
    (record) => record.isoDate === localDate(yesterday),
  );
  const yesterdayTotal = yesterdayData.reduce(
    (sum, record) => sum + (Number(record.totalSale) || 0),
    0,
  );
  const previousTotal = records
    .filter((record) => record.isoDate === localDate(before))
    .reduce((sum, record) => sum + (Number(record.totalSale) || 0), 0);
  const chartSeries = useMemo(
    () =>
      Object.fromEntries(
        metrics.map(([key]) => {
          const values = new Map(
            data.map((record) => [
              record.isoDate + record.shopName,
              Number(record[key]) || 0,
            ]),
          );
          return [
            key,
            shops.map((shop) => ({
              name: shop.name,
              data: dates.map((date) => values.get(date + shop.name) || 0),
            })),
          ];
        }),
      ),
    [data, dates],
  );
  async function download() {
    if (exporting) return;
    setExporting(true);
    try {
      const { exportSales } = await import("../services/exportSales");
      await exportSales(data, range);
    } catch {
      ToastHandler.error("Could not export the report. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            BUSINESS AT A GLANCE
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Sales overview
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Track performance across all three shops.
          </p>
        </div>
        <button
          className="btn-secondary"
          disabled={
            loading || !valid || !data.length || Boolean(error) || exporting
          }
          onClick={download}
        >
          {exporting ? "Preparing…" : "Export Excel"}
        </button>
      </div>
      <section className="panel flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-44">
          <label htmlFor="report-period" className="field-label">
            Report period
          </label>
          <select
            id="report-period"
            className="field"
            value={preset}
            onChange={(event) => {
              setPreset(event.target.value);
              if (event.target.value !== "custom") {
                setLoading(true);
                setRange(presetRange(event.target.value));
              }
            }}
          >
            <option value="week">Last 7 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom dates</option>
          </select>
        </div>
        {["start", "end"].map((key) => (
          <div className="w-[calc(50%-0.5rem)] min-w-0 sm:w-44" key={key}>
            <label htmlFor={key} className="field-label">
              {key === "start" ? "From" : "To"}
            </label>
            <input
              id={key}
              className="field"
              type="date"
              value={range[key]}
              onChange={(event) => {
                setPreset("custom");
                setLoading(true);
                setRange((previous) => ({
                  ...previous,
                  [key]: event.target.value,
                }));
              }}
            />
          </div>
        ))}
        <button
          className="btn-secondary"
          disabled={loading || !valid}
          onClick={() => setRevision((value) => value + 1)}
        >
          Refresh
        </button>
      </section>
      {!valid ? (
        <p role="alert" className="panel text-amber-800">
          Choose a valid date range of up to 366 days.
        </p>
      ) : error ? (
        <div role="alert" className="panel space-y-3">
          <p className="text-red-700">{error}</p>
          <button
            className="btn-secondary"
            onClick={() => setRevision((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Selected period",
                currency(total),
                data.length + " sales records",
              ],
              [
                "Yesterday",
                currency(yesterdayTotal),
                previousTotal
                  ? (
                      ((yesterdayTotal - previousTotal) / previousTotal) *
                      100
                    ).toFixed(1) + "% vs previous day"
                  : "No previous-day baseline",
              ],
              [
                "Daily average",
                currency(total / dates.length),
                "Across " + dates.length + " calendar days",
              ],
              [
                "Shops reporting",
                new Set(data.map((record) => record.shopName)).size +
                  " / " +
                  shops.length,
                "In the selected period",
              ],
            ].map(([label, value, hint]) => (
              <section className="panel" key={label}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                  {value}
                </p>
                <p className="mt-2 text-xs text-slate-400">{hint}</p>
              </section>
            ))}
          </div>
          <section className="panel">
            <h3 className="mb-5 text-base font-semibold">Shop breakdown</h3>
            <div className="grid gap-5 md:grid-cols-3">
              {shops.map((shop) => (
                <div className="rounded-xl bg-slate-50 p-4" key={shop.name}>
                  <p className="text-sm text-slate-500">{shop.name}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {currency(
                      data
                        .filter((record) => record.shopName === shop.name)
                        .reduce(
                          (sum, record) =>
                            sum + (Number(record.totalSale) || 0),
                          0,
                        ),
                    )}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Yesterday:{" "}
                    {currency(
                      yesterdayData.find(
                        (record) => record.shopName === shop.name,
                      )?.totalSale,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
          {!data.length ? (
            <div className="panel py-12 text-center text-slate-500">
              No sales recorded for this period. Choose another date range.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {metrics.map(([key, title]) => (
                <section
                  className={`panel ${key === "totalSale" ? "xl:col-span-2" : ""}`}
                  key={key}
                >
                  <div className="mb-5 flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">{title}</h3>
                    <span className="font-semibold text-emerald-800">
                      {currency(
                        data.reduce(
                          (sum, item) => sum + (Number(item[key]) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <SalesChart
                    dates={dates}
                    series={chartSeries[key]}
                    label={title}
                  />
                  {key === "remaining" && (
                    <p className="mt-2 text-xs text-slate-500">
                      Negative differences appear below zero. Open the table for
                      exact values.
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
