import DateField from "../components/common/DateField";
import { FaHistory, FaRegFileAlt, FaSyncAlt, FaTrashAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  localDate,
  currency,
  displayTimestamp,
  displayDate,
  documentDate,
} from "../lib/format";
import { useAuth } from "../context/auth";
import {
  collection,
  db,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "../services/firebaseDb";
import { shops } from "../lib/shops";
import { readSales } from "../services/reports";
import LoadingSpinner from "../components/common/LoadingSpinner/LoadingSpinner";
import useConfirmDialog from "../components/common/useConfirmDialog";
import { recordActivity } from "../services/activity";
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
  const { isAdmin, user } = useAuth();
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  const [date, setDate] = useState(localDate),
    [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const [history, setHistory] = useState({});
  const [historyOpen, setHistoryOpen] = useState(null);
  const { confirm, confirmationDialog } = useConfirmDialog();
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
  async function removeRecord(record) {
    if (!isAdmin || deleting) return;
    const recordDate = record.isoDate;
    if (!(await confirm({
      title: "Delete sales record?",
      message: `Delete sales for ${record.shopName} on ${displayDate(recordDate)}? Version history will remain available.`,
      confirmLabel: "Delete record",
      danger: true,
    }))) return;
    setDeleting(record.shopName);
    setDeleteError("");
    setNotice("");
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "shops", record.shopName, documentDate(recordDate), "data"));
      await batch.commit();
      void recordActivity(user, "sales.deleted", { shopName: record.shopName, date: recordDate });
      setRecords((previous) =>
        previous.filter(
          (item) =>
            item.shopName !== record.shopName || item.isoDate !== recordDate,
        ),
      );
      setNotice(
        `Sales for ${record.shopName} on ${displayDate(recordDate)} were deleted.`,
      );
    } catch {
      setDeleteError(
        "Could not delete the sales record. Check your connection and admin permissions, then try again.",
      );
    } finally {
      setDeleting(null);
    }
  }
  async function loadHistory(shopName) {
    if (historyOpen === shopName) return setHistoryOpen(null);
    setHistoryOpen(shopName);
    try {
      const snapshot = await getDocs(collection(db, "shops", shopName, documentDate(date), "data", "history"));
      setHistory((previous) => ({
        ...previous,
        [shopName]: snapshot.docs
          .map((item) => ({ ...item.data(), id: item.id }))
          .sort((a, b) => (b.replacedAt?.seconds || 0) - (a.replacedAt?.seconds || 0)),
      }));
    } catch {
      setDeleteError("Could not load sales history. Please try again.");
    }
  }
  async function restoreVersion(record, version, fallbackShopName) {
    const shopName = record?.shopName || fallbackShopName || version.previous?.shopName;
    const recordDate = record?.isoDate || date;
    if (!(await confirm({
      title: "Restore this version?",
      message: `Restore the version replaced ${displayTimestamp(version.replacedAt)} for ${shopName}?${record ? " The current record will also be preserved." : ""}`,
      confirmLabel: "Restore version",
    }))) return;
    setDeleting(shopName);
    try {
      const revisionId = crypto.randomUUID();
      const pathDate = documentDate(recordDate);
      const batch = writeBatch(db);
      if (record) {
        const current = Object.fromEntries(
          Object.entries(record).filter(([key]) => !["date", "isoDate"].includes(key)),
        );
        batch.set(doc(db, "shops", shopName, pathDate, "data", "history", revisionId), {
          previous: current,
          replacedBy: user.email,
          replacedAt: serverTimestamp(),
        });
      }
      batch.set(doc(db, "shops", shopName, pathDate, "data"), {
        ...version.previous,
        submittedBy: user.email,
        submissionDate: serverTimestamp(),
        revisionId,
      });
      await batch.commit();
      void recordActivity(user, "sales.restored", { shopName, date: recordDate });
      setNotice("Previous sales version restored.");
      setRevision((value) => value + 1);
      setHistoryOpen(null);
    } catch {
      setDeleteError("Could not restore this sales version.");
    } finally {
      setDeleting(null);
    }
  }
  return (
    <div className="space-y-6">
      {confirmationDialog}
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
            disabled={Boolean(deleting)}
            onChange={(event) => {
              if (event.target.value) setDate(event.target.value);
            }}
          />
        </label>
        <button
          className="btn-secondary"
          disabled={loading || Boolean(deleting)}
          onClick={() => setRevision((value) => value + 1)}
        >
          <FaSyncAlt aria-hidden="true" /> Refresh
        </button>
      </div>
      {deleteError && (
        <p role="alert" className="panel text-red-700">
          {deleteError}
        </p>
      )}
      {notice && (
        <p role="status" className="panel text-emerald-700">
          {notice}
        </p>
      )}
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
                    <button
                      type="button"
                      className="btn-secondary mt-5 w-full justify-center"
                      disabled={Boolean(deleting)}
                      onClick={() => loadHistory(shop.name)}
                    >
                      <FaHistory aria-hidden="true" />
                      {historyOpen === shop.name ? "Hide history" : "View history"}
                    </button>
                    {historyOpen === shop.name && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-semibold">Version history</h4>
                        {!history[shop.name]?.length ? (
                          <p className="text-xs text-slate-500">No previous versions.</p>
                        ) : (
                          history[shop.name].map((version) => (
                            <div key={version.id} className="rounded-xl bg-slate-50 p-3 text-xs">
                              <p className="font-medium">Replaced {displayTimestamp(version.replacedAt)}</p>
                              <p className="mt-1 text-slate-500">By {version.replacedBy}</p>
                              <p className="mt-1 font-semibold text-violet-700">{currency(version.previous?.totalSale)}</p>
                              <button
                                className="btn-secondary mt-3 w-full justify-center"
                                disabled={Boolean(deleting)}
                                onClick={() => restoreVersion(record, version)}
                              >
                                Restore version
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-secondary mt-5 w-full text-red-700 hover:bg-red-50"
                        aria-label={`Delete sales for ${shop.name}`}
                        disabled={Boolean(deleting)}
                        onClick={() => removeRecord(record)}
                      >
                        <FaTrashAlt aria-hidden="true" />
                        {deleting === shop.name
                          ? "Deleting…"
                          : "Delete sales record"}
                      </button>
                    )}
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
