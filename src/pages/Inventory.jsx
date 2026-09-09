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
import { shops } from "../lib/shops";
import { stockLeft, validateStock } from "../lib/inventory";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
const units = ["pcs", "kg", "g", "L", "ml", "box", "bag", "pack"];
const quantities = ["open", "buy", "waste", "sold"];
const blank = { name: "", unit: "pcs", open: "", buy: "", waste: "", sold: "" };
const labels = {
  open: "Opening stock",
  buy: "Purchased",
  waste: "Wasted",
  sold: "Sold",
};
export default function InventoryPage() {
  const [shop, setShop] = useState(shops[0].name),
    [items, setItems] = useState([]);
  const [draft, setDraft] = useState(blank),
    [editing, setEditing] = useState(null);
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [revision, setRevision] = useState(0),
    [deleting, setDeleting] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setItems([]);
    getDocs(collection(db, "inventory", shop, "items"))
      .then((snapshot) => {
        if (!cancelled)
          setItems(
            snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
          );
      })
      .catch(() => {
        if (!cancelled) setError("Could not load inventory. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shop, revision]);
  const filtered = useMemo(
    () =>
      items
        .filter((item) => {
          const left = stockLeft(item);
          return (
            (item.name || "")
              .toLowerCase()
              .includes(search.trim().toLowerCase()) &&
            (filter === "all" ||
              (filter === "low"
                ? left <= 5
                : filter === "mid"
                  ? left > 5 && left <= 20
                  : left > 20))
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, search, filter],
  );
  function quantityInputs(value, setValue) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {quantities.map((key) => (
          <label key={key} className="block">
            <span className="field-label">{labels[key]}</span>
            <input
              className="field"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="0"
              value={value[key] ?? ""}
              onChange={(event) =>
                setValue((previous) => ({
                  ...previous,
                  [key]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
    );
  }
  async function save(event, existing = false) {
    event.preventDefault();
    if (busy) return;
    const value = existing ? editing : draft;
    const message = validateStock(value);
    if (message) {
      setError(message);
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      name: value.name.trim(),
      unit: value.unit,
      ...Object.fromEntries(quantities.map((key) => [key, value[key] || "0"])),
    };
    try {
      if (existing) {
        await updateDoc(doc(db, "inventory", shop, "items", value.id), payload);
        setItems((previous) =>
          previous.map((item) =>
            item.id === value.id ? { ...item, ...payload } : item,
          ),
        );
        setEditing(null);
      } else {
        const reference = await addDoc(
          collection(db, "inventory", shop, "items"),
          payload,
        );
        setItems((previous) => [...previous, { ...payload, id: reference.id }]);
        setDraft(blank);
      }
    } catch {
      setError(
        "Could not save the item. Your entries are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteDoc(doc(db, "inventory", shop, "items", item.id));
      setItems((previous) => previous.filter((entry) => entry.id !== item.id));
      setDeleting(null);
    } catch {
      setError("Could not delete the item. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">STOCK, SORTED</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Shop inventory
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Track what comes in, what sells, and what’s left.
          </p>
        </div>
        <label className="w-full sm:w-72">
          <span className="field-label">Shop</span>
          <select
            className="field"
            value={shop}
            disabled={busy}
            onChange={(event) => {
              setShop(event.target.value);
              setEditing(null);
              setDeleting(null);
              setDraft(blank);
              setSearch("");
              setFilter("all");
            }}
          >
            {shops.map((entry) => (
              <option key={entry.name}>{entry.name}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <div role="alert" className="panel text-sm text-red-700">
          {error}
          <button
            className="btn-secondary ml-3"
            disabled={busy || loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            Reload inventory
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total items", items.length],
          ["Low stock", items.filter((item) => stockLeft(item) <= 5).length],
          ["Well stocked", items.filter((item) => stockLeft(item) > 20).length],
        ].map(([label, count]) => (
          <section className="panel" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {loading ? "—" : count}
            </p>
          </section>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <details className="panel">
          <summary className="font-semibold">Add new item</summary>
          <form className="mt-5" onSubmit={save}>
            <fieldset disabled={busy || loading} className="space-y-4">
              <label className="block">
                <span className="field-label">Item name</span>
                <input
                  className="field"
                  placeholder="e.g. Sugar"
                  required
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="field-label">Unit</span>
                <select
                  className="field"
                  value={draft.unit}
                  onChange={(event) =>
                    setDraft({ ...draft, unit: event.target.value })
                  }
                >
                  {units.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              {quantityInputs(draft, setDraft)}
              <p className="text-xs text-slate-500">
                Left = opening + purchased − wasted − sold
              </p>
              <button className="btn-primary w-full">
                {busy ? "Saving…" : "Add item"}
              </button>
            </fieldset>
          </form>
        </details>
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              className="field flex-1"
              aria-label="Search inventory"
              placeholder="Search items…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="btn-secondary"
              disabled={busy || loading}
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All items"],
              ["low", "Low · ≤ 5"],
              ["mid", "Medium · 6–20"],
              ["high", "Good · > 20"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`min-h-11 rounded-xl border px-4 text-sm font-medium ${filter === id ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : !filtered.length ? (
            <div className="panel py-12 text-center text-sm text-slate-500">
              {items.length
                ? "No items match your search or filter."
                : "No items yet. Add your first stock item to get started."}
            </div>
          ) : (
            <div className="grid items-start gap-4 2xl:grid-cols-2">
              {filtered.map((item) => (
                <article key={item.id} className="panel">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold capitalize">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Measured in {item.unit}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-500">Remaining</p>
                      <p
                        className={`mt-1 text-2xl font-semibold ${stockLeft(item) <= 5 ? "text-red-700" : "text-emerald-700"}`}
                      >
                        {stockLeft(item)}
                      </p>
                    </div>
                  </div>
                  {editing?.id === item.id ? (
                    <form
                      className="mt-5"
                      onSubmit={(event) => save(event, true)}
                    >
                      <fieldset disabled={busy} className="space-y-4">
                        {quantityInputs(editing, setEditing)}
                        <div className="flex gap-2">
                          <button className="btn-primary flex-1">Save</button>
                          <button
                            type="button"
                            className="btn-secondary flex-1"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  ) : (
                    <>
                      <dl className="my-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                        {quantities.map((key) => (
                          <div key={key}>
                            <dt className="text-xs text-slate-500">
                              {labels[key]}
                            </dt>
                            <dd className="mt-1 text-sm font-medium">
                              {item[key] || "0"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary flex-1"
                          disabled={busy}
                          onClick={() => {
                            setEditing({ ...item });
                            setDeleting(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-secondary text-red-700"
                          disabled={busy}
                          onClick={() => setDeleting(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                  {deleting === item.id && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
                    >
                      <p>Delete “{item.name}”? This cannot be undone.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="btn-primary bg-red-700 hover:bg-red-800"
                          disabled={busy}
                          onClick={() => remove(item)}
                        >
                          Delete item
                        </button>
                        <button
                          className="btn-secondary"
                          disabled={busy}
                          onClick={() => setDeleting(null)}
                        >
                          Keep item
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
