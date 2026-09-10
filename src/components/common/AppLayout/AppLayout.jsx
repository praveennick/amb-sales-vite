import { Suspense, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaChartBar,
  FaReceipt,
  FaBoxes,
  FaSignOutAlt,
  FaRegFileAlt,
} from "react-icons/fa";
import { useAuth } from "../../../context/auth";
import { shops } from "../../../lib/shops";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import ErrorBoundary from "../ErrorBoundary";
export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menu = useRef(null),
    trigger = useRef(null);
  const links = [
    { path: "/shopSelection", name: "Your shops", Icon: FaStore },
    ...(isAdmin
      ? [{ path: "/dashboard", name: "Overview", Icon: FaChartBar }]
      : []),
    ...shops.map((shop) => ({ ...shop, Icon: FaStore })),
    ...(isAdmin
      ? [
          { path: "/daily-spends", name: "Daily spends", Icon: FaReceipt },
          { path: "/inventory", name: "Inventory", Icon: FaBoxes },
          { path: "/testing", name: "Sales records", Icon: FaRegFileAlt },
        ]
      : []),
  ];
  const title =
    links.find((link) => link.path === location.pathname)?.name || "AMB Sales";
  useEffect(() => {
    document.title = title + " · AMB Sales";
  }, [title]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const triggerElement = trigger.current;
    document.body.style.overflow = "hidden";
    const focusable = () => [...menu.current.querySelectorAll("a, button")];
    focusable()[0]?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const elements = focusable(),
          first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", resize);
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      media.removeEventListener("change", resize);
      triggerElement?.focus();
    };
  }, [open]);
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      {open && (
        <button
          aria-label="Close navigation"
          tabIndex={-1}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={menu}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-linear-to-b from-[#10152e] via-[#171b39] to-[#24204b] p-5 text-white transition-transform motion-reduce:transition-none lg:translate-x-0 ${open ? "translate-x-0" : "invisible -translate-x-full lg:visible"}`}
      >
        <div className="mb-9 flex items-center gap-3 px-2 py-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-violet-500/30">
            A
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight">AMB Sales</p>
            <p className="text-xs text-indigo-200/65">Your everyday business</p>
          </div>
          <button
            className="ml-auto p-2 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-indigo-200/50">
          Workspace
        </p>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {links.map(({ path, name, Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? "bg-linear-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-950/30" : "text-indigo-100/75 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon className="shrink-0" aria-hidden="true" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="truncate px-3 text-sm font-medium">
            {user.displayName || user.email}
          </p>
          <p className="px-3 pt-1 text-xs text-indigo-200/65">
            {isAdmin ? "Administrator" : "Team member"}
          </p>
          <button
            onClick={logout}
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-indigo-100/75 hover:bg-white/10 hover:text-white"
          >
            <FaSignOutAlt />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-72" inert={open ? true : undefined}>
        <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-white/80 bg-white/70 px-4 backdrop-blur-xl sm:px-8">
          <button
            ref={trigger}
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 lg:hidden"
          >
            <FaBars />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">AMB / Workspace</p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          <div
            className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-100 to-fuchsia-100 text-sm font-bold text-violet-800 ring-4 ring-white"
            aria-label="Your profile"
          >
            {(user.displayName || user.email || "U").slice(0, 2).toUpperCase()}
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 xl:p-8"
        >
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingSpinner />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
