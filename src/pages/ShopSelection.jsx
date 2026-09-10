import { Link } from "react-router-dom";
import {
  FaBolt,
  FaGlassWhiskey,
  FaCoffee,
  FaCocktail,
  FaArrowRight,
} from "react-icons/fa";
import { useAuth } from "../context/auth";
import { shops } from "../lib/shops";
export default function ShopSelection() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <section className="page-hero sm:p-10">
        <div className="hero-orb" />
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-cyan-200">
          <FaBolt aria-hidden="true" />
          YOUR DAILY WORKSPACE
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {user.displayName || user.email?.split("@")[0]}
        </h2>
        <p className="mt-3 text-indigo-100/80">
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
        {shops.map((shop, index) => {
          const Icon = [FaCocktail, FaGlassWhiskey, FaCoffee][index];
          return (
            <Link
              key={shop.path}
              to={shop.path}
              className="panel group flex flex-col transition-colors hover:border-violet-400"
            >
              <span
                className={`flex size-14 items-center justify-center rounded-2xl text-lg font-bold ${shop.color}`}
              >
                <Icon aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-lg font-semibold">{shop.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Sales, cash and daily reconciliation
              </p>
              <span className="mt-8 flex items-center gap-2 text-sm font-semibold text-violet-700">
                Record sales <FaArrowRight aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
