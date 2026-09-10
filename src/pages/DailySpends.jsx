import DateField from "../components/common/DateField";
import {
  FaReceipt,
  FaPlus,
  FaSyncAlt,
  FaWallet,
  FaChartBar,
  FaPen,
  FaTrash,
} from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "../services/firebaseDb";
import { useAuth } from "../context/auth";
import {
  currency,
  dateRange,
  documentDate,
  localDate,
  displayDate,
} from "../lib/format";
import { mapLimit } from "../lib/async";
import SalesChart from "../components/charts/SalesChart";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
export default function DailySpends() {
  const { user } = useAuth();
  const [date, setDate] = useState(localDate),
    [items, setItems] = useState([]);
  const [title, setTitle] = useState(""),
    [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [revision, setRevision] = useState(0);
  const month = date.slice(0, 7);
  const dates = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return dateRange(month + "-01", localDate(new Date(year, monthNumber, 0)));
  }, [month]);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setItems([]);
    setError("");
    mapLimit(
      dates,
      async (day) => {
        const snapshot = await getDocs(
          collection(db, "dailySpends", documentDate(day), "spends"),
        );
        return snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
          date: day,
        }));
      },
      8,
      controller.signal,
    )
      .then((rows) => {
        if (!cancelled) setItems(rows.flat());
      })
      .catch(() => {
        if (!cancelled) setError("Could not load expenses. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [dates, revision]);
  const dayItems = items.filter((item) => item.date === date);
  const totals = useMemo(() => {
    const result = new Map();
    items.forEach((item) =>
      result.set(
        item.date,
        (result.get(item.date) || 0) + (Number(item.price) || 0),
      ),
    );
    return result;
  }, [items]);
  const monthlyTotal = [...totals.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  async function mutate(action, item) {
    if (busy) return;
    const values =
      action === "add"
        ? { title: title.trim(), price: Number(price) }
        : action === "edit"
          ? { title: editing.title.trim(), price: Number(editing.price) }
          : null;
    if (
      values &&
      (!values.title || !Number.isFinite(values.price) || values.price <= 0)
    ) {
      setError("Enter a title and an amount greater than zero.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (action === "add") {
        const payload = {
          ...values,
          submittedBy: user.email,
          submissionDate:
            documentDate(localDate()) +
            " " +
            new Date().toTimeString().slice(0, 8),
        };
        const reference = await addDoc(
          collection(db, "dailySpends", documentDate(date), "spends"),
          payload,
        );
        setItems((previous) => [
          ...previous,
          { ...payload, id: reference.id, date },
        ]);
        setTitle("");
        setPrice("");
      } else {
        const reference = doc(
          db,
          "dailySpends",
          documentDate(item.date),
          "spends",
          item.id,
        );
        if (action === "edit") {
          await updateDoc(reference, values);
          setItems((previous) =>
            previous.map((row) =>
              row.id === item.id && row.date === item.date
                ? { ...row, ...values }
                : row,
            ),
          );
          setEditing(null);
        } else {
          await deleteDoc(reference);
          setItems((previous) =>
            previous.filter(
              (row) => row.id !== item.id || row.date !== item.date,
            ),
          );
          setDeleting(null);
        }
      }
    } catch {
      setError(
        "Could not save your change. Your entries are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="hero-orb" />
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-cyan-300">
          <FaReceipt aria-hidden="true" />
          KEEP SPENDING IN SIGHT
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Daily expenses
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          Record purchases and follow your monthly spend.
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="panel space-y-5">
          <div>
            <label className="field-label" htmlFor="expense-date">
              Expense date
            </label>
            <DateField
              id="expense-date"
              className="min-w-0"
              value={date}
              required
              disabled={busy}
              onChange={(event) => {
                if (event.target.value) {
                  setDate(event.target.value);
                  setEditing(null);
                  setDeleting(null);
                }
              }}
            />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void mutate("add");
            }}
          >
            <fieldset disabled={busy || loading} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="expense-title">
                  What did you buy?
                </label>
                <input
                  id="expense-title"
                  className="field"
                  placeholder="e.g. Milk, sugar, packaging"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="expense-amount">
                  Amount (₹)
                </label>
                <input
                  id="expense-amount"
                  className="field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0"
                  required
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>
              <button className="btn-primary w-full">
                <FaPlus aria-hidden="true" />
                {busy ? "Saving…" : "Add expense"}
              </button>
            </fieldset>
          </form>
          <button
            className="btn-secondary w-full"
            disabled={busy || loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            <FaSyncAlt aria-hidden="true" /> Refresh expenses
          </button>
        </section>
        <div className="min-w-0 space-y-6">
          {error && (
            <div role="alert" className="panel text-sm text-red-700">
              {error}
              <button
                className="btn-secondary mt-3 block"
                disabled={busy || loading}
                onClick={() => setRevision((value) => value + 1)}
              >
                Retry loading
              </button>
            </div>
          )}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="panel bg-linear-to-br from-fuchsia-50 to-violet-50">
                  <FaWallet
                    className="mb-4 text-2xl text-fuchsia-500"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-slate-500">
                    Total for{" "}
                    {new Date(month + "-01T12:00:00").toLocaleDateString(
                      "en-IN",
                      { month: "long", year: "numeric" },
                    )}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-violet-800">
                    {currency(monthlyTotal)}
                  </p>
                </section>
                <section className="panel bg-linear-to-br from-cyan-50 to-blue-50">
                  <FaReceipt
                    className="mb-4 text-2xl text-cyan-500"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-slate-500">
                    Selected day · {dayItems.length} expenses
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {currency(totals.get(date))}
                  </p>
                </section>
              </div>
              <section className="panel">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <FaChartBar className="text-violet-500" aria-hidden="true" />
                  Monthly spending
                </h3>
                <SalesChart
                  dates={dates}
                  series={[
                    {
                      name: "Expenses",
                      data: dates.map((day) => totals.get(day) || 0),
                    },
                  ]}
                  label="Monthly expenses"
                />
              </section>
              <section className="panel">
                <h3 className="mb-5 font-semibold">
                  Expenses for {displayDate(date)}
                </h3>
                {!dayItems.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No expenses recorded for this date.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {dayItems.map((item) => (
                      <li key={item.id} className="py-4">
                        {editing?.id === item.id ? (
                          <form
                            className="flex flex-wrap gap-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void mutate("edit", item);
                            }}
                          >
                            <input
                              aria-label="Expense title"
                              className="field flex-1"
                              required
                              disabled={busy}
                              value={editing.title}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  title: event.target.value,
                                })
                              }
                            />
                            <input
                              aria-label="Expense amount"
                              className="field sm:w-32"
                              type="number"
                              min="0.01"
                              step="0.01"
                              required
                              disabled={busy}
                              value={editing.price}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  price: event.target.value,
                                })
                              }
                            />
                            <button disabled={busy} className="btn-primary">
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={busy}
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="min-w-0 flex-1 break-words text-sm font-medium">
                              {item.title}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {currency(item.price)}
                            </span>
                            <button
                              className="btn-secondary"
                              disabled={busy}
                              onClick={() => {
                                setEditing(item);
                                setDeleting(null);
                              }}
                            >
                              <FaPen aria-hidden="true" /> Edit
                            </button>
                            <button
                              className="btn-secondary text-red-700"
                              disabled={busy}
                              onClick={() => setDeleting(item.id)}
                            >
                              <FaTrash aria-hidden="true" /> Delete
                            </button>
                          </div>
                        )}
                        {deleting === item.id && (
                          <div
                            role="alert"
                            className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"
                          >
                            <p>Delete “{item.title}”? This cannot be undone.</p>
                            <div className="mt-3 flex gap-2">
                              <button
                                className="btn-primary from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                                disabled={busy}
                                onClick={() => mutate("delete", item)}
                              >
                                Delete expense
                              </button>
                              <button
                                className="btn-secondary"
                                disabled={busy}
                                onClick={() => setDeleting(null)}
                              >
                                Keep expense
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
