import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { shops } from "../lib/shops";
export default function ShopSelection() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-emerald-950 p-6 text-white sm:p-10">
        <p className="text-sm text-emerald-200">YOUR DAILY WORKSPACE</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {user.displayName || user.email?.split("@")[0]}
        </h2>
        <p className="mt-3 text-emerald-100/80">
          Choose a shop to record today’s sales.
        </p>
      </section>
      <div>
        <h2 className="text-xl font-semibold">Your shops</h2>
        <p className="mt-1 text-sm text-slate-500">
          Keep every counter up to date.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <Link
            key={shop.path}
            to={shop.path}
            className="panel group flex flex-col transition-colors hover:border-emerald-400"
          >
            <span
              className={`flex size-14 items-center justify-center rounded-2xl text-lg font-bold ${shop.color}`}
            >
              {shop.initials}
            </span>
            <h3 className="mt-6 text-lg font-semibold">{shop.name}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Sales, cash and daily reconciliation
            </p>
            <span className="mt-8 text-sm font-semibold text-emerald-700">
              Record sales <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
