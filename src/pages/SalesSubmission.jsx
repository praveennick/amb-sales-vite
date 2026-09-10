import DateField from "../components/common/DateField";
import SectionHeading from "../components/common/SectionHeading";
import {
  FaStore,
  FaCreditCard,
  FaMoneyBillWave,
  FaCashRegister,
  FaCheckCircle,
  FaWallet,
} from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, doc, setDoc } from "../services/firebaseDb";
import { useAuth } from "../context/auth";
import {
  calculateSale,
  denominations,
  emptySale,
  validateSale,
} from "../lib/sales";
import { currency, documentDate, localDate } from "../lib/format";
import ToastHandler from "../components/common/ToastHandler";
export default function DataSubmission({ shopName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(emptySale),
    [date, setDate] = useState(localDate);
  const [errors, setErrors] = useState({}),
    [saving, setSaving] = useState(false);
  const totals = calculateSale(data);
  const field = (key, label, notes = false) => (
    <div key={key}>
      <label className="field-label" htmlFor={key}>
        {label}
      </label>
      <input
        id={key}
        name={key}
        className="field"
        type="number"
        min="0"
        step={notes ? "1" : "0.01"}
        inputMode={notes ? "numeric" : "decimal"}
        placeholder="0"
        value={data[key]}
        required={!notes}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? key + "-error" : undefined}
        onChange={(event) => {
          setData((previous) => ({ ...previous, [key]: event.target.value }));
          setErrors((previous) => ({ ...previous, [key]: "" }));
        }}
      />
      {errors[key] && (
        <p id={key + "-error"} className="mt-1 text-xs text-red-700">
          {errors[key]}
        </p>
      )}
    </div>
  );
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const validation = validateSale(data);
    setErrors(validation);
    if (Object.keys(validation).length || !date) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopName, documentDate(date), "data"), {
        ...data,
        ...totals,
        shopName,
        submittedBy: user.email,
        submissionDate:
          documentDate(localDate()) +
          " " +
          new Date().toTimeString().slice(0, 8),
      });
      ToastHandler.success("Sales saved successfully.");
      navigate("/stores");
    } catch {
      ToastHandler.error(
        "Could not save sales. Your entries are still here; please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <fieldset disabled={saving} className="min-w-0 space-y-6">
        <section className="panel border-t-4 border-t-violet-500">
          <SectionHeading icon={FaStore}>{shopName}</SectionHeading>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Record sales and reconcile your counter for the day.
          </p>
          <label className="field-label" htmlFor="sale-date">
            Sales date
          </label>
          <DateField
            id="sale-date"
            className="min-w-0"
            value={date}
            max={localDate()}
            required
            onChange={(event) => setDate(event.target.value)}
          />
        </section>
        <section className="panel">
          <SectionHeading icon={FaCreditCard} tone="cyan">
            Digital payments
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("upi", "UPI amount")}
            {field("card", "Card amount")}
          </div>
        </section>
        <section className="panel">
          <SectionHeading icon={FaMoneyBillWave} tone="amber">
            Cash denominations
          </SectionHeading>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Enter the number of notes, not their total value.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {denominations.map((note) =>
              field("notes" + note, "₹" + note + " notes", true),
            )}
          </div>
        </section>
        <section className="panel">
          <SectionHeading icon={FaCashRegister} tone="pink">
            Counter reconciliation
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("expenses", "Expenses")}
            {field("counterCash", "Counter cash")}
            {field("posSale", "POS sales")}
            {field("cashGiven", "Cash given")}
          </div>
        </section>
      </fieldset>
      <aside className="panel space-y-5 xl:sticky xl:top-26">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-violet-600">
            <FaWallet aria-hidden="true" />
            Total sales
          </p>
          <p
            className="mt-2 text-3xl font-semibold tracking-tight text-violet-800"
            aria-live="polite"
          >
            {currency(totals.totalSale)}
          </p>
        </div>
        <dl className="space-y-3 border-y border-slate-100 py-5 text-sm">
          {[
            ["Cash sales", totals.cash],
            ["UPI", data.upi],
            ["Card", data.card],
            ["Difference from POS", totals.remaining],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold tabular-nums">{currency(value)}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs leading-relaxed text-slate-500">
          Cash = notes + expenses − counter cash. Saving replaces any existing
          sales record for this store and date.
        </p>
        <button disabled={saving} className="btn-primary w-full">
          <FaCheckCircle aria-hidden="true" />
          {saving ? "Saving sales…" : "Save daily sales"}
        </button>
      </aside>
    </form>
  );
}
